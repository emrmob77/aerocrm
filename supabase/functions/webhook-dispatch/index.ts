// @ts-nocheck

import { dispatchWebhook } from '../_shared/webhook.ts'

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const payload = await request.json().catch(() => null)
  const url = payload?.url?.trim?.()
  const secretKey = payload?.secretKey?.trim?.()
  const event = payload?.event?.trim?.()
  const data = payload?.data && typeof payload.data === 'object' ? payload.data : null

  if (!url || !secretKey || !event || !data) {
    return new Response(JSON.stringify({ error: 'url, secretKey, event ve data zorunludur' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const result = await dispatchWebhook({
      url,
      secretKey,
      event,
      data,
    })

    return new Response(JSON.stringify({ result }), {
      status: result.ok ? 200 : 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Webhook gönderimi başarısız' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
