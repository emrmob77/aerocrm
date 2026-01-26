'use client'

import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// Types
interface Contact {
  id: string
  name: string
  email: string
  phone: string
  company: string
  title: string
  totalDeals: number
  totalValue: number
  lastActivity: string
  avatar?: string
}

// Mock data - will be replaced with Supabase data
const initialContacts: Contact[] = [
  { id: '1', name: 'Ahmet Yılmaz', email: 'ahmet@abcteknoloji.com', phone: '+90 532 123 4567', company: 'ABC Teknoloji', title: 'CEO', totalDeals: 3, totalValue: 75000, lastActivity: '2 saat önce' },
  { id: '2', name: 'Mehmet Demir', email: 'mehmet@xyzholding.com', phone: '+90 533 234 5678', company: 'XYZ Holding', title: 'Satın Alma Müdürü', totalDeals: 2, totalValue: 50000, lastActivity: '1 gün önce' },
  { id: '3', name: 'Ayşe Kara', email: 'ayse@defretail.com', phone: '+90 534 345 6789', company: 'DEF Retail', title: 'Pazarlama Direktörü', totalDeals: 1, totalValue: 28000, lastActivity: '3 saat önce' },
  { id: '4', name: 'Fatma Şahin', email: 'fatma@ghidanismanlik.com', phone: '+90 535 456 7890', company: 'GHI Danışmanlık', title: 'Genel Müdür', totalDeals: 2, totalValue: 25000, lastActivity: '5 saat önce' },
  { id: '5', name: 'Ali Öztürk', email: 'ali@jklstartup.com', phone: '+90 536 567 8901', company: 'JKL Startup', title: 'CTO', totalDeals: 1, totalValue: 75000, lastActivity: '1 saat önce' },
  { id: '6', name: 'Zeynep Yıldız', email: 'zeynep@mnoajans.com', phone: '+90 537 678 9012', company: 'MNO Ajans', title: 'Kurucu Ortak', totalDeals: 4, totalValue: 35000, lastActivity: '2 gün önce' },
  { id: '7', name: 'Can Aksoy', email: 'can@pqrmedia.com', phone: '+90 538 789 0123', company: 'PQR Media', title: 'İçerik Müdürü', totalDeals: 1, totalValue: 5000, lastActivity: '1 hafta önce' },
  { id: '8', name: 'Emre Yılmaz', email: 'emre@stutech.com', phone: '+90 539 890 1234', company: 'STU Tech', title: 'IT Direktörü', totalDeals: 2, totalValue: 45000, lastActivity: '3 gün önce' },
]

