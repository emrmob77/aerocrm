import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { buildTeamInviteEmail } from '@/lib/notifications/email-templates'

const allowedRoles = ['admin', 'member', 'viewer']

const normalizeEmail = (value?: string | null) => value?.trim().toLowerCase() || ''

const buildInviteLink = (origin: string, token: string) => `${origin}/invite/${token}`

const sendInviteEmail = async (params: { to: string; link: string; inviter: string; locale?: 'tr' | 'en' }) => {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return false
  }

  const template = buildTeamInviteEmail({
    inviter: params.inviter,
    link: params.link,
    locale: params.locale,
    variant: 'renewed',
  })

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

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: 'Davet ID zorunludur.' }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as { role?: string; email?: string } | null

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id, full_name, language')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: 'Takım bilgisi bulunamadı.' }, { status: 400 })
  }

  const { data: invite, error: inviteError } = await supabase
    .from('team_invites')
    .select('*')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (inviteError || !invite) {
    return NextResponse.json({ error: 'Davet bulunamadı.' }, { status: 404 })
  }

  if (invite.status === 'accepted') {
    return NextResponse.json({ error: 'Davet zaten kabul edilmiş.' }, { status: 400 })
  }

  const role = allowedRoles.includes(payload?.role ?? '') ? payload?.role : invite.role
  const email = payload?.email ? normalizeEmail(payload.email) : invite.email

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
    return NextResponse.json({ error: 'Davet güncellenemedi.' }, { status: 400 })
  }

  const origin = new URL(request.url).origin
  const inviteLink = buildInviteLink(origin, token)
  await sendInviteEmail({
    to: updated.email,
    link: inviteLink,
    inviter: profile.full_name || 'AERO CRM ekibi',
    locale: profile.language === 'en' ? 'en' : 'tr',
  })

  return NextResponse.json({ invite: updated, inviteLink })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: 'Davet ID zorunludur.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: 'Takım bilgisi bulunamadı.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('team_invites')
    .update({ status: 'revoked' })
    .eq('id', params.id)
    .eq('team_id', profile.team_id)

  if (error) {
    return NextResponse.json({ error: 'Davet iptal edilemedi.' }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
