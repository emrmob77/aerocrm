'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { useI18n } from '@/lib/i18n'
import { formatCurrency } from '@/components/deals'
import type {
  DateRange,
  ReportType,
  ReportsSummary,
  Trend,
} from '@/lib/reports/summary'

type ReportsPageClientProps = {
  initialSummary: ReportsSummary
  initialSummaryByType: Record<ReportType, ReportsSummary>
  initialReportType: ReportType
  initialDateRange: DateRange
  hasTeam: boolean
}

const getSummaryCacheKey = (reportType: ReportType, dateRange: DateRange) => `${reportType}:${dateRange}`

const reportTypeToExportEntity = (reportType: ReportType) => {
  if (reportType === 'forecast') return 'proposals'
  if (reportType === 'team') return 'deals'
  return reportType
}

const getTypeIcon = (reportType: ReportType) => {
  if (reportType === 'sales') return 'trending_up'
  if (reportType === 'deals') return 'handshake'
  if (reportType === 'team') return 'group'
  return 'query_stats'
}

const getTypeBadgeClass = (reportType: ReportType) => {
  if (reportType === 'sales') return 'bg-primary/10 text-primary'
  if (reportType === 'team') return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600'
  if (reportType === 'deals') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
  return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
}

const formatKpiChange = (change: number, trend: Trend) => {
  if (!Number.isFinite(change)) return '0'
  if (trend === 'down') return `${change.toFixed(1)}`
  return `+${change.toFixed(1)}`
}

