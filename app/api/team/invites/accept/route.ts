import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'

export async function POST(request: Request) {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as { token?: string } | null

  if (!payload?.token) {
    return NextResponse.json({ error: t('api.team.inviteTokenRequired') }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('team_invites')
    .select('*')
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

  if (invite.email !== user.email) {
    return NextResponse.json({ error: t('api.team.inviteWrongUser') }, { status: 403 })
  }

  const { data: updatedUser, error: userError } = await supabase
    .from('users')
    .update({
      team_id: invite.team_id,
      role: invite.role,
    })
    .eq('id', user.id)
    .select('id, team_id, role')
    .single()

  if (userError || !updatedUser) {
    return NextResponse.json({ error: t('api.team.joinFailed') }, { status: 400 })
  }

  const acceptedAt = new Date().toISOString()

  await supabase
    .from('team_invites')
    .update({ status: 'accepted', accepted_at: acceptedAt })
    .eq('id', invite.id)

  return NextResponse.json({
    success: true,
    teamId: updatedUser.team_id,
    role: updatedUser.role,
  })
}
