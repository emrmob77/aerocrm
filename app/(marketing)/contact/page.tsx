import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'
import { ContactLeadForm } from '@/components/marketing/ContactLeadForm'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/contact',
    title: {
      tr: 'İletişim | AERO CRM',
      en: 'Contact | AERO CRM',
    },
    description: {
      tr: 'Satış ve ürün ekibimizle iletişime geçerek geçiş planınızı birlikte netleştirin.',
      en: 'Connect with our sales and product team to plan your rollout.',
    },
  })
}

export default function ContactPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-16">
      <section className="mb-10 max-w-3xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aero-blue-600">{copy.contact.eyebrow}</p>
        <h1 className="text-4xl font-black text-aero-slate-900">{copy.contact.title}</h1>
        <p className="text-aero-slate-600">{copy.contact.subtitle}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {copy.contact.channels.map((channel, index) => (
          <article key={channel.title} className="rounded-2xl border border-aero-slate-200 bg-white p-5">
            <h2 className="text-lg font-black text-aero-slate-900">{channel.title}</h2>
            <p className="mt-2 text-sm leading-6 text-aero-slate-600">{channel.description}</p>
            <Link
              href={channel.href}
              data-funnel-event={`contact_channel_${index + 1}`}
              className="mt-4 inline-flex rounded-lg border border-aero-slate-300 px-3.5 py-2 text-sm font-semibold text-aero-slate-700 transition hover:border-aero-slate-400 hover:bg-aero-slate-50"
            >
              {channel.cta}
            </Link>
          </article>
        ))}
      </section>

      <ContactLeadForm locale={locale} />
    </div>
  )
}
