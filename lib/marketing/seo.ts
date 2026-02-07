import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/messages'

export const getMarketingSiteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://aerocrm.com'

const toAbsoluteUrl = (path: string) => `${getMarketingSiteUrl()}${path}`

type BilingualText = {
  tr: string
  en: string
}

type MarketingSeoInput = {
  path: string
  title: BilingualText
  description: BilingualText
  noIndex?: boolean
}

export const buildMarketingMetadata = (locale: Locale, input: MarketingSeoInput): Metadata => {
  const title = locale === 'tr' ? input.title.tr : input.title.en
  const description = locale === 'tr' ? input.description.tr : input.description.en
  const canonical = toAbsoluteUrl(input.path)

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      type: 'website',
      url: canonical,
      title,
      description,
      siteName: 'AERO CRM',
      locale: locale === 'tr' ? 'tr_TR' : 'en_US',
      images: [
        {
          url: toAbsoluteUrl('/icon.svg'),
          alt: 'AERO CRM',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [toAbsoluteUrl('/icon.svg')],
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  }
}
