'use client'

import { useI18n } from '@/lib/i18n'

export function MarketingLocaleSwitch() {
  const { locale, setLocale } = useI18n()

  return (
    <div className="inline-flex items-center rounded-full border border-aero-slate-300 bg-white p-1 text-xs font-semibold text-aero-slate-700">
      <button
        type="button"
        onClick={() => setLocale('tr')}
        className={`rounded-full px-2.5 py-1 transition ${
          locale === 'tr' ? 'bg-aero-blue-500 text-white shadow-sm' : 'text-aero-slate-500 hover:text-aero-slate-800'
        }`}
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-full px-2.5 py-1 transition ${
          locale === 'en' ? 'bg-aero-blue-500 text-white shadow-sm' : 'text-aero-slate-500 hover:text-aero-slate-800'
        }`}
      >
        EN
      </button>
    </div>
  )
}
