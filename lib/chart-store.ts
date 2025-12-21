"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Chart, ChartConfiguration, ChartData, ChartType, ChartDataset, ChartOptions, ChartTypeRegistry } from "chart.js"

// Extend ChartTypeRegistry to include 'horizontalBar' type
// We'll handle 'area' as a string literal type in our application
declare module 'chart.js' {
  // Define the types for chartjs-plugin-datalabels
  // Based on https://chartjs-plugin-datalabels.netlify.app/guide/typescript.html
  interface Context {
    active: boolean;
    chart: Chart; // Chart type is now imported at the top
    dataIndex: number;
    dataset: ChartDataset;
    datasetIndex: number;
  }

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
  }

  // Extend ChartTypeRegistry to include horizontalBar
  interface ChartTypeRegistry {
    horizontalBar: ChartTypeRegistry['bar'];
  }


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
  };
}

// Define our custom dataset properties
interface PointImageConfig {
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

interface CustomDatasetProperties {
  datasetColorMode?: 'single' | 'slice'
  color?: string
  pointImages?: (string | null)[]
  pointImageConfig?: PointImageConfig[]
  pointRadius?: number
  tension?: number
  fill?: boolean
  imageUrl?: string
  imageConfig?: {
    type: string
    position: string
    size: number
    arrow?: boolean
    fill?: boolean
  }
  mode?: ChartMode  // Track whether dataset belongs to single or grouped mode
  sliceLabels?: string[] // Per-dataset slice names
  chartType?: SupportedChartType // Chart type for this specific dataset (used in mixed mode)
}

// Create a type that combines ChartDataset with our custom properties
export type ExtendedChartDataset<T extends keyof ChartTypeRegistry = keyof ChartTypeRegistry> = ChartDataset<T> & CustomDatasetProperties & {
  lastSliceColors?: string[]
}

// Define the chart data type with our extended dataset
export interface ExtendedChartData extends Omit<ChartData, "datasets"> {
  datasets: ExtendedChartDataset[]
}

// Define our custom chart types that extend Chart.js types
type CustomChartType = 'stackedBar' | 'area';

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
  area: 'line'
};

// Create a utility function to check if a chart should be displayed as an area chart
export const isAreaChart = (chartType: SupportedChartType, datasets: ExtendedChartDataset[]): boolean => {
  // If it's a line or area chart and all datasets have fill=true, it's an area chart
  return (chartType === 'line' || chartType === 'area') && datasets.every(d => d.fill === true)
}

export type ChartMode = 'single' | 'grouped'

// Overlay types
export interface OverlayImage {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  naturalWidth?: number
  naturalHeight?: number
  useNaturalSize: boolean
  visible: boolean
  borderWidth: number
  borderColor: string
  shape: 'rectangle' | 'circle' | 'rounded'
  imageFit?: 'fill' | 'cover' | 'contain'
  zIndex: number
}

export interface OverlayText {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  color: string
  backgroundColor: string
  backgroundTransparent: boolean
  borderWidth: number
  borderColor: string
  paddingX: number
  paddingY: number
  visible: boolean
  rotation: number
  zIndex: number
  maxWidth?: number // Maximum width for text wrapping
}

interface ChartStore {
  // Global chart reference for sharing between components
  globalChartRef: React.MutableRefObject<any> | null
  setGlobalChartRef: (ref: React.MutableRefObject<any>) => void
  chartType: SupportedChartType;
  chartData: ExtendedChartData;
  chartConfig: ExtendedChartOptions;
  chartMode: ChartMode;
  activeDatasetIndex: number;
  // Add separate storage for each mode's datasets
  singleModeData: ExtendedChartData;
  groupedModeData: ExtendedChartData;
  // Add uniformity mode for grouped charts
  uniformityMode: 'uniform' | 'mixed';
  legendFilter: {
    datasets: Record<number, boolean>;
    slices: Record<number, boolean>;
  };
  fillArea: boolean;
  showBorder: boolean;
  showImages: boolean;
  showLabels: boolean;
  hasJSON: boolean;
  currentSnapshotId: string | null; // Track current snapshot ID for updates
  setCurrentSnapshotId: (id: string | null) => void; // Setter for current snapshot ID
  // Original cloud dimensions - preserves dimensions when loaded from cloud
  originalCloudDimensions: { width: string; height: string } | null;
  setOriginalCloudDimensions: (dimensions: { width: string; height: string } | null) => void;
  // Overlay state
  overlayImages: OverlayImage[];
  overlayTexts: OverlayText[];
  selectedImageId: string | null;
  selectedTextId: string | null;
  toggleDatasetVisibility: (index: number) => void;
  toggleSliceVisibility: (index: number) => void;
  setChartType: (type: SupportedChartType) => void;
  addDataset: (dataset: ExtendedChartDataset) => void;
  removeDataset: (index: number) => void;
  updateDataset: (index: number, updates: Partial<ExtendedChartDataset> & { addPoint?: boolean; removePoint?: boolean; randomizeColors?: boolean }) => void;
  updateDataPoint: (datasetIndex: number, pointIndex: number, field: string, value: any) => void;
  updateChartConfig: (config: ExtendedChartOptions) => void;
  updatePointImage: (datasetIndex: number, pointIndex: number, imageUrl: string, imageConfig: any) => void;
  resetChart: () => void;
  setChartMode: (mode: ChartMode) => void;
  setActiveDatasetIndex: (index: number) => void;
  setUniformityMode: (mode: 'uniform' | 'mixed') => void;
  updateLabels: (labels: string[]) => void;
  toggleFillArea: () => void;
  toggleShowBorder: () => void;
  toggleShowImages: () => void;
  toggleShowLabels: () => void;
  setFullChart: (chart: { chartType: SupportedChartType; chartData: ExtendedChartData; chartConfig: ExtendedChartOptions; id?: string }) => void;
  setHasJSON: (value: boolean) => void;
  // Overlay actions
  addOverlayImage: (image: Omit<OverlayImage, 'id'>) => void;
  updateOverlayImage: (id: string, updates: Partial<OverlayImage>) => void;
  removeOverlayImage: (id: string) => void;
  addOverlayText: (text: Omit<OverlayText, 'id'>) => void;
  updateOverlayText: (id: string, updates: Partial<OverlayText>) => void;
  removeOverlayText: (id: string) => void;
  setSelectedImageId: (id: string | null) => void;
  setSelectedTextId: (id: string | null) => void;
  // Data operations (temporary transformations)
  sortDataset: (index: number, order: 'asc' | 'desc') => void;
  reverseDataset: (index: number) => void;
  backupDatasetState: (index: number) => void;
  restoreDatasetState: (index: number) => void;
  datasetBackups: Map<number, { labels: string[], data: any[], backgroundColor: any, borderColor: any, pointImages: any[], pointImageConfig: any[] }>;
}

const defaultChartData = {
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
    },
  ],
}

// Separate default data for single mode
const singleModeDefaultData = {
  labels: ["Q1", "Q2", "Q3", "Q4"],
  datasets: [
    {
      label: "Single Mode Data",
      data: [25, 35, 20, 40],
      backgroundColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b"],
      borderColor: ["#1d4ed8", "#dc2626", "#059669", "#d97706"],
      borderWidth: 2,
      pointImages: [null, null, null, null],
      pointImageConfig: [
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
      ],
      mode: 'single' as ChartMode,
      sliceLabels: ["Q1", "Q2", "Q3", "Q4"],
    },
  ],
}

// Separate default data for grouped mode
const groupedModeDefaultData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      label: "Grouped Mode Data A",
      data: [15, 25, 18, 30, 22, 28],
      backgroundColor: ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"],
      borderColor: ["#1d4ed8", "#dc2626", "#059669", "#d97706", "#7c3aed", "#be185d"],
      borderWidth: 2,
      pointImages: [null, null, null, null, null, null],
      pointImageConfig: [
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
      ],
      mode: 'grouped' as ChartMode,
      sliceLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    },
    {
      label: "Grouped Mode Data B",
      data: [20, 30, 25, 35, 28, 32],
      backgroundColor: ["#06b6d4", "#f97316", "#84cc16", "#a855f7", "#f43f5e", "#14b8a6"],
      borderColor: ["#0891b2", "#ea580c", "#65a30d", "#9333ea", "#e11d48", "#0d9488"],
      borderWidth: 2,
      pointImages: [null, null, null, null, null, null],
      pointImageConfig: [
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
      ],
      mode: 'grouped' as ChartMode,
      sliceLabels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    },
  ],
}

// Function to get default data for a specific mode
export const getDefaultDataForMode = (mode: ChartMode): ExtendedChartData => {
  return mode === 'single' ? singleModeDefaultData : groupedModeDefaultData;
}

// Export getDefaultConfigForType for use in chart-preview
export const getDefaultConfigForType = (type: SupportedChartType): ExtendedChartOptions => {
  // For area chart, use line chart config
  // Use type assertion to avoid TypeScript error
  let processedType: keyof ChartTypeRegistry;
  if (type === ('area' as CustomChartType)) {
    processedType = 'line';
  } else {
    processedType = type as keyof ChartTypeRegistry;
  }
  let baseConfig: ExtendedChartOptions = {
    responsive: true,
    manualDimensions: false,
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
        legendType: 'slice' // Override to slice for radar
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
            display: true,
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
    } as ChartOptions<'polarArea'>;
  }

  // Special configuration for pie and doughnut charts
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
    } as ChartOptions<typeof processedType>; // Use typeof processedType for correct typing
  }

  // Handle horizontal bar chart
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

// Global state for drag handling
const dragState = {
  isDragging: false,
  dragDatasetIndex: -1,
  dragPointIndex: -1,
  dragOffsetX: 0,
  dragOffsetY: 0,
}

