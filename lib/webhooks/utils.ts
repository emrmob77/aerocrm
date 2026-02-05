import { createHmac } from 'crypto'

export const buildWebhookPayload = (event: string, data: Record<string, unknown>, sentAt: string) =>
  JSON.stringify({ event, data, sentAt })

export const buildWebhookSignature = (secret: string, payload: string) =>
  createHmac('sha256', secret).update(payload).digest('hex')

export const buildWebhookTestData = (webhookId: string) => ({
  message: 'Webhook test gönderimi',
  webhookId,
})
