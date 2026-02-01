import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type WebhookPayload = {
  url?: string
  active?: boolean
  events?: string[]
}

const normalizeUrl = (value?: string | null) => value?.trim() || ''

export async function GET() {
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

  const { data, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('team_id', profile.team_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Webhooklar getirilemedi.' }, { status: 400 })
  }

  return NextResponse.json({ webhooks: data ?? [] })
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as WebhookPayload | null
  const url = normalizeUrl(payload?.url)
  const events = payload?.events ?? []
  const active = payload?.active ?? true

  if (!url) {
    return NextResponse.json({ error: 'Webhook URL zorunludur.' }, { status: 400 })
  }

  if (events.length === 0) {
    return NextResponse.json({ error: 'En az bir webhook olayı seçilmelidir.' }, { status: 400 })
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

  const secretKey = crypto.randomUUID().replace(/-/g, '')

  const { data, error } = await supabase
    .from('webhooks')
    .insert({
      url,
      events,
      active,
      secret_key: secretKey,
      team_id: profile.team_id,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Webhook oluşturulamadı.' }, { status: 400 })
  }

  return NextResponse.json({ webhook: data })
}
