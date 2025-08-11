"use client"

import React, { useRef, useState, useEffect } from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"

import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff } from "lucide-react"
import { downloadTemplateExport } from "@/lib/template-export"
import { FileDown, FileImage, FileCode } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import ChartGenerator from "@/lib/chart_generator"

interface TemplateChartPreviewProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onToggleLeftSidebar?: () => void
  isLeftSidebarCollapsed?: boolean
}

export function TemplateChartPreview({
  onToggleSidebar,
  isSidebarCollapsed,
  onToggleLeftSidebar,
  isLeftSidebarCollapsed
}: TemplateChartPreviewProps) {
  const { currentTemplate, templateInBackground, selectedTextAreaId, setSelectedTextAreaId, editorMode } = useTemplateStore()
  const { 
    chartData, 
    chartConfig, 
    globalChartRef 
  } = useChartStore()
  const containerRef = useRef<HTMLDivElement>(null)

  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [showGuides, setShowGuides] = useState(true)
  const [isUpdatingDimensions, setIsUpdatingDimensions] = useState(false)

  // Simple centering effect when template is first loaded
  useEffect(() => {
    const template = currentTemplate || templateInBackground
    if (template && containerRef.current) {
      // Simple centering - move template to center of viewport
      const containerWidth = containerRef.current.clientWidth || 800
      const containerHeight = containerRef.current.clientHeight || 600
      
      // Calculate initial offset to center the template
      const offsetX = (containerWidth - template.width) / 2
      const offsetY = (containerHeight - template.height) / 2
      
      setPanOffset({ x: offsetX, y: offsetY })
    }
  }, [currentTemplate?.id, templateInBackground?.id]) // Only run when template ID changes

  // Handle chart dimension updates when template changes
  useEffect(() => {
    const template = currentTemplate || templateInBackground
    if (template && !isUpdatingDimensions) {
      setIsUpdatingDimensions(true)
      
      // Small delay to ensure chart dimensions are updated
      const timer = setTimeout(() => {
        setIsUpdatingDimensions(false)
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [currentTemplate?.id, templateInBackground?.id, isUpdatingDimensions])



  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1))
  const handleResetZoom = () => {
    setZoom(1)
    // Center the template when resetting
    const template = currentTemplate || templateInBackground
    if (template && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth || 800
      const containerHeight = containerRef.current.clientHeight || 600
      
      const offsetX = (containerWidth - template.width) / 2
      const offsetY = (containerHeight - template.height) / 2
      
      setPanOffset({ x: offsetX, y: offsetY })
    } else {
      setPanOffset({ x: 0, y: 0 })
    }
  }

  // Handle mouse/touch events for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    // Do not start template panning when interacting with chart canvas or text areas
    if (
      target.closest('.template-chart-area') ||
      target.closest('.template-text-area') ||
      target.tagName.toLowerCase() === 'canvas'
    ) {
      return
    }
    setIsDragging(true)
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle text area selection
  const handleTextAreaClick = (textAreaId: string) => {
    setSelectedTextAreaId(textAreaId)
  }

  // Handle export
  const handleExport = async (format: 'png' | 'jpeg' | 'html') => {
    const template = currentTemplate || templateInBackground
    const chartInstance = globalChartRef?.current
    if (!template || !chartInstance) return

    try {
      // Add a small delay to ensure chart is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const chartCanvas = chartInstance.canvas
      
      await downloadTemplateExport(
        template,
        chartCanvas,
        chartData,
        chartConfig,
        {
          format,
          fileName: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}`,
          quality: 1,
          scale: 4 // Increased scale for higher quality
        }
      )
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Calculate template dimensions and scaling
  const getTemplateDimensions = () => {
    const template = currentTemplate || templateInBackground
    if (!template) return { width: 800, height: 600, scale: 1 }
    
    const containerWidth = containerRef.current?.clientWidth || 800
    const containerHeight = containerRef.current?.clientHeight || 600
    
    // Calculate scale to fit template in container with some padding
    const padding = 40
    const availableWidth = containerWidth - padding
    const availableHeight = containerHeight - padding
    
    const scaleX = availableWidth / template.width
    const scaleY = availableHeight / template.height
    const baseScale = Math.min(scaleX, scaleY, 1) // Don't scale up beyond original size
    
    return {
      width: template.width,
      height: template.height,
      scale: baseScale * zoom
    }
  }

  const { width, height, scale } = getTemplateDimensions()

  // Render text areas
  const renderTextAreas = () => {
    const template = currentTemplate || templateInBackground
    if (!template) return null

    return template.textAreas
      .filter(textArea => textArea.visible)
      .map((textArea) => (
        <div
          key={textArea.id}
          className={`absolute template-text-area cursor-pointer transition-all duration-200 ${
            selectedTextAreaId === textArea.id 
              ? 'ring-2 ring-blue-500 ring-opacity-50' 
              : 'hover:ring-1 hover:ring-gray-300'
          }`}
          style={{
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
            whiteSpace: 'pre-wrap',
            padding: '8px',
            overflow: 'hidden',
            border: showGuides ? '1px dashed #e5e7eb' : 'none',
            backgroundColor: showGuides ? 'rgba(255, 255, 255, 0.8)' : 'transparent'
          }}
          onClick={() => handleTextAreaClick(textArea.id)}
        >
          {/* Text area type label - more subtle */}
          {showGuides && (
            <div
              className="absolute -top-3 left-0 text-xs text-gray-400 bg-white bg-opacity-90 px-1 py-0.5 rounded pointer-events-none border border-gray-200"
              style={{ fontSize: '8px', zIndex: 10 }}
            >
              {textArea.type}
            </div>
          )}
          
          {textArea.content || 'Click to edit text'}
        </div>
      ))
  }

  // Render chart area using ChartGenerator
  const renderChartArea = () => {
    const template = currentTemplate || templateInBackground
    
    if (!template || !chartData.datasets.length) {
      return null
    }

    return (
      <div
        className="absolute template-chart-area"
        style={{
          left: template.chartArea.x,
          top: template.chartArea.y,
          width: template.chartArea.width,
          height: template.chartArea.height,
          border: showGuides ? '2px solid #3b82f6' : 'none',
          backgroundColor: showGuides ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
          borderRadius: '4px'
        }}
        onMouseDown={(e) => { e.stopPropagation() }}
        onMouseMove={(e) => { e.stopPropagation() }}
        onMouseUp={(e) => { e.stopPropagation() }}
        onContextMenu={(e) => { e.stopPropagation() }}
      >
        {/* Chart area label */}
        {showGuides && (
          <div
            className="absolute -top-3 left-0 text-xs text-blue-500 bg-white bg-opacity-90 px-1 py-0.5 rounded pointer-events-none border border-blue-200"
            style={{ fontSize: '8px', zIndex: 10 }}
          >
            Chart
          </div>
        )}
        
        <ChartGenerator key={`template-${template.id}-${template.chartArea.width}-${template.chartArea.height}-${isUpdatingDimensions}`} />
      </div>
    )
  }

  // Render template background
  const renderTemplateBackground = () => {
    const template = currentTemplate || templateInBackground
    if (!template) return null

    return (
      <>
        {/* Main template background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: template.backgroundColor,
            border: `${template.borderWidth}px solid ${template.borderColor}`,
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        />
        
        {/* Grid overlay for better visual guidance */}
        {showGuides && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px',
              borderRadius: '8px'
            }}
          />
        )}
        
        {/* Template dimension indicators - more subtle */}
        {showGuides && (
          <div
            className="absolute top-1 right-1 text-xs text-gray-400 bg-white bg-opacity-80 px-1 py-0.5 rounded pointer-events-none border border-gray-200"
            style={{ fontSize: '8px', zIndex: 10 }}
          >
            {template.width}×{template.height}
          </div>
        )}
      </>
    )
  }

  const template = currentTemplate || templateInBackground
  if (!template) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Template Selected</h3>
          <p className="text-gray-600">Select a template from the Templates panel to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Template Controls */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full border border-green-200">
              Template Mode
            </span>
          </div>
          <p className="text-xs text-gray-500">Template: {template.width} × {template.height}px</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 0.1}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowGuides(!showGuides)}
            title={showGuides ? "Hide guides" : "Show guides"}
          >
            {showGuides ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="default">
                <FileDown className="h-4 w-4 mr-1" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('png')}>
                <FileImage className="h-4 w-4 mr-2" />
                PNG (High Res)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('jpeg')}>
                <FileImage className="h-4 w-4 mr-2" />
                JPEG (High Res)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('html')}>
                <FileCode className="h-4 w-4 mr-2" />
                HTML
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Template Canvas */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="relative w-full h-full overflow-auto border rounded-lg shadow-sm"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          <div
            className="relative mx-auto"
            style={{
              width: width,
              height: height,
              transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`,
              transformOrigin: 'center center'
            }}
          >
            {/* Template Background */}
            {renderTemplateBackground()}
            
            {/* Chart Area */}
            {renderChartArea()}
            
            {/* Text Areas */}
            {renderTextAreas()}
          </div>
        </div>
      </div>
    </div>
  )
} 