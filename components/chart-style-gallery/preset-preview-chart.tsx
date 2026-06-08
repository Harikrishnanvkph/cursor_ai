"use client"

import React, { useMemo, memo, useRef, useState, useEffect } from "react"
import { Chart } from "react-chartjs-2"
import "@/lib/chart-registration"
import type { ChartStylePreset } from "@/lib/chart-style-types"
import { applyPresetToChart } from "@/lib/chart-style-engine"
import type { ExtendedChartData, ExtendedChartOptions } from "@/lib/chart-defaults"
import { chartTypeMapping, type SupportedChartType } from "@/lib/chart-defaults"
import { Palette, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamic import to avoid SSG module resolution crashes on pages like /admin/presets
const ChartGenerator = dynamic(
  () => import("@/lib/chart_generator").then(mod => mod.ChartGenerator),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center"><Loader2 className="w-5 h-5 text-violet-500 animate-spin" /></div> }
)

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
 * Real-data Chart preview that renders what the user's chart would actually
 * look like with a given preset applied.
 *
 * When real chart data is available, applies the preset and renders using
 * ChartGenerator readOnly (same as board tiles) scaled-to-fit.
 *
 * When no user chart data is available, falls back to synthetic sample data
 * rendered with a lightweight react-chartjs-2 Chart instance.
 *
 * Uses IntersectionObserver for lazy rendering — the chart is only created
 * when the card scrolls into the viewport.
 */
export const PresetPreviewChart = memo(function PresetPreviewChart({
  preset,
  chartData: userChartData,
  chartConfig: userChartConfig,
  chartType: userChartType,
}: PresetPreviewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInView, setIsInView] = useState(false)
  const [tileScale, setTileScale] = useState(0.3)

  // ── Two-way lazy loading via IntersectionObserver ──────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { rootMargin: '150px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // ── Build styled data by applying preset ──────────────────
  const styledResult = useMemo(() => {
    const hasRealData = userChartData && userChartData.datasets?.length > 0

    if (hasRealData && userChartConfig) {
      try {
        const sampledData = sampleChartData(userChartData, MAX_PREVIEW_POINTS)

        const result = applyPresetToChart(
          preset,
          sampledData,
          userChartConfig,
          { applyDimensions: !!preset.dimensions }
        )

        return {
          chartData: result.chartData,
          chartConfig: result.chartConfig,
          chartType: result.chartType,
          hasRealData: true,
        }
      } catch (e) {
        console.warn('[PresetPreview] Real data apply failed, using fallback:', e)
      }
    }

    return null
  }, [preset, userChartData, userChartConfig])

  // ── Synthetic fallback for when no real data ──────────────
  const syntheticPreview = useMemo(() => {
    if (styledResult) return null
    return buildSyntheticPreview(preset)
  }, [preset, styledResult])

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

  // ── Compute chart dimensions from user's config (matches board tile logic) ──
  // Priority: preset dimensions > styled config > user config > default 800×600
  const { chartW, chartH, isResponsive } = useMemo(() => {
    const parseDim = (val: any, fallback: number): number => {
      if (typeof val === 'number') return val
      if (typeof val === 'string') {
        const parsed = parseInt(val, 10)
        return isNaN(parsed) ? fallback : parsed
      }
      return fallback
    }

    // If preset specifies its own dimensions, use those (preview should show preset's original aspect ratio)
    if (preset.dimensions?.width && preset.dimensions?.height) {
      return {
        chartW: parseDim(preset.dimensions.width, 800),
        chartH: parseDim(preset.dimensions.height, 600),
        isResponsive: false,
      }
    }

    // Otherwise use the user's chart config dimensions
    const cfg = userChartConfig as any
    if (!cfg) return { chartW: 800, chartH: 600, isResponsive: true }

    const resp = cfg.responsive !== false && !cfg.manualDimensions
    if (resp) return { chartW: 800, chartH: 600, isResponsive: true }

    return {
      chartW: parseDim(cfg.width, 800),
      chartH: parseDim(cfg.height, 600),
      isResponsive: false,
    }
  }, [preset.dimensions, userChartConfig])

  // ── Compute scale factor for board-style scaled rendering ──
  useEffect(() => {
    if (!containerRef.current || !isInView) return

    const updateScale = () => {
      if (!containerRef.current) return
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight

      const scaleX = containerWidth / chartW
      const scaleY = containerHeight / chartH
      setTileScale(Math.min(scaleX, scaleY))
    }

    updateScale()

    const resizeObserver = new ResizeObserver(() => updateScale())
    resizeObserver.observe(containerRef.current)

    return () => resizeObserver.disconnect()
  }, [isInView, chartW, chartH, styledResult])

  const safeScale = (!tileScale || isNaN(tileScale) || tileScale <= 0) ? 0.3 : tileScale

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-md overflow-hidden"
      style={wrapperStyle}
    >
      {isInView ? (
        styledResult ? (
          /* ── REAL DATA: Board-tile-style scaled rendering ── */
          <div className="absolute inset-0 overflow-hidden flex items-center justify-center bg-zinc-50 bg-[radial-gradient(#e4e4e7_1.2px,transparent_1.2px)] [background-size:12px_12px] p-0">
            <div
              className="relative origin-top-left shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-zinc-200 rounded-lg overflow-hidden bg-white"
              style={{
                width: chartW,
                height: chartH,
                transform: `scale(${safeScale})`,
                transformOrigin: 'top left',
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginTop: -(chartH * safeScale) / 2,
                marginLeft: -(chartW * safeScale) / 2,
              }}
            >
              <ChartGenerator
                readOnly
                dataOverride={styledResult.chartData}
                configOverride={styledResult.chartConfig as any}
                typeOverride={styledResult.chartType}
                isTemplateOrFormat={isResponsive}
              />
            </div>
          </div>
        ) : syntheticPreview ? (
          /* ── FALLBACK: Synthetic sample chart ── */
          <Chart
            type={syntheticPreview.resolvedType as any}
            data={syntheticPreview.previewData}
            options={syntheticPreview.previewOptions}
          />
        ) : null
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

  let resolvedType: string = chartTypeMapping[preset.chartType as SupportedChartType] || preset.chartType;

  const dataset: any = {
    data: SAMPLE_VALUES,
    backgroundColor: colors,
    borderColor: borderColors,
    borderWidth: Math.min(preset.datasetStyle?.borderWidth ?? 1, 2),
  }

  if (LINE_TYPES.has(preset.chartType) || resolvedType === 'line') {
    dataset.tension = preset.datasetStyle?.tension ?? 0
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
