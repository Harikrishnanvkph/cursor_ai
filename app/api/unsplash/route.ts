import { NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'YxCw07HI-V889DBTU5J2y2tRaEf_V0Cc8GFWjLCSUZY';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(parseInt(searchParams.get('per_page') || '24', 10), 30);
    const orientation = searchParams.get('orientation'); // landscape, portrait, squarish

    if (!UNSPLASH_ACCESS_KEY) {
      console.error('UNSPLASH_ACCESS_KEY is not configured');
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    const headers = {
      Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
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
      });
      url = `https://api.unsplash.com/photos?${params.toString()}`;
    }

    const res = await fetch(url, {
      headers,
      next: { revalidate: 300 }, // Cache for 5 minutes to conserve quota
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Unsplash API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch images from Unsplash', details: errorText },
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
        html: p.links?.html,
        download: p.links?.download,
        download_location: p.links?.download_location,
      },
      user: {
        id: p.user?.id,
        name: p.user?.name || 'Unsplash Photographer',
        username: p.user?.username,
        portfolio_url: p.user?.portfolio_url,
        links: {
          html: p.user?.links?.html || `https://unsplash.com/@${p.user?.username || ''}`,
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
      authorName: firstPhoto?.user?.name || null,
      authorLink: firstPhoto?.user?.links?.html || null,
      blurHash: firstPhoto?.blur_hash || null,
    });
  } catch (error: any) {
    console.error('Error in Unsplash proxy route:', error);
    return NextResponse.json(
      { error: 'Internal server error while calling Unsplash', message: error?.message },
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
  try {
    if (!UNSPLASH_ACCESS_KEY) {
      return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 });
    }

    const body = await request.json().catch(() => ({}));
    const downloadLocation = body.downloadLocation || body.download_location;
    const photoId = body.photoId || body.id;

    let targetUrl = downloadLocation;
    if (!targetUrl && photoId) {
      targetUrl = `https://api.unsplash.com/photos/${photoId}/download`;
    }

    if (!targetUrl) {
      return NextResponse.json({ error: 'Missing downloadLocation or photoId' }, { status: 400 });
    }

    // Unsplash requires authorization header on the download_location call
    const res = await fetch(targetUrl, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Unsplash download track warning:', res.status, errText);
      return NextResponse.json({ success: false, status: res.status, details: errText }, { status: 200 });
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, url: data?.url });
  } catch (error: any) {
    console.error('Error tracking Unsplash download:', error);
    return NextResponse.json(
      { error: 'Failed to record download event', message: error?.message },
      { status: 500 }
    );
  }
}
