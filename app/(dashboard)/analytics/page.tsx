'use client'

// Stats data
const stats = [
  { 
    label: 'Gönderilen', 
    value: '24', 
    icon: 'send', 
    iconColor: 'text-primary',
    trend: { value: '+12% vs last month', type: 'up', color: 'text-[#07883b]' }
  },
  { 
    label: 'Görüntülenen', 
    value: '18', 
    icon: 'visibility', 
    iconColor: 'text-primary',
    trend: { value: '75% Conversion Rate', type: 'neutral', color: 'text-primary' }
  },
  { 
    label: 'İmzalanan', 
    value: '8', 
    icon: 'verified', 
    iconColor: 'text-[#07883b]',
    trend: { value: '33% Close Rate', type: 'neutral', color: 'text-primary' }
  },
  { 
    label: 'Ortalama Süre', 
    value: '4:32', 
    icon: 'timer', 
    iconColor: 'text-[#e73908]',
    trend: { value: '-0:15 slower review', type: 'down', color: 'text-[#e73908]' }
  },
]

// Block interaction data
const blockInteractions = [
  { name: 'Giriş', time: '42s', percentage: 45, opacity: 'bg-primary/40' },
  { name: 'Teklif Detayı', time: '124s', percentage: 75, opacity: 'bg-primary/70' },
  { name: 'Fiyatlandırma', time: '186s', percentage: 90, opacity: 'bg-primary' },
  { name: 'Sözleşme Şartları', time: '94s', percentage: 60, opacity: 'bg-primary/50' },
]

// Recent activities
const recentActivities = [
  { 
    icon: 'visibility', 
    iconBg: 'bg-primary/10', 
    iconColor: 'text-primary',
    title: 'John Doe teklifi görüntüledi',
    description: 'Fiyatlandırma bloğunda 45 saniye geçirdi.',
    time: '2 dakika önce'
  },
  { 
    icon: 'edit_document', 
    iconBg: 'bg-[#07883b]/10', 
    iconColor: 'text-[#07883b]',
    title: 'Global Tech Inc. imzayı tamamladı',
    description: 'Teklif #442231 başarıyla kapatıldı.',
    time: '15 dakika önce'
  },
  { 
    icon: 'download', 
    iconBg: 'bg-primary/10', 
    iconColor: 'text-primary',
    title: 'Sarah Smith PDF indirdi',
    description: 'Marketing Proposal v2',
    time: '1 saat önce'
  },
  { 
    icon: 'forum', 
    iconBg: 'bg-[#e73908]/10', 
    iconColor: 'text-[#e73908]',
    title: 'Yeni yorum eklendi',
    description: '"Teslimat süresi hakkında bir sorum var..."',
    time: '3 saat önce'
  },
]

