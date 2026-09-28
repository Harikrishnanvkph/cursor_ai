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
import type { FormatCategory, FormatBlueprintRow, GalleryFilters, ZoneType } from '@/lib/format-types'
import { dataService } from '@/lib/data-service'
import { createZone } from '@/components/format-builder/format-builder-utils'
import { defaultFormats } from '@/lib/format-defaults'

const fallbackOfficialFormats: FormatBlueprintRow[] = defaultFormats.map((f, idx) => ({
  id: f.id,
  name: f.name,
  description: f.description || null,
  category: f.category,
  skeleton: f,
  dimensions: f.dimensions,
  tags: f.tags || [],
  thumbnail_url: f.thumbnailUrl || null,
  user_id: null,
  is_official: true,
  is_public: true,
  sort_order: f.sortOrder ?? idx,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}))

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
  /** Rich Text Editor Dialog state for deep content editing */
  richEditorOpen: boolean
  richEditorZoneId: string | null
  openRichEditor: (zoneId: string) => void
  closeRichEditor: () => void
  /** Update a specific zone's style in the selected format skeleton.
   *  Updates BOTH the in-memory formats[] AND the persisted snapshot. */
  updateZoneStyle: (zoneId: string, styleUpdates: Record<string, any>) => void
  /** Whether direct canvas zone resize mode is enabled */
  isResizeMode: boolean
  setResizeMode: (enabled: boolean) => void
  /** Update a specific zone's position (x, y, width, height) in the selected format skeleton.
   *  Updates BOTH the in-memory formats[] AND the persisted snapshot. */
  updateZonePosition: (zoneId: string, position: { x: number; y: number; width: number; height: number }) => void
  /** Reset all zone positions for the selected format back to original defaults */
  resetFormatPositions: () => void
  /** Toggle visibility of a specific zone in the selected format working copy */
  toggleZoneVisibility: (zoneId: string) => void
  /** Delete a specific zone from the selected format working copy (chart zone is protected) */
  deleteZone: (zoneId: string) => void
  /** Add a new zone to the selected format working copy */
  addZone: (type: ZoneType, subConfig?: Record<string, any>) => void

  // AI Generation Notes
  /** Format-specific notes provided by the user for generation. formatId -> zoneId -> noteText */
  formatZoneNotes: Record<string, Record<string, string>>
  setFormatZoneNote: (formatId: string, zoneId: string, note: string) => void
  clearFormatZoneNote: (formatId: string, zoneId: string) => void

  // Caching metadata & actions
  lastFetchedAt: string | null
  loadFormats: (force?: boolean) => Promise<void>
  deleteFormat: (id: string) => Promise<{ success: boolean; error?: string }>

  // AI Content Bank Drawer
  isContentBankOpen: boolean
  openContentBank: () => void
  closeContentBank: () => void
  toggleContentBank: () => void

  // Zone Content Overrides
  zoneContentOverrides: Record<string, string>
  setZoneContentOverride: (zoneId: string, content: string) => void
  clearZoneContentOverride: (zoneId: string) => void
  clearAllZoneContentOverrides: () => void
  updateZoneContent: (zoneId: string, content: string) => void

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

/** Apply zone content update to a format blueprint, returning a new copy */
function applyZoneContentToFormat(
  format: FormatBlueprintRow,
  zoneId: string,
  content: string
): FormatBlueprintRow {
  const skeleton = { ...(format.skeleton as any) }
  const zones = (skeleton.zones || []).map((z: any) => {
    if (z.id !== zoneId) return z
    return { ...z, content }
  })
  return { ...format, skeleton: { ...skeleton, zones } }
}

