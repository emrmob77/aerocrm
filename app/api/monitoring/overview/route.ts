import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerLocale, getServerT } from '@/lib/i18n/server'

const formatPercent = (value: number) => `${Math.round(value * 100)}%`

const buildDailyBuckets = (days: number, locale: string) => {
  const buckets: Array<{ key: string; label: string }> = []
  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = date.toISOString().slice(0, 10)
    const label = date.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    buckets.push({ key, label })
  }
  return buckets
}

export async function GET() {
  const t = getServerT()
  const locale = getServerLocale()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
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

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: webhooks } = await supabase
    .from('webhooks')
    .select('id')
    .eq('team_id', profile.team_id)

  const webhookIds = webhooks?.map((item) => item.id) ?? []

  const [webhookLogs, systemLogs, apiUsage] = await Promise.all([
    webhookIds.length
      ? supabase
          .from('webhook_logs')
          .select('success, created_at')
          .in('webhook_id', webhookIds)
          .gte('created_at', since)
      : Promise.resolve({ data: [] as Array<{ success: boolean; created_at: string | null }> }),
    supabase
      .from('system_logs')
      .select('id, level, message, created_at, source')
      .eq('team_id', profile.team_id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('api_usage_logs')
      .select('path, created_at')
      .eq('team_id', profile.team_id)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const webhookTotal = webhookLogs.data?.length ?? 0
  const webhookSuccess = webhookLogs.data?.filter((log) => log.success).length ?? 0
  const webhookRate = webhookTotal === 0 ? null : formatPercent(webhookSuccess / webhookTotal)

  const apiRequests = apiUsage.data ?? []
  const apiByPath = apiRequests.reduce<Record<string, number>>((acc, item) => {
    const key = item.path || 'unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const topEndpoints = Object.entries(apiByPath)
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const dailyBuckets = buildDailyBuckets(7, formatLocale)
  const apiSeries = dailyBuckets.map((bucket) => ({ date: bucket.label, count: 0 }))
  const webhookSeries = dailyBuckets.map((bucket) => ({ date: bucket.label, successRate: 0 }))

  const apiMap = new Map(dailyBuckets.map((bucket) => [bucket.key, 0]))
  apiRequests.forEach((req) => {
    if (!req.created_at) return
    const key = new Date(req.created_at).toISOString().slice(0, 10)
    apiMap.set(key, (apiMap.get(key) || 0) + 1)
  })

  const webhookMap = new Map(
    dailyBuckets.map((bucket) => [bucket.key, { total: 0, success: 0 }])
  )
  ;(webhookLogs.data || []).forEach((log) => {
    if (!log.created_at) return
    const key = new Date(log.created_at).toISOString().slice(0, 10)
    const current = webhookMap.get(key)
    if (!current) return
    current.total += 1
    if (log.success) current.success += 1
  })

  dailyBuckets.forEach((bucket, index) => {
    apiSeries[index].count = apiMap.get(bucket.key) || 0
    const stats = webhookMap.get(bucket.key)
    if (stats && stats.total > 0) {
      webhookSeries[index].successRate = Math.round((stats.success / stats.total) * 100)
    }
  })

  const uptimeSeconds = Math.floor(process.uptime())

  return NextResponse.json({
    uptimeSeconds,
    webhookRate,
    webhookTotal,
    errorCount: systemLogs.data?.filter((log) => log.level === 'error').length ?? 0,
    recentErrors: systemLogs.data ?? [],
    apiRequestsCount: apiRequests.length,
    topEndpoints,
    apiSeries,
    webhookSeries,
    since,
  })
}
