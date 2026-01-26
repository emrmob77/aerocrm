'use client'

import { useState } from 'react'
import Link from 'next/link'

type FilterType = 'all' | 'success' | 'error'

// Webhook logs data
const logsData = [
  { id: 1, timestamp: '24 May 14:30:05', event: 'proposal.signed', url: 'https://api.partner-client.com/hooks/v1/event', status: 200, statusText: '200 OK', responseTime: '145ms', type: 'success' },
  { id: 2, timestamp: '24 May 14:28:12', event: 'proposal.viewed', url: 'https://webhook.site/b12-9c9a-4c22-b0e6', status: 200, statusText: '200 OK', responseTime: '98ms', type: 'success' },
  { id: 3, timestamp: '24 May 14:25:00', event: 'lead.created', url: 'https://crm-sync.io/api/v2/webhooks/incoming', status: 500, statusText: '500 Internal Error', responseTime: '1.2s', type: 'error' },
  { id: 4, timestamp: '24 May 14:20:45', event: 'proposal.signed', url: 'https://api.partner-client.com/hooks/v1/event', status: 200, statusText: '200 OK', responseTime: '132ms', type: 'success' },
  { id: 5, timestamp: '24 May 14:15:22', event: 'contract.updated', url: 'https://files.storage.com/wh/v2/update', status: 404, statusText: '404 Not Found', responseTime: '45ms', type: 'error' },
]

export default function WebhookLogsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [selectedLog, setSelectedLog] = useState<number | null>(null)

  const filteredLogs = logsData.filter(log => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'success') return log.type === 'success'
    if (activeFilter === 'error') return log.type === 'error'
    return true
  })

  const successCount = logsData.filter(l => l.type === 'success').length
  const errorCount = logsData.filter(l => l.type === 'error').length

  const getStatusClasses = (status: number) => {
    if (status >= 200 && status < 300) return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800'
    if (status >= 400 && status < 500) return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800'
  }

  return (
    <div className="-m-8">
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <span className="material-symbols-outlined text-sm">settings</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Configuration</span>
            </div>
            <h1 className="text-[#0f172a] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">Webhook Günlükleri</h1>
            <p className="text-slate-500 text-sm">Tüm webhook gönderimlerini ve durumlarını buradan gerçek zamanlı takip edin.</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/webhooks"
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
              <span className="material-symbols-outlined text-xl">arrow_back</span>
              <span>Konfigürasyona Dön</span>
            </Link>
            <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              <span className="material-symbols-outlined text-xl">refresh</span>
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-600 text-slate-700 dark:text-white text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                <span>Son 24 Saat</span>
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
                  Tümü
                </button>
                <button
                  onClick={() => setActiveFilter('success')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'success'
                      ? 'bg-white dark:bg-slate-700 text-primary font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Başarılı
                </button>
                <button
                  onClick={() => setActiveFilter('error')}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    activeFilter === 'error'
                      ? 'bg-white dark:bg-slate-700 text-primary font-bold shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Hatalı
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {successCount * 249} Success
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 border border-rose-200 dark:border-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                {errorCount * 6} Errors
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
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Zaman Damgası</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Olay</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hedef URL</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Durum</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Yanıt Süresi</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-center w-24">Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`group hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer ${
                      index % 2 === 1 ? 'bg-slate-50/30 dark:bg-slate-900/20' : ''
                    }`}
                    onClick={() => setSelectedLog(selectedLog === log.id ? null : log.id)}
                  >
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{log.timestamp}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-primary border border-blue-100 dark:border-blue-800">
                        {log.event}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-slate-500 truncate max-w-[300px] block">{log.url}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusClasses(log.status)}`}>
                        {log.statusText}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-sm text-slate-600 dark:text-slate-400">{log.responseTime}</td>
                    <td className="px-6 py-4 text-center">
                      <button className={`p-1.5 rounded-md transition-all ${
                        log.type === 'error' 
                          ? 'hover:bg-rose-100 dark:hover:bg-rose-900/20 text-rose-600' 
                          : 'hover:bg-primary/10 hover:text-primary text-slate-400'
                      }`}>
                        <span className="material-symbols-outlined text-xl">visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-[#e2e8f0] dark:border-slate-700 flex items-center justify-between">
            <span className="text-sm text-slate-500">Toplam 1,257 kayıt gösteriliyor</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium disabled:opacity-50" disabled>
                Geri
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-sm font-bold">1</button>
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">2</button>
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">3</button>
              <button className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700">İleri</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
