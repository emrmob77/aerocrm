'use client'

import { useReportWebVitals } from 'next/web-vitals'

type WindowWithVitalsCache = Window & {
  __aeroReportedWebVitals?: Set<string>
}

const getVitalsCache = () => {
  const globalWindow = window as WindowWithVitalsCache
  if (!globalWindow.__aeroReportedWebVitals) {
    globalWindow.__aeroReportedWebVitals = new Set<string>()
  }
  return globalWindow.__aeroReportedWebVitals
}

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return

    const cache = getVitalsCache()
    const dedupeKey = `${metric.id}:${metric.name}:${window.location.pathname}`
    if (cache.has(dedupeKey)) return
    cache.add(dedupeKey)

    const payload = {
      path: window.location.pathname,
      method: 'WEB_VITAL',
      status: 200,
      duration_ms: Math.round(metric.value),
    }

    fetch('/api/monitoring/usage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-aero-path': `/web-vitals/${metric.name.toLowerCase()}`,
        'x-aero-method': 'WEB_VITAL',
        'x-aero-user-agent': navigator.userAgent,
      },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => undefined)
  })

  return null
}
