import { NextResponse } from 'next/server';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || 'YxCw07HI-V889DBTU5J2y2tRaEf_V0Cc8GFWjLCSUZY';

/**
 * Dedicated endpoint for Unsplash Download Tracking (Requirement for API compliance)
 * POST /api/unsplash/download
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
