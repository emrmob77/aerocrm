import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

const PERSISTENCE_COOKIE_NAME = 'aero_auth_persist'
const PERSISTENCE_MAX_AGE = 60 * 60 * 24 * 30

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const persistCookie = request.cookies.get(PERSISTENCE_COOKIE_NAME)?.value
  const persistSession = persistCookie === '1'

  const normalizeCookieOptions = (options: CookieOptions) => {
    const { maxAge: _ignored, ...rest } = options ?? {}
    if (persistSession) {
      return { ...rest, maxAge: PERSISTENCE_MAX_AGE }
    }
    return { ...rest }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          const normalizedOptions = normalizeCookieOptions(options)
          request.cookies.set({
            name,
            value,
            ...normalizedOptions,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...normalizedOptions,
          })
        },
        remove(name: string, options: CookieOptions) {
          const normalizedOptions = normalizeCookieOptions(options)
          request.cookies.set({
            name,
            value: '',
            ...normalizedOptions,
            maxAge: 0,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...normalizedOptions,
            maxAge: 0,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  return { response, user, supabase }
}
