import { NextResponse } from 'next/server';

const RATE_WINDOW_MS = 60_000;
const MAX_TRACKED_IPS = 5_000;

interface RateEntry {
  count: number;
  resetAt: number;
}

const rateBuckets = new Map<string, RateEntry>();

function pruneRateBuckets(now: number) {
  if (rateBuckets.size <= MAX_TRACKED_IPS) return;
  for (const [key, entry] of rateBuckets.entries()) {
    if (entry.resetAt <= now) {
      rateBuckets.delete(key);
    }
    if (rateBuckets.size <= MAX_TRACKED_IPS * 0.8) break;
  }
  while (rateBuckets.size >= MAX_TRACKED_IPS) {
    const oldestKey = rateBuckets.keys().next().value;
    if (!oldestKey) break;
    rateBuckets.delete(oldestKey);
  }
}

export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;
  return 'unknown';
}

function isSameOriginHeader(headerValue: string | null, expectedHost: string): boolean {
  if (!headerValue || !expectedHost) return false;
  try {
    const parsed = new URL(headerValue);
    return parsed.host.toLowerCase() === expectedHost.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Guard Next.js proxy/lookup API routes against unauthenticated external scraping and abuse
 * while supporting cross-domain auth cookies (`is_authenticated=true`) and same-origin browser calls.
 * Returns a NextResponse on rejection, or null when allowed.
 */
export function guardApiRoute(
  request: Request,
  options: { limit?: number } = {}
): NextResponse | null {
  const limit = options.limit ?? 60;
  const cookieHeader = request.headers.get('cookie') || '';
  const hasAuthCookie =
    /(?:^|;\s*)(?:is_authenticated=true|access_token=[^;]+)/i.test(cookieHeader);

  const requestHost = (
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host') ||
    ''
  )
    .split(',')[0]
    .trim()
    .toLowerCase();

  const secFetchSite = (request.headers.get('sec-fetch-site') || '').toLowerCase();
  const originHeader = request.headers.get('origin');
  const refererHeader = request.headers.get('referer');

  const isSameOrigin =
    secFetchSite === 'same-origin' ||
    isSameOriginHeader(originHeader, requestHost) ||
    isSameOriginHeader(refererHeader, requestHost);

  if (!hasAuthCookie && !isSameOrigin) {
    return NextResponse.json(
      { error: 'Unauthorized request origin' },
      { status: 403 }
    );
  }

  const now = Date.now();
  pruneRateBuckets(now);

  const ip = getClientIp(request);
  const existing = rateBuckets.get(ip);

  if (!existing || existing.resetAt <= now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return null;
  }

  existing.count += 1;
  if (existing.count > limit) {
    const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return NextResponse.json(
      { error: 'Too many requests. Please wait a moment and try again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSec) },
      }
    );
  }

  return null;
}

export function clampInt(
  rawValue: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = parseInt(rawValue || '', 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { next?: { revalidate?: number } } = {},
  timeoutMs = 10_000
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(timeoutMs);
  const signal = init.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;

  return fetch(url, {
    ...init,
    signal,
  });
}
