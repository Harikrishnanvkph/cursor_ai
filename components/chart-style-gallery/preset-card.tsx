"use client"

import React, { useMemo } from "react"
import type { ChartStylePreset } from "@/lib/chart-style-types"
import { Check } from "lucide-react"
import { PresetPreviewChart } from "./preset-preview-chart"

// Chart type → icon emoji (lightweight, no extra deps)
const CHART_TYPE_ICONS: Record<string, string> = {
  bar: '📊', line: '📈', pie: '🥧', doughnut: '🍩',
  radar: '🕸️', polarArea: '🎯', horizontalBar: '📊',
  bar3d: '📊', pie3d: '🥧', doughnut3d: '🍩',
  horizontalBar3d: '📊', stackedBar: '📊', area: '📈',
  scatter: '⚬', bubble: '🫧',
}

// Category → badge color
const CATEGORY_COLORS: Record<string, string> = {
  minimal: 'bg-gray-100 text-gray-600',
  bold: 'bg-orange-100 text-orange-700',
  pastel: 'bg-pink-100 text-pink-600',
  dark: 'bg-gray-800 text-gray-100',
  professional: 'bg-blue-100 text-blue-700',
  '3d': 'bg-purple-100 text-purple-700',
  gradient: 'bg-indigo-100 text-indigo-700',
  earthy: 'bg-amber-100 text-amber-700',
}

interface PresetCardProps {
  preset: ChartStylePreset
  isSelected: boolean
  hasChartData: boolean
  onApply: () => void
}

export function PresetCard({ preset, isSelected, hasChartData, onApply }: PresetCardProps) {
  const chartIcon = CHART_TYPE_ICONS[preset.chartType] || '📊'
  const categoryColor = CATEGORY_COLORS[preset.category] || 'bg-gray-100 text-gray-600'

  return (
    <button
      onClick={onApply}
      disabled={!hasChartData}
      className={`
        group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-200
        ${isSelected
          ? 'border-violet-400 ring-2 ring-violet-200 shadow-md'
          : 'border-gray-200 hover:border-violet-300 hover:shadow-md'
        }
        ${!hasChartData ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {/* Live Chart.js Mini Preview */}
      <div className="relative h-20 w-full overflow-hidden">
        <PresetPreviewChart preset={preset} />

        {/* Selected check */}
        {isSelected && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center shadow-sm z-10">
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </div>
        )}

        {/* 3D badge */}
        {preset.chartType.includes('3d') && (
          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/50 backdrop-blur-sm rounded text-[9px] text-white font-bold z-10">
            3D
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2.5 py-2 bg-white">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs">{chartIcon}</span>
          <h4 className="text-[11px] font-semibold text-gray-900 truncate leading-tight flex-1">
            {preset.name}
          </h4>
        </div>

        {/* Category badge + color mode */}
        <div className="flex items-center gap-1.5">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${categoryColor}`}>
            {preset.category}
          </span>
          <span className="text-[9px] text-gray-400 font-medium">
            {preset.colorStrategy.mode === 'single' ? 'Uniform' : 'Multi'}
          </span>
        </div>
      </div>
    </button>
  )
}
