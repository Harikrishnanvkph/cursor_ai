"use client"

import React, { useState } from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { BackgroundSection } from "../template-settings/content-tab/background-section"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Palette, FileText, MousePointerClick, Layers } from "lucide-react"
import { toast } from "sonner"
import type { FormatBlueprintRow } from "@/lib/format-types"

// Image compression helper
const compressImage = (
  file: File,
  maxWidth: number = 800,
  quality: number = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          ctx.drawImage(img, 0, 0, width, height)
        }
        const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
        resolve(canvas.toDataURL(format, quality))
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

type BackgroundMode = 'document' | 'section'

/**
 * BackgroundPanel — A unified Background editing panel that works for both
 * Templates and Formats with "Whole Document" / "Selected Section" toggle.
 */
export function BackgroundPanel() {
  const { currentTemplate, selectedTextAreaId, updateTextArea } = useTemplateStore()
  const { selectedFormatId, selectedZoneId, formats } = useFormatGalleryStore()

  const [bgMode, setBgMode] = useState<BackgroundMode>('document')

  // Find the selected format if any
  const selectedFormat = selectedFormatId
    ? formats.find((f) => f.id === selectedFormatId)
    : null

  // Find the selected text area in templates
  const selectedTextArea = currentTemplate?.textAreas.find(ta => ta.id === selectedTextAreaId) || null

  // Find the selected zone in formats
  const selectedZone = selectedFormat
    ? ((selectedFormat.skeleton as any)?.zones || []).find((z: any) => z.id === selectedZoneId)
    : null

  // Determine if we have a selectable section
  const hasSectionSelection = currentTemplate
    ? !!selectedTextArea
    : selectedFormat
      ? !!selectedZone && selectedZone.type !== 'background'
      : false

  // Auto-switch to document mode if section becomes deselected
  React.useEffect(() => {
    if (bgMode === 'section' && !hasSectionSelection) {
      // Don't auto-switch, keep showing the "select a section" message
    }
  }, [bgMode, hasSectionSelection])

  // ─────────────────────────────────────────────
  // NO TEMPLATE / FORMAT SELECTED
  // ─────────────────────────────────────────────
  if (!currentTemplate && !selectedFormat) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Palette className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              Select a template or format to edit its background.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ─────────────────────────────────────────────
  // MODE TOGGLE (shared by Templates & Formats)
  // ─────────────────────────────────────────────
  const renderModeToggle = () => (
    <div className="mb-4">
      <div className="flex bg-gray-100 rounded-lg p-0.5">
        <button
          onClick={() => setBgMode('document')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            bgMode === 'document'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Whole Document
        </button>
        <button
          onClick={() => setBgMode('section')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
            bgMode === 'section'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MousePointerClick className="w-3.5 h-3.5" />
          Selected Section
        </button>
      </div>
    </div>
  )

  // ─────────────────────────────────────────────
  // TEMPLATE MODE
  // ─────────────────────────────────────────────
  if (currentTemplate) {
    return (
      <div className="space-y-4">
        {renderModeToggle()}
        
        {bgMode === 'document' ? (
          <BackgroundSection currentTemplate={currentTemplate} />
        ) : (
          selectedTextArea ? (
            <SectionBackgroundEditor
              background={selectedTextArea.background}
              sectionLabel={selectedTextArea.type.charAt(0).toUpperCase() + selectedTextArea.type.slice(1)}
              sectionDimensions={{
                width: selectedTextArea.position.width,
                height: selectedTextArea.position.height,
              }}
              onUpdate={(bg) => updateTextArea(selectedTextArea.id, { background: bg })}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <MousePointerClick className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-800">No section selected</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Click on a text area in the preview to edit its background.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────
  // FORMAT MODE
  // ─────────────────────────────────────────────
  if (selectedFormat) {
    return (
      <div className="space-y-4">
        {renderModeToggle()}
        
        {bgMode === 'document' ? (
          <FormatBackgroundEditor format={selectedFormat} />
        ) : (
          selectedZone && selectedZone.type !== 'background' ? (
            <FormatZoneBackgroundEditor
              format={selectedFormat}
              zone={selectedZone}
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <MousePointerClick className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-800">No section selected</p>
                  <p className="text-xs text-amber-600 mt-1">
                    Click on a zone (text, stat, or decoration) in the preview to edit its background.
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        )}
      </div>
    )
  }

  return null
}

// ────────────────────────────────────────────────
// Section Background Editor (for Template TextAreas)
// ────────────────────────────────────────────────

interface SectionBackgroundEditorProps {
  background?: {
    type?: 'color' | 'gradient' | 'image' | 'transparent'
    color?: string
    gradientType?: 'linear' | 'radial'
    gradientDirection?: string
    gradientColor1?: string
    gradientColor2?: string
    imageUrl?: string
    imageFit?: 'fill' | 'contain' | 'cover'
    opacity?: number
  }
  sectionLabel: string
  sectionDimensions: { width: number; height: number }
  onUpdate: (bg: any) => void
}

function SectionBackgroundEditor({ background, sectionLabel, sectionDimensions, onUpdate }: SectionBackgroundEditorProps) {
  const bg = background || {}
  const currentType = bg.type || 'transparent'

  const handleUpdate = (updates: Record<string, any>) => {
    onUpdate({ ...bg, ...updates })
  }

  return (
    <Card>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Palette className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-800">{sectionLabel} Background</h3>
      </div>
      <CardContent className="space-y-3">
        {/* Section info */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-md border border-blue-100">
          <FileText className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs text-blue-700">
            {sectionLabel} area — {sectionDimensions.width} × {sectionDimensions.height}px
          </span>
        </div>

        {/* Background Type */}
        <div>
          <Label className="text-xs font-medium">Background Type</Label>
          <Select
            value={currentType}
            onValueChange={(value) => handleUpdate({ type: value })}
          >
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">Transparent</SelectItem>
              <SelectItem value="color">Color</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        {currentType === 'color' && (
          <div>
            <Label className="text-xs">Background Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={bg.color || '#ffffff'}
                onChange={(e) => handleUpdate({ color: e.target.value })}
                className="w-10 h-7 p-1"
              />
              <Input
                type="text"
                value={bg.color || '#ffffff'}
                onChange={(e) => handleUpdate({ color: e.target.value })}
                className="flex-1 h-7 text-xs"
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}

        {/* Gradient */}
        {currentType === 'gradient' && (
          <>
            <div>
              <Label className="text-xs">Gradient Type</Label>
              <Select
                value={bg.gradientType || 'linear'}
                onValueChange={(value) => handleUpdate({ gradientType: value })}
              >
                <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Direction</Label>
              <Select
                value={bg.gradientDirection || 'to right'}
                onValueChange={(value) => handleUpdate({ gradientDirection: value })}
                disabled={bg.gradientType === 'radial'}
              >
                <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="to right">Left → Right</SelectItem>
                  <SelectItem value="to left">Right → Left</SelectItem>
                  <SelectItem value="to bottom">Top → Bottom</SelectItem>
                  <SelectItem value="to top">Bottom → Top</SelectItem>
                  <SelectItem value="135deg">Diagonal (135°)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Gradient Colors</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" value={bg.gradientColor1 || '#ffffff'} onChange={(e) => handleUpdate({ gradientColor1: e.target.value })} className="w-10 h-7 p-1" />
                <Input type="color" value={bg.gradientColor2 || '#000000'} onChange={(e) => handleUpdate({ gradientColor2: e.target.value })} className="w-10 h-7 p-1" />
              </div>
            </div>
          </>
        )}

        {/* Image */}
        {currentType === 'image' && (
          <>
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input
                type="text"
                value={bg.imageUrl || ''}
                onChange={(e) => handleUpdate({ imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    try {
                      toast.info('Compressing image...', { duration: 1000 })
                      const compressed = await compressImage(file, 800, 0.85)
                      handleUpdate({ imageUrl: compressed })
                      toast.success('Image uploaded!')
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to process image')
                      e.target.value = ''
                    }
                  }
                }}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Image Fit</Label>
              <Select
                value={bg.imageFit || 'cover'}
                onValueChange={(value) => handleUpdate({ imageFit: value })}
              >
                <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fill">Fill</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="cover">Cover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Opacity */}
        {currentType !== 'transparent' && currentType !== undefined && (
          <div>
            <Label className="text-xs">Opacity</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="range"
                min="0"
                max="100"
                value={bg.opacity || 100}
                onChange={(e) => handleUpdate({ opacity: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs w-12 text-right">{bg.opacity || 100}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ────────────────────────────────────────────────
// Format Background Editor (Whole Document)
// ────────────────────────────────────────────────

function FormatBackgroundEditor({ format }: { format: FormatBlueprintRow }) {
  const { formats, selectedFormatId } = useFormatGalleryStore()

  const skeleton = format.skeleton as any
  const zones = skeleton?.zones || []
  const bgZone = zones.find((z: any) => z.type === 'background')
  const bgStyle = bgZone?.style || {}

  const updateBgStyle = (updates: Record<string, any>) => {
    const updatedFormats = formats.map(f => {
      if (f.id !== selectedFormatId) return f
      const skel = { ...(f.skeleton as any) }
      const existingZones = skel.zones || []
      
      const bgIdx = existingZones.findIndex((z: any) => z.type === 'background')
      if (bgIdx >= 0) {
        const updatedZones = [...existingZones]
        updatedZones[bgIdx] = {
          ...updatedZones[bgIdx],
          style: { ...updatedZones[bgIdx].style, ...updates }
        }
        skel.zones = updatedZones
      } else {
        skel.zones = [...existingZones, {
          id: 'bg-zone',
          type: 'background',
          style: { type: 'solid', color: '#ffffff', ...updates }
        }]
      }
      return { ...f, skeleton: skel }
    })
    
    useFormatGalleryStore.setState({ formats: updatedFormats })
  }

  const currentType = bgStyle.type || 'solid'

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <Palette className="h-4 w-4 text-amber-600" />
          <h3 className="text-sm font-semibold text-slate-800">Format Background</h3>
        </div>
        <CardContent className="space-y-3">
          {/* Background Type */}
          <div>
            <Label className="text-xs font-medium">Background Type</Label>
            <Select
              value={currentType}
              onValueChange={(value) => updateBgStyle({ type: value })}
            >
              <SelectTrigger className="h-7 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">Solid Color</SelectItem>
                <SelectItem value="gradient">Gradient</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="pattern">Pattern</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Solid Color */}
          {currentType === 'solid' && (
            <div>
              <Label className="text-xs">Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={bgStyle.color || '#ffffff'}
                  onChange={(e) => updateBgStyle({ color: e.target.value })}
                  className="w-10 h-7 p-1"
                />
                <Input
                  type="text"
                  value={bgStyle.color || '#ffffff'}
                  onChange={(e) => updateBgStyle({ color: e.target.value })}
                  className="flex-1 h-7 text-xs"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          )}

          {/* Gradient */}
          {currentType === 'gradient' && (
            <>
              <div>
                <Label className="text-xs">Gradient Type</Label>
                <Select
                  value={bgStyle.gradientType || 'linear'}
                  onValueChange={(value) => updateBgStyle({ gradientType: value })}
                >
                  <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Direction</Label>
                <Select
                  value={bgStyle.gradientDirection || '135deg'}
                  onValueChange={(value) => updateBgStyle({ gradientDirection: value })}
                  disabled={bgStyle.gradientType === 'radial'}
                >
                  <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to right">Left → Right</SelectItem>
                    <SelectItem value="to left">Right → Left</SelectItem>
                    <SelectItem value="to bottom">Top → Bottom</SelectItem>
                    <SelectItem value="to top">Bottom → Top</SelectItem>
                    <SelectItem value="135deg">Diagonal (135°)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Gradient Colors</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={bgStyle.gradientColor1 || '#ffffff'} onChange={(e) => updateBgStyle({ gradientColor1: e.target.value })} className="w-10 h-7 p-1" />
                  <Input type="color" value={bgStyle.gradientColor2 || '#000000'} onChange={(e) => updateBgStyle({ gradientColor2: e.target.value })} className="w-10 h-7 p-1" />
                </div>
              </div>
            </>
          )}

          {/* Image */}
          {currentType === 'image' && (
            <>
              <div>
                <Label className="text-xs">Image URL</Label>
                <Input
                  type="text"
                  value={bgStyle.imageUrl || ''}
                  onChange={(e) => updateBgStyle({ imageUrl: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="h-7 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Upload Image</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (event) => {
                        updateBgStyle({ imageUrl: event.target?.result as string })
                      }
                      reader.readAsDataURL(file)
                    }
                  }}
                  className="h-7 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Image Fit</Label>
                <Select
                  value={bgStyle.imageFit || 'cover'}
                  onValueChange={(value) => updateBgStyle({ imageFit: value })}
                >
                  <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fill">Fill</SelectItem>
                    <SelectItem value="contain">Contain</SelectItem>
                    <SelectItem value="cover">Cover</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Overlay</Label>
                <Input
                  type="text"
                  value={bgStyle.overlay || ''}
                  onChange={(e) => updateBgStyle({ overlay: e.target.value })}
                  placeholder="rgba(0,0,0,0.3)"
                  className="h-7 text-xs mt-1"
                />
              </div>
              {bgStyle.blur !== undefined && (
                <div>
                  <Label className="text-xs">Blur</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Slider
                      value={[bgStyle.blur || 0]}
                      onValueChange={([v]) => updateBgStyle({ blur: v })}
                      min={0} max={20} step={1}
                      className="flex-1"
                    />
                    <span className="text-xs w-8 text-right text-gray-500">{bgStyle.blur || 0}px</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Pattern */}
          {currentType === 'pattern' && (
            <>
              <div>
                <Label className="text-xs">Pattern Type</Label>
                <Select
                  value={bgStyle.patternType || 'dots'}
                  onValueChange={(value) => updateBgStyle({ patternType: value })}
                >
                  <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dots">Dots</SelectItem>
                    <SelectItem value="lines">Lines</SelectItem>
                    <SelectItem value="grid">Grid</SelectItem>
                    <SelectItem value="mesh">Mesh</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Base Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={bgStyle.color || '#ffffff'} onChange={(e) => updateBgStyle({ color: e.target.value })} className="w-10 h-7 p-1" />
                  <Input type="text" value={bgStyle.color || '#ffffff'} onChange={(e) => updateBgStyle({ color: e.target.value })} className="flex-1 h-7 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Pattern Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={bgStyle.patternColor || '#e2e8f0'} onChange={(e) => updateBgStyle({ patternColor: e.target.value })} className="w-10 h-7 p-1" />
                  <Input type="text" value={bgStyle.patternColor || '#e2e8f0'} onChange={(e) => updateBgStyle({ patternColor: e.target.value })} className="flex-1 h-7 text-xs" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Pattern Opacity</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Slider
                    value={[Math.round((bgStyle.patternOpacity || 0.3) * 100)]}
                    onValueChange={([v]) => updateBgStyle({ patternOpacity: v / 100 })}
                    min={0} max={100} step={1}
                    className="flex-1"
                  />
                  <span className="text-xs w-10 text-right text-gray-500">{Math.round((bgStyle.patternOpacity || 0.3) * 100)}%</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ────────────────────────────────────────────────
// Format Zone Background Editor (Selected Section)
// ────────────────────────────────────────────────

function FormatZoneBackgroundEditor({ format, zone }: { format: FormatBlueprintRow; zone: any }) {
  const { formats, selectedFormatId } = useFormatGalleryStore()

  // Get zone's current background style (stored as bgColor, bgGradient etc. on zone.style or zone itself)
  const zoneStyle = zone.style || {}
  const zoneBgColor = zoneStyle.backgroundColor || zoneStyle.bgColor || ''
  const zoneBgType = zoneStyle.bgType || (zoneBgColor ? 'color' : 'transparent')

  const zoneLabel = zone.role
    ? `${zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} (${zone.role})`
    : zone.subtype
      ? `${zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} (${zone.subtype})`
      : zone.type.charAt(0).toUpperCase() + zone.type.slice(1)

  const zoneDimensions = zone.position
    ? { width: zone.position.width, height: zone.position.height }
    : { width: 0, height: 0 }

  const updateZoneStyle = (updates: Record<string, any>) => {
    const updatedFormats = formats.map(f => {
      if (f.id !== selectedFormatId) return f
      const skel = { ...(f.skeleton as any) }
      const existingZones = (skel.zones || []).map((z: any) => {
        if (z.id !== zone.id) return z
        return {
          ...z,
          style: { ...z.style, ...updates }
        }
      })
      skel.zones = existingZones
      return { ...f, skeleton: skel }
    })
    useFormatGalleryStore.setState({ formats: updatedFormats })
  }

  return (
    <Card>
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Palette className="h-4 w-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-800">{zoneLabel} Background</h3>
      </div>
      <CardContent className="space-y-3">
        {/* Zone info */}
        <div className="flex items-center gap-2 px-2 py-1.5 bg-blue-50 rounded-md border border-blue-100">
          <FileText className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs text-blue-700">
            {zoneLabel} zone{zoneDimensions.width > 0 ? ` — ${zoneDimensions.width} × ${zoneDimensions.height}px` : ''}
          </span>
        </div>

        {/* Background Type */}
        <div>
          <Label className="text-xs font-medium">Background Type</Label>
          <Select
            value={zoneBgType}
            onValueChange={(value) => updateZoneStyle({ bgType: value })}
          >
            <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="transparent">Transparent</SelectItem>
              <SelectItem value="color">Color</SelectItem>
              <SelectItem value="gradient">Gradient</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Color */}
        {zoneBgType === 'color' && (
          <div>
            <Label className="text-xs">Background Color</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={zoneStyle.backgroundColor || '#ffffff'}
                onChange={(e) => updateZoneStyle({ backgroundColor: e.target.value })}
                className="w-10 h-7 p-1"
              />
              <Input
                type="text"
                value={zoneStyle.backgroundColor || '#ffffff'}
                onChange={(e) => updateZoneStyle({ backgroundColor: e.target.value })}
                className="flex-1 h-7 text-xs"
                placeholder="#ffffff"
              />
            </div>
          </div>
        )}

        {/* Gradient */}
        {zoneBgType === 'gradient' && (
          <>
            <div>
              <Label className="text-xs">Gradient Type</Label>
              <Select
                value={zoneStyle.bgGradientType || 'linear'}
                onValueChange={(value) => updateZoneStyle({ bgGradientType: value })}
              >
                <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear</SelectItem>
                  <SelectItem value="radial">Radial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Direction</Label>
              <Select
                value={zoneStyle.bgGradientDirection || 'to right'}
                onValueChange={(value) => updateZoneStyle({ bgGradientDirection: value })}
                disabled={zoneStyle.bgGradientType === 'radial'}
              >
                <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="to right">Left → Right</SelectItem>
                  <SelectItem value="to left">Right → Left</SelectItem>
                  <SelectItem value="to bottom">Top → Bottom</SelectItem>
                  <SelectItem value="to top">Bottom → Top</SelectItem>
                  <SelectItem value="135deg">Diagonal (135°)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Gradient Colors</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" value={zoneStyle.bgGradientColor1 || '#ffffff'} onChange={(e) => updateZoneStyle({ bgGradientColor1: e.target.value })} className="w-10 h-7 p-1" />
                <Input type="color" value={zoneStyle.bgGradientColor2 || '#000000'} onChange={(e) => updateZoneStyle({ bgGradientColor2: e.target.value })} className="w-10 h-7 p-1" />
              </div>
            </div>
          </>
        )}

        {/* Image */}
        {zoneBgType === 'image' && (
          <>
            <div>
              <Label className="text-xs">Image URL</Label>
              <Input
                type="text"
                value={zoneStyle.bgImageUrl || ''}
                onChange={(e) => updateZoneStyle({ bgImageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    try {
                      toast.info('Compressing image...', { duration: 1000 })
                      const compressed = await compressImage(file, 800, 0.85)
                      updateZoneStyle({ bgImageUrl: compressed })
                      toast.success('Image uploaded!')
                    } catch (err: any) {
                      toast.error(err.message || 'Failed to process image')
                      e.target.value = ''
                    }
                  }
                }}
                className="h-7 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Image Fit</Label>
              <Select
                value={zoneStyle.bgImageFit || 'cover'}
                onValueChange={(value) => updateZoneStyle({ bgImageFit: value })}
              >
                <SelectTrigger className="h-7 text-xs mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fill">Fill</SelectItem>
                  <SelectItem value="contain">Contain</SelectItem>
                  <SelectItem value="cover">Cover</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* Opacity */}
        {zoneBgType !== 'transparent' && (
          <div>
            <Label className="text-xs">Opacity</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="range"
                min="0"
                max="100"
                value={zoneStyle.bgOpacity ?? 100}
                onChange={(e) => updateZoneStyle({ bgOpacity: parseInt(e.target.value) })}
                className="flex-1"
              />
              <span className="text-xs w-12 text-right">{zoneStyle.bgOpacity ?? 100}%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
