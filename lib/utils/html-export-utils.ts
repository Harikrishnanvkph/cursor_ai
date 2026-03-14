import { getProxiedImageUrl, requiresProxy } from "./image-proxy-utils";

/**
 * Fetches an image URL and converts it to a Base64 Data URI.
 * This is essential for HTML exports so that images are bundled within the standalone file
 * and don't rely on external requests (which might fail due to CORS or be blocked).
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
    if (!url) return '';
    if (url.startsWith('data:image/')) return url; // Already base64

    try {
        // If it's a restricted URL, we must fetch from our proxy rather than directly
        const fetchUrl = requiresProxy(url) ? getProxiedImageUrl(url) : url;

        // Fetch the image as a blob
        const response = await fetch(fetchUrl);
        if (!response.ok) {
            console.warn(`[Base64Convert] Failed to fetch image ${fetchUrl}: ${response.status}`);
            return url; // Fallback to original URL
        }

        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    resolve(url); // Fallback
                }
            };
            reader.onerror = () => {
                console.warn(`[Base64Convert] FileReader failed for ${fetchUrl}`);
                resolve(url); // Fallback
            };
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn(`[Base64Convert] Exception fetching image ${url}:`, error);
        return url; // Fallback to original URL if fetching fails (e.g., CORS block on a direct non-proxied image)
    }
}

/**
 * Scans a chart dataset and configuration object to find all image URLs 
 * (pointImages, overlay images) and replaces them with Base64 Data URIs.
 * Returns cloned objects to avoid mutating the live chart state.
 */
export async function embedImagesAsBase64(
    chartData: any,
    chartConfig: any,
    updateStatusCallback?: (status: string) => void
): Promise<{ chartData: any, chartConfig: any }> {
    // Deep clone to avoid mutating the original state
    const newChartData = JSON.parse(JSON.stringify(chartData));
    const newChartConfig = JSON.parse(JSON.stringify(chartConfig));

    // 1. Process Dataset Point Images
    if (newChartData?.datasets && Array.isArray(newChartData.datasets)) {
        for (let dsIndex = 0; dsIndex < newChartData.datasets.length; dsIndex++) {
            const dataset = newChartData.datasets[dsIndex];
            if (dataset.pointImages && Array.isArray(dataset.pointImages)) {
                for (let i = 0; i < dataset.pointImages.length; i++) {
                    const url = dataset.pointImages[i];
                    if (url && typeof url === 'string' && !url.startsWith('data:image/')) {
                        updateStatusCallback?.(`Embedding point image ${i + 1}/${dataset.pointImages.length}...`);
                        dataset.pointImages[i] = await fetchImageAsBase64(url);
                    }
                }
            }
        }
    }

    // 2. Process Overlay Images
    if (newChartConfig?.plugins?.overlay?.images && Array.isArray(newChartConfig.plugins.overlay.images)) {
        const images = newChartConfig.plugins.overlay.images;
        for (let i = 0; i < images.length; i++) {
            const url = images[i].url;
            if (url && typeof url === 'string' && !url.startsWith('data:image/')) {
                updateStatusCallback?.(`Embedding overlay image ${i + 1}/${images.length}...`);
                images[i].url = await fetchImageAsBase64(url);
            }
        }
    }

    // 3. Process Generic Background Image (if any standard chart plugin uses it)
    if (newChartConfig?.plugins?.customCanvasBackgroundColor?.image) {
        const url = newChartConfig.plugins.customCanvasBackgroundColor.image;
        if (url && typeof url === 'string' && !url.startsWith('data:image/')) {
            updateStatusCallback?.(`Embedding background image...`);
            newChartConfig.plugins.customCanvasBackgroundColor.image = await fetchImageAsBase64(url);
        }
    }

    updateStatusCallback?.('Finished embedding images.');
    return { chartData: newChartData, chartConfig: newChartConfig };
}
