import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import type { Database, Json } from '@/types/database'

type ApiLogContext = {
  request: Request
  status: number
  durationMs?: number | null
  teamId?: string | null
  userId?: string | null
  supabase?: SupabaseClient<Database>
}

type ApiErrorContext = {
  request: Request
  status?: number
  durationMs?: number | null
  message: string
  source?: string
  context?: Record<string, Json>
  teamId?: string | null
  userId?: string | null
  supabase?: SupabaseClient<Database>
}

type HandlerContext = {
  params?: Record<string, string>
}

type ApiHandler<C extends HandlerContext = HandlerContext> = (request: Request, context: C) => Promise<Response>

type LoggingOptions = {
  teamId?: string | null
  userId?: string | null
  supabase?: SupabaseClient<Database>
  source?: string
  skipUsageLog?: boolean
  skipErrorLog?: boolean
}

const resolveIdentity = async (
  supabase: SupabaseClient<Database>,
  providedUserId?: string | null,
  providedTeamId?: string | null
) => {
  let userId = providedUserId ?? null
  let teamId = providedTeamId ?? null

  if (!userId || !teamId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!userId) {
      userId = user?.id ?? null
    }
    if (!teamId && user?.id) {
      const { data: profile } = await supabase
        .from('users')
        .select('team_id')
        .eq('id', user.id)
        .maybeSingle()
      teamId = profile?.team_id ?? null
    }
  }

  return { userId, teamId }
}

const getRequestInfo = (request: Request) => {
  const url = new URL(request.url)
  return {
    path: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent'),
    ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
  }
}

export async function logApiUsage({
  request,
  status,
  durationMs,
  teamId,
  userId,
  supabase,
}: ApiLogContext) {
  try {
    const client = supabase ?? (await createServerSupabaseClient())
    const identity = await resolveIdentity(client, userId, teamId)

    if (!identity.userId) return

    const info = getRequestInfo(request)
    const durationValue = Number.isFinite(durationMs) ? Math.round(durationMs as number) : null

    await client.from('api_usage_logs').insert({
      path: info.path,
      method: info.method,
      status,
      duration_ms: durationValue,
      team_id: identity.teamId,
      user_id: identity.userId,
      user_agent: info.userAgent ?? null,
      ip_address: info.ipAddress ?? null,
    })
  } catch {
    // ignore logging failures
  }
}

export async function logSystemError({
  request,
  status,
  durationMs,
  message,
  source,
  context,
  teamId,
  userId,
  supabase,
}: ApiErrorContext) {
  try {
    const client = supabase ?? (await createServerSupabaseClient())
    const identity = await resolveIdentity(client, userId, teamId)

    if (!identity.userId) return

    const info = getRequestInfo(request)
    const durationValue = Number.isFinite(durationMs) ? Math.round(durationMs as number) : null
    const payload: Record<string, Json> = {
      path: info.path,
      method: info.method,
      status: status ?? null,
      duration_ms: durationValue,
      ...context,
    }

    await client.from('system_logs').insert({
      level: 'error',
      message,
      source: source ?? `api:${info.method.toLowerCase()} ${info.path}`,
      context: payload,
      team_id: identity.teamId,
      user_id: identity.userId,
    })
  } catch {
    // ignore logging failures
  }
}

export const withApiLogging = <C extends HandlerContext>(
  handler: ApiHandler<C>,
  options: LoggingOptions = {}
) => {
  return async (request: Request, context?: C) => {
    const startedAt = Date.now()
    let response: Response
    let errorMessage: string | null = null
    const resolvedContext = (context ?? {}) as C

    try {
      response = await handler(request, resolvedContext)
    } catch (error) {
      const t = getServerT()
      response = NextResponse.json({ error: t('api.errors.unexpected') }, { status: 500 })
      errorMessage = error instanceof Error ? error.message : t('api.errors.unexpected')
    }

    const durationMs = Date.now() - startedAt
    const status = response.status ?? 500

    if (!options.skipUsageLog) {
      await logApiUsage({
        request,
        status,
        durationMs,
        teamId: options.teamId,
        userId: options.userId,
        supabase: options.supabase,
      })
    }

    if (!options.skipErrorLog && (errorMessage || status >= 500)) {
      await logSystemError({
        request,
        status,
        durationMs,
        message: errorMessage || 'API request failed',
        source: options.source,
        teamId: options.teamId,
        userId: options.userId,
        supabase: options.supabase,
      })
    }

    return response
  }
}
