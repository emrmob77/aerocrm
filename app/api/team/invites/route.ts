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

type InviteListRow = {
  id: string
  email: string
  role: string
  status: string
  token: string
  created_at: string
  expires_at: string | null
}

const createdAtMs = (value: string | null | undefined) => {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

const dedupeVisibleInvites = (rows: InviteListRow[]) => {
  const latestByEmail = new Map<string, InviteListRow>()

  rows.forEach((row) => {
    if (row.status === 'revoked') {
      return
    }

    const key = normalizeEmail(row.email)
    const existing = latestByEmail.get(key)
    if (!existing || createdAtMs(row.created_at) > createdAtMs(existing.created_at)) {
      latestByEmail.set(key, row)
    }
  })

  return Array.from(latestByEmail.values()).sort((a, b) => createdAtMs(b.created_at) - createdAtMs(a.created_at))
}

const sendInviteEmail = async (params: { to: string; link: string; inviter: string; locale?: 'tr' | 'en' }) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return { delivered: false, reason: 'missing_config' } satisfies InviteEmailResult
  }

  const template = buildTeamInviteEmail({ inviter: params.inviter, link: params.link, locale: params.locale })

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

export const GET = withApiLogging(async (_request: Request) => {
  const t = getServerT()
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

  const { data, error } = await supabase
    .from('team_invites')
    .select('id, email, role, status, token, created_at, expires_at')
    .eq('team_id', profile.team_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: t('api.team.invitesFetchFailed') }, { status: 400 })
  }

  return NextResponse.json({ invites: dedupeVisibleInvites((data ?? []) as InviteListRow[]) })
})

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const locale = getServerLocale()
  const payload = (await request.json().catch(() => null)) as { email?: string; role?: string } | null
  const email = normalizeEmail(payload?.email)

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: t('api.team.emailInvalid') }, { status: 400 })
  }

  const role = allowedRoles.includes(payload?.role ?? '') ? payload?.role : 'member'

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

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: acceptedInvite } = await supabase
    .from('team_invites')
    .select('id')
    .eq('team_id', profile.team_id)
    .ilike('email', email)
    .eq('status', 'accepted')
    .limit(1)
    .maybeSingle()

  if (acceptedInvite?.id) {
    return NextResponse.json({ error: t('api.team.inviteAlreadyAccepted') }, { status: 400 })
  }

  const { data: existingInvite } = await supabase
    .from('team_invites')
    .select('id, status')
    .eq('team_id', profile.team_id)
    .ilike('email', email)
    .in('status', ['pending', 'revoked'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const inviteMutation = existingInvite
    ? supabase
        .from('team_invites')
        .update({
          role,
          token,
          invited_by: user.id,
          status: 'pending',
          expires_at: expiresAt,
          accepted_at: null,
        })
        .eq('id', existingInvite.id)
        .eq('team_id', profile.team_id)
    : supabase.from('team_invites').insert({
        team_id: profile.team_id,
        email,
        role,
        token,
        invited_by: user.id,
        status: 'pending',
        expires_at: expiresAt,
      })

  const { data, error } = await inviteMutation.select('id, email, role, status, token, created_at, expires_at').single()

  if (error || !data) {
    return NextResponse.json({ error: t('api.team.inviteCreateFailed') }, { status: 400 })
  }

  const origin = resolveRequestOrigin(request)
  const inviteLink = buildInviteLink(origin, token)
  const emailDelivery = await sendInviteEmail({
    to: email,
    link: inviteLink,
    inviter: profile.full_name || t('api.team.inviteDefaultInviter'),
    locale,
  })

  await notifyInviteeIfKnownUser({
    supabase,
    email,
    token,
    actorUserId: user.id,
    t,
  })

  return NextResponse.json({
    invite: data,
    inviteLink,
    emailDelivered: emailDelivery.delivered,
    emailErrorReason: emailDelivery.reason ?? null,
  })
})
