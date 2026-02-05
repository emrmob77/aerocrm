import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  createCustomer,
  listInvoices,
  listSubscriptions,
  getCredentialsFromEnv,
  type StripeCustomer,
} from '@/lib/integrations/stripe'
import type { StripeCredentials } from '@/types/database'
import { getServerLocale, getServerT } from '@/lib/i18n/server'
import { getPlanCatalog, normalizePlanId } from '@/lib/billing/plans'
import { messages } from '@/lib/i18n/messages'
import { withApiLogging } from '@/lib/monitoring/api-logger'

const daysToMs = (days: number) => days * 24 * 60 * 60 * 1000

const buildUsage = (params: {
  used: number
  limit: number | null
  label: string
  unit?: string
  t: (key: string, vars?: Record<string, string | number>) => string
}) => {
  const unlimitedLabel = params.t('billing.unlimited')
  const limitLabel = params.limit === null ? unlimitedLabel : params.limit
  const valueLabel = params.unit
    ? `${params.used} ${params.unit} / ${limitLabel} ${params.unit}`
    : `${params.used} / ${limitLabel}`
  const percent =
    params.limit && params.limit > 0
      ? Math.min(100, Math.round((params.used / params.limit) * 100))
      : 0
  const hint =
    params.limit && params.limit > 0
      ? params.t('api.billing.usageHintActive', { value: `${percent}%` })
      : params.t('api.billing.usageEmptyHint')
  return {
    label: params.label,
    value: valueLabel,
    hint,
  }
}

