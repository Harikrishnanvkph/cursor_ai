"use client"

import { create } from "zustand"

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export type DecorationShapeType =
  | 'freehand'
  | 'line'
  | 'arrow'
  | 'double-arrow'
  | 'cloud-line'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'text-callout'
  | 'polygon'
  | 'cloud'
  | 'connected-lines'
  | 'bezier-line'
  | 'bspline-curve'
  | 'crossmark'
  | 'checkmark'
  | 'dot'
  | 'num-0' | 'num-1' | 'num-2' | 'num-3' | 'num-4'
  | 'num-5' | 'num-6' | 'num-7' | 'num-8' | 'num-9'
  | 'emoji-star' | 'emoji-warning' | 'emoji-heart' | 'emoji-thumb'
  | 'emoji-fire' | 'emoji-idea' | 'emoji-check' | 'emoji-cross'
  | 'emoji-smile' | 'emoji-sad' | 'emoji-rocket' | 'emoji-target' | 'emoji-laugh'
  | 'emoji-clap' | 'emoji-eyes' | 'emoji-sparkles' | 'emoji-party'
  | 'emoji-brain' | 'emoji-muscle' | 'emoji-crown' | 'emoji-diamond'
  | 'emoji-medal' | 'emoji-clock' | 'emoji-lock' | 'emoji-umbrella'
  | 'exclamation' | 'question' | 'pushpin' | 'bullseye'
  | 'hexagon' | 'heart' | 'pentagon' | 'diamond-shape'
  // Section element types
  | 'textbox'
  | 'textbox-auto'
  | 'deco-image'
  | 'deco-svg'

export interface DecorationShape {
  id: string
  type: DecorationShapeType
  x: number
  y: number
  width: number
  height: number
  rotation: number
  /** For freehand, polygon, connected-lines: array of points relative to (x,y) */
  points?: { x: number; y: number }[]
  fillColor: string
  fillOpacity: number
  strokeColor: string
  strokeWidth: number
  strokeStyle: 'solid' | 'dashed' | 'dotted'
  strokeDashPattern?: string
  /** Text content for text-callout and textbox shapes */
  text?: string
  visible: boolean
  locked: boolean
  zIndex: number
  // ── Textbox fields ────────────────────────────────
  /** When true, textbox auto-sizes based on content (no fixed w/h) */
  autoSize?: boolean
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold'
  fontStyle?: 'normal' | 'italic'
  textDecoration?: 'none' | 'underline' | 'line-through'
  textAlign?: 'left' | 'center' | 'right'
  textColor?: string
  lineHeight?: number
  // ── Image fields ──────────────────────────────────
  imageUrl?: string
  imageFit?: 'fill' | 'cover' | 'contain'
  borderRadius?: number
  // ── SVG fields ────────────────────────────────────
  svgContent?: string
}

export type DrawingMode = DecorationShapeType | 'marquee-select'

export interface DrawingState {
  /** The shape type being drawn */
  mode: DrawingMode
  /** Start coordinate (canvas-local) */
  startX: number
  startY: number
  /** Current coordinate (canvas-local) */
  currentX: number
  currentY: number
  /** Accumulated points for multi-point shapes */
  points: { x: number; y: number }[]
  /** Whether shift key is held (for angle snapping) */
  shiftKey: boolean
}

// ═══════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════

export interface GlobalShapeSettings {
  fillColor: string
  fillOpacity: number
  strokeColor: string
  strokeWidth: number
  strokeStyle: 'solid' | 'dashed' | 'dotted'
  strokeDashPattern?: string
}

interface DecorationStore {
  shapes: DecorationShape[]
  selectedShapeId: string | null
  /** Multiple selected shape IDs (marquee / shift-click) */
  selectedShapeIds: string[]
  drawingMode: DrawingMode | null
  globalShapeSettings: GlobalShapeSettings

  // Global Settings
  setGlobalShapeSettings: (settings: Partial<GlobalShapeSettings>) => void

  // Shape CRUD
  addShape: (shape: Omit<DecorationShape, 'id'>) => string
  updateShape: (id: string, updates: Partial<DecorationShape>) => void
  removeShape: (id: string) => void
  clearShapes: () => void

