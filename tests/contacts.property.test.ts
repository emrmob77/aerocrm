import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { filterContacts, matchesContactQuery, type ContactFilterInput } from '@/components/contacts/contact-utils'

const alphaChar = fc.constantFrom(
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
)
const alpha = fc.stringOf(alphaChar, { minLength: 2, maxLength: 10 })
const companyName = fc
  .tuple(alpha, fc.option(alpha, { nil: '' }))
  .map(([first, second]) => (second ? `${first} ${second}` : first))

const isoDate = fc.date().map((date) => date.toISOString())

const digitChar = fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9')

const contactArb = fc.record({
  id: fc.uuid(),
  firstName: alpha,
  lastName: alpha,
  email: fc.emailAddress(),
  phone: fc.stringOf(digitChar, { minLength: 7, maxLength: 12 }),
  company: companyName,
  totalValue: fc.integer({ min: 0, max: 250000 }),
  createdAt: isoDate,
  lastActivityAt: isoDate,
}).map((raw) => ({
  id: raw.id,
  fullName: `${raw.firstName} ${raw.lastName}`,
  email: raw.email,
  phone: raw.phone,
  company: raw.company,
  totalValue: raw.totalValue,
  createdAt: raw.createdAt,
  lastActivityAt: raw.lastActivityAt,
}))

const buildQuery = (contact: ContactFilterInput, field: 'name' | 'email' | 'phone' | 'company') => {
  if (field === 'name') {
    return contact.fullName.split(' ')[0]
  }
  if (field === 'email') {
    return (contact.email ?? '').split('@')[0]
  }
  if (field === 'phone') {
    const value = contact.phone ?? ''
    return value.slice(-4)
  }
  const companyValue = contact.company ?? ''
  return companyValue.split(' ')[0]
}

const varyCase = (value: string, upper: boolean) => (upper ? value.toUpperCase() : value.toLowerCase())

// Feature: aero-crm-platform, Property 6: Arama Kapsamlılığı
describe('Contacts Search Coverage', () => {
  it('should include any contact when query matches name/email/phone/company', () => {
    fc.assert(
      fc.property(
        contactArb,
        fc.array(contactArb, { maxLength: 5 }),
        fc.constantFrom('name', 'email', 'phone', 'company'),
        fc.boolean(),
        (contact, others, field, useUpper) => {
          const query = buildQuery(contact, field)
          const finalQuery = `  ${varyCase(query, useUpper)}  `

          const list = [...others, contact]
          const result = filterContacts(list, finalQuery, 'all')

          expect(matchesContactQuery(contact, finalQuery)).toBe(true)
          expect(result.some((item) => item.id === contact.id)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
