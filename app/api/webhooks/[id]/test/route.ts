import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { sendWebhookTest } from '@/lib/webhooks/dispatch'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    return NextResponse.json({ error: 'Webhook ID zorunludur.' }, { status: 400 })
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

  const { data: webhook, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', params.id)
    .eq('team_id', profile.team_id)
    .single()

  if (error || !webhook) {
    return NextResponse.json({ error: 'Webhook bulunamadı.' }, { status: 404 })
  }

  const { result, updated } = await sendWebhookTest(supabase, webhook)

  if (!result.ok) {
    return NextResponse.json({ error: 'Test gönderimi başarısız oldu.' }, { status: 400 })
  }

  return NextResponse.json({ webhook: updated ?? webhook })
}
