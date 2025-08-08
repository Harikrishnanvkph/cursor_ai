"use client"

import React, { useState } from "react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Plus, 
  Trash2, 
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
    setSelectedTextAreaId,
    addTextArea,
    deleteTextArea
  } = useTemplateStore()

  const [showTextEditor, setShowTextEditor] = useState(false)

  const selectedTextArea = currentTemplate?.textAreas.find(ta => ta.id === selectedTextAreaId)

  const handleTemplateSelect = (templateId: string) => {
    applyTemplate(templateId)
  }

  const handleTextAreaClick = (textAreaId: string) => {
    setSelectedTextAreaId(textAreaId)
    setShowTextEditor(true)
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
                    <h4 className="font-semibold text-sm text-gray-900">{template.name}</h4>
                    <p className="text-xs text-gray-600 mt-1">{template.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
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
        </CardContent>
      </Card>

      {/* Text Areas Management */}
      {currentTemplate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Text Areas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {currentTemplate.textAreas.map((textArea) => (
                <div
                  key={textArea.id}
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTextAreaId === textArea.id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                  }`}
                  onClick={() => handleTextAreaClick(textArea.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTextAreaTypeColor(textArea.type)}`}>
                        {getTextAreaTypeIcon(textArea.type)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium capitalize text-gray-900">{textArea.type}</div>
                        <div className="text-xs text-gray-600 truncate max-w-[200px] mt-1">
                          {textArea.content || 'Empty'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={textArea.visible}
                        onCheckedChange={(checked) => 
                          updateTextArea(textArea.id, { visible: checked })
                        }
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTextArea(textArea.id)
                        }}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                addTextArea({
                  type: 'custom',
                  content: 'New text area',
                  position: { x: 0, y: 0, width: 200, height: 100 },
                  style: {
                    fontSize: 14,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: "normal",
                    color: "#000000",
                    textAlign: "left",
                    lineHeight: 1.4,
                    letterSpacing: 0
                  },
                  visible: true
                })
              }}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Text Area
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Text Editor */}
      {showTextEditor && selectedTextArea && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Edit3 className="h-4 w-4" />
              Text Editor - {selectedTextArea.type}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Content */}
            <div>
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                value={selectedTextArea.content}
                onChange={(e) => handleTextAreaUpdate('content', e.target.value)}
                className="w-full mt-1 p-2 border rounded-md text-sm"
                rows={3}
                placeholder="Enter text content..."
              />
            </div>

            <Separator />

            {/* Font Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={selectedTextArea.style.fontSize}
                  onChange={(e) => handleStyleUpdate('fontSize', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={selectedTextArea.style.fontFamily}
                  onValueChange={(value) => handleStyleUpdate('fontFamily', value)}
                >
                  <SelectTrigger className="mt-1">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontWeight">Font Weight</Label>
                <Select
                  value={selectedTextArea.style.fontWeight}
                  onValueChange={(value) => handleStyleUpdate('fontWeight', value)}
                >
                  <SelectTrigger className="mt-1">
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
                <Label htmlFor="textAlign">Text Align</Label>
                <div className="flex gap-1 mt-1">
                  <Button
                    variant={selectedTextArea.style.textAlign === 'left' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStyleUpdate('textAlign', 'left')}
                    className="flex-1"
                  >
                    <AlignLeft className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={selectedTextArea.style.textAlign === 'center' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStyleUpdate('textAlign', 'center')}
                    className="flex-1"
                  >
                    <AlignCenter className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={selectedTextArea.style.textAlign === 'right' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStyleUpdate('textAlign', 'right')}
                    className="flex-1"
                  >
                    <AlignRight className="h-3 w-3" />
                  </Button>
                  <Button
                    variant={selectedTextArea.style.textAlign === 'justify' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStyleUpdate('textAlign', 'justify')}
                    className="flex-1"
                  >
                    <AlignJustify className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lineHeight">Line Height</Label>
                <Input
                  id="lineHeight"
                  type="number"
                  step="0.1"
                  value={selectedTextArea.style.lineHeight}
                  onChange={(e) => handleStyleUpdate('lineHeight', parseFloat(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="letterSpacing">Letter Spacing</Label>
                <Input
                  id="letterSpacing"
                  type="number"
                  value={selectedTextArea.style.letterSpacing}
                  onChange={(e) => handleStyleUpdate('letterSpacing', parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="color">Text Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="color"
                  type="color"
                  value={selectedTextArea.style.color}
                  onChange={(e) => handleStyleUpdate('color', e.target.value)}
                  className="w-12 h-8 p-1"
                />
                <Input
                  type="text"
                  value={selectedTextArea.style.color}
                  onChange={(e) => handleStyleUpdate('color', e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={selectedTextArea.visible}
                onCheckedChange={(checked) => handleTextAreaUpdate('visible', checked)}
              />
              <Label>Visible</Label>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 