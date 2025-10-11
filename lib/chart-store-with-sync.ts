// Enhanced chart store with backend sync capabilities
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { dataService } from './data-service'
import type { Chart, ChartConfiguration, ChartData, ChartType, ChartDataset, ChartOptions, ChartTypeRegistry } from "chart.js"

// Extend ChartTypeRegistry to include 'horizontalBar' type
declare module 'chart.js' {
  interface Context {
    active: boolean;
    chart: Chart;
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
    font?: FontOptions | ((context: Context) => FontOptions);
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

  interface PluginOptionsByType<TType extends ChartType = ChartType> {
    datalabels?: DatalabelsPluginOptions;
  }

  interface ChartTypeRegistry {
    horizontalBar: ChartTypeRegistry['bar'];
  }
}

// Create a custom interface that extends ChartOptions with our additional properties
export interface ExtendedChartOptions extends ChartOptions {
  manualDimensions?: boolean;
  dynamicDimension?: boolean;
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
  type: string
  size: number
  position: string
  arrow: boolean
  arrowColor?: string
  borderWidth?: number
  borderColor?: string
  borderRadius?: number
  backgroundColor?: string
  padding?: number
}

interface ExtendedChartDataset extends ChartDataset {
  pointImages?: PointImageConfig[]
  imageUrls?: string[]
  imageConfigs?: PointImageConfig[]
  showImages?: boolean
  fillArea?: boolean
  showBorder?: boolean
  borderWidth?: number
  borderColor?: string
  backgroundColor?: string
  pointBackgroundColor?: string
  pointBorderColor?: string
  pointBorderWidth?: number
  pointRadius?: number
  pointHoverRadius?: number
  pointHoverBackgroundColor?: string
  pointHoverBorderColor?: string
  pointHoverBorderWidth?: number
  tension?: number
}

export interface ExtendedChartData extends ChartData {
  datasets: ExtendedChartDataset[]
}

export type SupportedChartType = 
  | 'bar' 
  | 'line' 
  | 'pie' 
  | 'doughnut' 
  | 'polarArea' 
  | 'radar' 
  | 'scatter' 
  | 'bubble' 
  | 'horizontalBar'
  | 'area';

export type ChartMode = 'single' | 'grouped';

// Overlay types
export interface OverlayImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

export interface OverlayText {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  fontWeight: string;
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  opacity: number;
  zIndex: number;
  maxWidth?: number; // Maximum width for text wrapping
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
  
  // Separate storage for each mode's datasets
  singleModeData: ExtendedChartData;
  groupedModeData: ExtendedChartData;
  
  // Chart settings
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
  
  // Overlay state
  overlayImages: OverlayImage[];
  overlayTexts: OverlayText[];
  selectedImageId: string | null;
  selectedTextId: string | null;
  
  // Backend sync state
  isDirty: boolean;
  lastSyncTime: number;
  
  // Actions
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
  setFullChart: (snapshot: { chartType: SupportedChartType; chartData: ExtendedChartData; chartConfig: ExtendedChartOptions }) => void;
  
