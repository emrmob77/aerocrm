import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/deals',
  '/contacts',
  '/proposals',
  '/analytics',
  '/settings',
  '/products',
  '/reports',
  '/sales',
  '/webhooks',
  '/integrations',
]

// Auth routes (redirect to dashboard if already logged in)
const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password']

// Public routes (always accessible)
const publicRoutes = ['/', '/p', '/auth/callback']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    const { response, user } = await updateSession(request)

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    )

    // Check if the route is an auth route
    const isAuthRoute = authRoutes.some(route =>
      pathname === route || pathname.startsWith(route)
    )

    // Check if the route is public
    const isPublicRoute = publicRoutes.some(route =>
      pathname === route || pathname.startsWith(route)
    )

    const isPasswordRecovery =
      pathname.startsWith('/reset-password') &&
      request.nextUrl.searchParams.get('recovery') === '1'

    // If user is not authenticated and trying to access protected route
    if (!user && isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // If user is authenticated and trying to access auth routes
    if (user && isAuthRoute && !isPasswordRecovery) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    return response
  } catch (error) {
    console.error('Middleware auth error:', error)

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some(route =>
      pathname.startsWith(route)
    )

    // For protected routes, redirect to login on error (fail secure)
    if (isProtectedRoute) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // For other routes, allow access
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
