import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import type { Database } from '@/types/database'
import { notifyInApp } from '@/lib/notifications/server'

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || ''

const resolveDisplayName = (user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
}) => {
  const fromMetadata = user.user_metadata?.full_name
  if (typeof fromMetadata === 'string' && fromMetadata.trim()) {
    return fromMetadata.trim()
  }
  if (user.email) {
    const prefix = user.email.split('@')[0]?.trim()
    if (prefix) {
      return prefix
    }
  }
  return 'User'
}

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as { token?: string } | null

  if (!payload?.token) {
    return NextResponse.json({ error: t('api.team.inviteTokenRequired') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const admin = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return supabase
    }
  })()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { data: invite, error: inviteError } = await admin
    .from('team_invites')
    .select('id, team_id, role, status, email, expires_at, invited_by')
    .eq('token', payload.token)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: t('api.team.inviteNotFound') }, { status: 404 })
  }

  if (invite.status === 'accepted') {
    return NextResponse.json({ error: t('api.team.inviteAlreadyAccepted') }, { status: 400 })
  }

  if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: t('api.team.inviteExpired') }, { status: 400 })
  }

  if (normalizeEmail(invite.email) !== normalizeEmail(user.email)) {
    return NextResponse.json({ error: t('api.team.inviteWrongUser') }, { status: 403 })
  }

  const displayName = resolveDisplayName(user)

  const { data: existingProfile, error: profileReadError } = await admin
    .from('users')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileReadError) {
    return NextResponse.json({ error: t('api.team.joinFailed') }, { status: 400 })
  }

  let teamId: string | null = null
  let role: string | null = null

  if (!existingProfile) {
    const { data: createdUser, error: createError } = await admin
      .from('users')
      .insert({
        id: user.id,
        email: user.email || invite.email,
        full_name: displayName,
        team_id: invite.team_id,
        role: invite.role,
      })
      .select('team_id, role')
      .single()

    if (createError || !createdUser) {
      return NextResponse.json({ error: t('api.team.joinFailed') }, { status: 400 })
    }

    teamId = createdUser.team_id
    role = createdUser.role
  } else {
    const { data: updatedUser, error: userError } = await admin
      .from('users')
      .update({
        email: normalizeEmail(user.email) || normalizeEmail(invite.email),
        full_name: displayName,
        team_id: invite.team_id,
        role: invite.role,
      })
      .eq('id', user.id)
      .select('team_id, role')
      .single()

    if (userError || !updatedUser) {
      return NextResponse.json({ error: t('api.team.joinFailed') }, { status: 400 })
    }

    teamId = updatedUser.team_id
    role = updatedUser.role
  }

  const acceptedAt = new Date().toISOString()

  await admin
    .from('team_invites')
    .update({ status: 'accepted', accepted_at: acceptedAt })
    .eq('id', invite.id)

  if (invite.invited_by) {
    await notifyInApp(admin as unknown as SupabaseClient<Database>, {
      userId: invite.invited_by,
      category: 'system',
      type: 'team_invite_accepted',
      title: t('api.team.notifications.acceptedTitle'),
      message: t('api.team.notifications.acceptedMessage', { name: displayName }),
      actionUrl: '/settings/team',
      metadata: {
        invite_id: invite.id,
        accepted_by: user.id,
      },
      respectPreferences: false,
    })
  }

  return NextResponse.json({
    success: true,
    teamId,
    role,
  })
})
