import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/checkout/success',
    title: {
      tr: 'Ödeme Başarılı | AERO CRM',
      en: 'Checkout Success | AERO CRM',
    },
    description: {
      tr: 'Ödemeniz başarıyla tamamlandı, abonelik akışınız aktif edildi.',
      en: 'Your payment was successful and your subscription flow is active.',
    },
    noIndex: true,
  })
}

export default function CheckoutSuccessPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)

  return (
    <div className="mx-auto flex max-w-3xl px-4 py-16 md:px-6">
      <section className="w-full rounded-2xl border border-aero-green-200 bg-white p-7 text-center md:p-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-aero-green-100 text-aero-green-700">
          ✓
        </div>
        <h1 className="text-3xl font-black text-aero-slate-900">{copy.checkout.success.title}</h1>
        <p className="mt-3 text-aero-slate-600">{copy.checkout.success.subtitle}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/dashboard" data-funnel-event="checkout_success_go_dashboard" className="inline-flex rounded-lg bg-aero-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-aero-blue-600">
            {copy.checkout.success.primaryCta}
          </Link>
          <Link href="/settings/billing" data-funnel-event="checkout_success_open_billing" className="inline-flex rounded-lg border border-aero-slate-300 px-4 py-2.5 text-sm font-semibold text-aero-slate-700 transition hover:border-aero-slate-400 hover:bg-aero-slate-50">
            {copy.checkout.success.secondaryCta}
          </Link>
        </div>
      </section>
    </div>
  )
}
