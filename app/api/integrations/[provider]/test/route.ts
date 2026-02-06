import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import { validateGenericCredentials } from '@/lib/integrations/generic-provider-server'
import {
  getGenericIntegrationConfig,
  isGenericIntegrationProvider,
  type GenericIntegrationProvider,
} from '@/lib/integrations/provider-config'

const getProvider = (value: string | undefined): GenericIntegrationProvider | null => {
  if (!value) return null
  return isGenericIntegrationProvider(value) ? value : null
}

const toCredentialRecord = (value: unknown) => {
  if (!value || typeof value !== 'object') return {}
  const record = value as Record<string, unknown>
  const output: Record<string, string> = {}

  for (const [key, item] of Object.entries(record)) {
    if (typeof item === 'string') {
      output[key] = item
    }
  }

  return output
}

export const POST = withApiLogging(
  async (_: Request, { params }: { params: { provider?: string } }) => {
    const t = getServerT()
    const provider = getProvider(params.provider)

    if (!provider) {
      return NextResponse.json({ error: t('api.integrations.providerUnsupported') }, { status: 404 })
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

    const { data: integration } = await supabase
      .from('integrations')
      .select('id, credentials')
      .eq('team_id', profile.team_id)
      .eq('provider', provider)
      .eq('status', 'connected')
      .maybeSingle()

    if (!integration) {
      const config = getGenericIntegrationConfig(provider)
      return NextResponse.json(
        {
          error: t('api.integrations.genericConfigMissing', { provider: config.name }),
        },
        { status: 400 }
      )
    }

    const credentials = toCredentialRecord(integration.credentials)
    const validation = validateGenericCredentials(provider, credentials)

    if (!validation.ok) {
      await supabase
        .from('integrations')
        .update({
          last_error: t('api.integrations.genericCredentialsInvalid', {
            field: t(validation.error),
          }),
          status: 'error',
        })
        .eq('id', integration.id)

      return NextResponse.json(
        {
          error: t('api.integrations.genericCredentialsInvalid', {
            field: t(validation.error),
          }),
        },
        { status: 400 }
      )
    }

    await supabase
      .from('integrations')
      .update({
        last_used_at: new Date().toISOString(),
        last_error: null,
        status: 'connected',
      })
      .eq('id', integration.id)

    const config = getGenericIntegrationConfig(provider)
    return NextResponse.json({
      success: true,
      message: t('api.integrations.genericVerified', { provider: config.name }),
    })
  }
)
