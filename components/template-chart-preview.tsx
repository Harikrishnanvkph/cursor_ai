"use client"

import React, { useRef, useState, useEffect } from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useChatStore } from "@/lib/chat-store"
import { useHistoryStore } from "@/lib/history-store"

import { Button } from "@/components/ui/button"
import { UndoRedoButtons } from "@/components/ui/undo-redo-buttons"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Ellipsis, Maximize2, Minimize2, Settings, Menu, X, ChevronLeft, Download, Hand, Pencil, Check, Loader2, ChartColumn, RulerDimensionLine } from "lucide-react"
import { downloadTemplateExport, downloadFormatExport } from "@/lib/template-export"
import { FileDown, FileImage, FileCode } from "lucide-react"
import html2canvas from 'html2canvas'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sidebar } from "@/components/sidebar"
import { ConfigPanel } from "@/components/config-panel"
import { SidebarPortalProvider } from "@/components/sidebar-portal-context"
import { SidebarContainer } from "@/components/sidebar-container"
import { dataService } from "@/lib/data-service"
import { toast } from "sonner"
import {
  useChartData,
  useChartConfig,
  useGlobalChartRef,
  useChartType,
  useChartTitle,
  useChartMode,
  useActiveDatasetIndex,
  useActiveGroupId,
  useChartGroups
} from "@/lib/hooks/use-chart-state"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { getPatternCSS } from "@/lib/utils"
import { renderFormat } from "@/lib/variant-engine"
import { FormatRenderer } from "@/components/gallery/FormatRenderer"