  // Backend sync methods
  syncToBackend: (conversationId: string) => Promise<void>;
  loadFromBackend: (conversationId: string) => Promise<void>;
  markAsDirty: () => void;
}

// Default data configurations
const singleModeDefaultData: ExtendedChartData = {
  labels: ['January', 'February', 'March', 'April', 'May'],
  datasets: [{
    label: 'Dataset 1',
    data: [12, 19, 3, 5, 2],
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
    borderWidth: 2,
    fillArea: true,
    showBorder: true,
    showImages: false,
    pointRadius: 4,
    pointHoverRadius: 6,
    tension: 0.1
  }]
};

const groupedModeDefaultData: ExtendedChartData = {
  labels: ['January', 'February', 'March', 'April', 'May'],
  datasets: [
    {
      label: 'Dataset 1',
      data: [12, 19, 3, 5, 2],
      backgroundColor: '#1976d2',
      borderColor: '#1976d2',
      borderWidth: 2,
      fillArea: true,
      showBorder: true,
      showImages: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.1
    },
    {
      label: 'Dataset 2',
      data: [2, 3, 20, 5, 1],
      backgroundColor: '#2e7d32',
      borderColor: '#2e7d32',
      borderWidth: 2,
      fillArea: true,
      showBorder: true,
      showImages: false,
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.1
    }
  ]
};

// Default chart configuration
const getDefaultConfigForType = (type: SupportedChartType): ExtendedChartOptions => {
  const baseConfig: ExtendedChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        display: true,
      },
      y: {
        display: true,
      },
    },
  };

  switch (type) {
    case 'bar':
    case 'horizontalBar':
      return {
        ...baseConfig,
        scales: {
          x: { display: true },
          y: { display: true, beginAtZero: true }
        }
      };
    case 'line':
    case 'area':
      return {
        ...baseConfig,
        scales: {
          x: { display: true },
          y: { display: true, beginAtZero: true }
        }
      };
    case 'pie':
    case 'doughnut':
      return {
        ...baseConfig,
        scales: {}
      };
    case 'polarArea':
    case 'radar':
      return {
        ...baseConfig,
        scales: {}
      };
    default:
      return baseConfig;
  }
};

