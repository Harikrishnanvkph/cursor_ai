"use client"

import React from "react"
import { useTemplateStore } from "@/lib/template-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Maximize2 } from "lucide-react"

const DIMENSION_PRESETS = [
  { label: "1:1 Square", width: 1080, height: 1080 },
  { label: "16:9 Wide", width: 1920, height: 1080 },
  { label: "9:16 Story", width: 1080, height: 1920 },
  { label: "4:3 Classic", width: 1200, height: 900 },
  { label: "A4 Portrait", width: 794, height: 1123 },
]

export function TemplateLayoutPanel() {
  const { currentTemplate, updateTemplate } = useTemplateStore()

  if (!currentTemplate) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No template selected.</p>
        <p className="text-xs mt-1 text-gray-400">Select a template first from the Templates tab.</p>
      </div>
    )
  }

  const handleDimensionChange = (field: 'width' | 'height', value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num > 0) {
      updateTemplate(currentTemplate.id, { [field]: num })
    }
  }

  const applyPreset = (preset: { width: number; height: number }) => {
    updateTemplate(currentTemplate.id, {
      width: preset.width,
      height: preset.height,
    })
  }

  const handleBackgroundColorChange = (color: string) => {
    updateTemplate(currentTemplate.id, { backgroundColor: color })
  }

  const handleBorderColorChange = (color: string) => {
    updateTemplate(currentTemplate.id, { borderColor: color })
  }

  const handleBorderWidthChange = (value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0) {
      updateTemplate(currentTemplate.id, { borderWidth: num })
    }
  }

  const handlePaddingChange = (value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0) {
      updateTemplate(currentTemplate.id, { padding: num })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Maximize2 className="h-4 w-4 text-blue-600" />
          Canvas Dimensions
        </h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label className="text-xs text-gray-500 mb-1">Width (px)</Label>
            <Input
              type="number"
              value={currentTemplate.width}
              onChange={(e) => handleDimensionChange('width', e.target.value)}
              className="h-8 text-sm"
              min={100}
            />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1">Height (px)</Label>
            <Input
              type="number"
              value={currentTemplate.height}
              onChange={(e) => handleDimensionChange('height', e.target.value)}
              className="h-8 text-sm"
              min={100}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIMENSION_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => applyPreset(preset)}
              className={`h-7 px-2 text-[10px] font-medium ${
                currentTemplate.width === preset.width && currentTemplate.height === preset.height
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Background</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="text-xs text-gray-500 w-16 shrink-0">Color</Label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="color"
                value={currentTemplate.backgroundColor || '#ffffff'}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
              <Input
                value={currentTemplate.backgroundColor || '#ffffff'}
                onChange={(e) => handleBackgroundColorChange(e.target.value)}
                className="h-8 text-xs font-mono flex-1"
                placeholder="#ffffff"
              />
            </div>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Border & Padding</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="text-xs text-gray-500 w-16 shrink-0">Color</Label>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="color"
                value={currentTemplate.borderColor || '#000000'}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer border border-gray-200"
              />
              <Input
                value={currentTemplate.borderColor || '#000000'}
                onChange={(e) => handleBorderColorChange(e.target.value)}
                className="h-8 text-xs font-mono flex-1"
                placeholder="#000000"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500 mb-1">Width (px)</Label>
              <Input
                type="number"
                value={currentTemplate.borderWidth || 0}
                onChange={(e) => handleBorderWidthChange(e.target.value)}
                className="h-8 text-sm"
                min={0}
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1">Padding (px)</Label>
              <Input
                type="number"
                value={currentTemplate.padding || 0}
                onChange={(e) => handlePaddingChange(e.target.value)}
                className="h-8 text-sm"
                min={0}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
