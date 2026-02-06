import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { normalizeLocale } from '@/lib/i18n/utils'
import { withApiLogging } from '@/lib/monitoring/api-logger'

const isMissingLanguageColumn = (error: unknown) =>
  typeof error === 'object' &&
  error !== null &&
  'message' in error &&
  typeof (error as { message?: unknown }).message === 'string' &&
  (error as { message: string }).message.toLowerCase().includes('language')

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

  const { data: profile, error } = await supabase
    .from('users')
    .select('language')
    .eq('id', user.id)
    .maybeSingle()

  if (error && !isMissingLanguageColumn(error)) {
    return NextResponse.json({ error: t('api.settings.languageReadFailed') }, { status: 400 })
  }

  const language = normalizeLocale(profile?.language ?? null)
  const response = NextResponse.json({ language })
  response.cookies.set('aero_locale', language, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
})

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as { language?: string } | null
  const next = normalizeLocale(payload?.language)

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { error } = await supabase
    .from('users')
    .update({ language: next })
    .eq('id', user.id)

  if (error && !isMissingLanguageColumn(error)) {
    return NextResponse.json({ error: t('api.settings.languageSaveFailed') }, { status: 400 })
  }

  const response = NextResponse.json({ success: true, language: next })
  response.cookies.set('aero_locale', next, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
})