// Format currency
function formatCurrency(value: number) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export default function ContactsPage() {
  const [contacts] = useState<Contact[]>(initialContacts)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'value'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Filter and sort contacts
  const filteredContacts = contacts
    .filter(contact => 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') comparison = a.name.localeCompare(b.name)
      else if (sortBy === 'company') comparison = a.company.localeCompare(b.company)
      else if (sortBy === 'value') comparison = a.totalValue - b.totalValue
      return sortOrder === 'asc' ? comparison : -comparison
    })

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedContacts(prev => 
      prev.includes(id) 
        ? prev.filter(cid => cid !== id)
        : [...prev, id]
    )
  }

  // Toggle all selection
  const toggleAllSelection = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map(c => c.id))
    }
  }

  // Copy email to clipboard
  const copyEmail = (email: string) => {
    navigator.clipboard.writeText(email)
    // TODO: Show toast notification
  }

  // Handle sort
  const handleSort = (column: 'name' | 'company' | 'value') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  // Get initials
  const getInitials = (name: string) => 
    name.split(' ').map(n => n[0]).join('').toUpperCase()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-aero-slate-900 dark:text-white">Kişiler</h1>
          <p className="text-sm text-aero-slate-500 mt-1">
            Toplam {filteredContacts.length} kişi
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-lg text-aero-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Kişi ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-60"
            />
          </div>

          {/* Filter Button */}
          <button className="btn-secondary btn-md">
            <span className="material-symbols-outlined text-lg mr-1">filter_list</span>
            Filtre
          </button>
          
          {/* View Toggle */}
          <div className="flex items-center bg-aero-slate-100 dark:bg-aero-slate-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'list'
                  ? 'bg-white dark:bg-aero-slate-600 text-aero-slate-900 dark:text-white shadow-sm'
                  : 'text-aero-slate-500 dark:text-aero-slate-400'
              )}
            >
              <span className="material-symbols-outlined text-lg">view_list</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'grid'
                  ? 'bg-white dark:bg-aero-slate-600 text-aero-slate-900 dark:text-white shadow-sm'
                  : 'text-aero-slate-500 dark:text-aero-slate-400'
              )}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
          </div>

          {/* New Contact Button */}
          <Link
            href="/contacts/new"
            className="btn-primary btn-md"
          >
            <span className="material-symbols-outlined text-lg mr-1">person_add</span>
            Yeni Kişi
          </Link>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedContacts.length > 0 && (
        <div className="bg-aero-blue-50 dark:bg-aero-blue-900/20 border border-aero-blue-200 dark:border-aero-blue-800 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-aero-blue-700 dark:text-aero-blue-300">
            {selectedContacts.length} kişi seçildi
          </span>
          <div className="flex items-center gap-2">
            <button className="btn-secondary btn-sm">
              <span className="material-symbols-outlined text-lg mr-1">download</span>
              Dışa Aktar
            </button>
            <button className="btn-secondary btn-sm">
              <span className="material-symbols-outlined text-lg mr-1">label</span>
              Etiketle
            </button>
            <button className="btn-danger btn-sm">
              <span className="material-symbols-outlined text-lg mr-1">delete</span>
              Sil
            </button>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-aero-slate-50 dark:bg-aero-slate-800">
              <tr>
                <th className="px-6 py-3 w-12">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                    onChange={toggleAllSelection}
                    className="w-4 h-4 rounded border-aero-slate-300 text-aero-blue-500 focus:ring-aero-blue-500"
                  />
                </th>
                <th 
                  className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase cursor-pointer hover:text-aero-slate-700"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center gap-1">
                    Kişi
                    {sortBy === 'name' && (
                      <span className="material-symbols-outlined text-sm">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </span>
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">E-posta</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">Telefon</th>
                <th 
                  className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase cursor-pointer hover:text-aero-slate-700"
                  onClick={() => handleSort('company')}
                >
                  <span className="flex items-center gap-1">
                    Şirket
                    {sortBy === 'company' && (
                      <span className="material-symbols-outlined text-sm">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </span>
                </th>
                <th 
                  className="text-right px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase cursor-pointer hover:text-aero-slate-700"
                  onClick={() => handleSort('value')}
                >
                  <span className="flex items-center justify-end gap-1">
                    Toplam Değer
                    {sortBy === 'value' && (
                      <span className="material-symbols-outlined text-sm">
                        {sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                      </span>
                    )}
                  </span>
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-aero-slate-500 uppercase">Son Aktivite</th>
                <th className="px-6 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aero-slate-200 dark:divide-aero-slate-700">
              {filteredContacts.map((contact) => (
                <tr 
                  key={contact.id} 
                  className={cn(
                    'hover:bg-aero-slate-50 dark:hover:bg-aero-slate-800/50 transition-colors',
                    selectedContacts.includes(contact.id) && 'bg-aero-blue-50/50 dark:bg-aero-blue-900/10'
                  )}
                >
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleSelection(contact.id)}
                      className="w-4 h-4 rounded border-aero-slate-300 text-aero-blue-500 focus:ring-aero-blue-500"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/contacts/${contact.id}`} className="flex items-center gap-3 group">
                      <div className="w-10 h-10 rounded-full bg-aero-blue-100 dark:bg-aero-blue-900/30 flex items-center justify-center text-aero-blue-600 dark:text-aero-blue-400 font-medium text-sm">
                        {getInitials(contact.name)}
                      </div>
                      <div>
                        <p className="font-medium text-aero-slate-900 dark:text-white group-hover:text-aero-blue-500 transition-colors">
                          {contact.name}
                        </p>
                        <p className="text-xs text-aero-slate-500">{contact.title}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => copyEmail(contact.email)}
                      className="flex items-center gap-1 text-sm text-aero-slate-600 dark:text-aero-slate-400 hover:text-aero-blue-500 transition-colors group"
                    >
                      {contact.email}
                      <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        content_copy
                      </span>
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <a 
                      href={`tel:${contact.phone}`}
                      className="text-sm text-aero-slate-600 dark:text-aero-slate-400 hover:text-aero-blue-500 transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-aero-slate-700 dark:text-aero-slate-300">{contact.company}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-aero-slate-900 dark:text-white">
                      {formatCurrency(contact.totalValue)}
                    </span>
                    <span className="text-xs text-aero-slate-500 ml-1">
                      ({contact.totalDeals} anlaşma)
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-aero-slate-500">
                    {contact.lastActivity}
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 rounded-lg hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors">
                      <span className="material-symbols-outlined text-aero-slate-400">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="p-4 border-t border-aero-slate-200 dark:border-aero-slate-700 flex items-center justify-between">
            <p className="text-sm text-aero-slate-500">
              1-{filteredContacts.length} / {filteredContacts.length} kişi
            </p>
            <div className="flex items-center gap-2">
              <button disabled className="btn-secondary btn-sm opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-lg">chevron_left</span>
              </button>
              <button disabled className="btn-secondary btn-sm opacity-50 cursor-not-allowed">
                <span className="material-symbols-outlined text-lg">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredContacts.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="card p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 rounded-full bg-aero-blue-100 dark:bg-aero-blue-900/30 flex items-center justify-center text-aero-blue-600 dark:text-aero-blue-400 font-semibold text-lg">
                  {getInitials(contact.name)}
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); }}
                  className="p-1.5 rounded-lg hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-aero-slate-400">more_vert</span>
                </button>
              </div>

              <h3 className="font-semibold text-aero-slate-900 dark:text-white group-hover:text-aero-blue-500 transition-colors">
                {contact.name}
              </h3>
              <p className="text-sm text-aero-slate-500 mb-1">{contact.title}</p>
              <p className="text-sm text-aero-slate-600 dark:text-aero-slate-400 font-medium">{contact.company}</p>

              <div className="mt-4 pt-4 border-t border-aero-slate-100 dark:border-aero-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-sm text-aero-slate-500">
                  <span className="material-symbols-outlined text-lg">mail</span>
                  <span className="truncate">{contact.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-aero-slate-500">
                  <span className="material-symbols-outlined text-lg">phone</span>
                  <span>{contact.phone}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-aero-slate-500">{contact.totalDeals} anlaşma</span>
                <span className="font-semibold text-aero-blue-500">{formatCurrency(contact.totalValue)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Empty State */}
      {filteredContacts.length === 0 && (
        <div className="card p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-aero-slate-300 dark:text-aero-slate-600 mb-4">
            contacts
          </span>
          <h3 className="text-lg font-semibold text-aero-slate-900 dark:text-white mb-2">
            Kişi Bulunamadı
          </h3>
          <p className="text-aero-slate-500 mb-6">
            {searchQuery 
              ? 'Arama kriterlerinize uygun kişi bulunamadı.'
              : 'Henüz kişi eklenmemiş. İlk kişinizi ekleyin.'}
          </p>
          <Link href="/contacts/new" className="btn-primary btn-md">
            <span className="material-symbols-outlined text-lg mr-1">person_add</span>
            Yeni Kişi Ekle
          </Link>
        </div>
      )}
    </div>
  )
}
