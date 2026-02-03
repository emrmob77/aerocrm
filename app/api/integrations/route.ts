import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Integration, IntegrationProvider } from '@/types/database'

// Available integration providers
const AVAILABLE_PROVIDERS: IntegrationProvider[] = [
  'twilio',
  'gmail',
  'slack',
  'gdrive',
  'zapier',
  'stripe',
]

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

  // Get existing integrations from DB
  const { data: integrations, error: integrationsError } = await supabase
    .from('integrations')
    .select('*')
    .eq('team_id', profile.team_id)

  if (integrationsError) {
    return NextResponse.json({ error: 'Entegrasyonlar yüklenemedi.' }, { status: 500 })
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
}
