'use client'

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'
import { useI18n } from '@/lib/i18n'

type FilterType = 'all' | 'success' | 'error'

type WebhookLog = {
  id: string
  webhook_id: string
  event_type: string
  webhook_url: string | null
  response_status: number | null
  response_body: string | null
  duration_ms: number | null
  success: boolean
  error_message: string | null
  created_at: string
}

const formatResponseTime = (value: number | null, t: (key: string) => string) => {
  if (value === null || Number.isNaN(value)) {
    return t('webhooks.logs.na')
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}s`
  }
  return `${Math.round(value)}ms`
}

const formatStatusText = (log: WebhookLog, t: (key: string) => string) => {
  if (log.response_status != null) {
    return log.response_body ? `${log.response_status} ${log.response_body}` : `${log.response_status}`
  }
  if (log.success) {
    return t('webhooks.logs.statusSuccess')
  }
  return t('webhooks.logs.statusError')
}

const getStatusClasses = (status: number | null, success: boolean) => {
  if (status === null) {
    return success
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
  }
  if (status >= 200 && status < 300) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
  }
  if (status >= 400 && status < 500) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
  }
  return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
}

export default function WebhookLogsPage() {
  const { t } = useI18n()
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedLog, setSelectedLog] = useState<string | null>(null)
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setIsRefreshing(true)
    const response = await fetch('/api/webhooks/logs')
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || t('webhooks.logs.errors.fetchFailed'))
      setIsRefreshing(false)
      return
    }
    setLogs((payload?.logs ?? []) as WebhookLog[])
    setIsRefreshing(false)
  }, [t])

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await fetchLogs()
      setIsLoading(false)
    }
    load()
  }, [fetchLogs])

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'success') return log.success
      if (activeFilter === 'error') return !log.success
      return true
    })
  }, [logs, activeFilter])

  const successCount = logs.filter((log) => log.success).length
  const errorCount = logs.filter((log) => !log.success).length

  const handleRetry = async (log: WebhookLog) => {
    if (retryingId) return
    setRetryingId(log.id)
    try {
      const response = await fetch(`/api/webhooks/logs/${log.id}/retry`, { method: 'POST' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || t('webhooks.logs.errors.retryFailed'))
        setRetryingId(null)
        return
      }
      const newLog = payload?.log as WebhookLog
      setLogs((prev) => [newLog, ...prev.filter((item) => item.id !== log.id)])
      toast.success(t('webhooks.logs.success.retried'))
      setRetryingId(null)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('webhooks.logs.errors.retryFailed'))
      setRetryingId(null)
    }
  }

  return (
    <div className="-m-8">
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <span className="material-symbols-outlined text-sm">settings</span>
              <span className="text-xs font-semibold uppercase tracking-wider">{t('webhooks.logs.breadcrumb')}</span>
            </div>
            <h1 className="text-[#0f172a] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">{t('webhooks.logs.title')}</h1>
            <p className="text-slate-500 text-sm">{t('webhooks.logs.subtitle')}</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/webhooks"
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span>{t('webhooks.logs.back')}</span>
            </Link>
            <button
              onClick={fetchLogs}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-xl">refresh</span>
              <span>{isRefreshing ? t('webhooks.logs.refreshing') : t('webhooks.logs.refresh')}</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-600 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                <span>{t('webhooks.logs.last24h')}</span>
                <span className="material-symbols-outlined text-lg">expand_more</span>
              </button>
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-white dark:bg-slate-700 text-primary font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t('webhooks.logs.filters.all')}
                </button>
                <button
                  onClick={() => setActiveFilter('success')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'success'
                      ? 'bg-white dark:bg-slate-700 text-primary font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t('webhooks.logs.filters.success')}
                </button>
                <button
                  onClick={() => setActiveFilter('error')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'error'
                      ? 'bg-white dark:bg-slate-700 text-primary font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {t('webhooks.logs.filters.error')}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {t('webhooks.logs.summary.success', { count: successCount })}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {t('webhooks.logs.summary.error', { count: errorCount })}
              </span>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-[#e2e8f0] dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">{t('webhooks.logs.table.timestamp')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Olay</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hedef URL</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Durum</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">{t('webhooks.logs.table.duration')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredLogs.map((log, index) => (
                  <Fragment key={log.id}>
                    <tr
                      className={`group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${
                        index % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-900/20' : ''
                      }`}
                      onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                    >
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        {formatRelativeTime(log.created_at, t)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-primary border border-blue-100 dark:border-blue-800">
                          {log.event_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs text-slate-500 truncate max-w-[300px] block">
                          {log.webhook_url ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusClasses(
                            log.response_status,
                            log.success
                          )}`}
                        >
                          {formatStatusText(log, t)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-sm text-slate-600 dark:text-slate-400">
                        {formatResponseTime(log.duration_ms, t)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {log.success ? (
                          <button
                            className="p-1.5 rounded-md transition-all hover:bg-primary/10 hover:text-primary text-slate-400"
                            onClick={(event) => {
                              event.stopPropagation()
                              setSelectedLog(selectedLog === log.id ? null : log.id)
                            }}
                          >
                            <span className="material-symbols-outlined text-xl">info</span>
                          </button>
                        ) : (
                          <button
                            className="p-1.5 rounded-md transition-all hover:bg-rose-100 dark:hover:bg-rose-900/20 text-rose-600 disabled:opacity-60"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleRetry(log)
                            }}
                            disabled={retryingId === log.id}
                          >
                            <span className="material-symbols-outlined text-xl">
                              {retryingId === log.id ? 'autorenew' : 'replay'}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                    {selectedLog === log.id && (
                      <tr className="bg-slate-50 dark:bg-slate-900/40">
                        <td className="px-6 py-4 text-sm text-slate-500" colSpan={6}>
                          <div className="flex flex-wrap items-center gap-6">
                            <div>
                              <p className="text-[11px] uppercase tracking-wider text-slate-400">Zaman</p>
                              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                {formatRelativeTime(log.created_at, t)}
                              </p>
                            </div>
                            {log.error_message && (
                              <div className="min-w-[240px]">
                                <p className="text-[11px] uppercase tracking-wider text-slate-400">Hata</p>
                                <p className="text-sm font-semibold text-rose-600">{log.error_message}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                {!isLoading && filteredLogs.length === 0 && (
                  <tr>
                    <td className="px-6 py-10 text-center text-sm text-slate-500" colSpan={6}>
                      {t('webhooks.logs.empty')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500">{t('webhooks.logs.total', { count: logs.length })}</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium disabled:opacity-50" disabled>
                Geri
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-bold">1</button>
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">2</button>
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">3</button>
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">
                {t('webhooks.logs.next')}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
