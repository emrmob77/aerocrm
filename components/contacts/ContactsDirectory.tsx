'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSupabase } from '@/hooks/use-supabase'
import {
  formatCurrency,
  formatRelativeTime,
  getInitials,
  isOlderThanDays,
  isWithinDays,
} from './contact-utils'

export type ContactListItem = {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  company: string | null
  position: string | null
  createdAt: string
  updatedAt: string
  totalValue: number
  lastActivityAt: string
  dealsCount: number
}

type FilterType = 'all' | 'new' | 'highValue' | 'inactive'
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

const filterOptions: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Tüm Kişiler' },
  { id: 'new', label: 'Yeni Eklenenler' },
  { id: 'highValue', label: 'Yüksek Değerli' },
  { id: 'inactive', label: 'Hareketsiz' },
]

export function ContactsDirectory({ initialContacts }: { initialContacts: ContactListItem[] }) {
  const supabase = useSupabase()
  const [contacts, setContacts] = useState<ContactListItem[]>(initialContacts)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [sortKey, setSortKey] = useState<SortKey>('activity')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  useEffect(() => {
    setContacts(initialContacts)
  }, [initialContacts])

  useEffect(() => {
    setCurrentPage(1)
  }, [query, activeFilter, rowsPerPage])

  const filteredContacts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return contacts.filter((contact) => {
      const searchMatch =
        !normalizedQuery ||
        contact.fullName.toLowerCase().includes(normalizedQuery) ||
        (contact.email ?? '').toLowerCase().includes(normalizedQuery) ||
        (contact.phone ?? '').toLowerCase().includes(normalizedQuery) ||
        (contact.company ?? '').toLowerCase().includes(normalizedQuery)

      if (!searchMatch) {
        return false
      }

      if (activeFilter === 'new') {
        return isWithinDays(contact.createdAt, 7)
      }

      if (activeFilter === 'highValue') {
        return contact.totalValue >= 50000
      }

      if (activeFilter === 'inactive') {
        return isOlderThanDays(contact.lastActivityAt, 30)
      }

      return true
    })
  }, [contacts, query, activeFilter])

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
      toast.success('Kopyalandı')
    } catch {
      toast.error('Kopyalanamadı')
    }
  }

  const handleExport = () => {
    const selected = contacts.filter((contact) => selectedContacts.includes(contact.id))
    if (selected.length === 0) return

    const header = ['Ad Soyad', 'E-posta', 'Telefon', 'Şirket', 'Toplam Değer', 'Son Aktivite']
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
    link.download = 'contacts.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return

    if (!confirm('Seçilen kişileri silmek istediğinize emin misiniz?')) {
      return
    }

    const { error } = await supabase.from('contacts').delete().in('id', ids)
    if (error) {
      console.error('Delete contacts error:', error)
      toast.error('Kişiler silinemedi')
      return
    }

    setContacts((prev) => prev.filter((contact) => !ids.includes(contact.id)))
    setSelectedContacts((prev) => prev.filter((id) => !ids.includes(id)))
    toast.success('Kişiler silindi')
  }

  const handleTag = () => {
    toast('Etiketleme yakında geliyor')
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
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">Kişiler</h1>
            <p className="text-[#48679d] dark:text-gray-400 mt-1">Müşteri rehberini yönetin, filtreleyin ve paylaşın.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white dark:bg-slate-800 border border-[#ced8e9] dark:border-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-white' : 'text-[#48679d] dark:text-gray-300 hover:text-primary'
                }`}
              >
                Liste
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-colors ${
                  viewMode === 'card' ? 'bg-primary text-white' : 'text-[#48679d] dark:text-gray-300 hover:text-primary'
                }`}
              >
                Kart
              </button>
            </div>
            <Link
              href="/contacts/new"
              className="flex items-center gap-2 px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-lg">person_add</span>
              Yeni Kişi
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
                placeholder="İsim, e-posta, şirket veya telefon ara..."
                className="w-full bg-white dark:bg-slate-800 border border-[#ced8e9] dark:border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-[#0d121c] dark:text-white placeholder:text-[#48679d] focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#48679d] dark:text-gray-400">Filtre:</span>
              <select
                value={activeFilter}
                onChange={(event) => setActiveFilter(event.target.value as FilterType)}
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
                        İsim
                        {renderSortIcon('name')}
                      </button>
                    </th>
                    <th className="px-4 py-4">E-posta</th>
                    <th className="px-4 py-4">Telefon</th>
                    <th className="px-4 py-4">Şirket</th>
                    <th className="px-4 py-4">
                      <button onClick={() => toggleSort('value')} className="flex items-center gap-2">
                        Toplam Değer
                        {renderSortIcon('value')}
                      </button>
                    </th>
                    <th className="px-4 py-4">
                      <button onClick={() => toggleSort('activity')} className="flex items-center gap-2">
                        Son Aktivite
                        {renderSortIcon('activity')}
                      </button>
                    </th>
                    <th className="px-6 py-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ced8e9] dark:divide-gray-800">
                  {pageContacts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3 block">
                          person_off
                        </span>
                        <p className="text-[#48679d] dark:text-gray-400">Henüz kişi eklenmemiş.</p>
                        <Link
                          href="/contacts/new"
                          className="inline-flex items-center gap-2 mt-4 px-5 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors"
                        >
                          İlk kişinizi ekleyin
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
                              {formatCurrency(contact.totalValue)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-[#48679d] dark:text-gray-400">
                            {formatRelativeTime(contact.lastActivityAt)}
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
                <span className="font-semibold text-[#0d121c] dark:text-white">
                  {totalContacts === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}-
                  {totalContacts === 0 ? 0 : Math.min(currentPage * rowsPerPage, totalContacts)}
                </span>{' '}
                of <span className="font-semibold text-[#0d121c] dark:text-white">{totalContacts}</span> kişi
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
                <span>Satır sayısı:</span>
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
                    <span>{formatRelativeTime(contact.lastActivityAt)}</span>
                    <span className="font-semibold text-[#0d121c] dark:text-white">{formatCurrency(contact.totalValue)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {selectedContacts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-primary/20 px-6 py-4 flex items-center gap-6 z-50">
          <span className="text-sm font-bold text-primary">{selectedContacts.length} Kişi Seçildi</span>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">file_download</span>
              Dışa Aktar
            </button>
            <button
              onClick={handleTag}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">sell</span>
              Etiketle
            </button>
            <button
              onClick={() => handleDelete(selectedContacts)}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
              Sil
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
