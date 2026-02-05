import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { buildPublicProposalUrl, createProposalSlug } from '@/lib/proposals/link-utils'

// Feature: aero-crm-platform, Property 9: Benzersiz Teklif Linki Oluşturma
describe('Proposal Link Uniqueness', () => {
  it('should generate unique slugs for unique ids', () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.uuid(), { minLength: 1, maxLength: 300 }), (ids) => {
        const slugs = ids.map((id) => createProposalSlug(() => id))
        expect(new Set(slugs).size).toBe(ids.length)
        for (const slug of slugs) {
          expect(slug.length).toBeGreaterThan(0)
          expect(slug.includes('-')).toBe(false)
          expect(slug.includes('/')).toBe(false)
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should always build a valid public proposal url', () => {
    fc.assert(
      fc.property(fc.webUrl(), fc.uuid(), (origin, id) => {
        const slug = createProposalSlug(() => id)
        const url = buildPublicProposalUrl(origin, slug)
        expect(url.endsWith(`/p/${slug}`)).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
