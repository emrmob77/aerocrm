import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'

type WebhookPayload = {
  url?: string
  active?: boolean
  events?: string[]
}

const normalizeUrl = (value?: string | null) => value?.trim() || ''

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as WebhookPayload | null
  const url = normalizeUrl(payload?.url)
  const events = payload?.events ?? []
  const active = payload?.active ?? true

  if (!params.id) {
    return NextResponse.json({ error: t('api.webhooks.idRequired') }, { status: 400 })
  }

  if (!url) {
    return NextResponse.json({ error: t('api.webhooks.urlRequired') }, { status: 400 })
  }

  if (events.length === 0) {
    return NextResponse.json({ error: t('api.webhooks.eventsRequired') }, { status: 400 })
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

  const { data, error } = await supabase
    .from('webhooks')
    .update({
      url,
      events,
      active,
    })
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: t('api.webhooks.updateFailed') }, { status: 400 })
  }

  return NextResponse.json({ webhook: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const t = getServerT()
  if (!params.id) {
    return NextResponse.json({ error: t('api.webhooks.idRequired') }, { status: 400 })
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

  const { error } = await supabase.from('webhooks').delete().eq('id', params.id).eq('team_id', profile.team_id)

  if (error) {
    return NextResponse.json({ error: t('api.webhooks.deleteFailed') }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}
