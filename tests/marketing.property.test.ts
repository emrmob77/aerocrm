import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { getMarketingCopy } from '@/lib/marketing/content'
import { buildFaqSchema, buildPricingProductSchemas, buildSoftwareApplicationSchema } from '@/lib/marketing/structured-data'

const localeArb = fc.constantFrom<'tr' | 'en'>('tr', 'en')

describe('Marketing property tests', () => {
  it('keeps pricing plan ids and counts aligned between locales', () => {
    const trPlans = getMarketingCopy('tr').pricing.plans
    const enPlans = getMarketingCopy('en').pricing.plans

    expect(trPlans.length).toBe(enPlans.length)
    expect(trPlans.map((plan) => plan.id)).toEqual(enPlans.map((plan) => plan.id))
    expect(trPlans.map((plan) => plan.id)).toEqual(['starter', 'growth', 'scale'])
  })

  it('returns non-empty copy blocks for any supported locale', () => {
    fc.assert(
      fc.property(localeArb, (locale) => {
        const copy = getMarketingCopy(locale)
        expect(copy.home.title.length).toBeGreaterThan(0)
        expect(copy.pricing.title.length).toBeGreaterThan(0)
        expect(copy.faq.items.length).toBeGreaterThan(0)
        expect(copy.contact.channels.length).toBeGreaterThan(0)
      }),
      { numRuns: 40 }
    )
  })

  it('builds valid pricing schema entries for each locale', () => {
    fc.assert(
      fc.property(localeArb, (locale) => {
        const schemas = buildPricingProductSchemas(locale)
        const plans = getMarketingCopy(locale).pricing.plans

        expect(schemas.length).toBe(plans.length)
        schemas.forEach((schema, index) => {
          expect(schema['@type']).toBe('Product')
          expect(schema.offers['@type']).toBe('Offer')
          expect(schema.offers.url).toMatch(/\/pricing$/)
          expect(schema.offers.price).toBe(plans[index].price.replace('$', ''))
        })
      }),
      { numRuns: 40 }
    )
  })

  it('builds FAQ and SoftwareApplication schema with required fields', () => {
    fc.assert(
      fc.property(localeArb, (locale) => {
        const faq = buildFaqSchema(locale)
        const software = buildSoftwareApplicationSchema(locale)

        expect(faq['@type']).toBe('FAQPage')
        expect(Array.isArray(faq.mainEntity)).toBe(true)
        expect(faq.mainEntity.length).toBeGreaterThan(0)

        expect(software['@type']).toBe('SoftwareApplication')
        expect(String(software.url)).toMatch(/^https?:\/\//)
        expect(software.offers['@type']).toBe('AggregateOffer')
      }),
      { numRuns: 40 }
    )
  })
})
