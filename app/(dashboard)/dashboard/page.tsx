'use client'

import Link from 'next/link'

// Mock data - will be replaced with real data from Supabase
const metrics = [
  { 
    label: 'Açık Teklifler', 
    value: '12', 
    badge: '+2 yeni',
    badgeColor: 'text-green-500',
    icon: 'assignment',
    iconBg: 'bg-blue-50 dark:bg-blue-900/30',
    iconColor: 'text-blue-600',
    badgeType: 'Aktif'
  },
  { 
    label: 'Bu Ay Kazanılan', 
    value: '₺45.000', 
    badge: '+8.4%',
    badgeColor: 'text-green-500',
    icon: 'payments',
    iconBg: 'bg-green-50 dark:bg-green-900/30',
    iconColor: 'text-green-600',
    badgeType: null
  },
  { 
    label: 'Dönüşüm Oranı', 
    value: '34%', 
    badge: '+2%',
    badgeColor: 'text-green-500',
    icon: 'trending_up',
    iconBg: 'bg-purple-50 dark:bg-purple-900/30',
    iconColor: 'text-purple-600',
    badgeType: null
  },
  { 
    label: 'Pipeline Değeri', 
    value: '₺120.000', 
    badge: null,
    badgeColor: '',
    icon: 'account_tree',
    iconBg: 'bg-orange-50 dark:bg-orange-900/30',
    iconColor: 'text-orange-600',
    badgeType: 'Toplam'
  },
]

const recentActivities = [
  { 
    id: 1, 
    title: 'Teklif gönderildi - Global Teknoloji A.Ş.',
    description: 'Bulut hizmetleri paketi için yeni revizyon iletildi.',
    time: '10 dk önce',
    icon: 'mail',
    iconBg: 'bg-blue-100 dark:bg-blue-900/40',
    iconColor: 'text-primary',
    hasLine: true
  },
  { 
    id: 2, 
    title: 'Anlaşma kapatıldı - TeknoPark Ltd.',
    description: '₺15.000 değerindeki proje onayı alındı.',
    time: '2 saat önce',
    icon: 'check_circle',
    iconBg: 'bg-green-100 dark:bg-green-900/40',
    iconColor: 'text-green-600',
    hasLine: true
  },
  { 
    id: 3, 
    title: 'Toplantı planlandı - Arkas Lojistik',
    description: 'Yarın saat 14:00\'da sunum randevusu oluşturuldu.',
    time: '4 saat önce',
    icon: 'event',
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600',
    hasLine: false
  },
]

