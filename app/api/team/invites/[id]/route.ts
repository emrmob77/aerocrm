import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { buildTeamInviteEmail } from '@/lib/notifications/email-templates'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { canManageTeam } from '@/lib/team/member-permissions'
import type { Database } from '@/types/database'
import { notifyInApp } from '@/lib/notifications/server'
import { resolveRequestOrigin } from '@/lib/url/request-origin'

const allowedRoles = ['admin', 'member', 'viewer']

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || ''

const buildInviteLink = (origin: string, token: string) => `${origin}/invite/${token}`

type InviteEmailResult = {
  delivered: boolean
  reason?: 'missing_config' | 'provider_error'
}

const sendInviteEmail = async (params: { to: string; link: string; inviter: string; locale?: 'tr' | 'en' }) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return { delivered: false, reason: 'missing_config' } satisfies InviteEmailResult
  }

  const template = buildTeamInviteEmail({
    inviter: params.inviter,
    link: params.link,
    locale: params.locale,
    variant: 'renewed',
  })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: template.subject,
        text: template.text,
        html: template.html,
      }),
    })

    if (response.ok) {
      return { delivered: true } satisfies InviteEmailResult
    }

    return { delivered: false, reason: 'provider_error' } satisfies InviteEmailResult
  } catch {
    return { delivered: false, reason: 'provider_error' } satisfies InviteEmailResult
  }
}

const notifyInviteeIfKnownUser = async (params: {
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
  email: string
  token: string
  actorUserId: string
  t: ReturnType<typeof getServerT>
}) => {
  const lookupClient = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return params.supabase
    }
  })()

  const { data: invitee } = await lookupClient
    .from('users')
    .select('id')
    .ilike('email', normalizeEmail(params.email))
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!invitee?.id || invitee.id === params.actorUserId) {
    return
  }

  await notifyInApp(params.supabase as unknown as SupabaseClient<Database>, {
    userId: invitee.id,
    category: 'system',
    type: 'team_invite',
    title: params.t('api.team.notifications.inviteTitle'),
    message: params.t('api.team.notifications.inviteMessage'),
    actionUrl: `/invite/${params.token}`,
    metadata: { token: params.token },
    respectPreferences: false,
  })
}

export const PATCH = withApiLogging(async (request: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  const locale = getServerLocale()
  if (!params.id) {
    return NextResponse.json({ error: t('api.team.inviteIdRequired') }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as { role?: string; email?: string } | null

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
    .select('team_id, full_name, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  if (!canManageTeam(profile.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('team_invites')
    .select('*')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: t('api.team.inviteNotFound') }, { status: 404 })
  }

  if (invite.status === 'accepted') {
    return NextResponse.json({ error: t('api.team.inviteAlreadyAccepted') }, { status: 400 })
  }

  const role = allowedRoles.includes(payload?.role ?? '') ? payload?.role : invite.role
  const email = payload?.email ? normalizeEmail(payload.email) : invite.email

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: t('api.team.emailInvalid') }, { status: 400 })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: updated, error } = await supabase
    .from('team_invites')
    .update({
      role,
      email,
      token,
      status: 'pending',
      expires_at: expiresAt,
      accepted_at: null,
    })
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .select('id, email, role, status, token, created_at, expires_at')
    .single()

  if (error || !updated) {
    return NextResponse.json({ error: t('api.team.inviteUpdateFailed') }, { status: 400 })
  }

  const origin = resolveRequestOrigin(request)
  const inviteLink = buildInviteLink(origin, token)
  const emailDelivery = await sendInviteEmail({
    to: updated.email,
    link: inviteLink,
    inviter: profile.full_name || t('api.team.inviteDefaultInviter'),
    locale,
  })

  await notifyInviteeIfKnownUser({
    supabase,
    email: updated.email,
    token,
    actorUserId: user.id,
    t,
  })

  return NextResponse.json({
    invite: updated,
    inviteLink,
    emailDelivered: emailDelivery.delivered,
    emailErrorReason: emailDelivery.reason ?? null,
  })
})

export const DELETE = withApiLogging(async (_: Request, { params }: { params: { id: string } }) => {
  const t = getServerT()
  if (!params.id) {
    return NextResponse.json({ error: t('api.team.inviteIdRequired') }, { status: 400 })
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

  if (!canManageTeam(profile.role)) {
    return NextResponse.json({ error: t('api.errors.forbidden') }, { status: 403 })
  }

  const { error } = await supabase
    .from('team_invites')
    .update({ status: 'revoked' })
    .eq('id', params.id)
    .eq('team_id', profile.team_id)

  if (error) {
    return NextResponse.json({ error: t('api.team.inviteRevokeFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true })
})
