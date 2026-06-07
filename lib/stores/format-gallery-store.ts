/**
 * Format Gallery Store (Zustand)
 * 
 * Manages the gallery state: whether gallery mode is active, which formats
 * are available, which variant was selected, and filter state.
 * 
 * Persistence strategy:
 *   - selectedFormatId, contentPackage, contextualImageUrl → persisted for refresh
 *   - selectedFormatSnapshot → persisted copy of the MODIFIED format skeleton
 *     so that user edits (zone style changes, background updates) survive refresh
 *   - formats[], userFormats[] → NOT persisted (loaded from database on demand)
 *   - UI state (gallery open, filters, hover) → NOT persisted (resets on refresh)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createExpiringStorage } from '@/lib/storage-utils'
import type { FormatCategory, FormatBlueprintRow, GalleryFilters } from '@/lib/format-types'
import { dataService } from '@/lib/data-service'

interface FormatGalleryStore {
  // Gallery Mode
  isGalleryOpen: boolean
  openGallery: () => void
  closeGallery: () => void

  // Available format blueprints (from database)
  formats: FormatBlueprintRow[]       // official/global formats
  setFormats: (formats: FormatBlueprintRow[]) => void
  isLoadingFormats: boolean
  setLoadingFormats: (loading: boolean) => void

  // User's own custom formats (separate from official)
  userFormats: FormatBlueprintRow[]
  setUserFormats: (formats: FormatBlueprintRow[]) => void
  isLoadingUserFormats: boolean
  setLoadingUserFormats: (loading: boolean) => void

  // LLM content package (from AI response — used by variant engine)
  contentPackage: any | null
  setContentPackage: (content: any) => void
  
  // Shared contextual image from Unsplash
  contextualImageUrl: string | null
  setContextualImageUrl: (url: string | null) => void

  // Selected variant
  selectedFormatId: string | null
  selectedChartType: string | null
  /** Snapshot of the selected format with user modifications applied.
   *  This is the version that gets persisted and used for rendering,
   *  ensuring edits survive page refresh. */
  selectedFormatSnapshot: FormatBlueprintRow | null
  setSelectedFormat: (formatId: string | null, chartType: string) => void
  clearSelection: () => void

  // Filters
  filters: GalleryFilters
  setFilters: (filters: Partial<GalleryFilters>) => void
  clearFilters: () => void

  // ── Interactive Zone State ──────────────────────────
  /** Currently hovered zone (highlight on hover) */
  hoveredZoneId: string | null
  setHoveredZoneId: (id: string | null) => void
  /** Currently selected zone (click-to-select) */
  selectedZoneId: string | null
  setSelectedZoneId: (id: string | null) => void
  /** Zone being inline-edited (double-click to edit) */
  editingZoneId: string | null
  setEditingZoneId: (id: string | null) => void
  /** Update a specific zone's style in the selected format skeleton.
   *  Updates BOTH the in-memory formats[] AND the persisted snapshot. */
  updateZoneStyle: (zoneId: string, styleUpdates: Record<string, any>) => void

  // AI Generation Notes
  /** Format-specific notes provided by the user for generation. formatId -> zoneId -> noteText */
  formatZoneNotes: Record<string, Record<string, string>>
  setFormatZoneNote: (formatId: string, zoneId: string, note: string) => void
  clearFormatZoneNote: (formatId: string, zoneId: string) => void

  // Caching metadata & actions
  lastFetchedAt: string | null
  loadFormats: (force?: boolean) => Promise<void>

  // Reset all gallery state
  resetGallery: () => void
}

/** Apply zone style updates to a format blueprint, returning a new copy */
function applyZoneStyleToFormat(
  format: FormatBlueprintRow,
  zoneId: string,
  styleUpdates: Record<string, any>
): FormatBlueprintRow {
  const skeleton = { ...(format.skeleton as any) }
  const zones = (skeleton.zones || []).map((z: any) => {
    if (z.id !== zoneId) return z
    return { ...z, style: { ...z.style, ...styleUpdates } }
  })
  return { ...format, skeleton: { ...skeleton, zones } }
}

