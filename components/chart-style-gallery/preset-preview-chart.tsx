"use client"

import React, { useMemo, memo, useRef, useState, useEffect } from "react"
import { Chart } from "react-chartjs-2"
import type { ChartStylePreset } from "@/lib/chart-style-types"
import { applyPresetToChart } from "@/lib/chart-style-engine"
import type { ExtendedChartData, ExtendedChartOptions } from "@/lib/chart-defaults"
import { Palette } from "lucide-react"

/**
 * Fallback sample data — only used when no real chart data is available.
 */
const SAMPLE_VALUES = [12, 19, 8, 15, 10, 14]
const SAMPLE_LABELS = ['A', 'B', 'C', 'D', 'E', 'F']

/**
 * Chart types that use arc-based rendering (pie/doughnut/polar).
 */
const ARC_TYPES = new Set(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'])
const LINE_TYPES = new Set(['line', 'area', 'radar'])

/** Maximum data points to render in preview for performance */
const MAX_PREVIEW_POINTS = 12

interface PresetPreviewChartProps {
  preset: ChartStylePreset
  /** The user's actual chart data — if provided, preview uses real data */
  chartData?: ExtendedChartData
  /** The user's actual chart config */
  chartConfig?: ExtendedChartOptions
  /** The user's current chart type */
  chartType?: string
}

/**
 * Real-data Chart.js preview that renders what the user's chart would
 * actually look like with a given preset applied.
 *
 * Uses IntersectionObserver for lazy rendering — the Chart.js canvas is only
 * created when the card scrolls into the viewport.
 *
 * When no user chart data is available, falls back to synthetic sample data.
 */
export const PresetPreviewChart = memo(function PresetPreviewChart({
  preset,
  chartData: userChartData,
  chartConfig: userChartConfig,
  chartType: userChartType,
}: PresetPreviewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)

  // ── Two-way lazy loading via IntersectionObserver ──────────
  // Creates Chart.js canvas when card enters viewport,
  // destroys it when card leaves — keeps memory constant at ~25MB
  // regardless of total preset count (scales to 200+).
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { rootMargin: '150px' } // Pre-render 150px ahead for smooth scrolling
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Build chart data ──────────────────────────────────────
  const { previewData, previewOptions, resolvedType } = useMemo(() => {
    const hasRealData = userChartData && userChartData.datasets?.length > 0

    if (hasRealData && userChartConfig) {
      // ── REAL DATA PATH: Apply preset to actual user data ──
      try {
        // Sample the data if too many points
        const sampledData = sampleChartData(userChartData, MAX_PREVIEW_POINTS)

        const result = applyPresetToChart(
          preset,
          sampledData,
          userChartConfig,
          { applyDimensions: false }
        )

        // Resolve chart type for Chart.js (3D → 2D fallback)
        let resolvedType = result.chartType as string
        if (resolvedType === 'pie3d') resolvedType = 'pie'
        else if (resolvedType === 'doughnut3d') resolvedType = 'doughnut'
        else if (resolvedType === 'bar3d') resolvedType = 'bar'
        else if (resolvedType === 'horizontalBar' || resolvedType === 'horizontalBar3d') resolvedType = 'bar'
        else if (resolvedType === 'stackedBar') resolvedType = 'bar'
        else if (resolvedType === 'area') resolvedType = 'line'

        const isHorizontal = result.chartType === 'horizontalBar' || result.chartType === 'horizontalBar3d'
        const isArc = ARC_TYPES.has(result.chartType as string)

        // ── Build FAITHFUL preview options ──
        // Instead of stripping everything, inherit from the user's actual config
        // with scaled-down fonts so it looks like a mini replica of the real chart.
        const srcPlugins = (result.chartConfig as any)?.plugins || {}
        const srcScales = (result.chartConfig as any)?.scales || {}

        const PREVIEW_TITLE_SIZE = 9
        const PREVIEW_LABEL_SIZE = 7
        const PREVIEW_LEGEND_SIZE = 7
        const PREVIEW_DATALABEL_SIZE = 8

        // Title config — inherit text, show if original shows it
        const srcTitle = srcPlugins.title || {}
        const srcSubtitle = srcPlugins.subtitle || {}
        const titleDisplay = srcTitle.display !== false && !!srcTitle.text

        // Legend config — show if original shows it
        const srcLegend = srcPlugins.legend || {}
        const legendDisplay = srcLegend.display !== false

        // Data labels — show if original has them
        const srcDatalabels = srcPlugins.datalabels || {}
        const datalabelsDisplay = srcDatalabels.display !== false

        const previewOptions: any = {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: { padding: isArc ? 8 : 6 },
          indexAxis: isHorizontal ? 'y' : 'x',
          plugins: {
            legend: legendDisplay ? {
              display: true,
              position: srcLegend.position || 'top',
              labels: {
                font: { size: PREVIEW_LEGEND_SIZE },
                boxWidth: 6,
                boxHeight: 6,
                padding: 4,
                color: srcLegend.labels?.color || '#666',
              },
            } : { display: false },
            title: titleDisplay ? {
              display: true,
              text: srcTitle.text || '',
              font: { size: PREVIEW_TITLE_SIZE, weight: 'bold' as const },
              padding: { top: 2, bottom: 2 },
              color: srcTitle.color || '#1f2937',
            } : { display: false },
            subtitle: srcSubtitle.display && srcSubtitle.text ? {
              display: true,
              text: srcSubtitle.text || '',
              font: { size: PREVIEW_LABEL_SIZE },
              padding: { top: 0, bottom: 2 },
              color: srcSubtitle.color || '#6b7280',
            } : { display: false },
            tooltip: { enabled: false },
            datalabels: datalabelsDisplay ? {
              display: true,
              font: { size: PREVIEW_DATALABEL_SIZE, weight: 'bold' as const },
              color: srcDatalabels.color || '#fff',
              formatter: srcDatalabels.formatter || undefined,
              anchor: srcDatalabels.anchor || undefined,
              align: srcDatalabels.align || undefined,
            } : { display: false },
            customLabels: false,
          },
          scales: isArc || result.chartType === 'radar'
            ? undefined
            : {
              x: {
                display: true,
                grid: {
                  display: srcScales.x?.grid?.display !== false,
                  color: srcScales.x?.grid?.color || 'rgba(0,0,0,0.06)',
                  lineWidth: 0.5,
                },
                ticks: {
                  display: true,
                  font: { size: PREVIEW_LABEL_SIZE },
                  color: srcScales.x?.ticks?.color || '#9ca3af',
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 6,
                },
                border: { display: false },
              },
              y: {
                display: true,
                grid: {
                  display: srcScales.y?.grid?.display !== false,
                  color: srcScales.y?.grid?.color || 'rgba(0,0,0,0.06)',
                  lineWidth: 0.5,
                },
                ticks: {
                  display: true,
                  font: { size: PREVIEW_LABEL_SIZE },
                  color: srcScales.y?.ticks?.color || '#9ca3af',
                  maxTicksLimit: 5,
                },
                beginAtZero: true,
                border: { display: false },
              },
            },
          elements: {
            arc: { borderWidth: 1 },
          },
        }

        // Radar-specific scale
        if (result.chartType === 'radar') {
          previewOptions.scales = {
            r: {
              display: true,
              grid: { display: true, color: 'rgba(0,0,0,0.06)', lineWidth: 0.5 },
              ticks: { display: false },
              pointLabels: {
                display: true,
                font: { size: PREVIEW_LABEL_SIZE },
                color: '#9ca3af',
              },
            },
          }
        }

        // Clean datasets for preview — strip metadata Chart.js doesn't understand
        const visualSettings = (result.chartConfig as any)?.visualSettings || {}
        const fillArea = visualSettings.fillArea !== false
        const fillPoints = visualSettings.fillPoints !== false
        const showBorder = visualSettings.showBorder !== false
        const showImages = visualSettings.showImages !== false

        const cleanDatasets = result.chartData.datasets.map((ds: any) => {
          const { groupId, mode, sourceTitle, sourceId, sliceLabels, chartType: dsChartType, datasetColorMode, uniformityMode, ...chartjsProps } = ds
          
          if (resolvedType === 'line' || resolvedType === 'radar' || resolvedType === 'area') {
            if (!fillPoints) {
              chartjsProps.pointBackgroundColor = 'transparent';
            } else if (!chartjsProps.pointBackgroundColor) {
              chartjsProps.pointBackgroundColor = chartjsProps.backgroundColor;
            }
          }

          if (!fillArea) {
             if (Array.isArray(chartjsProps.backgroundColor)) {
               chartjsProps.backgroundColor = chartjsProps.backgroundColor.map(() => 'transparent')
             } else {
               chartjsProps.backgroundColor = 'transparent'
             }
             if (resolvedType === 'line' || resolvedType === 'radar') {
               chartjsProps.fill = false
             }
          }

          if (!showBorder) {
             if (Array.isArray(chartjsProps.borderColor)) {
               chartjsProps.borderColor = chartjsProps.borderColor.map(() => 'transparent')
             } else {
               chartjsProps.borderColor = 'transparent'
             }
             chartjsProps.borderWidth = 0
          }

          if (!showImages) {
             chartjsProps.pointImages = []
             chartjsProps.pointImageConfig = []
          }

          return chartjsProps
        })

        return {
          previewData: { ...result.chartData, datasets: cleanDatasets },
          previewOptions,
          resolvedType,
        }
      } catch (e) {
        // Fallback to synthetic data if apply fails
        console.warn('[PresetPreview] Real data apply failed, using fallback:', e)
      }
    }

    // ── FALLBACK PATH: Synthetic sample data ──
    return buildSyntheticPreview(preset)
  }, [preset, userChartData, userChartConfig])

  // ── Background styling ──
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
      ref={containerRef}
      className="w-full h-full rounded-md overflow-hidden"
      style={wrapperStyle}
    >
      {isInView ? (
        <Chart
          type={resolvedType as any}
          data={previewData}
          options={previewOptions}
        />
      ) : (
        /* Lightweight skeleton placeholder until card enters viewport */
        <div className="w-full h-full flex items-center justify-center bg-gray-50/50">
          <div className="flex flex-col items-center gap-1 opacity-40">
            <Palette className="w-5 h-5 text-gray-300" />
            <div className="flex gap-0.5">
              {(preset.colorStrategy.baseColors || []).slice(0, 5).map((c, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

// ========================================
// HELPERS
// ========================================

/**
 * Sample chart data to reduce points for preview performance.
 * Evenly picks points from the data to preserve the visual shape.
 */
function sampleChartData(data: ExtendedChartData, maxPoints: number): ExtendedChartData {
  const totalPoints = data.labels?.length || 0
  if (totalPoints <= maxPoints) return data // No sampling needed

  // Calculate evenly-spaced indices
  const step = totalPoints / maxPoints
  const indices: number[] = []
  for (let i = 0; i < maxPoints; i++) {
    indices.push(Math.round(i * step))
  }

  const sampledLabels = indices.map(i => (data.labels as string[])?.[i] || '')
  const sampledDatasets = data.datasets.map(ds => ({
    ...ds,
    data: indices.map(i => (ds.data as number[])?.[i] ?? 0),
    // Also sample per-point arrays if they exist
    backgroundColor: Array.isArray(ds.backgroundColor) && ds.backgroundColor.length === totalPoints
      ? indices.map(i => (ds.backgroundColor as string[])[i])
      : ds.backgroundColor,
    borderColor: Array.isArray(ds.borderColor) && ds.borderColor.length === totalPoints
      ? indices.map(i => (ds.borderColor as string[])[i])
      : ds.borderColor,
  }))

  return {
    ...data,
    labels: sampledLabels,
    datasets: sampledDatasets as any,
  }
}

/**
 * Builds a synthetic preview chart using hardcoded sample data.
 * Used as fallback when no real chart data is available.
 */
function buildSyntheticPreview(preset: ChartStylePreset) {
  const colors = preset.colorStrategy.mode === 'single'
    ? Array(SAMPLE_VALUES.length).fill(preset.colorStrategy.singleColor || '#3b82f6')
    : scalePreviewColors(preset.colorStrategy.baseColors, SAMPLE_VALUES.length)

  const borderColors = preset.colorStrategy.baseBorderColors?.length > 0
    ? scalePreviewColors(preset.colorStrategy.baseBorderColors, SAMPLE_VALUES.length)
    : colors.map(c => darkenHex(c, 20))

  let resolvedType: string = preset.chartType
  if (resolvedType === 'pie3d') resolvedType = 'pie'
  else if (resolvedType === 'doughnut3d') resolvedType = 'doughnut'
  else if (resolvedType === 'bar3d') resolvedType = 'bar'
  else if (resolvedType === 'horizontalBar' || resolvedType === 'horizontalBar3d') resolvedType = 'bar'
  else if (resolvedType === 'stackedBar') resolvedType = 'bar'
  else if (resolvedType === 'area') resolvedType = 'line'

  const dataset: any = {
    data: SAMPLE_VALUES,
    backgroundColor: colors,
    borderColor: borderColors,
    borderWidth: Math.min(preset.datasetStyle?.borderWidth ?? 1, 2),
  }

  if (LINE_TYPES.has(preset.chartType) || resolvedType === 'line') {
    dataset.tension = preset.datasetStyle?.tension ?? 0.3
    dataset.fill = preset.datasetStyle?.fill ?? (preset.chartType === 'area')
    dataset.pointRadius = Math.min(preset.datasetStyle?.pointRadius ?? 2, 3)
    if (preset.datasetStyle?.pointStyle !== undefined) dataset.pointStyle = preset.datasetStyle.pointStyle
    if (preset.datasetStyle?.pointBorderWidth !== undefined) dataset.pointBorderWidth = preset.datasetStyle.pointBorderWidth
    
    dataset.pointBackgroundColor = colors[0]
    if (preset.colorStrategy.mode === 'single') {
      dataset.borderColor = preset.colorStrategy.singleColor || '#3b82f6'
      dataset.backgroundColor = (preset.colorStrategy.singleColor || '#3b82f6') + '40'
    } else {
      dataset.borderColor = colors[0]
      dataset.backgroundColor = colors[0] + '40'
    }
  }

  if (resolvedType === 'bar') {
    const radius = preset.datasetStyle?.borderRadius ?? 0
    dataset.borderRadius = typeof radius === 'number' ? Math.min(radius, 4) : radius
  }

  const visualSettings = preset.configSnapshot?.visualSettings || {}
  const fillArea = visualSettings.fillArea !== false
  const fillPoints = visualSettings.fillPoints !== false
  const showBorder = visualSettings.showBorder !== false

  if (resolvedType === 'line' || resolvedType === 'radar' || resolvedType === 'area') {
    if (!fillPoints) {
      dataset.pointBackgroundColor = 'transparent';
    } else if (!dataset.pointBackgroundColor) {
      dataset.pointBackgroundColor = dataset.backgroundColor;
    }
  }

  if (!fillArea) {
    if (Array.isArray(dataset.backgroundColor)) {
      dataset.backgroundColor = dataset.backgroundColor.map(() => 'transparent')
    } else {
      dataset.backgroundColor = 'transparent'
    }
    if (resolvedType === 'line' || resolvedType === 'radar') {
      dataset.fill = false
    }
  }

  if (!showBorder) {
    if (Array.isArray(dataset.borderColor)) {
      dataset.borderColor = dataset.borderColor.map(() => 'transparent')
    } else {
      dataset.borderColor = 'transparent'
    }
    dataset.borderWidth = 0
  }

  const isHorizontal = preset.chartType === 'horizontalBar' || preset.chartType === 'horizontalBar3d'

  const previewData = {
    labels: SAMPLE_LABELS.slice(0, SAMPLE_VALUES.length),
    datasets: [dataset],
  }

  const previewOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    layout: { padding: ARC_TYPES.has(preset.chartType) ? 6 : 4 },
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
      arc: { borderWidth: 1 },
    },
  }

  if (preset.chartType === 'radar') {
    previewOptions.scales = {
      r: {
        display: false,
        grid: { display: false },
        ticks: { display: false },
        pointLabels: { display: false },
      },
    }
  }

  return { previewData, previewOptions, resolvedType }
}

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
