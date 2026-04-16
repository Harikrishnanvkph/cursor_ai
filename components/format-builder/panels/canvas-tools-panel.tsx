"use client"

import React from 'react'
import {
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd,
  Wrench,
} from 'lucide-react'
import { useFormatBuilder } from '../format-builder-context'
import { useDecorationStore } from '@/lib/stores/decoration-store'
import { PanelSection } from './panel-section'

export function CanvasToolsPanel() {
  const { selectedZoneId, alignZone, skeleton } = useFormatBuilder()
  const { selectedShapeId, selectedShapeIds, shapes, updateShape } = useDecorationStore()
  const dims = skeleton.dimensions

  const zoneDisabled = !selectedZoneId
  const hasShapeSelected = !!selectedShapeId || selectedShapeIds.length > 0
  const shapeDisabled = !hasShapeSelected

  const alignShape = (alignment: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    // Collect all selected shape IDs
    const ids = selectedShapeIds.length > 0
      ? selectedShapeIds
      : (selectedShapeId ? [selectedShapeId] : [])

    if (ids.length === 0) return

    // Get the selected shapes
    const selectedShapes = ids.map(id => shapes.find(s => s.id === id)).filter(Boolean) as any[]
    if (selectedShapes.length === 0) return

    const getBounds = (s: any) => {
      if (s.points && s.points.length > 0) {
        const xs = s.points.map((p: any) => p.x)
        const ys = s.points.map((p: any) => p.y)
        return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) }
      }
      return { x: s.x, y: s.y, width: s.width, height: s.height }
    }

    // Single shape: align to canvas. Multiple shapes: align to group bounding box.
    const useCanvas = selectedShapes.length === 1

    // Compute alignment reference bounds
    let refLeft: number, refTop: number, refRight: number, refBottom: number
    if (useCanvas) {
      refLeft = 0; refTop = 0; refRight = dims.width; refBottom = dims.height
    } else {
      // Group bounding box
      const boundsArr = selectedShapes.map(getBounds)
      refLeft = Math.min(...boundsArr.map(b => b.x))
      refTop = Math.min(...boundsArr.map(b => b.y))
      refRight = Math.max(...boundsArr.map(b => b.x + b.width))
      refBottom = Math.max(...boundsArr.map(b => b.y + b.height))
    }

    const refWidth = refRight - refLeft
    const refHeight = refBottom - refTop
    const refCenterX = refLeft + refWidth / 2
    const refCenterY = refTop + refHeight / 2

    selectedShapes.forEach((shape: any) => {
      const b = getBounds(shape)
      const updates: any = {}
      
      let targetX = b.x
      let targetY = b.y

      switch (alignment) {
        case 'left':     targetX = refLeft; break
        case 'center-h': targetX = refCenterX - b.width / 2; break
        case 'right':    targetX = refRight - b.width; break
        case 'top':      targetY = refTop; break
        case 'center-v': targetY = refCenterY - b.height / 2; break
        case 'bottom':   targetY = refBottom - b.height; break
      }

      const dx = targetX - b.x
      const dy = targetY - b.y

      // Only add updates if there is a change
      if (Math.abs(dx) > 0.001) updates.x = shape.x + dx
      if (Math.abs(dy) > 0.001) updates.y = shape.y + dy

      // For point-based shapes (lines, arrows), also shift all points
      if (shape.points && shape.points.length > 0 && (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001)) {
        updates.points = shape.points.map((p: any) => ({ x: p.x + dx, y: p.y + dy }))
      }

      if (Object.keys(updates).length > 0) {
        updateShape(shape.id, updates)
      }
    })
  }

  const ALIGN_BUTTONS = [
    { key: 'left',     icon: AlignHorizontalJustifyStart, title: 'Align Left' },
    { key: 'center-h', icon: AlignHorizontalJustifyCenter, title: 'Center Horizontal' },
    { key: 'right',    icon: AlignHorizontalJustifyEnd, title: 'Align Right' },
    { key: 'top',      icon: AlignVerticalJustifyStart, title: 'Align Top' },
    { key: 'center-v', icon: AlignVerticalJustifyCenter, title: 'Center Vertical' },
    { key: 'bottom',   icon: AlignVerticalJustifyEnd, title: 'Align Bottom' },
  ] as const

  return (
    <PanelSection title="Canvas Tools" icon={<Wrench className="w-3.5 h-3.5" />}>
      <div className="space-y-3">
        {/* Zone Alignment */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-1 block">
            Align Zone {zoneDisabled && <span className="text-gray-600">(select a zone)</span>}
          </label>
          <div className="flex gap-1">
            {ALIGN_BUTTONS.map(({ key, icon: Icon, title }) => (
              <button
                key={key}
                onClick={() => alignZone(key)}
                disabled={zoneDisabled}
                className={`p-1.5 rounded border transition-colors ${
                  zoneDisabled
                    ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                    : 'border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-white hover:border-gray-600'
                }`}
                title={title}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Shape Alignment */}
        <div>
          <label className="text-[10px] text-gray-500 uppercase mb-1 block">
            Align Shape{selectedShapeIds.length > 1 ? 's' : ''} {shapeDisabled && <span className="text-gray-600">(select a shape)</span>}
          </label>
          <div className="flex gap-1">
            {ALIGN_BUTTONS.map(({ key, icon: Icon, title }) => (
              <button
                key={`shape-${key}`}
                onClick={() => alignShape(key)}
                disabled={shapeDisabled}
                className={`p-1.5 rounded border transition-colors ${
                  shapeDisabled
                    ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                    : 'border-gray-700 text-pink-400 hover:bg-gray-800 hover:text-pink-300 hover:border-gray-600'
                }`}
                title={`${title} (Shape)`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </PanelSection>
  )
}
