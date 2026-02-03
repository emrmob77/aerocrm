'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { DndContext, PointerSensor, useSensor, useSensors, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import toast from 'react-hot-toast'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { Database } from '@/types/database'
import { formatCurrency, formatRelativeTime, getActivityMeta, normalizeStage, getStageConfigs, type StageId } from './stage-utils'
import { useI18n } from '@/lib/i18n'

export type DealCardData = {
  id: string
  title: string
  company: string
  value: number
  stage: StageId
  contactName: string
  contactInitials: string
  ownerName: string
  ownerInitials: string
  ownerAvatarUrl?: string | null
  ownerId: string | null
  updatedAt: string
  createdAt: string
}

type DealsBoardProps = {
  initialDeals: DealCardData[]
  teamId: string | null
  userId: string | null
}

const createInitials = (name: string) => {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '??'
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

const avatarPalette = [
  { bg: 'bg-blue-100', text: 'text-blue-600' },
  { bg: 'bg-purple-100', text: 'text-purple-600' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { bg: 'bg-orange-100', text: 'text-orange-600' },
]

const getAvatarStyle = (seed: string) => {
  const hash = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarPalette[hash % avatarPalette.length]
}

export function DealsBoard({ initialDeals, teamId, userId }: DealsBoardProps) {
  const supabase = useMemo(() => getSupabaseClient(), [])
  const { t, locale } = useI18n()
  const stageConfigs = useMemo(() => getStageConfigs(t), [t])
  const currency = locale === 'en' ? 'USD' : 'TRY'
  const [deals, setDeals] = useState<DealCardData[]>(initialDeals)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showLost, setShowLost] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [sortFilter, setSortFilter] = useState('newest')
  const [stageFilters, setStageFilters] = useState<StageId[]>([])
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [members, setMembers] = useState<Array<{ id: string; name: string; avatarUrl: string | null }>>([])
  const [stageUpdatingId, setStageUpdatingId] = useState<string | null>(null)
  const [ownerUpdatingId, setOwnerUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    setDeals(initialDeals)
  }, [initialDeals])

  useEffect(() => {
    if (!teamId && !userId) return

    const loadMembers = async () => {
      let query = supabase
        .from('users')
        .select('id, full_name, avatar_url')
        .order('created_at', { ascending: true })

      if (teamId) {
        query = query.eq('team_id', teamId)
      } else if (userId) {
        query = query.eq('id', userId)
      }

      const { data } = await query
      const nextMembers = (data ?? []).map((member) => ({
        id: member.id,
        name: member.full_name || t('deals.ownerFallback'),
        avatarUrl: member.avatar_url ?? null,
      }))
      setMembers(nextMembers)
    }

    loadMembers()
  }, [supabase, teamId, userId, t])

  const memberMap = useMemo(
    () => new Map(members.map((member) => [member.id, member])),
    [members]
  )

  useEffect(() => {
    if (members.length === 0) return
    setDeals((prev) =>
      prev.map((deal) => {
        if (!deal.ownerId) return deal
        const member = memberMap.get(deal.ownerId)
        if (!member) return deal
        const initials = createInitials(member.name)
        if (
          deal.ownerName === member.name &&
          deal.ownerInitials === initials &&
          deal.ownerAvatarUrl === member.avatarUrl
        ) {
          return deal
        }
        return {
          ...deal,
          ownerName: member.name,
          ownerInitials: initials,
          ownerAvatarUrl: member.avatarUrl,
        }
      })
    )
  }, [memberMap, members.length])

  useEffect(() => {
    if (!teamId && !userId) {
      return
    }

    const filter = teamId ? `team_id=eq.${teamId}` : `user_id=eq.${userId}`

    const channel = supabase
      .channel('deals-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deals', filter },
        async (payload) => {
          const row = payload.new as Database['public']['Tables']['deals']['Row']
          if (!row?.id) return

          const contactInfo = row.contact_id
            ? await supabase
                .from('contacts')
                .select('full_name, company')
                .eq('id', row.contact_id)
                .single()
            : null

          const contactName = contactInfo?.data?.full_name ?? t('deals.newRecord')
          const company = contactInfo?.data?.company ?? t('common.unknown')

          const ownerInfo = row.user_id
            ? await supabase
                .from('users')
                .select('full_name, avatar_url')
                .eq('id', row.user_id)
                .single()
            : null

          const ownerName = ownerInfo?.data?.full_name ?? t('deals.ownerFallback')

          setDeals(prev => {
            if (prev.some(deal => deal.id === row.id)) {
              return prev
            }

            const next: DealCardData = {
              id: row.id,
              title: row.title,
              company,
              value: row.value ?? 0,
              stage: normalizeStage(row.stage),
              contactName,
              contactInitials: createInitials(contactName),
              ownerName,
              ownerInitials: createInitials(ownerName),
              ownerAvatarUrl: ownerInfo?.data?.avatar_url ?? null,
              ownerId: row.user_id ?? null,
              updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
              createdAt: row.created_at ?? row.updated_at ?? new Date().toISOString(),
            }

            return [next, ...prev]
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals', filter },
        (payload) => {
          const row = payload.new as Database['public']['Tables']['deals']['Row']
          if (!row?.id) return

          setDeals(prev =>
            prev.map(deal =>
              deal.id === row.id
                ? {
                    ...deal,
                    title: row.title ?? deal.title,
                    value: row.value ?? deal.value,
                    stage: normalizeStage(row.stage),
                    ownerId: row.user_id ?? deal.ownerId,
                    updatedAt: row.updated_at ?? deal.updatedAt,
                  }
                : deal
            )
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'deals', filter },
        (payload) => {
          const row = payload.old as Database['public']['Tables']['deals']['Row']
          if (!row?.id) return

          setDeals(prev => prev.filter(deal => deal.id !== row.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, teamId, userId, t])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const toggleStageFilter = (stageId: StageId) => {
    setStageFilters((prev) =>
      prev.includes(stageId) ? prev.filter((item) => item !== stageId) : [...prev, stageId]
    )
  }

  const resetExtraFilters = () => {
    setStageFilters([])
    setMinValue('')
    setMaxValue('')
  }

  const filteredDeals = useMemo(() => {
    let result = [...deals]

    const query = searchQuery.trim().toLowerCase()
    if (query) {
      result = result.filter((deal) => {
        const haystack = [
          deal.title,
          deal.company,
          deal.contactName,
          deal.ownerName,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return haystack.includes(query)
      })
    }

    if (ownerFilter !== 'all') {
      if (ownerFilter === 'unassigned') {
        result = result.filter((deal) => !deal.ownerId)
      } else {
        result = result.filter((deal) => deal.ownerId === ownerFilter)
      }
    }

    if (dateFilter !== 'all') {
      const now = new Date()
      let start: Date | null = null
      if (dateFilter === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1)
      } else if (dateFilter === 'last7') {
        start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      } else if (dateFilter === 'last30') {
        start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      } else if (dateFilter === 'last90') {
        start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
      if (start) {
        result = result.filter((deal) => {
          const base = deal.createdAt || deal.updatedAt
          return new Date(base) >= start!
        })
      }
    }

    if (stageFilters.length > 0) {
      result = result.filter((deal) => stageFilters.includes(deal.stage))
    }

    const minInput = minValue.trim()
    if (minInput !== '') {
      const min = Number(minInput)
      if (Number.isFinite(min)) {
        result = result.filter((deal) => deal.value >= min)
      }
    }

    const maxInput = maxValue.trim()
    if (maxInput !== '') {
      const max = Number(maxInput)
      if (Number.isFinite(max)) {
        result = result.filter((deal) => deal.value <= max)
      }
    }

    return result
  }, [deals, dateFilter, maxValue, minValue, ownerFilter, searchQuery, stageFilters])

  const sortedDeals = useMemo(() => {
    const result = [...filteredDeals]
    if (sortFilter === 'oldest') {
      result.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt))
    } else if (sortFilter === 'valueHigh') {
      result.sort((a, b) => b.value - a.value)
    } else if (sortFilter === 'valueLow') {
      result.sort((a, b) => a.value - b.value)
    } else {
      result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    }
    return result
  }, [filteredDeals, sortFilter])

  const dealsByStage = (stageId: StageId) =>
    sortedDeals.filter(deal => deal.stage === stageId)

  const getStageTotals = (stageId: StageId) => {
    const stageDeals = dealsByStage(stageId)
    return {
      count: stageDeals.length,
      value: stageDeals.reduce((sum, deal) => sum + deal.value, 0),
    }
  }

  const applyStageChange = async (dealId: string, targetStage: StageId) => {
    const current = deals.find(deal => deal.id === dealId)
    if (!current || current.stage === targetStage) {
      return
    }

    const previousStage = current.stage
    const previousUpdatedAt = current.updatedAt
    const now = new Date().toISOString()

    setDeals(prev =>
      prev.map(deal =>
        deal.id === dealId
          ? {
              ...deal,
              stage: targetStage,
              updatedAt: now,
            }
          : deal
      )
    )

    setStageUpdatingId(dealId)
    try {
      const response = await fetch('/api/deals/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, stage: targetStage }),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setDeals(prev =>
          prev.map(deal =>
            deal.id === dealId
              ? {
                  ...deal,
                  stage: previousStage,
                  updatedAt: previousUpdatedAt,
                }
              : deal
          )
        )
        toast.error(payload?.error || t('deals.stageUpdateError'))
        return
      }

      const updatedAt = payload?.deal?.updated_at
      if (updatedAt) {
        setDeals(prev =>
          prev.map(deal =>
            deal.id === dealId
              ? {
                  ...deal,
                  updatedAt,
                }
              : deal
          )
        )
      }
    } catch (error) {
      setDeals(prev =>
        prev.map(deal =>
          deal.id === dealId
            ? {
                ...deal,
                stage: previousStage,
                updatedAt: previousUpdatedAt,
              }
            : deal
        )
      )
      toast.error(error instanceof Error ? error.message : t('deals.stageUpdateError'))
    } finally {
      setStageUpdatingId((prev) => (prev === dealId ? null : prev))
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      return
    }

    const activeId = String(active.id)
    if (!activeId.startsWith('deal-')) {
      return
    }

    const dealId = activeId.replace('deal-', '')
    const targetStage = getTargetStage(over.id, deals)

    if (!targetStage) {
      return
    }

    await applyStageChange(dealId, targetStage)
  }

  const handleAssignOwner = async (dealId: string, nextOwnerId: string) => {
    const current = deals.find((deal) => deal.id === dealId)
    if (!current) return
    if (!nextOwnerId) return
    if (current.ownerId === nextOwnerId) return

    const previousOwnerId = current.ownerId
    const previousOwnerName = current.ownerName
    const previousOwnerInitials = current.ownerInitials
    const previousOwnerAvatarUrl = current.ownerAvatarUrl ?? null
    const nextMember = memberMap.get(nextOwnerId)
    const nextOwnerName = nextMember?.name ?? t('deals.ownerFallback')
    const nextOwnerInitials = createInitials(nextOwnerName)

    setDeals((prev) =>
      prev.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              ownerId: nextOwnerId,
              ownerName: nextOwnerName,
              ownerInitials: nextOwnerInitials,
              ownerAvatarUrl: nextMember?.avatarUrl ?? null,
            }
          : deal
      )
    )

    setOwnerUpdatingId(dealId)
    try {
      const response = await fetch('/api/deals/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dealId, ownerId: nextOwnerId }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setDeals((prev) =>
          prev.map((deal) =>
            deal.id === dealId
              ? {
                  ...deal,
                  ownerId: previousOwnerId,
                  ownerName: previousOwnerName,
                  ownerInitials: previousOwnerInitials,
                  ownerAvatarUrl: previousOwnerAvatarUrl,
                }
              : deal
          )
        )
        toast.error(payload?.error || t('deals.assignError'))
      }
    } catch (error) {
      setDeals((prev) =>
        prev.map((deal) =>
          deal.id === dealId
            ? {
                ...deal,
                ownerId: previousOwnerId,
                ownerName: previousOwnerName,
                ownerInitials: previousOwnerInitials,
                ownerAvatarUrl: previousOwnerAvatarUrl,
              }
            : deal
        )
      )
      toast.error(error instanceof Error ? error.message : t('deals.assignError'))
    } finally {
      setOwnerUpdatingId((prev) => (prev === dealId ? null : prev))
    }
  }

  const totalPipelineValue = sortedDeals.reduce((sum, deal) => sum + deal.value, 0)

  return (
    <div className="flex min-h-full flex-col -mx-4 -mt-4 lg:-mx-8 lg:-mt-8">
      <div className="px-6 lg:px-10 py-6 space-y-4 bg-[#f5f6f8] dark:bg-[#101722]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-[#0d121c] dark:text-white text-3xl font-black tracking-tight">{t('nav.deals')}</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/deals/new"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              {t('dashboard.quickActions.newDeal')}
            </Link>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">view_kanban</span>
                {t('deals.viewBoard')}
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">list</span>
                {t('deals.viewList')}
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-9 px-3">
            <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t('deals.searchPlaceholder')}
              className="bg-transparent text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none w-48"
            />
          </div>

          <div className="relative">
            <span className="material-symbols-outlined text-[18px] text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">person</span>
            <select
              value={ownerFilter}
              onChange={(event) => setOwnerFilter(event.target.value)}
              className="appearance-none rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-9 pl-9 pr-9 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              <option value="all">{t('deals.ownerFilterAll')}</option>
              <option value="unassigned">{t('deals.ownerFilterUnassigned')}</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined text-[18px] text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">calendar_today</span>
            <select
              value={dateFilter}
              onChange={(event) => setDateFilter(event.target.value)}
              className="appearance-none rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-9 pl-9 pr-9 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              <option value="thisMonth">{t('deals.dateFilters.thisMonth')}</option>
              <option value="last7">{t('deals.dateFilters.last7Days')}</option>
              <option value="last30">{t('deals.dateFilters.last30Days')}</option>
              <option value="last90">{t('deals.dateFilters.last90Days')}</option>
              <option value="all">{t('deals.dateFilters.all')}</option>
            </select>
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>

          <div className="relative">
            <span className="material-symbols-outlined text-[18px] text-slate-500 absolute left-3 top-1/2 -translate-y-1/2">sort</span>
            <select
              value={sortFilter}
              onChange={(event) => setSortFilter(event.target.value)}
              className="appearance-none rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 h-9 pl-9 pr-9 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
            >
              <option value="newest">{t('deals.sort.newest')}</option>
              <option value="oldest">{t('deals.sort.oldest')}</option>
              <option value="valueHigh">{t('deals.sort.valueHigh')}</option>
              <option value="valueLow">{t('deals.sort.valueLow')}</option>
            </select>
            <span className="material-symbols-outlined text-[18px] text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">expand_more</span>
          </div>

          <div className="h-6 w-[1px] bg-slate-300 dark:bg-slate-700 mx-1"></div>
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg bg-primary/10 text-primary h-9 px-3 hover:bg-primary/20 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            <span className="text-sm font-bold">{t('deals.filters')}</span>
          </button>
        </div>

        {showFilters && (
          <div className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex flex-wrap gap-6 items-end">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('deals.filtersPanel.stages')}</p>
                <div className="flex flex-wrap gap-2">
                  {stageConfigs.map((stage) => (
                    <button
                      key={stage.id}
                      onClick={() => toggleStageFilter(stage.id)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        stageFilters.includes(stage.id)
                          ? 'bg-primary text-white border-primary'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
                      }`}
                    >
                      {stage.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{t('deals.filtersPanel.valueRange')}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={minValue}
                    onChange={(event) => setMinValue(event.target.value)}
                    placeholder={t('deals.filtersPanel.minValue')}
                    className="h-9 w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200"
                  />
                  <input
                    type="number"
                    value={maxValue}
                    onChange={(event) => setMaxValue(event.target.value)}
                    placeholder={t('deals.filtersPanel.maxValue')}
                    className="h-9 w-28 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200"
                  />
                </div>
              </div>

              <button
                onClick={resetExtraFilters}
                className="ml-auto text-sm font-semibold text-slate-500 hover:text-slate-700"
              >
                {t('deals.filtersPanel.reset')}
              </button>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto px-6 lg:px-10 pb-10 custom-scrollbar snap-x snap-mandatory">
          {sortedDeals.length === 0 && (
            <div className="mb-6 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/40 p-6 text-center">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t('deals.empty.title')}</p>
              <p className="text-xs text-slate-400 mt-1">{t('deals.empty.subtitle')}</p>
              <button
                onClick={resetExtraFilters}
                className="mt-3 text-xs font-semibold text-primary hover:underline"
              >
                {t('deals.filtersPanel.reset')}
              </button>
            </div>
          )}
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-6 h-full min-h-[600px]">
              {stageConfigs
                .filter(stage => stage.id !== 'lost')
                .map(stage => {
                  const totals = getStageTotals(stage.id)
                  const borderClass = stage.id === 'proposal' ? 'border-b-2 border-primary/20 pb-2' : ''
                  const titleClass = stage.id === 'won' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                  const countClass =
                    stage.id === 'proposal'
                      ? 'bg-primary/10 text-primary'
                      : stage.id === 'won'
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'

                  return (
                    <DroppableColumn key={stage.id} stageId={stage.id}>
                      <div className={`flex items-center justify-between px-2 py-1 ${borderClass}`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${titleClass}`}>{stage.label}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${countClass}`}>
                            {totals.count}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-500">{formatCurrency(totals.value, locale === 'en' ? 'en-US' : 'tr-TR', currency)}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        {dealsByStage(stage.id).map((deal) => (
                          <DraggableDeal
                            key={deal.id}
                            deal={deal}
                            highlight={stage.id === 'proposal'}
                            won={stage.id === 'won'}
                          />
                        ))}
                      </div>
                    </DroppableColumn>
                  )
                })}

              {!showLost ? (
                <div
                  onClick={() => setShowLost(true)}
                  className="collapsed-column snap-start bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center py-6 gap-6 group hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-slate-400 group-hover:text-primary">unfold_more</span>
                  <div className="flex items-center flex-col gap-1 h-full">
                    <p className="[writing-mode:vertical-lr] font-bold text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300 uppercase tracking-widest text-sm">
                      {t('stages.lost')}
                    </p>
                    <span className="mt-4 px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded-full text-[11px] font-bold text-slate-500">
                      {getStageTotals('lost').count}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-slate-400">add_circle</span>
                </div>
              ) : (
                <DroppableColumn stageId="lost">
                  <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-red-600 dark:text-red-400">{t('stages.lost')}</span>
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 rounded-full text-[11px] font-bold text-red-600 dark:text-red-400">
                        {getStageTotals('lost').count}
                      </span>
                    </div>
                    <button onClick={() => setShowLost(false)} className="text-slate-400 hover:text-slate-600">
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                  <div className="flex flex-col gap-3">
                    {dealsByStage('lost').map((deal) => (
                      <DraggableDeal key={deal.id} deal={deal} />
                    ))}
                  </div>
                </DroppableColumn>
              )}
            </div>
          </DndContext>
        </div>
      )}

      {viewMode === 'list' && (
        <div className="flex-1 px-6 lg:px-10 pb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('deals.table.company')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('deals.table.deal')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('deals.table.stage')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('deals.table.owner')}</th>
                  <th className="text-right px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('deals.table.value')}</th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase">{t('deals.table.lastActivity')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {sortedDeals.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                      {t('deals.empty.subtitle')}
                    </td>
                  </tr>
                ) : sortedDeals.map((deal) => {
                  const stage = stageConfigs.find(item => item.id === deal.stage)
                  return (
                    <tr key={deal.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{deal.company}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 dark:text-slate-100">{deal.title}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.stage}
                          disabled={stageUpdatingId === deal.id}
                          onChange={(event) => applyStageChange(deal.id, event.target.value as StageId)}
                          className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold text-slate-600 dark:text-slate-200"
                        >
                          {stageConfigs.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={deal.ownerId ?? ''}
                          disabled={ownerUpdatingId === deal.id}
                          onChange={(event) => handleAssignOwner(deal.id, event.target.value)}
                          className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 text-xs font-semibold text-slate-600 dark:text-slate-200"
                        >
                          <option value="" disabled>
                            {t('deals.ownerSelectPlaceholder')}
                          </option>
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-primary font-extrabold">{formatCurrency(deal.value, locale === 'en' ? 'en-US' : 'tr-TR', currency)}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">{formatRelativeTime(deal.updatedAt, t)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className="mt-auto sticky bottom-0 z-10 h-12 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur px-6 flex items-center justify-between text-xs text-slate-400 font-medium">
        <div className="flex items-center gap-4">
          <div className="flex -space-x-2">
            <div className="size-6 rounded-full border border-white dark:border-slate-800 bg-slate-300"></div>
            <div className="size-6 rounded-full border border-white dark:border-slate-800 bg-slate-300"></div>
            <div className="size-6 rounded-full border border-white dark:border-slate-800 bg-slate-300 flex items-center justify-center text-[8px] text-slate-600">+3</div>
          </div>
          <span>{t('deals.footer.online', { count: 5 })}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>{t('deals.footer.totalPipeline')}: <strong className="text-slate-600 dark:text-slate-300">{formatCurrency(totalPipelineValue, locale === 'en' ? 'en-US' : 'tr-TR', currency)}</strong></span>
          <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800"></div>
          <span>{t('deals.footer.updated')}: {formatRelativeTime(new Date().toISOString(), t)}</span>
        </div>
      </footer>

      <style jsx>{`
        .kanban-column {
          min-width: 320px;
          max-width: 320px;
        }
        .collapsed-column {
          min-width: 60px;
          max-width: 60px;
        }
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  )
}

function DroppableColumn({
  stageId,
  children,
  className,
}: {
  stageId: StageId
  children: React.ReactNode
  className?: string
}) {
  const { setNodeRef } = useDroppable({ id: `stage-${stageId}` })

  return (
    <div ref={setNodeRef} className={`kanban-column snap-start flex flex-col gap-4 ${className ?? ''}`}>
      {children}
    </div>
  )
}

function DraggableDeal({ deal, highlight, won }: { deal: DealCardData; highlight?: boolean; won?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `deal-${deal.id}`,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {won ? (
        <WonDealCard deal={deal} disableLink={isDragging} />
      ) : (
        <DealCard deal={deal} highlight={highlight} disableLink={isDragging} />
      )}
    </div>
  )
}

function DealCard({ deal, highlight, disableLink }: { deal: DealCardData; highlight?: boolean; disableLink?: boolean }) {
  const { t, locale } = useI18n()
  const activity = getActivityMeta(deal.stage, deal.updatedAt, t)
  const avatarStyle = getAvatarStyle(deal.ownerInitials)
  const isLost = deal.stage === 'lost'
  const currency = locale === 'en' ? 'USD' : 'TRY'

  return (
    <Link
      href={`/deals/${deal.id}`}
      onClick={(event) => {
        if (disableLink) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      className={`block p-4 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${
        isLost
          ? 'bg-red-50/70 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 hover:border-red-200'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary/30'
      } ${highlight ? 'border-l-4 border-l-primary' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{deal.company}</span>
        <span className="material-symbols-outlined text-slate-300 group-hover:text-primary text-[20px]">more_horiz</span>
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 leading-snug">{deal.title}</h3>

      {deal.stage === 'proposal' && (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold mb-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined text-[14px]">description</span>
          {t('deals.badges.proposalSent')}
        </div>
      )}

      {deal.stage === 'negotiation' && (
        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 text-blue-600 text-[10px] font-bold mb-3">
          <span className="material-symbols-outlined text-[14px]">forum</span>
          {t('deals.badges.meetingWaiting')}
        </div>
      )}

      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className={`font-extrabold text-lg ${isLost ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
            {formatCurrency(deal.value, locale === 'en' ? 'en-US' : 'tr-TR', currency)}
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs ${
              activity.tone === 'urgent'
                ? 'text-amber-500 font-semibold'
                : activity.tone === 'muted'
                  ? 'text-slate-400'
                  : 'text-slate-500'
            }`}
          >
            {activity.icon && <span className="material-symbols-outlined text-[14px]">{activity.icon}</span>}
            {activity.label}
          </div>
        </div>
        {deal.ownerAvatarUrl ? (
          <div
            className="size-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-100 bg-cover bg-center"
            style={{ backgroundImage: `url(\"${deal.ownerAvatarUrl}\")` }}
          />
        ) : (
          <div className={`size-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white ring-1 ring-slate-100 ${avatarStyle.bg} ${avatarStyle.text}`}>
            {deal.ownerInitials}
          </div>
        )}
      </div>
    </Link>
  )
}

function WonDealCard({ deal, disableLink }: { deal: DealCardData; disableLink?: boolean }) {
  const { t, locale } = useI18n()
  const activity = getActivityMeta(deal.stage, deal.updatedAt, t)
  const avatarStyle = getAvatarStyle(deal.ownerInitials)
  const currency = locale === 'en' ? 'USD' : 'TRY'

  return (
    <Link
      href={`/deals/${deal.id}`}
      onClick={(event) => {
        if (disableLink) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      className="block bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
    >
      <div className="absolute -right-2 -top-2 text-emerald-200/50 dark:text-emerald-900/20 pointer-events-none">
        <span className="material-symbols-outlined text-[80px]">check_circle</span>
      </div>
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-600">{deal.company}</span>
        <span className="material-symbols-outlined text-emerald-300 group-hover:text-emerald-500 text-[20px]">verified</span>
      </div>
      <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug">{deal.title}</h3>

      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold mb-3">
        {t('deals.badges.completed')}
      </div>

      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <div className="text-emerald-600 font-extrabold text-lg">{formatCurrency(deal.value, locale === 'en' ? 'en-US' : 'tr-TR', currency)}</div>
          <div className="text-slate-400 text-xs">{activity.label}</div>
        </div>
        {deal.ownerAvatarUrl ? (
          <div
            className="size-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-100 bg-cover bg-center"
            style={{ backgroundImage: `url(\"${deal.ownerAvatarUrl}\")` }}
          />
        ) : (
          <div className={`size-8 rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white ring-1 ring-slate-100 ${avatarStyle.bg} ${avatarStyle.text}`}>
            {deal.ownerInitials}
          </div>
        )}
      </div>
    </Link>
  )
}

function getTargetStage(overId: unknown, deals: DealCardData[]): StageId | null {
  const id = String(overId)
  if (id.startsWith('stage-')) {
    return id.replace('stage-', '') as StageId
  }

  if (id.startsWith('deal-')) {
    const dealId = id.replace('deal-', '')
    const deal = deals.find(item => item.id === dealId)
    return deal?.stage ?? null
  }

  return null
}
