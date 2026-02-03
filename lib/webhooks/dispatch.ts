import { createHmac } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

type WebhookRow = Database['public']['Tables']['webhooks']['Row']

type DispatchParams = {
  supabase: SupabaseClient<Database>
  teamId: string
  event: string
  data: Record<string, unknown>
}

type DeliveryResult = {
  ok: boolean
  status?: number
  statusText?: string
  durationMs?: number
  error?: string
}

type DeliveryAttempt = {
  sentAt: string
  payload: string
  result: DeliveryResult
}

const buildSignature = (secret: string, payload: string) =>
  createHmac('sha256', secret).update(payload).digest('hex')

const sendWebhook = async (
  webhook: WebhookRow,
  event: string,
  data: Record<string, unknown>,
  sentAt: string
): Promise<DeliveryAttempt> => {
  const payload = JSON.stringify({ event, data, sentAt })
  const signature = buildSignature(webhook.secret_key, payload)
  const startedAt = Date.now()

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Aero-Signature': signature,
        'X-Aero-Event': event,
      },
      body: payload,
      signal: AbortSignal.timeout(8000),
    })
    return {
      sentAt,
      payload,
      result: {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        durationMs: Date.now() - startedAt,
      },
    }
  } catch (error) {
    return {
      sentAt,
      payload,
      result: {
        ok: false,
        error: error instanceof Error ? error.message : 'Webhook gönderimi başarısız',
        durationMs: Date.now() - startedAt,
      },
    }
  }
}

const insertWebhookLog = async (params: {
  supabase: SupabaseClient<Database>
  webhook: WebhookRow
  event: string
  data: Record<string, unknown>
  attempt: DeliveryAttempt
}) => {
  const { supabase, webhook, event, data, attempt } = params
  await supabase.from('webhook_logs').insert({
    webhook_id: webhook.id,
    event_type: event,
    payload: data as Json,
    response_status: attempt.result.status ?? null,
    response_body: attempt.result.statusText ?? null,
    success: attempt.result.ok,
    duration_ms: attempt.result.durationMs ?? null,
    error_message: attempt.result.ok ? null : attempt.result.error ?? null,
  })
}

export async function dispatchWebhookEvent({ supabase, teamId, event, data }: DispatchParams) {
  const { data: hooks, error } = await supabase
    .from('webhooks')
    .select('*')
    .eq('team_id', teamId)
    .eq('active', true)
    .contains('events', [event])

  if (error || !hooks?.length) {
    return { dispatched: 0 }
  }

  await Promise.all(
    hooks.map(async (hook) => {
      const attempt = await sendWebhook(hook, event, data, new Date().toISOString())
      const successCount = (hook.success_count ?? 0) + (attempt.result.ok ? 1 : 0)
      const failureCount = (hook.failure_count ?? 0) + (attempt.result.ok ? 0 : 1)

      await insertWebhookLog({
        supabase,
        webhook: hook,
        event,
        data,
        attempt,
      })

      await supabase
        .from('webhooks')
        .update({
          last_triggered_at: attempt.sentAt,
          success_count: successCount,
          failure_count: failureCount,
        })
        .eq('id', hook.id)
    })
  )

  return { dispatched: hooks.length }
}

export async function sendWebhookTest(
  supabase: SupabaseClient<Database>,
  webhook: WebhookRow,
  event = 'webhook.test'
) {
  const attempt = await sendWebhook(webhook, event, {
    message: 'Webhook test gönderimi',
    webhookId: webhook.id,
  }, new Date().toISOString())

  const successCount = (webhook.success_count ?? 0) + (attempt.result.ok ? 1 : 0)
  const failureCount = (webhook.failure_count ?? 0) + (attempt.result.ok ? 0 : 1)

  await insertWebhookLog({
    supabase,
    webhook,
    event,
    data: {
      message: 'Webhook test gönderimi',
      webhookId: webhook.id,
    },
    attempt,
  })

  const { data } = await supabase
    .from('webhooks')
    .update({
      last_triggered_at: attempt.sentAt,
      success_count: successCount,
      failure_count: failureCount,
    })
    .eq('id', webhook.id)
    .select('*')
    .single()

  return {
    result: attempt.result,
    updated: data ?? null,
  }
}

export async function retryWebhookDelivery(params: {
  supabase: SupabaseClient<Database>
  webhook: WebhookRow
  event: string
  data: Record<string, unknown>
}) {
  const { supabase, webhook, event, data } = params
  const attempt = await sendWebhook(webhook, event, data, new Date().toISOString())

  const { data: newLog } = await supabase
    .from('webhook_logs')
    .insert({
      webhook_id: webhook.id,
      event_type: event,
      payload: data as Json,
      response_status: attempt.result.status ?? null,
      response_body: attempt.result.statusText ?? null,
      success: attempt.result.ok,
      duration_ms: attempt.result.durationMs ?? null,
      error_message: attempt.result.ok ? null : attempt.result.error ?? null,
    })
    .select('*')
    .single()

  return {
    attempt,
    log: newLog ?? null,
  }
}
