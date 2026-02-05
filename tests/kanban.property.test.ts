import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { applyOptimisticDealStage, resolveDropStage } from '@/components/deals/kanban-utils'
import { getDbStage, getStageConfigs, normalizeStage, type StageId } from '@/components/deals/stage-utils'

const stageArb = fc.constantFrom<StageId>('lead', 'proposal', 'negotiation', 'won', 'lost')
const isoDateArb = fc.date().map((date) => date.toISOString())

const dealArb = fc.record({
  id: fc.uuid(),
  stage: stageArb,
  updatedAt: isoDateArb,
})

const dealsArb = fc.uniqueArray(dealArb, { selector: (item) => item.id, minLength: 1, maxLength: 20 })

// Feature: aero-crm-platform, Property 4: Kanban Aşama Tutarlılığı
describe('Kanban Stage Consistency', () => {
  it('should preserve stage identity across db stage mapping', () => {
    fc.assert(
      fc.property(stageArb, (stage) => {
        expect(normalizeStage(getDbStage(stage))).toBe(stage)
      }),
      { numRuns: 100 }
    )
  })

  it('should normalize every known db alias to one canonical stage', () => {
    const aliasPairs = getStageConfigs((key) => key).flatMap((config) =>
      config.dbValues.map((dbValue) => ({ stage: config.id, dbValue }))
    )

    fc.assert(
      fc.property(fc.constantFrom(...aliasPairs), ({ stage, dbValue }) => {
        expect(normalizeStage(dbValue)).toBe(stage)
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: aero-crm-platform, Property 5: Anlaşma Sürükle-Bırak Tutarlılığı
describe('Kanban Drag-Drop Consistency', () => {
  it('should move only the target deal and preserve deal set', () => {
    fc.assert(
      fc.property(dealsArb, stageArb, isoDateArb, fc.nat(), (deals, targetStage, nextUpdatedAt, pickIndex) => {
        const picked = deals[pickIndex % deals.length]
        const updated = applyOptimisticDealStage(deals, picked.id, targetStage, nextUpdatedAt)

        expect(updated).toHaveLength(deals.length)
        expect(new Set(updated.map((item) => item.id)).size).toBe(deals.length)

        if (picked.stage === targetStage) {
          expect(updated).toEqual(deals)
          return
        }

        for (const previous of deals) {
          const current = updated.find((item) => item.id === previous.id)
          expect(current).toBeDefined()
          if (!current) continue

          if (current.id === picked.id) {
            expect(current.stage).toBe(targetStage)
            expect(current.updatedAt).toBe(nextUpdatedAt)
          } else {
            expect(current.stage).toBe(previous.stage)
            expect(current.updatedAt).toBe(previous.updatedAt)
          }
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should resolve drop target stage deterministically', () => {
    fc.assert(
      fc.property(dealsArb, stageArb, fc.nat(), (deals, stage, pickIndex) => {
        const picked = deals[pickIndex % deals.length]

        expect(resolveDropStage(`stage-${stage}`, deals)).toBe(stage)
        expect(resolveDropStage(`deal-${picked.id}`, deals)).toBe(picked.stage)
        expect(resolveDropStage('unknown-target', deals)).toBeNull()
      }),
      { numRuns: 100 }
    )
  })
})
