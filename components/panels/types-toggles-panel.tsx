"use client"

import { useChartStore, type SupportedChartType } from "@/lib/chart-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { BarChart3 } from "lucide-react"

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
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Chart Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
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
        </CardContent>
      </Card>
    </div>
  )
}            