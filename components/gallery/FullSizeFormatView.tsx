"use client"

import React, { useMemo, useEffect, useRef, useState } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { renderFormat } from "@/lib/variant-engine"
import { FormatRenderer } from "./FormatRenderer"
import { Button } from "@/components/ui/button"
import { LayoutGrid, Download, X, AlertTriangle } from "lucide-react"
import html2canvas from "html2canvas"

export function FullSizeFormatView() {
  const { formats, contentPackage, selectedFormatId, openGallery, clearSelection, contextualImageUrl } = useFormatGalleryStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const formatRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [isExporting, setIsExporting] = useState(false)

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

  const handleExport = async () => {
    if (!formatRef.current || !renderedFormat) return
    setIsExporting(true)
    
    try {
      // Create a temporary unscaled clone for full-resolution export
      // The current visible one is scaled down to fit the screen
      const scaleTo1 = 1 / scale;
      
      // Temporarily set scale to 1 for capture
      const originalTransform = formatRef.current.style.transform;
      const originalTransformOrigin = formatRef.current.style.transformOrigin;
      const originalContainerWidth = formatRef.current.parentElement!.style.width;
      const originalContainerHeight = formatRef.current.parentElement!.style.height;

      // Make the container exact size of format
      formatRef.current.parentElement!.style.width = `${renderedFormat.skeleton.dimensions.width}px`;
      formatRef.current.parentElement!.style.height = `${renderedFormat.skeleton.dimensions.height}px`;
      
      // Remove any scaling on inner format
      formatRef.current.style.transform = 'none';
      
      // We must wait a tick for layout shifts
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(formatRef.current, {
        scale: 2, // 2x resolution for export
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      })

      // Restore scale visually
      formatRef.current.style.transform = originalTransform;
      formatRef.current.style.transformOrigin = originalTransformOrigin;
      formatRef.current.parentElement!.style.width = originalContainerWidth;
      formatRef.current.parentElement!.style.height = originalContainerHeight;

      // Download
      const link = document.createElement("a")
      link.download = `chart-${renderedFormat.skeleton.name.toLowerCase().replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } catch (err) {
      console.error("Export failed:", err)
      alert("Failed to export image. Try again.")
    } finally {
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
        </div>
        <div className="flex items-center gap-2">
          {/* HTML2Canvas note: Charts might take a second to render cleanly */}
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleExport}
            disabled={isExporting}
            className="gap-2 bg-blue-600 hover:bg-blue-700"
          >
            {isExporting ? <AlertTriangle className="w-4 h-4 animate-pulse" /> : <Download className="w-4 h-4" />}
            {isExporting ? "Exporting..." : "Export Image"}
          </Button>
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
                    interactive={true} 
                />
            </div>
        </div>
      </div>
    </div>
  )
}