import ChartGenerator from "@/lib/chart_generator"
import { useUIStore } from "@/lib/stores/ui-store"
import { DecorationShapeRenderer } from "@/components/decorations/DecorationShapeRenderer"
import { useDecorationStore } from "@/lib/stores/decoration-store"

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
  const { selectedFormatId, contentPackage, formats, userFormats, contextualImageUrl } = useFormatGalleryStore()

  const renderedFormat = React.useMemo(() => {
    if (!selectedFormatId || !contentPackage) return null
    
    // Search both official formats and user's custom formats
    const allFormats = [...formats, ...userFormats]
    const format = allFormats.find(f => f.id === selectedFormatId)
    
    if (!format) return null
    return renderFormat(format, contentPackage, undefined, contextualImageUrl || undefined)
  }, [selectedFormatId, contentPackage, formats, userFormats, contextualImageUrl])

  // Granular hooks
  const chartData = useChartData()
  const chartConfig = useChartConfig()
  const globalChartRef = useGlobalChartRef()
  const chartType = useChartType()
  const globalTitle = useChartTitle()
  const chartMode = useChartMode()
  const activeDatasetIndex = useActiveDatasetIndex()
  const activeGroupId = useActiveGroupId()
  const groups = useChartGroups()

  const { setChartType, setActiveGroup } = useChartActions()
  const setChartTitle = useChartStore(s => s.setChartTitle)

  // Derive targetId for editing
  // Default to null - we ONLY want to enable editing if the active item has a proven sourceId
  let targetId: string | null = null;

  if (chartMode === 'single' && chartData.datasets?.[activeDatasetIndex]?.sourceId) {
    targetId = chartData.datasets[activeDatasetIndex].sourceId!;
  } else if (chartMode === 'grouped' && activeGroupId && groups) {
    const activeGroup = groups.find(g => activeGroupId === g.id);
    if (activeGroup?.sourceId) {
      targetId = activeGroup.sourceId;
    }
  }

  // Only allow editing if we have a valid target ID (implying the chart is saved/cloud-aware)
  const canEditTitle = !!targetId;

  // Derive title logic
  let displayTitle = globalTitle || "Untitled Chart";

  if (chartMode === 'grouped' && activeGroupId && groups) {
    const activeGroup = groups.find(g => g.id === activeGroupId);
    if (activeGroup?.name || activeGroup?.sourceTitle) {
      displayTitle = activeGroup.name || activeGroup.sourceTitle!;
    }
  } else if (chartMode === 'single' && chartData.datasets.length > 0) {
    const activeDs = chartData.datasets[activeDatasetIndex];
    // Explicitly handle local single-mode datasets: default to "Untitled Chart" if no sourceTitle
    displayTitle = activeDs?.sourceTitle || "Untitled Chart";
  }


  const chartTitle = displayTitle;

  const { backendConversationId } = useChatStore()
  const { conversations, updateConversation } = useHistoryStore()
  const { drawingMode } = useDecorationStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  const pendingTabRef = useRef<string | null>(null)
  const leftSidebarPanelRef = useRef<HTMLDivElement>(null)
  const rightSidebarPanelRef = useRef<HTMLDivElement>(null)
  const exportCanvasRef = useRef<HTMLDivElement>(null)

  const [zoom, setZoom] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [showGuides, setShowGuides] = useState(false)
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
    if (!canEditTitle) return;
    setRenameValue(chartTitle || "")
    setIsRenaming(true)
    setTimeout(() => {
      renameInputRef.current?.focus()
    }, 0)
  }

  // Handle chart type change
  const handleChartTypeChange = (type: string) => {
    setChartType(type as any);
  };

  // Save rename
  const handleSaveRename = async () => {
    if (!renameValue.trim() || renameValue === chartTitle) {
      setIsRenaming(false)
      return
    }



    setIsSavingRename(true)
    try {
      setChartTitle(renameValue.trim())

      // Optimistically update history store
      updateConversation(targetId, { title: renameValue.trim() })

      try {
        const result = await dataService.updateConversation(targetId, { title: renameValue.trim() })
        if (result.error) throw new Error(result.error)
        toast.success("Title updated")
      } catch (error) {
        console.error("Rename error:", error)
        toast.error("Failed to update title backend")
      }

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

  // Reset pan offset when template changes (mx-auto on the layout wrapper
  // handles visual centering; panOffset is only for user-initiated panning)
  useEffect(() => {
    setPanOffset({ x: 0, y: 0 })
  }, [currentTemplate?.id, templateInBackground?.id, selectedFormatId])



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
    setPanOffset({ x: 0, y: 0 })
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
    const dateStr = new Date().toISOString().slice(0, 10)

    // ── Format mode export ──────────────────────
    if (renderedFormat) {
      if (format === 'html') {
        try {
          const decorationShapes = useDecorationStore.getState().shapes
          await downloadFormatExport(
            renderedFormat,
            decorationShapes,
            {
              fileName: `${renderedFormat.skeleton.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`
            }
          )
        } catch (error) {
          console.error('Format HTML export failed:', error)
        }
      } else {
        // Image export for format mode — capture the preview via html2canvas
        try {
          const target = exportCanvasRef.current
          if (!target) { console.error('Export target not found'); return }

          // Temporarily strip CSS transforms so html2canvas captures at native size
          const origTransform = target.style.transform
          const origTransformOrigin = target.style.transformOrigin
          target.style.transform = 'none'
          target.style.transformOrigin = 'top left'

          await new Promise(resolve => setTimeout(resolve, 100))

          const canvas = await html2canvas(target, {
            scale: 4,
            backgroundColor: null,
            useCORS: true,
            allowTaint: true,
            width: renderedFormat.skeleton.dimensions.width,
            height: renderedFormat.skeleton.dimensions.height,
            logging: false,
          })

          // Restore transforms
          target.style.transform = origTransform
          target.style.transformOrigin = origTransformOrigin

          const dataUrl = canvas.toDataURL(`image/${format}`, 1)
          const link = document.createElement('a')
          link.href = dataUrl
          link.download = `${renderedFormat.skeleton.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}.${format}`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } catch (error) {
          console.error('Format image export failed:', error)
        }
      }
      return
    }

    // ── Template mode export ────────────────────
    const template = currentTemplate || templateInBackground
    const chartInstance = globalChartRef?.current
    if (!template || !chartInstance) return

    try {
      await new Promise(resolve => setTimeout(resolve, 100))
      const chartCanvas = chartInstance.canvas

      await downloadTemplateExport(
        template,
        chartCanvas,
        chartData,
        chartConfig,
        {
          format,
          fileName: `${template.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
          quality: 1,
          scale: 4
        }
      )
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  // Calculate template dimensions and scaling
  const getTemplateDimensions = () => {
    if (renderedFormat) {
      const formatW = renderedFormat.skeleton.dimensions.width
      const formatH = renderedFormat.skeleton.dimensions.height

      const containerWidth = containerRef.current?.clientWidth || 800
      const containerHeight = containerRef.current?.clientHeight || 600
      const padding = 40
      const availableWidth = containerWidth - padding
      const availableHeight = containerHeight - padding

      const scaleX = availableWidth / formatW
      const scaleY = availableHeight / formatH
      const baseScale = Math.min(scaleX, scaleY, 1)

      return {
        width: formatW,
        height: formatH,
        scale: baseScale * zoom
      }
    }

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
        // All text areas are always rendered as HTML
        const isHTML = true

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

          if (bg.type === 'pattern') {
            const patternColor = bg.patternColor || '#e2e8f0'
            const patternType = bg.patternType || 'dots'
            const rgbaColor = hexToRgba(patternColor, opacity)
            const { backgroundImage, backgroundSize, backgroundRepeat } = getPatternCSS(patternType, rgbaColor, 1)
            return {
              backgroundImage,
              backgroundSize,
              backgroundRepeat
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
              cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
              pointerEvents: drawingMode === 'marquee-select' ? 'none' : 'auto'
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
          cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default',
          pointerEvents: drawingMode === 'marquee-select' ? 'none' : 'auto'
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

        <div style={{ pointerEvents: (panMode || drawingMode === 'marquee-select') ? 'none' : 'auto', width: '100%', height: '100%' }}>
          <ChartGenerator key={`template-${template.id}-${template.chartArea.width}-${template.chartArea.height}`} />
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

      if (bg.type === 'pattern') {
        const patternColor = bg.patternColor || '#e2e8f0'
        const patternType = bg.patternType || 'dots'
        const rgbaColor = hexToRgba(patternColor, opacity)
        const { backgroundImage, backgroundSize, backgroundRepeat } = getPatternCSS(patternType, rgbaColor, 1)
        return {
          backgroundImage,
          backgroundSize,
          backgroundRepeat
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
  if (!template && !renderedFormat) {
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
      <div className="flex-shrink-0 mb-1">
        <div className="flex items-center justify-between flex-wrap gap-1 px-1">
          {/* Left: title + chart info */}
          <div className="min-w-0 flex-1">
            {chartTitle && (
              <div className="flex items-center gap-1.5 mb-0 min-w-0">
                {canEditTitle && (
                  <button onClick={handleStartRename} className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0" title="Rename">
                    <Pencil className="h-3 w-3" />
                  </button>
                )}
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  {isRenaming && canEditTitle ? (
                    <>
                      <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={handleRenameKeyDown}
                        onBlur={() => setIsRenaming(false)}
                        className="flex-1 min-w-0 font-semibold text-gray-900 text-sm bg-transparent border-b-2 border-blue-400 outline-none w-full text-ellipsis overflow-hidden whitespace-nowrap px-0 pb-0.5 focus:border-blue-500"
                        disabled={isSavingRename}
                      />
                      <button onMouseDown={(e) => e.preventDefault()} onClick={handleSaveRename} disabled={isSavingRename} className="p-0.5 hover:bg-green-50 rounded text-green-600 flex-shrink-0" title="Save">
                        {isSavingRename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                      </button>
                    </>
                  ) : (
                    <h4 className="font-semibold text-gray-900 text-sm truncate border-b-2 border-transparent" title={chartTitle}>{chartTitle}</h4>
                  )}
                </div>
              </div>
            )}

            {/* Toggle and Dimensions row */}
            <div className="flex items-center gap-1 mt-0.5">
              {/* Chart/Template Mode Toggle */}
              <div className="flex items-center gap-0 bg-gray-100 rounded-full p-[2px] border border-gray-200">
                <button
                  onClick={() => setEditorMode('chart')}
                  className={`px-2 py-0.5 text-[10px] min-w-[50px] font-medium rounded-full transition-all ${editorMode === 'chart'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Chart
                </button>
                <button
                  onClick={() => setEditorMode('template')}
                  className={`px-2 py-0.5 text-[10px] min-w-[50px] font-medium rounded-full transition-all ${editorMode === 'template'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  Template
                </button>
              </div>
              {/* Compact Chart Type Selector */}
              <Select value={chartType} onValueChange={handleChartTypeChange}>
                <SelectTrigger className="h-6 w-9 lg:w-[90px] text-[10px] px-1 lg:px-2 py-0 border-gray-200 bg-white shadow-none">
                  <ChartColumn className="h-3.5 w-3.5 lg:hidden text-slate-600 shrink-0 stroke-[2.5]" />
                  <div className="hidden lg:block truncate"><SelectValue placeholder="Type" /></div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar" className="text-xs">Bar</SelectItem>
                  <SelectItem value="horizontalBar" className="text-xs">H. Bar</SelectItem>
                  <SelectItem value="stackedBar" className="text-xs">Stacked</SelectItem>
                  <SelectItem value="line" className="text-xs">Line</SelectItem>
                  <SelectItem value="area" className="text-xs">Area</SelectItem>
                  <SelectItem value="pie" className="text-xs">Pie</SelectItem>
                  <SelectItem value="pie3d" className="text-xs">3D Pie</SelectItem>
                  <SelectItem value="doughnut3d" className="text-xs">3D Doughnut</SelectItem>
                  <SelectItem value="bar3d" className="text-xs">3D Bar</SelectItem>
                  <SelectItem value="horizontalBar3d" className="text-xs">3D Horizontal Bar</SelectItem>
                  <SelectItem value="doughnut3d" className="text-xs">3D Doughnut</SelectItem>
                  <SelectItem value="radar" className="text-xs">Radar</SelectItem>
                  <SelectItem value="polarArea" className="text-xs">Polar</SelectItem>
                  <SelectItem value="scatter" className="text-xs">Scatter</SelectItem>
                  <SelectItem value="bubble" className="text-xs">Bubble</SelectItem>
                </SelectContent>
              </Select>
              {renderedFormat ? (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded cursor-help transition-colors">
                        <RulerDimensionLine className="w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs font-medium">
                      {renderedFormat.skeleton.dimensions.width} × {renderedFormat.skeleton.dimensions.height}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : template ? (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded cursor-help transition-colors">
                        <RulerDimensionLine className="w-4 h-4" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" sideOffset={5} className="z-[100] text-xs font-medium">
                      {template.width} × {template.height}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex gap-1 flex-shrink-0 ml-4">
            <div className="flex items-center gap-0.5 border border-slate-200 rounded-md p-0.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
              <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.1} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 disabled:opacity-30" title="Zoom Out">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-slate-600 min-w-[45px] px-1 text-center font-medium select-none">{Math.round(zoom * 100)}%</span>
              <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 3} className="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 disabled:opacity-30" title="Zoom In">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

              <Button variant="ghost" size="sm" onClick={() => setPanMode(!panMode)} className={`h-7 w-7 p-0 transition-colors text-slate-600 ${panMode ? 'bg-slate-200 shadow-inner' : 'hover:bg-slate-100'}`} title={panMode ? "Disable Pan Mode" : "Enable Pan Mode"}>
                <Hand className="h-4 w-4" />
              </Button>

              <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100" title="Actions"><Ellipsis className="h-4 w-4" /></Button>
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

              <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-600 hover:bg-slate-100" title="Export"><Download className="h-4 w-4" /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('png')}><FileImage className="h-4 w-4 mr-2" /> Image (PNG)</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('html')}><FileCode className="h-4 w-4 mr-2" /> HTML</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    if (onToggleLeftSidebar && isLeftSidebarCollapsed) onToggleLeftSidebar();
                    window.dispatchEvent(new CustomEvent('changeActiveTab', { detail: { tab: 'export' } }));
                  }} className="bg-blue-50 hover:bg-blue-100"><Settings className="h-4 w-4 mr-2" /> Settings</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-[1px] h-4 bg-slate-200 mx-0.5 lg:mx-1" />

              <UndoRedoButtons variant="ghost" size="sm" showLabels={false} className="gap-0.5" buttonClassName="h-7 w-7 p-0 hover:bg-slate-100 text-slate-600 hover:scale-100" />
            </div>
          </div>
        </div>
      </div>

      {/* Template Canvas */}
      <div className="flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className={`relative w-full h-full overflow-auto border rounded-lg shadow-sm flex items-center justify-center${isFullscreen ? ' fixed inset-4 z-50 m-0' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            cursor: panMode ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          {/* Layout wrapper — sized to the scaled template so the scrollable
              area matches the visual size (CSS transform doesn't affect layout). */}
          <div
            className="relative mx-auto"
            style={{
              width: width * scale,
              height: height * scale,
            }}
          >
          <div
            ref={exportCanvasRef}
            className="absolute top-0 left-0"
            style={{
              width: width,
              height: height,
              transform: `scale(${scale}) translate(${panOffset.x / scale}px, ${panOffset.y / scale}px)`,
              transformOrigin: 'top left'
            }}
          >


            {renderedFormat ? (
              <>
                <FormatRenderer
                  rendered={renderedFormat}
                  scale={1}
                  interactive={true}
                  panMode={panMode}
                />
                {/* Decoration Shapes Layer (format mode) */}
                <DecorationShapeRenderer
                  containerWidth={width}
                  containerHeight={height}
                  panMode={panMode}
                />
              </>
            ) : (
              <>
                {/* Template Background */}
                {renderTemplateBackground()}

                {/* Chart Area */}
                {renderChartArea()}

                {/* Text Areas */}
                {renderTextAreas()}

                {/* Decoration Shapes Layer (template mode) */}
                <DecorationShapeRenderer
                  containerWidth={width}
                  containerHeight={height}
                  panMode={panMode}
                />
              </>
            )}
          </div>
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
              className="fixed top-4 left-4 z-50 bg-white rounded-xl shadow-xl border border-gray-300 hover:shadow-2xl hover:border-gray-400 transition-all duration-200 h-11 w-11"
              title="Open Options"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </Button>
          )}

          {/* Top Right Toolbar */}
          <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-2 flex gap-2 border border-gray-200 animate-in fade-in duration-200">
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
                    className="flex-1 bg-black/50"
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
                    className="flex-1 bg-black/50"
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