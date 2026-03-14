"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { Chart as ChartJS } from "chart.js"
import "@/lib/chart-registration"
import { Loader2, AlertCircle } from "lucide-react"
import { generateCustomLabelsFromConfig } from "@/lib/html-exporter/export-utils"

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
      } catch (err) {
        console.error("Error loading shared chart:", err)
        setError("Failed to load chart")
      } finally {
        setLoading(false)
      }
    }

    fetchSharedChart()
  }, [shareId])

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

      chartRef.current = new ChartJS(ctx, {
        type: chart.chart_type as any,
        data: chart.chart_data,
        options: {
          ...processedConfig,
          responsive: true,
          maintainAspectRatio: false, // Let CSS control the height
          plugins: {
            ...processedConfig.plugins,
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
  }, [chart])

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
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <main className="flex-1 flex flex-col p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <header className="mb-8 flex justify-between items-center text-sm text-gray-400">
          <div>Shared via Cursor AI</div>
          <div>{new Date(chart.created_at).toLocaleDateString()}</div>
        </header>

        <div className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-gray-100 flex items-center justify-center p-4 sm:p-8 md:p-12 overflow-hidden">
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
            <div className="w-full h-full min-h-[400px] max-h-[800px] relative">
              <canvas ref={canvasRef} className="w-full h-full" />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
