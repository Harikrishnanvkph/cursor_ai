"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Lock, Unlock, Copy, Trash2, MoreHorizontal, ArrowUpToLine, ArrowDownToLine } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { isMulticolorSvg, extractSvgColors, replaceSvgColor } from "@/lib/elements/elements-registry"
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
  containerWidth?: number
  placement?: 'above' | 'below'
}

// Horizontal overlapping circles icon displaying all graphic colors in a single compact button (matching avatar-stack / Venn style)
function OverlappingColorsIcon({ colors }: { colors: string[] }) {
  if (!colors || colors.length === 0) {
    return <div className="w-4 h-4 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: "#0F172A" }} />
  }
  if (colors.length === 1) {
    const c = colors[0].startsWith("#") ? colors[0] : "#0F172A"
    return <div className="w-4 h-4 rounded-full border border-slate-300 shadow-xs" style={{ backgroundColor: c }} />
  }

  const count = colors.length
  const r = count <= 3 ? 6.5 : count <= 4 ? 5.8 : 5.0
  const overlap = count <= 3 ? 7 : count <= 4 ? 5.5 : 4.2
  const padding = r + 1.5
  const svgWidth = Math.round(padding * 2 + (count - 1) * overlap)
  const svgHeight = Math.round((r + 1.5) * 2)
  const cy = svgHeight / 2

  // Render from right to left (index count - 1 down to 0) so the leftmost circle sits on top, matching user's image
  const circleIndices = Array.from({ length: count }, (_, i) => i).reverse()

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="shrink-0 drop-shadow-2xs"
    >
      {circleIndices.map((i) => {
        const rawColor = colors[i]
        const c = rawColor.startsWith("#") ? rawColor : "#0F172A"
        const cx = padding + i * overlap
        return (
          <g key={i}>
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill={c}
              stroke="#ffffff"
              strokeWidth="1.2"
            />
            {/* Subtle outer stroke for light colors */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="rgba(0,0,0,0.15)"
              strokeWidth="0.8"
            />
          </g>
        )
      })}
    </svg>
  )
}

