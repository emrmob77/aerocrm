import type { MetadataRoute } from 'next'
import { getMarketingSiteUrl } from '@/lib/marketing/seo'

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getMarketingSiteUrl()

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard', '/settings', '/integrations', '/auth/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}
