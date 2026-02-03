import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { testConnection } from '@/lib/integrations/twilio'
import type { TwilioCredentials } from '@/types/database'

type TwilioPayload = {
  account_sid: string
  auth_token: string
  from_sms?: string
  from_whatsapp?: string
}

// GET - Retrieve Twilio integration (credentials masked)
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

  const { data: integration, error: integrationError } = await supabase
    .from('integrations')
    .select('*')
    .eq('team_id', profile.team_id)
    .eq('provider', 'twilio')
    .maybeSingle()

  if (integrationError) {
    return NextResponse.json({ error: 'Entegrasyon yüklenemedi.' }, { status: 500 })
  }

  if (!integration) {
    return NextResponse.json({
      integration: null,
      status: 'disconnected',
    })
  }

  // Mask sensitive credentials
  const credentials = integration.credentials as TwilioCredentials
  const maskedCredentials = {
    account_sid: credentials.account_sid
      ? `${credentials.account_sid.slice(0, 6)}${'*'.repeat(Math.max(0, credentials.account_sid.length - 10))}${credentials.account_sid.slice(-4)}`
      : '',
    auth_token: credentials.auth_token ? '••••••••••••••••' : '',
    from_sms: credentials.from_sms || '',
    from_whatsapp: credentials.from_whatsapp || '',
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
}

// POST - Save/Update Twilio credentials
export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as TwilioPayload | null

  if (!payload?.account_sid || !payload?.auth_token) {
    return NextResponse.json(
      { error: 'Account SID ve Auth Token zorunludur.' },
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

  // Test connection before saving
  const credentials: TwilioCredentials = {
    account_sid: payload.account_sid,
    auth_token: payload.auth_token,
    from_sms: payload.from_sms,
    from_whatsapp: payload.from_whatsapp,
  }

  const testResult = await testConnection(credentials)

  if (!testResult.success) {
    return NextResponse.json(
      { error: testResult.error || 'Twilio bağlantısı doğrulanamadı.' },
      { status: 400 }
    )
  }

  // Check if integration already exists
  const { data: existingIntegration } = await supabase
    .from('integrations')
    .select('id')
    .eq('team_id', profile.team_id)
    .eq('provider', 'twilio')
    .maybeSingle()

  const integrationData = {
    team_id: profile.team_id,
    provider: 'twilio',
    status: 'connected',
    credentials,
    settings: { account_name: testResult.accountName },
    connected_at: new Date().toISOString(),
    connected_by: user.id,
    last_error: null,
  }

  let result
  if (existingIntegration) {
    // Update existing
    result = await supabase
      .from('integrations')
      .update(integrationData)
      .eq('id', existingIntegration.id)
      .select('id, status, connected_at')
      .single()
  } else {
    // Insert new
    result = await supabase
      .from('integrations')
      .insert(integrationData)
      .select('id, status, connected_at')
      .single()
  }

  if (result.error) {
    return NextResponse.json(
      { error: 'Entegrasyon kaydedilemedi.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    integration: result.data,
    accountName: testResult.accountName,
  })
}

// DELETE - Disconnect Twilio integration
export async function DELETE() {
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

  const { error: deleteError } = await supabase
    .from('integrations')
    .delete()
    .eq('team_id', profile.team_id)
    .eq('provider', 'twilio')

  if (deleteError) {
    return NextResponse.json(
      { error: 'Entegrasyon kaldırılamadı.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
