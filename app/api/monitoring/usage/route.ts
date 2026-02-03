import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

export const POST = withApiLogging(async (request: Request) => {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let teamId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .maybeSingle()
    teamId = profile?.team_id ?? null
  }

  const payload = (await request.json().catch(() => null)) as
    | { path?: string; method?: string; status?: number; duration_ms?: number }
    | null
  const path = payload?.path || request.headers.get('x-aero-path') || 'unknown'
  const method = payload?.method || request.headers.get('x-aero-method') || request.method
  const userAgent = request.headers.get('x-aero-user-agent')
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
  const status = Number.isFinite(payload?.status) ? Number(payload?.status) : null
  const durationMs = Number.isFinite(payload?.duration_ms)
    ? Math.round(Number(payload?.duration_ms))
    : null

  const { error } = await supabase.from('api_usage_logs').insert({
    path,
    method,
    status,
    duration_ms: durationMs,
    team_id: teamId,
    user_id: user?.id ?? null,
    user_agent: userAgent,
    ip_address: ipAddress,
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  return NextResponse.json({ success: true })
}, { skipUsageLog: true })
