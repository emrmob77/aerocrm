import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildTeamInviteEmail } from '@/lib/notifications/email-templates'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

const allowedRoles = ['admin', 'member', 'viewer']

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || ''

const buildInviteLink = (origin: string, token: string) => `${origin}/invite/${token}`

const sendInviteEmail = async (params: { to: string; link: string; inviter: string; locale?: 'tr' | 'en' }) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return false
  }

  const template = buildTeamInviteEmail({ inviter: params.inviter, link: params.link, locale: params.locale })

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

  return response.ok
}

export const GET = withApiLogging(async (request: Request) => {
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

  return NextResponse.json({ invites: data ?? [] })
})

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
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
    .select('team_id, full_name, language')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('team_invites')
    .insert({
      team_id: profile.team_id,
      email,
      role,
      token,
      invited_by: user.id,
      status: 'pending',
      expires_at: expiresAt,
    })
    .select('id, email, role, status, token, created_at, expires_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: t('api.team.inviteCreateFailed') }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const inviteLink = buildInviteLink(origin, token)
  await sendInviteEmail({
    to: email,
    link: inviteLink,
    inviter: profile.full_name || t('api.team.inviteDefaultInviter'),
    locale: profile.language === 'en' ? 'en' : 'tr',
  })

  return NextResponse.json({ invite: data, inviteLink })
})
