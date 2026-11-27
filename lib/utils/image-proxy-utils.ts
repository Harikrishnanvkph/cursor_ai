// Utility for routing restricted images through the backend proxy

const UNSPLASH_HOTLINK_HOSTS = new Set(['images.unsplash.com', 'plus.unsplash.com']);

function isUnsplashHotlinkHost(hostname: string): boolean {
    return UNSPLASH_HOTLINK_HOSTS.has(hostname.toLowerCase());
}

/**
 * Our own Supabase public format-assets bucket already returns Access-Control-Allow-Origin: *
 * and compresses uploads to WebP at upload time, so full-size/export fetches don't need
 * to bounce through the backend serverless image proxy.
 */
function isDirectSupabaseFormatAsset(parsedUrl: URL): boolean {
    return (
        parsedUrl.hostname.toLowerCase().endsWith('.supabase.co') &&
        parsedUrl.pathname.startsWith('/storage/v1/object/public/format-assets/')
    );
}

/**
 * Checks if a URL requires proxying to bypass CORS or hotlinking protection
 * Proxies external URLs except Unsplash CDN hosts (required by Unsplash API guidelines)
 * and our own CORS-enabled Supabase format-assets storage bucket.
 */
export function requiresProxy(url: string): boolean {
    if (!url) return false;

    try {
        const parsedUrl = new URL(url);
        // Don't proxy if it's already using our proxy or if it's the backend API URL
        if (url.includes('/api/proxy/image')) {
            return false;
        }
        const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
        if (url.startsWith(apiUrl) || parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
            return false;
        }

        // Unsplash API guidelines require hotlinking directly from photo.urls (images.unsplash.com)
        if (isUnsplashHotlinkHost(parsedUrl.hostname)) {
            return false;
        }

        // Our own Supabase format-assets bucket already serves Access-Control-Allow-Origin: *
        if (isDirectSupabaseFormatAsset(parsedUrl)) {
            return false;
        }

        // Only proxy HTTP/HTTPS
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
        // If URL parsing fails (e.g. data URI, relative path), it likely doesn't need proxying
        return false;
    }
}

const QUANTIZED_IMAGE_WIDTHS = [320, 640, 1024, 1600, 2048] as const;

/**
 * Snaps requested image pixel widths to fixed cacheable buckets so zoom/resize
 * never triggers unique Sharp resize requests on every pixel tick.
 */
export function quantizeImageWidth(px: number): number {
    if (!Number.isFinite(px) || px <= 0) return 640;
    for (let i = 0; i < QUANTIZED_IMAGE_WIDTHS.length; i++) {
        if (px <= QUANTIZED_IMAGE_WIDTHS[i]) return QUANTIZED_IMAGE_WIDTHS[i];
    }
    return 2048;
}

/**
 * Returns the proxied URL if necessary, otherwise returns the original URL.
 * For Unsplash CDN URLs, hotlinks directly and maps resize/format options to Imgix query params.
 */
export function getProxiedImageUrl(
    originalUrl: string, 
    options?: { width?: number; quality?: number; format?: string }
): string {
    if (!originalUrl) {
        return originalUrl;
    }

    const quantizedWidth = options?.width ? quantizeImageWidth(options.width) : undefined;

    try {
        const parsed = new URL(originalUrl);
        if (
            (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
            isUnsplashHotlinkHost(parsed.hostname)
        ) {
            return originalUrl;
        }

        // For our own Supabase format-assets, serve directly for WebP >= 1200 or full-size renders
        if (
            (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
            isDirectSupabaseFormatAsset(parsed)
        ) {
            const isWebp = parsed.pathname.toLowerCase().endsWith('.webp');
            if (!quantizedWidth || (isWebp && quantizedWidth >= 1200)) {
                return originalUrl;
            }
            const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
            let resizedUrl = `${apiUrl}/api/proxy/image?url=${encodeURIComponent(originalUrl)}&width=${quantizedWidth}`;
            if (options?.quality) resizedUrl += `&quality=${options.quality}`;
            if (options?.format) resizedUrl += `&format=${options.format}`;
            return resizedUrl;
        }
    } catch {
        // Fall through for relative paths or data URIs
    }

    if (!requiresProxy(originalUrl)) {
        return originalUrl;
    }

    // Base URL resolution handling relative to the frontend origin vs backend API
    // Get API URL base
    const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

    // Build the proxy URL with query params
    let url = `${apiUrl}/api/proxy/image?url=${encodeURIComponent(originalUrl)}`;
    
    if (options) {
        if (quantizedWidth) url += `&width=${quantizedWidth}`;
        if (options.quality) url += `&quality=${options.quality}`;
        if (options.format) url += `&format=${options.format}`;
    }

    return url;
}

/**
 * Extracts the raw underlying image URL if the given URL is a proxied URL
 */
export function unwrapProxiedImageUrl(url: string): string {
    if (!url) return '';
    try {
        if (url.includes('/api/proxy/image') && url.includes('url=')) {
            const searchIndex = url.indexOf('url=');
            if (searchIndex !== -1) {
                const paramStr = url.substring(searchIndex + 4);
                const ampIndex = paramStr.indexOf('&');
                const encodedUrl = ampIndex !== -1 ? paramStr.substring(0, ampIndex) : paramStr;
                return decodeURIComponent(encodedUrl);
            }
        }
    } catch (e) {
        // Fallback to original URL
    }
    return url;
}
