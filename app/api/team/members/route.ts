import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

export const GET = withApiLogging(async () => {
  const t = getServerT()
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const admin = (() => {
    try {
      return createSupabaseAdminClient()
    } catch {
      return supabase
    }
  })()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const { data: members, error } = await admin
    .from('users')
    .select('id, full_name, email, role, avatar_url, allowed_screens')
    .eq('team_id', profile.team_id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: t('api.team.membersFetchFailed') }, { status: 400 })
  }

  return NextResponse.json({ members: members ?? [] })
})
