import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/privacy',
    title: {
      tr: 'Gizlilik Politikası | AERO CRM',
      en: 'Privacy Policy | AERO CRM',
    },
    description: {
      tr: 'AERO CRM içinde hesap ve kullanım verilerinin nasıl işlendiğini öğrenin.',
      en: 'Understand how account and usage data are handled in AERO CRM.',
    },
  })
}

export default function PrivacyPage() {
  const t = getServerT()

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
      <section className="space-y-3">
        <h1 className="text-3xl font-black text-aero-slate-900">{t('privacyPage.title')}</h1>
        <p className="text-sm text-aero-slate-600">{t('privacyPage.subtitle')}</p>
      </section>

      <section className="mt-7 space-y-4 rounded-xl border border-aero-slate-200 bg-white p-6 text-sm text-aero-slate-700">
        <p>{t('privacyPage.items.first')}</p>
        <p>{t('privacyPage.items.second')}</p>
        <p>{t('privacyPage.items.third')}</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/register" className="rounded-lg bg-aero-blue-500 px-4 py-2 text-sm font-semibold text-white">
          {t('privacyPage.actions.backRegister')}
        </Link>
        <Link href="/terms" className="rounded-lg border border-aero-slate-300 px-4 py-2 text-sm font-semibold text-aero-slate-700">
          {t('privacyPage.actions.terms')}
        </Link>
      </div>
    </div>
  )
}
