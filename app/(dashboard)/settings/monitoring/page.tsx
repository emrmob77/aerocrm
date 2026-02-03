'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { useI18n } from '@/lib/i18n'

type MonitoringOverview = {
  uptimeSeconds: number
  webhookRate: string | null
  webhookTotal: number
  errorCount: number
  recentErrors: Array<{ id: string; level: string; message: string; created_at: string | null; source: string | null }>
  apiRequestsCount: number
  topEndpoints: Array<{ path: string; count: number }>
  apiSeries: Array<{ date: string; count: number }>
  webhookSeries: Array<{ date: string; successRate: number }>
  since: string
}

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

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await fetch('/api/monitoring/overview')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Monitoring verileri yuklenemedi.')
        }
        setOverview(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Monitoring verileri yuklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const cards = useMemo(() => {
    if (!overview) return []
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
        label: t('monitoring.cards.apiRequests'),
        value: overview.apiRequestsCount.toString(),
        hint: t('monitoring.hints.last7Days'),
      },
      {
        label: t('monitoring.cards.errorLogs'),
        value: overview.errorCount.toString(),
        hint: t('monitoring.hints.last10Errors'),
      },
    ]
  }, [overview, t])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('monitoring.title')}</h1>
        <p className="text-[#48679d] dark:text-gray-400">{t('monitoring.subtitle')}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">{t('monitoring.charts.apiTrend')}</h2>
          {overview?.apiSeries?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={overview.apiSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7ebf4" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[#48679d]">{t('monitoring.empty.noData')}</p>
          )}
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">{t('monitoring.charts.webhookTrend')}</h2>
          {overview?.webhookSeries?.length ? (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overview.webhookSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7ebf4" />
                  <XAxis dataKey="date" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip formatter={(value) => [`${value}%`, 'Basari']} />
                  <Bar dataKey="successRate" fill="#10B981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-[#48679d]">{t('monitoring.empty.noData')}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white mb-4">{t('monitoring.charts.topEndpoints')}</h2>
          <div className="space-y-3">
            {overview?.topEndpoints?.length ? (
              overview.topEndpoints.map((item) => (
                <div key={item.path} className="flex items-center justify-between text-sm">
                  <span className="text-[#0d121c] dark:text-white">{item.path}</span>
                  <span className="text-[#48679d] dark:text-gray-400">{item.count} istek</span>
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
                    <span>{log.source || 'unknown'}</span>
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
