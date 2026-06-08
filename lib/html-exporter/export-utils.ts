import { type ExtendedChartData, chartTypeMapping, useChartStore } from "../chart-store";

// Helper to map custom chart types to base Chart.js types
function getMappedType(type: string): string {
    return (chartTypeMapping as any)[type] || type;
}
import { getProxiedImageUrl, requiresProxy } from "../utils/image-proxy-utils";

// Function to convert image URL to base64
export function filterChartDataForExport(
    rawChartData: any,
    chartMode: string,
    activeDatasetIndex: number,
    legendFilter: any,
    activeGroupId: string,
    chartType: string
): any {
    // 1. Filter datasets based on mode, active dataset/group, and legend filter
    let exportDatasets = chartMode === 'single'
        ? rawChartData.datasets.filter((_: any, i: number) => i === activeDatasetIndex)
        : rawChartData.datasets
            .map((ds: any, i: number) => (legendFilter.datasets[i] === false ? null : ds))
            .filter((ds: any) => ds !== null);

    exportDatasets = exportDatasets.filter((dataset: any) => {
        if (dataset.mode) {
            if (dataset.mode !== chartMode) return false;
            // For grouped mode, also filter by active group
            if (chartMode === 'grouped' && dataset.groupId !== activeGroupId) {
                return false;
            }
            return true;
        }
        return true;
    });

    // 2. Filter slices based on legend filter
    const isSliceVisible = (index: number) => legendFilter.slices[index] !== false;
    
    // Find all slice indices that are enabled
    const enabledSliceIndicesSet = new Set<number>();
    exportDatasets.forEach((ds: any) => {
        (ds.data || []).forEach((_: any, idx: number) => {
            if (isSliceVisible(idx)) {
                enabledSliceIndicesSet.add(idx);
            }
        });
    });
    const enabledSliceIndices = Array.from(enabledSliceIndicesSet).sort((a, b) => a - b);

    // Apply slice filtering to all datasets
    exportDatasets = exportDatasets.map((ds: any, i: number) => {
        const filterSlice = (arr: any[] | undefined) => {
            if (!arr || !Array.isArray(arr)) return arr;
            return enabledSliceIndices.map(idx => arr[idx]);
        };

        // Remap sliceLabelOverrides keys from original indices to filtered indices
        let remappedOverrides = ds.sliceLabelOverrides;
        if (remappedOverrides && typeof remappedOverrides === 'object') {
            const newOverrides: Record<number, any> = {};
            enabledSliceIndices.forEach((originalIdx, newIdx) => {
                if (remappedOverrides[originalIdx]) {
                    newOverrides[newIdx] = remappedOverrides[originalIdx];
                }
            });
            remappedOverrides = Object.keys(newOverrides).length > 0 ? newOverrides : undefined;
        }

        // Determine dataset type to assign proper rendering order (lower order renders last/on top)
        const uniformityMode = (useChartStore.getState() as any).uniformityMode || 'uniform';
        const datasetType = (chartMode === 'single' || uniformityMode === 'uniform')
            ? chartType
            : (ds.chartType || chartType || 'bar');
        const isLineOrPoint = ['line', 'area', 'radar', 'scatter', 'bubble'].includes(datasetType as string);
        const orderOffset = isLineOrPoint ? 0 : 100;
        const defaultOrder = i + orderOffset;

        return {
            ...ds,
            // Map custom chart types (like 'bar3d') to base Chart.js types for the dataset
            type: chartMode === 'single' ? getMappedType(chartType) : getMappedType(ds.chartType || chartType),
            order: ds.order !== undefined && ds.order !== null ? ds.order : defaultOrder,
            data: filterSlice(ds.data),
            backgroundColor: Array.isArray(ds.backgroundColor) ? filterSlice(ds.backgroundColor) : ds.backgroundColor,
            borderColor: Array.isArray(ds.borderColor) ? filterSlice(ds.borderColor) : ds.borderColor,
            pointImages: Array.isArray(ds.pointImages) ? filterSlice(ds.pointImages) : ds.pointImages,
            pointImageConfig: Array.isArray(ds.pointImageConfig) ? filterSlice(ds.pointImageConfig) : ds.pointImageConfig,
            sliceLabels: Array.isArray(ds.sliceLabels) ? filterSlice(ds.sliceLabels) : ds.sliceLabels,
            sliceLabelOverrides: remappedOverrides,
        };
    });

    // Deep copy chart data (now filtered) to avoid mutating state further
    return {
        ...rawChartData,
        labels: Array.isArray(rawChartData.labels) ? enabledSliceIndices.map(idx => rawChartData.labels[idx]) : rawChartData.labels,
        datasets: exportDatasets
    };
}

