"use client"

import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useTemplateStore } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STANDARD_CHART_TYPES, THREE_D_CHART_TYPES } from "@/lib/chart-types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"
import { DatasetsSlicesPanel } from "@/components/panels/datasets-slices-panel"
import { TemplateListTab } from "@/components/panels/template-settings/template-list-tab"
import { FileText, Layout, BarChart3, Edit3, Cloud, Sparkles } from "lucide-react"

import { useState, useCallback } from "react"
import { useUIStore } from "@/lib/stores/ui-store"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HistoryDropdown } from "@/components/history-dropdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"




export function ConfigSidebar() {
  const router = useRouter()

  const {
    chartType,
    chartData,
    chartConfig,
    overlayImages,
  } = useChartStore()

  const {
    updateChartConfig,
    updateOverlayImage,
    setChartType,
    toggleFillArea,
    toggleShowBorder,
    toggleShowImages,
    toggleShowLabels
  } = useChartActions()

  const fillArea = chartConfig?.visualSettings?.fillArea ?? true;
  const showBorder = chartConfig?.visualSettings?.showBorder ?? true;
  const showImages = chartConfig?.visualSettings?.showImages ?? true;
  const showLabels = chartConfig?.visualSettings?.showLabels ?? true;

  const {
    currentTemplate,
    editorMode,
    setEditorMode,
    applyTemplate,
    originalCloudTemplateContent,
  } = useTemplateStore()

  const { activeSidebarTab, setActiveSidebarTab } = useUIStore()

  // Determine if we have a "Current Cloud Template" available from snapshot
  const currentCloudTemplate = originalCloudTemplateContent?.id === "current-cloud-template"
    ? originalCloudTemplateContent
    : null

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


  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => setEditorMode('chart')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md transition-all text-sm font-medium ${editorMode === 'chart'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-gray-900 shadow-sm'
              }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Chart</span>
          </button>
          <button
            onClick={() => {
              if (!currentTemplate) {
                applyTemplate('template-1')
                setActiveSidebarTab('templates')
              }
              setEditorMode('template')
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md transition-all text-sm font-medium ${editorMode === 'template'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-gray-600 hover:text-gray-900 shadow-sm'
              }`}
          >
            <Layout className="h-4 w-4" />
            <span>Template</span>
          </button>
        </div>

        <div className="w-full">
          <div className="grid w-full grid-cols-3 gap-1 h-auto p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveSidebarTab('general')}
              className={`text-xs py-2 rounded-md transition-all ${activeSidebarTab === 'general' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >General</button>
            <button
              onClick={() => setActiveSidebarTab('datasets')}
              className={`text-xs py-2 rounded-md transition-all ${activeSidebarTab === 'datasets' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >Data</button>
            <button
              onClick={() => setActiveSidebarTab('templates')}
              className={`text-xs py-2 rounded-md transition-all ${activeSidebarTab === 'templates' ? 'bg-white shadow-sm font-medium text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >Templates</button>
          </div>

          <div className={`mt-4 space-y-4 ${activeSidebarTab === 'general' ? 'block' : 'hidden'}`}>
            {/* Chart Type */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Chart Type</Label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-full h-10 text-sm border-gray-200 bg-white">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent className="z-[1001] max-h-[300px]">
                  {/* Standard Charts */}
                  {STANDARD_CHART_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-sm py-2">{type.label}</SelectItem>
                  ))}
                  
                  <SelectSeparator />
                  
                  {/* 3D Charts */}
                  {THREE_D_CHART_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-sm py-2 font-medium text-blue-600">{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Compact Toggles (Single Row) */}
            <div className="flex items-center justify-between gap-1 px-1 mb-2">
              <div className="flex flex-col items-center gap-1">
                <Switch
                  id="fill-toggle"
                  checked={fillArea}
                  onCheckedChange={handleToggleFillArea}
                  className="scale-75 data-[state=unchecked]:bg-input/50"
                />
                <Label htmlFor="fill-toggle" className="text-[12px] text-gray-600">Fill</Label>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Switch
                  id="border-toggle"
                  checked={showBorder}
                  onCheckedChange={(checked) => handleToggleShowBorder(checked)}
                  disabled={!fillArea}
                  className="scale-75 data-[state=unchecked]:bg-input/50"
                />
                <Label htmlFor="border-toggle" className="text-[12px] text-gray-600">Border</Label>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Switch
                  id="show-images-toggle"
                  checked={showImages}
                  onCheckedChange={handleToggleShowImages}
                  className="scale-75 data-[state=unchecked]:bg-input/50"
                />
                <Label htmlFor="show-images-toggle" className="text-[12px] text-gray-600">Image</Label>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Switch
                  id="show-labels-toggle"
                  checked={showLabels}
                  onCheckedChange={toggleShowLabels}
                  className="scale-75 data-[state=unchecked]:bg-input/50"
                />
                <Label htmlFor="show-labels-toggle" className="text-[12px] text-gray-600">Label</Label>
              </div>
            </div>

            {/* Responsive Animations Panel */}
            <ResponsiveAnimationsPanel />
          </div>

          <div className={`mt-4 ${activeSidebarTab === 'datasets' ? 'block' : 'hidden'}`}>
            <DatasetsSlicesPanel />
          </div>



          <div className={`mt-4 ${activeSidebarTab === 'templates' ? 'block' : 'hidden'}`}>
            <TemplateListTab currentCloudTemplate={currentCloudTemplate as any} mode="landing" />
          </div>
        </div>
      </div>
    </div>
  )
} 