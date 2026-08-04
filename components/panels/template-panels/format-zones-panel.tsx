"use client"

import { sanitizeHTML } from "@/lib/utils/sanitize"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { LayoutGrid, Type, Hash, BarChart3, Image, Sparkles, ExternalLink, FileEdit, Columns, Rows, Maximize, Minimize, X, Info, PaintBucket, Upload, Link } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { ChartConfigService } from "@/lib/services/chart-config-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TiptapEditor } from "@/components/tiptap-editor"
import { unwrapProxiedImageUrl } from "@/lib/utils/image-proxy-utils"

const ZONE_TYPE_META: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  text:       { icon: <Type className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Text' },
  stat:       { icon: <Hash className="h-3.5 w-3.5" />, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Stat' },
  chart:      { icon: <BarChart3 className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Chart' },
  background: { icon: <Image className="h-3.5 w-3.5" />, color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Background' },
  image:      { icon: <Image className="h-3.5 w-3.5" />, color: 'bg-cyan-100 text-cyan-700 border-cyan-200', label: 'Image' },
  decoration: { icon: <Sparkles className="h-3.5 w-3.5" />, color: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Decoration' },
}

export function FormatZonesPanel() {
  const {
    selectedFormatId,
    contentPackage,
    setContentPackage,
    formats,
    userFormats,
    selectedFormatSnapshot,
    selectedZoneId,
    setSelectedZoneId,
    loadFormats,
    isLoadingFormats,
    updateZoneStyle,
  } = useFormatGalleryStore()
  const chartStore = useChartStore()

  // Ensure formats (including user created custom formats) are loaded
  useEffect(() => {
    loadFormats()
  }, [loadFormats, selectedFormatId])

  // Rich editor state for format text zones
  const [richEditorOpen, setRichEditorOpen] = useState(false)
  const [richEditorContent, setRichEditorContent] = useState('')
  const [richEditorZoneRole, setRichEditorZoneRole] = useState<string | null>(null)
  const [richEditorZone, setRichEditorZone] = useState<any>(null)
  const [richEditorLayout, setRichEditorLayout] = useState<'side-by-side' | 'stacked'>('side-by-side')
  const [editorFitToView, setEditorFitToView] = useState(true)
  const [editorBg, setEditorBg] = useState<'white' | 'black'>('white')
  const [previewFitToView, setPreviewFitToView] = useState(true)
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

  // Look up selected format in snapshot, official formats, or user-created custom formats
  const format = selectedFormatId
    ? (selectedFormatSnapshot || [...formats, ...(userFormats || [])].find(f => f.id === selectedFormatId))
    : null

  if (!format) {
    if (isLoadingFormats) {
      return (
        <div className="p-6 text-center text-gray-500 text-sm space-y-2">
          <div className="h-5 w-5 rounded-full border-2 border-orange-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Loading format...</p>
        </div>
      )
    }

    return (
      <div className="p-4 text-center text-gray-500 text-sm space-y-2">
        <p>Format not found.</p>
        <button
          onClick={() => loadFormats(true)}
          className="text-xs text-orange-400 hover:underline block mx-auto font-medium"
        >
          Refresh templates &amp; formats
        </button>
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

  const getTextZoneValue = (zone: any) => {
    if (!contentPackage) return zone.content || ''
    if (zone.id && (contentPackage as any)[zone.id] !== undefined) {
      return String((contentPackage as any)[zone.id])
    }
    if (zone.role && (contentPackage as any)[zone.role] !== undefined) {
      return String((contentPackage as any)[zone.role])
    }
    return zone.content || ''
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
                        value={getTextZoneValue(zone)}
                        onChange={(e) => handleContentPackageChange(zone.id || zone.role, e.target.value)}
                        placeholder={`Enter ${zone.role || 'text'}...`}
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
                            setRichEditorZoneRole(zone.role || 'Text')
                            setRichEditorZone(zone)
                            setRichEditorContent(getTextZoneValue(zone))
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

                  {type === 'background' && (
                    <BackgroundZoneEditor
                      zone={zone}
                      onUpdateStyle={(updates) => updateZoneStyle(zone.id, updates)}
                    />
                  )}

                  {type === 'image' && (
                    <ImageZoneEditor
                      zone={zone}
                      onUpdateStyle={(updates) => updateZoneStyle(zone.id, updates)}
                    />
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
                      if (contentPackage) {
                        const key = richEditorZone?.id || richEditorZoneRole || 'body'
                        handleContentPackageChange(key, richEditorContent)
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

function BackgroundZoneEditor({
  zone,
  onUpdateStyle,
}: {
  zone: any
  onUpdateStyle: (updates: Record<string, any>) => void
}) {
  const style = zone.style || {}
  const rawUrl = style.imageUrl || style.bgImageUrl || zone.imageUrl || zone.url || ''
  const displayUrl = unwrapProxiedImageUrl(rawUrl)

  const currentMode = rawUrl || style.type === 'image'
    ? 'image'
    : style.gradientColor1 || style.type === 'gradient'
    ? 'gradient'
    : style.color === 'transparent'
    ? 'transparent'
    : 'color'

  const [activeTab, setActiveTab] = useState<'color' | 'gradient' | 'image' | 'transparent'>(currentMode)

  const updateImageUrl = (newUrl: string) => {
    zone.imageUrl = newUrl
    if (zone.style) {
      zone.style.imageUrl = newUrl
      zone.style.bgImageUrl = newUrl
    }
    onUpdateStyle({ type: 'image', imageUrl: newUrl, bgImageUrl: newUrl, bgType: 'image' })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        updateImageUrl(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mt-2 space-y-3 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
      {/* Fill Type Tabs */}
      <div>
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
          Background Type
        </Label>
        <div className="grid grid-cols-4 gap-1 p-0.5 bg-gray-100 rounded-md">
          {[
            { id: 'color', label: 'Color' },
            { id: 'gradient', label: 'Gradient' },
            { id: 'image', label: 'Image' },
            { id: 'transparent', label: 'None' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any)
                if (tab.id === 'transparent') {
                  onUpdateStyle({ color: 'transparent', imageUrl: '', bgImageUrl: '', type: 'solid' })
                }
              }}
              className={`py-1 text-[10px] font-medium rounded transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-gray-800 shadow-sm font-semibold'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Solid Color Controls */}
      {activeTab === 'color' && (
        <div className="space-y-2">
          <Label className="text-[10px] text-gray-500">Solid Color</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={style.color && style.color !== 'transparent' ? style.color : '#ffffff'}
              onChange={(e) => onUpdateStyle({ color: e.target.value, type: 'solid', imageUrl: '' })}
              className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0 bg-transparent shrink-0"
            />
            <Input
              value={style.color || ''}
              onChange={(e) => onUpdateStyle({ color: e.target.value, type: 'solid' })}
              placeholder="#ffffff"
              className="h-8 text-xs font-mono bg-white"
            />
          </div>
          {/* Preset Palette */}
          <div className="flex flex-wrap gap-1 pt-1">
            {['#ffffff', '#0f172a', '#1e293b', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onUpdateStyle({ color: c, type: 'solid', imageUrl: '' })}
                className="w-5 h-5 rounded-full border border-gray-300 shadow-xs hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gradient Controls */}
      {activeTab === 'gradient' && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[10px] text-gray-500 mb-1 block">Start Color</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={style.gradientColor1 || '#3b82f6'}
                  onChange={(e) => onUpdateStyle({ type: 'gradient', gradientColor1: e.target.value })}
                  className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0 bg-transparent shrink-0"
                />
                <Input
                  value={style.gradientColor1 || '#3b82f6'}
                  onChange={(e) => onUpdateStyle({ type: 'gradient', gradientColor1: e.target.value })}
                  className="h-7 text-[11px] font-mono"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500 mb-1 block">End Color</Label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={style.gradientColor2 || '#1e3a8a'}
                  onChange={(e) => onUpdateStyle({ type: 'gradient', gradientColor2: e.target.value })}
                  className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0 bg-transparent shrink-0"
                />
                <Input
                  value={style.gradientColor2 || '#1e3a8a'}
                  onChange={(e) => onUpdateStyle({ type: 'gradient', gradientColor2: e.target.value })}
                  className="h-7 text-[11px] font-mono"
                />
              </div>
            </div>
          </div>
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 block">Direction</Label>
            <select
              value={style.gradientDirection || '135deg'}
              onChange={(e) => onUpdateStyle({ type: 'gradient', gradientDirection: e.target.value })}
              className="w-full h-7 text-[11px] bg-white border border-gray-200 rounded px-2 text-gray-700 font-medium"
            >
              <option value="135deg">Diagonal (135°)</option>
              <option value="90deg">Top to Bottom (90°)</option>
              <option value="0deg">Left to Right (0°)</option>
              <option value="180deg">Bottom to Top (180°)</option>
              <option value="270deg">Right to Left (270°)</option>
              <option value="45deg">Reverse Diagonal (45°)</option>
            </select>
          </div>
        </div>
      )}

      {/* Image Controls */}
      {activeTab === 'image' && (
        <div className="space-y-3">
          {/* Image Link Input */}
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
              <Link className="w-3 h-3 text-blue-500" />
              <span>Image URL Link</span>
            </Label>
            <Input
              value={displayUrl}
              onChange={(e) => updateImageUrl(e.target.value)}
              placeholder="Paste image link https://..."
              className="h-8 text-xs bg-white"
            />
          </div>

          {/* Upload Image Button */}
          <div>
            <Label className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
              <Upload className="w-3 h-3 text-blue-500" />
              <span>Or Upload Local Image</span>
            </Label>
            <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-gray-300 rounded-lg hover:bg-blue-50/50 hover:border-blue-300 cursor-pointer transition-all text-xs text-gray-600">
              <Upload className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Choose Image File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Current Thumbnail Preview */}
          {displayUrl && (
            <div className="space-y-1">
              <Label className="text-[10px] text-gray-500">Preview</Label>
              <div
                className="h-20 rounded-md border border-gray-200 bg-cover bg-center relative overflow-hidden shadow-inner"
                style={{
                  backgroundImage: `url(${displayUrl})`,
                  opacity: style.imageOpacity !== undefined ? style.imageOpacity / 100 : 1,
                  filter: style.imageBlur ? `blur(${style.imageBlur}px)` : 'none',
                }}
              />
            </div>
          )}

          {/* Image Fit & Controls */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-[10px] text-gray-500 mb-1 block">Fit Mode</Label>
              <select
                value={style.imageFit || 'cover'}
                onChange={(e) => onUpdateStyle({ imageFit: e.target.value })}
                className="w-full h-7 text-[11px] bg-white border border-gray-200 rounded px-1 text-gray-700 font-medium"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
            <div>
              <Label className="text-[10px] text-gray-500 mb-1 block">
                Opacity ({style.imageOpacity !== undefined ? style.imageOpacity : (style.opacity !== undefined ? (style.opacity <= 1 ? Math.round(style.opacity * 100) : style.opacity) : 100)}%)
              </Label>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={style.imageOpacity !== undefined ? style.imageOpacity : (style.opacity !== undefined ? (style.opacity <= 1 ? Math.round(style.opacity * 100) : style.opacity) : 100)}
                onInput={(e: any) => {
                  const val = parseInt(e.target.value, 10)
                  onUpdateStyle({ imageOpacity: val, opacity: val / 100 })
                }}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  onUpdateStyle({ imageOpacity: val, opacity: val / 100 })
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
              />
            </div>
            <div>
              <Label className="text-[10px] text-gray-500 mb-1 block">
                Blur ({style.imageBlur !== undefined ? style.imageBlur : (style.blur || 0)}px)
              </Label>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={style.imageBlur !== undefined ? style.imageBlur : (style.blur || 0)}
                onInput={(e: any) => {
                  const val = parseInt(e.target.value, 10)
                  onUpdateStyle({ imageBlur: val, blur: val })
                }}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10)
                  onUpdateStyle({ imageBlur: val, blur: val })
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'transparent' && (
        <p className="text-[11px] text-gray-400 italic">
          Transparent background enabled.
        </p>
      )}
    </div>
  )
}

function ImageZoneEditor({
  zone,
  onUpdateStyle,
}: {
  zone: any
  onUpdateStyle: (updates: Record<string, any>) => void
}) {
  const style = zone.style || {}
  const rawUrl = style.imageUrl || style.bgImageUrl || zone.imageUrl || zone.url || ''
  const displayUrl = unwrapProxiedImageUrl(rawUrl)

  const updateImageUrl = (newUrl: string) => {
    zone.imageUrl = newUrl
    if (zone.style) {
      zone.style.imageUrl = newUrl
      zone.style.bgImageUrl = newUrl
    }
    onUpdateStyle({ type: 'image', imageUrl: newUrl, bgImageUrl: newUrl })
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        updateImageUrl(dataUrl)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="mt-2 space-y-3 pt-2 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
      {/* Image Link Input */}
      <div>
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Link className="w-3 h-3 text-blue-500" />
          <span>Image Link / URL</span>
        </Label>
        <Input
          value={displayUrl}
          onChange={(e) => updateImageUrl(e.target.value)}
          placeholder="Paste image link https://..."
          className="h-8 text-xs bg-white font-sans text-gray-800"
        />
      </div>

      {/* Upload Image File */}
      <div>
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1">
          <Upload className="w-3 h-3 text-blue-500" />
          <span>Upload Image</span>
        </Label>
        <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-gray-300 rounded-lg hover:bg-blue-50/50 hover:border-blue-400 cursor-pointer transition-all text-xs text-gray-700 bg-gray-50/50">
          <Upload className="w-4 h-4 text-blue-500" />
          <span className="font-medium">Choose file or drop image here</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Thumbnail Preview */}
      {displayUrl && (
        <div className="space-y-1">
          <Label className="text-[10px] text-gray-400">Selected Image Preview</Label>
          <div
            className="h-24 rounded-lg border border-gray-200 bg-cover bg-center relative overflow-hidden shadow-sm"
            style={{
              backgroundImage: `url(${displayUrl})`,
              opacity: style.imageOpacity !== undefined ? style.imageOpacity / 100 : (style.opacity !== undefined ? (style.opacity <= 1 ? style.opacity : style.opacity / 100) : 1),
              filter: (style.imageBlur || style.blur) ? `blur(${style.imageBlur || style.blur}px)` : 'none',
            }}
          />
        </div>
      )}

      {/* Image Fit & Effects */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">Fit Mode</Label>
          <select
            value={style.imageFit || 'cover'}
            onChange={(e) => onUpdateStyle({ imageFit: e.target.value })}
            className="w-full h-7 text-[11px] bg-white border border-gray-200 rounded px-1.5 text-gray-700 font-medium"
          >
            <option value="cover">Cover</option>
            <option value="contain">Contain</option>
            <option value="fill">Fill</option>
          </select>
        </div>
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">
            Opacity ({style.imageOpacity !== undefined ? style.imageOpacity : (style.opacity !== undefined ? (style.opacity <= 1 ? Math.round(style.opacity * 100) : style.opacity) : 100)}%)
          </Label>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={style.imageOpacity !== undefined ? style.imageOpacity : (style.opacity !== undefined ? (style.opacity <= 1 ? Math.round(style.opacity * 100) : style.opacity) : 100)}
            onInput={(e: any) => {
              const val = parseInt(e.target.value, 10)
              onUpdateStyle({ imageOpacity: val, opacity: val / 100 })
            }}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              onUpdateStyle({ imageOpacity: val, opacity: val / 100 })
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
          />
        </div>
        <div>
          <Label className="text-[10px] text-gray-500 mb-1 block">
            Blur ({style.imageBlur !== undefined ? style.imageBlur : (style.blur || 0)}px)
          </Label>
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={style.imageBlur !== undefined ? style.imageBlur : (style.blur || 0)}
            onInput={(e: any) => {
              const val = parseInt(e.target.value, 10)
              onUpdateStyle({ imageBlur: val, blur: val })
            }}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10)
              onUpdateStyle({ imageBlur: val, blur: val })
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mt-2"
          />
        </div>
      </div>
    </div>
  )
}

