"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { dataService } from "@/lib/data-service"
import { VariantCard } from "@/components/gallery/VariantCard"
import { extractContentFromChartData, renderFormat, generateGalleryVariants } from "@/lib/variant-engine"
import type { FormatCategory, LLMContentPackage, RenderedFormat } from "@/lib/format-types"
import { X, Layers, SlidersHorizontal, LayoutGrid, BarChart3, ChevronLeft, Check, StickyNote, Code2, Trash2, Plus, Info, Eye } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { HistoryDropdown } from "@/components/history-dropdown"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"

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

interface FormatGalleryProps {
  leftSidebarOpen?: boolean;
  setLeftSidebarOpen?: (open: boolean) => void;
}

export function FormatGallery({ leftSidebarOpen, setLeftSidebarOpen }: FormatGalleryProps) {
  const {
    formats,
    setFormats,
    userFormats,
    setUserFormats,
    isLoadingFormats,
    setLoadingFormats,
    isLoadingUserFormats,
    setLoadingUserFormats,
    filters,
    setFilters,
    clearFilters,
    selectedFormatId,
    setSelectedFormat,
    closeGallery,
    contextualImageUrl,
    setContextualImageUrl,
    formatZoneNotes,
    setFormatZoneNote,
    clearFormatZoneNote
  } = useFormatGalleryStore()

  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'official' | 'mine'>('official')
  const [previewFormatId, setPreviewFormatId] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})

  // If left sidebar expands, collapse the format side section
  useEffect(() => {
    if (leftSidebarOpen && previewFormatId) {
      setPreviewFormatId(null)
    }
  }, [leftSidebarOpen])

  // Access chart store for current chart data
  const { chartType, chartData, chartConfig, hasJSON } = useChartStore()
  const hasChartData = hasJSON && chartData?.datasets?.length > 0

  // Build content package from existing chart data
  const localContentPackage: LLMContentPackage | null = useMemo(() => {
    if (!hasChartData) return null
    return extractContentFromChartData(chartType, chartData, chartConfig)
  }, [hasChartData, chartType, chartData, chartConfig])

  // Sync the local content package into the Zustand store
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
    setLoadingUserFormats(true)
    try {
      const [officialRes, userRes] = await Promise.all([
        dataService.getOfficialFormats(),
        dataService.getUserFormats()
      ])
      
      if (!officialRes.error && officialRes.data) {
        setFormats(officialRes.data)
      }
      if (!userRes.error && userRes.data) {
        setUserFormats(userRes.data)
      }
    } catch (err) {
      console.error('Failed to load formats:', err)
    } finally {
      setLoadingFormats(false)
      setLoadingUserFormats(false)
    }
  }

  const currentFormatsList = activeTab === 'official' ? formats : userFormats
  const isLoadingCurrent = activeTab === 'official' ? isLoadingFormats : isLoadingUserFormats

  // Filter formats
  const filteredFormats = useMemo(() => {
    let result = currentFormatsList
    if (filters.category) {
      result = result.filter(f => f.category === filters.category)
    }
    if (filters.dimension) {
      result = result.filter(f => f.dimensions.aspect === filters.dimension)
    }
    return result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  }, [currentFormatsList, filters])

  // Batch-render variants when chart data available
  const renderedVariantsMap = useMemo(() => {
    const map = new Map<string, RenderedFormat>()
    if (!localContentPackage || filteredFormats.length === 0) return map

    const variants = generateGalleryVariants(filteredFormats, localContentPackage, contextualImageUrl || undefined)
    variants.forEach(v => {
      const blueprintId = v.variantId.replace(/-[^-]+$/, '')
      map.set(blueprintId, v)
    })
    return map
  }, [localContentPackage, filteredFormats, contextualImageUrl])

  const previewFormat = useMemo(() => {
    if (!previewFormatId) return null
    return [...formats, ...userFormats].find(f => f.id === previewFormatId)
  }, [previewFormatId, formats, userFormats])

  const handlePreviewClick = (formatId: string) => {
    // If content is already available (AI has generated data), directly apply the format
    if (localContentPackage) {
      const format = [...formats, ...userFormats].find(f => f.id === formatId)
      if (format) {
        try {
          const templateStore = useTemplateStore.getState()
          templateStore.clearAllTemplateState()
          templateStore.setEditorMode('template')
          templateStore.setGenerateMode('format')
          const rendered = renderFormat(format, localContentPackage)
          setSelectedFormat(format.id, rendered.chartType)
          closeGallery()
          if (setLeftSidebarOpen) setLeftSidebarOpen(true)
          toast.success(`Format "${format.name}" applied!`)
          return
        } catch (err) {
          console.error('Failed to render format:', err)
          // Fall through to preview mode
        }
      }
    }
    // No content available — show the side preview panel
    setPreviewFormatId(formatId)
    if (setLeftSidebarOpen) setLeftSidebarOpen(false)
  }

  const toggleNoteExpanded = (zoneId: string) => {
    setExpandedNotes(prev => ({ ...prev, [zoneId]: !prev[zoneId] }))
  }

  const handleConfirmSelect = () => {
    if (!previewFormat) return

    const templateStore = useTemplateStore.getState()
    templateStore.clearAllTemplateState()
    templateStore.setEditorMode('template')
    templateStore.setGenerateMode('format')

    if (localContentPackage) {
      try {
        const rendered = renderFormat(previewFormat, localContentPackage)
        setSelectedFormat(previewFormat.id, rendered.chartType)
        toast.success(`Format "${previewFormat.name}" selected!`)
      } catch (err) {
        console.error('Failed to render format:', err)
        toast.error('Failed to apply format')
      }
    } else {
      setSelectedFormat(previewFormat.id, 'bar')
      toast.info(`Format "${previewFormat.name}" selected. Generate a chart to see it applied.`)
    }

    // Once handled, close gallery and automatically open the chat sidebar for immediate usage
    closeGallery()
    if (setLeftSidebarOpen) setLeftSidebarOpen(true)
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-gradient-to-br from-gray-50 to-white w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between px-5 py-3 border-b border-gray-200 bg-white z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={closeGallery}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-5 w-px bg-gray-300"></div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-inner">
              <LayoutGrid className="w-4 h-4 text-white" />
            </div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 leading-tight">Choose a Format</h2>
              {hasChartData && <span className="text-green-600 text-[11px] font-medium inline-flex items-center gap-0.5 ml-2 bg-green-50 px-1.5 py-0.5 rounded-md border border-green-100"><BarChart3 className="w-3 h-3" /> Chart ready</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => { setActiveTab('official'); setPreviewFormatId(null); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'official' 
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            Official Formats
          </button>
          <button
            onClick={() => { setActiveTab('mine'); setPreviewFormatId(null); }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'mine' 
                ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200/50' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            My Formats
          </button>
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

          <div className="h-5 w-px bg-gray-200 mx-1"></div>
          
          <HistoryDropdown variant="icon-badge" />
          <SimpleProfileDropdown size="sm" />
          
          <div className="h-5 w-px bg-gray-200 mx-1"></div>

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
          {(filters.category || filters.dimension) && (
            <button onClick={clearFilters} className="self-start text-[11px] text-purple-500 hover:text-purple-700 underline underline-offset-2">
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Split Viewer Content */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* LEFT PANE: Configuration/Preview */}
        <div className={`flex-shrink-0 transition-all duration-300 border-r border-gray-200 bg-white overflow-y-auto ${previewFormatId ? 'w-5/12 opacity-100' : 'w-0 opacity-0'}`}>
          {previewFormat && (
            <div className="p-6 h-full flex flex-col">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-extrabold text-gray-900">{previewFormat.name}</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleConfirmSelect}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md transition-all h-9 px-4"
                  >
                    <Check className="w-4 h-4 mr-1.5" />
                    Use Format
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPreviewFormatId(null)}
                    className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 border-gray-200"
                    title="Cancel Selection"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Scaled Preview */}
              <div className="flex-shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-200 p-4 mb-6 shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <Eye className="w-4 h-4 text-gray-600" />
                  <h4 className="text-sm font-semibold text-gray-800">Format Structure</h4>
                </div>
                {(() => {
                  const scaleW = 280 / previewFormat.dimensions.width;
                  const scaleH = 200 / previewFormat.dimensions.height;
                  const scale = Math.min(0.3, Math.min(scaleW, scaleH));
                  return (
                    <div 
                      className="relative mx-auto border border-gray-300 bg-white rounded-sm shadow-md"
                      style={{
                        width: `${previewFormat.dimensions.width * scale}px`,
                        height: `${previewFormat.dimensions.height * scale}px`,
                        backgroundColor: (previewFormat.skeleton as any)?.colorPalette?.background || '#ffffff',
                      }}
                    >
                      {((previewFormat.skeleton as any)?.zones || []).map((zone: any) => {
                        const pos = zone.position || { x: 0, y: 0, width: previewFormat.dimensions.width, height: previewFormat.dimensions.height }
                        if (zone.type === 'chart') {
                          return (
                            <div key={zone.id} className="absolute border border-dashed border-indigo-400 bg-indigo-50/50 flex items-center justify-center text-[9px] text-indigo-700 font-medium rounded"
                              style={{ left: `${pos.x * scale}px`, top: `${pos.y * scale}px`, width: `${pos.width * scale}px`, height: `${pos.height * scale}px`, zIndex: 10 }}
                            >
                              Chart
                            </div>
                          )
                        } else if (zone.type === 'text' || zone.type === 'stat') {
                          return (
                             <div key={zone.id} className="absolute border border-pink-400 bg-pink-50/60 text-pink-700 flex items-center justify-center text-[9px] font-medium rounded p-1 text-center overflow-hidden leading-tight"
                              style={{ left: `${pos.x * scale}px`, top: `${pos.y * scale}px`, width: `${pos.width * scale}px`, height: `${pos.height * scale}px`, zIndex: 20 }}
                            >
                              {zone.role || zone.type}
                            </div>
                          )
                        } else if (zone.type === 'image') {
                          return (
                             <div key={zone.id} className="absolute border border-teal-400 bg-teal-50/40 text-teal-700 flex items-center justify-center text-[9px] font-medium rounded p-1 text-center overflow-hidden leading-tight"
                              style={{ left: `${pos.x * scale}px`, top: `${pos.y * scale}px`, width: `${pos.width * scale}px`, height: `${pos.height * scale}px`, zIndex: 5 }}
                            >
                              Image
                            </div>
                          )
                        } else if (zone.type === 'background') {
                          return (
                             <div key={zone.id} className="absolute"
                              style={{ left: `${pos.x * scale}px`, top: `${pos.y * scale}px`, width: `${pos.width * scale}px`, height: `${pos.height * scale}px`, backgroundColor: (zone as any)?.styles?.backgroundColor || '#f1f5f9', zIndex: 1 }}
                            />
                          )
                        }
                        return null
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* AI Generation Notes Area */}
              {((previewFormat.skeleton as any)?.zones || []).filter((z: any) => ['text', 'stat'].includes(z.type)).length > 0 && (
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-4 shadow-sm flex-1">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                      <StickyNote className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 mb-0.5">AI Generation Notes</h4>
                      <p className="text-xs text-gray-600 leading-relaxed max-w-sm">
                        Add optional instructions to guide how AI writes content for specific areas.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {((previewFormat.skeleton as any)?.zones || []).filter((z: any) => ['text', 'stat'].includes(z.type)).map((zone: any) => {
                      const noteText = formatZoneNotes[previewFormat.id]?.[zone.id] || ''
                      const isExpanded = expandedNotes[zone.id] || noteText.length > 0
                      const label = (zone.role || zone.type).toUpperCase()

                      return (
                        <div key={zone.id} className="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors overflow-hidden">
                          <div className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-purple-100 text-purple-600">
                                <Code2 className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm text-gray-900">{label}</span>
                                  {noteText && <span className="px-1.5 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded">Note Active</span>}
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleNoteExpanded(zone.id)}
                              className={`px-2.5 py-1.5 rounded-md flex items-center gap-1.5 text-xs font-medium transition-colors ${isExpanded ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              <Plus className={`w-3 h-3 ${isExpanded ? 'rotate-45' : ''}`} />
                              <span>{isExpanded ? 'Hide' : 'Add Note'}</span>
                            </button>
                          </div>

                          {isExpanded && (
                            <div className="px-3 pb-3 border-t border-gray-100 bg-amber-50/30">
                              <div className="pt-2">
                                <div className="flex items-center justify-between mb-1.5">
                                  <label className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                                    <StickyNote className="w-3 h-3" />
                                    AI Instructions
                                  </label>
                                  {noteText && (
                                    <button onClick={() => clearFormatZoneNote(previewFormat.id, zone.id)} className="text-xs font-medium text-red-500 hover:text-red-700 flex items-center gap-1">
                                      <Trash2 className="w-3 h-3" /> Clear
                                    </button>
                                  )}
                                </div>
                                <textarea
                                  value={noteText}
                                  onChange={(e) => setFormatZoneNote(previewFormat.id, zone.id, e.target.value)}
                                  placeholder={`e.g., "Emphasize key findings" or "Keep it under 100 words"`}
                                  className="w-full px-3 py-2 text-sm border border-amber-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder:text-gray-400"
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT PANE: Gallery Grid */}
        <div className={`h-full overflow-y-auto px-5 py-4 transition-all duration-300 ${previewFormatId ? 'w-7/12 bg-gray-50/50' : 'w-full bg-white'}`}>
          {isLoadingCurrent ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
                <span className="text-sm font-medium text-gray-500">Loading formats...</span>
              </div>
            </div>
          ) : filteredFormats.length > 0 ? (
            <div className={`grid gap-4 ${previewFormatId ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
              {filteredFormats.map(format => {
                const variant = renderedVariantsMap.get(format.id)
                return (
                  <VariantCard
                    key={format.id}
                    format={format}
                    onSelect={handlePreviewClick}
                    isSelected={previewFormatId === format.id}
                    renderedVariant={variant}
                  />
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mb-4">
                <Layers className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Formats Found</h3>
              <p className="text-sm text-gray-500 max-w-sm mb-4">
                {currentFormatsList.length === 0 
                  ? (activeTab === 'mine' ? "You haven't created any custom formats yet." : "No official formats are currently available.")
                  : "We couldn't find any formats matching your current filters."}
              </p>
              {(filters.category || filters.dimension) && (
                <button onClick={clearFilters} className="text-sm px-4 py-2 font-medium rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors">
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
