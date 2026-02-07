import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import type { Database } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'

const dayMs = 24 * 60 * 60 * 1000

const toPercent = (part: number, total: number) => {
  if (total <= 0) return 0
  return Math.min(100, Math.round((part / total) * 100))
}

export const GET = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const url = new URL(request.url)
  const daysParam = Number(url.searchParams.get('days') || 30)
  const days = Number.isFinite(daysParam) ? Math.min(90, Math.max(1, Math.round(daysParam))) : 30

  const supabase = (await createServerSupabaseClient()) as SupabaseClient<Database>
  const client = (() => {
    try {
      return createSupabaseAdminClient() as SupabaseClient<Database>
    } catch {
      return supabase
    }
  })()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const since = new Date(Date.now() - days * dayMs).toISOString()

  const { data: logs, error } = await client
    .from('api_usage_logs')
    .select('path')
    .ilike('path', '/funnel/%')
    .gte('created_at', since)
    .limit(50000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const paths = (logs ?? []).map((item) => item.path || '')

  const landingViewCount = paths.filter((path) => path === '/funnel/view/landing_view').length
  const pricingViewCount = paths.filter((path) => path === '/funnel/view/pricing_view').length
  const signupIntentCount = paths.filter((path) => path.startsWith('/funnel/flow/checkout_start_')).length
  const paidCount = paths.filter((path) => path === '/funnel/view/checkout_success_view').length
  const canceledCount = paths.filter((path) => path === '/funnel/view/checkout_cancel_view').length
  const retryCount = paths.filter((path) => path === '/funnel/view/checkout_retry_view').length
  const pendingCount = paths.filter((path) => path === '/funnel/view/checkout_pending_view').length
  const contactSubmitSuccessCount = paths.filter((path) => path === '/funnel/flow/contact_submit_success').length

  return NextResponse.json({
    days,
    funnel: {
      landingViewCount,
      pricingViewCount,
      signupIntentCount,
      paidCount,
      canceledCount,
      retryCount,
      pendingCount,
      contactSubmitSuccessCount,
      rates: {
        pricingFromLanding: toPercent(pricingViewCount, landingViewCount),
        signupFromPricing: toPercent(signupIntentCount, pricingViewCount),
        paidFromSignup: toPercent(paidCount, signupIntentCount),
        paidFromLanding: toPercent(paidCount, landingViewCount),
      },
    },
  })
})
