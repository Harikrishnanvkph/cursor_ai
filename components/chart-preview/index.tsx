"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import {
  useChartConfig,
  useChartData,
  useChartType,
  useShowLabels,
  useChartMode,
  useChartGroups,
  useActiveGroupId,
  useActiveDatasetIndex,
} from "@/lib/hooks/use-chart-state"
import { useChatStore } from "@/lib/chat-store"
import { Card, CardContent } from "@/components/ui/card"
import { useTemplateStore } from "@/lib/template-store"
import { TemplateChartPreview } from "@/components/template-chart-preview"
import { ScatterBubbleSetupScreen } from "@/components/scatter-bubble-setup-screen"
import { CreateScatterDataModal } from "@/components/dialogs/create-scatter-data-modal"
import { ChartTransitionDialog } from "@/components/dialogs/chart-transition-dialog"
import { parseDimension } from "@/lib/utils/dimension-utils"

// Extracted hooks
import { useStoreHydration } from "@/lib/hooks/use-store-hydration"
import { useChartRename } from "@/lib/hooks/use-chart-rename"
import { useChartTransitions } from "@/lib/hooks/use-chart-transitions"
import { useChartExport } from "@/lib/hooks/use-chart-export"
import { useFullscreen } from "@/lib/hooks/use-fullscreen"
import { useZoomPan } from "@/lib/hooks/use-zoom-pan"

// Extracted sub-components
import { ChartPreviewToolbar } from "@/components/chart-preview/chart-preview-toolbar"
import { ChartPreviewCanvas } from "@/components/chart-preview/chart-preview-canvas"
import { FullscreenOverlay } from "@/components/chart-preview/fullscreen-overlay"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useUIStore } from "@/lib/stores/ui-store"

