'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { useAppStore } from '@/store'
import { useSupabase, useTeamPresence, useUser } from '@/hooks'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'

// Breadcrumb mapping
const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/deals': 'Anlaşmalar',
  '/contacts': 'Kişiler',
  '/products': 'Ürünler',
  '/sales': 'Satışlar',
  '/reports': 'Raporlar',
  '/proposals': 'Teklifler',
  '/analytics': 'Analitik',
  '/notifications': 'Bildirimler',
  '/webhooks': 'Webhooks',
  '/integrations': 'Entegrasyonlar',
  '/settings': 'Ayarlar',
}

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname()
  const { signOut } = useAuth()
  const { user: profile, authUser } = useUser()
  const supabase = useSupabase()
  const { theme, setTheme } = useAppStore()
  const [showSearch, setShowSearch] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const currentPageTitle = pageTitles[pathname] || 'Sayfa'

  // Get user initials
  const getUserInitials = (name: string) => {
    if (!name) return 'U'
    const names = name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return names[0][0].toUpperCase()
  }

  const displayName =
    profile?.full_name ||
    (authUser?.user_metadata?.full_name as string | undefined) ||
    authUser?.email?.split('@')[0] ||
    'Kullanıcı'

  const userEmail = authUser?.email || profile?.email || ''
  const avatarUrl =
    profile?.avatar_url ||
    (authUser?.user_metadata?.avatar_url as string | undefined) ||
    (authUser?.user_metadata?.picture as string | undefined) ||
    null

  const roleLabel =
    profile?.role === 'owner'
      ? 'Yönetici'
      : profile?.role === 'admin'
        ? 'Admin'
        : 'Üye'

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
  }

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

  const teamId = profile?.team_id ?? null
  const userId = authUser?.id ?? null
  const { count: onlineCount } = useTeamPresence(
    teamId,
    userId,
    profile?.full_name ?? (authUser?.user_metadata?.full_name as string | undefined)
  )
  const [notifications, setNotifications] = useState<
    { id: string; message: string; time: string; read: boolean; href?: string }[]
  >([])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      return
    }

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('id, message, read, action_url, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(8)

      if (!data) return

      const mapped = data.map((row) => ({
        id: row.id,
        message: row.message,
        time: formatRelativeTime(row.created_at),
        read: row.read ?? false,
        href: row.action_url ?? undefined,
      }))

      setNotifications(mapped)
    }

    fetchNotifications()
  }, [supabase, userId])

  useEffect(() => {
    if (!userId) {
      return
    }

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as {
            id?: string
            message?: string
            read?: boolean
            action_url?: string | null
            created_at?: string
          }
          if (!row?.id) return
          setNotifications((prev) => {
            if (prev.some((item) => item.id === row.id)) {
              return prev
            }
            const next = [
              {
                id: row.id,
                message: row.message ?? 'Yeni bildirim',
                time: row.created_at ? formatRelativeTime(row.created_at) : 'az önce',
                read: row.read ?? false,
                href: row.action_url ?? undefined,
              },
              ...prev,
            ]
            return next.slice(0, 8)
          })
          if (!row.read) {
            const messageText = row.title ? `${row.title}` : row.message ?? 'Yeni bildirim'
            if (row.type?.includes('signed')) {
              toast.success(messageText)
            } else {
              toast(messageText)
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as { id?: string; read?: boolean }
          if (!row?.id) return
          setNotifications((prev) =>
            prev.map((item) => (item.id === row.id ? { ...item, read: row.read ?? item.read } : item))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const markAllNotificationsRead = async () => {
    if (!userId) return
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false)
  }

  const markNotificationRead = async (notificationId: string) => {
    if (!userId) return
    setNotifications((prev) =>
      prev.map((item) => (item.id === notificationId ? { ...item, read: true } : item))
    )
    await supabase.from('notifications').update({ read: true }).eq('id', notificationId).eq('user_id', userId)
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length

  return (
    <header className="flex items-center justify-between px-4 lg:px-8 py-4 bg-white dark:bg-[#161e2b] border-b border-[#e7ebf4] dark:border-gray-800">
      {/* Mobile Menu Button & Breadcrumb */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Toggle */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Link href="/dashboard" className="text-[#48679d] dark:text-gray-400 hover:text-primary transition-colors hidden sm:inline">
            Ana Sayfa
          </Link>
          <span className="text-[#48679d] dark:text-gray-600 hidden sm:inline">/</span>
          <span className="text-[#0d121c] dark:text-white font-semibold">{currentPageTitle}</span>
        </div>
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
        <div className="hidden lg:flex items-center gap-2 rounded-full border border-[#e7ebf4] dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-[#48679d] dark:text-gray-300">
          <span className="size-2 rounded-full bg-emerald-500"></span>
          {onlineCount} aktif
        </div>
        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-[#161e2b] rounded-xl shadow-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden z-50">
              <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-[#0d121c] dark:text-white">Bildirimler</h3>
                <button
                  onClick={markAllNotificationsRead}
                  className="text-sm text-primary hover:underline font-semibold"
                >
                  Tümünü okundu işaretle
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-[#48679d] dark:text-gray-400">
                    Henüz bildirim yok.
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <Link
                      key={notification.id}
                      href={notification.href ?? '/proposals'}
                      onClick={() =>
                        markNotificationRead(notification.id)
                      }
                      className={`block p-4 border-b border-[#e7ebf4] dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''}`}
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
                    </Link>
                  ))
                )}
              </div>
              <div className="border-t border-[#e7ebf4] dark:border-gray-800">
                <Link
                  href="/notifications"
                  className="block px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
                >
                  Tüm bildirimleri gör
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={theme === 'dark' ? 'Açık Mod' : 'Koyu Mod'}
        >
          <span className="material-symbols-outlined">
            {theme === 'dark' ? 'light_mode' : 'dark_mode'}
          </span>
        </button>

        {/* Settings */}
        <Link
          href="/settings"
          className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors hidden sm:flex"
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden sm:block"></div>

        {/* User Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-[#0d121c] dark:text-white">
                {displayName}
              </p>
              <p className="text-xs text-[#48679d] dark:text-gray-400">
                {roleLabel}
              </p>
            </div>
            <div className="size-10 rounded-full border-2 border-primary p-0.5 overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={36}
                  height={36}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {getUserInitials(displayName)}
                </div>
              )}
            </div>
          </button>

          {/* User Dropdown */}
          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#161e2b] rounded-xl shadow-xl border border-[#e7ebf4] dark:border-gray-800 overflow-hidden z-50">
              <div className="p-4 border-b border-[#e7ebf4] dark:border-gray-800">
                <p className="font-bold text-[#0d121c] dark:text-white">
                  {displayName}
                </p>
                <p className="text-sm text-[#48679d]">{userEmail}</p>
              </div>
              <div className="py-2">
                <Link
                  href="/settings"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d121c] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined">settings</span>
                  Hesap Ayarları
                </Link>
                <Link
                  href="/settings/team"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#0d121c] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="material-symbols-outlined">group</span>
                  Takım Yönetimi
                </Link>
              </div>
              <div className="border-t border-[#e7ebf4] dark:border-gray-800 py-2">
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
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
