import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCredentialsFromEnv } from '@/lib/integrations/stripe'
import type { StripeCredentials } from '@/types/database'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const getSignatureParts = (header: string | null) => {
  if (!header) return null
  const parts = header.split(',').reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split('=')
    if (key && value) acc[key] = value
    return acc
  }, {})
  if (!parts.t || !parts.v1) return null
  return { timestamp: parts.t, signature: parts.v1 }
}

const verifySignature = (payload: string, secret: string, header: string | null) => {
  const parts = getSignatureParts(header)
  if (!parts) return false
  const signedPayload = `${parts.timestamp}.${payload}`
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.signature))
  } catch {
    return false
  }
}

const resolvePlanFromPrice = (priceId?: string | null) => {
  if (!priceId) return null
  const mapping: Record<string, string> = {}
  if (process.env.STRIPE_PRICE_STARTER) mapping[process.env.STRIPE_PRICE_STARTER] = 'starter'
  if (process.env.STRIPE_PRICE_GROWTH) mapping[process.env.STRIPE_PRICE_GROWTH] = 'growth'
  if (process.env.STRIPE_PRICE_SCALE) mapping[process.env.STRIPE_PRICE_SCALE] = 'scale'
  return mapping[priceId] || null
}

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  const envCredentials = getCredentialsFromEnv()
  const webhookSecret = envCredentials?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET

  if (webhookSecret && !verifySignature(payload, webhookSecret, signature)) {
    return NextResponse.json({ error: 'Gecersiz Stripe imzasi.' }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(payload)
  } catch {
    return NextResponse.json({ error: 'Webhook payload okunamadi.' }, { status: 400 })
  }

  let admin
  try {
    admin = createSupabaseAdminClient()
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Supabase admin erisimi yok.' },
      { status: 500 }
    )
  }

  const dataObject = event?.data?.object
  const customerId = dataObject?.customer || dataObject?.customer_id || null

  if (!customerId) {
    return NextResponse.json({ received: true })
  }

  const { data: integrations, error } = await admin
    .from('integrations')
    .select('*')
    .eq('provider', 'stripe')

  if (error || !integrations) {
    return NextResponse.json({ error: 'Entegrasyonlar bulunamadi.' }, { status: 500 })
  }

  const matched = integrations.find((integration) => {
    const settings = (integration.settings || {}) as Record<string, string>
    return settings.customer_id === customerId
  })

  if (!matched) {
    return NextResponse.json({ received: true })
  }

  const settings = (matched.settings || {}) as Record<string, string>
  let updateSettings = { ...settings }
  let nextPlan: string | null = null

  if (event.type === 'checkout.session.completed') {
    updateSettings = {
      ...updateSettings,
      subscription_id: dataObject?.subscription || updateSettings.subscription_id,
    }
    if (dataObject?.metadata?.plan) {
      nextPlan = dataObject.metadata.plan
    }
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const priceId = dataObject?.items?.data?.[0]?.price?.id || null
    updateSettings = {
      ...updateSettings,
      subscription_id: dataObject?.id || updateSettings.subscription_id,
      subscription_status: dataObject?.status || updateSettings.subscription_status,
      current_period_end: dataObject?.current_period_end?.toString() || updateSettings.current_period_end,
      price_id: priceId || updateSettings.price_id,
    }
    nextPlan = resolvePlanFromPrice(priceId) || nextPlan
  }

  if (event.type === 'customer.subscription.deleted') {
    updateSettings = {
      ...updateSettings,
      subscription_status: 'canceled',
    }
    nextPlan = 'free'
  }

  await admin
    .from('integrations')
    .update({
      settings: updateSettings,
      status: updateSettings.subscription_status === 'past_due' ? 'error' : 'connected',
      last_error: updateSettings.subscription_status === 'past_due' ? 'Odeme gecikti.' : null,
    })
    .eq('id', matched.id)

  if (nextPlan) {
    await admin
      .from('teams')
      .update({ plan: nextPlan })
      .eq('id', matched.team_id)
  }

  return NextResponse.json({ received: true })
}
