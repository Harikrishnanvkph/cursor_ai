"use client"

import React, { useState, useEffect } from "react"
import { BarChart2, Bot, Forward, FileText, Layout, X, Settings, Info, LayoutGrid } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Button } from "@/components/ui/button"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStore } from "@/lib/chart-store"
import { dataService } from "@/lib/data-service"

const chartTemplate = "Create a bar chart comparing the top 5 countries by smartphone usage in 2025. Include country names on the x-axis and number of users on the y-axis."

interface PromptTemplateProps {
  onSampleClick?: (template: string) => void
  className?: string
  size?: 'default' | 'compact' | 'large'
  isTemplateModalOpen?: boolean
  setIsTemplateModalOpen?: (open: boolean) => void
}

// Enlarged preview measurements to make drawings look bold and clear with slightly taller aspect shapes
const FAMOUS_ASPECT_RATIOS = [
  { value: "16:9", label: "16:9 Landscape", sub: "Presentations & Desktop Screens", width: 1920, height: 1080, widthVal: "60px", heightVal: "33.75px" },
  { value: "9:16", label: "9:16 Portrait", sub: "Mobile Stories, Reels & Shorts", width: 1080, height: 1920, widthVal: "33.75px", heightVal: "60px" },
  { value: "1:1", label: "1:1 Square", sub: "Social Posts & Grid Layouts", width: 1080, height: 1080, widthVal: "48px", heightVal: "48px" },
  { value: "4:5", label: "4:5 Classic", sub: "Instagram Portrait & Pins", width: 1080, height: 1350, widthVal: "44px", heightVal: "55px" },
  { value: "4:3", label: "4:3 Traditional", sub: "Retro Monitors & PDF Reports", width: 1440, height: 1080, widthVal: "56px", heightVal: "42px" },
  { value: "3:2", label: "3:2 Photographic", sub: "Standard Print & Photo Portfolios", width: 1620, height: 1080, widthVal: "56px", heightVal: "37.3px" }
]

const parseDimension = (val: any): number => {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    return parseInt(val.replace('px', '')) || 0
  }
  return 0
}

