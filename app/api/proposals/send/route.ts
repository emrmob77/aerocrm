import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { dispatchWebhookEvent } from '@/lib/webhooks/dispatch'
import { buildProposalDeliveryEmail } from '@/lib/notifications/email-templates'

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

const buildMessageWithLink = (message: string, link: string, includeLink?: boolean) => {
  if (includeLink === false) {
    return message
  }
  const anchor = 'Teklifi görüntülemek için:'
  if (message.includes(anchor)) {
    return message.replace(anchor, `${anchor}\n${link}`)
  }
  return `${message}\n\n${link}`
}

const sendEmail = async (params: { to: string; subject: string; text: string; html: string }) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    throw new Error('E-posta gönderimi için RESEND_API_KEY ve RESEND_FROM_EMAIL gerekir.')
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
    throw new Error(payload?.message || 'E-posta gönderimi başarısız oldu.')
  }
}

const sendTwilioMessage = async (params: { to: string; from: string; body: string }) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  if (!accountSid || !authToken) {
    throw new Error('SMS/WhatsApp için TWILIO_ACCOUNT_SID ve TWILIO_AUTH_TOKEN gerekir.')
  }
  const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
  const bodyParams = new URLSearchParams({
    To: params.to,
    From: params.from,
    Body: params.body,
  })
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.message || 'Mesaj gönderimi başarısız oldu.')
  }
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as SendProposalPayload | null

  if (!payload?.title || !payload.title.trim()) {
    return NextResponse.json({ error: 'Teklif başlığı zorunludur.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: 'Takım bilgisi bulunamadı.' }, { status: 400 })
  }

  const teamId = profile.team_id
  const contactEmail = normalizeText(payload.contactEmail)
  const contactPhone = normalizeText(payload.contactPhone)
  const clientName =
    normalizeText(payload.clientName) ||
    (contactEmail ? contactEmail.split('@')[0] : null) ||
    'Müşteri'

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

  if (!contactId) {
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
      return NextResponse.json({ error: 'Kişi oluşturulamadı.' }, { status: 400 })
    }

    contactId = newContact.id
  }

  const slug = crypto.randomUUID().split('-')[0]
  const origin = new URL(request.url).origin
  const publicUrl = `${origin}/p/${slug}`
  const expiresAt = buildExpiryDate(payload.expiryEnabled, payload.expiryDuration)

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      title: payload.title.trim(),
      deal_id: payload.dealId ?? null,
      contact_id: contactId,
      user_id: user.id,
      team_id: teamId,
      blocks: payload.blocks ?? [],
      status: 'pending',
      public_url: publicUrl,
      expires_at: expiresAt,
    })
    .select('id, public_url, expires_at')
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: 'Teklif kaydedilemedi.' }, { status: 400 })
  }

  const method = payload.method ?? 'email'
  const messageBody = buildMessageWithLink(
    payload.message?.trim() ||
      `Merhaba ${clientName},\n\nTeklifinizi paylaşmak istedim.\n\nTeklifi görüntülemek için:\n\nİyi çalışmalar,\nAERO CRM`,
    publicUrl,
    payload.includeLink
  )

  try {
    if (method === 'email') {
      const recipient = contactEmail
      if (!recipient) {
        throw new Error('E-posta gönderimi için alıcı e-posta gerekli.')
      }
      const subject = payload.subject?.trim() || `${clientName} için Teklif`
      const template = buildProposalDeliveryEmail({
        subject,
        message: messageBody,
        link: payload.includeLink === false ? undefined : publicUrl,
      })
      await sendEmail({
        to: recipient,
        subject: template.subject,
        text: template.text,
        html: template.html,
      })
    } else if (method === 'sms') {
      const recipient = contactPhone
      const from = process.env.TWILIO_FROM_SMS
      if (!recipient || !from) {
        throw new Error('SMS gönderimi için alıcı ve TWILIO_FROM_SMS gerekir.')
      }
      await sendTwilioMessage({ to: recipient, from, body: messageBody })
    } else if (method === 'whatsapp') {
      const recipient = contactPhone
      const from = process.env.TWILIO_FROM_WHATSAPP
      if (!recipient || !from) {
        throw new Error('WhatsApp gönderimi için alıcı ve TWILIO_FROM_WHATSAPP gerekir.')
      }
      await sendTwilioMessage({
        to: recipient.startsWith('whatsapp:') ? recipient : `whatsapp:${recipient}`,
        from: from.startsWith('whatsapp:') ? from : `whatsapp:${from}`,
        body: messageBody,
      })
    }

    let finalStatus = proposal.status
    if (method !== 'link') {
      await supabase.from('proposals').update({ status: 'sent' }).eq('id', proposal.id)
      finalStatus = 'sent'
    }

    await supabase.from('notifications').insert({
      user_id: user.id,
      type: method === 'link' ? 'proposal_link' : 'proposal_sent',
      title: method === 'link' ? 'Teklif linki hazır' : 'Teklif gönderildi',
      message:
        method === 'link'
          ? `${proposal.title} için link oluşturuldu.`
          : `${proposal.title} müşteriye gönderildi.`,
      read: false,
      action_url: `/proposals/${proposal.id}`,
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
    const message = error instanceof Error ? error.message : 'Gönderim başarısız oldu.'
    await supabase.from('proposals').update({ status: 'failed' }).eq('id', proposal.id)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  return NextResponse.json({
    proposalId: proposal.id,
    publicUrl: proposal.public_url,
    expiresAt: proposal.expires_at,
  })
}
