import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
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

  const path = request.headers.get('x-aero-path') || 'unknown'
  const method = request.headers.get('x-aero-method') || request.method
  const userAgent = request.headers.get('x-aero-user-agent')
  const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')

  const { error } = await supabase.from('api_usage_logs').insert({
    path,
    method,
    team_id: teamId,
    user_id: user?.id ?? null,
    user_agent: userAgent,
    ip_address: ipAddress,
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  return NextResponse.json({ success: true })
}
