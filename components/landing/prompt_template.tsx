"use client"

import React, { useState } from "react"
import { BarChart2, Bot, Brain, Forward, FileText, Layout, X } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { TemplateSelectionModal } from "./template-selection-modal"
import { useTemplateStore } from "@/lib/template-store"

const chartTemplate = "Create a bar chart comparing the top 5 countries by smartphone usage in 2025. Include country names on the x-axis and number of users on the y-axis."

interface PromptTemplateProps {
  onSampleClick?: (template: string) => void
  className?: string
  size?: 'default' | 'compact' | 'large'
}

export function PromptTemplate({ 
  onSampleClick, 
  className = "", 
  size = 'default' 
}: PromptTemplateProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
  const { currentTemplate, setCurrentTemplate, templates, applyTemplate, generateMode, setGenerateMode, setEditorMode } = useTemplateStore()
  
  const handleSampleClick = () => {
    if (onSampleClick) {
      onSampleClick(chartTemplate)
    }
  }

  const handleChooseTemplates = () => {
    setIsTemplateModalOpen(true)
  }

  const handleCancelTemplate = () => {
    setCurrentTemplate(null)
  }

  const handleStandardTemplate = () => {
    // Apply the first template (Standard Report)
    if (templates.length > 0) {
      applyTemplate(templates[0].id)
    }
  }

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
      <div className={`flex flex-col items-center justify-center w-full ${styles.container} bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20`}>
        <div className="flex flex-col items-center justify-center mb-6">
          {/* <div className={`inline-flex items-center justify-center ${styles.icon} bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-xl mb-4`}>
              <BarChart2 className={`${styles.iconInner} text-white`} />
          </div> */}
          <div className={`${styles.title} inline-flex items-center font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-3 text-center`}>
              <span className="text-sm inline text-slate-500 mr-3"><Bot /></span>
              <h2>Create Your Chart with AI Prompt</h2>
            </div>
          <p className={`text-slate-600 text-center max-w-md mx-auto leading-relaxed ${styles.description}`}>
            Describe the chart you want to create in natural language. I'll generate it for you and you can ask me to modify it further!
          </p>
        </div>
        
        <div className="space-y-3 w-full">
          {/* Generate Toggle Button */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-700">Generate As</label>
            <ToggleGroup 
              type="single" 
              value={generateMode} 
              onValueChange={(value) => {
                if (value) {
                  const mode = value as 'chart' | 'template'
                  setGenerateMode(mode)
                  // Also update editorMode so template data gets saved correctly
                  setEditorMode(mode)
                }
              }}
              className="w-full bg-gray-50 rounded-lg p-1 border border-gray-200"
            >
              <ToggleGroupItem 
                value="chart" 
                aria-label="Chart"
                className="flex-1 data-[state=on]:bg-indigo-500 data-[state=on]:text-white data-[state=on]:shadow-sm"
              >
                <BarChart2 className="w-4 h-4 mr-2" />
                Chart
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="template" 
                aria-label="Template"
                className="flex-1 data-[state=on]:bg-indigo-500 data-[state=on]:text-white data-[state=on]:shadow-sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Template
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Conditional Content Based on Generate Mode */}
          {generateMode === 'chart' ? (
            <>
          <button
            onClick={handleSampleClick}
            className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-slate-800 font-medium px-4 py-3 rounded-xl border border-indigo-200/50 transition-all duration-200 text-left hover:shadow-lg group text-sm"
          >
            <div className="font-semibold flex items-center gap-2 mb-1">
              <div className="p-1 bg-indigo-100 rounded group-hover:bg-indigo-200 transition-colors">
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
          ) : (
            <>
              {currentTemplate ? (
                <>
                  {/* Status Indicator */}
                  <div className="text-xs text-slate-600 mb-2">
                    Status: <span className="font-semibold text-green-600">Attached Template</span>
                  </div>
                  
                  {/* Template Name with Cancel Button */}
                  <div className="flex items-center gap-2 w-full">
                    <div className="flex-1 bg-green-50 border-2 border-green-500 rounded-lg px-4 py-3 flex items-center">
                      <Layout className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      <span className="font-semibold text-green-900 text-sm truncate">
                        {currentTemplate.name}
                      </span>
                    </div>
                    <button
                      onClick={handleCancelTemplate}
                      className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 flex items-center justify-center transition-all duration-200 hover:scale-105 flex-shrink-0"
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
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium px-4 py-3 rounded-xl transition-all duration-200 hover:shadow-lg"
                  >
                    <Layout className="w-4 h-4 mr-2" />
                    Standard Template
                  </Button>
                  
                  <div className="text-center">
                    <div className="text-xs text-slate-500">or</div>
                  </div>
                  
                  <Button
                    variant="outline"
                    onClick={handleChooseTemplates}
                    className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 font-medium px-4 py-3 rounded-xl transition-all duration-200"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Choose From Templates
                  </Button>
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