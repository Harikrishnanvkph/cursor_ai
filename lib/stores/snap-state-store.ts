"use client"

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createExpiringStorage } from "@/lib/storage-utils";
import type { SupportedChartType, ExtendedChartData, ExtendedChartOptions, ChartGroup } from "@/lib/chart-store";

export interface SnapStateData {
  chartId?: string | null;
  source: 'cloud' | 'new' | 'manual';
  timestamp: number;
  label?: string;

  // Chart Store
  chartType: SupportedChartType;
  chartData: ExtendedChartData;
  chartConfig: ExtendedChartOptions;
  chartMode: 'single' | 'grouped';
  singleModeData?: ExtendedChartData;
  groupedModeData?: ExtendedChartData;
  groups?: ChartGroup[];
  activeDatasetIndex?: number;
  activeGroupId?: string;
  chartTitle?: string | null;
  fillArea?: boolean;
  showBorder?: boolean;
  showLabels?: boolean;
  showImages?: boolean;
  hasJSON?: boolean;
  currentSnapshotId?: string | null;
  originalCloudDimensions?: { width: string; height: string } | null;

  // UI / Canvas Background
  canvasBgType?: 'default' | 'white' | 'dark' | 'transparent' | 'color';
  canvasBgColor?: string;

  // Decorations
  decorations?: any[];

  // Format & Template fields
  isFormatMode?: boolean;
  selectedFormatId?: string | null;
  selectedFormatSnapshot?: any;
  contentPackage?: any;
  contextualImageUrl?: string | null;
  editorMode?: string;
  generateMode?: string;
}

interface SnapStateStore {
  /** The single active baseline snap state */
  snapState: SnapStateData | null;
  /** Cache of initial snap states indexed by chart/conversation ID to prevent duplicate overwrite */
  chartSnaps: Record<string, SnapStateData>;

  /** Set or update the active snap state */
  setSnapState: (snap: SnapStateData) => void;

  /** Capture current live state from all relevant stores as the single baseline snap state */
  captureCurrentState: (source: 'cloud' | 'new' | 'manual', chartId?: string | null, label?: string) => void;

  /** Capture baseline directly from an initial cloud snapshot or newly generated chart snapshot */
  captureFromSnapshot: (snapshot: any, source: 'cloud' | 'new', chartId?: string | null, extraMeta?: any) => void;

  /** Restore chart, UI background, decorations, and formats back to the baseline snap state, and clear all undo/redo history */
  restoreSnapState: () => boolean;

  /** Check if a valid snap state is available */
  hasSnapState: () => boolean;

  /** Clear the active snap state */
  clearSnapState: () => void;
}

