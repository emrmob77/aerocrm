import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/checkout/cancel',
    title: {
      tr: 'Ödeme İptal | AERO CRM',
      en: 'Checkout Canceled | AERO CRM',
    },
    description: {
      tr: 'Ödeme tamamlanmadı. Dilerseniz tekrar deneyebilir veya satış ekibiyle görüşebilirsiniz.',
      en: 'Payment was not completed. Retry checkout or contact sales for assistance.',
    },
    noIndex: true,
  })
}

export default function CheckoutCancelPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)

  return (
    <div className="mx-auto flex max-w-3xl px-4 py-16 md:px-6">
      <section className="w-full rounded-2xl border border-aero-amber-200 bg-white p-7 text-center md:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aero-amber-100 text-aero-amber-700">
          !
        </div>
        <h1 className="text-3xl font-black text-aero-slate-900">{copy.checkout.cancel.title}</h1>
        <p className="mt-3 text-aero-slate-600">{copy.checkout.cancel.subtitle}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/pricing" data-funnel-event="checkout_cancel_retry_pricing" className="inline-flex rounded-lg bg-aero-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-aero-blue-600">
            {copy.checkout.cancel.primaryCta}
          </Link>
          <Link href="/contact" data-funnel-event="checkout_cancel_contact_sales" className="inline-flex rounded-lg border border-aero-slate-300 px-4 py-2.5 text-sm font-semibold text-aero-slate-700 transition hover:border-aero-slate-400 hover:bg-aero-slate-50">
            {copy.checkout.cancel.secondaryCta}
          </Link>
        </div>
      </section>
    </div>
  )
}
