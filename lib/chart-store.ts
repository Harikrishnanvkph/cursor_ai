"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Chart, ChartConfiguration, ChartData, ChartType, ChartDataset, ChartOptions, ChartTypeRegistry } from "chart.js"
import { getDefaultImageConfig, getImageOptionsForChartType, getDefaultImageType, getDefaultImageSize } from "./plugins/universal-image-plugin"
import {
  ExtendedChartOptions,
  ExtendedChartDataset,
  ExtendedChartData,
  ChartGroup,
  DEFAULT_GROUP,
  SupportedChartType,
  ChartMode,
  defaultChartData,
  singleModeDefaultData,
  groupedModeDefaultData,
  getDefaultConfigForType,
  getDefaultDataForMode,
  prepareChartDataForSave,
  isAreaChart,
  PointImageConfig,
  chartTypeMapping,
  CustomChartType // Need to import this even if only used locally
} from "./chart-defaults"
import { generateColorPalette, darkenColor } from "./utils/color-utils"
import { OverlayImage, OverlayText, OverlayShape } from "./types/overlay"
import "./types/datalabels" // Import for module augmentation
import { attemptCaptureDatasetUndo } from "./services/undo-service"
import { areDatasetChangesMeaningful, applyDatasetTransformation } from "./utils/dataset-utils"
import { ChartTypeService } from "./services/chart-type-service"
import { DatasetService } from "./services/dataset-service"
import { GroupService } from "./services/group-service"
import { OverlayService } from "./services/overlay-service"
import { ChartStateService } from "./services/chart-state-service"
import { ChartTransformService } from "./services/chart-transform-service"
import { ChartStyleService } from "./services/chart-style-service"
import { UndoBridge } from "./services/undo-bridge"
import { ChartConfigService } from "./services/chart-config-service"
import { createExpiringStorage } from "./storage-utils"

// Re-export types and constants for compatibility
export type {
  ExtendedChartOptions,
  ExtendedChartDataset,
  ExtendedChartData,
  ChartGroup,
  SupportedChartType,
  ChartMode,
  PointImageConfig,
  CustomChartType,
  OverlayImage,
  OverlayText,
  OverlayShape
}

export {
  DEFAULT_GROUP,
  defaultChartData,
  getDefaultConfigForType,
  getDefaultDataForMode,
  prepareChartDataForSave,
  isAreaChart,
  chartTypeMapping
}
// Define the types for chartjs-plugin-datalabels
// Overlay types imported from ./types/overlay

interface ChartStore {
  // Global chart reference for sharing between components
  globalChartRef: React.MutableRefObject<any> | null
  setGlobalChartRef: (ref: React.MutableRefObject<any>) => void
  chartType: SupportedChartType;
  chartData: ExtendedChartData;
  chartConfig: ExtendedChartOptions;
  chartMode: ChartMode;
  activeDatasetIndex: number;
  lastSingleModeActiveIndex?: number;
  // Add separate storage for each mode's datasets
  singleModeData: ExtendedChartData;
  groupedModeData: ExtendedChartData;
  // Add uniformity mode for grouped charts
  uniformityMode: 'uniform' | 'mixed';
  // Groups for organizing datasets in Grouped Mode
  groups: ChartGroup[];
  activeGroupId: string;  // Always has a value (at least 'default')
  // Chart Title persistence
  chartTitle: string | null;
  // Group management actions

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
  overlayShapes: OverlayShape[];


  // Per-chart config resolution
  getActiveChartConfig: () => ExtendedChartOptions;
  setChartData: (data: ExtendedChartData) => void;
  setChartType: (type: SupportedChartType) => void;
  updateChartConfig: (config: ExtendedChartOptions) => void;

  resetChart: () => void;
  setChartMode: (mode: ChartMode) => void;
  setActiveDatasetIndex: (index: number) => void;
  setUniformityMode: (mode: 'uniform' | 'mixed') => void;
  updateLabels: (labels: string[]) => void;
  setChartTitle: (title: string | null) => void;
  toggleFillArea: () => void;
  toggleShowBorder: () => void;
  toggleShowImages: () => void;
  toggleShowLabels: () => void;
  toggleShowLegend: () => void;
  setFullChart: (chart: { chartType: SupportedChartType; chartData: ExtendedChartData; chartConfig: ExtendedChartOptions; id?: string; name?: string; conversationId?: string; replaceMode?: boolean }) => void;
  setHasJSON: (value: boolean) => void;

