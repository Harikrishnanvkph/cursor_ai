"use client"

import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react'
import type {
  FormatSkeleton, FormatZone, ZoneType, FormatColorPalette,
  FormatDimensions, ZonePosition, BaseZone, FormatCategory,
  FormatDecoration, FormatDecorationType,
} from '@/lib/format-types'
import { createDefaultSkeleton, createZone } from './format-builder-utils'
import type { EditFormatData } from './format-builder-types'

// ==========================================
// CONTEXT SHAPE
// ==========================================

interface FormatBuilderContextValue {
  // ─── Skeleton state ────────────────────────
  skeleton: FormatSkeleton
  setSkeleton: React.Dispatch<React.SetStateAction<FormatSkeleton>>

  // ─── Metadata ──────────────────────────────
  formatName: string
  setFormatName: (v: string) => void
  formatDesc: string
  setFormatDesc: (v: string) => void
  category: FormatCategory
  setCategory: (v: FormatCategory) => void
  tagsInput: string
  setTagsInput: (v: string) => void
  sortOrder: number
  setSortOrder: (v: number) => void

  // ─── Selection ─────────────────────────────
  selectedZoneId: string | null
  setSelectedZoneId: (id: string | null) => void
  selectedZone: FormatZone | null

  // ─── Canvas UI ─────────────────────────────
  zoom: number
  setZoom: (v: number | ((prev: number) => number)) => void
  showGuides: boolean
  setShowGuides: (v: boolean | ((prev: boolean) => boolean)) => void
  gridSize: number
  setGridSize: (v: number) => void

  // ─── Zone CRUD ─────────────────────────────
  addZone: (type: ZoneType, subConfig?: Record<string, any>) => void
  deleteZone: (id: string) => void
  duplicateZone: (id: string) => void
  updateZone: (id: string, updates: Partial<FormatZone>) => void
  updateZoneStyle: (id: string, styleUpdates: Record<string, any>) => void
  updateZonePosition: (id: string, position: ZonePosition) => void
  moveZoneOrder: (id: string, direction: 'up' | 'down') => void

  // ─── Dimensions / Palette ──────────────────
  setDimensions: (width: number, height: number, aspect: string, label: string) => void
  setPalette: (updates: Partial<FormatColorPalette>) => void

  // ─── Canvas tools ──────────────────────────
  alignZone: (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => void

  // ─── Decorations (separate visual layer) ───
  selectedDecoId: string | null
  setSelectedDecoId: (id: string | null) => void
  selectedDeco: FormatDecoration | null
  drawingMode: FormatDecorationType | null
  setDrawingMode: (mode: FormatDecorationType | null) => void
  addDecoration: (deco: Omit<FormatDecoration, 'id'>) => string
  updateDecoration: (id: string, updates: Partial<FormatDecoration>) => void
  deleteDecoration: (id: string) => void
  duplicateDecoration: (id: string) => void

  // ─── Edit mode ─────────────────────────────
  isEditing: boolean
  editFormat: EditFormatData | null
  adminMode: boolean
}

const FormatBuilderContext = createContext<FormatBuilderContextValue | null>(null)

export function useFormatBuilder() {
  const ctx = useContext(FormatBuilderContext)
  if (!ctx) throw new Error('useFormatBuilder must be within <FormatBuilderProvider>')
  return ctx
}

// ==========================================
// PROVIDER
// ==========================================

export function FormatBuilderProvider({
  children,
  editFormat = null,
  adminMode = false,
}: {
  children: React.ReactNode
  editFormat?: EditFormatData | null
  adminMode?: boolean
}) {
  const isEditing = !!editFormat?.id

  // ─── Core state ────────────────────────────
  const [skeleton, setSkeleton] = useState<FormatSkeleton>(() => {
    // Editing an existing format from DB — use its skeleton
    if (editFormat?.skeleton) return editFormat.skeleton

    // Creating a new format — always start fresh.
    // Clear any stale draft from a previous session so it doesn't bleed in.
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('format-builder-draft-skeleton')
      sessionStorage.removeItem('format-builder-draft-meta')
    }
    return createDefaultSkeleton()
  })