// Universal image plugin for all chart types
const universalImagePlugin = {
  id: "universalImages",
  afterDraw: (chart: any) => {
    const ctx = chart.ctx
    const chartArea = chart.chartArea

    chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
      // Respect default Chart.js legend visibility for datasets
      if (typeof chart.isDatasetVisible === 'function' && chart.isDatasetVisible(datasetIndex) === false) {
        return;
      }
      const meta = chart.getDatasetMeta(datasetIndex)
      if (!meta || !meta.data || !dataset.pointImages) return

      meta.data.forEach((element: any, pointIndex: number) => {
        // For pie/doughnut/polarArea, respect per-slice visibility toggled by legend
        const type = chart.config?.type;
        if ((type === 'pie' || type === 'doughnut' || type === 'polarArea') &&
          typeof chart.getDataVisibility === 'function' && chart.getDataVisibility(pointIndex) === false) {
          return;
        }
        const imageUrl = dataset.pointImages[pointIndex];
        const imageConfig = dataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chart.config.type || 'bar')

        if (imageUrl && element) {
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => {
            ctx.save()
            const chartType = chart.config.type
            const x = element.x
            const y = element.y

            // Add chart reference to element
            element.chart = chart

            // Fill Slice/Bar takes priority over position - check it first
            if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
              if (imageConfig.fillSlice) {
                // Fill slice mode - ignore position setting
                renderSliceImage(ctx, element, img, imageConfig)
                ctx.restore()
                return
              }
            } else if (chartType === "bar") {
              if (imageConfig.fillBar) {
                // Fill bar mode - ignore position setting
                if (chart.config.options?.indexAxis === "y") {
                  renderBarImageHorizontal(ctx, element, img, imageConfig)
                } else {
                  renderBarImageVertical(ctx, element, img, imageConfig)
                }
                ctx.restore()
                return
              }
            }

            // Handle callout position for all chart types (only if fillSlice/fillBar is not enabled)
            if (imageConfig.position === "callout") {
              renderCalloutImage(ctx, x, y, img, imageConfig, datasetIndex, pointIndex, chart)
              ctx.restore()
              return
            }

            if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
              renderSliceImage(ctx, element, img, imageConfig)
            } else if (chartType === "bar") {
              if (chart.config.options?.indexAxis === "y") {
                renderBarImageHorizontal(ctx, element, img, imageConfig)
              } else {
                renderBarImageVertical(ctx, element, img, imageConfig)
              }
            } else if (
              chartType === "line" ||
              chartType === "scatter" ||
              chartType === "bubble" ||
              chartType === "radar"
            ) {
              renderPointImage(ctx, element, img, imageConfig)
            }

            ctx.restore()
          }
          img.src = imageUrl
        }
      })
    })
  },
  afterInit: (chart: any) => {
    // Set up event listeners for dragging
    const canvas = chart.canvas

    const handleMouseDown = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      // Check if clicking on a callout
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        if (!dataset.pointImageConfig) return

        const meta = chart.getDatasetMeta(datasetIndex)
        if (!meta || !meta.data) return

        // Iterate over visible elements only (meta.data is already filtered)
        meta.data.forEach((element: any, filteredPointIndex: number) => {
          // Map filtered index back to original index for accessing pointImageConfig
          // Since datasets are filtered, we need to find the original index
          // For now, use filteredPointIndex directly as the datasets are already filtered
          const pointIndex = filteredPointIndex
          const config = dataset.pointImageConfig?.[pointIndex]

          if (config && config.position === "callout" && dataset.pointImages?.[pointIndex]) {
            if (!element) return

            const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40)
            const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40)
            const size = config.size || 30

            const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2)

            if (distance <= size / 2) {
              dragState.isDragging = true
              dragState.dragDatasetIndex = datasetIndex
              dragState.dragPointIndex = pointIndex
              dragState.dragOffsetX = x - calloutX
              dragState.dragOffsetY = y - calloutY
              canvas.style.cursor = "grabbing"
              event.preventDefault()
            }
          }
        })
      })
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top

      if (dragState.isDragging) {
        // Update callout position
        const dataset = chart.data.datasets[dragState.dragDatasetIndex]
        if (dataset && dataset.pointImageConfig && dataset.pointImageConfig[dragState.dragPointIndex]) {
          const config = dataset.pointImageConfig[dragState.dragPointIndex]

          config.calloutX = x - dragState.dragOffsetX
          config.calloutY = y - dragState.dragOffsetY

          // Redraw chart
          chart.update("none")
        }
        event.preventDefault()
      } else {
        // Check if hovering over a callout
        let isOverCallout = false

        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          if (!dataset.pointImageConfig) return

          dataset.pointImageConfig.forEach((config: any, pointIndex: number) => {
            if (config && config.position === "callout" && dataset.pointImages[pointIndex]) {
              const meta = chart.getDatasetMeta(datasetIndex)
              const element = meta.data[pointIndex]

              if (!element) return

              const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40)
              const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40)
              const size = config.size || 30

              const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2)

              if (distance <= size / 2) {
                isOverCallout = true
              }
            }
          })
        })

        canvas.style.cursor = isOverCallout ? "grab" : "default"
      }
    }

    const handleMouseUp = () => {
      if (dragState.isDragging) {
        dragState.isDragging = false
        dragState.dragDatasetIndex = -1
        dragState.dragPointIndex = -1
        canvas.style.cursor = "default"
      }
    }

    // Touch event handlers for mobile/tablet support
    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      // Check if touching a callout (same logic as mouse)
      chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
        if (!dataset.pointImageConfig) return

        const meta = chart.getDatasetMeta(datasetIndex)
        if (!meta || !meta.data) return

        // Iterate over visible elements only (meta.data is already filtered)
        meta.data.forEach((element: any, filteredPointIndex: number) => {
          const pointIndex = filteredPointIndex
          const config = dataset.pointImageConfig?.[pointIndex]

          if (config && config.position === "callout" && dataset.pointImages?.[pointIndex]) {
            if (!element) return

            const calloutX = config.calloutX !== undefined ? config.calloutX : element.x + (config.offset || 40)
            const calloutY = config.calloutY !== undefined ? config.calloutY : element.y - (config.offset || 40)
            const size = config.size || 30

            const distance = Math.sqrt((x - calloutX) ** 2 + (y - calloutY) ** 2)

            if (distance <= size / 2) {
              dragState.isDragging = true
              dragState.dragDatasetIndex = datasetIndex
              dragState.dragPointIndex = pointIndex
              dragState.dragOffsetX = x - calloutX
              dragState.dragOffsetY = y - calloutY
              canvas.style.cursor = "grabbing"
              event.preventDefault()
            }
          }
        })
      })
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      const touch = event.touches[0]
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      if (dragState.isDragging) {
        // Update callout position
        const dataset = chart.data.datasets[dragState.dragDatasetIndex]
        if (dataset && dataset.pointImageConfig && dataset.pointImageConfig[dragState.dragPointIndex]) {
          const config = dataset.pointImageConfig[dragState.dragPointIndex]

          config.calloutX = x - dragState.dragOffsetX
          config.calloutY = y - dragState.dragOffsetY

          // Redraw chart
          chart.update("none")
        }
        event.preventDefault()
      }
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (dragState.isDragging) {
        dragState.isDragging = false
        dragState.dragDatasetIndex = -1
        dragState.dragPointIndex = -1
        canvas.style.cursor = "default"
        event.preventDefault()
      }
    }

    // Add event listeners for both mouse and touch
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)

    // Touch event listeners for mobile/tablet support
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false })
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false })
    canvas.addEventListener("touchend", handleTouchEnd, { passive: false })
    canvas.addEventListener("mouseleave", handleMouseUp) // Stop dragging when leaving canvas

    // Store references for cleanup
    chart._imagePluginListeners = {
      mousedown: handleMouseDown,
      mousemove: handleMouseMove,
      mouseup: handleMouseUp,
      mouseleave: handleMouseUp,
    }
  },
  beforeDestroy: (chart: any) => {
    // Clean up event listeners
    if (chart._imagePluginListeners) {
      const canvas = chart.canvas
      Object.entries(chart._imagePluginListeners).forEach(([event, handler]) => {
        canvas.removeEventListener(event, handler as EventListener)
      })
      delete chart._imagePluginListeners
    }
  },
}

// Render image for vertical bar charts
function renderBarImageVertical(ctx: any, element: any, img: any, config: any) {
  const size = config.size || 30
  const x = element.x
  let y = element.y

  // If fill mode is enabled, fill the entire bar with the image
  if (config.fillBar) {
    const barWidth = element.width
    const barHeight = Math.abs(element.y - element.base)

    // Calculate position (top-left corner of the bar)
    const barX = element.x - barWidth / 2
    const barY = Math.min(element.y, element.base)

    // Draw the image to fill the entire bar
    ctx.save()
    ctx.beginPath()
    ctx.rect(barX, barY, barWidth, barHeight)
    ctx.clip()

    // Determine how to fit the image
    if (config.imageFit === "cover") {
      // Cover: maintain aspect ratio and cover entire area
      const imgRatio = img.width / img.height
      const barRatio = barWidth / barHeight

      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawHeight = barHeight
        drawWidth = drawHeight * imgRatio
        offsetX = (barWidth - drawWidth) / 2
      } else {
        // Image is taller than bar (relative to width)
        drawWidth = barWidth
        drawHeight = drawWidth / imgRatio
        offsetY = (barHeight - drawHeight) / 2
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight)
    } else if (config.imageFit === "contain") {
      // Contain: maintain aspect ratio and fit within area
      const imgRatio = img.width / img.height
      const barRatio = barWidth / barHeight

      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawWidth = barWidth
        drawHeight = drawWidth / imgRatio
        offsetY = (barHeight - drawHeight) / 2
      } else {
        // Image is taller than bar (relative to width)
        drawHeight = barHeight
        drawWidth = drawHeight * imgRatio
        offsetX = (barWidth - drawWidth) / 2
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight)
    } else {
      // Fill: stretch to fill entire area
      ctx.drawImage(img, barX, barY, barWidth, barHeight)
    }

    ctx.restore()
    return
  }

  // Original positioning logic for non-fill mode
  switch (config.position) {
    case "center":
      // Center of the bar: halfway between top (element.y) and base (element.base)
      y = ((element.y ?? 0) + (element.base ?? 0)) / 2;
      break
    case "above":
      // Just above the bar
      y = (element.y ?? 0) - size / 2 - 8;
      break
    case "below":
      // Just inside the bottom of the bar
      y = (element.base ?? 0) - size / 2 - 8;
      break
    case "callout":
      // Callout position - handled separately
      const chart = element.chart;
      const datasetIndex = element._datasetIndex || 0;
      const pointIndex = element._index || 0;
      renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart)
      return
    default:
      y = element.y - size / 2 - 5
      break
  }

  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

// Render image for horizontal bar charts
function renderBarImageHorizontal(ctx: any, element: any, img: any, config: any) {
  const size = config.size || 30
  let x = element.x
  const y = element.y

  // If fill mode is enabled, fill the entire bar with the image
  if (config.fillBar) {
    // Improved fallback for barHeight
    let barHeight = element.height;
    if (!barHeight || barHeight <= 0) {
      // Try to estimate from meta data if available
      const meta = element.$context?.dataset?.meta;
      if (meta && meta.data && meta.data.length > 1) {
        const idx = element.$context.dataIndex;
        if (meta.data[idx + 1]) {
          barHeight = Math.abs(meta.data[idx + 1].y - element.y);
        }
      }
      // Fallback to a larger default if still not found
      if (!barHeight || barHeight <= 0) barHeight = 40;
    }
    const barWidth = Math.abs(element.x - element.base)

    // Calculate position (top-left corner of the bar)
    const barX = Math.min(element.x, element.base)
    const barY = element.y - barHeight / 2

    // Draw the image to fill the entire bar
    ctx.save()
    ctx.beginPath()
    ctx.rect(barX, barY, barWidth, barHeight)
    ctx.clip()

    // Determine how to fit the image
    if (config.imageFit === "cover") {
      // Cover: maintain aspect ratio and cover entire area
      const imgRatio = img.width / img.height
      const barRatio = barWidth / barHeight

      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawHeight = barHeight
        drawWidth = drawHeight * imgRatio
        offsetX = (barWidth - drawWidth) / 2
      } else {
        // Image is taller than bar (relative to width)
        drawWidth = barWidth
        drawHeight = drawWidth / imgRatio
        offsetY = (barHeight - drawHeight) / 2
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight)
    } else if (config.imageFit === "contain") {
      // Contain: maintain aspect ratio and fit within area
      const imgRatio = img.width / img.height
      const barRatio = barWidth / barHeight

      let drawWidth,
        drawHeight,
        offsetX = 0,
        offsetY = 0

      if (imgRatio > barRatio) {
        // Image is wider than bar (relative to height)
        drawWidth = barWidth
        drawHeight = drawWidth / imgRatio
        offsetY = (barHeight - drawHeight) / 2
      } else {
        // Image is taller than bar (relative to width)
        drawHeight = barHeight
        drawWidth = drawHeight * imgRatio
        offsetX = (barWidth - drawWidth) / 2
      }

      ctx.drawImage(img, barX + offsetX, barY + offsetY, drawWidth, drawHeight)
    } else {
      // Fill: stretch to fill entire area
      ctx.drawImage(img, barX, barY, barWidth, barHeight)
    }

    ctx.restore()
    return
  }

  // Original positioning logic for non-fill mode
  switch (config.position) {
    case "center":
      // Center of the bar: halfway between left (element.base) and right (element.x)
      x = ((element.x ?? 0) + (element.base ?? 0)) / 2;
      break
    case "above":
      // Right end of the bar
      x = (element.x ?? 0) + size / 2 + 8;
      break
    case "below":
      // Just inside the left end of the bar
      const barStart = Math.min(element.x ?? 0, element.base ?? 0);
      x = barStart + size / 2 + 8;
      break
    case "callout":
      // Callout position - handled separately
      const chart = element.chart;
      const datasetIndex = element._datasetIndex || 0;
      const pointIndex = element._index || 0;
      renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart)
      return
    default:
      x = element.x + (element.base - element.x) / 2
      break
  }

  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