export default function AnalyticsPage() {
  return (
    <div className="-m-8">
      <main className="flex flex-col flex-1 px-10 py-8 max-w-[1440px] mx-auto w-full">
        {/* Page Title Section */}
        <div className="flex flex-wrap justify-between gap-3 mb-8">
          <div className="flex min-w-72 flex-col gap-1">
            <p className="text-[#0d121c] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Spyglass Analytics</p>
            <p className="text-[#48679d] dark:text-[#a1b0cb] text-base font-normal leading-normal">Proposal performance and engagement insights for Q3 2024</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-white dark:bg-[#1e293b] border border-[#ced8e9] dark:border-[#2a3441] text-[#0d121c] dark:text-white text-sm font-bold leading-normal tracking-[0.015em]">
              <span className="material-symbols-outlined text-lg mr-2">calendar_today</span>
              <span className="truncate">Son 30 Gün</span>
            </button>
            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-lg shadow-primary/20">
              <span className="material-symbols-outlined text-lg mr-2">ios_share</span>
              <span className="truncate">Export Report</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-wrap gap-4 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="flex min-w-[200px] flex-1 flex-col gap-2 rounded-xl p-6 bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-[#2a3441] shadow-sm">
              <div className="flex justify-between items-start">
                <p className="text-[#48679d] dark:text-[#a1b0cb] text-sm font-medium leading-normal uppercase tracking-wider">{stat.label}</p>
                <span className={`material-symbols-outlined ${stat.iconColor}`}>{stat.icon}</span>
              </div>
              <p className="text-[#0d121c] dark:text-white tracking-light text-3xl font-bold leading-tight">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.trend.type === 'up' && (
                  <span className="material-symbols-outlined text-[#07883b] text-sm">trending_up</span>
                )}
                {stat.trend.type === 'down' && (
                  <span className="material-symbols-outlined text-[#e73908] text-sm">trending_down</span>
                )}
                <p className={`${stat.trend.color} text-sm font-semibold leading-normal`}>{stat.trend.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Funnel Section */}
        <div className="mb-8 bg-white dark:bg-[#101722] rounded-xl border border-[#ced8e9] dark:border-[#2a3441] shadow-sm overflow-hidden">
          <h2 className="text-[#0d121c] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em] px-6 pt-6 pb-4">Conversion Funnel</h2>
          <div className="pb-8">
            <div className="flex items-center px-6 gap-2">
              {/* Stage 1: Gönderildi */}
              <div className="flex-1 relative">
                <div className="h-16 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm relative">
                  Gönderildi (24)
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary rotate-45 z-10"></div>
                </div>
                <p className="text-center text-xs mt-2 text-[#48679d] font-bold">100%</p>
              </div>
              
              {/* Arrow */}
              <div className="flex items-center justify-center px-4">
                <span className="material-symbols-outlined text-[#ced8e9]">arrow_forward_ios</span>
              </div>
              
              {/* Stage 2: Görüntülendi */}
              <div className="flex-[0.75] relative">
                <div className="h-16 bg-primary/80 rounded-lg flex items-center justify-center text-white font-bold text-sm relative">
                  Görüntülendi (18)
                  <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-primary/80 rotate-45 z-10"></div>
                </div>
                <p className="text-center text-xs mt-2 text-[#48679d] font-bold">75%</p>
              </div>
              
              {/* Arrow */}
              <div className="flex items-center justify-center px-4">
                <span className="material-symbols-outlined text-[#ced8e9]">arrow_forward_ios</span>
              </div>
              
              {/* Stage 3: İmzalandı */}
              <div className="flex-[0.33] relative">
                <div className="h-16 bg-primary/60 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                  İmzalandı (8)
                </div>
                <p className="text-center text-xs mt-2 text-[#48679d] font-bold">33%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid: Blocks & Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Block Interaction Map */}
          <div className="lg:col-span-2 flex flex-col bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-[#2a3441] rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[#0d121c] dark:text-white text-lg font-bold">Blok Etkileşim Haritası</h3>
              <span className="text-xs font-bold text-[#48679d] uppercase">Ortalama Saniye / Blok</span>
            </div>
            <div className="flex flex-col gap-6">
              {blockInteractions.map((block, index) => (
                <div key={index} className="flex items-center gap-4">
                  <p className="w-32 text-sm font-medium text-[#48679d] dark:text-[#a1b0cb] truncate">{block.name}</p>
                  <div className="flex-1 h-8 bg-[#f0f3f9] dark:bg-[#1e293b] rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${block.opacity} rounded-full flex items-center justify-end px-3`}
                      style={{ width: `${block.percentage}%` }}
                    >
                      <span className={`text-[10px] font-bold ${block.percentage > 60 ? 'text-white' : 'text-[#0d121c] dark:text-white'}`}>
                        {block.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="flex flex-col bg-white dark:bg-[#101722] border border-[#ced8e9] dark:border-[#2a3441] rounded-xl shadow-sm p-6">
            <h3 className="text-[#0d121c] dark:text-white text-lg font-bold mb-6">Son Aktiviteler</h3>
            <div className="flex flex-col gap-6 flex-1">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex gap-4">
                  <div className={`size-8 rounded-full ${activity.iconBg} flex items-center justify-center shrink-0`}>
                    <span className={`material-symbols-outlined ${activity.iconColor} text-lg`}>{activity.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-sm font-bold text-[#0d121c] dark:text-white">{activity.title}</p>
                    <p className="text-xs text-[#48679d] dark:text-[#a1b0cb]">{activity.description}</p>
                    <span className="text-[10px] font-medium text-[#a1b0cb] mt-1">{activity.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-auto pt-6 text-primary text-xs font-bold uppercase tracking-widest text-center hover:underline">
              Tümünü Gör
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
