"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Check, Palette, RotateCcw } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PresetPreviewChart } from "./preset-preview-chart"
import type { ChartStylePreset, PresetDimensions } from "@/lib/chart-style-types"
import type { ExtendedChartData, ExtendedChartOptions } from "@/lib/chart-defaults"
import {
  analyzePreset,
  STANDARD_ASPECT_RATIO_TARGETS,
  translatePresetToDimensions,
  type StandardAspectRatioKey,
} from "@/lib/preset-scaling-engine"

type TargetAspectMode = 'native' | 'current' | StandardAspectRatioKey

const RATIO_CHOICES: { key: StandardAspectRatioKey; boxClass: string }[] = [
  { key: '16:9', boxClass: 'w-3.5 h-2' },
  { key: '9:16', boxClass: 'w-2 h-3.5' },
  { key: '1:1', boxClass: 'w-2.5 h-2.5' },
  { key: '4:5', boxClass: 'w-2.5 h-3' },
  { key: '4:3', boxClass: 'w-3 h-2.5' },
  { key: '3:2', boxClass: 'w-3.5 h-2.5' },
]

interface PresetPreviewDialogProps {
  preset: ChartStylePreset | null
  onClose: () => void
  onApply: (preset: ChartStylePreset, targetDimensions?: PresetDimensions | null) => void
  hasChartData: boolean
  chartData?: ExtendedChartData
  chartConfig?: ExtendedChartOptions
  chartType?: string
  initialTargetRatio?: TargetAspectMode
}