export const useSnapStateStore = create<SnapStateStore>()(
  persist(
    (set, get) => ({
      snapState: null,
      chartSnaps: {},

      setSnapState: (snap) => set({ snapState: snap }),

      captureCurrentState: (source, chartId, label) => {
        try {
          const { useChartStore } = require("@/lib/chart-store");
          const { useUIStore } = require("@/lib/stores/ui-store");
          const { useDecorationStore } = require("@/lib/stores/decoration-store");
          const { useFormatGalleryStore } = require("@/lib/stores/format-gallery-store");
          const { useTemplateStore } = require("@/lib/template-store");

          const chartState = useChartStore.getState();
          const uiState = useUIStore.getState();
          const decoState = useDecorationStore.getState();
          const formatState = useFormatGalleryStore.getState();
          const templateState = useTemplateStore.getState();

          const id = chartId || chartState.currentSnapshotId || chartState.chartData?.datasets?.[0]?.sourceId || `chart-${Date.now()}`;

          const snap: SnapStateData = {
            chartId: id,
            source,
            timestamp: Date.now(),
            label: label || (source === 'cloud' ? 'Cloud Initial' : source === 'new' ? 'New Initial' : 'Manual Snapshot'),

            chartType: chartState.chartType,
            chartData: JSON.parse(JSON.stringify(chartState.chartData || { labels: [], datasets: [] })),
            chartConfig: JSON.parse(JSON.stringify(chartState.chartConfig || {})),
            chartMode: chartState.chartMode,
            singleModeData: chartState.singleModeData ? JSON.parse(JSON.stringify(chartState.singleModeData)) : undefined,
            groupedModeData: chartState.groupedModeData ? JSON.parse(JSON.stringify(chartState.groupedModeData)) : undefined,
            groups: chartState.groups ? JSON.parse(JSON.stringify(chartState.groups)) : undefined,
            activeDatasetIndex: chartState.activeDatasetIndex,
            activeGroupId: chartState.activeGroupId,
            chartTitle: chartState.chartTitle,
            fillArea: chartState.fillArea,
            showBorder: chartState.showBorder,
            showLabels: chartState.showLabels,
            showImages: chartState.showImages,
            hasJSON: chartState.hasJSON,
            currentSnapshotId: chartState.currentSnapshotId,
            originalCloudDimensions: chartState.originalCloudDimensions,

            canvasBgType: uiState.canvasBgType,
            canvasBgColor: uiState.canvasBgColor,

            decorations: decoState.shapes ? JSON.parse(JSON.stringify(decoState.shapes)) : [],

            isFormatMode: templateState.editorMode === 'template' || !!formatState.selectedFormatId,
            selectedFormatId: formatState.selectedFormatId,
            selectedFormatSnapshot: formatState.selectedFormatSnapshot ? JSON.parse(JSON.stringify(formatState.selectedFormatSnapshot)) : null,
            contentPackage: formatState.contentPackage ? JSON.parse(JSON.stringify(formatState.contentPackage)) : null,
            contextualImageUrl: formatState.contextualImageUrl,
            editorMode: templateState.editorMode,
            generateMode: templateState.generateMode,
          };

          set((prev) => ({
            snapState: snap,
            chartSnaps: {
              ...prev.chartSnaps,
              [id]: snap,
            },
          }));
        } catch (err) {
          console.error("[SnapStateStore] Error capturing current state:", err);
        }
      },

      captureFromSnapshot: (snapshot, source, chartId, extraMeta) => {
        try {
          const prev = get();
          const id = chartId || snapshot?.id || `cloud-${Date.now()}`;

          // If this cloud chart already has an initial baseline captured, preserve it and simply activate it!
          // Ensures loading the same chart a second time from cloud does not overwrite the original point of source.
          if (source === 'cloud' && prev.chartSnaps[id]) {
            set({ snapState: prev.chartSnaps[id] });
            return;
          }

          const snap: SnapStateData = {
            chartId: id,
            source,
            timestamp: Date.now(),
            label: source === 'cloud' ? 'Cloud Initial' : 'New Initial',

            chartType: snapshot?.chartType || 'bar',
            chartData: snapshot?.chartData ? JSON.parse(JSON.stringify(snapshot.chartData)) : { labels: [], datasets: [] },
            chartConfig: snapshot?.chartConfig ? JSON.parse(JSON.stringify(snapshot.chartConfig)) : {},
            chartMode: extraMeta?.chartMode || (snapshot?.chartData?.datasets?.length > 1 ? 'grouped' : 'single'),
            chartTitle: extraMeta?.title || snapshot?.chartTitle || null,
            hasJSON: true,
            currentSnapshotId: snapshot?.id || id,
            originalCloudDimensions: extraMeta?.dimensions || null,

            canvasBgType: extraMeta?.canvasBgType || 'default',
            canvasBgColor: extraMeta?.canvasBgColor,

            decorations: extraMeta?.decorations ? JSON.parse(JSON.stringify(extraMeta.decorations)) : [],

            isFormatMode: !!extraMeta?.formatData || !!snapshot?.template_structure,
            selectedFormatId: extraMeta?.formatData?.formatId || null,
            selectedFormatSnapshot: extraMeta?.formatData?.formatSnapshot || null,
            contentPackage: extraMeta?.formatData?.contentPackage || null,
            contextualImageUrl: extraMeta?.formatData?.contextualImageUrl || null,
            editorMode: extraMeta?.editorMode,
            generateMode: extraMeta?.generateMode,
          };

          set((prevState) => ({
            snapState: snap,
            chartSnaps: {
              ...prevState.chartSnaps,
              [id]: snap,
            },
          }));
        } catch (err) {
          console.error("[SnapStateStore] Error capturing snapshot:", err);
        }
      },

      restoreSnapState: () => {
        const { snapState } = get();
        if (!snapState) return false;

        try {
          const { useChartStore } = require("@/lib/chart-store");
          const { useUIStore } = require("@/lib/stores/ui-store");
          const { useDecorationStore } = require("@/lib/stores/decoration-store");
          const { useFormatGalleryStore } = require("@/lib/stores/format-gallery-store");
          const { useTemplateStore } = require("@/lib/template-store");

          // 1. Restore chart store state
          useChartStore.setState({
            chartType: snapState.chartType,
            chartData: JSON.parse(JSON.stringify(snapState.chartData)),
            chartConfig: JSON.parse(JSON.stringify(snapState.chartConfig)),
            chartMode: snapState.chartMode,
            singleModeData: snapState.singleModeData ? JSON.parse(JSON.stringify(snapState.singleModeData)) : snapState.singleModeData,
            groupedModeData: snapState.groupedModeData ? JSON.parse(JSON.stringify(snapState.groupedModeData)) : snapState.groupedModeData,
            groups: snapState.groups ? JSON.parse(JSON.stringify(snapState.groups)) : snapState.groups,
            activeDatasetIndex: snapState.activeDatasetIndex ?? 0,
            activeGroupId: snapState.activeGroupId ?? 'default',
            chartTitle: snapState.chartTitle ?? null,
            fillArea: snapState.fillArea ?? true,
            showBorder: snapState.showBorder ?? true,
            showLabels: snapState.showLabels ?? false,
            showImages: snapState.showImages ?? true,
            hasJSON: snapState.hasJSON ?? true,
            currentSnapshotId: snapState.currentSnapshotId ?? null,
            originalCloudDimensions: snapState.originalCloudDimensions ?? null,
          });

          // 2. Restore canvas background
          if (snapState.canvasBgType) {
            useUIStore.getState().setCanvasBg(snapState.canvasBgType as any, snapState.canvasBgColor);
          }

          // 3. Restore decorations
          if (snapState.decorations && snapState.decorations.length > 0) {
            useDecorationStore.getState().setShapes(JSON.parse(JSON.stringify(snapState.decorations)));
          } else {
            useDecorationStore.getState().clearShapes?.();
          }

          // 4. Restore format / template
          if (snapState.isFormatMode) {
            if (snapState.selectedFormatId) {
              useFormatGalleryStore.setState({
                selectedFormatId: snapState.selectedFormatId,
                selectedFormatSnapshot: snapState.selectedFormatSnapshot ? JSON.parse(JSON.stringify(snapState.selectedFormatSnapshot)) : null,
                contentPackage: snapState.contentPackage ? JSON.parse(JSON.stringify(snapState.contentPackage)) : null,
                contextualImageUrl: snapState.contextualImageUrl ?? null,
              });
            }
            if (snapState.editorMode) {
              useTemplateStore.getState().setEditorMode(snapState.editorMode as any);
            }
            if (snapState.generateMode) {
              useTemplateStore.getState().setGenerateMode(snapState.generateMode as any);
            }
          }

          // 5. Reset and remove all undo and redo history
          setTimeout(() => {
            try {
              (useChartStore as any).temporal?.getState()?.clear();
            } catch (e) {
              console.warn('[SnapStateStore] Error clearing temporal history:', e);
            }
          }, 0);

          return true;
        } catch (err) {
          console.error("[SnapStateStore] Failed to restore snap state:", err);
          return false;
        }
      },

      hasSnapState: () => {
        return !!get().snapState;
      },

      clearSnapState: () => {
        set({ snapState: null });
      },
    }),
    {
      name: "snap-state-store",
      storage: typeof window !== "undefined" ? createExpiringStorage("snap-state-store") : undefined,
    }
  )
);
