"use client"

import React from "react"
import { Check, Palette } from "lucide-react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PresetPreviewChart } from "./preset-preview-chart"
import type { ChartStylePreset } from "@/lib/chart-style-types"
import type { ExtendedChartData, ExtendedChartOptions } from "@/lib/chart-defaults"

interface PresetPreviewDialogProps {
  preset: ChartStylePreset | null
  onClose: () => void
  onApply: (preset: ChartStylePreset) => void
  hasChartData: boolean
  chartData?: ExtendedChartData
  chartConfig?: ExtendedChartOptions
  chartType?: string
}

export function PresetPreviewDialog({
  preset,
  onClose,
  onApply,
  hasChartData,
  chartData,
  chartConfig,
  chartType,
}: PresetPreviewDialogProps) {
  if (!preset) return null

  return (
    <Dialog open={!!preset} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-6 bg-slate-900 border border-slate-800 text-white rounded-xl shadow-2xl overflow-hidden flex flex-col md:flex-row gap-6 z-[60]">
        {/* Left Side: Large Chart Preview */}
        <div className="flex-1 flex flex-col gap-3 min-w-[280px]">
          <div className="flex-1 aspect-video md:aspect-[4/3] rounded-xl border border-slate-850 bg-black flex items-center justify-center overflow-hidden p-4 relative select-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.03)_1px,transparent_0)] bg-[length:16px_16px] pointer-events-none" />
            
            <PresetPreviewChart
              preset={preset}
              chartData={hasChartData ? chartData : undefined}
              chartConfig={hasChartData ? chartConfig : undefined}
              chartType={chartType}
            />
          </div>
          <div className="text-[11px] text-slate-500 text-center font-medium">
            {hasChartData ? "✨ Displaying preview with your actual chart data" : "💡 Displaying preview with responsive sample data"}
          </div>
        </div>

        {/* Right Side: Preset Details & Info */}
        <div className="w-full md:w-80 shrink-0 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Title & Badges */}
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {preset.chartType}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-semibold capitalize bg-violet-950/40 text-violet-300 border border-violet-800/40">
                  {preset.category}
                </span>
                {preset.isOfficial && (
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    Official
                  </span>
                )}
              </div>
              <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-violet-400 shrink-0" />
                {preset.name}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Preview of the {preset.name} style preset.
              </DialogDescription>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Description</span>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-950/40 border border-slate-850 p-2.5 rounded-lg">
                {preset.description || "No description provided for this style preset."}
              </p>
            </div>

            {/* Color Strategy */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Color Strategy</span>
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg space-y-2">
                <div className="text-[10px] text-slate-400 font-medium capitalize">
                  Mode: <span className="font-semibold text-slate-200">{preset.colorStrategy.mode}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {preset.colorStrategy.mode === 'single' ? (
                    <div
                      className="w-6 h-6 rounded-md shadow-sm border border-slate-800"
                      style={{ backgroundColor: preset.colorStrategy.singleColor || '#3b82f6' }}
                      title={preset.colorStrategy.singleColor || '#3b82f6'}
                    />
                  ) : (
                    (preset.colorStrategy.baseColors || []).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-md shadow-sm border border-slate-800"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {preset.tags && preset.tags.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Tags</span>
                <div className="flex flex-wrap gap-1">
                  {preset.tags.map(t => (
                    <span key={t} className="text-[10px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Apply Actions */}
          <div className="pt-6 mt-6 border-t border-slate-800/80 space-y-3">
            <Button
              onClick={() => onApply(preset)}
              disabled={!hasChartData}
              className={`w-full py-4 text-xs font-bold shadow-md select-none ${
                !hasChartData
                  ? 'bg-slate-850 hover:bg-slate-850 text-slate-500 cursor-not-allowed border-slate-750'
                  : 'bg-violet-600 hover:bg-violet-750 text-white border-transparent'
              }`}
            >
              <Check className="w-4 h-4 mr-2" />
              {hasChartData ? "Apply Style to Chart" : "Generate a Chart first to Apply"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full bg-transparent hover:bg-slate-800 border-slate-800 text-slate-450 hover:text-white"
            >
              Close Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