const webhookActivities = [
  { endpoint: '/api/v1/deals', method: 'POST', status: '200 OK', statusColor: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-500', duration: '142ms', time: 'Az önce' },
  { endpoint: '/api/v1/invoices', method: 'POST', status: '201 Created', statusColor: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-500', duration: '210ms', time: '2 dk önce' },
  { endpoint: '/api/v1/auth', method: 'POST', status: '401 Unauth', statusColor: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-500', duration: '45ms', time: '5 dk önce' },
]

const quickActions = [
  { label: 'Yeni Anlaşma', icon: 'add_task', href: '/deals/new' },
  { label: 'Teklif Oluştur', icon: 'note_add', href: '/proposals/new' },
  { label: 'Müşteri Ekle', icon: 'person_add', href: '/contacts/new' },
  { label: 'Rapor Al', icon: 'analytics', href: '/reports' },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">
          Günaydın, Ahmet!
        </h2>
        <p className="text-[#48679d] dark:text-gray-400">
          İşte bugünkü satış performansına ve sistem sağlığına dair genel bakış.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-[#161e2b] p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 ${metric.iconBg} ${metric.iconColor} rounded-lg`}>
                <span className="material-symbols-outlined">{metric.icon}</span>
              </div>
              {metric.badgeType && (
                <span className="text-xs font-semibold text-gray-400">{metric.badgeType}</span>
              )}
              {metric.badge && !metric.badgeType && (
                <span className={`text-xs font-semibold ${metric.badgeColor}`}>{metric.badge}</span>
              )}
            </div>
            <h3 className="text-sm font-medium text-[#48679d] dark:text-gray-400">{metric.label}</h3>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold text-[#0d121c] dark:text-white">{metric.value}</p>
              {metric.badge && metric.badgeType === 'Aktif' && (
                <span className={`text-xs ${metric.badgeColor} font-bold`}>{metric.badge}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Recent Activity */}
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e7ebf4] dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-lg text-[#0d121c] dark:text-white">Son Aktivite</h3>
              <button className="text-sm text-primary font-semibold hover:underline">Tümünü Gör</button>
            </div>
            <div className="p-6">
              <ul className="space-y-6">
                {recentActivities.map((activity) => (
                  <li key={activity.id} className="flex gap-4">
                    <div className="relative">
                      <div className={`size-10 rounded-full ${activity.iconBg} flex items-center justify-center ${activity.iconColor} z-10 relative`}>
                        <span className="material-symbols-outlined text-sm">{activity.icon}</span>
                      </div>
                      {activity.hasLine && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-0.5 h-full bg-gray-100 dark:bg-gray-800 -z-0"></div>
                      )}
                    </div>
                    <div className={`flex-1 ${activity.hasLine ? 'pb-4' : ''}`}>
                      <div className="flex justify-between">
                        <p className="text-sm font-bold text-[#0d121c] dark:text-white">{activity.title}</p>
                        <span className="text-xs text-[#48679d] dark:text-gray-400">{activity.time}</span>
                      </div>
                      <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">{activity.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Webhook Activity */}
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e7ebf4] dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">webhook</span>
                <h3 className="font-bold text-lg text-[#0d121c] dark:text-white">Webhook Aktivitesi</h3>
              </div>
              <span className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold rounded-full flex items-center gap-1">
                <span className="size-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Canlı
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-[#f5f6f8] dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">Endpoint</th>
                    <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">Durum</th>
                    <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">Süre</th>
                    <th className="px-6 py-3 text-xs font-bold text-[#48679d] uppercase">Zaman</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-800">
                  {webhookActivities.map((activity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-[#0d121c] dark:text-gray-300">{activity.method}</span>
                          <span className="text-sm font-medium text-[#0d121c] dark:text-white">{activity.endpoint}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${activity.statusColor}`}>
                          {activity.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#48679d] dark:text-gray-400">{activity.duration}</td>
                      <td className="px-6 py-4 text-sm text-[#48679d] dark:text-gray-400">{activity.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-[#f5f6f8]/50 dark:bg-gray-800/30 border-t border-[#e7ebf4] dark:border-gray-800 text-center">
              <Link href="/webhooks" className="text-xs font-bold text-primary hover:underline uppercase tracking-wider">
                Log Kayıtlarını İncele
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 width */}
        <div className="flex flex-col gap-8">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
            <h3 className="font-bold text-lg text-[#0d121c] dark:text-white mb-6">Hızlı Aksiyonlar</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  href={action.href}
                  className="flex flex-col items-center justify-center p-4 rounded-xl bg-[#f5f6f8] dark:bg-gray-800 hover:bg-primary/5 hover:text-primary transition-all group border border-transparent hover:border-primary/20"
                >
                  <span className="material-symbols-outlined mb-2 group-hover:scale-110 transition-transform">{action.icon}</span>
                  <span className="text-xs font-bold text-center">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* System Health */}
          <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-[#0d121c] dark:text-white">Sistem Sağlığı</h3>
              <span className="material-symbols-outlined text-[#48679d] dark:text-gray-400 text-sm">info</span>
            </div>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-[#48679d] dark:text-gray-400">Webhook Başarı Oranı</span>
                  <span className="text-green-500">99.8%</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-green-500 h-full" style={{ width: '99.8%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-[#48679d] dark:text-gray-400">Ortalama Yanıt Süresi</span>
                  <span className="text-blue-500">124ms</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div className="pt-4 border-t border-[#e7ebf4] dark:border-gray-800">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-[#48679d] dark:text-gray-400">Son 24 Saat İstek</p>
                  <p className="text-sm font-bold text-[#0d121c] dark:text-white">14,204</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-[#48679d] dark:text-gray-400">Hatalı İstekler</p>
                  <p className="text-sm font-bold text-red-500">28</p>
                </div>
              </div>
              <button className="w-full py-2.5 rounded-lg border border-primary/20 text-primary text-xs font-bold hover:bg-primary/5 transition-colors">
                Sağlık Raporu Al
              </button>
            </div>
          </div>

          {/* Goal Progress Card */}
          <div className="bg-gradient-to-br from-primary to-blue-700 rounded-xl p-6 text-white shadow-xl shadow-primary/20">
            <h4 className="text-sm font-semibold opacity-90 mb-2">Hedef Gerçekleşme</h4>
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-bold">78%</span>
              <span className="material-symbols-outlined text-4xl opacity-50">auto_graph</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 mb-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            <p className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Kalan: ₺25,000</p>
          </div>
        </div>
      </div>
    </div>
  )
}
