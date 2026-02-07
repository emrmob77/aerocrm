import type { Locale } from '@/lib/i18n/messages'
import { getMarketingSiteUrl } from '@/lib/marketing/seo'
import { getMarketingCopy } from '@/lib/marketing/content'

const brandName = 'AERO CRM'

export const buildSoftwareApplicationSchema = (locale: Locale) => {
  const siteUrl = getMarketingSiteUrl()
  const copy = getMarketingCopy(locale)
  const prices = copy.pricing.plans
    .map((plan) => Number(plan.price.replace('$', '').trim()))
    .filter((value) => Number.isFinite(value))
  const lowPrice = prices.length > 0 ? Math.min(...prices) : 0
  const highPrice = prices.length > 0 ? Math.max(...prices) : 0

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: brandName,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: copy.home.subtitle,
    url: `${siteUrl}/`,
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: String(lowPrice),
      highPrice: String(highPrice),
      offerCount: String(copy.pricing.plans.length),
    },
  }
}

export const buildPricingProductSchemas = (locale: Locale) => {
  const siteUrl = getMarketingSiteUrl()
  const copy = getMarketingCopy(locale)

  return copy.pricing.plans.map((plan) => ({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${brandName} ${plan.name}`,
    description: plan.description,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/pricing`,
      priceCurrency: 'USD',
      price: plan.price.replace('$', ''),
      availability: 'https://schema.org/InStock',
    },
  }))
}

export const buildFaqSchema = (locale: Locale) => {
  const copy = getMarketingCopy(locale)

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: copy.faq.items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
