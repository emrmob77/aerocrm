'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [])

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('sidebar-collapsed') : null
    if (stored) {
      setSidebarCollapsed(stored === 'true')
    }
  }, [])

  // Close sidebar when clicking outside (mobile)
  const handleOverlayClick = () => {
    setSidebarOpen(false)
  }

  const toggleCollapsed = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('sidebar-collapsed', String(next))
      }
      return next
    })
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={handleOverlayClick}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          sidebarCollapsed && 'lg:w-20'
        )}
      >
        <Sidebar
          onClose={() => setSidebarOpen(false)}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleCollapsed}
        />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#f5f6f8] dark:bg-[#101722]">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 pt-4 lg:pt-8 pb-0">
          {children}
        </div>
      </main>
    </div>
  )
}

export default MainLayout
