'use client'

import { useReportWebVitals } from 'next/web-vitals'

export function WebVitalsReporter() {
  useReportWebVitals((metric) => {
    if (typeof window === 'undefined') return

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