/** Apply zone position updates to a format blueprint, returning a new copy */
function applyZonePositionToFormat(
  format: FormatBlueprintRow,
  zoneId: string,
  positionUpdates: { x: number; y: number; width: number; height: number }
): FormatBlueprintRow {
  const skeleton = { ...(format.skeleton as any) }
  const zones = (skeleton.zones || []).map((z: any) => {
    if (z.id !== zoneId) return z
    return { ...z, position: { ...z.position, ...positionUpdates } }
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

    // Formats (official/global) — initialized with fallback defaults for instant rendering
    formats: fallbackOfficialFormats,
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
      // When selecting a format, create an isolated deep clone of the blueprint
      let snapshot: FormatBlueprintRow | null = null
      if (formatId) {
        const allAvailable = [...state.formats, ...state.userFormats, ...fallbackOfficialFormats]
        const found = allAvailable.find(f => f.id === formatId || f.name.toLowerCase() === formatId.toLowerCase())
        if (found) {
          snapshot = JSON.parse(JSON.stringify(found))
        }
      }
      return {
        selectedFormatId: formatId,
        selectedChartType: chartType,
        selectedFormatSnapshot: snapshot,
        selectedZoneId: null,
        editingZoneId: null,
        hoveredZoneId: null,
        isResizeMode: false,
        isGalleryOpen: false  // Close gallery when format is selected
      }
    }),
    clearSelection: () => set({
      selectedFormatId: null,
      selectedChartType: null,
      selectedFormatSnapshot: null,
      selectedZoneId: null,
      editingZoneId: null,
      hoveredZoneId: null,
      isResizeMode: false,
      zoneContentOverrides: {}
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
    richEditorOpen: false,
    richEditorZoneId: null,
    openRichEditor: (zoneId) => set({ richEditorOpen: true, richEditorZoneId: zoneId }),
    closeRichEditor: () => set({ richEditorOpen: false, richEditorZoneId: null }),
    updateZoneStyle: (zoneId, styleUpdates) => set((state) => {
      if (!state.selectedFormatId) return state

      // If snapshot doesn't exist yet, derive it cleanly from pristine catalog
      const current = state.selectedFormatSnapshot || [...state.formats, ...state.userFormats].find(f => f.id === state.selectedFormatId)
      if (!current) return state

      // Update ONLY the active working copy (selectedFormatSnapshot)
      // Master blueprints in formats[] and userFormats[] remain completely untouched!
      const updatedSnapshot = applyZoneStyleToFormat(current, zoneId, styleUpdates)

      return { selectedFormatSnapshot: updatedSnapshot }
    }),

    // Direct Canvas Zone Resizing
    isResizeMode: false,
    setResizeMode: (enabled) => set({ isResizeMode: enabled }),
    updateZonePosition: (zoneId, positionUpdates) => set((state) => {
      if (!state.selectedFormatId) return state

      // If snapshot doesn't exist yet, derive it cleanly from pristine catalog
      const current = state.selectedFormatSnapshot || [...state.formats, ...state.userFormats].find(f => f.id === state.selectedFormatId)
      if (!current) return state

      // Update ONLY the active working copy (selectedFormatSnapshot)
      // Master blueprints in formats[] and userFormats[] remain completely untouched!
      const updatedSnapshot = applyZonePositionToFormat(current, zoneId, positionUpdates)

      return { selectedFormatSnapshot: updatedSnapshot }
    }),
    resetFormatPositions: () => set((state) => {
      if (!state.selectedFormatId) return state
      // Find pristine original from loaded formats or userFormats
      const original = [...state.formats, ...state.userFormats].find(f => f.id === state.selectedFormatId)
      if (!original) return state

      return {
        selectedFormatSnapshot: JSON.parse(JSON.stringify(original)),
        selectedZoneId: null
      }
    }),

    // Zone CRUD on Selected Format Working Copy
    toggleZoneVisibility: (zoneId) => set((state) => {
      if (!state.selectedFormatId) return state
      const current = state.selectedFormatSnapshot || [...state.formats, ...state.userFormats].find(f => f.id === state.selectedFormatId)
      if (!current) return state

      const skeleton = { ...(current.skeleton as any) }
      const zones = (skeleton.zones || []).map((z: any) => {
        if (z.id !== zoneId) return z
        const currentVis = z.visible !== false
        return { ...z, visible: !currentVis }
      })

      return {
        selectedFormatSnapshot: { ...current, skeleton: { ...skeleton, zones } }
      }
    }),

    deleteZone: (zoneId) => set((state) => {
      if (!state.selectedFormatId) return state
      const current = state.selectedFormatSnapshot || [...state.formats, ...state.userFormats].find(f => f.id === state.selectedFormatId)
      if (!current) return state

      const skeleton = { ...(current.skeleton as any) }
      // Protect chart zone from deletion
      const zones = (skeleton.zones || []).filter((z: any) => {
        if (z.id === zoneId && z.type === 'chart') return true
        return z.id !== zoneId
      })

      return {
        selectedFormatSnapshot: { ...current, skeleton: { ...skeleton, zones } },
        selectedZoneId: state.selectedZoneId === zoneId ? null : state.selectedZoneId
      }
    }),

    addZone: (type, subConfig) => set((state) => {
      if (!state.selectedFormatId) return state
      const current = state.selectedFormatSnapshot || [...state.formats, ...state.userFormats].find(f => f.id === state.selectedFormatId)
      if (!current) return state

      const dims = current.dimensions || { width: 1200, height: 800 }
      const skeleton = { ...(current.skeleton as any) }
      const palette = skeleton.colorPalette || {
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#f59e0b',
        background: '#ffffff',
        text: '#1e293b'
      }

      const newZone = createZone(type, dims as any, palette, subConfig)
      newZone.visible = true

      const zones = [...(skeleton.zones || []), newZone]
      return {
        selectedFormatSnapshot: { ...current, skeleton: { ...skeleton, zones } },
        selectedZoneId: newZone.id,
        isResizeMode: true
      }
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

    // AI Content Bank Drawer
    isContentBankOpen: false,
    openContentBank: () => set({ isContentBankOpen: true }),
    closeContentBank: () => set({ isContentBankOpen: false }),
    toggleContentBank: () => set((state) => ({ isContentBankOpen: !state.isContentBankOpen })),

    // Zone Content Overrides
    zoneContentOverrides: {},
    setZoneContentOverride: (zoneId, content) => set((state) => {
      const overrides = { ...state.zoneContentOverrides, [zoneId]: content };
      let newSnapshot = state.selectedFormatSnapshot;
      if (newSnapshot) {
        newSnapshot = applyZoneContentToFormat(newSnapshot, zoneId, content);
      }
      let updatedPkg = state.contentPackage ? {
        ...state.contentPackage,
        zoneOverrides: overrides,
        [zoneId]: content
      } : null;

      return {
        zoneContentOverrides: overrides,
        selectedFormatSnapshot: newSnapshot,
        contentPackage: updatedPkg
      };
    }),
    clearZoneContentOverride: (zoneId) => set((state) => {
      const overrides = { ...state.zoneContentOverrides };
      delete overrides[zoneId];
      return { zoneContentOverrides: overrides };
    }),
    clearAllZoneContentOverrides: () => set({ zoneContentOverrides: {} }),
    updateZoneContent: (zoneId, content) => {
      get().setZoneContentOverride(zoneId, content);
    },

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

        if (!officialRes.error && officialRes.data && officialRes.data.length > 0) {
          // Merge official formats with any defaults not yet in the DB
          const existingNames = new Set(officialRes.data.map((d: any) => d.name?.toLowerCase().trim()))
          const missingDefaults = fallbackOfficialFormats.filter(
            f => !existingNames.has(f.name.toLowerCase().trim())
          )
          updates.formats = [...officialRes.data, ...missingDefaults]
        } else {
          updates.formats = fallbackOfficialFormats
        }

        if (!userRes.error && userRes.data) {
          updates.userFormats = userRes.data
        }

        // Keep active snapshot updated with latest format skeleton
        if (state.selectedFormatId && updates.formats) {
          const freshSelected = updates.formats.find(
            f => f.id === state.selectedFormatId || f.name.toLowerCase() === (state.selectedFormatSnapshot?.name || '').toLowerCase()
          )
          if (freshSelected) {
            updates.selectedFormatSnapshot = JSON.parse(JSON.stringify(freshSelected))
            updates.selectedFormatId = freshSelected.id
          }
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

    deleteFormat: async (id: string) => {
      try {
        const res = await dataService.deleteFormat(id)
        if (res.error) {
          return { success: false, error: res.error }
        }

        const state = get()
        const updatedUserFormats = state.userFormats.filter(f => f.id !== id)
        const updatedFormats = state.formats.filter(f => f.id !== id)
        const isSelected = state.selectedFormatId === id

        set({
          userFormats: updatedUserFormats,
          formats: updatedFormats,
          ...(isSelected ? {
            selectedFormatId: null,
            selectedChartType: null,
            selectedFormatSnapshot: null,
            selectedZoneId: null,
            editingZoneId: null,
            hoveredZoneId: null,
            isResizeMode: false,
          } : {})
        })

        if (isSelected) {
          try {
            const { useTemplateStore } = await import('@/lib/template-store')
            useTemplateStore.getState().setEditorMode('chart')
            useTemplateStore.getState().setGenerateMode('chart')
          } catch (e) {}
        }

        return { success: true }
      } catch (err: any) {
        console.error('Failed to delete format:', err)
        return { success: false, error: err.message || 'Failed to delete format' }
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
      isResizeMode: false,
      formatZoneNotes: {},
      isContentBankOpen: false,
      zoneContentOverrides: {}
    })
  }),
  {
    name: 'format-gallery-store',
    storage: createExpiringStorage('format-gallery-store'),
    // Persist format selection AND the modified snapshot so edits survive refresh.
    // Formats catalog is intentionally NOT persisted here, ensuring pristine official blueprints are always loaded fresh.
    partialize: (state) => ({
      selectedFormatId: state.selectedFormatId,
      selectedChartType: state.selectedChartType,
      contentPackage: state.contentPackage,
      contextualImageUrl: state.contextualImageUrl,
      selectedFormatSnapshot: state.selectedFormatSnapshot,
      formatZoneNotes: state.formatZoneNotes,
      zoneContentOverrides: state.zoneContentOverrides,
      lastFetchedAt: state.lastFetchedAt,
    }),
  }
  )
)
