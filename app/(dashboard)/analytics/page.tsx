import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Proposal, ProposalView } from '@/types'

export const revalidate = 0

const formatNumber = (value: number) => new Intl.NumberFormat('tr-TR').format(value)

const pad = (value: number) => value.toString().padStart(2, '0')

const formatDuration = (seconds: number) => {
  if (!seconds || seconds <= 0) return '0:00'
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remainingSeconds = totalSeconds % 60
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}:${pad(remainingMinutes)}:${pad(remainingSeconds)}`
  }
  return `${minutes}:${pad(remainingSeconds)}`
}

const getTimeAgo = (dateString: string) => {
  const diff = Date.now() - new Date(dateString).getTime()
  if (Number.isNaN(diff)) return dateString
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'şimdi'
  if (minutes < 60) return `${minutes} dakika önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

const buildTrend = (current: number, previous: number) => {
  if (previous === 0) {
    if (current === 0) {
      return { value: '0% değişim', type: 'neutral' as const, color: 'text-[#48679d]' }
    }
    return { value: 'Yeni', type: 'up' as const, color: 'text-[#07883b]' }
  }
  const diff = Math.round(((current - previous) / previous) * 100)
  if (diff === 0) {
    return { value: '0% değişim', type: 'neutral' as const, color: 'text-[#48679d]' }
  }
  if (diff > 0) {
    return { value: `+${diff}% vs önceki dönem`, type: 'up' as const, color: 'text-[#07883b]' }
  }
  return { value: `${diff}% vs önceki dönem`, type: 'down' as const, color: 'text-[#e73908]' }
}

const buildDurationTrend = (current: number, previous: number) => {
  if (!previous && !current) {
    return { value: 'Veri yok', type: 'neutral' as const, color: 'text-[#48679d]' }
  }
  if (!previous && current) {
    return { value: 'Yeni', type: 'up' as const, color: 'text-[#07883b]' }
  }
  const diff = current - previous
  if (diff === 0) {
    return { value: 'Değişim yok', type: 'neutral' as const, color: 'text-[#48679d]' }
  }
  if (diff < 0) {
    return { value: `${formatDuration(Math.abs(diff))} daha hızlı`, type: 'up' as const, color: 'text-[#07883b]' }
  }
  return { value: `${formatDuration(diff)} daha yavaş`, type: 'down' as const, color: 'text-[#e73908]' }
}

const averageDuration = (views: ProposalView[]) => {
  const durations = views
    .map((view) => view.duration_seconds ?? 0)
    .filter((value) => typeof value === 'number' && value > 0)
  if (durations.length === 0) return 0
  const total = durations.reduce((sum, value) => sum + value, 0)
  return total / durations.length
}

const parseBlockEntries = (blocks: ProposalView['blocks_viewed']) => {
  const entries: Array<{ name: string; duration: number }> = []
  if (!blocks) return entries

  if (Array.isArray(blocks)) {
    for (const item of blocks) {
      if (!item) continue
      if (typeof item === 'string') {
        entries.push({ name: item, duration: 0 })
        continue
      }
      if (typeof item === 'object') {
        const name =
          (item as { name?: string; label?: string; title?: string; block?: string }).name ||
          (item as { label?: string }).label ||
          (item as { title?: string }).title ||
          (item as { block?: string }).block
        const duration = Number(
          (item as { duration_seconds?: number; seconds?: number; time?: number; duration?: number }).duration_seconds ??
            (item as { seconds?: number }).seconds ??
            (item as { time?: number }).time ??
            (item as { duration?: number }).duration ??
            0
        )
        if (name) entries.push({ name, duration })
      }
    }
    return entries
  }

  if (typeof blocks === 'object') {
    for (const [key, value] of Object.entries(blocks)) {
      if (typeof value === 'number') {
        entries.push({ name: key, duration: value })
        continue
      }
      if (value && typeof value === 'object') {
        const duration = Number(
          (value as { duration_seconds?: number; seconds?: number; time?: number }).duration_seconds ??
            (value as { seconds?: number }).seconds ??
            (value as { time?: number }).time ??
            0
        )
        entries.push({ name: key, duration })
      }
    }
  }

  return entries
}

