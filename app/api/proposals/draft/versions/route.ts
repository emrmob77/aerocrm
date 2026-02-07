import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'
import { ensureUserProfileAndTeam } from '@/lib/team/ensure-user-team'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type TeamContext = {
  supabase: SupabaseClient<Database>
  user: { id: string } | null
  teamId: string | null
  error: NextResponse | null
}

const getTeamContext = async (): Promise<TeamContext> => {
  const t = getServerT()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase, user: null, teamId: null, error: NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 }) }
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
    return { supabase, user: null, teamId: null, error: NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 }) }
  }

  return { supabase, user, teamId: ensuredUser.teamId, error: null as NextResponse | null }
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const url = new URL(request.url)
  const proposalId = url.searchParams.get('proposalId')?.trim()

  if (!proposalId) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 400 })
  }

  const context = await getTeamContext()
  if (context.error) {
    return context.error
  }
  const teamId = context.teamId
  if (!teamId) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const { data: versions, error } = await context.supabase
    .from('proposal_versions')
    .select('id, title, created_at')
    .eq('proposal_id', proposalId)
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 400 })
  }

  return NextResponse.json({
    versions: (versions ?? []).map((item: { id: string; title: string; created_at: string | null }) => ({
      id: item.id,
      title: item.title,
      savedAt: item.created_at ?? new Date().toISOString(),
    })),
  })
})

type RestorePayload = {
  versionId?: string
}

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as RestorePayload | null
  const versionId = payload?.versionId?.trim()

  if (!versionId) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 400 })
  }

  const context = await getTeamContext()
  if (context.error) {
    return context.error
  }
  const teamId = context.teamId
  if (!teamId) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const { data: version, error: versionError } = await context.supabase
    .from('proposal_versions')
    .select('id, proposal_id, title, blocks, design_settings, created_at')
    .eq('id', versionId)
    .eq('team_id', teamId)
    .maybeSingle()

  if (versionError || !version?.proposal_id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  const { data: proposal, error: restoreError } = await context.supabase
    .from('proposals')
    .update({
      title: version.title,
      blocks: version.blocks ?? [],
      design_settings: sanitizeProposalDesignSettings(version.design_settings),
      status: 'draft',
    })
    .eq('id', version.proposal_id)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .select('id, title, blocks, design_settings')
    .single()

  if (restoreError || !proposal) {
    return NextResponse.json({ error: t('api.proposals.draftUpdateFailed') }, { status: 400 })
  }

  return NextResponse.json({
    proposalId: proposal.id,
    title: proposal.title,
    blocks: proposal.blocks ?? [],
    designSettings: sanitizeProposalDesignSettings((proposal as { design_settings?: unknown }).design_settings),
    savedAt: version.created_at ?? new Date().toISOString(),
    versionId: version.id,
  })
})
