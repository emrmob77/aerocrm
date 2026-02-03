import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createPortalSession, createCustomer, getCredentialsFromEnv } from '@/lib/integrations/stripe'
import type { StripeCredentials } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'

type PortalPayload = {
  return_url?: string
}

export async function POST(request: Request) {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as PortalPayload | null

  const supabase = await createServerSupabaseClient()

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
    .select('id, name')
    .eq('id', profile.team_id)
    .maybeSingle()

  const { data: integration } = await supabase
    .from('integrations')
    .select('*')
    .eq('team_id', profile.team_id)
    .eq('provider', 'stripe')
    .maybeSingle()

  if (!integration || integration.status !== 'connected') {
    return NextResponse.json({ error: t('api.billing.stripeNotConnected') }, { status: 400 })
  }

  const credentials = (integration.credentials || {}) as StripeCredentials
  const envCredentials = getCredentialsFromEnv()
  const mergedCredentials: StripeCredentials = {
    secret_key: credentials.secret_key || envCredentials?.secret_key || '',
    webhook_secret: credentials.webhook_secret || envCredentials?.webhook_secret,
  }

  if (!mergedCredentials.secret_key) {
    return NextResponse.json({ error: t('api.billing.stripeKeyMissing') }, { status: 400 })
  }

  const settings = (integration.settings || {}) as Record<string, string>
  let customerId = settings.customer_id

  if (!customerId) {
    const customerResult = await createCustomer(mergedCredentials, {
      name: team?.name ?? undefined,
      email: user.email ?? undefined,
      metadata: { team_id: profile.team_id },
    })

    if (!customerResult.success || !customerResult.customer) {
      return NextResponse.json(
        { error: customerResult.error || t('api.billing.stripeCustomerCreateFailed') },
        { status: 400 }
      )
    }

    customerId = customerResult.customer.id

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

  const origin = request.headers.get('origin') || 'http://localhost:3000'
  const returnUrl = payload?.return_url || `${origin}/settings/billing`

  const portalResult = await createPortalSession(mergedCredentials, {
    customerId,
    returnUrl,
  })

  if (!portalResult.success || !portalResult.url) {
    return NextResponse.json(
      { error: portalResult.error || t('api.billing.stripePortalFailed') },
      { status: 400 }
    )
  }

  return NextResponse.json({ url: portalResult.url })
}
