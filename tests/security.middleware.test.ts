import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

const createRequest = (url: string, init?: RequestInit) =>
  new NextRequest(new Request(url, init))

describe('API security middleware', () => {
  it('should append security headers for API responses', () => {
    const response = middleware(createRequest('http://localhost:3000/api/health'), {} as never)

    expect(response.headers.get('X-Frame-Options')).toBe('DENY')
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff')
    expect(response.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin')
    expect(response.headers.get('X-RateLimit-Limit')).toBeTruthy()
  })

  it('should reject unsafe cross-origin API requests', () => {
    const response = middleware(
      createRequest('http://localhost:3000/api/deals', {
        method: 'POST',
        headers: {
          origin: 'https://evil.example.com',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      }),
      {} as never
    )

    expect(response.status).toBe(403)
  })

  it('should allow same-origin unsafe API requests', () => {
    const response = middleware(
      createRequest('http://localhost:3000/api/deals', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      }),
      {} as never
    )

    expect(response.status).not.toBe(403)
  })
})
