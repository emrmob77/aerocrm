import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Integration, IntegrationProvider } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

// Available integration providers
const AVAILABLE_PROVIDERS: IntegrationProvider[] = [
  'twilio',
  'gmail',
  'slack',
  'zoom',
  'stripe',
  'paypal',
  'iyzico',
  'gdrive',
  'dropbox',
  'zapier',
  'webhook',
]

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

  // Get existing integrations from DB
  const { data: integrations, error: integrationsError } = await supabase
    .from('integrations')
    .select('*')
    .eq('team_id', profile.team_id)

  if (integrationsError) {
    return NextResponse.json({ error: t('api.integrations.fetchFailed') }, { status: 500 })
  }

  // Map integrations by provider for easy lookup
  const integrationMap = new Map<string, Integration>()
  if (integrations) {
    for (const integration of integrations) {
      integrationMap.set(integration.provider, integration as Integration)
    }
  }

  // Build response with all available providers
  const result = AVAILABLE_PROVIDERS.map((provider) => {
    const existing = integrationMap.get(provider)
    if (existing) {
      // Don't expose credentials in list response
      return {
        ...existing,
        credentials: undefined,
      }
    }
    return {
      provider,
      status: 'disconnected' as const,
    }
  })

  return NextResponse.json({ integrations: result })
})
