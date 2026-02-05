import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  createOAuthState,
  maskPresence,
  maskSensitiveValue,
  verifyOAuthState,
} from '@/lib/integrations/security-utils'

const providerArb = fc.constantFrom('twilio', 'stripe', 'gmail', 'slack', 'gdrive', 'zapier')

// Feature: aero-crm-platform, Property 20: OAuth Güvenlik Yönetimi
describe('Integrations security property tests', () => {
  it('should mask sensitive values without exposing the original credential', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 4, maxLength: 120 }), (secret) => {
        const masked = maskSensitiveValue(secret)
        const presenceMask = maskPresence(secret)

        expect(masked).not.toBe(secret)
        expect(masked.length).toBeGreaterThan(0)
        expect(presenceMask).toBe('•'.repeat(16))
      }),
      { numRuns: 100 }
    )
  })

  it('should generate OAuth state values that are verifiable and tamper-resistant', () => {
    fc.assert(
      fc.property(fc.uuid(), providerArb, fc.string({ minLength: 16, maxLength: 80 }), fc.integer({ min: 0, max: 1_000_000 }), (teamId, provider, secret, nowOffset) => {
        const now = 1_700_000_000_000 + nowOffset
        const state = createOAuthState({ teamId, provider }, secret, now)
        const verified = verifyOAuthState(state, secret, 60_000, now + 500)

        expect(verified).not.toBeNull()
        expect(verified?.teamId).toBe(teamId)
        expect(verified?.provider).toBe(provider)

        const tampered = `${state}a`
        expect(verifyOAuthState(tampered, secret, 60_000, now + 500)).toBeNull()
        expect(verifyOAuthState(state, `${secret}-wrong`, 60_000, now + 500)).toBeNull()
      }),
      { numRuns: 100 }
    )
  })
})
