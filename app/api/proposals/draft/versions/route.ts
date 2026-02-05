import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { sanitizeProposalDesignSettings } from '@/lib/proposals/design-utils'

const getTeamContext = async () => {
  const t = getServerT()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase, user: null, teamId: null, error: NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 }) }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return { supabase, user: null, teamId: null, error: NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 }) }
  }

  return { supabase, user, teamId: profile.team_id, error: null as NextResponse | null }
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

  const { data: versions, error } = await (context.supabase as any)
    .from('proposal_versions')
    .select('id, title, created_at')
    .eq('proposal_id', proposalId)
    .eq('team_id', context.teamId)
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

  const { data: version, error: versionError } = await (context.supabase as any)
    .from('proposal_versions')
    .select('id, proposal_id, title, blocks, design_settings, created_at')
    .eq('id', versionId)
    .eq('team_id', context.teamId)
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
    .eq('team_id', context.teamId)
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
