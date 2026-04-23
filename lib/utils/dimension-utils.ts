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
        if (value.includes('%')) return fallback;
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

// ─── Unit Conversion Utilities ───────────────────────────────────────

/**
 * Supported dimension input units.
 * px = pixels, mm = millimeters, cm = centimeters.
 */
export type DimensionUnit = 'px' | 'mm' | 'cm';

/** CSS standard: 1 inch = 96 CSS pixels. */
const CSS_DPI = 96;
/** Millimeters per inch. */
const MM_PER_INCH = 25.4;
/** Centimeters per inch. */
const CM_PER_INCH = 2.54;

/**
 * Convert a value from a given unit to CSS pixels (96 DPI).
 * @example convertToPixels(210, 'mm') → ≈ 794
 */
export function convertToPixels(value: number, unit: DimensionUnit, dpi = CSS_DPI): number {
    switch (unit) {
        case 'mm': return Math.round(value * dpi / MM_PER_INCH);
        case 'cm': return Math.round(value * dpi / CM_PER_INCH);
        case 'px':
        default:   return Math.round(value);
    }
}

/**
 * Convert a pixel value to a target unit.
 * @example convertFromPixels(794, 'mm') → ≈ 210
 */
export function convertFromPixels(px: number, unit: DimensionUnit, dpi = CSS_DPI): number {
    switch (unit) {
        case 'mm': return +(px * MM_PER_INCH / dpi).toFixed(1);
        case 'cm': return +(px * CM_PER_INCH / dpi).toFixed(2);
        case 'px':
        default:   return Math.round(px);
    }
}

/**
 * Format a pixel value with unit label.
 * @example formatDimension(794, 'mm') → "210 mm"
 */
export function formatDimension(px: number, unit: DimensionUnit): string {
    const val = convertFromPixels(px, unit);
    return `${val} ${unit}`;
}

// ─── Dimension Presets ───────────────────────────────────────────────

export interface DimensionPreset {
    name: string;
    /** Width in CSS pixels. */
    width: number;
    /** Height in CSS pixels. */
    height: number;
    icon: string;
}

export interface DimensionPresetCategory {
    label: string;
    presets: DimensionPreset[];
}

/** Default chart size for quick-start flows. */
export const DEFAULT_CHART_WIDTH = 800;
export const DEFAULT_CHART_HEIGHT = 600;

export const DIMENSION_PRESETS: DimensionPresetCategory[] = [
    {
        label: 'Chart Defaults',
        presets: [
            { name: 'Standard',  width: 800,  height: 600,  icon: 'chart' },
            { name: 'Square',    width: 600,  height: 600,  icon: 'square' },
            { name: 'Wide',      width: 1200, height: 600,  icon: 'widescreen' },
            { name: 'Compact',   width: 400,  height: 300,  icon: 'grid' },
            { name: 'Tall',      width: 600,  height: 900,  icon: 'tall' },
        ],
    },
    {
        label: 'Screen',
        presets: [
            { name: 'Social Post (1:1)',     width: 1080, height: 1080, icon: 'square' },
            { name: 'Instagram Story (9:16)', width: 1080, height: 1920, icon: 'tall' },
            { name: 'YouTube Thumbnail',     width: 1280, height: 720,  icon: 'play' },
            { name: 'HD (16:9)',             width: 1920, height: 1080, icon: 'widescreen' },
            { name: 'Presentation (16:9)',   width: 1920, height: 1080, icon: 'presentation' },
            { name: 'Web Banner',            width: 728,  height: 90,   icon: 'banner' },
        ],
    },
    {
        label: 'Print (300 DPI)',
        presets: [
            { name: 'A4 Portrait',      width: 2480, height: 3508, icon: 'page' },
            { name: 'A4 Landscape',     width: 3508, height: 2480, icon: 'page-landscape' },
            { name: 'A3 Portrait',      width: 3508, height: 4961, icon: 'page' },
            { name: 'A3 Landscape',     width: 4961, height: 3508, icon: 'page-landscape' },
            { name: 'US Letter',        width: 2550, height: 3300, icon: 'page' },
            { name: 'US Letter Landscape', width: 3300, height: 2550, icon: 'page-landscape' },
        ],
    },
];

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
