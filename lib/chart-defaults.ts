
import { ChartData, ChartTypeRegistry, ChartOptions, ChartDataset, ChartType } from "chart.js"

// Define our custom dataset properties
export interface PointImageConfig {
    type: string                    // 'circle' | 'square' | 'rounded' | 'regular'
    size: number                    // Image size in pixels
    position: string                // Position relative to data point
    arrow: boolean                  // Show arrow for callout
    arrowColor?: string             // Color of the arrow line
    borderWidth?: number            // Border width around image (callout mode)
    borderColor?: string            // Border color around image (callout mode)
    fillBar?: boolean               // Fill entire bar with image (bar charts only)
    fillSlice?: boolean             // Fill entire slice with image (pie/doughnut/polar charts only)
    imageFit?: string               // 'fill' | 'cover' | 'contain' (for fillBar/fillSlice mode)
    calloutX?: number               // Stored X position for callout dragging
    calloutY?: number               // Stored Y position for callout dragging
    offset?: number                 // Default offset for callout positioning
    [key: string]: any              // Additional config properties
}

// Chart Group for organizing datasets in Grouped Mode
export interface ChartGroup {
    id: string;                                      // Unique identifier
    name: string;                                    // Display name
    category: 'categorical' | 'coordinate' | null;  // null = not yet determined (lazy init)
    uniformityMode: 'uniform' | 'mixed';
    baseChartType?: SupportedChartType;              // For uniform groups, the locked type
    isDefault?: boolean;                             // If true, cannot be deleted/renamed
    createdAt: number;
    sourceId?: string;                               // ID of the conversation this group originated from
    sourceTitle?: string;                            // Original title of the conversation
    chartConfig?: ExtendedChartOptions;              // Per-group chart config (axes, labels, legend, design)
}

// Extend ChartTypeRegistry to include 'horizontalBar' type
// We'll handle 'area' as a string literal type in our application
declare module 'chart.js' {
    // Define the types for chartjs-plugin-datalabels
    // Based on https://chartjs-plugin-datalabels.netlify.app/guide/typescript.html
    // Context interface moved to lib/types/datalabels.ts to avoid duplicates

    interface FontOptions {
        family?: string;
        lineHeight?: number | string;
        size?: number;
        style?: string;
        weight?: string | number;
    }

    interface DatalabelsPluginOptions {
        align?: 'start' | 'center' | 'end' | number;
        anchor?: 'start' | 'center' | 'end';
        backgroundColor?: string | ((context: Context) => string) | null;
        borderColor?: string | ((context: Context) => string) | null;
        borderRadius?: number;
        borderWidth?: number;
        clamp?: boolean;
        clip?: boolean;
        color?: string | ((context: Context) => string);
        display?: boolean | 'auto' | ((context: Context) => boolean | 'auto');
        font?: FontOptions | ((context: Context) => FontOptions); // Renamed Font to FontOptions to avoid conflict if any
        formatter?: (value: any, context: Context) => any;
        labels?: { [key: string]: DatalabelsLabelOptions };
        listeners?: { [key: string]: (context: Context, event: Event) => void };
        offset?: number;
        opacity?: number;
        padding?: number | object;
        rotation?: number;
        textAlign?: 'start' | 'center' | 'end' | 'left' | 'right';
        textStrokeColor?: string | ((context: Context) => string);
        textStrokeWidth?: number;
        textShadowBlur?: number;
        textShadowColor?: string | ((context: Context) => string);
    }

    interface DatalabelsLabelOptions extends DatalabelsPluginOptions { }

    // Augment the existing PluginOptionsByType from Chart.js by redeclaring it.
    // TypeScript's declaration merging will add our 'datalabels' property.
    interface PluginOptionsByType<TType extends ChartType = ChartType> {
        datalabels?: DatalabelsPluginOptions;
        customLabelsConfig?: {
            display?: boolean;
            [key: string]: any;
        };
    }

    // Extend ChartTypeRegistry to include horizontalBar
    interface ChartTypeRegistry {
        horizontalBar: ChartTypeRegistry['bar'];
    }
}

// Define our custom chart types that extend Chart.js types
export type CustomChartType = 'stackedBar' | 'area' | 'pie3d' | 'doughnut3d' | 'bar3d' | 'horizontalBar3d';

