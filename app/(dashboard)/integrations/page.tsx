import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Integration } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'

type TabType = 'all' | 'connected' | 'recommended'

type IntegrationConfig = {
  id: string
  provider: string
  name: string
  description: string
  icon: string
  iconColor: string
  iconBg: string
  recommended?: boolean
  comingSoon?: boolean
  href?: string
  category: 'communication' | 'payment' | 'storage' | 'automation'
}

// Static integration configurations
const integrationConfigs = (t: (key: string) => string): IntegrationConfig[] => [
  // Communication
  {
    id: 'twilio',
    provider: 'twilio',
    name: 'Twilio',
    description: t('integrations.twilioDescription'),
    icon: 'sms',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    recommended: true,
    href: '/integrations/twilio',
    category: 'communication',
  },
  {
    id: 'gmail',
    provider: 'gmail',
    name: 'Gmail',
    description: t('integrations.gmailDescription'),
    icon: 'mail',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50 dark:bg-red-900/20',
    href: '/integrations/gmail',
    category: 'communication',
  },
  {
    id: 'slack',
    provider: 'slack',
    name: 'Slack',
    description: t('integrations.slackDescription'),
    icon: 'forum',
    iconColor: 'text-purple-600',
    iconBg: 'bg-purple-50 dark:bg-purple-900/20',
    recommended: true,
    href: '/integrations/slack',
    category: 'communication',
  },
  {
    id: 'zoom',
    provider: 'zoom',
    name: 'Zoom',
    description: t('integrations.zoomDescription'),
    icon: 'videocam',
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    href: '/integrations/zoom',
    category: 'communication',
  },
  // Payment
  {
    id: 'stripe',
    provider: 'stripe',
    name: 'Stripe',
    description: t('integrations.stripeDescription'),
    icon: 'payments',
    iconColor: 'text-indigo-600',
    iconBg: 'bg-indigo-50 dark:bg-indigo-900/20',
    recommended: true,
    href: '/integrations/stripe',
    category: 'payment',
  },
  {
    id: 'paypal',
    provider: 'paypal',
    name: 'PayPal',
    description: t('integrations.paypalDescription'),
    icon: 'account_balance_wallet',
    iconColor: 'text-sky-700',
    iconBg: 'bg-sky-50 dark:bg-sky-900/20',
    href: '/integrations/paypal',
    category: 'payment',
  },
  {
    id: 'iyzico',
    provider: 'iyzico',
    name: 'iyzico',
    description: t('integrations.iyzicoDescription'),
    icon: 'credit_card',
    iconColor: 'text-blue-800',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    href: '/integrations/iyzico',
    category: 'payment',
  },
  // Storage
  {
    id: 'gdrive',
    provider: 'gdrive',
    name: 'Google Drive',
    description: t('integrations.gdriveDescription'),
    icon: 'cloud',
    iconColor: 'text-yellow-600',
    iconBg: 'bg-yellow-50 dark:bg-yellow-900/20',
    href: '/integrations/gdrive',
    category: 'storage',
  },
  {
    id: 'dropbox',
    provider: 'dropbox',
    name: 'Dropbox',
    description: t('integrations.dropboxDescription'),
    icon: 'folder_shared',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50 dark:bg-blue-900/20',
    href: '/integrations/dropbox',
    category: 'storage',
  },
  // Automation
  {
    id: 'zapier',
    provider: 'zapier',
    name: 'Zapier',
    description: t('integrations.zapierDescription'),
    icon: 'bolt',
    iconColor: 'text-orange-600',
    iconBg: 'bg-orange-50 dark:bg-orange-900/20',
    recommended: true,
    href: '/integrations/zapier',
    category: 'automation',
  },
  {
    id: 'webhook',
    provider: 'webhook',
    name: 'Webhook',
    description: t('integrations.webhookDescription'),
    icon: 'api',
    iconColor: 'text-gray-600 dark:text-gray-300',
    iconBg: 'bg-gray-50 dark:bg-gray-800',
    href: '/webhooks',
    category: 'automation',
  },
]

// Integration Card Component (Server Component)
function IntegrationCard({
  config,
  dbIntegration,
  t,
}: {
  config: IntegrationConfig
  dbIntegration?: Integration
  t: (key: string) => string
}) {
  const isConnected = dbIntegration?.status === 'connected'
  const hasError = dbIntegration?.status === 'error'

  const cardContent = (
    <>
      <div className="flex justify-between items-start">
        <div className={`size-10 rounded-lg ${config.iconBg} flex items-center justify-center`}>
          <span className={`material-symbols-outlined ${config.iconColor}`}>{config.icon}</span>
        </div>
        {isConnected && !config.comingSoon && (
          <span className="material-symbols-outlined text-[#48679d] text-xl">settings</span>
        )}
        {config.comingSoon && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full">
            {t('integrations.status.comingSoon')}
          </span>
        )}
      </div>
      <div>
        <h3 className="font-bold text-sm text-[#0d121c] dark:text-white">{config.name}</h3>
        <p className="text-xs text-[#48679d] dark:text-slate-400 line-clamp-1">{config.description}</p>
      </div>
      {config.comingSoon ? (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="size-2 rounded-full bg-gray-400"></div>
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            {t('integrations.status.verySoon')}
          </span>
        </div>
      ) : isConnected ? (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="size-2 rounded-full bg-green-500"></div>
          <span className="text-[11px] font-bold text-green-600 uppercase tracking-wider">{t('integrations.status.connected')}</span>
        </div>
      ) : hasError ? (
        <div className="flex items-center gap-1.5 mt-2">
          <div className="size-2 rounded-full bg-red-500"></div>
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">{t('integrations.status.error')}</span>
        </div>
      ) : (
        <button className="mt-2 w-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-xs font-bold py-1.5 rounded-lg">
          {t('integrations.status.configure')}
        </button>
      )}
    </>
  )

  if (config.href && !config.comingSoon) {
    return (
      <Link
        href={config.href}
        className="integration-card bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group hover:border-primary/50 transition-colors"
      >
        {cardContent}
      </Link>
    )
  }

  return (
    <div className={`integration-card bg-white dark:bg-slate-900 border border-[#e7ebf4] dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between relative group ${config.comingSoon ? 'opacity-60' : ''}`}>
      {cardContent}
    </div>
  )
}

