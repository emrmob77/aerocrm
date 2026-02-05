import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { getCredentialsFromEnv } from '@/lib/integrations/stripe'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
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

const resolvePlanFromPrice = (priceId?: string | null) => {
  if (!priceId) return null
  const mapping: Record<string, string> = {}
  if (process.env.STRIPE_PRICE_STARTER) mapping[process.env.STRIPE_PRICE_STARTER] = 'starter'
  if (process.env.STRIPE_PRICE_GROWTH) mapping[process.env.STRIPE_PRICE_GROWTH] = 'growth'
  if (process.env.STRIPE_PRICE_SCALE) mapping[process.env.STRIPE_PRICE_SCALE] = 'scale'
  return mapping[priceId] || null
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
  let nextPlan: string | null = null

  if (event.type === 'checkout.session.completed') {
    updateSettings = {
      ...updateSettings,
      subscription_id: getString(dataObject.subscription) || updateSettings.subscription_id,
    }
    const metadata = getObject(dataObject.metadata)
    nextPlan = getString(metadata?.plan) || nextPlan
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const items = getObject(dataObject.items)
    const itemsData = Array.isArray(items?.data) ? items?.data : []
    const firstItem = getObject(itemsData[0])
    const price = getObject(firstItem?.price)
    const priceId = getString(price?.id)
    const currentPeriodEnd = dataObject.current_period_end
    updateSettings = {
      ...updateSettings,
      subscription_id: getString(dataObject.id) || updateSettings.subscription_id,
      subscription_status: getString(dataObject.status) || updateSettings.subscription_status,
      current_period_end:
        typeof currentPeriodEnd === 'number' || typeof currentPeriodEnd === 'string'
          ? String(currentPeriodEnd)
          : updateSettings.current_period_end,
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
      last_error:
        updateSettings.subscription_status === 'past_due'
          ? t('api.stripeWebhook.paymentPastDue')
          : null,
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
