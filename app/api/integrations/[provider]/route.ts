import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'
import {
  buildGenericCredentials,
  maskGenericCredentials,
} from '@/lib/integrations/generic-provider-server'
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

type TeamIdentity = {
  userId: string
  teamId: string
}

type TeamIdentityResult = TeamIdentity | { error: Response }

const getUserTeam = async (
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  t: (key: string, vars?: Record<string, string | number>) => string
): Promise<TeamIdentityResult> => {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: t('api.errors.sessionMissing') }, { status: 401 }),
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('team_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile?.team_id) {
    return {
      error: NextResponse.json({ error: t('api.errors.teamMissing') }, { status: 400 }),
    }
  }

  return {
    userId: user.id,
    teamId: profile.team_id,
  }
}

export const GET = withApiLogging(
  async (_: Request, { params }: { params: { provider?: string } }) => {
    const t = getServerT()
    const provider = getProvider(params.provider)

    if (!provider) {
      return NextResponse.json({ error: t('api.integrations.providerUnsupported') }, { status: 404 })
    }

    const supabase = await createServerSupabaseClient()
    const identity = await getUserTeam(supabase, t)
    if ('error' in identity) return identity.error

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('team_id', identity.teamId)
      .eq('provider', provider)
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

    const credentials = toCredentialRecord(integration.credentials)
    const maskedCredentials = maskGenericCredentials(provider, credentials)

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
  }
)

export const POST = withApiLogging(
  async (request: Request, { params }: { params: { provider?: string } }) => {
    const t = getServerT()
    const provider = getProvider(params.provider)

    if (!provider) {
      return NextResponse.json({ error: t('api.integrations.providerUnsupported') }, { status: 404 })
    }

    const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ error: t('api.integrations.credentialsRequired') }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const identity = await getUserTeam(supabase, t)
    if ('error' in identity) return identity.error

    const { data: existingIntegration } = await supabase
      .from('integrations')
      .select('id, credentials')
      .eq('team_id', identity.teamId)
      .eq('provider', provider)
      .maybeSingle()

    const existingCredentials = toCredentialRecord(existingIntegration?.credentials)
    const normalized = buildGenericCredentials(provider, payload, existingCredentials)

    if (!normalized.ok) {
      return NextResponse.json(
        {
          error: t('api.integrations.genericCredentialsInvalid', {
            field: t(normalized.error),
          }),
        },
        { status: 400 }
      )
    }

    const config = getGenericIntegrationConfig(provider)
    const integrationData = {
      team_id: identity.teamId,
      provider,
      status: 'connected',
      credentials: normalized.credentials,
      settings: {
        provider_name: config.name,
      },
      connected_at: new Date().toISOString(),
      connected_by: identity.userId,
      last_error: null,
    }

    const result = existingIntegration
      ? await supabase
          .from('integrations')
          .update(integrationData)
          .eq('id', existingIntegration.id)
          .select('id, status, connected_at')
          .single()
      : await supabase
          .from('integrations')
          .insert(integrationData)
          .select('id, status, connected_at')
          .single()

    if (result.error) {
      return NextResponse.json({ error: t('api.integrations.saveFailed') }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      integration: result.data,
    })
  }
)

export const DELETE = withApiLogging(
  async (_: Request, { params }: { params: { provider?: string } }) => {
    const t = getServerT()
    const provider = getProvider(params.provider)

    if (!provider) {
      return NextResponse.json({ error: t('api.integrations.providerUnsupported') }, { status: 404 })
    }

    const supabase = await createServerSupabaseClient()
    const identity = await getUserTeam(supabase, t)
    if ('error' in identity) return identity.error

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('team_id', identity.teamId)
      .eq('provider', provider)

    if (error) {
      return NextResponse.json({ error: t('api.integrations.removeFailed') }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }
)
