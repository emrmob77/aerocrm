import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/checkout/retry',
    title: {
      tr: 'Ödeme Yeniden Deneme | AERO CRM',
      en: 'Payment Retry | AERO CRM',
    },
    description: {
      tr: 'Başarısız veya geciken ödeme için yeniden deneme adımlarını izleyin.',
      en: 'Follow the retry flow for failed or delayed payments.',
    },
    noIndex: true,
  })
}

export default function CheckoutRetryPage() {
  const locale = getServerLocale()
  const isTr = locale === 'tr'

  return (
    <div className="mx-auto flex max-w-3xl px-4 py-16 md:px-6">
      <section className="w-full rounded-2xl border border-amber-200 bg-white p-7 md:p-10">
        <h1 className="text-3xl font-black text-aero-slate-900">
          {isTr ? 'Ödeme yeniden deneme adımları' : 'Payment retry steps'}
        </h1>
        <p className="mt-3 text-sm text-aero-slate-600">
          {isTr
            ? 'Kart limiti, doğrulama veya banka hatası kaynaklı başarısız işlemlerde aşağıdaki akışı izleyin.'
            : 'Follow the flow below for failed transactions caused by card limits, verification, or bank errors.'}
        </p>

        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-aero-slate-700">
          <li>{isTr ? 'Stripe Portal üzerinden kart bilgilerinizi kontrol edin.' : 'Verify your card details in Stripe Portal.'}</li>
          <li>{isTr ? 'Gerekirse farklı bir kart tanımlayın.' : 'Add a different card if needed.'}</li>
          <li>{isTr ? 'Faturalama sayfasına dönüp plan seçimini tekrar başlatın.' : 'Return to billing and restart plan checkout.'}</li>
        </ol>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/settings/billing" data-funnel-event="retry_open_billing" className="inline-flex rounded-lg bg-aero-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-aero-blue-600">
            {isTr ? 'Faturalamaya dön' : 'Back to billing'}
          </Link>
          <Link href="/contact" data-funnel-event="retry_contact_support" className="inline-flex rounded-lg border border-aero-slate-300 px-4 py-2.5 text-sm font-semibold text-aero-slate-700 transition hover:border-aero-slate-400 hover:bg-aero-slate-50">
            {isTr ? 'Satış ekibiyle görüş' : 'Talk to sales'}
          </Link>
        </div>
      </section>
    </div>
  )
}
