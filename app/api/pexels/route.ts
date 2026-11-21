import { NextResponse } from 'next/server';
import { checkContentSafety } from '@/lib/safety/content-filter';
import { guardApiRoute, clampInt, fetchWithTimeout } from '@/lib/utils/api-route-guard';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

export async function GET(request: Request) {
  const denied = guardApiRoute(request, { limit: 60 });
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query')?.trim() || '').slice(0, 120);
    const page = clampInt(searchParams.get('page'), 1, 1, 100);
    const perPage = clampInt(searchParams.get('per_page'), 20, 1, 80);
    const orientation = searchParams.get('orientation'); // landscape, portrait, square

    // SafeSearch / Content moderation check
    if (query) {
      const safety = checkContentSafety(query);
      if (safety.isDisallowed) {
        return NextResponse.json({
          total_results: 0,
          page: 1,
          per_page: perPage,
          photos: [],
          warning: safety.reason || 'Search blocked by content moderation policy.',
        });
      }
    }

    if (!PEXELS_API_KEY) {
      console.error('PEXELS_API_KEY is not configured');
      return NextResponse.json({ error: 'Pexels API key not configured' }, { status: 500 });
    }

    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });
    if (orientation) {
      params.set('orientation', orientation);
    }

    let url: string;
    if (query) {
      params.set('query', query);
      url = `https://api.pexels.com/v1/search?${params.toString()}`;
    } else {
      url = `https://api.pexels.com/v1/curated?${params.toString()}`;
    }

    const res = await fetchWithTimeout(url, {
      headers: {
        Authorization: PEXELS_API_KEY,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Pexels API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch images from Pexels' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error: any) {
    console.error('Error in Pexels proxy route:', error);
    return NextResponse.json(
      { error: 'Internal server error while calling Pexels' },
      { status: 500 }
    );
  }
}
