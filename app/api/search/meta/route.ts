import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'

export async function GET() {
  const t = getServerT()
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const [savedResponse, historyResponse] = await Promise.all([
    supabase
      .from('saved_searches')
      .select('id, name, query, filters, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('search_history')
      .select('id, query, filters, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const saved = savedResponse.data ?? []
  const seen = new Set<string>()
  const history = (historyResponse.data ?? []).filter((item) => {
    if (seen.has(item.query)) {
      return false
    }
    seen.add(item.query)
    return true
  })

  return NextResponse.json({
    saved,
    history: history.slice(0, 6),
  })
}
