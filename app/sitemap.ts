import type { MetadataRoute } from 'next'
import { getMarketingSiteUrl } from '@/lib/marketing/seo'

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getMarketingSiteUrl()
  const now = new Date()

  const paths = [
    '/',
    '/pricing',
    '/features',
    '/platform/integrations',
    '/security',
    '/faq',
    '/contact',
    '/book-demo',
    '/help',
    '/terms',
    '/privacy',
    '/login',
    '/register',
  ]

  return paths.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === '/' ? 'daily' : 'weekly',
    priority: path === '/' ? 1 : path === '/pricing' ? 0.9 : 0.7,
  }))
}
