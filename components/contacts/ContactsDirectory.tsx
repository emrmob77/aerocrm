'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSupabase } from '@/hooks/use-supabase'
import type { Database } from '@/types/database'
import { useI18n } from '@/lib/i18n'
import {
  formatCurrency,
  formatRelativeTime,
  getInitials,
  filterContacts,
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
}

type ViewMode = 'list' | 'card'
type SortKey = 'name' | 'value' | 'activity'

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

export function ContactsDirectory({
  initialContacts,
  teamId,
  userId,
}: {
  initialContacts: ContactListItem[]
  teamId: string | null
  userId: string | null
}) {
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

  const filterOptions = useMemo(
    () => [
      { id: 'all' as const, label: t('contacts.filters.all') },
      { id: 'new' as const, label: t('contacts.filters.new') },
      { id: 'highValue' as const, label: t('contacts.filters.highValue') },
      { id: 'inactive' as const, label: t('contacts.filters.inactive') },
    ],
    [t]
  )

  useEffect(() => {
    setContacts(initialContacts)
  }, [initialContacts])

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
  }, [query, activeFilter, rowsPerPage])

  const filteredContacts = useMemo(
    () => filterContacts(contacts as ContactFilterInput[], query, activeFilter),
    [contacts, query, activeFilter]
  )

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
    toast(t('contacts.tagSoon'))
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

  return (
    <div className="-mx-4 -mt-4 lg:-mx-8 lg:-mt-8">
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
            <button className="p-2 text-[#48679d] hover:bg-white/70 dark:hover:bg-slate-800 rounded-lg">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 text-[#48679d] hover:bg-white/70 dark:hover:bg-slate-800 rounded-lg">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="px-6 lg:px-10 pb-10">
          <div className="bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 dark:bg-gray-900/50 sticky top-0 z-10">
                  <tr className="border-b border-[#ced8e9] dark:border-gray-800 text-xs uppercase tracking-widest font-bold text-[#48679d]">
                    <th className="px-6 py-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                        onChange={toggleAllSelection}
                        className="rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                      />
                    </th>
                    <th className="px-4 py-4">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-2">
                        {t('contacts.table.name')}
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-4 py-4">{t('contacts.table.email')}</th>
                    <th className="px-4 py-4">{t('contacts.table.phone')}</th>
                    <th className="px-4 py-4">{t('contacts.table.company')}</th>
                    <th className="px-4 py-4">
                      <button onClick={() => toggleSort('value')} className="flex items-center gap-2">
                        {t('contacts.table.totalValue')}
                        {renderSortIcon('value')}
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button onClick={() => toggleSort('activity')} className="flex items-center gap-2">
                        {t('contacts.table.lastActivity')}
                        {renderSortIcon('activity')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">{t('contacts.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ced8e9] dark:divide-gray-800">
                  {pageContacts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
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
                          <td className="px-6 py-4 h-16">
                            <input
                              type="checkbox"
                              checked={selectedContacts.includes(contact.id)}
                              onChange={() => toggleSelection(contact.id)}
                              className="rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`size-9 rounded-lg flex items-center justify-center font-bold ${avatarStyle.bg} ${avatarStyle.text}`}
                              >
                                {initials}
                              </div>
                              <div>
                                <Link href={`/contacts/${contact.id}`} className="font-semibold text-sm text-[#0d121c] dark:text-white">
                                  {contact.fullName}
                                </Link>
                                <p className="text-xs text-[#48679d] dark:text-gray-400">{contact.company ?? '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400">
                              <span>{contact.email ?? '—'}</span>
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
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400">
                              <span>{contact.phone ?? '—'}</span>
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
                          <td className="px-4 py-4">
                            <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-medium rounded-full">
                              {contact.company ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`font-bold text-sm ${contact.totalValue >= 50000 ? 'text-green-600' : 'text-[#0d121c] dark:text-white'}`}>
                              {formatCurrency(contact.totalValue, formatLocale, currency)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-[#48679d] dark:text-gray-400">
                            {formatRelativeTime(contact.lastActivityAt, t)}
                          </td>
                          <td className="px-6 py-4 text-right">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {pageContacts.map((contact) => {
              const initials = getInitials(contact.fullName)
              const avatarStyle = getAvatarStyle(contact.fullName)

              return (
                <Link
                  key={contact.id}
                  href={`/contacts/${contact.id}`}
                  className="bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`size-12 rounded-xl flex items-center justify-center font-bold ${avatarStyle.bg} ${avatarStyle.text}`}
                    >
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0d121c] dark:text-white">{contact.fullName}</h3>
                      <p className="text-sm text-[#48679d] dark:text-gray-400">{contact.company ?? '—'}</p>
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
                    <span>{formatRelativeTime(contact.lastActivityAt, t)}</span>
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
