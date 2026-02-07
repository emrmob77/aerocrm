import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type RouteContext = {
  params?: {
    id?: string
  }
}

const resolveAuthContext = async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase, user: null, teamId: null }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  return {
    supabase,
    user,
    teamId: profile?.team_id ?? null,
  }
}

const findScopedProposal = async (
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  proposalId: string,
  userId: string,
  teamId: string | null
) => {
  let query = supabase
    .from('proposals')
    .select('id, deleted_at, user_id, team_id')
    .eq('id', proposalId)

  if (teamId) {
    query = query.or(`team_id.eq.${teamId},and(team_id.is.null,user_id.eq.${userId})`)
  } else {
    query = query.eq('user_id', userId)
  }

  const { data } = await query.maybeSingle()
  return data
}

export const POST = withApiLogging(async (_request: Request, context: RouteContext) => {
  const t = getServerT()
  const proposalId = context.params?.id?.trim()

  if (!proposalId) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  const { supabase, user, teamId } = await resolveAuthContext()
  if (!user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const proposal = await findScopedProposal(supabase, proposalId, user.id, teamId)
  if (!proposal?.id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  if (proposal.deleted_at) {
    return NextResponse.json({ success: true, trashed: true })
  }

  const { error } = await supabase
    .from('proposals')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', proposal.id)

  if (error) {
    return NextResponse.json({ error: t('api.proposals.trashMoveFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true, trashed: true })
})

export const PATCH = withApiLogging(async (_request: Request, context: RouteContext) => {
  const t = getServerT()
  const proposalId = context.params?.id?.trim()

  if (!proposalId) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  const { supabase, user, teamId } = await resolveAuthContext()
  if (!user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const proposal = await findScopedProposal(supabase, proposalId, user.id, teamId)
  if (!proposal?.id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  if (!proposal.deleted_at) {
    return NextResponse.json({ success: true, restored: true })
  }

  const { error } = await supabase
    .from('proposals')
    .update({ deleted_at: null })
    .eq('id', proposal.id)

  if (error) {
    return NextResponse.json({ error: t('api.proposals.restoreFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true, restored: true })
})

export const DELETE = withApiLogging(async (_request: Request, context: RouteContext) => {
  const t = getServerT()
  const proposalId = context.params?.id?.trim()

  if (!proposalId) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  const { supabase, user, teamId } = await resolveAuthContext()
  if (!user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const proposal = await findScopedProposal(supabase, proposalId, user.id, teamId)
  if (!proposal?.id) {
    return NextResponse.json({ error: t('api.proposals.notFound') }, { status: 404 })
  }

  if (!proposal.deleted_at) {
    return NextResponse.json({ error: t('api.proposals.notInTrash') }, { status: 400 })
  }

  const { error } = await supabase
    .from('proposals')
    .delete()
    .eq('id', proposal.id)

  if (error) {
    return NextResponse.json({ error: t('api.proposals.permanentDeleteFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true, deleted: true })
})
