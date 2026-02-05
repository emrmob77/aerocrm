import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { resolveSwStrategy, selectCachesToDelete } from '@/lib/pwa/sw-cache-rules'

const methodArb = fc.constantFrom('GET', 'POST', 'PUT', 'PATCH', 'DELETE')
const sameOriginPathArb = fc.constantFrom(
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/icon.svg',
  '/dashboard',
  '/api/deals',
  '/api/monitoring/overview'
)
const originArb = fc.constantFrom('https://aero.test', 'https://app.aero-crm.test')

// Feature: aero-crm-platform, Property 25: Offline Veri Önbellekleme
describe('PWA property tests', () => {
  it('should classify service worker cache strategy consistently', () => {
    fc.assert(
      fc.property(methodArb, originArb, sameOriginPathArb, fc.boolean(), (method, origin, path, navigate) => {
        const strategy = resolveSwStrategy({
          method,
          requestMode: navigate ? 'navigate' : 'cors',
          requestUrl: `${origin}${path}`,
          appOrigin: origin,
        })

        if (method !== 'GET') {
          expect(strategy).toBe('ignore')
          return
        }

        if (navigate) {
          expect(strategy).toBe('network-first-navigation')
          return
        }

        if (path.startsWith('/api/')) {
          expect(strategy).toBe('network-first-api')
        } else {
          expect(strategy).toBe('stale-while-revalidate-static')
        }
      }),
      { numRuns: 100 }
    )
  })

  it('should ignore cross-origin requests and keep only active caches', () => {
    fc.assert(
      fc.property(
        originArb,
        fc.array(fc.string({ minLength: 1, maxLength: 24 }), { maxLength: 20 }),
        (origin, randomKeys) => {
          const crossOrigin = resolveSwStrategy({
            method: 'GET',
            requestMode: 'cors',
            requestUrl: 'https://external.example.com/file.js',
            appOrigin: origin,
          })

          expect(crossOrigin).toBe('ignore')

          const staticCache = 'aero-static-v2'
          const apiCache = 'aero-api-v1'
          const keys = Array.from(new Set([...randomKeys, staticCache, apiCache]))
          const toDelete = selectCachesToDelete(keys, staticCache, apiCache)

          expect(toDelete.includes(staticCache)).toBe(false)
          expect(toDelete.includes(apiCache)).toBe(false)
          expect(toDelete.every((key) => key !== staticCache && key !== apiCache)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
