import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { buildProposalDeliveryEmail, getProposalDefaults } from '@/lib/notifications/email-templates'
import { sendTwilioMessage, getCredentialsFromEnv } from '@/lib/integrations/twilio'
import type { Database, TwilioCredentials } from '@/types/database'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildPublicProposalUrl } from '@/lib/proposals/link-utils'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { notifyInApp } from '@/lib/notifications/server'

type SendProposalPayload = {
  title?: string
  clientName?: string
  contactEmail?: string
  contactPhone?: string
  blocks?: unknown
  dealId?: string | null
  expiryEnabled?: boolean
  expiryDuration?: string
  method?: 'email' | 'whatsapp' | 'sms' | 'link'
  subject?: string
  message?: string
  includeLink?: boolean
  includePdf?: boolean
  designSettings?: unknown
}

const expiryDurations: Record<string, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '48h': 48 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '14d': 14 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
}

const buildExpiryDate = (enabled?: boolean, duration?: string) => {
  if (!enabled || !duration || duration === 'unlimited') {
    return null
  }
  const ms = expiryDurations[duration]
  if (!ms) {
    return null
  }
  return new Date(Date.now() + ms).toISOString()
}

const normalizeText = (value?: string | null) => value?.trim() || null
const placeholderClientNames = new Set(['abc şirketi', 'abc company', 'müşteri adı', 'client name', 'müşteri', 'customer'])
const isPlaceholderClientName = (value: string | null) =>
  value ? placeholderClientNames.has(value.toLocaleLowerCase('tr-TR')) : false

const buildMessageWithLink = (
  message: string,
  link: string,
  includeLink?: boolean,
  anchor?: string
) => {
  if (includeLink === false) {
    return message
  }
  const anchorText = anchor || 'Teklifi görüntülemek için:'
  if (message.includes(anchorText)) {
    return message.replace(anchorText, `${anchorText}\n${link}`)
  }
  return `${message}\n\n${link}`
}

const sendEmail = async (params: {
  to: string
  subject: string
  text: string
  html: string
  t: (key: string, vars?: Record<string, string | number>) => string
}) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    throw new Error(params.t('api.proposals.emailConfigMissing'))
  }
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || params.t('api.proposals.emailSendFailed'))
  }
}

