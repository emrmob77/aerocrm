import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getCredentialsFromEnv, testConnection } from '@/lib/integrations/stripe'
import type { StripeCredentials } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'

export async function POST() {
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

  let credentials: StripeCredentials | null = null

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('team_id', profile.team_id)
    .eq('provider', 'stripe')
    .eq('status', 'connected')
    .maybeSingle()

  if (integration?.credentials) {
    credentials = integration.credentials as StripeCredentials
  } else {
    credentials = getCredentialsFromEnv()
  }

  if (!credentials) {
    return NextResponse.json(
      { error: t('api.integrations.stripeConfigMissing') },
      { status: 400 }
    )
  }

  const result = await testConnection(credentials)

  if (!result.success) {
    if (integration) {
      await supabase
        .from('integrations')
        .update({ last_error: result.error, status: 'error' })
        .eq('team_id', profile.team_id)
        .eq('provider', 'stripe')
    }

    return NextResponse.json(
      { error: result.error || t('api.integrations.stripeVerifyFailed') },
      { status: 400 }
    )
  }

  if (integration) {
    await supabase
      .from('integrations')
      .update({
        last_used_at: new Date().toISOString(),
        last_error: null,
        status: 'connected',
      })
      .eq('team_id', profile.team_id)
      .eq('provider', 'stripe')
  }

  return NextResponse.json({
    success: true,
    message: result.accountName
      ? t('api.integrations.stripeVerifiedWithAccount', { account: result.accountName })
      : t('api.integrations.stripeVerified'),
  })
}
