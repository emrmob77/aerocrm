import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/integrations/stripe'
import type { StripeCredentials } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type StripePayload = {
  secret_key: string
  webhook_secret?: string
}

// GET - Retrieve Stripe integration (credentials masked)
export const GET = withApiLogging(async () => {
  const t = getServerT()
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

  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('team_id', profile.team_id)
    .eq('provider', 'stripe')
    .maybeSingle()

  if (integrationError) {
    return NextResponse.json({ error: t('api.integrations.loadFailed') }, { status: 500 })
  }

  if (!integration) {
    return NextResponse.json({
      integration: null,
      status: 'disconnected',
    })
  }

  const credentials = integration.credentials as StripeCredentials
  const maskedSecret = credentials.secret_key
    ? `${credentials.secret_key.slice(0, 6)}${'*'.repeat(Math.max(0, credentials.secret_key.length - 10))}${credentials.secret_key.slice(-4)}`
    : ''

  const maskedCredentials = {
    secret_key: maskedSecret,
    webhook_secret: credentials.webhook_secret ? '••••••••••••••••' : '',
  }

  return NextResponse.json({
    integration: {
      id: integration.id,
      status: integration.status,
      credentials: maskedCredentials,
      connected_at: integration.connected_at,
      last_used_at: integration.last_used_at,
      last_error: integration.last_error,
    },
  })
})

// POST - Save/Update Stripe credentials
export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as StripePayload | null

  if (!payload?.secret_key) {
    return NextResponse.json({ error: t('api.integrations.stripeSecretRequired') }, { status: 400 })
  }

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

  const credentials: StripeCredentials = {
    secret_key: payload.secret_key,
    webhook_secret: payload.webhook_secret,
  }

  const testResult = await testConnection(credentials)

  if (!testResult.success) {
    return NextResponse.json(
      { error: testResult.error || t('api.integrations.stripeVerifyFailed') },
      { status: 400 }
    )
  }

  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('id')
    .eq('team_id', profile.team_id)
    .eq('provider', 'stripe')
    .maybeSingle()

  const integrationData = {
    team_id: profile.team_id,
    provider: 'stripe',
    status: 'connected',
    credentials,
    settings: { account_name: testResult.accountName },
    connected_at: new Date().toISOString(),
    connected_by: user.id,
    last_error: null,
  }

  let result
  if (existingIntegration) {
    result = await supabase
      .from('integrations')
      .update(integrationData)
      .eq('id', existingIntegration.id)
      .select('id, status, connected_at')
      .single()
  } else {
    result = await supabase
      .from('integrations')
      .insert(integrationData)
      .select('id, status, connected_at')
      .single()
  }

  if (result.error) {
    return NextResponse.json({ error: t('api.integrations.saveFailed') }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    integration: result.data,
    accountName: testResult.accountName,
  })
})

// DELETE - Disconnect Stripe integration
export const DELETE = withApiLogging(async () => {
  const t = getServerT()
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

  const { error: deleteError } = await supabase
    .from('integrations')
    .delete()
    .eq('team_id', profile.team_id)
    .eq('provider', 'stripe')

  if (deleteError) {
    return NextResponse.json({ error: t('api.integrations.removeFailed') }, { status: 500 })
  }

  return NextResponse.json({ success: true })
})
