import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import {
  applyPlanChange,
  resolvePlanFromMetadata,
  resolvePlanFromPriceId,
  type StripePriceMap,
} from '@/lib/billing/plan-change'
import type { PlanId } from '@/lib/billing/plans'

const planArb = fc.constantFrom<PlanId>('starter', 'growth', 'scale')
const aliasesByPlan: Record<PlanId, string[]> = {
  starter: ['starter', 'solo'],
  growth: ['growth', 'pro'],
  scale: ['scale', 'team'],
}

const priceMapArb = fc.record({
  starter: fc.string({ minLength: 4, maxLength: 40 }),
  growth: fc.string({ minLength: 4, maxLength: 40 }),
  scale: fc.string({ minLength: 4, maxLength: 40 }),
})

// Feature: aero-crm-platform, Property 21: Plan Değişikliği Anında Uygulama
describe('Billing property tests', () => {
  it('should immediately resolve plan changes from metadata aliases', () => {
    fc.assert(
      fc.property(planArb, planArb, fc.integer({ min: 0, max: 1 }), (current, target, aliasIndex) => {
        const alias = aliasesByPlan[target][aliasIndex]
        const next = applyPlanChange(current, { metadataPlanId: alias })
        expect(next).toBe(target)
      }),
      { numRuns: 100 }
    )
  })

  it('should immediately resolve plan changes from Stripe price ids', () => {
    fc.assert(
      fc.property(planArb, planArb, priceMapArb, (current, target, priceMap) => {
        const map: StripePriceMap = priceMap
        const targetPriceId = map[target] || null
        const next = applyPlanChange(current, { priceId: targetPriceId, priceMap: map })
        expect(next).toBe(target)
      }),
      { numRuns: 100 }
    )
  })

  it('should keep current plan for unknown metadata and price ids', () => {
    fc.assert(
      fc.property(planArb, fc.string({ minLength: 1, maxLength: 30 }), fc.string({ minLength: 1, maxLength: 30 }), (current, unknownPlan, unknownPrice) => {
        if (resolvePlanFromMetadata(unknownPlan) !== null || resolvePlanFromPriceId(unknownPrice) !== null) {
          return
        }
        const next = applyPlanChange(current, { metadataPlanId: unknownPlan, priceId: unknownPrice })
        expect(next).toBe(current)
      }),
      { numRuns: 100 }
    )
  })
})