export default function ReportsPageClient({
  initialSummary,
  initialSummaryByType,
  initialReportType,
  initialDateRange,
  hasTeam,
}: ReportsPageClientProps) {
  const { t, locale, formatNumber, formatDate } = useI18n()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const currency = locale === 'en' ? 'USD' : 'TRY'

  const [activeReport, setActiveReport] = useState<ReportType>(initialReportType)
  const [dateRange, setDateRange] = useState<DateRange>(initialDateRange)
  const [summary, setSummary] = useState<ReportsSummary>(initialSummary)
  const [summaryCache, setSummaryCache] = useState<Record<string, ReportsSummary>>(() => {
    const cache: Record<string, ReportsSummary> = {}
    ;(Object.entries(initialSummaryByType) as Array<[ReportType, ReportsSummary]>).forEach(([reportType, cachedSummary]) => {
      cache[getSummaryCacheKey(reportType, initialDateRange)] = cachedSummary
    })
    return cache
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setSummaryCache((previous) => {
      const next = { ...previous }
      ;(Object.entries(initialSummaryByType) as Array<[ReportType, ReportsSummary]>).forEach(([reportType, cachedSummary]) => {
        next[getSummaryCacheKey(reportType, initialDateRange)] = cachedSummary
      })
      return next
    })
  }, [initialDateRange, initialSummaryByType])

  const fetchSummary = useCallback(
    async (nextReportType: ReportType, nextDateRange: DateRange) => {
      if (!hasTeam) {
        setSummary(initialSummary)
        return
      }

      setIsLoading(true)
      try {
        const response = await fetch(`/api/reports/summary?type=${nextReportType}&range=${nextDateRange}`)
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload) {
          throw new Error((payload?.error as string | undefined) || t('api.errors.unexpected'))
        }

        const nextSummary = payload as ReportsSummary
        setSummaryCache((previous) => ({
          ...previous,
          [getSummaryCacheKey(nextReportType, nextDateRange)]: nextSummary,
        }))
        setSummary(nextSummary)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t('api.errors.unexpected'))
      } finally {
        setIsLoading(false)
      }
    },
    [hasTeam, initialSummary, t]
  )

  useEffect(() => {
    const cacheKey = getSummaryCacheKey(activeReport, dateRange)
    const cachedSummary = summaryCache[cacheKey]

    if (cachedSummary) {
      setSummary(cachedSummary)
      return
    }

    fetchSummary(activeReport, dateRange)
  }, [activeReport, dateRange, fetchSummary, summaryCache])

  const reportTypes = [
    { id: 'sales' as ReportType, label: t('reports.types.sales'), icon: 'trending_up' },
    { id: 'deals' as ReportType, label: t('reports.types.deals'), icon: 'handshake' },
    { id: 'team' as ReportType, label: t('reports.types.team'), icon: 'group' },
    { id: 'forecast' as ReportType, label: t('reports.types.forecast'), icon: 'query_stats' },
  ]

  const dateRanges = [
    { id: '7d' as DateRange, label: t('reports.ranges.days7') },
    { id: '30d' as DateRange, label: t('reports.ranges.days30') },
    { id: '90d' as DateRange, label: t('reports.ranges.days90') },
    { id: '12m' as DateRange, label: t('reports.ranges.months12') },
  ]

  const chartData = useMemo(
    () =>
      summary.monthlyData.map((item) => ({
        ...item,
        label: formatDate(item.month, { month: 'short' }),
      })),
    [formatDate, summary.monthlyData]
  )

  const maxRevenue = Math.max(1, ...chartData.map((item) => item.revenue))
  const pipelineTotal = summary.pipelineStages.reduce((sum, stage) => sum + stage.value, 0)
  const showStageBreakdown = activeReport === 'deals'
  const visibleRecentReports = useMemo(() => {
    const filtered = summary.recentReports.filter((report) => report.type === activeReport)
    if (filtered.length > 0) return filtered
    return summary.recentReports
  }, [activeReport, summary.recentReports])

  const kpiCards = [
    {
      key: 'totalRevenue',
      label: t('reports.kpi.totalRevenue'),
      icon: 'payments',
      iconClass: 'text-primary',
      value: formatCurrency(summary.totalRevenue.value, formatLocale, currency),
      change: summary.totalRevenue,
    },
    {
      key: 'closedDeals',
      label: t('reports.kpi.closedDeals'),
      icon: 'check_circle',
      iconClass: 'text-emerald-500',
      value: formatNumber(Math.round(summary.closedDeals.value)),
      change: summary.closedDeals,
    },
    {
      key: 'avgDealSize',
      label: t('reports.kpi.avgDeal'),
      icon: 'speed',
      iconClass: 'text-amber-500',
      value: formatCurrency(summary.avgDealSize.value, formatLocale, currency),
      change: summary.avgDealSize,
    },
    {
      key: 'winRate',
      label: t('reports.kpi.winRate'),
      icon: 'trophy',
      iconClass: 'text-primary',
      value: `${formatNumber(Math.round(summary.winRate.value))}%`,
      change: summary.winRate,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('reports.title')}</h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">{t('reports.subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/reports/funnel"
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 text-[#0d121c] dark:text-white rounded-lg text-sm font-bold hover:border-primary/30 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">monitoring</span>
            {locale === 'tr' ? 'Funnel' : 'Funnel'}
          </Link>
          <div className="flex bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 rounded-lg p-1">
            {dateRanges.map((range) => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range.id
                    ? 'bg-primary text-white'
                    : 'text-[#48679d] hover:text-[#0d121c] dark:hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          <Link
            href={`/reports/import-export?entity=${reportTypeToExportEntity(activeReport)}`}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 text-[#0d121c] dark:text-white rounded-lg text-sm font-bold hover:border-primary/30 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-lg">swap_vert</span>
            {t('reports.importExport')}
          </Link>
          <a
            href={`/api/data/export?entity=${reportTypeToExportEntity(activeReport)}&format=csv&delimiter=semicolon`}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            {t('reports.export')}
          </a>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {reportTypes.map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
              activeReport === report.id
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 text-[#48679d] hover:text-primary hover:border-primary/30'
            }`}
          >
            <span className="material-symbols-outlined text-lg">{report.icon}</span>
            {report.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#161e2b] p-4 text-sm text-[#48679d]">
          {t('common.loading')}
        </div>
      ) : null}

      {!hasTeam ? (
        <div className="rounded-xl border border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#161e2b] p-6 text-sm text-[#48679d]">
          {t('api.errors.teamMissing')}
        </div>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <div key={card.key} className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <p className="text-sm font-medium text-[#48679d] uppercase tracking-wider">{card.label}</p>
              <span className={`material-symbols-outlined ${card.iconClass}`}>{card.icon}</span>
            </div>
            <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mb-1">{card.value}</p>
            <div className={`flex items-center gap-1 text-sm font-semibold ${card.change.trend === 'down' ? 'text-red-500' : 'text-emerald-600'}`}>
              <span className="material-symbols-outlined text-sm">
                {card.change.trend === 'down' ? 'trending_down' : 'trending_up'}
              </span>
              {card.key === 'closedDeals'
                ? t('reports.kpi.changeThisMonth', {
                    value: formatKpiChange(card.change.change, card.change.trend),
                  })
                : t('reports.kpi.changeMonth', {
                    value: formatKpiChange(card.change.change, card.change.trend),
                  })}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('reports.charts.revenueTrend')}</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-[#48679d]">{t('reports.charts.revenueLabel')}</span>
              </div>
            </div>
          </div>
          <div className="h-64 flex items-end justify-between gap-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <span className="text-xs font-bold text-[#0d121c] dark:text-white mb-1">
                    {formatCurrency(item.revenue, formatLocale, currency)}
                  </span>
                  <div
                    className="w-full bg-primary/20 rounded-t-lg relative overflow-hidden transition-all hover:bg-primary/30"
                    style={{ height: `${(item.revenue / maxRevenue) * 180}px` }}
                  >
                    <div className="absolute bottom-0 w-full bg-primary rounded-t-lg" style={{ height: '100%' }} />
                  </div>
                </div>
                <span className="text-xs font-medium text-[#48679d]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-6">{t('reports.pipeline.title')}</h3>
          <div className="space-y-4">
            {summary.pipelineStages.map((stage) => (
              <div key={stage.id} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-[#0d121c] dark:text-white">{t(`stages.${stage.id}`)}</span>
                  <span className="text-sm font-bold text-[#48679d]">{t('reports.pipeline.deals', { count: stage.count })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${stage.color} rounded-full`}
                      style={{ width: `${pipelineTotal > 0 ? Math.min(100, (stage.value / pipelineTotal) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#48679d] w-20 text-right">
                    {formatCurrency(stage.value, formatLocale, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-[#e7ebf4] dark:border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-[#0d121c] dark:text-white">{t('reports.pipeline.total')}</span>
              <span className="text-lg font-extrabold text-primary">{formatCurrency(pipelineTotal, formatLocale, currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">
              {showStageBreakdown ? t('reports.types.deals') : t('reports.topPerformers.title')}
            </h3>
            <span className="text-xs font-bold text-[#48679d] uppercase">
              {showStageBreakdown ? t('reports.pipeline.title') : t('reports.topPerformers.thisMonth')}
            </span>
          </div>
          {showStageBreakdown ? (
            <div className="space-y-3">
              {summary.pipelineStages.length === 0 ? (
                <p className="text-sm text-[#48679d]">{t('monitoring.empty.noData')}</p>
              ) : (
                summary.pipelineStages.map((stage) => (
                  <div
                    key={stage.id}
                    className="flex items-center justify-between rounded-lg border border-[#e7ebf4] dark:border-gray-800 px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <span className="text-sm font-semibold text-[#0d121c] dark:text-white">{t(`stages.${stage.id}`)}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{formatCurrency(stage.value, formatLocale, currency)}</p>
                      <p className="text-xs text-[#48679d]">{t('reports.pipeline.deals', { count: stage.count })}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {summary.topPerformers.length === 0 ? (
                <p className="text-sm text-[#48679d]">{t('monitoring.empty.noData')}</p>
              ) : (
                summary.topPerformers.map((person, index) => (
                  <div key={person.id} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="size-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                      {person.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#0d121c] dark:text-white">{person.name}</span>
                        <span className="text-sm font-bold text-primary">{formatCurrency(person.revenue, formatLocale, currency)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#48679d] mb-1.5">
                        <span>{t('reports.pipeline.deals', { count: person.deals })}</span>
                        <span>{person.target}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(0, Math.min(100, person.target))}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('reports.recent.title')}</h3>
            <Link href="/reports/import-export" className="text-sm font-bold text-primary hover:underline">
              {t('reports.recent.viewAll')}
            </Link>
          </div>
          <div className="space-y-3">
            {visibleRecentReports.length === 0 ? (
              <p className="text-sm text-[#48679d]">{t('importExport.history.empty')}</p>
            ) : (
              visibleRecentReports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                >
                  <div className={`size-10 rounded-lg flex items-center justify-center ${getTypeBadgeClass(report.type)}`}>
                    <span className="material-symbols-outlined text-xl">{getTypeIcon(report.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#0d121c] dark:text-white group-hover:text-primary transition-colors truncate">
                      {report.name}
                    </p>
                    <p className="text-xs text-[#48679d]">
                      {formatDate(report.date, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {report.status === 'ready' ? (
                    <a
                      href={report.downloadUrl}
                      className="p-2 text-[#48679d] hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <span className="material-symbols-outlined">download</span>
                    </a>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-amber-600">
                      <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                      {t('reports.recent.generating')}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
          <Link
            href="/reports/import-export"
            className="w-full mt-4 py-3 border-2 border-dashed border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm font-bold text-[#48679d] hover:text-primary hover:border-primary/30 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {t('reports.recent.new')}
          </Link>
        </div>
      </div>
    </div>
  )
}
