/**
 * Preset Dimension & Aspect Ratio Scaling Engine
 *
 * Analyzes existing ChartStylePresets (authored at a specific resolution/aspect ratio)
 * and translates them cleanly into any target dimension or aspect ratio.
 *
 * Translates:
 *   1. Dimensions & Aspect Ratio metadata
 *   2. Typography (title, subtitle, legend, datalabels, customLabelsConfig, axis ticks/titles, radial pointLabels, gauge value)
 *   3. Layout padding & element spacing (title/subtitle/legend/datalabel/tick padding, offsets)
 *   4. Axes bounds, tick density & scale styling (min/max/suggestedMin/suggestedMax/stepSize/grace, maxTicksLimit, rotation, borders)
 *   5. Orientation-aware layout adaptation (e.g., moving side legends to bottom on narrow portrait canvases)
 *   6. Dataset & 3D geometry (borderWidth, borderRadius, pointRadius, hoverOffset, bar/category percentages, patterns, pie3d/bar3d depth & shadows)
 */

import type {
  ChartStylePreset,
  DatasetStyleTemplate,
  PresetDimensions,
} from './chart-style-types'
import { parseDimension, getStandardAspectRatio } from './utils/dimension-utils'

// ========================================
// TYPES & CONSTANTS
// ========================================

export type Orientation = 'portrait' | 'landscape' | 'square'

export type StandardAspectRatioKey = '16:9' | '9:16' | '1:1' | '4:5' | '4:3' | '3:2'

export interface AspectRatioTarget {
  ratioKey: StandardAspectRatioKey
  label: string
  width: number
  height: number
}

export const STANDARD_ASPECT_RATIO_TARGETS: Record<StandardAspectRatioKey, AspectRatioTarget> = {
  '16:9': { ratioKey: '16:9', label: '16:9 Landscape', width: 1920, height: 1080 },
  '9:16': { ratioKey: '9:16', label: '9:16 Portrait', width: 1080, height: 1920 },
  '1:1':  { ratioKey: '1:1',  label: '1:1 Square',     width: 1080, height: 1080 },
  '4:5':  { ratioKey: '4:5',  label: '4:5 Portrait',   width: 1080, height: 1350 },
  '4:3':  { ratioKey: '4:3',  label: '4:3 Classic',    width: 1440, height: 1080 },
  '3:2':  { ratioKey: '3:2',  label: '3:2 Presentation', width: 1620, height: 1080 },
}

export type TargetDimensionsInput =
  | StandardAspectRatioKey
  | string
  | PresetDimensions
  | { width: number | string; height: number | string }

export interface ResolvedDimensions {
  width: number
  height: number
  aspectRatio: number
  aspectLabel: string
  orientation: Orientation
  diagonal: number
  area: number
}

export interface PresetAnalysis {
  presetId: string
  presetName: string
  chartType: string
  hasExplicitDimensions: boolean
  source: ResolvedDimensions
  inventory: {
    fontPaths: Record<string, number>
    hasLayoutPadding: boolean
    legendPosition: string
    legendDisplay: boolean
    axesPresent: string[]
    hasExplicitAxisBounds: boolean
    has3D: boolean
    hasDatasetPatterns: boolean
    hasCustomLabelsConfig: boolean
  }
}

export interface ScalingMetrics {
  scaleX: number
  scaleY: number
  scaleDiag: number
  scaleMin: number
  scaleArea: number
  fontScale: number
  aspectShift: number
  orientationChanged: boolean
  fromOrientation: Orientation
  toOrientation: Orientation
}

export interface TranslatePresetOptions {
  /** Number of labels/data points (used for tick density, maxTicksLimit, and label size dampening) */
  dataCount?: number
  /**
   * 'normalized': adjusts fonts modestly for orientation/aspect & density so chart_generator's
   *               runtime applyFontScaling() produces crisp visual sizes without double-scaling.
   * 'visual':     scales font sizes directly by the geometric fontScale factor from source to target.
   * Default: 'normalized'
   */
  fontScaleMode?: 'normalized' | 'visual'
  /** Reposition side legends ('left'|'right') to 'bottom' when adapting into portrait (default: true) */
  repositionLegend?: boolean
  /** Adapt axis bounds, stepSize, tick density, and rotation for the new dimensions (default: true) */
  scaleAxes?: boolean
  /** Scale dataset geometry like borderWidth, borderRadius, pointRadius, 3D depth (default: true) */
  scaleDatasetGeometry?: boolean
  /** Optional raw numeric range per axis to compute clean stepSize when bounds exist */
  activeScalesOverride?: Record<string, any>
}

export interface TranslationAdjustment {
  category: 'dimensions' | 'fonts' | 'layout' | 'legend' | 'axes' | 'dataset' | '3d'
  field: string
  from: string | number | boolean | null | undefined
  to: string | number | boolean | null | undefined
}

export interface TranslationReport {
  source: ResolvedDimensions
  target: ResolvedDimensions
  metrics: ScalingMetrics
  adjustments: TranslationAdjustment[]
}

export interface TranslatedPresetResult {
  preset: ChartStylePreset
  analysis: PresetAnalysis
  report: TranslationReport
}

const DEFAULT_SOURCE_WIDTH = 800
const DEFAULT_SOURCE_HEIGHT = 600

// ========================================
// DIMENSION & ORIENTATION HELPERS
// ========================================

