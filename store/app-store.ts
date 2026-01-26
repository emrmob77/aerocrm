'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { User, Deal, Notification, ToastNotification } from '@/types'

interface AppState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  
  // Deals state
  deals: Deal[]
  setDeals: (deals: Deal[]) => void
  addDeal: (deal: Deal) => void
  updateDeal: (id: string, updates: Partial<Deal>) => void
  removeDeal: (id: string) => void
  
  // Notifications state
  notifications: Notification[]
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  
  // Toast notifications (ephemeral)
  toasts: ToastNotification[]
  addToast: (toast: Omit<ToastNotification, 'id'>) => void
  removeToast: (id: string) => void
  
  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  
  // Theme
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set, get) => ({
    // User
    user: null,
    setUser: (user) => set({ user }),
    
    // Deals
    deals: [],
    setDeals: (deals) => set({ deals }),
    addDeal: (deal) => set((state) => ({ 
      deals: [...state.deals, deal] 
    })),
    updateDeal: (id, updates) => set((state) => ({
      deals: state.deals.map((deal) =>
        deal.id === id ? { ...deal, ...updates } : deal
      ),
    })),
    removeDeal: (id) => set((state) => ({
      deals: state.deals.filter((deal) => deal.id !== id),
    })),
    
    // Notifications
    notifications: [],
    setNotifications: (notifications) => set({ notifications }),
    addNotification: (notification) => set((state) => ({
      notifications: [notification, ...state.notifications],
    })),
    markNotificationAsRead: (id) => set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
    markAllNotificationsAsRead: () => set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
    
    // Toasts
    toasts: [],
    addToast: (toast) => {
      const id = crypto.randomUUID()
      set((state) => ({
        toasts: [...state.toasts, { ...toast, id }],
      }))
      
      // Auto-remove after duration
      const duration = toast.duration ?? 5000
      setTimeout(() => {
        get().removeToast(id)
      }, duration)
    },
    removeToast: (id) => set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
    
    // Sidebar
    sidebarOpen: true,
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    
    // Theme
    theme: 'system',
    setTheme: (theme) => set({ theme }),
  }))
)
