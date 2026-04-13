"use client"

import React, { useState, useRef } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Pencil, Minus, ArrowRight, ArrowRightLeft, Square, CircleIcon, MessageSquare,
  Triangle, Star, Hexagon, Cloud, CloudLightning, GitBranch, ChevronDown, Trash2, Copy,
  Lock, Unlock, Eye, EyeOff, ArrowUpToLine, ArrowDownToLine,
  Check, X as XIcon, CircleDot, Pentagon, Diamond, Heart, MousePointer2, SquareDashedMousePointer,
  Type, Image as ImageIcon, FileCode, Upload, Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, Spline, Octagon
} from "lucide-react"
import { useDecorationStore, type DecorationShapeType, type DrawingMode } from "@/lib/stores/decoration-store"

// ═══════════════════════════════════════════════════════
// Shape definitions for the picker
// ═══════════════════════════════════════════════════════

const TextIcon = ({ text, className }: { text: string, className?: string }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <span className="text-xl leading-none">{text}</span>
  </div>
)

const CustomPathIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="5" cy="5" r="2.5" />
    <path d="M7.5 5 H17 V12 H7 V19 H16.5" />
    <circle cx="19" cy="19" r="2.5" />
  </svg>
)

const CustomBSplineIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M3 18 C6 18, 7 4, 12 4 S18 18, 21 18" />
    <circle cx="3" cy="18" r="1.5" fill="currentColor" />
    <circle cx="12" cy="4" r="1.5" fill="currentColor" />
    <circle cx="21" cy="18" r="1.5" fill="currentColor" />
  </svg>
)

const CustomPolygonIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 4 L19 10 L16 19 L8 19 L5 10 Z" />
    <circle cx="12" cy="4" r="1.5" fill="currentColor" />
    <circle cx="19" cy="10" r="1.5" fill="currentColor" />
    <circle cx="16" cy="19" r="1.5" fill="currentColor" />
    <circle cx="8" cy="19" r="1.5" fill="currentColor" />
    <circle cx="5" cy="10" r="1.5" fill="currentColor" />
  </svg>
)

export const SHAPE_GROUPS: Array<{ label: string; shapes: { type: DecorationShapeType | 'select' | 'marquee-select'; label: string; icon: React.ElementType }[] }> = [
  {
    label: 'Tools',
    shapes: [
      { type: 'select', label: 'Select', icon: MousePointer2 },
      { type: 'marquee-select', label: 'Marquee', icon: SquareDashedMousePointer },
      { type: 'freehand' as DecorationShapeType, label: 'Draw', icon: Pencil },
    ]
  },
  {
    label: 'Lines',
    shapes: [
      { type: 'line' as DecorationShapeType, label: 'Line', icon: Minus },
      { type: 'arrow' as DecorationShapeType, label: 'Arrow', icon: ArrowRight },
      { type: 'double-arrow' as DecorationShapeType, label: 'Double', icon: ArrowRightLeft },
      { type: 'connected-lines' as DecorationShapeType, label: 'Path', icon: CustomPathIcon },
      { type: 'bezier-line' as DecorationShapeType, label: 'Curve', icon: Spline },
      { type: 'bspline-curve' as DecorationShapeType, label: 'BSpline', icon: CustomBSplineIcon },
    ]
  },
  {
    label: 'Shapes',
    shapes: [
      { type: 'rectangle' as DecorationShapeType, label: 'Rectangle', icon: Square },
      { type: 'circle' as DecorationShapeType, label: 'Circle', icon: CircleIcon },
      { type: 'triangle' as DecorationShapeType, label: 'Triangle', icon: Triangle },
      { type: 'star' as DecorationShapeType, label: 'Star', icon: Star },
      { type: 'polygon' as DecorationShapeType, label: 'Polygon', icon: CustomPolygonIcon },
      { type: 'hexagon' as DecorationShapeType, label: 'Hexagon', icon: Hexagon },
      { type: 'pentagon' as DecorationShapeType, label: 'Pentagon', icon: Pentagon },
      { type: 'diamond-shape' as DecorationShapeType, label: 'Diamond', icon: Diamond },
      { type: 'heart' as DecorationShapeType, label: 'Heart', icon: Heart },
      { type: 'cloud' as DecorationShapeType, label: 'Cloud', icon: Cloud },
      { type: 'cloud-line' as DecorationShapeType, label: 'Cloud Path', icon: CloudLightning },
      { type: 'text-callout' as DecorationShapeType, label: 'Callout', icon: MessageSquare },
    ]
  },
  {
    label: 'Annotations',
    shapes: [
      { type: 'checkmark' as DecorationShapeType, label: 'Check', icon: Check },
      { type: 'crossmark' as DecorationShapeType, label: 'Cross', icon: XIcon },
      { type: 'dot' as DecorationShapeType, label: 'Dot', icon: CircleDot },
      { type: 'exclamation' as DecorationShapeType, label: 'Alert!', icon: (p: any) => <TextIcon text="❗" {...p} /> },
      { type: 'question' as DecorationShapeType, label: 'Question', icon: (p: any) => <TextIcon text="❓" {...p} /> },
      { type: 'pushpin' as DecorationShapeType, label: 'Pin', icon: (p: any) => <TextIcon text="📌" {...p} /> },
      { type: 'bullseye' as DecorationShapeType, label: 'Target', icon: (p: any) => <TextIcon text="◎" className="font-bold" {...p} /> },
    ]
  },
  {
    label: 'Numbers',
    shapes: [
      { type: 'num-1' as DecorationShapeType, label: '1', icon: (p: any) => <TextIcon text="1" {...p} /> },
      { type: 'num-2' as DecorationShapeType, label: '2', icon: (p: any) => <TextIcon text="2" {...p} /> },
      { type: 'num-3' as DecorationShapeType, label: '3', icon: (p: any) => <TextIcon text="3" {...p} /> },
      { type: 'num-4' as DecorationShapeType, label: '4', icon: (p: any) => <TextIcon text="4" {...p} /> },
      { type: 'num-5' as DecorationShapeType, label: '5', icon: (p: any) => <TextIcon text="5" {...p} /> },
      { type: 'num-6' as DecorationShapeType, label: '6', icon: (p: any) => <TextIcon text="6" {...p} /> },
      { type: 'num-7' as DecorationShapeType, label: '7', icon: (p: any) => <TextIcon text="7" {...p} /> },
      { type: 'num-8' as DecorationShapeType, label: '8', icon: (p: any) => <TextIcon text="8" {...p} /> },
      { type: 'num-9' as DecorationShapeType, label: '9', icon: (p: any) => <TextIcon text="9" {...p} /> },
      { type: 'num-0' as DecorationShapeType, label: '0', icon: (p: any) => <TextIcon text="0" {...p} /> },
    ]
  },
  {
    label: 'Emojis',
    shapes: [
      { type: 'emoji-star' as DecorationShapeType, label: 'Star', icon: (p: any) => <TextIcon text="⭐" {...p} /> },
      { type: 'emoji-warning' as DecorationShapeType, label: 'Warning', icon: (p: any) => <TextIcon text="⚠️" {...p} /> },
      { type: 'emoji-heart' as DecorationShapeType, label: 'Heart', icon: (p: any) => <TextIcon text="❤️" {...p} /> },
      { type: 'emoji-thumb' as DecorationShapeType, label: 'Thumb', icon: (p: any) => <TextIcon text="👍" {...p} /> },
      { type: 'emoji-fire' as DecorationShapeType, label: 'Fire', icon: (p: any) => <TextIcon text="🔥" {...p} /> },
      { type: 'emoji-idea' as DecorationShapeType, label: 'Idea', icon: (p: any) => <TextIcon text="💡" {...p} /> },
      { type: 'emoji-check' as DecorationShapeType, label: 'Check', icon: (p: any) => <TextIcon text="✅" {...p} /> },
      { type: 'emoji-cross' as DecorationShapeType, label: 'Cross', icon: (p: any) => <TextIcon text="❌" {...p} /> },
      { type: 'emoji-smile' as DecorationShapeType, label: 'Smile', icon: (p: any) => <TextIcon text="😊" {...p} /> },
      { type: 'emoji-sad' as DecorationShapeType, label: 'Sad', icon: (p: any) => <TextIcon text="😢" {...p} /> },
      { type: 'emoji-rocket' as DecorationShapeType, label: 'Rocket', icon: (p: any) => <TextIcon text="🚀" {...p} /> },
      { type: 'emoji-target' as DecorationShapeType, label: 'Target', icon: (p: any) => <TextIcon text="🎯" {...p} /> },
      { type: 'emoji-laugh' as DecorationShapeType, label: 'Laugh', icon: (p: any) => <TextIcon text="😂" {...p} /> },
      { type: 'emoji-clap' as DecorationShapeType, label: 'Clap', icon: (p: any) => <TextIcon text="👏" {...p} /> },
      { type: 'emoji-eyes' as DecorationShapeType, label: 'Eyes', icon: (p: any) => <TextIcon text="👀" {...p} /> },
      { type: 'emoji-sparkles' as DecorationShapeType, label: 'Sparkles', icon: (p: any) => <TextIcon text="✨" {...p} /> },
      { type: 'emoji-party' as DecorationShapeType, label: 'Party', icon: (p: any) => <TextIcon text="🎉" {...p} /> },
      { type: 'emoji-brain' as DecorationShapeType, label: 'Brain', icon: (p: any) => <TextIcon text="🧠" {...p} /> },
      { type: 'emoji-muscle' as DecorationShapeType, label: 'Muscle', icon: (p: any) => <TextIcon text="💪" {...p} /> },
      { type: 'emoji-crown' as DecorationShapeType, label: 'Crown', icon: (p: any) => <TextIcon text="👑" {...p} /> },
      { type: 'emoji-diamond' as DecorationShapeType, label: 'Diamond', icon: (p: any) => <TextIcon text="💎" {...p} /> },
      { type: 'emoji-medal' as DecorationShapeType, label: 'Medal', icon: (p: any) => <TextIcon text="🏅" {...p} /> },
      { type: 'emoji-clock' as DecorationShapeType, label: 'Clock', icon: (p: any) => <TextIcon text="⏰" {...p} /> },
      { type: 'emoji-lock' as DecorationShapeType, label: 'Lock', icon: (p: any) => <TextIcon text="🔒" {...p} /> },
      { type: 'emoji-umbrella' as DecorationShapeType, label: 'Umbrella', icon: (p: any) => <TextIcon text="☂️" {...p} /> },
    ]
  }
]

