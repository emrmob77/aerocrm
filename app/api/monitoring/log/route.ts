import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'

type LogPayload = {
  level: 'error' | 'warning' | 'info'
  message: string
  source?: string
  context?: Json
}

export async function POST(request: Request) {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as LogPayload | null

  if (!payload?.level || !payload?.message) {
    return NextResponse.json({ error: t('api.monitoring.logRequired') }, { status: 400 })
  }

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

  const { error } = await supabase.from('system_logs').insert({
    level: payload.level,
    message: payload.message,
    source: payload.source ?? null,
    context: payload.context ?? null,
    team_id: teamId,
    user_id: user?.id ?? null,
  })

  if (error) {
    return NextResponse.json({ success: false, error: error.message })
  }

  return NextResponse.json({ success: true })
}
