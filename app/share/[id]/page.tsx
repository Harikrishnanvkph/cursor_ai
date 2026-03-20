"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { Chart as ChartJS } from "chart.js"
import "@/lib/chart-registration"
import { Loader2, AlertCircle, Maximize, Settings2 } from "lucide-react"
import { generateCustomLabelsFromConfig } from "@/lib/html-exporter/export-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { downloadChartAsHTML } from "@/lib/html-exporter"
import { getBackgroundConfig } from "@/lib/utils/dimension-utils"

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
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)

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

        setChart(response.data as SharedChart);
        
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
          if (config.responsive && !config.templateDimensions && !config.originalDimensions && !config.manualDimensions) {
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
    return template.textAreas
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
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      <main className="flex-1 flex flex-col p-2 sm:p-4 max-w-[1600px] mx-auto w-full h-full relative">
        <header className="mb-4 flex flex-col sm:flex-row gap-3 justify-between sm:items-center text-sm z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 tracking-wider uppercase">
              Chartography
            </span>
          </div>
          
          {!chart.template_structure && (
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-xl shadow-sm border border-gray-200/60 transition-colors hover:bg-white">
              <div className="flex items-center gap-2">
                <Settings2 className="w-3.5 h-3.5 text-gray-400" />
                <Select value={dimensionMode} onValueChange={(val: any) => setDimensionMode(val)}>
                  <SelectTrigger className="w-[160px] h-7 text-xs border-none bg-transparent focus:ring-0 px-2 py-0">
                    <SelectValue placeholder="Dimensions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original">Original Dimensions</SelectItem>
                    <SelectItem value="responsive">Responsive (Fit)</SelectItem>
                    <SelectItem value="manual">Manual Dimensions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dimensionMode === "manual" && (
                <div className="flex items-center gap-2 border-l border-gray-100 pl-3">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-semibold text-gray-400">W</Label>
                    <Input 
                      type="number" 
                      value={manualWidth} 
                      onChange={(e) => setManualWidth(parseInt(e.target.value) || 0)}
                      className="w-14 h-7 text-xs bg-transparent border-gray-200/60 focus:border-blue-400 px-2"
                      min={100}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[10px] font-semibold text-gray-400">H</Label>
                    <Input 
                      type="number" 
                      value={manualHeight} 
                      onChange={(e) => setManualHeight(parseInt(e.target.value) || 0)}
                      className="w-14 h-7 text-xs bg-transparent border-gray-200/60 focus:border-blue-400 px-2"
                      min={100}
                    />
                  </div>
                </div>
              )}
              
              <div className="h-4 w-px bg-gray-200 mx-1"></div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2 gap-1.5 text-gray-500 hover:text-gray-900 focus-visible:ring-0 focus-visible:ring-offset-0">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 shadow-lg border-gray-100">
                  <DropdownMenuItem onClick={handleDownloadImage} className="text-xs cursor-pointer focus:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Download as Image (PNG)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadHTML} className="text-xs cursor-pointer focus:bg-gray-50 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                    Download as HTML
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
            </div>
          )}
        </header>

        <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-200/50 p-2 sm:p-4 overflow-hidden relative mx-auto w-full flex ${chart.template_structure || dimensionMode !== 'responsive' ? 'items-center justify-center min-h-[500px]' : 'flex-col'}`}>
          {chart.template_structure ? (
            <div className="relative overflow-auto w-full h-full flex justify-center items-center">
              <div
                className="relative flex-shrink-0"
                style={{
                  width: chart.template_structure.width,
                  height: chart.template_structure.height,
                  border: `${chart.template_structure.borderWidth || 0}px solid ${chart.template_structure.borderColor || 'transparent'}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                  ...getTemplateBackgroundStyle(chart.template_structure)
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: chart.template_structure.chartArea.x,
                    top: chart.template_structure.chartArea.y,
                    width: chart.template_structure.chartArea.width,
                    height: chart.template_structure.chartArea.height,
                  }}
                >
                  <canvas ref={canvasRef} className="w-full h-full" />
                </div>
                {renderTemplateTextAreas(chart.template_structure)}
              </div>
            </div>
          ) : (
            dimensionMode === 'responsive' ? (
              <div className="flex-1 w-full relative min-h-[400px]">
                <div style={{ position: 'absolute', inset: 0 }}>
                  <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                </div>
              </div>
            ) : (
              <div className="w-full h-full overflow-auto flex items-center justify-center min-h-[400px]">
                <div 
                  className="relative transition-all duration-300 ease-in-out bg-white inline-block flex-shrink-0" 
                  style={{
                    width: dimensionMode === 'manual' 
                      ? `${manualWidth}px` 
                      : `${(() => { const w = chart?.chart_config?.width; if (typeof w === 'number') return w; if (typeof w === 'string') { const p = parseInt(w); if (!isNaN(p) && !w.includes('%')) return p; } return 800; })()}px`,
                    height: dimensionMode === 'manual' 
                      ? `${manualHeight}px` 
                      : `${(() => { const h = chart?.chart_config?.height; if (typeof h === 'number') return h; if (typeof h === 'string') { const p = parseInt(h); if (!isNaN(p) && !h.includes('%')) return p; } return 600; })()}px`,
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </main>
    </div>
  )
}
