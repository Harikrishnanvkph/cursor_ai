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
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Chart Type</Label>
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger>
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

          {/* Fill & Border toggles */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Switch id="fill-toggle" checked={fillArea} onCheckedChange={toggleFillArea} />
              <Label htmlFor="fill-toggle">Fill</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="border-toggle" checked={showBorder} onCheckedChange={toggleShowBorder} disabled={!fillArea} />
              <Label htmlFor="border-toggle">Border</Label>
            </div>
          </div>

          {/* Image & Label toggles */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center space-x-2">
              <Switch id="show-images-toggle" checked={showImages} onCheckedChange={toggleShowImages} />
              <Label htmlFor="show-images-toggle">Image</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="show-labels-toggle" checked={showLabels} onCheckedChange={toggleShowLabels} />
              <Label htmlFor="show-labels-toggle">Label</Label>
            </div>
          </div>

          {/* Mode Toggle - Chart/Template */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t">
            <span className="text-sm font-medium text-gray-700">Mode</span>
            <div
              className="flex items-center gap-1 bg-gray-100 rounded-full p-1 border border-gray-200"
              style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
            >
              <button
                onClick={() => setEditorMode('chart')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all min-w-[70px] ${editorMode === 'chart'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                  }`}
                style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
              >
                Chart
              </button>
              <button
                onClick={() => setEditorMode('template')}
                className={`px-4 py-1.5 text-xs font-medium rounded-full transition-all min-w-[70px] ${editorMode === 'template'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                  }`}
                style={{ display: 'inline-block', visibility: 'visible', opacity: 1 }}
              >
                Template
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Animations */}
      <ResponsiveAnimationsPanel />
    </div>
  )
}            