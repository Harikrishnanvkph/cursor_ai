import { NextResponse } from 'next/server';
import { checkContentSafety, isDisallowedContent } from '@/lib/safety/content-filter';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query')?.trim() || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const perPage = Math.min(Math.max(1, parseInt(searchParams.get('per_page') || '24', 10) || 24), 40);
    // Use matching window size for gsroffset & gsrlimit so consecutive pages never overlap
    const gsrLimit = Math.min(perPage, 50);
    const offset = (page - 1) * gsrLimit;

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

    const baseTerm = query || 'nature landscape';
    // Scope search via globally safe Wikimedia zero-attribution license categories
    // so CirrusSearch matches relevance on the user's query while returning Public Domain / CC0 images
    const searchTerm = `${baseTerm} filetype:bitmap incategory:CC-Zero|PD-self|PD-author|CC-PD-Mark|PD_NASA|PD_US_Government|PD-USGov|PD_Old|PD-EUGov`;

    const params = new URLSearchParams({
      action: 'query',
      generator: 'search',
      gsrsearch: searchTerm,
      gsrnamespace: '6', // File: namespace
      gsrlimit: gsrLimit.toString(),
      gsroffset: offset.toString(),
      prop: 'imageinfo',
      iiprop: 'url|size|extmetadata',
      iiurlwidth: '500', // Generate 500px thumbnail
      format: 'json',
    });

    const url = `https://commons.wikimedia.org/w/api.php?${params.toString()}`;

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AIChartor/1.0 (contact@aichartor.com)',
      },
      next: { revalidate: 300 }, // 5 min cache
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Wikimedia API error:', res.status, errText);
      return NextResponse.json(
        { error: 'Failed to fetch images from Wikimedia Commons', details: errText },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rawPages = (data?.query?.pages ? Object.values(data.query.pages) : [])
      .sort((a: any, b: any) => (a.index ?? 999999) - (b.index ?? 999999));

    const photos = rawPages
      .filter((p: any) => p.imageinfo && p.imageinfo.length > 0)
      .filter((p: any) => {
        const info = p.imageinfo[0];
        // Skip ultra-tiny favicon-sized bitmaps (< 32px) that render blurry
        if (info.width && info.height && (info.width < 32 || info.height < 32)) {
          return false;
        }
        // Enforce SafeSearch by filtering any titles or descriptions that contain explicit keywords
        const title = p.title || '';
        const meta = p.imageinfo?.[0]?.extmetadata || {};
        const desc = meta.ImageDescription?.value || '';
        if (isDisallowedContent(title) || isDisallowedContent(desc)) return false;

        // Only allow zero-attribution images (Public Domain / CC0) so end users never need to attribute
        const attrReq = (meta.AttributionRequired?.value || '').toLowerCase().trim();
        const licenseShort = (meta.LicenseShortName?.value || '').toLowerCase().trim();
        const usageTerms = (meta.UsageTerms?.value || '').toLowerCase().trim();
        const combinedLicense = `${licenseShort} ${usageTerms}`;

        if (
          combinedLicense.includes('cc by') ||
          combinedLicense.includes('cc-by') ||
          combinedLicense.includes('gfdl') ||
          combinedLicense.includes('non-free') ||
          combinedLicense.includes('copyrighted')
        ) {
          return false;
        }
        if (attrReq === 'false') return true;
        return (
          combinedLicense.includes('public domain') ||
          combinedLicense.includes('cc0') ||
          combinedLicense.includes('cc-zero') ||
          combinedLicense.includes('no restrictions') ||
          licenseShort.startsWith('pd')
        );
      })
      .slice(0, perPage)
      .map((p: any) => {
        const info = p.imageinfo[0];
        const meta = info.extmetadata || {};
        const rawArtist = meta.Artist?.value || meta.Credit?.value || 'Wikimedia Contributor';
        const artist = rawArtist.replace(/<[^>]*>?/gm, '').trim().slice(0, 40) || 'Wikimedia Contributor';
        const cleanTitle = (p.title || '').replace(/^File:/, '').replace(/\.[^/.]+$/, '');

        return {
          id: p.pageid?.toString() || p.title,
          width: info.width || 800,
          height: info.height || 600,
          url: info.descriptionurl || 'https://commons.wikimedia.org',
          thumbUrl: info.thumburl || info.url,
          fullUrl: info.url,
          avgColor: '#e2e8f0',
          alt: cleanTitle || 'Wikimedia Commons Image',
          photographerName: artist,
          photographerUrl: info.descriptionurl || 'https://commons.wikimedia.org',
          source: 'wikimedia',
          license: meta.LicenseShortName?.value || 'Creative Commons / Public Domain',
        };
      });

    const totalHits = data?.query?.searchinfo?.totalhits;

    return NextResponse.json({
      total: typeof totalHits === 'number' ? totalHits : photos.length,
      page,
      per_page: perPage,
      photos,
      results: photos,
    });
  } catch (error: any) {
    console.error('Error in Wikimedia proxy route:', error);
    return NextResponse.json(
      { error: 'Internal server error while calling Wikimedia Commons', message: error?.message },
      { status: 500 }
    );
  }
}
