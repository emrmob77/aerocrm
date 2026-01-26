'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface HeaderProps {
  sidebarCollapsed?: boolean
}

export function Header({ sidebarCollapsed = false }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

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
    { id: 1, message: 'ABC Ltd teklifi görüntüledi', time: '5 dk önce', read: false },
    { id: 2, message: 'Yeni anlaşma eklendi', time: '1 saat önce', read: false },
    { id: 3, message: 'XYZ Co teklifi imzaladı 🎉', time: '2 saat önce', read: true },
  ]

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className={cn(
      'fixed top-0 right-0 z-30 h-16 bg-white dark:bg-aero-slate-800 border-b border-aero-slate-200 dark:border-aero-slate-700 flex items-center justify-between px-6 transition-all duration-300',
      sidebarCollapsed ? 'left-16' : 'left-60'
    )}>
      {/* Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-3 w-full px-4 py-2 rounded-lg border border-aero-slate-200 dark:border-aero-slate-600 text-aero-slate-400 hover:border-aero-slate-300 dark:hover:border-aero-slate-500 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">search</span>
          <span className="text-sm">Ara...</span>
          <kbd className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-0.5 bg-aero-slate-100 dark:bg-aero-slate-700 rounded text-xs text-aero-slate-500">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>

        {/* Search Modal */}
        {showSearch && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-20 z-50">
            <div className="w-full max-w-2xl bg-white dark:bg-aero-slate-800 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
              <div className="p-4 border-b border-aero-slate-200 dark:border-aero-slate-700">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xl text-aero-slate-400">search</span>
                  <input
                    type="text"
                    placeholder="Anlaşma, kişi veya teklif ara..."
                    className="flex-1 bg-transparent border-none outline-none text-aero-slate-900 dark:text-white placeholder:text-aero-slate-400"
                    autoFocus
                  />
                  <button
                    onClick={() => setShowSearch(false)}
                    className="px-2 py-1 text-xs text-aero-slate-500 hover:text-aero-slate-700 dark:hover:text-aero-slate-300"
                  >
                    ESC
                  </button>
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-aero-slate-500">Aramaya başlamak için yazmaya başlayın...</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Actions */}
        <Link
          href="/deals/new"
          className="hidden sm:flex items-center gap-2 px-3 py-2 bg-aero-blue-500 hover:bg-aero-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Yeni Anlaşma
        </Link>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-aero-slate-500 hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-aero-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-aero-slate-800 rounded-xl shadow-xl border border-aero-slate-200 dark:border-aero-slate-700 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-aero-slate-200 dark:border-aero-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-aero-slate-900 dark:text-white">Bildirimler</h3>
                <button className="text-sm text-aero-blue-500 hover:text-aero-blue-600">
                  Tümünü okundu işaretle
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'p-4 border-b border-aero-slate-100 dark:border-aero-slate-700 last:border-0 hover:bg-aero-slate-50 dark:hover:bg-aero-slate-700/50 cursor-pointer transition-colors',
                      !notification.read && 'bg-aero-blue-50/50 dark:bg-aero-blue-900/10'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {!notification.read && (
                        <span className="w-2 h-2 mt-2 rounded-full bg-aero-blue-500 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm text-aero-slate-900 dark:text-white">
                          {notification.message}
                        </p>
                        <p className="text-xs text-aero-slate-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 border-t border-aero-slate-200 dark:border-aero-slate-700">
                <Link
                  href="/notifications"
                  className="block text-center text-sm text-aero-blue-500 hover:text-aero-blue-600"
                >
                  Tüm bildirimleri gör
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-medium text-sm">
              E
            </div>
            <span className="hidden sm:block text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300">
              Emrah
            </span>
            <span className="material-symbols-outlined text-lg text-aero-slate-400">
              expand_more
            </span>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-aero-slate-800 rounded-xl shadow-xl border border-aero-slate-200 dark:border-aero-slate-700 overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-aero-slate-200 dark:border-aero-slate-700">
                <p className="font-medium text-aero-slate-900 dark:text-white">Emrah</p>
                <p className="text-sm text-aero-slate-500">emrah@example.com</p>
              </div>
              <div className="py-2">
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-aero-slate-700 dark:text-aero-slate-300 hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">settings</span>
                  Hesap Ayarları
                </Link>
                <Link
                  href="/settings/team"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-aero-slate-700 dark:text-aero-slate-300 hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">group</span>
                  Takım Yönetimi
                </Link>
                <Link
                  href="/settings/billing"
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-aero-slate-700 dark:text-aero-slate-300 hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">credit_card</span>
                  Faturalama
                </Link>
              </div>
              <div className="border-t border-aero-slate-200 dark:border-aero-slate-700 py-2">
                <button
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-aero-red-500 hover:bg-aero-red-50 dark:hover:bg-aero-red-900/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-xl">logout</span>
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
