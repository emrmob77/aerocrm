'use client'

import Link from 'next/link'

const settingsSections = [
  { title: 'Profil', description: 'Kişisel bilgilerinizi düzenleyin', icon: 'person', href: '/settings/profile' },
  { title: 'Takım', description: 'Takım üyelerini yönetin', icon: 'group', href: '/settings/team' },
  { title: 'Bildirimler', description: 'Bildirim tercihlerinizi ayarlayın', icon: 'notifications', href: '/settings/notifications' },
  { title: 'Güvenlik', description: 'Şifre ve güvenlik ayarları', icon: 'security', href: '/settings/security' },
  { title: 'Faturalama', description: 'Abonelik ve ödeme bilgileri', icon: 'credit_card', href: '/settings/billing' },
  { title: 'API & Geliştirici', description: 'API anahtarları ve entegrasyonlar', icon: 'code', href: '/settings/developer' },
]

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">Ayarlar</h1>
        <p className="text-[#48679d] dark:text-gray-400">Hesap ve uygulama ayarlarınızı yönetin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsSections.map((section, index) => (
          <Link
            key={index}
            href={section.href}
            className="bg-white dark:bg-[#161e2b] p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-800 hover:border-primary/30 hover:shadow-md transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-[#f5f6f8] dark:bg-gray-800 rounded-xl text-[#48679d] group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                <span className="material-symbols-outlined">{section.icon}</span>
              </div>
              <div>
                <h3 className="font-bold text-[#0d121c] dark:text-white group-hover:text-primary transition-colors">{section.title}</h3>
                <p className="text-sm text-[#48679d] mt-1">{section.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
