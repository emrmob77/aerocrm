import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { buildConversionFunnel } from '@/lib/analytics/funnel'

const statusArb = fc.constantFrom('draft', 'pending', 'sent', 'viewed', 'signed', 'expired')

const proposalArb = fc.record({
  id: fc.uuid(),
  status: fc.option(statusArb, { nil: undefined }),
})

const buildViewArb = (ids: string[]) => {
  const proposalIdArb = ids.length > 0
    ? fc.oneof(fc.constantFrom(...ids), fc.uuid())
    : fc.uuid()

  return fc.record({
    proposal_id: proposalIdArb,
    duration_seconds: fc.option(fc.integer({ min: -300, max: 60_000 }), { nil: undefined }),
  })
}

describe('Analytics property tests', () => {
  it('Property 11: conversion funnel should stay visualizable and monotonic', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(proposalArb, { selector: (proposal) => proposal.id, maxLength: 120 }).chain((proposals) =>
          fc.record({
            proposals: fc.constant(proposals),
            views: fc.array(buildViewArb(proposals.map((proposal) => proposal.id)), { maxLength: 320 }),
          })
        ),
        ({ proposals, views }) => {
          const funnel = buildConversionFunnel(proposals as Array<{ id: string; status?: string }>, views)

          expect(funnel.sentCount).toBeGreaterThanOrEqual(0)
          expect(funnel.viewedCount).toBeGreaterThanOrEqual(0)
          expect(funnel.engagedCount).toBeGreaterThanOrEqual(0)
          expect(funnel.signedCount).toBeGreaterThanOrEqual(0)

          expect(funnel.viewedCount).toBeLessThanOrEqual(funnel.sentCount)
          expect(funnel.engagedCount).toBeLessThanOrEqual(funnel.viewedCount)
          expect(funnel.signedCount).toBeLessThanOrEqual(funnel.engagedCount)

          expect(funnel.sentPercent).toBeGreaterThanOrEqual(0)
          expect(funnel.sentPercent).toBeLessThanOrEqual(100)
          expect(funnel.viewedPercent).toBeGreaterThanOrEqual(0)
          expect(funnel.viewedPercent).toBeLessThanOrEqual(100)
          expect(funnel.engagedPercent).toBeGreaterThanOrEqual(0)
          expect(funnel.engagedPercent).toBeLessThanOrEqual(100)
          expect(funnel.signedPercent).toBeGreaterThanOrEqual(0)
          expect(funnel.signedPercent).toBeLessThanOrEqual(100)

          if (funnel.sentCount === 0) {
            expect(funnel.sentPercent).toBe(0)
            expect(funnel.viewedPercent).toBe(0)
            expect(funnel.engagedPercent).toBe(0)
            expect(funnel.signedPercent).toBe(0)
          } else {
            expect(funnel.sentPercent).toBe(100)
          }

          expect(funnel.viewedFlex).toBeGreaterThanOrEqual(0.32)
          expect(funnel.engagedFlex).toBeGreaterThanOrEqual(0.28)
          expect(funnel.signedFlex).toBeGreaterThanOrEqual(0.22)

          const reversed = buildConversionFunnel(
            [...proposals].reverse() as Array<{ id: string; status?: string }>,
            [...views].reverse()
          )
          expect(reversed).toStrictEqual(funnel)
        }
      )
    )
  })
})