// Define supported chart types as a union of Chart.js types and our custom types
type SupportedChartTypeLocal =
    | 'bar'
    | 'line'
    | 'scatter'
    | 'bubble'
    | 'pie'
    | 'doughnut'
    | 'polarArea'
    | 'radar'
    | 'horizontalBar';

export type SupportedChartType = SupportedChartTypeLocal | CustomChartType;

export type ChartMode = 'single' | 'grouped';


// Pattern overlay config for hatching / dots / crosshatch designs on chart elements
export interface PatternConfig {
    type: string       // Pattern type key (e.g. 'verticalLines', 'dots', 'crosshatch')
    color: string      // Pattern line/dot color
    lineWidth: number  // Stroke width for lines
    spacing: number    // Tile repeat size in px
    opacity?: number   // 0-100 opacity percentage (default 100)
}

interface CustomDatasetProperties {
    datasetColorMode?: 'single' | 'slice'
    color?: string
    pointImages?: (string | null)[]
    pointImageConfig?: PointImageConfig[]
    pointRadius?: number
    tension?: number
    fill?: boolean | string
    imageUrl?: string
    imageConfig?: {
        type: string
        position: string
        size: number
        arrow?: boolean
        fill?: boolean
    }
    mode?: ChartMode  // Track whether dataset belongs to single or grouped mode
    groupId?: string  // Associates dataset with a specific group in grouped mode
    sliceLabels?: string[] // Per-dataset slice names
    chartType?: SupportedChartType // Chart type for this specific dataset (used in mixed mode)
    chartConfig?: ExtendedChartOptions // Per-dataset chart config (single mode: each dataset has its own settings)
    slicePatterns?: (PatternConfig | null)[]  // Per-slice pattern overlay configs
    datasetPattern?: PatternConfig | null      // Whole-dataset pattern overlay (area/radar/grouped)
    customLabelsConfig?: Record<string, any>  // Per-dataset label config overrides
    sliceLabelOverrides?: Record<number, Record<string, any>>  // Per-slice label config overrides (sparse)
}

// Create a type that combines ChartDataset with our custom properties
export type ExtendedChartDataset<T extends keyof ChartTypeRegistry = keyof ChartTypeRegistry> = ChartDataset<T> & CustomDatasetProperties & {
    lastSliceColors?: string[]
    sourceTitle?: string // Title of the conversation/chart this dataset originated from
    sourceId?: string // ID of the conversation/chart this dataset originated from
}

// Define the chart data type with our extended dataset
export interface ExtendedChartData extends Omit<ChartData, "datasets"> {
    datasets: ExtendedChartDataset[]
}

export interface VisualSettings {
    fillArea: boolean;
    showBorder: boolean;
    showImages: boolean;
    showLabels: boolean;
    uniformityMode: 'uniform' | 'mixed';
}

// Create a custom interface that extends ChartOptions with our additional properties
export interface ExtendedChartOptions extends ChartOptions {
    manualDimensions?: boolean;
    dynamicDimension?: boolean;
    templateDimensions?: boolean;  // When true, dimensions are synced to template chartArea
    originalDimensions?: boolean;  // When true, dimensions are synced to original cloud-saved dimensions
    width?: number | string;
    height?: number | string;
    hoverFadeEffect?: boolean;
    visualSettings?: VisualSettings;
    background?: {
        type: 'color' | 'gradient' | 'image' | 'transparent';
        color?: string;
        gradientStart?: string;
        gradientEnd?: string;
        gradientType?: 'linear' | 'radial';
        gradientDirection?: 'to right' | 'to left' | 'to top' | 'to bottom' | '135deg';
        gradientColor1?: string;
        gradientColor2?: string;
        opacity?: number;
        imageUrl?: string;
        imageFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
        imageWhiteBase?: boolean;
        imageOpacity?: number;
    };
}

// Default group that always exists
export const DEFAULT_GROUP: ChartGroup = {
    id: 'default',
    name: 'Default',
    category: null,
    uniformityMode: 'uniform',
    isDefault: true,
    createdAt: 0
};

// Create a mapping from our chart types to Chart.js chart types
export const chartTypeMapping: Record<SupportedChartType, keyof ChartTypeRegistry> = {
    bar: 'bar',
    line: 'line',
    scatter: 'scatter',
    bubble: 'bubble',
    pie: 'pie',
    doughnut: 'doughnut',
    polarArea: 'polarArea',
    radar: 'radar',
    horizontalBar: 'bar',
    stackedBar: 'bar',
    area: 'line',
    pie3d: 'pie',
    doughnut3d: 'doughnut',
    bar3d: 'bar',
    horizontalBar3d: 'bar'
};

