"use client"

import React, { useState, useEffect } from "react"
import { X, Layout, Edit3, Type, Code2, Info, Plus, StickyNote, Trash2 } from "lucide-react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
  const { 
    templates, 
    applyTemplate, 
    updateTextArea,
    setContentTypePreferences: storeSetContentTypePreferences,
    setSectionNotes: storeSetSectionNotes
  } = useTemplateStore()
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateLayout | null>(
    templates.length > 0 ? templates[0] : null
  )
  // Store content type preferences per template: { templateId: { textAreaId: 'text' | 'html' } }
  const [contentTypePreferences, setContentTypePreferences] = useState<Record<string, Record<string, 'text' | 'html'>>>({})
  // Store section notes per template: { templateId: { textAreaId: 'note text' } }
  const [sectionNotes, setSectionNotes] = useState<Record<string, Record<string, string>>>({})
  // Track which text areas have their note input expanded
  const [expandedNotes, setExpandedNotes] = useState<Record<string, boolean>>({})
  const router = useRouter()

  // Get preferences for current template
  const getCurrentPreferences = () => {
    if (!selectedTemplate) return {}
    return contentTypePreferences[selectedTemplate.id] || {}
  }

  // Get notes for current template
  const getCurrentNotes = () => {
    if (!selectedTemplate) return {}
    return sectionNotes[selectedTemplate.id] || {}
  }

  // Update preference for a text area in current template
  const updatePreference = (textAreaId: string, contentType: 'text' | 'html') => {
    if (!selectedTemplate) return
    setContentTypePreferences(prev => ({
      ...prev,
      [selectedTemplate.id]: {
        ...prev[selectedTemplate.id],
        [textAreaId]: contentType
      }
    }))
  }

  // Update note for a text area in current template
  const updateNote = (textAreaId: string, note: string) => {
    if (!selectedTemplate) return
    setSectionNotes(prev => ({
      ...prev,
      [selectedTemplate.id]: {
        ...prev[selectedTemplate.id],
        [textAreaId]: note
      }
    }))
  }

  // Clear note for a text area
  const clearNote = (textAreaId: string) => {
    if (!selectedTemplate) return
    setSectionNotes(prev => {
      const templateNotes = { ...prev[selectedTemplate.id] }
      delete templateNotes[textAreaId]
      return {
        ...prev,
        [selectedTemplate.id]: templateNotes
      }
    })
    setExpandedNotes(prev => ({ ...prev, [textAreaId]: false }))
  }

  // Toggle note input visibility
  const toggleNoteExpanded = (textAreaId: string) => {
    setExpandedNotes(prev => ({ ...prev, [textAreaId]: !prev[textAreaId] }))
  }

  if (!open) return null

  const handleTemplateClick = (template: TemplateLayout) => {
    setSelectedTemplate(template)
  }

  const handleSelect = () => {
    if (selectedTemplate) {
      // Get content type preferences for the selected template
      const currentPrefs = contentTypePreferences[selectedTemplate.id] || {}
      const currentNotes = sectionNotes[selectedTemplate.id] || {}
      
      // Build final preferences with defaults for text areas not explicitly set
      const finalPreferences: Record<string, 'text' | 'html'> = {}
      selectedTemplate.textAreas.forEach(textArea => {
        finalPreferences[textArea.id] = currentPrefs[textArea.id] || 'text'
      })
      
      // Build final notes (only include non-empty notes)
      const finalNotes: Record<string, string> = {}
      Object.entries(currentNotes).forEach(([id, note]) => {
        if (note && note.trim()) {
          finalNotes[id] = note.trim()
        }
      })
      
      // Save content type preferences and notes to the store
      storeSetContentTypePreferences(finalPreferences)
      storeSetSectionNotes(finalNotes)
      
      // Apply the template to the store so it's available for chart generation
      applyTemplate(selectedTemplate.id)
      
      // Sync contentType to each template text area so Templates -> Content panel shows correct type
      // This must happen AFTER applyTemplate which sets the currentTemplate
      setTimeout(() => {
        selectedTemplate.textAreas.forEach(textArea => {
          const contentType = finalPreferences[textArea.id] || 'text'
          updateTextArea(textArea.id, { contentType })
        })
      }, 0)
      
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

                {/* Content Type Configuration Section */}
                {selectedTemplate.textAreas.length > 0 && (
                  <div className="mt-6 rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-4 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Code2 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm text-gray-900 mb-1">
                          Configure Content Types for AI Generation
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed">
                          Choose whether each Area should receive <strong>plain text</strong> or <strong>HTML formatted</strong> content from AI.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {selectedTemplate.textAreas.map((textArea) => {
                        const currentPrefs = getCurrentPreferences()
                        const currentNotes = getCurrentNotes()
                        const contentType = currentPrefs[textArea.id] || 'text'
                        const isHTML = contentType === 'html'
                        const areaTypeLabel = textArea.type.charAt(0).toUpperCase() + textArea.type.slice(1)
                        const note = currentNotes[textArea.id] || ''
                        const isNoteExpanded = expandedNotes[textArea.id] || note.length > 0
                        
                        return (
                          <div
                            key={textArea.id}
                            className="bg-white rounded-lg border border-gray-200 hover:border-indigo-300 transition-colors overflow-hidden"
                          >
                            {/* Main row */}
                            <div className="flex items-center justify-between p-3">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`p-1.5 rounded-md flex-shrink-0 ${
                                  isHTML 
                                    ? 'bg-purple-100 text-purple-600' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {isHTML ? (
                                    <Code2 className="w-4 h-4" />
                                  ) : (
                                    <Type className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-medium text-sm text-gray-900">
                                      {areaTypeLabel} Area
                                    </span>
                                    {isHTML && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-medium text-purple-700 bg-purple-100 rounded">
                                        HTML
                                      </span>
                                    )}
                                    {!isHTML && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-medium text-gray-600 bg-gray-100 rounded">
                                        Text
                                      </span>
                                    )}
                                    {note && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-100 rounded flex items-center gap-0.5">
                                        <StickyNote className="w-3 h-3" />
                                        Note
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500">
                                    {isHTML 
                                      ? 'AI will generate HTML formatted content' 
                                      : 'AI will generate plain text content'}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                {/* Add Note Button */}
                                <button
                                  onClick={() => toggleNoteExpanded(textArea.id)}
                                  className={`px-2 py-1 rounded-md transition-colors flex items-center gap-1 text-xs font-medium ${
                                    isNoteExpanded
                                      ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                  }`}
                                  title={isNoteExpanded ? "Hide note" : "Add small note for AI guidance"}
                                >
                                  <Plus className={`w-3 h-3 transition-transform ${isNoteExpanded ? 'rotate-45' : ''}`} />
                                  <span>{isNoteExpanded ? 'Hide' : 'Add Note'}</span>
                                </button>
                                
                                <div className="w-px h-6 bg-gray-200" />
                                
                                <span className={`text-xs font-medium ${!isHTML ? 'text-gray-900' : 'text-gray-400'}`}>
                                  Text
                                </span>
                                <Switch
                                  checked={isHTML}
                                  onCheckedChange={(checked) => {
                                    updatePreference(textArea.id, checked ? 'html' : 'text')
                                  }}
                                />
                                <span className={`text-xs font-medium ${isHTML ? 'text-purple-700' : 'text-gray-400'}`}>
                                  HTML
                                </span>
                              </div>
                            </div>
                            
                            {/* Note input area - expandable */}
                            {isNoteExpanded && (
                              <div className="px-3 pb-3 border-t border-gray-100 bg-amber-50/30">
                                <div className="pt-2">
                                  <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-medium text-amber-800 flex items-center gap-1">
                                      <StickyNote className="w-3 h-3" />
                                      AI Generation Note
                                    </label>
                                    {note && (
                                      <button
                                        onClick={() => clearNote(textArea.id)}
                                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-0.5 transition-colors"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Clear
                                      </button>
                                    )}
                                  </div>
                                  <textarea
                                    value={note}
                                    onChange={(e) => updateNote(textArea.id, e.target.value)}
                                    placeholder={`e.g., "Include 3 bullet points about key findings" or "Use formal tone with statistics"`}
                                    className="w-full px-2.5 py-2 text-xs border border-amber-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-transparent resize-none placeholder:text-gray-400"
                                    rows={2}
                                  />
                                  <p className="mt-1 text-[10px] text-amber-700">
                                    This note will guide the AI to generate more specific content for this area
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>Note:</strong> These preferences will be sent to the AI when generating content. 
                        You can change this later in the editor's Content tab.
                      </p>
                    </div>
                  </div>
                )}
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

