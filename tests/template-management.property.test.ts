import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { normalizeTemplatePayload } from '@/lib/templates/template-utils'

const alphaNumChar = fc.constantFrom(
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
  '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ' ', '-', '_'
)

const textArb = fc.stringOf(alphaNumChar, { maxLength: 80 })
const blockArb = fc.record({
  type: fc.constantFrom('hero', 'text', 'pricing', 'timeline', 'cta', 'signature'),
  data: fc.dictionary(fc.string({ minLength: 1, maxLength: 8 }), fc.string({ maxLength: 64 })),
})

const payloadArb = fc.record(
  {
    name: fc.option(textArb, { nil: undefined }),
    description: fc.option(textArb, { nil: undefined }),
    category: fc.option(textArb, { nil: undefined }),
    is_public: fc.option(fc.boolean(), { nil: undefined }),
    blocks: fc.option(fc.oneof(fc.array(blockArb, { maxLength: 30 }), fc.string(), fc.integer()), { nil: undefined }),
  },
  { withDeletedKeys: true }
)

// Feature: aero-crm-platform, Property 18: Şablon Oluşturma Esnekliği
describe('Template management property tests', () => {
  it('should normalize any template payload into a stable and safe shape', () => {
    fc.assert(
      fc.property(payloadArb, (payload) => {
        const normalized = normalizeTemplatePayload(payload)
        const normalizedAgain = normalizeTemplatePayload(normalized)

        expect(normalizedAgain).toStrictEqual(normalized)
        expect(normalized.name).toBe(normalized.name.trim())
        expect(typeof normalized.name).toBe('string')
        expect(normalized.description === null || normalized.description === normalized.description.trim()).toBe(true)
        expect(normalized.category === null || normalized.category === normalized.category.trim()).toBe(true)
        expect(Array.isArray(normalized.blocks)).toBe(true)
        expect(typeof normalized.is_public).toBe('boolean')
      }),
      { numRuns: 100 }
    )
  })

  it('should preserve block ordering whenever block input is an array', () => {
    fc.assert(
      fc.property(fc.array(blockArb, { maxLength: 50 }), (blocks) => {
        const normalized = normalizeTemplatePayload({ name: 'Template', blocks })
        expect(normalized.blocks).toStrictEqual(blocks)
      }),
      { numRuns: 100 }
    )
  })
})