export function getOrientation(width: number, height: number): Orientation {
  const ratio = width / Math.max(1, height)
  if (Math.abs(ratio - 1) <= 0.08) return 'square'
  return ratio > 1 ? 'landscape' : 'portrait'
}

export function buildResolvedDimensions(width: number, height: number): ResolvedDimensions {
  const safeW = Math.max(120, Math.round(width))
  const safeH = Math.max(120, Math.round(height))
  return {
    width: safeW,
    height: safeH,
    aspectRatio: safeW / safeH,
    aspectLabel: getStandardAspectRatio(safeW, safeH),
    orientation: getOrientation(safeW, safeH),
    diagonal: Math.hypot(safeW, safeH),
    area: safeW * safeH,
  }
}

/**
 * Resolve any supported target input (standard ratio string, 'W:H' ratio,
 * PresetDimensions '{width: "1080px", height: "1920px"}', or numeric {width, height})
 * into concrete pixel dimensions.
 */
export function resolveTargetDimensions(
  target: TargetDimensionsInput,
  fallbackBase: { width: number; height: number } = { width: 1080, height: 1080 }
): ResolvedDimensions {
  if (typeof target === 'string') {
    const trimmed = target.trim()
    if (trimmed in STANDARD_ASPECT_RATIO_TARGETS) {
      const std = STANDARD_ASPECT_RATIO_TARGETS[trimmed as StandardAspectRatioKey]
      return buildResolvedDimensions(std.width, std.height)
    }

    // Parse arbitrary "W:H" ratio string (e.g. "21:9", "2:3") preserving target area ~1080^2
    const ratioMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)$/)
    if (ratioMatch) {
      const rw = parseFloat(ratioMatch[1])
      const rh = parseFloat(ratioMatch[2])
      if (rw > 0 && rh > 0) {
        const refArea = Math.max(800 * 600, fallbackBase.width * fallbackBase.height)
        const h = Math.sqrt(refArea / (rw / rh))
        const w = h * (rw / rh)
        return buildResolvedDimensions(w, h)
      }
    }

    // Parse "1920x1080" or "1920×1080"
    const dimMatch = trimmed.match(/^(\d+)\s*[x×]\s*(\d+)$/i)
    if (dimMatch) {
      return buildResolvedDimensions(parseInt(dimMatch[1], 10), parseInt(dimMatch[2], 10))
    }

    return buildResolvedDimensions(fallbackBase.width, fallbackBase.height)
  }

  const w = parseDimension(target.width, fallbackBase.width)
  const h = parseDimension(target.height, fallbackBase.height)
  return buildResolvedDimensions(w, h)
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val))
}

function roundTo(val: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(val * factor) / factor
}

/**
 * Snap a numeric step size to a clean 1 / 2 / 2.5 / 5 * 10^n tick interval.
 */
function snapNiceStepSize(rawStep: number): number {
  if (!Number.isFinite(rawStep) || rawStep <= 0) return rawStep
  const exp = Math.floor(Math.log10(rawStep))
  const mag = Math.pow(10, exp)
  const norm = rawStep / mag
  let nice: number
  if (norm <= 1.2) nice = 1
  else if (norm <= 2.2) nice = 2
  else if (norm <= 3.5) nice = 2.5
  else if (norm <= 7) nice = 5
  else nice = 10
  return nice * mag
}

// ========================================
// PRESET ANALYSIS
// ========================================

/**
 * Analyze a ChartStylePreset's native dimensions, orientation, and scalable style properties.
 */
export function analyzePreset(preset: ChartStylePreset): PresetAnalysis {
  const hasExplicitDimensions = Boolean(preset.dimensions?.width && preset.dimensions?.height)
  const srcW = hasExplicitDimensions
    ? parseDimension(preset.dimensions!.width, DEFAULT_SOURCE_WIDTH)
    : DEFAULT_SOURCE_WIDTH
  const srcH = hasExplicitDimensions
    ? parseDimension(preset.dimensions!.height, DEFAULT_SOURCE_HEIGHT)
    : DEFAULT_SOURCE_HEIGHT

  const source = buildResolvedDimensions(srcW, srcH)
  const cfg = (preset.configSnapshot || {}) as Record<string, any>
  const plugins = (cfg.plugins || {}) as Record<string, any>
  const scales = (cfg.scales || {}) as Record<string, any>
  const dsStyle = (preset.datasetStyle || {}) as Partial<DatasetStyleTemplate>

  const fontPaths: Record<string, number> = {}
  const recordFont = (label: string, val: unknown) => {
    if (typeof val === 'number' && Number.isFinite(val) && val > 0) {
      fontPaths[label] = val
    }
  }

  recordFont('title', plugins.title?.font?.size)
  recordFont('subtitle', plugins.subtitle?.font?.size)
  recordFont('legend', plugins.legend?.labels?.font?.size)
  recordFont('datalabels', plugins.datalabels?.font?.size)
  recordFont('customLabels', plugins.customLabelsConfig?.fontSize)
  recordFont('gaugeValue', plugins.gauge?.valueFontSize)

  const axesPresent = Object.keys(scales).filter(k => scales[k] && typeof scales[k] === 'object')
  let hasExplicitAxisBounds = false

  for (const axisKey of axesPresent) {
    const axis = scales[axisKey]
    recordFont(`scales.${axisKey}.ticks`, axis.ticks?.font?.size)
    recordFont(`scales.${axisKey}.title`, axis.title?.font?.size)
    if (axisKey === 'r') {
      recordFont('scales.r.pointLabels', axis.pointLabels?.font?.size)
    }
    if (
      axis.min !== undefined ||
      axis.max !== undefined ||
      axis.suggestedMin !== undefined ||
      axis.suggestedMax !== undefined ||
      axis.ticks?.stepSize !== undefined
    ) {
      hasExplicitAxisBounds = true
    }
  }

  return {
    presetId: preset.id,
    presetName: preset.name,
    chartType: preset.chartType,
    hasExplicitDimensions,
    source,
    inventory: {
      fontPaths,
      hasLayoutPadding: Boolean(cfg.layout?.padding),
      legendPosition: plugins.legend?.position || 'top',
      legendDisplay: plugins.legend?.display !== false,
      axesPresent,
      hasExplicitAxisBounds,
      has3D: Boolean(plugins.pie3d?.enabled || plugins.bar3d?.enabled),
      hasDatasetPatterns: Boolean(dsStyle.datasetPattern || (Array.isArray(dsStyle.slicePatterns) && dsStyle.slicePatterns.some(Boolean))),
      hasCustomLabelsConfig: Boolean(plugins.customLabelsConfig),
    },
  }
}

