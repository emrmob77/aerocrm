'use client'

import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function SettingsPage() {
  const { t, locale, setLocale } = useI18n()

  const settingsSections = [
    { title: t('settings.sections.profile.title'), description: t('settings.sections.profile.description'), icon: 'person', href: '/settings/profile' },
    { title: t('settings.sections.team.title'), description: t('settings.sections.team.description'), icon: 'group', href: '/settings/team' },
    { title: t('settings.sections.notifications.title'), description: t('settings.sections.notifications.description'), icon: 'notifications', href: '/settings/notifications' },
    { title: t('settings.sections.security.title'), description: t('settings.sections.security.description'), icon: 'security', href: '/settings/security' },
    { title: t('settings.sections.billing.title'), description: t('settings.sections.billing.description'), icon: 'credit_card', href: '/settings/billing' },
    { title: t('settings.sections.monitoring.title'), description: t('settings.sections.monitoring.description'), icon: 'monitor_heart', href: '/settings/monitoring' },
    { title: t('settings.sections.developer.title'), description: t('settings.sections.developer.description'), icon: 'code', href: '/settings/developer' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('settings.title')}</h1>
            <p className="text-[#48679d] dark:text-gray-400">{t('settings.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#48679d]">{t('common.language')}</span>
            <div className="flex items-center rounded-lg border border-[#e7ebf4] dark:border-gray-800 bg-white dark:bg-[#161e2b] p-1">
              <button
                onClick={() => setLocale('tr')}
                className={`px-3 py-1 rounded-md text-sm font-semibold ${locale === 'tr' ? 'bg-primary text-white' : 'text-[#48679d]'}`}
              >
                {t('common.turkish')}
              </button>
              <button
                onClick={() => setLocale('en')}
                className={`px-3 py-1 rounded-md text-sm font-semibold ${locale === 'en' ? 'bg-primary text-white' : 'text-[#48679d]'}`}
              >
                {t('common.english')}
              </button>
            </div>
          </div>
        </div>
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
