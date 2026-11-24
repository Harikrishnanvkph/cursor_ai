"use client"

import React, { useMemo, memo } from "react"
import { useShallow } from "zustand/react/shallow"
import {
  Palette,
  Sparkles,
  Camera,
  RotateCcw,
  Hand,
  ScanSearch,
  ZoomIn,
  ZoomOut,
  RulerDimensionLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChartBgColorPicker } from "@/components/chart-preview/chart-bg-color-picker"
import { ZoomMenuContent, ZOOM_VALUES, getClosestZoomIndex } from "@/components/chart-preview/zoom-menu-content"
import { useEditorSidebarContext } from "@/components/editor/editor-sidebar-context"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useLoupeStore } from "@/lib/stores/loupe-store"
import { useSnapStateStore } from "@/lib/stores/snap-state-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { parseDimension } from "@/lib/utils/dimension-utils"
import { isDarkColor } from "@/lib/utils/color-utils"
import { toast } from "sonner"
import type { useZoomPan } from "@/lib/hooks/use-zoom-pan"

interface ModernWorkspaceBottomBarProps {
  chartContainerRef: React.RefObject<HTMLDivElement | null>
  zoomPan: ReturnType<typeof useZoomPan>
  isSidebarCollapsed?: boolean
  onOpenDimensionsPanel?: () => void
}

function formatAspectRatio(width: number, height: number): string {
  const ratio = width / height
  if (Math.abs(ratio - 1) < 0.02) return "1:1"
  if (Math.abs(ratio - 16 / 9) < 0.02) return "16:9"
  if (Math.abs(ratio - 4 / 3) < 0.02) return "4:3"
  if (Math.abs(ratio - 3 / 2) < 0.02) return "3:2"
  if (Math.abs(ratio - 4 / 5) < 0.02) return "4:5"
  if (Math.abs(ratio - 9 / 16) < 0.02) return "9:16"
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))
  const d = gcd(Math.round(width), Math.round(height)) || 1
  return `${Math.round(width / d)}:${Math.round(height / d)}`
}