  // Overlay Actions
  addOverlayImage: (image: Omit<OverlayImage, 'id'>) => void;
  updateOverlayImage: (id: string, updates: Partial<OverlayImage>) => void;
  removeOverlayImage: (id: string) => void;
  addOverlayText: (text: Omit<OverlayText, 'id'>) => void;
  updateOverlayText: (id: string, updates: Partial<OverlayText>) => void;
  removeOverlayText: (id: string) => void;
  addOverlayShape: (shape: Omit<OverlayShape, 'id'>) => void;
  updateOverlayShape: (id: string, updates: Partial<OverlayShape>) => void;
  removeOverlayShape: (id: string) => void;
  clearAllOverlays: () => void;
  clearOverlayShapes: () => void;
  setActiveGroupId: (id: string) => void;



  // Data operations (temporary transformations)
  datasetBackups: Map<number, { labels: string[], data: any[], backgroundColor: any, borderColor: any, pointImages: any[], pointImageConfig: any[] }>;

  // Data backups for chart type transitions
  categoricalDataBackup: ExtendedChartData | null;
  scatterBubbleDataBackup: ExtendedChartData | null;
  setCategoricalDataBackup: (data: ExtendedChartData | null) => void;
  setScatterBubbleDataBackup: (data: ExtendedChartData | null) => void;
}

// Create the store with persist middleware
// Empty initial state - no datasets until user action
const emptyChartData = {
  labels: [],
  datasets: []
}

