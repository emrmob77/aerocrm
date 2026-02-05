import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCredentialsFromEnv } from '@/lib/integrations/stripe'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { buildStripePriceMap, resolvePlanFromMetadata, resolvePlanFromPriceId } from '@/lib/billing/plan-change'
import type { PlanId } from '@/lib/billing/plans'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, IntegrationProvider, IntegrationStatus } from '@/types/database'

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

type StripeEvent = {
  type?: string
  data?: {
    object?: Record<string, unknown>
  }
}

type ExtendedDatabase = Database & {
  public: Database['public'] & {
    Tables: Database['public']['Tables'] & {
      integrations: {
        Row: {
          id: string
          team_id: string | null
          provider: IntegrationProvider
          status: IntegrationStatus
          credentials: Record<string, string> | null
          settings: Record<string, string> | null
          last_used_at: string | null
          last_error: string | null
          connected_at: string | null
          connected_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          team_id?: string | null
          provider: IntegrationProvider
          status?: IntegrationStatus
          credentials?: Record<string, string> | null
          settings?: Record<string, string> | null
          last_used_at?: string | null
          last_error?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          team_id?: string | null
          provider?: IntegrationProvider
          status?: IntegrationStatus
          credentials?: Record<string, string> | null
          settings?: Record<string, string> | null
          last_used_at?: string | null
          last_error?: string | null
          connected_at?: string | null
          connected_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
  }
}

const getObject = (value: unknown) =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : null

const getString = (value: unknown) => (typeof value === 'string' ? value : null)

const getPriceIdFromSubscription = (dataObject: Record<string, unknown>) => {
  const items = getObject(dataObject.items)
  const itemsData = Array.isArray(items?.data) ? items?.data : []
  const firstItem = getObject(itemsData[0])
  const price = getObject(firstItem?.price)
  return getString(price?.id)
}

const getPriceIdFromInvoice = (dataObject: Record<string, unknown>) => {
  const lines = getObject(dataObject.lines)
  const linesData = Array.isArray(lines?.data) ? lines?.data : []
  const firstLine = getObject(linesData[0])
  const price = getObject(firstLine?.price)
  return getString(price?.id)
}

const isPastDueStatus = (status?: string | null) =>
  status === 'past_due' || status === 'unpaid' || status === 'incomplete_expired'
const stripePriceMap = buildStripePriceMap()

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  const envCredentials = getCredentialsFromEnv()
  const webhookSecret = envCredentials?.webhook_secret || process.env.STRIPE_WEBHOOK_SECRET

  if (webhookSecret && !verifySignature(payload, webhookSecret, signature)) {
    return NextResponse.json({ error: t('api.stripeWebhook.invalidSignature') }, { status: 400 })
  }

  let event: StripeEvent
  try {
    event = JSON.parse(payload) as StripeEvent
  } catch {
    return NextResponse.json({ error: t('api.stripeWebhook.payloadUnreadable') }, { status: 400 })
  }

  let admin: SupabaseClient<ExtendedDatabase>
  try {
    admin = createSupabaseAdminClient() as SupabaseClient<ExtendedDatabase>
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : t('api.stripeWebhook.adminAccessMissing') },
      { status: 500 }
    )
  }

  const dataObject = getObject(event?.data?.object) ?? {}
  const customerId = getString(dataObject.customer) || getString(dataObject.customer_id)

  if (!customerId) {
    return NextResponse.json({ received: true })
  }

  const { data, error } = await admin
    .from('integrations')
    .select('*')
    .eq('provider', 'stripe')

  const integrations = (data ?? []) as Array<{ id: string; team_id: string | null; settings?: Record<string, string> | null }>

  if (error || integrations.length === 0) {
    return NextResponse.json({ error: t('api.stripeWebhook.integrationsMissing') }, { status: 500 })
  }

  const matched = integrations.find((integration) => {
    const settings = integration.settings || {}
    return settings.customer_id === customerId
  })

  if (!matched) {
    return NextResponse.json({ received: true })
  }

  const settings = (matched.settings || {}) as Record<string, string>
  let updateSettings = { ...settings }
  let nextPlan: PlanId | null = null
  let nextIntegrationStatus: IntegrationStatus = 'connected'
  let nextLastError: string | null = null

  if (event.type === 'checkout.session.completed') {
    updateSettings = {
      ...updateSettings,
      subscription_id: getString(dataObject.subscription) || updateSettings.subscription_id,
    }
    const metadata = getObject(dataObject.metadata)
    nextPlan =
      resolvePlanFromMetadata(getString(metadata?.plan_id) || getString(metadata?.plan)) || nextPlan
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const priceId = getPriceIdFromSubscription(dataObject)
    const subscriptionStatus = getString(dataObject.status) || updateSettings.subscription_status
    const currentPeriodEnd = dataObject.current_period_end

    updateSettings = {
      ...updateSettings,
      subscription_id: getString(dataObject.id) || updateSettings.subscription_id,
      subscription_status: subscriptionStatus,
      current_period_end:
        typeof currentPeriodEnd === 'number' || typeof currentPeriodEnd === 'string'
          ? String(currentPeriodEnd)
          : updateSettings.current_period_end,
      price_id: priceId || updateSettings.price_id,
    }

    if (isPastDueStatus(subscriptionStatus)) {
      nextIntegrationStatus = 'error'
      nextLastError = t('api.stripeWebhook.paymentPastDue')
    }

    nextPlan = resolvePlanFromPriceId(priceId, stripePriceMap) || nextPlan
  }

  if (event.type === 'customer.subscription.deleted') {
    updateSettings = {
      ...updateSettings,
      subscription_status: 'canceled',
    }
    nextPlan = 'starter'
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_succeeded') {
    const invoiceStatus = getString(dataObject.status) || 'paid'
    const paidAt = typeof dataObject.status_transitions === 'object'
      ? getObject(dataObject.status_transitions)?.paid_at
      : null
    const paidAtValue =
      typeof paidAt === 'number' || typeof paidAt === 'string' ? String(paidAt) : null
    const priceId = getPriceIdFromInvoice(dataObject)

    updateSettings = {
      ...updateSettings,
      last_invoice_id: getString(dataObject.id) || updateSettings.last_invoice_id,
      last_invoice_status: invoiceStatus,
      subscription_status: invoiceStatus === 'paid' ? 'active' : updateSettings.subscription_status,
      last_payment_at: paidAtValue || updateSettings.last_payment_at,
      price_id: priceId || updateSettings.price_id,
    }

    nextIntegrationStatus = 'connected'
    nextLastError = null
    nextPlan = resolvePlanFromPriceId(priceId, stripePriceMap) || nextPlan
  }

  if (event.type === 'invoice.payment_failed' || event.type === 'invoice.payment_action_required') {
    const invoiceStatus = getString(dataObject.status) || 'payment_failed'
    const nextAttempt = dataObject.next_payment_attempt
    const nextAttemptValue =
      typeof nextAttempt === 'number' || typeof nextAttempt === 'string' ? String(nextAttempt) : null

    updateSettings = {
      ...updateSettings,
      last_invoice_id: getString(dataObject.id) || updateSettings.last_invoice_id,
      last_invoice_status: invoiceStatus,
      subscription_status: 'past_due',
      next_payment_attempt: nextAttemptValue || updateSettings.next_payment_attempt,
      last_payment_failed_at: String(Math.floor(Date.now() / 1000)),
    }

    nextIntegrationStatus = 'error'
    nextLastError = t('api.stripeWebhook.paymentFailed')
  }

  if (event.type === 'customer.subscription.trial_will_end') {
    updateSettings = {
      ...updateSettings,
      trial_will_end: 'true',
    }
  }

  updateSettings = {
    ...updateSettings,
    last_event_type: event.type || updateSettings.last_event_type,
    last_event_at: String(Math.floor(Date.now() / 1000)),
  }

  const finalStatus = isPastDueStatus(updateSettings.subscription_status)
    ? 'error'
    : nextIntegrationStatus
  const finalLastError = finalStatus === 'error'
    ? nextLastError || t('api.stripeWebhook.paymentPastDue')
    : nextLastError

  await admin
    .from('integrations')
    .update({
      settings: updateSettings,
      status: finalStatus,
      last_error: finalLastError,
    })
    .eq('id', matched.id)

  if (nextPlan && matched.team_id) {
    await admin
      .from('teams')
      .update({ plan: nextPlan })
      .eq('id', matched.team_id)
  }

  return NextResponse.json({ received: true })
})
