"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import { Pencil, Check, Loader2, Hand, Search, ZoomIn, ZoomOut, Undo2, Redo2, ScanSearch, Ellipsis, Camera, RotateCcw, Download, Palette, Maximize2, Minimize2, Eye, EyeOff, RulerDimensionLine, Sparkles, FileImage, ImageIcon, FileCode, FileText } from "lucide-react"
import { ChartBgColorPicker } from "./chart-bg-color-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { useStore } from "zustand"
import { useLoupeStore } from "@/lib/stores/loupe-store"
import { useSnapStateStore } from "@/lib/stores/snap-state-store"
import { toast } from "sonner"
import { ChartLoupeOverlay } from "@/components/chart-preview/chart-loupe-overlay"

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
  const hasData = chartData?.datasets?.length > 0;
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
  const { isLoupeActive, toggleLoupe } = useLoupeStore();

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
  const [mobileExportQuality, setMobileExportQuality] = useState<number>(4);

  // --- Responsive check ---
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
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
  const { setZoom, attachTouchHandlers } = zoomPan;
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

  // --- Pinch-to-zoom touch handler for mobile ---
  useEffect(() => {
    return attachTouchHandlers(chartContainerRef.current);
  }, [attachTouchHandlers]);

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
  const isResponsive = false;
  const chartWidth = parseDimension((chartConfig as any)?.width);
  const chartHeight = parseDimension((chartConfig as any)?.height);

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
          zoomPan={zoomPan}
        />
        <ChartTransitionDialog
          open={transitions.scatterBubbleSetup.active && transitions.scatterBubbleSetup.targetType !== null && transitions.scatterBubbleSetup.direction !== null}
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

  const currentChartDims = (() => {
    const w = parseDimension((chartConfig as any)?.width) || 800;
    const h = parseDimension((chartConfig as any)?.height) || 600;
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const d = gcd(w, h);
    const ratio = w / h;
    let aspect = `${w / d}:${h / d}`;
    if (Math.abs(ratio - 1) < 0.02) aspect = '1:1';
    else if (Math.abs(ratio - 16 / 9) < 0.02) aspect = '16:9';
    else if (Math.abs(ratio - 4 / 3) < 0.02) aspect = '4:3';
    else if (Math.abs(ratio - 3 / 2) < 0.02) aspect = '3:2';
    else if (Math.abs(ratio - 4 / 5) < 0.02) aspect = '4:5';
    else if (Math.abs(ratio - 9 / 16) < 0.02) aspect = '9:16';
    return { w, h, aspect };
  })();

  // --- Render ---
  return (
    <div className="flex min-w-full flex-col overflow-hidden h-full relative" ref={fullscreenContainerRef}>
      {/* Fullscreen bg overlay */}
      {fullscreen.isFullscreen && <div className="fixed inset-0 bg-white z-40" />}

      {/* Combined Mobile Float Toolbar */}
      {isMobile && rename.chartTitle && (
        <div className="px-3 pb-3 pt-1 flex justify-center flex-shrink-0 w-full select-none" onClick={(e) => e.stopPropagation()}>
          <div className={`flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1 shadow-md max-w-fit mx-auto ${!hasData ? 'opacity-40 pointer-events-none select-none' : ''}`}>
            {/* 1. Pan Mode Toggle */}
            <button
              disabled={!hasData}
              onClick={() => zoomPan.setPanMode(!zoomPan.panMode)}
              className={`rounded-full transition-all active:scale-95 duration-200 flex items-center justify-center flex-shrink-0 h-9 w-9 ${
                zoomPan.panMode 
                  ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 shadow-inner' 
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400'
              }`}
              title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
            >
              <Hand className="h-5 w-5" />
            </button>

            <div className="w-px h-4.5 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />            {/* 3. Custom Zoom Dropdown */}
            <div className="flex items-center flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!hasData} variant="ghost" size="sm" className="h-9 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 select-none justify-start gap-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex-shrink-0 transition-colors [&_svg]:size-5">
                    <Search className="h-5 w-5 text-slate-500 shrink-0" />
                    <span className="tabular-nums">{currentZoomPct}%</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 p-2 z-[150]">
                  <DropdownMenuItem disabled={!hasData} onClick={() => { zoomPan.setZoom(1); zoomPan.setPanOffset({ x: 0, y: 0 }); }} className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100 dark:text-slate-200 dark:focus:bg-slate-800">
                    <span className="flex-1">100% (Fit to View)</span>
                  </DropdownMenuItem>

                  {chartWidth && chartHeight && (
                    <DropdownMenuItem onClick={() => {
                      const applyFullDimension = () => {
                        let baseScale = 1.0;
                        if (chartContainerRef?.current) {
                          const cWidth = chartContainerRef.current.clientWidth || 800;
                          const cHeight = chartContainerRef.current.clientHeight || 600;
                          const padding = 40;
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

            {/* 4. Undo / Redo Buttons */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => temporalUndo()}
                disabled={!hasData || !canUndo}
                title="Undo (Ctrl+Z)"
                className={`h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-full transition-all active:scale-90 duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105 ${
                  (!hasData || !canUndo) ? "opacity-30 cursor-not-allowed" : "opacity-100"
                }`}
              >
                <Undo2 className="h-[22px] w-[22px]" />
              </button>
              <button
                onClick={() => temporalRedo()}
                disabled={!hasData || !canRedo}
                title="Redo (Ctrl+Y)"
                className={`h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-full transition-all active:scale-90 duration-200 flex items-center justify-center flex-shrink-0 hover:scale-105 ${
                  (!hasData || !canRedo) ? "opacity-30 cursor-not-allowed" : "opacity-100"
                }`}
              >
                <Redo2 className="h-[22px] w-[22px]" />
              </button>
            </div>

            <div className="w-px h-4.5 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />

            {/* 4. Download Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={!hasData}
                  className="rounded-full transition-all active:scale-95 duration-200 flex items-center justify-center flex-shrink-0 h-9 w-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Download / Export"
                >
                  <Download className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[270px] p-2 z-[150] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl space-y-2">
                {/* 1. Image Section */}
                <div>
                  <div className="px-1 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Image
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 space-y-2 select-none" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">Quality:</span>
                      <select
                        value={mobileExportQuality}
                        onChange={(e) => setMobileExportQuality(Number(e.target.value))}
                        className="flex-1 min-w-0 max-w-[155px] text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-sm truncate"
                      >
                        <option value={4}>4x (UHD 4K)</option>
                        <option value={3}>3x (3K HD)</option>
                        <option value={2}>2x (2K QHD)</option>
                        <option value={1}>1x (Standard)</option>
                      </select>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-0.5">
                      <button
                        type="button"
                        disabled={!hasData}
                        onClick={() => exports.handleExport(mobileExportQuality)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <FileImage className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                        <span>PNG ({mobileExportQuality}x)</span>
                      </button>
                      <button
                        type="button"
                        disabled={!hasData}
                        onClick={() => exports.handleExportJPEG(mobileExportQuality)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs rounded-lg border border-amber-200 dark:border-amber-800 shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>JPEG ({mobileExportQuality}x)</span>
                      </button>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1" />

                {/* 2. HTML Section */}
                <div>
                  <div className="px-1 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    HTML
                  </div>
                  <DropdownMenuItem 
                    disabled={!hasData}
                    onClick={exports.handleExportHTML}
                    className="flex items-center justify-between px-2.5 py-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Interactive HTML</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Standalone</span>
                  </DropdownMenuItem>
                </div>

                <DropdownMenuSeparator className="my-1" />

                {/* 3. File Section */}
                <div>
                  <div className="px-1 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    File
                  </div>
                  <DropdownMenuItem 
                    disabled={!hasData}
                    onClick={exports.handleExportCSV}
                    className="flex items-center justify-between px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <span>CSV Data</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal">Spreadsheet</span>
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="w-px h-4.5 bg-slate-200 dark:bg-slate-800 flex-shrink-0" />

            {/* 5. More Options (Ellipsis) Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  disabled={!hasData}
                  className="rounded-full transition-all active:scale-95 duration-200 flex items-center justify-center flex-shrink-0 h-9 w-9 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="More Options"
                >
                  <Ellipsis className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-1.5 z-[150] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl space-y-1 max-h-[80vh] overflow-y-auto">
                {/* Dimension & Ratio */}
                <div className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 select-none">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200 tabular-nums">
                      <RulerDimensionLine className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      {currentChartDims.w}px × {currentChartDims.h}px
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                      {currentChartDims.aspect}
                    </span>
                  </div>
                </div>

                {/* Fullscreen Toggle */}
                <DropdownMenuItem
                  disabled={!hasData}
                  onClick={() => fullscreen.handleFullscreen()}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  {fullscreen.isFullscreen ? <Minimize2 className="h-4 w-4 text-slate-500 shrink-0" /> : <Maximize2 className="h-4 w-4 text-slate-500 shrink-0" />}
                  <span>{fullscreen.isFullscreen ? "Exit Fullscreen" : "Fullscreen"}</span>
                </DropdownMenuItem>

                {/* Loupe View (Inspect Details) */}
                <DropdownMenuItem
                  disabled={!hasData}
                  onClick={() => toggleLoupe()}
                  className={`flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${
                    isLoupeActive ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <ScanSearch className="h-4 w-4 text-blue-500 shrink-0" />
                  <span className="flex-1">Loupe View</span>
                  {isLoupeActive && (
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 px-1.5 py-0.5 rounded">ON</span>
                  )}
                </DropdownMenuItem>

                {/* Background Color Picker */}
                <div className="flex items-center justify-between px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2.5">
                    <Palette className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Background</span>
                  </div>
                  <ChartBgColorPicker 
                    className="flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 duration-200 h-6 w-6" 
                    innerClassName="w-3.5 h-3.5"
                    disabled={!hasData}
                  />
                </div>

                <DropdownMenuSeparator className="my-1" />

                {/* Snap State */}
                <DropdownMenuItem
                  disabled={!hasData}
                  onClick={() => {
                    useSnapStateStore.getState().captureCurrentState('manual', null, 'Manual Snapshot');
                    toast.success("Snapshot baseline saved!");
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <Camera className="h-4 w-4 text-indigo-500 shrink-0" />
                  <span>Snap State</span>
                </DropdownMenuItem>

                {/* Reset State */}
                <DropdownMenuItem
                  disabled={!hasData || !useSnapStateStore.getState().snapState}
                  onClick={() => {
                    const success = useSnapStateStore.getState().restoreSnapState();
                    if (success) {
                      toast.success("Restored to baseline snapshot!");
                    } else {
                      toast.error("No snap state saved yet.");
                    }
                  }}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>Reset State</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Toolbar */}
      {!isMobile && (
        <ChartPreviewToolbar
          isMobile={isMobile}
          editorMode={editorMode}
          setEditorMode={setEditorMode as any}
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
      <Card className={`w-full flex flex-col flex-1 min-h-[300px] rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden transition-all duration-200${fullscreen.isFullscreen ? ' fixed inset-4 z-50 m-0' : ''}`}>
        <CardContent className="p-0 flex-1 flex flex-col h-full w-full relative">
          <div
            ref={chartContainerRef}
            className={`relative w-full flex-1 ${isMobile || zoomPan.panMode ? 'overflow-hidden' : 'overflow-auto'} flex items-center justify-center`}
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              touchAction: zoomPan.panMode ? 'none' : 'manipulation',  // Prevent gesture conflict when panMode is on, allow interaction when panMode is off
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
                chartContainerRef={chartContainerRef as any}
                chartConfig={chartConfig}
                zoomPan={zoomPan}
              />
            )}
            {/* Amazon Loupe Magnifier Overlay */}
            <ChartLoupeOverlay targetContainerRef={chartContainerRef} />
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
          exports={exports}
          showLeftOverlay={fullscreen.showLeftOverlay}
          showRightOverlay={fullscreen.showRightOverlay}
          setShowLeftOverlay={fullscreen.setShowLeftOverlay}
          setShowRightOverlay={fullscreen.setShowRightOverlay}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onNewChart={onNewChart}
          leftSidebarPanelRef={leftSidebarPanelRef as any}
          rightSidebarPanelRef={rightSidebarPanelRef as any}
        />
      )}

      {/* Chart Transition Dialog */}
      <ChartTransitionDialog
        open={transitions.scatterBubbleSetup.active && transitions.scatterBubbleSetup.targetType !== null && transitions.scatterBubbleSetup.direction !== null}
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
