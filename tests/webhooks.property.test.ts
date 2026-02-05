import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { buildWebhookPayload, buildWebhookSignature, buildWebhookTestData } from '@/lib/webhooks/utils'

describe('Webhook property tests', () => {
  it('Property 12: test webhook payload should be consistent', () => {
    fc.assert(
      fc.property(fc.uuid(), fc.date(), (webhookId, sentAtDate) => {
        const sentAt = sentAtDate.toISOString()
        const data = buildWebhookTestData(webhookId)
        const payload = buildWebhookPayload('webhook.test', data, sentAt)
        const parsed = JSON.parse(payload) as {
          event?: string
          data?: { webhookId?: string; message?: string }
          sentAt?: string
        }

        expect(parsed.event).toBe('webhook.test')
        expect(parsed.data?.webhookId).toBe(webhookId)
        expect(parsed.data?.message).toBe('Webhook test gönderimi')
        expect(parsed.sentAt).toBe(sentAt)
      })
    )
  })

  it('Property 12: signature should be deterministic and payload-sensitive', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 200 }),
        fc.string({ minLength: 1, maxLength: 500 }),
        fc.string({ minLength: 1, maxLength: 500 }),
        (secret, payloadA, payloadB) => {
          const signatureA1 = buildWebhookSignature(secret, payloadA)
          const signatureA2 = buildWebhookSignature(secret, payloadA)

          expect(signatureA1).toBe(signatureA2)
          expect(signatureA1).toMatch(/^[0-9a-f]{64}$/)

          if (payloadA !== payloadB) {
            const signatureB = buildWebhookSignature(secret, payloadB)
            expect(signatureA1).not.toBe(signatureB)
          }
        }
      )
    )
  })
})
