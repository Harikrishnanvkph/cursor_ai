import { NextResponse } from 'next/server';
import { checkContentSafety, isDisallowedContent } from '@/lib/safety/content-filter';
import { guardApiRoute, clampInt, fetchWithTimeout } from '@/lib/utils/api-route-guard';

const PIXABAY_API_KEY = process.env.PIXABAY_API_KEY;

const ALLOWED_IMAGE_TYPES = new Set(['all', 'photo', 'illustration', 'vector']);

export async function GET(request: Request) {
  const denied = guardApiRoute(request, { limit: 60 });
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get('query')?.trim() || '').slice(0, 100);
    const page = clampInt(searchParams.get('page'), 1, 1, 100);
    // Pixabay API strictly requires per_page between 3 and 200
    const perPage = clampInt(searchParams.get('per_page'), 24, 3, 50);
    const orientation = searchParams.get('orientation') || '';
    const requestedType = searchParams.get('image_type') || 'all';
    const imageType = ALLOWED_IMAGE_TYPES.has(requestedType) ? requestedType : 'all';

    // SafeSearch / Content moderation check
    if (query) {
      const safety = checkContentSafety(query);
      if (safety.isDisallowed) {
        return NextResponse.json({
          total: 0,
          page: 1,
          per_page: perPage,
          photos: [],
          results: [],
          warning: safety.reason || 'Search blocked by content moderation policy.',
        });
      }
    }

    if (!PIXABAY_API_KEY) {
      console.error('PIXABAY_API_KEY is not configured');
      return NextResponse.json({ error: 'Pixabay API key not configured' }, { status: 500 });
    }

    const params = new URLSearchParams({
      key: PIXABAY_API_KEY,
      page: page.toString(),
      per_page: perPage.toString(),
      image_type: imageType,
      safesearch: 'true',
      order: 'popular',
    });

    if (query) {
      params.set('q', query);
    }

    if (orientation === 'landscape') {
      params.set('orientation', 'horizontal');
    } else if (orientation === 'portrait') {
      params.set('orientation', 'vertical');
    }

    const url = `https://pixabay.com/api/?${params.toString()}`;

    const res = await fetchWithTimeout(url, {
      next: { revalidate: 86400 }, // Respect Pixabay caching guidelines (minimum 24h)
    });

    if (!res.ok) {
      console.error('Pixabay API error:', res.status);
      return NextResponse.json(
        { error: 'Failed to fetch images from Pixabay' },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawHits: any[] = Array.isArray(data?.hits) ? data.hits : [];

    const photos = rawHits
      .filter((hit: any) => {
        const text = `${hit.tags || ''} ${hit.name || ''} ${hit.user || ''}`;
        return !isDisallowedContent(text);
      })
      .map((hit: any) => ({
        id: hit.id,
        width: hit.imageWidth || hit.webformatWidth || 800,
        height: hit.imageHeight || hit.webformatHeight || 600,
        url: hit.pageURL || 'https://pixabay.com',
        thumbUrl: hit.webformatURL || hit.previewURL,
        fullUrl: hit.largeImageURL || hit.webformatURL,
        avgColor: '#e2e8f0',
        alt: hit.name || hit.tags || 'Pixabay Image',
        photographerName: hit.user || 'Pixabay Contributor',
        photographerUrl: hit.pageURL || hit.userURL || 'https://pixabay.com',
        source: 'pixabay',
        imageType: hit.type || 'photo',
        license: 'Pixabay Content License',
      }));

    return NextResponse.json({
      total: typeof data?.totalHits === 'number' ? data.totalHits : photos.length,
      page,
      per_page: perPage,
      photos,
      results: photos,
    }, {
      headers: { 'Cache-Control': 'private, max-age=300' },
    });
  } catch (error: any) {
    console.error('Error in Pixabay proxy route:', error);
    return NextResponse.json(
      { error: 'Internal server error while calling Pixabay' },
      { status: 500 }
    );
  }
}
