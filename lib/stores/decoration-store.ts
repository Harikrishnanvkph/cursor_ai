"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { createExpiringStorage } from "@/lib/storage-utils"

// ═══════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════

export type DecorationShapeType =
  | 'freehand'
  | 'line'
  | 'arrow'
  | 'double-arrow'
  | 'connected-lines'
  | 'bezier-line'
  | 'bspline-curve'
  | 'cloud-line'
  | 'rectangle'
  | 'circle'
  | 'triangle'
  | 'star'
  | 'polygon'
  | 'hexagon'
  | 'pentagon'
  | 'diamond-shape'
  | 'heart'
  | 'cloud'
  | 'text-callout'
  | 'textbox'
  | 'textbox-auto'
  | 'deco-image'
  | 'deco-svg'
  | 'checkmark'
  | 'crossmark'
  | 'dot'
  | 'pushpin'
  | 'bullseye'
  // Or dynamic text types
  | `emoji-${string}`
  | `num-${number}`

export type DrawingMode = DecorationShapeType | null

export interface Point {
  x: number
  y: number
}

// Minimal shape structure — common to all decoration objects
export interface DecorationShape {
  id: string
  type: DecorationShapeType

  // Bounds
  x: number
  y: number
  width: number
  height: number
  rotation: number

  // Used by paths/lines
  points?: Point[]

  // Styling
  fillColor: string
  fillOpacity: number // 0 to 100
  strokeColor: string
  strokeWidth: number
  strokeStyle: 'solid' | 'dashed' | 'dotted'
  strokeDashPattern?: string

  // Hierarchy / Visibility
  visible: boolean
  locked: boolean
  zIndex: number

  // Specialized attributes (optional)
  text?: string
  fontSize?: number
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  textDecoration?: string
  textAlign?: 'left' | 'center' | 'right'
  textColor?: string
  lineHeight?: number

  imageUrl?: string
  imageFit?: 'cover' | 'contain' | 'fill'
  borderRadius?: number

  svgContent?: string
}

export type DrawingState =
  | 'idle'
  | 'drawing-path'      // Multi-point freehand
  | 'drawing-shape'     // Dragging bound box (rect, circle)
  | 'drawing-polyline'  // Click by click path
  | 'drawing-bspline'   // Click by click bspline

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

export type EditorMode = 'chart' | 'template' | 'custom-format'

interface DecorationStore {
  activeMode: EditorMode
  chartShapes: DecorationShape[]
  templateShapes: DecorationShape[]
  formatShapes: DecorationShape[]
  
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
  updateShape: (id: string, updates: Partial<DecorationShape>, skipHistory?: boolean) => void
  updateShapes: (updatesList: { id: string, updates: Partial<DecorationShape> }[], skipHistory?: boolean) => void
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

  // Undo/Redo Engine
  pastShapes: DecorationShape[][]
  futureShapes: DecorationShape[][]
  isUndoing: boolean
  commitHistory: () => void
  undoShapeAction: () => void
  redoShapeAction: () => void
  clearShapeHistory: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  setActiveMode: (mode: EditorMode) => void
  setShapes: (shapes: DecorationShape[], mode?: EditorMode) => void
}

const generateId = () => `deco-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`

const syncShapes = (state: any, newShapes: DecorationShape[]) => {
  if (state.activeMode === 'template') return { shapes: newShapes, templateShapes: newShapes };
  if (state.activeMode === 'custom-format') return { shapes: newShapes, formatShapes: newShapes };
  return { shapes: newShapes, chartShapes: newShapes };
};