export const GET = withApiLogging(async () => {
  const t = getServerT()
  const locale = getServerLocale()
  const formatLocale = locale === 'en' ? 'en-US' : 'tr-TR'
  const supabase = await createServerSupabaseClient()
  const planCatalog = getPlanCatalog()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 })
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, plan')
    .eq('id', profile.team_id)
    .maybeSingle()

  const planId = normalizePlanId(team?.plan)
  const plan = planCatalog.find((item) => item.id === planId) ?? planCatalog[0]
  const planLimits = plan?.limits ?? { users: 0, proposals: 0, storageGb: 0 }

  const since = new Date(Date.now() - daysToMs(30)).toISOString()

  const [dealsResponse, proposalsResponse, contactsResponse] = await Promise.all([
    supabase
      .from('deals')
      .select('user_id')
      .eq('team_id', profile.team_id)
      .gte('created_at', since),
    supabase
      .from('proposals')
      .select('user_id, status')
      .eq('team_id', profile.team_id)
      .gte('created_at', since),
    supabase
      .from('contacts')
      .select('user_id')
      .eq('team_id', profile.team_id)
      .gte('created_at', since),
  ])

  const activeUserIds = new Set<string>()
  const dealsUsers = dealsResponse.data ?? []
  const proposalUsers = proposalsResponse.data ?? []
  const contactUsers = contactsResponse.data ?? []
  dealsUsers.forEach((item) => item.user_id && activeUserIds.add(item.user_id))
  proposalUsers.forEach((item) => item.user_id && activeUserIds.add(item.user_id))
  contactUsers.forEach((item) => item.user_id && activeUserIds.add(item.user_id))

  const activeUsers = activeUserIds.size
  const proposalCount = (proposalsResponse.data ?? []).filter(
    (item) => item.status && item.status !== 'draft'
  ).length

  const { data: dealIds } = await supabase
    .from('deals')
    .select('id')
    .eq('team_id', profile.team_id)

  let storageBytes = 0
  const ids = (dealIds ?? []).map((deal) => deal.id)
  if (ids.length > 0) {
    const { data: files } = await supabase
      .from('deal_files')
      .select('file_size')
      .in('deal_id', ids)
      .gte('created_at', since)

    storageBytes =
      files?.reduce((sum, file) => sum + (file.file_size ?? 0), 0) ?? 0
  }

  const storageGb = Math.round((storageBytes / (1024 * 1024 * 1024)) * 10) / 10

  const usage = [
    buildUsage({
      used: activeUsers,
      limit: planLimits.users,
      label: t('api.billing.usageActiveUsers'),
      t,
    }),
    buildUsage({
      used: proposalCount,
      limit: planLimits.proposals,
      label: t('api.billing.usageProposals'),
      t,
    }),
    buildUsage({
      used: storageGb,
      limit: planLimits.storageGb,
      label: t('api.billing.usageStorage'),
      unit: 'GB',
      t,
    }),
  ]

  const planFeatures = messages[locale]?.billing?.plans ?? {}
  const planCards = planCatalog.map((item) => ({
    id: item.id,
    name: t(`billing.plans.${item.id}.name`),
    description: t(`billing.plans.${item.id}.description`),
    priceMonthly: item.priceMonthly,
    currency: item.currency,
    priceId: item.priceId,
    features: (planFeatures as Record<string, { features?: readonly string[] }>)[item.id]?.features ?? [],
    limits: item.limits,
    recommended: item.recommended ?? false,
  }))

  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('team_id', profile.team_id)
    .eq('provider', 'stripe')
    .maybeSingle()

  if (!integration || integration.status !== 'connected') {
    return NextResponse.json({
      status: 'disconnected',
      planId,
      planName: t(`billing.plans.${planId}.name`),
      usage,
      usagePeriod: t('billing.usagePeriod'),
      invoices: [],
      subscription: null,
      customer: null,
      plans: planCards,
    })
  }

  const credentials = (integration.credentials || {}) as StripeCredentials
  if (!credentials.secret_key) {
    return NextResponse.json({ error: t('api.billing.stripeKeyMissing') }, { status: 400 })
  }

  const envCredentials = getCredentialsFromEnv()
  const mergedCredentials: StripeCredentials = {
    secret_key: credentials.secret_key || envCredentials?.secret_key || '',
    webhook_secret: credentials.webhook_secret || envCredentials?.webhook_secret,
  }

  const settings = (integration.settings || {}) as Record<string, string>
  let customerId = settings.customer_id
  let customer: StripeCustomer | null = null

  if (!customerId) {
    const createResult = await createCustomer(mergedCredentials, {
      name: team?.name ?? undefined,
      email: user.email ?? undefined,
      metadata: {
        team_id: profile.team_id,
      },
    })

    if (!createResult.success || !createResult.customer) {
      return NextResponse.json(
        { error: createResult.error || t('api.billing.stripeCustomerCreateFailed') },
        { status: 400 }
      )
    }

    customerId = createResult.customer.id
    customer = createResult.customer

    await supabase
      .from('integrations')
      .update({
        settings: {
          ...settings,
          customer_id: customerId,
        },
      })
      .eq('id', integration.id)
  }

  if (!customer && customerId) {
    customer = { id: customerId, email: user.email ?? null, name: team?.name ?? null }
  }

  const [subscriptionResult, invoiceResult] = await Promise.all([
    listSubscriptions(mergedCredentials, customerId),
    listInvoices(mergedCredentials, customerId, 5),
  ])

  const subscription = subscriptionResult.success ? subscriptionResult.subscription : null
  const invoices = invoiceResult.success ? invoiceResult.invoices || [] : []

  const mappedInvoices = invoices.map((invoice) => ({
    id: invoice.id,
    date: invoice.created ? new Date(invoice.created * 1000).toLocaleDateString(formatLocale) : '- ',
    amount: invoice.amount_due
      ? new Intl.NumberFormat(formatLocale, {
          style: 'currency',
          currency: invoice.currency?.toUpperCase() || 'TRY',
        }).format(invoice.amount_due / 100)
      : '-',
    status: invoice.status || '-',
    pdf: invoice.hosted_invoice_url,
  }))

  return NextResponse.json({
    status: integration.status,
    planId,
    planName: t(`billing.plans.${planId}.name`),
    usage,
    usagePeriod: t('billing.usagePeriod'),
    invoices: mappedInvoices,
    subscription,
    customer,
    plans: planCards,
  })
})