// Section Component
function IntegrationSection({
  title,
  configs,
  integrations,
  activeTab,
  t,
}: {
  title: string
  configs: IntegrationConfig[]
  integrations: Map<string, Integration>
  activeTab: TabType
  t: (key: string) => string
}) {
  // Filter based on active tab
  const filteredConfigs = configs.filter((config) => {
    const dbIntegration = integrations.get(config.provider)
    const isConnected = dbIntegration?.status === 'connected'

    if (activeTab === 'all') return true
    if (activeTab === 'connected') return isConnected
    if (activeTab === 'recommended') return config.recommended
    return true
  })

  if (filteredConfigs.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 px-1 mb-4">
        <h2 className="text-[#0d121c] dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
          {title}
        </h2>
        <div className="h-px flex-grow bg-[#e7ebf4] dark:bg-slate-800 ml-4"></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredConfigs.map((config) => (
          <IntegrationCard
            key={config.id}
            config={config}
            dbIntegration={integrations.get(config.provider)}
            t={t}
          />
        ))}
      </div>
    </section>
  )
}

// Client Component for Tabs and Search
import IntegrationsClient from './IntegrationsClient'

export default async function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; q?: string }>
}) {
  const t = getServerT()
  const params = await searchParams
  const activeTab = (params.tab as TabType) || 'all'

  // Fetch integrations from DB
  const supabase = await createServerSupabaseClient()
  const integrations = new Map<string, Integration>()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('team_id')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.team_id) {
      const { data: dbIntegrations } = await supabase
        .from('integrations')
        .select('*')
        .eq('team_id', profile.team_id)

      if (dbIntegrations) {
        for (const integration of dbIntegrations) {
          integrations.set(integration.provider, integration as Integration)
        }
      }
    }
  }

  // Group configs by category
  const configs = integrationConfigs(t)
  const communicationConfigs = configs.filter((c) => c.category === 'communication')
  const paymentConfigs = configs.filter((c) => c.category === 'payment')
  const storageConfigs = configs.filter((c) => c.category === 'storage')
  const automationConfigs = configs.filter((c) => c.category === 'automation')

  return (
    <div className="-m-8">
      <main className="max-w-[1200px] mx-auto px-10 py-8">
        {/* Page Heading */}
        <div className="flex flex-wrap justify-between gap-3 mb-6">
          <div className="flex min-w-72 flex-col gap-1">
            <p className="text-[#0d121c] dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
              {t('integrations.title')}
            </p>
            <p className="text-[#48679d] dark:text-slate-400 text-base font-normal leading-normal">
              {t('integrations.subtitle')}
            </p>
          </div>
        </div>

        {/* SearchBar & Tabs (Client Component) */}
        <IntegrationsClient activeTab={activeTab} />

        {/* Sections */}
        <IntegrationSection
          title={t('integrations.categories.communication')}
          configs={communicationConfigs}
          integrations={integrations}
          activeTab={activeTab}
          t={t}
        />
        <IntegrationSection
          title={t('integrations.categories.payment')}
          configs={paymentConfigs}
          integrations={integrations}
          activeTab={activeTab}
          t={t}
        />
        <IntegrationSection
          title={t('integrations.categories.storage')}
          configs={storageConfigs}
          integrations={integrations}
          activeTab={activeTab}
          t={t}
        />
        <IntegrationSection
          title={t('integrations.categories.automation')}
          configs={automationConfigs}
          integrations={integrations}
          activeTab={activeTab}
          t={t}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-[#e7ebf4] dark:border-slate-800 py-10">
        <div className="max-w-[1200px] mx-auto px-10 flex justify-between items-center">
          <div className="flex items-center gap-2 opacity-60">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="text-sm font-medium">AERO CRM v2.4</span>
          </div>
          <div className="flex gap-6 text-[#48679d] dark:text-slate-400 text-sm">
            <a className="hover:text-primary" href="#">
              {t('integrations.footerSupport')}
            </a>
            <a className="hover:text-primary" href="#">
              {t('integrations.footerApi')}
            </a>
            <a className="hover:text-primary" href="#">
              {t('integrations.footerPrivacy')}
            </a>
          </div>
        </div>
      </footer>

      <style>{`
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
