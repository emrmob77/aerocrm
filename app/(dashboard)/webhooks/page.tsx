'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'
import { useI18n } from '@/lib/i18n'

type WebhookRow = {
  id: string
  url: string
  secret_key: string
  events: string[]
  active: boolean
  last_triggered_at: string | null
  success_count: number
  failure_count: number
}

const buildEventGroups = (t: (key: string) => string) => [
  {
    title: t('webhooks.events.proposals'),
    icon: 'description',
    options: [
      { id: 'proposal.viewed', label: t('webhooks.eventLabels.proposalViewed') },
      { id: 'proposal.signed', label: t('webhooks.eventLabels.proposalSigned') },
      { id: 'proposal.expired', label: t('webhooks.eventLabels.proposalExpired') },
      { id: 'proposal.sent', label: t('webhooks.eventLabels.proposalSent') },
    ],
  },
  {
    title: t('webhooks.events.deals'),
    icon: 'handshake',
    options: [
      { id: 'deal.created', label: t('webhooks.eventLabels.dealCreated') },
      { id: 'deal.won', label: t('webhooks.eventLabels.dealWon') },
      { id: 'deal.lost', label: t('webhooks.eventLabels.dealLost') },
    ],
  },
]

const buildEventState = (events: string[], groups: Array<{ options: Array<{ id: string }> }>) => {
  const state: Record<string, boolean> = {}
  groups.forEach((group) => {
    group.options.forEach((option) => {
      state[option.id] = events.includes(option.id)
    })
  })
  return state
}

const buildSettingsMenu = (t: (key: string) => string) => [
  { icon: 'person', label: t('settings.sections.profile.title'), href: '/settings', active: false },
  { icon: 'group', label: t('settings.sections.team.title'), href: '/settings/team', active: false },
  { icon: 'api', label: t('nav.webhooks'), href: '/webhooks', active: true },
  { icon: 'security', label: t('settings.sections.developer.title'), href: '/settings/developer', active: false },
]

