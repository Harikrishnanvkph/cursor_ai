/**
 * Chart Style Store
 *
 * Zustand store for managing chart style presets.
 * Phase 1: Reads from hardcoded defaults (chart-style-defaults.ts)
 * Phase 2: Will fetch from Supabase (chart_style_presets table)
 */

import { create } from 'zustand'
import type { ChartStylePreset, PresetCategory } from '../chart-style-types'
import { getOfficialPresets } from '../chart-style-defaults'
import { applyPresetToChart, checkPresetCompatibility } from '../chart-style-engine'
import type { SupportedChartType } from '../chart-defaults'

// ========================================
// TYPES
// ========================================

interface ChartStyleFilters {
  chartType: SupportedChartType | 'all'
  category: PresetCategory | 'all'
  searchQuery: string
}

interface ChartStyleStore {
  // ── Gallery State ─────────────────────
  isGalleryOpen: boolean
  openGallery: () => void
  closeGallery: () => void
  toggleGallery: () => void

  // ── Presets ───────────────────────────
  officialPresets: ChartStylePreset[]
  userPresets: ChartStylePreset[]       // Phase 2
  isLoading: boolean

  // ── Filters ───────────────────────────
  filters: ChartStyleFilters
  setFilters: (updates: Partial<ChartStyleFilters>) => void
  resetFilters: () => void

  // ── Computed ──────────────────────────
  /** Returns filtered presets based on current filters */
  getFilteredPresets: () => ChartStylePreset[]

  // ── Selection ─────────────────────────
  selectedPresetId: string | null
  setSelectedPresetId: (id: string | null) => void

  // ── Actions ───────────────────────────
  /** Load presets (Phase 1: hardcoded, Phase 2: from API) */
  loadPresets: () => Promise<void>

  /**
   * Apply a preset to the current chart.
   * This is the main user action — it reads the current chart state from
   * chart-store, runs applyPresetToChart(), then calls setFullChart().
   *
   * @param presetId - ID of the preset to apply
   * @param applyDimensions - Whether to also adopt the preset's dimensions
   * @returns true if applied successfully, false if preset not found
   */
  applyPreset: (presetId: string, applyDimensions?: boolean) => boolean
}

// ========================================
// DEFAULT FILTER STATE
// ========================================

const defaultFilters: ChartStyleFilters = {
  chartType: 'all',
  category: 'all',
  searchQuery: '',
}

// ========================================
// STORE
// ========================================

