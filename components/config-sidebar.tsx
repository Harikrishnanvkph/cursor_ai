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
import { FileText, Layout, BarChart3, Edit3, Cloud, Sparkles, LayoutGrid, Palette } from "lucide-react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"

import { useState, useCallback, useEffect } from "react"
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
  } = useChartStore()

  const {
    updateChartConfig,
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
    generateMode,
  } = useTemplateStore()

  const { activeSidebarTab, setActiveSidebarTab } = useUIStore()
  const contentPackage = useFormatGalleryStore(s => s.contentPackage)
  const openGallery = useFormatGalleryStore(s => s.openGallery)
  const openStyleGallery = useChartStyleStore(s => s.openGallery)

  // Determine if we have a "Current Cloud Template" available from snapshot
  const currentCloudTemplate = originalCloudTemplateContent?.id === "current-cloud-template"
    ? originalCloudTemplateContent
    : null

  const handleApplyTemplate = () => {
    toast.success("Design Applied Successfully!")
  }



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

  const handleToggleShowImages = useCallback((checked: boolean) => {
    toggleShowImages()
  }, [toggleShowImages])


  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">


        <div className="w-full">
          {/* Browse Formats button - shows when content is available AND we are in format mode */}
          {contentPackage && generateMode === 'format' && (
            <div className="mb-3 px-1">
              <button
                onClick={() => openGallery()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all w-full justify-center shadow-sm"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Browse Formats
              </button>
            </div>
          )}

          {/* Browse Styles button - shows when chart data is available */}
          {chartData?.datasets?.length > 0 && (
            <div className="mb-3 px-1">
              <button
                onClick={() => openStyleGallery(chartType)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-lg transition-all w-full justify-center shadow-sm"
              >
                <Palette className="w-3.5 h-3.5" />
                Browse Styles
              </button>
            </div>
          )}

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
            {/* Mode Toggle + Chart Type (inline) */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0 bg-gray-100 rounded-full p-[2px] border border-gray-200 flex-shrink-0">
                <button
                  onClick={() => setEditorMode('chart')}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${editorMode === 'chart' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                >Chart</button>
                <button
                  onClick={() => {
                    if (!currentTemplate) {
                      applyTemplate('template-1')
                      setActiveSidebarTab('templates')
                    }
                    setEditorMode('template')
                  }}
                  className={`px-2 py-1 text-xs font-medium rounded-full transition-all ${editorMode === 'template' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                >Template</button>
              </div>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="flex-1 h-8 text-xs border-gray-200 bg-white">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="z-[1001] max-h-[300px]">
                  {STANDARD_CHART_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-sm py-2">{type.label}</SelectItem>
                  ))}
                  <SelectSeparator />
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
                <Label htmlFor="fill-toggle" className="text-xs text-gray-600">Fill</Label>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Switch
                  id="border-toggle"
                  checked={showBorder}
                  onCheckedChange={(checked) => handleToggleShowBorder(checked)}
                  disabled={!fillArea}
                  className="scale-75 data-[state=unchecked]:bg-input/50"
                />
                <Label htmlFor="border-toggle" className="text-xs text-gray-600">Border</Label>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Switch
                  id="show-images-toggle"
                  checked={showImages}
                  onCheckedChange={handleToggleShowImages}
                  className="scale-75 data-[state=unchecked]:bg-input/50"
                />
                <Label htmlFor="show-images-toggle" className="text-xs text-gray-600">Image</Label>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Switch
                  id="show-labels-toggle"
                  checked={showLabels}
                  onCheckedChange={toggleShowLabels}
                  className="scale-75 data-[state=unchecked]:bg-input/50"
                />
                <Label htmlFor="show-labels-toggle" className="text-xs text-gray-600">Label</Label>
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