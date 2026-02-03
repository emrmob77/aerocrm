'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

export default function DeveloperSettingsPage() {
  const { t } = useI18n()
  const [showApiKey, setShowApiKey] = useState(false)
  const [webhooksEnabled, setWebhooksEnabled] = useState(true)
  const apiKey = 'aero_live_51Msz82K9Xp2m1n3r0q'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
  }

  const ipWhitelist = useMemo(
    () => [
      { ip: '192.168.1.1', description: t('developerSettings.security.whitelist.officeServer'), status: 'active' },
      { ip: '45.12.89.231', description: t('developerSettings.security.whitelist.prodAws'), status: 'active' },
    ],
    [t]
  )

  const sdkItems = useMemo(
    () => [
      {
        icon: 'javascript',
        title: 'JavaScript SDK',
        description: t('developerSettings.sdk.items.javascript'),
        link: t('developerSettings.sdk.links.docs'),
      },
      {
        icon: 'data_object',
        title: 'Python Library',
        description: t('developerSettings.sdk.items.python'),
        link: t('developerSettings.sdk.links.docs'),
      },
      {
        icon: 'api',
        title: 'REST API Docs',
        description: t('developerSettings.sdk.items.rest'),
        link: t('developerSettings.sdk.links.apiRef'),
      },
    ],
    [t]
  )

  return (
    <div className="-m-8">
      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <Link href="/settings" className="text-[#48679d] dark:text-gray-400 hover:text-primary">{t('settings.title')}</Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-primary">{t('developerSettings.title')}</span>
        </div>

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">{t('developerSettings.title')}</h1>
            <p className="text-[#48679d] dark:text-gray-400">{t('developerSettings.subtitle')}</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            {t('developerSettings.status.label')}: {t('developerSettings.status.active')}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* API Access Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold px-1 text-[#0d121c] dark:text-white">{t('developerSettings.api.title')}</h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
              <label className="block text-sm font-semibold mb-2 text-[#0d121c] dark:text-white">{t('developerSettings.api.keyLabel')}</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    readOnly
                    value={apiKey}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm font-mono focus:ring-primary py-2.5 px-4 pr-10"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg">{showApiKey ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  title={t('common.copy')}
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
                <button
                  className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title={t('developerSettings.api.rotate')}
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                {t('developerSettings.api.warning')}
              </p>
            </div>
          </section>

          {/* Webhook Settings Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold px-1 text-[#0d121c] dark:text-white">{t('developerSettings.webhooks.title')}</h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{t('developerSettings.webhooks.notificationsTitle')}</p>
                  <p className="text-xs text-[#48679d] dark:text-gray-400">{t('developerSettings.webhooks.notificationsDescription')}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={webhooksEnabled}
                    onChange={() => setWebhooksEnabled(!webhooksEnabled)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/webhooks"
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg group hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">link</span>
                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">{t('developerSettings.webhooks.configuration')}</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">chevron_right</span>
                </Link>
                <Link
                  href="/webhooks/logs"
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg group hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">history</span>
                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">{t('developerSettings.webhooks.logs')}</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">chevron_right</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-bold text-[#0d121c] dark:text-white">{t('developerSettings.security.title')}</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-lg">add</span>
                {t('developerSettings.security.addIp')}
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-[#e7ebf4] dark:border-gray-700">
                <h4 className="text-sm font-bold text-[#0d121c] dark:text-white">{t('developerSettings.security.whitelist.title')}</h4>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase text-[#48679d] dark:text-gray-400 border-b border-[#e7ebf4] dark:border-gray-700">
                    <th className="px-6 py-4 font-semibold">{t('developerSettings.security.columns.ip')}</th>
                    <th className="px-6 py-4 font-semibold">{t('developerSettings.security.columns.description')}</th>
                    <th className="px-6 py-4 font-semibold">{t('developerSettings.security.columns.status')}</th>
                    <th className="px-6 py-4 font-semibold text-right">{t('developerSettings.security.columns.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-700">
                  {ipWhitelist.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-mono text-[#0d121c] dark:text-white">{item.ip}</td>
                      <td className="px-6 py-4 text-sm text-[#0d121c] dark:text-white">{item.description}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {t('developerSettings.security.active')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* SDK & Documentation Section */}
          <section className="space-y-4 md:col-span-2">
            <h3 className="text-xl font-bold px-1 text-[#0d121c] dark:text-white">{t('developerSettings.sdk.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sdkItems.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm hover:border-primary/50 transition-colors flex flex-col h-full">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <h4 className="text-base font-bold mb-2 text-[#0d121c] dark:text-white">{item.title}</h4>
                  <p className="text-sm text-[#48679d] dark:text-gray-400 mb-6 flex-1">{item.description}</p>
                  <a className="flex items-center gap-2 text-sm font-bold text-primary hover:underline" href="#">
                    {item.link}
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </a>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
