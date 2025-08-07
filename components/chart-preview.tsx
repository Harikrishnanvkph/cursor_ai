"use client"

import { useRef, useEffect, useState } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw, Maximize2, Minimize2, RotateCcw, X, PanelLeft, PanelRight,
   FileCode, FileDown, FileImage, FileText, FileType2, ImageIcon, Settings } from "lucide-react"
import { BarChart3,ChartColumnStacked,ChartColumnBig,ChartBarBig,ChartLine,ChartPie,ChartScatter,ChartArea,Radar, Database, Dot } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { downloadChartAsHTML } from "@/lib/html-exporter"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useTemplateStore } from "@/lib/template-store"
import { TemplateChartPreview } from "@/components/template-chart-preview"
import ChartGenerator from "@/lib/chart_generator"

export function ChartPreview({ onToggleSidebar, isSidebarCollapsed, onToggleLeftSidebar, isLeftSidebarCollapsed, isTablet = false }: {
  onToggleSidebar?: () => void,
  isSidebarCollapsed?: boolean,
  onToggleLeftSidebar?: () => void,
  isLeftSidebarCollapsed?: boolean,
  isTablet?: boolean
}) {
  const { chartConfig, chartData, chartType, resetChart, setHasJSON, globalChartRef, showLabels } = useChartStore()
  const { shouldShowTemplate, editorMode, templateInBackground } = useTemplateStore()

  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { clearMessages } = useChatStore();


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
        width: 800,
        height: 600,
        backgroundColor: getBackgroundConfig().color || "#ffffff",
        includeResponsive: true,
        includeAnimations: true,
        includeTooltips: true,
        includeLegend: true,
        fileName: `chart-${chartType}-${new Date().toISOString().slice(0, 10)}.html`,
        dragState: currentDragState // Pass the captured drag state
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
      setIsFullscreen(!!document.fullscreenElement);
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
  const handleExportSVG = () => {
    // Chart.js does not natively support SVG export; you may need a plugin or custom logic
    alert('SVG export is not implemented yet.');
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
                {templateInBackground && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    Chart Mode
                  </span>
                )}
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
                {templateInBackground && (
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                    Chart Mode
                  </span>
                )}
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
            {/* Only render sidebar toggle container if it contains actual toggles (desktop only) */}
            {!isMobile && (
              <div className="flex border lap1280:hidden border-gray-200 rounded-lg overflow-hidden bg-white">
                {onToggleLeftSidebar && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={onToggleLeftSidebar}
                    title={isLeftSidebarCollapsed ? "Expand Left Sidebar" : "Collapse Left Sidebar"}
                    className="rounded-none"
                  >
                    <PanelLeft className={`h-5 w-5 transition-colors ${isLeftSidebarCollapsed ? 'text-slate-300' : 'text-black'}`} />
                  </Button>
                )}
                <div className="w-px bg-gray-200 my-2" />
                {onToggleSidebar && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={onToggleSidebar}
                    title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    className="rounded-none"
                  >
                    <PanelRight className={`h-5 w-5 transition-colors ${isSidebarCollapsed ? 'text-slate-300' : 'text-black'}`} />
                  </Button>
                )}
              </div>
            )}
            <Button className="lap1280:hidden" variant="outline" size="sm" onClick={handleRefresh} title="Refresh Chart">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen} title="Fullscreen">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              clearMessages();
              resetChart();
              setHasJSON(false);
            }} title="Reset Chart" className="flex items-center gap-1">
              <RotateCcw className="h-4 w-4" />
              <span>Reset</span>
            </Button>
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="default" title="Export">
                  <FileDown className="h-4 w-4 mr-1 xs400:mr-0" /> <span className="">Export</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <FileImage className="h-4 w-4 mr-2" /> PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJPEG}>
                  <ImageIcon className="h-4 w-4 mr-2" /> JPEG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportSVG}>
                  <FileType2 className="h-4 w-4 mr-2" /> SVG
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
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <Card className={`${isMobile ? 'w-full min-h-[300px]' : 'w-full flex-1 min-h-[300px]'} rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden transition-all duration-200${isFullscreen ? ' fixed inset-4 z-50 m-0 rounded-lg' : ''}`}>
        <CardContent className={`${isMobile ? 'p-0' : 'p-0'} h-full w-full`}>
          <ChartGenerator />
        </CardContent>
      </Card>
      
      {/* Fullscreen Toolbar */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-2 flex gap-2 border border-gray-200 animate-in fade-in duration-200">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleExport}
            title="Download"
            className="hover:bg-gray-100"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleFullscreen}
            title="Exit fullscreen"
            className="hover:bg-gray-100"
          >
            <Minimize2 className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => document.exitFullscreen()}
            title="Close"
            className="hover:bg-gray-100 text-red-500 hover:bg-red-50"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  )
}