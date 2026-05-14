import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/landing', '/editor', '/admin']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware entirely for auth pages to prevent any interference
  if (pathname === '/signin' || pathname === '/signup') {
    return NextResponse.next()
  }

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {

    // SECURITY WARNING: This 'is_authenticated' cookie is set by the client and is trivially spoofable.
    // It serves ONLY as an optimistic UI redirect mechanism, NOT as a true security barrier.
    // Real security relies on the client-side <ProtectedRoute> waiting for authApi.me() verification
    // and the backend API strictly enforcing access tokens on data requests.
    // We cannot read backend cookies (access_token) directly when deployed on different domains.
    const authCookie = request.cookies.get('is_authenticated')

    if (!authCookie) {
      return NextResponse.redirect(new URL('/signin', request.url))
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
