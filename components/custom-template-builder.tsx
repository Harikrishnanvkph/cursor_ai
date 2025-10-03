"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Eye, EyeOff, RotateCcw, Save, X, Hash  ,ZoomIn, ZoomOut, Plus, Heading1, Heading2, Text, MonitorSmartphone, Trash2, FileText as FileTextIcon, Ellipsis, Maximize2 } from "lucide-react"
import { useTemplateStore, type TemplateTextArea } from "@/lib/template-store"
import DraggableResizable from "@/components/reusable/DraggableResizable"
import { useRouter } from "next/navigation"

type SectionKind = "canvas" | TemplateTextArea["type"]

const DEFAULT_TEMPLATE_WIDTH = 1440
const DEFAULT_TEMPLATE_HEIGHT = 1024

export function CustomTemplateBuilder() {
  const router = useRouter()
  const {
    draftTemplate,
    setDraftTemplate,
    clearDraft,
    addDraftTextArea,
    updateDraftTextArea,
    deleteDraftTextArea,
    applyTemplate,
    addTemplate,
    updateTemplate,
    templates,
  } = useTemplateStore()

  // Local editing state (draft)
  const [zoom, setZoom] = useState(0.75)
  const [showGuides, setShowGuides] = useState(true)
  const [grid, setGrid] = useState(10)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasCanvas, setHasCanvas] = useState(true)
  const [isExiting, setIsExiting] = useState(false)
  const [isBusy, setIsBusy] = useState(false)

  // Initialize draft template if none
  useEffect(() => {
    if (!draftTemplate && !isExiting) {
      setDraftTemplate({
        id: `custom-${Date.now()}`,
        name: "Custom Template (Draft)",
        description: "Draft template",
        width: DEFAULT_TEMPLATE_WIDTH,
        height: DEFAULT_TEMPLATE_HEIGHT,
        chartArea: { x: 120, y: 160, width: 960, height: 540 },
        textAreas: [
          {
            id: `title-${Date.now()}`,
            type: "title",
            content: "Chart Title",
            position: { x: 120, y: 60, width: 1200, height: 48 },
            style: {
              fontSize: 28,
              fontFamily: "Arial, sans-serif",
              fontWeight: "bold",
              color: "#111111",
              textAlign: "center",
              lineHeight: 1.2,
              letterSpacing: 0
            },
            visible: true
          }
        ],
        backgroundColor: "#ffffff",
        borderColor: "#e5e7eb",
        borderWidth: 1,
        padding: 20,
        isCustom: true
      })
    }
  }, [draftTemplate, setDraftTemplate, isExiting])

  const template = useTemplateStore(state => state.draftTemplate)
  const isEditing = useMemo(() => {
    if (!template) return false
    return templates.some(t => t.id === template.id)
  }, [template, templates])

  const canAdd = useMemo(() => {
    if (!template) return { title: true, heading: true, main: true }
    const exists = (type: TemplateTextArea["type"]) => template.textAreas.some(t => t.type === type)
    return {
      title: !exists("title"),
      heading: !exists("heading"),
      main: !exists("main"),
    }
  }, [template])

  const addSection = (kind: SectionKind) => {
    if (!template) return
    if (kind === "canvas") {
      // Re-add canvas if removed
      if (!hasCanvas) {
        useTemplateStore.setState({ draftTemplate: { ...template, chartArea: { x: 120, y: 160, width: 960, height: 540 } } })
        setHasCanvas(true)
      }
      return
    }
    if ((kind === "title" && !canAdd.title) || (kind === "heading" && !canAdd.heading) || (kind === "main" && !canAdd.main)) {
      return
    }
    const id = `text-${Date.now()}`
    const defaults: Omit<TemplateTextArea, "id"> = {
      type: kind as TemplateTextArea["type"],
      content: kind === "custom" ? "Custom text" : kind === "heading" ? "Subtitle or Description" : kind === "main" ? "Main explanation area" : "",
      position: { x: 120, y: 740, width: 1200, height: kind === "custom" ? 120 : 200 },
      style: {
        fontSize: kind === "title" ? 28 : kind === "heading" ? 16 : 14,
        fontFamily: "Arial, sans-serif",
        fontWeight: kind === "title" ? "bold" : "normal",
        color: "#333333",
        textAlign: kind === "title" || kind === "heading" ? "center" : "left",
        lineHeight: 1.4,
        letterSpacing: 0
      },
      visible: true
    }
    addDraftTextArea(defaults)
    setSelectedId(id)
  }

  const updateChartRect = (rect: { x: number; y: number; width: number; height: number }) => {
    if (!template) return
    useTemplateStore.setState({
      draftTemplate: { ...template, chartArea: { ...template.chartArea, ...rect } }
    })
  }

  const removeCanvas = () => {
    if (!template || !hasCanvas) return
    useTemplateStore.setState({ draftTemplate: { ...template, chartArea: { x: 0, y: 0, width: 0, height: 0 } } })
    setHasCanvas(false)
    if (selectedId === "__canvas__") setSelectedId(null)
  }

  const updateTextRect = (id: string, rect: { x: number; y: number; width: number; height: number }) => {
    updateDraftTextArea(id, { position: rect })
  }

  const removeByType = (type: TemplateTextArea["type"]) => {
    if (!template) return
    const target = template.textAreas.find(t => t.type === type)
    if (target) {
      deleteDraftTextArea(target.id)
      if (selectedId === target.id) setSelectedId(null)
    }
  }

  const finalize = async () => {
    if (!template) return
    // Validate uniqueness
    const onceTypes: TemplateTextArea["type"][] = ["title", "heading", "main"]
    for (const t of onceTypes) {
      const count = template.textAreas.filter(ta => ta.type === t).length
      if (count > 1) {
        alert(`${t} can appear only once`)
        return
      }
    }
    // Ensure chartArea inside bounds
    const inBounds = (r: { x: number; y: number; width: number; height: number }) =>
      r.x >= 0 && r.y >= 0 && r.x + r.width <= template.width && r.y + r.height <= template.height
    if (!inBounds(template.chartArea)) {
      alert("Canvas must be within template bounds")
      return
    }
    setIsExiting(true)
    setIsBusy(true)
    if (isEditing) {
      // Save edits to existing template (no new creation)
      const { id, ...rest } = template
      updateTemplate(id, { ...rest })
      applyTemplate(id)
    } else {
      const newTemplate = { ...template, id: template.id || `custom-${Date.now()}`, name: template.name || `Custom Template ${new Date().toLocaleString()}`, description: template.description || "User custom template", isCustom: true }
      addTemplate(newTemplate)
      applyTemplate(newTemplate.id)
    }
    // Ensure overlay is painted before navigating (2 RAFs)
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    router.push("/editor")
    // Clear the draft after navigation is initiated so overlay remains visible until unmount
    setTimeout(() => {
      try { clearDraft() } catch {}
    }, 0)
  }

  const cancel = async () => {
    // Discard draft and go back to templates tab
    setIsExiting(true)
    setIsBusy(true)
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
    router.push("/editor")
    setTimeout(() => {
      try { clearDraft() } catch {}
    }, 0)
  }

  if (!template) {
    return null
  }

  const scale = zoom
  const bounds = { width: template.width, height: template.height }

  return (
    <div className="flex h-full">
      {isBusy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-md bg-white px-5 py-3 shadow-lg border border-gray-200">
            <div className="h-6 w-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            <span className="text-sm font-semibold text-gray-800">
              {isEditing ? 'Saving template…' : 'Creating template…'}
            </span>
          </div>
        </div>
      )}
      {/* Canvas area */}
      <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
            {/* Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" title="Actions">
                  <Ellipsis className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setZoom(0.75)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  <span>Reset Zoom</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowGuides(g => !g)}>
                  {showGuides ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  <span>{showGuides ? "Hide Guides" : "Show Guides"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Fullscreen Button */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.documentElement.requestFullscreen();
                }
              }}
              title="Full Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Hash  className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-500" />
              <Input
                aria-label="Template name"
                value={template.name || ''}
                onChange={(e) => setDraftTemplate({ ...template, name: e.target.value })}
                placeholder="Template name"
                title="Template name"
                className="h-9 pl-8 w-[200px] xs400:w-[220px] sm:w-[260px] md:w-[300px] rounded-md border border-gray-300 bg-white/80 hover:bg-white  transition-colors"
                disabled={isBusy}
              />
            </div>
            <Button variant="outline" size="sm" onClick={cancel} disabled={isBusy}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button size="sm" onClick={finalize} disabled={isBusy}>
              <Save className="h-4 w-4 mr-1" /> {isEditing ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>

        {/* Fixed-size surface scaled */}
        <div className="w-full h-[calc(100%-48px)] overflow-auto">
          <div className="relative mx-auto" style={{ width: template.width, height: template.height, transform: `scale(${scale})`, transformOrigin: "top left" }}>
            {/* Background */}
            <div className="absolute inset-0 rounded" style={{ backgroundColor: template.backgroundColor, border: `${template.borderWidth}px solid ${template.borderColor}` }} />
            {/* Grid */}
            {showGuides && (
              <div className="absolute inset-0 pointer-events-none rounded" style={{
                backgroundImage: `linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)`,
                backgroundSize: "20px 20px"
              }} />
            )}

            {/* Chart Area */}
            {hasCanvas && (
            <DraggableResizable
              x={template.chartArea.x}
              y={template.chartArea.y}
              width={template.chartArea.width}
              height={template.chartArea.height}
              bounds={bounds}
              grid={grid}
              scale={scale}
              selected={selectedId === "__canvas__"}
              onSelect={() => setSelectedId("__canvas__")}
              onChange={updateChartRect}
              label="canvas"
              accentColor="#3b82f6"
            >
              {/* Placeholder only – chart is NOT embedded here */}
              <div
                className="w-full h-full flex items-center justify-center rounded"
                style={{
                  background: showGuides ? "rgba(59,130,246,0.05)" : "transparent",
                  border: showGuides ? "2px solid #3b82f6" : "1px solid #e5e7eb"
                }}
              >
                <span className="text-[11px] uppercase tracking-wide text-blue-600 bg-white/90 px-2 py-0.5 rounded border border-blue-200">
                  Canvas Area
                </span>
              </div>
            </DraggableResizable>
            )}

            {/* Text Areas */}
            {template.textAreas.filter(t => t.visible).map(textArea => {
              const accent = textArea.type === 'title' ? '#0ea5e9' // cyan for Title (distinct from canvas blue)
                              : textArea.type === 'heading' ? '#16a34a' // green
                              : textArea.type === 'main' ? '#ea580c' // orange
                              : '#7c3aed' // purple for custom
              const fill = textArea.type === 'title' ? 'rgba(14,165,233,0.06)'
                          : textArea.type === 'heading' ? 'rgba(22,163,74,0.06)'
                          : textArea.type === 'main' ? 'rgba(234,88,12,0.06)'
                          : 'rgba(124,58,237,0.06)'
              const border = textArea.type === 'title' ? '#7dd3fc'
                           : textArea.type === 'heading' ? '#86efac'
                           : textArea.type === 'main' ? '#fdba74'
                           : '#c4b5fd'
              const centerLabel = textArea.type === 'title' ? 'Title'
                                 : textArea.type === 'heading' ? 'Heading'
                                 : textArea.type === 'main' ? 'Main'
                                 : 'Custom Text'
              return (
              <DraggableResizable
                key={textArea.id}
                x={textArea.position.x}
                y={textArea.position.y}
                width={textArea.position.width}
                height={textArea.position.height}
                bounds={bounds}
                grid={grid}
                scale={scale}
                selected={selectedId === textArea.id}
                onSelect={() => setSelectedId(textArea.id)}
                onChange={(rect) => updateTextRect(textArea.id, rect)}
                label={textArea.type}
                accentColor={accent}
              >
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden rounded"
                  style={{
                    background: fill,
                    border: showGuides ? `2px solid ${accent}` : `1px dashed ${border}`,
                    borderRadius: 4
                  }}
                >
                  <span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded border"
                        style={{ color: accent, borderColor: accent, background: 'rgba(255,255,255,0.9)' }}>
                    {centerLabel}
                  </span>
                </div>
              </DraggableResizable>
            )})}
          </div>
        </div>
      </div>

      {/* Right panel (palette + tips) */}
      <div className="w-[280px] border-l bg-white p-3 flex flex-col overflow-hidden">
        <div className="text-sm font-semibold mb-1">Sections</div>
        <div className="grid grid-cols-1 gap-3 pr-1">
          {hasCanvas ? (
            <div className="w-full h-8 flex items-center justify-between px-3 border rounded-md text-sm">
              <div className="flex items-center gap-2 cursor-pointer text-blue-700 font-semibold" onClick={() => setSelectedId("__canvas__")}>
                <MonitorSmartphone className="h-4 w-4" />
                <span>Canvas</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeCanvas()} title="Remove Canvas">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" className="w-full h-8 justify-start font-semibold" onClick={() => addSection("canvas")}>
              <MonitorSmartphone className="h-4 w-4 mr-2" /> Add Canvas
            </Button>
          )}
          {canAdd.title ? (
            <Button variant="outline" size="sm" className="w-full h-8 justify-start font-semibold" onClick={() => addSection("title")}>
              <Heading1 className="h-4 w-4 mr-2" /> Add Title
            </Button>
          ) : (
            <div className="w-full h-8 flex items-center justify-between px-3 border rounded-md text-sm">
              <div className="flex items-center gap-2 text-sky-700 font-semibold">
                <Heading1 className="h-4 w-4" /> Title
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeByType("title")} title="Remove Title">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {canAdd.heading ? (
            <Button variant="outline" size="sm" className="w-full h-8 justify-start font-semibold" onClick={() => addSection("heading")}>
              <Heading2 className="h-4 w-4 mr-2" /> Add Heading
            </Button>
          ) : (
            <div className="w-full h-8 flex items-center justify-between px-3 border rounded-md text-sm">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <Heading2 className="h-4 w-4" /> Heading
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeByType("heading")} title="Remove Heading">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {canAdd.main ? (
            <Button variant="outline" size="sm" className="w-full h-8 justify-start font-semibold" onClick={() => addSection("main")}>
              <Text className="h-4 w-4 mr-2" /> Add Main
            </Button>
          ) : (
            <div className="w-full h-8 flex items-center justify-between px-3 border rounded-md text-sm">
              <div className="flex items-center gap-2 text-orange-700 font-semibold">
                <Text className="h-4 w-4" /> Main
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeByType("main")} title="Remove Main">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full h-8 justify-start font-semibold" onClick={() => addSection("custom")}> 
            <Plus className="h-4 w-4 mr-2" /> Add Custom Text
          </Button>
        </div>
        {template.textAreas.some(t => t.type === 'custom') && (
          <>
            <div className="text-xs font-medium text-gray-500 mt-2 px-1">Custom Texts</div>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1 mt-1">
              {template.textAreas.filter(t => t.type === 'custom').map(t => (
                <div key={t.id} className="flex items-center justify-between px-2 py-1 border rounded-md text-xs bg-white">
                  <span className="truncate max-w-[180px]">{t.content || 'Custom Text'}</span>
                  <Button variant="ghost" size="sm" onClick={() => { deleteDraftTextArea(t.id); if (selectedId === t.id) setSelectedId(null) }} title="Remove">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="pt-3 border-t text-xs text-gray-600">
          - Canvas, Title, Heading, Main: only one each.<br />
          - Custom text: any number.<br />
          - Surface is fixed at <span className="font-bold">1440×1024 px</span>.
        </div>
      </div>
    </div>
  )
}

export default CustomTemplateBuilder


