import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { retryWebhookDelivery } from '@/lib/webhooks/dispatch'
import { getServerT } from '@/lib/i18n/server'

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const t = getServerT()
  if (!params.id) {
    return NextResponse.json({ error: t('api.webhooks.logIdRequired') }, { status: 400 })
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

  const { data: log, error: logError } = await supabase
    .from('webhook_logs')
    .select('*')
    .eq('id', params.id)
    .single()

  if (logError || !log) {
    return NextResponse.json({ error: t('api.webhooks.logNotFound') }, { status: 404 })
  }

  if (log.success) {
    return NextResponse.json({ error: t('api.webhooks.alreadySuccess') }, { status: 400 })
  }

  const { data: webhook, error: webhookError } = await supabase
    .from('webhooks')
    .select('*')
    .eq('id', log.webhook_id)
    .eq('team_id', profile.team_id)
    .maybeSingle()

  if (webhookError || !webhook) {
    return NextResponse.json({ error: t('api.webhooks.notFound') }, { status: 404 })
  }

  if (!webhook.active) {
    return NextResponse.json({ error: t('api.webhooks.inactive') }, { status: 400 })
  }

  const payload =
    log.payload && typeof log.payload === 'object' && !Array.isArray(log.payload)
      ? (log.payload as Record<string, unknown>)
      : {}

  const { attempt, log: newLog } = await retryWebhookDelivery({
    supabase,
    webhook,
    event: log.event_type,
    data: payload,
  })

  const successCount = webhook.success_count + (attempt.result.ok ? 1 : 0)
  const failureCount = webhook.failure_count + (attempt.result.ok ? 0 : 1)

  const { data: updatedWebhook } = await supabase
    .from('webhooks')
    .update({
      last_triggered_at: attempt.sentAt,
      success_count: successCount,
      failure_count: failureCount,
    })
    .eq('id', webhook.id)
    .select('*')
    .single()

  return NextResponse.json({
    log: newLog ?? log,
    webhook: updatedWebhook ?? webhook,
    result: attempt.result,
  })
}