export const useChartStyleStore = create<ChartStyleStore>((set, get) => ({
  // ── Gallery State ─────────────────────
  isGalleryOpen: false,
  openGallery: () => {
    // Ensure presets are loaded when gallery opens
    const state = get()
    if (state.officialPresets.length === 0) {
      state.loadPresets()
    }
    set({ isGalleryOpen: true })
  },
  closeGallery: () => set({ isGalleryOpen: false, selectedPresetId: null }),
  toggleGallery: () => {
    const state = get()
    if (state.isGalleryOpen) {
      state.closeGallery()
    } else {
      state.openGallery()
    }
  },

  // ── Presets ───────────────────────────
  officialPresets: [],
  userPresets: [],
  isLoading: false,

  // ── Filters ───────────────────────────
  filters: { ...defaultFilters },
  setFilters: (updates) =>
    set((state) => ({
      filters: { ...state.filters, ...updates },
    })),
  resetFilters: () => set({ filters: { ...defaultFilters } }),

  // ── Computed ──────────────────────────
  getFilteredPresets: () => {
    const { officialPresets, userPresets, filters } = get()
    const all = [...officialPresets, ...userPresets]

    return all.filter((preset) => {
      // Filter by chart type
      if (filters.chartType !== 'all' && preset.chartType !== filters.chartType) {
        return false
      }

      // Filter by category
      if (filters.category !== 'all' && preset.category !== filters.category) {
        return false
      }

      // Filter by search query
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase()
        const matchesName = preset.name.toLowerCase().includes(q)
        const matchesDesc = preset.description.toLowerCase().includes(q)
        const matchesTags = preset.tags.some((t) => t.toLowerCase().includes(q))
        if (!matchesName && !matchesDesc && !matchesTags) {
          return false
        }
      }

      return true
    })
  },

  // ── Selection ─────────────────────────
  selectedPresetId: null,
  setSelectedPresetId: (id) => set({ selectedPresetId: id }),

  // ── Actions ───────────────────────────
  loadPresets: async () => {
    set({ isLoading: true })

    // Phase 1: Always load hardcoded defaults (instant, no network needed)
    const hardcodedPresets = getOfficialPresets()
    set({ officialPresets: hardcodedPresets })

    // Phase 2: Also attempt to fetch DB-backed presets from the API
    try {
      const { dataService } = require('../data-service')
      const response = await dataService.getOfficialChartStylePresets()

      if (response?.data && Array.isArray(response.data) && response.data.length > 0) {
        // Convert snake_case DB rows to camelCase ChartStylePreset shape
        const dbPresets: ChartStylePreset[] = response.data.map((row: any) => ({
          id: row.id,
          name: row.name,
          description: row.description || '',
          chartType: row.chart_type,
          colorStrategy: row.color_strategy,
          configSnapshot: row.config_snapshot || {},
          datasetStyle: row.dataset_style || {},
          dimensions: row.dimensions || undefined,
          category: row.category || 'minimal',
          tags: row.tags || [],
          isOfficial: row.is_official ?? true,
          sortOrder: row.sort_order ?? 100,
          thumbnailUrl: row.thumbnail_url || undefined,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }))

        // Merge: DB presets override hardcoded ones with the same ID, then append new ones
        const hardcodedIds = new Set(hardcodedPresets.map(p => p.id))
        const newFromDB = dbPresets.filter(p => !hardcodedIds.has(p.id))
        set({ officialPresets: [...hardcodedPresets, ...newFromDB] })
      }
    } catch (error) {
      // API unavailable — hardcoded defaults are already loaded, so this is fine
      console.info('[ChartStyleStore] API presets unavailable, using hardcoded defaults only')
    }

    set({ isLoading: false })
  },

  applyPreset: (presetId: string, applyDimensions = false) => {
    // Search the store's live state (hardcoded + DB-backed presets)
    const { officialPresets, userPresets } = get()
    const allPresets = [...officialPresets, ...userPresets]
    const preset = allPresets.find(p => p.id === presetId)
    if (!preset) {
      console.warn(`[ChartStyleStore] Preset not found: ${presetId}`)
      return false
    }

    // Dynamic require to avoid circular deps — same pattern as undo-service.ts
    try {
      const { useChartStore } = require('../chart-store')
      const chartState = useChartStore.getState()

      // Check compatibility
      const { warnings } = checkPresetCompatibility(preset, chartState.chartData)
      if (warnings.length > 0) {
        console.info(`[ChartStyleStore] Compatibility warnings for "${preset.name}":`, warnings)
      }

      // Get the active config
      const activeConfig = chartState.chartConfig

      // Capture previous state for undo
      const previousState = {
        chartType: chartState.chartType,
        chartData: JSON.parse(JSON.stringify(chartState.chartData)),
        chartConfig: JSON.parse(JSON.stringify(chartState.chartConfig)),
      }

      // Apply the preset
      const result = applyPresetToChart(preset, chartState.chartData, activeConfig, {
        applyDimensions,
      })

      // Capture undo point using the same pattern as undo-service.ts
      if (chartState.hasJSON) {
        try {
          const { captureUndoPoint } = require('../chat-store')
          captureUndoPoint({
            type: 'manual_design_change',
            previousState,
            currentState: {
              chartType: result.chartType,
              chartData: result.chartData,
              chartConfig: result.chartConfig,
            },
            toolSource: 'style-preset',
            changeDescription: `Applied style: ${preset.name}`,
          })
        } catch (e) {
          console.warn('[ChartStyleStore] Failed to capture undo point:', e)
        }
      }

      // Apply via setFullChart
      chartState.setFullChart({
        chartType: result.chartType,
        chartData: result.chartData,
        chartConfig: result.chartConfig,
        replaceMode: true,
      })

      set({ selectedPresetId: presetId })
      return true
    } catch (error) {
      console.error('[ChartStyleStore] Failed to apply preset:', error)
      return false
    }
  },
}))
