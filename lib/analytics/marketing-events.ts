'use client'

type FunnelMethod = 'FUNNEL_VIEW' | 'FUNNEL_CTA' | 'FUNNEL_FLOW'

type FunnelPayload = {
  path: string
  method: FunnelMethod
  status?: number
  duration_ms?: number
}

type WindowWithFunnelCache = Window & {
  __aeroFunnelEventCache?: Set<string>
}

const getEventCache = () => {
  const globalWindow = window as WindowWithFunnelCache
  if (!globalWindow.__aeroFunnelEventCache) {
    globalWindow.__aeroFunnelEventCache = new Set<string>()
  }
  return globalWindow.__aeroFunnelEventCache
}

export const trackMarketingEvent = (
  payload: FunnelPayload,
  options?: { dedupeKey?: string }
) => {
  if (typeof window === 'undefined') return

  if (options?.dedupeKey) {
    const cache = getEventCache()
    if (cache.has(options.dedupeKey)) return
    cache.add(options.dedupeKey)
  }

  fetch('/api/monitoring/usage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-aero-path': payload.path,
      'x-aero-method': payload.method,
      'x-aero-user-agent': navigator.userAgent,
    },
    body: JSON.stringify({
      path: payload.path,
      method: payload.method,
      status: payload.status ?? 200,
      duration_ms: payload.duration_ms ?? 0,
    }),
    keepalive: true,
  }).catch(() => undefined)
}
