import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildPublicProposalUrl } from '@/lib/proposals/link-utils'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

type DraftProposalPayload = {
  proposalId?: string | null
  title?: string
  clientName?: string
  contactEmail?: string
  contactPhone?: string
  blocks?: unknown
  designSettings?: unknown
}

const normalizeText = (value?: string | null) => value?.trim() || null
const placeholderClientNames = new Set(['abc şirketi', 'abc company', 'müşteri adı', 'client name', 'müşteri', 'customer'])
const isPlaceholderClientName = (value: string | null) =>
  value ? placeholderClientNames.has(value.toLocaleLowerCase('tr-TR')) : false

const createProposalVersion = async ({
  supabase,
  proposalId,
  teamId,
  userId,
  title,
  blocks,
  designSettings,
}: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  proposalId: string
  teamId: string
  userId: string
  title: string
  blocks: unknown
  designSettings: ReturnType<typeof sanitizeProposalDesignSettings>
}) => {
  const { data: version, error } = await (supabase as any)
    .from('proposal_versions')
    .insert({
      proposal_id: proposalId,
      team_id: teamId,
      user_id: userId,
      title,
      blocks,
      design_settings: designSettings,
    })
    .select('id, created_at')
    .single()

  if (error || !version?.id) {
    throw new Error('Proposal version create failed')
  }

  return {
    versionId: version.id as string,
    savedAt: (version.created_at as string | null) ?? new Date().toISOString(),
  }
}

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

  let ensuredUser = await ensureUserProfileAndTeam(supabase, user)
  if (!ensuredUser?.teamId) {
    try {
      const admin = createSupabaseAdminClient()
      ensuredUser = await ensureUserProfileAndTeam(admin, user)
    } catch {
      // ignore admin fallback errors and use common response below
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

  const blocks = payload.blocks ?? []
  const designSettings = sanitizeProposalDesignSettings(payload.designSettings)

  if (payload.proposalId) {
    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .update({
        title: payload.title.trim(),
        contact_id: contactId,
        blocks,
        design_settings: designSettings,
        status: 'draft',
      })
      .eq('id', payload.proposalId)
      .eq('team_id', teamId)
      .select('id, public_url')
      .single()

    if (proposalError || !proposal) {
      return NextResponse.json({ error: t('api.proposals.draftUpdateFailed') }, { status: 400 })
    }

    let version: { versionId: string; savedAt: string }
    try {
      version = await createProposalVersion({
        supabase,
        proposalId: proposal.id,
        teamId,
        userId: user.id,
        title: payload.title.trim(),
        blocks,
        designSettings,
      })
    } catch {
      return NextResponse.json({ error: t('api.proposals.draftUpdateFailed') }, { status: 400 })
    }

    return NextResponse.json({
      proposalId: proposal.id,
      publicUrl: proposal.public_url,
      savedAt: version.savedAt,
      versionId: version.versionId,
    })
  }

  const origin = new URL(request.url).origin
  const publicUrl = buildPublicProposalUrl(origin)

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      title: payload.title.trim(),
      contact_id: contactId,
      user_id: user.id,
      team_id: teamId,
      blocks,
      design_settings: designSettings,
      status: 'draft',
      public_url: publicUrl,
      expires_at: null,
    })
    .select('id, public_url')
    .single()

  if (proposalError || !proposal) {
    return NextResponse.json({ error: t('api.proposals.draftCreateFailed') }, { status: 400 })
  }

  let version: { versionId: string; savedAt: string }
  try {
    version = await createProposalVersion({
      supabase,
      proposalId: proposal.id,
      teamId,
      userId: user.id,
      title: payload.title.trim(),
      blocks,
      designSettings,
    })
  } catch {
    return NextResponse.json({ error: t('api.proposals.draftCreateFailed') }, { status: 400 })
  }

  return NextResponse.json({
    proposalId: proposal.id,
    publicUrl: proposal.public_url,
    savedAt: version.savedAt,
    versionId: version.versionId,
  })
})
