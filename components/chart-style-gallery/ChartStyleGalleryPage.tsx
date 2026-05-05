"use client"

import React, { useEffect, useMemo, useCallback, useState } from "react"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useChartStore } from "@/lib/chart-store"
import { X, Palette, SlidersHorizontal, BarChart3, Search, TrendingUp, PieChart, CircleDot, Radar, Target, BarChartHorizontal, Box, Layers, RefreshCw, Check } from "lucide-react"
import { toast } from "sonner"
import { PresetCard } from "./preset-card"
import type { ChartStylePreset, PresetCategory } from "@/lib/chart-style-types"
import { checkPresetCompatibility } from "@/lib/chart-style-engine"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import type { SupportedChartType } from "@/lib/chart-defaults"

// Category filter options matching the preset categories
const CATEGORY_OPTIONS: { label: string; value: string; color: string }[] = [
  { label: 'All', value: '', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { label: 'Minimal', value: 'minimal', color: 'bg-gray-100 text-gray-700 border-gray-300' },
  { label: 'Bold', value: 'bold', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { label: 'Pastel', value: 'pastel', color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { label: 'Dark', value: 'dark', color: 'bg-gray-800 text-gray-100 border-gray-700' },
  { label: 'Professional', value: 'professional', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: '3D', value: '3d', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Gradient', value: 'gradient', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
  { label: 'Earthy', value: 'earthy', color: 'bg-amber-50 text-amber-600 border-amber-200' },
]

// Chart type filter options with Lucide icons
const CHART_TYPE_OPTIONS: { label: string; value: string; icon: React.ReactNode }[] = [
  { label: 'All Types', value: 'all', icon: <Layers className="w-3.5 h-3.5" /> },
  { label: 'Bar', value: 'bar', icon: <BarChart3 className="w-3.5 h-3.5" /> },
  { label: 'Line', value: 'line', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  { label: 'Pie', value: 'pie', icon: <PieChart className="w-3.5 h-3.5" /> },
  { label: 'Doughnut', value: 'doughnut', icon: <CircleDot className="w-3.5 h-3.5" /> },
  { label: 'Radar', value: 'radar', icon: <Radar className="w-3.5 h-3.5" /> },
  { label: 'Polar', value: 'polarArea', icon: <Target className="w-3.5 h-3.5" /> },
  { label: 'H-Bar', value: 'horizontalBar', icon: <BarChartHorizontal className="w-3.5 h-3.5" /> },
  { label: '3D Bar', value: 'bar3d', icon: <Box className="w-3.5 h-3.5" /> },
  { label: '3D Pie', value: 'pie3d', icon: <Box className="w-3.5 h-3.5" /> },
]

export function ChartStyleGalleryPage() {
  const {
    isGalleryOpen,
    closeGallery,
    isLoading,
    loadPresets,
    officialPresets,
    filters,
    setFilters,
    resetFilters,
    getFilteredPresets,
    selectedPresetId,
    applyPreset,
  } = useChartStyleStore()

  const { chartData, chartType, chartConfig, hasJSON } = useChartStore()
  const hasChartData = hasJSON && chartData?.datasets?.length > 0

  // Compute chart aspect ratio from dimensions for preview cards
  const chartAspectRatio = useMemo(() => {
    const w = (chartConfig as any)?.dimensions?.width
    const h = (chartConfig as any)?.dimensions?.height
    if (w && h && h > 0) return w / h
    return 4 / 3 // Default fallback
  }, [chartConfig])
  const [showFilters, setShowFilters] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [syncCooldown, setSyncCooldown] = useState(0)

  // Countdown timer for sync cooldown
  useEffect(() => {
    if (syncCooldown > 0) {
      const timer = setTimeout(() => setSyncCooldown(syncCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [syncCooldown])

  // Load presets on mount
  useEffect(() => {
    if (officialPresets.length === 0) {
      loadPresets()
    }
  }, [])

  // Sync search input to filters (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters({ searchQuery: searchInput })
    }, 200)
    return () => clearTimeout(timer)
  }, [searchInput])

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

  const filteredPresets = useMemo(
    () => getFilteredPresets(),
    [officialPresets, filters.chartType, filters.category, filters.searchQuery]
  )

  const handleApplyPreset = useCallback(
    (preset: ChartStylePreset) => {
      if (!hasChartData) {
        toast.error("Generate a chart first, then apply a style.")
        return
      }

      const { warnings } = checkPresetCompatibility(preset, chartData)
      const success = applyPreset(preset.id, !!preset.dimensions)

      if (success) {
        closeGallery()
        if (warnings.length > 0) {
          warnings.forEach(w => toast.info(w, { duration: 5000 }))
        }
      } else {
        toast.error("Failed to apply style preset.")
      }
    },
    [hasChartData, chartData, applyPreset, closeGallery]
  )

  const activeFilterCount =
    (filters.category !== 'all' && filters.category ? 1 : 0) +
    (filters.chartType !== 'all' ? 1 : 0) +
    (filters.searchQuery ? 1 : 0)

  return (
    <div className="flex flex-col flex-1 h-full bg-gradient-to-br from-gray-50 to-white w-full overflow-hidden">
      {/* Header — mirrors FormatGallery header */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-3 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-inner">
              <Palette className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 leading-tight">Chart Gallery</h2>
              {/* Sync Button */}
              <button
                onClick={async () => {
                  if (isLoading || syncCooldown > 0) return;
                  await loadPresets(true)
                  setSyncCooldown(10)
                }}
                disabled={isLoading || syncCooldown > 0}
                title={syncCooldown > 0 ? `Synced` : "Sync latest presets"}
                className="ml-2 p-1.5 rounded-md text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-500" />
                ) : syncCooldown > 0 ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search styles..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-transparent w-40 transition-all"
            />
          </div>

          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              showFilters || activeFilterCount > 0
                ? 'bg-violet-50 text-violet-600 border-violet-200'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="h-5 w-px bg-gray-200 mx-1" />

          <SimpleProfileDropdown size="sm" />

          <div className="h-5 w-px bg-gray-200 mx-1" />

          {/* Close button */}
          <button
            onClick={closeGallery}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors bg-white shadow-sm border border-gray-200"
            title="Close Gallery"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      {showFilters && (
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3 flex-shrink-0">
          {/* Chart Type */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Chart Type</span>
            <div className="flex gap-1.5 flex-wrap">
              {CHART_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters({ chartType: (opt.value || 'all') as any })}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    (filters.chartType || 'all') === opt.value
                      ? 'bg-violet-50 text-violet-600 border-violet-200 shadow-sm'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Category</span>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters({ category: (opt.value || 'all') as PresetCategory | 'all' })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    (filters.category || 'all') === (opt.value || 'all')
                      ? opt.color + ' shadow-sm'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                resetFilters()
                setSearchInput('')
              }}
              className="self-start text-[11px] text-violet-500 hover:text-violet-700 underline underline-offset-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4 bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
              <span className="text-sm font-medium text-gray-500">Loading styles...</span>
            </div>
          </div>
        ) : filteredPresets.length > 0 ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPresets.map(preset => (
              <PresetCard
                key={preset.id}
                preset={preset}
                isSelected={selectedPresetId === preset.id}
                hasChartData={hasChartData}
                onApply={() => handleApplyPreset(preset)}
                chartData={hasChartData ? chartData : undefined}
                chartConfig={hasChartData ? chartConfig : undefined}
                chartType={chartType}
                chartAspectRatio={chartAspectRatio}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
              <Palette className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No Styles Found</h3>
            <p className="text-sm text-gray-500 max-w-sm mb-4">
              {officialPresets.length === 0
                ? "No styles are currently available."
                : "We couldn't find any styles matching your current filters."}
            </p>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  resetFilters()
                  setSearchInput('')
                }}
                className="text-sm px-4 py-2 font-medium rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
