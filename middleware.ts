import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/monitoring/usage')) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/stripe/webhook')) {
    return NextResponse.next()
  }

  if (request.method === 'OPTIONS' || request.method === 'HEAD') {
    return NextResponse.next()
  }

  const usageUrl = new URL('/api/monitoring/usage', request.url)

  event.waitUntil(
    fetch(usageUrl, {
      method: 'POST',
      headers: {
        'x-aero-path': pathname,
        'x-aero-method': request.method,
        'x-aero-user-agent': request.headers.get('user-agent') || '',
        'x-forwarded-for': request.headers.get('x-forwarded-for') || '',
        'x-real-ip': request.headers.get('x-real-ip') || '',
        cookie: request.headers.get('cookie') || '',
      },
    }).catch(() => undefined)
  )

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
