'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useI18n } from '@/lib/i18n'

type TabType = 'all' | 'connected' | 'recommended'

export default function IntegrationsClient({ activeTab }: { activeTab: TabType }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const { t } = useI18n()

  const tabs: { id: TabType; label: string }[] = [
    { id: 'all', label: t('integrations.tabs.all') },
    { id: 'connected', label: t('integrations.tabs.connected') },
    { id: 'recommended', label: t('integrations.tabs.recommended') },
  ]

  const handleTabChange = (tabId: TabType) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`/integrations?${params.toString()}`)
  }

  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="w-full max-w-xl">
        <label className="flex flex-col min-w-40 h-12 w-full">
          <div className="flex w-full flex-1 items-stretch rounded-lg h-full border border-[#ced8e9] dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-primary/50 transition-all">
            <div className="text-[#48679d] flex items-center justify-center pl-4">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="form-input flex w-full min-w-0 flex-1 border-none bg-transparent focus:ring-0 text-[#0d121c] dark:text-white placeholder:text-[#48679d] px-4 text-base font-normal"
              placeholder={t('integrations.searchPlaceholder')}
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
            onClick={() => handleTabChange(tab.id)}
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
  )
}
