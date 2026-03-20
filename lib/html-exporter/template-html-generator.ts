import { useChartStore } from "../chart-store";
import { type SupportedChartType } from "../chart-store";
import { chartTypeMapping } from "../chart-store";
import { generateCompletePluginSystem } from "../html-plugins";
import { getCurrentDragState } from "../custom-label-plugin";
import type { HTMLExportOptions } from "./export-types";
import {
    convertImageToBase64,
    processChartDataForExport,
    buildLegendConfigForExport,
    generateCustomLabelsFromConfig,
    syncImagePositionsToConfig,
    filterChartDataForExport
} from "./export-utils";

/**
 * Generate chart HTML content specifically for embedding in templates
 * This function extracts just the chart-related HTML without the full page structure
 */
export async function generateChartHTMLForTemplate(options: HTMLExportOptions = {}): Promise<{
    chartScript: string
    chartStyles: string
    pluginsScript: string
    chartContainer: string
}> {
    const {
        chartType,
        chartData,
        chartConfig,
        chartMode,
        activeDatasetIndex,
        legendFilter,
        activeGroupId
    } = useChartStore.getState();

    // Map custom chart types to actual Chart.js types
    const mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;
    const storeToggles = useChartStore.getState();
    const effectiveShowImages = options.showImages ?? (storeToggles as any).showImages ?? true;
    const effectiveShowLabels = options.showLabels ?? (storeToggles as any).showLabels ?? true;
    const effectiveFillArea = options.fillArea ?? (storeToggles as any).fillArea;
    const effectiveShowBorder = options.showBorder ?? (storeToggles as any).showBorder;

    // Use provided drag state or try to capture current drag state from any active chart instance
    let currentDragState = options.dragState || {};
    if (!currentDragState || Object.keys(currentDragState).length === 0) {
        try {
            // Look for any chart instance in the DOM that might have drag state
            const canvasElements = document.querySelectorAll('canvas');
            for (const canvas of canvasElements) {
                const chartInstance = (canvas as any).chart;
                if (chartInstance) {
                    const dragState = getCurrentDragState(chartInstance);
                    if (Object.keys(dragState).length > 0) {
                        currentDragState = dragState;
                        break;
                    }
                }
            }
        } catch (error) {
            console.warn('Could not capture drag state for HTML export:', error);
        }
    }

    // Filter exported datasets and slices to match exactly what is visible on screen
    const chartDataCopy = filterChartDataForExport(
        JSON.parse(JSON.stringify(chartData)),
        chartMode,
        activeDatasetIndex,
        legendFilter,
        activeGroupId,
        chartType
    );
    // Sync image positions
    syncImagePositionsToConfig(chartDataCopy, currentDragState);

    // Process chart data to convert images to base64
    const processedChartData = await processChartDataForExport(chartDataCopy);

    // Respect toggles for images/labels/fill/border in template exports
    if (effectiveShowImages === false && Array.isArray(processedChartData.datasets)) {
        processedChartData.datasets = processedChartData.datasets.map((ds: any) => ({
            ...ds,
            pointImages: Array.isArray(ds.pointImages) ? ds.pointImages.map(() => null) : ds.pointImages
        }));
    }
    if ((effectiveFillArea !== undefined || effectiveShowBorder !== undefined) && Array.isArray(processedChartData.datasets)) {
        processedChartData.datasets = processedChartData.datasets.map((ds: any) => {
            const out = { ...ds } as any;
            if (effectiveFillArea !== undefined) {
                const isLineLike = (chartType === 'line' || chartType === 'area' || chartType === 'radar');
                if (isLineLike) {
                    // Force the override if we have an explicit preference
                    out.fill = !!effectiveFillArea;
                }
                if (effectiveFillArea === false) {
                    if (Array.isArray(out.backgroundColor)) out.backgroundColor = out.backgroundColor.map(() => 'transparent');
                    else out.backgroundColor = 'transparent';
                }
            } else {
                // FALLBACK CASE: When no explicit option is provided, 
                // we should respect the chart's nature.
                if (chartType === 'area' || chartType === 'radar') {
                    out.fill = (ds.fill !== undefined) ? ds.fill : true;
                } else if (chartType === 'line') {
                    // Strictly respect the dataset's fill property for line charts
                    // Line charts should NEVER default to true unless explicitly requested
                    out.fill = (ds.fill !== undefined) ? ds.fill : false;
                }
            }
            if (effectiveShowBorder !== undefined) {
                const bw = effectiveShowBorder ? (typeof out.borderWidth === 'number' ? out.borderWidth || 2 : 2) : 0;
                out.borderWidth = bw;
                if (bw === 0) {
                    if (Array.isArray(out.borderColor)) out.borderColor = out.borderColor.map(() => 'transparent');
                    else out.borderColor = 'transparent';
                }
            }
            return out;
        });
    }

    // Get overlay data from chart store
    const { overlayImages, overlayTexts, overlayShapes } = useChartStore.getState();

    // Process overlay images to convert URLs to base64
    const processedOverlayImages = await Promise.all(
        overlayImages.map(async (image) => ({
            ...image,
            url: await convertImageToBase64(image.url)
        }))
    );

    // Generate custom labels and enhance chart config
    const effectiveConfig = JSON.parse(JSON.stringify(chartConfig));
    if (effectiveShowLabels === false) {
        if (effectiveConfig.plugins?.customLabelsConfig) {
            effectiveConfig.plugins.customLabelsConfig.display = false;
        }
    }
    const customLabels = generateCustomLabelsFromConfig(effectiveConfig, processedChartData, legendFilter, currentDragState);
    const enhancedChartConfig = {
        ...chartConfig,
        data: processedChartData,
        plugins: {
            ...chartConfig.plugins,
            customLabels: (effectiveShowLabels === false) ? undefined : (customLabels.length > 0 ? {
                shapeSize: 32,
                labels: customLabels
            } : undefined),
            overlayPlugin: (effectiveShowImages === false) ? undefined : {
                overlayImages: processedOverlayImages,
                overlayTexts: overlayTexts,
                overlayShapes: overlayShapes
            }
        }
    };

    const {
        width = 800,
        height = 600,
        includeResponsive = true,
        includeAnimations = true,
        includeTooltips = true,
        includeLegend = true,
    } = options;

    const legendForExport = buildLegendConfigForExport(enhancedChartConfig, includeLegend);

    // Generate the chart script
    const chartScript = `
    // Chart.js Configuration
    const chartConfig = ${JSON.stringify(enhancedChartConfig, null, 8)};
    const chartData = ${JSON.stringify(processedChartData, null, 8)};
    const chartType = "${mappedChartType}";
    
    // Extract legendType for generateLabels function
    const legendType = ${JSON.stringify(legendForExport.legendType || 'slice')};
    const legendLabelsConfig = ${JSON.stringify(legendForExport.labels || {})};
    
    // Enhanced configuration for standalone HTML
    const enhancedConfig = {
        ...chartConfig,
        responsive: ${includeResponsive},
        maintainAspectRatio: false,
        animation: ${includeAnimations} ? {
            duration: 1000,
            easing: 'easeInOutQuart'
        } : false,
        plugins: {
            ...chartConfig.plugins,
            tooltip: ${includeTooltips} ? {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                padding: 12
            } : { enabled: false },
            legend: {
                ...${JSON.stringify(legendForExport, null, 8)},
                labels: {
                    ...legendLabelsConfig,
                    generateLabels: function(chart) {
                        const usePointStyle = legendLabelsConfig.usePointStyle || false;
                        const pointStyle = legendLabelsConfig.pointStyle || 'rect';
                        const fontColor = legendLabelsConfig.font?.color || legendLabelsConfig.color || '#000000';
                        
                        const createItem = (props) => ({
                            ...props,
                            pointStyle: usePointStyle ? pointStyle : undefined,
                            fontColor: fontColor
                        });
                        
                        const items = [];
                        const labels = chart.data.labels || [];
                        const datasets = chart.data.datasets || [];
                        
                        if (legendType === 'slice' || legendType === 'both') {
                            for (let i = 0; i < labels.length; ++i) {
                                const dataset = datasets[0];
                                if (dataset) {
                                    const backgroundColor = Array.isArray(dataset.backgroundColor) 
                                        ? dataset.backgroundColor[i] 
                                        : dataset.backgroundColor || '#ccc';
                                    const borderColor = Array.isArray(dataset.borderColor) 
                                        ? dataset.borderColor[i] 
                                        : dataset.borderColor || '#333';
                                    items.push(createItem({
                                        text: String(labels[i]),
                                        fillStyle: backgroundColor,
                                        strokeStyle: borderColor,
                                        hidden: false,
                                        index: i,
                                        datasetIndex: 0,
                                        type: 'slice',
                                    }));
                                }
                            }
                        }
                        if (legendType === 'dataset' || legendType === 'both') {
                            for (let i = 0; i < datasets.length; ++i) {
                                const dataset = datasets[i];
                                const backgroundColor = Array.isArray(dataset.backgroundColor) 
                                    ? dataset.backgroundColor[0] 
                                    : dataset.backgroundColor || '#ccc';
                                const borderColor = Array.isArray(dataset.borderColor) 
                                    ? dataset.borderColor[0] 
                                    : dataset.borderColor || '#333';
                                items.push(createItem({
                                    text: dataset.label || \`Dataset \${i + 1}\`,
                                    fillStyle: backgroundColor,
                                    strokeStyle: borderColor,
                                    hidden: false,
                                    datasetIndex: i,
                                    index: i,
                                    type: 'dataset',
                                }));
                            }
                        }
                        return items;
                    }
                }
            }
        }
    };
    
    const ctx = document.getElementById('chartCanvas').getContext('2d');
    new Chart(ctx, {
        type: chartType,
        data: chartData,
        options: enhancedConfig
    });
  `;

    // Generate chart styles
    const chartStyles = `
    .chart-area {
        position: relative;
        width: ${width}px;
        height: ${height}px;
        background: white;
        border-radius: 8px;
        overflow: hidden;
    }
    
    .chart-canvas {
        width: ${width}px !important;
        height: ${height}px !important;
    }
  `;

    // Generate plugins script
    const pluginsScript = generateCompletePluginSystem(enhancedChartConfig);

    // Generate chart container
    const chartContainer = `
    <canvas id="chartCanvas" class="chart-canvas" width="${width}" height="${height}"></canvas>
  `;

    return {
        chartScript,
        chartStyles,
        pluginsScript,
        chartContainer
    };
}
