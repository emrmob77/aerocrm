import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendSMS, sendWhatsApp, getCredentialsFromEnv } from '@/lib/integrations/twilio'
import type { TwilioCredentials } from '@/types/database'
import { getServerT } from '@/lib/i18n/server'
import { withApiLogging } from '@/lib/monitoring/api-logger'

type TestPayload = {
  to: string
  message: string
  method: 'sms' | 'whatsapp'
}

export const POST = withApiLogging(async (request: Request) => {
  const t = getServerT()
  const payload = (await request.json().catch(() => null)) as TestPayload | null

  if (!payload?.to || !payload?.message || !payload?.method) {
    return NextResponse.json(
      { error: t('api.integrations.twilioTestRequired') },
      { status: 400 }
    )
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

  // Get credentials from DB first, then fallback to env
  let credentials: TwilioCredentials | null = null

  const { data: integration } = await supabase
    .from('integrations')
    .select('credentials')
    .eq('team_id', profile.team_id)
    .eq('provider', 'twilio')
    .eq('status', 'connected')
    .maybeSingle()

  if (integration?.credentials) {
    credentials = integration.credentials as TwilioCredentials
  } else {
    credentials = getCredentialsFromEnv()
  }

  if (!credentials) {
    return NextResponse.json(
      { error: t('api.integrations.twilioConfigMissing') },
      { status: 400 }
    )
  }

  // Send test message
  const result = payload.method === 'whatsapp'
    ? await sendWhatsApp(payload.to, payload.message, credentials)
    : await sendSMS(payload.to, payload.message, credentials)

  if (!result.success) {
    // Update last_error in integration
    if (integration) {
      await supabase
        .from('integrations')
        .update({ last_error: result.error, status: 'error' })
        .eq('team_id', profile.team_id)
        .eq('provider', 'twilio')
    }

    return NextResponse.json(
      { error: result.error || t('api.integrations.messageSendFailed') },
      { status: 400 }
    )
  }

  // Update last_used_at and clear any error
  if (integration) {
    await supabase
      .from('integrations')
      .update({
        last_used_at: new Date().toISOString(),
        last_error: null,
        status: 'connected',
      })
      .eq('team_id', profile.team_id)
      .eq('provider', 'twilio')
  }

  return NextResponse.json({
    success: true,
    sid: result.sid,
    message: t('api.integrations.testSent', {
      method:
        payload.method === 'whatsapp'
          ? t('api.integrations.methods.whatsapp')
          : t('api.integrations.methods.sms'),
    }),
  })
})
