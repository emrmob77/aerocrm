'use client'

import { useState } from 'react'

type TabType = 'all' | 'connected' | 'recommended'

interface Integration {
  id: string
  name: string
  description: string
  icon: string
  iconColor: string
  iconBg: string
  connected: boolean
  recommended?: boolean
}

// İletişim entegrasyonları
const communicationIntegrations: Integration[] = [
  { id: 'gmail', name: 'Gmail', description: 'E-postalarınızı senkronize edin', icon: 'mail', iconColor: 'text-red-500', iconBg: 'bg-red-50 dark:bg-red-900/20', connected: true },
  { id: 'slack', name: 'Slack', description: 'Bildirimleri kanallara iletin', icon: 'forum', iconColor: 'text-purple-600', iconBg: 'bg-purple-50 dark:bg-purple-900/20', connected: false, recommended: true },
  { id: 'whatsapp', name: 'WhatsApp Business', description: 'Müşterilerle anında yazışın', icon: 'chat', iconColor: 'text-green-600', iconBg: 'bg-green-50 dark:bg-green-900/20', connected: false, recommended: true },
  { id: 'zoom', name: 'Zoom', description: 'Toplantıları CRM\'den planlayın', icon: 'videocam', iconColor: 'text-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-900/20', connected: false },
]

// Ödeme entegrasyonları
const paymentIntegrations: Integration[] = [
  { id: 'stripe', name: 'Stripe', description: 'Ödemelerinizi otomatize edin', icon: 'payments', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50 dark:bg-indigo-900/20', connected: false, recommended: true },
  { id: 'paypal', name: 'PayPal', description: 'Global ödemeler alın', icon: 'account_balance_wallet', iconColor: 'text-sky-700', iconBg: 'bg-sky-50 dark:bg-sky-900/20', connected: false },
  { id: 'iyzico', name: 'iyzico', description: 'Türkiye içi ödeme çözümü', icon: 'credit_card', iconColor: 'text-blue-800', iconBg: 'bg-blue-50 dark:bg-blue-900/20', connected: false },
]

// Depolama entegrasyonları
const storageIntegrations: Integration[] = [
  { id: 'gdrive', name: 'Google Drive', description: 'Dosyaları doğrudan ekleyin', icon: 'cloud', iconColor: 'text-yellow-600', iconBg: 'bg-yellow-50 dark:bg-yellow-900/20', connected: true },
  { id: 'dropbox', name: 'Dropbox', description: 'Bulut depolama entegrasyonu', icon: 'folder_shared', iconColor: 'text-blue-600', iconBg: 'bg-blue-50 dark:bg-blue-900/20', connected: false },
]

// Otomasyon entegrasyonları
const automationIntegrations: Integration[] = [
  { id: 'zapier', name: 'Zapier', description: '5000+ uygulama ile bağlayın', icon: 'bolt', iconColor: 'text-orange-600', iconBg: 'bg-orange-50 dark:bg-orange-900/20', connected: false, recommended: true },
  { id: 'webhook', name: 'Webhook', description: 'Özel API entegrasyonu', icon: 'api', iconColor: 'text-gray-600 dark:text-gray-300', iconBg: 'bg-gray-50 dark:bg-gray-800', connected: false },
]

// Integration Card Component
function IntegrationCard({ integration }: { integration: Integration }) {
  return (
    <div className="integration-card bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group">
      <div className="flex justify-between items-start">
        <div className={`size-10 rounded-lg ${integration.iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${integration.iconColor}`}>{integration.icon}</span>
        </div>
        {integration.connected && (
          <button className="text-[#48679d] hover:text-primary transition-colors">
            <span className="material-symbols-outlined text-xl">settings</span>
          </button>
        )}
      </div>
      <div>
        <h3 className="font-bold text-sm text-[#0d121c] dark:text-white">{integration.name}</h3>
        <p className="text-xs text-[#48679d] dark:text-slate-400 line-clamp-1">{integration.description}</p>
      </div>
      {integration.connected ? (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="size-2 rounded-full bg-green-500"></div>
          <span className="text-[11px] font-bold text-green-600 uppercase tracking-wider">Bağlı</span>
        </div>
      ) : (
        <button className="mt-2 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold py-1.5 rounded-lg">
          Bağlan
        </button>
      )}
    </div>
  )
}

// Section Component
function IntegrationSection({ title, integrations, activeTab }: { title: string; integrations: Integration[]; activeTab: TabType }) {
  // Filter based on active tab
  const filteredIntegrations = integrations.filter(i => {
    if (activeTab === 'all') return true
    if (activeTab === 'connected') return i.connected
    if (activeTab === 'recommended') return i.recommended
    return true
  })

  if (filteredIntegrations.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 px-1 mb-4">
        <h2 className="text-[#0d121c] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">{title}</h2>
        <div className="h-px flex-grow bg-[#e7ebf4] dark:bg-slate-800 ml-4"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredIntegrations.map((integration) => (
          <IntegrationCard key={integration.id} integration={integration} />
        ))}
      </div>
    </section>
  )
}

export default function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: 'Tümü' },
    { id: 'connected', label: 'Bağlı' },
    { id: 'recommended', label: 'Önerilen' },
  ]

  return (
    <div className="-m-8">
      <main className="max-w-[1200px] mx-auto px-10 py-8">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between gap-3 mb-6">
          <div className="flex min-w-72 flex-col gap-1">
            <p className="text-[#0d121c] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">Entegrasyonlar</p>
            <p className="text-[#48679d] dark:text-slate-400 text-base font-normal leading-normal">Favori araçlarınızı AERO&apos;ya bağlayın</p>
          </div>
        </div>

        {/* SearchBar & Tabs */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="w-full max-w-xl">
            <label className="flex flex-col min-w-40 h-12 w-full">
              <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                <div className="text-[#48679d] flex items-center justify-center pl-4">
                  <span className="material-symbols-outlined">search</span>
                </div>
                <input 
                  className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-[#0d121c] dark:text-white placeholder:text-[#48679d] px-4 text-base font-normal" 
                  placeholder="Entegrasyonlarda ara..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </label>
          </div>

          {/* Tabs */}
          <div className="border-b border-[#ced8e9] dark:border-slate-800 flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center border-b-[3px] pb-3 transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-primary text-[#0d121c] dark:text-white'
                    : 'border-b-transparent text-[#48679d] dark:text-slate-400 hover:text-primary'
                }`}
              >
                <p className="text-sm font-bold leading-normal tracking-[0.015em]">{tab.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <IntegrationSection title="İletişim" integrations={communicationIntegrations} activeTab={activeTab} />
        <IntegrationSection title="Ödeme" integrations={paymentIntegrations} activeTab={activeTab} />
        <IntegrationSection title="Depolama" integrations={storageIntegrations} activeTab={activeTab} />
        <IntegrationSection title="Otomasyon" integrations={automationIntegrations} activeTab={activeTab} />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-[#e7ebf4] dark:border-slate-800 py-10">
        <div className="max-w-[1200px] mx-auto px-10 flex justify-between items-center">
          <div className="flex items-center gap-2 opacity-60">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="text-sm font-medium">AERO CRM v2.4</span>
          </div>
          <div className="flex gap-6 text-[#48679d] dark:text-slate-400 text-sm">
            <a className="hover:text-primary" href="#">Destek</a>
            <a className="hover:text-primary" href="#">API Dökümantasyonu</a>
            <a className="hover:text-primary" href="#">Gizlilik Politikası</a>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .integration-card {
          width: 210px;
          height: 140px;
          transition: all 0.2s ease;
        }
        .integration-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        @media (max-width: 640px) {
          .integration-card {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}
