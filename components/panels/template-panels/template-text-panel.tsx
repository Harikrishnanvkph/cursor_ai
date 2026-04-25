"use client"

import React from "react"
import { useTemplateStore } from "@/lib/template-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff, Type, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react"

const FONT_FAMILIES = [
  "Inter", "Roboto", "Open Sans", "Lato", "Montserrat",
  "Poppins", "Oswald", "Raleway", "Playfair Display", "Merriweather",
  "Arial", "Georgia", "Times New Roman", "Verdana", "Trebuchet MS",
]

const FONT_WEIGHTS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semi Bold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
]

export function TemplateTextPanel() {
  const {
    currentTemplate,
    updateTextArea,
    deleteTextArea,
    selectedTextAreaId,
    setSelectedTextAreaId,
  } = useTemplateStore()

  if (!currentTemplate) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No template selected.</p>
        <p className="text-xs mt-1 text-gray-400">Select a template first.</p>
      </div>
    )
  }

  const textAreas = currentTemplate.textAreas || []

  if (textAreas.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No text areas in this template.</p>
      </div>
    )
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'title': return 'Title'
      case 'heading': return 'Heading'
      case 'main': return 'Body'
      case 'custom': return 'Custom'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'title': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'heading': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'main': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'custom': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
        <Type className="h-4 w-4 text-blue-600" />
        Text Areas ({textAreas.length})
      </h3>

      {textAreas.map((ta) => {
        const isExpanded = selectedTextAreaId === ta.id
        return (
          <div
            key={ta.id}
            className={`rounded-lg border transition-all duration-200 ${
              isExpanded
                ? 'border-blue-300 bg-blue-50/30 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            {/* Header */}
            <div
              onClick={() => setSelectedTextAreaId(isExpanded ? null : ta.id)}
              className="w-full flex items-center justify-between p-2.5 text-left cursor-pointer"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${getTypeColor(ta.type)}`}>
                  {getTypeLabel(ta.type)}
                </span>
                <span className="text-xs text-gray-600 truncate">
                  {ta.content ? (ta.content.length > 30 ? ta.content.slice(0, 30) + '…' : ta.content) : '(empty)'}
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={(e) => { e.stopPropagation(); updateTextArea(ta.id, { visible: !ta.visible }) }}
                  className="p-1 rounded hover:bg-gray-100"
                  title={ta.visible ? "Hide" : "Show"}
                >
                  {ta.visible !== false ? <Eye className="h-3 w-3 text-gray-500" /> : <EyeOff className="h-3 w-3 text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Expanded Editor */}
            {isExpanded && (
              <div className="px-2.5 pb-2.5 space-y-3 border-t border-gray-100 pt-2.5">
                {/* Content */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1">Content</Label>
                  <textarea
                    value={ta.content || ''}
                    onChange={(e) => updateTextArea(ta.id, { content: e.target.value })}
                    className="w-full h-16 text-xs border border-gray-200 rounded-md p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400"
                    placeholder="Enter text content..."
                  />
                </div>

                {/* Font Family */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1">Font</Label>
                  <Select
                    value={ta.style.fontFamily}
                    onValueChange={(val) => updateTextArea(ta.id, { style: { ...ta.style, fontFamily: val } })}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_FAMILIES.map((font) => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size + Weight */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Size (px)</Label>
                    <Input
                      type="number"
                      value={ta.style.fontSize}
                      onChange={(e) => {
                        const num = parseInt(e.target.value)
                        if (!isNaN(num) && num > 0) {
                          updateTextArea(ta.id, { style: { ...ta.style, fontSize: num } })
                        }
                      }}
                      className="h-8 text-xs"
                      min={8}
                      max={200}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1">Weight</Label>
                    <Select
                      value={ta.style.fontWeight}
                      onValueChange={(val) => updateTextArea(ta.id, { style: { ...ta.style, fontWeight: val } })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_WEIGHTS.map((w) => (
                          <SelectItem key={w.value} value={w.value}>{w.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Color + Alignment */}
                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-gray-500 mb-1">Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={ta.style.color || '#000000'}
                        onChange={(e) => updateTextArea(ta.id, { style: { ...ta.style, color: e.target.value } })}
                        className="w-8 h-8 rounded cursor-pointer border border-gray-200"
                      />
                      <Input
                        value={ta.style.color || '#000000'}
                        onChange={(e) => updateTextArea(ta.id, { style: { ...ta.style, color: e.target.value } })}
                        className="h-8 text-xs font-mono flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex gap-0.5 border border-gray-200 rounded-md p-0.5">
                    {(['left', 'center', 'right'] as const).map((align) => {
                      const IconMap = { left: AlignLeft, center: AlignCenter, right: AlignRight }
                      const Icon = IconMap[align]
                      return (
                        <button
                          key={align}
                          onClick={() => updateTextArea(ta.id, { style: { ...ta.style, textAlign: align } })}
                          className={`p-1.5 rounded ${ta.style.textAlign === align ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Position */}
                <div>
                  <Label className="text-xs text-gray-500 mb-1">Position & Size</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['x', 'y', 'width', 'height'] as const).map((field) => (
                      <div key={field}>
                        <span className="text-[9px] text-gray-400 uppercase">{field}</span>
                        <Input
                          type="number"
                          value={ta.position[field]}
                          onChange={(e) => {
                            const num = parseInt(e.target.value)
                            if (!isNaN(num)) {
                              updateTextArea(ta.id, { position: { ...ta.position, [field]: num } })
                            }
                          }}
                          className="h-7 text-[10px] px-1.5"
                          min={0}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
