import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const parseStatusFilter = (value: string | null) => {
  if (value === 'success') return true
  if (value === 'error') return false
  return null
}

export async function GET(request: Request) {
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

  const { data: teamWebhooks, error: webhooksError } = await supabase
    .from('webhooks')
    .select('id')
    .eq('team_id', profile.team_id)

  if (webhooksError || !teamWebhooks?.length) {
    return NextResponse.json({ logs: [] })
  }

  const webhookIds = teamWebhooks.map((w) => w.id)
  const { searchParams } = new URL(request.url)
  const statusFilter = parseStatusFilter(searchParams.get('status'))

  let query = supabase
    .from('webhook_logs')
    .select('id, webhook_id, event_type, payload, response_status, response_body, success, duration_ms, error_message, created_at, webhooks(url)')
    .in('webhook_id', webhookIds)
    .order('created_at', { ascending: false })
    .limit(200)

  if (statusFilter !== null) {
    query = query.eq('success', statusFilter)
  }

  const { data: rows, error } = await query

  if (error) {
    return NextResponse.json({ error: 'Webhook logları getirilemedi.' }, { status: 400 })
  }

  const logs = (rows ?? []).map((row) => {
    const { webhooks, ...log } = row as typeof row & { webhooks: { url: string } | null }
    return {
      ...log,
      webhook_url: webhooks?.url ?? null,
    }
  })

  return NextResponse.json({ logs })
}