// Function to convert image URL to base64
export async function convertImageToBase64(imageUrl: string): Promise<string> {
    try {
        // Handle data URLs (already base64)
        if (imageUrl.startsWith('data:')) {
            return imageUrl;
        }

        // Handle blob URLs
        if (imageUrl.startsWith('blob:')) {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        // Handle external URLs
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            const fetchUrl = requiresProxy(imageUrl) ? getProxiedImageUrl(imageUrl) : imageUrl;
            // Append cache-busting timestamp to bypass browser cache where a non-CORS response might be cached
            const cacheBustedUrl = fetchUrl + (fetchUrl.includes('?') ? '&' : '?') + '_cb=' + Date.now();
            const response = await fetch(cacheBustedUrl, { cache: 'no-store' });
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        }

        // Handle relative URLs (try to fetch from current domain)
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn('Failed to convert image to base64:', imageUrl, error);
        return imageUrl; // Return original URL as fallback
    }
}

// Function to process chart data and convert images to base64
export async function processChartDataForExport(chartData: ExtendedChartData): Promise<ExtendedChartData> {
    const processedData = { ...chartData };

    // Process datasets for images
    if (processedData.datasets) {
        for (const dataset of processedData.datasets) {
            if (dataset.pointImages && dataset.pointImages.length > 0) {
                const processedImages = await Promise.all(
                    dataset.pointImages.map(async (imageUrl) => {
                        if (imageUrl) {
                            return await convertImageToBase64(imageUrl);
                        }
                        return null;
                    })
                );
                dataset.pointImages = processedImages;
            }
        }
    }

    return processedData;
}

export function buildLegendConfigForExport(chartConfig: any, includeLegend: boolean, chartType?: string) {
    const legendConfig = chartConfig?.plugins?.legend ?? {};
    const labelsConfig = legendConfig.labels ?? {};
    const fontConfig = labelsConfig.font ?? {};
    const usePointStyle = labelsConfig.usePointStyle ?? true;
    const defaultLegendType = chartType === 'waterfall' ? 'waterfall' : (chartType && ['pie', 'doughnut', 'polarArea', 'gauge', 'funnel', 'pie3d', 'doughnut3d'].includes(chartType) ? 'slice' : 'dataset');
    const legendType = (chartConfig?.plugins as any)?.legendType || defaultLegendType;

    if (!includeLegend) {
        return { display: false, legendType };
    }

    return {
        ...legendConfig,
        display: true,
        position: legendConfig.position ?? 'top',
        labels: {
            ...labelsConfig,
            usePointStyle,
            pointStyle: labelsConfig.pointStyle ?? (usePointStyle ? 'circle' : undefined),
            padding: labelsConfig.padding ?? 20,
            font: {
                ...fontConfig,
                size: fontConfig.size ?? 12,
            },
        },
        legendType, // Preserve legendType for generateLabels function
    };
}