  // Selection
  setSelectedShapeId: (id: string | null) => void
  /** Set multiple selected shape IDs (replaces any existing multi-select) */
  setSelectedShapeIds: (ids: string[]) => void
  /** Toggle a single shape id in/out of multi-select */
  toggleShapeSelection: (id: string) => void
  /** Clear multi-select */
  clearMultiSelect: () => void

  // Drawing
  setDrawingMode: (mode: DrawingMode | null) => void

  // Convenience actions
  duplicateShape: (id: string) => void
  toggleLock: (id: string) => void
  bringToFront: (id: string) => void
  sendToBack: (id: string) => void
}

const generateId = () => `deco-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

export const useDecorationStore = create<DecorationStore>()((set, get) => ({
  shapes: [],
  selectedShapeId: null,
  selectedShapeIds: [],
  drawingMode: null,
  globalShapeSettings: {
    fillColor: 'transparent',
    fillOpacity: 100,
    strokeColor: '#3b82f6',
    strokeWidth: 2,
    strokeStyle: 'solid',
    strokeDashPattern: ''
  },

  setGlobalShapeSettings: (updates) => set((state) => ({
    globalShapeSettings: { ...state.globalShapeSettings, ...updates }
  })),

  // ── Shape CRUD ──────────────────────────────────────

  addShape: (shape) => {
    const id = generateId()
    const newShape: DecorationShape = { ...shape, id }
    set((state) => ({
      shapes: [...state.shapes, newShape],
      selectedShapeId: state.drawingMode ? state.selectedShapeId : id
    }))
    return id
  },

  updateShape: (id, updates) => set((state) => ({
    shapes: state.shapes.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  removeShape: (id) => set((state) => ({
    shapes: state.shapes.filter(s => s.id !== id),
    selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId
  })),

  clearShapes: () => set({
    shapes: [],
    selectedShapeId: null,
    selectedShapeIds: []
  }),

  // ── Selection ───────────────────────────────────────

  setSelectedShapeId: (id) => set({ selectedShapeId: id, selectedShapeIds: [] }),

  setSelectedShapeIds: (ids) => set({
    selectedShapeIds: ids,
    selectedShapeId: ids.length === 1 ? ids[0] : null
  }),

  toggleShapeSelection: (id) => set((state) => {
    const exists = state.selectedShapeIds.includes(id)
    const newIds = exists
      ? state.selectedShapeIds.filter(sid => sid !== id)
      : [...state.selectedShapeIds, id]
    return {
      selectedShapeIds: newIds,
      selectedShapeId: newIds.length === 1 ? newIds[0] : null
    }
  }),

  clearMultiSelect: () => set({ selectedShapeIds: [], selectedShapeId: null }),

  // ── Drawing ─────────────────────────────────────────

  setDrawingMode: (mode) => set({
    drawingMode: mode,
    selectedShapeId: mode ? null : get().selectedShapeId, // Deselect when entering drawing mode
  }),

  // ── Convenience ─────────────────────────────────────

  duplicateShape: (id) => {
    const state = get()
    const shape = state.shapes.find(s => s.id === id)
    if (!shape) return
    const newId = generateId()
    const duplicate: DecorationShape = {
      ...shape,
      id: newId,
      x: shape.x + 20,
      y: shape.y + 20,
      locked: false
    }
    set((state) => ({
      shapes: [...state.shapes, duplicate],
      selectedShapeId: newId
    }))
  },

  toggleLock: (id) => set((state) => ({
    shapes: state.shapes.map(s => s.id === id ? { ...s, locked: !s.locked } : s)
  })),

  bringToFront: (id) => set((state) => {
    const maxZ = Math.max(...state.shapes.map(s => s.zIndex), 0)
    return {
      shapes: state.shapes.map(s => s.id === id ? { ...s, zIndex: maxZ + 1 } : s)
    }
  }),

  sendToBack: (id) => set((state) => {
    const minZ = Math.min(...state.shapes.map(s => s.zIndex), 0)
    return {
      shapes: state.shapes.map(s => s.id === id ? { ...s, zIndex: minZ - 1 } : s)
    }
  })
}))
