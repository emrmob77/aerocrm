'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'

type FunnelResponse = {
  days: number
  funnel: {
    landingViewCount: number
    pricingViewCount: number
    signupIntentCount: number
    paidCount: number
    canceledCount: number
    retryCount: number
    pendingCount: number
    contactSubmitSuccessCount: number
    rates: {
      pricingFromLanding: number
      signupFromPricing: number
      paidFromSignup: number
      paidFromLanding: number
    }
  }
}

export default function FunnelReportPage() {
  const { locale, formatNumber } = useI18n()
  const [data, setData] = useState<FunnelResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/api/reports/funnel?days=30')
        const payload = (await response.json().catch(() => null)) as FunnelResponse | { error?: string } | null

        if (!response.ok || !payload || !('funnel' in payload)) {
          throw new Error((payload as { error?: string } | null)?.error || 'Failed to load funnel report.')
        }

        setData(payload)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Failed to load funnel report.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const cards = useMemo(() => {
    if (!data) return []
    return [
      {
        label: locale === 'tr' ? 'Landing Görüntüleme' : 'Landing Views',
        value: data.funnel.landingViewCount,
      },
      {
        label: locale === 'tr' ? 'Pricing Görüntüleme' : 'Pricing Views',
        value: data.funnel.pricingViewCount,
      },
      {
        label: locale === 'tr' ? 'Signup Niyeti' : 'Signup Intent',
        value: data.funnel.signupIntentCount,
      },
      {
        label: locale === 'tr' ? 'Paid Dönüşüm' : 'Paid Conversions',
        value: data.funnel.paidCount,
      },
    ]
  }, [data, locale])

  if (loading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0d121c] dark:text-white">Funnel Dashboard</h1>
          <p className="mt-1 text-sm text-[#48679d] dark:text-gray-400">
            {locale === 'tr'
              ? `Landing -> Pricing -> Signup -> Paid dönüşümü (son ${data?.days ?? 30} gün).`
              : `Landing -> Pricing -> Signup -> Paid conversion (last ${data?.days ?? 30} days).`}
          </p>
        </div>
        <Link
          href="/reports"
          className="rounded-lg border border-[#ced8e9] px-4 py-2 text-sm font-semibold text-[#0d121c] hover:border-primary/40 hover:text-primary"
        >
          {locale === 'tr' ? 'Raporlara dön' : 'Back to reports'}
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[#e7ebf4] bg-white p-5 dark:border-gray-800 dark:bg-[#161e2b]">
            <p className="text-sm text-[#48679d] dark:text-gray-400">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#0d121c] dark:text-white">{formatNumber(card.value)}</p>
          </div>
        ))}
      </div>

      {data ? (
        <div className="rounded-xl border border-[#e7ebf4] bg-white p-6 dark:border-gray-800 dark:bg-[#161e2b]">
          <h2 className="text-lg font-bold text-[#0d121c] dark:text-white">
            {locale === 'tr' ? 'Dönüşüm oranları' : 'Conversion rates'}
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <p className="text-sm text-[#48679d] dark:text-gray-400">
              Landing -&gt; Pricing: <strong>{data.funnel.rates.pricingFromLanding}%</strong>
            </p>
            <p className="text-sm text-[#48679d] dark:text-gray-400">
              Pricing -&gt; Signup: <strong>{data.funnel.rates.signupFromPricing}%</strong>
            </p>
            <p className="text-sm text-[#48679d] dark:text-gray-400">
              Signup -&gt; Paid: <strong>{data.funnel.rates.paidFromSignup}%</strong>
            </p>
            <p className="text-sm text-[#48679d] dark:text-gray-400">
              Landing -&gt; Paid: <strong>{data.funnel.rates.paidFromLanding}%</strong>
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-[#e7ebf4] p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-[#48679d] dark:text-gray-400">Cancel</p>
              <p className="mt-1 text-xl font-bold text-[#0d121c] dark:text-white">{formatNumber(data.funnel.canceledCount)}</p>
            </div>
            <div className="rounded-lg border border-[#e7ebf4] p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-[#48679d] dark:text-gray-400">Retry</p>
              <p className="mt-1 text-xl font-bold text-[#0d121c] dark:text-white">{formatNumber(data.funnel.retryCount)}</p>
            </div>
            <div className="rounded-lg border border-[#e7ebf4] p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-[#48679d] dark:text-gray-400">Pending</p>
              <p className="mt-1 text-xl font-bold text-[#0d121c] dark:text-white">{formatNumber(data.funnel.pendingCount)}</p>
            </div>
            <div className="rounded-lg border border-[#e7ebf4] p-4 dark:border-gray-800">
              <p className="text-xs uppercase tracking-wide text-[#48679d] dark:text-gray-400">Contact Success</p>
              <p className="mt-1 text-xl font-bold text-[#0d121c] dark:text-white">{formatNumber(data.funnel.contactSubmitSuccessCount)}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