// Create a utility function to check if a chart should be displayed as an area chart
export const isAreaChart = (chartType: SupportedChartType, datasets: ExtendedChartDataset[]): boolean => {
    // If it's a line or area chart and all datasets have fill=true, it's an area chart
    return (chartType === 'line' || chartType === 'area') && datasets.every(d => d.fill === true)
}

/**
 * Prepares chart data for saving to backend by filtering and updating metadata.
 * CRITICAL: Only includes datasets belonging to the chart being saved.
 * - Single mode: Only the active dataset, with labels from sliceLabels
 * - Grouped mode: Only datasets in the active group
 */
export function prepareChartDataForSave(
    chartData: any,
    chartMode: 'single' | 'grouped',
    activeDatasetIndex: number,
    activeGroupId: string,
    savedTitle: string,
    conversationId: string,
    isNewSave: boolean
): any {
    const cloned = JSON.parse(JSON.stringify(chartData));

    if (chartMode === 'single') {
        // SINGLE MODE: Only save the active dataset
        const activeDataset = cloned.datasets[activeDatasetIndex];
        if (activeDataset) {
            activeDataset.sourceTitle = savedTitle;
            if (isNewSave) activeDataset.sourceId = conversationId;
            // Replace all datasets with just the active one
            cloned.datasets = [activeDataset];
            // IMPORTANT: Set top-level labels from the dataset's sliceLabels
            // This prevents labels from other datasets bleeding into this chart
            if (activeDataset.sliceLabels && activeDataset.sliceLabels.length > 0) {
                cloned.labels = activeDataset.sliceLabels;
            } else {
                // Fallback: generate default labels based on data length
                cloned.labels = activeDataset.data?.map((_: any, i: number) => `Label ${i + 1}`) || [];
            }
        }
    } else if (chartMode === 'grouped') {
        // GROUPED MODE: Only save datasets belonging to the active group
        const groupDatasets = cloned.datasets.filter((ds: any) => ds.groupId === activeGroupId);
        groupDatasets.forEach((ds: any) => {
            ds.sourceTitle = savedTitle;
            if (isNewSave) ds.sourceId = conversationId;
        });
        // Replace all datasets with just the group's datasets
        cloned.datasets = groupDatasets;
        // For grouped mode, use the first dataset's sliceLabels as the shared labels
        if (groupDatasets.length > 0 && groupDatasets[0].sliceLabels) {
            cloned.labels = groupDatasets[0].sliceLabels;
        }
    }

    return cloned;
}