// Shared function to generate custom labels
export function generateCustomLabelsFromConfig(chartConfig: any, chartData: any, legendFilter: any, dragState: any = {}) {
    const globalCustomLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};

    // Helper function to format numbers based on customLabelsConfig
    const formatLabelValue = (rawValue: any, config: any): string => {
        let numValue: number | null = null;

        if (typeof rawValue === 'number') {
            numValue = rawValue;
        } else if (Array.isArray(rawValue) && rawValue.length === 2 && typeof rawValue[0] === 'number' && typeof rawValue[1] === 'number') {
            numValue = rawValue[1] - rawValue[0];
        } else if (rawValue && typeof rawValue === 'object' && 'y' in rawValue && typeof rawValue.y === 'number') {
            numValue = rawValue.y;
        } else {
            return String(rawValue);
        }

        // At this point numValue is guaranteed non-null (null case returns above)
        const val = numValue as number;

        // Smart auto-detect decimal places based on value magnitude and precision
        const getSmartDecimals = (value: number, explicitDecimals?: number): number => {
            if (explicitDecimals !== undefined && explicitDecimals !== null) return explicitDecimals;
            const absVal = Math.abs(value);
            const valueStr = String(value);
            const dotIndex = valueStr.indexOf('.');
            const valuePrecision = dotIndex >= 0 ? valueStr.length - dotIndex - 1 : 0;
            if (absVal < 10) return Math.min(valuePrecision, 2);
            if (absVal < 1000) return Math.min(valuePrecision, 1);
            return 0;
        };

        const decimals = getSmartDecimals(val, config.decimals);
        let formatted = val.toFixed(decimals);

        const thousandsSep = config.thousandsSeparator ?? ',';
        const decimalSep = config.decimalSeparator ?? '.';

        if (thousandsSep) {
            const parts = formatted.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSep);
            formatted = parts.join(decimalSep !== '.' ? decimalSep : '.');
        } else if (decimalSep !== '.') {
            formatted = formatted.replace('.', decimalSep);
        }

        if (config.abbreviateLargeNumbers && Math.abs(val) >= 1000) {
            const absVal = Math.abs(val);
            let abbrev = '';
            let divisor = 1;

            if (absVal >= 1e12) { abbrev = 'T'; divisor = 1e12; }
            else if (absVal >= 1e9) { abbrev = 'B'; divisor = 1e9; }
            else if (absVal >= 1e6) { abbrev = 'M'; divisor = 1e6; }
            else if (absVal >= 1e3) { abbrev = 'K'; divisor = 1e3; }

            formatted = (val / divisor).toFixed(decimals > 0 ? Math.min(decimals, 2) : 1) + abbrev;
        }

        const numberFormat = config.numberFormat || 'default';
        switch (numberFormat) {
            case 'currency':
                formatted = (config.currencySymbol || '$') + formatted;
                break;
            case 'percent':
                formatted = formatted + '%';
                break;
            case 'scientific':
                formatted = val.toExponential(decimals);
                break;
            case 'compact':
                if (!config.abbreviateLargeNumbers) {
                    const absVal = Math.abs(val);
                    if (absVal >= 1e9) formatted = (val / 1e9).toFixed(1) + 'B';
                    else if (absVal >= 1e6) formatted = (val / 1e6).toFixed(1) + 'M';
                    else if (absVal >= 1e3) formatted = (val / 1e3).toFixed(1) + 'K';
                }
                break;
        }

        if (val > 0 && config.showPlusSign) {
            formatted = '+' + formatted;
        }

        return formatted;
    };

    // Apply custom formatter function if provided
    const applyCustomFormatter = (text: string, value: any, config: any): string => {
        if (config.customFormatter && typeof config.customFormatter === 'string' && config.customFormatter.trim()) {
            try {
                const formatterFn = new Function('value', 'text', `
          try {
            ${config.customFormatter}
            return text;
          } catch(e) {
            return text;
          }
        `);
                const result = formatterFn(value, text);
                if (typeof result === 'string') return result;
            } catch (e) {
                console.warn('Custom formatter error:', e);
            }
        }
        return text;
    };

    // Apply conditional formatting if provided
    const applyConditionalFormatting = (text: string, value: any, config: any): {
        text: string;
        color?: string;
        fontSize?: number;
        fontWeight?: string;
        backgroundColor?: string;
        borderColor?: string;
    } => {
        if (config.conditionalFormatting && typeof config.conditionalFormatting === 'string' && config.conditionalFormatting.trim()) {
            try {
                const condFn = new Function('value', 'text', `
          try {
            ${config.conditionalFormatting}
            return { text: text };
          } catch(e) {
            return { text: text };
          }
        `);
                const result = condFn(typeof value === 'number' ? value : (value?.y ?? 0), text);
                if (result && typeof result === 'object') {
                    return {
                        text: result.text || text,
                        color: result.color,
                        fontSize: result.fontSize,
                        fontWeight: result.fontWeight,
                        backgroundColor: result.backgroundColor,
                        borderColor: result.borderColor
                    };
                }
                if (typeof result === 'string') {
                    return { text: result };
                }
            } catch (e) {
                console.warn('Conditional formatting error:', e);
            }
        }
        return { text };
    };

    // Filter datasets based on legend filter
    const filteredDatasets = chartData.datasets.filter((_: any, index: number) =>
        legendFilter.datasets[index] !== false
    );

    return filteredDatasets.map((ds: any, datasetIdx: number) => {
        const baseConfig = { ...globalCustomLabelsConfig, ...(ds.customLabelsConfig || {}) };
        
        if (baseConfig.display !== true) {
            return ds.data.map(() => ({ text: '' }));
        }

        return ds.data.map((value: any, pointIdx: number) => {
            // Merge per-slice label overrides if they exist (highest priority)
            const sliceOverride = ds.sliceLabelOverrides?.[pointIdx];
            const customLabelsConfig = sliceOverride
                ? { ...baseConfig, ...sliceOverride }
                : baseConfig;

            let text = '';

            // Label content logic
            if (customLabelsConfig.labelContent === 'label') {
                text = String(chartData.labels?.[pointIdx] ?? value);
            } else if (customLabelsConfig.labelContent === 'percentage') {
                const total = ds.data.reduce((a: number, b: any) => {
                    if (typeof b === 'number') return a + b;
                    if (b && typeof b === 'object' && 'y' in b && typeof b.y === 'number') return a + b.y;
                    return a;
                }, 0);
                let val = 0;
                if (typeof value === 'number') val = value;
                else if (value && typeof value === 'object' && 'y' in value && typeof value.y === 'number') val = value.y;
                const pct = (val / total) * 100;
                text = pct.toFixed(customLabelsConfig.decimals ?? 1) + '%';
            } else if (customLabelsConfig.labelContent === 'index') {
                text = String(pointIdx + 1);
            } else if (customLabelsConfig.labelContent === 'dataset') {
                text = ds.label ?? String(value);
            } else {
                // Default: format the value
                text = formatLabelValue(value, customLabelsConfig);
            }

            // Apply custom formatter
            text = applyCustomFormatter(text, value, customLabelsConfig);

            // Apply conditional formatting
            const condResult = applyConditionalFormatting(text, value, customLabelsConfig);
            text = condResult.text;
            const conditionalColor = condResult.color;
            const conditionalFontSize = condResult.fontSize;
            const conditionalFontWeight = condResult.fontWeight;
            const conditionalBgColor = condResult.backgroundColor;
            const conditionalBorderColor = condResult.borderColor;

            // Prefix/suffix
            if (customLabelsConfig.prefix) text = customLabelsConfig.prefix + text;
            if (customLabelsConfig.suffix) text = text + customLabelsConfig.suffix;

            // Build dynamic font string with conditional overrides
            const fontSize = conditionalFontSize || customLabelsConfig.fontSize || 14;
            const fontWeight = conditionalFontWeight || customLabelsConfig.fontWeight || 'bold';
            const fontFamily = customLabelsConfig.fontFamily || 'Arial';

            // Styling
            let color = conditionalColor || customLabelsConfig.color || '#222';
            let backgroundColor = conditionalBgColor || (customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.backgroundColor || '#fff'));
            let borderColor = conditionalBorderColor || (customLabelsConfig.shape === 'none' ? undefined : (customLabelsConfig.borderColor || '#333'));

            // Check if this label has a stored drag position
            const dragKey = `${datasetIdx}_${pointIdx}`;
            const storedPosition = dragState[dragKey];

            return {
                text,
                anchor: customLabelsConfig.anchor || 'center',
                shape: customLabelsConfig.shape || 'none',
                align: customLabelsConfig.align || 'center',
                color,
                backgroundColor,
                borderColor,
                borderWidth: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.borderWidth ?? 2),
                borderRadius: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.borderRadius ?? 6),
                padding: customLabelsConfig.shape === 'none' ? 0 : (customLabelsConfig.padding ?? 6),
                font: `${fontWeight} ${fontSize}px ${fontFamily}`,
                // Enhanced callout properties
                callout: customLabelsConfig.anchor === 'callout',
                calloutColor: customLabelsConfig.calloutColor || '#333',
                draggable: customLabelsConfig.anchor === 'callout',
                arrowLine: customLabelsConfig.arrowLine !== false,
                arrowHead: customLabelsConfig.arrowHead !== false,
                arrowColor: customLabelsConfig.arrowColor || customLabelsConfig.calloutColor || '#333',
                calloutOffset: customLabelsConfig.calloutOffset || 48,
                arrowEndGap: customLabelsConfig.arrowEndGap ?? 8,
                // Include stored position if available
                x: storedPosition?.x,
                y: storedPosition?.y,
            };
        });
    });
}

// Sync image positions from drag state into chart data before export
export function syncImagePositionsToConfig(chartData: any, dragState: any) {
    if (!dragState) return;
    chartData.datasets.forEach((dataset: any, datasetIdx: number) => {
        if (!dataset.pointImageConfig) return;
        dataset.pointImageConfig.forEach((config: any, pointIdx: number) => {
            const key = `${datasetIdx}_${pointIdx}`;
            if (dragState[key]) {
                config.calloutX = dragState[key].x;
                config.calloutY = dragState[key].y;
            }
        });
    });
}
