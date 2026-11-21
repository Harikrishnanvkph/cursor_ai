import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/board', '/landing', '/editor', '/admin']

// Trusted geo headers injected by Vercel Edge, Cloudflare, CloudFront, etc.
const COUNTRY_HEADER_KEYS = [
  'x-vercel-ip-country',
  'cf-ipcountry',
  'x-country-code',
  'cloudfront-viewer-country',
  'x-appengine-country',
  'fastly-client-ip-country',
]

const REGION_COOKIE_NAME = 'aichartor_region'

function detectEdgeRegion(request: NextRequest): 'IN' | 'GLOBAL' | null {
  for (const headerKey of COUNTRY_HEADER_KEYS) {
    const value = request.headers.get(headerKey)?.trim().toUpperCase()
    if (value && value.length === 2 && value !== 'XX' && value !== 'T1') {
      return value === 'IN' ? 'IN' : 'GLOBAL'
    }
  }
  return null
}

function withRegionCookie(request: NextRequest, response: NextResponse): NextResponse {
  const detectedRegion = detectEdgeRegion(request)
  if (detectedRegion && request.cookies.get(REGION_COOKIE_NAME)?.value !== detectedRegion) {
    response.cookies.set(REGION_COOKIE_NAME, detectedRegion, {
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
      sameSite: 'lax',
      httpOnly: false,
    })
  }
  return response
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get('is_authenticated')

  // Skip auth redirect logic for auth pages to prevent any interference
  if (
    pathname === '/signin' ||
    pathname === '/signup' ||
    pathname === '/admin/signin' ||
    pathname.startsWith('/admin/signin/')
  ) {
    return withRegionCookie(request, NextResponse.next())
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
      const isAdminRoute = pathname.startsWith('/admin')
      const signInUrl = new URL(isAdminRoute ? '/admin/signin' : '/signin', request.url)
      // Save target path to redirect them back after successful sign-in
      signInUrl.searchParams.set('redirect', pathname + (request.nextUrl.search || ''))
      const response = NextResponse.redirect(signInUrl)
      // Prevent CDN, browser HTTP cache, or prefetch layers from caching auth-dependent redirects
      response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
      response.headers.set('Vary', 'Cookie')
      return withRegionCookie(request, response)
    }
  }

  return withRegionCookie(request, NextResponse.next())
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (search engine crawler directives)
     * - sitemap.xml (search engine XML sitemap)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|public).*)',
  ],
}