export function ChartPreview({ onToggleSidebar, isSidebarCollapsed, onToggleLeftSidebar, isLeftSidebarCollapsed, isTablet = false, activeTab, onTabChange, onNewChart }: {
  onToggleSidebar?: () => void,
  isSidebarCollapsed?: boolean,
  onToggleLeftSidebar?: () => void,
  isLeftSidebarCollapsed?: boolean,
  isTablet?: boolean,
  activeTab?: string,
  onTabChange?: (tab: string) => void,
  onNewChart?: () => void
}) {
  // --- Hydration gate ---
  const storesHydrated = useStoreHydration([useChartStore, useTemplateStore]);

  // --- Store selectors ---
  const chartConfig = useChartConfig();
  const chartData = useChartData();
  const chartType = useChartType();
  const chartMode = useChartMode();

  const { selectedFormatId } = useFormatGalleryStore();
  const resetChart = useChartStore(s => s.resetChart);
  const setHasJSON = useChartStore(s => s.setHasJSON);
  const { shouldShowTemplate, editorMode, setEditorMode } = useTemplateStore();
  const { clearMessages } = useChatStore();
  const { setChartType, updateChartConfig } = useChartActions();
  const canvasBgType = useUIStore(s => s.canvasBgType);
  const canvasBgColor = useUIStore(s => s.canvasBgColor);

  // --- Refs ---
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const leftSidebarPanelRef = useRef<HTMLDivElement>(null);
  const rightSidebarPanelRef = useRef<HTMLDivElement>(null);
  const prevEditorModeRef = useRef<string>(editorMode);

  // --- Extracted hooks ---
  const rename = useChartRename();
  const transitions = useChartTransitions();
  const exports = useChartExport({
    onToggleLeftSidebar,
    isLeftSidebarCollapsed,
  });
  const fullscreen = useFullscreen(fullscreenContainerRef);
  const zoomPan = useZoomPan();

  // --- Local state ---
  const [isMobile, setIsMobile] = useState(false);

  // --- Responsive check ---
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 576);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);



  // --- Reset pan/zoom when switching to chart mode ---
  // Uses a ref to track the previous editor mode so this only fires on actual
  // mode transitions (e.g. template → chart), NOT on every re-render.
  useEffect(() => {
    const prev = prevEditorModeRef.current;
    prevEditorModeRef.current = editorMode;

    // Only reset when actually transitioning INTO chart mode from another mode
    if (editorMode === 'chart' && prev !== 'chart' && !shouldShowTemplate()) {
      zoomPan.setPanMode(false);
      zoomPan.handleResetZoom();
      setTimeout(() => {
        if (chartContainerRef.current) {
          const container = chartContainerRef.current;
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
          container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
        }
      }, 5);
    }
  }, [editorMode, shouldShowTemplate]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Center view when zoom resets ---
  useEffect(() => {
    if (chartContainerRef.current && zoomPan.zoom === 1 && zoomPan.panOffset.x === 0 && zoomPan.panOffset.y === 0) {
      setTimeout(() => {
        if (chartContainerRef.current) {
          const container = chartContainerRef.current;
          container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
          container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
        }
      }, 100);
    }
  }, [zoomPan.zoom, zoomPan.panOffset.x, zoomPan.panOffset.y]);

  // Auto-fit logic has been refactored to use synchronous CSS-based scaling and flex-centering in ChartPreviewCanvas.

  // --- Radar chart config fix ---
  useEffect(() => {
    if (chartType === 'radar' && (!chartConfig.scales || !(chartConfig.scales as any).r)) {
      const { getDefaultConfigForType } = require('@/lib/chart-store');
      const newConfig = getDefaultConfigForType('radar');
      useChartStore.getState().updateChartConfig(newConfig);
    }
  }, [chartType, chartConfig]);

  // --- Stacked bar: ensure all datasets enabled ---
  useEffect(() => {
    if (chartType === 'stackedBar') {
      const { legendFilter, chartData: storeChartData } = useChartStore.getState();
      const anyDisabled = Object.values(legendFilter.datasets).some(v => v === false);
      if (anyDisabled) {
        const newLegendFilter = {
          ...legendFilter,
          datasets: Object.fromEntries(storeChartData.datasets.map((_, i) => [i, true]))
        };
        useChartStore.setState({ legendFilter: newLegendFilter });
      }
    }
  }, [chartType, chartData.datasets.length]);

  // --- Hover cleanup ---
  useEffect(() => {
    const clearHover = () => { };
    const handleWindowMouseLeave = (e: MouseEvent) => { if (e.relatedTarget === null) clearHover(); };
    const handleVisibilityChange = () => { if (document.visibilityState !== 'visible') clearHover(); };
    const handleWindowBlur = () => clearHover();

    window.addEventListener('mouseout', handleWindowMouseLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      window.removeEventListener('mouseout', handleWindowMouseLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearHover();
    };
  }, []);

  // --- Non-responsive canvas DPI handling ---
  const isResponsive = (chartConfig as any)?.responsive !== false;
  const chartWidth = !isResponsive ? parseDimension((chartConfig as any)?.width) : undefined;
  const chartHeight = !isResponsive ? parseDimension((chartConfig as any)?.height) : undefined;

  useEffect(() => {
    const getGlobalChartRef = () => useChartStore.getState().globalChartRef;
    if (!isResponsive && getGlobalChartRef()?.current) {
      const canvas = getGlobalChartRef()?.current?.canvas;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = (chartWidth || 800) * dpr;
        canvas.height = (chartHeight || 600) * dpr;
        canvas.style.width = (chartWidth || 800) + 'px';
        canvas.style.height = (chartHeight || 600) + 'px';
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        getGlobalChartRef()?.current?.resize();
      }
    }
  }, [isResponsive, chartWidth, chartHeight]);

  useEffect(() => {
    const getGlobalChartRef = () => useChartStore.getState().globalChartRef;
    if (getGlobalChartRef()?.current) {
      getGlobalChartRef()?.current?.resize();
      getGlobalChartRef()?.current?.update();
    }
  }, [chartWidth, chartHeight, isResponsive]);

  // --- Stacked bar config ---
  let finalChartConfig = {
    ...chartConfig,
    plugins: {
      ...chartConfig.plugins,
      exportWithBackground: {
        background: (() => {
          const { getBackgroundConfig } = require("@/lib/utils/dimension-utils");
          return getBackgroundConfig(chartConfig);
        })(),
        fileNamePrefix: 'chart',
        quality: 1.0
      }
    }
  };

  if (chartType === 'stackedBar') {
    finalChartConfig = {
      ...finalChartConfig,
      scales: {
        ...chartConfig.scales,
        x: { ...((chartConfig.scales && chartConfig.scales.x) || {}), stacked: true },
        y: { ...((chartConfig.scales && chartConfig.scales.y) || {}), stacked: true },
      },
    };
  }

  // --- Chart type change handler ---
  const handleChartTypeChange = useCallback((type: string) => {
    setChartType(type as any);
  }, [setChartType]);

  // --- Reset chart handler ---
  const handleResetChart = useCallback(() => {
    clearMessages();
    resetChart();
    setHasJSON(false);
  }, [clearMessages, resetChart, setHasJSON]);

  // --- Guard: hydration ---
  if (!storesHydrated) {
    return <div className="flex min-w-full flex-col overflow-hidden h-full" />;
  }

  // --- Template mode: delegate ---
  if (shouldShowTemplate() || (editorMode === 'template' && selectedFormatId)) {
    return (
      <>
        <TemplateChartPreview
          onToggleSidebar={onToggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleLeftSidebar={onToggleLeftSidebar}
          isLeftSidebarCollapsed={isLeftSidebarCollapsed}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onNewChart={onNewChart}
        />
        <ChartTransitionDialog
          open={transitions.scatterBubbleSetup.active && transitions.scatterBubbleSetup.targetType !== null && transitions.scatterBubbleSetup.direction !== null && editorMode === 'template'}
          targetChartType={transitions.scatterBubbleSetup.targetType || 'bar'}
          direction={transitions.scatterBubbleSetup.direction || 'toScatter'}
          hasBackup={transitions.scatterBubbleSetup.backupData !== null}
          onLoadSample={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleLoadSampleData : transitions.handleLoadCategoricalData}
          onRestore={transitions.scatterBubbleSetup.direction === 'toScatter'
            ? (transitions.scatterBubbleSetup.backupData ? transitions.handleRestoreScatterData : undefined)
            : (transitions.scatterBubbleSetup.backupData ? transitions.handleRestoreCategoricalData : undefined)}
          onQuickTransform={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleQuickTransform : undefined}
          onCreateDataset={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleOpenCreateModal : undefined}
          onCancel={transitions.handleCancelSetup}
        />
      </>
    );
  }

  // --- Render ---
  return (
    <div className="flex min-w-full flex-col overflow-hidden h-full" ref={fullscreenContainerRef}>
      {/* Fullscreen bg overlay */}
      {fullscreen.isFullscreen && <div className="fixed inset-0 bg-white z-40" />}

      {/* Toolbar */}
      <ChartPreviewToolbar
        isMobile={isMobile}
        editorMode={editorMode}
        setEditorMode={setEditorMode}
        chartType={chartType}
        onChartTypeChange={handleChartTypeChange}
        isResponsive={isResponsive}
        chartContainerRef={chartContainerRef}
        chartWidth={chartWidth}
        chartHeight={chartHeight}
        rename={rename}
        zoomPan={zoomPan}
        exports={exports}
        handleFullscreen={fullscreen.handleFullscreen}
        onResetChart={handleResetChart}
      />

      {/* Chart Container */}
      <Card className={`w-full flex-1 min-h-[300px] rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden transition-all duration-200${fullscreen.isFullscreen ? ' fixed inset-4 z-50 m-0 rounded-lg' : ''}`}>
        <CardContent className={`${isMobile ? 'p-0' : 'p-0'} h-full w-full`}>
          <div
            ref={chartContainerRef}
            className={`relative w-full h-full overflow-auto flex items-center justify-center`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              minHeight: '100%',
              height: '100%',
              backgroundColor: canvasBgType === 'transparent' ? 'transparent' : canvasBgColor,
              backgroundImage: canvasBgType === 'transparent' ? `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)` : undefined,
              backgroundSize: canvasBgType === 'transparent' ? '20px 20px' : undefined,
              backgroundPosition: canvasBgType === 'transparent' ? '0 0, 0 10px, 10px -10px, -10px 0px' : undefined,
            }}
          >
            {transitions.scatterBubbleSetup.active && transitions.scatterBubbleSetup.targetType && transitions.scatterBubbleSetup.direction && editorMode === 'chart' ? (
              <ScatterBubbleSetupScreen
                targetChartType={transitions.scatterBubbleSetup.targetType}
                direction={transitions.scatterBubbleSetup.direction}
                hasBackup={transitions.scatterBubbleSetup.backupData !== null}
                onLoadSample={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleLoadSampleData : transitions.handleLoadCategoricalData}
                onRestore={transitions.scatterBubbleSetup.direction === 'toScatter'
                  ? (transitions.scatterBubbleSetup.backupData ? transitions.handleRestoreScatterData : undefined)
                  : (transitions.scatterBubbleSetup.backupData ? transitions.handleRestoreCategoricalData : undefined)}
                onQuickTransform={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleQuickTransform : undefined}
                onCreateDataset={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleOpenCreateModal : undefined}
                onCancel={transitions.handleCancelSetup}
              />
            ) : (
              <ChartPreviewCanvas
                chartContainerRef={chartContainerRef}
                chartConfig={chartConfig}
                zoomPan={zoomPan}
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Scatter/Bubble Data Modal */}
      <CreateScatterDataModal
        open={transitions.showCreateDataModal}
        onOpenChange={transitions.setShowCreateDataModal}
        chartType={transitions.scatterBubbleSetup.targetType || 'scatter'}
        onDatasetCreate={transitions.handleCreateDataset}
      />

      {/* Fullscreen UI */}
      {fullscreen.isFullscreen && (
        <FullscreenOverlay
          zoomPan={zoomPan}
          handleFullscreen={fullscreen.handleFullscreen}
          handleExport={exports.handleExport}
          showLeftOverlay={fullscreen.showLeftOverlay}
          showRightOverlay={fullscreen.showRightOverlay}
          setShowLeftOverlay={fullscreen.setShowLeftOverlay}
          setShowRightOverlay={fullscreen.setShowRightOverlay}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onNewChart={onNewChart}
          leftSidebarPanelRef={leftSidebarPanelRef}
          rightSidebarPanelRef={rightSidebarPanelRef}
        />
      )}

      {/* Chart Transition Dialog (template mode) */}
      <ChartTransitionDialog
        open={transitions.scatterBubbleSetup.active && transitions.scatterBubbleSetup.targetType !== null && transitions.scatterBubbleSetup.direction !== null && editorMode === 'template'}
        targetChartType={transitions.scatterBubbleSetup.targetType || 'bar'}
        direction={transitions.scatterBubbleSetup.direction || 'toScatter'}
        hasBackup={transitions.scatterBubbleSetup.backupData !== null}
        onLoadSample={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleLoadSampleData : transitions.handleLoadCategoricalData}
        onRestore={transitions.scatterBubbleSetup.direction === 'toScatter'
          ? (transitions.scatterBubbleSetup.backupData ? transitions.handleRestoreScatterData : undefined)
          : (transitions.scatterBubbleSetup.backupData ? transitions.handleRestoreCategoricalData : undefined)}
        onQuickTransform={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleQuickTransform : undefined}
        onCreateDataset={transitions.scatterBubbleSetup.direction === 'toScatter' ? transitions.handleOpenCreateModal : undefined}
        onCancel={transitions.handleCancelSetup}
      />
    </div>
  );
}
