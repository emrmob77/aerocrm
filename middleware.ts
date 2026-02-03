import { NextResponse } from 'next/server'
import type { NextRequest, NextFetchEvent } from 'next/server'

export function middleware(_: NextRequest, __: NextFetchEvent) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
