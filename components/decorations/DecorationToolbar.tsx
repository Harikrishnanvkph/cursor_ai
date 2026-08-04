"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Copy, Trash2, MoreHorizontal, ArrowUpToLine, ArrowDownToLine } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { RichTextToolbar, type RichTextToolbarStyleState, type RichTextToolbarCallbacks } from "@/components/format/RichTextToolbar"

interface DecorationToolbarProps {
  shapeId: string
  /** Position in SVG coordinates */
  x: number
  y: number
  /** ID of the textbox currently being edited inline */
  editingShapeId?: string | null
  /** Callback to enter editing mode */
  onStartEditing?: (id: string) => void
  zoom?: number
}

export function DecorationToolbar({ shapeId, x, y, editingShapeId, onStartEditing, zoom = 1.0 }: DecorationToolbarProps) {
  const { shapes, duplicateShape, toggleLock, removeShape, bringToFront, sendToBack, updateShape } = useDecorationStore()
  const shape = shapes.find(s => s.id === shapeId)
  if (!shape) return null

  const isTextbox = shape.type === 'textbox' || shape.type === 'textbox-auto'
  const isEditing = editingShapeId === shapeId

  // Position toolbar at the given coordinates (caller handles offset)
  const toolbarY = y

  // ── Rich text toolbar for textbox shapes ──────
  if (isTextbox) {
    const isBold = shape.fontWeight === 'bold'
    const isItalic = shape.fontStyle === 'italic'
    const isUnderline = shape.textDecoration === 'underline'

    const styleState: RichTextToolbarStyleState = {
      fontSize: shape.fontSize || 14,
      fontWeight: shape.fontWeight || 'normal',
      fontStyle: shape.fontStyle || 'normal',
      textDecoration: shape.textDecoration || 'none',
      textAlign: shape.textAlign || 'left',
      textColor: shape.textColor || '#1e293b',
      fontFamily: shape.fontFamily || 'Arial',
    }

    const callbacks: RichTextToolbarCallbacks = {
      onToggleBold: () => updateShape(shapeId, { fontWeight: isBold ? 'normal' : 'bold' }),
      onToggleItalic: () => updateShape(shapeId, { fontStyle: isItalic ? 'normal' : 'italic' }),
      onToggleUnderline: () => updateShape(shapeId, { textDecoration: isUnderline ? 'none' : 'underline' }),
      onSizeDown: () => updateShape(shapeId, { fontSize: Math.max(6, (shape.fontSize || 14) - 1) }),
      onSizeUp: () => updateShape(shapeId, { fontSize: Math.min(120, (shape.fontSize || 14) + 1) }),
      onColorChange: (color: string) => updateShape(shapeId, { textColor: color }),
      onFontChange: (fontFamily: string) => updateShape(shapeId, { fontFamily }),
      onAlignChange: (align: 'left' | 'center' | 'right') => updateShape(shapeId, { textAlign: align }),
      onBulletList: () => {
        if (!isEditing && onStartEditing) {
          onStartEditing(shapeId)
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
        if (!isEditing && onStartEditing) {
          onStartEditing(shapeId)
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              document.execCommand('insertOrderedList', false, undefined)
            })
          })
        } else {
          document.execCommand('insertOrderedList', false, undefined)
        }
      },
      onEdit: () => { if (onStartEditing) onStartEditing(shapeId) },
    }

    const toolbarWidth = isEditing ? 350 : 290

    return (
      <foreignObject
        data-export-ignore="true"
        x={Math.max(0, x)}
        y={Math.max(0, toolbarY)}
        width={toolbarWidth / zoom}
        height={85 / zoom}
        style={{ overflow: 'visible' }}
      >
        <div
          className="flex flex-col items-center gap-1.5 font-sans antialiased select-none w-fit"
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
          style={{
            transform: `scale(${1 / zoom})`,
            transformOrigin: 'top left',
          }}
        >
          {/* Row 1: Rich Text Formatting Toolbar Pill */}
          <RichTextToolbar
            style={styleState}
            callbacks={callbacks}
            showEdit={true}
            showLists={true}
            isEditing={isEditing}
          />

          {/* Row 2: Management Controls Pill */}
          <div className="flex items-center gap-0.5 bg-white opacity-100 rounded-xl shadow-lg border border-slate-200 p-0.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0"
              onClick={() => toggleLock(shapeId)}
              title={shape.locked ? "Unlock" : "Lock"}
            >
              {shape.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0"
              onClick={() => duplicateShape(shapeId)}
              title="Duplicate"
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 hover:text-red-600 text-slate-700 shrink-0"
              onClick={() => removeShape(shapeId)}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0" title="More">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom" className="rounded-xl">
                <DropdownMenuItem onClick={() => bringToFront(shapeId)}>
                  <ArrowUpToLine className="h-4 w-4 mr-2" /> Bring to Front
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => sendToBack(shapeId)}>
                  <ArrowDownToLine className="h-4 w-4 mr-2" /> Send to Back
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </foreignObject>
    )
  }

  // ── Standard toolbar for non-textbox shapes ──
  return (
    <foreignObject
      data-export-ignore="true"
      x={Math.max(0, x)}
      y={Math.max(0, toolbarY)}
      width={152 / zoom}
      height={48 / zoom}
      style={{ overflow: 'visible' }}
    >
      <div
        className="flex flex-nowrap items-center gap-0.5 bg-white opacity-100 rounded-xl shadow-lg border border-slate-200 p-0.5 w-fit shrink-0"
        onMouseDown={e => e.stopPropagation()}
        onTouchStart={e => e.stopPropagation()}
        onClick={e => e.stopPropagation()}
        style={{
          transform: `scale(${1 / zoom})`,
          transformOrigin: 'top left',
          width: 152,
        }}
      >
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0"
          onClick={() => toggleLock(shapeId)}
          title={shape.locked ? "Unlock" : "Lock"}
        >
          {shape.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0"
          onClick={() => duplicateShape(shapeId)}
          title="Duplicate"
        >
          <Copy className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 hover:text-red-600 text-slate-700 shrink-0"
          onClick={() => removeShape(shapeId)}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 text-slate-700 shrink-0" title="More">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom" className="rounded-xl">
            <DropdownMenuItem onClick={() => bringToFront(shapeId)}>
              <ArrowUpToLine className="h-4 w-4 mr-2" /> Bring to Front
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => sendToBack(shapeId)}>
              <ArrowDownToLine className="h-4 w-4 mr-2" /> Send to Back
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </foreignObject>
  )
}