/**
 * Compute geometric scaling ratios between source and target dimensions.
 */
export function computeScalingMetrics(
  source: ResolvedDimensions,
  target: ResolvedDimensions
): ScalingMetrics {
  const scaleX = target.width / source.width
  const scaleY = target.height / source.height
  const scaleDiag = target.diagonal / source.diagonal
  const scaleMin = Math.min(target.width, target.height) / Math.min(source.width, source.height)
  const scaleArea = Math.sqrt(target.area / source.area)

  // Dampen extreme diagonal/min mismatches so typography stays legible in narrow portrait or banners
  const rawFontBlend = scaleDiag * 0.65 + scaleMin * 0.35
  const fontScale = clamp(rawFontBlend, 0.45, 2.5)

  return {
    scaleX,
    scaleY,
    scaleDiag,
    scaleMin,
    scaleArea,
    fontScale,
    aspectShift: target.aspectRatio / source.aspectRatio,
    orientationChanged: source.orientation !== target.orientation,
    fromOrientation: source.orientation,
    toOrientation: target.orientation,
  }
}

// ========================================
// SCALING SUB-TRANSLATORS
// ========================================

function scaleScalarOrArrayNumber(
  value: number | number[] | undefined,
  factor: number,
  min: number,
  max: number,
  decimals = 0
): number | number[] | undefined {
  if (value === undefined) return undefined
  if (Array.isArray(value)) {
    return value.map(v =>
      typeof v === 'number' && Number.isFinite(v)
        ? (v === 0 ? 0 : clamp(roundTo(v * factor, decimals), min, max))
        : v
    )
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 0) return 0
    return clamp(roundTo(value * factor, decimals), min, max)
  }
  return value
}

function scaleBorderRadiusValue(
  radius: number | number[] | Record<string, number> | undefined,
  factor: number
): number | number[] | Record<string, number> | undefined {
  if (radius === undefined) return undefined
  if (typeof radius === 'number') {
    return radius === 0 ? 0 : clamp(Math.round(radius * factor), 1, 48)
  }
  if (Array.isArray(radius)) {
    return radius.map(r => (typeof r === 'number' ? (r === 0 ? 0 : clamp(Math.round(r * factor), 1, 48)) : r))
  }
  if (typeof radius === 'object' && radius !== null) {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(radius)) {
      out[k] = typeof v === 'number' ? (v === 0 ? 0 : clamp(Math.round(v * factor), 1, 48)) : v
    }
    return out
  }
  return radius
}

function scalePaddingObject(
  padding: number | Record<string, any> | undefined,
  scaleX: number,
  scaleY: number,
  min = 2,
  max = 120
): number | Record<string, any> | undefined {
  if (padding === undefined) return undefined
  if (typeof padding === 'number') {
    const avg = (scaleX + scaleY) / 2
    return clamp(Math.round(padding * avg), min, max)
  }
  if (typeof padding === 'object' && padding !== null) {
    const out: Record<string, any> = { ...padding }
    if (typeof out.top === 'number') out.top = clamp(Math.round(out.top * scaleY), min, max)
    if (typeof out.bottom === 'number') out.bottom = clamp(Math.round(out.bottom * scaleY), min, max)
    if (typeof out.left === 'number') out.left = clamp(Math.round(out.left * scaleX), min, max)
    if (typeof out.right === 'number') out.right = clamp(Math.round(out.right * scaleX), min, max)
    return out
  }
  return padding
}

function isHorizontalChart(chartType: string, configSnapshot: Record<string, any>): boolean {
  return (
    chartType === 'horizontalBar' ||
    chartType === 'horizontalBar3d' ||
    chartType === 'funnel' ||
    configSnapshot.indexAxis === 'y'
  )
}

function isCartesianChart(chartType: string): boolean {
  return !['pie', 'doughnut', 'radar', 'polarArea', 'gauge', 'pie3d', 'doughnut3d'].includes(chartType)
}

/**
 * Compute normalized font multiplier when target uses chart_generator's runtime applyFontScaling.
 * In normalized mode, chart_generator already scales by targetDiag / 1000, so we apply:
 *   1. Relative compensation if source dimensions had unusually dense/wide aspect ratio vs target
 *   2. Narrow-width guardrail for portrait canvases so titles/ticks don't clip horizontally
 */
