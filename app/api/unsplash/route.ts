import { NextResponse } from 'next/server';
import { checkContentSafety } from '@/lib/safety/content-filter';
import { withUnsplashUtm } from '@/lib/utils/unsplash-utils';
import { forwardUnsplashDownloadTracking } from '@/lib/utils/unsplash-server-utils';
import { guardApiRoute, clampInt, fetchWithTimeout } from '@/lib/utils/api-route-guard';

export async function GET(request: Request) {
  const denied = guardApiRoute(request, { limit: 60 });
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query')?.trim() || '').slice(0, 120);
    const page = clampInt(searchParams.get('page'), 1, 1, 100);
    const perPage = clampInt(searchParams.get('per_page'), 24, 1, 30);
    const orientation = searchParams.get('orientation'); // landscape, portrait, squarish

    // SafeSearch / Content moderation check
    if (query) {
      const safety = checkContentSafety(query);
      if (safety.isDisallowed) {
        return NextResponse.json({
          total: 0,
          total_pages: 0,
          page: 1,
          per_page: perPage,
          photos: [],
          results: [],
          url: null,
          authorName: null,
          authorLink: null,
          warning: safety.reason || 'Search blocked by content moderation policy.',
        });
      }
    }

    const accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    if (!accessKey) {
      console.error('UNSPLASH_ACCESS_KEY is not configured');
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    const headers = {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    };

    let url: string;
    let isSearch = false;

    if (query) {
      isSearch = true;
      const params = new URLSearchParams({
        query,
        page: page.toString(),
        per_page: perPage.toString(),
        content_filter: 'high', // Enforces strict SafeSearch filter on Unsplash
      });
      if (orientation && ['landscape', 'portrait', 'squarish'].includes(orientation)) {
        params.set('orientation', orientation);
      }
      url = `https://api.unsplash.com/search/photos?${params.toString()}`;
    } else {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        order_by: 'popular',
        content_filter: 'high', // Enforces strict SafeSearch filter on Unsplash
      });
      url = `https://api.unsplash.com/photos?${params.toString()}`;
    }

    const res = await fetchWithTimeout(url, {
      headers,
      next: { revalidate: 300 }, // Cache for 5 minutes to conserve quota
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Unsplash API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch images from Unsplash' },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Normalizing results: search returns { total, total_pages, results }, curated returns array
    const rawPhotos: any[] = isSearch ? (data.results || []) : (Array.isArray(data) ? data : []);
    const total = isSearch ? (data.total || 0) : 1000;
    const totalPages = isSearch ? (data.total_pages || 1) : 50;

    const photos = rawPhotos.map((p: any) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      color: p.color || '#e2e8f0',
      blur_hash: p.blur_hash,
      description: p.description,
      alt: p.alt_description || p.description || 'Unsplash photo',
      urls: {
        raw: p.urls?.raw,
        full: p.urls?.full,
        regular: p.urls?.regular,
        small: p.urls?.small,
        thumb: p.urls?.thumb,
      },
      links: {
        self: p.links?.self,
        html: withUnsplashUtm(p.links?.html),
        download: p.links?.download,
        download_location: p.links?.download_location,
      },
      user: {
        id: p.user?.id,
        name: p.user?.name || 'Unsplash Photographer',
        username: p.user?.username,
        portfolio_url: p.user?.portfolio_url,
        links: {
          html: withUnsplashUtm(
            p.user?.links?.html ||
              (p.user?.username ? `https://unsplash.com/@${p.user.username}` : 'https://unsplash.com/')
          ),
        },
        profile_image: {
          small: p.user?.profile_image?.small,
          medium: p.user?.profile_image?.medium,
        },
      },
    }));

    const firstPhoto = photos[0];

    return NextResponse.json({
      total,
      total_pages: totalPages,
      page,
      per_page: perPage,
      photos,
      results: photos,
      // Backward compatibility for existing ContentBankDrawer / FormatGallery callers:
      url: firstPhoto?.urls?.regular || null,
      photoId: firstPhoto?.id || null,
      authorName: firstPhoto?.user?.name || null,
      authorLink: firstPhoto?.user?.links?.html || null,
      unsplashLink: firstPhoto?.links?.html || withUnsplashUtm('https://unsplash.com/'),
      downloadLocation: firstPhoto?.links?.download_location || null,
      blurHash: firstPhoto?.blur_hash || null,
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error: any) {
    console.error('Error in Unsplash proxy route:', error);
    return NextResponse.json(
      { error: 'Internal server error while calling Unsplash' },
      { status: 500 }
    );
  }
}

/**
 * POST handler for Unsplash Download Tracking
 * Guideline Rule #2:
 * "When a photo is selected or downloaded, send a request to photo.links.download_location"
 */
export async function POST(request: Request) {
  const denied = guardApiRoute(request, { limit: 60 });
  if (denied) return denied;

  try {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY || '';
    const body = await request.json().catch(() => ({}));
    return await forwardUnsplashDownloadTracking(accessKey, body);
  } catch (error: any) {
    console.error('Error tracking Unsplash download:', error);
    return NextResponse.json(
      { error: 'Failed to record download event' },
      { status: 500 }
    );
  }
}
