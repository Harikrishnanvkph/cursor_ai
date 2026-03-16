"use client"

import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useTemplateStore } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"
import { DatasetsSlicesPanel } from "@/components/panels/datasets-slices-panel"
import { TemplateListTab } from "@/components/panels/template-settings/template-list-tab"
import { FileText, Layout, BarChart3, Edit3, Cloud, Settings } from "lucide-react"
import { useState, useCallback } from "react"
import { useUIStore } from "@/lib/stores/ui-store"
import { Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { HistoryDropdown } from "@/components/history-dropdown"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

// Content Setting Dialog Component
function ContentSettingDialog() {
  const {
    currentTemplate,
    contentTypePreferences,
    setContentTypePreferences,
    updateTextArea
  } = useTemplateStore()

  const [isOpen, setIsOpen] = useState(false)

  // Get all text areas from current template
  const textAreas = currentTemplate?.textAreas || []

  // Get content type for a text area - check both textArea.contentType and preferences
  const getContentType = (textArea: { id: string; contentType?: 'text' | 'html' }): 'text' | 'html' => {
    // Priority: textArea.contentType > preferences > default 'text'
    return textArea.contentType || (contentTypePreferences[textArea.id] as 'text' | 'html') || 'text'
  }

  // Toggle content type between text and html
  const toggleContentType = (textAreaId: string, currentContentType: 'text' | 'html') => {
    const newType: 'text' | 'html' = currentContentType === 'text' ? 'html' : 'text'

    // Update preferences for AI generation
    setContentTypePreferences({
      ...contentTypePreferences,
      [textAreaId]: newType
    })

    // ALSO update the actual textArea.contentType for immediate rendering
    updateTextArea(textAreaId, { contentType: newType })

    toast.success(`Changed to ${newType.toUpperCase()} mode`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2 mb-2"
        >
          <Settings className="h-4 w-4" />
          Content Setting
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Content Type Settings
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {!currentTemplate ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No template selected.</p>
              <p className="text-xs mt-1">Select a template to configure content types.</p>
            </div>
          ) : textAreas.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p className="text-sm">No text areas in this template.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 mb-4">
                Set whether each text area should use plain text or HTML content for AI generation.
              </p>

              {textAreas.map((textArea) => {
                const contentType = getContentType(textArea)
                return (
                  <div
                    key={textArea.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-sm capitalize">
                        {textArea.type}
                      </div>
                      <div className="text-xs text-gray-500">
                        {textArea.type === 'title' && 'Main title area'}
                        {textArea.type === 'heading' && 'Subtitle / heading'}
                        {textArea.type === 'main' && 'Main content area'}
                        {textArea.type === 'custom' && 'Custom text area'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${contentType === 'html'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-gray-200 text-gray-600'
                        }`}>
                        {contentType.toUpperCase()}
                      </span>
                      <Switch
                        checked={contentType === 'html'}
                        onCheckedChange={() => toggleContentType(textArea.id, contentType)}
                      />
                    </div>
                  </div>
                )
              })}

              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  <strong>HTML mode:</strong> AI can generate rich content with images, lists, formatting.
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  <strong>Text mode:</strong> AI generates plain text only.
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


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
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between gap-2 bg-gray-50 rounded-lg p-1">
          <button
            onClick={() => setEditorMode('chart')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs ${editorMode === 'chart'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="font-medium">Chart</span>
          </button>
          <button
            onClick={() => {
              if (!currentTemplate) {
                applyTemplate('template-1')
                setActiveSidebarTab('templates')
              }
              setEditorMode('template')
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs ${editorMode === 'template'
              ? 'bg-purple-100 text-purple-700 border border-purple-200'
              : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
          >
            <Layout className="h-3.5 w-3.5" />
            <span className="font-medium">Template</span>
          </button>
        </div>

        <Tabs value={activeSidebarTab} onValueChange={(v) => setActiveSidebarTab(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1">
            <TabsTrigger value="general" className="text-xs py-2">General</TabsTrigger>
            <TabsTrigger value="datasets" className="text-xs py-2">Datasets</TabsTrigger>
            <TabsTrigger value="templates" className="text-xs py-2">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-3">
            {/* Chart Type */}
            <div className="space-y-1">
              <Label className="text-xs font-medium text-gray-700">Chart Type</Label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-xs">
                      {type.label}
                    </SelectItem>
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
          </TabsContent>

          <TabsContent value="datasets" className="mt-4">
            <DatasetsSlicesPanel />
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <TemplateListTab currentCloudTemplate={currentCloudTemplate as any} mode="landing" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 