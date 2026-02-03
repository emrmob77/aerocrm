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

const buildPlanCatalog = () => {
  const plans = [] as Array<{ id: string; name: string; priceId: string }>
  const starter = process.env.STRIPE_PRICE_STARTER
  const growth = process.env.STRIPE_PRICE_GROWTH
  const scale = process.env.STRIPE_PRICE_SCALE

  if (starter) plans.push({ id: 'starter', name: 'Starter', priceId: starter })
  if (growth) plans.push({ id: 'growth', name: 'Growth', priceId: growth })
  if (scale) plans.push({ id: 'scale', name: 'Scale', priceId: scale })

  return plans
}

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Oturum bulunamadı.' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return NextResponse.json({ error: 'Takım bilgisi bulunamadı.' }, { status: 400 })
  }

  const { data: team } = await supabase
    .from('teams')
    .select('id, name, plan')
    .eq('id', profile.team_id)
    .maybeSingle()

  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('team_id', profile.team_id)
    .eq('provider', 'stripe')
    .maybeSingle()

  if (!integration || integration.status !== 'connected') {
    return NextResponse.json({
      status: 'disconnected',
      plan: team?.plan ?? 'free',
      usage: [
        { label: 'Aktif kullanici', value: '0 / 0', hint: 'Veri yok' },
        { label: 'Teklif gonderimi', value: '0 / 0', hint: 'Veri yok' },
        { label: 'Depolama', value: '0 GB / 0 GB', hint: 'Veri yok' },
      ],
      invoices: [],
      subscription: null,
      customer: null,
      plans: buildPlanCatalog(),
    })
  }

  const credentials = (integration.credentials || {}) as StripeCredentials
  if (!credentials.secret_key) {
    return NextResponse.json({ error: 'Stripe anahtari bulunamadi.' }, { status: 400 })
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
        { error: createResult.error || 'Stripe musteri olusturulamadi.' },
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
    date: invoice.created ? new Date(invoice.created * 1000).toLocaleDateString('tr-TR') : '- ',
    amount: invoice.amount_due
      ? new Intl.NumberFormat('tr-TR', {
          style: 'currency',
          currency: invoice.currency?.toUpperCase() || 'TRY',
        }).format(invoice.amount_due / 100)
      : '-',
    status: invoice.status || '-',
    pdf: invoice.hosted_invoice_url,
  }))

  return NextResponse.json({
    status: integration.status,
    plan: team?.plan ?? 'free',
    usage: [
      { label: 'Aktif kullanici', value: '12 / 20', hint: '%60 kullanildi' },
      { label: 'Teklif gonderimi', value: '148 / 500', hint: '%29 kullanildi' },
      { label: 'Depolama', value: '3.2 GB / 10 GB', hint: '%32 kullanildi' },
    ],
    invoices: mappedInvoices,
    subscription,
    customer,
    plans: buildPlanCatalog(),
  })
}