export default function WebhooksPage() {
  const { t } = useI18n()
  const eventGroups = useMemo(() => buildEventGroups(t), [t])
  const settingsMenu = useMemo(() => buildSettingsMenu(t), [t])
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([])
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [targetUrl, setTargetUrl] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [active, setActive] = useState(true)
  const [events, setEvents] = useState<Record<string, boolean>>(() => buildEventState([], eventGroups))
  const [isSaving, setIsSaving] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    const fetchWebhooks = async () => {
      setIsLoading(true)
      const response = await fetch('/api/webhooks')
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        toast.error(payload?.error || 'Webhooklar getirilemedi.')
        setIsLoading(false)
        return
      }
      const list = (payload?.webhooks ?? []) as WebhookRow[]
      setWebhooks(list)
      if (list.length > 0) {
        const first = list[0]
        setSelectedWebhookId(first.id)
        setTargetUrl(first.url)
        setSecretKey(first.secret_key)
        setActive(first.active)
        setEvents(buildEventState(first.events, eventGroups))
      }
      setIsLoading(false)
    }

    fetchWebhooks()
  }, [])

  const toggleEvent = (key: string) => {
    setEvents((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const selectAllEvents = () => {
    const next: Record<string, boolean> = {}
    eventGroups.forEach((group) => {
      group.options.forEach((option) => {
        next[option.id] = true
      })
    })
    setEvents(next)
  }

  const resetForm = () => {
    setSelectedWebhookId(null)
    setTargetUrl('')
    setSecretKey('')
    setActive(true)
    setEvents(buildEventState([], eventGroups))
  }

  const handleCancel = () => {
    if (!selectedWebhookId) {
      resetForm()
      return
    }
    const webhook = webhooks.find((item) => item.id === selectedWebhookId)
    if (webhook) {
      handleSelectWebhook(webhook)
      return
    }
    resetForm()
  }

  const handleSelectWebhook = (webhook: WebhookRow) => {
    setSelectedWebhookId(webhook.id)
    setTargetUrl(webhook.url)
    setSecretKey(webhook.secret_key)
    setActive(webhook.active)
    setEvents(buildEventState(webhook.events, eventGroups))
  }

  const handleSave = async () => {
    if (isSaving) return
    const trimmedUrl = targetUrl.trim()
    if (!trimmedUrl) {
      toast.error('Webhook URL zorunludur.')
      return
    }
    const selectedEvents = Object.entries(events)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key)
    if (selectedEvents.length === 0) {
      toast.error(t('webhooks.errors.selectEvent'))
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(
        selectedWebhookId ? `/api/webhooks/${selectedWebhookId}` : '/api/webhooks',
        {
          method: selectedWebhookId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedUrl, events: selectedEvents, active }),
        }
      )
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Webhook kaydedilemedi.')
      }
      const saved = payload?.webhook as WebhookRow
      if (selectedWebhookId) {
        setWebhooks((prev) => prev.map((item) => (item.id === saved.id ? saved : item)))
      } else {
        setWebhooks((prev) => [saved, ...prev])
        setSelectedWebhookId(saved.id)
      }
      setSecretKey(saved.secret_key)
      toast.success('Webhook kaydedildi.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Webhook kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTest = async () => {
    if (!selectedWebhookId) {
      toast.error(t('webhooks.errors.selectWebhook'))
      return
    }
    if (isTesting) return
    setIsTesting(true)
    try {
      const response = await fetch(`/api/webhooks/${selectedWebhookId}/test`, { method: 'POST' })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || t('webhooks.errors.testFailed'))
      }
      const updated = payload?.webhook as WebhookRow
      setWebhooks((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      toast.success(t('webhooks.success.testSent'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('webhooks.errors.testFailed'))
    } finally {
      setIsTesting(false)
    }
  }

  const handleCopySecret = async () => {
    if (!secretKey) return
    await navigator.clipboard.writeText(secretKey)
    toast.success(t('webhooks.success.secretCopied'))
  }

  const formatLastTrigger = (value: string | null) => {
    if (!value) return t('webhooks.emptyValue')
    return formatRelativeTime(value, t)
  }

  return (
    <div className="-m-8">
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-[#e2e8f0] dark:border-slate-700">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-4 px-2">{t('settings.title')}</h3>
            <nav className="space-y-1">
              {settingsMenu.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.active
                      ? 'text-primary bg-primary/5 border border-primary/10 font-bold'
                      : 'text-[#64748b] hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">visibility</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">{t('webhooks.title')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <Link 
                href="/webhooks/logs"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-600 text-[#0f172a] dark:text-white text-sm font-bold rounded-lg shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">history</span>
                {t('webhooks.logs')}
              </Link>
              <button
                onClick={resetForm}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md transition-all"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                Yeni Webhook Ekle
              </button>
            </div>
          </div>

          {/* Webhooks Table */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#e2e8f0] dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-[#e2e8f0] dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Hedef URL</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Son Tetikleme</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">{t('webhooks.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-700">
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-sm text-[#64748b]">{t('webhooks.loading')}</td>
                    </tr>
                  ) : webhooks.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-6 text-sm text-[#64748b]">{t('webhooks.empty')}</td>
                    </tr>
                  ) : webhooks.map((webhook) => (
                    <tr 
                      key={webhook.id}
                      className={`transition-colors cursor-pointer ${
                        selectedWebhookId === webhook.id
                          ? 'bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-l-primary'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                      }`}
                      onClick={() => {
                        handleSelectWebhook(webhook)
                      }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#0f172a] dark:text-white max-w-xs truncate">
                        {webhook.url}
                      </td>
                      <td className="px-6 py-4">
                        {webhook.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-[#64748b]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#64748b]">
                        {formatLastTrigger(webhook.last_triggered_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline text-sm font-bold">{t('common.edit')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Webhook Details Form */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-[#e2e8f0] dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900">
              <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">{t('webhooks.detailsTitle')}</h2>
              <p className="text-sm text-[#64748b]">{t('webhooks.detailsSubtitle')}</p>
            </div>

            <div className="p-6 space-y-8">
              {/* URL and Secret Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#0f172a] dark:text-white">Hedef URL</label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://api.domain.com/webhook"
                    className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-600 rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400 text-[#0f172a] dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#0f172a] dark:text-white">Gizli Anahtar (Secret Key)</label>
                  <div className="relative">
                    <input
                      type="password"
                      readOnly
                      value={secretKey ? '••••••••••••••••••••••••' : t('webhooks.secretPlaceholder')}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-600 rounded-lg text-sm pr-10 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary text-[#64748b]"
                    />
                    <button
                      onClick={handleCopySecret}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#64748b] hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer text-sm text-[#64748b]">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => setActive((prev) => !prev)}
                  className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                />
                Webhook aktif
              </label>

              {/* Events */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">Olaylar (Events)</h3>
                  <button 
                    onClick={selectAllEvents}
                    className="text-xs font-bold text-primary hover:underline transition-colors"
                  >
                    {t('webhooks.selectAll')}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Proposal Events */}
                  {eventGroups.map((group) => (
                    <div
                      key={group.title}
                      className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 space-y-4"
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-[#e2e8f0] dark:border-slate-700">
                        <span className="material-symbols-outlined text-primary text-[20px]">{group.icon}</span>
                        <h4 className="text-sm font-bold text-[#0f172a] dark:text-white">{group.title}</h4>
                      </div>
                      <div className="space-y-3">
                        {group.options.map((option) => (
                          <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={events[option.id] ?? false}
                              onChange={() => toggleEvent(option.id)}
                              className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                            />
                            <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors">
                              {option.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800 border-t border-[#e2e8f0] dark:border-slate-700 flex items-center justify-between">
              <button
                onClick={handleTest}
                disabled={isTesting || !selectedWebhookId}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-[#e2e8f0] dark:border-slate-600 text-[#0f172a] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[20px]">send</span>
                {isTesting ? t('webhooks.testing') : t('webhooks.test')}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-[#64748b] hover:text-[#0f172a] dark:hover:text-white text-sm font-bold transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-8 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all disabled:opacity-60"
                >
                  {isSaving ? 'Kaydediliyor' : 'Kaydet'}
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
