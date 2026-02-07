import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/book-demo',
    title: {
      tr: 'Demo Planla | AERO CRM',
      en: 'Book a Demo | AERO CRM',
    },
    description: {
      tr: '30 dakikalık canlı demo ile ekibinize uygun satış akışını birlikte tasarlayın.',
      en: 'Design the right workflow for your team in a 30-minute live demo.',
    },
  })
}

export default function BookDemoPage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 md:px-6 md:py-16">
      <section className="rounded-2xl border border-aero-slate-200 bg-white p-7 md:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-aero-blue-600">{copy.bookDemo.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-black text-aero-slate-900">{copy.bookDemo.title}</h1>
        <p className="mt-3 text-aero-slate-600">{copy.bookDemo.subtitle}</p>

        <ul className="mt-6 space-y-2">
          {copy.bookDemo.bullets.map((bullet) => (
            <li key={bullet} className="flex items-start gap-2 text-sm text-aero-slate-700">
              <span className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-aero-blue-500" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link href="/contact" data-funnel-event="book_demo_contact_sales" className="inline-flex rounded-lg bg-aero-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-aero-blue-600">
            {copy.bookDemo.primaryCta}
          </Link>
          <Link href="/pricing" data-funnel-event="book_demo_view_pricing" className="inline-flex rounded-lg border border-aero-slate-300 px-4 py-2.5 text-sm font-semibold text-aero-slate-700 transition hover:border-aero-slate-400 hover:bg-aero-slate-50">
            {copy.bookDemo.secondaryCta}
          </Link>
        </div>
      </section>
    </div>
  )
}
