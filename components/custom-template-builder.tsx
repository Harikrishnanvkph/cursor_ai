"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff, RotateCcw, Save, X, ZoomIn, ZoomOut, Plus, Type, MonitorSmartphone, Trash2 } from "lucide-react"
import { useTemplateStore, type TemplateTextArea } from "@/lib/template-store"
import DraggableResizable from "@/components/reusable/DraggableResizable"
import { useRouter } from "next/navigation"

type SectionKind = "canvas" | TemplateTextArea["type"]

const DEFAULT_TEMPLATE_WIDTH = 1440
const DEFAULT_TEMPLATE_HEIGHT = 1024

export function CustomTemplateBuilder() {
  const router = useRouter()
  const {
    currentTemplate,
    setCurrentTemplate,
    addTextArea,
    updateTextArea,
    deleteTextArea,
    applyTemplate,
    addTemplate,
  } = useTemplateStore()

  // Local editing state (draft)
  const [zoom, setZoom] = useState(0.75)
  const [showGuides, setShowGuides] = useState(true)
  const [grid, setGrid] = useState(10)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasCanvas, setHasCanvas] = useState(true)

  // Initialize draft template if none
  useEffect(() => {
    if (!currentTemplate) {
      setCurrentTemplate({
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
  }, [currentTemplate, setCurrentTemplate])

  const template = useTemplateStore(state => state.currentTemplate)

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
        useTemplateStore.setState({ currentTemplate: { ...template, chartArea: { x: 120, y: 160, width: 960, height: 540 } } })
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
    addTextArea(defaults)
    setSelectedId(id)
  }

  const updateChartRect = (rect: { x: number; y: number; width: number; height: number }) => {
    if (!template) return
    useTemplateStore.setState({
      currentTemplate: { ...template, chartArea: { ...template.chartArea, ...rect } }
    })
  }

  const removeCanvas = () => {
    if (!template || !hasCanvas) return
    useTemplateStore.setState({ currentTemplate: { ...template, chartArea: { x: 0, y: 0, width: 0, height: 0 } } })
    setHasCanvas(false)
    if (selectedId === "__canvas__") setSelectedId(null)
  }

  const updateTextRect = (id: string, rect: { x: number; y: number; width: number; height: number }) => {
    updateTextArea(id, { position: rect })
  }

  const removeByType = (type: TemplateTextArea["type"]) => {
    if (!template) return
    const target = template.textAreas.find(t => t.type === type)
    if (target) {
      deleteTextArea(target.id)
      if (selectedId === target.id) setSelectedId(null)
    }
  }

  const finalize = () => {
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
    const newTemplate = { ...template, name: `Custom Template ${new Date().toLocaleString()}`, description: "User custom template", isCustom: true }
    addTemplate(newTemplate)
    applyTemplate(newTemplate.id)
    router.push("/editor")
  }

  const cancel = () => {
    // Discard draft and go back to templates tab
    router.push("/editor")
  }

  if (!template) {
    return null
  }

  const scale = zoom
  const bounds = { width: template.width, height: template.height }

  return (
    <div className="flex h-full">
      {/* Canvas area */}
      <div className="flex-1 p-4 bg-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.max(0.25, z - 0.1))}><ZoomOut className="h-4 w-4" /></Button>
            <span className="text-sm w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(z => Math.min(3, z + 0.1))}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(0.75)}><RotateCcw className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setShowGuides(g => !g)} title={showGuides ? "Hide guides" : "Show guides"}>
              {showGuides ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={cancel}><X className="h-4 w-4 mr-1" /> Cancel</Button>
            <Button size="sm" onClick={finalize}><Save className="h-4 w-4 mr-1" /> Create</Button>
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
                    border: `1px dashed ${border}`,
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
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 flex items-center justify-between"
            onClick={() => hasCanvas ? setSelectedId("__canvas__") : addSection("canvas")}
            title={hasCanvas ? "Select Canvas" : "Add Canvas"}
          >
            <span className="flex items-center gap-2"><MonitorSmartphone className="h-4 w-4" /> {hasCanvas ? "Canvas" : "Add Canvas"}</span>
            {hasCanvas && (
              <span onClick={(e) => { e.stopPropagation(); removeCanvas(); }}>
                <Trash2 className="h-4 w-4" />
              </span>
            )}
          </Button>
          {canAdd.title ? (
            <Button variant="outline" size="sm" className="w-full h-8 justify-start" onClick={() => addSection("title")}>
              <Type className="h-4 w-4 mr-2" /> Add Title
            </Button>
          ) : (
            <div className="w-full h-8 flex items-center justify-between px-3 border rounded-md text-sm">
              <div className="flex items-center gap-2 text-sky-700">
                <Type className="h-4 w-4" /> Title
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeByType("title")} title="Remove Title">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {canAdd.heading ? (
            <Button variant="outline" size="sm" className="w-full h-8 justify-start" onClick={() => addSection("heading")}>
              <Type className="h-4 w-4 mr-2" /> Add Heading
            </Button>
          ) : (
            <div className="w-full h-8 flex items-center justify-between px-3 border rounded-md text-sm">
              <div className="flex items-center gap-2 text-green-700">
                <Type className="h-4 w-4" /> Heading
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeByType("heading")} title="Remove Heading">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          {canAdd.main ? (
            <Button variant="outline" size="sm" className="w-full h-8 justify-start" onClick={() => addSection("main")}>
              <Type className="h-4 w-4 mr-2" /> Add Main
            </Button>
          ) : (
            <div className="w-full h-8 flex items-center justify-between px-3 border rounded-md text-sm">
              <div className="flex items-center gap-2 text-orange-700">
                <Type className="h-4 w-4" /> Main
              </div>
              <Button variant="ghost" size="sm" onClick={() => removeByType("main")} title="Remove Main">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full h-8 justify-start" onClick={() => addSection("custom")}>
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
                  <Button variant="ghost" size="sm" onClick={() => { deleteTextArea(t.id); if (selectedId === t.id) setSelectedId(null) }} title="Remove">
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
          - Surface is fixed at 1440×1024 px.
        </div>
      </div>
    </div>
  )
}

export default CustomTemplateBuilder


