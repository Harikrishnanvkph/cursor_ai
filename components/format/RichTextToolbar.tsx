"use client"

/**
 * RichTextToolbar — Shared, store-agnostic rich text formatting toolbar.
 *
 * Used by both FormatZoneToolbar (format zones) and DecorationToolbar (textboxes).
 * All state is driven via props — this component has zero store dependencies.
 */

import React, { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold, Italic, Underline,
  Minus, Plus, Palette, Type,
  Edit2, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight,
  MoreHorizontal, Check
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ── Constants ──────────────────────────────────

const FONT_FAMILIES = [
  'Inter', 'Roboto', 'Poppins', 'Outfit', 'Playfair Display',
  'Montserrat', 'Lato', 'Oswald', 'DM Sans', 'Space Grotesk'
]

const QUICK_COLORS = [
  '#1a1a2e', '#0f172a', '#1e3a5f', '#1e40af', '#7c3aed',
  '#be185d', '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
  '#0d9488', '#475569', '#6b7280', '#ffffff',
]

// ── Types ──────────────────────────────────────

export interface RichTextToolbarStyleState {
  fontSize: number
  fontWeight: string
  fontStyle: string
  textDecoration: string
  textAlign: string
  textColor: string
  fontFamily: string
}

export interface RichTextToolbarCallbacks {
  onToggleBold: () => void
  onToggleItalic: () => void
  onToggleUnderline: () => void
  onSizeUp: () => void
  onSizeDown: () => void
  onColorChange: (color: string) => void
  onFontChange: (font: string) => void
  onAlignChange: (align: 'left' | 'center' | 'right') => void
  onBulletList?: () => void
  onNumberList?: () => void
  onEdit?: () => void
}

export interface RichTextToolbarProps {
  style: RichTextToolbarStyleState
  callbacks: RichTextToolbarCallbacks
  /** Show the Edit button */
  showEdit?: boolean
  /** Show list buttons (bullet + numbered) */
  showLists?: boolean
  /** Is currently in editing mode */
  isEditing?: boolean
}

// ── Main Component ─────────────────────────────

export function RichTextToolbar({
  style,
  callbacks,
  showEdit = false,
  showLists = false,
  isEditing = false,
}: RichTextToolbarProps) {
  const isBold = ['700', 'bold', '800', '900'].includes(String(style.fontWeight))
  const isItalic = style.fontStyle === 'italic'
  const isUnderline = style.textDecoration === 'underline'

  // ─────────────────────────────────────────────
  // MODE 1: Selected (not editing)
  // Shows: [Edit] | Bold | Color | Font Family | ⋯
  // ⋯ contains: Italic, Underline, Font Size, Alignment, Lists
  // ─────────────────────────────────────────────
  if (!isEditing) {
    return (
      <div
        className="flex items-center gap-0.5 bg-white/95 opacity-100 rounded-lg shadow-xl border border-slate-200 p-1"
        onMouseDown={e => { e.stopPropagation(); e.preventDefault() }}
        onClick={e => e.stopPropagation()}
      >
        {/* Edit button */}
        {showEdit && callbacks.onEdit && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-auto min-w-[28px] p-0 px-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100"
              onClick={callbacks.onEdit}
              title="Edit Content"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span className="text-[10px] ml-0.5 font-medium">Edit</span>
            </Button>
            <div className="w-px h-5 bg-slate-200 mx-0.5" />
          </>
        )}

        {/* Bold */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 w-auto min-w-[28px] p-0 px-1 ${isBold ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
          onClick={callbacks.onToggleBold}
          title="Bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* Color Picker */}
        <ColorPickerButton currentColor={style.textColor} onColorChange={callbacks.onColorChange} />

        {/* Font Family */}
        <FontPickerButton currentFont={style.fontFamily} onFontChange={callbacks.onFontChange} />

        {/* Divider */}
        <div className="w-px h-5 bg-slate-200 mx-0.5" />

        {/* ⋯ More — contains Italic, Underline, Size, Alignment, Lists */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" title="More formatting">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2.5" side="bottom" align="start">
            <div className="space-y-3">
              {/* Text style */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Style</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm"
                    className={`h-7 w-8 p-0 ${isItalic ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                    onClick={callbacks.onToggleItalic} title="Italic">
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm"
                    className={`h-7 w-8 p-0 ${isUnderline ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                    onClick={callbacks.onToggleUnderline} title="Underline">
                    <Underline className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {/* Font Size */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Size</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" onClick={callbacks.onSizeDown} title="Decrease">
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[11px] font-mono text-slate-600 w-6 text-center select-none">{Math.round(style.fontSize)}</span>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" onClick={callbacks.onSizeUp} title="Increase">
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {/* Alignment */}
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Alignment</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm"
                    className={`h-7 w-8 p-0 ${style.textAlign === 'left' || !style.textAlign ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                    onClick={() => callbacks.onAlignChange('left')} title="Align Left">
                    <AlignLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm"
                    className={`h-7 w-8 p-0 ${style.textAlign === 'center' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                    onClick={() => callbacks.onAlignChange('center')} title="Align Center">
                    <AlignCenter className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm"
                    className={`h-7 w-8 p-0 ${style.textAlign === 'right' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                    onClick={() => callbacks.onAlignChange('right')} title="Align Right">
                    <AlignRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {/* Lists */}
              {showLists && (
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Lists</span>
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] hover:bg-slate-100 gap-1.5"
                      onClick={callbacks.onBulletList} title="Bullet List">
                      <List className="h-3.5 w-3.5" /><span>Bullets</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] hover:bg-slate-100 gap-1.5"
                      onClick={callbacks.onNumberList} title="Numbered List">
                      <ListOrdered className="h-3.5 w-3.5" /><span>Numbered</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // MODE 2: Editing mode
  // Shows: Bold | Italic | − size + | Color | Font Family | ⋯
  // ⋯ contains: Underline, Alignment, Lists
  // ─────────────────────────────────────────────
  return (
    <div
      className="flex items-center gap-0.5 bg-white/95 opacity-100 rounded-lg shadow-xl border border-slate-200 p-1"
      onMouseDown={e => { e.stopPropagation(); e.preventDefault() }}
      onClick={e => e.stopPropagation()}
    >
      {/* Bold */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 w-auto min-w-[28px] p-0 px-1 ${isBold ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
        onClick={callbacks.onToggleBold}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </Button>

      {/* Italic */}
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 w-auto min-w-[28px] p-0 px-1 ${isItalic ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
        onClick={callbacks.onToggleItalic}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </Button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-200 mx-0.5" />

      {/* Font Size: − size + */}
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" onClick={callbacks.onSizeDown} title="Decrease Size">
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="text-[11px] font-mono text-slate-600 w-6 text-center select-none">
        {Math.round(style.fontSize)}
      </span>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" onClick={callbacks.onSizeUp} title="Increase Size">
        <Plus className="h-3.5 w-3.5" />
      </Button>

      {/* Divider */}
      <div className="w-px h-5 bg-slate-200 mx-0.5" />

      {/* Color Picker */}
      <ColorPickerButton currentColor={style.textColor} onColorChange={callbacks.onColorChange} />

      {/* Font Family */}
      <FontPickerButton currentFont={style.fontFamily} onFontChange={callbacks.onFontChange} />

      {/* Divider */}
      <div className="w-px h-5 bg-slate-200 mx-0.5" />

      {/* ⋯ More — contains Underline, Alignment, Lists */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" title="More formatting">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2.5" side="bottom" align="start">
          <div className="space-y-3">
            {/* Underline */}
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Style</span>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm"
                  className={`h-7 px-2 text-[11px] gap-1.5 ${isUnderline ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                  onClick={callbacks.onToggleUnderline} title="Underline">
                  <Underline className="h-3.5 w-3.5" /><span>Underline</span>
                </Button>
              </div>
            </div>
            {/* Alignment */}
            <div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Alignment</span>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm"
                  className={`h-7 w-8 p-0 ${style.textAlign === 'left' || !style.textAlign ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                  onClick={() => callbacks.onAlignChange('left')} title="Align Left">
                  <AlignLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm"
                  className={`h-7 w-8 p-0 ${style.textAlign === 'center' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                  onClick={() => callbacks.onAlignChange('center')} title="Align Center">
                  <AlignCenter className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm"
                  className={`h-7 w-8 p-0 ${style.textAlign === 'right' ? 'bg-blue-100 text-blue-700' : 'hover:bg-slate-100'}`}
                  onClick={() => callbacks.onAlignChange('right')} title="Align Right">
                  <AlignRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            {/* Lists */}
            {showLists && (
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">Lists</span>
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] hover:bg-slate-100 gap-1.5"
                    onClick={callbacks.onBulletList} title="Bullet List">
                    <List className="h-3.5 w-3.5" /><span>Bullets</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px] hover:bg-slate-100 gap-1.5"
                    onClick={callbacks.onNumberList} title="Numbered List">
                    <ListOrdered className="h-3.5 w-3.5" /><span>Numbered</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

// ── Sub-Components ─────────────────────────────

function ColorPickerButton({ currentColor, onColorChange }: { currentColor: string; onColorChange: (c: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-100" title="Text color">
          <div className="relative">
            <Palette className="h-3.5 w-3.5" />
            <div className="absolute -bottom-0.5 left-0.5 right-0.5 h-0.5 rounded" style={{ backgroundColor: currentColor }} />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" side="bottom" align="start">
        <div className="grid grid-cols-7 gap-1">
          {QUICK_COLORS.map(c => (
            <button
              key={c}
              className={`w-6 h-6 rounded border-2 transition-transform hover:scale-110 ${currentColor === c ? 'border-blue-500 scale-110' : 'border-transparent'}`}
              style={{ backgroundColor: c }}
              onClick={() => onColorChange(c)}
            />
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-[10px] text-slate-500">Custom:</label>
          <input
            type="color"
            value={currentColor}
            onChange={e => onColorChange(e.target.value)}
            className="w-6 h-6 border-0 p-0 cursor-pointer"
          />
          <span className="text-[10px] font-mono text-slate-400">{currentColor}</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}

function FontPickerButton({ currentFont, onFontChange }: { currentFont: string; onFontChange: (f: string) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-1.5 hover:bg-slate-100 text-[10px] font-medium max-w-[70px] truncate" title="Font family">
          <Type className="h-3 w-3 mr-0.5 flex-shrink-0" />
          <span className="truncate">{currentFont.split(',')[0]}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" side="bottom" align="start">
        <div className="max-h-48 overflow-y-auto">
          {FONT_FAMILIES.map(f => (
            <button
              key={f}
              className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-slate-100 transition-colors ${
                currentFont.startsWith(f) ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700'
              }`}
              style={{ fontFamily: f }}
              onClick={() => onFontChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
