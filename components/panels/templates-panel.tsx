"use client"

import React, { useState, useEffect } from "react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
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
  ALargeSmall
} from "lucide-react"

export function TemplatesPanel() {
  const { 
    templates, 
    currentTemplate, 
    selectedTextAreaId,
    applyTemplate, 
    resetTemplate, 
    updateTextArea, 
    setSelectedTextAreaId
  } = useTemplateStore()

  const [confirmOpen, setConfirmOpen] = React.useState(false)
  const [pendingDeleteId, setPendingDeleteId] = React.useState<string | null>(null)

  const askDelete = (e: any, id: string) => {
    e.stopPropagation()
    setPendingDeleteId(id)
    setConfirmOpen(true)
  }

  const confirmDelete = () => {
    if (pendingDeleteId) {
      useTemplateStore.getState().deleteTemplate(pendingDeleteId)
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

  return (
    <div className="space-y-6">
      {/* Template Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Chart Templates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {templates.map((template) => {
              const isActive = currentTemplate?.id === template.id
              const showDescription = !(template.isCustom && /draft/i.test(String(template.description || '')))
              return (
                <div
                  key={template.id}
                  className={`group p-4 rounded-lg cursor-pointer transition-all duration-200 border ${
                    isActive
                      ? 'border-blue-300 bg-blue-50 ring-1 ring-blue-200 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'
                  }`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {isActive && (
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600 ring-2 ring-blue-200 flex-shrink-0" title="Active" />
                        )}
                        <h4 className="font-semibold text-sm text-gray-900 truncate">{template.name}</h4>
                      </div>
                      {template.isCustom && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-full">
                            Custom
                          </span>
                        </div>
                      )}
                      {showDescription && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {template.isCustom && (
                        <>
                          <Link href={`/editor/custom-template?id=${template.id}`} onClick={(e:any)=> e.stopPropagation()}>
                            <Button size="icon" variant="ghost" className="h-8 w-8" title="Edit">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button size="icon" variant="ghost" className="h-8 w-8" title="Delete" onClick={(e:any)=> askDelete(e, template.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
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
              className="inline-flex items-center px-3 py-2 border border-dashed border-blue-400 rounded-md text-sm text-blue-700 hover:bg-blue-50"
            >
              <span className="mr-2">＋</span>
              Create custom template
            </a>
            <p className="text-xs text-gray-500 mt-1">
              Canvas, Title, Heading, Main: one each. Custom text: many.
            </p>
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


        </CardContent>
      </Card>

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
       {currentTemplate && selectedTextArea && (
         <Card>
           <CardHeader className="pb-3">
             <CardTitle className="text-sm flex items-center gap-2">
               <Edit3 className="h-4 w-4" />
               Text Editor - {selectedTextArea.type}
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-3 max-h-64 overflow-y-auto">
                         {/* Content */}
             <div>
               <Label htmlFor="content" className="text-xs">Content</Label>
               <textarea
                 id="content"
                 value={selectedTextArea.content}
                 onChange={(e) => handleTextAreaUpdate('content', e.target.value)}
                 className="w-full mt-1 p-2 border rounded-md text-xs"
                 rows={2}
                 placeholder="Enter text content..."
               />
             </div>

            <Separator />

                         {/* Font Settings */}
             <div className="grid grid-cols-2 gap-3">
               <div>
                 <Label htmlFor="fontSize" className="text-xs">Font Size</Label>
                 <Input
                   id="fontSize"
                   type="number"
                   value={selectedTextArea.style.fontSize}
                   onChange={(e) => handleStyleUpdate('fontSize', parseInt(e.target.value))}
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
                   value={selectedTextArea.style.lineHeight}
                   onChange={(e) => handleStyleUpdate('lineHeight', parseFloat(e.target.value))}
                   className="mt-1 h-7 text-xs"
                 />
               </div>
               <div>
                 <Label htmlFor="letterSpacing" className="text-xs">Letter Spacing</Label>
                 <Input
                   id="letterSpacing"
                   type="number"
                   value={selectedTextArea.style.letterSpacing}
                   onChange={(e) => handleStyleUpdate('letterSpacing', parseInt(e.target.value))}
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
        </Card>
      )}
    </div>
  )
} 