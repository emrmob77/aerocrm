import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerLocale } from '@/lib/i18n/server'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildMarketingMetadata } from '@/lib/marketing/seo'
import { buildSoftwareApplicationSchema } from '@/lib/marketing/structured-data'

export function generateMetadata(): Metadata {
  const locale = getServerLocale()
  return buildMarketingMetadata(locale, {
    path: '/',
    title: {
      tr: 'AERO CRM | Satış Operasyonunu Hızlandır',
      en: 'AERO CRM | Accelerate Sales Operations',
    },
    description: {
      tr: 'Teklif, pipeline, ekip ve tahsilat süreçlerini tek panelde yönetin.',
      en: 'Manage proposals, pipeline, team workflows, and billing in one workspace.',
    },
  })
}

export default function MarketingHomePage() {
  const locale = getServerLocale()
  const copy = getMarketingCopy(locale)
  const softwareSchema = buildSoftwareApplicationSchema(locale)

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }} />
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 md:px-6 md:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <p className="inline-flex rounded-full border border-aero-blue-200 bg-aero-blue-50 px-3 py-1 text-xs font-semibold text-aero-blue-700">
              {copy.home.eyebrow}
            </p>
            <h1 className="text-4xl font-black leading-tight text-aero-slate-900 md:text-5xl">
              {copy.home.title}
            </h1>
            <p className="max-w-xl text-base leading-7 text-aero-slate-600 md:text-lg">{copy.home.subtitle}</p>

            <div className="flex flex-wrap gap-3">
              <Link href="/pricing" data-funnel-event="hero_view_pricing" className="inline-flex rounded-lg bg-aero-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-aero-blue-600">
                {copy.home.primaryCta}
              </Link>
              <Link href="/book-demo" data-funnel-event="hero_book_demo" className="inline-flex rounded-lg border border-aero-slate-300 px-5 py-3 text-sm font-semibold text-aero-slate-700 transition hover:border-aero-slate-400 hover:bg-white">
                {copy.home.secondaryCta}
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-aero-slate-200 bg-white p-6 shadow-xl shadow-aero-slate-200/40">
            <p className="mb-4 text-sm font-semibold text-aero-slate-500">{copy.home.socialProof}</p>
            <div className="space-y-3">
              {copy.home.highlights.map((item) => (
                <div key={item.title} className="rounded-xl border border-aero-slate-200 bg-aero-slate-50 p-4">
                  <p className="text-sm font-bold text-aero-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-aero-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-aero-slate-200 bg-white/80">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <div className="mb-8 max-w-2xl space-y-3">
            <h2 className="text-3xl font-black text-aero-slate-900">{copy.home.workflowTitle}</h2>
            <p className="text-aero-slate-600">{copy.home.workflowSubtitle}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {copy.home.workflowSteps.map((step) => (
              <article key={step.title} className="rounded-2xl border border-aero-slate-200 bg-white p-5">
                <h3 className="text-base font-extrabold text-aero-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-aero-slate-600">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
        <div className="rounded-2xl bg-gradient-primary px-6 py-10 text-white md:px-10">
          <h2 className="max-w-3xl text-3xl font-black leading-tight">{copy.home.finalTitle}</h2>
          <p className="mt-3 max-w-3xl text-sm text-aero-blue-100 md:text-base">{copy.home.finalSubtitle}</p>
          <div className="mt-6">
            <Link href="/register" data-funnel-event="home_final_register" className="inline-flex rounded-lg bg-white px-5 py-3 text-sm font-semibold text-aero-blue-700 transition hover:bg-aero-blue-50">
              {copy.home.finalCta}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
