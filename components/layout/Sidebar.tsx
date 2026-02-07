'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useI18n } from '@/lib/i18n'
import { useUser } from '@/hooks'
import { getFirstAllowedPath, resolveAllowedScreens, TeamScreenKey } from '@/lib/team/screen-access'
import type { User } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: string
  screenKey: TeamScreenKey
}

interface NavSection {
  id: string
  label: string
  items: NavItem[]
}

interface SidebarProps {
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  initialUser?: User | null
}

export function Sidebar({ onClose, collapsed = false, onToggleCollapsed, initialUser = null }: SidebarProps) {
  const pathname = usePathname()
  const { t } = useI18n()
  const { user: profileFromStore, loading } = useUser()
  const user = profileFromStore ?? (loading ? initialUser : null)
  const toggleCollapsed = () => onToggleCollapsed?.()
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    core: true,
    insights: true,
    automation: true,
    workspace: true,
    general: true,
  })

  const itemMap = {
    dashboard: { label: t('nav.dashboard'), href: '/dashboard', icon: 'dashboard', screenKey: 'dashboard' },
    deals: { label: t('nav.deals'), href: '/deals', icon: 'database', screenKey: 'deals' },
    contacts: { label: t('nav.contacts'), href: '/contacts', icon: 'group', screenKey: 'contacts' },
    products: { label: t('nav.products'), href: '/products', icon: 'inventory_2', screenKey: 'products' },
    proposals: { label: t('nav.proposals'), href: '/proposals', icon: 'description', screenKey: 'proposals' },
    templates: { label: t('nav.templates'), href: '/templates', icon: 'auto_awesome', screenKey: 'templates' },
    sales: { label: t('nav.sales'), href: '/sales', icon: 'handshake', screenKey: 'sales' },
    reports: { label: t('nav.reports'), href: '/reports', icon: 'bar_chart', screenKey: 'reports' },
    analytics: { label: t('nav.analytics'), href: '/analytics', icon: 'analytics', screenKey: 'analytics' },
    notifications: { label: t('nav.notifications'), href: '/notifications', icon: 'notifications', screenKey: 'notifications' },
    webhooks: { label: t('nav.webhooks'), href: '/webhooks', icon: 'webhook', screenKey: 'webhooks' },
    integrations: { label: t('nav.integrations'), href: '/integrations', icon: 'extension', screenKey: 'integrations' },
    settings: { label: t('nav.settings'), href: '/settings', icon: 'settings', screenKey: 'settings' },
  } as const

  const navSections: NavSection[] = [
    {
      id: 'core',
      label: t('sidebar.sections.core'),
      items: [itemMap.dashboard, itemMap.deals, itemMap.contacts, itemMap.products, itemMap.proposals, itemMap.templates],
    },
    {
      id: 'insights',
      label: t('sidebar.sections.insights'),
      items: [itemMap.sales, itemMap.reports, itemMap.analytics, itemMap.notifications],
    },
    {
      id: 'automation',
      label: t('sidebar.sections.automation'),
      items: [itemMap.webhooks, itemMap.integrations],
    },
    {
      id: 'workspace',
      label: t('sidebar.sections.workspace'),
      items: [itemMap.settings],
    },
  ]

  const utilityItems: NavItem[] = [
    { label: t('nav.search'), href: '/search', icon: 'search', screenKey: 'search' },
    { label: t('nav.importExport'), href: '/reports/import-export', icon: 'swap_vert', screenKey: 'import_export' },
  ]

  const allowedScreenSet = useMemo(() => {
    if (!user) {
      return new Set<TeamScreenKey>()
    }
    return new Set(resolveAllowedScreens(user?.allowed_screens))
  }, [user])
  const homeHref = useMemo(
    () => (!user ? '/dashboard' : getFirstAllowedPath(user?.allowed_screens)),
    [user]
  )
  const showLoadingSkeleton = loading && !user

  const filteredNavSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allowedScreenSet.has(item.screenKey)),
    }))
    .filter((section) => section.items.length > 0)

  const filteredUtilityItems = utilityItems.filter((item) => allowedScreenSet.has(item.screenKey))

  const canCreateDeal = allowedScreenSet.has('deals')

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

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
          href={homeHref}
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
      <nav className={cn('flex-1 px-3 py-3 space-y-4', collapsed && 'px-2')}>
        {showLoadingSkeleton && (
          <div className="space-y-2 px-2 pt-2">
            <div className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
            <div className="h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          </div>
        )}
        {filteredNavSections.map((section) => {
          const sectionOpen = collapsed || openSections[section.id] !== false
          return (
            <div key={section.id} className="space-y-1">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  aria-expanded={sectionOpen}
                  aria-controls={`sidebar-section-${section.id}`}
                >
                  <span>{section.label}</span>
                  <span className="material-symbols-outlined text-base">
                    {sectionOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
              )}
              {sectionOpen && (
                <div id={`sidebar-section-${section.id}`} className="space-y-1">
                  {section.items.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        title={collapsed ? item.label : undefined}
                        aria-current={isActive ? 'page' : undefined}
                        aria-label={collapsed ? item.label : undefined}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
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
              )}
            </div>
          )
        })}

        <div className="pt-2 border-t border-[#e7ebf4] dark:border-gray-800">
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleSection('general')}
              className="w-full px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              aria-expanded={openSections.general !== false}
              aria-controls="sidebar-section-general"
            >
              <span>{t('sidebar.general')}</span>
              <span className="material-symbols-outlined text-base">
                {openSections.general !== false ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
          {(collapsed || openSections.general !== false) && (
            <div id="sidebar-section-general" className="space-y-1">
              {filteredUtilityItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    title={collapsed ? item.label : undefined}
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={collapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-[13px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
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
          )}
        </div>
      </nav>

      {/* Bottom Action Button */}
      {canCreateDeal && (
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
      )}
    </aside>
  )
}

export default Sidebar
