import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

const allowedRoles = ['admin', 'member', 'viewer']

export const PATCH = withApiLogging(async (request: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  if (!params.id) {
    return NextResponse.json({ error: t('api.team.memberIdRequired') }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as { role?: string } | null

  if (!payload?.role || !allowedRoles.includes(payload.role)) {
    return NextResponse.json({ error: t('api.team.roleInvalid') }, { status: 400 })
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
    .select('team_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('id, role, team_id')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: t('api.team.memberNotFound') }, { status: 404 })
  }

  if (target.role === 'owner') {
    return NextResponse.json({ error: t('api.team.ownerRoleLocked') }, { status: 400 })
  }

  const { data: updated, error } = await supabase
    .from('users')
    .update({ role: payload.role })
    .eq('id', target.id)
    .eq('team_id', profile.team_id)
    .select('id, full_name, email, role')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: t('api.team.roleUpdateFailed') }, { status: 400 })
  }

  return NextResponse.json({ member: updated })
})

export const DELETE = withApiLogging(async (_: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  if (!params.id) {
    return NextResponse.json({ error: t('api.team.memberIdRequired') }, { status: 400 })
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
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  if (params.id === user.id) {
    return NextResponse.json({ error: t('api.team.cannotRemoveSelf') }, { status: 400 })
  }

  const { data: target, error: targetError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: t('api.team.memberNotFound') }, { status: 404 })
  }

  if (target.role === 'owner') {
    return NextResponse.json({ error: t('api.team.ownerCannotRemove') }, { status: 400 })
  }

  const { error } = await supabase
    .from('users')
    .update({ team_id: null, role: 'member' })
    .eq('id', target.id)
    .eq('team_id', profile.team_id)

  if (error) {
    return NextResponse.json({ error: t('api.team.memberRemoveFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})
