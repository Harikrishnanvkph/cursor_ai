"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { CHART_STYLE_PRESETS } from "@/lib/chart-style-defaults"
import { Button } from "@/components/ui/button"
import { Palette, Globe, Edit, Trash2, ArrowLeft, Tag, Search, Filter, Package, Database, X } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PresetPreviewChart } from "@/components/chart-style-gallery/preset-preview-chart"
import type { ChartStylePreset, PresetCategory } from "@/lib/chart-style-types"

type PresetSource = 'built-in' | 'database'

interface MergedPreset extends ChartStylePreset {
  source: PresetSource
}

const CHART_TYPE_FILTERS = [
  'all', 'bar', 'line', 'pie', 'doughnut', 'radar', 'polarArea',
  'horizontalBar', 'stackedBar', 'bar3d', 'pie3d', 'doughnut3d', 'scatter', 'bubble',
] as const

const CATEGORY_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: 'all' },
  { label: 'Minimal', value: 'minimal' },
  { label: 'Bold', value: 'bold' },
  { label: 'Pastel', value: 'pastel' },
  { label: 'Dark', value: 'dark' },
  { label: 'Professional', value: 'professional' },
  { label: '3D', value: '3d' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Earthy', value: 'earthy' },
]

export default function AdminPresetsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [dbPresets, setDbPresets] = useState<ChartStylePreset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [chartTypeFilter, setChartTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'built-in' | 'database'>('all')

  // For deletion
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/signin')
      return
    }

    if (!user.is_admin) {
      router.push('/')
      return
    }

    fetchPresets()
  }, [user, loading, router])

  const fetchPresets = async () => {
    try {
      setIsLoading(true)
      const res = await dataService.getChartStylePresets()
      if (res.error) throw new Error(res.error)

      // Map Supabase rows to camelCase ChartStylePreset structure
      const parsedPresets = (res.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        chartType: row.chart_type,
        colorStrategy: row.color_strategy,
        configSnapshot: row.config_snapshot || {},
        datasetStyle: row.dataset_style || {},
        dimensions: row.dimensions || null,
        category: row.category || 'minimal',
        tags: row.tags || [],
        isOfficial: row.is_official || false,
        sortOrder: row.sort_order || 100,
        thumbnailUrl: row.thumbnail_url
      }))

      setDbPresets(parsedPresets)
    } catch (err) {
      console.error("Failed to fetch presets:", err)
      toast.error("Failed to load style presets from database")
    } finally {
      setIsLoading(false)
    }
  }

  // Merge hardcoded + DB presets. DB takes priority for same IDs.
  const mergedPresets: MergedPreset[] = useMemo(() => {
    const dbIds = new Set(dbPresets.map(p => p.id))

    // Add all hardcoded presets that are NOT overridden in DB
    const builtInPresets: MergedPreset[] = CHART_STYLE_PRESETS
      .filter(p => !dbIds.has(p.id))
      .map(p => ({ ...p, source: 'built-in' as PresetSource }))

    // Add all DB presets
    const dbMerged: MergedPreset[] = dbPresets
      .map(p => ({ ...p, source: 'database' as PresetSource }))

    return [...dbMerged, ...builtInPresets].sort((a, b) => (a.sortOrder || 100) - (b.sortOrder || 100))
  }, [dbPresets])

  // Apply filters
  const filteredPresets = useMemo(() => {
    return mergedPresets.filter(preset => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          preset.name.toLowerCase().includes(q) ||
          preset.description.toLowerCase().includes(q) ||
          preset.chartType.toLowerCase().includes(q) ||
          preset.tags.some(t => t.toLowerCase().includes(q)) ||
          preset.category.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }

      // Chart type filter
      if (chartTypeFilter !== 'all' && preset.chartType !== chartTypeFilter) return false

      // Category filter
      if (categoryFilter !== 'all' && preset.category !== categoryFilter) return false

      // Source filter
      if (sourceFilter !== 'all' && preset.source !== sourceFilter) return false

      return true
    })
  }, [mergedPresets, searchQuery, chartTypeFilter, categoryFilter, sourceFilter])

  // Get unique chart types from all presets for the filter
  const availableChartTypes = useMemo(() => {
    const types = new Set(mergedPresets.map(p => p.chartType))
    return ['all', ...Array.from(types).sort()]
  }, [mergedPresets])

  const handlePushOfficial = async (id: string, isOfficial: boolean) => {
    try {
      const res = await dataService.setChartStylePresetOfficial(id, isOfficial)
      if (res.error) throw new Error(res.error)

      toast.success(isOfficial ? "Preset pushed globally!" : "Preset removed from global scope")
      fetchPresets() // Reload list
    } catch (err) {
      console.error("Failed to update preset status:", err)
      toast.error("Failed to update official status")
    }
  }

  const handleEdit = (preset: MergedPreset) => {
    // For both built-in and DB presets, navigate to editor with the preset ID
    // The editor will try DB first, then fall back to hardcoded presets
    router.push(`/editor?editPresetId=${preset.id}`)
  }

  const handleDeleteClick = (id: string) => {
    setPresetToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!presetToDelete) return
    try {
      const res = await dataService.deleteChartStylePreset(presetToDelete)
      if (res.error) throw new Error(res.error)

      toast.success("Style preset deleted")
      fetchPresets()
    } catch (err: any) {
      console.error("Delete failed:", err)
      toast.error(err.message || "Failed to delete preset")
    } finally {
      setDeleteConfirmOpen(false)
      setPresetToDelete(null)
    }
  }

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    chartTypeFilter !== 'all' ? 1 : 0,
    categoryFilter !== 'all' ? 1 : 0,
    sourceFilter !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  const clearAllFilters = () => {
    setSearchQuery('')
    setChartTypeFilter('all')
    setCategoryFilter('all')
    setSourceFilter('all')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user?.is_admin) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-black text-gray-100 p-4 pt-6">
      <div className="px-2 mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/admin')}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Back to Admin"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Global Preset Manager
              </h1>
              <p className="text-gray-400 text-sm mt-0.5">
                {mergedPresets.length} total presets • {dbPresets.length} in database • {mergedPresets.length - dbPresets.length} built-in
              </p>
            </div>
          </div>

          <div className="text-xs text-gray-500 max-w-[300px] text-right font-medium">
            💡 Create new presets in the <button onClick={() => router.push('/editor')} className="text-violet-400 hover:underline">Chart Editor</button> using &quot;Publish as Style&quot;.
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 mb-6 space-y-3">
          {/* Search + Source filter row */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets by name, type, tags..."
                className="w-full bg-gray-800/80 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-gray-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Source Filter */}
            <div className="flex items-center gap-1.5 bg-gray-800/60 border border-gray-700 rounded-lg p-1">
              {(['all', 'built-in', 'database'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSourceFilter(s)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                    sourceFilter === s
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {s === 'built-in' && <Package className="w-3 h-3" />}
                  {s === 'database' && <Database className="w-3 h-3" />}
                  {s === 'all' ? 'All Sources' : s === 'built-in' ? 'Built-in' : 'Database'}
                </button>
              ))}
            </div>
          </div>

          {/* Chart type pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold self-center mr-1">Type:</span>
            {availableChartTypes.map(type => (
              <button
                key={type}
                onClick={() => setChartTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  chartTypeFilter === type
                    ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                    : 'bg-gray-800/40 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {type === 'all' ? 'All Types' : type}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold self-center mr-1">Category:</span>
            {CATEGORY_FILTERS.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all ${
                  categoryFilter === cat.value
                    ? 'bg-violet-600/20 text-violet-300 border-violet-500/40'
                    : 'bg-gray-800/40 text-gray-500 border-gray-700/50 hover:border-gray-600 hover:text-gray-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Active filter count + Clear */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-gray-400">
                Showing {filteredPresets.length} of {mergedPresets.length} presets
              </span>
              <button
                onClick={clearAllFilters}
                className="text-xs text-violet-400 hover:text-violet-300 underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Presets Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPresets.map(preset => (
              <Card key={preset.id} className="bg-gray-900 border-gray-800 flex flex-col hover:border-violet-500/30 transition-all duration-300">
                <CardContent className="p-4 flex-1 flex flex-col">
                  {/* Preset Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-violet-400">
                        <Palette className="w-5 h-5 shrink-0" />
                        <h3 className="font-semibold text-lg text-white line-clamp-1">{preset.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-gray-800 text-gray-400 border border-gray-700">
                          {preset.chartType}
                        </span>
                        <span className="text-[10px] capitalize px-2 py-0.5 rounded bg-violet-950/40 text-violet-300 border border-violet-800/40">
                          {preset.category}
                        </span>
                        {/* Source badge */}
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium flex items-center gap-1 ${
                          preset.source === 'built-in'
                            ? 'bg-amber-950/40 text-amber-400 border border-amber-800/40'
                            : 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                        }`}>
                          {preset.source === 'built-in' ? (
                            <><Package className="w-2.5 h-2.5" /> Built-in</>
                          ) : (
                            <><Database className="w-2.5 h-2.5" /> Database</>
                          )}
                        </span>
                      </div>
                    </div>
                    {preset.isOfficial && (
                      <span className="flex items-center text-[10px] px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase tracking-wider shrink-0">
                        <Globe className="w-3 h-3 mr-1" /> Global
                      </span>
                    )}
                  </div>

                  {/* Preset Dummy Data Preview */}
                  <div className="relative w-full h-44 mb-4 bg-gray-950 rounded-lg border border-gray-850 overflow-hidden shrink-0 flex items-center justify-center p-3 select-none">
                    <PresetPreviewChart preset={preset} />
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-400 flex-1 mb-4 line-clamp-2">
                    {preset.description || "No description provided."}
                  </p>

                  {/* Tags */}
                  {preset.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap mb-4">
                      <Tag className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      {preset.tags.map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-gray-850 text-gray-400 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-gray-800/80">
                    {preset.source === 'built-in' && (
                      <div className="text-[11px] text-amber-500/85 bg-amber-950/20 border border-amber-900/30 rounded px-2.5 py-1.5 mb-1.5 font-medium flex items-center gap-2">
                        <Package className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Built-in offline presets are read-only and cannot be modified.</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {preset.source === 'built-in' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-gray-900/60 border-gray-850 text-gray-500 font-medium cursor-not-allowed hover:bg-gray-900/60 hover:text-gray-500"
                          disabled
                          title="Offline built-in presets cannot be edited directly."
                        >
                          <Edit className="w-4 h-4 mr-2 text-gray-600" />
                          Edit Disabled (Offline)
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 bg-gray-800 hover:bg-gray-700 border-gray-700 text-white font-medium"
                          onClick={() => handleEdit(preset)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit in Editor
                        </Button>
                      )}

                      {preset.source === 'database' && (
                        <>
                          <Button
                            variant={preset.isOfficial ? "outline" : "default"}
                            size="sm"
                            className={`flex-grow-0 px-3 ${preset.isOfficial ? "bg-gray-800 hover:bg-gray-700 border-gray-700 text-white" : "bg-violet-600 hover:bg-violet-700 text-white"}`}
                            onClick={() => handlePushOfficial(preset.id, !preset.isOfficial)}
                            title={preset.isOfficial ? "Remove from Global presets" : "Make this preset Global"}
                          >
                            <Globe className="w-4 h-4 mr-2" />
                            <span>{preset.isOfficial ? "Unpush" : "Push"}</span>
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="w-10 p-0 flex-shrink-0"
                            onClick={() => handleDeleteClick(preset.id)}
                            title="Delete Preset"
                          >
                            <Trash2 className="w-4 h-4 text-white" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredPresets.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 bg-gray-900/30 rounded-2xl border border-dashed border-gray-800">
                <Palette className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                {activeFilterCount > 0 ? (
                  <>
                    <p className="font-semibold text-lg text-white mb-1">No presets match your filters</p>
                    <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
                    <button onClick={clearAllFilters} className="mt-3 text-sm text-violet-400 hover:text-violet-300 underline">
                      Clear all filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-lg text-white mb-1">No presets found</p>
                    <p className="text-sm text-gray-500">Go to the Chart Editor to style and publish your first preset style.</p>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        <ConfirmDialog
          open={deleteConfirmOpen}
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={confirmDelete}
          title="Delete Preset"
          description="Are you sure you want to delete this preset? This preset will be removed from all users and libraries."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  )
}
