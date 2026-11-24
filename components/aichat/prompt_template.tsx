"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart2, LayoutGrid, Sparkles, Check, X, ArrowRight, Ruler } from "lucide-react"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStore } from "@/lib/chart-store"

const chartTemplate = "Create a bar chart comparing the top 5 countries by smartphone usage. Include country names on the x-axis and number of users on the y-axis."

interface PromptTemplateProps {
  onSampleClick?: (template: string) => void
  className?: string
  size?: 'default' | 'compact' | 'large'
  isTemplateModalOpen?: boolean
  setIsTemplateModalOpen?: (open: boolean) => void
}

const FAMOUS_ASPECT_RATIOS = [
  { value: "16:9", title: "16:9", tag: "Landscape", sub: "Presentations & Desktop", width: 1920, height: 1080, wPx: 30, hPx: 17 },
  { value: "9:16", title: "9:16", tag: "Portrait", sub: "Reels, Stories & Shorts", width: 1080, height: 1920, wPx: 17, hPx: 30 },
  { value: "1:1", title: "1:1", tag: "Square", sub: "Social Posts & Grids", width: 1080, height: 1080, wPx: 24, hPx: 24 },
  { value: "4:5", title: "4:5", tag: "Classic", sub: "Portrait Feed & Pins", width: 1080, height: 1350, wPx: 21, hPx: 26 },
  { value: "4:3", title: "4:3", tag: "Traditional", sub: "Reports & PDF Slides", width: 1440, height: 1080, wPx: 28, hPx: 21 },
  { value: "3:2", title: "3:2", tag: "Print", sub: "Standard Print & Deck", width: 1620, height: 1080, wPx: 28, hPx: 19 },
]

const parseDimension = (val: any): number => {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    return parseInt(val.replace('px', ''), 10) || 0
  }
  return 0
}

