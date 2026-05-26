"use client"

import React, { useMemo, useRef, useState, useEffect } from "react"
import type { ChartStylePreset } from "@/lib/chart-style-types"
import type { ExtendedChartData, ExtendedChartOptions } from "@/lib/chart-defaults"
import { Check, BarChart3, TrendingUp, PieChart, CircleDot, Radar, Target, BarChartHorizontal, Box, AreaChart, ScatterChart, Circle, Eye, Palette, Loader2 } from "lucide-react"
import { PresetPreviewChart } from "./preset-preview-chart"

// Chart type → Lucide icon component
const CHART_TYPE_ICONS: Record<string, React.ReactNode> = {
  bar: <BarChart3 className="w-3.5 h-3.5" />,
  line: <TrendingUp className="w-3.5 h-3.5" />,
  pie: <PieChart className="w-3.5 h-3.5" />,
  doughnut: <CircleDot className="w-3.5 h-3.5" />,
  radar: <Radar className="w-3.5 h-3.5" />,
  polarArea: <Target className="w-3.5 h-3.5" />,
  horizontalBar: <BarChartHorizontal className="w-3.5 h-3.5" />,
  bar3d: <Box className="w-3.5 h-3.5" />,
  pie3d: <Box className="w-3.5 h-3.5" />,
  doughnut3d: <Box className="w-3.5 h-3.5" />,
  horizontalBar3d: <Box className="w-3.5 h-3.5" />,
  stackedBar: <BarChart3 className="w-3.5 h-3.5" />,
  area: <AreaChart className="w-3.5 h-3.5" />,
  scatter: <ScatterChart className="w-3.5 h-3.5" />,
  bubble: <Circle className="w-3.5 h-3.5" />,
}

// Chart type → human-readable display name
const CHART_TYPE_NAMES: Record<string, string> = {
  bar: 'Bar', line: 'Line', pie: 'Pie', doughnut: 'Doughnut',
  radar: 'Radar', polarArea: 'Polar Area', horizontalBar: 'H-Bar',
  bar3d: '3D Bar', pie3d: '3D Pie', doughnut3d: '3D Doughnut',
  horizontalBar3d: '3D H-Bar', stackedBar: 'Stacked Bar',
  area: 'Area', scatter: 'Scatter', bubble: 'Bubble',
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
  onPreview?: () => void
  /** Real chart data to render in preview */
  chartData?: ExtendedChartData
  /** Real chart config */
  chartConfig?: ExtendedChartOptions
  /** Current chart type */
  chartType?: string
  /** Chart aspect ratio (width/height). Default 4/3 */
  chartAspectRatio?: number
}

export function PresetCard({
  preset,
  isSelected,
  hasChartData,
  onApply,
  onPreview,
  chartData,
  chartConfig,
  chartType,
  chartAspectRatio,
}: PresetCardProps) {
  const chartIcon = CHART_TYPE_ICONS[preset.chartType] || <BarChart3 className="w-3.5 h-3.5" />
  const categoryColor = CATEGORY_COLORS[preset.category] || 'bg-gray-100 text-gray-600'

  const handleCardClick = () => {
    if (onPreview) {
      onPreview()
    } else {
      onApply()
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className={`
        group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-300 bg-white shadow-sm hover:shadow-md cursor-pointer
        ${isSelected
          ? 'border-violet-400 ring-2 ring-violet-200'
          : 'border-gray-200 hover:border-violet-300'
        }
      `}
    >
      {/* Real-data Chart Preview — rendered at full size and scaled down like board tiles */}
      <div
        className="relative w-full overflow-hidden bg-white"
        style={{ aspectRatio: '16/10' }}
      >
        <PresetPreviewChart
          preset={preset}
          chartData={chartData}
          chartConfig={chartConfig}
          chartType={chartType}
        />

        {/* Selected check */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center shadow-md z-15">
            <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
          </div>
        )}

        {/* 3D badge */}
        {preset.chartType.includes('3d') && (
          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm rounded-md text-[10px] text-white font-bold z-10">
            3D
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 flex items-center justify-center gap-2 p-4">
          {onPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPreview()
              }}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold bg-white text-gray-950 hover:bg-gray-100 transition-colors shadow-lg cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-gray-700" />
              Preview
            </button>
          )}
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              onApply()
            }}
            disabled={!hasChartData}
            className={`
              flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold shadow-lg transition-colors cursor-pointer
              ${!hasChartData
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border-slate-700'
                : 'bg-violet-600 text-white hover:bg-violet-750'
              }
            `}
          >
            <Palette className="w-3.5 h-3.5" />
            Apply Style
          </button>
        </div>
      </div>

      {/* Info section */}
      <div className="px-3 py-2.5 bg-white border-t border-gray-100 z-[5]">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-gray-400 flex-shrink-0">{chartIcon}</span>
          <span className="text-[10px] text-gray-400 font-medium flex-shrink-0 mr-1">
            {CHART_TYPE_NAMES[preset.chartType] || preset.chartType}
          </span>
          <h4 className="text-xs font-semibold text-gray-900 truncate leading-tight flex-1">
            {preset.name}
          </h4>
        </div>

        {/* Category badge + dimensions */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${categoryColor}`}>
            {preset.category}
          </span>
          {preset.dimensions && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[10px] text-gray-400 font-medium">
                {preset.dimensions.width}×{preset.dimensions.height}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