export const useChartStoreWithSync = create<ChartStore>()(
  persist(
    (set, get) => ({
      // Global chart reference
      globalChartRef: null,
      setGlobalChartRef: (ref) => set({ globalChartRef: ref }),
      
      chartType: 'bar',
      chartData: singleModeDefaultData,
      chartConfig: getDefaultConfigForType('bar'),
      chartMode: 'single',
      activeDatasetIndex: 0,
      
      // Separate storage for each mode's datasets
      singleModeData: singleModeDefaultData,
      groupedModeData: groupedModeDefaultData,
      
      // Chart settings
      uniformityMode: 'uniform',
      legendFilter: { datasets: {}, slices: {} },
      fillArea: true,
      showBorder: true,
      showImages: true,
      showLabels: true,
      hasJSON: false,
      
      // Initialize overlay state
      overlayImages: [],
      overlayTexts: [],
      selectedImageId: null,
      selectedTextId: null,
      
      // Backend sync state
      isDirty: false,
      lastSyncTime: 0,
      
      // Chart actions (keeping existing functionality)
      toggleDatasetVisibility: (index: number) => set((state) => {
        const current = (state.legendFilter.datasets as Record<number, boolean>)[index] ?? true;
        return { 
          legendFilter: { ...state.legendFilter, datasets: { ...state.legendFilter.datasets, [index]: !current } },
          isDirty: true
        };
      }),
      
      toggleSliceVisibility: (index: number) => set((state) => {
        const current = (state.legendFilter.slices as Record<number, boolean>)[index] ?? true;
        return { 
          legendFilter: { ...state.legendFilter, slices: { ...state.legendFilter.slices, [index]: !current } },
          isDirty: true
        };
      }),
      
      setChartType: (type) => set((state) => {
        if (state.chartType === type) return state;
        
        const newConfig = getDefaultConfigForType(type);
        return { 
          chartType: type, 
          chartConfig: newConfig,
          isDirty: true
        };
      }),
      
      addDataset: (dataset) => set((state) => ({
        chartData: {
          ...state.chartData,
          datasets: [...state.chartData.datasets, dataset]
        },
        isDirty: true
      })),
      
      removeDataset: (index) => set((state) => ({
        chartData: {
          ...state.chartData,
          datasets: state.chartData.datasets.filter((_, i) => i !== index)
        },
        isDirty: true
      })),
      
      updateDataset: (index, updates) => set((state) => ({
        chartData: {
          ...state.chartData,
          datasets: state.chartData.datasets.map((d, i) => 
            i === index ? { ...d, ...updates } : d
          )
        },
        isDirty: true
      })),
      
      updateDataPoint: (datasetIndex, pointIndex, field, value) => set((state) => ({
        chartData: {
          ...state.chartData,
          datasets: state.chartData.datasets.map((dataset, dIndex) => 
            dIndex === datasetIndex 
              ? {
                  ...dataset,
                  data: dataset.data.map((point, pIndex) => 
                    pIndex === pointIndex 
                      ? { ...point, [field]: value }
                      : point
                  )
                }
              : dataset
          )
        },
        isDirty: true
      })),
      
      updateChartConfig: (config) => set({ 
        chartConfig: { ...get().chartConfig, ...config },
        isDirty: true
      }),
      
      resetChart: () => set({
        chartType: 'bar',
        chartData: singleModeDefaultData,
        chartConfig: getDefaultConfigForType('bar'),
        chartMode: 'single',
        activeDatasetIndex: 0,
        singleModeData: singleModeDefaultData,
        groupedModeData: groupedModeDefaultData,
        uniformityMode: 'uniform',
        legendFilter: { datasets: {}, slices: {} },
        fillArea: true,
        showBorder: true,
        showImages: true,
        showLabels: true,
        hasJSON: false,
        overlayImages: [],
        overlayTexts: [],
        selectedImageId: null,
        selectedTextId: null,
        isDirty: false,
        lastSyncTime: 0
      }),
      
      setChartMode: (mode) => set((state) => {
        const newData = mode === 'single' ? state.singleModeData : state.groupedModeData;
        return { 
          chartMode: mode, 
          chartData: newData,
          isDirty: true
        };
      }),
      
      setActiveDatasetIndex: (index) => set({ 
        activeDatasetIndex: index,
        isDirty: true
      }),
      
      setUniformityMode: (mode) => set({ 
        uniformityMode: mode,
        isDirty: true
      }),
      
      updateLabels: (labels) => set((state) => ({
        chartData: { ...state.chartData, labels },
        isDirty: true
      })),
      
      toggleFillArea: () => set((state) => ({
        fillArea: !state.fillArea,
        chartData: {
          ...state.chartData,
          datasets: state.chartData.datasets.map(d => ({ ...d, fillArea: !state.fillArea }))
        },
        isDirty: true
      })),
      
      toggleShowBorder: () => set((state) => ({
        showBorder: !state.showBorder,
        chartData: {
          ...state.chartData,
          datasets: state.chartData.datasets.map(d => ({ ...d, showBorder: !state.showBorder }))
        },
        isDirty: true
      })),
      
      toggleShowImages: () => set((state) => ({
        showImages: !state.showImages,
        chartData: {
          ...state.chartData,
          datasets: state.chartData.datasets.map(d => ({ ...d, showImages: !state.showImages }))
        },
        isDirty: true
      })),
      
      toggleShowLabels: () => set({ 
        showLabels: !get().showLabels,
        isDirty: true
      }),
      
      setFullChart: (snapshot) => set({
        chartType: snapshot.chartType,
        chartData: snapshot.chartData,
        chartConfig: snapshot.chartConfig,
        hasJSON: true,
        isDirty: true
      }),
      
      // Backend sync methods - DISABLED (only save on explicit Save button click)
      syncToBackend: async (conversationId: string) => {
        // Auto-sync disabled - charts only save when user clicks Save button
        console.log('Auto-sync disabled. Use Save button to save charts.');
        return;
      },
      
      loadFromBackend: async (conversationId: string) => {
        try {
          const response = await dataService.getCurrentChartSnapshot(conversationId);
          
          if (response.data) {
            set({
              chartType: response.data.chart_type,
              chartData: response.data.chart_data,
              chartConfig: response.data.chart_config,
              hasJSON: true,
              isDirty: false,
              lastSyncTime: Date.now()
            });
          }
        } catch (error) {
          console.error('Load failed:', error);
        }
      },
      
      markAsDirty: () => set({ isDirty: true }),
      
      // Placeholder for other methods that would be in the original chart store
      updatePointImage: () => {},
    }),
    {
      name: (() => {
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `chart-store-with-sync-${userId}`;
        }
        return 'chart-store-with-sync-anonymous';
      })(),
      version: 1,
      // Only persist certain fields
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
        showImages: state.showImages,
        showLabels: state.showLabels,
        hasJSON: state.hasJSON,
        overlayImages: state.overlayImages,
        overlayTexts: state.overlayTexts,
        // Don't persist sync-related fields
      }),
    }
  )
);

