import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

type SavedSearchPayload = {
  name?: string
  query?: string
  filters?: Record<string, unknown>
}

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .select('id, name, query, filters, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Kayıtlı aramalar getirilemedi.' }, { status: 400 })
  }

  return NextResponse.json({ saved: data ?? [] })
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as SavedSearchPayload | null
  const name = payload?.name?.trim()
  const query = payload?.query?.trim()

  if (!name || !query) {
    return NextResponse.json({ error: 'Arama adı ve sorgu zorunludur.' }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: user.id,
      name,
      query,
      filters: payload?.filters ?? {},
    })
    .select('id, name, query, filters, updated_at')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Kayıtlı arama oluşturulamadı.' }, { status: 400 })
  }

  return NextResponse.json({ saved: data })
}
