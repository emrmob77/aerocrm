import type { Metadata } from 'next'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/features',
    title: {
      tr: 'Özellikler | AERO CRM',
      en: 'Features | AERO CRM',
    },
    description: {
      tr: 'Teklif yönetimi, pipeline takibi ve ekip iş birliği modüllerini keşfedin.',
      en: 'Explore proposal workflows, pipeline visibility, and team collaboration modules.',
    },
  })
}

export default function FeaturesPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
      <section className="mb-10 max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aero-blue-600">{copy.features.eyebrow}</p>
        <h1 className="text-4xl font-black text-aero-slate-900">{copy.features.title}</h1>
        <p className="text-aero-slate-600">{copy.features.subtitle}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {copy.features.cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-aero-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-aero-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-aero-slate-600">{card.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