function computeNormalizedFontAdjustment(
  metrics: ScalingMetrics,
  source: ResolvedDimensions,
  target: ResolvedDimensions,
  dataCount: number
): { headingFactor: number; bodyFactor: number; tickFactor: number } {
  // Ratio of width constraint vs diagonal growth: < 1 when moving into tall/narrow portrait
  const widthVsDiag = metrics.scaleX / Math.max(0.01, metrics.scaleDiag)
  const portraitDampen = target.orientation === 'portrait'
    ? clamp(0.85 + 0.15 * widthVsDiag, 0.82, 1.0)
    : 1.0

  // Small boost when moving from cramped portrait/compact into roomy wide landscape
  const landscapeBoost =
    metrics.fromOrientation === 'portrait' && metrics.toOrientation === 'landscape'
      ? 1.06
      : 1.0

  // Extra tick compression when horizontal axis gets narrower with many categories
  const denseWidthRatio = dataCount > 8 ? clamp(target.width / Math.max(1, dataCount * 75), 0.78, 1.0) : 1.0

  // Slight source-size normalization when source was authored far outside 800x600 without scaled fonts
  const sourceOutlierDampen =
    source.diagonal > 1500 && target.diagonal < 1100
      ? 0.94
      : 1.0

  return {
    headingFactor: roundTo(portraitDampen * landscapeBoost * sourceOutlierDampen, 3),
    bodyFactor: roundTo(clamp(portraitDampen * landscapeBoost, 0.86, 1.08), 3),
    tickFactor: roundTo(clamp(portraitDampen * denseWidthRatio, 0.78, 1.05), 3),
  }
}

// ========================================
// MAIN TRANSLATOR
// ========================================

/**
 * Translate a ChartStylePreset to new dimensions or aspect ratio,
 * dynamically converting fonts, padding, legend placement, axes bounds/ticks,
 * 3D plugin parameters, and dataset styling.
 *
 * Does NOT mutate the input preset.
 */
