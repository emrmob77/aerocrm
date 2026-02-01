'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'

type SearchResults = {
  deals: {
    id: string
    title: string
    value: number
    currency: string
    stage: string
    updated_at: string
    contact?: { full_name?: string | null; company?: string | null } | null
  }[]
  contacts: {
    id: string
    full_name: string
    email: string | null
    company: string | null
    updated_at: string
  }[]
  proposals: {
    id: string
    title: string
    status: string
    updated_at: string
    contact?: { full_name?: string | null } | null
  }[]
}

type SavedSearch = {
  id: string
  name: string
  query: string
  filters: Record<string, unknown>
  updated_at: string
}

type HistoryItem = {
  id: string
  query: string
  filters: Record<string, unknown>
  created_at: string
}

const stageOptions = [
  { id: 'lead', label: 'Aday' },
  { id: 'proposal_sent', label: 'Teklif Gönderildi' },
  { id: 'negotiation', label: 'Görüşme' },
  { id: 'won', label: 'Kazanıldı' },
  { id: 'lost', label: 'Kaybedildi' },
]

const statusOptions = [
  { id: 'draft', label: 'Taslak' },
  { id: 'sent', label: 'Gönderildi' },
  { id: 'viewed', label: 'Görüntülendi' },
  { id: 'signed', label: 'İmzalandı' },
  { id: 'expired', label: 'Süresi Doldu' },
]

