import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { normalizeAuthEmail, validateSignInCredentials } from '@/lib/auth/credentials'

const alphaNumChar = fc.constantFrom(
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
)

const localPartArb = fc.stringOf(alphaNumChar, { minLength: 2, maxLength: 16 })
const domainLabelArb = fc.stringOf(alphaNumChar, { minLength: 2, maxLength: 12 })
const tldArb = fc.constantFrom('com', 'net', 'org', 'io', 'dev')
const validEmailArb = fc
  .tuple(localPartArb, domainLabelArb, tldArb)
  .map(([local, domain, tld]) => `${local.toLowerCase()}@${domain.toLowerCase()}.${tld}`)

const validPasswordArb = fc.stringOf(alphaNumChar, { minLength: 6, maxLength: 24 })

const invalidEmailArb = fc
  .stringOf(alphaNumChar, { minLength: 1, maxLength: 24 })
  .filter((value) => !value.includes('@'))

const invalidPasswordArb = fc.oneof(
  fc.string({ minLength: 0, maxLength: 5 }),
  fc.integer({ min: 6, max: 24 }).map((count) => ' '.repeat(count))
)

const withMaskCase = (value: string, mask: boolean[]) => {
  if (mask.length === 0) return value
  return value
    .split('')
    .map((char, index) => (mask[index % mask.length] ? char.toUpperCase() : char.toLowerCase()))
    .join('')
}

// Feature: aero-crm-platform, Property 1: Kimlik Doğrulama Tutarlılığı
describe('Auth Consistency', () => {
  it('should normalize equivalent email credentials consistently', () => {
    fc.assert(
      fc.property(
        validEmailArb,
        validPasswordArb,
        fc.array(fc.boolean(), { minLength: 1, maxLength: 32 }),
        fc.integer({ min: 0, max: 3 }),
        fc.integer({ min: 0, max: 3 }),
        (baseEmail, password, caseMask, leftSpaces, rightSpaces) => {
          const variant = `${' '.repeat(leftSpaces)}${withMaskCase(baseEmail, caseMask)}${' '.repeat(rightSpaces)}`
          const expected = baseEmail.toLowerCase()

          expect(normalizeAuthEmail(variant)).toBe(expected)
          const result = validateSignInCredentials(variant, password)
          expect(result.ok).toBe(true)
          if (result.ok) {
            expect(result.normalizedEmail).toBe(expected)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: aero-crm-platform, Property 2: Geçersiz Kimlik Bilgileri Reddi
  it('should reject invalid email or password combinations', () => {
    fc.assert(
      fc.property(invalidEmailArb, validPasswordArb, (invalidEmail, password) => {
        const result = validateSignInCredentials(invalidEmail, password)
        expect(result.ok).toBe(false)
      }),
      { numRuns: 100 }
    )

    fc.assert(
      fc.property(validEmailArb, invalidPasswordArb, (email, invalidPassword) => {
        const result = validateSignInCredentials(email, invalidPassword)
        expect(result.ok).toBe(false)
      }),
      { numRuns: 100 }
    )
  })
})
