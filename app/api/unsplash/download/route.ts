import { NextResponse } from 'next/server';
import { forwardUnsplashDownloadTracking } from '@/lib/utils/unsplash-server-utils';
import { guardApiRoute } from '@/lib/utils/api-route-guard';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';

/**
 * Dedicated endpoint for Unsplash Download Tracking (Requirement for API compliance)
 * POST /api/unsplash/download
 */
export async function POST(request: Request) {
  const denied = guardApiRoute(request, { limit: 60 });
  if (denied) return denied;

  try {
    const body = await request.json().catch(() => ({}));
    return await forwardUnsplashDownloadTracking(UNSPLASH_ACCESS_KEY, body);
  } catch (error: any) {
    console.error('Error tracking Unsplash download:', error);
    return NextResponse.json(
      { error: 'Failed to record download event' },
      { status: 500 }
    );
  }
}
