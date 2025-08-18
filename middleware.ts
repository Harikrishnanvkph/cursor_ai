import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/landing', '/editor']

// Routes that are always accessible
const publicRoutes = ['/', '/signin', '/signup', '/about', '/pricing', '/docs']

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
    
    // Check for authentication cookie (using the actual cookie names from the server)
    const authCookie = request.cookies.get('access_token') || 
                      request.cookies.get('refresh_token')
    
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
