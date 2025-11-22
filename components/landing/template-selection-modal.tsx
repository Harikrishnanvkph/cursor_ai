"use client"

import React, { useState } from "react"
import { X, Layout, Edit3 } from "lucide-react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface TemplateSelectionModalProps {
  open: boolean
  onClose: () => void
  onSelect?: (template: TemplateLayout) => void
}

export function TemplateSelectionModal({
  open,
  onClose,
  onSelect
}: TemplateSelectionModalProps) {
  const { templates, applyTemplate } = useTemplateStore()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateLayout | null>(
    templates.length > 0 ? templates[0] : null
  )
  const router = useRouter()

  if (!open) return null

  const handleTemplateClick = (template: TemplateLayout) => {
    setSelectedTemplate(template)
  }

  const handleSelect = () => {
    if (selectedTemplate) {
      // Apply the template to the store so it's available for chart generation
      applyTemplate(selectedTemplate.id)
      
      if (onSelect) {
        onSelect(selectedTemplate)
      }
      onClose()
    }
  }

  const handleCreateCustom = () => {
    onClose()
    router.push("/editor?mode=template")
  }

  // Count sections (text areas + chart area)
  const getSectionCount = (template: TemplateLayout) => {
    return template.textAreas.length + 1 // +1 for chart area
  }

  // Get text area types for preview
  const getTextAreaTypes = (template: TemplateLayout) => {
    return template.textAreas.map(ta => ta.type)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in-0">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-[90vw] max-w-6xl h-[85vh] max-h-[800px] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden bg-gray-50/30">
          {/* Left Panel: Preview */}
          <div className="flex-1 border-r border-gray-200 p-4 overflow-y-auto bg-white">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-bold text-gray-900">Preview</h2>
                <Button
                  onClick={handleSelect}
                  disabled={!selectedTemplate}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md text-sm"
                >
                  Select Template
                </Button>
              </div>
              {selectedTemplate && (
                <div className="flex items-center gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Size:</span>
                    <span className="text-gray-900">{selectedTemplate.width} px × {selectedTemplate.height} px</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Sections:</span>
                    <span className="text-gray-900">{getSectionCount(selectedTemplate)} sections</span>
                  </div>
                </div>
              )}
            </div>
            
            {selectedTemplate ? (
              <>

                {/* Template Preview Layout */}
                <div className="rounded-xl overflow-visible bg-gray-50 p-4">
                  <div
                    className="relative mx-auto border border-gray-300 shadow-md bg-white"
                    style={{
                      width: `${selectedTemplate.width * 0.4}px`,
                      height: `${selectedTemplate.height * 0.4}px`,
                      minHeight: '250px',
                      backgroundColor: selectedTemplate.backgroundColor || '#ffffff',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08), inset 0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    {/* Render text areas */}
                    {selectedTemplate.textAreas.map((textArea) => {
                      const scale = 0.4
                      const isMainArea = textArea.type === 'main'
                      
                      return (
                        <div
                          key={textArea.id}
                          className={`absolute border-2 flex items-center justify-center text-xs font-medium transition-all ${
                            isMainArea 
                              ? 'border-pink-400 bg-pink-50/60 text-pink-700 shadow-sm' 
                              : 'border-dashed border-gray-300 bg-gray-50/40 text-gray-600'
                          }`}
                          style={{
                            left: `${textArea.position.x * scale}px`,
                            top: `${textArea.position.y * scale}px`,
                            width: `${textArea.position.width * scale}px`,
                            height: `${textArea.position.height * scale}px`,
                            borderRadius: '6px'
                          }}
                        >
                          <span className="capitalize">{textArea.type} Area</span>
                        </div>
                      )
                    })}

                    {/* Chart Area */}
                    <div
                      className="absolute border-2 border-dashed border-indigo-400 bg-indigo-50/50 flex items-center justify-center text-xs text-indigo-700 font-medium rounded-md"
                      style={{
                        left: `${selectedTemplate.chartArea.x * 0.4}px`,
                        top: `${selectedTemplate.chartArea.y * 0.4}px`,
                        width: `${selectedTemplate.chartArea.width * 0.4}px`,
                        height: `${selectedTemplate.chartArea.height * 0.4}px`
                      }}
                    >
                      Chart Area
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No template selected
              </div>
            )}
          </div>

          {/* Right Panel: Templates List */}
          <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto flex flex-col bg-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Templates</h2>
                <p className="text-xs text-gray-500 mt-0.5">Choose a layout</p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all duration-200 hover:scale-105"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Templates List */}
            <div className="space-y-2 flex-1">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateClick(template)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedTemplate?.id === template.id
                      ? 'border-2 border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-md ring-1 ring-indigo-200'
                      : 'border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 bg-white hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-md flex-shrink-0 transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Layout className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold mb-1 text-sm ${
                        selectedTemplate?.id === template.id
                          ? 'text-indigo-900'
                          : 'text-gray-900'
                      }`}>
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Create Custom Template */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleCreateCustom}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-300 transition-all duration-200 text-center group"
              >
                <div className="flex flex-col items-center gap-1.5">
                  <div className="p-1.5 bg-gray-100 group-hover:bg-indigo-100 rounded-md transition-colors">
                    <Edit3 className="w-4 h-4 text-gray-600 group-hover:text-indigo-600 transition-colors" />
                  </div>
                  <div className="font-semibold text-gray-900 group-hover:text-indigo-900 transition-colors text-xs">
                    Create Custom Template in Editor Page
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

