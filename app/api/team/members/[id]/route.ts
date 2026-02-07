import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { canAssignRole, canManageTargetMember, canManageTeam } from '@/lib/team/member-permissions'
import { isValidTeamScreenKey, sanitizeTeamScreenKeys } from '@/lib/team/screen-access'

const allowedRoles = ['admin', 'member', 'viewer']

export const PATCH = withApiLogging(async (request: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  if (!params.id) {
    return NextResponse.json({ error: t('api.team.memberIdRequired') }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as { role?: string; allowedScreens?: unknown } | null
  const hasRoleUpdate = typeof payload?.role === 'string'
  const hasScreenUpdate = payload?.allowedScreens !== undefined

  if (!hasRoleUpdate && !hasScreenUpdate) {
    return NextResponse.json({ error: t('api.team.memberUpdateRequired') }, { status: 400 })
  }

  if (hasRoleUpdate && (!payload?.role || !allowedRoles.includes(payload.role))) {
    return NextResponse.json({ error: t('api.team.roleInvalid') }, { status: 400 })
  }

  let normalizedAllowedScreens: string[] | undefined
  if (hasScreenUpdate) {
    if (!Array.isArray(payload?.allowedScreens)) {
      return NextResponse.json({ error: t('api.team.allowedScreensInvalid') }, { status: 400 })
    }

    const invalidItem = payload.allowedScreens.some(
      (item) => typeof item !== 'string' || !isValidTeamScreenKey(item.trim())
    )

    if (invalidItem) {
      return NextResponse.json({ error: t('api.team.allowedScreensInvalid') }, { status: 400 })
    }

    normalizedAllowedScreens = sanitizeTeamScreenKeys(payload.allowedScreens as string[])
    if (normalizedAllowedScreens.length === 0) {
      return NextResponse.json({ error: t('api.team.allowedScreensInvalid') }, { status: 400 })
    }
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const admin = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return supabase
    }
  })()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('team_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  if (!canManageTeam(profile.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  const { data: target, error: targetError } = await admin
    .from('users')
    .select('id, role, team_id, allowed_screens')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: t('api.team.memberNotFound') }, { status: 404 })
  }

  if (!canManageTargetMember(profile.role, target.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  if (target.role === 'owner' && hasRoleUpdate) {
    return NextResponse.json({ error: t('api.team.ownerRoleLocked') }, { status: 400 })
  }

  if (hasRoleUpdate && !canAssignRole(profile.role, payload?.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  const updates: { role?: string; allowed_screens?: string[] } = {}
  if (hasRoleUpdate && payload?.role) {
    updates.role = payload.role
  }
  if (hasScreenUpdate && normalizedAllowedScreens) {
    updates.allowed_screens = normalizedAllowedScreens
  }

  const { data: updated, error } = await admin
    .from('users')
    .update(updates)
    .eq('id', target.id)
    .eq('team_id', profile.team_id)
    .select('id, full_name, email, role, allowed_screens')
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

  const admin = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return supabase
    }
  })()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('team_id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  if (!canManageTeam(profile.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  if (params.id === user.id) {
    return NextResponse.json({ error: t('api.team.cannotRemoveSelf') }, { status: 400 })
  }

  const { data: target, error: targetError } = await admin
    .from('users')
    .select('id, role')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (targetError || !target) {
    return NextResponse.json({ error: t('api.team.memberNotFound') }, { status: 404 })
  }

  if (!canManageTargetMember(profile.role, target.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  if (target.role === 'owner') {
    return NextResponse.json({ error: t('api.team.ownerCannotRemove') }, { status: 400 })
  }

  const { error } = await admin
    .from('users')
    .update({ team_id: null, role: 'member', allowed_screens: null })
    .eq('id', target.id)
    .eq('team_id', profile.team_id)

  if (error) {
    return NextResponse.json({ error: t('api.team.memberRemoveFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})
