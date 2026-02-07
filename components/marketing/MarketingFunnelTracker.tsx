'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackMarketingEvent } from '@/lib/analytics/marketing-events'

const pageViewEventMap: Record<string, string> = {
  '/': 'landing_view',
  '/pricing': 'pricing_view',
  '/features': 'features_view',
  '/platform/integrations': 'integrations_view',
  '/security': 'security_view',
  '/faq': 'faq_view',
  '/contact': 'contact_view',
  '/book-demo': 'book_demo_view',
  '/checkout/retry': 'checkout_retry_view',
  '/checkout/pending': 'checkout_pending_view',
  '/checkout/success': 'checkout_success_view',
  '/checkout/cancel': 'checkout_cancel_view',
}

export function MarketingFunnelTracker() {
  const pathname = usePathname()

  useEffect(() => {
    const normalizedPath = pathname || '/'
    const eventName = pageViewEventMap[normalizedPath] || 'marketing_page_view'

    trackMarketingEvent(
      {
        path: `/funnel/view/${eventName}`,
        method: 'FUNNEL_VIEW',
      },
      { dedupeKey: `view:${normalizedPath}` }
    )
  }, [pathname])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      const element = target?.closest<HTMLElement>('[data-funnel-event]')
      if (!element) return

      const eventName = element.dataset.funnelEvent
      if (!eventName) return

      trackMarketingEvent({
        path: `/funnel/cta/${eventName}`,
        method: 'FUNNEL_CTA',
      })
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
