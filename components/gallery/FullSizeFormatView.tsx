"use client"

import React, { useMemo, useEffect, useRef, useState } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStore } from "@/lib/chart-store"
import { renderFormat } from "@/lib/variant-engine"
import { FormatRenderer } from "./FormatRenderer"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Download, X, AlertTriangle, ChevronDown, Sparkles, Check } from "lucide-react"
import { domToPng } from "modern-screenshot"
import { getStandardAspectRatio } from "@/lib/utils/dimension-utils"
import { getProxiedImageUrl, requiresProxy } from "@/lib/utils/image-proxy-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export type ExportQuality = 1 | 2 | 3 | 4

interface QualityOption {
  scale: ExportQuality
  label: string
  shortLabel: string
  badge: string
  badgeColor: string
  desc: string
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    scale: 4,
    label: "Crystal Clear (4x - Ultra HD)",
    shortLabel: "4x Crystal Clear",
    badge: "UHD · Best",
    badgeColor: "bg-indigo-100 text-indigo-700 border-indigo-200",
    desc: "Maximum vector clarity & razor-sharp chart · Print-ready",
  },
  {
    scale: 3,
    label: "High Quality (3x)",
    shortLabel: "3x High Quality",
    badge: "3K",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    desc: "Very sharp · Ideal for 4K presentations & displays",
  },
  {
    scale: 2,
    label: "Standard (2x)",
    shortLabel: "2x Standard",
    badge: "2K",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    desc: "Balanced resolution · Smaller file size & fast download",
  },
  {
    scale: 1,
    label: "Normal (1x)",
    shortLabel: "1x Normal",
    badge: "1x",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    desc: "Standard resolution · Smallest file size & fast download",
  },
]

