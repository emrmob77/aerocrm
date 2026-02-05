import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  buildCatalogStats,
  filterCatalogProducts,
  productMatchesCatalogFilters,
  type CatalogProduct,
} from '@/lib/products/catalog-utils'

const productArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 120 }),
  description: fc.string({ maxLength: 300 }),
  price: fc.integer({ min: 0, max: 10_000_000 }),
  currency: fc.constantFrom('TRY', 'USD', 'EUR', 'GBP'),
  category: fc.option(fc.string({ minLength: 1, maxLength: 24 }), { nil: null }),
  isActive: fc.boolean(),
  createdAt: fc.date().map((value) => value.toISOString()),
  updatedAt: fc.date().map((value) => value.toISOString()),
})

describe('Product catalog property tests', () => {
  it('Property 14: catalog filters should keep products accessible and consistent', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(productArb, { selector: (product) => product.id, maxLength: 120 }),
        fc.string({ maxLength: 60 }),
        fc.boolean(),
        (products, searchQuery, showOnlyActive) => {
          const categoryCandidates = Array.from(
            new Set(['all', 'uncategorized', ...products.map((product) => product.category ?? 'uncategorized')])
          )

          for (const selectedCategory of categoryCandidates.slice(0, 12)) {
            const filtered = filterCatalogProducts(products, {
              selectedCategory,
              searchQuery,
              showOnlyActive,
            })

            const filteredIds = new Set(filtered.map((item) => item.id))
            expect(filtered.length).toBeLessThanOrEqual(products.length)
            for (const product of products) {
              const matches = productMatchesCatalogFilters(product, {
                selectedCategory,
                searchQuery,
                showOnlyActive,
              })
              expect(filteredIds.has(product.id)).toBe(matches)
            }
          }

          const noFilter = filterCatalogProducts(products, {
            selectedCategory: 'all',
            searchQuery: '',
            showOnlyActive: false,
          })
          expect(noFilter.length).toBe(products.length)

          for (const product of products.slice(0, 12)) {
            const byOwnName = filterCatalogProducts(products, {
              selectedCategory: product.category ?? 'uncategorized',
              searchQuery: product.name,
              showOnlyActive: false,
            })
            expect(byOwnName.some((item) => item.id === product.id)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('Property 14: catalog stats should stay bounded and exact', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(productArb, { selector: (product) => product.id, maxLength: 200 }),
        (products) => {
          const stats = buildCatalogStats(products as CatalogProduct[])
          expect(stats.total).toBe(products.length)
          expect(stats.active).toBeGreaterThanOrEqual(0)
          expect(stats.active).toBeLessThanOrEqual(products.length)
          expect(stats.categories).toBeGreaterThanOrEqual(0)
          expect(stats.categories).toBeLessThanOrEqual(products.length === 0 ? 0 : products.length)
          expect(stats.currencies).toBeGreaterThanOrEqual(0)
          expect(stats.currencies).toBeLessThanOrEqual(products.length === 0 ? 0 : products.length)
        }
      )
    )
  })
})
