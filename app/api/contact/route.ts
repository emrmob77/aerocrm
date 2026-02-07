import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { withApiLogging } from '@/lib/monitoring/api-logger'

const payloadSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160),
  company: z.string().trim().max(160).optional().or(z.literal('')),
  message: z.string().trim().min(10).max(2000),
  website: z.string().trim().max(120).optional(),
})

type RateLimitEntry = {
  count: number
  resetAt: number
}

type GlobalRateLimitStore = typeof globalThis & {
  __aeroContactRateLimitStore?: Map<string, RateLimitEntry>
}

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX_REQUESTS = 5

const getRateLimitStore = () => {
  const globalScope = globalThis as GlobalRateLimitStore
  if (!globalScope.__aeroContactRateLimitStore) {
    globalScope.__aeroContactRateLimitStore = new Map<string, RateLimitEntry>()
  }
  return globalScope.__aeroContactRateLimitStore
}

const isRateLimited = (key: string) => {
  const store = getRateLimitStore()
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true
  }

  store.set(key, { ...existing, count: existing.count + 1 })
  return false
}

export const POST = withApiLogging(async (request: Request) => {
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || null

  if (isRateLimited(ipAddress)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  const rawPayload = (await request.json().catch(() => null)) as Record<string, unknown> | null
  const parsed = payloadSchema.safeParse(rawPayload)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid form payload.' }, { status: 400 })
  }

  const payload = parsed.data

  // Honeypot field: bots often fill hidden fields.
  if (payload.website && payload.website.length > 0) {
    return NextResponse.json({ success: true }, { status: 200 })
  }

  const logContext: Database['public']['Tables']['system_logs']['Insert']['context'] = {
    full_name: payload.fullName,
    email: payload.email,
    company: payload.company || null,
    message: payload.message,
    source_path: '/contact',
    ip_address: ipAddress,
    user_agent: userAgent,
    submitted_at: new Date().toISOString(),
  }

  let insertError: string | null = null

  try {
    const admin = createSupabaseAdminClient()
    const { error } = await admin.from('system_logs').insert({
      level: 'info',
      source: 'marketing.contact',
      message: `Marketing contact request from ${payload.email}`,
      context: logContext,
      team_id: null,
      user_id: null,
    })
    if (error) {
      insertError = error.message
    }
  } catch (error) {
    insertError = error instanceof Error ? error.message : 'Admin insert failed.'
  }

  if (insertError) {
    const fallback = await createServerSupabaseClient()
    const { error } = await fallback.from('system_logs').insert({
      level: 'info',
      source: 'marketing.contact',
      message: `Marketing contact request from ${payload.email}`,
      context: logContext,
      team_id: null,
      user_id: null,
    })

    if (error) {
      return NextResponse.json({ error: 'Unable to persist contact request.' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}, { skipUsageLog: true })
