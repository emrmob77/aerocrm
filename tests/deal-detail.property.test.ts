import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { getDbStage, getStageConfigs, normalizeStage, type StageId } from '@/components/deals/stage-utils'

const withMaskCase = (value: string, mask: boolean[]) => {
  if (mask.length === 0) return value
  return value
    .split('')
    .map((char, index) => (mask[index % mask.length] ? char.toUpperCase() : char.toLowerCase()))
    .join('')
}

const stageConfigs = getStageConfigs((key) => key)
const aliasEntries = stageConfigs.flatMap((config) =>
  config.dbValues.map((dbValue) => ({ id: config.id, value: dbValue }))
)
const stageIdArb = fc.constantFrom<StageId>('lead', 'proposal', 'negotiation', 'won', 'lost')
const aliasEntryArb = fc.constantFrom(...aliasEntries)
const asciiOnly = (value: string) => /^[\x00-\x7F]+$/.test(value)

// Feature: aero-crm-platform, Property 19: Anlaşma Aşama Güncelleme Tutarlılığı
describe('Deal detail property tests', () => {
  it('should keep stage normalization round-trip safe for all canonical stages', () => {
    fc.assert(
      fc.property(stageIdArb, (stageId) => {
        const dbStage = getDbStage(stageId)
        const normalized = normalizeStage(dbStage)
        expect(normalized).toBe(stageId)
      }),
      { numRuns: 100 }
    )
  })

  it('should resolve stage aliases consistently regardless of case', () => {
    fc.assert(
      fc.property(aliasEntryArb, fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }), (alias, caseMask) => {
        const variant = asciiOnly(alias.value) ? withMaskCase(alias.value, caseMask) : alias.value
        expect(normalizeStage(variant)).toBe(alias.id)
      }),
      { numRuns: 100 }
    )
  })

  it('should fall back to lead for unsupported values', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 60 }), (value) => {
        const normalizedValue = value.toLowerCase()
        const known = aliasEntries.some((entry) => entry.value.toLowerCase() === normalizedValue)
        if (!known) {
          expect(normalizeStage(value)).toBe('lead')
        }
      }),
      { numRuns: 100 }
    )
  })
})
