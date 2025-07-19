"use client"

import { useChartStore } from "@/lib/chart-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useState, useCallback, useEffect } from "react"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { DatasetsSlicesPanel } from "@/components/panels/datasets-slices-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HistoryDropdown } from "@/components/history-dropdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"

export function ConfigSidebar() {
  const { 
    chartType, 
    setChartType,
    chartData,
    updateDataset,
    fillArea,
    showBorder,
    showImages,
    showLabels,
    toggleFillArea: storeToggleFillArea,
    toggleShowBorder: storeToggleShowBorder,
    toggleShowImages,
    toggleShowLabels,
    toggleDatasetVisibility,
    toggleSliceVisibility,
    legendFilter
  } = useChartStore()

  const handleToggleFillArea = useCallback((checked: boolean) => {
    storeToggleFillArea()
    // Update all datasets
    chartData.datasets.forEach((_, index) => {
      updateDataset(index, { 
        fill: checked,
        borderWidth: checked ? (showBorder ? 2 : 0) : 2 // Show border by default when fill is off
      })
    })
  }, [chartData.datasets, showBorder, storeToggleFillArea, updateDataset])

  const handleToggleShowBorder = useCallback((checked: boolean) => {
    storeToggleShowBorder()
    // Update all datasets
    chartData.datasets.forEach((_, index) => {
      updateDataset(index, { borderWidth: checked ? 2 : 0 })
    })
  }, [chartData.datasets, storeToggleShowBorder, updateDataset])

  // Set initial fill and border state for datasets
  useEffect(() => {
    chartData.datasets.forEach((_, index) => {
      updateDataset(index, { 
        fill: true,
        borderWidth: 2
      })
    })
  }, []) // Run only once on mount

  const chartTypes = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'pie', label: 'Pie' },
    { value: 'doughnut', label: 'Doughnut' },
    { value: 'radar', label: 'Radar' },
    { value: 'polarArea', label: 'Polar Area' },
    { value: 'scatter', label: 'Scatter' },
    { value: 'bubble', label: 'Bubble' },
  ]

  return (
    <div className="h-full flex flex-col">
      {/* <div className="flex-none p-4 border-b bg-gray-50/50 flex items-center justify-end gap-3">
        <HistoryDropdown />
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-blue-200 text-blue-700 font-bold">U</AvatarFallback>
        </Avatar>
      </div> */}
      
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1">
            <TabsTrigger value="general" className="text-xs py-2">General</TabsTrigger>
            <TabsTrigger value="datasets" className="text-xs py-2">Datasets</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-3">
            {/* Chart Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Chart Type</Label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Style Options */}
            <div className="space-y-3">
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex flex-row items-center gap-2">
                  <Label htmlFor="fill-area" className="text-sm">Fill</Label>
                  <Switch
                    id="fill-area"
                    checked={fillArea}
                    onCheckedChange={handleToggleFillArea}
                  />
                </div>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <div className="flex flex-row items-center gap-1">
                  <button
                    onClick={() => handleToggleShowBorder(!showBorder)}
                    disabled={!fillArea}
                    className={`flex items-center justify-center text-sm rounded-full w-9 h-9 transition-colors border border-gray-200
                      ${showBorder ? 'bg-blue-50 text-blue-600 border-blue-200 ring-2 ring-blue-200' : 'bg-white text-gray-400'}
                      ${!fillArea ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-100 hover:text-blue-700'}`}
                    style={{ minWidth: 36, minHeight: 36 }}
                  >
                    {showBorder ? (
                      <Eye className="h-5 w-5" />
                    ) : (
                      <EyeOff className="h-5 w-5" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-700">Border</span>
                </div>
              </div>
              
              {/* Image and Label Toggles */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-lg px-4 py-2">
                <div className="flex flex-row items-center gap-2">
                  <Label htmlFor="show-images" className="text-sm">Image</Label>
                  <Switch
                    id="show-images"
                    checked={showImages}
                    onCheckedChange={toggleShowImages}
                  />
                </div>
                <div className="h-6 w-px bg-gray-200 mx-2" />
                <div className="flex flex-row items-center gap-2">
                  <Label htmlFor="show-labels" className="text-sm">Label</Label>
                  <Switch
                    id="show-labels"
                    checked={showLabels}
                    onCheckedChange={toggleShowLabels}
                  />
                </div>
              </div>
            </div>

            {/* Legend Filter Section */}
            <Card className="p-4 mt-4">
              <div className="font-semibold text-xs mb-2">Legend Filter</div>
              <div className="mb-1 font-semibold text-xs">Datasets</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {chartData.datasets.map((ds, i) => (
                  <button
                    key={i}
                    onClick={() => toggleDatasetVisibility(i)}
                    className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${legendFilter.datasets[i] === false ? 'opacity-40' : 'opacity-100'} `}
                    style={{ borderColor: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor, color: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor }}
                  >
                    <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor }} />
                    {ds.label || `Dataset ${i+1}`}
                  </button>
                ))}
              </div>
              <div className="mb-1 font-semibold text-xs">Slices</div>
              <div className="flex flex-wrap gap-2">
                {chartData.labels && chartData.labels.map((label, i) => (
                  // Compute visible slices based on visible datasets
                  (chartData.datasets.some((ds, dsIdx) => legendFilter.datasets[dsIdx] !== false && Array.isArray(ds.data) && ds.data[i] !== undefined)) ? (
                    <button
                      key={label}
                      onClick={() => toggleSliceVisibility(i)}
                      className={`flex items-center gap-1 px-2 py-1 rounded border text-xs ${legendFilter.slices[i] === false ? 'opacity-40' : 'opacity-100'} `}
                      style={{ borderColor: '#ccc', color: '#333' }}
                    >
                      <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ background: (chartData.datasets[0] && Array.isArray(chartData.datasets[0].backgroundColor) ? chartData.datasets[0].backgroundColor[i] : (chartData.datasets[0]?.backgroundColor as string)) || '#ccc' }} />
                      {label}
                    </button>
                  ) : null
                ))}
              </div>
            </Card>
            
            {/* Responsive Animations Panel */}
            <ResponsiveAnimationsPanel />
          </TabsContent>

          <TabsContent value="datasets" className="mt-4">
            <DatasetsSlicesPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 