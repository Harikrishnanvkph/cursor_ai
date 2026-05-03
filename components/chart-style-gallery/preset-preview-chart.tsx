"use client"

import React, { useMemo, memo } from "react"
import { Chart } from "react-chartjs-2"
import type { ChartStylePreset } from "@/lib/chart-style-types"

/**
 * Synthetic sample data for mini preview charts.
 * Varying heights create visual interest across chart types.
 */
const SAMPLE_VALUES = [12, 19, 8, 15, 10, 14]
const SAMPLE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * Chart types that use arc-based rendering (pie/doughnut/polar).
 * These need different data structure than cartesian charts.
 */
const ARC_TYPES = new Set(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'])
const LINE_TYPES = new Set(['line', 'area', 'radar'])

interface PresetPreviewChartProps {
  preset: ChartStylePreset
  /** Width/height of the canvas in pixels */
  size?: number
}

/**
 * Mini Chart.js canvas that renders a tiny preview of a preset's visual style
 * using synthetic sample data. Used in the gallery's PresetCard.
 *
 * Performance notes:
 * - animation is disabled for instant rendering
 * - all interactive features (tooltip, hover, legend) are off
 * - canvas is rendered at a tiny size (default 100×56 px)
 * - memoized to prevent re-renders on filter/scroll
 */
export const PresetPreviewChart = memo(function PresetPreviewChart({
  preset,
  size,
}: PresetPreviewChartProps) {
  const { chartData, chartOptions, resolvedType } = useMemo(() => {
    const colors = preset.colorStrategy.mode === 'single'
      ? Array(SAMPLE_VALUES.length).fill(preset.colorStrategy.singleColor || '#3b82f6')
      : scalePreviewColors(preset.colorStrategy.baseColors, SAMPLE_VALUES.length)

    const borderColors = preset.colorStrategy.baseBorderColors?.length > 0
      ? scalePreviewColors(preset.colorStrategy.baseBorderColors, SAMPLE_VALUES.length)
      : colors.map(c => darkenHex(c, 20))

    // Resolve the Chart.js type (3d variants fallback to their base type)
    let resolvedType: string = preset.chartType
    if (resolvedType === 'pie3d') resolvedType = 'pie'
    else if (resolvedType === 'doughnut3d') resolvedType = 'doughnut'
    else if (resolvedType === 'bar3d') resolvedType = 'bar'
    else if (resolvedType === 'horizontalBar' || resolvedType === 'horizontalBar3d') resolvedType = 'bar'
    else if (resolvedType === 'stackedBar') resolvedType = 'bar'
    else if (resolvedType === 'area') resolvedType = 'line'

    // Build dataset
    const dataset: any = {
      data: SAMPLE_VALUES,
      backgroundColor: colors,
      borderColor: borderColors,
      borderWidth: Math.min(preset.datasetStyle?.borderWidth ?? 1, 2),
    }

    // Line-specific props
    if (LINE_TYPES.has(preset.chartType) || resolvedType === 'line') {
      dataset.tension = preset.datasetStyle?.tension ?? 0.3
      dataset.fill = preset.datasetStyle?.fill ?? (preset.chartType === 'area')
      dataset.pointRadius = Math.min(preset.datasetStyle?.pointRadius ?? 2, 3)
      dataset.pointBackgroundColor = colors[0]
      // For line, use first color as the line color
      if (preset.colorStrategy.mode === 'single') {
        dataset.borderColor = preset.colorStrategy.singleColor || '#3b82f6'
        dataset.backgroundColor = (preset.colorStrategy.singleColor || '#3b82f6') + '40'
      } else {
        dataset.borderColor = colors[0]
        dataset.backgroundColor = colors[0] + '40'
      }
    }

    // Bar-specific props
    if (resolvedType === 'bar') {
      dataset.borderRadius = Math.min(preset.datasetStyle?.borderRadius ?? 0, 4)
    }

    const chartData = {
      labels: SAMPLE_LABELS.slice(0, SAMPLE_VALUES.length),
      datasets: [dataset],
    }

    // Build minimal options — strip everything interactive
    const bg = preset.configSnapshot?.background
    let canvasBg: string | undefined
    if (bg?.type === 'color' && bg.color) canvasBg = bg.color
    else if (bg?.type === 'gradient') canvasBg = bg.gradientColor1 || undefined

    const isHorizontal = preset.chartType === 'horizontalBar' || preset.chartType === 'horizontalBar3d'

    const chartOptions: any = {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      layout: { padding: ARC_TYPES.has(preset.chartType) ? 4 : 2 },
      indexAxis: isHorizontal ? 'y' : 'x',
      plugins: {
        legend: { display: false },
        title: { display: false },
        subtitle: { display: false },
        tooltip: { enabled: false },
        datalabels: { display: false },
        customLabels: false,
      },
      scales: ARC_TYPES.has(preset.chartType) || preset.chartType === 'radar'
        ? undefined
        : {
          x: {
            display: false,
            grid: { display: false },
            ticks: { display: false },
          },
          y: {
            display: false,
            grid: { display: false },
            ticks: { display: false },
            beginAtZero: true,
          },
        },
      elements: {
        arc: {
          borderWidth: 1,
        },
      },
    }

    // Radar-specific scale
    if (preset.chartType === 'radar') {
      chartOptions.scales = {
        r: {
          display: false,
          grid: { display: false },
          ticks: { display: false },
          pointLabels: { display: false },
        },
      }
    }

    return { chartData, chartOptions, resolvedType }
  }, [preset])

  // Background styling for the canvas wrapper
  const wrapperStyle = useMemo(() => {
    const bg = preset.configSnapshot?.background
    if (!bg) return {}

    if (bg.type === 'gradient') {
      const dir = bg.gradientDirection || 'to bottom'
      return {
        background: `linear-gradient(${dir}, ${bg.gradientColor1 || '#fff'}, ${bg.gradientColor2 || '#eee'})`,
      }
    }
    if (bg.type === 'color' && bg.color) {
      return { backgroundColor: bg.color }
    }
    return {}
  }, [preset.configSnapshot?.background])

  return (
    <div
      className="w-full h-full rounded-md overflow-hidden"
      style={wrapperStyle}
    >
      <Chart
        type={resolvedType as any}
        data={chartData}
        options={chartOptions}
      />
    </div>
  )
})

// ========================================
// HELPERS
// ========================================

/** Cycle base colors to fill target length */
function scalePreviewColors(baseColors: string[], targetLength: number): string[] {
  if (!baseColors || baseColors.length === 0) return Array(targetLength).fill('#94a3b8')
  const result: string[] = []
  for (let i = 0; i < targetLength; i++) {
    result.push(baseColors[i % baseColors.length])
  }
  return result
}

/** Simple hex color darkening for borders */
function darkenHex(hex: string, percent: number): string {
  try {
    const clean = hex.replace('#', '')
    const num = parseInt(clean, 16)
    const r = Math.max(0, ((num >> 16) & 0xff) - Math.round(255 * percent / 100))
    const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * percent / 100))
    const b = Math.max(0, (num & 0xff) - Math.round(255 * percent / 100))
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
  } catch {
    return hex
  }
}
