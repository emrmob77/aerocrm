import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/terms',
    title: {
      tr: 'Kullanım Koşulları | AERO CRM',
      en: 'Terms of Use | AERO CRM',
    },
    description: {
      tr: 'AERO CRM hizmetlerinin kullanım koşulları ve sorumluluklarını inceleyin.',
      en: 'Review terms and responsibilities for using AERO CRM services.',
    },
  })
}

export default function TermsPage() {
  const t = getServerT()

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
      <section className="space-y-3">
        <h1 className="text-3xl font-black text-aero-slate-900">{t('termsPage.title')}</h1>
        <p className="text-sm text-aero-slate-600">{t('termsPage.subtitle')}</p>
      </section>

      <section className="mt-7 space-y-4 rounded-xl border border-aero-slate-200 bg-white p-6 text-sm text-aero-slate-700">
        <p>{t('termsPage.items.first')}</p>
        <p>{t('termsPage.items.second')}</p>
        <p>{t('termsPage.items.third')}</p>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/register" className="rounded-lg bg-aero-blue-500 px-4 py-2 text-sm font-semibold text-white">
          {t('termsPage.actions.backRegister')}
        </Link>
        <Link href="/privacy" className="rounded-lg border border-aero-slate-300 px-4 py-2 text-sm font-semibold text-aero-slate-700">
          {t('termsPage.actions.privacy')}
        </Link>
      </div>
    </div>
  )
}
