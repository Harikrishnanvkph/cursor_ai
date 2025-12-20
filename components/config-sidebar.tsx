"use client"

import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"
import { DatasetsSlicesPanel } from "@/components/panels/datasets-slices-panel"
import { FileText, Layout, BarChart3, Edit3, Cloud, Settings } from "lucide-react"
import { useState, useCallback } from "react"
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
    resetTemplate,
    setCurrentTemplate,
    originalCloudTemplateContent,
  } = useTemplateStore()

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
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs ${editorMode === 'chart'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white text-gray-500 hover:bg-gray-100'
              }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span className="font-medium">Chart</span>
          </button>
          <button
            onClick={() => setEditorMode('template')}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-md transition-colors text-xs ${editorMode === 'template'
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
              {/* Content Setting Button */}
              <ContentSettingDialog />

              <div className="text-sm font-medium text-gray-900 mb-3">Chart Templates</div>
              <div className="grid grid-cols-1 gap-3">
                {/* Current Cloud Template section, shown above other templates when available */}
                {currentCloudTemplate && (
                  <div
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${currentTemplate?.id === "current-cloud-template"
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-blue-200 bg-blue-50/40 hover:border-blue-400 hover:bg-blue-50"
                      }`}
                    onClick={() => {
                      // Apply the cloud template as the active template in landing
                      setCurrentTemplate(currentCloudTemplate as any)
                      setEditorMode("template")
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {currentTemplate?.id === "current-cloud-template" && (
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 flex-shrink-0"
                              title="Active"
                            />
                          )}
                          <Cloud className="h-4 w-4 text-blue-600 flex-shrink-0" />
                          <h4 className="font-semibold text-sm text-gray-900 truncate flex-1">
                            Current Cloud Template
                          </h4>
                        </div>
                        {currentCloudTemplate.description && (
                          <p className="text-xs text-gray-600 line-clamp-2">
                            {currentCloudTemplate.description}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-1 flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          toast("Open in Advanced Editor", {
                            description:
                              "To edit this template's structure, please use the Advanced Editor.",
                            action: {
                              label: "Go to Editor",
                              onClick: () => router.push("/editor?tab=templates"),
                            },
                          })
                        }}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {templates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${currentTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                      </div>
                      {currentTemplate?.id === template.id && (
                        <div className="flex items-center gap-1">
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
                    {/* <Edit3 className="h-6 w-6 text-gray-400" /> */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1 mt-1">
                        Go to Editor Page to Edit or Create Custom Templates
                      </p>
                      {/* <p className="text-xs text-gray-500">
                        Use the advanced editor to design your own templates
                      </p> */}
                    </div>
                    <Link href="/editor?tab=templates">
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