import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type DraftProposalPayload = {
  proposalId?: string | null
  title?: string
  clientName?: string
  contactEmail?: string
  contactPhone?: string
  blocks?: unknown
}

const normalizeText = (value?: string | null) => value?.trim() || null

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as DraftProposalPayload | null

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

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const teamId = profile.team_id
  const contactEmail = normalizeText(payload.contactEmail)
  const contactPhone = normalizeText(payload.contactPhone)
  const clientName =
    normalizeText(payload.clientName) ||
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
      return NextResponse.json({ error: t('api.proposals.contactCreateFailed') }, { status: 400 })
    }

    contactId = newContact.id
  }

  const savedAt = new Date().toISOString()
  const blocks = payload.blocks ?? []

  if (payload.proposalId) {
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .update({
        title: payload.title.trim(),
        contact_id: contactId,
        blocks,
        status: 'draft',
      })
      .eq('id', payload.proposalId)
      .eq('team_id', teamId)
      .select('id, public_url')
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: t('api.proposals.draftUpdateFailed') }, { status: 400 })
    }

    return NextResponse.json({
      proposalId: proposal.id,
      publicUrl: proposal.public_url,
      savedAt,
      versionId: crypto.randomUUID(),
    })
  }

  const slug = crypto.randomUUID().split('-')[0]
  const origin = new URL(request.url).origin
  const publicUrl = `${origin}/p/${slug}`

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      title: payload.title.trim(),
      contact_id: contactId,
      user_id: user.id,
      team_id: teamId,
      blocks,
      status: 'draft',
      public_url: publicUrl,
      expires_at: null,
    })
    .select('id, public_url')
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: t('api.proposals.draftCreateFailed') }, { status: 400 })
  }

  return NextResponse.json({
    proposalId: proposal.id,
    publicUrl: proposal.public_url,
    savedAt,
    versionId: crypto.randomUUID(),
  })
})