// Render image for point-based charts with proper positioning
function renderPointImage(ctx: any, element: any, img: any, config: any) {
  const size = config.size || 25
  let x = element.x
  let y = element.y

  switch (config.position) {
    case "center":
      // Center on the point
      break
    case "above":
      // Above the point
      y = (element.y ?? 0) - size / 2 - 12;
      break
    case "below":
      // Below the point
      y = (element.y ?? 0) + size / 2 + 12;
      break
    case "callout":
      // Callout position - handled separately
      const chart = element.chart;
      const datasetIndex = element._datasetIndex || 0;
      const pointIndex = element._index || 0;
      renderCalloutImage(ctx, element.x, element.y, img, config, datasetIndex, pointIndex, chart)
      return
    default:
      break
  }

  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

// Enhanced callout rendering with configurable border and shape
function renderCalloutImage(
  ctx: any,
  pointX: any,
  pointY: any,
  img: any,
  config: any,
  datasetIndex: number,
  pointIndex: number,
  chart: any,
) {
  const size = config.size || 30
  const offset = config.offset || 40

  // Use stored position or calculate default
  let calloutX = config.calloutX
  let calloutY = config.calloutY
  if (calloutX === undefined || calloutY === undefined) {
    const chartType = chart.config.type
    if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
      const centerX = chart.chartArea.left + chart.chartArea.width / 2
      const centerY = chart.chartArea.top + chart.chartArea.height / 2
      const meta = chart.getDatasetMeta(datasetIndex)
      const el = meta?.data?.[pointIndex]
      const startAngle = el?.startAngle ?? 0
      const endAngle = el?.endAngle ?? 0
      const midAngle = (startAngle + endAngle) / 2
      const outerRadius = el?.outerRadius ?? Math.min(chart.chartArea.width, chart.chartArea.height) / 2
      const r = outerRadius + offset
      calloutX = centerX + Math.cos(midAngle) * r
      calloutY = centerY + Math.sin(midAngle) * r
    } else {
      calloutX = pointX + offset
      calloutY = pointY - offset
    }
  }

  // Store the calculated position back to config for dragging
  if (config.calloutX === undefined) config.calloutX = calloutX
  if (config.calloutY === undefined) config.calloutY = calloutY

  // Draw arrow line and head if enabled
  const arrowLine = config.arrowLine !== false
  const arrowHead = config.arrowHead !== false
  const gap = config.arrowEndGap ?? 8

  if (arrowLine || arrowHead) {
    ctx.strokeStyle = config.arrowColor || "#666"
    ctx.lineWidth = 2
    ctx.setLineDash([])

    // Calculate arrow path based on chart type
    const chartType = chart.config.type
    let startX = pointX
    let startY = pointY

    // Adjust start point for different chart types
    if (chartType === "pie" || chartType === "doughnut" || chartType === "polarArea") {
      // Anchor to this slice's outer mid-angle so arrows don't all start at one point
      const centerX = chart.chartArea.left + chart.chartArea.width / 2
      const centerY = chart.chartArea.top + chart.chartArea.height / 2
      const meta = chart.getDatasetMeta(datasetIndex)
      const el = meta?.data?.[pointIndex]
      const startAngle = el?.startAngle ?? 0
      const endAngle = el?.endAngle ?? 0
      const midAngle = (startAngle + endAngle) / 2
      const radius = el?.outerRadius ?? Math.min(chart.chartArea.width, chart.chartArea.height) / 2
      startX = centerX + Math.cos(midAngle) * radius
      startY = centerY + Math.sin(midAngle) * radius
    } else if (chartType === "bar") {
      if (chart.config.options?.indexAxis === "y") {
        startX = pointX
        startY = pointY
      } else {
        startX = pointX
        startY = pointY
      }
    }

    // Calculate the end point (image center) and apply arrowEndGap
    let endX = calloutX
    let endY = calloutY
    if (gap > 0) {
      const angle = Math.atan2(endY - startY, endX - startX)
      endX = endX - gap * Math.cos(angle)
      endY = endY - gap * Math.sin(angle)
    }

    // Optional two-segment elbow leader support
    const useElbow = config.arrowSegments === 2
    let bendX: number | undefined = config.arrowBendX
    let bendY: number | undefined = config.arrowBendY
    if ((bendX == null || bendY == null) && config.arrowBendRelX != null && config.arrowBendRelY != null) {
      bendX = config.arrowBendRelX * chart.width
      bendY = config.arrowBendRelY * chart.height
    }
    if (useElbow && (bendX == null || bendY == null)) {
      // Default elbow path optimized for pies: short radial segment, then to callout
      if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') {
        const meta = chart.getDatasetMeta(datasetIndex)
        const el = meta?.data?.[pointIndex]
        const startAngle = el?.startAngle ?? 0
        const endAngle = el?.endAngle ?? 0
        const midAngle = (startAngle + endAngle) / 2
        const elbow = (config.arrowElbowLength ?? 14)
        bendX = startX + Math.cos(midAngle) * elbow
        bendY = startY + Math.sin(midAngle) * elbow
      } else {
        bendX = startX + (endX - startX) * 0.2
        bendY = startY
      }
    }

    // Draw the arrow line if enabled
    if (arrowLine) {
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      if (useElbow) {
        ctx.lineTo(bendX as number, bendY as number)
        ctx.lineTo(endX, endY)
      } else {
        ctx.lineTo(endX, endY)
      }
      ctx.stroke()
    }

    // Draw arrow head if enabled
    if (arrowHead) {
      // Arrow head should follow the last segment's direction
      let prevX = startX
      let prevY = startY
      if (useElbow) {
        prevX = (bendX as number)
        prevY = (bendY as number)
      }
      const angle = Math.atan2(endY - prevY, endX - prevX)
      const arrowLength = 12
      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle - Math.PI / 6),
        endY - arrowLength * Math.sin(angle - Math.PI / 6),
      )
      ctx.moveTo(endX, endY)
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle + Math.PI / 6),
        endY - arrowLength * Math.sin(angle + Math.PI / 6),
      )
      ctx.stroke()
    }
  }

  // Get image type/shape from config (default to circle)
  const imageType = config.type || "circle"

  // Draw image with configurable clipping shape
  drawImageWithClipping(ctx, calloutX - size / 2, calloutY - size / 2, size, size, img, imageType)

  // Draw configurable border around callout
  const borderWidth = config.borderWidth !== undefined ? config.borderWidth : 3
  const borderColor = config.borderColor || "#ffffff"

  if (borderWidth > 0) {
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth

    // Calculate actual image dimensions for regular type
    let borderX = calloutX - size / 2
    let borderY = calloutY - size / 2
    let borderW = size
    let borderH = size

    if (imageType === "regular") {
      // Calculate the actual rendered dimensions (preserving aspect ratio)
      const imgAspectRatio = img.naturalWidth / img.naturalHeight
      const targetAspectRatio = size / size

      if (imgAspectRatio > targetAspectRatio) {
        // Image is wider - fit to width
        borderH = size / imgAspectRatio
        borderY = calloutY - borderH / 2
      } else {
        // Image is taller - fit to height
        borderW = size * imgAspectRatio
        borderX = calloutX - borderW / 2
      }
    }

    if (imageType === "circle") {
      ctx.beginPath()
      ctx.arc(calloutX, calloutY, size / 2, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (imageType === "square") {
      ctx.beginPath()
      ctx.rect(calloutX - size / 2, calloutY - size / 2, size, size)
      ctx.stroke()
    } else if (imageType === "regular") {
      ctx.beginPath()
      ctx.rect(borderX, borderY, borderW, borderH)
      ctx.stroke()
    } else if (imageType === "rounded") {
      const radius = size * 0.15 // 15% border radius
      ctx.beginPath()
      roundRect(ctx, calloutX - size / 2, calloutY - size / 2, size, size, radius)
      ctx.stroke()
    }

    // Add shadow for better visibility
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.2)"
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    if (imageType === "circle") {
      ctx.beginPath()
      ctx.arc(calloutX, calloutY, size / 2, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (imageType === "square") {
      ctx.beginPath()
      ctx.rect(calloutX - size / 2, calloutY - size / 2, size, size)
      ctx.stroke()
    } else if (imageType === "regular") {
      ctx.beginPath()
      ctx.rect(borderX, borderY, borderW, borderH)
      ctx.stroke()
    } else if (imageType === "rounded") {
      const radius = size * 0.15
      ctx.beginPath()
      roundRect(ctx, calloutX - size / 2, calloutY - size / 2, size, size, radius)
      ctx.stroke()
    }

    ctx.restore()
  }
}

// Helper function to draw images with different clipping shapes
function drawImageWithClipping(ctx: any, x: any, y: any, width: any, height: any, img: any, type: string) {
  ctx.save()

  if (type === "regular") {
    // Regular: Preserve aspect ratio, scale to fit within bounds, center it
    const imgAspectRatio = img.naturalWidth / img.naturalHeight
    const targetAspectRatio = width / height

    let drawWidth = width
    let drawHeight = height
    let drawX = x
    let drawY = y

    if (imgAspectRatio > targetAspectRatio) {
      // Image is wider - fit to width, scale height proportionally
      drawHeight = width / imgAspectRatio
      drawY = y + (height - drawHeight) / 2 // Center vertically
    } else {
      // Image is taller - fit to height, scale width proportionally
      drawWidth = height * imgAspectRatio
      drawX = x + (width - drawWidth) / 2 // Center horizontally
    }

    // Draw image without clipping to preserve aspect ratio
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  } else {
    // Apply clipping for circle, square, or rounded
    if (type === "circle") {
      ctx.beginPath()
      ctx.arc(x + width / 2, y + height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI)
      ctx.clip()
    } else if (type === "square") {
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.clip()
    } else if (type === "rounded") {
      const radius = Math.min(width, height) * 0.15 // 15% border radius
      ctx.beginPath()
      roundRect(ctx, x, y, width, height, radius)
      ctx.clip()
    }

    ctx.drawImage(img, x, y, width, height)
  }

  ctx.restore()
}

// Helper function to draw rounded rectangles
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

// Render image for pie/doughnut/polarArea charts
function renderSliceImage(ctx: any, element: any, img: any, config: any) {
  // Check if this is a fill slice request
  if (config.fillSlice) {
    renderSliceFillImage(ctx, element, img, config);
    return;
  }

  const size = config.size || 30
  const chart = element._chart || element.chart
  const chartArea = chart.chartArea
  const centerX = chartArea.left + chartArea.width / 2
  const centerY = chartArea.top + chartArea.height / 2

  // For Chart.js, element has startAngle, endAngle, innerRadius, outerRadius
  const startAngle = element.startAngle || 0
  const endAngle = element.endAngle || 0
  const midAngle = (startAngle + endAngle) / 2
  const innerRadius = element.innerRadius || 0
  const outerRadius = element.outerRadius || Math.min(chartArea.width, chartArea.height) / 2

  let x, y
  switch (config.position) {
    case "center":
      // Center of the slice: halfway between inner and outer radius
      const r = innerRadius + (outerRadius - innerRadius) * 0.5;
      x = centerX + Math.cos(midAngle) * r;
      y = centerY + Math.sin(midAngle) * r;
      break
    case "above":
      // Above the slice: outside the outer radius
      const rAbove = outerRadius + size * 0.7;
      x = centerX + Math.cos(midAngle) * rAbove;
      y = centerY + Math.sin(midAngle) * rAbove;
      break
    case "below":
      // Below the slice: closer to inner radius
      const rBelow = innerRadius + (outerRadius - innerRadius) * 0.2;
      x = centerX + Math.cos(midAngle) * rBelow;
      y = centerY + Math.sin(midAngle) * rBelow;
      break
    case "callout":
      // Callout position - handled separately
      renderCalloutImage(ctx, element.x, element.y, img, config, element._datasetIndex, element._index, chart)
      return
    default:
      x = element.x
      y = element.y
      break
  }

  drawImageWithClipping(ctx, x - size / 2, y - size / 2, size, size, img, config.type)
}

function renderSliceFillImage(ctx: any, element: any, img: any, config: any) {
  const chart = element._chart || element.chart
  const chartArea = chart.chartArea
  const centerX = chartArea.left + chartArea.width / 2
  const centerY = chartArea.top + chartArea.height / 2

  // Get slice geometry
  const startAngle = element.startAngle || 0
  const endAngle = element.endAngle || 0
  const innerRadius = element.innerRadius || 0
  const outerRadius = element.outerRadius || Math.min(chartArea.width, chartArea.height) / 2

  // Save context for clipping
  ctx.save()

  // Create clipping path for the slice
  ctx.beginPath()
  if (innerRadius > 0) {
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
    ctx.lineTo(centerX + Math.cos(endAngle) * innerRadius, centerY + Math.sin(endAngle) * innerRadius)
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true)
    ctx.closePath()
  } else {
    ctx.moveTo(centerX, centerY)
    ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle)
    ctx.closePath()
  }
  ctx.clip()

  const imageFit = config.imageFit || 'cover'
  if (imageFit === 'contain') {
    // --- Mathematically correct: largest rectangle fully inside the sector ---
    const sliceAngle = Math.abs(endAngle - startAngle)
    const imgAspect = img.width / img.height
    let best = { area: 0, x: 0, y: 0, w: 0, h: 0 }
    const angleSteps = 30
    const radiusSteps = 30
    for (let ai = 0; ai <= angleSteps; ai++) {
      const fracA = ai / angleSteps
      const theta = startAngle + fracA * (endAngle - startAngle)
      for (let ri = 0; ri <= radiusSteps; ri++) {
        const fracR = ri / radiusSteps
        const r = innerRadius + fracR * (outerRadius - innerRadius)
        // Binary search for max width
        let low = 0, high = outerRadius - innerRadius, maxW = 0, maxH = 0
        for (let iter = 0; iter < 10; iter++) {
          const mid = (low + high) / 2
          let w, h
          if (imgAspect > 1) {
            w = mid
            h = w / imgAspect
          } else {
            h = mid
            w = h * imgAspect
          }
          // Rectangle corners in cartesian
          const corners = [
            { dx: -w / 2, dy: -h / 2 },
            { dx: w / 2, dy: -h / 2 },
            { dx: w / 2, dy: h / 2 },
            { dx: -w / 2, dy: h / 2 },
          ].map(({ dx, dy }) => {
            // Place center at (cx,cy)
            const cx = centerX + Math.cos(theta) * r
            const cy = centerY + Math.sin(theta) * r
            return { x: cx + dx, y: cy + dy }
          })
          // Check all corners are inside the sector
          const allInside = corners.every(({ x, y }) => {
            const relX = x - centerX
            const relY = y - centerY
            const rad = Math.sqrt(relX * relX + relY * relY)
            let ang = Math.atan2(relY, relX)
            if (ang < 0) ang += 2 * Math.PI
            let sA = startAngle, eA = endAngle
            if (sA < 0) sA += 2 * Math.PI
            if (eA < 0) eA += 2 * Math.PI
            if (eA < sA) eA += 2 * Math.PI
            if (ang < sA) ang += 2 * Math.PI
            return (
              rad >= innerRadius - 0.5 && rad <= outerRadius + 0.5 &&
              ang >= sA - 1e-6 && ang <= eA + 1e-6
            )
          })
          if (allInside) {
            maxW = w; maxH = h; low = mid
          } else {
            high = mid
          }
        }
        if (maxW > 0 && maxH > 0 && maxW * maxH > best.area) {
          // Place center at (cx,cy)
          const cx = centerX + Math.cos(theta) * r
          const cy = centerY + Math.sin(theta) * r
          best = { area: maxW * maxH, x: cx - maxW / 2, y: cy - maxH / 2, w: maxW, h: maxH }
        }
      }
    }
    if (best.area > 0) {
      ctx.drawImage(img, best.x, best.y, best.w, best.h)
    }
  } else {
    // --- Calculate the bounding box for the current slice only ---
    const points = []
    const steps = 100 // More steps = more accurate bounding box
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (endAngle - startAngle) * (i / steps)
      points.push([
        centerX + Math.cos(angle) * outerRadius,
        centerY + Math.sin(angle) * outerRadius
      ])
      if (innerRadius > 0) {
        points.push([
          centerX + Math.cos(angle) * innerRadius,
          centerY + Math.sin(angle) * innerRadius
        ])
      }
    }
    const xs = points.map(p => p[0])
    const ys = points.map(p => p[1])
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const sliceWidth = maxX - minX
    const sliceHeight = maxY - minY
    let drawX = minX
    let drawY = minY
    let drawWidth = sliceWidth
    let drawHeight = sliceHeight
    if (imageFit === 'fill') {
      drawX = minX
      drawY = minY
      drawWidth = sliceWidth
      drawHeight = sliceHeight
    } else {
      // cover (default)
      const imgAspect = img.width / img.height
      const sliceAspect = sliceWidth / sliceHeight
      if (imgAspect > sliceAspect) {
        drawHeight = sliceHeight
        drawWidth = sliceHeight * imgAspect
        drawX = minX + (sliceWidth - drawWidth) / 2
      } else {
        drawWidth = sliceWidth
        drawHeight = sliceWidth / imgAspect
        drawY = minY + (sliceHeight - drawHeight) / 2
      }
    }
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
  }
  ctx.restore()
}

