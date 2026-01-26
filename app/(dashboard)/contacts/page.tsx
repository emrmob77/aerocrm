'use client'

import { useState, useMemo } from 'react'

// Types
interface Contact {
  id: string
  name: string
  initials: string
  initialsColor: string
  email: string
  phone: string
  company: string
  totalValue: number
  isNew?: boolean
  isInactive?: boolean
}

// Mock data - tasarıma uygun
const initialContacts: Contact[] = [
  { id: '1', name: 'Ahmet Yılmaz', initials: 'AY', initialsColor: 'bg-blue-100 dark:bg-blue-900 text-primary', email: 'ahmet@aerotech.com', phone: '+90 532 123 45 67', company: 'Aero Tech', totalValue: 45000, isNew: true },
  { id: '2', name: 'Elif Demir', initials: 'ED', initialsColor: 'bg-pink-100 dark:bg-pink-900 text-pink-600', email: 'elif@demir.io', phone: '+90 541 987 65 43', company: 'Demir Corp', totalValue: 12500 },
  { id: '3', name: 'Caner Öz', initials: 'CÖ', initialsColor: 'bg-green-100 dark:bg-green-900 text-green-600', email: 'caner@oz.net', phone: '+90 555 111 22 33', company: 'Öz Yazılım', totalValue: 8200, isInactive: true },
  { id: '4', name: 'Selin Ak', initials: 'SA', initialsColor: 'bg-orange-100 dark:bg-orange-900 text-orange-600', email: 'selin@akgida.com', phone: '+90 530 444 55 66', company: 'Ak Gıda', totalValue: 150000 },
  { id: '5', name: 'Burak Erol', initials: 'BE', initialsColor: 'bg-purple-100 dark:bg-purple-900 text-purple-600', email: 'burak@erol.co', phone: '+90 533 222 11 00', company: 'Erol Lojistik', totalValue: 32400, isNew: true },
  { id: '6', name: 'Zeynep Kaya', initials: 'ZK', initialsColor: 'bg-teal-100 dark:bg-teal-900 text-teal-600', email: 'zeynep@kaya.com', phone: '+90 544 333 22 11', company: 'Kaya Holding', totalValue: 85000 },
  { id: '7', name: 'Murat Çelik', initials: 'MÇ', initialsColor: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600', email: 'murat@celik.net', phone: '+90 555 666 77 88', company: 'Çelik Sanayi', totalValue: 5000, isInactive: true },
]

type FilterType = 'all' | 'new' | 'highValue' | 'inactive'

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
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(25)

  // Filter contacts based on active filter
  const filteredContacts = useMemo(() => {
    switch (activeFilter) {
      case 'new':
        return contacts.filter(c => c.isNew)
      case 'highValue':
        return contacts.filter(c => c.totalValue >= 50000)
      case 'inactive':
        return contacts.filter(c => c.isInactive)
      default:
        return contacts
    }
  }, [contacts, activeFilter])

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

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // Clear filter
  const clearFilter = () => {
    setActiveFilter('all')
  }

  // Get filter button classes
  const getFilterButtonClasses = (filter: FilterType) => {
    if (activeFilter === filter) {
      return 'flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold border border-primary/20'
    }
    return 'flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-[#48679d] dark:text-gray-400 rounded-full text-sm font-medium border border-[#ced8e9] dark:border-gray-700 hover:border-primary/50 transition-colors'
  }

  const totalContacts = filteredContacts.length

  return (
    <div className="-m-8">
      <main className="max-w-[1440px] mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">Kişiler Rehberi</h1>
            <p className="text-[#48679d] dark:text-gray-400 mt-1">Satış bağlantılarınızı ve potansiyel müşterilerinizi verimli bir şekilde yönetin.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-[#ced8e9] dark:border-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
              <span className="material-symbols-outlined text-lg">file_download</span>
              Dışa Aktar
            </button>
            <button className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-lg">person_add</span>
              Yeni Kişi
            </button>
          </div>
        </div>

        {/* Filters & Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button 
              onClick={() => setActiveFilter('all')}
              className={getFilterButtonClasses('all')}
            >
              Tüm Kişiler
              {activeFilter === 'all' && (
                <span onClick={(e) => { e.stopPropagation(); clearFilter(); }} className="material-symbols-outlined text-sm cursor-pointer hover:text-primary/70">close</span>
              )}
            </button>
            <button 
              onClick={() => setActiveFilter('new')}
              className={getFilterButtonClasses('new')}
            >
              Yeni Eklenenler
              {activeFilter === 'new' ? (
                <span onClick={(e) => { e.stopPropagation(); clearFilter(); }} className="material-symbols-outlined text-sm cursor-pointer hover:text-primary/70">close</span>
              ) : (
                <span className="material-symbols-outlined text-sm">expand_more</span>
              )}
            </button>
            <button 
              onClick={() => setActiveFilter('highValue')}
              className={getFilterButtonClasses('highValue')}
            >
              Yüksek Değerli
              {activeFilter === 'highValue' ? (
                <span onClick={(e) => { e.stopPropagation(); clearFilter(); }} className="material-symbols-outlined text-sm cursor-pointer hover:text-primary/70">close</span>
              ) : (
                <span className="material-symbols-outlined text-sm">expand_more</span>
              )}
            </button>
            <button 
              onClick={() => setActiveFilter('inactive')}
              className={getFilterButtonClasses('inactive')}
            >
              Hareketsiz
              {activeFilter === 'inactive' ? (
                <span onClick={(e) => { e.stopPropagation(); clearFilter(); }} className="material-symbols-outlined text-sm cursor-pointer hover:text-primary/70">close</span>
              ) : (
                <span className="material-symbols-outlined text-sm">expand_more</span>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <span className="material-symbols-outlined">filter_list</span>
            </button>
            <button className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <span className="material-symbols-outlined">view_column</span>
            </button>
            <button className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <span className="material-symbols-outlined">settings</span>
            </button>
          </div>
        </div>

        {/* Data Table Container */}
        <div className="bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-gray-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-900/50 border-b border-[#ced8e9] dark:border-gray-800">
                  <th className="px-6 py-4 w-10">
                    <input 
                      type="checkbox" 
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={toggleAllSelection}
                      className="rounded border-gray-300 dark:border-gray-700 text-primary focus:ring-primary"
                    />
                  </th>
                  <th className="px-4 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">İSİM</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">E-POSTA</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">TELEFON</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">ŞİRKET</th>
                  <th className="px-4 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider">TOPLAM DEĞER</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#48679d] uppercase tracking-wider text-right">İŞLEMLER</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ced8e9] dark:divide-gray-800">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600 mb-3 block">person_off</span>
                      <p className="text-[#48679d] dark:text-gray-400">Bu filtreye uygun kişi bulunamadı.</p>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
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
                          <div className={`size-9 rounded-lg ${contact.initialsColor} flex items-center justify-center font-bold`}>
                            {contact.initials}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-[#0d121c] dark:text-white">{contact.name}</span>
                            {contact.isNew && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">YENİ</span>
                            )}
                            {contact.isInactive && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-bold rounded">HAREKETSİZ</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400">
                          <span>{contact.email}</span>
                          <button 
                            onClick={() => copyToClipboard(contact.email)}
                            className="opacity-0 group-hover:opacity-100 text-primary transition-opacity"
                          >
                            <span className="material-symbols-outlined text-base">content_copy</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400">
                          <span>{contact.phone}</span>
                          <button className="opacity-0 group-hover:opacity-100 text-primary transition-opacity">
                            <span className="material-symbols-outlined text-base">call</span>
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-medium rounded-full">{contact.company}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`font-bold text-sm ${contact.totalValue >= 50000 ? 'text-green-600' : 'text-[#0d121c] dark:text-white'}`}>
                          {formatCurrency(contact.totalValue)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-lg text-[#48679d]">
                          <span className="material-symbols-outlined">more_vert</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-900/50 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-[#ced8e9] dark:border-gray-800">
            <span className="text-sm text-[#48679d] dark:text-gray-400">
              <span className="font-semibold text-[#0d121c] dark:text-white">1-{Math.min(rowsPerPage, totalContacts)}</span> of <span className="font-semibold text-[#0d121c] dark:text-white">{totalContacts}</span> kişi
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                className="p-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                <button className="size-9 flex items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">1</button>
                {totalContacts > rowsPerPage && (
                  <>
                    <button className="size-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 text-sm font-medium">2</button>
                    <button className="size-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 text-sm font-medium">3</button>
                    <span className="px-2 text-gray-400">...</span>
                    <button className="size-9 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-gray-800 text-sm font-medium">7</button>
                  </>
                )}
              </div>
              <button className="p-2 border border-[#ced8e9] dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#48679d] dark:text-gray-400">
              <span>Satır sayısı:</span>
              <select 
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="bg-transparent border-none focus:ring-0 text-sm font-semibold py-0 pr-8"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>
        </div>
      </main>

      {/* Selection Bar (Floating) */}
      {selectedContacts.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-900 shadow-2xl rounded-xl border border-primary/20 px-6 py-4 flex items-center gap-6 z-50">
          <span className="text-sm font-bold text-primary">{selectedContacts.length} Kişi Seçildi</span>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium">
              <span className="material-symbols-outlined text-lg">edit</span>
              Düzenle
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-sm font-medium">
              <span className="material-symbols-outlined text-lg">mail</span>
              E-posta Gönder
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg text-sm font-medium">
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
