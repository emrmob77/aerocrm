'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { useSupabase } from '@/hooks/use-supabase'
import type { Database } from '@/types/database'
import { useI18n } from '@/lib/i18n'
import {
  formatCurrency,
  formatRelativeTime,
  getInitials,
  filterContacts,
  isWithinDays,
  getCustomFields,
  parseContactTags,
  normalizeTagInput,
  type ContactFilterInput,
  type ContactFilterType,
} from './contact-utils'

export type ContactListItem = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  createdAt: string | null
  updatedAt: string | null
  totalValue: number
  lastActivityAt: string | null
  dealsCount: number
  customFields?: Database['public']['Tables']['contacts']['Row']['custom_fields'] | null
  tags?: string[]
}

type ViewMode = 'list' | 'card'
type SortKey = 'name' | 'value' | 'activity'
type Density = 'comfortable' | 'compact'
type ColumnKey = 'email' | 'phone' | 'company' | 'value' | 'activity'
type ColumnVisibility = Record<ColumnKey, boolean>
type AdvancedFilters = {
  minValue: string
  maxValue: string
  lastActivityDays: 'all' | '7' | '30' | '90' | '365'
  hasEmail: boolean
  hasPhone: boolean
  hasCompany: boolean
  hasDeals: boolean
}

type ViewSettingsPayload = {
  viewMode?: ViewMode
  rowsPerPage?: number
  density?: Density
  columnVisibility?: Partial<ColumnVisibility>
}

const avatarPalette = [
  { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-600 dark:text-blue-200' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-600 dark:text-emerald-200' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-600 dark:text-amber-200' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-600 dark:text-purple-200' },
]

const getAvatarStyle = (seed: string) => {
  const hash = seed.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return avatarPalette[hash % avatarPalette.length]
}

type ContactRow = Database['public']['Tables']['contacts']['Row']
type DealRow = Database['public']['Tables']['deals']['Row']

const settingsStorageKey = 'aero:contacts:view-settings'
const settingsContext = 'contacts'

const defaultColumns: ColumnVisibility = {
  email: true,
  phone: true,
  company: true,
  value: true,
  activity: true,
}

const defaultAdvancedFilters: AdvancedFilters = {
  minValue: '',
  maxValue: '',
  lastActivityDays: 'all',
  hasEmail: false,
  hasPhone: false,
  hasCompany: false,
  hasDeals: false,
}


