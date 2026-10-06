"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { TiptapEditor } from "@/components/tiptap-editor"
import { sanitizeHTML } from "@/lib/utils/sanitize"
import { Columns, Rows, Minimize, Maximize, PaintBucket, Info } from "lucide-react"
import { toast } from "sonner"
import type { TextZone } from "@/lib/format-types"

export function FormatRichEditorDialog() {
  const {
    richEditorOpen,
    richEditorZoneId,
    closeRichEditor,
    selectedFormatSnapshot,
    formats,
    userFormats,
    selectedFormatId,
    contentPackage,
    setContentPackage,
    updateZoneContent
  } = useFormatGalleryStore()

  // Find active format & zone
  const activeFormat = selectedFormatSnapshot || [...formats, ...userFormats].find(f => f.id === selectedFormatId)
  const skeleton = activeFormat?.skeleton as any
  const zone = skeleton?.zones?.find((z: any) => z.id === richEditorZoneId) as TextZone | undefined

  // Content state
  const [editorContent, setEditorContent] = useState("")
  const [editorLayout, setEditorLayout] = useState<'side-by-side' | 'stacked'>('side-by-side')
  const [editorFitToView, setEditorFitToView] = useState(true)
  const [editorBg, setEditorBg] = useState<'white' | 'black'>('white')
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const [previewScale, setPreviewScale] = useState(1)

  // Initialize content whenever dialog opens or zone changes
  useEffect(() => {
    if (richEditorOpen && zone) {
      const initialText =
        (contentPackage?.zoneOverrides && contentPackage.zoneOverrides[zone.id] !== undefined)
          ? String(contentPackage.zoneOverrides[zone.id])
          : (contentPackage && zone.id && (contentPackage as any)[zone.id] !== undefined)
          ? String((contentPackage as any)[zone.id])
          : (zone as any).content !== undefined
          ? String((zone as any).content)
          : (contentPackage && zone.role && (contentPackage as any)[zone.role] !== undefined)
          ? String((contentPackage as any)[zone.role])
          : ""
      setEditorContent(initialText)
    }
  }, [richEditorOpen, richEditorZoneId, zone, contentPackage])

  // Scale computation to fit the preview container while strictly preserving exact zone dimensions
  const computeScale = useCallback(() => {
    if (!previewContainerRef.current || !zone?.position) {
      setPreviewScale(1)
      return
    }
    const container = previewContainerRef.current
    const containerWidth = container.clientWidth - 32
    const containerHeight = container.clientHeight - 32
    const zoneW = zone.position.width || 600
    const zoneH = zone.position.height || 200
    if (containerWidth > 0 && containerHeight > 0 && zoneW > 0 && zoneH > 0) {
      const scaleX = containerWidth / zoneW
      const scaleY = containerHeight / zoneH
      setPreviewScale(Math.min(scaleX, scaleY, 1))
    }
  }, [zone])

  useEffect(() => {
    const id = requestAnimationFrame(() => computeScale())
    window.addEventListener('resize', computeScale)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', computeScale)
    }
  }, [computeScale, richEditorOpen, editorLayout])

  if (!richEditorOpen || !zone) return null

  const zoneDisplayName = zone.role ? zone.role.toUpperCase() : 'TEXT ZONE'
  const zoneStyle = zone.style || {}
  const zoneW = zone.position?.width || 600
  const zoneH = zone.position?.height || 200

  const handleSave = () => {
    if (contentPackage) {
      const key = zone.id || zone.role || 'body'
      const updatedOverrides = {
        ...(contentPackage.zoneOverrides || {}),
        [zone.id]: editorContent
      }
      setContentPackage({
        ...contentPackage,
        [key]: editorContent,
        ...(zone.role ? { [zone.role]: editorContent } : {}),
        zoneOverrides: updatedOverrides
      })
    }
    updateZoneContent(zone.id, editorContent)
    toast.success(`Updated ${zone.role || 'zone'} content!`)
    closeRichEditor()
  }

  // Resolve background styling matching format template
  const bgZone = (skeleton?.zones || []).find((z: any) => z.type === 'background')
  const formatBgColor = bgZone?.style?.color || bgZone?.style?.backgroundColor || bgZone?.style?.baseColor || (skeleton?.palette as any)?.background
  const effectiveBgColor = (zoneStyle as any).backgroundColor || (zoneStyle as any).bgColor || (editorBg === 'black' ? '#111827' : (formatBgColor || '#ffffff'))

  const previewStyle: React.CSSProperties = {
    fontSize: zoneStyle.fontSize ? `${zoneStyle.fontSize}px` : '14px',
    fontFamily: zoneStyle.fontFamily || 'Inter, sans-serif',
    fontWeight: zoneStyle.fontWeight || 'normal',
    fontStyle: zoneStyle.fontStyle || 'normal',
    textDecoration: zoneStyle.textDecoration || 'none',
    textTransform: (zoneStyle.textTransform as any) || 'none',
    color: zoneStyle.color || (editorBg === 'black' ? '#f9fafb' : '#1a1a2e'),
    textAlign: (zoneStyle.textAlign as any) || 'left',
    lineHeight: zoneStyle.lineHeight || 1.6,
    letterSpacing: zoneStyle.letterSpacing ? `${zoneStyle.letterSpacing}px` : 'normal',
    padding: `${(zoneStyle as any)?.padding !== undefined ? (zoneStyle as any).padding : 4}px`,
    boxSizing: 'border-box',
    wordBreak: 'break-word',
    backgroundColor: effectiveBgColor,
  }

  return (
    <Dialog open={richEditorOpen} onOpenChange={(open) => { if (!open) closeRichEditor() }}>
      <DialogContent className="max-w-[95vw] h-[95vh] flex flex-col p-0 z-[100]" hideCloseButton>
        <DialogTitle className="sr-only">Rich Text Editor — {zoneDisplayName}</DialogTitle>

        <div className={`flex ${editorLayout === 'side-by-side' ? 'flex-row' : 'flex-col'} gap-0 flex-1 overflow-hidden min-h-0`}>
          {/* ── Editor Section ── */}
          <div className={`flex flex-col overflow-hidden ${editorLayout === 'side-by-side' ? 'flex-1 border-r' : 'flex-1 border-b'} min-w-0`}>
            {/* Action Bar */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 tracking-wide">
                  Rich Editor — {zoneDisplayName}
                </span>
                <div className="flex items-center border rounded-md overflow-hidden bg-white shadow-xs">
                  <button
                    type="button"
                    className={`p-1.5 transition-colors ${editorLayout === 'side-by-side' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setEditorLayout('side-by-side')}
                    title="Side by Side"
                  >
                    <Columns className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    className={`p-1.5 transition-colors border-l border-slate-200 ${editorLayout === 'stacked' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setEditorLayout('stacked')}
                    title="Stacked"
                  >
                    <Rows className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={editorFitToView ? "default" : "outline"}
                  size="sm"
                  className={`h-7 text-xs gap-1.5 ${editorFitToView ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                  onClick={() => setEditorFitToView(!editorFitToView)}
                >
                  {editorFitToView ? <Minimize className="h-3 w-3" /> : <Maximize className="h-3 w-3" />}
                  Fit to View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setEditorBg(prev => prev === 'white' ? 'black' : 'white')}
                  title="Toggle background color"
                >
                  <PaintBucket className="h-3 w-3" />
                  Background
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs text-slate-600 hover:bg-slate-100"
                  onClick={closeRichEditor}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3"
                  onClick={handleSave}
                >
                  Save & Apply
                </Button>
              </div>
            </div>

            {/* Zone Style Specs Banner */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-blue-50/70 border-b border-blue-100 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-blue-700">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>
                  Zone default size: <strong>{zoneStyle.fontSize || 16}px</strong> · Family: <strong>{(zoneStyle.fontFamily || 'Inter').split(',')[0]}</strong>
                </span>
              </div>
              <span className="text-[10px] text-blue-600 font-mono bg-blue-100/70 px-2 py-0.5 rounded">
                Zone Dimension: {zoneW} × {zoneH} px
              </span>
            </div>

            {/* Tiptap Editor Canvas */}
            <div className={`flex-1 overflow-auto ${editorFitToView ? 'bg-slate-100' : 'bg-white'}`}>
              <TiptapEditor
                initialHtml={editorContent}
                onChange={(html) => setEditorContent(html)}
                className={`h-full ${editorFitToView ? 'border-0' : ''}`}
                contentStyle={{
                  fontSize: zoneStyle.fontSize,
                  fontFamily: zoneStyle.fontFamily,
                  fontWeight: zoneStyle.fontWeight,
                  fontStyle: zoneStyle.fontStyle,
                  textDecoration: zoneStyle.textDecoration,
                  textTransform: zoneStyle.textTransform,
                  textAlign: zoneStyle.textAlign || 'left',
                  color: zoneStyle.color,
                  lineHeight: zoneStyle.lineHeight || 1.6,
                  letterSpacing: zoneStyle.letterSpacing
                }}
                fitToView={editorFitToView}
                editorBg={editorBg}
                zoneDimensions={{
                  width: zoneW,
                  height: zoneH
                }}
              />
            </div>
          </div>

          {/* ── Live Preview Section ── */}
          <div className="flex flex-col overflow-hidden min-w-0 flex-1">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Live Preview</span>
                <span className="text-[11px] font-mono text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded font-medium">
                  {zoneW} × {zoneH} px
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Exact Template Dimensions · Never Resizes
              </span>
            </div>

            <div
              ref={previewContainerRef}
              className="flex-1 overflow-auto bg-slate-100 p-4 min-w-0 flex items-center justify-center"
            >
              <div
                style={{
                  width: `${zoneW * previewScale}px`,
                  height: `${zoneH * previewScale}px`,
                  flexShrink: 0,
                  margin: 'auto',
                  position: 'relative',
                  overflow: 'hidden',
                  backgroundColor: effectiveBgColor,
                  borderRadius: 0,
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.12)',
                }}
              >
                <div
                  className="format-text-zone html-content-area"
                  style={{
                    width: `${zoneW}px`,
                    height: `${zoneH}px`,
                    ...previewStyle,
                    overflow: 'hidden',
                    transform: `scale(${previewScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    borderRadius: 0,
                  }}
                >
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(editorContent || '<p style="color:#999">Preview will appear here...</p>')
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