const buildBlockInteractions = (views: ProposalView[]) => {
  const stats = new Map<string, { total: number; count: number }>()

  for (const view of views) {
    const entries = parseBlockEntries(view.blocks_viewed)
    for (const entry of entries) {
      if (!entry.name) continue
      const safeDuration = Number.isFinite(entry.duration) ? entry.duration : 0
      const current = stats.get(entry.name) ?? { total: 0, count: 0 }
      stats.set(entry.name, {
        total: current.total + safeDuration,
        count: current.count + 1,
      })
    }
  }

  const items = Array.from(stats.entries()).map(([name, value]) => {
    const average = value.count > 0 ? value.total / value.count : 0
    return { name, average }
  })

  items.sort((a, b) => b.average - a.average)
  const topItems = items.slice(0, 4)
  const max = topItems.length ? topItems[0].average : 0

  return topItems.map((item) => {
    const percentage = max ? Math.round((item.average / max) * 100) : 0
    const ratio = percentage / 100
    const opacityClass = ratio > 0.8 ? 'bg-primary' : ratio > 0.6 ? 'bg-primary/70' : ratio > 0.4 ? 'bg-primary/50' : 'bg-primary/30'
    return {
      name: item.name,
      time: formatDuration(item.average),
      percentage,
      opacity: opacityClass,
    }
  })
}

const rangeOptions = [
  { days: 7, label: 'Son 7 Gün' },
  { days: 30, label: 'Son 30 Gün' },
  { days: 90, label: 'Son 90 Gün' },
  { days: 180, label: 'Son 180 Gün' },
]

const getRangeDays = (value?: string) => {
  const parsed = Number(value)
  const allowed = rangeOptions.map((option) => option.days)
  if (Number.isFinite(parsed) && allowed.includes(parsed)) {
    return parsed
  }
  return 30
}

const formatDate = (date: Date) =>
  date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10)