// Helper to get Twilio credentials from DB or env
const getTwilioCredentials = async (
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  teamId: string
): Promise<TwilioCredentials | null> => {
  // Try to get from DB first
  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('team_id', teamId)
    .eq('provider', 'twilio')
    .eq('status', 'connected')
    .maybeSingle()

  if (integration?.credentials) {
    return integration.credentials as TwilioCredentials
  }

  // Fallback to env variables
  return getCredentialsFromEnv()
}

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const locale = getServerLocale()
  const payload = (await request.json().catch(() => null)) as SendProposalPayload | null

  if (!payload?.title || !payload.title.trim()) {
    return NextResponse.json({ error: t('api.proposals.titleRequired') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  let ensuredUser = await ensureUserProfileAndTeam(supabase, user)
  if (!ensuredUser?.teamId) {
    try {
      const admin = createSupabaseAdminClient()
      ensuredUser = await ensureUserProfileAndTeam(admin, user)
    } catch {
      // ignore admin fallback errors and return standard response below
    }
  }
  if (!ensuredUser?.teamId) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const teamId = ensuredUser.teamId
  const contactEmail = normalizeText(payload.contactEmail)
  const contactPhone = normalizeText(payload.contactPhone)
  const rawClientName = normalizeText(payload.clientName)
  const hasMeaningfulClientName = Boolean(rawClientName && !isPlaceholderClientName(rawClientName))
  const clientName =
    (hasMeaningfulClientName ? rawClientName : null) ||
    (contactEmail ? contactEmail.split('@')[0] : null) ||
    t('header.customerFallback')

  let contactId: string | null = null

  if (contactEmail || contactPhone) {
    let query = supabase
      .from('contacts')
      .select('id, email, phone')
      .eq('team_id', teamId)

    if (contactEmail) {
      query = query.eq('email', contactEmail)
    } else if (contactPhone) {
      query = query.eq('phone', contactPhone)
    }

    const { data: existingContact } = await query.maybeSingle()
    if (existingContact?.id) {
      contactId = existingContact.id

      const updates: { email?: string | null; phone?: string | null } = {}
      if (contactEmail && !existingContact.email) {
        updates.email = contactEmail
      }
      if (contactPhone && !existingContact.phone) {
        updates.phone = contactPhone
      }
      if (Object.keys(updates).length > 0) {
        await supabase.from('contacts').update(updates).eq('id', contactId)
      }
    }
  }

  if (!contactId && (contactEmail || contactPhone || hasMeaningfulClientName)) {
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        full_name: clientName,
        email: contactEmail,
        phone: contactPhone,
        user_id: user.id,
        team_id: teamId,
      })
      .select('id')
      .single()

    if (contactError || !newContact) {
      return NextResponse.json({ error: t('api.proposals.contactCreateFailed') }, { status: 400 })
    }

    contactId = newContact.id
  }

  const origin = new URL(request.url).origin
  const publicUrl = buildPublicProposalUrl(origin)
  const expiresAt = buildExpiryDate(payload.expiryEnabled, payload.expiryDuration)
  const designSettings = sanitizeProposalDesignSettings(payload.designSettings)

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      title: payload.title.trim(),
      deal_id: payload.dealId ?? null,
      contact_id: contactId,
      user_id: user.id,
      team_id: teamId,
      blocks: payload.blocks ?? [],
      design_settings: designSettings,
      status: 'pending',
      public_url: publicUrl,
      expires_at: expiresAt,
    })
    .select('id, public_url, expires_at, status, title')
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: t('api.proposals.saveFailed') }, { status: 400 })
  }

  const method = payload.method ?? 'email'
  const proposalDefaults = getProposalDefaults({ locale, client: clientName })
  const anchorText = proposalDefaults.anchor || t('api.proposals.anchorText')

  const messageBody = buildMessageWithLink(
    payload.message?.trim() || proposalDefaults.message,
    publicUrl,
    payload.includeLink,
    anchorText
  )

  try {
    if (method === 'email') {
      const recipient = contactEmail
      if (!recipient) {
        throw new Error(t('api.proposals.recipientEmailRequired'))
      }
      const subject = payload.subject?.trim() || proposalDefaults.subject
      const template = buildProposalDeliveryEmail({
        subject,
        message: messageBody,
        link: payload.includeLink === false ? undefined : publicUrl,
        locale,
      })
      await sendEmail({
        to: recipient,
        subject: template.subject,
        text: template.text,
        html: template.html,
        t,
      })
    } else if (method === 'sms' || method === 'whatsapp') {
      const recipient = contactPhone
      if (!recipient) {
        const methodLabel =
          method === 'sms' ? t('api.integrations.methods.sms') : t('api.integrations.methods.whatsapp')
        throw new Error(t('api.proposals.recipientPhoneRequired', { method: methodLabel }))
      }

      // Get Twilio credentials from DB or env
      const twilioCredentials = await getTwilioCredentials(supabase, teamId)
      if (!twilioCredentials) {
        throw new Error(t('api.proposals.twilioConfigMissing'))
      }

      const result = await sendTwilioMessage(method, recipient, messageBody, twilioCredentials)
      if (!result.success) {
        throw new Error(result.error || t('api.proposals.messageSendFailed'))
      }

      // Update last_used_at for integration
      await supabase
        .from('integrations')
        .update({ last_used_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .eq('provider', 'twilio')
    }

    let finalStatus = proposal.status
    if (method !== 'link') {
      await supabase.from('proposals').update({ status: 'sent' }).eq('id', proposal.id)
      finalStatus = 'sent'
    }

    const proposalTitle = proposal.title ?? t('api.proposals.fallbackTitle')
    await notifyInApp(supabase as unknown as SupabaseClient<Database>, {
      userId: user.id,
      category: 'proposals',
      type: method === 'link' ? 'proposal_link' : 'proposal_sent',
      title:
        method === 'link'
          ? t('api.proposals.notifications.linkReadyTitle')
          : t('api.proposals.notifications.sentTitle'),
      message:
        method === 'link'
          ? t('api.proposals.notifications.linkCreatedMessage', { title: proposalTitle })
          : t('api.proposals.notifications.sentMessage', { title: proposalTitle }),
      actionUrl: `/proposals/${proposal.id}`,
      metadata: {
        proposal_id: proposal.id,
        status: finalStatus,
      },
    })

    if (method !== 'link') {
      await dispatchWebhookEvent({
        supabase,
        teamId,
        event: 'proposal.sent',
        data: {
          proposal_id: proposal.id,
          title: proposal.title,
          status: finalStatus,
          public_url: proposal.public_url,
        },
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : t('api.proposals.sendFailed')
    await supabase.from('proposals').update({ status: 'failed' }).eq('id', proposal.id)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({
    proposalId: proposal.id,
    publicUrl: proposal.public_url,
    expiresAt: proposal.expires_at,
  })
})
