'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSupabase, useUser } from '@/hooks'
import { formatRelativeTime } from '@/components/dashboard/activity-utils'

type FilterType = 'all' | 'unread' | 'proposal' | 'deal' | 'system'

type NotificationRow = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  action_url: string | null
  created_at: string
}

const getNotificationCategory = (type: string): FilterType => {
  if (type.startsWith('proposal')) return 'proposal'
  if (type.startsWith('deal')) return 'deal'
  return 'system'
}

const getNotificationBadge = (type: string) => {
  if (type.includes('signed')) {
    return {
      icon: 'task_alt',
      badge:
        'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
    }
  }
  if (type.includes('viewed')) {
    return {
      icon: 'visibility',
      badge:
        'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800',
    }
  }
  if (type.includes('sent')) {
    return {
      icon: 'outgoing_mail',
      badge:
        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800',
    }
  }
  if (type.includes('link')) {
    return {
      icon: 'link',
      badge:
        'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-300 dark:border-slate-800',
    }
  }
  return {
    icon: 'notifications',
    badge:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800',
  }
}

export default function NotificationsPage() {
  const supabase = useSupabase()
  const { authUser } = useUser()
  const userId = authUser?.id ?? null
  const [notifications, setNotifications] = useState<NotificationRow[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchNotifications = async () => {
    if (!userId) return
    setIsRefreshing(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, read, action_url, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      toast.error('Bildirimler getirilemedi.')
      setIsRefreshing(false)
      return
    }
    setNotifications((data ?? []) as NotificationRow[])
    setIsRefreshing(false)
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      await fetchNotifications()
      setIsLoading(false)
    }
    load()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel(`notifications-center-${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow
          if (!row?.id) return
          setNotifications((prev) => {
            if (prev.some((item) => item.id === row.id)) {
              return prev
            }
            return [row, ...prev].slice(0, 100)
          })
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const row = payload.new as NotificationRow
          if (!row?.id) return
          setNotifications((prev) =>
            prev.map((item) => (item.id === row.id ? { ...item, read: row.read } : item))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, userId])

  const markAllRead = async () => {
    if (!userId) return
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })))
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) {
      toast.error('Bildirimler güncellenemedi.')
    }
  }

  const toggleRead = async (notification: NotificationRow) => {
    if (!userId) return
    const nextRead = !notification.read
    setNotifications((prev) =>
      prev.map((item) => (item.id === notification.id ? { ...item, read: nextRead } : item))
    )
    const { error } = await supabase
      .from('notifications')
      .update({ read: nextRead })
      .eq('id', notification.id)
      .eq('user_id', userId)
    if (error) {
      toast.error('Bildirim güncellenemedi.')
    }
  }

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications
    if (activeFilter === 'unread') return notifications.filter((item) => !item.read)
    return notifications.filter((item) => getNotificationCategory(item.type) === activeFilter)
  }, [notifications, activeFilter])

  const unreadCount = notifications.filter((item) => !item.read).length

  return (
    <div className="-m-8">
      <main className="max-w-[1280px] mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <span className="material-symbols-outlined text-sm">notifications</span>
              <span className="text-xs font-semibold uppercase tracking-wider">Notification Center</span>
            </div>
            <h1 className="text-[#0f172a] dark:text-white text-3xl font-black leading-tight tracking-[-0.033em]">
              Bildirim Merkezi
            </h1>
            <p className="text-slate-500 text-sm">Teklif ve sistem bildirimlerini tek ekrandan yönetin.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchNotifications}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700 text-slate-700 dark:text-white text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm disabled:opacity-70"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              <span>{isRefreshing ? 'Yenileniyor' : 'Yenile'}</span>
            </button>
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all"
            >
              <span className="material-symbols-outlined text-lg">done_all</span>
              <span>Tümünü okundu yap</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Toplam Bildirim</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{notifications.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Okunmamış</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{unreadCount}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-500">Filtre</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {activeFilter === 'all'
                ? 'Tümü'
                : activeFilter === 'unread'
                  ? 'Okunmadı'
                  : activeFilter === 'proposal'
                    ? 'Teklif'
                    : activeFilter === 'deal'
                      ? 'Anlaşma'
                      : 'Sistem'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {([
              { id: 'all', label: 'Tümü' },
              { id: 'unread', label: 'Okunmadı' },
              { id: 'proposal', label: 'Teklifler' },
              { id: 'deal', label: 'Anlaşmalar' },
              { id: 'system', label: 'Sistem' },
            ] as { id: FilterType; label: string }[]).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveFilter(item.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  activeFilter === item.id
                    ? 'bg-primary text-white'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-6 text-sm text-slate-500">
              Bildirimler yükleniyor...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 p-6 text-sm text-slate-500">
              Bu filtre için henüz bildirim yok.
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const badge = getNotificationBadge(notification.type)
              return (
                <div
                  key={notification.id}
                  className={`flex flex-col md:flex-row md:items-center gap-4 rounded-xl border p-4 transition-colors ${
                    notification.read
                      ? 'border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800'
                      : 'border-primary/40 bg-primary/5 dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${badge.badge}`}>
                      <span className="material-symbols-outlined text-lg">{badge.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{notification.title}</h3>
                        {!notification.read && <span className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{notification.message}</p>
                      <p className="text-xs text-slate-400 mt-2">{formatRelativeTime(notification.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end md:self-auto">
                    {notification.action_url ? (
                      <Link
                        href={notification.action_url}
                        onClick={() => {
                          if (!notification.read) {
                            toggleRead(notification)
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-primary border border-primary/30 hover:bg-primary/10"
                      >
                        Detay
                      </Link>
                    ) : null}
                    <button
                      onClick={() => toggleRead(notification)}
                      className="px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {notification.read ? 'Okunmadı yap' : 'Okundu yap'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  )
}
