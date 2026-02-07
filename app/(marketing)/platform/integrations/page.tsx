import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/platform/integrations',
    title: {
      tr: 'Entegrasyonlar | AERO CRM',
      en: 'Integrations | AERO CRM',
    },
    description: {
      tr: 'Stripe, Twilio ve webhook entegrasyonlarıyla satış süreçlerini otomatikleştirin.',
      en: 'Automate sales workflows with Stripe, Twilio, and webhook integrations.',
    },
  })
}

export default function IntegrationsPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
      <section className="mb-10 max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aero-blue-600">{copy.integrations.eyebrow}</p>
        <h1 className="text-4xl font-black text-aero-slate-900">{copy.integrations.title}</h1>
        <p className="text-aero-slate-600">{copy.integrations.subtitle}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {copy.integrations.cards.map((card) => (
          <article key={card.name} className="rounded-2xl border border-aero-slate-200 bg-white p-5">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-black text-aero-slate-900">{card.name}</h2>
              <span className="rounded-full bg-aero-green-100 px-2 py-0.5 text-xs font-semibold text-aero-green-700">
                {card.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-aero-slate-600">{card.description}</p>
          </article>
        ))}
      </section>

      <div className="mt-8">
        <Link href="/register" data-funnel-event="integrations_register" className="inline-flex rounded-lg bg-aero-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-aero-blue-600">
          {copy.integrations.cta}
        </Link>
      </div>
    </div>
  )
}
