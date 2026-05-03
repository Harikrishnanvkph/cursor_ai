/**
 * Chart Style Preset Types
 *
 * A Chart Style Preset captures the visual "recipe" of a chart — colors,
 * background, legend, grid, 3D settings, fonts, etc. — without any
 * data-dependent values (labels, data arrays, axis min/max, title text).
 *
 * Presets are data-agnostic: they can be applied to any chart data of any
 * length. Colors scale via the chosen ColorStrategy.mode.
 *
 * Phase 1: Hardcoded defaults (no DB)
 * Phase 2: DB-backed (chart_style_presets table)
 */

import type { SupportedChartType, ExtendedChartOptions, PatternConfig } from './chart-defaults'

// ========================================
// COLOR STRATEGY
// ========================================

/**
 * Defines how colors are assigned and scaled to any data length.
 *
 * - "single": All slices/bars use one color (dataset-level coloring)
 * - "slice":  Each slice/bar gets a unique color from baseColors (cycled if needed)
 */
export type ColorMode = 'single' | 'slice'

export interface ColorStrategy {
  /** How colors are assigned to data points */
  mode: ColorMode

  /**
   * The single color applied to all slices when mode === 'single'.
   * Ignored when mode === 'slice'.
   */
  singleColor: string | null

  /**
   * Base color palette (up to 8 colors). When the data has more points
   * than base colors, the engine cycles through them.
   * Used when mode === 'slice'.
   */
  baseColors: string[]

  /**
   * Border colors matching baseColors. If empty, borders are auto-derived
   * by darkening baseColors by 15%.
   */
  baseBorderColors: string[]
}

// ========================================
// DATASET STYLE TEMPLATE
// ========================================

/**
 * Dataset-level visual properties that are data-agnostic.
 * These get applied to every dataset when the preset is used.
 */
export interface DatasetStyleTemplate {
  borderWidth: number
  tension: number           // Line curve smoothness (0 = sharp, 1 = very smooth)
  fill: boolean             // Area fill under lines
  pointRadius: number       // Point size on line/scatter charts
  borderRadius: number | Record<string, number> // Rounded corners on bars (can be object for specific corners)
  hoverOffset?: number      // Expansion on hover (pie/doughnut)
  datasetPattern?: PatternConfig | null  // Pattern overlay
}

// ========================================
// PRESET DIMENSIONS
// ========================================

/**
 * Optional dimensions stored with the preset.
 * Only applied if the user explicitly opts in during preset application.
 */
export interface PresetDimensions {
  width: string   // e.g., '800px'
  height: string  // e.g., '600px'
}

// ========================================
// CHART STYLE PRESET (Core Type)
// ========================================

export type PresetCategory =
  | 'minimal'
  | 'bold'
  | 'pastel'
  | 'dark'
  | 'professional'
  | '3d'
  | 'gradient'
  | 'earthy'

/**
 * The full Chart Style Preset definition.
 *
 * This is what gets:
 * - Hardcoded in chart-style-defaults.ts (Phase 1)
 * - Stored in chart_style_presets table (Phase 2)
 * - Extracted from the editor via extractPresetFromCurrentChart()
 * - Applied to raw data via applyPresetToChart()
 */
export interface ChartStylePreset {
  // ── Identity ────────────────────────────
  id: string
  name: string
  description: string

  // ── Chart Type ──────────────────────────
  chartType: SupportedChartType

  // ── Color Strategy ──────────────────────
  colorStrategy: ColorStrategy

  // ── Sanitized Config ────────────────────
  /**
   * A deep-cloned, sanitized subset of ExtendedChartOptions.
   * All data-dependent properties have been stripped:
   *   - scales.*.min/max/stepSize/suggestedMin/suggestedMax
   *   - plugins.title.text / plugins.subtitle.text
   *   - plugins.datalabels.formatter (functions can't serialize)
   *   - plugins.customLabels / customLabelsConfig
   *   - templateDimensions / originalDimensions / dynamicDimension
   *
   * What IS included:
   *   - background (color/gradient/transparent)
   *   - legend (display, position, colors, pointStyle)
   *   - title/subtitle styling (font, color, display — NOT text)
   *   - datalabels (display, anchor, align, offset, color, font)
   *   - tooltip styling
   *   - scales styling (grid color/display, tick color/font, border, beginAtZero)
   *   - 3D plugin settings (pie3d, bar3d)
   *   - animation (duration, easing)
   *   - layout.padding
   *   - interaction (intersect, mode)
   *   - hoverFadeEffect
   *   - visualSettings (fillArea, showBorder, showImages, showLabels)
   */
  configSnapshot: Record<string, any>

  // ── Dataset Style ───────────────────────
  datasetStyle: DatasetStyleTemplate

  // ── Dimensions (optional) ───────────────
  dimensions: PresetDimensions | null

  // ── Categorization ──────────────────────
  category: PresetCategory
  tags: string[]

  // ── Ownership (Phase 2 — DB-backed) ─────
  isOfficial: boolean
  sortOrder: number

  // ── Thumbnail (optional, Phase 2) ───────
  thumbnailUrl?: string | null
}

// ========================================
// DATABASE ROW TYPE (Phase 2)
// ========================================

/**
 * Row type for the chart_style_presets table.
 * Maps directly to the DB schema.
 */
export interface ChartStylePresetRow {
  id: string
  name: string
  description: string | null
  chart_type: string
  color_strategy: Record<string, any>   // JSONB
  config_snapshot: Record<string, any>   // JSONB
  dataset_style: Record<string, any>    // JSONB
  dimensions: Record<string, any> | null // JSONB
  category: string
  tags: string[]
  user_id: string | null
  is_official: boolean
  is_public: boolean
  sort_order: number
  thumbnail_url: string | null
  created_at: string
  updated_at: string
}

// ========================================
// PRESET APPLICATION OPTIONS
// ========================================

/**
 * Options passed to applyPresetToChart() to control behavior.
 */
export interface PresetApplyOptions {
  /** If true, overwrite the chart's dimensions with the preset's dimensions */
  applyDimensions?: boolean
}

// ========================================
// PUBLISH DIALOG DATA
// ========================================

/**
 * Data collected from the admin's "Publish as Style" dialog.
 */
export interface PresetPublishData {
  name: string
  description: string
  category: PresetCategory
  tags: string[]
  colorMode: ColorMode
  isOfficial: boolean
  applyDimensions: boolean
}
