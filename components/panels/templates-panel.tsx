"use client"

import React, { useState, useEffect } from "react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { useChatStore } from "@/lib/chat-store"
import { useChartStore } from "@/lib/chart-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Edit3, 
  Eye, 
  EyeOff, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Palette,
  ALargeSmall,
  Cloud,
  ChevronDown,
  ChevronUp,
  LayoutTemplate,
  Database,
  Type
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export function TemplatesPanel() {
  const { 
    templates, 
    currentTemplate, 
    selectedTextAreaId,
    applyTemplate, 
    resetTemplate, 
    updateTextArea, 
    setSelectedTextAreaId,
    unusedContents,
    removeUnusedContent,
    updateUnusedContent,
    setOriginalCloudTemplateContent,
    modifiedCloudTemplateContent,
    setModifiedCloudTemplateContent,
    clearUnusedContents,
    setDraftTemplate
  } = useTemplateStore()
  const router = useRouter()
  const [isUnusedContentsExpanded, setIsUnusedContentsExpanded] = React.useState(true)
  const [activeTab, setActiveTab] = React.useState("templates")
  
  // Use selector for better reactivity - subscribe specifically to currentChartState
  const currentChartState = useChatStore((state) => state.currentChartState)
  
  // Also check the current template in template store (set during restore)
  const originalCloudTemplateContent = useTemplateStore((state) => state.originalCloudTemplateContent)
  
  // Get current cloud template from snapshot OR from template store's originalCloudTemplateContent
  // This ensures the template shows even if currentChartState.template_structure is not immediately available
  const currentCloudTemplate = React.useMemo(() => {
    // First check currentChartState.template_structure (primary source)
    if (currentChartState?.template_structure) {
      return {
        ...currentChartState.template_structure,
        id: 'current-cloud-template',
        name: 'Current Cloud Template',
        description: 'Original template structure from backend snapshot',
        isCustom: false,
        isCloudTemplate: true
      }
    }
    
    // Fallback: check originalCloudTemplateContent from template store
    // This is set during restoreConversation and should have the template data
    if (originalCloudTemplateContent?.id === 'current-cloud-template') {
      return originalCloudTemplateContent
    }
    
    return null
  }, [currentChartState?.template_structure, originalCloudTemplateContent])

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)

  const askDelete = (e: any, id: string) => {
    e.stopPropagation()
    setPendingDeleteId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (pendingDeleteId) {
      try {
        await useTemplateStore.getState().deleteTemplate(pendingDeleteId)
        // Success feedback is handled in the store
      } catch (error) {
        console.error('Error deleting template:', error)
        // Error feedback is handled in the store
      }
    }
    setConfirmOpen(false)
    setPendingDeleteId(null)
  }

  const cancelDelete = () => {
    setConfirmOpen(false)
    setPendingDeleteId(null)
  }



  const selectedTextArea = currentTemplate?.textAreas.find(ta => ta.id === selectedTextAreaId)

  // Auto-select title text area when template is applied
  useEffect(() => {
    if (currentTemplate && !selectedTextAreaId) {
      const titleTextArea = currentTemplate.textAreas.find(ta => ta.type === 'title')
      if (titleTextArea) {
        setSelectedTextAreaId(titleTextArea.id)
      }
    }
  }, [currentTemplate, selectedTextAreaId, setSelectedTextAreaId])

  const handleTemplateSelect = (templateId: string) => {
    applyTemplate(templateId)
  }

  const handleTextAreaClick = (textAreaId: string) => {
    setSelectedTextAreaId(textAreaId)
  }

  const handleTextAreaUpdate = (field: string, value: any) => {
    if (selectedTextAreaId) {
      updateTextArea(selectedTextAreaId, { [field]: value })
    }
  }

  const handleStyleUpdate = (field: string, value: any) => {
    if (selectedTextAreaId && selectedTextArea) {
      updateTextArea(selectedTextAreaId, {
        style: { ...selectedTextArea.style, [field]: value }
      })
    }
  }

  const getTextAreaTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return <span className="text-xs font-bold">T</span>
      case 'heading': return <ALargeSmall className="h-4 w-4" />
      case 'custom': return <Edit3 className="h-4 w-4" />
      case 'main': return <FileText className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTextAreaTypeColor = (type: string) => {
    switch (type) {
      case 'title': return 'text-blue-600 bg-blue-50'
      case 'heading': return 'text-green-600 bg-green-50'
      case 'custom': return 'text-purple-600 bg-purple-50'
      case 'main': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Helper function to determine template type
  const getTemplateType = (template: TemplateLayout) => {
    // Check if it's a default template (template-1, template-2, etc.)
    const isDefault = /^template-\d+$/.test(template.id)
    
    // Check if it's a cloud template (UUID format)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isCloudSynced = uuidRegex.test(template.id)
    
    if (isDefault) return 'default'
    if (isCloudSynced) return 'cloud'
    return 'custom'
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Content
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4 mt-4">
          <Card>
            <CardContent className="space-y-2 p-4">
          <div className="grid grid-cols-1 gap-2">
            {/* Current Cloud Template - Show above all templates if available */}
            {currentCloudTemplate && (
              <div
                className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                  currentTemplate?.id === 'current-cloud-template'
                    ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
                onClick={() => {
                  const templateStore = useTemplateStore.getState()
                  
                  // Check if there's a modified version stored from before switching away
                  // If user modified Current Cloud Template, then switched to Standard Report,
                  // then comes back, we restore the modified version instead of original snapshot
                  let templateToApply = currentCloudTemplate
                  
                  if (modifiedCloudTemplateContent && modifiedCloudTemplateContent.id === 'current-cloud-template') {
                    // Restore the modified version (preserves text content, styles, etc.)
                    templateToApply = modifiedCloudTemplateContent
                  }
                  
                  // Store original source (first time only)
                  if (!templateStore.originalCloudTemplateContent) {
                    setOriginalCloudTemplateContent(currentCloudTemplate)
                  }
                  
                  templateStore.setCurrentTemplate(templateToApply)
                  templateStore.setEditorMode('template')
                  clearUnusedContents() // Clear unused when selecting source
                  
                  // Update chart dimensions to match template chart area
                  const chartStore = useChartStore.getState()
                  chartStore.updateChartConfig({
                    ...chartStore.chartConfig,
                    manualDimensions: true,
                    width: `${templateToApply.chartArea.width}px`,
                    height: `${templateToApply.chartArea.height}px`,
                    responsive: false,
                    maintainAspectRatio: false
                  })
                }}
              >
                <div className="min-w-0 flex-1">
                  {/* Row 1: Icon and Name */}
                  <div className="flex items-center gap-2 mb-1.5">
                    {currentTemplate?.id === 'current-cloud-template' && (
                      <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 flex-shrink-0" title="Active" />
                    )}
                    <Cloud className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    <h4 className="font-semibold text-sm text-gray-900 truncate flex-1">{currentCloudTemplate.name}</h4>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 flex-shrink-0"
                      title="Edit structure"
                      onClick={(e) => {
                        e.stopPropagation()
                        const draftId = `cloud-edit-${Date.now()}`
                    setDraftTemplate({
                          ...currentCloudTemplate,
                          id: draftId,
                          isCustom: true
                        })
                    setOriginalCloudTemplateContent(currentCloudTemplate)
                        router.push('/editor/custom-template?source=current-cloud')
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Row 2: Cloud tag */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-full">
                      <Cloud className="h-3 w-3" />
                      Cloud Snapshot
                    </span>
                  </div>

                  {currentCloudTemplate.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{currentCloudTemplate.description}</p>
                  )}
                </div>
              </div>
            )}
            
            {templates.map((template) => {
              const isActive = currentTemplate?.id === template.id
              const templateType = getTemplateType(template)
              const textAreaCount = template.textAreas?.length || 0
              
              return (
                <div
                  key={template.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                      : templateType === 'default'
                      ? 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                      : templateType === 'cloud'
                      ? 'border-purple-200 bg-purple-50/30 hover:border-purple-300 hover:bg-purple-50/50'
                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-50/30'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="min-w-0 flex-1">
                    {/* Row 1: Icon and Name */}
                    <div className="flex items-center gap-2 mb-1.5">
                      {isActive && (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 flex-shrink-0" title="Active" />
                      )}
                      {templateType === 'default' ? (
                        <LayoutTemplate className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      ) : templateType === 'cloud' ? (
                        <Database className="h-4 w-4 text-purple-600 flex-shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      )}
                      <h4 className="font-semibold text-sm text-gray-900 truncate flex-1">{template.name}</h4>
                      {template.isCustom && (
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Link href={`/editor/custom-template?id=${template.id}`} onClick={(e:any)=> e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <Button size="icon" variant="ghost" className="h-7 w-7" title="Delete" onClick={(e:any)=> askDelete(e, template.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Row 2: Tags and Info */}
                    <div className="flex items-center gap-2 mb-1">
                      {templateType === 'default' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-full">
                          {/* <LayoutTemplate className="h-3 w-3" /> */}
                          Default
                        </span>
                      )}
                      {templateType === 'cloud' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-full">
                          <Database className="h-3 w-3" />
                          Cloud Synced
                        </span>
                      )}
                      {templateType === 'custom' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-full">
                          Custom
                        </span>
                      )}
                      {textAreaCount > 0 && (
                        <span className="text-[10px] text-gray-500">
                          {textAreaCount} text area{textAreaCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Row 3: Description */}
                    {template.description && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{template.description}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <ConfirmDialog
            open={confirmOpen}
            title="Delete template?"
            description="This will permanently remove the custom template."
            confirmText="Delete"
            cancelText="Cancel"
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />

          {/* Create custom template entry */}
          <div className="mt-2">
            <a
              href="/editor/custom-template"
              className="inline-flex items-center px-3 py-1.5 border border-dashed border-blue-400 rounded-md text-sm text-blue-700 hover:bg-blue-50 transition-colors"
            >
              <span className="mr-1.5">＋</span>
              Create custom template
            </a>
            <p className="text-xs text-gray-500 mt-1">
              Canvas, Title, Heading, Main: one each. Custom text: many.
            </p>
          </div>

          {!currentTemplate && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <FileText className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                <p className="text-xs text-gray-600">
                  Select a template above to start customizing your chart with text areas and styling.
                </p>
              </div>
            </div>
          )}
            </CardContent>
          </Card>

          {/* Unused Contents Section - Content from Current Cloud Template that doesn't fit in current template */}
          {currentTemplate && unusedContents.length > 0 && (
            <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Unused Contents
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUnusedContentsExpanded(!isUnusedContentsExpanded)}
                className="h-6 px-2"
              >
                {isUnusedContentsExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {isUnusedContentsExpanded && (
            <CardContent className="space-y-2">
              {unusedContents.map((item, index) => (
                <div
                  key={index}
                  className="p-3 border border-gray-200 rounded-md bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded ${getTextAreaTypeColor(item.type)}`}>
                        {getTextAreaTypeIcon(item.type)}
                      </div>
                      <span className="text-xs font-medium capitalize text-gray-700">
                        {item.type}
                      </span>
                      {/* Show HTML badge if content type is html */}
                      {item.contentType === 'html' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">
                          HTML
                        </span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUnusedContent(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <textarea
                    value={item.content}
                    onChange={(e) => updateUnusedContent(index, e.target.value)}
                    className="w-full min-h-[60px] p-2 text-xs border border-gray-300 rounded resize-y focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Content from Current Cloud Template..."
                  />
                </div>
              ))}
            </CardContent>
          )}
            </Card>
          )}
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4 mt-4">
          {/* Text Areas Management */}
          {currentTemplate && (
            <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Text Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
             <div className="space-y-2 max-h-48 overflow-y-auto">
               {currentTemplate.textAreas.map((textArea) => (
                 <div
                   key={textArea.id}
                   className={`p-2 border rounded-md cursor-pointer transition-all duration-200 ${
                     selectedTextAreaId === textArea.id
                       ? 'border-blue-500 bg-blue-50 shadow-sm'
                       : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                   }`}
                   onClick={() => handleTextAreaClick(textArea.id)}
                 >
                   <div className="flex items-center justify-between gap-2">
                     <div className="flex items-center gap-2 min-w-0 flex-1">
                       <div className={`p-1.5 rounded ${getTextAreaTypeColor(textArea.type)} flex-shrink-0`}>
                         {getTextAreaTypeIcon(textArea.type)}
                       </div>
                       <div className="min-w-0 flex-1">
                         <div className="text-xs font-medium capitalize text-gray-900 truncate">{textArea.type}</div>
                         <div className="text-xs text-gray-500 truncate">
                           {textArea.content || 'Empty'}
                         </div>
                       </div>
                     </div>
                                           <div className="flex items-center gap-1 flex-shrink-0">
                        <Switch
                          checked={textArea.visible}
                          onCheckedChange={(checked) => 
                            updateTextArea(textArea.id, { visible: checked })
                          }
                          className="scale-75"
                        />
                      </div>
                   </div>
                 </div>
               ))}
             </div>

                                                   <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (currentTemplate) {
                    resetTemplate()
                  }
                }}
                className="w-full h-8 text-xs"
              >
                <FileText className="h-3 w-3 mr-1" />
                Reset Template
              </Button>
          </CardContent>
        </Card>
      )}

          {/* Text Editor */}
          {currentTemplate && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Text Editor{selectedTextArea ? ` - ${selectedTextArea.type}` : ''}
                </CardTitle>
              </CardHeader>
              {selectedTextArea ? (
                <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                         {/* Content Type Toggle */}
             <div className="flex items-center justify-between">
               <Label htmlFor="contentType" className="text-xs">Content Type</Label>
               <div className="flex items-center gap-2">
                 <span className={`text-xs ${(selectedTextArea.contentType || 'text') === 'text' ? 'font-semibold' : 'text-gray-500'}`}>
                   Text
                 </span>
                 <Switch
                   id="contentType"
                   checked={selectedTextArea.contentType === 'html'}
                   onCheckedChange={(checked) => {
                     handleTextAreaUpdate('contentType', checked ? 'html' : 'text')
                   }}
                 />
                 <span className={`text-xs ${selectedTextArea.contentType === 'html' ? 'font-semibold' : 'text-gray-500'}`}>
                   HTML
                 </span>
               </div>
             </div>

                         {/* Content */}
             <div>
               <Label htmlFor="content" className="text-xs">
                 Content {selectedTextArea.contentType === 'html' ? '(HTML)' : '(Text)'}
               </Label>
               <textarea
                 id="content"
                 value={selectedTextArea.content}
                 onChange={(e) => handleTextAreaUpdate('content', e.target.value)}
                 className="w-full mt-1 p-2 border rounded-md text-xs font-mono"
                 rows={selectedTextArea.contentType === 'html' ? 8 : 4}
                 placeholder={
                   selectedTextArea.contentType === 'html' 
                     ? 'Enter HTML content...\nExample: <p>Hello <strong>World</strong></p>' 
                     : 'Enter text content...'
                 }
               />
               {selectedTextArea.contentType === 'html' && (
                 <p className="text-xs text-gray-500 mt-1">
                   HTML is rendered in preview. Use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, etc.
                 </p>
               )}
             </div>

            <Separator />

                         {/* Font Settings */}
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                 <Input
                   id="fontSize"
                   type="number"
                   value={selectedTextArea.style.fontSize || ''}
                   onChange={(e) => {
                     const val = parseInt(e.target.value)
                     handleStyleUpdate('fontSize', isNaN(val) ? 14 : val)
                   }}
                   className="mt-1 h-7 text-xs"
                 />
               </div>
               <div>
                 <Label htmlFor="fontFamily" className="text-xs">Font Family</Label>
                 <Select
                   value={selectedTextArea.style.fontFamily}
                   onValueChange={(value) => handleStyleUpdate('fontFamily', value)}
                 >
                   <SelectTrigger className="mt-1 h-7 text-xs">
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                     <SelectItem value="Times New Roman, serif">Times New Roman</SelectItem>
                     <SelectItem value="Georgia, serif">Georgia</SelectItem>
                     <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                     <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                     <SelectItem value="Courier New, monospace">Courier New</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
             </div>

                                                   <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fontWeight" className="text-xs">Font Weight</Label>
                  <Select
                    value={selectedTextArea.style.fontWeight}
                    onValueChange={(value) => handleStyleUpdate('fontWeight', value)}
                  >
                    <SelectTrigger className="mt-1 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="100">Thin</SelectItem>
                      <SelectItem value="300">Light</SelectItem>
                      <SelectItem value="500">Medium</SelectItem>
                      <SelectItem value="700">Bold</SelectItem>
                      <SelectItem value="900">Black</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="color" className="text-xs">Text Color</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="color"
                      type="color"
                      value={selectedTextArea.style.color}
                      onChange={(e) => handleStyleUpdate('color', e.target.value)}
                      className="w-10 h-7 p-1"
                    />
                    <Input
                      type="text"
                      value={selectedTextArea.style.color}
                      onChange={(e) => handleStyleUpdate('color', e.target.value)}
                      className="flex-1 h-7 text-xs"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </div>

                         <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label htmlFor="lineHeight" className="text-xs">Line Height</Label>
                 <Input
                   id="lineHeight"
                   type="number"
                   step="0.1"
                   value={selectedTextArea.style.lineHeight || ''}
                   onChange={(e) => {
                     const val = parseFloat(e.target.value)
                     handleStyleUpdate('lineHeight', isNaN(val) ? 1.5 : val)
                   }}
                   className="mt-1 h-7 text-xs"
                 />
               </div>
               <div>
                 <Label htmlFor="letterSpacing" className="text-xs">Letter Spacing</Label>
                 <Input
                   id="letterSpacing"
                   type="number"
                   value={selectedTextArea.style.letterSpacing || ''}
                   onChange={(e) => {
                     const val = parseInt(e.target.value)
                     handleStyleUpdate('letterSpacing', isNaN(val) ? 0 : val)
                   }}
                   className="mt-1 h-7 text-xs"
                 />
               </div>
             </div>

                         <div>
               <Label htmlFor="textAlign" className="text-xs">Text Align</Label>
               <div className="flex gap-1 mt-1">
                 <Button
                   variant={selectedTextArea.style.textAlign === 'left' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleStyleUpdate('textAlign', 'left')}
                   className="flex-1 h-7"
                 >
                   <AlignLeft className="h-2.5 w-2.5" />
                 </Button>
                 <Button
                   variant={selectedTextArea.style.textAlign === 'center' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleStyleUpdate('textAlign', 'center')}
                   className="flex-1 h-7"
                 >
                   <AlignCenter className="h-2.5 w-2.5" />
                 </Button>
                 <Button
                   variant={selectedTextArea.style.textAlign === 'right' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleStyleUpdate('textAlign', 'right')}
                   className="flex-1 h-7"
                 >
                   <AlignRight className="h-2.5 w-2.5" />
                 </Button>
                 <Button
                   variant={selectedTextArea.style.textAlign === 'justify' ? 'default' : 'outline'}
                   size="sm"
                   onClick={() => handleStyleUpdate('textAlign', 'justify')}
                   className="flex-1 h-7"
                 >
                   <AlignJustify className="h-2.5 w-2.5" />
                 </Button>
               </div>
             </div>

             <div className="flex items-center space-x-2">
               <Switch
                 checked={selectedTextArea.visible}
                 onCheckedChange={(checked) => handleTextAreaUpdate('visible', checked)}
                 className="scale-75"
               />
               <Label className="text-xs">Visible</Label>
             </div>
                </CardContent>
              ) : (
                <CardContent className="pt-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Edit3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">
                      Select a text area from above to edit its content and styling.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {!currentTemplate && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Select a template from the Templates tab to edit content.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 