export const ModernWorkspaceBottomBar = memo(function ModernWorkspaceBottomBar({
  chartContainerRef,
  zoomPan,
  isSidebarCollapsed,
  onOpenDimensionsPanel,
}: ModernWorkspaceBottomBarProps) {
  const { setActiveTab, setSidebarView, leftSidebarCollapsed, setLeftSidebarCollapsed } = useEditorSidebarContext()
  const effectiveSidebarCollapsed = isSidebarCollapsed !== undefined ? isSidebarCollapsed : leftSidebarCollapsed

  const { isLoupeActive, toggleLoupe } = useLoupeStore(
    useShallow(s => ({
      isLoupeActive: s.isLoupeActive,
      toggleLoupe: s.toggleLoupe,
    }))
  )

  const { isGalleryOpen, toggleGallery } = useChartStyleStore(
    useShallow(s => ({
      isGalleryOpen: s.isGalleryOpen,
      toggleGallery: s.toggleGallery,
    }))
  )

  const {
    editorMode,
    currentTemplate,
    templateInBackground,
    shouldShowTemplate,
  } = useTemplateStore(
    useShallow(s => ({
      editorMode: s.editorMode,
      currentTemplate: s.currentTemplate,
      templateInBackground: s.templateInBackground,
      shouldShowTemplate: s.shouldShowTemplate,
    }))
  )

  const {
    selectedFormatId,
    selectedFormatSnapshot,
    formats,
    userFormats,
    isContentBankOpen,
    toggleContentBank,
  } = useFormatGalleryStore(
    useShallow(s => ({
      selectedFormatId: s.selectedFormatId,
      selectedFormatSnapshot: s.selectedFormatSnapshot,
      formats: s.formats,
      userFormats: s.userFormats,
      isContentBankOpen: s.isContentBankOpen,
      toggleContentBank: s.toggleContentBank,
    }))
  )

  const hasSnap = useSnapStateStore(s => !!s.snapState)
  const captureCurrentState = useSnapStateStore(s => s.captureCurrentState)
  const restoreSnapState = useSnapStateStore(s => s.restoreSnapState)

  const canvasBgType = useUIStore(s => s.canvasBgType)
  const canvasBgColor = useUIStore(s => s.canvasBgColor)
  const isDark = isDarkColor(canvasBgType === 'transparent' ? '#ffffff' : (canvasBgColor || '#e5e7eb'))

  const chartConfig = useChartStore(s => {
    if (s.chartMode === "single") {
      const ds = s.chartData.datasets[s.activeDatasetIndex]
      return ds?.chartConfig ?? s.chartConfig
    }
    const group = s.groups?.find(g => g.id === s.activeGroupId)
    return group?.chartConfig ?? s.chartConfig
  })

  const isTemplateView = shouldShowTemplate() || (editorMode === "template" && !!selectedFormatId)

  const activeFormat = useMemo(() => {
    if (!selectedFormatId) return null
    return selectedFormatSnapshot || [...formats, ...userFormats].find(f => f.id === selectedFormatId) || null
  }, [selectedFormatId, selectedFormatSnapshot, formats, userFormats])

  const activeDims = useMemo(() => {
    if (isTemplateView) {
      if (activeFormat?.dimensions?.width && activeFormat?.dimensions?.height) {
        return {
          width: activeFormat.dimensions.width,
          height: activeFormat.dimensions.height,
        }
      }
      const tpl = currentTemplate || templateInBackground
      if (tpl?.width && tpl?.height) {
        return { width: tpl.width, height: tpl.height }
      }
      return { width: undefined, height: undefined }
    }
    const w = parseDimension((chartConfig as any)?.width, 0) || undefined
    const h = parseDimension((chartConfig as any)?.height, 0) || undefined
    return { width: w, height: h }
  }, [isTemplateView, activeFormat, currentTemplate, templateInBackground, chartConfig])

  const dimensionBadge = useMemo(() => {
    if (!activeDims.width || !activeDims.height) return "Responsive"
    return `${activeDims.width} × ${activeDims.height} px · ${formatAspectRatio(activeDims.width, activeDims.height)}`
  }, [activeDims])

  const currentZoomPct = Math.round(zoomPan.zoom * 100)
  const closestIndex = getClosestZoomIndex(currentZoomPct)

  const handleResetZoom = () => {
    zoomPan.setZoom(1)
    zoomPan.setPanOffset({ x: 0, y: 0 })
  }

  const applyFullDimension = () => {
    let baseScale = 1.0
    if (chartContainerRef?.current && activeDims.width && activeDims.height) {
      const cWidth = chartContainerRef.current.clientWidth || 800
      const cHeight = chartContainerRef.current.clientHeight || 600
      const padding = 40
      const availableWidth = Math.max(10, cWidth - padding)
      const availableHeight = Math.max(10, cHeight - padding)
      const scaleX = availableWidth / activeDims.width
      const scaleY = availableHeight / activeDims.height
      baseScale = Math.min(scaleX, scaleY, 1.0)
    }
    zoomPan.setZoom(1.0 / baseScale)
    zoomPan.setPanOffset({ x: 0, y: 0 })
  }

  const handleSliderChange = (value: number[]) => {
    const newZoomPct = ZOOM_VALUES[value[0]]
    zoomPan.setZoom(newZoomPct / 100)
  }

  const handleOpenDimensionsPanel = () => {
    if (onOpenDimensionsPanel) {
      onOpenDimensionsPanel()
      return
    }
    setSidebarView("tools")
    setActiveTab(isTemplateView ? (selectedFormatId ? "tpl_format_zones" : "tpl_templates") : "types_toggles")
    setLeftSidebarCollapsed(false)
  }

  const handleSnapState = () => {
    captureCurrentState("manual", null, "Manual Snapshot")
  }

  const handleResetState = () => {
    if (!hasSnap) return
    const success = restoreSnapState()
    if (!success) {
      toast.error("Failed to restore snap state.")
    }
  }

  return (
    <div
      className={cn(
        "h-10 min-h-[40px] px-3.5 flex items-center justify-between gap-2.5 select-none flex-shrink-0 z-20 transition-colors duration-200 antialiased",
        isDark ? "text-white" : "text-slate-700"
      )}
      style={{
        backgroundColor: canvasBgType === "transparent" ? "transparent" : canvasBgColor,
        backgroundImage:
          canvasBgType === "transparent"
            ? `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)`
            : undefined,
        backgroundSize: canvasBgType === "transparent" ? "20px 20px" : undefined,
        backgroundPosition:
          canvasBgType === "transparent" ? "0 0, 0 10px, 10px -10px, -10px 0px" : undefined,
      }}
    >
      {/* Left Cluster: Quick Studio Utilities */}
      <div className="flex items-center gap-1.5 min-w-0">
        {!isTemplateView ? (
          <button
            type="button"
            data-styles-toggle
            onClick={() => toggleGallery()}
            className={cn(
              "h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              isGalleryOpen
                ? isDark
                  ? "bg-violet-500/25 text-violet-200 border-violet-400/40 font-semibold shadow-sm"
                  : "bg-violet-50 text-violet-700 border-violet-200 font-semibold"
                : isDark
                  ? "border-transparent text-white/90 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
            )}
            title="Open Chart Styles Gallery"
          >
            <Palette
              className={cn(
                "w-4 h-4 shrink-0",
                isGalleryOpen
                  ? isDark
                    ? "text-violet-300"
                    : "text-violet-600"
                  : isDark
                    ? "text-violet-300"
                    : "text-violet-500"
              )}
            />
            <span>Styles</span>
          </button>
        ) : (
          selectedFormatId && (
            <button
              type="button"
              onClick={() => toggleContentBank()}
              className={cn(
                "h-7 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                isContentBankOpen
                  ? isDark
                    ? "bg-purple-500/25 text-purple-200 border-purple-400/40 font-semibold shadow-sm"
                    : "bg-purple-50 text-purple-700 border-purple-200 font-semibold"
                  : isDark
                    ? "border-transparent text-white/90 hover:border-white/30 hover:bg-white/10 hover:text-white"
                    : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
              )}
              title="Open AI Content Bank"
            >
              <Sparkles className={cn("w-4 h-4 shrink-0", isDark ? "text-purple-300" : "text-purple-600")} />
              <span>Content Bank</span>
            </button>
          )
        )}

        {/* Canvas Background Picker */}
        <ChartBgColorPicker
          variant="button"
          tooltipSide="top"
          innerClassName="w-4 h-4 rounded-[3px]"
          className={cn(
            "h-7 px-2 rounded-lg border flex items-center justify-center transition-colors cursor-pointer outline-none",
            isDark
              ? "border-transparent text-white hover:border-white/30 hover:bg-white/10"
              : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5"
          )}
        />

        {/* Snap & Reset State */}
        <button
          type="button"
          onClick={handleSnapState}
          className={cn(
            "h-7 px-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer outline-none",
            isDark
              ? "border-transparent text-white/90 hover:border-white/30 hover:bg-white/10 hover:text-white"
              : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
          )}
          title="Saves current state as snapshot baseline"
        >
          <Camera className={cn("w-4 h-4 shrink-0", isDark ? "text-indigo-300" : "text-indigo-500")} />
          <span className={effectiveSidebarCollapsed ? "hidden md:inline" : "hidden xl:inline"}>Snap</span>
        </button>

        {hasSnap && (
          <button
            type="button"
            onClick={handleResetState}
            className={cn(
              "h-7 px-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer outline-none",
              isDark
                ? "border-transparent text-amber-300 hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-200"
                : "border-transparent text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
            )}
            title="Restore saved baseline snapshot"
          >
            <RotateCcw className={cn("w-4 h-4 shrink-0", isDark ? "text-amber-400" : "text-amber-500")} />
            <span className={effectiveSidebarCollapsed ? "hidden md:inline" : "hidden xl:inline"}>Reset</span>
          </button>
        )}
      </div>

      {/* Right Cluster: Dimensions, Pan, Loupe, Zoom Slider & Percentage */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Dimensions Badge */}
        <button
          type="button"
          onClick={handleOpenDimensionsPanel}
          className={cn(
            effectiveSidebarCollapsed ? "hidden md:inline-flex" : "hidden xl:inline-flex",
            "items-center gap-1.5 h-7 px-2.5 rounded-lg border text-xs font-medium transition-colors tabular-nums cursor-pointer outline-none",
            isDark
              ? "border-transparent text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
              : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
          )}
          title="Canvas dimensions · Click to configure"
        >
          <RulerDimensionLine className={cn("w-4 h-4 shrink-0", isDark ? "text-white/60" : "text-slate-400")} />
          <span>{dimensionBadge}</span>
        </button>

        {/* Pan & Loupe Toggles */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => zoomPan.setPanMode(!zoomPan.panMode)}
            className={cn(
              "h-7 w-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer outline-none",
              zoomPan.panMode
                ? isDark
                  ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/40"
                  : "bg-indigo-50 text-indigo-600 border-indigo-200/80"
                : isDark
                  ? "border-transparent text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
            )}
            title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
            aria-label={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
          >
            <Hand className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => toggleLoupe()}
            className={cn(
              "h-7 w-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer outline-none",
              isLoupeActive
                ? isDark
                  ? "bg-indigo-500/30 text-indigo-200 border-indigo-400/40"
                  : "bg-indigo-50 text-indigo-600 border-indigo-200/80"
                : isDark
                  ? "border-transparent text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                  : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
            )}
            title={isLoupeActive ? "Disable Loupe View (Esc)" : "Loupe View (Inspect Details)"}
            aria-label={isLoupeActive ? "Disable Loupe View" : "Enable Loupe View"}
          >
            <ScanSearch className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Out, Slider, Zoom In, Zoom % Menu */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={zoomPan.handleZoomOut}
            className={cn(
              "h-7 w-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer outline-none",
              isDark
                ? "border-transparent text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
            )}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className={cn(effectiveSidebarCollapsed ? "hidden sm:flex" : "hidden lg:flex", "items-center w-24 lg:w-28 px-1")}>
            <Slider
              min={0}
              max={ZOOM_VALUES.length - 1}
              step={1}
              value={[closestIndex]}
              onValueChange={handleSliderChange}
              className={cn(
                "cursor-pointer [&>span:first-child]:h-1.5 [&_[role=slider]]:h-4 [&_[role=slider]]:w-4 [&_[role=slider]]:shadow-sm",
                isDark
                  ? "[&>span:first-child]:bg-white/20 [&>span:first-child>span]:bg-indigo-400 [&_[role=slider]]:border-indigo-400 [&_[role=slider]]:bg-white"
                  : "[&>span:first-child]:bg-black/10 [&>span:first-child>span]:bg-indigo-600 [&_[role=slider]]:border-indigo-600 [&_[role=slider]]:bg-white"
              )}
              aria-label="Zoom level"
            />
          </div>

          <button
            type="button"
            onClick={zoomPan.handleZoomIn}
            className={cn(
              "h-7 w-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer outline-none",
              isDark
                ? "border-transparent text-white/80 hover:border-white/30 hover:bg-white/10 hover:text-white"
                : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5 hover:text-slate-900"
            )}
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "h-7 min-w-[50px] px-2 rounded-lg border text-xs font-semibold tabular-nums transition-colors cursor-pointer outline-none text-center",
                  isDark
                    ? "border-transparent text-white hover:border-white/30 hover:bg-white/10"
                    : "border-transparent text-slate-700 hover:border-slate-300 hover:bg-black/5"
                )}
                title="Zoom presets"
              >
                {currentZoomPct}%
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              side="top"
              className="w-56 p-2 z-[110]"
              onClick={e => e.stopPropagation()}
            >
              <ZoomMenuContent
                currentZoomPct={currentZoomPct}
                closestIndex={closestIndex}
                onSliderChange={handleSliderChange}
                onResetZoom={handleResetZoom}
                onFullDimension={applyFullDimension}
                hasFullDimension={!!(activeDims.width && activeDims.height)}
                onZoomIn={zoomPan.handleZoomIn}
                onZoomOut={zoomPan.handleZoomOut}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
})
