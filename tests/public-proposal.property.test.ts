import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { applySignatureToBlocks } from '@/lib/proposals/signature-utils'

type AnyBlock = {
  type: string
  data?: Record<string, unknown>
}

const signatureBlockArb = fc.record({
  type: fc.constant('signature'),
  data: fc.record(
    {
      label: fc.option(fc.string(), { nil: undefined }),
      required: fc.option(fc.boolean(), { nil: undefined }),
      signatureImage: fc.option(fc.string(), { nil: undefined }),
      signedName: fc.option(fc.string(), { nil: undefined }),
      signedAt: fc.option(fc.string(), { nil: undefined }),
    },
    { withDeletedKeys: true }
  ),
}) as fc.Arbitrary<AnyBlock>

const genericBlockArb = fc.record({
  type: fc.constantFrom('hero', 'text', 'pricing', 'timeline', 'cta'),
  data: fc.dictionary(fc.string({ minLength: 1, maxLength: 10 }), fc.string()),
}) as fc.Arbitrary<AnyBlock>

const blocksArb = fc.array(fc.oneof(signatureBlockArb, genericBlockArb), { maxLength: 25 })
const signatureValueArb = fc.string({ minLength: 8, maxLength: 200 })
const nameArb = fc.string({ minLength: 1, maxLength: 64 })
const signedAtArb = fc.date().map((date) => date.toISOString())

// Feature: aero-crm-platform, Property 10: İmza Kaydetme Tutarlılığı
describe('Public Proposal Signature Consistency', () => {
  it('should update only signature blocks and keep operation idempotent', () => {
    fc.assert(
      fc.property(blocksArb, signatureValueArb, nameArb, signedAtArb, (blocks, signature, name, signedAt) => {
        const first = applySignatureToBlocks(blocks, signature, name, signedAt)
        const second = applySignatureToBlocks(first.blocks as AnyBlock[], signature, name, signedAt)

        expect(second.blocks).toEqual(first.blocks)
        expect(first.blocks).toHaveLength(blocks.length)

        blocks.forEach((block, index) => {
          const next = first.blocks[index] as AnyBlock
          if (block.type !== 'signature') {
            expect(next).toEqual(block)
            return
          }
          expect(next.type).toBe('signature')
          expect(next.data?.signatureImage).toBe(signature)
          expect(next.data?.signedName).toBe(name)
          expect(next.data?.signedAt).toBe(signedAt)
        })
      }),
      { numRuns: 100 }
    )
  })
})
