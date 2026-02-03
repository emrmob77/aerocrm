import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendSMS, sendWhatsApp, getCredentialsFromEnv } from '@/lib/integrations/twilio'
import type { TwilioCredentials } from '@/types/database'

type TestPayload = {
  to: string
  message: string
  method: 'sms' | 'whatsapp'
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as TestPayload | null

  if (!payload?.to || !payload?.message || !payload?.method) {
    return NextResponse.json(
      { error: 'Alıcı numara, mesaj ve yöntem zorunludur.' },
      { status: 400 }
    )
  }

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
      { error: 'Twilio yapılandırması bulunamadı. Lütfen önce bağlantı kurun.' },
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
      { error: result.error || 'Mesaj gönderilemedi.' },
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
    message: `Test ${payload.method === 'whatsapp' ? 'WhatsApp mesajı' : 'SMS'} gönderildi.`,
  })
}
