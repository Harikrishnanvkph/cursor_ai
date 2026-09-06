"use client"

import { sanitizeHTML } from "@/lib/utils/sanitize"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { LayoutGrid, Type, Hash, BarChart3, Image, Sparkles, ExternalLink, FileEdit, Columns, Rows, Maximize, Minimize, X, Info, PaintBucket, Upload, Link, Eye, EyeOff, Trash2, Plus, Pencil, ArrowRight, Layers, Pipette, Ban } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { ChartConfigService } from "@/lib/services/chart-config-service"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
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

const ZONE_COLORS: Record<string, { bg: string; border: string }> = {
  chart:      { bg: 'rgba(59, 130, 246, 0.3)',  border: 'rgba(59, 130, 246, 0.6)' },
  text:       { bg: 'rgba(16, 185, 129, 0.2)',  border: 'rgba(16, 185, 129, 0.6)' },
  stat:       { bg: 'rgba(245, 158, 11, 0.3)',  border: 'rgba(245, 158, 11, 0.6)' },
  background: { bg: 'rgba(139, 92, 246, 0.15)', border: 'rgba(139, 92, 246, 0.5)' },
  image:      { bg: 'rgba(6, 182, 212, 0.25)',   border: 'rgba(6, 182, 212, 0.6)' },
  decoration: { bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.5)' },
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
    isResizeMode,
    setResizeMode,
    resetFormatPositions,
    toggleZoneVisibility,
    deleteZone,
    addZone,
  } = useFormatGalleryStore()
  const chartStore = useChartStore()

  // Ensure formats (including user created custom formats) are loaded
  useEffect(() => {
    loadFormats()
  }, [loadFormats, selectedFormatId])

  // Sub-tabs: 1 - My Template, 2 - Edit Content
  const [subTab, setSubTab] = useState<'template' | 'content'>('template')

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
      <Tabs value={subTab} onValueChange={(val) => setSubTab(val as 'template' | 'content')} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 bg-gray-100 rounded-lg mb-3">
          <TabsTrigger
            value="template"
            className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            My Template
          </TabsTrigger>
          <TabsTrigger
            value="content"
            className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 font-medium"
          >
            Edit Content
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: My Template */}
        <TabsContent value="template" className="mt-0 space-y-4">
          {/* Template Dimensions Only */}
          <div className="flex items-center justify-between px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs shadow-2xs">
            <span className="text-gray-500 font-medium">Template Dimensions</span>
            <span className="font-semibold text-gray-700 tabular-nums bg-gray-50 px-2 py-0.5 rounded border border-gray-200/60 text-[11px]">
              {format.dimensions?.width || 1200} × {format.dimensions?.height || 800} px
            </span>
          </div>

          {/* Minimized Clean Resize Control */}
          <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
            isResizeMode
              ? 'bg-blue-50/70 border-blue-200'
              : 'bg-white border-gray-200 shadow-2xs'
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <Maximize className={`h-3.5 w-3.5 flex-shrink-0 ${isResizeMode ? 'text-blue-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium text-gray-700">Resize &amp; Move</span>
              {isResizeMode && (
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/80 px-1.5 py-0.2 rounded">
                  Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isResizeMode && (
                <button
                  type="button"
                  onClick={() => resetFormatPositions()}
                  className="text-[11px] font-medium text-gray-500 hover:text-red-600 transition-colors mr-1"
                  title="Reset layout to default zone positions"
                >
                  Reset
                </button>
              )}
              <Switch
                checked={isResizeMode}
                onCheckedChange={setResizeMode}
                className="scale-90"
                aria-label="Toggle zone resize mode"
              />
            </div>
          </div>

          {/* Layout Blueprint / Visual Preview */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-blue-600" />
                Layout Blueprint
              </Label>
              <span className="text-[10px] text-gray-400">
                {zones.length} {zones.length === 1 ? 'zone' : 'zones'}
              </span>
            </div>

            <div
              className="relative w-full rounded-md border border-gray-200 bg-gray-50 overflow-hidden shadow-inner"
              style={{
                aspectRatio: `${format.dimensions?.width || 1200} / ${format.dimensions?.height || 800}`,
                maxHeight: '220px',
              }}
            >
              {zones.map((zone: any, idx: number) => {
                const totalW = format.dimensions?.width || 1200
                const totalH = format.dimensions?.height || 800
                const pos = zone.position || (zone.type === 'background'
                  ? { x: 0, y: 0, width: totalW, height: totalH }
                  : { x: 0, y: 0, width: totalW, height: totalH })
                const zWidth = pos.width !== undefined && pos.width !== null ? pos.width : totalW
                const zHeight = pos.height !== undefined && pos.height !== null ? pos.height : totalH
                const zX = pos.x !== undefined && pos.x !== null ? pos.x : 0
                const zY = pos.y !== undefined && pos.y !== null ? pos.y : 0
                const zWidthPct = Math.min(100, Math.max(0, (zWidth / totalW) * 100))
                const zHeightPct = Math.min(100, Math.max(0, (zHeight / totalH) * 100))
                const zLeftPct = Math.min(100, Math.max(0, (zX / totalW) * 100))
                const zTopPct = Math.min(100, Math.max(0, (zY / totalH) * 100))
                const colors = ZONE_COLORS[zone.type] || { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.6)' }
                const isSelected = selectedZoneId === zone.id
                const isVisible = zone.visible !== false

                return (
                  <div
                    key={zone.id || idx}
                    onClick={() => {
                      if (zone.id) setSelectedZoneId(zone.id)
                    }}
                    className={`absolute rounded text-[9px] font-semibold flex items-center justify-center p-0.5 transition-all cursor-pointer select-none overflow-hidden ${
                      isSelected ? 'ring-2 ring-blue-500 z-20 shadow-md font-bold' : 'hover:opacity-90 z-10'
                    } ${!isVisible ? 'opacity-35' : ''}`}
                    style={{
                      left: `${zLeftPct}%`,
                      top: `${zTopPct}%`,
                      width: `${zWidthPct}%`,
                      height: `${zHeightPct}%`,
                      backgroundColor: colors.bg,
                      border: `1px ${!isVisible ? 'dashed' : 'solid'} ${isSelected ? '#2563eb' : colors.border}`,
                    }}
                    title={`${zone.role || zone.id || zone.type} ${!isVisible ? '(Hidden)' : ''} (${Math.round(zWidth)} × ${Math.round(zHeight)})`}
                  >
                    <span className="truncate text-gray-800 text-[8px] sm:text-[9px] bg-white/80 px-1 py-0.5 rounded shadow-xs">
                      {zone.role || zone.type}
                    </span>
                  </div>
                )
              })}
            </div>
            <p className="text-[10px] text-gray-400 text-center">
              Click any zone in the blueprint to inspect.
            </p>
          </div>

          {/* Zone Elements Breakdown */}
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-blue-600" />
                Template Zones &amp; Layers
              </Label>
              <span className="text-[10px] text-gray-400">Total: {zones.length}</span>
            </div>

            <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-0.5">
              {zones.map((zone: any, idx: number) => {
                const meta = ZONE_TYPE_META[zone.type] || { icon: null, color: 'bg-gray-100 text-gray-700', label: zone.type }
                const isSelected = selectedZoneId === zone.id
                const isEditable = zone.type !== 'chart'
                const isVisible = zone.visible !== false
                const isChart = zone.type === 'chart'

                return (
                  <div
                    key={zone.id || idx}
                    onClick={() => zone.id && setSelectedZoneId(zone.id)}
                    className={`flex items-center justify-between p-2 rounded-md border text-xs cursor-pointer transition-all ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/40 ring-1 ring-blue-300'
                        : isVisible
                          ? 'border-gray-100 hover:border-gray-300 bg-gray-50/50 hover:bg-white'
                          : 'border-gray-100 bg-gray-100/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border ${meta.color}`}>
                        {meta.icon}
                        {meta.label}
                      </span>
                      <span className="font-medium text-gray-800 truncate text-[11px]">
                        {zone.role || zone.id || `Zone ${idx + 1}`}
                      </span>
                      {!isVisible && (
                        <span className="text-[9px] font-medium text-gray-400 bg-gray-200/70 px-1 py-0.2 rounded">
                          Hidden
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Visibility Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (zone.id) toggleZoneVisibility(zone.id)
                        }}
                        className={`p-1 rounded transition-colors ${
                          isVisible
                            ? 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            : 'text-gray-500 bg-gray-200/60 hover:bg-gray-200'
                        }`}
                        title={isVisible ? 'Hide zone from canvas' : 'Show zone on canvas'}
                      >
                        {isVisible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      </button>

                      {/* Delete Zone (non-chart only) */}
                      {!isChart && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (zone.id) deleteZone(zone.id)
                          }}
                          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete zone"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}

                      <span className="text-[10px] text-gray-400 tabular-nums">
                        {Math.round(zone.position?.width ?? (zone.type === 'background' ? (format.dimensions?.width || 1200) : 0))}×{Math.round(zone.position?.height ?? (zone.type === 'background' ? (format.dimensions?.height || 800) : 0))}
                      </span>
                      {isEditable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-1.5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-100/60 gap-0.5"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (zone.id) setSelectedZoneId(zone.id)
                            setSubTab('content')
                          }}
                        >
                          Edit <ArrowRight className="h-2.5 w-2.5" />
                        </Button>
                      ) : (
                        <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Chart</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs h-7 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 text-gray-700 hover:text-blue-700 flex items-center justify-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-blue-600" />
                    Add Zone
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52 text-xs">
                  <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Text Zones
                  </div>
                  <DropdownMenuItem onClick={() => addZone('text', { role: 'title' })} className="cursor-pointer gap-2">
                    <Type className="h-3.5 w-3.5 text-blue-600" />
                    <span>Headline Title</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addZone('text', { role: 'subtitle' })} className="cursor-pointer gap-2">
                    <Type className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Subtitle / Header</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addZone('text', { role: 'body' })} className="cursor-pointer gap-2">
                    <Type className="h-3.5 w-3.5 text-gray-600" />
                    <span>Body Text / Note</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addZone('text', { role: 'source' })} className="cursor-pointer gap-2">
                    <Type className="h-3.5 w-3.5 text-gray-400" />
                    <span>Source / Footnote</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Metric & Media
                  </div>
                  <DropdownMenuItem onClick={() => addZone('stat', { role: 'secondary' })} className="cursor-pointer gap-2">
                    <Hash className="h-3.5 w-3.5 text-amber-600" />
                    <span>Stat Metric Card</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addZone('image')} className="cursor-pointer gap-2">
                    <Image className="h-3.5 w-3.5 text-cyan-600" />
                    <span>Image / Icon Slot</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addZone('decoration')} className="cursor-pointer gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                    <span>Decoration Shape</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                onClick={() => setSubTab('content')}
                size="sm"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs h-7 flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Pencil className="h-3 w-3" />
                Edit Content
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Tab 2: Edit Content */}
        <TabsContent value="content" className="mt-0 space-y-4">
          {Object.keys(groupedZones).length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-xs border rounded-lg bg-gray-50">
              <p>No editable text or media zones found in this template.</p>
              <p className="text-[10px] text-gray-400 mt-1">
                Chart content and styling are configured directly via the Chart Zone panel.
              </p>
            </div>
          ) : (
            Object.entries(groupedZones).map(([type, typeZones]) => {
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
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="font-medium text-gray-700 uppercase tracking-wider text-[10px]">
                              {zoneLabel}
                            </span>
                            {zone.visible === false && (
                              <span className="text-[9px] font-medium text-amber-700 bg-amber-50 border border-amber-200 px-1 py-0.2 rounded">
                                Hidden
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (zone.id) toggleZoneVisibility(zone.id)
                              }}
                              className={`p-0.5 rounded transition-colors ${
                                zone.visible !== false ? 'text-gray-400 hover:text-gray-700' : 'text-amber-600'
                              }`}
                              title={zone.visible === false ? 'Show zone on canvas' : 'Hide zone from canvas'}
                            >
                              {zone.visible === false ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            </button>
                            <span className="text-[10px] text-gray-400">
                              {Math.round(zone.position?.width ?? (zone.type === 'background' ? (format.dimensions?.width || 1200) : 0))} × {Math.round(zone.position?.height ?? (zone.type === 'background' ? (format.dimensions?.height || 800) : 0))}
                            </span>
                          </div>
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
                  })
                }
              </div>
            )
          }))}
        </TabsContent>
      </Tabs>
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

  const isTransparent = style.bgType === 'transparent' ||
    style.backgroundColor === 'transparent' ||
    style.bgColor === 'transparent'

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
            className="h-24 rounded-lg border border-gray-200 relative overflow-hidden shadow-xs"
            style={{
              backgroundImage: `url(${displayUrl})`,
              backgroundSize: style.imageFit === 'fill' ? '100% 100%' : (style.imageFit || 'cover'),
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: isTransparent ? 'transparent' : (style.backgroundColor || '#ffffff'),
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

      {/* Image Background Options: Transparent or Colored */}
      <div className="space-y-1.5 pt-2 border-t border-gray-100">
        <Label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
          Image Background
        </Label>

        {/* Two-option segmented toggle */}
        <div className="grid grid-cols-2 gap-1 bg-gray-100 p-0.5 rounded-md text-xs">
          <button
            type="button"
            onClick={() => {
              onUpdateStyle({
                bgType: 'transparent',
                backgroundColor: 'transparent',
                bgColor: 'transparent',
              })
            }}
            className={`py-1 text-[11px] font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
              isTransparent
                ? 'bg-white text-gray-800 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span>Transparent</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const currentColor = (style.backgroundColor && style.backgroundColor !== 'transparent')
                ? style.backgroundColor
                : '#ffffff'
              onUpdateStyle({
                bgType: 'color',
                backgroundColor: currentColor,
                bgColor: currentColor,
              })
            }}
            className={`py-1 text-[11px] font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
              !isTransparent
                ? 'bg-white text-gray-800 shadow-xs font-semibold'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span
              className="w-2.5 h-2.5 rounded-full border border-gray-300 inline-block shrink-0"
              style={{ backgroundColor: !isTransparent && style.backgroundColor ? style.backgroundColor : '#ffffff' }}
            />
            <span>Colored</span>
          </button>
        </div>

        {/* Color picker controls when Colored is selected */}
        {!isTransparent && (
          <div className="space-y-2.5 pt-1.5 bg-gray-50/70 p-2.5 rounded-lg border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-700">Choose Color</span>
              <span className="text-[10px] font-mono font-medium text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                {style.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : '#ffffff'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Interactive Color Swatch */}
              <div
                className="relative w-8 h-8 rounded-lg border border-gray-300 shadow-xs overflow-hidden cursor-pointer hover:scale-105 active:scale-95 transition-all shrink-0 ring-1 ring-black/5"
                style={{ backgroundColor: style.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : '#ffffff' }}
                title="Click to open Color Picker"
              >
                <input
                  type="color"
                  value={style.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : '#ffffff'}
                  onChange={(e) => onUpdateStyle({
                    bgType: 'color',
                    backgroundColor: e.target.value,
                    bgColor: e.target.value,
                  })}
                  className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
              </div>

              {/* Hex Input */}
              <div className="flex-1">
                <Input
                  value={style.backgroundColor && style.backgroundColor !== 'transparent' ? style.backgroundColor : '#ffffff'}
                  onChange={(e) => onUpdateStyle({
                    bgType: 'color',
                    backgroundColor: e.target.value,
                    bgColor: e.target.value,
                  })}
                  placeholder="#ffffff"
                  className="h-8 text-xs font-mono bg-white text-gray-800 uppercase"
                />
              </div>

              {/* Eyedropper tool button (if browser supports it) */}
              {typeof window !== 'undefined' && 'EyeDropper' in window && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 shrink-0 text-gray-600 hover:text-gray-900 bg-white"
                  title="Pick color from screen"
                  onClick={async () => {
                    try {
                      const eyeDropper = new (window as any).EyeDropper()
                      const result = await eyeDropper.open()
                      if (result?.sRGBHex) {
                        onUpdateStyle({
                          bgType: 'color',
                          backgroundColor: result.sRGBHex,
                          bgColor: result.sRGBHex,
                        })
                      }
                    } catch (e) {
                      // user cancelled eyedropper
                    }
                  }}
                >
                  <Pipette className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Quick Color Presets Palette */}
            <div>
              <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider block mb-1">
                Palette Presets
              </span>
              <div className="grid grid-cols-8 gap-1.5">
                {[
                  '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#64748b', '#1e293b', '#000000',
                  '#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#ec4899'
                ].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => onUpdateStyle({
                      bgType: 'color',
                      backgroundColor: c,
                      bgColor: c,
                    })}
                    className={`w-6 h-6 rounded-md border shadow-2xs hover:scale-115 active:scale-95 transition-all ${
                      (style.backgroundColor || '#ffffff').toLowerCase() === c.toLowerCase()
                        ? 'border-blue-600 ring-2 ring-blue-400 ring-offset-1 z-10'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

