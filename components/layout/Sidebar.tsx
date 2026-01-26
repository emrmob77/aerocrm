'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: string
  badge?: number
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'CRM', href: '/deals', icon: 'view_kanban' },
  { label: 'Kişiler', href: '/contacts', icon: 'contacts' },
  { label: 'Ürünler', href: '/products', icon: 'inventory_2' },
  { label: 'Teklifler', href: '/proposals', icon: 'description' },
  { label: 'Analitik', href: '/analytics', icon: 'analytics' },
  { label: 'Webhooks', href: '/webhooks', icon: 'webhook' },
]

const bottomNavItems: NavItem[] = [
  { label: 'Ayarlar', href: '/settings', icon: 'settings' },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(collapsed)

  const handleToggle = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    onCollapsedChange?.(newCollapsed)
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-aero-slate-800 border-r border-aero-slate-200 dark:border-aero-slate-700 transition-all duration-300 flex flex-col',
        isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center border-b border-aero-slate-200 dark:border-aero-slate-700 px-4',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          {!isCollapsed && (
            <span className="font-bold text-xl text-aero-slate-900 dark:text-white">
              AERO
            </span>
          )}
        </Link>
        {!isCollapsed && (
          <button
            onClick={handleToggle}
            className="p-1.5 rounded-lg hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
            aria-label="Sidebar'ı daralt"
          >
            <span className="material-symbols-outlined text-aero-slate-500 text-xl">
              chevron_left
            </span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-aero-blue-50 text-aero-blue-600 dark:bg-aero-blue-900/30 dark:text-aero-blue-400'
                  : 'text-aero-slate-600 hover:bg-aero-slate-100 hover:text-aero-slate-900 dark:text-aero-slate-400 dark:hover:bg-aero-slate-700 dark:hover:text-white',
                isCollapsed && 'justify-center'
              )}
            >
              <span className={cn(
                'material-symbols-outlined text-xl transition-colors',
                isActive && 'font-medium'
              )}>
                {item.icon}
              </span>
              {!isCollapsed && (
                <>
                  <span className="font-medium text-sm">{item.label}</span>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-auto bg-aero-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-aero-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-aero-slate-200 dark:border-aero-slate-700 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                isActive
                  ? 'bg-aero-blue-50 text-aero-blue-600 dark:bg-aero-blue-900/30 dark:text-aero-blue-400'
                  : 'text-aero-slate-600 hover:bg-aero-slate-100 hover:text-aero-slate-900 dark:text-aero-slate-400 dark:hover:bg-aero-slate-700 dark:hover:text-white',
                isCollapsed && 'justify-center'
              )}
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              {!isCollapsed && (
                <span className="font-medium text-sm">{item.label}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-aero-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          )
        })}

        {/* Expand button when collapsed */}
        {isCollapsed && (
          <button
            onClick={handleToggle}
            className="w-full flex items-center justify-center p-2.5 rounded-lg text-aero-slate-500 hover:bg-aero-slate-100 dark:hover:bg-aero-slate-700 transition-colors"
            aria-label="Sidebar'ı genişlet"
          >
            <span className="material-symbols-outlined text-xl">
              chevron_right
            </span>
          </button>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
