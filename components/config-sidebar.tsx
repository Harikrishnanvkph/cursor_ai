"use client"

import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useState, useCallback, useEffect } from "react"
import { Plus, Trash2, Eye, EyeOff, FileText, Layout, BarChart3 } from "lucide-react"
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
    legendFilter,
    overlayImages,
    updateOverlayImage
  } = useChartStore()

  const { 
    templates, 
    currentTemplate, 
    editorMode,
    setEditorMode,
    applyTemplate, 
    resetTemplate 
  } = useTemplateStore()

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

  // Enhanced image toggle that also affects overlay images
  const handleToggleShowImages = useCallback((checked: boolean) => {
    toggleShowImages()
    
    // Also toggle overlay images visibility
    overlayImages.forEach((image) => {
      updateOverlayImage(image.id, { visible: checked })
    })
  }, [toggleShowImages, overlayImages, updateOverlayImage])

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

  const handleTemplateSelect = (templateId: string) => {
    applyTemplate(templateId)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => setEditorMode('chart')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs ${
              editorMode === 'chart' 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="font-medium">Chart</span>
          </button>
          <button
            onClick={() => setEditorMode('template')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs ${
              editorMode === 'template' 
                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                : 'bg-white text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Layout className="h-3.5 w-3.5" />
            <span className="font-medium">Template</span>
          </button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
            <TabsTrigger value="general" className="text-xs py-2">General</TabsTrigger>
            <TabsTrigger value="datasets" className="text-xs py-2">Datasets</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs py-2">Templates</TabsTrigger>
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
                    onCheckedChange={handleToggleShowImages}
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

          <TabsContent value="templates" className="mt-4">
            <div className="space-y-4">
              <div className="text-sm font-medium text-gray-900 mb-3">Chart Templates</div>
              <div className="grid grid-cols-1 gap-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                      currentTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{template.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                            {template.width} × {template.height}px
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            {template.textAreas.length} text areas
                          </span>
                        </div>
                      </div>
                      {currentTemplate?.id === template.id && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-blue-600 text-xs font-medium">Active</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {!currentTemplate && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Select a template above to start customizing your chart with text areas and styling.
                    </p>
                  </div>
                </div>
              )}

              {currentTemplate && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900">Active Template: {currentTemplate.name}</h5>
                      <p className="text-xs text-gray-500 mt-1">{currentTemplate.description}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={resetTemplate}
                      className="text-xs"
                    >
                      Reset to Default
                    </Button>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-800">
                      💡 Click "Reset to Default" to remove the template and return to the basic chart view.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 