// Helper to apply style toggles to per-chart configuration
function applyStyleToggle(state: any, toggleFn: keyof typeof ChartStyleService) {
  const dependencies = {
    captureUndoPoint: UndoBridge.capture,
    shouldDebounceUndoOperation: () => false
  };

  // 1. Inject the resolved active config so ChartStyleService sees the truth
  const activeConfig = state.getActiveChartConfig();
  const serviceState = { ...state, chartConfig: activeConfig };

  // 2. Call the service
  const result: any = (ChartStyleService as any)[toggleFn](serviceState, dependencies);
  if (!result || Object.keys(result).length === 0) return {};

  const updates: any = {};

  // 3. If it updated chartData (e.g. toggleFillArea updates datasets), route that
  if (result.chartData) {
    updates.chartData = result.chartData;
    if (state.chartMode === 'single') {
      updates.singleModeData = result.chartData;
    } else {
      updates.groupedModeData = result.chartData;
    }
  }

  // 4. If it updated chartConfig, route it per-chart
  if (result.chartConfig) {
    updates.chartConfig = result.chartConfig; // update mirror

    if (state.chartMode === 'single') {
      const newDatasets = (result.chartData || state.chartData).datasets.map((ds: any, i: number) =>
        i === state.activeDatasetIndex ? { ...ds, chartConfig: result.chartConfig } : ds
      );
      updates.chartData = { ...(result.chartData || state.chartData), datasets: newDatasets };
      updates.singleModeData = updates.chartData;
    } else {
      updates.groups = state.groups.map((g: any) =>
        g.id === state.activeGroupId ? { ...g, chartConfig: result.chartConfig } : g
      );
    }
  }

  return updates;
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
      // Groups for organizing datasets in Grouped Mode
      groups: [DEFAULT_GROUP],
      activeGroupId: DEFAULT_GROUP.id,
      chartTitle: null,
      legendFilter: {
        datasets: {},
        slices: {}
      },
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
      overlayShapes: [],


      // Pending chart type change for transition handling (scatter/bubble <-> categorical)
      pendingChartTypeChange: null,
      // Data backups for chart type transitions
      categoricalDataBackup: null,
      scatterBubbleDataBackup: null,

      requestChartTypeChange: (targetType: SupportedChartType) => {
        const state = get();
        const result = ChartTypeService.shouldShowTransitionSetup(state.chartType, targetType, state.chartData.datasets);

        if (result.needed && result.direction) {
          set({
            pendingChartTypeChange: {
              targetType,
              currentType: state.chartType,
              direction: result.direction
            }
          });
          return true;
        }

        return false;
      },

      clearPendingChartTypeChange: () => set({ pendingChartTypeChange: null }),

      // Data backups for chart type transitions
      categoricalDataBackup: null,
      scatterBubbleDataBackup: null,

      setCategoricalDataBackup: (data) => set({ categoricalDataBackup: data }),
      setScatterBubbleDataBackup: (data) => set({ scatterBubbleDataBackup: data }),

      // Resolve the active chart's config based on mode
      getActiveChartConfig: () => {
        const state = get();
        if (state.chartMode === 'single') {
          const ds = state.chartData.datasets[state.activeDatasetIndex];
          return ds?.chartConfig ?? state.chartConfig;
        }
        const group = state.groups.find(g => g.id === state.activeGroupId);
        return group?.chartConfig ?? state.chartConfig;
      },
      setChartType: (type) => set({ chartType: type }),
      // Write config to the active chart (dataset or group) AND the global mirror
      updateChartConfig: (config) => set((state) => {
        if (state.chartMode === 'single') {
          const newDatasets = state.chartData.datasets.map((ds, i) =>
            i === state.activeDatasetIndex ? { ...ds, chartConfig: config } : ds
          );
          const newChartData = { ...state.chartData, datasets: newDatasets };
          const modeUpdate = { singleModeData: newChartData };
          return { chartConfig: config, chartData: newChartData, ...modeUpdate };
        } else {
          // Grouped mode: write to the active group's chartConfig
          const newGroups = state.groups.map(g =>
            g.id === state.activeGroupId ? { ...g, chartConfig: config } : g
          );
          return { chartConfig: config, groups: newGroups };
        }
      }),
      updateDataset: (index: number, updates: Partial<ExtendedChartDataset> & { addPoint?: boolean; removePoint?: boolean; randomizeColors?: boolean }) => set((state) => {
        const newState = DatasetService.updateDataset(index, updates, {
          chartType: state.chartType,
          chartData: state.chartData,
          chartConfig: state.chartConfig,
          chartMode: state.chartMode,
          hasJSON: state.hasJSON,
          singleModeData: state.singleModeData,
          groupedModeData: state.groupedModeData
        });

        return newState || state;
      }),
      updateDataPoint: (datasetIndex, pointIndex, field, value) => set((state) => {
        const newState = DatasetService.updateDataPoint(datasetIndex, pointIndex, field, value, {
          chartData: state.chartData,
          chartMode: state.chartMode,
          singleModeData: state.singleModeData,
          groupedModeData: state.groupedModeData
        });
        return newState;
      }),


      // Data operations - temporary transformations with auto-backup
      datasetBackups: new Map(),

      resetChart: () => set((state) => ChartStateService.resetChart()),
      setChartMode: (mode) => set((state) => ChartStateService.setChartMode(mode, state)),

      setActiveDatasetIndex: (index) => set((state) => {
        const dataset = state.chartData.datasets[index];
        if (!dataset) return { activeDatasetIndex: index };

        const newType = dataset.chartType || (dataset.type as SupportedChartType) || 'bar';

        // Use the dataset's own chartConfig if it has one, otherwise generate default for the type
        const typeChanged = state.chartType !== newType;
        const newConfig = dataset.chartConfig
          ? dataset.chartConfig
          : (typeChanged ? JSON.parse(JSON.stringify(getDefaultConfigForType(newType))) : state.chartConfig);

        return {
          activeDatasetIndex: index,
          chartType: newType,
          chartConfig: newConfig
        };
      }),
      setActiveGroupId: (id) => set((state) => GroupService.setActiveGroup(id, state)),
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
      toggleFillArea: () => set((state) => applyStyleToggle(state, 'toggleFillArea')),
      toggleShowBorder: () => set((state) => applyStyleToggle(state, 'toggleShowBorder')),
      toggleShowImages: () => set((state) => applyStyleToggle(state, 'toggleShowImages')),
      toggleShowLabels: () => set((state) => applyStyleToggle(state, 'toggleShowLabels')),
      toggleShowLegend: () => set((state) => applyStyleToggle(state, 'toggleShowLegend')),
      setChartTitle: (title: string | null) => set((state) => ChartStateService.setChartTitle(title, state)),
      setFullChart: (params) => set((state) => ChartStateService.setFullChart(params, state)),
      setCurrentSnapshotId: (id: string | null) => set({ currentSnapshotId: id }),

      // Overlay actions implementation
      addOverlayImage: (image) => set((state) =>
        OverlayService.addOverlayImage(image, { overlayImages: state.overlayImages })
      ),
      updateOverlayImage: (id, updates) => set((state) =>
        OverlayService.updateOverlayImage(id, updates, { overlayImages: state.overlayImages })
      ),
      removeOverlayImage: (id) => set((state) =>
        OverlayService.removeOverlayImage(id, { overlayImages: state.overlayImages })
      ),
      addOverlayText: (text) => set((state) =>
        OverlayService.addOverlayText(text, { overlayTexts: state.overlayTexts })
      ),
      updateOverlayText: (id, updates) => set((state) =>
        OverlayService.updateOverlayText(id, updates, { overlayTexts: state.overlayTexts })
      ),
      removeOverlayText: (id) => set((state) =>
        OverlayService.removeOverlayText(id, { overlayTexts: state.overlayTexts })
      ),
      addOverlayShape: (shape) => set((state) =>
        OverlayService.addOverlayShape(shape, { overlayShapes: state.overlayShapes })
      ),
      updateOverlayShape: (id, updates) => set((state) =>
        OverlayService.updateOverlayShape(id, updates, { overlayShapes: state.overlayShapes })
      ),
      clearAllOverlays: () => set({
        overlayImages: [],
        overlayTexts: [],
        overlayShapes: [],
      }),
      removeOverlayShape: (id) => set((state) =>
        OverlayService.removeOverlayShape(id, { overlayShapes: state.overlayShapes })
      ),
      clearOverlayShapes: () => set((state) =>
        OverlayService.clearOverlayShapes()
      ),
    }),
    {
      name: (() => {
        if (typeof window !== 'undefined') {
          const userId = localStorage.getItem('user-id') || 'anonymous';
          return `chart-store-${userId}`;
        }
        return 'chart-store-anonymous';
      })(),
      storage: typeof window !== 'undefined' ? createExpiringStorage('chart-store') : undefined,
      version: 5,
      migrate: (persistedState: any, version: number) => {
        let state = persistedState || {};

        // Helper to ensure ALL datasets have a chartType
        const backfillChartType = (data: any, globalType: string) => {
          if (data?.datasets) {
            return {
              ...data,
              datasets: data.datasets.map((ds: any) => ({
                ...ds,
                chartType: ds.chartType || globalType,
              })),
            };
          }
          return data;
        };

        // Migration for version 0 -> 1: (Handled by defaults or simple property additions)
        if (version < 1) {
          // Add basic structure if missing
          state = {
            ...state,
            groups: state.groups || [DEFAULT_GROUP],
            activeGroupId: state.activeGroupId || 'default',
          };
        }

        // Migration for version 1 -> 2: Ensure groups and activeGroupId exist
        if (version < 2) {
          state = {
            ...state,
            groups: state.groups || [DEFAULT_GROUP],
            activeGroupId: state.activeGroupId || 'default',
          };
        }

        // Migration for version 2 -> 3: (Add mode-specific storage if missing)
        if (version < 3) {
          state = {
            ...state,
            singleModeData: state.singleModeData || state.chartData || emptyChartData,
            groupedModeData: state.groupedModeData || state.chartData || emptyChartData,
          };
        }

        // Migration for version 3 -> 4: CRITICAL FIX for chartType persistence
        // Backfill chartType for all datasets that might be missing it
        if (version < 4) {
          const globalType = state.chartType || 'bar';
          state = {
            ...state,
            chartData: backfillChartType(state.chartData, globalType),
            singleModeData: backfillChartType(state.singleModeData, globalType),
            groupedModeData: backfillChartType(state.groupedModeData, globalType),
          };
        }

        // Migration for version 4 -> 5: Per-chart config
        // Backfill chartConfig into all datasets and groups from the global chartConfig
        if (version < 5) {
          const globalConfig = state.chartConfig || getDefaultConfigForType(state.chartType || 'bar');
          const backfillConfig = (data: any) => {
            if (data?.datasets) {
              return {
                ...data,
                datasets: data.datasets.map((ds: any) => ({
                  ...ds,
                  chartConfig: ds.chartConfig || JSON.parse(JSON.stringify(globalConfig)),
                })),
              };
            }
            return data;
          };
          state = {
            ...state,
            chartData: backfillConfig(state.chartData),
            singleModeData: backfillConfig(state.singleModeData),
            groupedModeData: backfillConfig(state.groupedModeData),
            groups: (state.groups || []).map((g: any) => ({
              ...g,
              chartConfig: g.chartConfig || JSON.parse(JSON.stringify(globalConfig)),
            })),
          };
        }

        return state;
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
        overlayShapes: state.overlayShapes,

        originalCloudDimensions: state.originalCloudDimensions,
        // Group management state
        groups: state.groups,
        activeGroupId: state.activeGroupId,
      }),
    }
  )
);
