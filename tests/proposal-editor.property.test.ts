import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { appendSmartVariableToBlock, insertBlockAt } from '@/lib/proposals/editor-utils'

type SimpleBlock = {
  id: string
  type: string
  data: Record<string, unknown>
}

const blockArb = fc.record({
  id: fc.uuid(),
  type: fc.constantFrom('hero', 'heading', 'text', 'pricing', 'testimonial', 'cta'),
  data: fc.constant({}),
}) as fc.Arbitrary<SimpleBlock>

const blocksArb = fc.uniqueArray(blockArb, { selector: (item) => item.id, maxLength: 20 })
const variableArb = fc.constantFrom('{{contact.name}}', '{{deal.value}}', '{{proposal.expires_at}}')

// Feature: aero-crm-platform, Property 7: Blok Ekleme Tutarlılığı
describe('Proposal Block Addition Consistency', () => {
  it('should preserve existing blocks and insert exactly one new block', () => {
    fc.assert(
      fc.property(blocksArb, blockArb, fc.integer({ min: -5, max: 50 }), (blocks, newBlock, index) => {
        if (blocks.some((item) => item.id === newBlock.id)) {
          return
        }

        const result = insertBlockAt(blocks, newBlock, index)
        expect(result).toHaveLength(blocks.length + 1)
        expect(result.some((item) => item.id === newBlock.id)).toBe(true)
        expect(new Set(result.map((item) => item.id)).size).toBe(blocks.length + 1)

        if (index >= 0 && index <= blocks.length) {
          expect(result[index]?.id).toBe(newBlock.id)
        } else {
          expect(result[result.length - 1]?.id).toBe(newBlock.id)
        }
      }),
      { numRuns: 100 }
    )
  })
})

// Feature: aero-crm-platform, Property 8: Akıllı Değişken Otomatik Tamamlama
describe('Smart Variable Autocomplete Consistency', () => {
  it('should append smart variable to supported block fields', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('hero', 'heading', 'text', 'testimonial'),
        fc.string({ maxLength: 64 }),
        variableArb,
        (type, seed, variable) => {
          const block =
            type === 'hero'
              ? { type, data: { title: seed } }
              : type === 'heading'
                ? { type, data: { text: seed } }
                : type === 'text'
                  ? { type, data: { content: seed } }
                  : { type, data: { quote: seed } }

          const result = appendSmartVariableToBlock(block, variable)
          const fieldValue =
            result.type === 'hero'
              ? result.data.title
              : result.type === 'heading'
                ? result.data.text
                : result.type === 'text'
                  ? result.data.content
                  : result.data.quote

          expect(typeof fieldValue).toBe('string')
          expect((fieldValue as string).includes(variable)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('should keep unsupported block types untouched', () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 20 }), variableArb, (type, variable) => {
        if (['hero', 'heading', 'text', 'testimonial'].includes(type)) {
          return
        }

        const block = { type, data: { content: 'seed' } }
        const result = appendSmartVariableToBlock(block, variable)
        expect(result).toEqual(block)
      }),
      { numRuns: 100 }
    )
  })
})