export function FullSizeFormatView() {
  const { formats, contentPackage, selectedFormatId, openGallery, clearSelection, contextualImageUrl } = useFormatGalleryStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const formatRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedQuality, setSelectedQuality] = useState<ExportQuality>(4)

  const renderedFormat = useMemo(() => {
    if (!selectedFormatId || !contentPackage || formats.length === 0) return null
    const format = formats.find(f => f.id === selectedFormatId)
    if (!format) return null
    return renderFormat(format, contentPackage, undefined, contextualImageUrl || undefined)
  }, [selectedFormatId, contentPackage, formats, contextualImageUrl])

  // Calculate scale to fit container
  useEffect(() => {
    if (!renderedFormat || !containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries.length || !renderedFormat) return
      const { width: containerW, height: containerH } = entries[0].contentRect
      
      const formatW = renderedFormat.skeleton.dimensions.width
      const formatH = renderedFormat.skeleton.dimensions.height

      // Add padding
      const padding = 40
      const availableW = containerW - padding * 2
      const availableH = containerH - padding * 2

      const scaleW = availableW / formatW
      const scaleH = availableH / formatH
      const newScale = Math.min(scaleW, scaleH, 1) // Don't scale up past 1x
      
      setScale(newScale)
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [renderedFormat])

  const handleExport = async (exportScale: ExportQuality = selectedQuality) => {
    if (!formatRef.current || !renderedFormat) return
    setIsExporting(true)
    
    // Save original styles
    const originalTransform = formatRef.current.style.transform;
    const originalTransformOrigin = formatRef.current.style.transformOrigin;
    const originalContainerWidth = formatRef.current.parentElement?.style.width || '';
    const originalContainerHeight = formatRef.current.parentElement?.style.height || '';

    // Tracking for cleanup
    const chartBackups: { chart: any; origDpr: number; origWidth: number; origHeight: number }[] = []
    const canvasReplacements: { canvas: HTMLCanvasElement; img: HTMLImageElement }[] = []
    const imageSrcRestores: { img: HTMLImageElement; origSrc: string }[] = []

    try {
      // 1. Set container to full unscaled format dimensions and remove zoom scale
      if (formatRef.current.parentElement) {
        formatRef.current.parentElement.style.width = `${renderedFormat.skeleton.dimensions.width}px`;
        formatRef.current.parentElement.style.height = `${renderedFormat.skeleton.dimensions.height}px`;
      }
      formatRef.current.style.transform = 'none';
      formatRef.current.style.transformOrigin = 'top left';

      // 2. High-DPI Chart Boost: Find all Chart.js instances and boost devicePixelRatio to exportScale
      const { Chart: ChartJS } = await import('chart.js')
      const canvases = Array.from(formatRef.current.querySelectorAll('canvas'))

      for (const canvas of canvases) {
        let chart = ChartJS.getChart(canvas)
        if (!chart) {
          const globalChart = useChartStore.getState().globalChartRef?.current
          if (globalChart && (globalChart.canvas === canvas || canvases.length === 1)) {
            chart = globalChart
          }
        }
        if (chart) {
          const origWidth = chart.width
          const origHeight = chart.height
          chartBackups.push({
            chart,
            origDpr: chart.options.devicePixelRatio || window.devicePixelRatio || 1,
            origWidth,
            origHeight,
          })
          // Set Chart devicePixelRatio to target export resolution and render synchronously
          chart.options.devicePixelRatio = exportScale
          chart.resize(origWidth, origHeight)
          chart.update('none')
        }
      }

      // Small delay to ensure high-DPI canvas buffer has painted
      await new Promise(resolve => setTimeout(resolve, 80));

      // 3. Snapshot high-resolution canvases to <img> elements for flawless SVG foreignObject capture
      for (const canvas of canvases) {
        try {
          const data = canvas.toDataURL('image/png')
          const img = document.createElement('img')
          img.src = data
          img.className = canvas.className
          img.style.cssText = canvas.style.cssText
          img.style.width = `${canvas.clientWidth || canvas.offsetWidth}px`
          img.style.height = `${canvas.clientHeight || canvas.offsetHeight}px`
          canvas.parentNode?.insertBefore(img, canvas)
          canvas.style.display = 'none'
          canvasReplacements.push({ canvas, img })
        } catch (e) {
          console.warn("Failed to snapshot canvas for export:", e)
        }
      }

      // 4. Pre-process any remote images (logos, contextual images) to base64 data URLs
      const allImages = Array.from(formatRef.current.querySelectorAll('img')).filter(
        img => !canvasReplacements.some(cr => cr.img === img)
      )

      await Promise.all(
        allImages.map(async (img) => {
          const src = img.src || img.getAttribute('src') || ''
          if (!src || src.startsWith('data:')) return

          try {
            const proxiedUrl = requiresProxy(src) ? getProxiedImageUrl(src) : src
            const response = await fetch(proxiedUrl)
            const blob = await response.blob()
            const dataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onloadend = () => resolve((reader.result as string) || '')
              reader.onerror = () => resolve('')
              reader.readAsDataURL(blob)
            })

            if (dataUrl) {
              imageSrcRestores.push({ img, origSrc: src })
              img.src = dataUrl
            }
          } catch (err) {
            console.warn('Failed to pre-convert image to data URL:', src, err)
          }
        })
      )

      // 5. Wait for fonts to be ready
      if (typeof document !== 'undefined' && 'fonts' in document) {
        try {
          await Promise.race([
            (document.fonts as any).ready,
            new Promise(resolve => setTimeout(resolve, 1500))
          ])
        } catch (_) {}
      }

      await new Promise(resolve => setTimeout(resolve, 100));

      // 6. Capture full format at exportScale
      const dataUrl = await domToPng(formatRef.current, {
        scale: exportScale,
        width: renderedFormat.skeleton.dimensions.width,
        height: renderedFormat.skeleton.dimensions.height,
        filter: (node: Node) => {
          if (node instanceof HTMLElement) {
            if (
              node.getAttribute('data-export-ignore') === 'true' ||
              node.classList.contains('format-zone-toolbar') ||
              node.classList.contains('format-zone-selection-border') ||
              node.classList.contains('format-zone-type-badge')
            ) {
              return false
            }
          }
          return true
        },
        style: {
          transform: 'none',
          transformOrigin: 'top left'
        }
      })

      // 7. Download
      const link = document.createElement("a")
      const qualityTag = exportScale === 4 ? 'crystal-clear-uhd' : `${exportScale}x`
      link.download = `chart-${renderedFormat.skeleton.name.toLowerCase().replace(/\s+/g, '-')}-${qualityTag}.png`
      link.href = dataUrl
      link.click()

      const qualityName = QUALITY_OPTIONS.find(q => q.scale === exportScale)?.label || `${exportScale}x`
      toast.success(`Exported ${qualityName} successfully!`)
    } catch (err) {
      console.error("Export failed:", err)
      toast.error("Failed to export image. Please try again.")
    } finally {
      // 8. Restore original state
      for (const { img, origSrc } of imageSrcRestores) {
        img.src = origSrc
      }

      for (const { canvas, img } of canvasReplacements) {
        canvas.style.display = ''
        if (img && img.parentNode) {
          img.parentNode.removeChild(img)
        }
      }

      for (const { chart, origDpr, origWidth, origHeight } of chartBackups) {
        chart.options.devicePixelRatio = origDpr
        chart.resize(origWidth, origHeight)
        chart.update('none')
      }

      if (formatRef.current) {
        formatRef.current.style.transform = originalTransform;
        formatRef.current.style.transformOrigin = originalTransformOrigin;
        if (formatRef.current.parentElement) {
          formatRef.current.parentElement.style.width = originalContainerWidth;
          formatRef.current.parentElement.style.height = originalContainerHeight;
        }
      }

      setIsExporting(false)
    }
  }

  if (!renderedFormat) return null

  return (
    <div className="flex flex-col h-full w-full bg-gray-50/50 absolute inset-0 z-10">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-white shadow-sm z-20">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={openGallery} className="gap-2">
            <LayoutGrid className="w-4 h-4 text-purple-600" />
            Change Format
          </Button>
          <div className="h-4 w-px bg-gray-200" />
          <span className="text-sm font-semibold text-gray-800">
            {renderedFormat.skeleton.name} Mode
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
            {renderedFormat.skeleton.dimensions.width}x{renderedFormat.skeleton.dimensions.height}
          </span>
          {(renderedFormat.skeleton.dimensions.aspect || (renderedFormat.skeleton.dimensions.width && renderedFormat.skeleton.dimensions.height)) && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700">
              {getStandardAspectRatio(
                renderedFormat.skeleton.dimensions.width,
                renderedFormat.skeleton.dimensions.height,
                renderedFormat.skeleton.dimensions.aspect
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quality Selector & Export Button */}
          <div className="inline-flex items-center rounded-md shadow-xs">
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => handleExport(selectedQuality)}
              disabled={isExporting}
              className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-r-none border-r border-blue-500 font-medium"
            >
              {isExporting ? (
                <AlertTriangle className="w-4 h-4 animate-pulse" />
              ) : selectedQuality === 4 ? (
                <Sparkles className="w-4 h-4 text-amber-300" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>
                {isExporting ? "Exporting..." : `Export (${selectedQuality === 4 ? "Crystal Clear 4x" : `${selectedQuality}x`})`}
              </span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="default"
                  size="sm"
                  disabled={isExporting}
                  className="px-2 bg-blue-600 hover:bg-blue-700 rounded-l-none"
                  title="Choose Export Quality (2x, 3x, 4x)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-1.5">
                <div className="px-2 py-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Select Export Quality
                </div>
                {QUALITY_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.scale}
                    onClick={() => {
                      setSelectedQuality(opt.scale)
                      handleExport(opt.scale)
                    }}
                    className={`flex items-start gap-2.5 p-2 rounded-md cursor-pointer transition-colors ${
                      selectedQuality === opt.scale ? 'bg-blue-50/80 text-blue-900' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {selectedQuality === opt.scale ? (
                        <Check className="w-4 h-4 text-blue-600 font-bold" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-slate-900">{opt.label}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${opt.badgeColor}`}>
                          {opt.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Button variant="ghost" size="icon" onClick={clearSelection} title="Remove format and back to standard chart">
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        </div>
      </div>

      {/* Canvas Area with Checkerboard Background */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-auto flex items-center justify-center p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+Cjxwb2x5Z29uIGZpbGw9IiNlN2U3ZTciIHBvaW50cz0iMTIgMCAwIDAgMCAxMiAxMiAxMiAxMiAyNCAyNCAyNCAyNCAxMiAxMiAxMiIvPgo8L3N2Zz4=')] shadow-inner"
      >
        <div 
          className="bg-white overflow-hidden shadow-2xl transition-all duration-200 ring-1 ring-gray-900/10 relative"
          style={{
            width: renderedFormat.skeleton.dimensions.width * scale,
            height: renderedFormat.skeleton.dimensions.height * scale
          }}
        >
            <div 
                ref={formatRef}
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left',
                    width: renderedFormat.skeleton.dimensions.width,
                    height: renderedFormat.skeleton.dimensions.height,
                }}
            >
                <FormatRenderer 
                    rendered={renderedFormat} 
                    scale={1} 
                    zoomLevel={scale}
                    interactive={true} 
                />
            </div>
        </div>
      </div>
    </div>
  )
}
