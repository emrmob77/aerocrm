import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { buildProposalDeliveryEmail, getProposalDefaults } from '@/lib/notifications/email-templates'
import { sendTwilioMessage, getCredentialsFromEnv } from '@/lib/integrations/twilio'
import type { Database, TwilioCredentials } from '@/types/database'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildPublicProposalUrl, resolvePublicProposalOrigin } from '@/lib/proposals/link-utils'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { notifyInApp } from '@/lib/notifications/server'
import { getDbStage, normalizeStage } from '@/components/deals/stage-utils'
import { resolveRequestOrigin } from '@/lib/url/request-origin'
import {
  buildProposalSmartVariableMap,
  getProposalPricingSummary,
  resolveSmartVariablesInJson,
  resolveSmartVariablesInText,
} from '@/lib/proposals/smart-variables'

type SendProposalPayload = {
  proposalId?: string | null
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

const resolveLinkedDealId = async ({
  supabase,
  teamId,
  explicitDealId,
  contactId,
}: {
  supabase: SupabaseClient<Database>
  teamId: string
  explicitDealId: string | null
  contactId: string | null
}) => {
  if (explicitDealId) {
    const { data: deal } = await supabase
      .from('deals')
      .select('id')
      .eq('id', explicitDealId)
      .eq('team_id', teamId)
      .maybeSingle()
    if (deal?.id) {
      return deal.id
    }
  }

  if (!contactId) {
    return null
  }

  const { data: deals } = await supabase
    .from('deals')
    .select('id, stage, updated_at')
    .eq('team_id', teamId)
    .eq('contact_id', contactId)
    .order('updated_at', { ascending: false })
    .limit(20)

  const candidates = deals ?? []
  if (candidates.length === 0) {
    return null
  }

  const openDeal = candidates.find((deal) => {
    const stage = normalizeStage(deal.stage)
    return stage !== 'won' && stage !== 'lost'
  })

  return openDeal?.id ?? candidates[0]?.id ?? null
}

const syncDealStageAfterProposalSent = async ({
  supabase,
  dealId,
  teamId,
  updatedAt,
}: {
  supabase: SupabaseClient<Database>
  dealId: string | null
  teamId: string
  updatedAt: string
}) => {
  if (!dealId) {
    return
  }

  try {
    const { data: deal } = await supabase
      .from('deals')
      .select('id, stage')
      .eq('id', dealId)
      .eq('team_id', teamId)
      .maybeSingle()

    if (!deal?.id) {
      return
    }

    const currentStage = normalizeStage(deal.stage)
    if (currentStage === 'proposal' || currentStage === 'won' || currentStage === 'lost') {
      return
    }

    await supabase
      .from('deals')
      .update({
        stage: getDbStage('proposal'),
        updated_at: updatedAt,
      })
      .eq('id', deal.id)
      .eq('team_id', teamId)
  } catch (error) {
    console.error('Failed to sync deal stage after proposal send:', error)
  }
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
  const requestedProposalId = normalizeText(payload.proposalId)
  const explicitDealId = normalizeText(payload.dealId)
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

  const resolvedDealId = await resolveLinkedDealId({
    supabase: supabase as unknown as SupabaseClient<Database>,
    teamId,
    explicitDealId,
    contactId,
  })

  const localeCode = locale === 'en' ? 'en-US' : 'tr-TR'
  const pricingSummary = getProposalPricingSummary(payload.blocks ?? [], locale === 'en' ? 'USD' : 'TRY')
  const formattedDate = new Intl.DateTimeFormat(localeCode, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date())
  const formatTotal = (currency: string, total: number) =>
    new Intl.NumberFormat(localeCode, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(total)
  const resolveProposalContent = (proposalNumber: string) => {
    const variableMap = buildProposalSmartVariableMap({
      clientName,
      proposalNumber,
      formattedDate,
      totalFormatted: formatTotal(pricingSummary.currency, pricingSummary.total),
    })

    return {
      title: resolveSmartVariablesInText(payload.title?.trim() || t('api.proposals.fallbackTitle'), variableMap),
      blocks: resolveSmartVariablesInJson(payload.blocks ?? [], variableMap),
    }
  }

  const requestOrigin = resolveRequestOrigin(request)
  const publicProposalOrigin = resolvePublicProposalOrigin(requestOrigin)
  const defaultPublicUrl = buildPublicProposalUrl(publicProposalOrigin)
  const expiresAt = buildExpiryDate(payload.expiryEnabled, payload.expiryDuration)
  const designSettings = sanitizeProposalDesignSettings(payload.designSettings)
  let proposal:
    | {
        id: string
        public_url: string | null
        expires_at: string | null
        status: string
        title: string | null
        deal_id: string | null
      }
    | null = null

  if (requestedProposalId) {
    const { data: existingProposal } = await supabase
      .from('proposals')
      .select('id, public_url, contact_id, deal_id')
      .eq('id', requestedProposalId)
      .eq('team_id', teamId)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingProposal?.id) {
      const resolvedContent = resolveProposalContent(existingProposal.id)
      const { data: updatedProposal, error: updateError } = await supabase
        .from('proposals')
        .update({
          title: resolvedContent.title,
          deal_id: resolvedDealId ?? existingProposal.deal_id ?? null,
          contact_id: contactId ?? existingProposal.contact_id ?? null,
          user_id: user.id,
          blocks: resolvedContent.blocks,
          design_settings: designSettings,
          status: 'pending',
          public_url: existingProposal.public_url || defaultPublicUrl,
          expires_at: expiresAt,
        })
        .eq('id', existingProposal.id)
        .eq('team_id', teamId)
        .select('id, public_url, expires_at, status, title, deal_id')
        .single()

      if (updateError || !updatedProposal) {
        return NextResponse.json({ error: t('api.proposals.saveFailed') }, { status: 400 })
      }

      proposal = updatedProposal
    }
  }

  if (!proposal) {
    const newProposalId = crypto.randomUUID()
    const resolvedContent = resolveProposalContent(newProposalId)
    const { data: createdProposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        id: newProposalId,
        title: resolvedContent.title,
        deal_id: resolvedDealId,
        contact_id: contactId,
        user_id: user.id,
        team_id: teamId,
        blocks: resolvedContent.blocks,
        design_settings: designSettings,
        status: 'pending',
        public_url: defaultPublicUrl,
        expires_at: expiresAt,
      })
      .select('id, public_url, expires_at, status, title, deal_id')
      .single()

    if (proposalError || !createdProposal) {
      return NextResponse.json({ error: t('api.proposals.saveFailed') }, { status: 400 })
    }

    proposal = createdProposal
  }

  const method = payload.method ?? 'email'
  const proposalDefaults = getProposalDefaults({ locale, client: clientName })
  const anchorText = proposalDefaults.anchor || t('api.proposals.anchorText')
  const proposalPublicUrl = proposal.public_url || defaultPublicUrl

  const messageBody = buildMessageWithLink(
    payload.message?.trim() || proposalDefaults.message,
    proposalPublicUrl,
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
        link: payload.includeLink === false ? undefined : proposalPublicUrl,
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

    // Link paylaşımı da gönderim aksiyonu olarak kabul edilir.
    let finalStatus = proposal.status
    await supabase.from('proposals').update({ status: 'sent' }).eq('id', proposal.id)
    finalStatus = 'sent'

    if (finalStatus === 'sent') {
      await syncDealStageAfterProposalSent({
        supabase: supabase as unknown as SupabaseClient<Database>,
        dealId: proposal.deal_id ?? resolvedDealId,
        teamId,
        updatedAt: new Date().toISOString(),
      })
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

    await dispatchWebhookEvent({
      supabase,
      teamId,
      event: 'proposal.sent',
      data: {
        proposal_id: proposal.id,
        title: proposal.title,
        status: finalStatus,
        public_url: proposalPublicUrl,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : t('api.proposals.sendFailed')
    await supabase.from('proposals').update({ status: 'failed' }).eq('id', proposal.id)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({
    proposalId: proposal.id,
    publicUrl: proposalPublicUrl,
    expiresAt: proposal.expires_at,
  })
})
