import { createBrowserClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { parse, serialize } from 'cookie'

type AuthPersistenceMode = 'persistent' | 'session'

const PERSISTENCE_COOKIE_NAME = 'aero_auth_persist'
const PERSISTENCE_MAX_AGE = 60 * 60 * 24 * 30

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined'

const getCookieValue = (name: string) => {
  if (!isBrowser()) {
    return null
  }
  const cookies = parse(document.cookie || '')
  return cookies[name] ?? null
}

const setCookieValue = (name: string, value: string, options: CookieOptions) => {
  if (!isBrowser()) {
    return
  }
  document.cookie = serialize(name, value, {
    path: '/',
    sameSite: 'lax',
    ...options,
  })
}

const getInitialPersistence = (): AuthPersistenceMode => {
  const persisted = getCookieValue(PERSISTENCE_COOKIE_NAME)
  if (persisted === '0') {
    return 'session'
  }
  return 'persistent'
}

let authPersistence: AuthPersistenceMode = getInitialPersistence()

export function setAuthStorageMode(mode: AuthPersistenceMode) {
  authPersistence = mode

  const rememberMe = mode === 'persistent'
  setCookieValue(
    PERSISTENCE_COOKIE_NAME,
    rememberMe ? '1' : '0',
    rememberMe ? { maxAge: PERSISTENCE_MAX_AGE } : {}
  )
}

export function clearAuthPersistence() {
  authPersistence = 'session'
  setCookieValue(PERSISTENCE_COOKIE_NAME, '', { maxAge: 0 })
}

const cookieMethods = {
  get(name: string) {
    return getCookieValue(name) ?? undefined
  },
  async set(name: string, value: string, options: CookieOptions) {
    const { maxAge: _ignored, ...rest } = options ?? {}
    if (authPersistence === 'persistent') {
      setCookieValue(name, value, { ...rest, maxAge: PERSISTENCE_MAX_AGE })
    } else {
      setCookieValue(name, value, { ...rest })
    }
  },
  async remove(name: string, options: CookieOptions) {
    const { maxAge: _ignored, ...rest } = options ?? {}
    setCookieValue(name, '', { ...rest, maxAge: 0 })
  },
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: cookieMethods,
    }
  ) as unknown as SupabaseClient<any>
}

// Singleton instance for client-side
let client: SupabaseClient<any> | null = null

export function getSupabaseClient() {
  if (!client) {
    client = createClient()
  }
  return client
}
