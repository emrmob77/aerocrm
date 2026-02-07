import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/checkout/pending',
    title: {
      tr: 'Ödeme Beklemede | AERO CRM',
      en: 'Payment Pending | AERO CRM',
    },
    description: {
      tr: 'Banka doğrulaması veya onay bekleyen ödeme akışını buradan takip edin.',
      en: 'Track payment flows awaiting bank verification or confirmation.',
    },
    noIndex: true,
  })
}

export default function CheckoutPendingPage() {
  const locale = getServerLocale()
  const isTr = locale === 'tr'

  return (
    <div className="mx-auto flex max-w-3xl px-4 py-16 md:px-6">
      <section className="w-full rounded-2xl border border-orange-200 bg-white p-7 md:p-10">
        <h1 className="text-3xl font-black text-aero-slate-900">
          {isTr ? 'Ödeme doğrulaması bekleniyor' : 'Payment verification is pending'}
        </h1>
        <p className="mt-3 text-sm text-aero-slate-600">
          {isTr
            ? 'Bazı ödemeler banka tarafında birkaç dakika sürebilir. Durum güncellenene kadar faturalama ekranından takip edebilirsiniz.'
            : 'Some payments can take a few minutes on the bank side. You can track updates from billing in the meantime.'}
        </p>

        <ul className="mt-6 list-disc space-y-2 pl-5 text-sm text-aero-slate-700">
          <li>{isTr ? '3D Secure veya banka onay ekranınızı tamamlayın.' : 'Complete your 3D Secure or bank confirmation step.'}</li>
          <li>{isTr ? 'Birkaç dakika sonra faturalama sayfasını yenileyin.' : 'Refresh billing after a few minutes.'}</li>
          <li>{isTr ? 'Sorun sürerse satış ekibimizle iletişime geçin.' : 'If the issue persists, contact our sales team.'}</li>
        </ul>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/settings/billing" data-funnel-event="pending_open_billing" className="inline-flex rounded-lg bg-aero-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-aero-blue-600">
            {isTr ? 'Faturalamaya dön' : 'Back to billing'}
          </Link>
          <Link href="/contact" data-funnel-event="pending_contact_support" className="inline-flex rounded-lg border border-aero-slate-300 px-4 py-2.5 text-sm font-semibold text-aero-slate-700 transition hover:border-aero-slate-400 hover:bg-aero-slate-50">
            {isTr ? 'Destek ile iletişime geç' : 'Contact support'}
          </Link>
        </div>
      </section>
    </div>
  )
}