  // Sync draft to session storage (only while actively working)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('format-builder-draft-skeleton', JSON.stringify(skeleton))
    }
  }, [skeleton])

  // Clear draft on unmount so it doesn't leak into future "Create" sessions
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('format-builder-draft-skeleton')
        sessionStorage.removeItem('format-builder-draft-meta')
      }
    }
  }, [])

  const [formatName, setFormatName] = useState(editFormat?.name || 'New Format')
  const [formatDesc, setFormatDesc] = useState(editFormat?.description || '')
  const [category, setCategory] = useState<FormatCategory>(editFormat?.category || 'infographic')
  const [tagsInput, setTagsInput] = useState(editFormat?.tags?.join(', ') || '')
  const [sortOrder, setSortOrder] = useState(editFormat?.sort_order || 0)

  // ─── UI state ──────────────────────────────
  const [zoom, setZoom] = useState(0.5)
  const [showGuides, setShowGuides] = useState(true)
  const [gridSize, setGridSize] = useState(10)
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null)

  // ─── Derived ───────────────────────────────
  const selectedZone = useMemo(() =>
    skeleton.zones.find(z => z.id === selectedZoneId) || null,
    [skeleton.zones, selectedZoneId]
  )

  // ─── Zone CRUD ─────────────────────────────
  const addZoneHandler = useCallback((type: ZoneType, subConfig?: Record<string, any>) => {
    const newZone = createZone(type, skeleton.dimensions, skeleton.colorPalette, subConfig)
    setSkeleton(prev => ({ ...prev, zones: [...prev.zones, newZone] }))
    setSelectedZoneId(newZone.id)
  }, [skeleton.dimensions, skeleton.colorPalette])

  const deleteZone = useCallback((id: string) => {
    setSkeleton(prev => ({ ...prev, zones: prev.zones.filter(z => z.id !== id) }))
    setSelectedZoneId(prev => prev === id ? null : prev)
  }, [])

  const duplicateZone = useCallback((id: string) => {
    setSkeleton(prev => {
      const zone = prev.zones.find(z => z.id === id)
      if (!zone) return prev
      const copy: FormatZone = JSON.parse(JSON.stringify(zone))
      copy.id = `${zone.type}-${Date.now()}-dup`
      if (copy.position) {
        copy.position = { ...copy.position, x: copy.position.x + 20, y: copy.position.y + 20 }
      }
      setSelectedZoneId(copy.id)
      return { ...prev, zones: [...prev.zones, copy] }
    })
  }, [])

  const updateZone = useCallback((id: string, updates: Partial<FormatZone>) => {
    setSkeleton(prev => ({
      ...prev,
      zones: prev.zones.map(z => z.id === id ? { ...z, ...updates } as FormatZone : z),
    }))
  }, [])

  const updateZoneStyle = useCallback((id: string, styleUpdates: Record<string, any>) => {
    setSkeleton(prev => ({
      ...prev,
      zones: prev.zones.map(z =>
        z.id === id ? { ...z, style: { ...(z as any).style, ...styleUpdates } } as FormatZone : z
      ),
    }))
  }, [])

  const updateZonePosition = useCallback((id: string, position: ZonePosition) => {
    setSkeleton(prev => ({
      ...prev,
      zones: prev.zones.map(z => z.id === id ? { ...z, position } as FormatZone : z),
    }))
  }, [])

  const moveZoneOrder = useCallback((id: string, direction: 'up' | 'down') => {
    setSkeleton(prev => {
      const idx = prev.zones.findIndex(z => z.id === id)
      if (idx < 0) return prev
      const newZones = [...prev.zones]
      const target = direction === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= newZones.length) return prev
      ;[newZones[idx], newZones[target]] = [newZones[target], newZones[idx]]
      return { ...prev, zones: newZones }
    })
  }, [])

  // ─── Dimensions / Palette ──────────────────
  const setDimensions = useCallback((width: number, height: number, aspect: string, label: string) => {
    setSkeleton(prev => ({
      ...prev,
      dimensions: { width, height, aspect, label },
    }))
  }, [])

  const setPalette = useCallback((updates: Partial<FormatColorPalette>) => {
    setSkeleton(prev => ({
      ...prev,
      colorPalette: { ...prev.colorPalette, ...updates },
    }))
  }, [])

  // ─── Canvas tools ──────────────────────────
  const alignZone = useCallback((alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    if (!selectedZoneId) return
    setSkeleton(prev => {
      const zone = prev.zones.find(z => z.id === selectedZoneId)
      if (!zone?.position) return prev
      const pos = { ...zone.position }
      const d = prev.dimensions

      switch (alignment) {
        case 'left':     pos.x = 0; break
        case 'center-h': pos.x = (d.width - pos.width) / 2; break
        case 'right':    pos.x = d.width - pos.width; break
        case 'top':      pos.y = 0; break
        case 'center-v': pos.y = (d.height - pos.height) / 2; break
        case 'bottom':   pos.y = d.height - pos.height; break
      }

      return {
        ...prev,
        zones: prev.zones.map(z => z.id === selectedZoneId ? { ...z, position: pos } as FormatZone : z),
      }
    })
  }, [selectedZoneId])

  // ─── Decoration state ─────────────────────
  const [selectedDecoId, setSelectedDecoId] = useState<string | null>(null)
  const [drawingMode, setDrawingMode] = useState<FormatDecorationType | null>(null)

  const selectedDeco = useMemo(() =>
    (skeleton.decorations || []).find(d => d.id === selectedDecoId) || null,
    [skeleton.decorations, selectedDecoId]
  )

  const addDecoration = useCallback((deco: Omit<FormatDecoration, 'id'>) => {
    const id = `deco-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
    const newDeco: FormatDecoration = { ...deco, id } as FormatDecoration
    setSkeleton(prev => ({ ...prev, decorations: [...(prev.decorations || []), newDeco] }))
    setSelectedDecoId(id)
    return id
  }, [])

  const updateDecoration = useCallback((id: string, updates: Partial<FormatDecoration>) => {
    setSkeleton(prev => ({
      ...prev,
      decorations: (prev.decorations || []).map(d => d.id === id ? { ...d, ...updates } : d),
    }))
  }, [])

  const deleteDecoration = useCallback((id: string) => {
    setSkeleton(prev => ({ ...prev, decorations: (prev.decorations || []).filter(d => d.id !== id) }))
    setSelectedDecoId(prev => prev === id ? null : prev)
  }, [])

  const duplicateDecoration = useCallback((id: string) => {
    setSkeleton(prev => {
      const deco = (prev.decorations || []).find(d => d.id === id)
      if (!deco) return prev
      const newId = `deco-${Date.now()}-dup`
      const copy: FormatDecoration = { ...deco, id: newId, x: deco.x + 20, y: deco.y + 20 }
      setSelectedDecoId(newId)
      return { ...prev, decorations: [...(prev.decorations || []), copy] }
    })
  }, [])

  const value = useMemo<FormatBuilderContextValue>(() => ({
    skeleton, setSkeleton,
    formatName, setFormatName,
    formatDesc, setFormatDesc,
    category, setCategory,
    tagsInput, setTagsInput,
    sortOrder, setSortOrder,
    selectedZoneId, setSelectedZoneId,
    selectedZone,
    zoom, setZoom,
    showGuides, setShowGuides,
    gridSize, setGridSize,
    addZone: addZoneHandler,
    deleteZone, duplicateZone,
    updateZone, updateZoneStyle, updateZonePosition,
    moveZoneOrder,
    setDimensions, setPalette,
    alignZone,
    selectedDecoId, setSelectedDecoId,
    selectedDeco,
    drawingMode, setDrawingMode,
    addDecoration, updateDecoration, deleteDecoration, duplicateDecoration,
    isEditing, editFormat, adminMode,
  }), [
    skeleton, formatName, formatDesc, category, tagsInput, sortOrder,
    selectedZoneId, selectedZone, zoom, showGuides, gridSize,
    addZoneHandler, deleteZone, duplicateZone, updateZone, updateZoneStyle,
    updateZonePosition, moveZoneOrder, setDimensions, setPalette, alignZone,
    selectedDecoId, selectedDeco, drawingMode,
    addDecoration, updateDecoration, deleteDecoration, duplicateDecoration,
    isEditing, editFormat, adminMode,
  ])

  return (
    <FormatBuilderContext.Provider value={value}>
      {children}
    </FormatBuilderContext.Provider>
  )
}
