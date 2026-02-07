import type { Metadata } from 'next'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'
import { buildFaqSchema } from '@/lib/marketing/structured-data'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/faq',
    title: {
      tr: 'SSS | AERO CRM',
      en: 'FAQ | AERO CRM',
    },
    description: {
      tr: 'Kurulum, fiyatlandırma ve ekip kullanımı hakkında sık sorulan sorular.',
      en: 'Frequently asked questions about setup, pricing, and team usage.',
    },
  })
}

export default function FaqPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)
  const faqSchema = buildFaqSchema(locale)

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="mb-10 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aero-blue-600">{copy.faq.eyebrow}</p>
        <h1 className="text-4xl font-black text-aero-slate-900">{copy.faq.title}</h1>
        <p className="text-aero-slate-600">{copy.faq.subtitle}</p>
      </section>

      <section className="space-y-4">
        {copy.faq.items.map((item) => (
          <article key={item.question} className="rounded-2xl border border-aero-slate-200 bg-white p-5">
            <h2 className="text-base font-extrabold text-aero-slate-900">{item.question}</h2>
            <p className="mt-2 text-sm leading-6 text-aero-slate-600">{item.answer}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
