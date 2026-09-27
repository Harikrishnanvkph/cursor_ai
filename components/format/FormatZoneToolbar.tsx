"use client"

/**
 * FormatZoneToolbar — Thin wrapper around RichTextToolbar for format zones.
 * 
 * Reads style state from useFormatGalleryStore and maps updates to
 * updateZoneStyle(). All toolbar UI lives in the shared RichTextToolbar.
 */

import React, { useCallback } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { RichTextToolbar, type RichTextToolbarStyleState, type RichTextToolbarCallbacks } from "./RichTextToolbar"
import { ensureGoogleFontLoaded } from "@/lib/typography-registry"

interface FormatZoneToolbarProps {
  zoneId: string
  zoneType: 'text' | 'stat'
  x: number
  y: number
  zoneWidth?: number
  zoneHeight?: number
  scale?: number
  zoomLevel?: number
  canvasWidth?: number
  canvasHeight?: number
}

export function FormatZoneToolbar({
  zoneId,
  zoneType,
  x,
  y,
  zoneWidth = 200,
  zoneHeight = 50,
  scale = 1,
  zoomLevel,
  canvasWidth = 1200,
  canvasHeight = 800,
}: FormatZoneToolbarProps) {
  const { formats, selectedFormatId, updateZoneStyle, editingZoneId, setEditingZoneId } = useFormatGalleryStore()

  const format = formats.find(f => f.id === selectedFormatId)
  const skeleton = format?.skeleton as any
  const zone = skeleton?.zones?.find((z: any) => z.id === zoneId)
  if (!zone?.style) return null

  const zStyle = zone.style
  const isText = zoneType === 'text'
  const isEditing = editingZoneId === zoneId

  // ── Derive current style values ──────────────
  const styleState: RichTextToolbarStyleState = {
    fontSize: isText ? zStyle.fontSize : zStyle.valueSize,
    fontWeight: isText ? (zStyle.fontWeight || '400') : (zStyle.valueFontWeight || '800'),
    fontStyle: isText ? (zStyle.fontStyle || 'normal') : (zStyle.valueFontStyle || 'normal'),
    textDecoration: isText ? (zStyle.textDecoration || 'none') : (zStyle.valueTextDecoration || 'none'),
    textAlign: zStyle.textAlign || (isText ? 'left' : 'center'),
    textColor: isText ? (zStyle.color || '#1a1a2e') : (zStyle.valueColor || '#1a1a2e'),
    fontFamily: isText ? (zStyle.fontFamily || 'Inter') : (zStyle.valueFontFamily || 'Inter'),
  }

  const isBold = ['700', 'bold', '800', '900'].includes(String(styleState.fontWeight))
  const isItalic = styleState.fontStyle === 'italic'
  const isUnderline = styleState.textDecoration === 'underline'

  // ── Callbacks ────────────────────────────────
  const callbacks: RichTextToolbarCallbacks = {
    onToggleBold: () => {
      if (isText) updateZoneStyle(zoneId, { fontWeight: isBold ? '400' : '700' })
      else updateZoneStyle(zoneId, { valueFontWeight: isBold ? '400' : '800' })
    },
    onToggleItalic: () => {
      if (isText) updateZoneStyle(zoneId, { fontStyle: isItalic ? 'normal' : 'italic' })
      else updateZoneStyle(zoneId, { valueFontStyle: isItalic ? 'normal' : 'italic' })
    },
    onToggleUnderline: () => {
      if (isText) updateZoneStyle(zoneId, { textDecoration: isUnderline ? 'none' : 'underline' })
      else updateZoneStyle(zoneId, { valueTextDecoration: isUnderline ? 'none' : 'underline' })
    },
    onSizeDown: () => {
      const newSize = Math.max(8, styleState.fontSize - 1)
      if (isText) updateZoneStyle(zoneId, { fontSize: newSize })
      else updateZoneStyle(zoneId, { valueSize: newSize })
    },
    onSizeUp: () => {
      const newSize = Math.min(120, styleState.fontSize + 1)
      if (isText) updateZoneStyle(zoneId, { fontSize: newSize })
      else updateZoneStyle(zoneId, { valueSize: newSize })
    },
    onColorChange: (color: string) => {
      if (isText) updateZoneStyle(zoneId, { color })
      else updateZoneStyle(zoneId, { valueColor: color })
    },
    onFontChange: (fontFamily: string) => {
      ensureGoogleFontLoaded(fontFamily)
      if (isText) updateZoneStyle(zoneId, { fontFamily })
      else updateZoneStyle(zoneId, { valueFontFamily: fontFamily })
    },
    onAlignChange: (align: 'left' | 'center' | 'right') => {
      updateZoneStyle(zoneId, { textAlign: align })
    },
    onBulletList: () => {
      if (!isEditing) {
        setEditingZoneId(zoneId)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.execCommand('insertUnorderedList', false, undefined)
          })
        })
      } else {
        document.execCommand('insertUnorderedList', false, undefined)
      }
    },
    onNumberList: () => {
      if (!isEditing) {
        setEditingZoneId(zoneId)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            document.execCommand('insertOrderedList', false, undefined)
          })
        })
      } else {
        document.execCommand('insertOrderedList', false, undefined)
      }
    },
    onEdit: () => setEditingZoneId(zoneId),
  }

  // ── Adaptive Scaling for all Screen Sizes & Zoom Levels ────
  // When viewed on laptops, the 1200x800 canvas is scaled down via CSS
  // transform: scale(zoomLevel) to fit the viewport (e.g. 0.35x - 0.55x).
  // Without counter-scaling, the toolbar shrinks to microscopic sizes.
  // By counter-scaling by 1 / effectiveZoom, the toolbar retains a consistent,
  // touch-friendly, legible physical screen size (standard 40-44px height, 14-16px icons).
  const effectiveZoom = Math.max(0.15, Math.min(3.0, zoomLevel ?? scale ?? 1))
  const counterScale = 1 / effectiveZoom

  // Standard physical screen dimensions for the toolbar (in screen px)
  const screenToolbarWidth = isEditing ? 360 : 300
  const screenToolbarHeight = 44
  const screenGap = 10

  // Convert to canvas coordinates
  const canvasToolbarWidth = screenToolbarWidth * counterScale
  const canvasToolbarHeight = screenToolbarHeight * counterScale
  const canvasGap = screenGap * counterScale
  const zHeight = zoneHeight || 50
  const cWidth = canvasWidth || 1200

  // Determine Y position:
  // If there is enough room above the zone within the canvas (plus margin), place above.
  // Otherwise, place it below the zone.
  const canFitAbove = (y - canvasToolbarHeight - canvasGap) >= (6 * counterScale)
  const toolbarY = canFitAbove
    ? y - canvasToolbarHeight - canvasGap
    : y + zHeight + canvasGap

  // Determine X position:
  // Align with the left edge of the zone, but clamp so it never overflows canvas bounds.
  const minX = 8 * counterScale
  const maxX = Math.max(minX, cWidth - canvasToolbarWidth - 8 * counterScale)
  const toolbarX = Math.max(minX, Math.min(x, maxX))

  return (
    <div
      className="format-zone-toolbar absolute z-[60] pointer-events-auto"
      data-export-ignore="true"
      style={{
        left: toolbarX,
        top: toolbarY,
        transform: `scale(${counterScale})`,
        transformOrigin: 'top left',
        width: 'max-content',
      }}
    >
      <RichTextToolbar
        style={styleState}
        callbacks={callbacks}
        showEdit={true}
        showLists={isText}
        isEditing={isEditing}
      />
    </div>
  )
}
