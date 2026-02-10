import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeStage } from '@/components/deals/stage-utils'
import type { Database } from '@/types/database'

export type ReportType = 'sales' | 'deals' | 'team' | 'forecast'
export type DateRange = '7d' | '30d' | '90d' | '12m'
export type Trend = 'up' | 'down'

export type ReportKpi = {
  value: number
  change: number
  trend: Trend
}

export type ReportPerformer = {
  id: string
  name: string
  avatar: string
  deals: number
  revenue: number
  target: number
}

export type ReportPipelineStage = {
  id: 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'
  count: number
  value: number
  color: string
}

export type ReportMonthlyPoint = {
  month: string
  revenue: number
  deals: number
}

export type ReportRecentItem = {
  id: string
  name: string
  type: ReportType
  date: string
  status: 'ready' | 'generating'
  downloadUrl: string
}

export type ReportsSummary = {
  totalRevenue: ReportKpi
  closedDeals: ReportKpi
  avgDealSize: ReportKpi
  winRate: ReportKpi
  topPerformers: ReportPerformer[]
  pipelineStages: ReportPipelineStage[]
  monthlyData: ReportMonthlyPoint[]
  recentReports: ReportRecentItem[]
}

type DealSummaryRow = Pick<
  Database['public']['Tables']['deals']['Row'],
  'id' | 'created_at' | 'value' | 'stage' | 'user_id' | 'probability'
>

type UserSummaryRow = Pick<Database['public']['Tables']['users']['Row'], 'id' | 'full_name' | 'email'>

type ExportJobSummaryRow = Pick<
  Database['public']['Tables']['data_export_jobs']['Row'],
  'id' | 'entity' | 'status' | 'created_at' | 'file_name'
>

type MetricTotals = {
  totalRevenue: number
  closedDeals: number
  avgDealSize: number
  winRate: number
}

const STAGE_COLOR_MAP: Record<ReportPipelineStage['id'], string> = {
  lead: 'bg-slate-400',
  proposal: 'bg-primary',
  negotiation: 'bg-amber-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
}

const REPORT_STAGE_ORDER: Array<ReportPipelineStage['id']> = ['lead', 'negotiation', 'proposal', 'won', 'lost']

const RANGE_TO_DAYS: Record<DateRange, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 365,
}

const ENTITY_TO_REPORT_TYPE = (entity: string): ReportType => {
  if (entity === 'sales') return 'sales'
  if (entity === 'proposals') return 'forecast'
  if (entity === 'deals') return 'deals'
  return 'team'
}

const getAvatar = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}

const asTimestamp = (value: string | null | undefined) => {
  if (!value) return Number.NaN
  return new Date(value).getTime()
}

const inRange = (value: string | null | undefined, start: number, end: number) => {
  const ts = asTimestamp(value)
  if (Number.isNaN(ts)) return false
  return ts >= start && ts <= end
}

const isWon = (stage: string | null | undefined) => normalizeStage(stage) === 'won'
const isLost = (stage: string | null | undefined) => normalizeStage(stage) === 'lost'
const isClosed = (stage: string | null | undefined) => {
  const normalized = normalizeStage(stage)
  return normalized === 'won' || normalized === 'lost'
}

const getWeightedValue = (deal: DealSummaryRow) => {
  const probability = Number.isFinite(deal.probability) ? Number(deal.probability) : 50
  return (deal.value ?? 0) * (Math.max(0, Math.min(100, probability)) / 100)
}

const getMetricTotals = (deals: DealSummaryRow[], reportType: ReportType): MetricTotals => {
  if (reportType === 'team') {
    const closedDeals = deals.filter((deal) => isClosed(deal.stage))
    const wonDeals = closedDeals.filter((deal) => isWon(deal.stage))
    const totalRevenue = wonDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
    const closedCount = closedDeals.length
    const avgDealSize = closedCount === 0 ? 0 : totalRevenue / closedCount
    const winRate = closedCount === 0 ? 0 : (wonDeals.length / closedCount) * 100

    return {
      totalRevenue,
      closedDeals: closedCount,
      avgDealSize,
      winRate,
    }
  }

  if (reportType === 'forecast') {
    const openDeals = deals.filter((deal) => !isClosed(deal.stage))
    const weightedRevenue = openDeals.reduce((sum, deal) => sum + getWeightedValue(deal), 0)
    const avgProbability =
      openDeals.length === 0
        ? 0
        : openDeals.reduce((sum, deal) => {
            const probability = Number.isFinite(deal.probability) ? Number(deal.probability) : 50
            return sum + Math.max(0, Math.min(100, probability))
          }, 0) / openDeals.length

    return {
      totalRevenue: weightedRevenue,
      closedDeals: openDeals.length,
      avgDealSize: openDeals.length === 0 ? 0 : weightedRevenue / openDeals.length,
      winRate: avgProbability,
    }
  }

  const relevantDeals = reportType === 'deals' ? deals : deals.filter((deal) => isWon(deal.stage))
  const totalRevenue = relevantDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0)
  const closedDeals = relevantDeals.length
  const avgDealSize = closedDeals === 0 ? 0 : totalRevenue / closedDeals

  const wonCount = deals.filter((deal) => isWon(deal.stage)).length
  const lostCount = deals.filter((deal) => isLost(deal.stage)).length
  const winRate = wonCount + lostCount === 0 ? 0 : (wonCount / (wonCount + lostCount)) * 100

  return {
    totalRevenue,
    closedDeals,
    avgDealSize,
    winRate,
  }
}

