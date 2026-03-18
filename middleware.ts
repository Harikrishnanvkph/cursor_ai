import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/landing', '/editor', '/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Debug logging (remove in production)
  console.log(`🔍 Middleware: ${pathname}`)

  // Skip middleware entirely for auth pages to prevent any interference
  if (pathname === '/signin' || pathname === '/signup') {
    console.log(`✅ Auth page detected, skipping middleware entirely: ${pathname}`)
    return NextResponse.next()
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    console.log(`🔒 Protected route detected: ${pathname}`)

    // Check for authentication cookie set by the frontend (AuthProvider)
    // We cannot read backend cookies (access_token) directly when deployed on different domains (Netlify vs Render)
    const authCookie = request.cookies.get('is_authenticated')

    if (!authCookie) {
      console.log(`❌ No auth cookie found, redirecting to signin`)

      // Just redirect to signin page without redirect parameter to prevent loops
      console.log(`🔄 Redirecting to: /signin`)
      return NextResponse.redirect(new URL('/signin', request.url))
    } else {
      console.log(`✅ Auth cookie found, allowing access`)
    }
  }

  // For unknown routes, let Next.js handle them (will show 404 page)
  // We don't need to do anything special here as Next.js will automatically
  // show our custom not-found.tsx page for unmatched routes

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
