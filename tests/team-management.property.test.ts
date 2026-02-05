import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { assignDealOwner } from '@/lib/team/deal-assignment'

type DealRow = {
  id: string
  user_id: string
  title: string
  value: number
}

const dealArb = fc.record({
  id: fc.uuid(),
  user_id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 80 }),
  value: fc.integer({ min: 0, max: 1_000_000 }),
})

describe('Team management property tests', () => {
  it('Property 13: deal assignment should be flexible without corrupting list state', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(dealArb, { selector: (deal) => deal.id, minLength: 1, maxLength: 80 }),
        fc.array(fc.uuid(), { minLength: 1, maxLength: 40 }),
        fc.integer({ min: 0, max: 79 }),
        (deals, ownerPool, rawTargetIndex) => {
          const targetIndex = rawTargetIndex % deals.length
          const targetDeal = deals[targetIndex]

          let state: DealRow[] = deals
          for (const ownerId of ownerPool) {
            state = assignDealOwner(state, targetDeal.id, ownerId)
            const current = state.find((deal) => deal.id === targetDeal.id)
            expect(current?.user_id).toBe(ownerId)
          }

          expect(state.length).toBe(deals.length)

          const byId = new Map(state.map((deal) => [deal.id, deal]))
          for (const original of deals) {
            const next = byId.get(original.id)
            expect(next).toBeDefined()
            if (original.id === targetDeal.id) {
              expect(next?.title).toBe(original.title)
              expect(next?.value).toBe(original.value)
            } else {
              expect(next).toStrictEqual(original)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 13: non-existent deal assignment should not mutate state', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(dealArb, { selector: (deal) => deal.id, maxLength: 80 }),
        fc.uuid(),
        fc.uuid(),
        (deals, missingDealId, ownerId) => {
          if (deals.some((deal) => deal.id === missingDealId)) {
            return
          }
          const next = assignDealOwner(deals, missingDealId, ownerId)
          expect(next).toBe(deals)
        }
      )
    )
  })
})
