'use client'

import { useState } from 'react'

// Webhook data
const webhooksData = [
  { id: 1, url: 'https://api.acme-corp.com/hooks/v1', status: 'active', lastTrigger: '2 dakika önce', selected: false },
  { id: 2, url: 'https://webhook.site/b82a-4421-99af', status: 'inactive', lastTrigger: '3 saat önce', selected: true },
  { id: 3, url: 'https://zapier.com/hooks/123/acme-crm', status: 'active', lastTrigger: 'Dün 14:30', selected: false },
]

// Settings menu items
const settingsMenu = [
  { icon: 'person', label: 'Profil', active: false },
  { icon: 'group', label: 'Ekip Yönetimi', active: false },
  { icon: 'api', label: 'Webhooks', active: true },
  { icon: 'security', label: 'API Anahtarları', active: false },
]

export default function WebhooksPage() {
  const [webhooks] = useState(webhooksData)
  const [selectedWebhook, setSelectedWebhook] = useState(2)
  
  // Form state
  const [targetUrl, setTargetUrl] = useState('https://webhook.site/b82a-4421-99af')
  const [events, setEvents] = useState({
    proposalViewed: true,
    proposalSigned: true,
    proposalExpired: false,
    dealCreated: true,
    dealWon: true,
    dealLost: false,
  })

  const toggleEvent = (key: keyof typeof events) => {
    setEvents(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const selectAllEvents = () => {
    setEvents({
      proposalViewed: true,
      proposalSigned: true,
      proposalExpired: true,
      dealCreated: true,
      dealWon: true,
      dealLost: true,
    })
  }

  return (
    <div className="-m-8">
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-[#e2e8f0] dark:border-slate-700">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-wider mb-4 px-2">Ayarlar</h3>
            <nav className="space-y-1">
              {settingsMenu.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    item.active
                      ? 'text-primary bg-primary/5 border border-primary/10 font-bold'
                      : 'text-[#64748b] hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-9 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">visibility</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0f172a] dark:text-white tracking-tight">Webhook Yapılandırması</h1>
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-md transition-all">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Yeni Webhook Ekle
            </button>
          </div>

          {/* Webhooks Table */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-[#e2e8f0] dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800 border-b border-[#e2e8f0] dark:border-slate-700">
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Hedef URL</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Durum</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider">Son Tetikleme</th>
                    <th className="px-6 py-4 text-xs font-bold text-[#64748b] uppercase tracking-wider text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] dark:divide-slate-700">
                  {webhooks.map((webhook) => (
                    <tr 
                      key={webhook.id}
                      className={`transition-colors cursor-pointer ${
                        selectedWebhook === webhook.id
                          ? 'bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-l-primary'
                          : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/50'
                      }`}
                      onClick={() => {
                        setSelectedWebhook(webhook.id)
                        setTargetUrl(webhook.url)
                      }}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-[#0f172a] dark:text-white max-w-xs truncate">
                        {webhook.url}
                      </td>
                      <td className="px-6 py-4">
                        {webhook.status === 'active' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-[#64748b]">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#64748b]">{webhook.lastTrigger}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary hover:underline text-sm font-bold">Düzenle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Webhook Details Form */}
          <section className="bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-[#e2e8f0] dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-900">
              <h2 className="text-lg font-bold text-[#0f172a] dark:text-white">Webhook Detayları</h2>
              <p className="text-sm text-[#64748b]">Belirli olaylar gerçekleştiğinde veri gönderilecek hedefi yapılandırın.</p>
            </div>

            <div className="p-6 space-y-8">
              {/* URL and Secret Key */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#0f172a] dark:text-white">Hedef URL</label>
                  <input
                    type="url"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://api.domain.com/webhook"
                    className="w-full bg-white dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-600 rounded-lg text-sm px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition-all placeholder:text-slate-400 text-[#0f172a] dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-[#0f172a] dark:text-white">Gizli Anahtar (Secret Key)</label>
                  <div className="relative">
                    <input
                      type="password"
                      readOnly
                      value="••••••••••••••••••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-600 rounded-lg text-sm pr-10 px-4 py-2.5 focus:ring-2 focus:ring-primary focus:border-primary text-[#64748b]"
                    />
                    <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#64748b] hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Events */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0f172a] dark:text-white uppercase tracking-wider">Olaylar (Events)</h3>
                  <button 
                    onClick={selectAllEvents}
                    className="text-xs font-bold text-primary hover:underline transition-colors"
                  >
                    Tümünü Seç
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Proposal Events */}
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#e2e8f0] dark:border-slate-700">
                      <span className="material-symbols-outlined text-primary text-[20px]">description</span>
                      <h4 className="text-sm font-bold text-[#0f172a] dark:text-white">Teklif Olayları</h4>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={events.proposalViewed}
                          onChange={() => toggleEvent('proposalViewed')}
                          className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors">Görüntülendi</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={events.proposalSigned}
                          onChange={() => toggleEvent('proposalSigned')}
                          className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors">İmzalandı</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={events.proposalExpired}
                          onChange={() => toggleEvent('proposalExpired')}
                          className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors">Süresi Doldu</span>
                      </label>
                    </div>
                  </div>

                  {/* Deal Events */}
                  <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-[#e2e8f0] dark:border-slate-700 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#e2e8f0] dark:border-slate-700">
                      <span className="material-symbols-outlined text-primary text-[20px]">handshake</span>
                      <h4 className="text-sm font-bold text-[#0f172a] dark:text-white">Anlaşma Olayları</h4>
                    </div>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={events.dealCreated}
                          onChange={() => toggleEvent('dealCreated')}
                          className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors">Oluşturuldu</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={events.dealWon}
                          onChange={() => toggleEvent('dealWon')}
                          className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors">Kazanıldı</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={events.dealLost}
                          onChange={() => toggleEvent('dealLost')}
                          className="rounded border-[#e2e8f0] text-primary focus:ring-primary h-4 w-4"
                        />
                        <span className="text-sm text-[#64748b] group-hover:text-[#0f172a] dark:group-hover:text-white transition-colors">Kaybedildi</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800 border-t border-[#e2e8f0] dark:border-slate-700 flex items-center justify-between">
              <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 border border-[#e2e8f0] dark:border-slate-600 text-[#0f172a] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600 text-sm font-bold rounded-lg transition-all shadow-sm">
                <span className="material-symbols-outlined text-[20px]">send</span>
                Test Gönder
              </button>
              <div className="flex items-center gap-3">
                <button className="px-4 py-2 text-[#64748b] hover:text-[#0f172a] dark:hover:text-white text-sm font-bold transition-colors">
                  İptal
                </button>
                <button className="px-8 py-2 bg-primary hover:bg-blue-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 transition-all">
                  Kaydet
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
