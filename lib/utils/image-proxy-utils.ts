// Utility for routing restricted images through the backend proxy
import { api } from '../api';

/**
 * Checks if a URL requires proxying to bypass CORS or hotlinking protection
 * Now proxies all external URLs to ensure exports work flawlessly
 */
export function requiresProxy(url: string): boolean {
    if (!url) return false;

    try {
        const parsedUrl = new URL(url);
        // Don't proxy if it's already using our proxy or if it's the backend API URL
        const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';
        if (url.startsWith(apiUrl) || parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1') {
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
 * It uses the session token to authenticate to the backend proxy route.
 */
export function getProxiedImageUrl(originalUrl: string): string {
    if (!requiresProxy(originalUrl)) {
        return originalUrl;
    }

    // Base URL resolution handling relative to the frontend origin vs backend API
    // Get API URL base
    const apiUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

    // Return the full proxy URL
    return `${apiUrl}/api/proxy/image?url=${encodeURIComponent(originalUrl)}`;
}