const parseDateInput = (value?: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams?: { range?: string; from?: string; to?: string }
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const now = new Date()
  const rangeDays = getRangeDays(searchParams?.range)
  const fromParam = parseDateInput(searchParams?.from)
  const toParam = parseDateInput(searchParams?.to)

  let rangeStart = new Date(now)
  let rangeEnd = new Date(now)
  let isCustomRange = false

  if (fromParam && toParam) {
    isCustomRange = true
    const start = new Date(fromParam)
    const end = new Date(toParam)
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
    if (start.getTime() <= end.getTime()) {
      rangeStart = start
      rangeEnd = end
    } else {
      rangeStart = end
      rangeEnd = start
    }
  } else {
    rangeStart.setDate(now.getDate() - rangeDays)
    rangeEnd = new Date(now)
  }

  const rangeDurationMs = rangeEnd.getTime() - rangeStart.getTime()
  const rangeDurationDays = Math.max(1, Math.ceil(rangeDurationMs / (1000 * 60 * 60 * 24)) + 1)

  const prevRangeStart = new Date(rangeStart)
  prevRangeStart.setDate(rangeStart.getDate() - rangeDurationDays)
  const prevRangeEnd = new Date(rangeEnd)
  prevRangeEnd.setDate(rangeEnd.getDate() - rangeDurationDays)

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#ced8e9] dark:border-[#2a3441] bg-white dark:bg-[#101722] p-10 text-center">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white">Oturum bulunamadı</h2>
          <p className="text-sm text-[#48679d] dark:text-[#a1b0cb]">Analitik verileri görmek için giriş yapın.</p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  const teamId = profile?.team_id

  if (!teamId) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-[#ced8e9] dark:border-[#2a3441] bg-white dark:bg-[#101722] p-10 text-center">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white">Takım bilgisi bulunamadı</h2>
          <p className="text-sm text-[#48679d] dark:text-[#a1b0cb]">Lütfen yönetici ile iletişime geçin.</p>
        </div>
      </div>
    )
  }

  const { data: proposalsData } = await supabase
    .from('proposals')
    .select('id, title, status, created_at, signed_at, updated_at')
    .eq('team_id', teamId)
    .gte('created_at', prevRangeStart.toISOString())
    .lte('created_at', rangeEnd.toISOString())
    .order('created_at', { ascending: false })

  const proposals = (proposalsData ?? []) as Proposal[]
  const proposalIds = proposals.map((proposal) => proposal.id)

  const { data: viewsData } = proposalIds.length
    ? await supabase
        .from('proposal_views')
        .select('proposal_id, duration_seconds, blocks_viewed, created_at')
        .in('proposal_id', proposalIds)
        .gte('created_at', prevRangeStart.toISOString())
        .lte('created_at', rangeEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(200)
    : { data: [] }

  const views = (viewsData ?? []) as ProposalView[]

  const lastRangeProposals = proposals.filter((proposal) => {
    const createdAt = new Date(proposal.created_at)
    return createdAt >= rangeStart && createdAt <= rangeEnd
  })
  const prevRangeProposals = proposals.filter(
    (proposal) => {
      const createdAt = new Date(proposal.created_at)
      return createdAt < rangeStart && createdAt >= prevRangeStart && createdAt <= prevRangeEnd
    }
  )

  const lastRangeViews = views.filter((view) => {
    const createdAt = new Date(view.created_at)
    return createdAt >= rangeStart && createdAt <= rangeEnd
  })
  const prevRangeViews = views.filter(
    (view) => {
      const createdAt = new Date(view.created_at)
      return createdAt < rangeStart && createdAt >= prevRangeStart && createdAt <= prevRangeEnd
    }
  )

  const isSentStatus = (status?: string | null) =>
    status === 'sent' || status === 'pending' || status === 'viewed' || status === 'signed'
  const isViewedStatus = (status?: string | null) => status === 'viewed' || status === 'signed'
  const isSignedStatus = (status?: string | null) => status === 'signed'

  const sentCount = lastRangeProposals.filter((proposal) => isSentStatus(proposal.status)).length
  const viewedCount = lastRangeProposals.filter((proposal) => isViewedStatus(proposal.status)).length
  const signedCount = lastRangeProposals.filter((proposal) => isSignedStatus(proposal.status)).length

  const sentPrev = prevRangeProposals.filter((proposal) => isSentStatus(proposal.status)).length
  const viewedPrev = prevRangeProposals.filter((proposal) => isViewedStatus(proposal.status)).length
  const signedPrev = prevRangeProposals.filter((proposal) => isSignedStatus(proposal.status)).length

  const viewRate = sentCount ? Math.round((viewedCount / sentCount) * 100) : 0
  const signRate = sentCount ? Math.round((signedCount / sentCount) * 100) : 0

  const avgDuration = averageDuration(lastRangeViews)
  const avgDurationPrev = averageDuration(prevRangeViews)

  const stats = [
    {
      label: 'Gönderilen',
      value: formatNumber(sentCount),
      icon: 'send',
      iconColor: 'text-primary',
      trend: buildTrend(sentCount, sentPrev),
    },
    {
      label: 'Görüntülenen',
      value: formatNumber(viewedCount),
      icon: 'visibility',
      iconColor: 'text-primary',
      trend: {
        value: `${viewRate}% görüntülenme`,
        type: 'neutral' as const,
        color: 'text-primary',
      },
    },
    {
      label: 'İmzalanan',
      value: formatNumber(signedCount),
      icon: 'verified',
      iconColor: 'text-[#07883b]',
      trend: {
        value: `${signRate}% kapanış`,
        type: 'neutral' as const,
        color: 'text-primary',
      },
    },
    {
      label: 'Ortalama Süre',
      value: formatDuration(avgDuration),
      icon: 'timer',
      iconColor: 'text-[#e73908]',
      trend: buildDurationTrend(avgDuration, avgDurationPrev),
    },
  ]

  const blockInteractions = buildBlockInteractions(lastRangeViews)
  const hasBlockData = blockInteractions.length > 0

  const proposalMap = new Map(proposals.map((proposal) => [proposal.id, proposal.title]))

  const activityEvents: Array<{
    date: string
    icon: string
    iconBg: string
    iconColor: string
    title: string
    description: string
  }> = []

  for (const view of lastRangeViews.slice(0, 6)) {
    const title = proposalMap.get(view.proposal_id) ?? 'Teklif'
    activityEvents.push({
      date: view.created_at,
      icon: 'visibility',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      title: `${title} görüntülendi`,
      description: 'Bir müşteri teklifi inceledi.',
    })
  }

  for (const proposal of lastRangeProposals.filter((item) => isSignedStatus(item.status)).slice(0, 6)) {
    activityEvents.push({
      date: proposal.signed_at ?? proposal.updated_at ?? proposal.created_at,
      icon: 'verified',
      iconBg: 'bg-[#07883b]/10',
      iconColor: 'text-[#07883b]',
      title: `${proposal.title} imzalandı`,
      description: 'Teklif başarıyla kapatıldı.',
    })
  }

  for (const proposal of lastRangeProposals.filter((item) => isSentStatus(item.status)).slice(0, 6)) {
    activityEvents.push({
      date: proposal.created_at,
      icon: 'send',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      title: `${proposal.title} gönderildi`,
      description: 'Teklif müşteriye ulaştırıldı.',
    })
  }

  const recentActivities = activityEvents
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6)
    .map((activity) => ({
      ...activity,
      time: getTimeAgo(activity.date),
    }))

  const sentPercent = 100
  const viewedPercent = sentCount ? Math.round((viewedCount / sentCount) * 100) : 0
  const signedPercent = sentCount ? Math.round((signedCount / sentCount) * 100) : 0

  const dateRangeLabel = isCustomRange
    ? `${formatDate(rangeStart)} - ${formatDate(rangeEnd)}`
    : `Son ${rangeDays} gün`
  const dateInputFrom = isCustomRange ? toDateInputValue(rangeStart) : toDateInputValue(rangeStart)
  const dateInputTo = isCustomRange ? toDateInputValue(rangeEnd) : toDateInputValue(rangeEnd)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
            Spyglass Analytics
          </h2>
          <p className="text-[#48679d] dark:text-[#a1b0cb]">
            {dateRangeLabel} teklif performansı ve etkileşim özeti
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 rounded-lg border border-[#ced8e9] dark:border-[#2a3441] bg-white dark:bg-[#1e293b] p-1">
            {rangeOptions.map((option) => {
              const isActive = option.days === rangeDays
              return (
                <Link
                  key={option.days}
                  href={`/analytics?range=${option.days}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                    isActive
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-[#48679d] dark:text-[#a1b0cb] hover:bg-gray-50 dark:hover:bg-[#0f172a]'
                  }`}
                >
                  {option.label}
                </Link>
              )
            })}
          </div>
          <form className="flex items-center gap-2" method="get" action="/analytics">
            <div className="flex items-center gap-2 rounded-lg border border-[#ced8e9] dark:border-[#2a3441] bg-white dark:bg-[#1e293b] px-3 py-2">
              <span className="material-symbols-outlined text-[18px] text-[#48679d]">calendar_today</span>
              <input
                type="date"
                name="from"
                defaultValue={dateInputFrom}
                className="bg-transparent text-xs font-semibold text-[#0d121c] dark:text-white outline-none"
              />
              <span className="text-xs text-[#48679d]">-</span>
              <input
                type="date"
                name="to"
                defaultValue={dateInputTo}
                className="bg-transparent text-xs font-semibold text-[#0d121c] dark:text-white outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 rounded-lg bg-[#0d121c] text-white text-xs font-semibold hover:bg-[#0b111b]"
            >
              Uygula
            </button>
          </form>
          <a
            href={
              isCustomRange
                ? `/api/analytics/export?from=${dateInputFrom}&to=${dateInputTo}`
                : `/api/analytics/export?range=${rangeDays}`
            }
            className="flex min-w-[84px] max-w-[480px] items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-lg mr-2">ios_share</span>
            <span className="truncate">Export Report</span>
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {stats.map((stat) => (
            <div key={stat.label} className="flex min-w-[180px] flex-1 flex-col gap-2 rounded-xl p-4 bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-[#2a3441] shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-[#48679d] dark:text-[#a1b0cb] text-sm font-medium leading-normal uppercase tracking-wider">{stat.label}</p>
                <span className={`material-symbols-outlined ${stat.iconColor}`}>{stat.icon}</span>
              </div>
              <p className="text-[#0d121c] dark:text-white tracking-light text-2xl font-bold leading-tight">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.trend.type === 'up' && (
                  <span className="material-symbols-outlined text-[#07883b] text-sm">trending_up</span>
                )}
                {stat.trend.type === 'down' && (
                  <span className="material-symbols-outlined text-[#e73908] text-sm">trending_down</span>
                )}
                <p className={`${stat.trend.color} text-sm font-semibold leading-normal`}>{stat.trend.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-[#101722] rounded-xl border border-[#ced8e9] dark:border-[#2a3441] shadow-sm overflow-hidden">
          <h2 className="text-[#0d121c] dark:text-white text-lg font-bold leading-tight tracking-[-0.01em] px-4 pt-5 pb-3">Conversion Funnel</h2>
          <div className="pb-6">
            <div className="flex items-center px-4 gap-2">
              <div className="flex-1 relative">
                <div className="h-12 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-xs relative">
                  Gönderildi ({sentCount})
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rotate-45 z-10"></div>
                </div>
                <p className="text-center text-xs mt-2 text-[#48679d] font-bold">{sentPercent}%</p>
              </div>

              <div className="flex items-center justify-center px-4">
                <span className="material-symbols-outlined text-[#ced8e9] text-[18px]">arrow_forward_ios</span>
              </div>

              <div className="relative" style={{ flex: Math.max(0.35, viewedPercent / 100) }}>
                <div className="h-12 bg-primary/80 rounded-lg flex items-center justify-center text-white font-bold text-xs relative">
                  Görüntülendi ({viewedCount})
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary/80 rotate-45 z-10"></div>
                </div>
                <p className="text-center text-xs mt-2 text-[#48679d] font-bold">{viewedPercent}%</p>
              </div>

              <div className="flex items-center justify-center px-4">
                <span className="material-symbols-outlined text-[#ced8e9] text-[18px]">arrow_forward_ios</span>
              </div>

              <div className="relative" style={{ flex: Math.max(0.25, signedPercent / 100) }}>
                <div className="h-12 bg-primary/60 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                  İmzalandı ({signedCount})
                </div>
                <p className="text-center text-xs mt-2 text-[#48679d] font-bold">{signedPercent}%</p>
              </div>
            </div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-[#2a3441] rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#0d121c] dark:text-white text-lg font-bold">Blok Etkileşim Haritası</h3>
              <span className="text-xs font-bold text-[#48679d] uppercase">Ortalama Saniye / Blok</span>
            </div>
            {hasBlockData ? (
              <div className="flex flex-col gap-6">
                {blockInteractions.map((block) => (
                  <div key={block.name} className="flex items-center gap-4">
                    <p className="w-32 text-sm font-medium text-[#48679d] dark:text-[#a1b0cb] truncate">{block.name}</p>
                    <div className="flex-1 h-8 bg-[#f0f3f9] dark:bg-[#1e293b] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${block.opacity} rounded-full flex items-center justify-end px-3`}
                        style={{ width: `${block.percentage}%` }}
                      >
                        <span className={`text-[10px] font-bold ${block.percentage > 60 ? 'text-white' : 'text-[#0d121c] dark:text-white'}`}>
                          {block.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#ced8e9] dark:border-[#2a3441] p-6 text-sm text-[#48679d] dark:text-[#a1b0cb] text-center">
                Henüz blok etkileşim verisi yok.
              </div>
            )}
          </div>

          <div className="flex flex-col bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-[#2a3441] rounded-xl shadow-sm p-6">
            <h3 className="text-[#0d121c] dark:text-white text-lg font-bold mb-6">Son Aktiviteler</h3>
            {recentActivities.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#ced8e9] dark:border-[#2a3441] p-6 text-sm text-[#48679d] dark:text-[#a1b0cb] text-center">
                Henüz aktivite kaydı yok.
              </div>
            ) : (
              <div className="flex flex-col gap-6 flex-1">
                {recentActivities.map((activity, index) => (
                  <div key={`${activity.title}-${index}`} className="flex gap-4">
                    <div className={`size-8 rounded-full ${activity.iconBg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${activity.iconColor} text-lg`}>{activity.icon}</span>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-bold text-[#0d121c] dark:text-white">{activity.title}</p>
                      <p className="text-xs text-[#48679d] dark:text-[#a1b0cb]">{activity.description}</p>
                      <span className="text-[10px] font-medium text-[#a1b0cb] mt-1">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button className="mt-auto pt-6 text-primary text-xs font-bold uppercase tracking-widest text-center hover:underline">
              Tümünü Gör
            </button>
          </div>
      </div>
    </div>
  )
}