export function ContactsDirectory({
  initialContacts,
  teamId,
  userId,
}: {
  initialContacts: ContactListItem[]
  teamId: string | null
  userId: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = useSupabase()
  const { t, get, locale } = useI18n()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const currency = locale === 'en' ? 'USD' : 'TRY'
  const [contacts, setContacts] = useState<ContactListItem[]>(initialContacts)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<ContactFilterType>('all')
  const [sortKey, setSortKey] = useState<SortKey>('activity')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [density, setDensity] = useState<Density>('comfortable')
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(defaultColumns)
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tagSaving, setTagSaving] = useState(false)
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilters>(defaultAdvancedFilters)
  const [settingsReady, setSettingsReady] = useState(false)
  const [filtersReady, setFiltersReady] = useState(false)
  const settingsSaveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasLoadedSettings = useRef(false)

  const filterOptions = useMemo(
    () => [
      { id: 'all' as const, label: t('contacts.filters.all') },
      { id: 'new' as const, label: t('contacts.filters.new') },
      { id: 'highValue' as const, label: t('contacts.filters.highValue') },
      { id: 'inactive' as const, label: t('contacts.filters.inactive') },
    ],
    [t]
  )

  const readBooleanParam = (value: string | null) => value === '1' || value === 'true'

  const readFiltersFromUrl = () => {
    const rawFilter = searchParams.get('filter')
    const filterValue: ContactFilterType =
      rawFilter === 'new' || rawFilter === 'highValue' || rawFilter === 'inactive' ? rawFilter : 'all'
    const lastActivity = searchParams.get('activity')
    const lastActivityDays =
      lastActivity === '7' || lastActivity === '30' || lastActivity === '90' || lastActivity === '365'
        ? lastActivity
        : 'all'

    return {
      query: searchParams.get('q') ?? '',
      activeFilter: filterValue,
      advancedFilters: {
        minValue: searchParams.get('min') ?? '',
        maxValue: searchParams.get('max') ?? '',
        lastActivityDays,
        hasEmail: readBooleanParam(searchParams.get('hasEmail')),
        hasPhone: readBooleanParam(searchParams.get('hasPhone')),
        hasCompany: readBooleanParam(searchParams.get('hasCompany')),
        hasDeals: readBooleanParam(searchParams.get('hasDeals')),
      } as AdvancedFilters,
    }
  }

  const applyViewSettings = (settings: ViewSettingsPayload | null | undefined) => {
    if (!settings) return
    if (settings.viewMode === 'list' || settings.viewMode === 'card') {
      setViewMode(settings.viewMode)
    }
    if (typeof settings.rowsPerPage === 'number' && [25, 50, 100].includes(settings.rowsPerPage)) {
      setRowsPerPage(settings.rowsPerPage)
    }
    if (settings.density === 'comfortable' || settings.density === 'compact') {
      setDensity(settings.density)
    }
    if (settings.columnVisibility) {
      setColumnVisibility({ ...defaultColumns, ...settings.columnVisibility })
    }
  }

  useEffect(() => {
    if (!userId || hasLoadedSettings.current) return
    hasLoadedSettings.current = true

    const load = async () => {
      let applied = false
      const { data } = await supabase
        .from('user_view_settings')
        .select('settings')
        .eq('user_id', userId)
        .eq('context', settingsContext)
        .maybeSingle()

      if (data?.settings) {
        applyViewSettings(data.settings as ViewSettingsPayload)
        applied = true
      }

      if (!applied && typeof window !== 'undefined') {
        const saved = window.localStorage.getItem(settingsStorageKey)
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as ViewSettingsPayload
            applyViewSettings(parsed)
          } catch {
            // ignore invalid local storage
          }
        }
      }

      setSettingsReady(true)
    }

    load()
  }, [supabase, userId])

  useEffect(() => {
    if (!settingsReady || !userId) return

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        settingsStorageKey,
        JSON.stringify({
          viewMode,
          rowsPerPage,
          density,
          columnVisibility,
        })
      )
    }

    if (settingsSaveTimeout.current) {
      clearTimeout(settingsSaveTimeout.current)
    }
    settingsSaveTimeout.current = setTimeout(async () => {
      await supabase.from('user_view_settings').upsert(
        {
          user_id: userId,
          context: settingsContext,
          settings: {
            viewMode,
            rowsPerPage,
            density,
            columnVisibility,
          },
        },
        { onConflict: 'user_id,context' }
      )
    }, 600)

    return () => {
      if (settingsSaveTimeout.current) {
        clearTimeout(settingsSaveTimeout.current)
      }
    }
  }, [settingsReady, userId, viewMode, rowsPerPage, density, columnVisibility, supabase])

  useEffect(() => {
    setContacts(
      initialContacts.map((contact) => ({
        ...contact,
        customFields: getCustomFields(contact.customFields) ?? contact.customFields ?? null,
        tags: contact.tags ?? parseContactTags(getCustomFields(contact.customFields)),
      }))
    )
  }, [initialContacts])

  useEffect(() => {
    const next = readFiltersFromUrl()
    if (next.query !== query) {
      setQuery(next.query)
    }
    if (next.activeFilter !== activeFilter) {
      setActiveFilter(next.activeFilter)
    }
    if (JSON.stringify(next.advancedFilters) !== JSON.stringify(advancedFilters)) {
      setAdvancedFilters(next.advancedFilters)
    }
    setFiltersReady(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (!teamId && !userId) {
      return
    }

    const contactFilter = teamId ? `team_id=eq.${teamId}` : `user_id=eq.${userId}`
    const dealFilter = teamId ? `team_id=eq.${teamId}` : `user_id=eq.${userId}`

    const updateContactStats = async (contactId: string) => {
      let dealsQuery = supabase
        .from('deals')
        .select('value, updated_at, created_at')
        .eq('contact_id', contactId)

      if (teamId) {
        dealsQuery = dealsQuery.eq('team_id', teamId)
      } else if (userId) {
        dealsQuery = dealsQuery.eq('user_id', userId)
      }

      const { data: deals } = await dealsQuery
      const rows = (deals ?? []) as Pick<DealRow, 'value' | 'updated_at' | 'created_at'>[]

      const stats = rows.reduce(
        (acc, deal) => {
          const value = deal.value ?? 0
          const updatedAt = deal.updated_at ?? deal.created_at
          acc.totalValue += value
          acc.dealsCount += 1
          if (updatedAt && new Date(updatedAt) > new Date(acc.lastActivityAt)) {
            acc.lastActivityAt = updatedAt
          }
          return acc
        },
        { totalValue: 0, dealsCount: 0, lastActivityAt: '' }
      )

      setContacts((prev) =>
        prev.map((contact) => {
          if (contact.id !== contactId) {
            return contact
          }

          const fallbackLast = contact.updatedAt ?? contact.createdAt
          const lastActivityAt = stats.dealsCount > 0 ? stats.lastActivityAt : fallbackLast

          return {
            ...contact,
            totalValue: stats.totalValue,
            dealsCount: stats.dealsCount,
            lastActivityAt,
          }
        })
      )
    }

    const channel = supabase
      .channel('contacts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contacts', filter: contactFilter },
        (payload) => {
          const row = payload.new as ContactRow
          if (!row?.id) return

          setContacts((prev) => {
            if (prev.some((contact) => contact.id === row.id)) {
              return prev
            }

            return [
              {
                id: row.id,
                fullName: row.full_name,
                email: row.email,
                phone: row.phone,
                company: row.company,
                position: row.position,
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                totalValue: 0,
                lastActivityAt: row.updated_at ?? row.created_at,
                dealsCount: 0,
                customFields: getCustomFields(row.custom_fields),
                tags: parseContactTags(getCustomFields(row.custom_fields)),
              },
              ...prev,
            ]
          })

          updateContactStats(row.id)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contacts', filter: contactFilter },
        (payload) => {
          const row = payload.new as ContactRow
          if (!row?.id) return

          setContacts((prev) =>
            prev.map((contact) => {
              if (contact.id !== row.id) {
                return contact
              }

              const updatedAt = row.updated_at ?? contact.updatedAt
              const customFields = getCustomFields(row.custom_fields) ?? contact.customFields ?? null
              const lastActivityAt =
                updatedAt && contact.lastActivityAt && new Date(updatedAt) > new Date(contact.lastActivityAt)
                  ? updatedAt
                  : contact.lastActivityAt ?? updatedAt

              return {
                ...contact,
                fullName: row.full_name,
                email: row.email,
                phone: row.phone,
                company: row.company,
                position: row.position,
                createdAt: row.created_at,
                updatedAt,
                lastActivityAt,
                customFields,
                tags: parseContactTags(customFields),
              }
            })
          )
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'contacts', filter: contactFilter },
        (payload) => {
          const row = payload.old as ContactRow
          if (!row?.id) return

          setContacts((prev) => prev.filter((contact) => contact.id !== row.id))
          setSelectedContacts((prev) => prev.filter((id) => id !== row.id))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'deals', filter: dealFilter },
        (payload) => {
          const row = payload.new as DealRow
          if (!row?.contact_id) return
          updateContactStats(row.contact_id)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'deals', filter: dealFilter },
        (payload) => {
          const row = payload.new as DealRow
          const oldRow = payload.old as DealRow

          if (oldRow?.contact_id && oldRow.contact_id !== row?.contact_id) {
            updateContactStats(oldRow.contact_id)
          }

          if (row?.contact_id) {
            updateContactStats(row.contact_id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'deals', filter: dealFilter },
        (payload) => {
          const row = payload.old as DealRow
          if (!row?.contact_id) return
          updateContactStats(row.contact_id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, teamId, userId])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, activeFilter, rowsPerPage, advancedFilters])

  useEffect(() => {
    if (!filtersReady) return
    const params = new URLSearchParams()
    if (query.trim()) {
      params.set('q', query.trim())
    }
    if (activeFilter !== 'all') {
      params.set('filter', activeFilter)
    }
    if (advancedFilters.minValue) {
      params.set('min', advancedFilters.minValue)
    }
    if (advancedFilters.maxValue) {
      params.set('max', advancedFilters.maxValue)
    }
    if (advancedFilters.lastActivityDays !== 'all') {
      params.set('activity', advancedFilters.lastActivityDays)
    }
    if (advancedFilters.hasEmail) params.set('hasEmail', '1')
    if (advancedFilters.hasPhone) params.set('hasPhone', '1')
    if (advancedFilters.hasCompany) params.set('hasCompany', '1')
    if (advancedFilters.hasDeals) params.set('hasDeals', '1')

    const next = params.toString()
    const current = searchParams.toString()
    if (next !== current) {
      const nextUrl = next ? `${pathname}?${next}` : pathname
      router.replace(nextUrl, { scroll: false })
    }
  }, [filtersReady, query, activeFilter, advancedFilters, pathname, router, searchParams])

  const filteredContacts = useMemo(() => {
    const base = filterContacts(contacts as ContactFilterInput[], query, activeFilter) as ContactListItem[]
    const minValue = Number(advancedFilters.minValue)
    const maxValue = Number(advancedFilters.maxValue)
    const hasMinValue = Number.isFinite(minValue) && advancedFilters.minValue !== ''
    const hasMaxValue = Number.isFinite(maxValue) && advancedFilters.maxValue !== ''
    return base.filter((contact) => {
      if (advancedFilters.hasEmail && !contact.email) return false
      if (advancedFilters.hasPhone && !contact.phone) return false
      if (advancedFilters.hasCompany && !contact.company) return false
      if (advancedFilters.hasDeals && contact.dealsCount === 0) return false

      if (hasMinValue && contact.totalValue < minValue) return false
      if (hasMaxValue && contact.totalValue > maxValue) return false

      if (advancedFilters.lastActivityDays !== 'all') {
        const days = Number(advancedFilters.lastActivityDays)
        const lastActivityAt =
          contact.lastActivityAt ?? contact.updatedAt ?? contact.createdAt ?? new Date().toISOString()
        if (!isWithinDays(lastActivityAt, days)) {
          return false
        }
      }

      return true
    })
  }, [contacts, query, activeFilter, advancedFilters])

  const activeAdvancedFilters = useMemo(() => {
    let count = 0
    if (advancedFilters.hasEmail) count += 1
    if (advancedFilters.hasPhone) count += 1
    if (advancedFilters.hasCompany) count += 1
    if (advancedFilters.hasDeals) count += 1
    if (advancedFilters.minValue) count += 1
    if (advancedFilters.maxValue) count += 1
    if (advancedFilters.lastActivityDays !== 'all') count += 1
    return count
  }, [advancedFilters])

  const sortedContacts = useMemo(() => {
    const sorted = [...filteredContacts]
    sorted.sort((a, b) => {
      let comparison = 0
      if (sortKey === 'name') {
        comparison = a.fullName.localeCompare(b.fullName)
      } else if (sortKey === 'value') {
        comparison = a.totalValue - b.totalValue
      } else {
        comparison = new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime()
      }

      return sortDir === 'asc' ? comparison : -comparison
    })
    return sorted
  }, [filteredContacts, sortKey, sortDir])

  const totalContacts = sortedContacts.length
  const totalPages = Math.max(1, Math.ceil(totalContacts / rowsPerPage))
  const pageContacts = sortedContacts.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('desc')
  }

  const toggleSelection = (id: string) => {
    setSelectedContacts((prev) => (prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]))
  }

  const toggleAllSelection = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map((contact) => contact.id))
    }
  }

  const copyToClipboard = async (text?: string | null) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success(t('common.copied'))
    } catch {
      toast.error(t('common.copyFailed'))
    }
  }

  const handleExport = () => {
    const selected = contacts.filter((contact) => selectedContacts.includes(contact.id))
    if (selected.length === 0) return

    const header =
      (get('contacts.export.headers') as string[] | null) ?? [
        t('contacts.table.name'),
        t('contacts.table.email'),
        t('contacts.table.phone'),
        t('contacts.table.company'),
        t('contacts.table.totalValue'),
        t('contacts.table.lastActivity'),
      ]
    const rows = selected.map((contact) => [
      contact.fullName,
      contact.email ?? '',
      contact.phone ?? '',
      contact.company ?? '',
      contact.totalValue.toString(),
      contact.lastActivityAt,
    ])

    const csv = [header, ...rows].map((row) => row.map((value) => `"${value}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = t('contacts.export.fileName')
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return

    if (!confirm(t('contacts.confirmDelete'))) {
      return
    }

    const { error } = await supabase.from('contacts').delete().in('id', ids)
    if (error) {
      console.error('Delete contacts error:', error)
      toast.error(t('contacts.deleteError'))
      return
    }

    setContacts((prev) => prev.filter((contact) => !ids.includes(contact.id)))
    setSelectedContacts((prev) => prev.filter((id) => !ids.includes(id)))
    toast.success(t('contacts.deleted'))
  }

  const handleTag = () => {
    setTagInput('')
    setShowTagModal(true)
  }

  const applyTags = async () => {
    if (selectedContacts.length === 0) return
    const tags = normalizeTagInput(tagInput)
    if (tags.length === 0) {
      toast.error(t('contacts.tags.errors.empty'))
      return
    }

    setTagSaving(true)
    try {
      const updates = selectedContacts.map(async (contactId) => {
        const contact = contacts.find((item) => item.id === contactId)
        const baseFields = getCustomFields(contact?.customFields) ?? {}
        const existingTags = parseContactTags(baseFields)
        const mergedTags = Array.from(new Set([...existingTags, ...tags]))
        const customFields = { ...baseFields, tags: mergedTags }
        const { error } = await supabase.from('contacts').update({ custom_fields: customFields }).eq('id', contactId)
        if (error) {
          throw error
        }
        return { contactId, customFields, tags: mergedTags }
      })

      const results = await Promise.all(updates)
      setContacts((prev) =>
        prev.map((contact) => {
          const updated = results.find((item) => item.contactId === contact.id)
          if (!updated) return contact
          return {
            ...contact,
            customFields: updated.customFields,
            tags: updated.tags,
          }
        })
      )
      toast.success(t('contacts.tags.success'))
      setShowTagModal(false)
      setTagInput('')
    } catch (error) {
      const message = error instanceof Error ? error.message : t('contacts.tags.errors.failed')
      toast.error(message)
    } finally {
      setTagSaving(false)
    }
  }

  const clearAdvancedFilters = () => {
    setAdvancedFilters(defaultAdvancedFilters)
  }

  const resetViewSettings = () => {
    setViewMode('list')
    setRowsPerPage(25)
    setDensity('comfortable')
    setColumnVisibility(defaultColumns)
  }

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) {
      return <span className="material-symbols-outlined text-[16px] text-gray-400">swap_vert</span>
    }
    return (
      <span className="material-symbols-outlined text-[16px] text-primary">
        {sortDir === 'asc' ? 'north' : 'south'}
      </span>
    )
  }

  const visibleColumnCount = Object.values(columnVisibility).filter(Boolean).length
  const tableColSpan = 2 + visibleColumnCount + 1
  const rowPadding = density === 'compact' ? 'py-2' : 'py-4'
  const headerPadding = density === 'compact' ? 'py-3' : 'py-4'

  return (
    <div className="w-full">
      <div className="px-6 lg:px-10 py-6 space-y-6 bg-[#f5f6f8] dark:bg-[#101722]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">{t('contacts.title')}</h1>
            <p className="text-[#48679d] dark:text-gray-400 mt-1">{t('contacts.subtitle')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-[#ced8e9] dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'text-[#48679d] dark:text-gray-300 hover:text-primary'
                }`}
              >
                {t('contacts.view.list')}
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === 'card' ? 'bg-primary text-white' : 'text-[#48679d] dark:text-gray-300 hover:text-primary'
                }`}
              >
                {t('contacts.view.card')}
              </button>
            </div>
            <Link
              href="/contacts/new"
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              {t('contacts.new')}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#48679d] text-[20px]">search</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('contacts.searchPlaceholder')}
                className="w-full bg-white dark:bg-slate-800 border border-[#ced8e9] dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-[#0d121c] dark:text-white placeholder:text-[#48679d] focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#48679d] dark:text-gray-400">{t('contacts.filterLabel')}</span>
              <select
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as ContactFilterType)}
                className="bg-white dark:bg-slate-800 border border-[#ced8e9] dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-semibold text-[#0d121c] dark:text-white"
              >
                {filterOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilterPanel(true)}
              className="relative p-2 text-[#48679d] hover:bg-white/70 dark:hover:bg-slate-800 rounded-lg"
            >
              <span className="material-symbols-outlined">filter_list</span>
              {activeAdvancedFilters > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {activeAdvancedFilters}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSettingsPanel(true)}
              className="p-2 text-[#48679d] hover:bg-white/70 dark:hover:bg-slate-800 rounded-lg"
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="px-6 lg:px-10 pb-10">
          <div className="bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto lg:overflow-x-visible">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 dark:bg-gray-900/50 sticky top-0 z-10">
                  <tr className="border-b border-[#ced8e9] dark:border-gray-800 text-xs uppercase tracking-widest font-bold text-[#48679d]">
                    <th className={`px-6 ${headerPadding} w-10`}>
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                        onChange={toggleAllSelection}
                        className="rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className={`px-4 ${headerPadding}`}>
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-2">
                        {t('contacts.table.name')}
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    {columnVisibility.email && <th className={`px-4 ${headerPadding}`}>{t('contacts.table.email')}</th>}
                    {columnVisibility.phone && <th className={`px-4 ${headerPadding}`}>{t('contacts.table.phone')}</th>}
                    {columnVisibility.company && <th className={`px-4 ${headerPadding}`}>{t('contacts.table.company')}</th>}
                    {columnVisibility.value && (
                      <th className={`px-4 ${headerPadding}`}>
                        <button onClick={() => toggleSort('value')} className="flex items-center gap-2">
                          {t('contacts.table.totalValue')}
                          {renderSortIcon('value')}
                        </button>
                      </th>
                    )}
                    {columnVisibility.activity && (
                      <th className={`px-4 ${headerPadding}`}>
                        <button onClick={() => toggleSort('activity')} className="flex items-center gap-2">
                          {t('contacts.table.lastActivity')}
                          {renderSortIcon('activity')}
                        </button>
                      </th>
                    )}
                    <th className={`px-6 ${headerPadding} text-right`}>{t('contacts.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ced8e9] dark:divide-gray-800">
                  {pageContacts.length === 0 ? (
                    <tr>
                      <td colSpan={tableColSpan} className="px-6 py-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3 block">
                          person_off
                        </span>
                        <p className="text-[#48679d] dark:text-gray-400">{t('contacts.empty')}</p>
                        <Link
                          href="/contacts/new"
                          className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors"
                        >
                          {t('contacts.emptyAction')}
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    pageContacts.map((contact) => {
                      const initials = getInitials(contact.fullName)
                      const avatarStyle = getAvatarStyle(contact.fullName)

                      return (
                        <tr key={contact.id} className="hover:bg-primary/5 transition-colors group">
                          <td className={`px-6 ${rowPadding} ${density === 'compact' ? 'h-12' : 'h-16'}`}>
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => toggleSelection(contact.id)}
                              className="rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className={`px-4 ${rowPadding}`}>
                            <div className="flex items-center gap-3">
                              <div
                                className={`size-9 rounded-lg flex items-center justify-center font-bold ${avatarStyle.bg} ${avatarStyle.text}`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <Link href={`/contacts/${contact.id}`} className="font-semibold text-sm text-[#0d121c] dark:text-white">
                                  {contact.fullName}
                                </Link>
                                <p className="text-xs text-[#48679d] dark:text-gray-400 truncate max-w-[200px]">
                                  {contact.company ?? '—'}
                                </p>
                                {contact.tags && contact.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {contact.tags.slice(0, 3).map((tag) => (
                                      <span
                                        key={tag}
                                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                    {contact.tags.length > 3 && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        +{contact.tags.length - 3}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          {columnVisibility.email && (
                            <td className={`px-4 ${rowPadding}`}>
                              <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400 min-w-0">
                                <span className="truncate max-w-[220px]">{contact.email ?? '—'}</span>
                                {contact.email && (
                                  <button
                                    onClick={() => copyToClipboard(contact.email)}
                                    className="opacity-0 group-hover:opacity-100 text-primary transition-opacity"
                                  >
                                    <span className="material-symbols-outlined text-base">content_copy</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                          {columnVisibility.phone && (
                            <td className={`px-4 ${rowPadding}`}>
                              <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400 min-w-0">
                                <span className="truncate max-w-[160px]">{contact.phone ?? '—'}</span>
                                {contact.phone && (
                                  <a
                                    href={`tel:${contact.phone}`}
                                    className="opacity-0 group-hover:opacity-100 text-primary transition-opacity"
                                  >
                                    <span className="material-symbols-outlined text-base">call</span>
                                  </a>
                                )}
                              </div>
                            </td>
                          )}
                          {columnVisibility.company && (
                            <td className={`px-4 ${rowPadding}`}>
                              <span className="inline-flex max-w-[180px] truncate px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-medium rounded-full">
                                {contact.company ?? '—'}
                              </span>
                            </td>
                          )}
                          {columnVisibility.value && (
                            <td className={`px-4 ${rowPadding}`}>
                              <span className={`font-bold text-sm ${contact.totalValue >= 50000 ? 'text-green-600' : 'text-[#0d121c] dark:text-white'}`}>
                                {formatCurrency(contact.totalValue, formatLocale, currency)}
                              </span>
                            </td>
                          )}
                          {columnVisibility.activity && (
                            <td className={`px-4 ${rowPadding} text-sm text-[#48679d] dark:text-gray-400`}>
                              {formatRelativeTime(contact.lastActivityAt ?? contact.updatedAt ?? contact.createdAt ?? new Date().toISOString(), t)}
                            </td>
                          )}
                          <td className={`px-6 ${rowPadding} text-right`}>
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/contacts/${contact.id}`}
                                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-[#48679d]"
                              >
                                <span className="material-symbols-outlined text-[18px]">visibility</span>
                              </Link>
                              <Link
                                href={`/contacts/${contact.id}/edit`}
                                className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-[#48679d]"
                              >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                              </Link>
                              <button
                                onClick={() => handleDelete([contact.id])}
                                className="p-2 hover:bg-red-50 rounded-lg text-red-600"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-6 py-4 bg-gray-50/60 dark:bg-gray-900/50 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#ced8e9] dark:border-gray-800">
              <span className="text-sm text-[#48679d] dark:text-gray-400">
                {t('contacts.pagination', {
                  start: totalContacts === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1,
                  end: totalContacts === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalContacts),
                  total: totalContacts,
                })}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                <span className="text-sm font-semibold text-[#48679d] dark:text-gray-400">{currentPage} / {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400">
                <span>{t('contacts.rowsPerPage')}</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className="bg-transparent border-none focus:ring-0 text-sm font-semibold py-0 pr-8"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'card' && (
        <div className="px-6 lg:px-10 pb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pageContacts.map((contact) => {
              const initials = getInitials(contact.fullName)
              const avatarStyle = getAvatarStyle(contact.fullName)

              return (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className={`bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all group ${
                    density === 'compact' ? 'p-4' : 'p-5'
                  }`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`size-12 rounded-xl flex items-center justify-center font-bold ${avatarStyle.bg} ${avatarStyle.text}`}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0d121c] dark:text-white">{contact.fullName}</h3>
                      <p className="text-sm text-[#48679d] dark:text-gray-400 truncate max-w-[220px]">
                        {contact.company ?? '—'}
                      </p>
                      {contact.tags && contact.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {contact.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary"
                            >
                              {tag}
                            </span>
                          ))}
                          {contact.tags.length > 3 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              +{contact.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-[#48679d] dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      <span>{contact.email ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">call</span>
                      <span>{contact.phone ?? '—'}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[#48679d] dark:text-gray-400">
                    <span>
                      {formatRelativeTime(
                        contact.lastActivityAt ?? contact.updatedAt ?? contact.createdAt ?? new Date().toISOString(),
                        t
                      )}
                    </span>
                    <span className="font-semibold text-[#0d121c] dark:text-white">
                      {formatCurrency(contact.totalValue, formatLocale, currency)}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {showFilterPanel && (
        <div className="fixed inset-0 z-[60] flex">
          <button
            aria-label={t('common.close')}
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowFilterPanel(false)}
          />
          <div className="relative ml-auto h-full w-full max-w-md bg-white dark:bg-[#101722] border-l border-[#e7ebf4] dark:border-gray-800 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('contacts.filters.advancedTitle')}</h2>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#48679d]">{t('contacts.filters.presence')}</p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm text-[#0d121c] dark:text-white">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedFilters.hasEmail}
                      onChange={(event) =>
                        setAdvancedFilters((prev) => ({ ...prev, hasEmail: event.target.checked }))
                      }
                    />
                    {t('contacts.filters.hasEmail')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedFilters.hasPhone}
                      onChange={(event) =>
                        setAdvancedFilters((prev) => ({ ...prev, hasPhone: event.target.checked }))
                      }
                    />
                    {t('contacts.filters.hasPhone')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedFilters.hasCompany}
                      onChange={(event) =>
                        setAdvancedFilters((prev) => ({ ...prev, hasCompany: event.target.checked }))
                      }
                    />
                    {t('contacts.filters.hasCompany')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={advancedFilters.hasDeals}
                      onChange={(event) =>
                        setAdvancedFilters((prev) => ({ ...prev, hasDeals: event.target.checked }))
                      }
                    />
                    {t('contacts.filters.hasDeals')}
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#48679d]">{t('contacts.filters.valueRange')}</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <input
                    type="number"
                    value={advancedFilters.minValue}
                    onChange={(event) => setAdvancedFilters((prev) => ({ ...prev, minValue: event.target.value }))}
                    placeholder={t('contacts.filters.min')}
                    className="w-full rounded-lg border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-[#0d121c] dark:text-white"
                  />
                  <input
                    type="number"
                    value={advancedFilters.maxValue}
                    onChange={(event) => setAdvancedFilters((prev) => ({ ...prev, maxValue: event.target.value }))}
                    placeholder={t('contacts.filters.max')}
                    className="w-full rounded-lg border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-[#0d121c] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#48679d]">{t('contacts.filters.lastActivity')}</p>
                <select
                  value={advancedFilters.lastActivityDays}
                  onChange={(event) =>
                    setAdvancedFilters((prev) => ({
                      ...prev,
                      lastActivityDays: event.target.value as AdvancedFilters['lastActivityDays'],
                    }))
                  }
                  className="mt-3 w-full rounded-lg border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#0d121c] dark:text-white"
                >
                  <option value="all">{t('contacts.filters.anytime')}</option>
                  <option value="7">{t('contacts.filters.last7')}</option>
                  <option value="30">{t('contacts.filters.last30')}</option>
                  <option value="90">{t('contacts.filters.last90')}</option>
                  <option value="365">{t('contacts.filters.last365')}</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e7ebf4] dark:border-gray-800 flex items-center justify-between">
              <button onClick={clearAdvancedFilters} className="text-sm font-semibold text-[#48679d] hover:text-primary">
                {t('contacts.filters.reset')}
              </button>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsPanel && (
        <div className="fixed inset-0 z-[60] flex">
          <button
            aria-label={t('common.close')}
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSettingsPanel(false)}
          />
          <div className="relative ml-auto h-full w-full max-w-md bg-white dark:bg-[#101722] border-l border-[#e7ebf4] dark:border-gray-800 p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('contacts.settings.title')}</h2>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#48679d]">{t('contacts.settings.viewMode')}</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                      viewMode === 'list'
                        ? 'bg-primary text-white border-primary'
                        : 'border-[#ced8e9] dark:border-gray-700 text-[#48679d] dark:text-gray-300'
                    }`}
                  >
                    {t('contacts.view.list')}
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                      viewMode === 'card'
                        ? 'bg-primary text-white border-primary'
                        : 'border-[#ced8e9] dark:border-gray-700 text-[#48679d] dark:text-gray-300'
                    }`}
                  >
                    {t('contacts.view.card')}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#48679d]">{t('contacts.settings.density')}</p>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <button
                    onClick={() => setDensity('comfortable')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                      density === 'comfortable'
                        ? 'bg-primary text-white border-primary'
                        : 'border-[#ced8e9] dark:border-gray-700 text-[#48679d] dark:text-gray-300'
                    }`}
                  >
                    {t('contacts.settings.densityComfortable')}
                  </button>
                  <button
                    onClick={() => setDensity('compact')}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border ${
                      density === 'compact'
                        ? 'bg-primary text-white border-primary'
                        : 'border-[#ced8e9] dark:border-gray-700 text-[#48679d] dark:text-gray-300'
                    }`}
                  >
                    {t('contacts.settings.densityCompact')}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#48679d]">{t('contacts.settings.columns')}</p>
                <div className="grid grid-cols-2 gap-3 mt-3 text-sm text-[#0d121c] dark:text-white">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={columnVisibility.email}
                      onChange={(event) =>
                        setColumnVisibility((prev) => ({ ...prev, email: event.target.checked }))
                      }
                    />
                    {t('contacts.table.email')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={columnVisibility.phone}
                      onChange={(event) =>
                        setColumnVisibility((prev) => ({ ...prev, phone: event.target.checked }))
                      }
                    />
                    {t('contacts.table.phone')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={columnVisibility.company}
                      onChange={(event) =>
                        setColumnVisibility((prev) => ({ ...prev, company: event.target.checked }))
                      }
                    />
                    {t('contacts.table.company')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={columnVisibility.value}
                      onChange={(event) =>
                        setColumnVisibility((prev) => ({ ...prev, value: event.target.checked }))
                      }
                    />
                    {t('contacts.table.totalValue')}
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={columnVisibility.activity}
                      onChange={(event) =>
                        setColumnVisibility((prev) => ({ ...prev, activity: event.target.checked }))
                      }
                    />
                    {t('contacts.table.lastActivity')}
                  </label>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#48679d]">{t('contacts.settings.rowsPerPage')}</p>
                <select
                  value={rowsPerPage}
                  onChange={(event) => setRowsPerPage(Number(event.target.value))}
                  className="mt-3 w-full rounded-lg border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-[#0d121c] dark:text-white"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#e7ebf4] dark:border-gray-800 flex items-center justify-between">
              <button onClick={resetViewSettings} className="text-sm font-semibold text-[#48679d] hover:text-primary">
                {t('contacts.settings.reset')}
              </button>
              <button
                onClick={() => setShowSettingsPanel(false)}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showTagModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <button
            aria-label={t('common.close')}
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowTagModal(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-[#101722] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#0d121c] dark:text-white">{t('contacts.tags.title')}</h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-sm text-[#48679d] dark:text-gray-400 mt-2">
              {t('contacts.tags.subtitle', { count: selectedContacts.length })}
            </p>
            <div className="mt-4 space-y-2">
              <input
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                placeholder={t('contacts.tags.placeholder')}
                className="w-full rounded-lg border border-[#ced8e9] dark:border-gray-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-[#0d121c] dark:text-white"
              />
              <p className="text-xs text-[#48679d] dark:text-gray-400">{t('contacts.tags.helper')}</p>
            </div>
            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowTagModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-[#48679d] hover:text-primary"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={applyTags}
                disabled={tagSaving}
                className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
              >
                {t('contacts.tags.apply')}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedContacts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-primary/20 px-6 py-4 flex items-center gap-6 z-50">
          <span className="text-sm font-bold text-primary">
            {t('contacts.selectedCount', { count: selectedContacts.length })}
          </span>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">file_download</span>
              {t('contacts.actions.export')}
            </button>
            <button
              onClick={handleTag}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">sell</span>
              {t('contacts.actions.tag')}
            </button>
            <button
              onClick={() => handleDelete(selectedContacts)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              {t('contacts.actions.delete')}
            </button>
          </div>
          <button
            onClick={() => setSelectedContacts([])}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}
    </div>
  )
}
