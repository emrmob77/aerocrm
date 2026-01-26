import { type NextRequest, NextResponse } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/deals', '/contacts', '/proposals', '/analytics', '/settings']

// Public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/forgot-password', '/p']

export async function middleware(request: NextRequest) {
  // Supabase kurulumu yapılana kadar basit middleware
  // Görev 3'te kimlik doğrulama eklenecek
  return NextResponse.next()
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
