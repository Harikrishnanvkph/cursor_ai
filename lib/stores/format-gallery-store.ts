/**
 * Format Gallery Store (Zustand)
 * 
 * Manages the gallery state: whether gallery mode is active, which formats
 * are available, which variant was selected, and filter state.
 */

import { create } from 'zustand'
import type { FormatCategory, FormatBlueprintRow, GalleryFilters } from '@/lib/format-types'

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
  setSelectedFormat: (formatId: string, chartType: string) => void
  clearSelection: () => void

  // Filters
  filters: GalleryFilters
  setFilters: (filters: Partial<GalleryFilters>) => void
  clearFilters: () => void

  // ── Interactive Zone State ──────────────────────────
  // Interactive Zone State
  /** Currently hovered zone (highlight on hover) */
  hoveredZoneId: string | null
  setHoveredZoneId: (id: string | null) => void
  /** Currently selected zone (click-to-select) */
  selectedZoneId: string | null
  setSelectedZoneId: (id: string | null) => void
  /** Zone being inline-edited (double-click to edit) */
  editingZoneId: string | null
  setEditingZoneId: (id: string | null) => void
  /** Update a specific zone's style in the selected format skeleton */
  updateZoneStyle: (zoneId: string, styleUpdates: Record<string, any>) => void

  // AI Generation Notes
  /** Format-specific notes provided by the user for generation. formatId -> zoneId -> noteText */
  formatZoneNotes: Record<string, Record<string, string>>
  setFormatZoneNote: (formatId: string, zoneId: string, note: string) => void
  clearFormatZoneNote: (formatId: string, zoneId: string) => void

  // Reset all gallery state
  resetGallery: () => void
}

export const useFormatGalleryStore = create<FormatGalleryStore>()(
  (set) => ({
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
    setSelectedFormat: (formatId, chartType) => set({
      selectedFormatId: formatId,
      selectedChartType: chartType,
      isGalleryOpen: false  // Close gallery when format is selected
    }),
    clearSelection: () => set({
      selectedFormatId: null,
      selectedChartType: null
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
      const formats = state.formats.map(f => {
        if (f.id !== state.selectedFormatId) return f
        const skeleton = { ...(f.skeleton as any) }
        const zones = (skeleton.zones || []).map((z: any) => {
          if (z.id !== zoneId) return z
          return { ...z, style: { ...z.style, ...styleUpdates } }
        })
        return { ...f, skeleton: { ...skeleton, zones } }
      })
      return { formats }
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

    // Reset
    resetGallery: () => set({
      isGalleryOpen: false,
      formats: [],
      userFormats: [],
      contentPackage: null,
      selectedFormatId: null,
      selectedChartType: null,
      filters: {},
      isLoadingFormats: false,
      isLoadingUserFormats: false,
      contextualImageUrl: null,
      hoveredZoneId: null,
      selectedZoneId: null,
      editingZoneId: null,
      formatZoneNotes: {}
    })
  })
)