// Section element types (for icon lookup)
const SECTION_TYPES: Record<string, { label: string; icon: React.ElementType }> = {
  'textbox': { label: 'Textbox', icon: Type },
  'textbox-auto': { label: 'Auto Textbox', icon: Type },
  'deco-image': { label: 'Image', icon: ImageIcon },
  'deco-svg': { label: 'SVG', icon: FileCode },
}

// ═══════════════════════════════════════════════════════
// Shape List Item (shared between tabs)
// ═══════════════════════════════════════════════════════

function ShapeListItem({ shape, isSelected, onSelect, onUpdate, onRemove, onDuplicate, onToggleLock, onBringFront, onSendBack }: {
  shape: any
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: any) => void
  onRemove: () => void
  onDuplicate: () => void
  onToggleLock: () => void
  onBringFront: () => void
  onSendBack: () => void
}) {
  const isTextbox = shape.type === 'textbox' || shape.type === 'textbox-auto'
  const isImage = shape.type === 'deco-image'
  const isSvg = shape.type === 'deco-svg'
  const isNumber = shape.type.startsWith('num-')
  const isSection = isTextbox || isImage || isSvg
  const useBorderLabels = isTextbox || isNumber || isImage

  const sectionInfo = SECTION_TYPES[shape.type]
  const ShapeIcon = sectionInfo?.icon || SHAPE_GROUPS.flatMap(g => g.shapes).find(s => s.type === shape.type)?.icon || Square

  return (
    <Card
      className={`transition-all cursor-pointer ${isSelected
          ? 'ring-2 ring-amber-500 border-amber-300 shadow-md'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
        }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-4 h-4 rounded-sm border flex items-center justify-center" style={{
          backgroundColor: isSection ? undefined : (shape.fillColor !== 'transparent' ? shape.fillColor : undefined),
          borderColor: isSection ? '#94a3b8' : shape.strokeColor,
          backgroundImage: isImage && shape.imageUrl ? `url(${shape.imageUrl})` : undefined,
          backgroundPosition: isImage && shape.imageUrl ? 'center' : undefined,
          backgroundSize: isImage && shape.imageUrl ? 'cover' : undefined,
        }}>
          <ShapeIcon className="w-2.5 h-2.5 text-white mix-blend-difference" />
        </div>
        <span className="text-xs font-medium flex-1 truncate capitalize">
          {sectionInfo?.label || shape.type.replace(/-/g, ' ')}
          {isTextbox && shape.text ? `: ${shape.text.slice(0, 15)}${shape.text.length > 15 ? '…' : ''}` : ''}
        </span>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); onUpdate({ visible: !shape.visible }) }}>
            {shape.visible ? <Eye className="h-3 w-3 text-slate-400" /> : <EyeOff className="h-3 w-3 text-slate-300" />}
          </Button>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); onRemove() }}>
            <Trash2 className="h-3 w-3 text-red-400" />
          </Button>
        </div>
      </div>

      {/* Expanded editor */}
      {isSelected && (
        <CardContent className="space-y-5 pt-1 pb-4 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
          {/* Quick actions */}
          <div className="flex gap-1.5 pt-2">
            <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onDuplicate}>
              <Copy className="h-3 w-3 mr-1" /> Duplicate
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onToggleLock}>
              {shape.locked ? <Lock className="h-3 w-3 mr-1" /> : <Unlock className="h-3 w-3 mr-1" />}
              {shape.locked ? 'Locked' : 'Lock'}
            </Button>
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onBringFront}>
              <ArrowUpToLine className="h-3 w-3 mr-1" /> Front
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={onSendBack}>
              <ArrowDownToLine className="h-3 w-3 mr-1" /> Back
            </Button>
          </div>

          {/* ── Textbox-specific controls ────────────── */}
          {isTextbox && (
            <>
              <div>
                <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">Text Content</Label>
                <Textarea
                  value={shape.text || ''}
                  onChange={e => onUpdate({ text: e.target.value })}
                  placeholder="Enter text..."
                  className="min-h-[60px] text-xs resize-none"
                  rows={3}
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">Formatting</Label>
                <div className="flex gap-1 mb-3">
                  <Button variant={shape.fontWeight === 'bold' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0"
                    onClick={() => onUpdate({ fontWeight: shape.fontWeight === 'bold' ? 'normal' : 'bold' })}>
                    <Bold className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={shape.fontStyle === 'italic' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0"
                    onClick={() => onUpdate({ fontStyle: shape.fontStyle === 'italic' ? 'normal' : 'italic' })}>
                    <Italic className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={shape.textDecoration === 'underline' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0"
                    onClick={() => onUpdate({ textDecoration: shape.textDecoration === 'underline' ? 'none' : 'underline' })}>
                    <Underline className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={shape.textDecoration === 'line-through' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0"
                    onClick={() => onUpdate({ textDecoration: shape.textDecoration === 'line-through' ? 'none' : 'line-through' })}>
                    <Strikethrough className="h-3.5 w-3.5" />
                  </Button>
                  <div className="w-[1px] bg-slate-200 mx-1" />
                  <Button variant={shape.textAlign === 'left' || !shape.textAlign ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0"
                    onClick={() => onUpdate({ textAlign: 'left' })}>
                    <AlignLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={shape.textAlign === 'center' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0"
                    onClick={() => onUpdate({ textAlign: 'center' })}>
                    <AlignCenter className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant={shape.textAlign === 'right' ? 'default' : 'outline'} size="sm" className="h-7 w-7 p-0"
                    onClick={() => onUpdate({ textAlign: 'right' })}>
                    <AlignRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-slate-500">Font Family</Label>
                    <Select value={shape.fontFamily || 'Arial'} onValueChange={v => onUpdate({ fontFamily: v })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Courier New', 'Inter', 'Roboto', 'Verdana'].map(f =>
                          <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {shape.type === 'textbox' && (
                    <div>
                      <Label className="text-[10px] text-slate-500">Font Size</Label>
                      <Input type="number" value={shape.fontSize || 14} onChange={e => onUpdate({ fontSize: Math.max(6, parseInt(e.target.value) || 14) })} className="h-7 text-xs" />
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-slate-500 block mb-1">Text Color</Label>
                  <div className="relative flex items-center gap-2">
                    <Input type="color" value={shape.textColor || '#1e293b'} onChange={e => onUpdate({ textColor: e.target.value })} className="h-7 w-7 p-0 border opacity-0 absolute z-10 cursor-pointer" />
                    <div className="h-7 w-7 rounded border border-slate-200 flex-shrink-0" style={{ backgroundColor: shape.textColor || '#1e293b' }} />
                    <span className="text-[9px] text-slate-400 font-mono uppercase truncate">{shape.textColor || '#1e293b'}</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <Label className="text-[10px] text-slate-500">Line Height</Label>
                    <span className="text-[10px] text-slate-400">{shape.lineHeight || 1.4}</span>
                  </div>
                  <Slider value={[Math.round((shape.lineHeight || 1.4) * 10)]} onValueChange={([v]) => onUpdate({ lineHeight: v / 10 })} min={8} max={30} />
                </div>
              </div>
            </>
          )}

          {/* ── Image-specific controls ──────────────── */}
          {isImage && (
            <ImagePropertyEditor shape={shape} onUpdate={onUpdate} />
          )}

          {/* ── SVG-specific controls ───────────────── */}
          {isSvg && (
            <div>
              <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">SVG Code</Label>
              <Textarea
                value={shape.svgContent || ''}
                onChange={e => onUpdate({ svgContent: e.target.value })}
                placeholder="<svg>...</svg>"
                className="min-h-[80px] text-xs font-mono resize-none"
                rows={5}
              />
            </div>
          )}

          {/* Position & Size (shared) */}
          <div>
            <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">Position & Size</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-slate-500">X</Label>
                <Input type="number" value={Math.round(shape.x)} onChange={e => onUpdate({ x: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" disabled={shape.locked} />
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">Y</Label>
                <Input type="number" value={Math.round(shape.y)} onChange={e => onUpdate({ y: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" disabled={shape.locked} />
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">W</Label>
                <Input type="number" value={Math.round(shape.width)} onChange={e => onUpdate({ width: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" disabled={shape.locked} />
              </div>
              <div>
                <Label className="text-[10px] text-slate-500">H</Label>
                <Input type="number" value={Math.round(shape.height)} onChange={e => onUpdate({ height: parseFloat(e.target.value) || 0 })} className="h-7 text-xs" disabled={shape.locked} />
              </div>
            </div>
          </div>

          {/* Rotation */}
          <div>
            <div className="flex justify-between mb-1.5">
              <Label className="text-[10px] text-slate-500">Rotation</Label>
              <span className="text-[10px] text-slate-400">{shape.rotation}°</span>
            </div>
            <Slider value={[shape.rotation]} onValueChange={([v]) => onUpdate({ rotation: v })} min={-180} max={180} disabled={shape.locked} />
          </div>

          {/* Style (for shapes that have fill/stroke) */}
          {!isImage && !isSvg && (
            <div>
              <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">Style</Label>
              <div className="grid grid-cols-2 gap-3">
                {!['line', 'arrow', 'connected-lines', 'bezier-line', 'bspline-curve', 'cloud-line'].includes(shape.type) && (
                  <div>
                    <Label className="text-[10px] text-slate-500 block mb-1">{isNumber ? 'Color' : 'Fill'}</Label>
                    <div className="relative flex items-center gap-2">
                      <Input type="color" value={shape.fillColor.startsWith('#') ? shape.fillColor : '#3b82f6'} onChange={e => onUpdate({ fillColor: e.target.value })} className="h-7 w-7 p-0 border opacity-0 absolute z-10 cursor-pointer" />
                      <div className="h-7 w-7 rounded border border-slate-200 flex-shrink-0" style={{ backgroundColor: shape.fillColor.startsWith('#') ? shape.fillColor : '#3b82f6' }} />
                      <span className="text-[9px] text-slate-400 font-mono uppercase truncate">{shape.fillColor}</span>
                    </div>
                  </div>
                )}
                <div>
                  <Label className="text-[10px] text-slate-500 block mb-1">{useBorderLabels ? 'Border Color' : 'Stroke'}</Label>
                  <div className="relative flex items-center gap-2">
                    <Input type="color" value={shape.strokeColor.startsWith('#') ? shape.strokeColor : '#1e40af'} onChange={e => onUpdate({ strokeColor: e.target.value })} className="h-7 w-7 p-0 border opacity-0 absolute z-10 cursor-pointer" />
                    <div className="h-7 w-7 rounded border border-slate-200 flex-shrink-0" style={{ backgroundColor: shape.strokeColor.startsWith('#') ? shape.strokeColor : '#1e40af' }} />
                    <span className="text-[9px] text-slate-400 font-mono uppercase truncate">{shape.strokeColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fill Opacity */}
          {!['line', 'arrow', 'connected-lines', 'bezier-line', 'bspline-curve', 'cloud-line'].includes(shape.type) && !isImage && !isSvg && (
            <div>
              <div className="flex justify-between mb-1.5">
                <Label className="text-[10px] text-slate-500">{isTextbox ? 'Background Opacity' : isNumber ? 'Opacity' : 'Fill Opacity'}</Label>
                <span className="text-[10px] text-slate-400">{shape.fillOpacity}%</span>
              </div>
              <Slider value={[shape.fillOpacity]} onValueChange={([v]) => onUpdate({ fillOpacity: v })} min={0} max={100} />
            </div>
          )}

          {/* Stroke/Border Width & Style */}
          {!isSvg && !isImage && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-slate-500 block mb-1.5">{useBorderLabels ? 'Border Width' : 'Stroke Width'}</Label>
                  <Input 
                    type="number"
                    min="0" max="100"
                    className="h-7 text-xs bg-white" 
                    value={shape.strokeWidth}
                    onChange={(e) => onUpdate({ strokeWidth: Math.max(0, parseFloat(e.target.value) || 0) })}
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-slate-500 block mb-1.5">{useBorderLabels ? 'Border Style' : 'Stroke Style'}</Label>
                  <Select value={shape.strokeStyle} onValueChange={(v: any) => onUpdate({ strokeStyle: v, strokeDashPattern: undefined })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                      <SelectItem value="dashed" className="text-xs">Dashed</SelectItem>
                      <SelectItem value="dotted" className="text-xs">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {shape.strokeStyle !== 'solid' && (() => {
                const isDotted = shape.strokeStyle === 'dotted';
                const currentPattern = shape.strokeDashPattern || (isDotted ? '0,8' : '8,6');
                const dashParts = currentPattern.split(',');
                const dashLen = dashParts[0] || (isDotted ? '0' : '8');
                const gapLen = dashParts[1] || (isDotted ? '8' : '6');

                return (
                  <div className="flex items-center gap-3 overflow-hidden animate-in fade-in duration-300">
                    {!isDotted && (
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-[10px] text-slate-500 whitespace-nowrap">Dash Length</Label>
                        <Input 
                          type="number"
                          min="1" max="100"
                          className="h-6 text-[10px]" 
                          value={dashLen}
                          onChange={(e) => onUpdate({ strokeDashPattern: `${e.target.value},${gapLen}` })}
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-[10px] text-slate-500 whitespace-nowrap">Gap Length</Label>
                      <Input 
                        type="number"
                        min="1" max="100"
                        className="h-6 text-[10px]" 
                        value={gapLen}
                        onChange={(e) => onUpdate({ strokeDashPattern: `${isDotted ? '0' : dashLen},${e.target.value}` })}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Text for text-callout */}
          {shape.type === 'text-callout' && (
            <div>
              <Label className="text-[10px] text-slate-500 block mb-1.5">Callout Text</Label>
              <Input
                value={shape.text || ''}
                onChange={e => onUpdate({ text: e.target.value })}
                placeholder="Enter text..."
                className="h-7 text-xs"
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}


// ═══════════════════════════════════════════════════════
// Image Property Editor sub-component
// ═══════════════════════════════════════════════════════

function ImagePropertyEditor({ shape, onUpdate }: { shape: any, onUpdate: (u: any) => void }) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      onUpdate({ imageUrl: e.target?.result as string })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <>
      <div>
        <Label className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-2">Image Source</Label>
        {shape.imageUrl ? (
          <div className="space-y-2">
            <div className="w-full h-20 rounded border border-slate-200 overflow-hidden bg-slate-50">
              <img src={shape.imageUrl} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="flex gap-1.5">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-3 w-3 mr-1" /> Replace
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] text-red-500" onClick={() => onUpdate({ imageUrl: '' })}>
                Remove
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-3.5 w-3.5 mr-2" /> Upload Image
            </Button>
            <div className="flex gap-1.5">
              <Input
                placeholder="or paste URL..."
                className="h-7 text-xs flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const url = e.currentTarget.value.trim()
                    if (url) { onUpdate({ imageUrl: url }); e.currentTarget.value = '' }
                  }
                }}
              />
              <Button variant="outline" size="sm" className="h-7 text-xs px-2"
                onClick={() => {
                  const input = document.querySelector('input[placeholder="or paste URL..."]') as HTMLInputElement
                  const url = input?.value.trim()
                  if (url) { onUpdate({ imageUrl: url }); input.value = '' }
                }}
              >Add</Button>
            </div>
          </div>
        )}
      </div>
      <div>
        <Label className="text-[10px] text-slate-500">Image Fit</Label>
        <div className="flex gap-1 mt-1.5">
          {(['fill', 'cover', 'contain'] as const).map(fit => (
            <Button key={fit} size="sm" variant={shape.imageFit === fit ? 'default' : 'outline'}
              onClick={() => onUpdate({ imageFit: fit })} className="flex-1 text-[10px] h-7 capitalize">{fit}</Button>
          ))}
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1.5">
          <Label className="text-[10px] text-slate-500">Border Radius</Label>
          <span className="text-[10px] text-slate-400">{shape.borderRadius || 0}px</span>
        </div>
        <Slider value={[shape.borderRadius || 0]} onValueChange={([v]) => onUpdate({ borderRadius: v })} min={0} max={50} />
      </div>
      {/* Border Width */}
      <div>
        <div className="flex justify-between mb-1.5">
          <Label className="text-[10px] text-slate-500">Border Width</Label>
          <span className="text-[10px] text-slate-400">{shape.strokeWidth}px</span>
        </div>
        <Slider value={[shape.strokeWidth]} onValueChange={([v]) => onUpdate({ strokeWidth: v })} min={0} max={20} />
      </div>
      {/* Border Color */}
      <div>
        <Label className="text-[10px] text-slate-500 block mb-1">Border Color</Label>
        <div className="relative flex items-center gap-2">
          <Input type="color" value={shape.strokeColor?.startsWith('#') ? shape.strokeColor : '#cbd5e1'} onChange={e => onUpdate({ strokeColor: e.target.value })} className="h-7 w-7 p-0 border opacity-0 absolute z-10 cursor-pointer" />
          <div className="h-7 w-7 rounded border border-slate-200 flex-shrink-0" style={{ backgroundColor: shape.strokeColor?.startsWith('#') ? shape.strokeColor : '#cbd5e1' }} />
          <span className="text-[9px] text-slate-400 font-mono uppercase truncate">{shape.strokeColor || '#cbd5e1'}</span>
        </div>
      </div>
      <div>
        <div className="flex justify-between mb-1.5">
          <Label className="text-[10px] text-slate-500">Opacity</Label>
          <span className="text-[10px] text-slate-400">{shape.fillOpacity}%</span>
        </div>
        <Slider value={[shape.fillOpacity]} onValueChange={([v]) => onUpdate({ fillOpacity: v })} min={0} max={100} />
      </div>
    </>
  )
}


// ═══════════════════════════════════════════════════════
// Panel Component
// ═══════════════════════════════════════════════════════

export function DecorationsPanel() {
  const {
    shapes,
    selectedShapeId,
    selectedShapeIds,
    drawingMode,
    setSelectedShapeId,
    clearMultiSelect,
    setDrawingMode,
    updateShape,
    removeShape,
    clearShapes,
    addShape,
    duplicateShape,
    globalShapeSettings,
    setGlobalShapeSettings,
    toggleLock,
    bringToFront,
    sendToBack
  } = useDecorationStore()

  const [isPickerOpen, setIsPickerOpen] = useState(true)
  const [isSettingsOpen, setIsSettingsOpen] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [svgCode, setSvgCode] = useState('')
  const svgFileRef = useRef<HTMLInputElement>(null)
  const imgFileRef = useRef<HTMLInputElement>(null)

  const selectedShape = shapes.find(s => s.id === selectedShapeId)

  // Separate shapes vs section elements
  const SECTION_TYPE_LIST = ['textbox', 'textbox-auto', 'deco-image', 'deco-svg']
  const shapeElements = shapes.filter(s => !SECTION_TYPE_LIST.includes(s.type))
  const sectionElements = shapes.filter(s => SECTION_TYPE_LIST.includes(s.type))

  const handleSelectTool = (type: DrawingMode | 'select') => {
    if (type === 'select') {
      setDrawingMode(null)
      return
    }
    if (drawingMode === type) {
      setDrawingMode(null)
    } else {
      setDrawingMode(type)
    }
  }

  // ── Section: Add Image directly ────────────────────
  const handleAddImageFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      addShape({
        type: 'deco-image',
        x: 50, y: 50, width: 150, height: 150,
        rotation: 0, fillColor: 'transparent', fillOpacity: 100,
        strokeColor: '#cbd5e1', strokeWidth: 1, strokeStyle: 'solid',
        visible: true, locked: false, zIndex: shapes.length + 1,
        imageUrl: e.target?.result as string,
        imageFit: 'contain', borderRadius: 0,
      })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  // ── Section: Add SVG from file ─────────────────────
  const handleAddSvgFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      addShape({
        type: 'deco-svg',
        x: 50, y: 50, width: 150, height: 150,
        rotation: 0, fillColor: 'transparent', fillOpacity: 100,
        strokeColor: '#a5b4fc', strokeWidth: 1, strokeStyle: 'solid',
        visible: true, locked: false, zIndex: shapes.length + 1,
        svgContent: content,
      })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleAddSvgCode = () => {
    if (!svgCode.trim()) return
    addShape({
      type: 'deco-svg',
      x: 50, y: 50, width: 150, height: 150,
      rotation: 0, fillColor: 'transparent', fillOpacity: 100,
      strokeColor: '#a5b4fc', strokeWidth: 1, strokeStyle: 'solid',
      visible: true, locked: false, zIndex: shapes.length + 1,
      svgContent: svgCode.trim(),
    })
    setSvgCode('')
  }

  const handleAddImageUrl = (url: string) => {
    if (!url.trim()) return
    addShape({
      type: 'deco-image',
      x: 50, y: 50, width: 150, height: 150,
      rotation: 0, fillColor: 'transparent', fillOpacity: 100,
      strokeColor: '#cbd5e1', strokeWidth: 1, strokeStyle: 'solid',
      visible: true, locked: false, zIndex: shapes.length + 1,
      imageUrl: url.trim(),
      imageFit: 'contain', borderRadius: 0,
    })
  }

  const [showSectionClearConfirm, setShowSectionClearConfirm] = useState(false)
  const [showShapesClearConfirm, setShowShapesClearConfirm] = useState(false)

  const clearSectionElements = () => {
    const sectionShapes = shapes.filter(s => SECTION_TYPE_LIST.includes(s.type))
    sectionShapes.forEach(s => removeShape(s.id))
    setShowSectionClearConfirm(false)
  }

  const clearShapeElements = () => {
    const onlyShapes = shapes.filter(s => !SECTION_TYPE_LIST.includes(s.type))
    onlyShapes.forEach(s => removeShape(s.id))
    setShowShapesClearConfirm(false)
  }

  // Build list renderer for any set of shapes
  const renderElementList = (elements: typeof shapes, emptyIcon: React.ElementType, emptyText: string, listType?: 'section' | 'shapes') => {
    const EmptyIcon = emptyIcon
    const isSection = listType === 'section'
    const isShapes = listType === 'shapes'
    const showConfirm = isSection ? showSectionClearConfirm : isShapes ? showShapesClearConfirm : false
    const setShowConfirm = isSection ? setShowSectionClearConfirm : isShapes ? setShowShapesClearConfirm : () => { }
    const clearFn = isSection ? clearSectionElements : isShapes ? clearShapeElements : () => { }

    if (elements.length === 0 && !drawingMode) {
      return (
        <div className="text-center py-6 text-slate-400">
          <EmptyIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-xs">{emptyText}</p>
        </div>
      )
    }
    if (elements.length === 0) return null
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center px-1 py-1">
          <span className="text-xs text-gray-400 font-medium">{elements.length} element{elements.length !== 1 ? 's' : ''}</span>
          <div className="flex gap-1.5 items-center">
            {!showConfirm && selectedShapeId && elements.find(s => s.id === selectedShapeId) && (
              <Button size="sm" variant="ghost" onClick={() => setSelectedShapeId(null)} className="text-xs text-gray-500 h-6 px-2">
                Deselect
              </Button>
            )}
            {listType && elements.length > 0 && (
              !showConfirm ? (
                <Button size="sm" variant="ghost" onClick={() => setShowConfirm(true)} className="text-xs text-red-400 h-6 px-2">
                  Clear All
                </Button>
              ) : (
                <div className="flex gap-1 items-center">
                  <span className="text-[10px] text-red-500">Sure?</span>
                  <Button size="sm" variant="destructive" onClick={clearFn} className="text-xs h-6 px-2">
                    Confirm
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowConfirm(false)} className="text-xs h-6 px-2">
                    Cancel
                  </Button>
                </div>
              )
            )}
          </div>
        </div>
        {[...elements]
          .sort((a, b) => (a.id === selectedShapeId ? -1 : b.id === selectedShapeId ? 1 : 0))
          .map(shape => (
            <ShapeListItem
              key={shape.id}
              shape={shape}
              isSelected={selectedShapeId === shape.id}
              onSelect={() => setSelectedShapeId(selectedShapeId === shape.id ? null : shape.id)}
              onUpdate={(updates) => updateShape(shape.id, updates)}
              onRemove={() => removeShape(shape.id)}
              onDuplicate={() => duplicateShape(shape.id)}
              onToggleLock={() => toggleLock(shape.id)}
              onBringFront={() => bringToFront(shape.id)}
              onSendBack={() => sendToBack(shape.id)}
            />
          ))
        }
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Tabs defaultValue="shapes" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shapes" className="flex items-center gap-1.5 text-xs">
            <Hexagon className="h-3.5 w-3.5" />
            Shapes
          </TabsTrigger>
          <TabsTrigger value="section" className="flex items-center gap-1.5 text-xs">
            <Type className="h-3.5 w-3.5" />
            Section
          </TabsTrigger>
        </TabsList>

        {/* ═══════════ SHAPES TAB ═══════════ */}
        <TabsContent value="shapes" className="space-y-4 mt-3">

          {/* Multiple Selection Actions */}
          {selectedShapeIds.length > 1 && (
            <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200">
               <div className="flex items-center justify-between">
                 <span className="text-xs font-semibold text-amber-700">{selectedShapeIds.length} objects selected</span>
                 <div className="flex gap-2">
                   <Button variant="outline" size="sm" className="h-7 text-[10px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => { selectedShapeIds.forEach(id => removeShape(id)); clearMultiSelect(); }}>
                     <Trash2 className="w-3 h-3 mr-1" /> Delete
                   </Button>
                   <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={clearMultiSelect}>
                     Cancel
                   </Button>
                 </div>
               </div>
            </div>
          )}

          {/* Global Settings */}
          {drawingMode && ['freehand', 'line', 'arrow', 'double-arrow', 'connected-lines', 'bezier-line', 'bspline-curve', 'cloud-line', 'rectangle', 'circle', 'triangle', 'star', 'polygon', 'hexagon', 'pentagon', 'diamond-shape', 'heart', 'cloud', 'text-callout', 'checkmark', 'crossmark', 'dot', 'pushpin', 'bullseye'].some(mode => drawingMode === mode || drawingMode.startsWith('num-') || drawingMode.startsWith('emoji-')) && (() => {
            const isLineDrawing = ['freehand', 'line', 'arrow', 'double-arrow', 'connected-lines', 'bezier-line', 'bspline-curve'].includes(drawingMode)
            
            return (
              <div className={`relative overflow-hidden transition-all duration-300 border rounded-lg ${isSettingsOpen ? 'bg-blue-50/40 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="w-full h-9 px-3 flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md transition-all duration-300 ${isSettingsOpen ? 'bg-blue-500 text-white shadow-blue-200 shadow-sm scale-105' : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                      <Pencil className="h-3 w-3" />
                    </div>
                    <Label className={`text-[11px] font-bold tracking-wide uppercase cursor-pointer transition-colors ${isSettingsOpen ? 'text-blue-900' : 'text-slate-600 group-hover:text-blue-600'}`}>
                      Global Tool Settings
                    </Label>
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 transition-all duration-500 ${isSettingsOpen ? 'rotate-180 text-blue-500' : 'text-slate-400 group-hover:text-blue-400'}`} />
                </button>

                {isSettingsOpen && (
                  <div className="px-3 pb-3 pt-1 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 ease-out border-t border-blue-100/50">
                    <div className="grid grid-cols-2 gap-3">
                  {/* Fill settings (only for closed shapes) */}
                  {!isLineDrawing && (
                    <>
                      <div className="col-span-2">
                        <Label className="text-[10px] text-slate-500 block mb-1">Fill Color</Label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex items-center gap-2 flex-1">
                            <Input type="color" value={globalShapeSettings.fillColor === 'transparent' ? '#ffffff' : globalShapeSettings.fillColor} onChange={e => setGlobalShapeSettings({ fillColor: e.target.value })} className="h-7 w-7 p-0 border opacity-0 absolute z-10 cursor-pointer" />
                            <div className={`h-7 w-7 rounded border border-slate-200 flex-shrink-0 ${globalShapeSettings.fillColor === 'transparent' ? 'bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAADhJREFUKFNjYMACzp8//z+UjxUwIqkxYFIETgBRD1YJ4uNRY2CRQDaQahw2kGwzVjWQ9JDoRRAAAGB7W9+j/TqBAAAAAElFTkSuQmCC)]' : ''}`} style={{ backgroundColor: globalShapeSettings.fillColor === 'transparent' ? undefined : globalShapeSettings.fillColor }} />
                            <span className="text-[9px] text-slate-400 font-mono uppercase truncate">
                              {globalShapeSettings.fillColor === 'transparent' ? 'None' : globalShapeSettings.fillColor}
                            </span>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className={`h-7 px-3 text-[10px] ${globalShapeSettings.fillColor === 'transparent' ? 'bg-slate-100 text-slate-700' : 'text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setGlobalShapeSettings({ fillColor: globalShapeSettings.fillColor === 'transparent' ? '#ffffff' : 'transparent' })}
                          >
                            Toggle Clear
                          </Button>
                        </div>
                      </div>
                      <div className="col-span-2 mb-1">
                        <div className="flex justify-between mb-1.5">
                          <Label className="text-[10px] text-slate-500">Fill Opacity</Label>
                          <span className="text-[10px] text-slate-400">{globalShapeSettings.fillOpacity}%</span>
                        </div>
                        <Slider value={[globalShapeSettings.fillOpacity]} disabled={globalShapeSettings.fillColor === 'transparent'} onValueChange={([v]) => setGlobalShapeSettings({ fillOpacity: v })} min={0} max={100} />
                      </div>
                    </>
                  )}
                  {/* Stroke settings */}
                  <div>
                    <Label className="text-[10px] text-slate-500 block mb-1">Outline Color</Label>
                    <div className="relative flex items-center gap-2">
                      <Input type="color" value={globalShapeSettings.strokeColor} onChange={e => setGlobalShapeSettings({ strokeColor: e.target.value })} className="h-7 w-7 p-0 border opacity-0 absolute z-10 cursor-pointer" />
                      <div className="h-7 w-7 rounded border border-slate-200 flex-shrink-0" style={{ backgroundColor: globalShapeSettings.strokeColor }} />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-slate-500 block mb-1.5">Outline Width</Label>
                    <div className="flex gap-1.5">
                      {[1, 2, 4, 8].map(w => (
                        <button
                          key={w}
                          onClick={() => setGlobalShapeSettings({ strokeWidth: w })}
                          className={`w-7 h-7 rounded border flex items-center justify-center transition-colors ${globalShapeSettings.strokeWidth === w ? 'bg-blue-100 border-blue-400 text-blue-600 shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-400'}`}
                        >
                          <span className="text-[10px] font-medium">{w}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-[10px] text-slate-500 block mb-1.5">Outline Style</Label>
                    <div className="flex bg-white p-0.5 rounded-md border border-slate-200">
                      {(['solid', 'dashed', 'dotted'] as const).map(style => (
                        <button
                          key={style}
                          onClick={() => setGlobalShapeSettings({ strokeStyle: style, strokeDashPattern: undefined })}
                          className={`flex-1 flex justify-center items-center h-6 rounded-sm transition-all text-[10px] font-medium ${globalShapeSettings.strokeStyle === style ? 'bg-slate-100 text-slate-800 shadow-sm border border-slate-300/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          <div className={`w-6 h-0 border-t-2 border-current ${style === 'dashed' ? 'border-dashed' : style === 'dotted' ? 'border-dotted' : ''}`} />
                        </button>
                      ))}
                    </div>
                    {globalShapeSettings.strokeStyle !== 'solid' && (() => {
                      const isDotted = globalShapeSettings.strokeStyle === 'dotted';
                      const currentPattern = globalShapeSettings.strokeDashPattern || (isDotted ? '0,8' : '8,6');
                      const dashParts = currentPattern.split(',');
                      const dashLen = dashParts[0] || (isDotted ? '0' : '8');
                      const gapLen = dashParts[1] || (isDotted ? '8' : '6');

                      return (
                        <div className="mt-2.5 flex items-center gap-3 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
                          {!isDotted && (
                            <div className="flex-1 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                              <Label className="text-[10px] text-slate-500 whitespace-nowrap">Dash Length</Label>
                              <Input 
                                type="number"
                                min="1" max="100"
                                className="h-6 text-[10px] bg-white border-slate-200" 
                                value={dashLen}
                                onChange={(e) => setGlobalShapeSettings({ strokeDashPattern: `${e.target.value},${gapLen}` })}
                              />
                            </div>
                          )}
                          <div className="flex-1 space-y-1.5 animate-in fade-in zoom-in-95 duration-200">
                            <Label className="text-[10px] text-slate-500 whitespace-nowrap">Gap Length</Label>
                            <Input 
                              type="number"
                              min="1" max="100"
                              className="h-6 text-[10px] bg-white border-slate-200" 
                              value={gapLen}
                              onChange={(e) => setGlobalShapeSettings({ strokeDashPattern: `${isDotted ? '0' : dashLen},${e.target.value}` })}
                            />
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Shape Picker */}
          <div className={`relative overflow-hidden transition-all duration-300 border rounded-lg ${isPickerOpen ? 'bg-slate-50/30 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
            <button
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="w-full h-9 px-3 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1 rounded-md transition-all duration-300 ${isPickerOpen ? 'bg-amber-500 text-white shadow-amber-200 shadow-md scale-105' : 'bg-slate-100 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-500'}`}>
                  <Hexagon className="h-3.5 w-3.5" />
                </div>
                <span className={`text-xs font-bold transition-colors ${isPickerOpen ? 'text-slate-900' : 'text-slate-600 group-hover:text-amber-600'}`}>
                  {drawingMode ? `Drawing: ${drawingMode}` : 'Add Shape'}
                </span>
              </div>
              <ChevronDown className={`h-3.5 w-3.5 transition-all duration-500 ${isPickerOpen ? 'rotate-180 text-amber-500' : 'text-slate-400 group-hover:text-amber-400'}`} />
            </button>

            {isPickerOpen && (
              <div className="px-2 pb-3 pt-1 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-300 ease-out">
                {SHAPE_GROUPS.map(g => {
                  const isLabeledToolGroup = g.label === 'Tools'
                  const isEmojiGroup = g.label === 'Emojis'
                  const gridCols = isLabeledToolGroup ? 'grid grid-cols-3' : isEmojiGroup ? 'grid grid-cols-7' : 'grid grid-cols-5'
                  return (
                    <div key={g.label} className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="h-[1px] flex-1 bg-slate-100" />
                        <Label className="text-[9px] uppercase text-slate-400 font-black tracking-[0.15em] whitespace-nowrap">{g.label}</Label>
                        <div className="h-[1px] flex-1 bg-slate-100" />
                      </div>
                      <div className={`${gridCols} gap-1`}>
                        {g.shapes.map(s => {
                          const isActive = s.type === 'select' ? drawingMode === null : drawingMode === s.type
                          const isLabeledTool = s.type === 'freehand' || s.type === 'select' || s.type === 'marquee-select'
                          return (
                            <Button
                              key={s.type}
                              variant={isActive ? "default" : "outline"}
                              title={s.label}
                              className={`${isLabeledTool ? 'h-8 px-3 flex items-center gap-1.5' : 'h-8 w-8 p-0 flex items-center justify-center'} transition-all duration-200 ${isActive
                                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-200/50'
                                  : 'hover:border-amber-400 hover:bg-amber-50/50 hover:text-amber-600 border-slate-100 bg-white/50'
                                }`}
                              onClick={() => handleSelectTool(s.type as any)}
                            >
                              <s.icon className={isLabeledTool ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                              {isLabeledTool && (
                                <span className="text-[10px] font-semibold">
                                  {s.label}
                                </span>
                              )}
                            </Button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}



                {drawingMode && (
                  <p className="text-[10px] text-slate-400 text-center px-2">
                    {drawingMode === 'freehand' && 'Click and drag on the canvas to draw freely'}
                    {drawingMode === 'line' && 'Click and drag to draw a line. Hold Shift for angle snapping'}
                    {drawingMode === 'arrow' && 'Click and drag to draw an arrow. Hold Shift for angle snapping'}
                    {drawingMode === 'double-arrow' && 'Click and drag to draw a double arrow'}
                    {drawingMode === 'rectangle' && 'Click and drag to draw a rectangle'}
                    {drawingMode === 'circle' && 'Click and drag to draw a circle/ellipse'}
                    {drawingMode === 'triangle' && 'Click and drag to draw a triangle'}
                    {drawingMode === 'star' && 'Click and drag to draw a star'}
                    {drawingMode === 'polygon' && 'Click to add points. Double-click to close the shape'}
                    {drawingMode === 'cloud' && 'Click and drag to draw a cloud shape'}
                    {drawingMode === 'text-callout' && 'Click and drag to create a text callout'}
                    {drawingMode === 'connected-lines' && 'Click to add points. Double-click to finish'}
                    {drawingMode === 'bezier-line' && 'Click to add points. Double-click to finish. Curve strictly passes through points (Catmull-Rom)'}
                    {drawingMode === 'bspline-curve' && 'Click to add control points. Double-click to finish. Curve smoothly flows near points (DaVinci Resolve-style)'}
                    {drawingMode === 'cloud-line' && 'Click to add points to a cloud-line path. Double-click to finish'}
                    {drawingMode === 'checkmark' && 'Click and drag to stamp a checkmark'}
                    {drawingMode === 'crossmark' && 'Click and drag to stamp a crossmark'}
                    {drawingMode === 'dot' && 'Click and drag to stamp a dot'}
                    {drawingMode?.startsWith('num-') && 'Click and drag to stamp a number'}
                    {drawingMode?.startsWith('emoji-') && 'Click and drag to stamp an emoji'}
                    {drawingMode === 'marquee-select' && 'Click and drag a rectangle to select multiple shapes'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Shape List */}
          {renderElementList(shapeElements, Hexagon, 'No shapes added yet. Select a tool above and draw on the canvas.', 'shapes')}
        </TabsContent>

        {/* ═══════════ SECTION TAB ═══════════ */}
        <TabsContent value="section" className="space-y-4 mt-3">

          {/* ── Add Textbox ──────────────────────────── */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/50 border-b border-slate-100">
              <Type className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-700">Add Textbox</span>
            </div>
            <div className="px-3 py-3 space-y-2">
              <p className="text-[10px] text-slate-400">Draw a textbox on the canvas. Choose a type:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={drawingMode === 'textbox' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-14 flex flex-col items-center gap-1 text-[10px] ${drawingMode === 'textbox' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:border-blue-400 hover:bg-blue-50/50'}`}
                  onClick={() => handleSelectTool('textbox' as DrawingMode)}
                >
                  <Type className="h-4 w-4" />
                  <span className="font-semibold">Normal</span>
                  <span className="text-[8px] opacity-70">Fixed box</span>
                </Button>
                <Button
                  variant={drawingMode === 'textbox-auto' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-14 flex flex-col items-center gap-1 text-[10px] ${drawingMode === 'textbox-auto' ? 'bg-blue-500 hover:bg-blue-600' : 'hover:border-blue-400 hover:bg-blue-50/50'}`}
                  onClick={() => handleSelectTool('textbox-auto' as DrawingMode)}
                >
                  <Type className="h-4 w-4" />
                  <span className="font-semibold">Single</span>
                  <span className="text-[8px] opacity-70">Auto-size</span>
                </Button>
              </div>
              {(drawingMode === 'textbox' || drawingMode === 'textbox-auto') && (
                <p className="text-[10px] text-blue-500 text-center animate-in fade-in">
                  Click and drag on canvas to draw the textbox
                </p>
              )}
            </div>
          </div>

          {/* ── Add Image ────────────────────────────── */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/50 border-b border-slate-100">
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-bold text-slate-700">Add Image</span>
            </div>
            <div className="px-3 py-3 space-y-2.5">
              <input ref={imgFileRef} type="file" accept="image/*" onChange={handleAddImageFile} className="hidden" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-10 text-xs" onClick={() => imgFileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload
                </Button>
                <Button
                  variant={drawingMode === 'deco-image' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-10 text-xs ${drawingMode === 'deco-image' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}`}
                  onClick={() => handleSelectTool('deco-image' as DrawingMode)}
                >
                  <ImageIcon className="h-3.5 w-3.5 mr-1.5" /> Draw Area
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Input
                  placeholder="Image URL (https://...)"
                  className="h-7 text-xs flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddImageUrl(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <Button variant="outline" size="sm" className="h-7 text-xs px-2"
                  onClick={() => {
                    const inp = document.querySelector('input[placeholder="Image URL (https://...)"]') as HTMLInputElement
                    if (inp?.value) { handleAddImageUrl(inp.value); inp.value = '' }
                  }}
                >Add</Button>
              </div>
              {drawingMode === 'deco-image' && (
                <p className="text-[10px] text-emerald-500 text-center animate-in fade-in">
                  Click and drag on canvas to draw the image area
                </p>
              )}
            </div>
          </div>

          {/* ── Add SVG ──────────────────────────────── */}
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/50 border-b border-slate-100">
              <FileCode className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-bold text-slate-700">Add SVG</span>
            </div>
            <div className="px-3 py-3 space-y-2.5">
              <input ref={svgFileRef} type="file" accept=".svg" onChange={handleAddSvgFile} className="hidden" />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="h-10 text-xs" onClick={() => svgFileRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> Upload SVG
                </Button>
                <Button
                  variant={drawingMode === 'deco-svg' ? 'default' : 'outline'}
                  size="sm"
                  className={`h-10 text-xs ${drawingMode === 'deco-svg' ? 'bg-violet-500 hover:bg-violet-600' : ''}`}
                  onClick={() => handleSelectTool('deco-svg' as DrawingMode)}
                >
                  <FileCode className="h-3.5 w-3.5 mr-1.5" /> Draw Area
                </Button>
              </div>
              <Textarea
                value={svgCode}
                onChange={(e) => setSvgCode(e.target.value)}
                placeholder="Paste SVG code here..."
                className="min-h-[60px] text-xs font-mono resize-none"
                rows={3}
              />
              <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={handleAddSvgCode} disabled={!svgCode.trim()}>
                Add SVG from Code
              </Button>
              {drawingMode === 'deco-svg' && (
                <p className="text-[10px] text-violet-500 text-center animate-in fade-in">
                  Click and drag on canvas to draw the SVG area
                </p>
              )}
            </div>
          </div>

          {/* Cancel drawing mode */}
          {drawingMode && SECTION_TYPE_LIST.includes(drawingMode) && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs border-red-200 text-red-500 hover:bg-red-50"
              onClick={() => setDrawingMode(null)}
            >
              Cancel Drawing Mode
            </Button>
          )}

          {/* Section Elements List */}
          {renderElementList(sectionElements, Type, 'No section elements yet. Add a textbox, image, or SVG above.', 'section')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
