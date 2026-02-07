import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'
import { getServerLocale } from '@/lib/i18n/server'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/help',
    title: {
      tr: 'Yardım Merkezi | AERO CRM',
      en: 'Help Center | AERO CRM',
    },
    description: {
      tr: 'Hesap erişimi, güvenlik ayarları ve temel kullanım akışları için yardım merkezi.',
      en: 'Help center for account access, security settings, and core product flows.',
    },
  })
}

export default function HelpPage() {
  const t = getServerT()

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
      <section className="space-y-3">
        <h1 className="text-3xl font-black text-aero-slate-900">{t('helpPage.title')}</h1>
        <p className="text-sm text-aero-slate-600">{t('helpPage.subtitle')}</p>
      </section>

      <section className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link href="/forgot-password" className="rounded-xl border border-aero-slate-200 bg-white p-5 hover:border-aero-blue-300">
          <h2 className="text-base font-bold text-aero-slate-900">{t('helpPage.cards.forgotPassword.title')}</h2>
          <p className="mt-1 text-sm text-aero-slate-600">{t('helpPage.cards.forgotPassword.description')}</p>
        </Link>

        <Link href="/settings/security" className="rounded-xl border border-aero-slate-200 bg-white p-5 hover:border-aero-blue-300">
          <h2 className="text-base font-bold text-aero-slate-900">{t('helpPage.cards.security.title')}</h2>
          <p className="mt-1 text-sm text-aero-slate-600">{t('helpPage.cards.security.description')}</p>
        </Link>

        <Link href="/terms" className="rounded-xl border border-aero-slate-200 bg-white p-5 hover:border-aero-blue-300">
          <h2 className="text-base font-bold text-aero-slate-900">{t('helpPage.cards.terms.title')}</h2>
          <p className="mt-1 text-sm text-aero-slate-600">{t('helpPage.cards.terms.description')}</p>
        </Link>

        <Link href="/privacy" className="rounded-xl border border-aero-slate-200 bg-white p-5 hover:border-aero-blue-300">
          <h2 className="text-base font-bold text-aero-slate-900">{t('helpPage.cards.privacy.title')}</h2>
          <p className="mt-1 text-sm text-aero-slate-600">{t('helpPage.cards.privacy.description')}</p>
        </Link>
      </section>

      <Link href="/login" className="mt-6 inline-flex rounded-lg bg-aero-blue-500 px-4 py-2 text-sm font-semibold text-white">
        {t('helpPage.actions.backLogin')}
      </Link>
    </div>
  )
}
