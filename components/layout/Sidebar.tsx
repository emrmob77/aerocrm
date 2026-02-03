'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'

interface NavItem {
  label: string
  href: string
  icon: string
}

interface SidebarProps {
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const toggleCollapsed = () => onToggleCollapsed?.()

  const navItems: NavItem[] = [
    { label: t('nav.dashboard'), href: '/dashboard', icon: 'dashboard' },
    { label: t('nav.deals'), href: '/deals', icon: 'database' },
    { label: t('nav.contacts'), href: '/contacts', icon: 'group' },
    { label: t('nav.products'), href: '/products', icon: 'inventory_2' },
    { label: t('nav.proposals'), href: '/proposals', icon: 'description' },
    { label: t('nav.templates'), href: '/templates', icon: 'auto_awesome' },
    { label: t('nav.sales'), href: '/sales', icon: 'handshake' },
    { label: t('nav.reports'), href: '/reports', icon: 'bar_chart' },
    { label: t('nav.analytics'), href: '/analytics', icon: 'analytics' },
    { label: t('nav.notifications'), href: '/notifications', icon: 'notifications' },
    { label: t('nav.webhooks'), href: '/webhooks', icon: 'webhook' },
    { label: t('nav.integrations'), href: '/integrations', icon: 'extension' },
    { label: t('nav.settings'), href: '/settings', icon: 'settings' },
  ]

  const generalItems: NavItem[] = [
    { label: t('nav.search'), href: '/search', icon: 'search' },
    { label: t('nav.importExport'), href: '/reports/import-export', icon: 'swap_vert' },
  ]

  return (
    <aside
      className={cn(
        'h-full w-full flex-shrink-0 flex flex-col border-r border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#161e2b] overflow-y-auto transition-all duration-200'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'px-4 py-4 flex border-b border-[#e7ebf4] dark:border-gray-800',
          collapsed ? 'flex-col items-center gap-2' : 'items-center justify-between'
        )}
      >
        <Link
          href="/dashboard"
          className={cn('flex items-center gap-3', collapsed && 'justify-center')}
          onClick={onClose}
        >
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">rocket_launch</span>
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-[#0d121c] dark:text-white text-sm font-bold leading-none">AERO CRM</h1>
              <p className="text-[#48679d] dark:text-gray-400 text-[11px] font-medium">{t('sidebar.tagline')}</p>
            </div>
          )}
        </Link>
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <button
              onClick={toggleCollapsed}
              title={t('sidebar.collapse')}
              aria-label={t('sidebar.collapse')}
              className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleCollapsed}
              title={t('sidebar.expand')}
              aria-label={t('sidebar.expand')}
              className="p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 px-3 py-3 space-y-3', collapsed && 'px-2')}>
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px]',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                  collapsed && 'justify-center px-2'
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </div>

        <div>
          {!collapsed && (
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t('sidebar.general')}
            </p>
          )}
          <div className="space-y-1">
            {generalItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px]',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Action Button */}
      <div className={cn('p-3 border-t border-[#e7ebf4] dark:border-gray-800', collapsed && 'px-2')}>
        <Link
          href="/deals/new"
          onClick={onClose}
          title={collapsed ? t('sidebar.newRecord') : undefined}
          className={cn(
            'w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5 font-bold text-sm transition-all shadow-lg shadow-primary/20',
            collapsed && 'px-0'
          )}
        >
          <span className="material-symbols-outlined text-sm">add</span>
          {!collapsed && <span>{t('sidebar.newRecord')}</span>}
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
