'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Breadcrumb mapping
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/deals': 'Anlaşmalar',
  '/contacts': 'Kişiler',
  '/sales': 'Satışlar',
  '/reports': 'Raporlar',
  '/proposals': 'Teklifler',
  '/analytics': 'Analitik',
  '/webhooks': 'Webhooks',
  '/integrations': 'Entegrasyonlar',
  '/settings': 'Ayarlar',
}

export function Header() {
  const pathname = usePathname()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const currentPageTitle = pageTitles[pathname] || 'Sayfa'

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcut for search (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault()
        setShowSearch(true)
      }
      if (event.key === 'Escape') {
        setShowSearch(false)
        setShowNotifications(false)
        setShowUserMenu(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const notifications = [
    { id: 1, message: 'Teklif gönderildi - Global Teknoloji A.Ş.', time: '10 dk önce', read: false },
    { id: 2, message: 'Anlaşma kapatıldı - TeknoPark Ltd.', time: '2 saat önce', read: false },
    { id: 3, message: 'Toplantı planlandı - Arkas Lojistik', time: '4 saat önce', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white dark:bg-[#161e2b] border-b border-[#e7ebf4] dark:border-gray-800">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-[#48679d] dark:text-gray-400 hover:text-primary transition-colors">
          Ana Sayfa
        </Link>
        <span className="text-[#48679d] dark:text-gray-600">/</span>
        <span className="text-[#0d121c] dark:text-white font-semibold">{currentPageTitle}</span>
      </div>

      {/* Search */}
      <div ref={searchRef} className="flex-1 max-w-lg mx-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-[#48679d] dark:text-gray-400">search</span>
          </div>
          <input
            onClick={() => setShowSearch(true)}
            className="block w-full pl-10 pr-12 py-2 border-none bg-[#f5f6f8] dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/50 text-sm placeholder:text-[#48679d] transition-all"
            placeholder="Müşteri, teklif veya rapor ara..."
            type="text"
            readOnly
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-xs font-semibold text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">⌘K</kbd>
          </div>
        </div>

        {/* Search Modal */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
            <div className="w-full max-w-2xl bg-white dark:bg-[#161e2b] rounded-xl shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-[#48679d]">search</span>
                  <input
                    type="text"
                    placeholder="Müşteri, teklif veya rapor ara..."
                    className="flex-1 bg-transparent border-none outline-none text-[#0d121c] dark:text-white placeholder:text-[#48679d]"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowSearch(false)}
                    className="px-2 py-1 text-xs text-[#48679d] hover:text-[#0d121c] dark:hover:text-white"
                  >
                    ESC
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-[#48679d]">Aramaya başlamak için yazmaya başlayın...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#161e2b] rounded-xl shadow-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden z-50">
              <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-[#0d121c] dark:text-white">Bildirimler</h3>
                <button className="text-sm text-primary hover:underline font-semibold">
                  Tümünü okundu işaretle
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-[#e7ebf4] dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <span className="w-2 h-2 mt-2 rounded-full bg-primary flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-[#0d121c] dark:text-white font-medium">
                          {notification.message}
                        </p>
                        <p className="text-xs text-[#48679d] mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
          <span className="material-symbols-outlined">settings</span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3"
          >
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#0d121c] dark:text-white">Ahmet Yılmaz</p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">Satış Müdürü</p>
            </div>
            <div className="size-10 rounded-full border-2 border-primary p-0.5">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                AY
              </div>
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#161e2b] rounded-xl shadow-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden z-50">
              <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800">
                <p className="font-bold text-[#0d121c] dark:text-white">Ahmet Yılmaz</p>
                <p className="text-sm text-[#48679d]">ahmet@aerocrm.com</p>
              </div>
              <div className="py-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d121c] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined">settings</span>
                  Hesap Ayarları
                </Link>
                <Link
                  href="/settings/team"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d121c] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined">group</span>
                  Takım Yönetimi
                </Link>
              </div>
              <div className="border-t border-[#e7ebf4] dark:border-gray-800 py-2">
                <button className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <span className="material-symbols-outlined">logout</span>
                  Çıkış Yap
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
