import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { normalizeStage, stageConfigs } from '@/components/deals'
import RevenueChart from './RevenueChart'

export const dynamic = 'force-dynamic'

type SalesPageProps = {
  searchParams?: {
    range?: string
    contact?: string
    month?: string
    closedFrom?: string
    closedTo?: string
  }
}

type DealRow = {
  id: string
  title: string
  value: number
  currency: string
  stage: string
  contact_id: string
  created_at: string
  updated_at: string
  expected_close_date: string | null
  probability: number | null
  contacts?:
    | { full_name?: string | null; company?: string | null; email?: string | null }
    | { full_name?: string | null; company?: string | null; email?: string | null }[]
    | null
  users?: { full_name?: string | null; avatar_url?: string | null } | { full_name?: string | null; avatar_url?: string | null }[] | null
}

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

const sumByCurrency = (items: Array<{ value: number; currency: string }>) => {
  const map = new Map<string, number>()
  items.forEach((item) => {
    const key = item.currency || 'TRY'
    map.set(key, (map.get(key) ?? 0) + (item.value || 0))
  })
  return map
}

const formatCurrencyMap = (map: Map<string, number>) => {
  const entries = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return '₺0'
  const top = entries.slice(0, 2).map(([currency, value]) => formatMoney(value, currency))
  const suffix = entries.length > 2 ? ` +${entries.length - 2}` : ''
  return `${top.join(' / ')}${suffix}`
}

const getPrimaryCurrency = (items: Array<{ currency: string }>) => {
  const counts = new Map<string, number>()
  items.forEach((item) => {
    const key = item.currency || 'TRY'
    counts.set(key, (counts.get(key) ?? 0) + 1)
  })
  const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? 'TRY'
}

const getDealDate = (deal: DealRow) =>
  deal.expected_close_date ?? deal.updated_at ?? deal.created_at ?? new Date().toISOString()

const rangeOptions = [
  { days: 30, label: 'Son 30 Gün' },
  { days: 90, label: 'Son 90 Gün' },
  { days: 180, label: 'Son 180 Gün' },
  { days: 365, label: 'Son 12 Ay' },
]

const buildMonthOptions = () => {
  const now = new Date()
  const items: Array<{ key: string; label: string }> = []
  for (let i = 0; i < 12; i += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    items.push({ key, label })
  }
  return items
}

