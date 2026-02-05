import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  SEARCH_TYPES,
  applyRealtimeSearchFilters,
  buildSearchDateFrom,
  normalizeSearchFilters,
  sanitizeSearchQuery,
  toggleSearchFilterValue,
  type SearchResults,
} from '@/lib/search/search-utils'

const stageArb = fc.constantFrom('lead', 'proposal_sent', 'negotiation', 'won', 'lost')
const statusArb = fc.constantFrom('draft', 'sent', 'viewed', 'signed', 'expired')
const currencyArb = fc.constantFrom('TRY', 'USD', 'EUR')
const dateRangeArb = fc.constantFrom<'all' | '7d' | '30d' | '90d'>('all', '7d', '30d', '90d')
const alphaChar = fc.constantFrom(
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
)
const searchTokenArb = fc.stringOf(alphaChar, { minLength: 2, maxLength: 12 })
const textArb = fc.stringOf(alphaChar, { minLength: 1, maxLength: 20 })
const isoDateArb = fc.date({
  min: new Date('2020-01-01T00:00:00.000Z'),
  max: new Date('2036-12-31T00:00:00.000Z'),
}).map((value) => value.toISOString())

const dealArb = fc.record({
  id: fc.uuid(),
  title: textArb,
  value: fc.integer({ min: 0, max: 1_000_000 }),
  currency: currencyArb,
  stage: stageArb,
  updated_at: isoDateArb,
  contact: fc.option(
    fc.record({
      full_name: fc.option(textArb, { nil: null }),
      company: fc.option(textArb, { nil: null }),
    }),
    { nil: null }
  ),
})

const contactArb = fc.record({
  id: fc.uuid(),
  full_name: textArb,
  email: fc.option(fc.emailAddress(), { nil: null }),
  company: fc.option(textArb, { nil: null }),
  updated_at: isoDateArb,
})

const proposalArb = fc.record({
  id: fc.uuid(),
  title: textArb,
  status: statusArb,
  updated_at: isoDateArb,
  contact: fc.option(
    fc.record({
      full_name: fc.option(textArb, { nil: null }),
    }),
    { nil: null }
  ),
})

const resultsArb = fc.record({
  deals: fc.uniqueArray(dealArb, { selector: (item) => item.id, maxLength: 40 }),
  contacts: fc.uniqueArray(contactArb, { selector: (item) => item.id, maxLength: 40 }),
  proposals: fc.uniqueArray(proposalArb, { selector: (item) => item.id, maxLength: 40 }),
})

const includesQuery = (query: string, values: Array<string | null | undefined>) =>
  values.some((value) => sanitizeSearchQuery(value ?? '').toLowerCase().includes(query))

const isWithinDateRange = (value: string, dateFrom: string | null) => {
  if (!dateFrom) return true
  const valueTs = Date.parse(value)
  const fromTs = Date.parse(dateFrom)
  if (!Number.isFinite(valueTs) || !Number.isFinite(fromTs)) return false
  return valueTs >= fromTs
}

// Feature: aero-crm-platform, Property 16: Kapsamlı Arama İşlevi
describe('Search coverage property tests', () => {
  it('should include deal/contact/proposal matches for any query with default types', () => {
    fc.assert(
      fc.property(
        searchTokenArb,
        fc.boolean(),
        resultsArb,
        dealArb,
        contactArb,
        proposalArb,
        (token, upperCase, baseResults, baseDeal, baseContact, baseProposal) => {
          const deal = {
            ...baseDeal,
            title: `${baseDeal.title} ${token}`,
          }
          const contact = {
            ...baseContact,
            company: `${token} ${baseContact.company ?? ''}`.trim(),
          }
          const proposal = {
            ...baseProposal,
            title: `${baseProposal.title} ${token}`,
          }

          const results: SearchResults = {
            deals: [...baseResults.deals, deal],
            contacts: [...baseResults.contacts, contact],
            proposals: [...baseResults.proposals, proposal],
          }

          const rawQuery = upperCase ? ` ${token.toUpperCase()} ` : ` ${token.toLowerCase()} `
          const filtered = applyRealtimeSearchFilters(results, rawQuery, { types: [] })

          expect(normalizeSearchFilters({ types: [] }).types).toStrictEqual([...SEARCH_TYPES])
          expect(filtered.deals.some((item) => item.id === deal.id)).toBe(true)
          expect(filtered.contacts.some((item) => item.id === contact.id)).toBe(true)
          expect(filtered.proposals.some((item) => item.id === proposal.id)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: aero-crm-platform, Property 24: Gerçek Zamanlı Filtre Güncelleme
describe('Search realtime filter update property tests', () => {
  it('should always return results that satisfy active filters immediately', () => {
    fc.assert(
      fc.property(
        resultsArb,
        fc.string({ maxLength: 20 }),
        fc.uniqueArray(fc.constantFrom(...SEARCH_TYPES), { maxLength: 3 }),
        fc.uniqueArray(stageArb, { maxLength: 3 }),
        fc.uniqueArray(statusArb, { maxLength: 3 }),
        dateRangeArb,
        fc.date(),
        (results, rawQuery, types, stages, statuses, dateRange, nowDate) => {
          const nowMs = nowDate.getTime()
          const normalized = normalizeSearchFilters({ types, stages, statuses, dateRange })
          const filtered = applyRealtimeSearchFilters(
            results,
            rawQuery,
            { types, stages, statuses, dateRange },
            nowMs
          )
          const query = sanitizeSearchQuery(rawQuery).toLowerCase()
          const dateFrom = buildSearchDateFrom(normalized.dateRange, nowMs)

          expect(applyRealtimeSearchFilters(results, rawQuery, { types, stages, statuses, dateRange }, nowMs))
            .toStrictEqual(filtered)

          if (!normalized.types.includes('deals')) {
            expect(filtered.deals).toHaveLength(0)
          }
          if (!normalized.types.includes('contacts')) {
            expect(filtered.contacts).toHaveLength(0)
          }
          if (!normalized.types.includes('proposals')) {
            expect(filtered.proposals).toHaveLength(0)
          }

          for (const deal of filtered.deals) {
            expect(normalized.stages.length === 0 || normalized.stages.includes(deal.stage)).toBe(true)
            expect(isWithinDateRange(deal.updated_at, dateFrom)).toBe(true)
            expect(includesQuery(query, [deal.title, deal.contact?.full_name, deal.contact?.company])).toBe(true)
          }

          for (const contact of filtered.contacts) {
            expect(isWithinDateRange(contact.updated_at, dateFrom)).toBe(true)
            expect(includesQuery(query, [contact.full_name, contact.email, contact.company])).toBe(true)
          }

          for (const proposal of filtered.proposals) {
            expect(normalized.statuses.length === 0 || normalized.statuses.includes(proposal.status)).toBe(true)
            expect(isWithinDateRange(proposal.updated_at, dateFrom)).toBe(true)
            expect(includesQuery(query, [proposal.title, proposal.contact?.full_name])).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should toggle filter chips consistently for any interaction sequence', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(textArb, { maxLength: 20 }),
        textArb,
        (selectedValues, id) => {
          const once = toggleSearchFilterValue(selectedValues, id)
          const twice = toggleSearchFilterValue(once, id)
          const asSortedSet = (values: string[]) => Array.from(new Set(values)).sort()

          expect(asSortedSet(twice)).toStrictEqual(asSortedSet(selectedValues))

          if (selectedValues.includes(id)) {
            expect(once.includes(id)).toBe(false)
          } else {
            expect(once.includes(id)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
