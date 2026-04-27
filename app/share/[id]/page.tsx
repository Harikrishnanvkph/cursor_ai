"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { Chart as ChartJS } from "chart.js"
import "@/lib/chart-registration"
import { Loader2, AlertCircle, Maximize, Settings2, ZoomIn, ZoomOut } from "lucide-react"
import { generateCustomLabelsFromConfig } from "@/lib/html-exporter/export-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { downloadChartAsHTML } from "@/lib/html-exporter"
import { getBackgroundConfig } from "@/lib/utils/dimension-utils"
import { renderFormat } from "@/lib/variant-engine"
import { FormatRenderer } from "@/components/gallery/FormatRenderer"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { DecorationShapeRenderer } from "@/components/decorations/DecorationShapeRenderer"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { getPatternCSS } from "@/lib/utils"
import { ChartGenerator } from "@/lib/chart_generator"

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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)
  const mainContainerRef = useRef<HTMLDivElement>(null)

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

        const response = await dataService.getSharedChart(shareId);

        if (response.error || !response.data) {
          setError(response.error === "Shared chart not found"
            ? "This chart doesn't exist or the link has expired."
            : "Failed to load the beautifully shared chart.");
          return;
        }

        let fetchedChart = response.data;

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
        const config = response.data.chart_config;
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
    if (!chartRef.current) return;
    try {
      const url = chartRef.current.toBase64Image('image/png', 1.0);
      const link = document.createElement('a');
      link.download = `chart-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to export image:", err);
    }
  };

  const handleDownloadHTML = async () => {
    if (!chart) return;
    try {
      let width = 800;
      let height = 600;
      if (canvasRef.current) {
        width = canvasRef.current.width;
        height = canvasRef.current.height;
      }
      
      const config = chart.chart_config;
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

  useEffect(() => {
    if (!canvasRef.current || !chart) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    if (chartRef.current) {
      chartRef.current.destroy()
    }

    try {
      const processedConfig = { ...chart.chart_config }
      if (chart.chart_type === 'pie' || chart.chart_type === 'doughnut') {
        delete processedConfig.scales
      }

      // Generate custom labels if the configuration exists
      if (processedConfig.plugins?.customLabelsConfig) {
        const customLabels = generateCustomLabelsFromConfig(
          processedConfig, 
          chart.chart_data, 
          { datasets: [], slices: [] }, 
          chart.chart_config.dragState || {}
        );
        
        if (customLabels && customLabels.length > 0) {
          processedConfig.plugins.customLabels = {
            shapeSize: 32,
            labels: customLabels
          };
        }
      }

      // Helper to extract a numeric pixel value from config dimension
      const parseConfigDim = (val: any, fallback: number): number => {
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const parsed = parseInt(val);
          if (!isNaN(parsed) && !val.includes('%')) return parsed;
        }
        return fallback;
      };

      let containerWidth = "100%"
      let containerHeight = "100%"
      let isResponsive = true

      if (dimensionMode === "original") {
        // Always use fixed pixel dimensions from the backend config
        const origW = parseConfigDim(processedConfig.width, 800);
        const origH = parseConfigDim(processedConfig.height, 600);
        containerWidth = `${origW}px`;
        containerHeight = `${origH}px`;
        isResponsive = false; // Original should be fixed, not responsive
      } else if (dimensionMode === "manual") {
        containerWidth = `${manualWidth}px`
        containerHeight = `${manualHeight}px`
        isResponsive = false
      } else if (dimensionMode === "responsive") {
        containerWidth = "100%"
        containerHeight = "100%"
        isResponsive = true
      }

      if (canvasRef.current.parentElement) {
        if (!chart.template_structure) {
           canvasRef.current.parentElement.style.width = containerWidth
           canvasRef.current.parentElement.style.height = containerHeight
           
           // Ensure the canvas itself also adopts these dimensions to prevent ChartJS 
           // from being stuck at 0x0 or previous dimensions during a resize event
           if (canvasRef.current) {
             canvasRef.current.style.width = '100%';
             canvasRef.current.style.height = '100%';
           }
        }
      }

      // Determine valid Chart.js type
      let chartTypeForChart = chart.chart_type;
      if (chart.chart_type === 'area') chartTypeForChart = 'line';
      else if (chart.chart_type === 'stackedBar') chartTypeForChart = 'bar';
      else if (chart.chart_type === 'horizontalBar' || chart.chart_type === 'horizontalBar3d') chartTypeForChart = 'bar';
      else if (chart.chart_type === 'pie3d') chartTypeForChart = 'pie';
      else if (chart.chart_type === 'doughnut3d') chartTypeForChart = 'doughnut';
      else if (chart.chart_type === 'bar3d') chartTypeForChart = 'bar';
      
      // Ensure scales are explicitly stacked if needed
      if (chart.chart_type === 'stackedBar') {
        processedConfig.scales = {
          ...(processedConfig.scales || {}),
          x: { ...((processedConfig.scales && processedConfig.scales.x) || {}), stacked: true },
          y: { ...((processedConfig.scales && processedConfig.scales.y) || {}), stacked: true },
        };
      }

      // Handle horizontal orientation
      if (chart.chart_type === 'horizontalBar' || chart.chart_type === 'horizontalBar3d') {
        processedConfig.indexAxis = 'y';
      }

      chartRef.current = new ChartJS(ctx, {
        type: chartTypeForChart as any,
        data: {
          ...chart.chart_data,
          datasets: chart.chart_data.datasets.map((ds: any) => ({
            ...ds,
            type: ds.type ? (
              ds.type === 'bar3d' || ds.type === 'horizontalBar3d' ? 'bar' :
              ds.type === 'pie3d' ? 'pie' :
              ds.type === 'doughnut3d' ? 'doughnut' :
              ds.type
            ) : undefined
          }))
        },
        options: {
          ...processedConfig,
          responsive: true, // Always true to fill the CSS-defined container
          maintainAspectRatio: false, // ALWAYS false so it stretches exactly to our defined container height
          plugins: {
            ...processedConfig.plugins,
            pie3d: {
               ...(processedConfig.plugins?.pie3d || {}),
               enabled: chart.chart_type === 'pie3d' || chart.chart_type === 'doughnut3d'
            },
            bar3d: {
               ...(processedConfig.plugins?.bar3d || {}),
               enabled: chart.chart_type === 'bar3d' || chart.chart_type === 'horizontalBar3d'
            },
            legend: {
              ...processedConfig.plugins?.legend,
              display: processedConfig.plugins?.legend?.display !== false,
              labels: {
                ...(processedConfig.plugins?.legend?.labels || {}),
                generateLabels: (c: any) => {
                  const legendType = c.config?.options?.plugins?.legendType || processedConfig.plugins?.legendType || 'dataset';
                  const usePointStyle = processedConfig.plugins?.legend?.labels?.usePointStyle || false;
                  const pointStyle = processedConfig.plugins?.legend?.labels?.pointStyle || 'rect';
                  const fontColor = processedConfig.plugins?.legend?.labels?.color || '#000000';
                  
                  const createItem = (props: any) => ({
                    ...props,
                    pointStyle: usePointStyle ? pointStyle : undefined,
                    fontColor: fontColor,
                    hidden: false,
                  });
                  
                  const items = [] as any[];
                  
                  // In shared charts, slice labels apply mainly for pie/doughnut/polarArea
                  const isCircular = chart.chart_type === 'pie' || chart.chart_type === 'doughnut' || chart.chart_type === 'polarArea';
                  const typeToUse = isCircular ? (legendType === 'dataset' ? 'dataset' : 'slice') : legendType;

                  if (typeToUse === 'slice' || typeToUse === 'both') {
                    const labels = chart.chart_data.labels || [];
                    const ds = chart.chart_data.datasets[0];
                    for (let i = 0; i < labels.length; ++i) {
                      items.push(createItem({
                        text: String(labels[i]),
                        fillStyle: Array.isArray(ds?.backgroundColor) ? ds.backgroundColor[i] : ds?.backgroundColor || '#ccc',
                        strokeStyle: Array.isArray(ds?.borderColor) ? ds.borderColor[i] : ds?.borderColor || '#333',
                        index: i,
                        datasetIndex: 0,
                        type: 'slice',
                      }));
                    }
                  }
                  if (typeToUse === 'dataset' || typeToUse === 'both') {
                    const datasets = chart.chart_data.datasets || [];
                    for (let i = 0; i < datasets.length; ++i) {
                      const ds = datasets[i];
                      items.push(createItem({
                        text: ds.label || `Dataset ${i + 1}`,
                        fillStyle: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor || '#ccc',
                        strokeStyle: Array.isArray(ds.borderColor) ? ds.borderColor[0] : ds.borderColor || '#333',
                        datasetIndex: i,
                        index: i,
                        type: 'dataset',
                      }));
                    }
                  }
                  return items;
                }
              }
            }
          }
        },
      })
    } catch (error) {
      console.error("Error drawing shared chart:", error)
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [chart, dimensionMode, manualWidth, manualHeight])

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
              <div dangerouslySetInnerHTML={{ __html: content || '' }} style={{ width: '100%', height: '100%' }} />
            ) : (
              content
            )}
          </div>
        )
      })
  }

  return (
    <div className="h-screen flex flex-col font-sans bg-gray-100 overflow-hidden">
      {/* 1. Canva-like Top Navigation Bar */}
      <header className="h-[56px] bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-md">
        
        {/* Left Section: Logo and View Controls */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center shadow-inner">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-lg font-extrabold tracking-wide hidden sm:block">
              Chartography
            </span>
          </div>

          {!chart.template_structure && (
            <>
              <div className="w-px h-6 bg-white/20 hidden sm:block"></div>
              {/* Dimension View Mode Toggle (Acting like Canva's 'Viewing' dropdown) */}
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white border-none gap-2 px-2 h-8">
                      <Settings2 className="w-4 h-4 opacity-80" />
                      <span className="text-sm font-medium opacity-90 hidden sm:block">
                        {dimensionMode === 'original' ? 'Original Size' : dimensionMode === 'responsive' ? 'Fill Screen' : 'Custom Size'}
                      </span>
                      <svg className="w-4 h-4 opacity-70" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48 shadow-xl border-none ring-1 ring-black/5">
                    <DropdownMenuItem onClick={() => setDimensionMode('original')} className="cursor-pointer font-medium">Original Size</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDimensionMode('responsive')} className="cursor-pointer font-medium">Fill Screen</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDimensionMode('manual')} className="cursor-pointer font-medium">Custom Size</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {dimensionMode === "manual" && (
                  <div className="flex items-center bg-black/20 rounded-md px-2 py-1 gap-2 shadow-inner border border-white/10 hidden md:flex">
                    <Input 
                      type="number" 
                      value={manualWidth} 
                      onChange={(e) => setManualWidth(parseInt(e.target.value) || 0)}
                      className="w-14 h-6 text-xs bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-white/50 p-0 text-center font-medium"
                      style={{ MozAppearance: 'textfield' }}
                    />
                    <span className="text-white/50 text-xs font-bold">×</span>
                    <Input 
                      type="number" 
                      value={manualHeight} 
                      onChange={(e) => setManualHeight(parseInt(e.target.value) || 0)}
                      className="w-14 h-6 text-xs bg-transparent border-none text-white focus-visible:ring-1 focus-visible:ring-white/50 p-0 text-center font-medium"
                      style={{ MozAppearance: 'textfield' }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Section: Avatars, Download, Signup */}
        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="bg-white/15 hover:bg-white/25 text-white border-none gap-2 px-3 h-8 lg:h-9 shadow-sm transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                <span className="font-semibold text-sm hidden md:block tracking-wide">Download</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 shadow-xl border-none ring-1 ring-black/5 p-1.5">
              <DropdownMenuItem onClick={handleDownloadImage} className="cursor-pointer gap-2 py-2.5 px-3 rounded-md focus:bg-blue-50">
                <div className="bg-blue-100 p-1.5 rounded-md">
                  <svg className="w-4 h-4 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-sm">Image</span>
                  <span className="text-[10px] text-gray-500 font-medium">Standard PNG format</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadHTML} className="cursor-pointer gap-2 py-2.5 px-3 rounded-md focus:bg-blue-50 mt-1">
                <div className="bg-indigo-100 p-1.5 rounded-md">
                  <svg className="w-4 h-4 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800 text-sm">Interactive HTML</span>
                  <span className="text-[10px] text-gray-500 font-medium">With tooltips & animations</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" className="bg-white text-blue-800 hover:bg-gray-50 font-bold px-4 h-8 lg:h-9 border-none shadow-sm hidden sm:flex tracking-wide">
            Sign up
          </Button>
        </div>
      </header>

      {/* 2. Main Canvas Area with Dot Pattern Background */}
      <main 
        ref={mainContainerRef}
        className="flex-1 overflow-auto relative"
        style={{
          display: 'grid',
          placeContent: 'safe center',
          backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundColor: '#f1f5f9'
        }}
      >
        <div 
          className="relative flex-shrink-0 bg-transparent"
          style={dimensionMode === 'responsive' ? { width: '100%', height: '100%', minHeight: '400px' } : (() => {
            // For formats: dimensions live at template_structure.dimensions.width/height
            // For templates: dimensions live at template_structure.width/height
            // For plain charts: dimensions from chart_config or manual
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
            };
          })()}
        >
            {isFormat && renderedFormat ? (
              <div 
                className={`relative flex-shrink-0 ${
                  dimensionMode !== 'responsive' ? 'shadow-[0_4px_24px_rgb(0,0,0,0.08)] bg-white ring-1 ring-gray-900/5' : ''
                }`}
                style={dimensionMode !== 'responsive' ? {
                  width: chart.template_structure?.dimensions?.width || 800,
                  height: chart.template_structure?.dimensions?.height || 600,
                  transform: `scale(${Math.max(0.1, zoom)})`,
                  transformOrigin: 'top left',
                  position: 'absolute',
                  top: 0, left: 0,
                  backgroundColor: '#f8f9fa'
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
                />
              </div>
            ) : isTemplate ? (
              <div 
                className={`relative origin-[0_0] flex-shrink-0 ${
                  dimensionMode !== 'responsive' ? 'bg-white group shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-gray-900/5' : ''
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
                {/* Main template background layer matching exactly what's in template-chart-preview.tsx */}
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
                    <ChartGenerator />
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
                className={`relative flex-shrink-0 ${
                  dimensionMode !== 'responsive' ? 'shadow-[0_4px_24px_rgb(0,0,0,0.08)] ring-1 ring-gray-900/5' : ''
                }`}
                style={dimensionMode !== 'responsive' ? {
                  width: dimensionMode === 'manual' ? `${manualWidth}px` : `${parseInt(chart?.chart_config?.width) || 800}px`,
                  height: dimensionMode === 'manual' ? `${manualHeight}px` : `${parseInt(chart?.chart_config?.height) || 600}px`,
                  borderRadius: '4px',
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
                  <ChartGenerator />
                </div>
              </div>
            )}
        </div>
      </main>

      {/* 3. Bottom Footer */}
      <footer className="h-[44px] bg-white border-t border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-[0_-2px_10px_rgb(0,0,0,0.02)]">
         <div className="flex items-center gap-2">
           <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
           </svg>
           <div className="text-[11px] font-bold tracking-wider text-gray-500 uppercase hidden sm:block">
             Powered by Chartography
           </div>
         </div>
         
         {/* Zoom Controls */}
         {dimensionMode !== 'responsive' && (
           <div className="flex items-center gap-2 sm:gap-3 bg-gray-50 px-2 sm:px-3 py-1 rounded-full border border-gray-100">
             <button 
               onClick={handleFitToScreen}
               className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-blue-600 transition-colors px-1"
               title="Fit to Screen"
             >
               Fit
             </button>
             <div className="w-px h-3 bg-gray-300"></div>
             <button onClick={() => setZoom(Math.max(0.1, zoom - 0.1))} className="text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
               <ZoomOut className="w-3.5 h-3.5" />
             </button>
             <div className="flex items-center w-16 sm:w-28 mx-0 sm:mx-1">
               <input 
                 type="range" 
                 min="10" 
                 max="500" 
                 value={Math.round(zoom * 100)} 
                 onChange={(e) => setZoom(parseInt(e.target.value) / 100)} 
                 className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
               />
             </div>
             <button onClick={() => setZoom(Math.min(5, zoom + 0.1))} className="text-gray-400 hover:text-gray-700 w-5 h-5 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors">
               <ZoomIn className="w-3.5 h-3.5" />
             </button>
             <span className="text-[10px] sm:text-[11px] font-semibold text-gray-600 w-8 sm:w-9 text-right tabular-nums">
               {Math.round(zoom * 100)}%
             </span>
           </div>
         )}
      </footer>
    </div>
  )
}
