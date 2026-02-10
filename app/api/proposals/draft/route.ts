import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildPublicProposalUrl, resolvePublicProposalOrigin } from '@/lib/proposals/link-utils'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import { normalizeStage } from '@/components/deals/stage-utils'
import { resolveRequestOrigin } from '@/lib/url/request-origin'

type DraftProposalPayload = {
  proposalId?: string | null
  dealId?: string | null
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

const createProposalVersion = async ({
  supabase,
  proposalId,
  teamId,
  userId,
  title,
  blocks,
  designSettings,
}: {
  supabase: SupabaseClient<Database>
  proposalId: string
  teamId: string
  userId: string
  title: string
  blocks: Json
  designSettings: Json
}) => {
  const { data: version, error } = await supabase
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
  const explicitDealId = normalizeText(payload?.dealId)
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

  const blocks = (payload.blocks ?? []) as Json
  const designSettings = sanitizeProposalDesignSettings(payload.designSettings) as Json

  if (payload.proposalId) {
    const { data: existingProposal, error: existingProposalError } = await supabase
      .from('proposals')
      .select('id, public_url, deal_id, contact_id')
      .eq('id', payload.proposalId)
      .eq('team_id', teamId)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingProposalError || !existingProposal?.id) {
      return NextResponse.json({ error: t('api.proposals.draftUpdateFailed') }, { status: 400 })
    }

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .update({
        title: payload.title.trim(),
        deal_id: resolvedDealId ?? existingProposal.deal_id ?? null,
        contact_id: contactId ?? existingProposal.contact_id ?? null,
        blocks,
        design_settings: designSettings,
        status: 'draft',
      })
      .eq('id', payload.proposalId)
      .eq('team_id', teamId)
      .is('deleted_at', null)
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

  const requestOrigin = resolveRequestOrigin(request)
  const publicProposalOrigin = resolvePublicProposalOrigin(requestOrigin)
  const publicUrl = buildPublicProposalUrl(publicProposalOrigin)

  const { data: proposal, error: proposalError } = await supabase
    .from('proposals')
    .insert({
      title: payload.title.trim(),
      deal_id: resolvedDealId,
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
