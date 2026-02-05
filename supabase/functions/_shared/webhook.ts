// @ts-nocheck

const encoder = new TextEncoder()

const toHex = (buffer: ArrayBuffer) =>
  Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

export const buildWebhookPayload = (event: string, data: Record<string, unknown>, sentAt: string) =>
  JSON.stringify({ event, data, sentAt })

export const buildWebhookSignature = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toHex(signature)
}

export const dispatchWebhook = async (params: {
  url: string
  secretKey: string
  event: string
  data: Record<string, unknown>
}) => {
  const sentAt = new Date().toISOString()
  const payload = buildWebhookPayload(params.event, params.data, sentAt)
  const signature = await buildWebhookSignature(params.secretKey, payload)
  const startedAt = Date.now()

  const response = await fetch(params.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Aero-Signature': signature,
      'X-Aero-Event': params.event,
    },
    body: payload,
  })

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    durationMs: Date.now() - startedAt,
    sentAt,
  }
}