export function DecorationToolbar({ shapeId, x, y, editingShapeId, onStartEditing, zoom = 1.0, containerWidth, placement }: DecorationToolbarProps) {
  const { shapes, duplicateShape, toggleLock, removeShape, bringToFront, sendToBack, updateShape } = useDecorationStore()
  const shape = shapes.find(s => s.id === shapeId)
  if (!shape) return null

  const isTextbox = shape.type === 'textbox' || shape.type === 'textbox-auto'
  const isEditing = editingShapeId === shapeId

  // Position toolbar at the given coordinates (caller handles offset)
  const toolbarY = y

  // Intelligent menu / popover placement:
  // If the toolbar is ABOVE the shape, the shape is beneath it, so popovers/dropdowns open UPWARDS ('top').
  // If the toolbar is BELOW the shape, the shape is above it, so popovers/dropdowns open DOWNWARDS ('bottom').
  const isToolbarBelow = placement ? placement === 'below' : (toolbarY > (shape.y + (shape.height || 0) / 2))
  const popoverSide: 'top' | 'bottom' = isToolbarBelow ? 'bottom' : 'top'

  // ── Rich text toolbar for textbox shapes ──────
  if (isTextbox) {
    const isBold = shape.fontWeight === 'bold'
    const isItalic = shape.fontStyle === 'italic'
    const decStr = shape.textDecoration || 'none'
    const isUnderline = decStr.includes('underline')
    const hasLineThrough = decStr.includes('line-through')

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
      onToggleUnderline: () => {
        const nextUnderline = !isUnderline
        const parts = []
        if (nextUnderline) parts.push('underline')
        if (hasLineThrough) parts.push('line-through')
        updateShape(shapeId, { textDecoration: parts.length > 0 ? parts.join(' ') : 'none' })
      },
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
              <DropdownMenuContent align="start" side={popoverSide} className="rounded-xl">
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

  // Calculate colors for deco-svg or standard shapes (images don't have vector fill colors)
  const isImage = shape.type === 'deco-image'
  const svgColors = shape.type === 'deco-svg' ? extractSvgColors(shape.svgContent) : []
  const resolvedSvgColors = svgColors.map(color => {
    return color.startsWith('#')
      ? color
      : (shape.fillColor && shape.fillColor.startsWith('#') ? shape.fillColor : '#0F172A')
  })

  // Has color button: 180px (single overlapping or single swatch button). Images: 140px.
  const hasColorButton = !isImage
  const toolbarWidth = hasColorButton ? 180 : 140

  // Constrain X position inside container if containerWidth is provided to prevent clipping/overflow
  const maxAllowedX = containerWidth ? (containerWidth * zoom - toolbarWidth - 10) / zoom : x
  const finalX = containerWidth ? Math.max(10 / zoom, Math.min(x, maxAllowedX)) : Math.max(0, x)

  // ── Standard toolbar for non-textbox shapes ──
  return (
    <foreignObject
      data-export-ignore="true"
      x={finalX}
      y={Math.max(10 / zoom, toolbarY)}
      width={(toolbarWidth + 24) / zoom}
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
          width: toolbarWidth,
        }}
      >
        {/* Color button: Horizontal overlapping circles button for multi-color SVGs, or single swatch for 1-color shapes */}
        {!isImage && (
          shape.type === 'deco-svg' ? (
            svgColors.length > 1 ? (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="relative flex items-center justify-center h-8 px-1.5 rounded-lg hover:bg-slate-100 shrink-0 transition-colors cursor-pointer"
                    title={`Graphic Colors (${svgColors.length}) - Click to edit individually`}
                  >
                    <OverlappingColorsIcon colors={resolvedSvgColors} />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  side={popoverSide}
                  sideOffset={6}
                  className="w-auto p-1 bg-white rounded-lg shadow-lg border border-slate-200 z-[9999]"
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                    {svgColors.map((color, idx) => {
                      const displayColor = resolvedSvgColors[idx] || '#0F172A'
                      return (
                        <div
                          key={idx}
                          className="relative flex items-center justify-center h-5 w-5 rounded-md border border-slate-300 shadow-2xs overflow-hidden shrink-0 cursor-pointer hover:scale-110 hover:border-blue-500 transition-transform"
                          style={{ backgroundColor: displayColor }}
                          title={`Color #${idx + 1}`}
                        >
                          <input
                            type="color"
                            value={displayColor}
                            onChange={(e) => {
                              const newColor = e.target.value
                              const newSvg = replaceSvgColor(shape.svgContent || '', color, newColor)
                              updateShape(shapeId, {
                                svgContent: newSvg,
                                fillColor: newColor,
                                strokeColor: newColor,
                              })
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                      )
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div
                className="relative flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 p-1 shrink-0 cursor-pointer"
                title={`Change color (${resolvedSvgColors[0] || '#0F172A'})`}
              >
                <input
                  type="color"
                  value={resolvedSvgColors[0] || '#0F172A'}
                  onChange={(e) => {
                    const newColor = e.target.value
                    const newSvg = replaceSvgColor(shape.svgContent || '', svgColors[0] || 'currentColor', newColor)
                    updateShape(shapeId, {
                      svgContent: newSvg,
                      fillColor: newColor,
                      strokeColor: newColor,
                    })
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
                <div
                  className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
                  style={{ backgroundColor: resolvedSvgColors[0] || '#0F172A' }}
                />
              </div>
            )
          ) : (
            <div className="relative flex items-center justify-center h-8 w-8 rounded-lg hover:bg-slate-100 p-1 shrink-0 cursor-pointer" title="Change Color">
              <input
                type="color"
                value={shape.fillColor?.startsWith('#') ? shape.fillColor : (shape.strokeColor?.startsWith('#') ? shape.strokeColor : '#EAB308')}
                onChange={(e) => updateShape(shapeId, { fillColor: e.target.value, strokeColor: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div
                className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
                style={{ backgroundColor: shape.fillColor?.startsWith('#') ? shape.fillColor : (shape.strokeColor?.startsWith('#') ? shape.strokeColor : '#EAB308') }}
              />
            </div>
          )
        )}
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
          <DropdownMenuContent align="start" side={popoverSide} className="rounded-xl">
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
