"use client"

import React from "react"
import { useTemplateStore } from "@/lib/template-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BarChart3 } from "lucide-react"

export function TemplateChartZonePanel() {
  const { currentTemplate, updateTemplate } = useTemplateStore()

  if (!currentTemplate) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No template selected.</p>
        <p className="text-xs mt-1 text-gray-400">Select a template first.</p>
      </div>
    )
  }

  const chartArea = currentTemplate.chartArea

  const handleChartAreaChange = (field: 'x' | 'y' | 'width' | 'height', value: string) => {
    const num = parseInt(value)
    if (!isNaN(num) && num >= 0) {
      updateTemplate(currentTemplate.id, {
        chartArea: { ...chartArea, [field]: num }
      })
    }
  }

  // Calculate percentage of total canvas
  const pctX = currentTemplate.width > 0 ? Math.round((chartArea.x / currentTemplate.width) * 100) : 0
  const pctY = currentTemplate.height > 0 ? Math.round((chartArea.y / currentTemplate.height) * 100) : 0
  const pctW = currentTemplate.width > 0 ? Math.round((chartArea.width / currentTemplate.width) * 100) : 0
  const pctH = currentTemplate.height > 0 ? Math.round((chartArea.height / currentTemplate.height) * 100) : 0

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Chart Area Position
        </h3>

        {/* Visual Preview */}
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <div
            className="relative mx-auto bg-white rounded border border-gray-200"
            style={{
              width: 200,
              height: Math.round(200 * (currentTemplate.height / currentTemplate.width)),
              maxHeight: 150,
            }}
          >
            <div
              className="absolute bg-blue-100 border-2 border-blue-400 border-dashed rounded-sm"
              style={{
                left: `${pctX}%`,
                top: `${pctY}%`,
                width: `${pctW}%`,
                height: `${pctH}%`,
              }}
            >
              <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-blue-600">
                Chart
              </span>
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            {currentTemplate.width} × {currentTemplate.height}px canvas
          </p>
        </div>

        {/* Position Controls */}
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-gray-500 font-medium mb-1">Position</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-400">X offset (px)</span>
                <Input
                  type="number"
                  value={chartArea.x}
                  onChange={(e) => handleChartAreaChange('x', e.target.value)}
                  className="h-8 text-sm"
                  min={0}
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400">Y offset (px)</span>
                <Input
                  type="number"
                  value={chartArea.y}
                  onChange={(e) => handleChartAreaChange('y', e.target.value)}
                  className="h-8 text-sm"
                  min={0}
                />
              </div>
            </div>
          </div>

          <div>
            <Label className="text-xs text-gray-500 font-medium mb-1">Size</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-gray-400">Width (px)</span>
                <Input
                  type="number"
                  value={chartArea.width}
                  onChange={(e) => handleChartAreaChange('width', e.target.value)}
                  className="h-8 text-sm"
                  min={50}
                />
              </div>
              <div>
                <span className="text-[10px] text-gray-400">Height (px)</span>
                <Input
                  type="number"
                  value={chartArea.height}
                  onChange={(e) => handleChartAreaChange('height', e.target.value)}
                  className="h-8 text-sm"
                  min={50}
                />
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-gray-50 rounded-md p-2 text-xs text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Chart covers</span>
              <span className="font-medium text-gray-700">{pctW}% × {pctH}%</span>
            </div>
            <div className="flex justify-between">
              <span>Offset from top-left</span>
              <span className="font-medium text-gray-700">{chartArea.x}, {chartArea.y}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