export function translatePresetToDimensions(
  preset: ChartStylePreset,
  targetInput: TargetDimensionsInput,
  options: TranslatePresetOptions = {}
): TranslatedPresetResult {
  const analysis = analyzePreset(preset)
  const source = analysis.source
  const target = resolveTargetDimensions(targetInput, {
    width: source.width,
    height: source.height,
  })
  const metrics = computeScalingMetrics(source, target)

  const {
    dataCount = 8,
    fontScaleMode = 'normalized',
    repositionLegend = true,
    scaleAxes = true,
    scaleDatasetGeometry = true,
    activeScalesOverride,
  } = options

  const adjustments: TranslationAdjustment[] = []
  const clonedPreset: ChartStylePreset = JSON.parse(JSON.stringify(preset))

  // Update dimensions on the translated preset
  const prevDims = preset.dimensions
    ? `${preset.dimensions.width}×${preset.dimensions.height}`
    : `${source.width}px×${source.height}px`
  clonedPreset.dimensions = {
    width: `${target.width}px`,
    height: `${target.height}px`,
  }
  if (source.width !== target.width || source.height !== target.height) {
    adjustments.push({
      category: 'dimensions',
      field: 'dimensions',
      from: prevDims,
      to: `${target.width}px×${target.height}px (${target.aspectLabel})`,
    })
  }

  const cfg = (clonedPreset.configSnapshot = clonedPreset.configSnapshot || {})
  const plugins = (cfg.plugins = cfg.plugins || {})
  const dsStyle = (clonedPreset.datasetStyle = clonedPreset.datasetStyle || ({} as DatasetStyleTemplate))

  // ── 1. Typography Translation ──────────────────────────────────
  const normFactors = computeNormalizedFontAdjustment(metrics, source, target, dataCount)
  const getFontMult = (role: 'heading' | 'body' | 'tick'): number => {
    if (fontScaleMode === 'visual') {
      if (role === 'tick' && dataCount > 10) {
        return metrics.fontScale * clamp(1 - (dataCount - 10) * 0.015, 0.75, 1.0)
      }
      return metrics.fontScale
    }
    if (role === 'heading') return normFactors.headingFactor
    if (role === 'tick') return normFactors.tickFactor
    return normFactors.bodyFactor
  }

  const fontBounds = fontScaleMode === 'visual'
    ? { title: [10, 64], subtitle: [8, 40], legend: [8, 32], datalabel: [8, 32], tick: [7, 28], axisTitle: [8, 32] }
    : { title: [11, 32], subtitle: [9, 22], legend: [9, 18], datalabel: [9, 20], tick: [8, 16], axisTitle: [9, 18] }

  const scaleFontField = (
    obj: Record<string, any> | undefined,
    key: string,
    role: 'heading' | 'body' | 'tick',
    bounds: number[],
    reportLabel: string
  ) => {
    if (!obj || typeof obj[key] !== 'number' || !Number.isFinite(obj[key])) return
    const prev = obj[key]
    const next = clamp(Math.round(prev * getFontMult(role)), bounds[0], bounds[1])
    if (next !== prev) {
      obj[key] = next
      adjustments.push({ category: 'fonts', field: reportLabel, from: prev, to: next })
    }
  }

  scaleFontField(plugins.title?.font, 'size', 'heading', fontBounds.title, 'plugins.title.font.size')
  scaleFontField(plugins.subtitle?.font, 'size', 'body', fontBounds.subtitle, 'plugins.subtitle.font.size')
  scaleFontField(plugins.legend?.labels?.font, 'size', 'body', fontBounds.legend, 'plugins.legend.labels.font.size')
  scaleFontField(plugins.datalabels?.font, 'size', 'body', fontBounds.datalabel, 'plugins.datalabels.font.size')
  scaleFontField(plugins.customLabelsConfig, 'fontSize', 'body', fontBounds.datalabel, 'plugins.customLabelsConfig.fontSize')
  scaleFontField(plugins.gauge, 'valueFontSize', 'heading', [14, 72], 'plugins.gauge.valueFontSize')

  // ── 2. Layout Padding & Spacing Translation ────────────────────
  const defaultPad = target.orientation === 'portrait'
    ? { top: 24, right: 20, bottom: 24, left: 20 }
    : { top: 16, right: 20, bottom: 16, left: 20 }

  if (cfg.layout?.padding) {
    const prevPad = JSON.stringify(cfg.layout.padding)
    cfg.layout.padding = scalePaddingObject(cfg.layout.padding, metrics.scaleX, metrics.scaleY, 6, 96)
    const nextPad = JSON.stringify(cfg.layout.padding)
    if (prevPad !== nextPad) {
      adjustments.push({ category: 'layout', field: 'layout.padding', from: prevPad, to: nextPad })
    }
  } else if (source.width !== target.width || source.height !== target.height) {
    cfg.layout = { ...(cfg.layout || {}), padding: defaultPad }
    adjustments.push({ category: 'layout', field: 'layout.padding', from: 'default', to: JSON.stringify(defaultPad) })
  }

  // Title & subtitle padding
  if (plugins.title?.padding !== undefined) {
    plugins.title.padding = scalePaddingObject(plugins.title.padding, metrics.scaleX, metrics.scaleY, 2, 48)
  }
  if (plugins.subtitle?.padding !== undefined) {
    plugins.subtitle.padding = scalePaddingObject(plugins.subtitle.padding, metrics.scaleX, metrics.scaleY, 2, 36)
  }

  // Datalabels offset, padding, borderRadius
  if (plugins.datalabels) {
    if (typeof plugins.datalabels.offset === 'number' && plugins.datalabels.offset !== 0) {
      const prev = plugins.datalabels.offset
      const next = clamp(Math.round(prev * metrics.scaleMin), -24, 24)
      if (next !== prev) {
        plugins.datalabels.offset = next
        adjustments.push({ category: 'layout', field: 'plugins.datalabels.offset', from: prev, to: next })
      }
    }
    if (plugins.datalabels.padding !== undefined) {
      plugins.datalabels.padding = scalePaddingObject(plugins.datalabels.padding, metrics.scaleX, metrics.scaleY, 1, 20)
    }
    if (typeof plugins.datalabels.borderRadius === 'number' && plugins.datalabels.borderRadius > 0) {
      plugins.datalabels.borderRadius = clamp(Math.round(plugins.datalabels.borderRadius * metrics.scaleMin), 1, 20)
    }
  }

  // Custom labels config spacing
  if (plugins.customLabelsConfig && typeof plugins.customLabelsConfig === 'object') {
    const cl = plugins.customLabelsConfig
    if (typeof cl.padding === 'number') cl.padding = clamp(Math.round(cl.padding * metrics.scaleMin), 1, 24)
    if (typeof cl.borderRadius === 'number') cl.borderRadius = clamp(Math.round(cl.borderRadius * metrics.scaleMin), 0, 24)
    if (typeof cl.arrowLength === 'number') cl.arrowLength = clamp(Math.round(cl.arrowLength * metrics.scaleMin), 6, 60)
  }

  // ── 3. Aspect-Ratio & Orientation Legend Adaptation ────────────
  if (plugins.legend && plugins.legend.display !== false) {
    if (plugins.legend.labels) {
      if (typeof plugins.legend.labels.padding === 'number') {
        plugins.legend.labels.padding = clamp(Math.round(plugins.legend.labels.padding * metrics.scaleMin), 4, 32)
      }
      if (typeof plugins.legend.labels.boxWidth === 'number') {
        plugins.legend.labels.boxWidth = clamp(Math.round(plugins.legend.labels.boxWidth * metrics.scaleMin), 8, 48)
      }
      if (typeof plugins.legend.labels.boxHeight === 'number') {
        plugins.legend.labels.boxHeight = clamp(Math.round(plugins.legend.labels.boxHeight * metrics.scaleMin), 8, 32)
      }
    }

    if (repositionLegend) {
      const currentPos = plugins.legend.position || 'top'
      // Narrow portrait canvases crush the plot area if legend sits on left/right
      if (target.aspectRatio < 0.88 && (currentPos === 'left' || currentPos === 'right')) {
        plugins.legend.position = 'bottom'
        adjustments.push({
          category: 'legend',
          field: 'plugins.legend.position',
          from: currentPos,
          to: 'bottom',
        })
      }
      // Ultra-wide / 16:9 / 3:2 pie/doughnut/polar charts benefit from side legend when source was bottom
      const isArc = ['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(preset.chartType)
      if (isArc && target.aspectRatio >= 1.45 && metrics.fromOrientation === 'portrait' && currentPos === 'bottom') {
        plugins.legend.position = 'right'
        adjustments.push({
          category: 'legend',
          field: 'plugins.legend.position',
          from: currentPos,
          to: 'right',
        })
      }
    }
  }

  // ── 4. Axes Bounds, Ticks & Scale Adaptation ───────────────────
  if (scaleAxes) {
    const scales = (cfg.scales = cfg.scales || {})
    // Merge optional active scale bounds for callers translating a live chart config
    if (activeScalesOverride && typeof activeScalesOverride === 'object') {
      for (const axisKey of Object.keys(activeScalesOverride)) {
        const overrideAxis = activeScalesOverride[axisKey]
        if (!overrideAxis || typeof overrideAxis !== 'object') continue
        if (!scales[axisKey]) scales[axisKey] = {}
        for (const boundKey of ['min', 'max', 'suggestedMin', 'suggestedMax', 'grace']) {
          if (overrideAxis[boundKey] !== undefined && scales[axisKey][boundKey] === undefined) {
            scales[axisKey][boundKey] = overrideAxis[boundKey]
          }
        }
        if (overrideAxis.ticks?.stepSize !== undefined && scales[axisKey].ticks?.stepSize === undefined) {
          scales[axisKey].ticks = { ...(scales[axisKey].ticks || {}), stepSize: overrideAxis.ticks.stepSize }
        }
      }
    }

    const isHoriz = isHorizontalChart(preset.chartType, cfg)
    const cartesian = isCartesianChart(preset.chartType)

    if (cartesian) {
      const cartesianKeys = Object.keys(scales).filter(k => k === 'x' || k === 'y' || k === 'y1')
      for (const axisKey of cartesianKeys) {
        const axis = scales[axisKey]
        if (!axis || typeof axis !== 'object') continue

        const isHorizontalAxis = axisKey === 'x'
        const axisSpanScale = isHorizontalAxis ? metrics.scaleX : metrics.scaleY
        const targetSpanPx = isHorizontalAxis ? target.width : target.height
        const sourceSpanPx = isHorizontalAxis ? source.width : source.height
        const isValueAxis = isHoriz ? axisKey === 'x' : (axisKey === 'y' || axisKey === 'y1')

        // Scale tick fonts & title fonts
        if (axis.ticks) {
          scaleFontField(axis.ticks.font, 'size', 'tick', fontBounds.tick, `scales.${axisKey}.ticks.font.size`)
          if (typeof axis.ticks.padding === 'number') {
            axis.ticks.padding = clamp(Math.round(axis.ticks.padding * axisSpanScale), 2, 24)
          }
          if (typeof axis.ticks.tickLength === 'number') {
            axis.ticks.tickLength = clamp(Math.round(axis.ticks.tickLength * metrics.scaleMin), 2, 16)
          }
        }

        if (axis.title) {
          scaleFontField(axis.title.font, 'size', 'body', fontBounds.axisTitle, `scales.${axisKey}.title.font.size`)
          if (axis.title.padding !== undefined) {
            axis.title.padding = scalePaddingObject(axis.title.padding, metrics.scaleX, metrics.scaleY, 2, 32)
          }
        }

        // Scale grid & border line widths modestly
        if (axis.border && typeof axis.border.width === 'number') {
          axis.border.width = clamp(roundTo(axis.border.width * metrics.scaleMin, 1), 0.5, 4)
        }
        if (axis.grid && typeof axis.grid.lineWidth === 'number') {
          axis.grid.lineWidth = clamp(roundTo(axis.grid.lineWidth * metrics.scaleMin, 1), 0.5, 3)
        }

        // Value-axis bounds & stepSize recalculation
        if (isValueAxis) {
          const hasNumericMin = typeof axis.min === 'number' && Number.isFinite(axis.min)
          const hasNumericMax = typeof axis.max === 'number' && Number.isFinite(axis.max)
          const targetTicksCount = clamp(Math.round(targetSpanPx / 85), 3, 12)
          const sourceTicksCount = clamp(Math.round(sourceSpanPx / 85), 3, 12)

          if (typeof axis.ticks?.stepSize === 'number' && axis.ticks.stepSize > 0) {
            const oldStep = axis.ticks.stepSize
            let nextStep: number
            if (hasNumericMin && hasNumericMax && axis.max > axis.min) {
              const range = axis.max - axis.min
              nextStep = snapNiceStepSize(range / targetTicksCount)
            } else {
              // Scale stepSize inversely with available axis ticks count
              const densityRatio = sourceTicksCount / Math.max(1, targetTicksCount)
              nextStep = snapNiceStepSize(oldStep * densityRatio)
            }
            if (nextStep !== oldStep && nextStep > 0) {
              axis.ticks = { ...(axis.ticks || {}), stepSize: nextStep }
              adjustments.push({
                category: 'axes',
                field: `scales.${axisKey}.ticks.stepSize`,
                from: oldStep,
                to: nextStep,
              })
            }
          } else if (axis.ticks?.maxTicksLimit !== undefined || sourceSpanPx !== targetSpanPx) {
            const prevLimit = axis.ticks?.maxTicksLimit
            const nextLimit = targetTicksCount
            if (prevLimit !== nextLimit) {
              axis.ticks = { ...(axis.ticks || {}), maxTicksLimit: nextLimit }
              adjustments.push({
                category: 'axes',
                field: `scales.${axisKey}.ticks.maxTicksLimit`,
                from: prevLimit ?? 'auto',
                to: nextLimit,
              })
            }
          }

          // Adjust percentage grace slightly for cramped vertical/horizontal value axes
          if (typeof axis.grace === 'string' && axis.grace.endsWith('%')) {
            const pct = parseFloat(axis.grace)
            if (!isNaN(pct) && targetSpanPx < 450 && pct > 10) {
              const nextGrace = `${Math.max(5, Math.round(pct * 0.75))}%`
              if (nextGrace !== axis.grace) {
                adjustments.push({ category: 'axes', field: `scales.${axisKey}.grace`, from: axis.grace, to: nextGrace })
                axis.grace = nextGrace
              }
            }
          }
        } else {
          // Category axis: adapt tick rotation & density to available width/height
          if (isHorizontalAxis) {
            const pxPerCategory = target.width / Math.max(1, dataCount)
            if (pxPerCategory < 75 && dataCount >= 5) {
              axis.ticks = {
                ...(axis.ticks || {}),
                autoSkip: axis.ticks?.autoSkip ?? true,
                maxRotation: axis.ticks?.maxRotation ?? 45,
                minRotation: axis.ticks?.minRotation ?? 0,
              }
              adjustments.push({
                category: 'axes',
                field: `scales.${axisKey}.ticks.maxRotation`,
                from: preset.configSnapshot?.scales?.[axisKey]?.ticks?.maxRotation ?? 0,
                to: axis.ticks.maxRotation,
              })
            } else if (pxPerCategory >= 110 && axis.ticks?.maxRotation === 45) {
              axis.ticks.maxRotation = 0
              adjustments.push({
                category: 'axes',
                field: `scales.${axisKey}.ticks.maxRotation`,
                from: 45,
                to: 0,
              })
            }
          } else {
            // Vertical category axis (horizontal bar): limit ticks only if very short height
            const pxPerCategory = target.height / Math.max(1, dataCount)
            if (pxPerCategory < 28) {
              axis.ticks = {
                ...(axis.ticks || {}),
                autoSkip: true,
                autoSkipPadding: 4,
              }
            }
          }
        }
      }
    }

    // Radial scale (radar / polarArea)
    if (scales.r && typeof scales.r === 'object') {
      const rAxis = scales.r
      scaleFontField(rAxis.pointLabels?.font, 'size', 'tick', fontBounds.tick, 'scales.r.pointLabels.font.size')
      scaleFontField(rAxis.ticks?.font, 'size', 'tick', fontBounds.tick, 'scales.r.ticks.font.size')
      if (typeof rAxis.pointLabels?.padding === 'number') {
        const prev = rAxis.pointLabels.padding
        const next = clamp(Math.round(prev * metrics.scaleMin), 4, 40)
        if (next !== prev) {
          rAxis.pointLabels.padding = next
          adjustments.push({ category: 'axes', field: 'scales.r.pointLabels.padding', from: prev, to: next })
        }
      }
      if (typeof rAxis.ticks?.backdropPadding === 'number') {
        rAxis.ticks.backdropPadding = clamp(Math.round(rAxis.ticks.backdropPadding * metrics.scaleMin), 1, 12)
      }
    }
  }

  // ── 5. 3D Plugin & Gauge Geometry Translation ──────────────────
  if (plugins.pie3d?.enabled) {
    if (typeof plugins.pie3d.depth === 'number') {
      const prev = plugins.pie3d.depth
      const next = clamp(Math.round(prev * metrics.scaleMin), 6, 60)
      if (next !== prev) {
        plugins.pie3d.depth = next
        adjustments.push({ category: '3d', field: 'plugins.pie3d.depth', from: prev, to: next })
      }
    }
    if (typeof plugins.pie3d.shadowBlur === 'number') {
      plugins.pie3d.shadowBlur = clamp(Math.round(plugins.pie3d.shadowBlur * metrics.scaleMin), 2, 32)
    }
    if (typeof plugins.pie3d.shadowOffsetY === 'number') {
      plugins.pie3d.shadowOffsetY = clamp(Math.round(plugins.pie3d.shadowOffsetY * metrics.scaleY), 1, 24)
    }
  }

  if (plugins.bar3d?.enabled) {
    if (typeof plugins.bar3d.depth === 'number') {
      const prev = plugins.bar3d.depth
      const next = clamp(Math.round(prev * metrics.scaleMin), 4, 48)
      if (next !== prev) {
        plugins.bar3d.depth = next
        adjustments.push({ category: '3d', field: 'plugins.bar3d.depth', from: prev, to: next })
      }
    }
    if (typeof plugins.bar3d.shadowBlur === 'number') {
      plugins.bar3d.shadowBlur = clamp(Math.round(plugins.bar3d.shadowBlur * metrics.scaleMin), 2, 32)
    }
    if (typeof plugins.bar3d.shadowOffsetY === 'number') {
      plugins.bar3d.shadowOffsetY = clamp(Math.round(plugins.bar3d.shadowOffsetY * metrics.scaleY), 1, 24)
    }
  }

  // ── 6. Dataset Style & Geometry Translation ────────────────────
  if (scaleDatasetGeometry) {
    const geomFactor = clamp(metrics.scaleMin * 0.6 + metrics.scaleDiag * 0.4, 0.5, 2.2)

    if (dsStyle.borderWidth !== undefined) {
      const prev = dsStyle.borderWidth
      const next = scaleScalarOrArrayNumber(dsStyle.borderWidth, geomFactor, 0, 12, 1)
      if (JSON.stringify(next) !== JSON.stringify(prev)) {
        dsStyle.borderWidth = next as any
        adjustments.push({ category: 'dataset', field: 'datasetStyle.borderWidth', from: JSON.stringify(prev), to: JSON.stringify(next) })
      }
    }

    if (dsStyle.borderRadius !== undefined) {
      const prev = dsStyle.borderRadius
      const next = scaleBorderRadiusValue(dsStyle.borderRadius, geomFactor)
      if (JSON.stringify(next) !== JSON.stringify(prev)) {
        dsStyle.borderRadius = next as any
        adjustments.push({ category: 'dataset', field: 'datasetStyle.borderRadius', from: JSON.stringify(prev), to: JSON.stringify(next) })
      }
    }

    if (dsStyle.pointRadius !== undefined) {
      const prev = dsStyle.pointRadius
      const next = scaleScalarOrArrayNumber(dsStyle.pointRadius, geomFactor, 0, 16, 1)
      if (JSON.stringify(next) !== JSON.stringify(prev)) {
        dsStyle.pointRadius = next as any
        adjustments.push({ category: 'dataset', field: 'datasetStyle.pointRadius', from: JSON.stringify(prev), to: JSON.stringify(next) })
      }
    }

    if (dsStyle.pointHoverRadius !== undefined) {
      dsStyle.pointHoverRadius = scaleScalarOrArrayNumber(dsStyle.pointHoverRadius, geomFactor, 1, 24, 1) as any
    }
    if (dsStyle.pointBorderWidth !== undefined) {
      dsStyle.pointBorderWidth = scaleScalarOrArrayNumber(dsStyle.pointBorderWidth, geomFactor, 0, 8, 1) as any
    }
    if (dsStyle.pointHoverBorderWidth !== undefined) {
      dsStyle.pointHoverBorderWidth = scaleScalarOrArrayNumber(dsStyle.pointHoverBorderWidth, geomFactor, 0, 10, 1) as any
    }
    if (dsStyle.hoverOffset !== undefined) {
      dsStyle.hoverOffset = scaleScalarOrArrayNumber(dsStyle.hoverOffset, geomFactor, 0, 36, 0) as any
    }

    if (Array.isArray(dsStyle.borderDash) && dsStyle.borderDash.length > 0) {
      dsStyle.borderDash = dsStyle.borderDash.map(d => clamp(Math.round(d * geomFactor), 1, 32))
    }

    // Scale pattern stroke/spacing so patterns don't look tiny on 1920x1080 or crowded on 400x200
    if (dsStyle.datasetPattern) {
      dsStyle.datasetPattern = {
        ...dsStyle.datasetPattern,
        lineWidth: clamp(roundTo(dsStyle.datasetPattern.lineWidth * geomFactor, 1), 0.5, 10),
        spacing: clamp(Math.round(dsStyle.datasetPattern.spacing * geomFactor), 4, 48),
      }
    }
    if (Array.isArray(dsStyle.slicePatterns)) {
      dsStyle.slicePatterns = dsStyle.slicePatterns.map(p =>
        p
          ? {
              ...p,
              lineWidth: clamp(roundTo(p.lineWidth * geomFactor, 1), 0.5, 10),
              spacing: clamp(Math.round(p.spacing * geomFactor), 4, 48),
            }
          : null
      )
    }

    if (dsStyle.pointImageStyle && typeof dsStyle.pointImageStyle === 'object') {
      if (typeof dsStyle.pointImageStyle.size === 'number') {
        dsStyle.pointImageStyle.size = clamp(Math.round(dsStyle.pointImageStyle.size * geomFactor), 12, 96)
      }
      if (typeof dsStyle.pointImageStyle.borderWidth === 'number') {
        dsStyle.pointImageStyle.borderWidth = clamp(Math.round(dsStyle.pointImageStyle.borderWidth * geomFactor), 0, 10)
      }
    }

    // Adapt bar proportions when transitioning across extreme aspect shifts
    const isBarLike = ['bar', 'horizontalBar', 'stackedBar', 'bar3d', 'horizontalBar3d', 'waterfall'].includes(preset.chartType)
    if (isBarLike && metrics.orientationChanged) {
      if (target.orientation === 'portrait' && preset.chartType === 'bar') {
        // Slimmer canvas width → slightly tighter bar packing keeps labels aligned cleanly
        dsStyle.categoryPercentage = dsStyle.categoryPercentage ?? 0.82
        dsStyle.barPercentage = dsStyle.barPercentage ?? 0.85
      } else if (target.orientation === 'landscape' && target.aspectRatio >= 1.5 && preset.chartType === 'bar') {
        // Wide landscape → prevent overly fat bars when there are few categories
        dsStyle.barPercentage = dsStyle.barPercentage ?? (dataCount <= 5 ? 0.65 : 0.8)
      }
    }
  }

  return {
    preset: clonedPreset,
    analysis,
    report: {
      source,
      target,
      metrics,
      adjustments,
    },
  }
}

/**
 * Batch-translate an array of presets to a common target dimension or aspect ratio.
 */
export function translatePresetsBatch(
  presets: ChartStylePreset[],
  targetInput: TargetDimensionsInput,
  options: TranslatePresetOptions = {}
): TranslatedPresetResult[] {
  return presets.map(preset => translatePresetToDimensions(preset, targetInput, options))
}
