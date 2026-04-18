"use client"

import React, { useState, useEffect } from "react"
import { BarChart2, Bot, Brain, Forward, FileText, Layout, X, Settings, Info, LayoutGrid } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TemplateSelectionModal } from "./template-selection-modal"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { dataService } from "@/lib/data-service"

const chartTemplate = "Create a bar chart comparing the top 5 countries by smartphone usage in 2025. Include country names on the x-axis and number of users on the y-axis."

interface PromptTemplateProps {
  onSampleClick?: (template: string) => void
  className?: string
  size?: 'default' | 'compact' | 'large'
  isTemplateModalOpen?: boolean
  setIsTemplateModalOpen?: (open: boolean) => void
}

export function PromptTemplate({
  onSampleClick,
  className = "",
  size = 'default',
  isTemplateModalOpen: isTemplateModalOpenProp,
  setIsTemplateModalOpen: setIsTemplateModalOpenProp
}: PromptTemplateProps) {
  const [isTemplateModalOpenLocal, setIsTemplateModalOpenLocal] = useState(false)

  // Use prop if provided, otherwise use local state
  const isTemplateModalOpen = isTemplateModalOpenProp !== undefined ? isTemplateModalOpenProp : isTemplateModalOpenLocal
  const setIsTemplateModalOpen = setIsTemplateModalOpenProp !== undefined ? setIsTemplateModalOpenProp : setIsTemplateModalOpenLocal
  const {
    currentTemplate,
    setCurrentTemplate,
    templates,
    applyTemplate,
    generateMode,
    setGenerateMode,
    setEditorMode,
    contentTypePreferences,
    setContentTypePreferences
  } = useTemplateStore()

  // Format gallery store for format mode
  const {
    formats,
    setFormats,
    selectedFormatId,
    isLoadingFormats,
    setLoadingFormats,
    setSelectedFormat,
    clearSelection: clearFormatSelection,
    isGalleryOpen,
    openGallery,
    closeGallery,
  } = useFormatGalleryStore()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Load formats when format mode is first selected
  useEffect(() => {
    if (generateMode === 'format' && formats.length === 0 && !isLoadingFormats) {
      loadFormats()
    }
  }, [generateMode, formats.length, isLoadingFormats])

  const loadFormats = async () => {
    setLoadingFormats(true)
    try {
      const res = await dataService.getOfficialFormats()
      if (!res.error && res.data) {
        setFormats(res.data)
      }
    } catch (err) {
      console.error('Failed to load formats:', err)
    } finally {
      setLoadingFormats(false)
    }
  }

  const handleSampleClick = () => {
    if (onSampleClick) {
      onSampleClick(chartTemplate)
    }
  }

  const handleChooseTemplates = () => {
    setIsTemplateModalOpen(true)
  }

  const handleCancelTemplate = () => {
    // Setting to null will also clear contentTypePreferences and sectionNotes in the store
    setCurrentTemplate(null)
    // Close settings popover if open
    setIsSettingsOpen(false)
  }

  const handleStandardTemplate = () => {
    // Apply the first template (Standard Report)
    if (templates.length > 0) {
      applyTemplate(templates[0].id)
    }
  }

  const handleChooseFormat = () => {
    openGallery()
  }

  const handleCancelFormat = () => {
    clearFormatSelection()
  }

  // Get the selected format name
  const selectedFormat = selectedFormatId ? formats.find(f => f.id === selectedFormatId) : null




  // Size variants
  const sizeClasses = {
    compact: {
      container: "max-w-sm p-8",
      icon: "w-10 h-10",
      iconInner: "w-5 h-5",
      title: "text-xl",
      description: "text-sm",
      padding: "p-6"
    },
    default: {
      container: "max-w-md p-12",
      icon: "w-12 h-12",
      iconInner: "w-6 h-6",
      title: "text-2xl",
      description: "text-base",
      padding: "p-8"
    },
    large: {
      container: "max-w-xl p-16",
      icon: "w-16 h-16",
      iconInner: "w-8 h-8",
      title: "text-2xl",
      description: "text-base",
      padding: "p-8"
    }
  }

  const styles = sizeClasses[size]

  return (
    <div className={`flex items-center justify-center h-full ${styles.padding} ${className}`}>
      <div className={`relative flex flex-col items-center justify-center w-full ${styles.container} bg-white/70 backdrop-blur-2xl rounded-3xl shadow-[0_8px_32px_0_rgba(79,70,229,0.1)] border border-white/60 overflow-hidden`}>
        {/* Subtle inner highlight */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>

        <div className="relative flex flex-col items-center justify-center mb-6 w-full">
          <div className={`${styles.title} inline-flex items-center font-extrabold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-3 text-center tracking-tight`}>
            <span className="text-sm inline text-slate-500 mr-3 p-2 bg-white/50 rounded-xl shadow-sm border border-slate-100/50 backdrop-blur-md"><Bot className="w-5 h-5" /></span>
            <h2>Create Your Chart with AI Prompt</h2>
          </div>
          <p className={`text-slate-500 text-center max-w-md mx-auto leading-relaxed ${styles.description}`}>
            Describe the chart you want to create in natural language. I'll generate it for you and you can ask me to modify it further!
          </p>
        </div>

        <div className="relative space-y-4 w-full">
          {/* Generate Toggle Button */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider pl-1">Generate As</label>
            <ToggleGroup
              type="single"
              value={generateMode}
              onValueChange={(value) => {
                if (value) {
                  const mode = value as 'chart' | 'template' | 'format'
                  setGenerateMode(mode)
                  // Also update editorMode so template data gets saved correctly
                  if (mode === 'chart' || mode === 'template') {
                    setEditorMode(mode)
                  }
                }
              }}
              className="w-full bg-white/60 backdrop-blur-md rounded-xl p-1.5 border border-white/80 shadow-inner"
            >
              <ToggleGroupItem
                value="chart"
                aria-label="Chart"
                className="flex-1 rounded-lg data-[state=on]:bg-gradient-to-r data-[state=on]:from-indigo-500 data-[state=on]:to-purple-500 data-[state=on]:text-white data-[state=on]:shadow-md transition-all duration-300 text-slate-600 hover:text-slate-900 data-[state=on]:hover:text-white"
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Chart
              </ToggleGroupItem>
              <ToggleGroupItem
                value="template"
                aria-label="Template"
                className="flex-1 rounded-lg data-[state=on]:bg-gradient-to-r data-[state=on]:from-indigo-500 data-[state=on]:to-purple-500 data-[state=on]:text-white data-[state=on]:shadow-md transition-all duration-300 text-slate-600 hover:text-slate-900 data-[state=on]:hover:text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Template
              </ToggleGroupItem>
              <ToggleGroupItem
                value="format"
                aria-label="Format"
                className="flex-1 rounded-lg data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-pink-500 data-[state=on]:text-white data-[state=on]:shadow-md transition-all duration-300 text-slate-600 hover:text-slate-900 data-[state=on]:hover:text-white"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Format
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Conditional Content Based on Generate Mode */}
          {generateMode === 'chart' ? (
            <>
              <button
                onClick={handleSampleClick}
                className="w-full bg-gradient-to-r from-indigo-50/80 to-purple-50/80 hover:from-indigo-100/90 hover:to-purple-100/90 text-slate-800 font-medium px-5 py-4 rounded-2xl border border-indigo-200/50 text-left hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group text-sm backdrop-blur-sm"
              >
                <div className="font-semibold flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 bg-white/60 rounded-md group-hover:bg-white/80 shadow-sm transition-colors border border-indigo-100/50">
                    <Forward className="w-4 h-4 text-indigo-600" />
                  </div>
                  Sample Request
                </div>
                <div className="text-xs text-slate-600 leading-relaxed">{chartTemplate}</div>
              </button>

              <div className="text-center">
                <div className="text-xs text-slate-500">
                  Or type your own request in the chat panel →
                </div>
              </div>
            </>
          ) : generateMode === 'template' ? (
            <>
              {currentTemplate ? (
                <>
                  {/* Status Indicator */}
                  <div className="text-xs text-slate-600 mb-2">
                    Status: <span className="font-semibold text-green-600">Attached Template</span>
                  </div>

                  {/* Template Name with Settings and Cancel Buttons */}
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 bg-green-50 border-2 border-green-500 rounded-lg px-4 py-3 flex items-center">
                      <Layout className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span className="font-semibold text-green-900 text-sm truncate">
                        {currentTemplate.name}
                      </span>
                    </div>

                    {/* Settings Button (Opens Template Selection Modal) */}
                    <button
                      onClick={handleChooseTemplates}
                      className="w-10 h-10 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 flex items-center justify-center hover:scale-105 flex-shrink-0 border border-blue-200"
                      aria-label="Change template"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* Cancel Button */}
                    <button
                      onClick={handleCancelTemplate}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center hover:scale-105 flex-shrink-0"
                      aria-label="Remove template"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleStandardTemplate}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-4 py-6 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <Layout className="w-5 h-5 mr-2" />
                    Standard Template
                  </Button>

                  <div className="text-center relative py-2">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200/60"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white/70 px-2 text-slate-400 font-medium">or</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    onClick={handleChooseTemplates}
                    className="w-full bg-white/50 backdrop-blur-sm border-indigo-200/60 text-indigo-600 hover:bg-white/80 hover:border-indigo-300 font-medium px-4 py-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Choose From Templates
                  </Button>
                </>
              )}
            </>
          ) : (
            /* Format Mode */
            <>
              {selectedFormat ? (
                <>
                  {/* Status Indicator */}
                  <div className="text-xs text-slate-600 mb-2">
                    Status: <span className="font-semibold text-purple-600">Attached Format</span>
                  </div>

                  {/* Format Name with Settings and Cancel Buttons */}
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 bg-purple-50 border-2 border-purple-500 rounded-lg px-4 py-3 flex items-center">
                      <LayoutGrid className="w-4 h-4 text-purple-600 mr-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-purple-900 text-sm truncate block">
                          {selectedFormat.name}
                        </span>
                        <span className="text-[10px] text-purple-600">
                          {selectedFormat.dimensions?.width}×{selectedFormat.dimensions?.height} · {selectedFormat.category}
                        </span>
                      </div>
                    </div>

                    {/* Change Format Button */}
                    <button
                      onClick={handleChooseFormat}
                      className="w-10 h-10 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 flex items-center justify-center hover:scale-105 flex-shrink-0 border border-purple-200"
                      aria-label="Change format"
                    >
                      <Settings className="w-5 h-5" />
                    </button>

                    {/* Cancel Button */}
                    <button
                      onClick={handleCancelFormat}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center hover:scale-105 flex-shrink-0"
                      aria-label="Remove format"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Instruction text */}
                  <div className="text-center">
                    <div className="text-xs text-slate-500">
                      Now describe your chart in the chat panel →
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    onClick={handleChooseFormat}
                    disabled={isLoadingFormats}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-medium px-4 py-6 rounded-2xl hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <LayoutGrid className="w-5 h-5 mr-2" />
                    {isLoadingFormats ? 'Loading Formats...' : 'Choose a Format'}
                  </Button>

                  <div className="p-3 bg-purple-50/60 border border-purple-200/50 rounded-xl flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-purple-800 leading-relaxed">
                      Formats are visual layouts that turn your chart into a polished infographic with statistics, text, and styled backgrounds.
                    </p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Template Selection Modal */}
      <TemplateSelectionModal
        open={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  )
}

// Export the template text for use in other components
export { chartTemplate }