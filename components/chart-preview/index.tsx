"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Pencil, Check, Loader2, Hand, Search, ZoomIn, ZoomOut, Undo2, Redo2 } from "lucide-react"
import { ChartBgColorPicker } from "./chart-bg-color-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useStore } from "zustand"

const ZOOM_VALUES: number[] = (() => {
  let values: number[] = [];
  for (let i = 10; i <= 50; i += 1) values.push(i);
  for (let i = 52; i <= 100; i += 2) values.push(i);
  for (let i = 103; i <= 160; i += 3) values.push(i);
  for (let i = 165; i <= 210; i += 5) values.push(i);
  for (let i = 216; i <= 300; i += 6) values.push(i);
  for (let i = 310; i <= 380; i += 10) values.push(i);
  for (let i = 392; i <= 500; i += 12) values.push(i);
  return values;
})();
import { useChartStore, getDefaultConfigForType } from "@/lib/chart-store"
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
import { Card, CardContent } from "@/components/ui/card"
import { useTemplateStore } from "@/lib/template-store"
import { TemplateChartPreview } from "@/components/template-chart-preview"
import { ScatterBubbleSetupScreen } from "@/components/scatter-bubble-setup-screen"
import { CreateScatterDataModal } from "@/components/dialogs/create-scatter-data-modal"
import { ChartTransitionDialog } from "@/components/dialogs/chart-transition-dialog"
import { parseDimension, getBackgroundConfig } from "@/lib/utils/dimension-utils"

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
import { ChartStyleGallery } from "@/components/chart-style-gallery"
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

  const { undo: temporalUndo, redo: temporalRedo, pastStates, futureStates } = useStore(useChartStore.temporal);
  const canUndo = pastStates.length > 0;
  const canRedo = futureStates.length > 0;

  const { selectedFormatId } = useFormatGalleryStore();

  const setHasJSON = useChartStore(s => s.setHasJSON);
  const { shouldShowTemplate, editorMode, setEditorMode } = useTemplateStore();
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
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
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

  // --- Ctrl + mouse wheel/trackpad zoom handler ---
  const { setZoom } = zoomPan;
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const container = chartContainerRef.current;
      if (!container) return;

      if (container.contains(e.target as Node)) {
        if (e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();

          const zoomFactor = 1.05;
          setZoom(prev => {
            const newZoom = e.deltaY < 0 ? prev * zoomFactor : prev / zoomFactor;
            return Math.min(Math.max(newZoom, 0.1), 5);
          });
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [setZoom]);

  // Auto-fit logic has been refactored to use synchronous CSS-based scaling and flex-centering in ChartPreviewCanvas.

  // --- Radar chart config fix ---
  useEffect(() => {
    if (chartType === 'radar' && (!chartConfig.scales || !(chartConfig.scales as any).r)) {
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

  // --- Listen to global triggerFullscreen custom event ---
  useEffect(() => {
    const handleGlobalFullscreen = () => {
      fullscreen.handleFullscreen();
    };

    window.addEventListener('triggerFullscreen', handleGlobalFullscreen);
    return () => {
      window.removeEventListener('triggerFullscreen', handleGlobalFullscreen);
    };
  }, [fullscreen]);

  // --- Non-responsive canvas DPI handling ---
  const isResponsive = (chartConfig as any)?.responsive !== false;
  const chartWidth = !isResponsive ? parseDimension((chartConfig as any)?.width) : undefined;
  const chartHeight = !isResponsive ? parseDimension((chartConfig as any)?.height) : undefined;

  const [hoverDimensions, setHoverDimensions] = useState<{ width: number, height: number } | null>(null);

  const handleMeasureDimensions = useCallback(() => {
    if (!isResponsive || !chartContainerRef.current) return;
    const rect = chartContainerRef.current.getBoundingClientRect();
    setHoverDimensions({
      width: Math.round(rect.width),
      height: Math.round(rect.height)
    });
  }, [isResponsive]);

  const getDimensionText = useCallback(() => {
    if (!isResponsive) {
      return `${chartWidth || 0} × ${chartHeight || 0}`;
    }
    if (!hoverDimensions) return 'Responsive (tap to measure)';
    return `${hoverDimensions.width} × ${hoverDimensions.height} (responsive)`;
  }, [isResponsive, chartWidth, chartHeight, hoverDimensions]);

  const currentZoomPct = Math.round(zoomPan.zoom * 100);

  let closestIndex = 0;
  let minDiff = Infinity;
  for (let i = 0; i < ZOOM_VALUES.length; i++) {
    const diff = Math.abs(ZOOM_VALUES[i] - currentZoomPct);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  const handleSliderChange = useCallback((value: number[]) => {
    const newZoomPct = ZOOM_VALUES[value[0]];
    zoomPan.setZoom(newZoomPct / 100);
  }, [zoomPan]);


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
        background: getBackgroundConfig(chartConfig),
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
    <div className="flex min-w-full flex-col overflow-hidden h-full relative" ref={fullscreenContainerRef}>
      {/* Fullscreen bg overlay */}
      {fullscreen.isFullscreen && <div className="fixed inset-0 bg-white z-40" />}

      {/* Combined Mobile Float Toolbar */}
      {isMobile && rename.chartTitle && (
        <div className="px-3 pb-3 pt-1 flex justify-center flex-shrink-0 w-full select-none" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-4 py-1.5 shadow-sm max-w-fit mx-auto">
            {/* 1. Preview Background Change Picker */}
            <div className="flex items-center flex-shrink-0">
              <ChartBgColorPicker className="flex items-center justify-center p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 duration-200 h-8 w-8" />
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />

            {/* 2. Pan Mode Toggle */}
            <button
              onClick={() => zoomPan.setPanMode(!zoomPan.panMode)}
              className={`p-1.5 rounded-full transition-all active:scale-95 duration-200 flex items-center justify-center flex-shrink-0 h-8 w-8 ${
                zoomPan.panMode 
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-inner' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
              title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
            >
              <Hand className="h-4 w-4" />
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />

            {/* 3. Custom Zoom Dropdown */}
            <div className="flex items-center flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 px-2.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 select-none justify-start gap-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 transition-colors">
                    <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="tabular-nums">{currentZoomPct}%</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 p-2 z-[150]">
                  <DropdownMenuItem onClick={() => { zoomPan.setZoom(1); zoomPan.setPanOffset({ x: 0, y: 0 }); }} className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100 dark:text-slate-200 dark:focus:bg-slate-800">
                    <span className="flex-1">100% (Fit to View)</span>
                  </DropdownMenuItem>

                  {chartWidth && chartHeight && (
                    <DropdownMenuItem onClick={() => {
                      const applyFullDimension = () => {
                        let baseScale = 1.0;
                        if (chartContainerRef?.current) {
                          const cWidth = chartContainerRef.current.clientWidth || 800;
                          const cHeight = chartContainerRef.current.clientHeight || 600;
                          const padding = 100;
                          const availableWidth = Math.max(10, cWidth - padding);
                          const availableHeight = Math.max(10, cHeight - padding);
                          const scaleX = availableWidth / chartWidth;
                          const scaleY = availableHeight / chartHeight;
                          baseScale = Math.min(scaleX, scaleY, 1.0);
                        }
                        zoomPan.setZoom(1.0 / baseScale);
                        zoomPan.setPanOffset({ x: 0, y: 0 });
                      };
                      
                      applyFullDimension();
                      setTimeout(applyFullDimension, 50);
                    }} className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100 dark:text-slate-200 dark:focus:bg-slate-800">
                      <span className="flex-1">Full Dimension</span>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-1" />

                  <div className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <Slider
                      min={0}
                      max={ZOOM_VALUES.length - 1}
                      step={1}
                      value={[closestIndex]}
                      onValueChange={handleSliderChange}
                      className="cursor-pointer"
                    />
                  </div>

                  <DropdownMenuSeparator className="my-1" />
                  <div className="flex items-center justify-between gap-1 px-1">
                    <DropdownMenuItem
                      onSelect={(e) => { e.preventDefault(); zoomPan.handleZoomOut(); }}
                      className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800"
                      title="Zoom Out"
                    >
                      <ZoomOut className="h-4 w-4 text-slate-500" />
                    </DropdownMenuItem>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-slate-800" />
                    <DropdownMenuItem
                      onSelect={(e) => { e.preventDefault(); zoomPan.handleZoomIn(); }}
                      className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800"
                      title="Zoom In"
                    >
                      <ZoomIn className="h-4 w-4 text-slate-500" />
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />

            {/* 4. Undo / Redo Buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => temporalUndo()}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className={`h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-full transition-all active:scale-90 duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105 ${
                  !canUndo ? "opacity-50 cursor-not-allowed" : "opacity-100"
                }`}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => temporalRedo()}
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
                className={`h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-full transition-all active:scale-90 duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105 ${
                  !canRedo ? "opacity-50 cursor-not-allowed" : "opacity-100"
                }`}
              >
                <Redo2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!isMobile && (
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
        />
      )}

      {/* Chart Container */}
      <Card className={`w-full flex-1 min-h-[300px] rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden transition-all duration-200${fullscreen.isFullscreen ? ' fixed inset-4 z-50 m-0 rounded-lg' : ''}`}>
        <CardContent className={`${isMobile ? 'p-0' : 'p-0'} h-full w-full relative`}>
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

      {/* Chart Style Gallery Panel — on lg+ slides over chart area; on <lg covers entire preview section */}
      <ChartStyleGallery />

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
