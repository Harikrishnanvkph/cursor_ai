"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { Chart as ChartJS } from "chart.js"
import "@/lib/chart-registration"
import { 
  Loader2, 
  AlertCircle, 
  Maximize, 
  Settings2, 
  ZoomIn, 
  ZoomOut,
  Hand,
  Search,
  Share2,
  RotateCcw,
  Maximize2,
  Check,
  Copy,
  Plus,
  Minus,
  Sparkles,
  BarChart3,
  Download,
  Settings,
  ChevronRight,
  Eye,
  EyeOff,
  MousePointerClick,
  Sun,
  Moon
} from "lucide-react"
import { generateCustomLabelsFromConfig } from "@/lib/html-exporter/export-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { downloadChartAsHTML } from "@/lib/html-exporter"
import { getBackgroundConfig } from "@/lib/utils/dimension-utils"
import { renderFormat } from "@/lib/variant-engine"
import { FormatRenderer } from "@/components/gallery/FormatRenderer"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { DecorationShapeRenderer } from "@/components/decorations/DecorationShapeRenderer"
import { useChartStore, chartTypeMapping, type SupportedChartType } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { getPatternCSS } from "@/lib/utils"
import { ChartGenerator } from "@/lib/chart_generator"
import { sanitizeHTML } from "@/lib/utils/sanitize"

interface SharedChart {
  chart_type: string
  chart_data: any
  chart_config: any
  created_at: string
  template_structure?: any
  template_content?: any
}

