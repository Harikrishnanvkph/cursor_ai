"use client"

import React, { useRef, useState, useEffect } from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useHistoryStore } from "@/lib/history-store"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Ellipsis, Maximize2, Minimize2, Settings, Menu, X, ChevronLeft, Download, Hand, Pencil, Check, Loader2 } from "lucide-react"
import { downloadTemplateExport } from "@/lib/template-export"
import { FileDown, FileImage, FileCode } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Sidebar } from "@/components/sidebar"
import { ConfigPanel } from "@/components/config-panel"
import { SidebarPortalProvider } from "@/components/sidebar-portal-context"
import { SidebarContainer } from "@/components/sidebar-container"
import { dataService } from "@/lib/data-service"
import { toast } from "sonner"

import ChartGenerator from "@/lib/chart_generator"

interface TemplateChartPreviewProps {
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onToggleLeftSidebar?: () => void
  isLeftSidebarCollapsed?: boolean
  activeTab?: string
  onTabChange?: (tab: string) => void
  onNewChart?: () => void
}

export function TemplateChartPreview({
  onToggleSidebar,
  isSidebarCollapsed,
  onToggleLeftSidebar,
  isLeftSidebarCollapsed,
  activeTab,
  onTabChange,
  onNewChart
}: TemplateChartPreviewProps) {
  const { currentTemplate, templateInBackground, selectedTextAreaId, setSelectedTextAreaId, editorMode, setEditorMode, contentTypePreferences } = useTemplateStore()
  const {
    chartData,
    chartConfig,
    globalChartRef,
    chartType,
    setChartType,
    updateChartConfig
  } = useChartStore()
  const { backendConversationId } = useChatStore()
  const { conversations, updateConversation } = useHistoryStore()

  // Get the current chart title from history
  const currentConversation = backendConversationId
    ? conversations.find(c => c.id === backendConversationId)
    : null
  const chartTitle = currentConversation?.title || null
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const pendingTabRef = useRef<string | null>(null)
  const leftSidebarPanelRef = useRef<HTMLDivElement>(null)
  const rightSidebarPanelRef = useRef<HTMLDivElement>(null)

  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [showGuides, setShowGuides] = useState(true)
  const [isUpdatingDimensions, setIsUpdatingDimensions] = useState(false)
  const [panMode, setPanMode] = useState(false)

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showLeftOverlay, setShowLeftOverlay] = useState(false)
  const [showRightOverlay, setShowRightOverlay] = useState(false)
  const [fullscreenActiveTab, setFullscreenActiveTab] = useState(activeTab || "templates")

  // Rename state
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [isSavingRename, setIsSavingRename] = useState(false)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Sync fullscreenActiveTab with activeTab prop
  useEffect(() => {
    if (activeTab) {
      setFullscreenActiveTab(activeTab)
    }
  }, [activeTab])

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [isRenaming])

  // Start renaming
  const handleStartRename = () => {
    if (chartTitle && backendConversationId) {
      setRenameValue(chartTitle)
      setIsRenaming(true)
    }
  }

  // Handle chart type change with legendType update
  const handleChartTypeChange = (type: string) => {
    setChartType(type as any);

    // Set the correct legendType based on chart type
    // Pie, Doughnut, Polar Area use 'slice', all others use 'dataset'
    const newLegendType = (type === 'pie' || type === 'doughnut' || type === 'polarArea') ? 'slice' : 'dataset';
    updateChartConfig({
      ...chartConfig,
      plugins: {
        ...chartConfig.plugins,
        legendType: newLegendType
      }
    } as any);
  };

  // Save rename
  const handleSaveRename = async () => {
    if (!renameValue.trim() || !backendConversationId || renameValue === chartTitle) {
      setIsRenaming(false)
      return
    }

    setIsSavingRename(true)
    try {
      const result = await dataService.updateConversation(backendConversationId, { title: renameValue.trim() })
      if (result.error) throw new Error(result.error)

      updateConversation(backendConversationId, { title: renameValue.trim() })
      toast.success("Title updated")
      setIsRenaming(false)
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Failed to update title")
    } finally {
      setIsSavingRename(false)
    }
  }

  // Handle key press in rename input
  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
    }
  }

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
  }, [currentTemplate?.id, templateInBackground?.id]) // Removed isUpdatingDimensions to prevent infinite loop

  // Handle fullscreen functionality
  const handleFullscreen = async () => {
    if (!fullscreenContainerRef.current) return

    const container = fullscreenContainerRef.current

    try {
      if (!document.fullscreenElement) {
        // Enter fullscreen
        await container.requestFullscreen()
        setIsFullscreen(true)

        // Trigger chart dimension update after a delay to ensure fullscreen layout is complete
        setTimeout(() => {
          setIsUpdatingDimensions(true)

          // If chart exists, adjust canvas for high-DPI
          if (globalChartRef?.current) {
            const canvas = globalChartRef.current.canvas
            const dpr = window.devicePixelRatio || 1
            const rect = container.getBoundingClientRect()

            canvas.style.width = '100%'
            canvas.style.height = '100%'
            canvas.style.objectFit = 'contain'

            canvas.width = rect.width * dpr
            canvas.height = rect.height * dpr

            globalChartRef.current.resize()
            globalChartRef.current.render()
          }

          // Reset updating flag after chart has resized
          setTimeout(() => {
            setIsUpdatingDimensions(false)
          }, 100)
        }, 100)
      } else {
        // Exit fullscreen
        await document.exitFullscreen()
        setIsFullscreen(false)

        // Trigger chart dimension update after a delay
        setTimeout(() => {
          setIsUpdatingDimensions(true)

          // Reset chart canvas if it exists
          if (globalChartRef?.current) {
            const canvas = globalChartRef.current.canvas
            canvas.style.width = ''
            canvas.style.height = ''
            canvas.style.objectFit = ''

            globalChartRef.current.resize()
            globalChartRef.current.render()
          }

          // Reset updating flag
          setTimeout(() => {
            setIsUpdatingDimensions(false)
          }, 100)
        }, 100)
      }
    } catch (err) {
      console.error('Error toggling fullscreen:', err)
    }
  }

  // Handle fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement
      setIsFullscreen(isNowFullscreen)
      // Close overlays when exiting fullscreen
      if (!isNowFullscreen) {
        setShowLeftOverlay(false)
        setShowRightOverlay(false)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // When exiting fullscreen, apply any pending tab change to parent
  useEffect(() => {
    if (!isFullscreen && pendingTabRef.current && onTabChange) {
      onTabChange(pendingTabRef.current)
      pendingTabRef.current = null
    }
  }, [isFullscreen, onTabChange])



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
    // Only allow panning when pan mode is active
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

    // Helper to map imageFit values to CSS background-size
    const getBackgroundSize = (fit?: string): string => {
      switch (fit) {
        case 'fill':
          return '100% 100%' // Stretch to fill
        case 'contain':
          return 'contain' // Fit inside
        case 'cover':
          return 'cover' // Cover entire area
        case 'none':
          return 'auto' // Original size
        case 'scale-down':
          return 'auto' // Original size (CSS doesn't have scale-down for backgrounds)
        default:
          return 'cover'
      }
    }

    return template.textAreas
      .filter(textArea => textArea.visible)
      .map((textArea) => {
        // Check both textArea.contentType AND persisted contentTypePreferences
        const isHTML = textArea.contentType === 'html' || contentTypePreferences[textArea.id] === 'html'

        // Helper to convert hex color to rgba with opacity
        const hexToRgba = (hex: string, opacity: number): string => {
          // Remove # if present
          hex = hex.replace('#', '')

          // Parse hex values
          const r = parseInt(hex.substring(0, 2), 16)
          const g = parseInt(hex.substring(2, 4), 16)
          const b = parseInt(hex.substring(4, 6), 16)

          return `rgba(${r}, ${g}, ${b}, ${opacity})`
        }

        // Generate background style based on background settings
        const getBackgroundStyle = (): React.CSSProperties => {
          const bg = textArea.background
          if (!bg || bg.type === 'transparent') {
            return {
              backgroundColor: showGuides ? 'rgba(255, 255, 255, 0.8)' : 'transparent'
            }
          }

          const opacity = (bg.opacity ?? 100) / 100

          if (bg.type === 'color') {
            // Use rgba to apply opacity only to background, not text
            const color = bg.color || '#ffffff'
            return {
              backgroundColor: hexToRgba(color, opacity)
            }
          }

          if (bg.type === 'gradient') {
            const color1 = bg.gradientColor1 || '#ffffff'
            const color2 = bg.gradientColor2 || '#000000'
            const gradientType = bg.gradientType || 'linear'
            const direction = bg.gradientDirection || 'to right'

            // Apply opacity to gradient colors themselves
            const rgbaColor1 = hexToRgba(color1, opacity)
            const rgbaColor2 = hexToRgba(color2, opacity)

            if (gradientType === 'radial') {
              return {
                backgroundImage: `radial-gradient(circle, ${rgbaColor1}, ${rgbaColor2})`
              }
            } else {
              return {
                backgroundImage: `linear-gradient(${direction}, ${rgbaColor1}, ${rgbaColor2})`
              }
            }
          }

          if (bg.type === 'image' && bg.imageUrl) {
            // For images, we need to use a workaround with linear-gradient overlay
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

          return { backgroundColor: 'transparent' }
        }

        const backgroundStyle = getBackgroundStyle()

        const baseStyle: React.CSSProperties = {
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
          wordBreak: 'break-word' as const,
          whiteSpace: isHTML ? 'normal' : 'pre-wrap',
          padding: '8px',
          // overflow is now handled by CSS class .template-text-area for smart scrollbar behavior
          border: showGuides ? '1px dashed #e5e7eb' : 'none',
          ...backgroundStyle
        }

        return (
          <div
            key={textArea.id}
            className={`absolute template-text-area transition-all duration-200 ${selectedTextAreaId === textArea.id
              ? 'ring-2 ring-blue-500 ring-opacity-50'
              : 'hover:ring-1 hover:ring-gray-300'
              }`}
            style={{
              ...baseStyle,
              cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer'
            }}
            onMouseDown={(e) => { if (!panMode) e.stopPropagation() }}
            onMouseMove={(e) => { if (!panMode) e.stopPropagation() }}
            onMouseUp={(e) => { if (!panMode) e.stopPropagation() }}
            onClick={() => handleTextAreaClick(textArea.id)}
          >
            {/* Text area type label - more subtle */}
            {showGuides && (
              <div
                className="absolute -top-3 left-0 text-xs text-gray-400 bg-white bg-opacity-90 px-1 py-0.5 rounded pointer-events-none border border-gray-200"
                style={{ fontSize: '8px', zIndex: 10 }}
              >
                {textArea.type} {isHTML ? '(HTML)' : ''}
              </div>
            )}

            {/* Render HTML or plain text based on contentType */}
            {isHTML ? (
              <div
                dangerouslySetInnerHTML={{ __html: textArea.content || 'Click to edit HTML' }}
                style={{
                  width: '100%',
                  height: '100%',
                  // Inherit text styling from template settings
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 'inherit',
                  color: 'inherit',
                  textAlign: 'inherit',
                  lineHeight: 'inherit',
                  letterSpacing: 'inherit'
                }}
                className="html-content-area"
              />
            ) : (
              textArea.content || 'Click to edit text'
            )}
          </div>
        )
      })
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
          borderRadius: '4px',
          cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
        onMouseDown={(e) => { if (!panMode) e.stopPropagation() }}
        onMouseMove={(e) => { if (!panMode) e.stopPropagation() }}
        onMouseUp={(e) => { if (!panMode) e.stopPropagation() }}
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

        <div style={{ pointerEvents: panMode ? 'none' : 'auto', width: '100%', height: '100%' }}>
          <ChartGenerator key={`template-${template.id}-${template.chartArea.width}-${template.chartArea.height}-${isUpdatingDimensions}`} />
        </div>
      </div>
    )
  }

  // Render template background
  const renderTemplateBackground = () => {
    const template = currentTemplate || templateInBackground
    if (!template) return null

    // Helper to map imageFit values to CSS background-size
    const getBackgroundSize = (fit?: string): string => {
      switch (fit) {
        case 'fill':
          return '100% 100%' // Stretch to fill
        case 'contain':
          return 'contain' // Fit inside
        case 'cover':
          return 'cover' // Cover entire area
        case 'none':
          return 'auto' // Original size
        case 'scale-down':
          return 'auto' // Original size (CSS doesn't have scale-down for backgrounds)
        default:
          return 'cover'
      }
    }

    // Helper to convert hex color to rgba with opacity
    const hexToRgba = (hex: string, opacity: number): string => {
      // Remove # if present
      hex = hex.replace('#', '')

      // Parse hex values
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)

      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }

    // Generate template background style
    const getTemplateBackgroundStyle = (): React.CSSProperties => {
      const bg = template.background

      // Default to solid color if no background is set
      if (!bg || bg.type === 'transparent') {
        return {
          backgroundColor: template.backgroundColor || '#ffffff'
        }
      }

      const opacity = (bg.opacity ?? 100) / 100

      if (bg.type === 'color') {
        // Use rgba to apply opacity only to background
        const color = bg.color || '#ffffff'
        return {
          backgroundColor: hexToRgba(color, opacity)
        }
      }

      if (bg.type === 'gradient') {
        const color1 = bg.gradientColor1 || '#ffffff'
        const color2 = bg.gradientColor2 || '#000000'
        const gradientType = bg.gradientType || 'linear'
        const direction = bg.gradientDirection || 'to right'

        // Apply opacity to gradient colors themselves
        const rgbaColor1 = hexToRgba(color1, opacity)
        const rgbaColor2 = hexToRgba(color2, opacity)

        if (gradientType === 'radial') {
          return {
            backgroundImage: `radial-gradient(circle, ${rgbaColor1}, ${rgbaColor2})`
          }
        } else {
          return {
            backgroundImage: `linear-gradient(${direction}, ${rgbaColor1}, ${rgbaColor2})`
          }
        }
      }

      if (bg.type === 'image' && bg.imageUrl) {
        // For images, we need to use a workaround with linear-gradient overlay
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

      return {
        backgroundColor: template.backgroundColor || '#ffffff'
      }
    }

    const backgroundStyle = getTemplateBackgroundStyle()

    return (
      <>
        {/* Main template background */}
        <div
          className="absolute inset-0"
          style={{
            ...backgroundStyle,
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
    <div className="flex flex-col h-full" ref={fullscreenContainerRef}>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-white z-40" />
      )}
      {/* Template Controls */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 max-w-[500px]">
          {/* Chart Title (from history) - Primary heading with edit */}
          {chartTitle && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <button
                onClick={handleStartRename}
                className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                title="Rename"
              >
                <Pencil className="h-3 w-3" />
              </button>
              <div className="flex items-center gap-1 flex-1">
                {isRenaming ? (
                  <>
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={() => setIsRenaming(false)}
                      className="flex-1 font-semibold text-gray-900 text-base bg-transparent border-b-2 border-blue-400 outline-none w-full"
                      disabled={isSavingRename}
                    />
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={handleSaveRename}
                      disabled={isSavingRename}
                      className="p-0.5 hover:bg-green-50 rounded text-green-600 flex-shrink-0"
                      title="Save"
                    >
                      {isSavingRename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                  </>
                ) : (
                  <h4 className="font-semibold text-gray-900 text-base truncate border-b-2 border-transparent" title={chartTitle}>{chartTitle}</h4>
                )}
              </div>
            </div>
          )}
          {/* Toggle and Dimensions row */}
          <div className="flex items-center gap-2">
            {/* Chart/Template Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 border border-gray-200">
              <button
                onClick={() => setEditorMode('chart')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${editorMode === 'chart'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Chart
              </button>
              <button
                onClick={() => setEditorMode('template')}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-full transition-all ${editorMode === 'template'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                Template
              </button>
            </div>
            {/* Compact Chart Type Selector */}
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger className="h-6 w-[90px] text-[10px] px-2 py-0 border-gray-200 bg-white">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar" className="text-xs">Bar</SelectItem>
                <SelectItem value="horizontalBar" className="text-xs">H. Bar</SelectItem>
                <SelectItem value="stackedBar" className="text-xs">Stacked</SelectItem>
                <SelectItem value="line" className="text-xs">Line</SelectItem>
                <SelectItem value="area" className="text-xs">Area</SelectItem>
                <SelectItem value="pie" className="text-xs">Pie</SelectItem>
                <SelectItem value="doughnut" className="text-xs">Doughnut</SelectItem>
                <SelectItem value="radar" className="text-xs">Radar</SelectItem>
                <SelectItem value="polarArea" className="text-xs">Polar</SelectItem>
                <SelectItem value="scatter" className="text-xs">Scatter</SelectItem>
                <SelectItem value="bubble" className="text-xs">Bubble</SelectItem>
              </SelectContent>
            </Select>
            {/* Template dimensions */}
            <span className="text-xs text-gray-400">{template.width} × {template.height}px</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom Controls - Compact grouped style */}
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
              <DropdownMenuItem onClick={handleResetZoom}>
                <RotateCcw className="h-4 w-4 mr-2" />
                <span>Reset Zoom</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowGuides(!showGuides)}>
                {showGuides ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                <span>{showGuides ? "Hide Guides" : "Show Guides"}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleFullscreen}>
                <Maximize2 className="h-4 w-4 mr-2" />
                <span>Fullscreen</span>
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
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  // Expand the left sidebar if it's collapsed
                  if (onToggleLeftSidebar && isLeftSidebarCollapsed) {
                    onToggleLeftSidebar();
                  }
                  // Trigger custom event to change active tab to export
                  const event = new CustomEvent('changeActiveTab', { detail: { tab: 'export' } });
                  window.dispatchEvent(event);
                }}
                className="bg-blue-50 hover:bg-blue-100"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Template Canvas */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className={`relative w-full h-full overflow-auto border rounded-lg shadow-sm${isFullscreen ? ' fixed inset-4 z-50 m-0' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default'
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
              onClick={() => handleExport('png')}
              title="Download PNG"
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
                  <div ref={leftSidebarPanelRef} className="w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col h-full relative z-[61]">
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
                          setFullscreenActiveTab(tab)
                          setShowRightOverlay(true) // Auto-open right panel when tab is selected

                          if (isFullscreen) {
                            pendingTabRef.current = tab
                          } else if (onTabChange) {
                            onTabChange(tab)
                          }
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
                  <div ref={rightSidebarPanelRef} className="w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col h-full relative z-[71]">
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
                            setShowRightOverlay(false)
                            setShowLeftOverlay(false)
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
                          setFullscreenActiveTab(tab)
                          if (isFullscreen) {
                            pendingTabRef.current = tab
                          } else if (onTabChange) {
                            onTabChange(tab)
                          }
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