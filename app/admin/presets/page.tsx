"use client"

import React, { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { CHART_STYLE_PRESETS } from "@/lib/chart-style-defaults"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Palette,
  Globe,
  Edit,
  Trash2,
  ArrowLeft,
  Search,
  Package,
  Database,
  X,
  Plus,
  RotateCcw,
} from "lucide-react"
import { toast } from "sonner"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { PresetPreviewChart } from "@/components/chart-style-gallery/preset-preview-chart"
import type { ChartStylePreset } from "@/lib/chart-style-types"

type PresetSource = 'built-in' | 'database'

interface MergedPreset extends ChartStylePreset {
  source: PresetSource
}

const CATEGORY_FILTERS: { label: string; value: string }[] = [
  { label: 'All Categories', value: 'all' },
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
  const { user, sessionVerified } = useAuth()
  const router = useRouter()
  const [dbPresets, setDbPresets] = useState<ChartStylePreset[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [chartTypeFilter, setChartTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState<'all' | 'built-in' | 'database'>('all')
  const [onlyGlobal, setOnlyGlobal] = useState(false)

  // For deletion
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [presetToDelete, setPresetToDelete] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionVerified) return

    if (!user || !user.is_admin) {
      router.replace('/admin/signin?redirect=/admin/presets')
      return
    }

    fetchPresets()
  }, [user, sessionVerified, router])

  const fetchPresets = async () => {
    try {
      setIsLoading(true)
      const res = await dataService.getChartStylePresets()
      if (res.error) throw new Error(res.error)

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
        thumbnailUrl: row.thumbnail_url,
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

    const builtInPresets: MergedPreset[] = CHART_STYLE_PRESETS
      .filter(p => !dbIds.has(p.id))
      .map(p => ({ ...p, source: 'built-in' as PresetSource }))

    const dbMerged: MergedPreset[] = dbPresets
      .map(p => ({ ...p, source: 'database' as PresetSource }))

    return [...dbMerged, ...builtInPresets].sort((a, b) => (a.sortOrder || 100) - (b.sortOrder || 100))
  }, [dbPresets])

  const filteredPresets = useMemo(() => {
    return mergedPresets.filter(preset => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        const matchesSearch =
          preset.name.toLowerCase().includes(q) ||
          preset.description.toLowerCase().includes(q) ||
          preset.chartType.toLowerCase().includes(q) ||
          preset.tags.some(t => typeof t === 'string' && t.toLowerCase().includes(q)) ||
          preset.category.toLowerCase().includes(q)
        if (!matchesSearch) return false
      }

      if (chartTypeFilter !== 'all' && preset.chartType !== chartTypeFilter) return false
      if (categoryFilter !== 'all' && preset.category !== categoryFilter) return false
      if (sourceFilter !== 'all' && preset.source !== sourceFilter) return false
      if (onlyGlobal && !preset.isOfficial) return false

      return true
    })
  }, [mergedPresets, searchQuery, chartTypeFilter, categoryFilter, sourceFilter, onlyGlobal])

  const availableChartTypes = useMemo(() => {
    const types = new Set(mergedPresets.map(p => p.chartType))
    return ['all', ...Array.from(types).sort()]
  }, [mergedPresets])

  const handlePushOfficial = async (id: string, isOfficial: boolean) => {
    try {
      const res = await dataService.setChartStylePresetOfficial(id, isOfficial)
      if (res.error) throw new Error(res.error)

      toast.success(isOfficial ? "Preset pushed globally!" : "Preset removed from global scope")
      fetchPresets()
    } catch (err) {
      console.error("Failed to update preset status:", err)
      toast.error("Failed to update official status")
    }
  }

  const handleEdit = (preset: MergedPreset) => {
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

  const hasActiveFilters =
    Boolean(searchQuery) ||
    chartTypeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    sourceFilter !== 'all' ||
    onlyGlobal

  const clearAllFilters = () => {
    setSearchQuery('')
    setChartTypeFilter('all')
    setCategoryFilter('all')
    setSourceFilter('all')
    setOnlyGlobal(false)
  }

  const builtInCount = mergedPresets.length - dbPresets.length

  if (!sessionVerified) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm font-medium">Loading admin panel...</p>
        </div>
      </div>
    )
  }

  if (!user?.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Top Bar matching /admin */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-gray-950/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/admin')}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
              title="Back to Admin"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">
                Preset Manager
              </h1>
              <p className="text-xs text-gray-400 truncate">
                {mergedPresets.length} total · {dbPresets.length} saved · {builtInCount} built-in
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => router.push('/editor')}
            className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg px-3.5 h-9 text-xs font-medium shrink-0 shadow-sm shadow-violet-600/20"
            title="Style a chart in the Editor and use Publish as Style"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New in Editor
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Compact Single-Row Filter Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 mb-6">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search presets by name, type, or tag..."
              className="w-full h-9 bg-gray-900/90 border border-white/10 rounded-lg pl-9 pr-8 text-xs sm:text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-500 hover:text-gray-300"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Controls Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Source Tabs */}
            <div className="h-9 inline-flex items-center bg-gray-900/90 border border-white/10 rounded-lg p-0.5">
              {(['all', 'database', 'built-in'] as const).map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSourceFilter(s)}
                  className={`h-full px-2.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    sourceFilter === s
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {s === 'database' && <Database className="w-3 h-3 text-emerald-400" />}
                  {s === 'built-in' && <Package className="w-3 h-3 text-amber-400" />}
                  {s === 'all' ? 'All' : s === 'database' ? 'Saved' : 'Built-in'}
                </button>
              ))}
            </div>

            {/* Chart Type Select */}
            <Select value={chartTypeFilter} onValueChange={setChartTypeFilter}>
              <SelectTrigger
                aria-label="Filter by chart type"
                className="h-9 w-[140px] bg-gray-900/90 border-white/10 text-xs font-medium text-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:ring-offset-0"
              >
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-gray-200">
                {availableChartTypes.map(type => (
                  <SelectItem
                    key={type}
                    value={type}
                    className="text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                  >
                    {type === 'all' ? 'All Types' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Select */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger
                aria-label="Filter by category"
                className="h-9 w-[145px] bg-gray-900/90 border-white/10 text-xs font-medium text-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:ring-offset-0"
              >
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-white/10 text-gray-200">
                {CATEGORY_FILTERS.map(cat => (
                  <SelectItem
                    key={cat.value}
                    value={cat.value}
                    className="text-xs focus:bg-white/10 focus:text-white cursor-pointer"
                  >
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Global Only Toggle */}
            <button
              type="button"
              onClick={() => setOnlyGlobal(prev => !prev)}
              className={`h-9 px-3 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                onlyGlobal
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-300'
                  : 'bg-gray-900/90 border-white/10 text-gray-400 hover:text-gray-200'
              }`}
              title="Show only Global presets"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global</span>
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="h-9 px-2.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors flex items-center gap-1"
                title="Reset filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Count Line (only when filtering) */}
        {hasActiveFilters && !isLoading && (
          <p className="text-xs text-gray-400 mb-4">
            Showing <span className="text-gray-200 font-medium">{filteredPresets.length}</span> of {mergedPresets.length} presets
          </p>
        )}

        {/* Presets Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-white/[0.08] bg-gray-900/40 overflow-hidden animate-pulse"
              >
                <div className="h-44 bg-gray-900/80" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 w-2/3 bg-gray-800 rounded" />
                  <div className="h-3 w-1/2 bg-gray-800/70 rounded" />
                  <div className="h-8 w-full bg-gray-800/50 rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPresets.map(preset => (
              <div
                key={preset.id}
                className="group rounded-xl border border-white/[0.08] bg-gray-900/50 hover:bg-gray-900/80 hover:border-white/15 transition-all duration-200 flex flex-col overflow-hidden"
              >
                {/* Preview Canvas */}
                <div className="relative w-full h-44 bg-gray-950/90 border-b border-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center p-3 select-none">
                  <PresetPreviewChart preset={preset} />

                  {preset.isOfficial && (
                    <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-gray-950/85 text-blue-300 border border-blue-400/35 backdrop-blur-md shadow-sm font-semibold">
                      <Globe className="w-2.5 h-2.5" />
                      Global
                    </span>
                  )}
                </div>

                {/* Info & Actions */}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-[15px] text-white truncate">
                        {preset.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                        <span className="truncate">{preset.chartType}</span>
                        <span className="text-gray-600">·</span>
                        <span className="capitalize">{preset.category}</span>
                        <span className="text-gray-600">·</span>
                        <span className="inline-flex items-center gap-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              preset.source === 'built-in' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          />
                          {preset.source === 'built-in' ? 'Built-in' : 'Saved'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400/90 line-clamp-2 mt-2.5 mb-3.5 leading-relaxed">
                    {preset.description || "No description provided."}
                  </p>

                  {/* Action Row */}
                  <div className="flex items-center gap-2 mt-auto pt-3.5 border-t border-white/[0.06]">
                    {preset.source === 'built-in' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs bg-white/[0.03] hover:bg-violet-500/15 border-white/10 hover:border-violet-500/30 text-gray-200 hover:text-violet-200 font-medium transition-colors"
                        onClick={() => handleEdit(preset)}
                        title="Clone this built-in template in the Chart Editor to save as a database preset"
                      >
                        <Edit className="w-3.5 h-3.5 mr-1.5 text-violet-400" />
                        Clone &amp; Customize
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs bg-white/[0.03] hover:bg-white/[0.08] border-white/10 text-gray-200 font-medium"
                          onClick={() => handleEdit(preset)}
                        >
                          <Edit className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          Edit
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 px-2.5 text-xs font-medium transition-colors ${
                            preset.isOfficial
                              ? 'bg-blue-500/15 hover:bg-blue-500/25 border-blue-500/30 text-blue-300'
                              : 'bg-violet-600 hover:bg-violet-500 border-transparent text-white'
                          }`}
                          onClick={() => handlePushOfficial(preset.id, !preset.isOfficial)}
                          title={preset.isOfficial ? "Remove from Global presets" : "Make this preset Global"}
                        >
                          <Globe className="w-3.5 h-3.5 mr-1.5" />
                          {preset.isOfficial ? 'Unpush' : 'Push'}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 shrink-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                          onClick={() => handleDeleteClick(preset.id)}
                          title="Delete Preset"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {filteredPresets.length === 0 && (
              <div className="col-span-full py-16 text-center text-gray-400 bg-gray-900/30 rounded-xl border border-dashed border-white/10">
                <Palette className="w-10 h-10 mx-auto mb-3 text-gray-600" />
                {hasActiveFilters ? (
                  <>
                    <p className="font-medium text-base text-white mb-1">No presets match your filters</p>
                    <p className="text-xs text-gray-500">Try adjusting your search or filter criteria.</p>
                    <button
                      onClick={clearAllFilters}
                      className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline"
                    >
                      Clear all filters
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-base text-white mb-1">No presets found</p>
                    <p className="text-xs text-gray-500">Go to the Chart Editor to style and publish your first preset.</p>
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
      </main>
    </div>
  )
}