export const useDecorationStore = create<DecorationStore>()(
  persist(
    (set, get) => ({
      activeMode: 'chart',
      chartShapes: [],
      templateShapes: [],
      formatShapes: [],
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

      pastShapes: [],
      futureShapes: [],
      isUndoing: false,

      commitHistory: () => {
        set((state) => {
          if (state.isUndoing) return {}
          const clones = JSON.parse(JSON.stringify(state.shapes))
          const newPast = [...state.pastShapes, clones]
          if (newPast.length > 30) newPast.shift()
          return {
            pastShapes: newPast,
            futureShapes: []
          }
        })
      },

      undoShapeAction: () => {
        set((state) => {
          if (state.pastShapes.length === 0) return {}
          const newPastShapes = [...state.pastShapes]
          const nextShapes = newPastShapes.pop()!
          const currShapes = JSON.parse(JSON.stringify(state.shapes))
          return {
            isUndoing: true,
            shapes: nextShapes,
            pastShapes: newPastShapes,
            futureShapes: [currShapes, ...state.futureShapes],
            selectedShapeId: null,
            selectedShapeIds: [],
            drawingMode: null
          }
        })
        setTimeout(() => set({ isUndoing: false }), 10)
      },

      redoShapeAction: () => {
        set((state) => {
          if (state.futureShapes.length === 0) return {}
          const newFutureShapes = [...state.futureShapes]
          const nextShapes = newFutureShapes.shift()!
          const currShapes = JSON.parse(JSON.stringify(state.shapes))
          return {
            isUndoing: true,
            shapes: nextShapes,
            pastShapes: [...state.pastShapes, currShapes],
            futureShapes: newFutureShapes,
            selectedShapeId: null,
            selectedShapeIds: [],
            drawingMode: null
          }
        })
        setTimeout(() => set({ isUndoing: false }), 10)
      },

      clearShapeHistory: () => set({ pastShapes: [], futureShapes: [], isUndoing: false }),
      canUndo: () => get().pastShapes.length > 0,
      canRedo: () => get().futureShapes.length > 0,

      setGlobalShapeSettings: (updates) => set((state) => ({
        globalShapeSettings: { ...state.globalShapeSettings, ...updates }
      })),

      // ── Shape CRUD ──────────────────────────────────────

      addShape: (shape) => {
        get().commitHistory()
        const id = generateId()
        const isDrawing = get().drawingMode !== null
        set((state) => {
          const newShapes = [...state.shapes, { ...shape, id }];
          return {
            ...syncShapes(state, newShapes),
            selectedShapeId: isDrawing ? null : id,
            selectedShapeIds: isDrawing ? [] : [id],
          }
        })
        return id
      },

      updateShape: (id, updates, skipHistory = false) => {
        if (!skipHistory) get().commitHistory()
        set((state) => {
          const newShapes = state.shapes.map(s => s.id === id ? { ...s, ...updates } : s);
          return syncShapes(state, newShapes);
        })
      },

      updateShapes: (updatesList, skipHistory = false) => {
        if (!skipHistory) get().commitHistory()
        set((state) => {
          const updateMap = new Map(updatesList.map(u => [u.id, u.updates]))
          const newShapes = state.shapes.map(s => updateMap.has(s.id) ? { ...s, ...updateMap.get(s.id) } : s);
          return syncShapes(state, newShapes);
        })
      },

      removeShape: (id) => {
        get().commitHistory()
        set((state) => {
          const newShapes = state.shapes.filter(s => s.id !== id);
          return {
            ...syncShapes(state, newShapes),
            selectedShapeId: state.selectedShapeId === id ? null : state.selectedShapeId,
            selectedShapeIds: state.selectedShapeIds.filter(sid => sid !== id)
          }
        })
      },

      clearShapes: () => {
        get().commitHistory()
        set((state) => ({ 
          ...syncShapes(state, []), 
          selectedShapeId: null, 
          selectedShapeIds: [],
          globalShapeSettings: {
            fillColor: 'transparent',
            fillOpacity: 100,
            strokeColor: '#3b82f6',
            strokeWidth: 2,
            strokeStyle: 'solid',
            strokeDashPattern: ''
          }
        }))
      },

      setSelectedShapeId: (id) => set((state) => ({
        selectedShapeId: id,
        selectedShapeIds: id ? [id] : [],
        drawingMode: id ? null : state.drawingMode
      })),

      setSelectedShapeIds: (ids) => set((state) => ({
        selectedShapeIds: ids,
        selectedShapeId: ids.length === 1 ? ids[0] : null,
        drawingMode: ids.length > 0 ? null : state.drawingMode
      })),

      toggleShapeSelection: (id) => set((state) => {
        const isSelected = state.selectedShapeIds.includes(id)
        const newIds = isSelected 
          ? state.selectedShapeIds.filter(sid => sid !== id)
          : [...state.selectedShapeIds, id]
        
        return {
          selectedShapeIds: newIds,
          selectedShapeId: newIds.length === 1 ? newIds[0] : null,
          drawingMode: newIds.length > 0 ? null : state.drawingMode
        }
      }),

      clearMultiSelect: () => set({ selectedShapeIds: [], selectedShapeId: null }),

      setDrawingMode: (mode) => set({ drawingMode: mode, selectedShapeId: null, selectedShapeIds: [] }),

      duplicateShape: (id) => {
        get().commitHistory()
        set((state) => {
          const shape = state.shapes.find(s => s.id === id)
          if (!shape) return {}

          const newId = generateId()
          const offset = 20
          const newShape = {
            ...shape,
            id: newId,
            x: shape.x + offset,
            y: shape.y + offset,
            points: shape.points?.map(p => ({ x: p.x + offset, y: p.y + offset }))
          }

          const newShapes = [...state.shapes, newShape];
          return {
            ...syncShapes(state, newShapes),
            selectedShapeId: newId,
            selectedShapeIds: [newId]
          }
        })
      },

      toggleLock: (id) => {
        get().commitHistory()
        set((state) => {
          const newShapes = state.shapes.map(s => s.id === id ? { ...s, locked: !s.locked } : s);
          return syncShapes(state, newShapes);
        })
      },

      bringToFront: (id) => {
        get().commitHistory()
        set((state) => {
          const maxZ = Math.max(...state.shapes.map(s => s.zIndex), 0)
          const newShapes = state.shapes.map(s => s.id === id ? { ...s, zIndex: maxZ + 1 } : s);
          return syncShapes(state, newShapes);
        })
      },

      sendToBack: (id) => {
        get().commitHistory()
        set((state) => {
          const minZ = Math.min(...state.shapes.map(s => s.zIndex), 0)
          const newShapes = state.shapes.map(s => s.id === id ? { ...s, zIndex: minZ - 1 } : s);
          return syncShapes(state, newShapes);
        })
      },
      setActiveMode: (mode) => set((state) => {
        if (state.activeMode === mode) return {};
        
        let targetShapes = state.chartShapes;
        if (mode === 'template') targetShapes = state.templateShapes;
        else if (mode === 'custom-format') targetShapes = state.formatShapes;
        
        return {
          activeMode: mode,
          shapes: targetShapes,
          selectedShapeId: null,
          selectedShapeIds: [],
          pastShapes: [],
          futureShapes: [],
          isUndoing: false
        };
      }),

      setShapes: (shapes, mode) => set((state) => {
        const targetMode = mode || state.activeMode;
        const modeUpdate: any = {};
        
        if (targetMode === 'template') modeUpdate.templateShapes = shapes;
        else if (targetMode === 'custom-format') modeUpdate.formatShapes = shapes;
        else modeUpdate.chartShapes = shapes;
        
        if (targetMode === state.activeMode) {
           modeUpdate.shapes = shapes;
        }
        
        return modeUpdate;
      })
    }),
    {
      name: 'decoration-store',
      storage: createExpiringStorage('decoration-store'),
      partialize: (state) => ({ 
        activeMode: state.activeMode,
        chartShapes: state.chartShapes,
        templateShapes: state.templateShapes,
        formatShapes: state.formatShapes,
        shapes: state.shapes, 
        globalShapeSettings: state.globalShapeSettings 
      })
    }
  )
)
