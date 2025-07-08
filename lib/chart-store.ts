"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Chart, ChartConfiguration, ChartData, ChartType, ChartDataset, ChartOptions, ChartTypeRegistry } from "chart.js" // Removed PluginOptionsByType from here

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

  interface DatalabelsLabelOptions extends DatalabelsPluginOptions {}

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

// Define our custom dataset properties
interface PointImageConfig {
  type: string                    // 'circle' | 'square' | 'rounded'
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

interface ChartStore {
  chartType: SupportedChartType;
  chartData: ExtendedChartData;
  chartConfig: ChartOptions;
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
  hasJSON: boolean;
  toggleDatasetVisibility: (index: number) => void;
  toggleSliceVisibility: (index: number) => void;
  setChartType: (type: SupportedChartType) => void;
  addDataset: (dataset: ExtendedChartDataset) => void;
  removeDataset: (index: number) => void;
  updateDataset: (index: number, updates: Partial<ExtendedChartDataset> & { addPoint?: boolean; removePoint?: boolean; randomizeColors?: boolean }) => void;
  updateDataPoint: (datasetIndex: number, pointIndex: number, field: string, value: any) => void;
  updateChartConfig: (config: ChartOptions) => void;
  updatePointImage: (datasetIndex: number, pointIndex: number, imageUrl: string, imageConfig: any) => void;
  resetChart: () => void;
  setChartMode: (mode: ChartMode) => void;
  setActiveDatasetIndex: (index: number) => void;
  setUniformityMode: (mode: 'uniform' | 'mixed') => void;
  updateLabels: (labels: string[]) => void;
  toggleFillArea: () => void;
  toggleShowBorder: () => void;
  setFullChart: (chart: { chartType: SupportedChartType; chartData: ExtendedChartData; chartConfig: ChartOptions }) => void;
  setHasJSON: (value: boolean) => void;
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
export const getDefaultConfigForType = (type: SupportedChartType): ChartOptions => {
  // For area chart, use line chart config
  // Use type assertion to avoid TypeScript error
  let processedType: keyof ChartTypeRegistry;
  if (type === ('area' as CustomChartType)) {
    processedType = 'line';
  } else {
    processedType = type as keyof ChartTypeRegistry;
  }
  const baseConfig: ChartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "My Chart",
      },
      legend: {
        display: true,
        position: "top",
        labels: {
          color: '#000000' // Set default legend color to black
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

  // Special configuration for radar chart
  if (processedType === 'radar') {
    return {
      ...baseConfig,
      scales: {
        r: {
          display: true,
          beginAtZero: true,
          min: undefined,
          max: undefined,
          grid: {
            display: true,
            color: "#e5e7eb",
            lineWidth: 1,
            circular: true // Default to circular grid, panel can toggle to polygonal
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

  const noScalesTypes = ["pie", "doughnut", "polarArea"]

  if (noScalesTypes.includes(processedType as string)) {
    return baseConfig
  }

  return {
    ...baseConfig,
    scales: {
      x: {
        display: true,
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
      const meta = chart.getDatasetMeta(datasetIndex)
      if (!meta || !meta.data || !dataset.pointImages) return

      meta.data.forEach((element: any, pointIndex: number) => {
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

            // Handle callout position for all chart types
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

        dataset.pointImageConfig.forEach((config: any, pointIndex: number) => {
          if (config.position === "callout" && dataset.pointImages[pointIndex]) {
            const meta = chart.getDatasetMeta(datasetIndex)
            const element = meta.data[pointIndex]

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
        const config = dataset.pointImageConfig[dragState.dragPointIndex]

        config.calloutX = x - dragState.dragOffsetX
        config.calloutY = y - dragState.dragOffsetY

        // Redraw chart
        chart.update("none")
        event.preventDefault()
      } else {
        // Check if hovering over a callout
        let isOverCallout = false

        chart.data.datasets.forEach((dataset: any, datasetIndex: number) => {
          if (!dataset.pointImageConfig) return

          dataset.pointImageConfig.forEach((config: any, pointIndex: number) => {
            if (config.position === "callout" && dataset.pointImages[pointIndex]) {
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

    // Add event listeners
    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)
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
  const calloutX = config.calloutX !== undefined ? config.calloutX : pointX + offset
  const calloutY = config.calloutY !== undefined ? config.calloutY : pointY - offset

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
      const angle = Math.atan2(pointY - chart.chartArea.top - chart.chartArea.height / 2, 
                             pointX - chart.chartArea.left - chart.chartArea.width / 2)
      const radius = Math.min(chart.chartArea.width, chart.chartArea.height) / 2
      startX = chart.chartArea.left + chart.chartArea.width / 2 + Math.cos(angle) * radius
      startY = chart.chartArea.top + chart.chartArea.height / 2 + Math.sin(angle) * radius
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

    // Draw the arrow line if enabled
    if (arrowLine) {
    ctx.beginPath()
    ctx.moveTo(startX, startY)
      ctx.lineTo(endX, endY)
    ctx.stroke()
    }

    // Draw arrow head if enabled
    if (arrowHead) {
      const angle = Math.atan2(endY - startY, endX - startX)
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
    
    if (imageType === "circle") {
      ctx.beginPath()
      ctx.arc(calloutX, calloutY, size / 2, 0, 2 * Math.PI)
      ctx.stroke()
    } else if (imageType === "square") {
      ctx.beginPath()
      ctx.rect(calloutX - size / 2, calloutY - size / 2, size, size)
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
            { dx: -w/2, dy: -h/2 },
            { dx: w/2, dy: -h/2 },
            { dx: w/2, dy: h/2 },
            { dx: -w/2, dy: h/2 },
          ].map(({dx,dy}) => {
            // Place center at (cx,cy)
            const cx = centerX + Math.cos(theta) * r
            const cy = centerY + Math.sin(theta) * r
            return { x: cx + dx, y: cy + dy }
          })
          // Check all corners are inside the sector
          const allInside = corners.every(({x, y}) => {
            const relX = x - centerX
            const relY = y - centerY
            const rad = Math.sqrt(relX*relX + relY*relY)
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
          best = { area: maxW * maxH, x: cx - maxW/2, y: cy - maxH/2, w: maxW, h: maxH }
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
        types: [{ value: "circle", label: "Circle" }],
        positions: [
          { value: "center", label: "Center" },
          { value: "callout", label: "Callout with Arrow" },
        ],
        supportsArrow: true,
      }
  }
}

export const getDefaultImageType = (chartType: SupportedChartType): string => {
  switch (chartType) {
    case "pie":
    case "doughnut":
    case "polarArea":
      return "cover"
    case "bar":
    case "horizontalBar":
      return "square"
    default:
      return "circle"
  }
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

// Create the store with persist middleware
export const useChartStore = create<ChartStore>()(
  persist(
    (set, get) => ({
      chartType: 'bar',
      chartData: singleModeDefaultData,
      chartConfig: getDefaultConfigForType('bar'),
      chartMode: 'single',
      activeDatasetIndex: 0,
      // Add separate storage for each mode's datasets
      singleModeData: singleModeDefaultData,
      groupedModeData: groupedModeDefaultData,
      // Add uniformity mode for grouped charts
      uniformityMode: 'uniform',
      legendFilter: { datasets: {}, slices: {} },
      fillArea: true,
      showBorder: true,
      hasJSON: false,
      toggleDatasetVisibility: (index: number) => set((state) => {
        const current = (state.legendFilter.datasets as Record<number, boolean>)[index] ?? true;
        return { legendFilter: { ...state.legendFilter, datasets: { ...state.legendFilter.datasets, [index]: !current } } };
      }),
      toggleSliceVisibility: (index: number) => set((state) => {
        const current = (state.legendFilter.slices as Record<number, boolean>)[index] ?? true;
        return { legendFilter: { ...state.legendFilter, slices: { ...state.legendFilter.slices, [index]: !current } } };
      }),
      setChartType: (type) => set((state) => {
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
        let newConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(chartJsType)));
        // Preserve existing background configuration
        if ((state.chartConfig as any)?.background) {
          (newConfig as any).background = (state.chartConfig as any).background;
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

        return {
          chartType: type,
          chartData: {
            ...state.chartData,
            datasets: newDatasets,
          },
          chartConfig: newConfig,
          ...(shouldSwitchToUniform && { uniformityMode: 'uniform' as const }),
        };
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
          return {
            ...state,
            chartData: {
              ...state.chartData,
              labels: newLabels,
              datasets: state.chartData.datasets.map((d, i) => i === index ? updatedDataset : d),
            },
          }
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
          return {
            ...state,
            chartData: {
              ...state.chartData,
              labels: newLabels,
              datasets: state.chartData.datasets.map((d, i) => i === index ? updatedDataset : d),
            },
          }
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
            const lastColors = dataset.lastSliceColors
            const colors = lastColors && lastColors.length === dataset.data.length
              ? lastColors
              : generateColorPalette(dataset.data.length)
            updatedDataset.backgroundColor = colors
            updatedDataset.borderColor = colors.map(color => darkenColor(color, 20))
          }
        }
        // Handle color updates (existing logic)
        if (updates.color) {
          const baseColor = updates.color
          if (dataset.datasetColorMode === 'single') {
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
        };
        
        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single' 
          ? { singleModeData: newChartData }
          : { groupedModeData: newChartData };
        
        return {
          ...state,
          chartData: newChartData,
          ...modeDataUpdate,
        };
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
        if (state.chartType === 'radar') {
          const radarConfig = getDefaultConfigForType('radar');
          return { chartConfig: { ...radarConfig, ...config, scales: { ...radarConfig.scales, ...(config.scales || {}) } } };
        }
        return { chartConfig: config };
      }),
      updatePointImage: (datasetIndex, pointIndex, imageUrl, imageConfig) => set((state) => {
        const newChartData = {
          ...state.chartData,
          datasets: state.chartData.datasets.map((dataset, i) =>
            i === datasetIndex
              ? {
                  ...dataset,
                  pointImages: dataset.pointImages?.map((img, j) =>
                    j === pointIndex ? imageUrl : img
                  ),
                  pointImageConfig: dataset.pointImageConfig?.map((cfg, j) =>
                    j === pointIndex ? { ...cfg, ...imageConfig } : cfg
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
      resetChart: () => set((state) => {
        const modeDefaultData = getDefaultDataForMode(state.chartMode);
        
        // Update the appropriate mode-specific storage
        const modeDataUpdate = state.chartMode === 'single' 
          ? { singleModeData: modeDefaultData }
          : { groupedModeData: modeDefaultData };
        
        return {
          chartType: 'bar',
          chartData: modeDefaultData,
          chartConfig: getDefaultConfigForType('bar'),
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
      toggleFillArea: () => set((state) => {
        const newFillArea = !state.fillArea;
        return {
          fillArea: newFillArea,
          showBorder: newFillArea ? state.showBorder : true,
        };
      }),
      toggleShowBorder: () => set((state) => {
        if (state.fillArea) {
          return { showBorder: !state.showBorder };
        }
        return {};
      }),
      setFullChart: ({ chartType, chartData, chartConfig }) => set({ chartType, chartData, chartConfig }),
    }),
    {
      name: 'chart-store',
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
