import { useChartStore } from "../chart-store";
import { type SupportedChartType } from "../chart-store";
import { chartTypeMapping } from "../chart-store";
import type { HTMLExportOptions } from "./export-types";
import { processChartDataForExport, generateCustomLabelsFromConfig } from "./export-utils";

/**
 * Generate HTML with custom template
 */
export async function generateCustomChartHTML(template: string, options: HTMLExportOptions = {}) {
    const { chartType, chartData, chartConfig, chartMode, activeDatasetIndex, legendFilter } = useChartStore.getState();

    // Map custom chart types to actual Chart.js types
    const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;

    // Process chart data to convert images to base64
    const processedChartData = await processChartDataForExport(chartData);

    const effectiveConfig2 = JSON.parse(JSON.stringify(chartConfig));
    if (options.showLabels === false && effectiveConfig2.plugins?.customLabelsConfig) {
        effectiveConfig2.plugins.customLabelsConfig.display = false;
    }
    const customLabels = generateCustomLabelsFromConfig(effectiveConfig2, processedChartData, legendFilter, options.dragState);
    const enhancedChartConfig = {
        ...chartConfig,
        plugins: {
            ...chartConfig.plugins,
            customLabels: (options.showLabels === false) ? undefined : (customLabels.length > 0 ? {
                shapeSize: 32,
                labels: customLabels
            } : undefined)
        }
    };

    // Replace placeholders in template
    const htmlContent = template
        .replace(/\{\{chartType\}\}/g, mappedChartType)
        .replace(/\{\{chartData\}\}/g, JSON.stringify(processedChartData, null, 2))
        .replace(/\{\{chartConfig\}\}/g, JSON.stringify(enhancedChartConfig, null, 2))
        .replace(/\{\{title\}\}/g, options.title || 'Chart Export')
        .replace(/\{\{width\}\}/g, String(options.width || 800))
        .replace(/\{\{height\}\}/g, String(options.height || 600))
        .replace(/\{\{backgroundColor\}\}/g, options.backgroundColor || '#ffffff')
        .replace(/\{\{timestamp\}\}/g, new Date().toISOString())
        .replace(/\{\{date\}\}/g, new Date().toLocaleDateString());

    return {
        content: htmlContent,
        fileName: options.fileName || `custom-chart-${new Date().toISOString().slice(0, 10)}.html`,
        size: new Blob([htmlContent]).size
    };
}

/**
 * Generate minimal HTML (just the chart without extra styling)
 */
export function generateMinimalChartHTML(options: HTMLExportOptions = {}) {
    const { chartType, chartData, chartConfig, chartMode, activeDatasetIndex, legendFilter } = useChartStore.getState();

    // Map custom chart types to actual Chart.js types
    const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;

    const customLabels = generateCustomLabelsFromConfig(chartConfig, chartData, legendFilter, options.dragState);
    const enhancedChartConfig = {
        ...chartConfig,
        plugins: {
            ...chartConfig.plugins,
            customLabels: customLabels.length > 0 ? {
                shapeSize: 32,
                labels: customLabels
            } : undefined
        }
    };

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>${options.title || 'Chart'}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>
</head>
<body>
    <canvas id="chart" width="${options.width || 800}" height="${options.height || 600}"></canvas>
    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        new Chart(ctx, {
            type: '${mappedChartType}',
            data: ${JSON.stringify(chartData)},
            options: ${JSON.stringify(enhancedChartConfig)}
        });
    </script>
</body>
</html>`;

    return {
        content: htmlContent,
        fileName: options.fileName || `minimal-chart-${new Date().toISOString().slice(0, 10)}.html`,
        size: new Blob([htmlContent]).size
    };
}

/**
 * Generate HTML with embedded data (no external dependencies)
 */
export function generateEmbeddedChartHTML(options: HTMLExportOptions = {}) {
    const { chartType, chartData, chartConfig } = useChartStore.getState();

    // Map custom chart types to actual Chart.js types
    const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;

    // This would require embedding the entire Chart.js library
    // For now, we'll use CDN but with fallback
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${options.title || 'Embedded Chart'}</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .chart-container { max-width: 100%; overflow: hidden; }
        canvas { max-width: 100%; height: auto; }
    </style>
</head>
<body>
    <div class="chart-container">
        <canvas id="chart" width="${options.width || 800}" height="${options.height || 600}"></canvas>
    </div>
    
    <script>
        // Try to load Chart.js from CDN, with fallback
        function loadChartJS() {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js';
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        }
        
        loadChartJS().then(() => {
            const ctx = document.getElementById('chart').getContext('2d');
            new Chart(ctx, {
                type: '${mappedChartType}',
                data: ${JSON.stringify(chartData)},
                options: ${JSON.stringify(chartConfig)}
            });
        }).catch(() => {
            document.body.innerHTML = '<p>Error: Could not load Chart.js library</p>';
        });
    </script>
</body>
</html>`;

    return {
        content: htmlContent,
        fileName: options.fileName || `embedded-chart-${new Date().toISOString().slice(0, 10)}.html`,
        size: new Blob([htmlContent]).size
    };
}
