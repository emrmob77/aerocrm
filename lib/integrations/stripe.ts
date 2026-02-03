import type { StripeCredentials } from '@/types/database'

export type StripeTestResult = {
  success: boolean
  accountName?: string
  error?: string
}

export type StripeInvoice = {
  id: string
  hosted_invoice_url: string | null
  amount_due: number
  currency: string
  status: string | null
  created: number
  period_start: number | null
  period_end: number | null
}

export type StripeSubscription = {
  id: string
  status: string
  current_period_end: number | null
  current_period_start: number | null
  cancel_at_period_end: boolean
  items: Array<{ price: { id: string | null } }>
}

export type StripeCustomer = {
  id: string
  email: string | null
  name: string | null
}

export function getCredentialsFromEnv(): StripeCredentials | null {
  const secret_key = process.env.STRIPE_SECRET_KEY
  if (!secret_key) return null
  return {
    secret_key,
    webhook_secret: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  }
}

const buildAuthHeader = (secretKey: string) => `Bearer ${secretKey}`

const encodeForm = (payload: Record<string, string | number | boolean | undefined | null>) => {
  const body = new URLSearchParams()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    body.append(key, String(value))
  })
  return body
}

async function stripeRequest(
  credentials: StripeCredentials,
  path: string,
  method: 'GET' | 'POST',
  payload?: Record<string, string | number | boolean | undefined | null>
) {
  const url = `https://api.stripe.com${path}`
  const headers: Record<string, string> = {
    Authorization: buildAuthHeader(credentials.secret_key),
  }

  const init: RequestInit = { method, headers }

  if (method === 'POST') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    init.body = encodeForm(payload || {})
  }

  const response = await fetch(url, init)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: data?.error?.message || 'Stripe istegi basarisiz oldu.',
      data: null as any,
    }
  }

  return { ok: true, status: response.status, data, error: null as string | null }
}

export async function testConnection(credentials: StripeCredentials): Promise<StripeTestResult> {
  try {
    const response = await stripeRequest(credentials, '/v1/account', 'GET')

    if (!response.ok) {
      return {
        success: false,
        error: response.error || 'Stripe bağlantısı doğrulanamadı.',
      }
    }

    const data = response.data
    const accountName =
      data?.business_profile?.name ||
      data?.settings?.dashboard?.display_name ||
      data?.business_name ||
      data?.email ||
      undefined

    return {
      success: true,
      accountName,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Stripe bağlantısı doğrulanamadı.',
    }
  }
}

export async function createCustomer(
  credentials: StripeCredentials,
  payload: { name?: string; email?: string; metadata?: Record<string, string> }
) {
  const requestPayload: Record<string, string> = {}
  if (payload.name) requestPayload.name = payload.name
  if (payload.email) requestPayload.email = payload.email
  if (payload.metadata) {
    Object.entries(payload.metadata).forEach(([key, value]) => {
      requestPayload[`metadata[${key}]`] = value
    })
  }

  const response = await stripeRequest(credentials, '/v1/customers', 'POST', requestPayload)
  if (!response.ok) {
    return { success: false, error: response.error }
  }

  return { success: true, customer: response.data as StripeCustomer }
}

export async function listInvoices(
  credentials: StripeCredentials,
  customerId: string,
  limit = 5
): Promise<{ success: boolean; invoices?: StripeInvoice[]; error?: string }> {
  const response = await stripeRequest(
    credentials,
    `/v1/invoices?customer=${encodeURIComponent(customerId)}&limit=${limit}`,
    'GET'
  )

  if (!response.ok) {
    return { success: false, error: response.error }
  }

  return { success: true, invoices: (response.data?.data || []) as StripeInvoice[] }
}

export async function listSubscriptions(
  credentials: StripeCredentials,
  customerId: string
): Promise<{ success: boolean; subscription?: StripeSubscription | null; error?: string }> {
  const response = await stripeRequest(
    credentials,
    `/v1/subscriptions?customer=${encodeURIComponent(customerId)}&status=all&limit=1`,
    'GET'
  )

  if (!response.ok) {
    return { success: false, error: response.error }
  }

  const data = response.data?.data || []
  return { success: true, subscription: (data[0] as StripeSubscription) || null }
}

export async function createCheckoutSession(
  credentials: StripeCredentials,
  payload: {
    customerId: string
    priceId: string
    successUrl: string
    cancelUrl: string
    metadata?: Record<string, string>
  }
): Promise<{ success: boolean; url?: string; error?: string }> {
  const requestPayload: Record<string, string> = {
    mode: 'subscription',
    customer: payload.customerId,
    success_url: payload.successUrl,
    cancel_url: payload.cancelUrl,
    'line_items[0][price]': payload.priceId,
    'line_items[0][quantity]': '1',
  }

  if (payload.metadata) {
    Object.entries(payload.metadata).forEach(([key, value]) => {
      requestPayload[`metadata[${key}]`] = value
    })
  }

  const response = await stripeRequest(credentials, '/v1/checkout/sessions', 'POST', requestPayload)
  if (!response.ok) {
    return { success: false, error: response.error }
  }

  return { success: true, url: response.data?.url }
}

export async function createPortalSession(
  credentials: StripeCredentials,
  payload: { customerId: string; returnUrl: string }
): Promise<{ success: boolean; url?: string; error?: string }> {
  const response = await stripeRequest(credentials, '/v1/billing_portal/sessions', 'POST', {
    customer: payload.customerId,
    return_url: payload.returnUrl,
  })

  if (!response.ok) {
    return { success: false, error: response.error }
  }

  return { success: true, url: response.data?.url }
}
