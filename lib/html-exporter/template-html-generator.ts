import { useChartStore } from "../chart-store";
import { type SupportedChartType } from "../chart-store";
import { chartTypeMapping } from "../chart-store";
import { useTemplateStore } from "../template-store";
import { generateCompletePluginSystem } from "../html-plugins";
import { getCurrentDragState } from "../custom-label-plugin";
import type { HTMLExportOptions } from "./export-types";
import {
    convertImageToBase64,
    processChartDataForExport,
    buildLegendConfigForExport,
    generateCustomLabelsFromConfig,
    syncImagePositionsToConfig,
    filterChartDataForExport,
    processTimelineDataForExport,
    calculateTimelineBounds
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
    // In grouped mixed mode, the base chart type should be 'bar' (each dataset has its own type)
    const uniformityMode = (useChartStore.getState() as any).uniformityMode || 'uniform';
    let mappedChartType: string;
    if (chartMode !== 'single' && uniformityMode === 'mixed') {
        mappedChartType = 'bar';
    } else {
        mappedChartType = chartTypeMapping[chartType as SupportedChartType] || chartType;
    }

    // Resolve visual settings from the per-chart config (same logic as use-chart-state hooks)
    // This ensures we read the same truth the UI and chart_generator see.
    const storeState = useChartStore.getState();
    let resolvedConfig = chartConfig;
    if (storeState.chartMode === 'single') {
        const ds = storeState.chartData?.datasets?.[storeState.activeDatasetIndex];
        resolvedConfig = ds?.chartConfig ?? chartConfig;
    } else {
        const group = (storeState as any).groups?.find((g: any) => g.id === storeState.activeGroupId);
        resolvedConfig = group?.chartConfig ?? chartConfig;
    }
    const visualSettings = (resolvedConfig as any)?.visualSettings ?? {};
    const effectiveShowImages = options.showImages ?? visualSettings.showImages ?? true;
    const effectiveShowLabels = options.showLabels ?? visualSettings.showLabels ?? false;
    const effectiveFillArea = options.fillArea ?? visualSettings.fillArea;
    const effectiveShowBorder = options.showBorder ?? visualSettings.showBorder;

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
    let processedChartData = await processChartDataForExport(chartDataCopy);

    // Apply timeline data transformation if chartType === 'timeline'
    if (chartType === 'timeline') {
        const selectedRange = (resolvedConfig?.plugins as any)?.timelineRangeSelector?.selectedRange || 'Max';
        processedChartData = processTimelineDataForExport(processedChartData, selectedRange);
    }

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
            const datasetType = (chartMode === 'single' || uniformityMode === 'uniform')
                ? chartType
                : (ds.chartType || chartType || 'bar');

            if (effectiveFillArea === false) {
                if (Array.isArray(out.backgroundColor)) out.backgroundColor = out.backgroundColor.map(() => 'transparent');
                else out.backgroundColor = 'transparent';
                
                const isLineLike = (datasetType === 'line' || datasetType === 'area' || datasetType === 'timeline' || datasetType === 'radar');
                if (isLineLike) {
                    out.fill = false;
                }
            } else if (effectiveFillArea === true) {
                if (datasetType === 'area' && (out.fill === undefined || out.fill === false)) {
                    out.fill = 'origin';
                }
            } else {
                // FALLBACK CASE: When no explicit option is provided, 
                // we should respect the chart's nature.
                if (datasetType === 'area' || datasetType === 'radar') {
                    out.fill = (ds.fill !== undefined) ? ds.fill : true;
                } else if (datasetType === 'line' || datasetType === 'timeline') {
                    // Strictly respect the dataset's fill property for line and timeline charts
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



    // Generate custom labels and enhance chart config
    const effectiveConfig = JSON.parse(JSON.stringify(resolvedConfig));
    if (effectiveShowLabels === false) {
        if (!effectiveConfig.plugins) effectiveConfig.plugins = {};
        if (!effectiveConfig.plugins.customLabelsConfig) effectiveConfig.plugins.customLabelsConfig = {};
        effectiveConfig.plugins.customLabelsConfig.display = false;
    }
    const customLabels = generateCustomLabelsFromConfig(effectiveConfig, processedChartData, legendFilter, currentDragState);

    // Process background image URL to base64 if needed
    const processedChartConfig = JSON.parse(JSON.stringify(resolvedConfig));
    
    // Remove scales for pie and doughnut charts to prevent background lines
    if (chartType === 'pie' || chartType === 'doughnut') {
        delete processedChartConfig.scales;
    }
    
    // Secondary Y2 axis safety: requires at least 2 visible datasets and at least one mapped to y1
    const totalVisibleDatasets = processedChartData.datasets.filter((ds: any) => !ds.hidden);
    const canHaveRightAxis = totalVisibleDatasets.length >= 2;
    const hasY1Dataset = canHaveRightAxis && totalVisibleDatasets.some((ds: any) => ds?.yAxisID === 'y1');
    const showRightAxis = hasY1Dataset && processedChartConfig.scales?.y1?.display !== false;

    if (!showRightAxis) {
        if (processedChartConfig.scales?.y1) {
            delete processedChartConfig.scales.y1;
        }
        processedChartData.datasets = processedChartData.datasets.map((ds: any) => {
            if (ds?.yAxisID === 'y1') {
                const clean = { ...ds };
                delete clean.yAxisID;
                return clean;
            }
            return ds;
        });
    } else {
        const rawY1 = processedChartConfig.scales?.y1 || {};
        const y1Pos = (rawY1.position && rawY1.position !== 'left') ? rawY1.position : 'right';
        if (!processedChartConfig.scales) {
            processedChartConfig.scales = {};
        }
        processedChartConfig.scales.y1 = {
            ...rawY1,
            beginAtZero: rawY1.beginAtZero !== undefined ? rawY1.beginAtZero : (processedChartConfig.scales?.y?.beginAtZero ?? true),
            position: y1Pos,
            grid: {
                ...(rawY1.grid || {}),
                drawOnChartArea: rawY1.grid?.drawOnChartArea ?? false,
            },
        };
    }
    
    // Add stacked scales for stackedBar chart type
    if (chartType === 'stackedBar') {
        processedChartConfig.scales = {
            ...(processedChartConfig.scales || {}),
            x: { ...((processedChartConfig.scales && processedChartConfig.scales.x) || {}), stacked: true },
            y: { ...((processedChartConfig.scales && processedChartConfig.scales.y) || {}), stacked: true },
        };
    }

    // Add horizontal indexAxis for horizontalBar chart type
    if (chartType === 'horizontalBar' || chartType === 'horizontalBar3d') {
        processedChartConfig.indexAxis = 'y';
    }

    // Force half-circle layout for Gauge charts
    if (chartType === 'gauge') {
        processedChartConfig.circumference = processedChartConfig.circumference ?? 180;
        processedChartConfig.rotation = processedChartConfig.rotation ?? 270;
    }

    // Configure scales and interaction for timeline chart type
    if (chartType === 'timeline') {
        const selectedRange = (resolvedConfig?.plugins as any)?.timelineRangeSelector?.selectedRange || 'Max';
        const timestamps = (processedChartData.datasets?.[0]?.data || []).map((pt: any) => typeof pt === 'object' ? pt.x : 0).filter((t: number) => t > 0);
        const bounds = calculateTimelineBounds(timestamps, selectedRange);

        processedChartConfig.scales = processedChartConfig.scales || {};
        processedChartConfig.scales.x = {
            ...(processedChartConfig.scales.x || {}),
            type: 'time',
            ...(bounds ? { min: bounds.min, max: bounds.max } : {}),
            time: {
                tooltipFormat: 'PP',
                displayFormats: {
                    millisecond: 'HH:mm:ss.SSS',
                    second: 'HH:mm:ss',
                    minute: 'HH:mm',
                    hour: 'HH:mm',
                    day: 'MMM d',
                    week: 'MMM d',
                    month: 'MMM yyyy',
                    quarter: 'qqq yyyy',
                    year: 'yyyy',
                }
            }
        };
        processedChartConfig.interaction = {
            intersect: false,
            mode: 'index',
            axis: 'x',
            ...(processedChartConfig.interaction || {})
        };
        processedChartConfig.hover = {
            intersect: false,
            animationDuration: 0,
            ...(processedChartConfig.hover || {})
        };
    }

    // ── Custom Grace → suggestedMax ──
    const computeGraceForScale = (scaleObj: any, scaleKey: 'y' | 'y1', fallbackGrace?: any) => {
        if (!scaleObj) return;
        if (scaleObj.max !== undefined && scaleObj.max !== null && scaleObj.max !== '') {
            delete scaleObj.grace;
            return;
        }
        const graceRaw = scaleObj.grace !== undefined ? scaleObj.grace : fallbackGrace;
        if (graceRaw !== undefined && graceRaw !== null && graceRaw !== 0 && graceRaw !== '0%') {
            let dataMax = -Infinity;
            for (const ds of processedChartData.datasets) {
                if (!ds.data || ds.hidden) continue;
                const dsAxis = ds.yAxisID === 'y1' ? 'y1' : 'y';
                if (showRightAxis && dsAxis !== scaleKey) continue;
                for (const v of ds.data) {
                    let num: number | undefined = undefined;
                    if (typeof v === 'number') {
                        num = v;
                    } else if (Array.isArray(v)) {
                        num = typeof v[1] === 'number' ? v[1] : (typeof v[0] === 'number' ? v[0] : undefined);
                    } else if (v && typeof v === 'object') {
                        num = typeof v.y === 'number' ? v.y : undefined;
                    }
                    if (typeof num === 'number' && isFinite(num) && num > dataMax) {
                        dataMax = num;
                    }
                }
            }
            if (isFinite(dataMax)) {
                const isPercent = typeof graceRaw === 'string' && graceRaw.endsWith('%');
                if (isPercent) {
                    const pct = parseFloat(graceRaw) || 0;
                    scaleObj.suggestedMax = dataMax + (dataMax * pct / 100);
                } else if (typeof graceRaw === 'number') {
                    scaleObj.suggestedMax = dataMax + graceRaw;
                }
            }
        }
        delete scaleObj.grace;

        // Ensure scale limits expand to include threshold / goal benchmark lines
        const th = scaleObj.threshold;
        if (th?.enabled && th.value !== undefined && th.value !== null && th.value !== '') {
            const numVal = Number(th.value);
            if (!isNaN(numVal)) {
                if (scaleObj.suggestedMax === undefined || scaleObj.suggestedMax < numVal) {
                    scaleObj.suggestedMax = Math.ceil(numVal * 1.05);
                }
                if (numVal < 0 && (scaleObj.suggestedMin === undefined || scaleObj.suggestedMin > numVal)) {
                    scaleObj.suggestedMin = Math.floor(numVal * 1.05);
                }
            }
        }
    };

    const yGraceFallback = processedChartConfig.scales?.y?.grace ?? '5%';
    if (processedChartConfig.scales?.y) {
        computeGraceForScale(processedChartConfig.scales.y, 'y', yGraceFallback);
    }
    if (showRightAxis && processedChartConfig.scales?.y1) {
        computeGraceForScale(
            processedChartConfig.scales.y1,
            'y1',
            yGraceFallback
        );
    }

    if (processedChartConfig.background?.type === 'image' && processedChartConfig.background?.imageUrl) {
        processedChartConfig.background.imageUrl = await convertImageToBase64(processedChartConfig.background.imageUrl);
    }

    // ── Scale Threshold / Goal Lines Mapping in TypeScript ────────────────────
    if (processedChartConfig.scales && typeof processedChartConfig.scales === 'object') {
        const existingAnnotations = { ...((processedChartConfig.plugins as any)?.annotation?.annotations || {}) };
        let hasAnnotations = Object.keys(existingAnnotations).length > 0;

        ['x', 'y', 'y1'].forEach((scaleKey) => {
            const scaleObj = (processedChartConfig.scales as any)?.[scaleKey];
            const th = scaleObj?.threshold;
            if (th && th.enabled && th.value !== undefined && th.value !== null && th.value !== '') {
                const numVal = Number(th.value);
                if (!isNaN(numVal)) {
                    hasAnnotations = true;
                    const dash = th.style === 'solid' ? [] : th.style === 'dotted' ? [2, 4] : [6, 6];
                    const isYScale = scaleKey.startsWith('y');

                    if (scaleObj) {
                        if (scaleObj.suggestedMax === undefined || scaleObj.suggestedMax < numVal) {
                            scaleObj.suggestedMax = Math.ceil(numVal * 1.05);
                        }
                        if (numVal < 0 && (scaleObj.suggestedMin === undefined || scaleObj.suggestedMin > numVal)) {
                            scaleObj.suggestedMin = Math.floor(numVal * 1.05);
                        }
                    }

                    existingAnnotations[`threshold_${scaleKey}`] = {
                        type: 'line',
                        scaleID: scaleKey,
                        value: numVal,
                        ...(isYScale ? { yMin: numVal, yMax: numVal } : { xMin: numVal, xMax: numVal }),
                        borderColor: th.color || '#ef4444',
                        borderWidth: typeof th.width === 'number' ? th.width : 2,
                        borderDash: dash,
                        label: {
                            display: Boolean(th.label),
                            content: th.label || '',
                            position: th.position || 'end',
                            backgroundColor: th.color || '#ef4444',
                            color: '#ffffff',
                            font: {
                                size: 10,
                                weight: 'bold',
                            },
                            padding: { top: 3, bottom: 3, left: 6, right: 6 },
                            borderRadius: 4,
                        },
                    };
                }
            }
        });

        if (hasAnnotations) {
            processedChartConfig.plugins = {
                ...processedChartConfig.plugins,
                annotation: {
                    ...((processedChartConfig.plugins as any)?.annotation || {}),
                    annotations: existingAnnotations,
                },
            };
        }
    }

    const enhancedChartConfig = {
        ...processedChartConfig,
        data: processedChartData,
        plugins: {
            ...processedChartConfig.plugins,
            customLabels: (effectiveShowLabels === false) ? undefined : (customLabels.length > 0 ? {
                shapeSize: 32,
                labels: customLabels
            } : undefined),

            // Explicitly enable 3D plugins based on chartType
            pie3d: {
                ...(processedChartConfig.plugins?.pie3d || {}),
                enabled: chartType === 'pie3d' || chartType === 'doughnut3d'
            },
            bar3d: {
                ...(processedChartConfig.plugins?.bar3d || {}),
                enabled: chartType === 'bar3d' || chartType === 'horizontalBar3d'
            },
            funnel: {
                ...(processedChartConfig.plugins?.funnel || {}),
                enabled: chartType === 'funnel'
            },
            timelineCrosshair: {
                ...(processedChartConfig.plugins?.timelineCrosshair || {}),
                enabled: chartType === 'timeline' && (processedChartConfig.plugins?.timelineCrosshair?.enabled !== false)
            }
        },
        chartType
    };

    const {
        includeResponsive = true,
        includeAnimations = true,
        includeTooltips = true,
        includeLegend = resolvedConfig?.plugins?.legend?.display ?? true,
    } = options;

    // Read dimension override from template store — this is the immutable way
    // to get template dimensions without reading from the (now unchanged) chartConfig
    const templateStore = useTemplateStore.getState();
    const dimensionOverride = templateStore.dimensionOverride;
    const width = options.width ?? dimensionOverride?.width ?? 800;
    const height = options.height ?? dimensionOverride?.height ?? 600;

    const legendForExport = buildLegendConfigForExport(enhancedChartConfig, includeLegend, chartType);

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
                onClick: function(e, legendItem, legend) {
                    const currentLegendType = legend.options?.plugins?.legendType || (chartConfig.plugins && chartConfig.plugins.legendType);
                    if (currentLegendType === 'waterfall') {
                        return;
                    }
                    const defaultClick = Chart.defaults.plugins.legend.onClick;
                    if (defaultClick) {
                        defaultClick.call(legend, e, legendItem, legend);
                    }
                },
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
                        if (legendType === 'waterfall' && "${chartType}" === 'waterfall') {
                            const wfConfig = (chartConfig.plugins && chartConfig.plugins.waterfall) || {};
                            const positiveColor = wfConfig.positiveColor || '#10b981';
                            const negativeColor = wfConfig.negativeColor || '#ef4444';
                            const totalColor = wfConfig.totalColor || '#3b82f6';
                            const legendLabels = wfConfig.legendLabels || {};
                            const increaseLabel = legendLabels.increase || 'Increase';
                            const decreaseLabel = legendLabels.decrease || 'Decrease';
                            const totalLabelVal = legendLabels.total || 'Total';
                            const hasTotal = wfConfig.showTotal !== false || wfConfig.treatLastAsTotal === true || (wfConfig.totalIndices && wfConfig.totalIndices.trim() !== '');

                            items.push(createItem({
                                text: increaseLabel,
                                fillStyle: positiveColor,
                                strokeStyle: positiveColor,
                                hidden: false,
                                datasetIndex: 0,
                                index: 0,
                                type: 'waterfall_increase'
                            }));

                            items.push(createItem({
                                text: decreaseLabel,
                                fillStyle: negativeColor,
                                strokeStyle: negativeColor,
                                hidden: false,
                                datasetIndex: 0,
                                index: 1,
                                type: 'waterfall_decrease'
                            }));

                            if (hasTotal) {
                                items.push(createItem({
                                    text: totalLabelVal,
                                    fillStyle: totalColor,
                                    strokeStyle: totalColor,
                                    hidden: false,
                                    datasetIndex: 0,
                                    index: 2,
                                    type: 'waterfall_total'
                                }));
                            }
                        }
                        return items;
                    }
                }
            }
        }
    };
    
    // Dynamic Zero Baseline Highlight post-processing
    if (enhancedConfig.scales) {
        const needsHorizontal = enhancedConfig.indexAxis === 'y';
        const valueAxisKey = needsHorizontal ? 'x' : 'y';
        const valueAxis = enhancedConfig.scales[valueAxisKey];
        if (valueAxis) {
            valueAxis.grid = valueAxis.grid || {};
            const baseColor = valueAxis.grid.color || 'rgba(0, 0, 0, 0.06)';
            const baseWidth = valueAxis.grid.lineWidth !== undefined ? valueAxis.grid.lineWidth : 1;
            const baseDraw = valueAxis.grid.drawOnChartArea !== false;
            const hasNegativeValues = chartData && Array.isArray(chartData.datasets) && chartData.datasets.some(ds => 
                Array.isArray(ds.data) && ds.data.some(val => {
                    if (typeof val === 'number') return val < 0;
                    if (Array.isArray(val)) return val[0] < 0 || val[1] < 0;
                    if (val && typeof val === 'object') {
                        return (typeof val.y === 'number' && val.y < 0) || (typeof val.x === 'number' && val.x < 0);
                    }
                    return false;
                })
            );
            const highlightZeroLine = valueAxis.highlightZeroLine === true || 
                (valueAxis.highlightZeroLine === undefined && hasNegativeValues);

            if (highlightZeroLine) {
                valueAxis.grid.color = function(context) {
                    if (context.tick && context.tick.value === 0) {
                        return '#475569'; // charcoal graphite zero line
                    }
                    if (!baseDraw) {
                        return 'transparent'; // mask out non-zero grid lines
                    }
                    return typeof baseColor === 'function' ? baseColor(context) : baseColor;
                };

                valueAxis.grid.lineWidth = function(context) {
                    if (context.tick && context.tick.value === 0) {
                        return 2; // thicker zero line
                    }
                    return typeof baseWidth === 'function' ? baseWidth(context) : baseWidth;
                };

                valueAxis.grid.drawOnChartArea = true; // statically enable drawOnChartArea to allow tick evaluation
            }
        }
    }

    // Dynamic Goal / Benchmark Threshold Line post-processing
    if (enhancedConfig.scales) {
        const annotations = { ...((enhancedConfig.plugins && enhancedConfig.plugins.annotation && enhancedConfig.plugins.annotation.annotations) || {}) };
        let hasAnnotations = Object.keys(annotations).length > 0;
        ['x', 'y', 'y1'].forEach(function(scaleKey) {
            const scaleObj = enhancedConfig.scales[scaleKey];
            const th = scaleObj && scaleObj.threshold;
            if (th && th.enabled && th.value !== undefined && th.value !== null && th.value !== '') {
                const numVal = Number(th.value);
                if (!isNaN(numVal)) {
                    hasAnnotations = true;
                    const dash = th.style === 'solid' ? [] : th.style === 'dotted' ? [2, 4] : [6, 6];
                    const isYScale = scaleKey.indexOf('y') === 0;
                    if (scaleObj) {
                        if (scaleObj.suggestedMax === undefined || scaleObj.suggestedMax < numVal) {
                            scaleObj.suggestedMax = Math.ceil(numVal * 1.05);
                        }
                        if (numVal < 0 && (scaleObj.suggestedMin === undefined || scaleObj.suggestedMin > numVal)) {
                            scaleObj.suggestedMin = Math.floor(numVal * 1.05);
                        }
                    }
                    annotations['threshold_' + scaleKey] = {
                        type: 'line',
                        scaleID: scaleKey,
                        value: numVal,
                        ...(isYScale ? { yMin: numVal, yMax: numVal } : { xMin: numVal, xMax: numVal }),
                        borderColor: th.color || '#ef4444',
                        borderWidth: typeof th.width === 'number' ? th.width : 2,
                        borderDash: dash,
                        label: {
                            display: Boolean(th.label),
                            content: th.label || '',
                            position: th.position || 'end',
                            backgroundColor: th.color || '#ef4444',
                            color: '#ffffff',
                            font: { size: 10, weight: 'bold' },
                            padding: { top: 3, bottom: 3, left: 6, right: 6 },
                            borderRadius: 4
                        }
                    };
                }
            }
        });
        if (hasAnnotations) {
            enhancedConfig.plugins = enhancedConfig.plugins || {};
            enhancedConfig.plugins.annotation = {
                ...((enhancedConfig.plugins && enhancedConfig.plugins.annotation) || {}),
                annotations: annotations
            };
        }
    }
    
    // Dynamic Axis Tick Prefix & Suffix
    if (enhancedConfig.scales) {
        Object.keys(enhancedConfig.scales).forEach(function(axisKey) {
            const scale = enhancedConfig.scales[axisKey];
            if (scale && scale.ticks) {
                const prefix = typeof scale.ticks.prefix === 'string' ? scale.ticks.prefix : '';
                const suffix = typeof scale.ticks.suffix === 'string' ? scale.ticks.suffix : '';
                if (prefix || suffix) {
                    const origCallback = scale.ticks.callback;
                    scale.ticks.callback = function(value, index, ticks) {
                        let label;
                        if (typeof origCallback === 'function') {
                            label = origCallback.call(this, value, index, ticks);
                        } else if (this && typeof this.getLabelForValue === 'function') {
                            label = this.getLabelForValue(value);
                        } else {
                            label = value;
                        }
                        if (label !== undefined && label !== null) {
                            if (Array.isArray(label)) {
                                return label.map(function(l, i) {
                                    return (i === 0 ? prefix : '') + l + (i === label.length - 1 ? suffix : '');
                                });
                            }
                            return prefix + label + suffix;
                        }
                        return label;
                    };
                }
            }
        });
    }

    function initChart() {
        if (window['chartjs-plugin-annotation'] && typeof Chart !== 'undefined' && Chart.register) {
            try {
                Chart.register(window['chartjs-plugin-annotation']);
            } catch(e) {}
        }
        const canvasEl = document.getElementById('chartCanvas');
        if (canvasEl) {
            const ctx = canvasEl.getContext('2d');
            const chart = new Chart(ctx, {
                type: chartType,
                data: chartData,
                options: enhancedConfig,
                plugins: (window['chartjs-plugin-annotation'] ? [window['chartjs-plugin-annotation']] : [])
            });
            window.chart = chart;
        }
    }

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initChart);
    } else {
        initChart();
    }
  `;

    // Generate chart styles
    const chartStyles = `
    .chart-area {
        position: relative;
        width: ${width}px;
        height: ${height}px;
        background: transparent;
        border-radius: 0px;
        overflow: hidden;
    }
    
    .chart-canvas {
        width: 100% !important;
        height: 100% !important;
    }
  `;

    // Generate background HTML
    let backgroundHTML = '';
    const bg = enhancedChartConfig.background || { type: 'color', color: '#ffffff' };
    const bgOpacity = bg.opacity || 100;

    if (bg.type === 'image' && bg.imageUrl) {
        backgroundHTML = `<div style="position: absolute; inset: 0; z-index: 0; background-image: url('${bg.imageUrl}'); background-size: ${bg.imageFit === 'fill' ? '100% 100%' : (bg.imageFit === 'contain' ? 'contain' : 'cover')}; background-position: center; background-repeat: no-repeat; opacity: ${bgOpacity / 100}; pointer-events: none; ${bg.blur ? `filter: blur(${bg.blur}px);` : ''}"></div>`;
    } else if (bg.type === 'gradient') {
        const color1 = bg.gradientColor1 || '#ffffff';
        const color2 = bg.gradientColor2 || '#000000';
        const type = bg.gradientType || 'linear';
        const direction = bg.gradientDirection || 'to right';
        const gradient = type === 'radial' ? `radial-gradient(circle, ${color1}, ${color2})` : `linear-gradient(${direction}, ${color1}, ${color2})`;
        backgroundHTML = `<div style="position: absolute; inset: 0; z-index: 0; background-image: ${gradient}; opacity: ${bgOpacity / 100}; pointer-events: none;"></div>`;
    } else if (bg.type === 'color' || bg.type === undefined) {
        const color = bg.color || '#ffffff';
        const hexOpacity = Math.round(bgOpacity * 2.55).toString(16).padStart(2, '0');
        backgroundHTML = `<div style="position: absolute; inset: 0; z-index: 0; background-color: ${color}${hexOpacity}; pointer-events: none;"></div>`;
    }

    // Generate plugins script
    const pluginsScript = generateCompletePluginSystem(enhancedChartConfig);

    // Generate chart container
    const chartContainer = `
    ${backgroundHTML}
    <canvas id="chartCanvas" class="chart-canvas" width="${width}" height="${height}" style="position: relative; z-index: 10;"></canvas>
  `;

    return {
        chartScript,
        chartStyles,
        pluginsScript,
        chartContainer
    };
}
