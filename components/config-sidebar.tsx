"use client"

import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"
import { DatasetsSlicesPanel } from "@/components/panels/datasets-slices-panel"
import { FileText, Layout, BarChart3, Edit3 } from "lucide-react"
import { useState, useCallback } from "react"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HistoryDropdown } from "@/components/history-dropdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"

export function ConfigSidebar() {
  const { 
    chartType, 
    chartData, 
    chartConfig, 
    updateChartConfig, 
    fillArea, 
    showBorder, 
    showImages, 
    showLabels,
    overlayImages,
    updateOverlayImage,
    setChartType,
    toggleFillArea,
    toggleShowBorder,
    toggleShowImages,
    toggleShowLabels
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
    toggleFillArea()
    // Only update datasets if we need to change their fill property
    // Don't trigger individual dataset updates for simple toggles
  }, [toggleFillArea])

  const handleToggleShowBorder = useCallback((checked: boolean) => {
    toggleShowBorder()
    // Only update datasets if we need to change their border properties
    // Don't trigger individual dataset updates for simple toggles
  }, [toggleShowBorder])

  // Enhanced image toggle that also affects overlay images
  const handleToggleShowImages = useCallback((checked: boolean) => {
    toggleShowImages()
    
    // Also toggle overlay images visibility
    overlayImages.forEach((image) => {
      updateOverlayImage(image.id, { visible: checked })
    })
  }, [toggleShowImages, overlayImages, updateOverlayImage])

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
                
                {/* Dummy card to go to editor page */}
                <div className="p-4 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/40 transition-all duration-200">
                  <div className="flex flex-col items-center justify-center text-center space-y-3">
                    <Edit3 className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Go to Editor Page to Create Custom Templates
                      </p>
                      <p className="text-xs text-gray-500">
                        Use the advanced editor to design your own templates
                      </p>
                    </div>
                    <Link href="/editor">
                      <Button variant="default" size="sm" className="mt-1">
                        <Edit3 className="h-4 w-4 mr-2" />
                        Go to Editor
                      </Button>
                    </Link>
                  </div>
                </div>
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


            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 