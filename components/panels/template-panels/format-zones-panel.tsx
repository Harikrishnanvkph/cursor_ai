"use client"

import { sanitizeHTML } from "@/lib/utils/sanitize"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { LayoutGrid, Type, Hash, BarChart3, Image, Sparkles, ExternalLink, FileEdit, Columns, Rows, Maximize, Minimize, X, Info, PaintBucket } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { ChartConfigService } from "@/lib/services/chart-config-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TiptapEditor } from "@/components/tiptap-editor"

const ZONE_TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  text:       { icon: <Type className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Text' },
  stat:       { icon: <Hash className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Stat' },
  chart:      { icon: <BarChart3 className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Chart' },
  background: { icon: <Image className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Background' },
  decoration: { icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Decoration' },
}

export function FormatZonesPanel() {
  const { selectedFormatId, contentPackage, setContentPackage, formats, selectedZoneId, setSelectedZoneId } = useFormatGalleryStore()
  const chartStore = useChartStore()

  // Rich editor state for format text zones
  const [richEditorOpen, setRichEditorOpen] = useState(false)
  const [richEditorContent, setRichEditorContent] = useState('')
  const [richEditorZoneRole, setRichEditorZoneRole] = useState<string | null>(null)
  const [richEditorZone, setRichEditorZone] = useState<any>(null)
  const [richEditorLayout, setRichEditorLayout] = useState<'side-by-side' | 'stacked'>('side-by-side')
  const [editorFitToView, setEditorFitToView] = useState(false)
  const [editorBg, setEditorBg] = useState<'white' | 'black'>('white')
  const [previewFitToView, setPreviewFitToView] = useState(false)
  const richPreviewContainerRef = useRef<HTMLDivElement>(null)
  const [richPreviewScale, setRichPreviewScale] = useState(1)

  const computeRichScale = useCallback(() => {
    if (!previewFitToView || !richPreviewContainerRef.current || !richEditorZoneRole) {
      setRichPreviewScale(1)
      return
    }
    const container = richPreviewContainerRef.current
    const containerWidth = container.clientWidth - 16
    const containerHeight = container.clientHeight - 16
    // Use actual zone dimensions if available
    const zoneW = richEditorZone?.position?.width || 600
    const zoneH = richEditorZone?.position?.height || 200
    if (containerWidth > 0 && containerHeight > 0) {
      const scaleX = containerWidth / zoneW
      const scaleY = containerHeight / zoneH
      setRichPreviewScale(Math.min(scaleX, scaleY, 1))
    }
  }, [previewFitToView, richEditorZoneRole, richEditorZone])

  useEffect(() => {
    const id = requestAnimationFrame(() => computeRichScale())
    window.addEventListener('resize', computeRichScale)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', computeRichScale)
    }
  }, [computeRichScale, richEditorOpen, richEditorLayout, previewFitToView])

  if (!selectedFormatId) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No format selected.</p>
        <p className="text-xs mt-1 text-gray-400">Select a format from the Templates tab.</p>
      </div>
    )
  }

  const format = formats.find(f => f.id === selectedFormatId)
  if (!format) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>Format not found.</p>
      </div>
    )
  }

  const skeleton = format.skeleton as any
  const zones = skeleton?.zones || []

  if (zones.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>This format has no editable zones.</p>
      </div>
    )
  }

  // Group zones by type (ignoring chart zone as it is edited from the Chart Zone panel)
  const groupedZones: Record<string, any[]> = {}
  zones.forEach((zone: any) => {
    const type = zone.type || 'unknown'
    if (type === 'chart') return
    if (!groupedZones[type]) groupedZones[type] = []
    groupedZones[type].push(zone)
  })

  const handleContentPackageChange = (key: string, value: any) => {
    if (!contentPackage) return
    setContentPackage({
      ...contentPackage,
      [key]: value,
    })
  }

  const getStatIndex = (role: string) => {
    switch(role) {
      case 'highlight': return 0;
      case 'secondary': return 1;
      case 'tertiary': return 2;
      default: return 0;
    }
  }

  const getStatValue = (role: string, field: 'value' | 'label') => {
    if (!contentPackage?.stats) return ''
    const idx = getStatIndex(role)
    return contentPackage.stats[idx]?.[field] || ''
  }

  const handleStatChange = (role: string, field: 'value' | 'label', val: string) => {
    if (!contentPackage) return
    const stats = [...(contentPackage.stats || [])]
    const idx = getStatIndex(role)
    // Fill empty stats if necessary
    while (stats.length <= idx) {
      stats.push({ value: '', label: '' })
    }
    stats[idx] = { ...stats[idx], [field]: val }
    setContentPackage({ ...contentPackage, stats })
  }

  return (
    <>
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-blue-600" />
        Format Zones ({zones.length})
      </h3>

      {/* Format Info */}
      <div className="bg-gray-50 rounded-lg p-2.5 text-xs border border-gray-100">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-700">{format.name}</span>
          <span className="text-gray-400">{format.dimensions.width}×{format.dimensions.height}</span>
        </div>
        <p className="text-gray-500 text-[10px] leading-relaxed">{format.description || 'No description'}</p>
      </div>

      {/* Zone Groups */}
      {Object.entries(groupedZones).map(([type, typeZones]) => {
        const meta = ZONE_TYPE_META[type] || { icon: null, color: 'bg-gray-100 text-gray-700', label: type }
        return (
          <div key={type} className="space-y-2">
            <div className="flex items-center gap-2 mt-4 mb-2">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.color}`}>
                {meta.icon}
                {meta.label}
              </span>
              <span className="text-[10px] text-gray-400">({typeZones.length})</span>
            </div>

            {typeZones.map((zone: any, idx: number) => {
              const zoneLabel = zone.role || zone.id || `${meta.label} ${idx + 1}`
              
              return (
                <div
                  key={zone.id || `${type}-${idx}`}
                  className={`border rounded-lg p-2.5 bg-white text-xs space-y-2 shadow-sm cursor-pointer transition-all ${
                    selectedZoneId === zone.id
                      ? 'border-blue-400 ring-2 ring-blue-200 bg-blue-50/30'
                      : 'border-gray-200 hover:border-blue-200 hover:shadow-md'
                  }`}
                  onClick={() => zone.id && setSelectedZoneId(zone.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-gray-700 uppercase tracking-wider text-[10px]">
                      {zoneLabel}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {Math.round(zone.position?.width || 0)} × {Math.round(zone.position?.height || 0)}
                    </span>
                  </div>

                  {/* Editable fields based on zone type */}
                  {type === 'text' && (
                    <div>
                      <textarea
                        value={(contentPackage as any)?.[zone.role] || ''}
                        onChange={(e) => handleContentPackageChange(zone.role, e.target.value)}
                        placeholder={`Enter ${zone.role}...`}
                        className="w-full min-h-[40px] text-xs border border-gray-200 rounded p-2 resize-y bg-white text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:text-gray-300"
                        rows={zone.role === 'body' ? 3 : 1}
                      />
                      {/* Rich Editor button for text zones */}
                      <div className="flex justify-end mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] gap-1"
                          onClick={(e) => {
                            e.stopPropagation()
                            setRichEditorZoneRole(zone.role)
                            setRichEditorZone(zone)
                            setRichEditorContent((contentPackage as any)?.[zone.role] || '')
                            setRichEditorOpen(true)
                          }}
                        >
                          <FileEdit className="h-3 w-3" />
                          Rich Editor
                        </Button>
                      </div>
                    </div>
                  )}

                  {type === 'stat' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[10px] text-gray-400 mb-0.5">Metric / Value</Label>
                        <Input
                          value={getStatValue(zone.role, 'value')}
                          onChange={(e) => handleStatChange(zone.role, 'value', e.target.value)}
                          placeholder="e.g. 50%"
                          className="h-8 text-xs bg-white border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-[10px] text-gray-400 mb-0.5">Description / Label</Label>
                        <Input
                          value={getStatValue(zone.role, 'label')}
                          onChange={(e) => handleStatChange(zone.role, 'label', e.target.value)}
                          placeholder="e.g. Growth Rate"
                          className="h-8 text-xs bg-white border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {type === 'background' && zone.style?.imageUrl && (
                    <div className="mt-2">
                      <Label className="text-[10px] text-gray-400 mb-1">Background Image</Label>
                      <div
                        className="h-16 rounded border border-gray-200 bg-cover bg-center overflow-hidden"
                        style={{ backgroundImage: `url(${zone.style.imageUrl})` }}
                      />
                    </div>
                  )}
                  

                  
                  {type === 'decoration' && (
                     <div className="flex items-center gap-2 p-2 bg-blue-50/50 rounded text-blue-700/80 border border-blue-100">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-[11px]">Static decoration graphic</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>

      {/* Rich Text Editor Dialog for Format Text Zones */}
      <Dialog open={richEditorOpen} onOpenChange={(open) => {
        if (!open) {
          // Reset on close without save
          setRichEditorContent('')
          setRichEditorZoneRole(null)
          setRichEditorZone(null)
        }
        setRichEditorOpen(open)
      }}>
        <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0" hideCloseButton>
          <DialogTitle className="sr-only">Rich Text Editor</DialogTitle>
          {/* Main body */}
          <div className={`flex ${richEditorLayout === 'side-by-side' ? 'flex-row' : 'flex-col'} gap-0 flex-1 overflow-hidden min-h-0`}>
            {/* Editor Section */}
            <div className={`flex flex-col overflow-hidden ${richEditorLayout === 'side-by-side' ? 'flex-1 border-r' : 'flex-1 border-b'} min-w-0`}>
              {/* Action bar: title + layout toggle + Save/Cancel */}
              <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600 mr-1">Rich Editor — {richEditorZoneRole || 'Text'}</span>
                  <div className="flex items-center border rounded-md overflow-hidden bg-white">
                    <button
                      type="button"
                      className={`p-1.5 transition-colors ${richEditorLayout === 'side-by-side' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                      onClick={() => setRichEditorLayout('side-by-side')}
                      title="Side by Side"
                    >
                      <Columns className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className={`p-1.5 transition-colors border-l ${richEditorLayout === 'stacked' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                      onClick={() => setRichEditorLayout('stacked')}
                      title="Stacked"
                    >
                      <Rows className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-[10px] text-gray-400">Layout</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={editorFitToView ? "default" : "outline"}
                    size="sm"
                    className={`h-7 text-xs gap-1.5 ${editorFitToView ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    onClick={() => setEditorFitToView(!editorFitToView)}
                  >
                    {editorFitToView ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                    Fit to View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1.5 ml-2"
                    onClick={() => setEditorBg(prev => prev === 'white' ? 'black' : 'white')}
                    title="Toggle background color"
                  >
                    <PaintBucket className="h-3 w-3" />
                    Background
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs ml-2"
                    onClick={() => {
                      setRichEditorOpen(false)
                      setRichEditorZoneRole(null)
                      setRichEditorZone(null)
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      if (richEditorZoneRole && contentPackage) {
                        handleContentPackageChange(richEditorZoneRole, richEditorContent)
                      }
                      setRichEditorOpen(false)
                      setRichEditorZoneRole(null)
                      setRichEditorZone(null)
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {/* Style coordination info */}
              {richEditorZone?.style && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border-b border-blue-100 shrink-0">
                  <Info className="h-3 w-3 text-blue-500 shrink-0" />
                  <span className="text-[10px] text-blue-600">
                    Zone defaults: {richEditorZone.style.fontSize}px {richEditorZone.style.fontFamily?.split(',')[0]}. Inline formatting in the editor will override zone-level defaults.
                  </span>
                </div>
              )}

              {/* Editor */}
              <div className={`flex-1 overflow-auto ${editorFitToView ? 'bg-gray-100' : ''}`}>
                <TiptapEditor
                  initialHtml={richEditorContent}
                  onChange={(html) => setRichEditorContent(html)}
                  className={`h-full ${editorFitToView ? 'border-0' : ''}`}
                  contentStyle={richEditorZone?.style ? {
                    fontSize: richEditorZone.style.fontSize,
                    fontFamily: richEditorZone.style.fontFamily,
                    color: richEditorZone.style.color,
                    lineHeight: richEditorZone.style.lineHeight,
                    letterSpacing: richEditorZone.style.letterSpacing
                  } : undefined}
                  fitToView={editorFitToView}
                  editorBg={editorBg}
                  zoneDimensions={richEditorZone?.position ? {
                    width: richEditorZone.position.width,
                    height: richEditorZone.position.height
                  } : undefined}
                />
              </div>
            </div>

            {/* Preview Section */}
            <div className={`flex flex-col overflow-hidden min-w-0 ${richEditorLayout === 'side-by-side' ? 'flex-1' : 'flex-1'}`}>
              <div className="flex items-center justify-between px-2 py-1 bg-gray-50 border-b shrink-0">
                <span className="text-xs font-medium text-gray-600">Live Preview</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors border ${
                      previewFitToView
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => {
                      setPreviewFitToView(!previewFitToView)
                    }}
                    title={previewFitToView ? 'Show actual size' : 'Fit to container'}
                  >
                    {previewFitToView ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                    {previewFitToView ? 'Actual Size' : 'Fit to View'}
                  </button>
                  <button
                    type="button"
                    className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
                    onClick={() => {
                      setRichEditorOpen(false)
                      setRichEditorZoneRole(null)
                      setRichEditorZone(null)
                    }}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div
                ref={richPreviewContainerRef}
                className={`flex-1 ${previewFitToView ? 'overflow-hidden' : 'overflow-auto'} bg-gray-50 p-2 min-w-0`}
              >
                {(() => {
                  const zoneW = richEditorZone?.position?.width || 600
                  const zoneH = richEditorZone?.position?.height || 200
                  const zStyle = richEditorZone?.style || {}
                  const previewStyle: React.CSSProperties = {
                    fontSize: zStyle.fontSize ? `${zStyle.fontSize}px` : '14px',
                    fontFamily: zStyle.fontFamily || 'inherit',
                    fontWeight: zStyle.fontWeight || 'normal',
                    color: zStyle.color || '#1a1a2e',
                    textAlign: (zStyle.textAlign as any) || 'left',
                    lineHeight: zStyle.lineHeight || 1.6,
                    letterSpacing: zStyle.letterSpacing ? `${zStyle.letterSpacing}px` : 'normal',
                    padding: '8px',
                    wordBreak: 'break-word' as const,
                  }

                  if (previewFitToView) {
                    return (
                      <div style={{
                        width: `${zoneW * richPreviewScale}px`,
                        height: `${zoneH * richPreviewScale}px`,
                        flexShrink: 0,
                        margin: '0 auto'
                      }}>
                        <div
                          className="bg-white border rounded shadow-sm html-content-area"
                          style={{
                            width: `${zoneW}px`,
                            height: `${zoneH}px`,
                            ...previewStyle,
                            overflow: 'hidden',
                            transform: `scale(${richPreviewScale})`,
                            transformOrigin: 'top left'
                          }}
                          dangerouslySetInnerHTML={{ __html: sanitizeHTML(richEditorContent || '<p style="color:#999">Preview will appear here...</p>') }}
                        />
                      </div>
                    )
                  }

                  return (
                    <div
                      className="bg-white border rounded shadow-sm html-content-area"
                      style={{
                        width: `${zoneW}px`,
                        height: `${zoneH}px`,
                        ...previewStyle,
                        overflow: 'auto',
                        flexShrink: 0,
                        margin: '0 auto'
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(richEditorContent || '<p style="color:#999">Preview will appear here...</p>') }}
                    />
                  )
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
