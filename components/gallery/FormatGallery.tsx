"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { dataService } from "@/lib/data-service"
import { VariantCard } from "@/components/gallery/VariantCard"
import { extractContentFromChartData, renderFormat, generateGalleryVariants } from "@/lib/variant-engine"
import type { FormatCategory, LLMContentPackage, RenderedFormat } from "@/lib/format-types"
import { X, Layers, SlidersHorizontal, LayoutGrid, ChevronDown, BarChart3 } from "lucide-react"
import { toast } from "sonner"

// Available dimension filters
const DIMENSION_OPTIONS = [
  { label: 'All Sizes', value: '' },
  { label: '1:1 Square', value: '1:1' },
  { label: '4:5 Portrait', value: '4:5' },
  { label: '9:16 Story', value: '9:16' },
  { label: '16:9 Wide', value: '16:9' },
  { label: '3:2 Standard', value: '3:2' },
  { label: '1.91:1 Banner', value: '1.91:1' },
]

// Category filter options
const CATEGORY_OPTIONS: { label: string; value: string; color: string }[] = [
  { label: 'All', value: '', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { label: 'Infographic', value: 'infographic', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Social', value: 'social', color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { label: 'Report', value: 'report', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: 'Presentation', value: 'presentation', color: 'bg-amber-50 text-amber-600 border-amber-200' },
  { label: 'Template', value: 'template', color: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
]

export function FormatGallery() {
  const {
    formats,
    setFormats,
    isLoadingFormats,
    setLoadingFormats,
    filters,
    setFilters,
    clearFilters,
    selectedFormatId,
    setSelectedFormat,
    closeGallery,
    selectedChartType,
    contextualImageUrl,
    setContextualImageUrl,
  } = useFormatGalleryStore()

  const [showFilters, setShowFilters] = useState(false)

  // Access chart store for current chart data
  const { chartType, chartData, chartConfig, hasJSON } = useChartStore()
  const hasChartData = hasJSON && chartData?.datasets?.length > 0

  // Build content package from existing chart data
  const localContentPackage: LLMContentPackage | null = useMemo(() => {
    if (!hasChartData) return null
    return extractContentFromChartData(chartType, chartData, chartConfig)
  }, [hasChartData, chartType, chartData, chartConfig])

  // Sync the local content package into the Zustand store
  // so FullSizeFormatView can access it after the gallery closes
  const { setContentPackage } = useFormatGalleryStore()
  useEffect(() => {
    setContentPackage(localContentPackage)
  }, [localContentPackage])

  // Load formats on mount
  useEffect(() => {
    loadFormats()
  }, [])

  // Fetch contextual image when content package is ready
  useEffect(() => {
    if (!localContentPackage?.keywords?.length) {
      setContextualImageUrl(null)
      return
    }

    const fetchContextualImage = async () => {
      try {
        // Use the first 2-3 keywords for a focused search
        const query = localContentPackage.keywords.slice(0, 3).join(' ')
        const res = await fetch(`/api/unsplash?query=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.url) {
            setContextualImageUrl(data.url)
          }
        }
      } catch (err) {
        console.error('Failed to fetch contextual image:', err)
      }
    }

    fetchContextualImage()
  }, [localContentPackage?.keywords])

  const loadFormats = async () => {
    setLoadingFormats(true)
    try {
      const res = await dataService.getOfficialFormats()
      if (!res.error && res.data) {
        setFormats(res.data)
      }
    } catch (err) {
      console.error('Failed to load formats:', err)
    } finally {
      setLoadingFormats(false)
    }
  }

  // Filter formats
  const filteredFormats = useMemo(() => {
    let result = formats
    if (filters.category) {
      result = result.filter(f => f.category === filters.category)
    }
    if (filters.dimension) {
      result = result.filter(f => f.dimensions.aspect === filters.dimension)
    }
    return result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [formats, filters])

  // Batch-render variants when chart data available
  const renderedVariantsMap = useMemo(() => {
    const map = new Map<string, RenderedFormat>()
    if (!localContentPackage || filteredFormats.length === 0) return map

    const variants = generateGalleryVariants(filteredFormats, localContentPackage, contextualImageUrl || undefined)
    variants.forEach(v => {
      // Key by blueprint ID (extracted from variantId pattern: "blueprintId-chartType")
      const blueprintId = v.variantId.replace(/-[^-]+$/, '')
      map.set(blueprintId, v)
    })
    return map
  }, [localContentPackage, filteredFormats, contextualImageUrl])

  const handleSelect = (formatId: string) => {
    const format = formats.find(f => f.id === formatId)
    if (!format) return

    // Immediately clear custom templates and switch mode to template to bypass ChartPreview
    const templateStore = useTemplateStore.getState()
    templateStore.clearAllTemplateState()
    templateStore.setEditorMode('template')

    if (localContentPackage) {
      // We have chart data — render the variant
      try {
        const rendered = renderFormat(format, localContentPackage)
        setSelectedFormat(formatId, rendered.chartType)
        toast.success(`Format "${format.name}" selected!`)
      } catch (err) {
        console.error('Failed to render format:', err)
        toast.error('Failed to apply format')
      }
    } else {
      // No chart data yet — just select the format for later
      setSelectedFormat(formatId, 'bar')
      toast.info(`Format "${format.name}" selected. Generate a chart to see it applied.`)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-white">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Choose a Format</h2>
            <p className="text-[11px] text-gray-500">
              Select a visual layout for your chart data
              {hasChartData && <> · <span className="text-green-600 font-medium flex items-center gap-0.5 inline-flex"><BarChart3 className="w-3 h-3" /> Chart ready</span></>}
              {formats.length > 0 && <> · <span className="font-medium">{filteredFormats.length}</span> format{filteredFormats.length !== 1 ? 's' : ''}</>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              showFilters || filters.category || filters.dimension
                ? 'bg-purple-50 text-purple-600 border-purple-200'
                : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
            {(filters.category || filters.dimension) && (
              <span className="w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] flex items-center justify-center font-bold">
                {(filters.category ? 1 : 0) + (filters.dimension ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Close button */}
          <button
            onClick={closeGallery}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            title="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      {showFilters && (
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-3">
          {/* Category chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Category</span>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters({ category: (opt.value || undefined) as FormatCategory | undefined })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    (filters.category || '') === opt.value
                      ? opt.color + ' shadow-sm'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension chips */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Dimensions</span>
            <div className="flex gap-1.5 flex-wrap">
              {DIMENSION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFilters({ dimension: opt.value || undefined })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                    (filters.dimension || '') === opt.value
                      ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm'
                      : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clear filters */}
          {(filters.category || filters.dimension) && (
            <button
              onClick={clearFilters}
              className="self-start text-[11px] text-purple-500 hover:text-purple-700 underline underline-offset-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Gallery Grid */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoadingFormats ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
              <span className="text-sm text-gray-400">Loading formats...</span>
            </div>
          </div>
        ) : filteredFormats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFormats.map(format => {
              // Find pre-rendered variant for this format
              const variant = renderedVariantsMap.get(format.id)
              return (
                <VariantCard
                  key={format.id}
                  format={format}
                  onSelect={handleSelect}
                  isSelected={selectedFormatId === format.id}
                  renderedVariant={variant}
                />
              )
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Layers className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {formats.length === 0 ? 'No formats available' : 'No formats match your filters'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {formats.length === 0
                    ? 'Ask your admin to seed default formats from the admin panel.'
                    : 'Try adjusting your filter criteria.'}
                </p>
              </div>
              {formats.length > 0 && (filters.category || filters.dimension) && (
                <button
                  onClick={clearFilters}
                  className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
