import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const normalizeLanguage = (value?: string | null) => (value === 'en' ? 'en' : 'tr')

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('language')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'Dil bilgisi okunamadı.' }, { status: 400 })
  }

  const response = NextResponse.json({ language: normalizeLanguage(profile?.language ?? null) })
  response.cookies.set('aero_locale', normalizeLanguage(profile?.language ?? null), {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as { language?: string } | null
  const next = normalizeLanguage(payload?.language)

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { error } = await supabase
    .from('users')
    .update({ language: next })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Dil tercihi kaydedilemedi.' }, { status: 400 })
  }

  const response = NextResponse.json({ success: true, language: next })
  response.cookies.set('aero_locale', next, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}
