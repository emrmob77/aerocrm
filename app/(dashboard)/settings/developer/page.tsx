'use client'

import { useState } from 'react'
import Link from 'next/link'

// IP Whitelist data
const ipWhitelist = [
  { ip: '192.168.1.1', description: 'Ofis Ana Sunucu', status: 'active' },
  { ip: '45.12.89.231', description: 'Üretim Ortamı AWS', status: 'active' },
]

// SDK data
const sdkItems = [
  { icon: 'javascript', title: 'JavaScript SDK', description: 'Modern web uygulamaları için optimize edilmiş NPM paketimiz.', link: 'Dokümanı İncele' },
  { icon: 'data_object', title: 'Python Library', description: 'Veri analizi ve otomasyon süreçleri için güçlü kütüphane.', link: 'Dokümanı İncele' },
  { icon: 'api', title: 'REST API Docs', description: 'Tüm uç noktalar için kapsamlı API referans dokümanı.', link: 'API Referansı' },
]

export default function DeveloperSettingsPage() {
  const [showApiKey, setShowApiKey] = useState(false)
  const [webhooksEnabled, setWebhooksEnabled] = useState(true)
  const apiKey = 'aero_live_51Msz82K9Xp2m1n3r0q'

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey)
  }

  return (
    <div className="-m-8">
      <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <Link href="/settings" className="text-[#48679d] dark:text-gray-400 hover:text-primary">Ayarlar</Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <span className="text-primary">Geliştirici Ayarları</span>
        </div>

        {/* Page Heading */}
        <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">Geliştirici Ayarları</h1>
            <p className="text-[#48679d] dark:text-gray-400">AERO CRM entegrasyonlarını ve API erişimini buradan yönetin.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-[#e7ebf4] dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:shadow-md transition-all">
            <span className="material-symbols-outlined text-green-500">check_circle</span>
            Sistem Durumu: Aktif
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* API Access Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold px-1 text-[#0d121c] dark:text-white">API Erişimi</h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
              <label className="block text-sm font-semibold mb-2 text-[#0d121c] dark:text-white">Genel API Anahtarı</label>
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
                  title="Kopyala"
                >
                  <span className="material-symbols-outlined text-lg">content_copy</span>
                </button>
                <button
                  className="p-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Yenile"
                >
                  <span className="material-symbols-outlined text-lg">refresh</span>
                </button>
              </div>
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1">
                <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
                API anahtarınızı asla paylaşmayın. Tehlike anında hemen yenileyin.
              </p>
            </div>
          </section>

          {/* Webhook Settings Section */}
          <section className="space-y-4">
            <h3 className="text-xl font-bold px-1 text-[#0d121c] dark:text-white">Webhook Ayarları</h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm font-semibold text-[#0d121c] dark:text-white">Webhook Bildirimleri</p>
                  <p className="text-xs text-[#48679d] dark:text-gray-400">Tüm webhook akışını genel olarak yönetin.</p>
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
                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">Webhook Konfigürasyonu</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">chevron_right</span>
                </Link>
                <Link
                  href="/webhooks/logs"
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg group hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">history</span>
                    <span className="text-sm font-medium text-[#0d121c] dark:text-white">Olay Kayıtları (Logs)</span>
                  </div>
                  <span className="material-symbols-outlined text-gray-300 group-hover:text-primary transition-colors">chevron_right</span>
                </Link>
              </div>
            </div>
          </section>

          {/* Security Section */}
          <section className="space-y-4 md:col-span-2">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-bold text-[#0d121c] dark:text-white">Güvenlik</h3>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-lg">add</span>
                IP Ekle
              </button>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-[#e7ebf4] dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-[#e7ebf4] dark:border-gray-700">
                <h4 className="text-sm font-bold text-[#0d121c] dark:text-white">IP Beyaz Liste (IP Whitelisting)</h4>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase text-[#48679d] dark:text-gray-400 border-b border-[#e7ebf4] dark:border-gray-700">
                    <th className="px-6 py-4 font-semibold">IP Adresi</th>
                    <th className="px-6 py-4 font-semibold">Açıklama</th>
                    <th className="px-6 py-4 font-semibold">Durum</th>
                    <th className="px-6 py-4 font-semibold text-right">Eylemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7ebf4] dark:divide-gray-700">
                  {ipWhitelist.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 text-sm font-mono text-[#0d121c] dark:text-white">{item.ip}</td>
                      <td className="px-6 py-4 text-sm text-[#0d121c] dark:text-white">{item.description}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Aktif
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
            <h3 className="text-xl font-bold px-1 text-[#0d121c] dark:text-white">SDK &amp; Dokümantasyon</h3>
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
