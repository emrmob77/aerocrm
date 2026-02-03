import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

const escapeCsv = (value: string) => {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const locale = getServerLocale()
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const rangeDays = Number(searchParams.get('range') ?? 7)
  const rangeValue = Number.isFinite(rangeDays) && rangeDays > 0 ? rangeDays : 7
  const since = new Date(Date.now() - rangeValue * 24 * 60 * 60 * 1000).toISOString()

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('id')
    .eq('team_id', profile.team_id)

  const webhookIds = webhooks?.map((item) => item.id) ?? []

  const [webhookLogs, systemLogs, apiUsage] = await Promise.all([
    webhookIds.length
      ? supabase
          .from('webhook_logs')
          .select('success, duration_ms')
          .in('webhook_id', webhookIds)
          .gte('created_at', since)
      : Promise.resolve({
          data: [] as Array<{ success: boolean; duration_ms: number | null }>,
        }),
    supabase
      .from('system_logs')
      .select('id, level')
      .eq('team_id', profile.team_id)
      .gte('created_at', since),
    supabase
      .from('api_usage_logs')
      .select('path, status, duration_ms')
      .eq('team_id', profile.team_id)
      .gte('created_at', since),
  ])

  const webhookTotal = webhookLogs.data?.length ?? 0
  const webhookSuccess = webhookLogs.data?.filter((log) => log.success).length ?? 0
  const webhookRate = webhookTotal === 0 ? null : formatPercent(webhookSuccess / webhookTotal)
  const webhookDurations = (webhookLogs.data ?? [])
    .map((log) => log.duration_ms)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const webhookAvgDurationMs =
    webhookDurations.length > 0
      ? Math.round(webhookDurations.reduce((sum, value) => sum + value, 0) / webhookDurations.length)
      : null

  const apiRequests = apiUsage.data ?? []
  const apiErrorCount = apiRequests.filter((req) => (req.status ?? 0) >= 500).length
  const apiErrorRate = apiRequests.length === 0 ? null : formatPercent(apiErrorCount / apiRequests.length)
  const apiDurations = apiRequests
    .map((req) => req.duration_ms)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value))
  const apiAvgDurationMs =
    apiDurations.length > 0
      ? Math.round(apiDurations.reduce((sum, value) => sum + value, 0) / apiDurations.length)
      : null

  const apiByPath = apiRequests.reduce<Record<string, number>>((acc, item) => {
    const key = item.path || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})
  const topEndpoints = Object.entries(apiByPath)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const errorCount = systemLogs.data?.filter((log) => log.level === 'error').length ?? 0
  const uptimeSeconds = Math.floor(process.uptime())

  const rateLimitMax = Number(process.env.AERO_RATE_LIMIT_MAX ?? '')
  const rateLimitWindow = Number(process.env.AERO_RATE_LIMIT_WINDOW ?? '')
  const rateLimitText =
    Number.isFinite(rateLimitMax) && rateLimitMax > 0
      ? `${rateLimitMax} / ${Number.isFinite(rateLimitWindow) && rateLimitWindow > 0 ? rateLimitWindow : ''}`
      : t('monitoring.rateLimit.unlimited')

  const rows: Array<[string, string]> = [
    ['generated_at', new Date().toISOString()],
    ['range_start', since],
    ['range_days', String(rangeValue)],
    ['uptime_seconds', String(uptimeSeconds)],
    ['webhook_success_rate', webhookRate ?? ''],
    ['webhook_total', String(webhookTotal)],
    ['webhook_avg_duration_ms', webhookAvgDurationMs?.toString() ?? ''],
    ['api_requests', String(apiRequests.length)],
    ['api_error_rate', apiErrorRate ?? ''],
    ['api_avg_duration_ms', apiAvgDurationMs?.toString() ?? ''],
    ['error_logs', String(errorCount)],
    ['rate_limit', rateLimitText],
  ]

  topEndpoints.forEach((endpoint, index) => {
    rows.push([`top_endpoint_${index + 1}`, `${endpoint.path} (${endpoint.count})`])
  })

  const csvLines = [['metric', 'value'], ...rows]
    .map((line) => line.map((value) => escapeCsv(String(value))).join(','))
    .join('\n')

  const stamp = new Date().toISOString().split('T')[0]
  const filename = `system-health-${locale}-${stamp}.csv`

  return new Response(`\uFEFF${csvLines}`, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
})
