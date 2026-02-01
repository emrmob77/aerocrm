'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  href: string
  icon: string
}

// Tüm sayfalar
const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { label: 'Anlaşmalar', href: '/deals', icon: 'database' },
  { label: 'Kişiler', href: '/contacts', icon: 'group' },
  { label: 'Ürünler', href: '/products', icon: 'inventory_2' },
  { label: 'Teklifler', href: '/proposals', icon: 'description' },
  { label: 'Satışlar', href: '/sales', icon: 'handshake' },
  { label: 'Raporlar', href: '/reports', icon: 'bar_chart' },
  { label: 'Analitik', href: '/analytics', icon: 'analytics' },
  { label: 'Bildirimler', href: '/notifications', icon: 'notifications' },
  { label: 'Webhooks', href: '/webhooks', icon: 'webhook' },
  { label: 'Entegrasyonlar', href: '/integrations', icon: 'extension' },
  { label: 'Ayarlar', href: '/settings', icon: 'settings' },
]

const generalItems: NavItem[] = [
  { label: 'Arama', href: '/search', icon: 'search' },
  { label: 'Veri Aktarımı', href: '/reports/import-export', icon: 'swap_vert' },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 h-full flex-shrink-0 flex flex-col border-r border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#161e2b] overflow-y-auto">
      {/* Logo */}
      <div className="p-6 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="bg-primary size-10 rounded-lg flex items-center justify-center text-white">
            <span className="material-symbols-outlined">rocket_launch</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-[#0d121c] dark:text-white text-lg font-bold leading-none">AERO CRM</h1>
            <p className="text-[#48679d] dark:text-gray-400 text-xs font-medium">Satış Yönetimi</p>
          </div>
        </Link>
        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-[#48679d] hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                )}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </div>

        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Genel</p>
          <div className="space-y-1">
            {generalItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="text-sm">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Bottom Action Button */}
      <div className="p-4 border-t border-[#e7ebf4] dark:border-gray-800">
        <Link
          href="/deals/new"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-lg py-3 font-bold text-sm transition-all shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          <span>Yeni Kayıt</span>
        </Link>
      </div>
    </aside>
  )
}

export default Sidebar
