'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { cn } from '@/lib/utils'

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const isWideLayout = pathname?.startsWith('/proposals/new')

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

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
        <div
          className={cn(
            'flex-1 overflow-y-auto px-4 pt-4 pb-0',
            sidebarCollapsed ? 'lg:px-5 lg:pt-6' : 'lg:px-6 lg:pt-7',
            isWideLayout && 'lg:px-8 lg:pt-6'
          )}
        >
          <div className={cn('mx-auto w-full', isWideLayout ? 'max-w-[1360px]' : 'max-w-[1200px]')}>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

export default MainLayout
