import type { Metadata } from 'next'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/security',
    title: {
      tr: 'Güvenlik | AERO CRM',
      en: 'Security | AERO CRM',
    },
    description: {
      tr: 'Rol bazlı erişim, loglama ve güvenli entegrasyon kontrolleriyle verilerinizi koruyun.',
      en: 'Protect your data with role-based access, audit logs, and secure integration controls.',
    },
  })
}

export default function SecurityPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
      <section className="mb-10 max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aero-blue-600">{copy.security.eyebrow}</p>
        <h1 className="text-4xl font-black text-aero-slate-900">{copy.security.title}</h1>
        <p className="text-aero-slate-600">{copy.security.subtitle}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {copy.security.cards.map((card) => (
          <article key={card.title} className="rounded-2xl border border-aero-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-aero-slate-900">{card.title}</h2>
            <p className="mt-2 text-sm leading-6 text-aero-slate-600">{card.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
