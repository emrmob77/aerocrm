'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useI18n } from '@/lib/i18n'

type MonitoringOverview = {
  uptimeSeconds: number
  webhookRate: string | null
  webhookTotal: number
  webhookAvgDurationMs: number | null
  errorCount: number
  recentErrors: Array<{ id: string; level: string; message: string; created_at: string | null; source: string | null }>
  apiRequestsCount: number
  apiErrorRate: string | null
  apiAvgDurationMs: number | null
  topEndpoints: Array<{ path: string; count: number }>
  apiSeries: Array<{ date: string; count: number }>
  webhookSeries: Array<{ date: string; successRate: number }>
  rateLimit: { enabled: boolean; max: number | null; windowSeconds: number | null }
  since: string
}

const MonitoringCharts = dynamic(
  () => import('@/components/monitoring/MonitoringCharts').then((mod) => mod.MonitoringCharts),
  { ssr: false }
)

const formatUptime = (seconds: number) => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return `${days}g ${hours}s ${minutes}d`
}

export default function MonitoringSettingsPage() {
  const { t, formatDate } = useI18n()
  const [overview, setOverview] = useState<MonitoringOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await fetch('/api/monitoring/overview')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || t('monitoring.errors.loadFailed'))
        }
        setOverview(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : t('monitoring.errors.loadFailed'))
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const handleExport = async () => {
    setExporting(true)
    setError(null)
    try {
      const response = await fetch('/api/monitoring/export')
      if (!response.ok) {
        const payload = await response.json().catch(() => null)
        throw new Error(payload?.error || t('monitoring.errors.exportFailed'))
      }
      const blob = await response.blob()
      const disposition = response.headers.get('Content-Disposition')
      const match = disposition?.match(/filename=\"(.+)\"/)
      const filename = match?.[1] || 'system-health.csv'
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('monitoring.errors.exportFailed'))
    } finally {
      setExporting(false)
    }
  }

  const cards = useMemo(() => {
    if (!overview) return []
    const formatMs = (value: number | null) =>
      value === null ? t('monitoring.empty.noData') : `${value} ${t('monitoring.units.ms')}`
    return [
      {
        label: t('monitoring.cards.uptime'),
        value: formatUptime(overview.uptimeSeconds),
        hint: `${t('monitoring.hints.last7Days')}: ${formatDate(overview.since, { dateStyle: 'medium' })}`,
      },
      {
        label: t('monitoring.cards.webhookSuccess'),
        value: overview.webhookRate || t('monitoring.empty.noData'),
        hint: t('monitoring.hints.attempts', { count: overview.webhookTotal }),
      },
      {
        label: t('monitoring.cards.webhookLatency'),
        value: formatMs(overview.webhookAvgDurationMs),
        hint: t('monitoring.hints.last7Days'),
      },
      {
        label: t('monitoring.cards.apiRequests'),
        value: overview.apiRequestsCount.toString(),
        hint: t('monitoring.hints.last7Days'),
      },
      {
        label: t('monitoring.cards.apiAvgResponse'),
        value: formatMs(overview.apiAvgDurationMs),
        hint: t('monitoring.hints.last7Days'),
      },
      {
        label: t('monitoring.cards.apiErrorRate'),
        value: overview.apiErrorRate || t('monitoring.empty.noData'),
        hint: t('monitoring.hints.last7Days'),
      },
      {
        label: t('monitoring.cards.errorLogs'),
        value: overview.errorCount.toString(),
        hint: t('monitoring.hints.last10Errors'),
      },
    ]
  }, [formatDate, overview, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('monitoring.title')}</h1>
          <p className="text-[#48679d] dark:text-gray-400">{t('monitoring.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="btn-secondary btn-md"
        >
          {exporting ? t('monitoring.actions.exporting') : t('monitoring.actions.export')}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5">
            <p className="text-sm text-[#48679d] dark:text-gray-400">{card.label}</p>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white mt-2">{card.value}</p>
            <p className="text-xs text-[#93a1b8] mt-2">{card.hint}</p>
          </div>
        ))}
      </div>

      <MonitoringCharts
        apiSeries={overview?.apiSeries || []}
        webhookSeries={overview?.webhookSeries || []}
        noDataLabel={t('monitoring.empty.noData')}
        apiTrendTitle={t('monitoring.charts.apiTrend')}
        webhookTrendTitle={t('monitoring.charts.webhookTrend')}
        successLabel={t('monitoring.charts.successLabel')}
      />

      {overview?.rateLimit && (
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-4">
          <p className="text-xs text-[#48679d] dark:text-gray-400">
            {overview.rateLimit.enabled && overview.rateLimit.max && overview.rateLimit.windowSeconds
              ? t('monitoring.rateLimit.limited', {
                  count: overview.rateLimit.max,
                  window: overview.rateLimit.windowSeconds >= 60
                    ? `${Math.round(overview.rateLimit.windowSeconds / 60)}m`
                    : `${overview.rateLimit.windowSeconds}s`,
                })
              : t('monitoring.rateLimit.unlimited')}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">{t('monitoring.charts.topEndpoints')}</h2>
          <div className="space-y-3">
            {overview?.topEndpoints?.length ? (
              overview.topEndpoints.map((item) => (
                <div key={item.path} className="flex items-center justify-between text-sm">
                  <span className="text-[#0d121c] dark:text-white">{item.path}</span>
                  <span className="text-[#48679d] dark:text-gray-400">
                    {t('monitoring.labels.requests', { count: item.count })}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#48679d]">{t('monitoring.empty.noData')}</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">{t('monitoring.charts.recentErrors')}</h2>
          <div className="space-y-3">
            {overview?.recentErrors?.length ? (
              overview.recentErrors.map((log) => (
                <div key={log.id} className="border border-[#e7ebf4] dark:border-gray-800 rounded-lg p-3">
                  <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{log.message}</p>
                  <div className="text-xs text-[#48679d] dark:text-gray-400 mt-1 flex items-center justify-between">
                    <span>{log.source || t('common.unknown')}</span>
                    <span>{log.created_at ? formatDate(log.created_at, { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#48679d]">{t('monitoring.empty.noErrors')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