export const defaultChartData = {
    labels: ["January", "February", "March", "April", "May"],
    datasets: [
        {
            label: "Sample Data",
            data: [12, 19, 3, 5, 2],
            backgroundColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"],
            borderColor: ["#1d4ed8", "#dc2626", "#059669", "#d97706", "#7c3aed"],
            borderWidth: 2,
            pointImages: [null, null, null, null, null],
            pointImageConfig: [
                { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
                { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
                { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
                { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
                { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
            ],
            chartType: "bar", // Store the chartType this dataset was created with
        },
    ],
}

// Factory functions for default data — returns a fresh object each time to prevent
// shared-reference mutations from polluting defaults across the session.

// Separate default data for single mode - empty by default
// User must explicitly load data via "Load Sample Data" or "Add Your Own Data"
export const singleModeDefaultData = (): ExtendedChartData => ({
    labels: [],
    datasets: [],
});

// Separate default data for grouped mode - empty by default
// User must explicitly load data via "Load Sample Data" or "Add Your Own Data"
export const groupedModeDefaultData = (): ExtendedChartData => ({
    labels: [],
    datasets: [],
});

// Function to get default data for a specific mode
export const getDefaultDataForMode = (mode: ChartMode): ExtendedChartData => {
    return mode === 'single' ? singleModeDefaultData() : groupedModeDefaultData();
}

// Export getDefaultConfigForType for use in chart-preview
export const getDefaultConfigForType = (type: SupportedChartType): ExtendedChartOptions => {
    // Track if this is a 3D variant for plugin enabling
    const is3DPie = type === ('pie3d' as CustomChartType) || type === ('doughnut3d' as CustomChartType);
    const is3DBar = type === ('bar3d' as CustomChartType) || type === ('horizontalBar3d' as CustomChartType);

    // For area chart, use line chart config
    let processedType: keyof ChartTypeRegistry;
    if (type === ('area' as CustomChartType)) {
        processedType = 'line';
    } else if (is3DPie) {
        processedType = type === 'pie3d' ? 'pie' : 'doughnut';
    } else if (is3DBar || type === 'horizontalBar' || type === 'stackedBar') {
        processedType = 'bar';
    } else {
        processedType = type as keyof ChartTypeRegistry;
    }

    let baseConfig: ExtendedChartOptions = {
        responsive: false,
        manualDimensions: true,
        width: '800px',
        height: '600px',
        visualSettings: {
            fillArea: (type !== 'line'), // Line charts should default to no fill
            showBorder: true,
            showImages: true,
            showLabels: true,
            uniformityMode: 'uniform'
        },
        layout: {
            padding: { top: 10, right: 10, bottom: 10, left: 10 }
        },
        plugins: {
            title: {
                display: true,
                text: "My Chart",
            },
            subtitle: {
                display: true,
                text: "Custom Chart Subtitle",
            },
            legend: {
                display: true,
                position: "top",
                labels: {
                    color: '#000000', // Set default legend color to black
                    usePointStyle: true, // Default to true
                    pointStyle: 'rect' // Default to Rectangle
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: "rgba(0,0,0,0.8)",
                titleColor: "#fff",
                bodyColor: "#fff",
                borderColor: "#ccc",
                borderWidth: 1,
            },
            // @ts-ignore - datalabels is a valid plugin but not in Chart.js base types
            datalabels: {
                display: true,
                anchor: 'center',
                align: 'center',
                offset: 0,
                color: '#000',
                font: {
                    weight: 'bold',
                    size: 14,
                },
                formatter: (value: any, context: any) => {
                    // For pie/doughnut/polarArea, show value by default
                    if (context.chart.config.type === 'pie' || context.chart.config.type === 'doughnut' || context.chart.config.type === 'polarArea') {
                        return value
                    }
                    return value
                },
            },
            // @ts-ignore - legendType is a custom property 
            legendType: 'dataset', // Default for axis charts

            // 3D Plugin Defaults
            // @ts-ignore
            pie3d: is3DPie ? { enabled: true, depth: 20, darken: 0.25, tilt: 0.75, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 5 } : { enabled: false },
            // @ts-ignore
            bar3d: is3DBar ? { enabled: true, depth: 12, darken: 0.2, angle: 45, shadowColor: 'rgba(0,0,0,0.3)', shadowBlur: 10, shadowOffsetX: 0, shadowOffsetY: 5 } : { enabled: false },
        },
        animation: {
            duration: 1000,
            easing: "easeOutQuart",
        },
        interaction: {
            intersect: true,
            mode: "point" as const,
        },
    }

    // Add default background property
    baseConfig = { ...baseConfig, background: { type: 'color', color: '#ffffff', opacity: 100, gradientDirection: 'to right' } };

    // Special configuration for radar chart
    if (processedType === 'radar') {
        return {
            ...baseConfig,
            plugins: {
                ...baseConfig.plugins,
                // @ts-ignore - legendType is a custom property
                legendType: 'dataset' // Radar uses datasets, not slices
            },
            scales: {
                r: {
                    type: 'radialLinear', // Required for Chart.js to recognize radial scale
                    display: true,
                    beginAtZero: true,
                    min: undefined,
                    max: undefined,
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                        circular: false // Default to polygonal grid, panel can toggle to circular
                    },
                    angleLines: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1
                    },
                    pointLabels: {
                        display: true,
                        color: "#666666",
                        font: {
                            size: 12
                        },
                        padding: 20
                    },
                    ticks: {
                        display: true, // Corresponds to 'Show Scale Labels' in RadarPanel
                        color: "#666666", // Corresponds to 'Scale Label Color' in RadarPanel
                        backdropColor: "rgba(255, 255, 255, 0.8)",
                        backdropPadding: 4,
                        stepSize: undefined, // Corresponds to 'Step Size' in RadarPanel
                        z: 1
                    }
                }
            }
        }
    }

    // Special configuration for polarArea chart
    if (processedType === 'polarArea') {
        return {
            ...baseConfig,
            scales: {
                r: {
                    type: 'radialLinear', // Required for Chart.js to recognize radial scale
                    beginAtZero: true,
                    min: 0,
                    ticks: {
                        stepSize: undefined,
                        display: true,
                        color: '#666666',
                        backdropColor: 'rgba(0,0,0,0)',
                    },
                    grid: {
                        display: true,
                        color: '#CCCCCC',
                        lineWidth: 1,
                        circular: true, // Default to circular for polar area
                    },
                    angleLines: {
                        display: false,
                        color: '#CCCCCC',
                        lineWidth: 1,
                    },
                },
            },
            // For polarArea, datalabels are often useful, let's enable them by default but allow override
            plugins: {
                ...baseConfig.plugins, // Keep other base plugin configs like title, legend, tooltip
                // @ts-ignore - legendType is a custom property
                legendType: 'slice', // Override to slice for polar area
                datalabels: { // Override datalabels specifically for polarArea
                    display: true, // Default to true for polarArea
                    color: '#fff', // White color for better contrast on colored slices
                    formatter: (value: any) => value, // Show the actual value
                    // Add other polarArea specific datalabel defaults if needed
                },
            },
        } as ExtendedChartOptions;
    }

    if (processedType === 'pie' || processedType === 'doughnut') {
        return {
            ...baseConfig,
            startAngle: 0, // Default start angle (3 o'clock)
            circumference: 360, // Default circumference (full circle)
            plugins: {
                ...baseConfig.plugins,
                legendType: 'slice', // Override to slice for pie/doughnut
                datalabels: { // Ensure datalabels are configured for pie/doughnut
                    display: true,
                    color: '#fff',
                    formatter: (value: any, context: any) => {
                        // Example: show percentage by default for pie/doughnut
                        const total = context.chart.data.datasets[0].data.reduce((acc: number, val: number) => acc + val, 0);
                        if (total === 0) return '0%';
                        const percentage = (value / total * 100);
                        // Show one decimal place only if not a whole number
                        return percentage % 1 === 0 ? percentage.toFixed(0) + '%' : percentage.toFixed(1) + '%';
                    },
                    font: {
                        weight: 'bold',
                        size: 14,
                    },
                    anchor: 'center',
                    align: 'center',
                }
            }
        } as ExtendedChartOptions; // Use typeof processedType for correct typing
    }

    // Handle horizontalBar chart (legacy)
    if (processedType === 'horizontalBar') {
        return {
            ...baseConfig,
            indexAxis: 'y',
            scales: {
                x: {
                    display: true,
                    grace: 5, // Add default grace for x-axis
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                        drawOnChartArea: true,
                        drawTicks: true,
                        tickLength: 6,
                        tickWidth: 1,
                        tickColor: "#666666",
                    },
                    ticks: {
                        display: true,
                        font: {
                            size: 12,
                        },
                        color: "#666666",
                        padding: 8,
                    },
                    title: {
                        display: false,
                        text: "",
                        font: {
                            size: 14,
                        },
                        color: "#333333",
                    },
                    border: {
                        display: true,
                        color: "#666666",
                        width: 1,
                    },
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grace: 5, // Add default grace for y-axis
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                        drawOnChartArea: true,
                        drawTicks: true,
                        tickLength: 6,
                        tickWidth: 1,
                        tickColor: "#666666",
                    },
                    ticks: {
                        display: true,
                        font: {
                            size: 12,
                        },
                        color: "#666666",
                        padding: 8,
                    },
                    title: {
                        display: false,
                        text: "",
                        font: {
                            size: 14,
                        },
                        color: "#333333",
                    },
                    border: {
                        display: true,
                        color: "#666666",
                        width: 1,
                    },
                },
            },
        }
    }

    // Special configuration for scatter charts
    if (processedType === 'scatter') {
        return {
            ...baseConfig,
            interaction: {
                intersect: false,
                mode: 'nearest' as const,
            },
            elements: {
                point: {
                    radius: 6,
                    hoverRadius: 10,
                    pointStyle: 'circle',
                    borderWidth: 1,
                }
            },
            scales: {
                x: {
                    display: true,
                    type: 'linear',
                    position: 'bottom',
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                    },
                    ticks: {
                        display: true,
                        font: { size: 12 },
                        color: "#666666",
                    },
                    title: {
                        display: true,
                        text: "X Axis",
                        font: { size: 14 },
                        color: "#333333",
                    },
                },
                y: {
                    display: true,
                    type: 'linear',
                    beginAtZero: false,
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                    },
                    ticks: {
                        display: true,
                        font: { size: 12 },
                        color: "#666666",
                    },
                    title: {
                        display: true,
                        text: "Y Axis",
                        font: { size: 14 },
                        color: "#333333",
                    },
                },
            },
        }
    }

    // Special configuration for bubble charts
    if (processedType === 'bubble') {
        return {
            ...baseConfig,
            interaction: {
                intersect: false,
                mode: 'nearest' as const,
            },
            elements: {
                point: {
                    radius: 3, // Base radius, actual size comes from data 'r' value
                    hoverRadius: 20,
                    pointStyle: 'circle',
                    borderWidth: 1,
                }
            },
            scales: {
                x: {
                    display: true,
                    type: 'linear',
                    position: 'bottom',
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                    },
                    ticks: {
                        display: true,
                        font: { size: 12 },
                        color: "#666666",
                    },
                    title: {
                        display: true,
                        text: "X Axis",
                        font: { size: 14 },
                        color: "#333333",
                    },
                },
                y: {
                    display: true,
                    type: 'linear',
                    beginAtZero: false,
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                    },
                    ticks: {
                        display: true,
                        font: { size: 12 },
                        color: "#666666",
                    },
                    title: {
                        display: true,
                        text: "Y Axis",
                        font: { size: 14 },
                        color: "#333333",
                    },
                },
            },
        }
    }

    // Pie and doughnut charts don't need scales
    if (['pie', 'doughnut'].includes(processedType as string)) {
        return baseConfig
    }

    // Special configuration for area charts - use 'nearest' interaction mode
    if (type === ('area' as CustomChartType)) {
        return {
            ...baseConfig,
            interaction: {
                intersect: false,
                mode: 'nearest' as const,
            },
            scales: {
                x: {
                    display: true,
                    grace: 5,
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                        drawOnChartArea: true,
                        drawTicks: true,
                        tickLength: 6,
                        tickWidth: 1,
                        tickColor: "#666666",
                    },
                    ticks: {
                        display: true,
                        font: { size: 12 },
                        color: "#666666",
                        padding: 8,
                    },
                    title: {
                        display: false,
                        text: "",
                        font: { size: 14 },
                        color: "#333333",
                    },
                    border: {
                        display: true,
                        color: "#666666",
                        width: 1,
                    },
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    grace: 5,
                    grid: {
                        display: true,
                        color: "#e5e7eb",
                        lineWidth: 1,
                        drawOnChartArea: true,
                        drawTicks: true,
                        tickLength: 6,
                        tickWidth: 1,
                        tickColor: "#666666",
                    },
                    ticks: {
                        display: true,
                        font: { size: 12 },
                        color: "#666666",
                        padding: 8,
                    },
                    title: {
                        display: false,
                        text: "",
                        font: { size: 14 },
                        color: "#333333",
                    },
                    border: {
                        display: true,
                        color: "#666666",
                        width: 1,
                    },
                },
            },
        }
    }

    return {
        ...baseConfig,
        scales: {
            x: {
                display: true,
                grace: 5, // Add default grace for x-axis
                grid: {
                    display: true,
                    color: "#e5e7eb",
                    lineWidth: 1,
                    drawOnChartArea: true,
                    drawTicks: true,
                    tickLength: 6,
                    tickWidth: 1,
                    tickColor: "#666666",
                },
                ticks: {
                    display: true,
                    font: {
                        size: 12,
                    },
                    color: "#666666",
                    padding: 8,
                },
                title: {
                    display: false,
                    text: "",
                    font: {
                        size: 14,
                    },
                    color: "#333333",
                },
                border: {
                    display: true,
                    color: "#666666",
                    width: 1,
                },
            },
            y: {
                display: true,
                beginAtZero: true,
                grace: 5, // Add default grace for y-axis
                grid: {
                    display: true,
                    color: "#e5e7eb",
                    lineWidth: 1,
                    drawOnChartArea: true,
                    drawTicks: true,
                    tickLength: 6,
                    tickWidth: 1,
                    tickColor: "#666666",
                },
                ticks: {
                    display: true,
                    font: {
                        size: 12,
                    },
                    color: "#666666",
                    padding: 8,
                },
                title: {
                    display: false,
                    text: "",
                    font: {
                        size: 14,
                    },
                    color: "#333333",
                },
                border: {
                    display: true,
                    color: "#666666",
                    width: 1,
                },
            },
        },
    }
}
