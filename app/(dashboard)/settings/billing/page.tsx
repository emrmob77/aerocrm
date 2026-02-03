'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'

type BillingOverview = {
  status: string
  plan: string
  usage: Array<{ label: string; value: string; hint: string }>
  invoices: Array<{ id: string; date: string; amount: string; status: string; pdf?: string | null }>
  subscription: any
  customer: { id: string; email: string | null; name: string | null } | null
  plans: Array<{ id: string; name: string; priceId: string }>
}

export default function BillingSettingsPage() {
  const { t } = useI18n()
  const [overview, setOverview] = useState<BillingOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyPlan, setBusyPlan] = useState<string | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadOverview = async () => {
      try {
        const response = await fetch('/api/billing/overview')
        const data = await response.json()
        if (!response.ok) {
          throw new Error(data.error || 'Faturalama verileri yuklenemedi.')
        }
        setOverview(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Faturalama verileri yuklenemedi.')
      } finally {
        setLoading(false)
      }
    }

    loadOverview()
  }, [])

  const startCheckout = async (plan: { id: string; name: string; priceId: string }) => {
    setBusyPlan(plan.id)
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: plan.priceId, plan_name: plan.name }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Checkout basarisiz oldu.')
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout basarisiz oldu.')
    } finally {
      setBusyPlan(null)
    }
  }

  const openPortal = async () => {
    setPortalLoading(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Portal acilamadi.')
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Portal acilamadi.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[360px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-[#0d121c] dark:text-white tracking-tight">{t('billing.title')}</h1>
        <p className="text-[#48679d] dark:text-gray-400">{t('billing.subtitle')}</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {(overview?.usage || []).map((stat) => (
          <div
            key={stat.label}
            className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-5"
          >
            <p className="text-sm text-[#48679d] dark:text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-[#0d121c] dark:text-white mt-2">{stat.value}</p>
            <p className="text-xs text-[#93a1b8] mt-2">{stat.hint}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0d121c] dark:text-white">
              {t('billing.currentPlan')}: {overview?.plan ? overview.plan.toUpperCase() : t('billing.unknown')}
            </h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">
              {t('billing.subscriptionStatus')}: {overview?.subscription?.status || t('billing.unknown')}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {(overview?.plans || []).map((plan) => (
              <button
                key={plan.id}
                className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-all disabled:opacity-60"
                disabled={busyPlan === plan.id || overview?.status !== 'connected'}
                onClick={() => startCheckout(plan)}
              >
                {busyPlan === plan.id ? t('billing.redirecting') : `${plan.name} ${t('billing.planSelect')}`}
              </button>
            ))}
            {overview?.plans?.length === 0 && (
              <span className="text-sm text-[#48679d]">Stripe planlari tanimli degil.</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#0d121c] dark:text-white">{t('billing.paymentMethod')}</h2>
            <p className="text-sm text-[#48679d] dark:text-gray-400 mt-1">
              Kart bilgilerinizi Stripe uzerinden guvenli sekilde yonetin.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/integrations/stripe"
              className="bg-white border border-[#ced8e9] dark:border-gray-700 text-[#0d121c] dark:text-white font-semibold px-4 py-2 rounded-lg hover:border-primary/40 transition-all"
            >
              {t('billing.stripeSettings')}
            </Link>
            <button
              onClick={openPortal}
              disabled={portalLoading || overview?.status !== 'connected'}
              className="bg-[#0d121c] dark:bg-white text-white dark:text-[#0d121c] font-semibold px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {portalLoading ? t('billing.redirecting') : t('billing.stripePortal')}
            </button>
          </div>
        </div>
        <div className="mt-4 border border-dashed border-[#ced8e9] dark:border-gray-700 rounded-lg p-4 text-sm text-[#48679d] dark:text-gray-400">
          {overview?.status === 'connected'
            ? 'Kart ve fatura detaylarini Stripe Portal uzerinden yonetin.'
            : 'Stripe baglantisi olmadan odeme bilgileri yonetilemez.'}
        </div>
      </div>

      <div className="bg-white dark:bg-[#161e2b] rounded-xl border border-[#e7ebf4] dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#0d121c] dark:text-white">{t('billing.invoices')}</h2>
          <span className="text-xs text-[#48679d]">
            {overview?.invoices?.length ? `${overview.invoices.length} ${t('billing.records')}` : t('billing.noRecords')}
          </span>
        </div>
        <div className="space-y-3">
          {overview?.invoices?.length ? (
            overview.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-[#e7ebf4] dark:border-gray-800 rounded-lg p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[#0d121c] dark:text-white">{invoice.id}</p>
                  <p className="text-xs text-[#48679d] dark:text-gray-400">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-[#0d121c] dark:text-white">{invoice.amount}</span>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300">
                    {invoice.status}
                  </span>
                  {invoice.pdf ? (
                    <a
                      href={invoice.pdf}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      {t('billing.pdf')}
                    </a>
                  ) : (
                    <span className="text-xs text-[#93a1b8]">{t('billing.noPdf')}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-[#48679d]">{t('billing.invoicesEmpty')}</div>
          )}
        </div>
      </div>
    </div>
  )
}