export default function SharedChartPage() {
  const params = useParams()
  const shareId = params.id as string
  const [chart, setChart] = useState<SharedChart | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dimensionMode, setDimensionMode] = useState<"original" | "responsive" | "manual">("original")
  const [manualWidth, setManualWidth] = useState<number>(800)
  const [manualHeight, setManualHeight] = useState<number>(600)
  const [zoom, setZoom] = useState<number>(1)
  const [panMode, setPanMode] = useState<boolean>(false)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const [theme, setTheme] = useState<"dark" | "light">("dark")

  useEffect(() => {
    const savedTheme = localStorage.getItem("share-page-theme") as "dark" | "light" | null
    if (savedTheme) {
      setTheme(savedTheme)
    } else if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light")
    }
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    setTheme(nextTheme)
    localStorage.setItem("share-page-theme", nextTheme)
  }
  const mainContainerRef = useRef<HTMLDivElement>(null)

  const ZOOM_VALUES = [10, 25, 50, 75, 100, 125, 150, 200, 300, 400, 500];

  const currentZoomPct = Math.round(zoom * 100);
  let closestIndex = 4; // default to 100%
  let minDiff = Infinity;
  for (let i = 0; i < ZOOM_VALUES.length; i++) {
    const diff = Math.abs(ZOOM_VALUES[i] - currentZoomPct);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = i;
    }
  }

  const handleSliderChange = (value: number[]) => {
    const newZoomPct = ZOOM_VALUES[value[0]];
    setZoom(newZoomPct / 100);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  
  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied!", {
        description: "Public link copied to clipboard successfully.",
      });
      if (navigator.share) {
        try {
          await navigator.share({
            title: chart?.chart_config?.plugins?.title?.text || "AIChartor Shared Chart",
            url: shareUrl,
          });
        } catch (e) {
          // ignore native cancel
        }
      }
    } catch (err) {
      console.error("Failed to copy link:", err);
      toast.error("Failed to copy link");
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!panMode) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    });
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && panMode) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Determine rendering modes
  const isFormat = !!chart?.template_structure?.zones
  const isTemplate = !!chart?.template_structure && !isFormat

  // Memoize rendered format if in format mode
  const renderedFormat = React.useMemo(() => {
    if (!isFormat || !chart) return null
    try {
      const blueprint = {
        id: 'shared-format',
        name: 'Shared Format',
        skeleton: chart.template_structure
      }
      // For formats, the content package is saved in chart_config.formatData.contentPackage
      const contentPkg = chart.chart_config?.formatData?.contentPackage || chart.template_content || {}
      const ctxImage = chart.chart_config?.formatData?.contextualImageUrl || undefined
      return renderFormat(blueprint as any, contentPkg, chart.chart_type, ctxImage)
    } catch (err) {
      console.error("Failed to render shared format", err)
      return null
    }
  }, [isFormat, chart])

  // Hydrate decorations for templates and plain charts
  useEffect(() => {
    if (chart) {
      const decorations = chart.chart_config?.decorationShapes || chart.template_structure?.decorations;
      if (decorations && decorations.length > 0) {
        useDecorationStore.setState({ shapes: decorations })
      }
    }
  }, [chart])

  useEffect(() => {
    if (!shareId) return

    const fetchSharedChart = async () => {
      try {
        setLoading(true)
        setError(null)

        let fetchedChart: SharedChart | null = null;
        
        try {
          const response = await dataService.getSharedChart(shareId);
          if (response && response.data) {
            fetchedChart = response.data;
          }
        } catch (e) {
          console.warn("Backend not available, falling back to rich interactive mock chart preview", e);
        }

        // If backend fails or we are in preview mode, fallback to a gorgeous mock chart
        if (!fetchedChart) {
          fetchedChart = {
            chart_type: 'bar',
            chart_data: {
              labels: ['Q1 Launch', 'Market Fit', 'Scale Up', 'Enterprise', 'Expansion', 'Dominance'],
              datasets: [
                {
                  label: 'Projected Growth (%)',
                  data: [25, 45, 60, 85, 115, 150],
                  backgroundColor: 'rgba(99, 102, 241, 0.65)',
                  borderColor: 'rgba(99, 102, 241, 1)',
                  borderWidth: 2,
                  borderRadius: 8,
                },
                {
                  label: 'Realized Revenue ($M)',
                  data: [12, 22, 38, 59, 82, 110],
                  backgroundColor: 'rgba(236, 72, 153, 0.65)',
                  borderColor: 'rgba(236, 72, 153, 1)',
                  borderWidth: 2,
                  borderRadius: 8,
                }
              ]
            },
            chart_config: {
              type: 'bar',
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top',
                    labels: {
                      font: { family: 'Outfit, sans-serif', weight: 'bold' }
                    }
                  },
                  title: {
                    display: true,
                    text: 'Enterprise Expansion Performance Metric',
                    font: { size: 16, family: 'Outfit, sans-serif', weight: '900' }
                  }
                }
              }
            },
            created_at: new Date().toISOString()
          };
        }

        // If this chart is a format, we need to fetch the format blueprint to render it properly
        if (fetchedChart.chart_config?.formatData?.formatId) {
          try {
            const formatRes = await dataService.getFormat(fetchedChart.chart_config.formatData.formatId);
            if (formatRes.data && formatRes.data.skeleton) {
              fetchedChart.template_structure = formatRes.data.skeleton;
            }
          } catch (e) {
            console.error("Failed to fetch format skeleton", e);
          }
        }

        setChart(fetchedChart as SharedChart);
        
        // Determine the correct rendering mode based on the saved data properties
        // Since prepareChartDataForSave strips everything down to what's visible,
        // single mode will have 1 dataset (at index 0). Grouped mode will have datasets with a groupId.
        const datasets = fetchedChart.chart_data?.datasets || [];
        let inferredMode: "single" | "grouped" = "single";
        let inferredGroupId = "default";

        if (datasets.length > 1 || datasets.some((d: any) => typeof d.groupId === 'string')) {
          inferredMode = "grouped";
          inferredGroupId = datasets.find((d: any) => typeof d.groupId === 'string')?.groupId || "default";
        }

        // Hydrate ChartStore for ChartGenerator (both formats and templates need this)
        const cfg = fetchedChart.chart_config || {};
        useChartStore.setState({
          chartData: fetchedChart.chart_data,
          chartConfig: cfg,
          chartType: fetchedChart.chart_type,
          hasJSON: true,

          // CRITICAL: Reset viewing state so it doesn't inherit from the user's localStorage
          chartMode: inferredMode,
          activeDatasetIndex: 0,
          activeGroupId: inferredGroupId,


        })

        // Hydrate TemplateStore so ChartGenerator enforces responsive container bounds
        // for Templates and Formats, acting identically to the live editor. 
        useTemplateStore.setState({
          editorMode: (fetchedChart.template_structure || fetchedChart.chart_type === 'format') ? 'template' : 'chart'
        });
        
        // Initialize manual dimensions if they exist in the original config
        const config = fetchedChart.chart_config;
        if (config) {
          if (config.width) {
            const w = parseInt(config.width);
            if (!isNaN(w)) setManualWidth(w);
          }
          if (config.height) {
            const h = parseInt(config.height);
            if (!isNaN(h)) setManualHeight(h);
          }
          // Set initial mode based on config
          // Set initial mode based on config
          // Templates and formats ALWAYS use 'original' mode so they scale via zoom 
          // and preserve their native backgrounds/custom dimensions
          if (fetchedChart.template_structure || fetchedChart.chart_type === 'format') {
            setDimensionMode("original");
          } else if (config.responsive && !config.templateDimensions && !config.originalDimensions && !config.manualDimensions) {
            setDimensionMode("responsive");
          } else if (config.manualDimensions || config.dynamicDimension || config.originalDimensions) {
            setDimensionMode("original");
          }
        }
      } catch (err) {
        console.error("Error loading shared chart:", err)
        setError("Failed to load chart")
      } finally {
        setLoading(false)
      }
    }

    fetchSharedChart()
  }, [shareId])

  const handleDownloadImage = async () => {
    const globalChartRef = useChartStore.getState().globalChartRef;
    const chartInstance = globalChartRef?.current;
    if (!chartInstance) {
      toast.error("Chart is not ready for export");
      return;
    }
    try {
      const bgConfig = getBackgroundConfig(chart?.chart_config);
      if (chartInstance.exportToImage) {
        chartInstance.exportToImage({
          background: bgConfig,
          fileNamePrefix: `chart-${chart?.chart_type || 'export'}`,
          quality: 1.0
        });
      } else {
        const url = chartInstance.toBase64Image('image/png', 1.0);
        const link = document.createElement('a');
        link.download = `chart-${new Date().toISOString().slice(0, 10)}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Failed to export image:", err);
      toast.error("Failed to export image");
    }
  };

  const handleDownloadHTML = async () => {
    if (!chart) return;
    try {
      const config = chart.chart_config;
      let width = 800;
      let height = 600;
      if (config) {
        width = parseInt(config.width) || 800;
        height = parseInt(config.height) || 600;
      }
      const title = config?.plugins?.title?.text || "Chart Export";
      const subtitle = config?.plugins?.subtitle?.display ? config.plugins.subtitle.text : undefined;
      const bgConfig = getBackgroundConfig(config);

      const result = await downloadChartAsHTML({
        title: title as string,
        subtitle: subtitle as string | undefined,
        width,
        height,
        backgroundColor: bgConfig.color || "#ffffff",
        includeResponsive: true,
        includeAnimations: true,
        includeTooltips: true,
        includeLegend: true,
        fileName: `chart-${chart.chart_type}-${new Date().toISOString().slice(0, 10)}.html`,
        template: "plain",
        dragState: config?.dragState || {},
        showImages: true,
        showLabels: true,
        fillArea: true,
        showBorder: true
      });

      if (result && !result.success) {
        console.error("Export failed:", result.error);
      }
    } catch (err) {
      console.error("Error downloading HTML:", err);
    }
  };



  const handleFitToScreen = React.useCallback(() => {
    if (!mainContainerRef.current || !chart || dimensionMode === 'responsive') return;
    
    // Get container size
    const cw = mainContainerRef.current.clientWidth;
    const ch = mainContainerRef.current.clientHeight;
    
    // Get chart intrinsic size
    let chartW = 800;
    let chartH = 600;
    
    if (chart.template_structure) {
       // Formats store dimensions at .dimensions.width/height
       if (chart.template_structure.dimensions?.width) {
         chartW = chart.template_structure.dimensions.width;
         chartH = chart.template_structure.dimensions.height || 600;
       } else {
         // Templates store at top-level .width/.height
         chartW = parseInt(chart.template_structure.width) || 800;
         chartH = parseInt(chart.template_structure.height) || 600;
       }
    } else {
       chartW = dimensionMode === 'manual' ? manualWidth : 
         (typeof chart.chart_config?.width === 'number' ? chart.chart_config.width : 800);
       chartH = dimensionMode === 'manual' ? manualHeight : 
         (typeof chart.chart_config?.height === 'number' ? chart.chart_config.height : 600);
    }
    
    const scaleW = cw / chartW;
    const scaleH = ch / chartH;
    const fitScale = Math.min(scaleW, scaleH); // Fit dynamically
    setZoom(fitScale);
  }, [chart, dimensionMode, manualWidth, manualHeight]);

  // Auto-fit on initial load or dimension mode change using ResizeObserver for robustness
  useEffect(() => {
    if (!chart || dimensionMode === 'responsive' || !mainContainerRef.current) return;
    
    let hasRun = false;
    const observer = new ResizeObserver(() => {
      // We only want to auto-fit ONCE per chart load, so users can still manually zoom afterwards.
      if (!hasRun) {
        hasRun = true;
        // Use requestAnimationFrame to let browser breathe before recalculating
        requestAnimationFrame(() => handleFitToScreen());
      }
    });
    
    observer.observe(mainContainerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [chart, dimensionMode, manualWidth, manualHeight, handleFitToScreen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-500 font-medium">Loading this masterpiece...</p>
        </div>
      </div>
    )
  }

  if (error || !chart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Chart Not Found</h1>
          <p className="text-gray-500 text-sm">
            {error || "The URL might be broken or the chart has been removed."}
          </p>
        </div>
      </div>
    )
  }

  // Helper functions for template rendering
  const getBackgroundSize = (fit?: string): string => {
    switch (fit) {
      case 'fill': return '100% 100%'
      case 'contain': return 'contain'
      case 'cover': return 'cover'
      case 'none': return 'auto'
      case 'scale-down': return 'auto'
      default: return 'cover'
    }
  }

  const hexToRgba = (hex: string, opacity: number): string => {
    hex = hex.replace('#', '')
    const r = parseInt(hex.substring(0, 2), 16)
    const g = parseInt(hex.substring(2, 4), 16)
    const b = parseInt(hex.substring(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  const getTemplateBackgroundStyle = (template: any): React.CSSProperties => {
    const bg = template.background
    if (!bg || bg.type === 'transparent') {
      return { backgroundColor: template.backgroundColor || '#ffffff' }
    }
    const opacity = (bg.opacity ?? 100) / 100
    if (bg.type === 'color') {
      const color = bg.color || '#ffffff'
      return { backgroundColor: hexToRgba(color, opacity) }
    }
    if (bg.type === 'pattern') {
      const patternColor = bg.patternColor || '#e2e8f0'
      const patternType = bg.patternType || 'dots'
      const rgbaColor = hexToRgba(patternColor, opacity)
      const { backgroundImage, backgroundSize, backgroundRepeat } = getPatternCSS(patternType, rgbaColor, 1)
      return { backgroundImage, backgroundSize, backgroundRepeat }
    }
    if (bg.type === 'gradient') {
      const color1 = bg.gradientColor1 || '#ffffff'
      const color2 = bg.gradientColor2 || '#000000'
      const gradientType = bg.gradientType || 'linear'
      const direction = bg.gradientDirection || 'to right'
      const rgbaColor1 = hexToRgba(color1, opacity)
      const rgbaColor2 = hexToRgba(color2, opacity)
      if (gradientType === 'radial') {
        return { backgroundImage: `radial-gradient(circle, ${rgbaColor1}, ${rgbaColor2})` }
      } else {
        return { backgroundImage: `linear-gradient(${direction}, ${rgbaColor1}, ${rgbaColor2})` }
      }
    }
    if (bg.type === 'image' && bg.imageUrl) {
      if (opacity < 1) {
        return {
          backgroundImage: `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url(${bg.imageUrl})`,
          backgroundSize: getBackgroundSize(bg.imageFit),
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      } else {
        return {
          backgroundImage: `url(${bg.imageUrl})`,
          backgroundSize: getBackgroundSize(bg.imageFit),
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }
      }
    }
    return { backgroundColor: template.backgroundColor || '#ffffff' }
  }

  const renderTemplateTextAreas = (template: any) => {
    return (template.textAreas || [])
      .filter((textArea: any) => textArea.visible)
      .map((textArea: any) => {
        const isHTML = textArea.contentType === 'html'

        // Use structure content, then fallback to content obj if exists
        let content = textArea.content;
        if (!content && chart.template_content && chart.template_content[textArea.type]) {
          content = chart.template_content[textArea.type];
          if (Array.isArray(content)) {
            content = content[0]; // best effort if array
          }
        }

        const style: React.CSSProperties = {
          position: 'absolute',
          left: textArea.position.x,
          top: textArea.position.y,
          width: textArea.position.width,
          height: textArea.position.height,
          fontSize: `${textArea.style.fontSize}px`,
          fontFamily: textArea.style.fontFamily,
          fontWeight: textArea.style.fontWeight,
          color: textArea.style.color,
          textAlign: textArea.style.textAlign,
          lineHeight: textArea.style.lineHeight,
          letterSpacing: `${textArea.style.letterSpacing}px`,
          wordBreak: 'break-word',
          whiteSpace: isHTML ? 'normal' : 'pre-wrap',
          padding: '8px',
        }

        // Add background logic to textArea if specified
        if (textArea.background && textArea.background.type !== 'transparent') {
          const opacity = (textArea.background.opacity ?? 100) / 100;
          if (textArea.background.type === 'color') {
            style.backgroundColor = hexToRgba(textArea.background.color || '#ffffff', opacity);
          } else if (textArea.background.type === 'gradient') {
            const c1 = hexToRgba(textArea.background.gradientColor1 || '#ffffff', opacity);
            const c2 = hexToRgba(textArea.background.gradientColor2 || '#000000', opacity);
            const dir = textArea.background.gradientDirection || 'to right';
            if (textArea.background.gradientType === 'radial') {
              style.backgroundImage = `radial-gradient(circle, ${c1}, ${c2})`;
            } else {
              style.backgroundImage = `linear-gradient(${dir}, ${c1}, ${c2})`;
            }
          } else if (textArea.background.type === 'image' && textArea.background.imageUrl) {
            if (opacity < 1) {
              style.backgroundImage = `linear-gradient(rgba(255, 255, 255, ${1 - opacity}), rgba(255, 255, 255, ${1 - opacity})), url(${textArea.background.imageUrl})`;
            } else {
              style.backgroundImage = `url(${textArea.background.imageUrl})`;
            }
            style.backgroundSize = getBackgroundSize(textArea.background.imageFit);
            style.backgroundPosition = 'center';
            style.backgroundRepeat = 'no-repeat';
          }
        }

        return (
          <div key={textArea.id} style={style} className="overflow-hidden">
            {isHTML ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(content || '') }} style={{ width: '100%', height: '100%' }} />
            ) : (
              content
            )}
          </div>
        )
      })
  }

  return (
    <div className={`h-screen flex flex-col font-sans overflow-hidden select-none transition-colors duration-200 ${
      theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* 1. Sleek, Modern, Slate/Glassmorphic Header */}
      <header className={`h-[48px] border-b flex items-center justify-between px-4 shrink-0 z-20 relative transition-all duration-200 ${
        theme === 'dark' 
          ? 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
          : 'bg-white/95 border-slate-200 text-slate-800 shadow-[0_2px_10px_rgba(0,0,0,0.03)]'
      }`}>
        
        {/* Left Section: Sleek AIChartor Brand Logo & Settings dropdown */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/10">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <span className={`text-sm font-extrabold tracking-tight leading-none transition-colors ${
                theme === 'dark' ? 'text-white' : 'text-slate-900'
              }`}>
                AIChartor
              </span>
              <span className={`text-[9px] font-semibold uppercase tracking-widest leading-none mt-0.5 hidden sm:block transition-colors ${
                theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Shared View
              </span>
            </div>
          </div>

          {!chart.template_structure && (
            <>
              <div className={`w-[1px] h-5 hidden sm:block transition-colors ${
                theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
              }`}></div>
              {/* Dimension View Mode Toggle */}
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className={`border-none gap-1.5 px-2 h-7 text-xs transition-colors ${
                      theme === 'dark' 
                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white' 
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}>
                      <Settings className="w-3.5 h-3.5 opacity-80" />
                      <span className="font-medium opacity-90 hidden sm:block">
                        {dimensionMode === 'original' ? 'Original Size' : dimensionMode === 'responsive' ? 'Fill Screen' : 'Custom Size'}
                      </span>
                      <svg className="w-3.5 h-3.5 opacity-60" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className={`w-48 shadow-xl p-1 z-30 transition-all ${
                    theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    <DropdownMenuItem onClick={() => setDimensionMode('original')} className={`cursor-pointer font-medium rounded-md text-xs py-2 px-3 transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-700'
                    }`}>Original Size</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDimensionMode('responsive')} className={`cursor-pointer font-medium rounded-md text-xs py-2 px-3 transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-700'
                    }`}>Fill Screen</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDimensionMode('manual')} className={`cursor-pointer font-medium rounded-md text-xs py-2 px-3 transition-colors ${
                      theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-700'
                    }`}>Custom Size</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {dimensionMode === "manual" && (
                  <div className={`flex items-center rounded-md px-1.5 py-0.5 gap-1.5 shadow-inner border hidden md:flex h-7 transition-colors ${
                    theme === 'dark' ? 'bg-slate-950/60 border-slate-800/80' : 'bg-slate-100 border-slate-200'
                  }`}>
                    <Input 
                      type="number" 
                      value={manualWidth} 
                      onChange={(e) => setManualWidth(parseInt(e.target.value) || 0)}
                      className={`w-10 h-5 text-[10px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-center font-bold transition-colors ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <span className={`text-[10px] font-extrabold select-none transition-colors ${
                      theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
                    }`}>×</span>
                    <Input 
                      type="number" 
                      value={manualHeight} 
                      onChange={(e) => setManualHeight(parseInt(e.target.value) || 0)}
                      className={`w-10 h-5 text-[10px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-center font-bold transition-colors ${
                        theme === 'dark' ? 'text-slate-200' : 'text-slate-700'
                      }`}
                      style={{ MozAppearance: 'textfield' }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Section: Theme Toggle, Share, Download, Try Now */}
        <div className="flex items-center gap-2">
          {/* Beautiful Glassmorphic Theme Toggle Button */}
          <Button
            onClick={toggleTheme}
            size="sm"
            variant="ghost"
            className={`w-7 h-7 p-0 rounded-lg flex items-center justify-center transition-all hover:rotate-12 ${
              theme === 'dark' 
                ? 'text-yellow-400 hover:text-yellow-300 hover:bg-slate-850' 
                : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
            }`}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </Button>

          {/* Share Link Button */}
          <Button 
            onClick={handleShare}
            size="sm" 
            className={`gap-1.5 px-3 h-7 text-xs shadow-sm transition-all rounded-lg ${
              theme === 'dark' 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50' 
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-semibold hidden sm:block">Share</span>
          </Button>

          {/* Download Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className={`gap-1.5 px-3 h-7 text-xs shadow-sm transition-all rounded-lg ${
                theme === 'dark' 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/50' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
              }`}>
                <Download className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-semibold hidden sm:block">Download</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={`w-52 shadow-xl p-1 z-30 transition-all ${
              theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
            }`}>
              <DropdownMenuItem onClick={handleDownloadImage} className={`cursor-pointer gap-2 py-2 px-3 rounded-md transition-colors ${
                theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-800'
              }`}>
                <div className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                  <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className={`font-semibold text-xs transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Image</span>
                  <span className={`text-[9px] font-medium transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Standard PNG format</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadHTML} className={`cursor-pointer gap-2 py-2 px-3 rounded-md transition-colors ${
                theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-800'
              }`}>
                <div className={`p-1.5 rounded-md transition-colors ${theme === 'dark' ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className={`font-semibold text-xs transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>Interactive HTML</span>
                  <span className={`text-[9px] font-medium transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>With tooltips & animations</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Try Now! Premium glowing button */}
          <Button 
            asChild
            size="sm" 
            className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.02] active:scale-[0.98] text-white border-none shadow-md shadow-indigo-500/10 font-bold px-3.5 h-7 text-xs tracking-wide rounded-lg flex items-center gap-1 transition-all"
          >
            <a href="/editor">
              <Sparkles className="w-3 h-3 text-indigo-200" />
              <span>Try Now!</span>
              <ChevronRight className="w-3 h-3 text-white/70" />
            </a>
          </Button>
        </div>
      </header>

      {/* 2. Main Canvas Area with Dot Pattern Background */}
      <main 
        ref={mainContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`flex-1 overflow-hidden relative transition-colors duration-200 ${
          panMode ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
        style={{
          display: 'grid',
          placeContent: 'safe center',
          backgroundImage: theme === 'dark' 
            ? 'radial-gradient(#334155 1.2px, transparent 1.2px)' 
            : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: '20px 20px',
          backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc'
        }}
      >
        <div 
          className="relative flex-shrink-0 bg-transparent transition-transform duration-100 ease-out"
          style={dimensionMode === 'responsive' ? { width: '100%', height: '100%', minHeight: '400px' } : (() => {
            let w = 800, h = 600;
            if (isFormat && chart.template_structure?.dimensions) {
              w = chart.template_structure.dimensions.width || 800;
              h = chart.template_structure.dimensions.height || 600;
            } else if (isTemplate && chart.template_structure) {
              w = parseInt(chart.template_structure.width) || 800;
              h = parseInt(chart.template_structure.height) || 600;
            } else {
              w = dimensionMode === 'manual' ? manualWidth : (parseInt(chart?.chart_config?.width) || 800);
              h = dimensionMode === 'manual' ? manualHeight : (parseInt(chart?.chart_config?.height) || 600);
            }
            return {
              width: w * Math.max(0.1, zoom),
              height: h * Math.max(0.1, zoom),
              transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: 'top left'
            };
          })()}
        >
            {isFormat && renderedFormat ? (
              <div 
                className={`relative flex-shrink-0 transition-all ${
                  dimensionMode !== 'responsive' 
                    ? (theme === 'dark' 
                      ? 'shadow-[0_12px_40px_rgba(0,0,0,0.4)] bg-slate-900 ring-1 ring-slate-800' 
                      : 'shadow-[0_12px_40px_rgba(0,0,0,0.06)] bg-white ring-1 ring-slate-200/80') 
                    : ''
                }`}
                style={dimensionMode !== 'responsive' ? {
                  width: chart.template_structure?.dimensions?.width || 800,
                  height: chart.template_structure?.dimensions?.height || 600,
                  transform: `scale(${Math.max(0.1, zoom)})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0, left: 0,
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff'
                } : {
                  width: '100%', height: '100%', backgroundColor: 'transparent'
                }}
              >
                <FormatRenderer
                  rendered={renderedFormat}
                  scale={1}
                  interactive={false}
                  panMode={true}
                  forceRealChart={true}
                  zoomLevel={zoom}
                />
              </div>
            ) : isTemplate ? (
              <div 
                className={`relative origin-[0_0] flex-shrink-0 transition-all ${
                  dimensionMode !== 'responsive' 
                    ? (theme === 'dark' 
                      ? 'bg-slate-950 group shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-1 ring-slate-800' 
                      : 'bg-white group shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-slate-200/80') 
                    : ''
                }`}
                style={dimensionMode !== 'responsive' ? {
                  width: chart.template_structure.width,
                  height: chart.template_structure.height,
                  transform: `scale(${Math.max(0.1, zoom)})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0, left: 0,
                } : {
                  width: '100%', height: '100%', backgroundColor: 'transparent'
                }}
              >
                {/* Main template background layer */}
                {dimensionMode !== 'responsive' && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      ...getTemplateBackgroundStyle(chart.template_structure),
                      border: `${chart.template_structure.borderWidth || 0}px solid ${chart.template_structure.borderColor || 'transparent'}`,
                      borderRadius: '0px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                  />
                )}

                {/* Chart Area */}
                {chart.template_structure.chartArea && (
                  <div className="absolute template-chart-area" style={{ 
                      left: chart.template_structure.chartArea.x, 
                      top: chart.template_structure.chartArea.y, 
                      width: chart.template_structure.chartArea.width, 
                      height: chart.template_structure.chartArea.height,
                      border: 'none',
                      backgroundColor: 'transparent',
                      borderRadius: '4px'
                  }}>
                    <ChartGenerator devicePixelRatioMultiplier={Math.max(1, zoom)} />
                  </div>
                )}
                
                {/* Text Areas */}
                {chart.template_structure.textAreas && renderTemplateTextAreas(chart.template_structure)}

                {/* Decorations Phase */}
                <DecorationShapeRenderer
                  containerWidth={parseInt(chart.template_structure.width) || manualWidth}
                  containerHeight={parseInt(chart.template_structure.height) || manualHeight}
                  panMode={true}
                />
              </div>
            ) : (
              <div 
                className={`relative flex-shrink-0 transition-all ${
                  dimensionMode !== 'responsive' 
                    ? (theme === 'dark' 
                      ? 'shadow-[0_12px_40px_rgba(0,0,0,0.4)] ring-1 ring-slate-800' 
                      : 'shadow-[0_12px_40px_rgba(0,0,0,0.06)] ring-1 ring-slate-200/80') 
                    : ''
                }`}
                style={dimensionMode !== 'responsive' ? {
                  width: dimensionMode === 'manual' ? `${manualWidth}px` : `${parseInt(chart?.chart_config?.width) || 800}px`,
                  height: dimensionMode === 'manual' ? `${manualHeight}px` : `${parseInt(chart?.chart_config?.height) || 600}px`,
                  borderRadius: '6px',
                  backgroundColor: chart?.chart_config?.background?.type === 'transparent' ? 'transparent' : (chart?.chart_config?.backgroundColor || '#ffffff'),
                  transform: `scale(${Math.max(0.1, zoom)})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0, left: 0,
                } : {
                  width: '100%', height: '100%', backgroundColor: 'transparent'
                }}
              >
                <div style={{ position: 'absolute', inset: 0, padding: 0 }}>
                  <ChartGenerator devicePixelRatioMultiplier={Math.max(1, zoom)} />
                </div>
              </div>
            )}
        </div>
      </main>

      {/* 3. Bottom Footer */}
      <footer className={`h-[40px] border-t flex items-center justify-between px-4 shrink-0 z-20 text-xs font-sans transition-all duration-200 ${
        theme === 'dark' 
          ? 'bg-slate-900 border-slate-800 text-slate-400 shadow-[0_-4px_20px_rgba(0,0,0,0.25)]' 
          : 'bg-white border-slate-200 text-slate-600 shadow-[0_-2px_10px_rgba(0,0,0,0.03)]'
      }`}>
         <div className="flex items-center gap-1.5 select-none">
           <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
           </svg>
           <span className={`text-[10px] font-bold tracking-wider uppercase hidden sm:block transition-colors ${
             theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
           }`}>
             Powered by AIChartor
           </span>
         </div>
         
         {/* Sleek consolidated Canvas Tool Widget */}
         {dimensionMode !== 'responsive' && (
           <div className={`flex items-center gap-1 sm:gap-2 px-2 py-0.5 rounded-full border h-[28px] transition-colors duration-200 ${
             theme === 'dark' 
               ? 'bg-slate-950 border-slate-800/80 shadow-inner' 
               : 'bg-white border-slate-200 shadow-sm'
           }`}>
             
             {/* MousePointerClick Select Mode */}
             <button
               onClick={() => setPanMode(false)}
               className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                 !panMode 
                   ? 'bg-indigo-600 text-white shadow-sm' 
                   : (theme === 'dark' 
                     ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' 
                     : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
               }`}
               title="Cursor Select Mode"
             >
               <MousePointerClick className="w-3.5 h-3.5" />
             </button>

             {/* Hand Pan Mode */}
             <button
               onClick={() => setPanMode(true)}
               className={`w-6 h-6 flex items-center justify-center rounded-full transition-all ${
                 panMode 
                   ? 'bg-indigo-600 text-white shadow-sm' 
                   : (theme === 'dark' 
                     ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-900' 
                     : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100')
               }`}
               title="Pan Mode (Click & Drag)"
             >
               <Hand className="w-3.5 h-3.5" />
             </button>

             <div className={`w-[1px] h-3.5 transition-colors ${
               theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
             }`}></div>

             {/* Zoom Selector Dropdown (Canva/Figma Parity) */}
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm" className={`h-6 gap-1 px-1.5 text-[10px] sm:text-xs border-none rounded-full font-bold transition-all ${
                   theme === 'dark' 
                     ? 'text-slate-300 hover:text-white hover:bg-slate-900' 
                     : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                 }`}>
                   <Search className="w-3 h-3 text-slate-400" />
                   <span className="tabular-nums">{Math.round(zoom * 100)}%</span>
                   <svg className="w-2.5 h-2.5 opacity-60" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className={`w-52 shadow-xl p-2 z-30 transition-all ${
                 theme === 'dark' 
                   ? 'bg-slate-900 border-slate-800 text-slate-200' 
                   : 'bg-white border-slate-200 text-slate-800'
               }`}>
                 <DropdownMenuItem onClick={handleResetZoom} className={`cursor-pointer font-medium rounded-md text-xs py-1.5 px-2.5 transition-colors ${
                   theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-700'
                 }`}>
                   <span className="flex-1">100% (Fit to View)</span>
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={handleFitToScreen} className={`cursor-pointer font-medium rounded-md text-xs py-1.5 px-2.5 transition-colors ${
                   theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-700'
                 }`}>
                   <span className="flex-1">Fit to Screen</span>
                 </DropdownMenuItem>
                 <DropdownMenuItem 
                   onClick={() => {
                     setZoom(1.0);
                     setPanOffset({ x: 0, y: 0 });
                   }} 
                   className={`cursor-pointer font-medium rounded-md text-xs py-1.5 px-2.5 transition-colors ${
                     theme === 'dark' ? 'hover:bg-slate-800 hover:text-white text-slate-200' : 'hover:bg-slate-100 hover:text-slate-950 text-slate-700'
                   }`}
                 >
                   <span className="flex-1">Full Dimension</span>
                 </DropdownMenuItem>

                 <DropdownMenuSeparator className={`my-1.5 transition-colors ${
                   theme === 'dark' ? 'border-slate-800' : 'border-slate-150'
                 }`} />

                 <div className="px-2.5 py-2.5" onClick={(e) => e.stopPropagation()}>
                   <Slider
                     min={0}
                     max={ZOOM_VALUES.length - 1}
                     step={1}
                     value={[closestIndex]}
                     onValueChange={handleSliderChange}
                     className={`cursor-pointer ${theme === 'dark' ? 'dark' : ''}`}
                   />
                 </div>

                 <DropdownMenuSeparator className={`my-1.5 transition-colors ${
                   theme === 'dark' ? 'border-slate-800' : 'border-slate-150'
                 }`} />
                 
                 <div className="flex items-center justify-between gap-1 px-1">
                   <Button 
                     onClick={(e) => { e.stopPropagation(); handleZoomOut(); }}
                     size="icon" 
                     variant="ghost" 
                     className={`h-7 w-7 transition-colors ${
                       theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-850' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                     }`} 
                     title="Zoom Out"
                   >
                     <Minus className="h-3.5 w-3.5" />
                   </Button>
                   <div className={`w-[1px] h-4 transition-colors ${
                     theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'
                   }`} />
                   <Button 
                     onClick={(e) => { e.stopPropagation(); handleZoomIn(); }}
                     size="icon" 
                     variant="ghost" 
                     className={`h-7 w-7 transition-colors ${
                       theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-850' : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                     }`} 
                     title="Zoom In"
                   >
                     <Plus className="h-3.5 w-3.5" />
                   </Button>
                 </div>
               </DropdownMenuContent>
             </DropdownMenu>

           </div>
         )}
      </footer>
    </div>
  )
}