const formatMoney = (value: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get('q') ?? ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResults>({ deals: [], contacts: [], proposals: [] })
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['deals', 'contacts', 'proposals'])
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all')
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [saveName, setSaveName] = useState('')

  const filtersPayload = useMemo(
    () => ({
      types: selectedTypes,
      stages: selectedStages,
      statuses: selectedStatuses,
      dateRange,
    }),
    [dateRange, selectedStages, selectedStatuses, selectedTypes]
  )

  const loadMeta = async () => {
    const response = await fetch('/api/search/meta')
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      return
    }
    setSavedSearches((payload?.saved ?? []) as SavedSearch[])
    setHistory((payload?.history ?? []) as HistoryItem[])
  }

  const runSearch = async (
    track: boolean,
    overrideQuery?: string,
    overrideFilters?: {
      types: string[]
      stages: string[]
      statuses: string[]
      dateRange: 'all' | '7d' | '30d' | '90d'
    }
  ) => {
    const queryValue = (overrideQuery ?? query).trim()
    if (!queryValue) return
    const filtersToSend = overrideFilters ?? filtersPayload
    setIsSearching(true)
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: queryValue,
        filters: filtersToSend,
        track,
      }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || 'Arama yapılamadı.')
      setIsSearching(false)
      return
    }
    setResults((payload?.results ?? { deals: [], contacts: [], proposals: [] }) as SearchResults)
    setIsSearching(false)
    if (track) {
      await loadMeta()
    }
  }

  useEffect(() => {
    loadMeta()
  }, [])

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery)
      runSearch(true, initialQuery)
    }
  }, [initialQuery])

  const toggleType = (id: string) => {
    setSelectedTypes((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleStage = (id: string) => {
    setSelectedStages((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const toggleStatus = (id: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  const applySavedSearch = (item: SavedSearch | HistoryItem) => {
    setQuery(item.query)
    const filters = (item.filters ?? {}) as Record<string, unknown>
    const nextTypes = (filters.types as string[]) || ['deals', 'contacts', 'proposals']
    const nextStages = (filters.stages as string[]) || []
    const nextStatuses = (filters.statuses as string[]) || []
    const nextRange = (filters.dateRange as 'all' | '7d' | '30d' | '90d') || 'all'
    setSelectedTypes(nextTypes)
    setSelectedStages(nextStages)
    setSelectedStatuses(nextStatuses)
    setDateRange(nextRange)
    router.replace(`/search?q=${encodeURIComponent(item.query)}`)
    runSearch(true, item.query, {
      types: nextTypes,
      stages: nextStages,
      statuses: nextStatuses,
      dateRange: nextRange,
    })
  }

  const saveSearch = async () => {
    if (!saveName.trim() || !query.trim()) {
      toast.error('Arama adı ve sorgu zorunludur.')
      return
    }
    const response = await fetch('/api/search/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: saveName,
        query,
        filters: filtersPayload,
      }),
    })
    const payload = await response.json().catch(() => null)
    if (!response.ok) {
      toast.error(payload?.error || 'Kayıtlı arama oluşturulamadı.')
      return
    }
    setSavedSearches((prev) => [payload.saved as SavedSearch, ...prev])
    setShowSaveModal(false)
    setSaveName('')
    toast.success('Arama kaydedildi.')
  }

  const removeSavedSearch = async (id: string) => {
    const response = await fetch(`/api/search/saved/${id}`, { method: 'DELETE' })
    if (!response.ok) {
      toast.error('Kayıtlı arama silinemedi.')
      return
    }
    setSavedSearches((prev) => prev.filter((item) => item.id !== id))
    toast.success('Kayıtlı arama silindi.')
  }

  const totalResults =
    results.deals.length + results.contacts.length + results.proposals.length

  return (
    <div className="-m-8">
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <span className="material-symbols-outlined text-sm">search</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Global Search</span>
            </div>
            <h1 className="text-[#0f172a] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
              Arama Sonuçları
            </h1>
            <p className="text-slate-500 text-sm">
              Anlaşma, kişi ve teklifler arasında arama yapın.
            </p>
          </div>
          <button
            onClick={() => setShowSaveModal(true)}
            className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
          >
            <span className="material-symbols-outlined text-lg">bookmark_add</span>
            Aramayı Kaydet
          </button>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            router.replace(`/search?q=${encodeURIComponent(query.trim())}`)
            runSearch(true)
          }}
          className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 mb-6 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#48679d]">search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Anlaşma, kişi, teklif ara..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#0f172a] dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              {isSearching ? 'Aranıyor' : 'Ara'}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {[
              { id: 'deals', label: 'Anlaşmalar' },
              { id: 'contacts', label: 'Kişiler' },
              { id: 'proposals', label: 'Teklifler' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleType(item.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  selectedTypes.includes(item.id)
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-500">
              <span className="material-symbols-outlined text-sm">tune</span>
              Gelişmiş filtreler
            </div>
          </div>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Toplam Sonuç</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalResults}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Seçili Kategoriler</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{selectedTypes.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Tarih Aralığı</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {dateRange === 'all' ? 'Tümü' : dateRange}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-5 mb-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-white">Filtreler</h3>
            <select
              value={dateRange}
              onChange={(event) => setDateRange(event.target.value as 'all' | '7d' | '30d' | '90d')}
              className="text-xs bg-white dark:bg-slate-900 border border-[#e2e8f0] dark:border-slate-700 rounded-lg px-2 py-1"
            >
              <option value="all">Tüm Tarihler</option>
              <option value="7d">Son 7 Gün</option>
              <option value="30d">Son 30 Gün</option>
              <option value="90d">Son 90 Gün</option>
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Anlaşma Aşamaları</p>
            <div className="flex flex-wrap gap-2">
              {stageOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleStage(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    selectedStages.includes(item.id)
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Teklif Durumları</p>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleStatus(item.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    selectedStatuses.includes(item.id)
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Anlaşmalar</h2>
                <span className="text-xs text-slate-400">{results.deals.length} sonuç</span>
              </div>
              {results.deals.length === 0 ? (
                <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4">
                  Bu filtre için anlaşma bulunamadı.
                </div>
              ) : (
                results.deals.map((deal) => (
                  <Link
                    key={deal.id}
                        href={`/deals/${deal.id}`}
                    className="block bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{deal.title}</p>
                        <p className="text-xs text-slate-500">
                          {deal.contact?.full_name || deal.contact?.company || 'Müşteri'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatMoney(deal.value ?? 0, deal.currency || 'TRY')}
                        </p>
                        <p className="text-xs text-slate-400">{formatRelativeTime(deal.updated_at)}</p>
                      </div>
                    </div>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-600">
                      <span className="material-symbols-outlined text-[14px]">flag</span>
                      {deal.stage}
                    </span>
                  </Link>
                ))
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Teklifler</h2>
                <span className="text-xs text-slate-400">{results.proposals.length} sonuç</span>
              </div>
              {results.proposals.length === 0 ? (
                <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4">
                  Bu filtre için teklif bulunamadı.
                </div>
              ) : (
                results.proposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={`/proposals/${proposal.id}`}
                    className="block bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{proposal.title}</p>
                        <p className="text-xs text-slate-500">
                          {proposal.contact?.full_name || 'Müşteri'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500">{proposal.status}</p>
                        <p className="text-xs text-slate-400">{formatRelativeTime(proposal.updated_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Kişiler</h2>
                <span className="text-xs text-slate-400">{results.contacts.length} sonuç</span>
              </div>
              {results.contacts.length === 0 ? (
                <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4">
                  Bu filtre için kişi bulunamadı.
                </div>
              ) : (
                results.contacts.map((contact) => (
                  <Link
                    key={contact.id}
                    href={`/contacts/${contact.id}`}
                    className="block bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{contact.full_name}</p>
                        <p className="text-xs text-slate-500">{contact.company || contact.email || 'Kayıt'}</p>
                      </div>
                      <p className="text-xs text-slate-400">{formatRelativeTime(contact.updated_at)}</p>
                    </div>
                  </Link>
                ))
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Kayıtlı Aramalar</h3>
              <div className="mt-3 space-y-2">
                {savedSearches.length === 0 ? (
                  <p className="text-xs text-slate-500">Henüz kayıtlı arama yok.</p>
                ) : (
                  savedSearches.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => applySavedSearch(item)}
                        className="text-left text-sm font-semibold text-primary hover:underline"
                      >
                        {item.name}
                      </button>
                      <button
                        onClick={() => removeSavedSearch(item.id)}
                        className="text-xs text-slate-400 hover:text-rose-500"
                      >
                        Sil
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Arama Geçmişi</h3>
              <div className="mt-3 space-y-2">
                {history.length === 0 ? (
                  <p className="text-xs text-slate-500">Henüz arama geçmişi yok.</p>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => applySavedSearch(item)}
                      className="block text-left text-sm text-slate-600 dark:text-slate-300 hover:text-primary"
                    >
                      {item.query}
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>

        {showSaveModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-[#161e2b] rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h3 className="text-lg font-bold text-[#0f172a] dark:text-white mb-2">Aramayı Kaydet</h3>
              <p className="text-sm text-slate-500 mb-4">Bu sorguya bir isim verin.</p>
              <input
                value={saveName}
                onChange={(event) => setSaveName(event.target.value)}
                placeholder="Örn: İmzalanan Teklifler"
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-[#0f172a] dark:text-white"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Vazgeç
                </button>
                <button
                  onClick={saveSearch}
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90"
                >
                  Kaydet
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