// Define the return type for getImageOptionsForChartType
interface ImageOptions {
  types: { value: string; label: string }[];
  positions: { value: string; label: string }[];
  supportsArrow: boolean;
  supportsFill?: boolean;
}

export const getImageOptionsForChartType = (chartType: SupportedChartType): ImageOptions => {
  const type = chartType === 'area' ? 'line' : chartType;
  switch (type) {
    case 'bar':
    case 'horizontalBar':
    case 'stackedBar':
      return {
        types: [
          { value: 'square', label: 'Square' },
          { value: 'circle', label: 'Circle' },
          { value: 'regular', label: 'Regular' },
        ],
        positions: [
          { value: 'center', label: 'Center' },
          { value: 'above', label: 'Above' },
          { value: 'below', label: 'Bottom' },
          { value: 'callout', label: 'Callout with Arrow' },
        ],
        supportsArrow: true,
        supportsFill: true,
      };
    case 'line':
    case 'scatter':
      return {
        types: [
          { value: "circle", label: "Circle" },
          { value: "square", label: "Square" },
          { value: "regular", label: "Regular" },
        ],
        positions: [
          { value: "center", label: "Center" },
          { value: "above", label: "Above" },
          { value: "below", label: "Bottom" },
          { value: "callout", label: "Callout with Arrow" },
        ],
        supportsArrow: true,
      }
    case 'bubble':
      return {
        types: [
          { value: "circle", label: "Circle" },
          { value: "square", label: "Square" },
          { value: "regular", label: "Regular" },
        ],
        positions: [
          { value: "center", label: "Center" },
          { value: "above", label: "Above" },
          { value: "callout", label: "Callout with Arrow" },
        ],
        supportsArrow: true,
      }
    case 'radar':
      return {
        types: [
          { value: "circle", label: "Circle" },
          { value: "square", label: "Square" },
          { value: "regular", label: "Regular" },
        ],
        positions: [
          { value: "center", label: "Center" },
          { value: "above", label: "Above" },
          { value: "below", label: "Bottom" },
          { value: "callout", label: "Callout with Arrow" },
        ],
        supportsArrow: true,
      }
    case 'pie':
    case 'doughnut':
    case 'polarArea':
      return {
        types: [
          { value: "circle", label: "Circle" },
          { value: "square", label: "Square" },
          { value: "regular", label: "Regular" },
        ],
        positions: [
          { value: "center", label: "Center" },
          { value: "above", label: "Above" },
          { value: "below", label: "Bottom" },
          { value: "callout", label: "Callout with Arrow" },
        ],
        supportsArrow: true,
        supportsFill: true,
      }
    default:
      return {
        types: [
          { value: "circle", label: "Circle" },
          { value: "regular", label: "Regular" },
        ],
        positions: [
          { value: "center", label: "Center" },
          { value: "callout", label: "Callout with Arrow" },
        ],
        supportsArrow: true,
      }
  }
}

export const getDefaultImageType = (chartType: SupportedChartType): string => {
  return "regular"
}

export const getDefaultImageSize = (chartType: SupportedChartType): number => {
  switch (chartType) {
    case 'pie':
    case 'doughnut':
    case 'polarArea':
      return 24
    case 'bar':
    case 'horizontalBar':
      return 20
    case 'line':
    case 'scatter':
    case 'bubble':
    case 'radar':
      return 16
    default:
      return 20
  }
}

// Helper function to get complete default image configuration
export const getDefaultImageConfig = (chartType: SupportedChartType): PointImageConfig => {
  return {
    type: getDefaultImageType(chartType),
    size: getDefaultImageSize(chartType),
    position: "center",
    arrow: false,
    arrowColor: "#666666",
    borderWidth: 3,
    borderColor: "#ffffff",
    offset: 40,
    fillSlice: false,
    fillBar: false,
    imageFit: 'cover',
  }
}

export { universalImagePlugin }

