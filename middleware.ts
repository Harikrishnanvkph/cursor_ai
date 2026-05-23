import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/landing', '/editor', '/admin']

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const authCookie = request.cookies.get('is_authenticated')

  // Skip middleware entirely for auth pages to prevent any interference
  if (pathname === '/signin' || pathname === '/signup') {
    return NextResponse.next()
  }

  // Gemini Style: Redirect logged-in users visiting the root marketing page ('/')
  // directly to their workspace dashboard.
  if (pathname === '/') {
    if (authCookie) {
      // Robust redirect handling:
      // 1. If they have a custom ?redirect= or ?next= parameter, respect it.
      // 2. Otherwise, default to '/board' (Dashboard).
      const customRedirect = searchParams.get('redirect') || searchParams.get('next')
      let targetPath = '/board'

      if (customRedirect) {
        // Prevent open redirect vulnerabilities by ensuring it starts with '/' and not '//'
        const cleanPath = decodeURIComponent(customRedirect).trim()
        if (cleanPath.startsWith('/') && !cleanPath.startsWith('//')) {
          targetPath = cleanPath
        }
      }

      // Preserve other query parameters (e.g. oauth=success)
      const redirectUrl = new URL(targetPath, request.url)
      searchParams.forEach((value, key) => {
        if (key !== 'redirect' && key !== 'next') {
          redirectUrl.searchParams.set(key, value)
        }
      })

      return NextResponse.redirect(redirectUrl)
    }
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // SECURITY WARNING: This 'is_authenticated' cookie is set by the client and is trivially spoofable.
    // It serves ONLY as an optimistic UI redirect mechanism, NOT as a true security barrier.
    // Real security relies on the client-side <ProtectedRoute> waiting for authApi.me() verification
    // and the backend API strictly enforcing access tokens on data requests.
    // We cannot read backend cookies (access_token) directly when deployed on different domains.
    if (!authCookie) {
      const signInUrl = new URL('/signin', request.url)
      // Save target path to redirect them back after successful sign-in
      signInUrl.searchParams.set('redirect', pathname + (request.nextUrl.search || ''))
      return NextResponse.redirect(signInUrl)
    }
  }

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
