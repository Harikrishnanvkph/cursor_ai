"use client"

import React, { useEffect, useMemo, useRef, useCallback, useState } from "react"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useChartStore } from "@/lib/chart-store"
import { X, Palette, SlidersHorizontal, Sparkles, ChevronDown, RefreshCw, Check } from "lucide-react"
import { toast } from "sonner"
import { PresetCard } from "./preset-card"
import { PresetFilters } from "./preset-filters"
import type { ChartStylePreset } from "@/lib/chart-style-types"
import { checkPresetCompatibility } from "@/lib/chart-style-engine"
import { PresetPreviewDialog } from "./preset-preview-dialog"

/** Number of presets to show initially and per "Show More" click */
const PAGE_SIZE = 12

export function ChartStyleGallery() {
  const {
    isGalleryOpen,
    closeGallery,
    isLoading,
    loadPresets,
    officialPresets,
    filters,
    setFilters,
    getFilteredPresets,
    selectedPresetId,
    applyPreset,
  } = useChartStyleStore()

  const { chartData, chartConfig, chartType, hasJSON } = useChartStore()
  const hasChartData = hasJSON && chartData?.datasets?.length > 0
  const panelRef = useRef<HTMLDivElement>(null)

  // ── Progressive loading state ──────────────────────
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [syncCooldown, setSyncCooldown] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [previewPreset, setPreviewPreset] = useState<ChartStylePreset | null>(null)

  // Compute chart aspect ratio from dimensions for preview cards
  const chartAspectRatio = useMemo(() => {
    const w = (chartConfig as any)?.dimensions?.width
    const h = (chartConfig as any)?.dimensions?.height
    if (w && h && h > 0) return w / h
    return 4 / 3 // Default fallback
  }, [chartConfig])

  // Countdown timer for sync cooldown
  useEffect(() => {
    if (syncCooldown > 0) {
      const timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [syncCooldown])

  // Load presets on mount
  useEffect(() => {
    if (isGalleryOpen && officialPresets.length === 0) {
      loadPresets()
    }
  }, [isGalleryOpen])

  // Reset visible count when filters change (so user starts fresh)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filters.chartType, filters.category, filters.searchQuery])

  // Close on Escape key
  useEffect(() => {
    if (!isGalleryOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        closeGallery()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isGalleryOpen, closeGallery])

  // Close on click outside
  useEffect(() => {
    if (!isGalleryOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Don't close if clicking the Styles button itself (toggle handles that)
      if (target.closest('[data-styles-toggle]')) return
      // Don't close if clicking inside a Dialog portal/content modal
      if (target.closest('[role="dialog"]') || target.closest('[data-radix-portal]')) return

      if (panelRef.current && !panelRef.current.contains(target)) {
        closeGallery()
      }
    }

    // Small delay to avoid the opening click from immediately closing it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isGalleryOpen, closeGallery])

  const filteredPresets = useMemo(() => getFilteredPresets(), [
    officialPresets,
    filters.chartType,
    filters.category,
    filters.searchQuery,
  ])

  // ── Paginated subset: only render what's visible ──
  const visiblePresets = useMemo(
    () => filteredPresets.slice(0, visibleCount),
    [filteredPresets, visibleCount]
  )
  const hasMore = visibleCount < filteredPresets.length
  const remainingCount = filteredPresets.length - visibleCount

  const handleShowMore = useCallback(() => {
    setVisibleCount(prev => prev + PAGE_SIZE)
  }, [])

  const handleApplyPreset = useCallback((preset: ChartStylePreset) => {
    if (!hasChartData) {
      toast.error("Generate a chart first, then apply a style.")
      return
    }

    const { warnings } = checkPresetCompatibility(preset, chartData)
    const success = applyPreset(preset.id, !!preset.dimensions) // Apply dimensions if preset has them

    if (success) {
      closeGallery()
      if (warnings.length > 0) {
        warnings.forEach(w => toast.info(w, { duration: 5000 }))
      }
    } else {
      toast.error("Failed to apply style preset.")
    }
  }, [hasChartData, chartData, applyPreset, closeGallery])

  if (!isGalleryOpen) return null

  return (
    <div
      ref={panelRef}
      className="absolute inset-0 bg-white border-l border-gray-200 shadow-xl z-[35] flex flex-col"
      style={{
        animation: 'slideInFromRight 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
      }}
    >
      {/* Inline styles for precise responsive breakpoints and animation */}
      <style>{`
        @keyframes slideInFromRight {
          from { transform: translate3d(100%, 0, 0); opacity: 0.9; }
          to { transform: translate3d(0, 0, 0); opacity: 1; }
        }

        /* 2 columns on full-screen overlay for all viewports starting at 481px */
        @media (min-width: 481px) {
          .gallery-grid-responsive {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-sm">
            <Palette className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 leading-tight">Chart Gallery</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1.5 rounded-lg transition-all border flex items-center justify-center ${
              showFilters
                ? 'bg-violet-50 text-violet-600 border-violet-200 shadow-sm'
                : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
            }`}
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={async () => {
              if (isLoading || syncCooldown > 0) return;
              await loadPresets(true)
              setSyncCooldown(10)
            }}
            disabled={isLoading || syncCooldown > 0}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-50"
            title={syncCooldown > 0 ? `Synced` : "Sync latest presets"}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
            ) : syncCooldown > 0 ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={closeGallery}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close Styles (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Badge */}
      {!hasChartData && (
        <div className="mx-4 mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <span className="text-[11px] text-amber-700 font-medium leading-tight">
            Generate a chart first to preview and apply styles
          </span>
        </div>
      )}

      {/* Filters */}
      {showFilters && <PresetFilters />}

      {/* Preset Grid */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent" />
              <span className="text-xs text-gray-400 font-medium">Loading styles...</span>
            </div>
          </div>
        ) : filteredPresets.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gallery-grid-responsive gap-2.5">
              {visiblePresets.map(preset => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  isSelected={selectedPresetId === preset.id}
                  hasChartData={hasChartData}
                  onApply={() => handleApplyPreset(preset)}
                  onPreview={() => setPreviewPreset(preset)}
                  chartData={hasChartData ? chartData : undefined}
                  chartConfig={hasChartData ? chartConfig : undefined}
                  chartType={chartType}
                  chartAspectRatio={chartAspectRatio}
                />
              ))}
            </div>

            {/* Show More button */}
            {hasMore && (
              <button
                onClick={handleShowMore}
                className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                  border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300
                  text-xs font-semibold text-gray-600 hover:text-gray-800
                  transition-all duration-200 group"
              >
                <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                Show More
                <span className="px-1.5 py-0.5 rounded-md bg-gray-200/80 text-[10px] font-bold text-gray-500 group-hover:bg-violet-100 group-hover:text-violet-600 transition-colors">
                  {remainingCount} more
                </span>
              </button>
            )}

            {/* Showing count indicator */}
            {filteredPresets.length > PAGE_SIZE && (
              <p className="text-center text-[10px] text-gray-400 mt-2 font-medium">
                Showing {Math.min(visibleCount, filteredPresets.length)} of {filteredPresets.length}
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[250px] text-center px-4 py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
              <SlidersHorizontal className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700 mb-1">No styles found</p>
            {filters.aspectRatio !== 'all' ? (
              <>
                <p className="text-xs text-gray-400 max-w-[200px] mx-auto mb-3">
                  There are no presets specifically designed for the <span className="font-semibold text-gray-650">{filters.aspectRatio}</span> aspect ratio.
                </p>
                <button
                  onClick={() => setFilters({ aspectRatio: 'all' })}
                  className="text-xs px-3 py-1.5 font-semibold rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors border border-violet-100"
                >
                  Show All Aspect Ratios
                </button>
              </>
            ) : (
              <p className="text-xs text-gray-400">Try adjusting your filters</p>
            )}
          </div>
        )}
      </div>

      {/* Preset Preview Dialog — shared component */}
      <PresetPreviewDialog
        preset={previewPreset}
        onClose={() => setPreviewPreset(null)}
        onApply={handleApplyPreset}
        hasChartData={hasChartData}
        chartData={hasChartData ? chartData : undefined}
        chartConfig={hasChartData ? chartConfig : undefined}
        chartType={chartType}
      />
    </div>
  )
}