export function PromptTemplate({
  onSampleClick: _onSampleClick,
  className = "",
  size = 'default',
}: PromptTemplateProps) {
  const [selectedRatio, setSelectedRatio] = useState<string | null>(null)

  const {
    generateMode,
    setGenerateMode,
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
    selectedFormatId,
    isLoadingFormats,
    clearSelection: clearFormatSelection,
    openGallery,
    filters,
    setFilters,
    loadFormats,
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
    if (generateMode === 'format') {
      loadFormats()
    }
  }, [generateMode, loadFormats])

  const handleChooseFormat = () => {
    openGallery()
  }

  const handleCancelFormat = () => {
    clearFormatSelection()
  }

  const selectedFormat = selectedFormatId ? formats.find(f => f.id === selectedFormatId) : null
  const selectedPreset = selectedRatio ? FAMOUS_ASPECT_RATIOS.find(r => r.value === selectedRatio) : null
  const isCompact = size === 'compact'

  // Clean parent padding to avoid double margins from wrappers
  const cleanedClassName = className
    .split(' ')
    .filter(c => !c.startsWith('p-') && !c.includes(':p-'))
    .join(' ')

  return (
    <div
      className={`overflow-y-auto h-full w-full flex justify-center ${
        isCompact ? "px-3 py-4" : "px-4 sm:px-6 py-6"
      } ${cleanedClassName} scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 scrollbar-track-transparent antialiased`}
    >
      <div
        className={`w-full ${
          isCompact ? "max-w-md space-y-4" : "max-w-2xl space-y-5"
        } my-auto mx-auto`}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
            <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
            <span>AI Chart Studio</span>
          </div>

          <h2
            className={`${
              isCompact ? "text-lg" : "text-xl sm:text-2xl"
            } font-bold tracking-tight text-slate-900 dark:text-white`}
          >
            Create Your Chart with{" "}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
              AI Prompts
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mt-1.5">
            Describe what you want to visualize in the chat panel—choose an output mode and canvas ratio below.
          </p>
        </div>

        {/* Section 1: Output Mode (Chart vs Template) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Output Mode
            </span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {generateMode === 'chart' ? '1 credit / generation' : '2 credits / template'}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-label="Output Mode"
            className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/70 dark:border-slate-700/60 gap-1"
          >
            <button
              type="button"
              role="radio"
              aria-checked={generateMode === 'chart'}
              onClick={() => setGenerateMode('chart')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                generateMode === 'chart'
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Standard Chart</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                  generateMode === 'chart'
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300"
                    : "bg-slate-200/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400"
                }`}
              >
                1 cr
              </span>
            </button>

            <button
              type="button"
              role="radio"
              aria-checked={generateMode === 'format'}
              onClick={() => setGenerateMode('format')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer ${
                generateMode === 'format'
                  ? "bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Infographic Template</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                  generateMode === 'format'
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300"
                    : "bg-slate-200/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400"
                }`}
              >
                2 cr
              </span>
            </button>
          </div>
        </div>

        {/* Conditional Template Blueprint Bar */}
        {generateMode === 'format' && (
          selectedFormat ? (
            <div className="rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/40 dark:bg-indigo-950/30 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/70 flex items-center justify-center shrink-0 shadow-sm">
                  <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {selectedFormat.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {selectedFormat.dimensions?.width} × {selectedFormat.dimensions?.height} px · {selectedFormat.category}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleChooseFormat}
                  className="h-8 px-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 text-xs font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleCancelFormat}
                  className="h-8 w-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 text-slate-500 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Remove template"
                  title="Remove template"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Template Blueprint
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
                    Optional
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Let AI pick a layout automatically, or browse pre-designed templates.
                </p>
              </div>

              <button
                type="button"
                onClick={handleChooseFormat}
                disabled={isLoadingFormats}
                className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-sm"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>
                  {isLoadingFormats
                    ? "Loading..."
                    : selectedRatio
                    ? `Browse ${selectedRatio} Templates`
                    : "Browse Templates"}
                </span>
              </button>
            </div>
          )
        )}

        {/* Section 2: Canvas Aspect Ratio */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Aspect Ratio
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {selectedPreset ? `${selectedPreset.width}×${selectedPreset.height}` : "Auto-fit"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleRatioSelect(null)}
              className={
                selectedRatio === null
                  ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-sm cursor-pointer"
                  : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:text-indigo-600 transition-colors cursor-pointer"
              }
            >
              {selectedRatio === null ? (
                <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <span className="w-2 h-2 rounded-full border border-slate-400" />
              )}
              <span>All Ratios (Auto)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {FAMOUS_ASPECT_RATIOS.map((opt) => {
              const isSelected = selectedRatio === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleRatioSelect(isSelected ? null : opt)}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-150 group cursor-pointer ${
                    isSelected
                      ? "border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-2 ring-indigo-500/15 shadow-sm"
                      : "border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm"
                  }`}
                >
                  {/* Proportional mini chart canvas preview */}
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                    <div
                      className={`rounded-[3px] border-[1.5px] flex items-end justify-center gap-[2px] p-[2px] transition-colors ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 group-hover:border-indigo-400"
                      }`}
                      style={{ width: `${opt.wPx}px`, height: `${opt.hPx}px` }}
                    >
                      <span
                        className={`w-[2.5px] rounded-[1px] h-[45%] transition-colors ${
                          isSelected
                            ? "bg-indigo-500/80"
                            : "bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-400/80"
                        }`}
                      />
                      <span
                        className={`w-[2.5px] rounded-[1px] h-[75%] transition-colors ${
                          isSelected
                            ? "bg-indigo-600"
                            : "bg-slate-400 dark:bg-slate-500 group-hover:bg-indigo-500"
                        }`}
                      />
                      <span
                        className={`w-[2.5px] rounded-[1px] h-[55%] transition-colors ${
                          isSelected
                            ? "bg-indigo-500/80"
                            : "bg-slate-300 dark:bg-slate-600 group-hover:bg-indigo-400/80"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-bold tracking-tight ${
                          isSelected
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-slate-800 dark:text-slate-100"
                        }`}
                      >
                        {opt.title}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        {opt.tag}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {opt.sub}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer Callout Bar */}
        <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Ruler className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Need custom pixel dimensions or manual data tables?
            </span>
          </div>

          <Link
            href="/editor"
            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 whitespace-nowrap transition-colors shrink-0"
          >
            <span>Open Advanced Editor</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export { chartTemplate }
