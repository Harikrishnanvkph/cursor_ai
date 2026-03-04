import React from "react"
import {
    ChartColumnBig, ChartColumnStacked, ChartBarBig, ChartLine, ChartPie,
    ChartScatter, ChartArea, Radar
} from "lucide-react"

/**
 * Parse a dimension value (number or string with units) into a numeric pixel value.
 * Shared across chart-preview, chart-generator, chart-layout, and editor page.
 */
export function parseDimension(value: any, fallback = 500): number {
    if (typeof value === 'number') {
        return isNaN(value) ? fallback : value;
    }
    if (typeof value === 'string') {
        const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(numericValue) ? fallback : numericValue;
    }
    return fallback;
}

/**
 * Background configuration type returned by getBackgroundConfig.
 */
export interface BackgroundConfig {
    type: 'color' | 'gradient' | 'image';
    color?: string;
    gradientStart?: string;
    gradientEnd?: string;
    opacity?: number;
    blur?: number;
    [key: string]: any;
}

/**
 * Get background configuration from chart config for exports and rendering.
 */
export function getBackgroundConfig(chartConfig: any): BackgroundConfig {
    const bgConfig = chartConfig?.background;

    if (bgConfig) {
        if (bgConfig.type === 'gradient') {
            return {
                ...bgConfig,
                type: 'gradient' as const,
                gradientStart: bgConfig.gradientStart || '#000000',
                gradientEnd: bgConfig.gradientEnd || '#ffffff',
                opacity: bgConfig.opacity ?? 100,
                blur: bgConfig.blur ?? 0
            };
        }
        return {
            ...bgConfig,
            opacity: bgConfig.opacity ?? 100,
            blur: bgConfig.blur ?? 0
        };
    }

    if (chartConfig?.backgroundColor) {
        return {
            type: 'color' as const,
            color: chartConfig.backgroundColor,
            opacity: 100
        };
    }

    return {
        type: 'color' as const,
        color: '#ffffff',
        opacity: 100
    };
}

/**
 * Get display name for a chart type.
 */
export function getChartDisplayName(
    chartType: string,
    chartConfig: any,
    chartData: any
): string {
    const displayNames: Record<string, string> = {
        bar: chartConfig?.indexAxis === "y" ? "Horizontal Bar" : "Bar",
        line: chartData?.datasets?.some((d: any) => d.fill) ? "Area" : "Line",
        area: "Area",
        pie: "Pie",
        doughnut: "Doughnut",
        radar: "Radar",
        polarArea: "Polar Area",
        scatter: "Scatter",
        bubble: "Bubble",
        horizontalBar: "Horizontal Bar",
        stackedBar: "Stacked Bar"
    };
    return displayNames[chartType] || chartType.charAt(0).toUpperCase() + chartType.slice(1);
}

/**
 * Get the Lucide icon for a chart display name.
 */
export function getChartIcon(chartName: string): React.ReactNode {
    switch (chartName) {
        case 'Bar':
            return React.createElement(ChartColumnBig, { className: "h-4 w-4 mr-1" });
        case 'Line':
            return React.createElement(ChartLine, { className: "h-4 w-4 mr-1" });
        case 'Horizontal Bar':
            return React.createElement(ChartBarBig, { className: "h-4 w-4 mr-1" });
        case 'Stacked Bar':
            return React.createElement(ChartColumnStacked, { className: "h-4 w-4 mr-1" });
        case 'Pie':
        case 'Doughnut':
            return React.createElement(ChartPie, { className: "h-4 w-4 mr-1" });
        case 'Polar Area':
        case 'Radar':
            return React.createElement(Radar, { className: "h-4 w-4 mr-1" });
        case 'Scatter':
        case 'Bubble':
            return React.createElement(ChartScatter, { className: "h-4 w-4 mr-1" });
        case 'Area':
            return React.createElement(ChartArea, { className: "h-4 w-4 mr-1" });
        default:
            return React.createElement(ChartColumnBig, { className: "h-4 w-4 mr-1" });
    }
}
