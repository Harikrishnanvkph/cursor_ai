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

interface FormatZoneToolbarProps {
  zoneId: string
  zoneType: 'text' | 'stat'
  x: number
  y: number
  scale: number
}

export function FormatZoneToolbar({ zoneId, zoneType, x, y, scale }: FormatZoneToolbarProps) {
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

  // ── Position ─────────────────────────────────
  const toolbarX = Math.max(4, x * scale)
  const toolbarY = Math.max(4, y * scale - 44)

  return (
    <div
      className="format-zone-toolbar absolute z-[60] pointer-events-auto"
      style={{ left: toolbarX, top: toolbarY }}
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