export function PromptTemplate({
  onSampleClick,
  className = "",
  size = 'default',
  isTemplateModalOpen: isTemplateModalOpenProp,
  setIsTemplateModalOpen: setIsTemplateModalOpenProp
}: PromptTemplateProps) {
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null)
  
  const {
    generateMode,
    setGenerateMode,
    setEditorMode,
  } = useTemplateStore()

  // Auto-migrate legacy 'template' mode to 'format'
  useEffect(() => {
    if (generateMode === 'template') {
      setGenerateMode('format')
    }
  }, [generateMode, setGenerateMode])

  // Format gallery store for format mode
  const {
    formats,
    setFormats,
    selectedFormatId,
    isLoadingFormats,
    setLoadingFormats,
    setSelectedFormat,
    clearSelection: clearFormatSelection,
    openGallery,
    filters,
    setFilters,
  } = useFormatGalleryStore()

  // Sync selected ratio with the stores
  useEffect(() => {
    if (generateMode === 'format') {
      setSelectedRatio(filters.dimension || null)
    } else if (generateMode === 'chart') {
      const config = useChartStore.getState().chartConfig
      if (config.responsive && !config.manualDimensions) {
        setSelectedRatio(null)
      } else {
        const w = parseDimension(config.width)
        const h = parseDimension(config.height)
        const match = FAMOUS_ASPECT_RATIOS.find(r => r.width === w && r.height === h)
        if (match) {
          setSelectedRatio(match.value)
        } else {
          setSelectedRatio(null)
        }
      }
    }
  }, [generateMode, filters.dimension])

  // Handle aspect ratio selection
  const handleRatioSelect = (opt: typeof FAMOUS_ASPECT_RATIOS[number] | null) => {
    if (opt === null) {
      setSelectedRatio(null)
      setFilters({ dimension: undefined })
      if (generateMode === 'chart') {
        useChartStore.getState().initializeChartDimensions(1080, 1080, true)
      }
    } else {
      setSelectedRatio(opt.value)
      setFilters({ dimension: opt.value })
      if (generateMode === 'chart') {
        useChartStore.getState().initializeChartDimensions(opt.width, opt.height, false)
      }
    }
  }

  // Load formats on format mode selection
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

  const handleChooseFormat = () => {
    openGallery()
  }

  const handleCancelFormat = () => {
    clearFormatSelection()
  }

  // Get the selected format name
  const selectedFormat = selectedFormatId ? formats.find(f => f.id === selectedFormatId) : null

  // Size variants - highly optimized to reduce padding and margins vertically
  const sizeClasses = {
    compact: {
      container: "max-w-lg",
      title: "text-lg md:text-xl",
      description: "text-xs",
      padding: "p-2"
    },
    default: {
      container: "max-w-4xl",
      title: "text-2xl md:text-3xl",
      description: "text-sm",
      padding: "p-3 md:p-4"
    },
    large: {
      container: "max-w-5xl",
      title: "text-2xl md:text-3xl",
      description: "text-sm md:text-base",
      padding: "p-4 md:p-5"
    }
  }

  const styles = sizeClasses[size]

  // Clean parent padding to prevent massive external margins (e.g. p-12) from pushing layout down
  const cleanedClassName = className
    .split(' ')
    .filter(c => !c.startsWith('p-') && !c.includes(':p-'))
    .join(' ')

  return (
    <div className={`overflow-y-auto h-full w-full flex justify-center py-6 md:py-8 ${styles.padding} ${cleanedClassName} scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent antialiased`}>
      {/* Background card removed: container is fully transparent border-free, lets items float natively */}
      <div className={`relative flex flex-col w-full ${styles.container} bg-transparent border-none h-fit my-auto p-2 md:p-3`}>

        {/* Header Block - Compacted padding and margins, eye-friendly weights */}
        <div className="relative flex flex-col items-center justify-center mb-4 w-full pt-1.5 text-center">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-slate-100/60 border border-slate-200/50 rounded-full mb-2 shadow-inner-sm">
            <span className="p-0.5 bg-white rounded-md shadow-sm border border-slate-200">
              <Bot className="w-3.5 h-3.5 text-slate-600" />
            </span>
            <span className="text-[9px] font-bold text-slate-500 tracking-wider uppercase px-0.5">AI Copilot</span>
          </div>

          <h2 className={`${styles.title} font-semibold text-slate-800 tracking-tight mb-1.5 max-w-2xl`}>
            Create Your Chart with <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">AI Prompt</span>
          </h2>
          
          <p className="text-slate-500 max-w-xl mx-auto leading-relaxed text-xs md:text-sm font-normal">
            Describe the chart you want to create in natural language. I'll generate it and you can refine it further in chat!
          </p>
        </div>

        <div className="relative space-y-5 w-full pb-4">
          {/* Segmented Control - Sleek Apple segmented pill bounded to max-w-xs */}
          <div className="flex flex-col gap-1.5 max-w-xs w-full mx-auto">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-center">
              Generate As
            </label>
            <ToggleGroup
              type="single"
              value={generateMode}
              onValueChange={(value) => {
                if (value) {
                  const mode = value as 'chart' | 'format'
                  setGenerateMode(mode)
                  setEditorMode(mode === 'chart' ? 'chart' : 'template')
                }
              }}
              className="w-full bg-slate-100 border border-slate-200 shadow-inner gap-1"
            >
              <ToggleGroupItem
                value="chart"
                aria-label="Chart"
                className="flex-1 rounded-xl py-3 data-[state=on]:bg-white data-[state=on]:text-slate-800 data-[state=on]:shadow-[0_2px_6px_rgba(0,0,0,0.04)] data-[state=on]:border data-[state=on]:border-slate-200/20 transition-all duration-200 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wide uppercase"
              >
                <BarChart2 className="w-3.5 h-3.5 mr-2" />
                Chart
              </ToggleGroupItem>
              <ToggleGroupItem
                value="format"
                aria-label="Format"
                className="flex-1 rounded-xl py-3 data-[state=on]:bg-white data-[state=on]:text-slate-800 data-[state=on]:shadow-[0_2px_6px_rgba(0,0,0,0.04)] data-[state=on]:border data-[state=on]:border-slate-200/20 transition-all duration-200 text-slate-500 hover:text-slate-800 font-semibold text-xs tracking-wide uppercase"
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-2" />
                Format
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
 
          {/* Aspect Ratio Selector Section - Separated beautifully from Segmented Control using mt-7 */}
          <div className="flex flex-col gap-2.5 w-full mt-7">
            <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider pl-1">
              Select Aspect Ratio
            </label>
            
            {/* Show All Aspect Ratio Option (Checkbox UI, high-contrast border and custom checkbox SVG) */}
            <div className="flex justify-center w-full mb-1.5">
              <button
                onClick={() => handleRatioSelect(null)}
                className="flex items-center gap-3 px-4 py-2 text-slate-700 hover:text-indigo-600 transition-all group cursor-pointer"
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  selectedRatio === null
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-md scale-105"
                    : "border-slate-400 bg-white group-hover:border-indigo-500 group-hover:scale-105 shadow-sm"
                }`}>
                  {selectedRatio === null ? (
                    <svg className="w-3.5 h-3.5 stroke-[3.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-slate-700 select-none tracking-tight group-hover:text-indigo-600 transition-colors">
                  Generate for All Aspect Ratios
                </span>
              </button>
            </div>
 
            {/* Grid of famous aspect ratio boxes - Spacious grid floating natively */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full items-stretch">
              {FAMOUS_ASPECT_RATIOS.map((opt) => {
                const isSelected = selectedRatio === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleRatioSelect(opt)}
                    className={`flex items-center gap-6 p-3.5 rounded-2xl border text-left transition-all duration-200 h-[92px] group relative ${
                      isSelected
                        ? "border-2 border-indigo-500 ring-4 ring-indigo-500/5 bg-indigo-50/20 text-slate-800 shadow-[0_4px_16px_rgba(99,102,241,0.06)]"
                        : "border border-slate-200 bg-white/90 hover:border-slate-300 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:-translate-y-0.5"
                    }`}
                  >
                    {/* Visual aspect proportion container (Plain style, no grid, taller h-[76px]) */}
                    <div 
                      className="w-[72px] h-[76px] flex-shrink-0 flex items-center justify-center bg-transparent border-none overflow-hidden relative"
                    >
                      <div 
                        className={`rounded-[3px] border-2 transition-all duration-300 shadow-xs ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-500/15 scale-105 shadow-sm"
                            : "border-slate-300/80 bg-slate-100/90 group-hover:border-indigo-300 group-hover:bg-indigo-50/80"
                        }`}
                        style={{ width: opt.widthVal, height: opt.heightVal }}
                      ></div>
                    </div>
 
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="font-semibold text-sm text-slate-800 group-hover:text-slate-900 transition-colors flex items-center gap-1.5">
                        {opt.label}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-normal leading-relaxed line-clamp-2 mt-0.5 group-hover:text-slate-500 transition-colors">
                        {opt.sub}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Conditional Content Based on Generate Mode */}
          {generateMode === 'chart' ? (
            <div className="space-y-4 pt-0.5">
              {selectedRatio && (
                <div className="text-xs font-semibold text-slate-700 bg-white/80 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse flex-shrink-0"></div>
                  <div>
                    Chart will generate in <span className="font-semibold text-slate-900">{selectedRatio}</span> dimensions ({FAMOUS_ASPECT_RATIOS.find(r => r.value === selectedRatio)?.width} × {FAMOUS_ASPECT_RATIOS.find(r => r.value === selectedRatio)?.height} px).
                  </div>
                </div>
              )}
                            {/* Premium light prompt showcase container floating natively */}
              <div className="w-full bg-white/90 rounded-2xl border border-slate-200 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)] transition-all duration-200">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    Sample AI Prompt Request
                  </span>
                  <button
                    onClick={handleSampleClick}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline transition-all"
                  >
                    <span>Apply Prompt</span>
                    <Forward className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="bg-indigo-50/30 text-indigo-950 rounded-xl p-4 font-mono text-[11px] leading-relaxed shadow-inner border border-indigo-100/50 relative overflow-hidden select-all group">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/[0.01] to-transparent pointer-events-none"></div>
                  <span className="text-indigo-500 select-none mr-2 font-bold">$</span>
                  {chartTemplate}
                </div>
              </div>

              <div className="text-center">
                <div className="text-xs text-slate-400 font-semibold tracking-wide">
                  Or type your own request in the chat panel input text box
                </div>
              </div>
            </div>
          ) : (
            /* Format Mode */
            <div className="space-y-4 pt-0.5">
              {selectedFormat ? (
                <div className="space-y-3.5">
                  {/* Status Indicator */}
                  <div className="text-xs text-slate-400 font-bold pl-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping"></span>
                    Status: <span className="font-semibold text-slate-700">Attached Format Layout</span>
                  </div>

                  {/* Format Name with Settings and Cancel Buttons */}
                  <div className="flex items-center gap-3 w-full bg-white/90 border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex-1 bg-slate-50/30 border border-slate-100 rounded-xl px-5 py-3 flex items-center">
                      <LayoutGrid className="w-4 h-4 text-slate-500 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-800 text-xs truncate block">
                          {selectedFormat.name}
                        </span>
                        <span className="text-[10px] font-normal text-slate-400 block mt-0.5">
                          {selectedFormat.dimensions?.width} × {selectedFormat.dimensions?.height} px · {selectedFormat.category}
                        </span>
                      </div>
                    </div>

                    {/* Change Format Button */}
                    <button
                      onClick={handleChooseFormat}
                      className="w-11 h-11 rounded-xl bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center hover:scale-105 flex-shrink-0 border border-slate-200 transition-all shadow-sm"
                      aria-label="Change format"
                    >
                      <Settings className="w-4 h-4" />
                    </button>

                    {/* Cancel Button */}
                    <button
                      onClick={handleCancelFormat}
                      className="w-11 h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center hover:scale-105 flex-shrink-0 transition-all shadow-sm"
                      aria-label="Remove format"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Instruction text */}
                  <div className="text-center">
                    <div className="text-xs text-slate-400 font-semibold tracking-wide">
                      Now describe your chart in the chat panel input text box
                    </div>
                  </div>
                </div>
              ) : (
                /* Format Pick Area - Wide layout to prevent squeezing and vertical bloat */
                <div className="flex flex-col gap-4 max-w-2xl w-full mx-auto px-4 md:px-0">
                  {/* Descriptive Title card with standard typography matching the aspect ratio theme */}
                  <div className="bg-white border border-slate-200/80 rounded-[24px] px-8 py-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
                    <div className="font-semibold text-sm text-slate-800 mb-1.5 tracking-tight">
                      <span className="text-indigo-600 font-bold mr-1">Optional</span> Format Selection
                    </div>
                    <div className="text-xs text-slate-500 leading-relaxed font-normal px-4">
                      Choose a pre-designed template to customize the AI-generated response and gain full control over the design.
                    </div>
                  </div>

                  <Button
                    onClick={handleChooseFormat}
                    disabled={isLoadingFormats}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-full transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg flex items-center justify-center border-none text-xs md:text-sm uppercase tracking-widest"
                  >
                    <LayoutGrid className="w-4 h-4 mr-2.5" />
                    {isLoadingFormats ? 'Loading layouts...' : (selectedRatio ? `Browse ${selectedRatio} Formats` : 'Choose a Format Layout')}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Advanced Editor Callout Card - Standardized with the section theme font sizes */}
          <div className="bg-white/80 rounded-2xl p-5 border border-dashed border-slate-200 flex items-start gap-3.5 mt-2 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
            <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/50 flex-shrink-0 text-slate-700 shadow-sm">
              <Info className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-slate-800 leading-normal">
                Need custom dimensions or exact layouts?
              </div>
              <div className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">
                Use the <span className="font-semibold text-indigo-600 hover:underline cursor-pointer">Advanced Editor</span> in the workspace toolbar after your chart generates to input custom width/height values and configure exact layout spacing.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { chartTemplate }