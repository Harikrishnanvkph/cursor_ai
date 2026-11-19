import { NextResponse } from 'next/server';

/**
 * Validates and forwards an Unsplash download-location ping to api.unsplash.com server-side.
 */
export async function forwardUnsplashDownloadTracking(
  accessKey: string,
  body: Record<string, any>
): Promise<NextResponse> {
  if (!accessKey) {
    return NextResponse.json({ error: 'Unsplash API key not configured' }, { status: 500 });
  }

  const downloadLocation = body?.downloadLocation || body?.download_location;
  const photoId = body?.photoId || body?.id;

  let targetUrl = downloadLocation;
  if (!targetUrl && photoId) {
    targetUrl = `https://api.unsplash.com/photos/${encodeURIComponent(String(photoId))}/download`;
  }

  if (!targetUrl || typeof targetUrl !== 'string') {
    return NextResponse.json({ error: 'Missing downloadLocation or photoId' }, { status: 400 });
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(targetUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid downloadLocation URL' }, { status: 400 });
  }

  if (parsedTarget.protocol !== 'https:' || parsedTarget.hostname !== 'api.unsplash.com') {
    return NextResponse.json({ error: 'Untrusted Unsplash download endpoint' }, { status: 400 });
  }

  const res = await fetch(parsedTarget.toString(), {
    cache: 'no-store',
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      'Accept-Version': 'v1',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn('Unsplash download track warning:', res.status, errText);
    return NextResponse.json({ success: false, status: res.status, details: errText }, { status: 200 });
  }

  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ success: true, url: data?.url });
}
