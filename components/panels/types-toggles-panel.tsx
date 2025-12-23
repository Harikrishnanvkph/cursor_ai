"use client"

import { useChartStore, type SupportedChartType } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"

export function TypesTogglesPanel() {
  const {
    chartType,
    setChartType,
    chartData,
    fillArea,
    showBorder,
    toggleFillArea,
    toggleShowBorder,
    showImages,
    showLabels,
    toggleShowImages,
    toggleShowLabels,
  } = useChartStore()
  const { editorMode, setEditorMode } = useTemplateStore()

  const handleChartTypeChange = (type: string) => {
    if (type === 'stackedBar') {
      setChartType('stackedBar' as SupportedChartType)
      chartData.datasets.forEach((dataset, index) => {
        // update dataset type to 'bar'
        if (dataset.type !== 'bar') {
          dataset.type = 'bar'
        }
      })
      return
    }
    setChartType(type as SupportedChartType)
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle - Chart/Template */}
      <div className="flex items-center justify-between gap-3  mb-1">
        <span className="text-sm font-medium text-gray-700">Mode</span>
        <div
          className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 border border-gray-200"
          style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
        >
          <button
            onClick={() => setEditorMode('chart')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all min-w-[60px] ${editorMode === 'chart'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
          >
            Chart
          </button>
          <button
            onClick={() => setEditorMode('template')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all min-w-[60px] ${editorMode === 'template'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
            style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
          >
            Template
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Chart Type</Label>
        <Select value={chartType} onValueChange={handleChartTypeChange}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="Select chart type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">Bar</SelectItem>
            <SelectItem value="horizontalBar">Horizontal Bar</SelectItem>
            <SelectItem value="stackedBar">Stacked Bar</SelectItem>
            <SelectItem value="line">Line</SelectItem>
            <SelectItem value="area">Area</SelectItem>
            <SelectItem value="pie">Pie</SelectItem>
            <SelectItem value="doughnut">Doughnut</SelectItem>
            <SelectItem value="radar">Radar</SelectItem>
            <SelectItem value="polarArea">Polar Area</SelectItem>
            <SelectItem value="scatter">Scatter</SelectItem>
            <SelectItem value="bubble">Bubble</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between gap-1 px-1 mb-2">
        <div className="flex flex-col items-center gap-1">
          <Switch id="fill-toggle" checked={fillArea} onCheckedChange={toggleFillArea} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="fill-toggle" className="text-[12px] text-gray-600">Fill</Label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch id="border-toggle" checked={showBorder} onCheckedChange={toggleShowBorder} disabled={!fillArea} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="border-toggle" className="text-[12px] text-gray-600">Border</Label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch id="show-images-toggle" checked={showImages} onCheckedChange={toggleShowImages} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="show-images-toggle" className="text-[12px] text-gray-600">Image</Label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch id="show-labels-toggle" checked={showLabels} onCheckedChange={toggleShowLabels} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="show-labels-toggle" className="text-[12px] text-gray-600">Label</Label>
        </div>
      </div>

      {/* Responsive Animations */}
      <ResponsiveAnimationsPanel />
    </div>
  )
}            