const getChange = (current: number, previous: number) => {
  if (!previous) {
    return current ? 100 : 0
  }
  return Number((((current - previous) / previous) * 100).toFixed(1))
}

const toKpi = (current: number, previous: number): ReportKpi => {
  const change = getChange(current, previous)
  return {
    value: Number(current.toFixed(2)),
    change,
    trend: change < 0 ? 'down' : 'up',
  }
}

export const rangeToDays = (range: DateRange) => RANGE_TO_DAYS[range]

export const EMPTY_REPORTS_SUMMARY: ReportsSummary = {
  totalRevenue: { value: 0, change: 0, trend: 'up' },
  closedDeals: { value: 0, change: 0, trend: 'up' },
  avgDealSize: { value: 0, change: 0, trend: 'up' },
  winRate: { value: 0, change: 0, trend: 'up' },
  topPerformers: [],
  pipelineStages: REPORT_STAGE_ORDER.map((stage) => ({
    id: stage,
    count: 0,
    value: 0,
    color: STAGE_COLOR_MAP[stage],
  })),
  monthlyData: [],
  recentReports: [],
}

export const buildReportsSummary = async ({
  supabase,
  teamId,
  reportType,
  range,
}: {
  supabase: SupabaseClient<Database>
  teamId: string
  reportType: ReportType
  range: DateRange
}): Promise<ReportsSummary> => {
  const now = new Date()
  const nowTs = now.getTime()
  const rangeDays = rangeToDays(range)
  const currentStart = new Date(nowTs - rangeDays * 24 * 60 * 60 * 1000)
  const previousStart = new Date(currentStart.getTime() - rangeDays * 24 * 60 * 60 * 1000)
  const sixMonthStart = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const queryStart = new Date(Math.min(previousStart.getTime(), sixMonthStart.getTime()))

  const [dealsResult, exportsResult] = await Promise.all([
    supabase
      .from('deals')
      .select('id, created_at, value, stage, user_id, probability')
      .eq('team_id', teamId)
      .gte('created_at', queryStart.toISOString())
      .lte('created_at', now.toISOString()),
    supabase
      .from('data_export_jobs')
      .select('id, entity, status, created_at, file_name')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(4),
  ])

  const allDeals = (dealsResult.data ?? []) as DealSummaryRow[]
  const exportJobs = (exportsResult.data ?? []) as ExportJobSummaryRow[]

  const currentDeals = allDeals.filter((deal) =>
    inRange(deal.created_at, currentStart.getTime(), nowTs)
  )
  const previousDeals = allDeals.filter((deal) =>
    inRange(deal.created_at, previousStart.getTime(), currentStart.getTime())
  )

  const currentMetrics = getMetricTotals(currentDeals, reportType)
  const previousMetrics = getMetricTotals(previousDeals, reportType)

  const ownerIds = Array.from(
    new Set(
      currentDeals
        .map((deal) => deal.user_id)
        .filter((value): value is string => typeof value === 'string' && value.length > 0)
    )
  )

  const usersResult = ownerIds.length
    ? await supabase.from('users').select('id, full_name, email').in('id', ownerIds)
    : { data: [] as UserSummaryRow[] }

  const userMap = new Map(
    ((usersResult.data ?? []) as UserSummaryRow[]).map((user) => [
      user.id,
      user.full_name || user.email || 'Atanmamis',
    ])
  )

  const performerSource =
    reportType === 'forecast'
      ? currentDeals.filter((deal) => !isClosed(deal.stage))
      : reportType === 'deals' || reportType === 'team'
        ? currentDeals
        : currentDeals.filter((deal) => isWon(deal.stage))

  const topPerformers = Array.from(
    performerSource.reduce((map, deal) => {
      const ownerId = deal.user_id || 'unknown'
      const ownerName = userMap.get(ownerId) ?? 'Atanmamis'
      const revenue = reportType === 'forecast' ? getWeightedValue(deal) : deal.value ?? 0
      const current = map.get(ownerId) ?? {
        id: ownerId,
        name: ownerName,
        avatar: getAvatar(ownerName),
        deals: 0,
        revenue: 0,
        target: 0,
      }

      const allOwnerDeals = currentDeals.filter((item) => item.user_id === ownerId)
      const wonOwnerDeals = allOwnerDeals.filter((item) => isWon(item.stage)).length
      const avgOwnerProbability =
        allOwnerDeals.length === 0
          ? 0
          : allOwnerDeals.reduce((sum, item) => sum + (item.probability ?? 50), 0) / allOwnerDeals.length

      map.set(ownerId, {
        ...current,
        deals: current.deals + 1,
        revenue: current.revenue + revenue,
        target:
          reportType === 'forecast'
            ? Math.round(avgOwnerProbability)
            : allOwnerDeals.length
              ? Math.round((wonOwnerDeals / allOwnerDeals.length) * 100)
              : 0,
      })

      return map
    }, new Map<string, ReportPerformer>()).values()
  )
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4)

  const pipelineSource =
    reportType === 'forecast' ? currentDeals.filter((deal) => !isClosed(deal.stage)) : currentDeals

  const pipelineStages: ReportPipelineStage[] = REPORT_STAGE_ORDER.map((stageId) => {
    const stageDeals = pipelineSource.filter((deal) => normalizeStage(deal.stage) === stageId)
    const stageValue = stageDeals.reduce((sum, deal) => {
      if (reportType === 'forecast') {
        return sum + getWeightedValue(deal)
      }
      return sum + (deal.value ?? 0)
    }, 0)

    return {
      id: stageId,
      count: stageDeals.length,
      value: Number(stageValue.toFixed(2)),
      color: STAGE_COLOR_MAP[stageId],
    }
  })

  const monthBuckets = Array.from({ length: 6 }).map((_, index) => {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1)
    const key = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`
    return {
      key,
      month: monthDate,
      revenue: 0,
      deals: 0,
    }
  })

  allDeals.forEach((deal) => {
    const ts = asTimestamp(deal.created_at)
    if (Number.isNaN(ts)) return

    const dealDate = new Date(ts)
    const key = `${dealDate.getFullYear()}-${String(dealDate.getMonth() + 1).padStart(2, '0')}`
    const bucket = monthBuckets.find((item) => item.key === key)
    if (!bucket) return

    if (reportType === 'sales') {
      if (!isWon(deal.stage)) return
      bucket.revenue += deal.value ?? 0
      bucket.deals += 1
      return
    }

    if (reportType === 'team') {
      if (!isClosed(deal.stage)) return
      bucket.revenue += deal.value ?? 0
      bucket.deals += 1
      return
    }

    if (reportType === 'forecast') {
      if (isClosed(deal.stage)) return
      bucket.revenue += getWeightedValue(deal)
      bucket.deals += 1
      return
    }

    bucket.revenue += deal.value ?? 0
    bucket.deals += 1
  })

  const monthlyData: ReportMonthlyPoint[] = monthBuckets.map((item) => ({
    month: item.month.toISOString(),
    revenue: Number(item.revenue.toFixed(2)),
    deals: item.deals,
  }))

  const recentReports: ReportRecentItem[] = exportJobs.map((job) => {
    const reportTypeFromEntity = ENTITY_TO_REPORT_TYPE(job.entity)
    const status = job.status === 'completed' ? 'ready' : 'generating'
    return {
      id: job.id,
      name: job.file_name || `${job.entity.toUpperCase()} export`,
      type: reportTypeFromEntity,
      date: job.created_at || new Date().toISOString(),
      status,
      downloadUrl: `/api/data/export?entity=${job.entity}&format=csv&delimiter=semicolon`,
    }
  })

  return {
    totalRevenue: toKpi(currentMetrics.totalRevenue, previousMetrics.totalRevenue),
    closedDeals: toKpi(currentMetrics.closedDeals, previousMetrics.closedDeals),
    avgDealSize: toKpi(currentMetrics.avgDealSize, previousMetrics.avgDealSize),
    winRate: toKpi(currentMetrics.winRate, previousMetrics.winRate),
    topPerformers,
    pipelineStages,
    monthlyData,
    recentReports,
  }
}