export function PresetPreviewDialog({
  preset,
  onClose,
  onApply,
  hasChartData,
  chartData,
  chartConfig,
  chartType,
  initialTargetRatio = 'native',
}: PresetPreviewDialogProps) {
  const [targetMode, setTargetMode] = useState<TargetAspectMode>(initialTargetRatio)

  useEffect(() => {
    setTargetMode(initialTargetRatio)
  }, [preset?.id, initialTargetRatio])

  const hasCurrentChartDims = Boolean(
    hasChartData && chartConfig?.width && chartConfig?.height
  )

  const analysis = useMemo(
    () => (preset ? analyzePreset(preset) : null),
    [preset]
  )

  const translationResult = useMemo(() => {
    if (!preset || targetMode === 'native') return null

    const targetInput =
      targetMode === 'current'
        ? hasCurrentChartDims
          ? {
              width: String(chartConfig?.width),
              height: String(chartConfig?.height),
            }
          : null
        : targetMode

    if (!targetInput) return null

    return translatePresetToDimensions(preset, targetInput, {
      dataCount: chartData?.labels?.length || 8,
      fontScaleMode: 'normalized',
      activeScalesOverride: (chartConfig as any)?.scales,
    })
  }, [preset, targetMode, hasCurrentChartDims, chartConfig, chartData])

  if (!preset) return null

  const activePreset = translationResult ? translationResult.preset : preset
  const explicitTargetDimensions: PresetDimensions | null = translationResult
    ? translationResult.preset.dimensions ?? null
    : null

  const displayedWidth = translationResult
    ? translationResult.report.target.width
    : analysis?.source.width
  const displayedHeight = translationResult
    ? translationResult.report.target.height
    : analysis?.source.height
  const displayedRatio = translationResult
    ? translationResult.report.target.aspectLabel
    : analysis?.source.aspectLabel

  const isResized = targetMode !== 'native' && Boolean(translationResult)

  return (
    <Dialog open={!!preset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        overlayClassName="bg-slate-900/35 backdrop-blur-[2px]"
        className="max-w-4xl p-0 bg-white border border-gray-200 text-gray-900 rounded-2xl shadow-2xl overflow-hidden z-[60]"
      >
        <div className="flex flex-col md:flex-row w-full">
          {/* Left Side: Light Canvas Preview */}
          <div className="flex-1 bg-slate-50/70 p-5 md:p-6 flex flex-col gap-3 border-b md:border-b-0 md:border-r border-gray-100 min-w-[280px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {displayedWidth && displayedHeight && (
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                      isResized
                        ? 'bg-violet-50 text-violet-700 border-violet-200'
                        : 'bg-white text-gray-700 border-gray-200'
                    }`}
                  >
                    <span>{displayedWidth} × {displayedHeight}</span>
                    {displayedRatio && (
                      <span className="opacity-70">({displayedRatio})</span>
                    )}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-500 font-medium">
                {hasChartData ? "Using your chart data" : "Sample preview"}
              </span>
            </div>

            <div className="flex-1 min-h-[320px] md:min-h-[420px] rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden relative flex items-center justify-center">
              <PresetPreviewChart
                preset={activePreset}
                chartData={hasChartData ? chartData : undefined}
                chartConfig={hasChartData ? chartConfig : undefined}
                chartType={chartType}
              />
            </div>
          </div>

          {/* Right Side: Clean Preset Details & Aspect Ratio Controls */}
          <div className="w-full md:w-[340px] shrink-0 bg-white p-5 md:p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              {/* Title, Badges & Friendly Description */}
              <div className="pr-6">
                <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                    {preset.chartType}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold capitalize bg-violet-50 text-violet-700 border border-violet-100">
                    {preset.category}
                  </span>
                  {preset.isOfficial && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                      Official
                    </span>
                  )}
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Palette className="w-4 h-4 text-violet-600 shrink-0" />
                  {preset.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                  {preset.description || "Styled preset ready to apply to your chart."}
                </DialogDescription>
              </div>

              {/* Aspect Ratio Switcher */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-800">
                    Preview Aspect Ratio
                  </span>
                  {isResized && (
                    <button
                      type="button"
                      onClick={() => setTargetMode('native')}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 hover:text-violet-600 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTargetMode('native')}
                    className={`flex items-center justify-center gap-1 h-8 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      targetMode === 'native'
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Original
                  </button>

                  {hasCurrentChartDims && (
                    <button
                      type="button"
                      onClick={() => setTargetMode('current')}
                      className={`flex items-center justify-center gap-1 h-8 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        targetMode === 'current'
                          ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      Current
                    </button>
                  )}

                  {RATIO_CHOICES.map(({ key, boxClass }) => {
                    const selected = targetMode === key
                    const targetInfo = STANDARD_ASPECT_RATIO_TARGETS[key]
                    return (
                      <button
                        key={key}
                        type="button"
                        title={targetInfo.label}
                        onClick={() => setTargetMode(key)}
                        className={`flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <span
                          className={`inline-block rounded-[2px] border shrink-0 ${boxClass} ${
                            selected ? 'border-white/90 bg-white/25' : 'border-gray-400 bg-white'
                          }`}
                        />
                        {key}
                      </button>
                    )
                  })}
                </div>

                {translationResult && (
                  <div className="rounded-xl bg-violet-50/70 border border-violet-100 px-3 py-2 text-[11px] text-violet-900 flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {translationResult.report.source.width}×{translationResult.report.source.height} →{' '}
                      <strong className="text-violet-700">
                        {translationResult.report.target.width}×{translationResult.report.target.height}
                      </strong>
                    </span>
                    <span className="text-[10px] text-violet-700/90 font-medium">
                      Fonts & layout scaled
                    </span>
                  </div>
                )}
              </div>

              {/* Compact Colors Row */}
              <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 border border-gray-100 px-3 py-2.5">
                <div className="text-[11px] text-gray-500 font-medium capitalize">
                  Palette · <span className="text-gray-800 font-semibold">{preset.colorStrategy.mode}</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {preset.colorStrategy.mode === 'single' ? (
                    <div
                      className="w-5 h-5 rounded-md shadow-xs border border-black/10"
                      style={{ backgroundColor: preset.colorStrategy.singleColor || '#3b82f6' }}
                      title={preset.colorStrategy.singleColor || '#3b82f6'}
                    />
                  ) : (
                    (preset.colorStrategy.baseColors || []).slice(0, 6).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-5 h-5 rounded-md shadow-xs border border-black/10"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Subtle Tags */}
              {preset.tags && preset.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {preset.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full font-medium">
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Apply Actions */}
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Button
                onClick={() => onApply(preset, explicitTargetDimensions)}
                disabled={!hasChartData}
                className={`w-full h-10 rounded-xl text-xs font-semibold shadow-sm select-none ${
                  !hasChartData
                    ? 'bg-gray-100 hover:bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    : 'bg-violet-600 hover:bg-violet-700 text-white border-transparent'
                }`}
              >
                <Check className="w-4 h-4 mr-1.5" />
                {hasChartData
                  ? isResized && targetMode !== 'current'
                    ? `Apply in ${targetMode} to Chart`
                    : "Apply Style to Chart"
                  : "Generate a Chart first to Apply"}
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                className="w-full h-9 rounded-xl bg-white hover:bg-gray-50 border-gray-200 text-gray-600 hover:text-gray-900 text-xs font-medium"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
