'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'

// Mock data - will be replaced with real data from Supabase
const metrics = [
  { 
    label: 'Açık Teklifler', 
    value: '12', 
    change: '+3', 
    trend: 'up', 
    icon: 'description',
    color: 'text-aero-blue-500'
  },
  { 
    label: 'Bu Ay Kazanılan', 
    value: '₺45,000', 
    change: '+12%', 
    trend: 'up', 
    icon: 'payments',
    color: 'text-aero-green-500'
  },
  { 
    label: 'Dönüşüm Oranı', 
    value: '34%', 
    change: '+5%', 
    trend: 'up', 
    icon: 'trending_up',
    color: 'text-aero-amber-500'
  },
  { 
    label: 'Pipeline Değeri', 
    value: '₺120,000', 
    change: '-', 
    trend: 'neutral', 
    icon: 'monitoring',
    color: 'text-aero-slate-500'
  },
]

const recentActivities = [
  { 
    id: 1, 
    type: 'proposal_viewed',
    message: 'ABC Ltd teklifi görüntüledi', 
    time: '5 dakika önce',
    icon: 'visibility',
    iconBg: 'bg-aero-blue-100 dark:bg-aero-blue-900/30',
    iconColor: 'text-aero-blue-500'
  },
  { 
    id: 2, 
    type: 'deal_won',
    message: 'XYZ Co anlaşması kazanıldı! 🎉', 
    time: '1 saat önce',
    icon: 'emoji_events',
    iconBg: 'bg-aero-green-100 dark:bg-aero-green-900/30',
    iconColor: 'text-aero-green-500'
  },
  { 
    id: 3, 
    type: 'proposal_sent',
    message: 'DEF Şirketi için teklif gönderildi', 
    time: '2 saat önce',
    icon: 'send',
    iconBg: 'bg-aero-amber-100 dark:bg-aero-amber-900/30',
    iconColor: 'text-aero-amber-500'
  },
  { 
    id: 4, 
    type: 'contact_added',
    message: 'Yeni kişi eklendi: Mehmet Demir', 
    time: '3 saat önce',
    icon: 'person_add',
    iconBg: 'bg-aero-slate-100 dark:bg-aero-slate-700',
    iconColor: 'text-aero-slate-500'
  },
  { 
    id: 5, 
    type: 'proposal_signed',
    message: 'GHI Ltd teklifi imzaladı', 
    time: '5 saat önce',
    icon: 'draw',
    iconBg: 'bg-aero-green-100 dark:bg-aero-green-900/30',
    iconColor: 'text-aero-green-500'
  },
]

const quickActions = [
  { label: 'Yeni Anlaşma', href: '/deals/new', icon: 'add_circle', color: 'bg-aero-blue-500' },
  { label: 'Teklif Oluştur', href: '/proposals/new', icon: 'description', color: 'bg-aero-green-500' },
  { label: 'Kişi Ekle', href: '/contacts/new', icon: 'person_add', color: 'bg-aero-amber-500' },
  { label: 'Rapor Al', href: '/analytics', icon: 'download', color: 'bg-aero-slate-500' },
]

// Get greeting based on time
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Günaydın'
  if (hour < 18) return 'İyi günler'
  return 'İyi akşamlar'
}

export default function DashboardPage() {
  const greeting = getGreeting()

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {greeting}, Emrah! 👋
        </h1>
        <p className="text-white/80">
          Bugün 3 teklif yanıt bekliyor ve 2 anlaşma takip gerektiriyor.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="card p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <span className={cn('material-symbols-outlined text-2xl', metric.color)}>
                {metric.icon}
              </span>
              {metric.trend !== 'neutral' && (
                <span className={cn(
                  'flex items-center text-xs font-medium',
                  metric.trend === 'up' ? 'text-aero-green-500' : 'text-aero-red-500'
                )}>
                  <span className="material-symbols-outlined text-sm">
                    {metric.trend === 'up' ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  {metric.change}
                </span>
              )}
            </div>
            <p className="text-2xl font-bold text-aero-slate-900 dark:text-white mb-1">
              {metric.value}
            </p>
            <p className="text-sm text-aero-slate-500">
              {metric.label}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - 2 columns */}
        <div className="lg:col-span-2 card">
          <div className="p-6 border-b border-aero-slate-200 dark:border-aero-slate-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-aero-slate-900 dark:text-white">
                Son Aktiviteler
              </h2>
              <Link 
                href="/activities" 
                className="text-sm text-aero-blue-500 hover:text-aero-blue-600 font-medium"
              >
                Tümünü Gör
              </Link>
            </div>
          </div>
          <div className="divide-y divide-aero-slate-100 dark:divide-aero-slate-700">
            {recentActivities.map((activity) => (
              <div 
                key={activity.id} 
                className="p-4 hover:bg-aero-slate-50 dark:hover:bg-aero-slate-700/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', activity.iconBg)}>
                    <span className={cn('material-symbols-outlined text-xl', activity.iconColor)}>
                      {activity.icon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-aero-slate-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-aero-slate-500 mt-0.5">
                      {activity.time}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-aero-slate-400">
                    chevron_right
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions - 1 column */}
        <div className="card">
          <div className="p-6 border-b border-aero-slate-200 dark:border-aero-slate-700">
            <h2 className="text-lg font-semibold text-aero-slate-900 dark:text-white">
              Hızlı Aksiyonlar
            </h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="flex flex-col items-center justify-center p-4 rounded-xl border border-aero-slate-200 dark:border-aero-slate-700 hover:border-aero-blue-300 dark:hover:border-aero-blue-700 hover:shadow-md transition-all group"
              >
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', action.color)}>
                  <span className="material-symbols-outlined text-white text-2xl">
                    {action.icon}
                  </span>
                </div>
                <span className="text-sm font-medium text-aero-slate-700 dark:text-aero-slate-300 text-center group-hover:text-aero-blue-500 transition-colors">
                  {action.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline Summary */}
      <div className="card">
        <div className="p-6 border-b border-aero-slate-200 dark:border-aero-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-aero-slate-900 dark:text-white">
              Pipeline Özeti
            </h2>
            <Link 
              href="/deals" 
              className="text-sm text-aero-blue-500 hover:text-aero-blue-600 font-medium"
            >
              Tüm Anlaşmalar
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {[
              { label: 'Aday', count: 8, value: '₺40,000', color: 'bg-aero-slate-400' },
              { label: 'Teklif', count: 5, value: '₺35,000', color: 'bg-aero-blue-500' },
              { label: 'Görüşme', count: 3, value: '₺25,000', color: 'bg-aero-amber-500' },
              { label: 'Kazanıldı', count: 6, value: '₺45,000', color: 'bg-aero-green-500' },
            ].map((stage, index) => (
              <div key={index} className="flex-1 text-center">
                <div className={cn('h-2 rounded-full mb-2', stage.color)} />
                <p className="text-xs text-aero-slate-500">{stage.label}</p>
                <p className="text-sm font-semibold text-aero-slate-900 dark:text-white">{stage.count}</p>
                <p className="text-xs text-aero-slate-400">{stage.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
