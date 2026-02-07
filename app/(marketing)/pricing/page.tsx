import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'
import { buildPricingProductSchemas } from '@/lib/marketing/structured-data'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/pricing',
    title: {
      tr: 'Fiyatlandırma | AERO CRM',
      en: 'Pricing | AERO CRM',
    },
    description: {
      tr: 'Ekibinize uygun planı seçin ve satış operasyonunu ölçekleyin.',
      en: 'Choose the right plan and scale your sales operations.',
    },
  })
}

export default function PricingPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)
  const isTr = locale === 'tr'
  const productSchemas = buildPricingProductSchemas(locale)

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-14 md:px-6 md:py-16">
      {productSchemas.map((schema, index) => (
        <script
          key={`pricing-schema-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <section className="space-y-4 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aero-blue-600">{copy.pricing.eyebrow}</p>
        <h1 className="text-4xl font-black text-aero-slate-900">{copy.pricing.title}</h1>
        <p className="mx-auto max-w-2xl text-aero-slate-600">{copy.pricing.subtitle}</p>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        {copy.pricing.plans.map((plan) => (
          <article
            key={plan.id}
            className={`rounded-2xl border bg-white p-6 shadow-sm ${
              plan.popular ? 'border-aero-blue-300 shadow-aero-blue-100/50' : 'border-aero-slate-200'
            }`}
          >
            {plan.popular ? (
              <p className="mb-3 inline-flex rounded-full bg-aero-blue-50 px-2.5 py-1 text-xs font-semibold text-aero-blue-700">
                {isTr ? 'Popüler' : 'Popular'}
              </p>
            ) : null}
            <h2 className="text-2xl font-black text-aero-slate-900">{plan.name}</h2>
            <p className="mt-2 text-sm text-aero-slate-600">{plan.description}</p>

            <p className="mt-4 text-3xl font-black text-aero-slate-900">
              {plan.price}
              <span className="ml-1 text-sm font-semibold text-aero-slate-500">{plan.period}</span>
            </p>

            <Link
              href={`/register?plan=${plan.id}`}
              data-funnel-event={`checkout_start_${plan.id}`}
              className={`mt-5 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                plan.popular
                  ? 'bg-aero-blue-500 text-white hover:bg-aero-blue-600'
                  : 'border border-aero-slate-300 text-aero-slate-700 hover:border-aero-slate-400 hover:bg-aero-slate-50'
              }`}
            >
              {plan.cta}
            </Link>

            <ul className="mt-5 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-aero-slate-700">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-aero-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-aero-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-aero-slate-900">{copy.pricing.compareTitle}</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-aero-slate-200 text-aero-slate-500">
                <th className="px-3 py-2 font-semibold">{isTr ? 'Özellik' : 'Feature'}</th>
                <th className="px-3 py-2 font-semibold">Solo</th>
                <th className="px-3 py-2 font-semibold">Pro</th>
              </tr>
            </thead>
            <tbody>
              {copy.pricing.compareRows.map((row) => (
                <tr key={row.label} className="border-b border-aero-slate-100">
                  <td className="px-3 py-2 font-semibold text-aero-slate-700">{row.label}</td>
                  <td className="px-3 py-2 text-aero-slate-600">{row.solo}</td>
                  <td className="px-3 py-2 text-aero-slate-600">{row.pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-aero-slate-200 bg-white p-6">
        <h2 className="text-xl font-black text-aero-slate-900">{copy.pricing.faqTitle}</h2>
        <div className="mt-4 space-y-4">
          {copy.pricing.faqItems.map((item) => (
            <article key={item.question}>
              <h3 className="font-semibold text-aero-slate-900">{item.question}</h3>
              <p className="mt-1 text-sm leading-6 text-aero-slate-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
