const DEFAULT_UNSPLASH_APP_NAME = 'aichartor';

/**
 * Resolves the UTM source identifier registered with the Unsplash developer app.
 */
export function getUnsplashUtmSource(): string {
  const configured = process.env.NEXT_PUBLIC_UNSPLASH_APP_NAME?.trim();
  return configured || DEFAULT_UNSPLASH_APP_NAME;
}

/**
 * Appends required Unsplash referral UTM parameters without clobbering existing query params.
 */
export function withUnsplashUtm(rawUrl?: string | null): string {
  const fallback = 'https://unsplash.com/';
  try {
    const parsed = new URL(rawUrl?.trim() || fallback);
    if (!parsed.hostname.endsWith('unsplash.com')) {
      return fallback;
    }
    parsed.searchParams.set('utm_source', getUnsplashUtmSource());
    parsed.searchParams.set('utm_medium', 'referral');
    return parsed.toString();
  } catch {
    const parsed = new URL(fallback);
    parsed.searchParams.set('utm_source', getUnsplashUtmSource());
    parsed.searchParams.set('utm_medium', 'referral');
    return parsed.toString();
  }
}

export const UNSPLASH_HOME_URL = withUnsplashUtm('https://unsplash.com/');
export const UNSPLASH_LICENSE_URL = withUnsplashUtm('https://unsplash.com/license');

/**
 * Fires a non-blocking download tracking event to our Next.js Unsplash endpoint
 * when a user selects, inserts, or applies an Unsplash image.
 */
export function trackUnsplashDownload(params: {
  downloadLocation?: string | null;
  photoId?: string | number | null;
}): void {
  const { downloadLocation, photoId } = params;
  if (!downloadLocation && !photoId) return;

  fetch('/api/unsplash/download', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      downloadLocation: downloadLocation || undefined,
      photoId: photoId || undefined,
    }),
    keepalive: true,
  }).catch((err) => {
    console.warn('Unsplash download track warning:', err);
  });
}