const parseDateInput = (value?: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

const getRangeDays = (value?: string) => {
  const parsed = Number(value)
  const allowed = rangeOptions.map((option) => option.days)
  if (Number.isFinite(parsed) && allowed.includes(parsed)) {
    return parsed
  }
  return 90
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .single()

  const teamId = profile?.team_id ?? null

  let dealsQuery = supabase
    .from('deals')
    .select(
      'id, title, value, currency, stage, contact_id, created_at, updated_at, expected_close_date, probability, contacts(full_name, company, email), users(full_name, avatar_url)'
    )
    .order('updated_at', { ascending: false })

  if (teamId) {
    dealsQuery = dealsQuery.eq('team_id', teamId)
  } else {
    dealsQuery = dealsQuery.eq('user_id', user.id)
  }

  const { data: deals } = await dealsQuery
  const rows = (deals ?? []) as DealRow[]

  const normalizedDeals = rows.map((deal) => {
    const contact = Array.isArray(deal.contacts) ? deal.contacts[0] : deal.contacts
    const owner = Array.isArray(deal.users) ? deal.users[0] : deal.users
    return {
      ...deal,
      contacts: contact ?? null,
      users: owner ?? null,
      value: Number.isFinite(deal.value) ? deal.value : 0,
      currency: deal.currency || 'TRY',
      stage: normalizeStage(deal.stage ?? ''),
    }
  })

  const totalDeals = normalizedDeals.length
  const wonDeals = normalizedDeals.filter((deal) => deal.stage === 'won')
  const lostDeals = normalizedDeals.filter((deal) => deal.stage === 'lost')
  const openDeals = normalizedDeals.filter((deal) => deal.stage !== 'won' && deal.stage !== 'lost')

  const contactOptions = (() => {
    const map = new Map<string, string>()
    wonDeals.forEach((deal) => {
      if (!deal.contact_id) return
      const label =
        deal.contacts?.full_name || deal.contacts?.company || deal.contacts?.email || 'Müşteri'
      if (!map.has(deal.contact_id)) {
        map.set(deal.contact_id, label)
      }
    })
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'tr'))
  })()

  const contactFilter = searchParams?.contact ?? 'all'
  const monthFilter = searchParams?.month ?? 'all'
  const closedFrom = parseDateInput(searchParams?.closedFrom)
  const closedTo = parseDateInput(searchParams?.closedTo)
  if (closedTo) {
    closedTo.setHours(23, 59, 59, 999)
  }

  const filteredSales = wonDeals.filter((deal) => {
    if (contactFilter !== 'all' && deal.contact_id !== contactFilter) {
      return false
    }
    const dealDate = new Date(getDealDate(deal))
    if (monthFilter !== 'all') {
      const key = `${dealDate.getFullYear()}-${String(dealDate.getMonth() + 1).padStart(2, '0')}`
      if (key !== monthFilter) return false
    }
    if (closedFrom && dealDate < closedFrom) return false
    if (closedTo && dealDate > closedTo) return false
    return true
  })

  const now = new Date()
  const rangeDays = getRangeDays(searchParams?.range)
  const rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000)
  const rangeDeals = normalizedDeals.filter((deal) => new Date(deal.created_at) >= rangeStart)

  const monthlyStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const yearlyStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)

  const monthlyRevenueDeals = wonDeals.filter((deal) => new Date(getDealDate(deal)) >= monthlyStart)
  const yearlyRevenueDeals = wonDeals.filter((deal) => new Date(getDealDate(deal)) >= yearlyStart)

  const pipelineMap = sumByCurrency(openDeals)
  const monthlyRevenueMap = sumByCurrency(monthlyRevenueDeals)
  const yearlyRevenueMap = sumByCurrency(yearlyRevenueDeals)

  const winRate =
    wonDeals.length + lostDeals.length === 0
      ? 0
      : Math.round((wonDeals.length / (wonDeals.length + lostDeals.length)) * 100)

  const avgDealSize =
    wonDeals.length === 0 ? 0 : wonDeals.reduce((sum, deal) => sum + deal.value, 0) / wonDeals.length

  const cycleDays = wonDeals
    .map((deal) => {
      const created = new Date(deal.created_at).getTime()
      const closed = new Date(getDealDate(deal)).getTime()
      if (!Number.isFinite(created) || !Number.isFinite(closed)) return 0
      const diff = Math.max(0, Math.round((closed - created) / (1000 * 60 * 60 * 24)))
      return diff
    })
    .filter((value) => value > 0)

  const avgCycle = cycleDays.length === 0 ? 0 : cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length
  const monthlyRevenueValue = monthlyRevenueDeals.reduce((sum, deal) => sum + deal.value, 0)
  const salesVelocity = avgCycle > 0 ? monthlyRevenueValue / avgCycle : 0

  const primaryCurrency = getPrimaryCurrency(normalizedDeals)

  const stageTotals = stageConfigs.map((stage) => {
    const count = normalizedDeals.filter((deal) => deal.stage === stage.id).length
    const value = normalizedDeals
      .filter((deal) => deal.stage === stage.id)
      .reduce((sum, deal) => sum + deal.value, 0)
    return { ...stage, count, value }
  })

  const forecastValue = openDeals.reduce((sum, deal) => {
    const probability = deal.probability ?? 30
    return sum + deal.value * (probability / 100)
  }, 0)

  const topPerformers = (() => {
    const map = new Map<string, { name: string; value: number; avatar?: string | null; count: number }>()
    wonDeals.forEach((deal) => {
      const owner = deal.users
      const name = owner?.full_name ?? 'Sorumlu'
      const key = owner?.full_name ?? 'Sorumlu'
      const current = map.get(key) ?? { name, value: 0, avatar: owner?.avatar_url ?? null, count: 0 }
      map.set(key, {
        name,
        value: current.value + deal.value,
        avatar: owner?.avatar_url ?? null,
        count: current.count + 1,
      })
    })
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 4)
  })()

  const recentSales = wonDeals.slice(0, 6)

  const months: Array<{ key: string; label: string }> = []
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('tr-TR', { month: 'short' }),
    })
  }

  const revenueSeries = months.map((month) => {
    const total = wonDeals
      .filter((deal) => {
        if (deal.currency !== primaryCurrency) return false
        const date = new Date(getDealDate(deal))
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        return key === month.key
      })
      .reduce((sum, deal) => sum + deal.value, 0)
    return { ...month, value: total }
  })

  const maxRevenue = Math.max(...revenueSeries.map((item) => item.value), 0)

  const stageConversions = stageTotals.map((stage) => {
    const percentage = totalDeals === 0 ? 0 : Math.round((stage.count / totalDeals) * 100)
    return { ...stage, percentage }
  })

  const rangeLabel = rangeOptions.find((option) => option.days === rangeDays)?.label ?? 'Son 90 Gün'
  const monthOptions = buildMonthOptions()
  const filteredRecentSales = filteredSales.slice(0, 8)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Satış Performansı</h1>
          <p className="text-[#48679d] dark:text-gray-400 mt-1">Pipeline, gelir ve ekip performansını takip edin.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/reports/import-export?entity=sales"
            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 text-[#48679d] hover:text-primary hover:border-primary/40"
          >
            <span className="material-symbols-outlined text-[14px] mr-1 align-middle">swap_vert</span>
            Satış İçe/Dışa Aktar
          </Link>
          {rangeOptions.map((option) => (
            <Link
              key={option.days}
              href={`/sales?range=${option.days}`}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                rangeDays === option.days
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-slate-800 border border-[#e7ebf4] dark:border-gray-700 text-[#48679d] hover:text-primary'
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-[#48679d] uppercase tracking-wider">Toplam Pipeline</p>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mt-2">
            {formatCurrencyMap(pipelineMap)}
          </p>
          <p className="text-xs text-[#48679d] mt-1">{openDeals.length} açık anlaşma</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-[#48679d] uppercase tracking-wider">Aylık Kazanç</p>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mt-2">
            {formatCurrencyMap(monthlyRevenueMap)}
          </p>
          <p className="text-xs text-[#48679d] mt-1">Son 30 gün</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-[#48679d] uppercase tracking-wider">Yıllık Kazanç</p>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mt-2">
            {formatCurrencyMap(yearlyRevenueMap)}
          </p>
          <p className="text-xs text-[#48679d] mt-1">Son 12 ay</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-[#48679d] uppercase tracking-wider">Win Rate</p>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mt-2">%{winRate}</p>
          <p className="text-xs text-[#48679d] mt-1">{wonDeals.length} kazanıldı · {lostDeals.length} kaybedildi</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-[#48679d] uppercase tracking-wider">Ortalama Deal</p>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mt-2">
            {formatMoney(avgDealSize, primaryCurrency)}
          </p>
          <p className="text-xs text-[#48679d] mt-1">{wonDeals.length} kapanan anlaşma</p>
        </div>
        <div className="bg-white dark:bg-[#161e2b] p-5 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm">
          <p className="text-xs font-semibold text-[#48679d] uppercase tracking-wider">Sales Velocity</p>
          <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white mt-2">
            {formatMoney(salesVelocity, primaryCurrency)}
          </p>
          <p className="text-xs text-[#48679d] mt-1">Günlük ortalama gelir</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Gelir Trendi</h3>
              <p className="text-xs text-[#48679d]">Para birimi: {primaryCurrency} · {rangeLabel}</p>
            </div>
            <span className="text-xs text-[#48679d]">{formatMoney(maxRevenue, primaryCurrency)} max</span>
          </div>
          <RevenueChart data={revenueSeries.map((item) => ({ label: item.label, value: item.value }))} currency={primaryCurrency} />
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Aşama Dönüşüm</h3>
          <div className="space-y-3">
            {stageConversions.map((stage) => (
              <div key={stage.id}>
                <div className="flex items-center justify-between text-xs text-[#48679d]">
                  <span>{stage.label}</span>
                  <span>%{stage.percentage}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full mt-2">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${stage.percentage}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Stage Dağılımı</h3>
          <div className="space-y-3">
            {stageTotals.map((stage) => (
              <div key={stage.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-[#0d121c] dark:text-white">
                  <span className="material-symbols-outlined text-sm">folder</span>
                  {stage.label}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{stage.count}</p>
                  <p className="text-xs text-[#48679d]">{formatMoney(stage.value, primaryCurrency)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Top Performers</h3>
          <div className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-sm text-[#48679d]">Henüz veri yok.</p>
            ) : (
              topPerformers.map((person) => (
                <div key={person.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {person.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{person.name}</p>
                      <p className="text-xs text-[#48679d]">{person.count} satış</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">{formatMoney(person.value, primaryCurrency)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
          <h3 className="text-lg font-bold text-[#0d121c] dark:text-white mb-4">Forecast Projeksiyonu</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[#48679d]">Tahmini gelir</p>
              <p className="text-2xl font-extrabold text-[#0d121c] dark:text-white">
                {formatMoney(forecastValue, primaryCurrency)}
              </p>
            </div>
            <div className="text-xs text-[#48679d]">
              {openDeals.length} açık anlaşma · Ortalama olasılık %{Math.round(
                openDeals.reduce((sum, deal) => sum + (deal.probability ?? 30), 0) / (openDeals.length || 1)
              )}
            </div>
            <div className="text-xs text-[#48679d]">
              {rangeLabel} içinde {rangeDeals.length} yeni fırsat
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">Son Satışlar</h3>
            <p className="text-xs text-[#48679d]">Kapanan anlaşmaların özeti</p>
          </div>
          <Link href="/deals" className="text-xs font-semibold text-primary hover:underline">
            Tüm anlaşmalar
          </Link>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4" action="/sales" method="get">
          <input type="hidden" name="range" value={rangeDays} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#48679d]">Kişi</label>
            <select
              name="contact"
              defaultValue={contactFilter}
              className="px-3 py-2 rounded-lg border border-[#e7ebf4] text-sm"
            >
              <option value="all">Tüm kişiler</option>
              {contactOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#48679d]">Ay</label>
            <select
              name="month"
              defaultValue={monthFilter}
              className="px-3 py-2 rounded-lg border border-[#e7ebf4] text-sm"
            >
              <option value="all">Tüm aylar</option>
              {monthOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#48679d]">Başlangıç</label>
            <input
              type="date"
              name="closedFrom"
              defaultValue={searchParams?.closedFrom ?? ''}
              className="px-3 py-2 rounded-lg border border-[#e7ebf4] text-sm"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-semibold text-[#48679d]">Bitiş</label>
            <input
              type="date"
              name="closedTo"
              defaultValue={searchParams?.closedTo ?? ''}
              className="px-3 py-2 rounded-lg border border-[#e7ebf4] text-sm"
            />
          </div>
          <div className="md:col-span-4 flex items-center justify-between">
            <p className="text-xs text-[#48679d]">{filteredSales.length} kapanan satış bulundu</p>
            <div className="flex items-center gap-2">
              <Link
                href={`/sales?range=${rangeDays}`}
                className="text-xs font-semibold text-[#48679d] hover:text-primary"
              >
                Filtreyi temizle
              </Link>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold"
              >
                Filtrele
              </button>
            </div>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#48679d] uppercase tracking-wider border-b border-[#e7ebf4]">
                <th className="py-2 pr-4">Anlaşma</th>
                <th className="py-2 pr-4">Müşteri</th>
                <th className="py-2 pr-4">Değer</th>
                <th className="py-2 pr-4">Kapanış</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-[#48679d] text-sm">
                    Henüz kapanan anlaşma yok.
                  </td>
                </tr>
              ) : (
                filteredRecentSales.map((deal) => (
                  <tr key={deal.id} className="border-b border-[#e7ebf4]">
                    <td className="py-3 pr-4 font-semibold text-[#0d121c] dark:text-white">{deal.title}</td>
                    <td className="py-3 pr-4 text-[#48679d]">
                      {deal.contacts?.full_name || deal.contacts?.company || 'Müşteri'}
                    </td>
                    <td className="py-3 pr-4 text-primary font-semibold">
                      {formatMoney(deal.value, deal.currency)}
                    </td>
                    <td className="py-3 pr-4 text-xs text-[#48679d]">
                      {new Date(getDealDate(deal)).toLocaleDateString('tr-TR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