// Helper function to determine if dataset changes are meaningful
function areDatasetChangesMeaningful(previousDataset: any, newDataset: any): boolean {
  // Check if data values changed
  if (JSON.stringify(previousDataset.data) !== JSON.stringify(newDataset.data)) {
    return true;
  }

  // Check if labels changed
  if (previousDataset.label !== newDataset.label) {
    return true;
  }

  // Check if colors changed (but ignore fill/border width changes for toggles)
  const prevColors = JSON.stringify({
    backgroundColor: previousDataset.backgroundColor,
    borderColor: previousDataset.borderColor
  });
  const newColors = JSON.stringify({
    backgroundColor: newDataset.backgroundColor,
    borderColor: newDataset.borderColor
  });

  if (prevColors !== newColors) {
    return true;
  }

  // Check if point images changed
  if (JSON.stringify(previousDataset.pointImages) !== JSON.stringify(newDataset.pointImages)) {
    return true;
  }

  // Fill and border width changes are considered trivial for toggles
  // Only capture undo points for more substantial changes

  return false;
}

// Create the store with persist middleware
// Empty initial state - no datasets until user action
const emptyChartData = {
  labels: [],
  datasets: []
}

export const useChartStore = create<ChartStore>()(
  persist(
    (set, get) => ({
      // Global chart reference
      globalChartRef: null,
      setGlobalChartRef: (ref) => set({ globalChartRef: ref }),

      chartType: 'bar',
      chartData: emptyChartData,
      chartConfig: getDefaultConfigForType('bar'),
      chartMode: 'single',
      activeDatasetIndex: 0,
      // Add separate storage for each mode's datasets - start empty
      singleModeData: emptyChartData,
      groupedModeData: emptyChartData,
      // Add uniformity mode for grouped charts
      uniformityMode: 'uniform',
      legendFilter: { datasets: {}, slices: {} },
      fillArea: true,
      showBorder: true,
      showImages: true,
      showLabels: true,
      hasJSON: false,
      currentSnapshotId: null, // Initialize to null
      // Original cloud dimensions - null for new charts, set when loaded from cloud
      originalCloudDimensions: null,
      setOriginalCloudDimensions: (dimensions) => set({ originalCloudDimensions: dimensions }),
      // Initialize overlay state
      overlayImages: [],
      overlayTexts: [],
      selectedImageId: null,
      selectedTextId: null,
      toggleDatasetVisibility: (index: number) => set((state) => {
        const current = (state.legendFilter.datasets as Record<number, boolean>)[index] ?? true;
        return { legendFilter: { ...state.legendFilter, datasets: { ...state.legendFilter.datasets, [index]: !current } } };
      }),
      toggleSliceVisibility: (index: number) => set((state) => {
        const current = (state.legendFilter.slices as Record<number, boolean>)[index] ?? true;
        return { legendFilter: { ...state.legendFilter, slices: { ...state.legendFilter.slices, [index]: !current } } };
      }),
      setChartType: (type) => set((state) => {
        // Only proceed if there's an actual change
        if (state.chartType === type) return state;

        // Store the previous state for undo comparison
        const previousState = {
          chartType: state.chartType,
          chartData: JSON.parse(JSON.stringify(state.chartData)),
          chartConfig: JSON.parse(JSON.stringify(state.chartConfig))
        }

        // Always fully reset config for new chart type
        const chartJsType = type === ('area' as CustomChartType) ? 'line' as const : type;
        const newDatasets = state.chartData.datasets.map((dataset) => {
          const newDataset = { ...dataset } as ExtendedChartDataset;

          // Set the Chart.js type
          if (type === 'horizontalBar') {
            newDataset.type = 'bar';
          } else if (type === ('area' as CustomChartType)) {
            newDataset.type = 'line'; // 'area' is a 'line' chart for Chart.js
          } else if (type === 'stackedBar') {
            newDataset.type = 'bar'; // 'stackedBar' is a 'bar' chart for Chart.js
          } else {
            newDataset.type = type as keyof ChartTypeRegistry; // Covers 'line', 'scatter', 'bubble', 'pie', etc.
          }

          // Set the fill property based on the original requested type
          if (type === ('area' as CustomChartType)) {
            newDataset.fill = true;
          } else {
            // For all other types, including 'line' (when not 'area'),
            // ensure fill is false. This explicitly turns off fill for standard line charts.
            newDataset.fill = false;
          }

          // Data transformation for scatter/bubble
          if (type === 'scatter' || type === 'bubble') {
            newDataset.data = dataset.data.map((point) => {
              if (typeof point === 'number') {
                return type === 'bubble'
                  ? { x: Math.random() * 100, y: point, r: 10 }
                  : { x: Math.random() * 100, y: point };
              }
              return point;
            });
          }
          return newDataset;
        });

        // Only preserve user label/plugin settings if compatible
        const prevDatalabels = (state.chartConfig.plugins as any)?.datalabels || {};
        const prevCustomLabelsConfig = (state.chartConfig.plugins as any)?.customLabelsConfig || {};

        // FULL RESET: Always deep clone default config for new chart type
        // Use the original type (e.g., 'area') not chartJsType ('line') to get correct configs
        let newConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(type)));
        // Preserve existing background configuration
        if ((state.chartConfig as any)?.background) {
          (newConfig as any).background = (state.chartConfig as any).background;
        }

        // Preserve manual/responsive/dimension settings for mobile devices
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 576;
        if (isMobile) {
          // For mobile devices, preserve manual dimensions if they were set
          if ('manualDimensions' in state.chartConfig) {
            newConfig.manualDimensions = state.chartConfig.manualDimensions;
          }
          if ('dynamicDimension' in state.chartConfig) {
            newConfig.dynamicDimension = state.chartConfig.dynamicDimension;
          }
          if ('responsive' in state.chartConfig) {
            newConfig.responsive = state.chartConfig.responsive;
          }
          if ('width' in state.chartConfig) {
            newConfig.width = state.chartConfig.width;
          }
          if ('height' in state.chartConfig) {
            newConfig.height = state.chartConfig.height;
          }
        }

        // Restore datalabels and customLabelsConfig only if present in newConfig.plugins
        if ((newConfig.plugins as any)?.datalabels) {
          (newConfig.plugins as any).datalabels = {
            ...(newConfig.plugins as any).datalabels,
            ...prevDatalabels,
          };
        }
        if (newConfig.plugins) {
          (newConfig.plugins as any).customLabelsConfig = prevCustomLabelsConfig;
        }

        // RADAR PATCH: always merge full radar config
        if (type === 'radar') {
          const radarConfig = getDefaultConfigForType('radar');
          newConfig = { ...radarConfig, ...newConfig, scales: { ...radarConfig.scales, ...(newConfig.scales || {}) } };
        }

        // Ensure correct scales for axis charts
        const axisTypes = ['bar', 'line', 'scatter', 'bubble', 'horizontalBar'];
        const noScalesTypes = ['pie', 'doughnut', 'polarArea'];
        if (axisTypes.includes(chartJsType)) {
          if (!newConfig.scales || !newConfig.scales.x || !newConfig.scales.y) {
            newConfig.scales = {
              x: { display: true, ...((newConfig.scales && newConfig.scales.x) || {}) },
              y: { display: true, ...((newConfig.scales && newConfig.scales.y) || {}) }
            };
          }
        } else if (noScalesTypes.includes(chartJsType)) {
          if (newConfig.scales) {
            delete newConfig.scales;
          }
        }

        // Auto-switch to uniform mode if changing to a chart type that doesn't support mixed mode
        const nonMixedModeCharts = ['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'];
        const shouldSwitchToUniform = state.chartMode === 'grouped' &&
          state.uniformityMode === 'mixed' &&
          nonMixedModeCharts.includes(type);

        const newState = {
          chartType: type,
          chartData: {
            ...state.chartData,
            datasets: newDatasets,
          },
          chartConfig: newConfig,
          ...(shouldSwitchToUniform && { uniformityMode: 'uniform' as const }),
        };

        // Capture undo point AFTER the change is made
        if (state.hasJSON) {
          try {
            const { captureUndoPoint } = require('./chat-store');
            captureUndoPoint({
              type: 'manual_chart_type_change',
              previousState: previousState,
              currentState: {
                chartType: newState.chartType,
                chartData: newState.chartData,
                chartConfig: newState.chartConfig
              },
              toolSource: 'chart-type-selector',
              changeDescription: `Chart type changed from ${state.chartType} to ${type}`
            });
          } catch (error) {
            console.warn('Failed to capture undo point for chart type change:', error);
          }
        }

        return newState;
      }),
      addDataset: (dataset) => set((state) => {
        const newChartData = {
          ...state.chartData,
          datasets: [...state.chartData.datasets, dataset],
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single'
          ? { singleModeData: newChartData }
          : { groupedModeData: newChartData };

        return {
          chartData: newChartData,
          ...modeDataUpdate,
          // Set hasJSON to true when dataset is added
          hasJSON: true,
        };
      }),
      removeDataset: (index) => set((state) => {
        const newChartData = {
          ...state.chartData,
          datasets: state.chartData.datasets.filter((_, i) => i !== index),
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single'
          ? { singleModeData: newChartData }
          : { groupedModeData: newChartData };

        return {
          chartData: newChartData,
          ...modeDataUpdate,
        };
      }),
      updateDataset: (index: number, updates: Partial<ExtendedChartDataset> & { addPoint?: boolean; removePoint?: boolean; randomizeColors?: boolean }) => set((state) => {
        const dataset = state.chartData.datasets[index] as ExtendedChartDataset
        if (!dataset) return state

        // Store the previous state for undo comparison
        const previousState = {
          chartType: state.chartType,
          chartData: JSON.parse(JSON.stringify(state.chartData)),
          chartConfig: JSON.parse(JSON.stringify(state.chartConfig))
        }

        // Prevent adding/removing points in Grouped Mode to maintain consistency (only if there are multiple datasets)
        if (state.chartMode === 'grouped' && state.chartData.datasets.length > 1 && (updates.addPoint || updates.removePoint)) {
          console.warn('Adding/removing points is not allowed in Grouped Mode to maintain dataset consistency')
          return state
        }

        let updatedDataset = { ...dataset, ...updates } as ExtendedChartDataset
        // Add Point
        if (updates.addPoint) {
          updatedDataset.data = [...dataset.data, 0]
          const color = dataset.color || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) || generateColorPalette(1)[0]
          updatedDataset.backgroundColor = Array.isArray(dataset.backgroundColor)
            ? [...dataset.backgroundColor, color]
            : Array(dataset.data.length + 1).fill(color)
          updatedDataset.borderColor = Array.isArray(dataset.borderColor)
            ? [...dataset.borderColor, darkenColor(color, 20)]
            : Array(dataset.data.length + 1).fill(darkenColor(color, 20))
          updatedDataset.pointImages = [...(dataset.pointImages || []), null]
          updatedDataset.pointImageConfig = [
            ...(dataset.pointImageConfig || []),
            {
              type: getDefaultImageType(state.chartType),
              size: getDefaultImageSize(state.chartType),
              position: "center",
              arrow: false,
            },
          ]
          // Update labels
          const newLabels = [...(state.chartData.labels || []), `Slice ${dataset.data.length + 1}`]

          // Create new state
          const newState = {
            ...state,
            chartData: {
              ...state.chartData,
              labels: newLabels,
              datasets: state.chartData.datasets.map((d, i) => i === index ? updatedDataset : d),
            },
          }

          // Capture undo point AFTER the change is made
          if (state.hasJSON) {
            try {
              const { captureUndoPoint } = require('./chat-store');
              captureUndoPoint({
                type: 'manual_dataset_change',
                previousState: previousState,
                currentState: {
                  chartType: newState.chartType,
                  chartData: newState.chartData,
                  chartConfig: newState.chartConfig
                },
                toolSource: 'dataset-panel',
                changeDescription: `Added point to dataset ${index}`
              });
            } catch (error) {
              console.warn('Failed to capture undo point for dataset change:', error);
            }
          }

          return newState
        }
        // Remove Point
        if (updates.removePoint && dataset.data.length > 1) {
          updatedDataset.data = dataset.data.slice(0, -1)
          updatedDataset.backgroundColor = Array.isArray(dataset.backgroundColor)
            ? dataset.backgroundColor.slice(0, -1)
            : dataset.backgroundColor
          updatedDataset.borderColor = Array.isArray(dataset.borderColor)
            ? dataset.borderColor.slice(0, -1)
            : dataset.borderColor
          updatedDataset.pointImages = (dataset.pointImages || []).slice(0, -1)
          updatedDataset.pointImageConfig = (dataset.pointImageConfig || []).slice(0, -1)
          // Update labels
          const newLabels = (state.chartData.labels || []).slice(0, -1)

          const newState = {
            ...state,
            chartData: {
              ...state.chartData,
              labels: newLabels,
              datasets: state.chartData.datasets.map((d, i) => i === index ? updatedDataset : d),
            },
          }

          // Capture undo point AFTER the change is made
          if (state.hasJSON) {
            try {
              const { captureUndoPoint } = require('./chat-store');
              captureUndoPoint({
                type: 'manual_dataset_change',
                previousState: previousState,
                currentState: {
                  chartType: newState.chartType,
                  chartData: newState.chartData,
                  chartConfig: newState.chartConfig
                },
                toolSource: 'dataset-panel',
                changeDescription: `Removed point from dataset ${index}`
              });
            } catch (error) {
              console.warn('Failed to capture undo point for dataset change:', error);
            }
          }

          return newState
        }
        // Randomize Colors
        if (updates.randomizeColors) {
          const seed = Date.now() + Math.floor(Math.random() * 10000)
          const colors = generateColorPalette(dataset.data.length).map((c, i) => {
            // Slightly shuffle using seed
            return generateColorPalette(dataset.data.length)[(i + seed) % dataset.data.length]
          })
          updatedDataset.backgroundColor = colors
          updatedDataset.borderColor = colors.map(c => darkenColor(c, 20))
          updatedDataset.lastSliceColors = colors
        }

        // Handle color mode changes (existing logic)
        if (updates.datasetColorMode) {
          if (updates.datasetColorMode === 'single') {
            if (Array.isArray(dataset.backgroundColor)) {
              updatedDataset.lastSliceColors = [...dataset.backgroundColor]
            }
            const baseColor = dataset.color || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) || generateColorPalette(1)[0]
            updatedDataset.backgroundColor = Array(dataset.data.length).fill(baseColor)
            updatedDataset.borderColor = Array(dataset.data.length).fill(darkenColor(baseColor, 20))
          } else if (updates.datasetColorMode === 'slice') {
            // Prefer colors generated/updated earlier in this call
            const lastColors = (updatedDataset as any).lastSliceColors || dataset.lastSliceColors
            const colors = lastColors && lastColors.length === dataset.data.length
              ? lastColors
              : generateColorPalette(dataset.data.length)
            updatedDataset.backgroundColor = colors
            updatedDataset.borderColor = colors.map((color: string) => darkenColor(color, 20))
          }
        }
        // If caller supplies explicit per-slice backgroundColor, honor and persist as slice mode
        if (updates.backgroundColor && Array.isArray(updates.backgroundColor)) {
          const colors = updates.backgroundColor as string[]
          updatedDataset.backgroundColor = colors
          // Only auto-generate borderColor if not explicitly provided (preserves existing borders during opacity changes)
          // Use 'in' operator to check if borderColor key exists in updates object
          if (!('borderColor' in updates)) {
            updatedDataset.borderColor = colors.map((c: string) => darkenColor(c, 20))
          }
          updatedDataset.lastSliceColors = colors
          updatedDataset.datasetColorMode = 'slice'
        }
        // Handle color updates (existing logic)
        if (updates.color) {
          const baseColor = updates.color
          // Always store chosen single color for recall in UI
          updatedDataset.color = baseColor as any
          if (updatedDataset.datasetColorMode === 'single') {
            updatedDataset.backgroundColor = Array(dataset.data.length).fill(baseColor)
            updatedDataset.borderColor = Array(dataset.data.length).fill(darkenColor(baseColor, 20))
          }
        }

        // Update the dataset in the state
        const newDatasets = [...state.chartData.datasets]
        newDatasets[index] = updatedDataset
        const newChartData = {
          ...state.chartData,
          datasets: newDatasets,
        }

        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single'
          ? { singleModeData: newChartData }
          : { groupedModeData: newChartData }

        // Check if we should set hasJSON based on chart data validity
        const shouldSetHasJSON = newChartData.labels.length > 0 &&
          newChartData.datasets.length > 0 &&
          newChartData.datasets.some(d => d.data && d.data.length > 0);

        const newState = {
          ...state,
          chartData: newChartData,
          ...modeDataUpdate,
          hasJSON: shouldSetHasJSON || state.hasJSON,
        }

        // Capture undo point AFTER the change is made, but only if there are actual meaningful changes
        if (state.hasJSON || shouldSetHasJSON) {
          // Check if there are meaningful changes using our helper function
          const hasMeaningfulChanges = newDatasets.some((newDataset, idx) => {
            const previousDataset = state.chartData.datasets[idx];
            return areDatasetChangesMeaningful(previousDataset, newDataset);
          });

          if (hasMeaningfulChanges) {
            try {
              const { captureUndoPoint } = require('./chat-store');
              captureUndoPoint({
                type: 'manual_dataset_change',
                previousState: previousState,
                currentState: {
                  chartType: newState.chartType,
                  chartData: newState.chartData,
                  chartConfig: newState.chartConfig
                },
                toolSource: 'dataset-panel',
                changeDescription: `Dataset ${index} updated`
              });
            } catch (error) {
              console.warn('Failed to capture undo point for dataset change:', error);
            }
          }
        }

        return newState
      }),
      updateDataPoint: (datasetIndex, pointIndex, field, value) => set((state) => {
        const newChartData = {
          ...state.chartData,
          datasets: state.chartData.datasets.map((dataset, i) =>
            i === datasetIndex
              ? {
                ...dataset,
                data: dataset.data.map((point, j) =>
                  j === pointIndex
                    ? typeof point === 'object' && point !== null
                      ? { ...point, [field]: value }
                      : value
                    : point
                ),
              } as ExtendedChartDataset
              : dataset
          ),
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single'
          ? { singleModeData: newChartData }
          : { groupedModeData: newChartData };

        return {
          chartData: newChartData,
          ...modeDataUpdate,
        };
      }),
      updateChartConfig: (config) => set((state) => {
        // Capture undo point before updating chart config
        if (state.hasJSON) {
          try {
            const { captureUndoPoint } = require('./chat-store');
            captureUndoPoint({
              type: 'manual_config_change',
              previousState: {
                chartType: state.chartType,
                chartData: state.chartData,
                chartConfig: state.chartConfig
              },
              currentState: {
                chartType: state.chartType,
                chartData: state.chartData,
                chartConfig: config
              },
              toolSource: 'config-sidebar',
              changeDescription: 'Chart configuration updated'
            });
          } catch (error) {
            console.warn('Failed to capture undo point for config change:', error);
          }
        }

        if (state.chartType === 'radar') {
          const radarConfig = getDefaultConfigForType('radar');
          return { chartConfig: { ...radarConfig, ...config, scales: { ...radarConfig.scales, ...(config.scales || {}) } } };
        }
        return { chartConfig: config };
      }),
      updatePointImage: (datasetIndex, pointIndex, imageUrl, imageConfig) => set((state) => {
        const dataset = state.chartData.datasets[datasetIndex];
        if (!dataset) return state;

        // Ensure arrays exist and are the correct length
        const dataLength = dataset.data.length;
        let pointImages = dataset.pointImages || [];
        let pointImageConfig = dataset.pointImageConfig || [];

        // Initialize arrays if they don't exist or are the wrong length
        if (pointImages.length !== dataLength) {
          pointImages = Array(dataLength).fill(null).map((_, idx) =>
            pointImages[idx] !== undefined ? pointImages[idx] : null
          );
        }

        if (pointImageConfig.length !== dataLength) {
          pointImageConfig = Array(dataLength).fill(null).map((_, idx) =>
            pointImageConfig[idx] || getDefaultImageConfig(state.chartType)
          );
        }

        // Update the specific point
        const updatedPointImages = [...pointImages];
        updatedPointImages[pointIndex] = imageUrl;

        const updatedPointImageConfig = [...pointImageConfig];
        updatedPointImageConfig[pointIndex] = {
          ...(updatedPointImageConfig[pointIndex] || getDefaultImageConfig(state.chartType)),
          ...imageConfig
        };

        const newChartData = {
          ...state.chartData,
          datasets: state.chartData.datasets.map((d, i) =>
            i === datasetIndex
              ? {
                ...d,
                pointImages: updatedPointImages,
                pointImageConfig: updatedPointImageConfig,
              } as ExtendedChartDataset
              : d
          ),
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single'
          ? { singleModeData: newChartData }
          : { groupedModeData: newChartData };

        return {
          chartData: newChartData,
          ...modeDataUpdate,
        };
      }),
      resetChart: () => set((state) => {
        const modeDefaultData = getDefaultDataForMode(state.chartMode);

        // Create new config for bar chart
        let newConfig = getDefaultConfigForType('bar');

        // Preserve manual/responsive/dimension settings for mobile devices
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 576;
        if (isMobile) {
          // For mobile devices, preserve manual dimensions if they were set
          if ('manualDimensions' in state.chartConfig) {
            newConfig.manualDimensions = state.chartConfig.manualDimensions;
          }
          if ('dynamicDimension' in state.chartConfig) {
            newConfig.dynamicDimension = state.chartConfig.dynamicDimension;
          }
          if ('responsive' in state.chartConfig) {
            newConfig.responsive = state.chartConfig.responsive;
          }
          if ('width' in state.chartConfig) {
            newConfig.width = state.chartConfig.width;
          }
          if ('height' in state.chartConfig) {
            newConfig.height = state.chartConfig.height;
          }
        }

        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single'
          ? { singleModeData: modeDefaultData }
          : { groupedModeData: modeDefaultData };

        return {
          chartType: 'bar',
          chartData: modeDefaultData,
          chartConfig: newConfig,
          ...modeDataUpdate,
        };
      }),
      setChartMode: (mode) => set((state) => {
        // Save current mode's data before switching
        const currentModeData = state.chartData;
        if (state.chartMode === 'single') {
          state.singleModeData = currentModeData;
        } else {
          state.groupedModeData = currentModeData;
        }

        // Get the data for the target mode (either saved data or default)
        let targetModeData: ExtendedChartData;
        if (mode === 'single') {
          targetModeData = state.singleModeData;
        } else {
          targetModeData = state.groupedModeData;
        }

        return {
          chartMode: mode,
          chartData: targetModeData,
          activeDatasetIndex: 0,
          // Update the mode-specific storage
          ...(mode === 'single' ? { singleModeData: targetModeData } : { groupedModeData: targetModeData }),
        };
      }),
      setActiveDatasetIndex: (index) => set({ activeDatasetIndex: index }),
      setUniformityMode: (mode: 'uniform' | 'mixed') => set({ uniformityMode: mode }),
      setHasJSON: (value: boolean) => set({ hasJSON: value }),
      updateLabels: (labels: string[]) => set((state) => {
        const newChartData = {
          ...state.chartData,
          labels,
          // Also update sliceLabels in all datasets to match the new labels
          datasets: state.chartData.datasets.map(dataset => ({
            ...dataset,
            sliceLabels: labels // Update sliceLabels to match the new labels
          }))
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single'
          ? { singleModeData: newChartData }
          : { groupedModeData: newChartData };

        // Set hasJSON to true if we have both labels and datasets with data
        const shouldSetHasJSON = labels.length > 0 &&
          newChartData.datasets.length > 0 &&
          newChartData.datasets.some(d => d.data && d.data.length > 0);

        return {
          chartData: newChartData,
          ...modeDataUpdate,
          hasJSON: shouldSetHasJSON || state.hasJSON,
        };
      }),
      toggleFillArea: () => set((state) => {
        const newFillArea = !state.fillArea;

        // Update chart configuration to reflect fill changes
        const newChartConfig = { ...state.chartConfig };

        // Update datasets to reflect the new fill state
        const newDatasets = state.chartData.datasets.map(dataset => ({
          ...dataset,
          fill: newFillArea,
          borderWidth: newFillArea ? (state.showBorder ? 2 : 0) : 2
        }));

        const newState = {
          fillArea: newFillArea,
          showBorder: newFillArea ? state.showBorder : true,
          chartData: {
            ...state.chartData,
            datasets: newDatasets
          }
        };

        // Capture undo point only if there are actual visual changes and we have chart data
        if (state.hasJSON && newDatasets.some(dataset => dataset.fill !== state.fillArea)) {
          try {
            const { captureUndoPoint, shouldDebounceUndoOperation } = require('./chat-store');

            // Check if we should debounce this operation
            if (!shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
              captureUndoPoint({
                type: 'manual_design_change',
                previousState: {
                  chartType: state.chartType,
                  chartData: state.chartData,
                  chartConfig: state.chartConfig
                },
                currentState: {
                  chartType: state.chartType,
                  chartData: newState.chartData,
                  chartConfig: newState.chartConfig
                },
                toolSource: 'style-toggles',
                changeDescription: `Fill area ${newFillArea ? 'enabled' : 'disabled'}`
              });
            }
          } catch (error) {
            console.warn('Failed to capture undo point for fill toggle:', error);
          }
        }

        return newState;
      }),
      toggleShowBorder: () => set((state) => {
        if (!state.fillArea) {
          return {}; // No change if fill is disabled
        }

        const newShowBorder = !state.showBorder;

        // Update datasets to reflect the new border state
        const newDatasets = state.chartData.datasets.map(dataset => ({
          ...dataset,
          borderWidth: newShowBorder ? 2 : 0
        }));

        const newState = {
          showBorder: newShowBorder,
          chartData: {
            ...state.chartData,
            datasets: newDatasets
          }
        };

        // Capture undo point only if there are actual visual changes and we have chart data
        if (state.hasJSON && newShowBorder !== state.showBorder) {
          try {
            const { captureUndoPoint, shouldDebounceUndoOperation } = require('./chat-store');

            // Check if we should debounce this operation
            if (!shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
              captureUndoPoint({
                type: 'manual_design_change',
                previousState: {
                  chartType: state.chartType,
                  chartData: state.chartData,
                  chartConfig: state.chartConfig
                },
                currentState: {
                  chartType: state.chartType,
                  chartData: newState.chartData,
                  chartConfig: newState.chartConfig
                },
                toolSource: 'style-toggles',
                changeDescription: `Border ${newShowBorder ? 'enabled' : 'disabled'}`
              });
            }
          } catch (error) {
            console.warn('Failed to capture undo point for border toggle:', error);
          }
        }

        return newState;
      }),
      toggleShowImages: () => set((state) => {
        const newShowImages = !state.showImages;

        // Capture undo point only if there are actual overlay images and we have chart data
        if (state.hasJSON && state.overlayImages.length > 0) {
          try {
            const { captureUndoPoint, shouldDebounceUndoOperation } = require('./chat-store');

            // Check if we should debounce this operation
            if (!shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
              captureUndoPoint({
                type: 'manual_design_change',
                previousState: {
                  chartType: state.chartType,
                  chartData: state.chartData,
                  chartConfig: state.chartConfig
                },
                currentState: {
                  chartType: state.chartType,
                  chartData: state.chartData,
                  chartConfig: state.chartConfig
                },
                toolSource: 'style-toggles',
                changeDescription: `Images ${newShowImages ? 'shown' : 'hidden'}`
              });
            }
          } catch (error) {
            console.warn('Failed to capture undo point for image toggle:', error);
          }
        }

        return { showImages: newShowImages };
      }),
      toggleShowLabels: () => set((state) => {
        const newShowLabels = !state.showLabels;

        // Capture undo point only if we have chart data and labels are configured
        if (state.hasJSON && state.chartConfig.plugins?.datalabels) {
          try {
            const { captureUndoPoint, shouldDebounceUndoOperation } = require('./chat-store');

            // Check if we should debounce this operation
            if (!shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
              captureUndoPoint({
                type: 'manual_design_change',
                previousState: {
                  chartType: state.chartType,
                  chartData: state.chartData,
                  chartConfig: state.chartConfig
                },
                currentState: {
                  chartType: state.chartType,
                  chartData: state.chartData,
                  chartConfig: state.chartConfig
                },
                toolSource: 'style-toggles',
                changeDescription: `Labels ${newShowLabels ? 'shown' : 'hidden'}`
              });
            }
          } catch (error) {
            console.warn('Failed to capture undo point for label toggle:', error);
          }
        }

        return { showLabels: newShowLabels };
      }),
      setFullChart: ({ chartType, chartData, chartConfig, id }) => set((state) => {
        // Process datasets to ensure they have mode property set
        const datasetCount = chartData.datasets?.length || 0;
        const processedDatasets = chartData.datasets?.map((ds: any) => {
          // If dataset already has mode set, keep it
          if (ds.mode === 'grouped' || ds.mode === 'single') {
            return ds;
          }
          // If no mode is set, determine based on dataset count
          // Multiple datasets (2+) should be grouped, single dataset should be single
          const inferredMode = datasetCount > 1 ? 'grouped' : 'single';
          return { ...ds, mode: inferredMode };
        }) || [];

        // Create processed chart data with mode properties set
        const processedChartData = {
          ...chartData,
          datasets: processedDatasets
        };

        // Sync currentChartState to chat-store
        try {
          const { useChatStore } = require('./chat-store');
          const chatStore = useChatStore.getState();
          chatStore.updateChartState({
            chartType,
            chartData: processedChartData,
            chartConfig
          });
        } catch (error) {
          console.warn('Could not sync chart state to chat-store:', error);
        }

        // Determine the mode based on the processed datasets
        const hasGroupedDatasets = processedDatasets.some(ds => ds.mode === 'grouped');
        const hasSingleDatasets = processedDatasets.some(ds => ds.mode === 'single');

        let newMode = state.chartMode;
        let newSingleModeData = state.singleModeData;
        let newGroupedModeData = state.groupedModeData;

        // Auto-detect mode based on dataset count if no explicit mode is set
        // Multiple datasets (2+) = grouped mode, single dataset = single mode
        if (datasetCount > 1 && !hasGroupedDatasets && !hasSingleDatasets) {
          // All datasets are new and multiple - set as grouped
          newMode = 'grouped';
          newGroupedModeData = processedChartData;
        } else if (datasetCount === 1 && !hasGroupedDatasets && !hasSingleDatasets) {
          // Single dataset - set as single
          newMode = 'single';
          newSingleModeData = processedChartData;
        } else if (hasGroupedDatasets && !hasSingleDatasets) {
          // All datasets are grouped
          newMode = 'grouped';
          newGroupedModeData = processedChartData;
        } else if (hasSingleDatasets && !hasGroupedDatasets) {
          // All datasets are single
          newMode = 'single';
          newSingleModeData = processedChartData;
        } else if (hasGroupedDatasets && hasSingleDatasets) {
          // Mixed datasets - preserve current mode and update appropriate storage
          if (state.chartMode === 'grouped') {
            newGroupedModeData = processedChartData;
          } else {
            newSingleModeData = processedChartData;
          }
        } else {
          // Fallback: use dataset count to determine mode
          if (datasetCount > 1) {
            newMode = 'grouped';
            newGroupedModeData = processedChartData;
          } else {
            newMode = 'single';
            newSingleModeData = processedChartData;
          }
        }

        return {
          chartType,
          chartData: processedDatasets.length ? processedChartData : chartData,
          chartConfig,
          chartMode: newMode,
          singleModeData: newSingleModeData,
          groupedModeData: newGroupedModeData,
          activeDatasetIndex: 0, // Reset to first dataset
          // Only override snapshot ID if a new one is explicitly provided.
          // This preserves the currently loaded snapshot when we just tweak the chart.
          currentSnapshotId: id !== undefined ? id || null : state.currentSnapshotId,
        };
      }),
      setCurrentSnapshotId: (id: string | null) => set({ currentSnapshotId: id }),
      // Overlay actions implementation
      addOverlayImage: (image) => set((state) => ({
        overlayImages: [...state.overlayImages, { ...image, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }]
      })),
      updateOverlayImage: (id, updates) => set((state) => ({
        overlayImages: state.overlayImages.map(img => img.id === id ? { ...img, ...updates } : img)
      })),
      removeOverlayImage: (id) => set((state) => ({
        overlayImages: state.overlayImages.filter(img => img.id !== id)
      })),
      addOverlayText: (text) => set((state) => ({
        overlayTexts: [...state.overlayTexts, { ...text, id: Date.now().toString() + Math.random().toString(36).substr(2, 9) }]
      })),
      updateOverlayText: (id, updates) => set((state) => ({
        overlayTexts: state.overlayTexts.map(txt => txt.id === id ? { ...txt, ...updates } : txt)
      })),
      removeOverlayText: (id) => set((state) => ({
        overlayTexts: state.overlayTexts.filter(txt => txt.id !== id)
      })),
      setSelectedImageId: (id) => set(() => ({
        selectedImageId: id
      })),
      setSelectedTextId: (id) => set(() => ({
        selectedTextId: id
      })),

      // Data operations - temporary transformations with auto-backup
      datasetBackups: new Map(),

      backupDatasetState: (index) => {
        const { chartData, datasetBackups } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        datasetBackups.set(index, {
          labels: [...(chartData.labels || [])],
          data: JSON.parse(JSON.stringify(dataset.data)),
          backgroundColor: Array.isArray(dataset.backgroundColor) ? [...dataset.backgroundColor] : dataset.backgroundColor,
          borderColor: Array.isArray(dataset.borderColor) ? [...dataset.borderColor] : dataset.borderColor,
          pointImages: dataset.pointImages ? [...dataset.pointImages] : [],
          pointImageConfig: dataset.pointImageConfig ? JSON.parse(JSON.stringify(dataset.pointImageConfig)) : []
        });
      },

      restoreDatasetState: (index) => {
        const { datasetBackups, chartData } = get();
        const backup = datasetBackups.get(index);
        if (!backup) return;

        set({
          chartData: {
            ...chartData,
            labels: backup.labels,
            datasets: chartData.datasets.map((d, i) =>
              i === index ? {
                ...d,
                data: backup.data,
                backgroundColor: backup.backgroundColor,
                borderColor: backup.borderColor,
                pointImages: backup.pointImages,
                pointImageConfig: backup.pointImageConfig
              } : d
            )
          }
        });

        datasetBackups.delete(index);
      },

      sortDataset: (index, order) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const paired = dataset.data.map((value, i) => ({
          label: chartData.labels?.[i] || `Point ${i + 1}`,
          value: typeof value === 'number' ? value : (value as any)?.y || 0,
          originalValue: value,
          color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor,
          borderColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor,
          image: dataset.pointImages?.[i] || null,
          imageConfig: dataset.pointImageConfig?.[i] || null
        }));

        if (order === 'asc') {
          paired.sort((a, b) => a.value - b.value);
        } else if (order === 'desc') {
          paired.sort((a, b) => b.value - a.value);
        } else if (order === 'label-asc') {
          paired.sort((a, b) => a.label.localeCompare(b.label));
        } else if (order === 'label-desc') {
          paired.sort((a, b) => b.label.localeCompare(a.label));
        }

        set({
          chartData: {
            ...chartData,
            labels: paired.map(p => p.label),
            datasets: chartData.datasets.map((d, i) =>
              i === index ? {
                ...d,
                data: paired.map(p => p.originalValue),
                backgroundColor: paired.map(p => p.color),
                borderColor: paired.map(p => p.borderColor),
                pointImages: paired.map(p => p.image),
                pointImageConfig: paired.map(p => p.imageConfig),
                // Update sliceLabels for single mode datasets
                sliceLabels: paired.map(p => p.label)
              } : d
            )
          }
        });
      },

      reverseDataset: (index) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        set({
          chartData: {
            ...chartData,
            labels: [...(chartData.labels || [])].reverse(),
            datasets: chartData.datasets.map((d, i) =>
              i === index ? {
                ...d,
                data: [...d.data].reverse(),
                backgroundColor: Array.isArray(d.backgroundColor) ? [...d.backgroundColor].reverse() : d.backgroundColor,
                borderColor: Array.isArray(d.borderColor) ? [...d.borderColor].reverse() : d.borderColor,
                pointImages: d.pointImages ? [...d.pointImages].reverse() : [],
                pointImageConfig: d.pointImageConfig ? [...d.pointImageConfig].reverse() : [],
                // Update sliceLabels for single mode datasets
                sliceLabels: d.sliceLabels ? [...d.sliceLabels].reverse() : undefined
              } : d
            )
          }
        });
      },

      filterTopN: (index, n) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const paired = dataset.data.map((value, i) => ({
          label: chartData.labels?.[i] || `Point ${i + 1}`,
          value: typeof value === 'number' ? value : (value as any)?.y || 0,
          originalValue: value,
          color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor,
          borderColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor,
          image: dataset.pointImages?.[i] || null,
          imageConfig: dataset.pointImageConfig?.[i] || null
        }));

        paired.sort((a, b) => b.value - a.value);
        const topN = paired.slice(0, Math.min(n, paired.length));

        set({
          chartData: {
            ...chartData,
            labels: topN.map(p => p.label),
            datasets: chartData.datasets.map((d, i) =>
              i === index ? {
                ...d,
                data: topN.map(p => p.originalValue),
                backgroundColor: topN.map(p => p.color),
                borderColor: topN.map(p => p.borderColor),
                pointImages: topN.map(p => p.image),
                pointImageConfig: topN.map(p => p.imageConfig)
              } : d
            )
          }
        });
      },

      filterAboveThreshold: (index, threshold) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const paired = dataset.data.map((value, i) => ({
          label: chartData.labels?.[i] || `Point ${i + 1}`,
          value: typeof value === 'number' ? value : (value as any)?.y || 0,
          originalValue: value,
          color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor,
          borderColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor,
          image: dataset.pointImages?.[i] || null,
          imageConfig: dataset.pointImageConfig?.[i] || null
        }));

        const filtered = paired.filter(p => p.value > threshold);

        set({
          chartData: {
            ...chartData,
            labels: filtered.map(p => p.label),
            datasets: chartData.datasets.map((d, i) =>
              i === index ? {
                ...d,
                data: filtered.map(p => p.originalValue),
                backgroundColor: filtered.map(p => p.color),
                borderColor: filtered.map(p => p.borderColor),
                pointImages: filtered.map(p => p.image),
                pointImageConfig: filtered.map(p => p.imageConfig)
              } : d
            )
          }
        });
      },

      filterBelowThreshold: (index, threshold) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const paired = dataset.data.map((value, i) => ({
          label: chartData.labels?.[i] || `Point ${i + 1}`,
          value: typeof value === 'number' ? value : (value as any)?.y || 0,
          originalValue: value,
          color: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor,
          borderColor: Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor,
          image: dataset.pointImages?.[i] || null,
          imageConfig: dataset.pointImageConfig?.[i] || null
        }));

        const filtered = paired.filter(p => p.value < threshold);

        set({
          chartData: {
            ...chartData,
            labels: filtered.map(p => p.label),
            datasets: chartData.datasets.map((d, i) =>
              i === index ? {
                ...d,
                data: filtered.map(p => p.originalValue),
                backgroundColor: filtered.map(p => p.color),
                borderColor: filtered.map(p => p.borderColor),
                pointImages: filtered.map(p => p.image),
                pointImageConfig: filtered.map(p => p.imageConfig)
              } : d
            )
          }
        });
      },

      normalizeDataset: (index, range) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const values = dataset.data.map(v => typeof v === 'number' ? v : (v as any)?.y || 0);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const diff = max - min || 1;

        const normalized = values.map(v => {
          if (range === '0-1') {
            return Number(((v - min) / diff).toFixed(3));
          } else {
            return Math.round(((v - min) / diff) * 100);
          }
        });

        set({
          chartData: {
            ...chartData,
            datasets: chartData.datasets.map((d, i) =>
              i === index ? { ...d, data: normalized } : d
            )
          }
        });
      },

      convertToPercentage: (index) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const total = dataset.data.reduce((sum, v) => {
          const val = typeof v === 'number' ? v : (v as any)?.y || 0;
          return sum + val;
        }, 0);

        const percentages = dataset.data.map(value => {
          const v = typeof value === 'number' ? value : (value as any)?.y || 0;
          return Math.round((v / total) * 100);
        });

        set({
          chartData: {
            ...chartData,
            datasets: chartData.datasets.map((d, i) =>
              i === index ? { ...d, data: percentages } : d
            )
          }
        });
      },

      roundDataset: (index, decimals) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const rounded = dataset.data.map(value => {
          const v = typeof value === 'number' ? value : (value as any)?.y || 0;
          return Number(v.toFixed(decimals));
        });

        set({
          chartData: {
            ...chartData,
            datasets: chartData.datasets.map((d, i) =>
              i === index ? { ...d, data: rounded } : d
            )
          }
        });
      },

      scaleDataset: (index, factor) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const scaled = dataset.data.map(value => {
          const v = typeof value === 'number' ? value : (value as any)?.y || 0;
          return v * factor;
        });

        set({
          chartData: {
            ...chartData,
            datasets: chartData.datasets.map((d, i) =>
              i === index ? { ...d, data: scaled } : d
            )
          }
        });
      },

      offsetDataset: (index, offset) => {
        const { chartData, datasetBackups, backupDatasetState } = get();
        const dataset = chartData.datasets[index];
        if (!dataset) return;

        if (!datasetBackups.has(index)) {
          backupDatasetState(index);
        }

        const offsetted = dataset.data.map(value => {
          const v = typeof value === 'number' ? value : (value as any)?.y || 0;
          return v + offset;
        });

        set({
          chartData: {
            ...chartData,
            datasets: chartData.datasets.map((d, i) =>
              i === index ? { ...d, data: offsetted } : d
            )
          }
        });
      },

      resetDatasetOperations: (index) => {
        get().restoreDatasetState(index);
      },
    }),
    {
      name: (() => {
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `chart-store-${userId}`;
        }
        return 'chart-store-anonymous';
      })(),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          return {
            ...persistedState,
            chartType: persistedState.chartType || 'bar',
            chartData: persistedState.chartData || singleModeDefaultData,
            chartConfig: persistedState.chartConfig || getDefaultConfigForType('bar'),
            chartMode: persistedState.chartMode || 'single',
            activeDatasetIndex: persistedState.activeDatasetIndex || 0,
            singleModeData: persistedState.singleModeData || singleModeDefaultData,
            groupedModeData: persistedState.groupedModeData || groupedModeDefaultData,
            uniformityMode: persistedState.uniformityMode || 'uniform',
            legendFilter: persistedState.legendFilter || { datasets: {}, slices: {} },
            fillArea: persistedState.fillArea ?? true,
            showBorder: persistedState.showBorder ?? true,
            hasJSON: persistedState.hasJSON ?? false,
            overlayImages: persistedState.overlayImages || [],
            overlayTexts: persistedState.overlayTexts || [],
            selectedImageId: null, // Don't persist selection state
          };
        }
        return persistedState;
      },
      partialize: (state) => ({
        chartType: state.chartType,
        chartData: state.chartData,
        chartConfig: state.chartConfig,
        chartMode: state.chartMode,
        activeDatasetIndex: state.activeDatasetIndex,
        singleModeData: state.singleModeData,
        groupedModeData: state.groupedModeData,
        uniformityMode: state.uniformityMode,
        legendFilter: state.legendFilter,
        fillArea: state.fillArea,
        showBorder: state.showBorder,
        hasJSON: state.hasJSON,
        overlayImages: state.overlayImages,
        overlayTexts: state.overlayTexts,
        selectedImageId: state.selectedImageId,
        originalCloudDimensions: state.originalCloudDimensions,
      }),
    }
  )
);

function generateColorPalette(count: number): string[] {
  const baseColors = [
    '#1976d2', // Blue
    '#2e7d32', // Green
    '#c62828', // Red
    '#f9a825', // Yellow
    '#6a1b9a', // Purple
    '#00838f', // Teal
    '#ef6c00', // Orange
    '#4a148c', // Deep Purple
    '#00695c', // Dark Teal
    '#bf360c', // Deep Orange
  ]

  if (count <= baseColors.length) {
    return baseColors.slice(0, count)
  }

  // Generate additional colors if needed
  const additionalColors: string[] = []
  for (let i = 0; i < count - baseColors.length; i++) {
    const hue = (i * 137.5) % 360 // Golden angle approximation
    additionalColors.push(`hsl(${hue}, 70%, 50%)`)
  }

  return [...baseColors, ...additionalColors]
}

function darkenColor(color: string, amount: number): string {
  // Convert hex to RGB
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  // Darken each component
  const darken = (value: number) => Math.max(0, value - amount)
  const newR = darken(r)
  const newG = darken(g)
  const newB = darken(b)

  // Convert back to hex
  const toHex = (value: number) => value.toString(16).padStart(2, '0')
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`
}
