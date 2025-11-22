"use client"

import { useRef, useEffect, useState } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Maximize2, Minimize2, RotateCcw, X,
   FileCode, FileDown, FileImage, FileText, ImageIcon, Settings, Menu, Ellipsis, Eye, ZoomIn, ZoomOut, Hand, ChevronLeft } from "lucide-react"
import { BarChart3,ChartColumnStacked,ChartColumnBig,ChartBarBig,ChartLine,ChartPie,ChartScatter,ChartArea,Radar, Database, Dot, Edit3, LogOut } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { downloadChartAsHTML } from "@/lib/html-exporter"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useTemplateStore } from "@/lib/template-store"
import { TemplateChartPreview } from "@/components/template-chart-preview"
import ChartGenerator from "@/lib/chart_generator"
import { HistoryDropdown } from "@/components/history-dropdown"
import { UndoRedoButtons } from "@/components/ui/undo-redo-buttons"
import { useAuth } from "@/components/auth/AuthProvider"
import Image from "next/image"
import { DropdownMenu as ProfileDropdownMenu, DropdownMenuContent as ProfileDropdownMenuContent, DropdownMenuItem as ProfileDropdownMenuItem, DropdownMenuSeparator as ProfileDropdownMenuSeparator, DropdownMenuTrigger as ProfileDropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { ConfigPanel } from "@/components/config-panel"
import { PanelLeft, PanelRight } from "lucide-react"
import { SidebarPortalProvider } from "@/components/sidebar-portal-context"
import { SidebarContainer } from "@/components/sidebar-container"

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
  const { chartConfig, chartData, chartType, resetChart, setHasJSON, globalChartRef, showLabels, showImages, fillArea, showBorder, toggleShowBorder } = useChartStore()
  const { shouldShowTemplate, editorMode, templateInBackground, currentTemplate, setEditorMode } = useTemplateStore()
  const { user } = useAuth()

  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const leftSidebarPanelRef = useRef<HTMLDivElement>(null);
  const rightSidebarPanelRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const { clearMessages } = useChatStore();
  const [showLeftOverlay, setShowLeftOverlay] = useState(false);
  const [showRightOverlay, setShowRightOverlay] = useState(false);
  const [fullscreenActiveTab, setFullscreenActiveTab] = useState(activeTab || "types_toggles");

  // Sync fullscreenActiveTab with activeTab prop
  useEffect(() => {
    if (activeTab) {
      setFullscreenActiveTab(activeTab);
    }
  }, [activeTab]);

  // Reset pan offset when switching to chart mode
  useEffect(() => {
    if (editorMode === 'chart' && !shouldShowTemplate()) {
      setPanOffset({ x: 0, y: 0 });
      setZoom(1);
      
      // Also explicitly center the container after a short delay
      setTimeout(() => {
        if (chartContainerRef.current) {
          const container = chartContainerRef.current;
          const scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
          const scrollTop = (container.scrollHeight - container.clientHeight) / 2;
          container.scrollLeft = scrollLeft;
          container.scrollTop = scrollTop;
        }
      }, 5);
    }
  }, [editorMode, shouldShowTemplate]);

  // Responsive check for <576px
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 576);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  
  const handleExport = () => {
    if (globalChartRef?.current) {
      const chartInstance = globalChartRef.current;
      const bgConfig = getBackgroundConfig();
      console.log('Exporting with config:', {
        background: bgConfig,
        hasExportMethod: !!chartInstance.exportToImage
      });
      
      // Use the export plugin
      if (chartInstance.exportToImage) {
        try {
          chartInstance.exportToImage({
            background: bgConfig,
            fileNamePrefix: 'chart',
            quality: 1.0
          });
        } catch (error) {
          console.error('Error during export:', error);
        }
      } else {
        console.error('Export plugin not initialized on chart instance');
      }
    } else {
      console.error('Chart ref is not available');
    }
  };

  const handleExportHTML = async () => {
    // Capture current drag state from the chart instance
    let currentDragState = {};
    if (globalChartRef?.current) {
      try {
        const { getCurrentDragState } = require('@/lib/custom-label-plugin');
        currentDragState = getCurrentDragState(globalChartRef?.current);
        console.log('Captured drag state for HTML export:', currentDragState);
      } catch (error) {
        console.warn('Could not capture drag state:', error);
      }
    }

    try {
      const result = await downloadChartAsHTML({
        title: (chartConfig.plugins?.title?.text as string) || "Chart Export",
        subtitle: (chartConfig.plugins?.subtitle?.display && chartConfig.plugins?.subtitle?.text) 
          ? (chartConfig.plugins?.subtitle?.text as string) 
          : undefined,
        width: 800,
        height: 600,
        backgroundColor: getBackgroundConfig().color || "#ffffff",
        includeResponsive: true,
        includeAnimations: true,
        includeTooltips: true,
        includeLegend: true,
        fileName: `chart-${chartType}-${new Date().toISOString().slice(0, 10)}.html`,
        dragState: currentDragState, // Pass the captured drag state
        showImages: showImages,
        showLabels: showLabels,
        fillArea: fillArea,
        showBorder: showBorder
      });
      
      if (result && result.success) {
        console.log(result.message);
      } else if (result) {
        console.error(result.error);
      }
    } catch (error) {
      console.error('Error exporting HTML:', error);
    }
  };

  const handleRefresh = () => {
    if (globalChartRef?.current) {
      globalChartRef?.current.update("active")
    }
  }

  const handleFullscreen = async () => {
    if (!globalChartRef?.current || !fullscreenContainerRef.current) return;

    const container = fullscreenContainerRef.current;
    const canvas = globalChartRef?.current.canvas;
    
    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await container.requestFullscreen();
        setIsFullscreen(true);
        
        // Increase canvas resolution for better quality
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        // Set canvas size to match display size
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.objectFit = 'contain';
        
        // Set actual pixel dimensions for crisp rendering
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Update chart to use new dimensions
        globalChartRef?.current.resize();
        globalChartRef?.current.render();
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
        
        // Reset canvas size
        canvas.style.width = '';
        canvas.style.height = '';
        canvas.style.objectFit = '';
        
        // Reset to original dimensions
        globalChartRef?.current.resize();
        globalChartRef?.current.render();
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err);
    }
  };
  
  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);
      // Close overlays when exiting fullscreen
      if (!isNowFullscreen) {
        setShowLeftOverlay(false);
        setShowRightOverlay(false);
      }
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getChartDisplayName = () => {
    const displayNames: Record<string, string> = {
      bar: chartConfig.indexAxis === "y" ? "Horizontal Bar" : "Bar",
      line: chartData.datasets.some((d) => d.fill) ? "Area" : "Line",
      area: "Area",
      pie: "Pie",
      doughnut: "Doughnut",
      radar: "Radar",
      polarArea: "Polar Area",
      scatter: "Scatter",
      bubble: "Bubble",
      horizontalBar: "Horizontal Bar",
      stackedBar: "Stacked Bar"
    }
    return displayNames[chartType] || chartType.charAt(0).toUpperCase() + chartType.slice(1)
  }

  // Radar chart config bug fix: ensure correct config/scales on first load
  useEffect(() => {
    if (chartType === 'radar' && (!chartConfig.scales || !(chartConfig.scales as any).r)) {
      // force update config for radar
      const { getDefaultConfigForType } = require('@/lib/chart-store');
      const newConfig = getDefaultConfigForType('radar');
      (window as any).chartStoreUpdateRadarConfig?.(newConfig); // will be set below
    }
  }, [chartType, chartConfig]);

  // Provide a global setter for radar config update
  useEffect(() => {
    (window as any).chartStoreUpdateRadarConfig = (newConfig: any) => {
      if (typeof newConfig === 'object') {
        useChartStore.getState().updateChartConfig(newConfig);
      }
    };
    return () => {
      (window as any).chartStoreUpdateRadarConfig = undefined;
    };
  }, []);

  // Get background configuration
  const getBackgroundConfig = () => {
    const bgConfig = (chartConfig as any)?.background;
    console.log('Current background config from chart:', bgConfig);
    
    let result;
    if (bgConfig) {
      // For gradient, ensure both start and end colors are present
      if (bgConfig.type === 'gradient') {
        result = {
          ...bgConfig,
          type: 'gradient' as const,
          gradientStart: bgConfig.gradientStart || '#000000',
          gradientEnd: bgConfig.gradientEnd || '#ffffff',
          opacity: bgConfig.opacity ?? 100
        };
      } else {
        result = {
          ...bgConfig,
          opacity: bgConfig.opacity ?? 100
        };
      }
    } else if (chartConfig.backgroundColor) {
      result = {
        type: 'color' as const,
        color: chartConfig.backgroundColor,
        opacity: 100
      };
    } else {
      result = {
        type: 'color' as const,
        color: '#ffffff',
        opacity: 100
      };
    }
    
    //console.log('Export background config:', JSON.stringify(result, null, 2));
    return result;
  };

  // Chart size logic
  const isResponsive = (chartConfig as any)?.responsive !== false;
  
  // Parse width and height values, handling both numbers and strings with units
  const parseDimension = (value: any): number => {
    if (typeof value === 'number') {
      return isNaN(value) ? 500 : value;
    }
    if (typeof value === 'string') {
      // Remove units and parse as number
      const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(numericValue) ? 400 : numericValue;
    }
    return 500; // Default fallback
  };
  
  const chartWidth = !isResponsive ? parseDimension((chartConfig as any)?.width) : undefined;
  const chartHeight = !isResponsive ? parseDimension((chartConfig as any)?.height) : undefined;

  // If stackedBar, ensure both x and y axes are stacked
  let stackedBarConfig = {
    ...chartConfig,
    plugins: {
      ...chartConfig.plugins,
      exportWithBackground: {
        background: getBackgroundConfig(),
        fileNamePrefix: 'chart',
        quality: 1.0
      }
    }
  };

  // Control label visibility
  if (!showLabels) {
    stackedBarConfig = {
      ...stackedBarConfig,
      plugins: {
        ...stackedBarConfig.plugins,
        datalabels: {
          display: false
        },
        tooltip: {
          ...stackedBarConfig.plugins?.tooltip,
          enabled: false
        },

      }
    };
  }
  
  if (chartType === 'stackedBar') {
    stackedBarConfig = {
      ...stackedBarConfig,
      scales: {
        ...chartConfig.scales,
        x: { ...((chartConfig.scales && chartConfig.scales.x) || {}), stacked: true },
        y: { ...((chartConfig.scales && chartConfig.scales.y) || {}), stacked: true },
      },
    };
  }

  // When switching to stackedBar, ensure all datasets are enabled by default
  useEffect(() => {
    if (chartType === 'stackedBar') {
      const { legendFilter, chartData } = useChartStore.getState();
      const anyDisabled = Object.values(legendFilter.datasets).some(v => v === false);
      if (anyDisabled) {
        const newLegendFilter = {
          ...legendFilter,
          datasets: Object.fromEntries(chartData.datasets.map((_, i) => [i, true]))
        };
        useChartStore.setState({ legendFilter: newLegendFilter });
      }
    }
  }, [chartType, chartData.datasets.length]);

  // Ensure hover effect is cleared if mouse leaves window or on unmount
  useEffect(() => {
    const clearHover = () => {};

    const handleWindowMouseLeave = (e: MouseEvent) => {
      if (e.relatedTarget === null) clearHover();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') clearHover();
    };
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

  useEffect(() => {
    if (!isResponsive && globalChartRef?.current) {
      const canvas = globalChartRef?.current.canvas;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        // Set canvas pixel size
        canvas.width = (chartWidth || 800) * dpr;
        canvas.height = (chartHeight || 600) * dpr;
        // Set CSS size
        canvas.style.width = (chartWidth || 800) + 'px';
        canvas.style.height = (chartHeight || 600) + 'px';
        // Scale context for high-DPI
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        globalChartRef?.current.resize();
      }
    }
  }, [isResponsive, chartWidth, chartHeight]);

  // Force chart update on dimension/responsive change
  useEffect(() => {
    if (globalChartRef?.current) {
      globalChartRef?.current.resize();
      globalChartRef?.current.update();
    }
  }, [chartWidth, chartHeight, isResponsive]);

  // Add export handler stubs if not already present
  const handleExportJPEG = () => {
    if (globalChartRef?.current) {
      const url = globalChartRef?.current.toBase64Image('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'chart.jpeg';
      link.click();
    }
  };
  const handleExportCSV = () => {
    // Implement CSV export logic here
    alert('CSV export is not implemented yet.');
  };

  const handleExportSettings = () => {
    // Navigate to export settings in the left sidebar
    if (onToggleLeftSidebar) {
      // First expand the left sidebar if it's collapsed
      if (isLeftSidebarCollapsed) {
        onToggleLeftSidebar();
      }
      // Then trigger a custom event to change the active tab to export
      const event = new CustomEvent('changeActiveTab', { detail: { tab: 'export' } });
      window.dispatchEvent(event);
    }
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Handle mouse/touch events for panning (only on chart)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow chart dragging when pan mode is active
    if (!panMode) {
      return
    }
    
    const target = e.target as HTMLElement
    
    // When pan mode is active, allow dragging from anywhere including canvas
    setIsDragging(true)
    // Store the initial mouse position and current pan offset
    setDragStart({ 
      x: e.clientX - panOffset.x, 
      y: e.clientY - panOffset.y 
    })
    e.preventDefault() // Prevent text selection while dragging
    e.stopPropagation() // Prevent event bubbling
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      // Calculate new pan offset based on mouse movement
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
      e.preventDefault()
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle mouse move globally when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        setPanOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        })
      }

      const handleGlobalMouseUp = () => {
        setIsDragging(false)
      }

      window.addEventListener('mousemove', handleGlobalMouseMove)
      window.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove)
        window.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, dragStart])

  // Center the view when zoom resets or component mounts
  useEffect(() => {
    if (chartContainerRef.current && zoom === 1 && panOffset.x === 0 && panOffset.y === 0) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        if (chartContainerRef.current) {
          const container = chartContainerRef.current
          const scrollLeft = (container.scrollWidth - container.clientWidth) / 2
          const scrollTop = (container.scrollHeight - container.clientHeight) / 2
          container.scrollLeft = scrollLeft
          container.scrollTop = scrollTop
        }
      }, 100)
    }
  }, [zoom, panOffset.x, panOffset.y])

  const getChartIcon = (chartName:string)=>{
    switch(chartName){
      case 'Bar':
        return <ChartColumnBig className="h-4 w-4 mr-1" />
      case 'Line':
        return <ChartLine className="h-4 w-4 mr-1" />
      case 'Horizontal Bar':
        return <ChartBarBig className="h-4 w-4 mr-1" />
      case 'Stacked Bar':
        return <ChartColumnStacked className="h-4 w-4 mr-1" />
      case 'Pie':
      case 'Doughnut':
        return <ChartPie className="h-4 w-4 mr-1" />
      case 'Doughnut':
        return <ChartPie className="h-4 w-4 mr-1" />
      case 'Polar Area':
      case 'Radar':
        return <Radar className="h-4 w-4 mr-1" />
      case 'Scatter':
      case 'Bubble':
        return <ChartScatter className="h-4 w-4 mr-1" />
      case 'Area':
        return <ChartArea className="h-4 w-4 mr-1" />
      default:
        return <ChartColumnBig className="h-4 w-4 mr-1" />
    }
  }



  // If template mode is active, render template view
  if (shouldShowTemplate()) {
    return (
      <TemplateChartPreview
        onToggleSidebar={onToggleSidebar}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleLeftSidebar={onToggleLeftSidebar}
        isLeftSidebarCollapsed={isLeftSidebarCollapsed}
        activeTab={activeTab}
        onTabChange={onTabChange}
        onNewChart={onNewChart}
      />
    )
  }

  return (
    <div className={`flex min-w-full flex-col overflow-hidden${isMobile ? '' : ' h-full'}`} ref={fullscreenContainerRef}>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-white z-40" />
      )}
      {/* Header */}
      <div className={`${isMobile ? '' : 'mb-4'} flex-shrink-0`}>
        <div className={`flex${isMobile ? ' mb-2 flex-col' : ' items-center justify-between flex-wrap'} gap-2 px-2`}> {/* Responsive: column on mobile, row on desktop */}
          {/* Chart title and info row: inline on mobile, stacked on desktop */}
          {isMobile ? (
            <div className="min-w-0 flex-1 flex flex-row items-center xs576:justify-between gap-x-2">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900 truncate xs400:text-base"><span className="xs400:hidden">Chart</span> Preview</h1>
                <div 
                  className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 border border-gray-200"
                  style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                >
                  <button
                    onClick={() => setEditorMode('chart')}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${
                      editorMode === 'chart' 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setEditorMode('template')}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${
                      editorMode === 'template' 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
                  >
                    Template
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 min-w-0 flex-nowrap overflow-x-auto">
                <ChartColumnBig  className="h-4 w-4 mr-1" />
                <span className="truncate max-w-[80px]">{getChartDisplayName()}</span>
                <Dot className="h-4 w-4 mx-1 xs400:hidden"/>
                <span>{chartData.datasets.length} Dataset(s)</span>
                <Dot className="h-4 w-4 mx-1 xs400:hidden" />
                <span className="font-medium">{chartData.labels?.length || 0} Points</span>
              </div>
            </div>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg lap1280:text-base font-bold text-gray-900 truncate">Chart Preview</h1>
                <div 
                  className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 border border-gray-200"
                  style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                >
                  <button
                    onClick={() => setEditorMode('chart')}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${
                      editorMode === 'chart' 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
                  >
                    Chart
                  </button>
                  <button
                    onClick={() => setEditorMode('template')}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${
                      editorMode === 'template' 
                        ? 'bg-blue-500 text-white shadow-sm' 
                        : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                    style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
                  >
                    Template
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap min-w-0">
                <span className="flex flex-row">
                  {getChartIcon(getChartDisplayName())}
                  {/* <ChartColumnBig className="h-4 w-4 mr-1" /> */}
                  <span className="truncate max-w-[80px]">{getChartDisplayName()}</span>
                </span>
                <Dot className="h-4 w-4 mx-1 lap1280:hidden" />
                <span className="">{chartData.datasets.length} Dataset(s)</span>
                <Dot className="h-4 w-4 mx-1 lap1280:hidden" />
                <span className="font-medium">{chartData.labels?.length || 0} Points</span>
              </div>
            </div>
          )}
          {/* Action buttons: horizontally scrollable on mobile if needed */}
          <div className={`flex gap-2 flex-shrink-0 ml-4${isMobile ? ' justify-evenly ml-0 overflow-x-auto max-w-full pb-1' : ''}`} style={isMobile ? { WebkitOverflowScrolling: 'touch' } : {}}>
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-md p-0.5 bg-white">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
                className="h-7 w-7 p-0"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-gray-600 min-w-[45px] text-center px-1">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="h-7 w-7 p-0"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Pan Mode Toggle */}
            <Button
              variant={panMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPanMode(!panMode)}
              title={panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
            >
              <Hand className="h-4 w-4" />
            </Button>
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title="Actions">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  <span>Refresh Chart</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleResetZoom}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span>Reset Zoom</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleFullscreen}>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  <span>Fullscreen</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  clearMessages();
                  resetChart();
                  setHasJSON(false);
                }}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span>Reset Chart</span>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="default" title="Export">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <FileImage className="h-4 w-4 mr-2" /> PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJPEG}>
                  <ImageIcon className="h-4 w-4 mr-2" /> JPEG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportHTML}>
                  <FileCode className="h-4 w-4 mr-2" /> HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportCSV}>
                  <FileText className="h-4 w-4 mr-2" /> CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportSettings} className="bg-blue-50 hover:bg-blue-100">
                  <Settings className="h-4 w-4 mr-2" /> Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Undo/Redo Buttons */}
            <UndoRedoButtons variant="default" size="sm" showLabels={false} />
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <Card className={`${isMobile ? 'w-full min-h-[300px]' : 'w-full flex-1 min-h-[300px]'} rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden transition-all duration-200${isFullscreen ? ' fixed inset-4 z-50 m-0 rounded-lg' : ''}`}>
        <CardContent className={`${isMobile ? 'p-0' : 'p-0'} h-full w-full`}>
          {/* Scrollable Canvas Container */}
          <div
            ref={chartContainerRef}
            className="relative w-full h-full overflow-auto bg-gray-50"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              minHeight: '100%',
              height: '100%'
            }}
          >
            {/* Canvas Background - Similar to template mode */}
            {/* Calculate canvas dimensions - larger than chart to show outer space */}
            {(() => {
              const isResponsive = (chartConfig as any)?.responsive !== false;
              const parseDimension = (value: any): number => {
                if (typeof value === 'number') return isNaN(value) ? 800 : value;
                if (typeof value === 'string') {
                  const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
                  return isNaN(numericValue) ? 800 : numericValue;
                }
                return 800;
              };
              
              const chartWidth = !isResponsive ? parseDimension((chartConfig as any)?.width) : 800;
              const chartHeight = !isResponsive ? parseDimension((chartConfig as any)?.height) : 600;
              
              // When responsive, chart fills the entire scrollable container
              if (isResponsive) {
                return (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: 'transparent',
                      width: '100%',
                      height: '100%',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0
                    }}
                  >
                    {/* Background layer for dragging - behind the chart (only active in pan mode) */}
                    {panMode && (
                      <div
                        className="absolute inset-0"
                        style={{
                          cursor: isDragging ? 'grabbing' : 'grab',
                          zIndex: 1
                        }}
                        onMouseDown={handleMouseDown}
                      />
                    )}
                    
                    {/* Chart Area - Fills full container in responsive mode */}
                    <div
                      className="absolute inset-0"
                      style={{
                        width: '100%',
                        height: '100%',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        transform: zoom !== 1 ? `scale(${zoom})` : 'none',
                        transformOrigin: 'center center',
                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                        zIndex: 10,
                        cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
                        pointerEvents: panMode ? 'auto' : 'auto'
                      }}
                      onMouseDown={panMode ? handleMouseDown : undefined}
                    >
                      <div 
                        className="absolute inset-0"
                        style={{
                          width: '100%',
                          height: '100%',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          pointerEvents: panMode ? 'none' : 'auto',
                          userSelect: panMode ? 'none' : 'auto',
                          WebkitUserSelect: panMode ? 'none' : 'auto'
                        }}
                        onMouseDown={(e) => {
                          if (panMode) {
                            handleMouseDown(e as any)
                            e.preventDefault()
                            e.stopPropagation()
                          } else {
                            e.stopPropagation()
                          }
                        }}
                        onDragStart={(e) => {
                          if (panMode) {
                            e.preventDefault()
                          }
                        }}
                      >
                        <div 
                          className="absolute inset-0"
                          style={{ 
                            width: '100%',
                            height: '100%',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: panMode ? 'none' : 'auto' 
                          }}
                        >
                          <ChartGenerator />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
              
              // Non-responsive mode: fixed dimensions with canvas padding
              const canvasPadding = 200;
              const canvasWidth = chartWidth + canvasPadding;
              const canvasHeight = chartHeight + canvasPadding;
              
              // Calculate canvas size - needs to be large enough for zoomed chart + padding
              const scaledChartWidth = chartWidth * zoom;
              const scaledChartHeight = chartHeight * zoom;
              const effectiveCanvasWidth = Math.max(canvasWidth, scaledChartWidth + canvasPadding);
              const effectiveCanvasHeight = Math.max(canvasHeight, scaledChartHeight + canvasPadding);
              
              // Calculate initial centered position within the canvas
              const initialLeft = effectiveCanvasWidth / 2 - scaledChartWidth / 2;
              const initialTop = effectiveCanvasHeight / 2 - scaledChartHeight / 2;
              
              return (
                <div
                  className="relative"
                  style={{
                    width: `${effectiveCanvasWidth}px`,
                    height: `${effectiveCanvasHeight}px`,
                    margin: '0 auto',
                    backgroundColor: 'transparent'
                  }}
                >
                  {/* Background layer for dragging - behind the chart (only active in pan mode) */}
                  {panMode && (
                    <div
                      className="absolute inset-0"
                      style={{
                        cursor: isDragging ? 'grabbing' : 'grab',
                        zIndex: 1
                      }}
                      onMouseDown={handleMouseDown}
                    />
                  )}
                  
                  {/* Chart Area - Positioned */}
                  <div
                    className="absolute"
                    style={{
                      left: `${initialLeft + panOffset.x}px`,
                      top: `${initialTop + panOffset.y}px`,
                      width: `${chartWidth}px`,
                      height: `${chartHeight}px`,
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                      transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                      zIndex: 10,
                      cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
                      pointerEvents: panMode ? 'auto' : 'auto'
                    }}
                    onMouseDown={panMode ? handleMouseDown : undefined}
                  >
                    <div 
                      className="w-full h-full"
                      style={{
                        pointerEvents: panMode ? 'none' : 'auto',
                        userSelect: panMode ? 'none' : 'auto',
                        WebkitUserSelect: panMode ? 'none' : 'auto'
                      }}
                      onMouseDown={(e) => {
                        if (panMode) {
                          handleMouseDown(e as any)
                          e.preventDefault()
                          e.stopPropagation()
                        } else {
                          e.stopPropagation()
                        }
                      }}
                      onDragStart={(e) => {
                        if (panMode) {
                          e.preventDefault()
                        }
                      }}
                    >
                      <div style={{ pointerEvents: panMode ? 'none' : 'auto' }}>
                        <ChartGenerator />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>
      
      {/* Fullscreen Toolbar */}
      {isFullscreen && (
        <>
          {/* Top Left Button - Open Left Sidebar */}
          {activeTab && onTabChange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowLeftOverlay(true)}
              className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-300/50 hover:bg-white hover:shadow-2xl hover:border-gray-400/60 transition-all duration-200 h-11 w-11"
              title="Open Options"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </Button>
          )}

          {/* Top Right Toolbar */}
          <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2 border border-gray-200 animate-in fade-in duration-200">
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border rounded-md p-0.5 bg-white mr-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
                className="h-7 w-7 p-0"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-gray-600 min-w-[45px] text-center px-1">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleZoomIn}
                disabled={zoom >= 3}
                className="h-7 w-7 p-0"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Pan Mode Toggle */}
            <Button
              variant={panMode ? "default" : "ghost"}
              size="icon"
              onClick={() => setPanMode(!panMode)}
              title={panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
              className="h-8 w-8"
            >
              <Hand className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleExport}
              title="Download"
              className="hover:bg-gray-100 h-8 w-8"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleFullscreen}
              title="Exit fullscreen"
              className="hover:bg-gray-100 h-8 w-8"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => document.exitFullscreen()}
              title="Close"
              className="hover:bg-gray-100 text-red-500 hover:bg-red-50 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Left Sidebar Overlay */}
          {showLeftOverlay && activeTab && onTabChange && (
            <SidebarPortalProvider>
              <SidebarContainer containerRef={leftSidebarPanelRef}>
                <div className="fixed inset-0 z-[60] flex">
                  {/* Sidebar Panel */}
                  <div ref={leftSidebarPanelRef} className="w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900">Options</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowLeftOverlay(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <Sidebar
                    activeTab={fullscreenActiveTab}
                    onTabChange={(tab) => {
                      setFullscreenActiveTab(tab);
                      if (onTabChange) onTabChange(tab);
                      setShowRightOverlay(true); // Auto-open right panel when tab is selected
                    }}
                    onToggleLeftSidebar={() => setShowLeftOverlay(false)}
                    isLeftSidebarCollapsed={false}
                  />
                </div>
              </div>
              {/* Backdrop */}
              <div 
                className="flex-1 bg-black/20 backdrop-blur-sm"
                onClick={() => setShowLeftOverlay(false)}
              />
            </div>
              </SidebarContainer>
            </SidebarPortalProvider>
          )}

          {/* Right Tools Panel Overlay */}
          {showRightOverlay && activeTab && onTabChange && (
            <SidebarPortalProvider>
              <SidebarContainer containerRef={rightSidebarPanelRef}>
                <div className="fixed inset-0 z-[70] flex">
                  {/* Tools Panel - Positioned on left, stacked on top of options sidebar */}
                  <div ref={rightSidebarPanelRef} className="w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900">Tools</h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowRightOverlay(false)}
                      className="h-8 w-8"
                      title="Close Tools"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setShowRightOverlay(false);
                        setShowLeftOverlay(false);
                      }}
                      className="h-8 w-8"
                      title="Close All"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  <ConfigPanel
                    activeTab={fullscreenActiveTab}
                    onTabChange={(tab) => {
                      setFullscreenActiveTab(tab);
                      if (onTabChange) onTabChange(tab);
                    }}
                    onNewChart={onNewChart}
                  />
                </div>
              </div>
              {/* Backdrop */}
              <div 
                className="flex-1 bg-black/20 backdrop-blur-sm"
                onClick={() => setShowRightOverlay(false)}
              />
            </div>
              </SidebarContainer>
            </SidebarPortalProvider>
          )}
        </>
      )}
    </div>
  )
}