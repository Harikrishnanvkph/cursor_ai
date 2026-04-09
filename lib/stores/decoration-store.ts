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

export type DrawingMode = DecorationShapeType

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

interface DecorationStore {
  shapes: DecorationShape[]
  selectedShapeId: string | null
  hoveredShapeId: string | null
  drawingMode: DrawingMode | null
  drawingInProgress: DrawingState | null

  // Shape CRUD
  addShape: (shape: Omit<DecorationShape, 'id'>) => string
  updateShape: (id: string, updates: Partial<DecorationShape>) => void
  removeShape: (id: string) => void
  clearShapes: () => void

  // Selection
  setSelectedShapeId: (id: string | null) => void
  setHoveredShapeId: (id: string | null) => void

  // Drawing
  setDrawingMode: (mode: DrawingMode | null) => void
  setDrawingInProgress: (state: DrawingState | null) => void

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
  hoveredShapeId: null,
  drawingMode: null,
  drawingInProgress: null,

  // ── Shape CRUD ──────────────────────────────────────

  addShape: (shape) => {
    const id = generateId()
    const newShape: DecorationShape = { ...shape, id }
    set((state) => ({
      shapes: [...state.shapes, newShape],
      selectedShapeId: id,
      drawingMode: null,     // Exit drawing mode after adding
      drawingInProgress: null
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
    hoveredShapeId: null,
    drawingInProgress: null
  }),

  // ── Selection ───────────────────────────────────────

  setSelectedShapeId: (id) => set({ selectedShapeId: id }),
  setHoveredShapeId: (id) => set({ hoveredShapeId: id }),

  // ── Drawing ─────────────────────────────────────────

  setDrawingMode: (mode) => set({
    drawingMode: mode,
    selectedShapeId: mode ? null : get().selectedShapeId, // Deselect when entering drawing mode
    drawingInProgress: null
  }),

  setDrawingInProgress: (state) => set({ drawingInProgress: state }),

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
