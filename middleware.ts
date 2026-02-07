import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

type RateLimitEntry = {
  count: number
  resetAt: number
}

const DEFAULT_RATE_LIMIT_MAX = 120
const DEFAULT_RATE_LIMIT_WINDOW_SECONDS = 60

const rateLimitStore = new Map<string, RateLimitEntry>()

const rateLimitMax = Number(process.env.AERO_RATE_LIMIT_MAX || DEFAULT_RATE_LIMIT_MAX)
const rateLimitWindowSeconds = Number(process.env.AERO_RATE_LIMIT_WINDOW || DEFAULT_RATE_LIMIT_WINDOW_SECONDS)
const rateLimitWindowMs = Math.max(1, rateLimitWindowSeconds) * 1000

const csrfBypassPrefixes = [
  '/api/stripe/webhook',
]

const rateLimitBypassPrefixes = [
  '/api/stripe/webhook',
  '/api/monitoring/usage',
]

const isUnsafeMethod = (method: string) =>
  method === 'POST' || method === 'PUT' || method === 'PATCH' || method === 'DELETE'

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const getClientIp = (request: NextRequest) => {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return request.headers.get('x-real-ip') || 'unknown'
}

const isCsrfAllowed = (request: NextRequest) => {
  if (!isUnsafeMethod(request.method)) return true
  if (csrfBypassPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) return true

  const requestOrigin = normalizeOrigin(request.headers.get('origin') || '')
  const appOrigin =
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL || '') ||
    normalizeOrigin(request.nextUrl.origin)

  if (!requestOrigin || !appOrigin) return false
  return requestOrigin === appOrigin
}

const applySecurityHeaders = (response: NextResponse) => {
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'")
}

const applyRateLimitHeaders = (response: NextResponse, remaining: number, resetAt: number) => {
  response.headers.set('X-RateLimit-Limit', String(rateLimitMax))
  response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)))
}

export function middleware(request: NextRequest, _: NextFetchEvent) {
  if (rateLimitBypassPrefixes.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) {
    const response = NextResponse.next()
    applySecurityHeaders(response)
    return response
  }

  const now = Date.now()
  const ip = getClientIp(request)
  const key = `${ip}:${request.nextUrl.pathname}`
  const current = rateLimitStore.get(key)

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rateLimitWindowMs })
  } else {
    current.count += 1
    rateLimitStore.set(key, current)
  }

  if (rateLimitStore.size > 5000) {
    for (const entryKey of Array.from(rateLimitStore.keys())) {
      const entry = rateLimitStore.get(entryKey)
      if (!entry) continue
      if (entry.resetAt <= now) {
        rateLimitStore.delete(entryKey)
      }
    }
  }

  const entry = rateLimitStore.get(key) as RateLimitEntry
  const remaining = rateLimitMax - entry.count

  if (entry.count > rateLimitMax) {
    const response = NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
    applySecurityHeaders(response)
    applyRateLimitHeaders(response, 0, entry.resetAt)
    return response
  }

  if (!isCsrfAllowed(request)) {
    const response = NextResponse.json(
      { error: 'Invalid request origin' },
      { status: 403 }
    )
    applySecurityHeaders(response)
    applyRateLimitHeaders(response, remaining, entry.resetAt)
    return response
  }

  const response = NextResponse.next()
  applySecurityHeaders(response)
  applyRateLimitHeaders(response, remaining, entry.resetAt)
  return response
}

export const config = {
  matcher: ['/api/:path*'],
}
