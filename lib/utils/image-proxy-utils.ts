// Utility for routing restricted images through the backend proxy

const UNSPLASH_HOTLINK_HOSTS = new Set(['images.unsplash.com', 'plus.unsplash.com']);

function isUnsplashHotlinkHost(hostname: string): boolean {
    return UNSPLASH_HOTLINK_HOSTS.has(hostname.toLowerCase());
}

/**
 * Checks if a URL requires proxying to bypass CORS or hotlinking protection
 * Proxies external URLs except Unsplash CDN hosts, which must be hotlinked directly
 * per Unsplash API guidelines so CDN views are tracked accurately.
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

        // Only proxy HTTP/HTTPS
        return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
    } catch (e) {
        // If URL parsing fails (e.g. data URI, relative path), it likely doesn't need proxying
        return false;
    }
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

    try {
        const parsed = new URL(originalUrl);
        if (
            (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
            isUnsplashHotlinkHost(parsed.hostname)
        ) {
            if (!options) {
                return originalUrl;
            }
            if (options.width) parsed.searchParams.set('w', String(options.width));
            if (options.quality) parsed.searchParams.set('q', String(options.quality));
            if (options.format) {
                parsed.searchParams.set('fm', options.format);
                parsed.searchParams.set('auto', 'format');
            }
            return parsed.toString();
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
        if (options.width) url += `&width=${options.width}`;
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