export const useFormatGalleryStore = create<FormatGalleryStore>()(
  persist(
  (set, get) => ({
    // Gallery Mode
    isGalleryOpen: false,
    openGallery: () => set({ isGalleryOpen: true }),
    closeGallery: () => set({ isGalleryOpen: false }),

    // Formats (official/global)
    formats: [],
    setFormats: (formats) => set({ formats }),
    isLoadingFormats: false,
    setLoadingFormats: (loading) => set({ isLoadingFormats: loading }),

    // User's own custom formats
    userFormats: [],
    setUserFormats: (formats) => set({ userFormats: formats }),
    isLoadingUserFormats: false,
    setLoadingUserFormats: (loading) => set({ isLoadingUserFormats: loading }),

    // Content Package
    contentPackage: null,
    setContentPackage: (content) => set({ contentPackage: content }),

    // Contextual Image
    contextualImageUrl: null,
    setContextualImageUrl: (url) => set({ contextualImageUrl: url }),

    // Selection
    selectedFormatId: null,
    selectedChartType: null,
    selectedFormatSnapshot: null,
    setSelectedFormat: (formatId, chartType) => set((state) => {
      // When selecting a format, take a snapshot of the original blueprint
      let snapshot: FormatBlueprintRow | null = null
      if (formatId) {
        snapshot = [...state.formats, ...state.userFormats].find(f => f.id === formatId) || null
      }
      return {
        selectedFormatId: formatId,
        selectedChartType: chartType,
        selectedFormatSnapshot: snapshot,
        isGalleryOpen: false  // Close gallery when format is selected
      }
    }),
    clearSelection: () => set({
      selectedFormatId: null,
      selectedChartType: null,
      selectedFormatSnapshot: null
    }),

    // Filters
    filters: {},
    setFilters: (newFilters) => set((state) => ({
      filters: { ...state.filters, ...newFilters }
    })),
    clearFilters: () => set({ filters: {} }),

    // Interactive Zone State
    hoveredZoneId: null,
    setHoveredZoneId: (id) => set({ hoveredZoneId: id }),
    selectedZoneId: null,
    setSelectedZoneId: (id) => set({ selectedZoneId: id, editingZoneId: null }),
    editingZoneId: null,
    setEditingZoneId: (id) => set({ editingZoneId: id }),
    updateZoneStyle: (zoneId, styleUpdates) => set((state) => {
      if (!state.selectedFormatId) return state

      // Update the in-memory formats[] for immediate rendering
      const formats = state.formats.map(f => {
        if (f.id !== state.selectedFormatId) return f
        return applyZoneStyleToFormat(f, zoneId, styleUpdates)
      })

      // Also update userFormats if the selected format is a user format
      const userFormats = state.userFormats.map(f => {
        if (f.id !== state.selectedFormatId) return f
        return applyZoneStyleToFormat(f, zoneId, styleUpdates)
      })

      // Update the persisted snapshot so edits survive refresh
      const updatedSnapshot = state.selectedFormatSnapshot
        ? applyZoneStyleToFormat(state.selectedFormatSnapshot, zoneId, styleUpdates)
        : null

      return { formats, userFormats, selectedFormatSnapshot: updatedSnapshot }
    }),

    // AI Generation Notes
    formatZoneNotes: {},
    setFormatZoneNote: (formatId, zoneId, note) => set((state) => ({
      formatZoneNotes: {
        ...state.formatZoneNotes,
        [formatId]: {
          ...(state.formatZoneNotes[formatId] || {}),
          [zoneId]: note
        }
      }
    })),
    clearFormatZoneNote: (formatId, zoneId) => set((state) => {
      const updatedNotes = { ...state.formatZoneNotes };
      if (updatedNotes[formatId]) {
        delete updatedNotes[formatId][zoneId];
      }
      return { formatZoneNotes: updatedNotes };
    }),

    // Caching metadata & actions
    lastFetchedAt: null,
    loadFormats: async (force = false) => {
      const state = get()
      const COOLDOWN_MS = 1 * 60 * 1000 // 1 minute
      const isWithinCooldown = state.lastFetchedAt &&
        (Date.now() - new Date(state.lastFetchedAt).getTime()) < COOLDOWN_MS

      if (!force && isWithinCooldown && state.formats.length > 0) {
        return
      }

      const silent = state.formats.length > 0
      if (!silent) {
        set({ isLoadingFormats: true, isLoadingUserFormats: true })
      }

      try {
        const [officialRes, userRes] = await Promise.all([
          dataService.getOfficialFormats(),
          dataService.getUserFormats()
        ])

        const updates: Partial<FormatGalleryStore> = {
          lastFetchedAt: new Date().toISOString()
        }

        if (!officialRes.error && officialRes.data) {
          updates.formats = officialRes.data
        }
        if (!userRes.error && userRes.data) {
          updates.userFormats = userRes.data
        }

        set(updates)
      } catch (err) {
        console.error('Failed to load formats in background:', err)
      } finally {
        if (!silent) {
          set({ isLoadingFormats: false, isLoadingUserFormats: false })
        }
      }
    },

    // Reset
    resetGallery: () => set({
      isGalleryOpen: false,
      contentPackage: null,
      selectedFormatId: null,
      selectedChartType: null,
      selectedFormatSnapshot: null,
      filters: {},
      isLoadingFormats: false,
      isLoadingUserFormats: false,
      contextualImageUrl: null,
      hoveredZoneId: null,
      selectedZoneId: null,
      editingZoneId: null,
      formatZoneNotes: {}
    })
  }),
  {
    name: 'format-gallery-store',
    storage: createExpiringStorage('format-gallery-store'),
    // Persist format selection AND the modified snapshot so edits survive refresh.
    partialize: (state) => ({
      selectedFormatId: state.selectedFormatId,
      selectedChartType: state.selectedChartType,
      contentPackage: state.contentPackage,
      contextualImageUrl: state.contextualImageUrl,
      selectedFormatSnapshot: state.selectedFormatSnapshot,
      formats: state.formats,
      userFormats: state.userFormats,
      lastFetchedAt: state.lastFetchedAt,
    }),
  }
  )
)
