/**
 * Chart Style Engine
 *
 * Core logic for extracting, sanitizing, and applying chart style presets.
 *
 * Three main functions:
 *   1. extractPresetFromCurrentChart() — Reads the current chart state and
 *      produces a ChartStylePreset by stripping all data-dependent values.
 *   2. applyPresetToChart() — Takes a preset + raw data and merges them,
 *      producing styled chartData + chartConfig without mutating the data.
 *   3. sanitizeConfig() — The firewall that strips data-dependent properties
 *      from an ExtendedChartOptions object.
 */

import type {
  ExtendedChartData,
  ExtendedChartOptions,
  ExtendedChartDataset,
  SupportedChartType,
} from './chart-defaults'
import { getDefaultConfigForType } from './chart-defaults'
import { darkenColor, generateColorPalette, applyOpacityToColor } from './utils/color-utils'
import type {
  ChartStylePreset,
  ColorStrategy,
  DatasetStyleTemplate,
  PresetApplyOptions,
  PresetPublishData,
  PresetDimensions,
} from './chart-style-types'

// ========================================
// EXTRACTION — Build a preset from current chart state
// ========================================

/**
 * Extract a ChartStylePreset from the current editor state.
 * This is called when the admin clicks "Publish as Style".
 *
 * @param chartType - Current chart type
 * @param chartData - Current chart data (datasets + labels)
 * @param chartConfig - Current active chart config (already resolved for the active dataset/group)
 * @param publishData - Admin-provided metadata from the publish dialog
 * @returns A complete ChartStylePreset ready for storage
 */
export function extractPresetFromCurrentChart(
  chartType: SupportedChartType,
  chartData: ExtendedChartData,
  chartConfig: ExtendedChartOptions,
  publishData: PresetPublishData
): ChartStylePreset {
  const dataset = chartData.datasets[0] // Use first dataset as the style template

  // Extract base colors from ALL datasets (grouped mode may have different colors per dataset)
  // Collect unique colors across all datasets, up to 8
  let baseColors: string[] = []
  let baseBorderColors: string[] = []
  for (const ds of chartData.datasets) {
    const dsColors = extractBaseColors(ds)
    const dsBorderColors = extractBaseBorderColors(ds)
    for (const c of dsColors) {
      if (!baseColors.includes(c) && baseColors.length < 8) baseColors.push(c)
    }
    for (const c of dsBorderColors) {
      if (!baseBorderColors.includes(c) && baseBorderColors.length < 8) baseBorderColors.push(c)
    }
  }
  // Fallback to first dataset if nothing was collected
  if (baseColors.length === 0) baseColors = extractBaseColors(dataset)
  if (baseBorderColors.length === 0) baseBorderColors = extractBaseBorderColors(dataset)

  // Build color strategy based on admin's choice
  const colorStrategy: ColorStrategy = {
    mode: publishData.colorMode,
    singleColor: publishData.colorMode === 'single'
      ? (dataset?.color || (Array.isArray(dataset?.backgroundColor) ? (dataset.backgroundColor as any[])[0] : dataset?.backgroundColor) || baseColors[0] || '#3b82f6')
      : null,
    baseColors,
    baseBorderColors,
  }

  // Build dataset style template
  const datasetStyle: DatasetStyleTemplate = {
    borderWidth: (dataset?.borderWidth as number) ?? 2,
    tension: dataset?.tension ?? 0,
    fill: dataset?.fill === true,
    pointRadius: dataset?.pointRadius ?? 3,
    pointHoverRadius: (dataset as any)?.pointHoverRadius,
    pointBorderWidth: (dataset as any)?.pointBorderWidth,
    pointHoverBorderWidth: (dataset as any)?.pointHoverBorderWidth,
    pointStyle: (dataset as any)?.pointStyle,
    borderRadius: (dataset as any)?.borderRadius ?? 0,
    hoverOffset: (dataset as any)?.hoverOffset ?? undefined,
    datasetPattern: dataset?.datasetPattern ?? null,
  }

  // Build dimensions (only if admin opted in)
  const dimensions: PresetDimensions | null = publishData.applyDimensions
    ? {
        width: String(chartConfig.width || '800px'),
        height: String(chartConfig.height || '600px'),
      }
    : null

  // Sanitize the config
  const configSnapshot = sanitizeConfig(chartConfig)

  // Generate a stable ID from the name
  const id = `preset-${publishData.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')}`

  return {
    id,
    name: publishData.name,
    description: publishData.description,
    chartType,
    colorStrategy,
    configSnapshot,
    datasetStyle,
    dimensions,
    category: publishData.category,
    tags: publishData.tags,
    isOfficial: publishData.isOfficial,
    sortOrder: 100,
  }
}

// ========================================
// APPLICATION — Apply a preset to raw chart data
// ========================================

/**
 * Apply a ChartStylePreset to existing chart data.
 * This is the core engine that maps a preset onto any data shape.
 *
 * GUARANTEES:
 *   - data[] values are NEVER modified
 *   - labels[] are NEVER modified
 *   - Axis min/max/stepSize are NEVER set (Chart.js auto-scales)
 *   - Title/subtitle TEXT is preserved from the current chart
 *   - Dimensions are only changed if options.applyDimensions is true
 *
 * @param preset - The style preset to apply
 * @param currentData - The user's current chart data
 * @param currentConfig - The user's current chart config
 * @param options - Optional application settings
 * @returns New chartType, chartData, and chartConfig ready for setFullChart()
 */
export function applyPresetToChart(
  preset: ChartStylePreset,
  currentData: ExtendedChartData,
  currentConfig: ExtendedChartOptions,
  options: PresetApplyOptions = {}
): {
  chartType: SupportedChartType
  chartData: ExtendedChartData
  chartConfig: ExtendedChartOptions
} {
  const newChartType = preset.chartType
  const dataLength = currentData.labels?.length || 0
  const datasetCount = currentData.datasets.length
  const isGrouped = datasetCount > 1

  // Detect if any dataset has a different chartType (mixed mode)
  const isMixedMode = isGrouped && currentData.datasets.some(
    (ds, i) => i > 0 && ds.chartType && ds.chartType !== currentData.datasets[0]?.chartType
  )

  // Determine if this is an arc chart type (pie/doughnut/polar — per-slice coloring)
  const ARC_TYPES = ['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d']

  // If applying a gauge preset with single value, adjust labels to 2 slices
  let adjustedLabels = currentData.labels ? [...currentData.labels] : []
  if (newChartType === 'gauge' && (!adjustedLabels || adjustedLabels.length <= 1)) {
    adjustedLabels = ['Value', 'Remaining']
  }

  // ── 1. Style each dataset's colors ──────────────────────
  const styledDatasets = currentData.datasets.map((ds, dsIndex) => {
    // PRESERVE per-dataset chartType in mixed mode; apply preset type in uniform/single mode
    const dsChartType = isMixedMode ? (ds.chartType || newChartType) : newChartType

    // For gauge chart: if data has <= 1 point, expand to [val, 100 - val] so doughnut renders properly
    let styledData = ds.data
    if (newChartType === 'gauge' && Array.isArray(styledData) && styledData.length <= 1) {
      const numericVal = typeof styledData[0] === 'number' ? Math.abs(styledData[0]) : 70
      const remaining = Math.max(0, 100 - numericVal)
      styledData = [numericVal, remaining]
    }

    const styled = { ...ds, chartType: dsChartType, data: styledData } as ExtendedChartDataset

    // If not mixed mode, delete dataset.type so Chart.js uses the main chart type from the preset.
    // If mixed mode, set dataset.type so Chart.js renders the specific type.
    if (!isMixedMode) {
      delete styled.type
    } else {
      styled.type = dsChartType as any
    }

    // PRESERVE structural metadata that must NEVER be touched by style presets
    // (groupId, mode, sourceTitle, sourceId, label, sliceLabels, data)
    styled.groupId = ds.groupId
    styled.mode = ds.mode
    styled.sourceTitle = ds.sourceTitle
    styled.sourceId = ds.sourceId
    styled.sliceLabels = ds.sliceLabels

    // ── Color strategy for grouped mode ──
    const effectiveLength = styled.data?.length || dataLength
    const needsPerSliceArray = ARC_TYPES.includes(dsChartType as string) || dsChartType === 'gauge'

    if (preset.colorStrategy.mode === 'single') {
      const singleColor = preset.colorStrategy.singleColor || '#3b82f6'
      styled.datasetColorMode = 'single'
      styled.color = singleColor

      if (needsPerSliceArray) {
        styled.backgroundColor = Array(effectiveLength).fill(singleColor) as any
      } else {
        styled.backgroundColor = singleColor as any
      }

      const borderColor = preset.colorStrategy.baseBorderColors?.[0]
        || darkenColor(singleColor, 15)
      if (needsPerSliceArray) {
        styled.borderColor = Array(effectiveLength).fill(borderColor) as any
      } else {
        styled.borderColor = borderColor as any
      }
    } else {
      // Per-slice coloring
      styled.datasetColorMode = 'slice'
      styled.color = undefined

      if (isGrouped && !needsPerSliceArray) {
        // ── GROUPED MODE (bar, line, radar, etc.) ──
        // Each dataset gets ONE distinct color from the palette.
        const dsColor = preset.colorStrategy.baseColors[
          dsIndex % preset.colorStrategy.baseColors.length
        ] || '#3b82f6'
        styled.backgroundColor = dsColor as any

        const borderSeed = preset.colorStrategy.baseBorderColors.length > 0
          ? preset.colorStrategy.baseBorderColors
          : preset.colorStrategy.baseColors.map(c => darkenColor(c, 15))
        const dsBorderColor = borderSeed[
          dsIndex % borderSeed.length
        ] || darkenColor(dsColor, 15)
        styled.borderColor = dsBorderColor as any
      } else {
        // ── SINGLE MODE or ARC CHARTS ──
        // Full palette spread across all slices/data points
        const bgColors = scaleColors(preset.colorStrategy.baseColors, effectiveLength)
        styled.backgroundColor = bgColors as any

        const borderSeed = preset.colorStrategy.baseBorderColors.length > 0
          ? preset.colorStrategy.baseBorderColors
          : preset.colorStrategy.baseColors.map(c => darkenColor(c, 15))
        styled.borderColor = scaleColors(borderSeed, effectiveLength) as any
      }
    }

    // Apply dataset style template
    styled.borderWidth = preset.datasetStyle.borderWidth as any
    styled.tension = preset.datasetStyle.tension
    styled.fill = preset.datasetStyle.fill
    styled.pointRadius = preset.datasetStyle.pointRadius
    if (preset.datasetStyle.pointHoverRadius !== undefined) {
      ;(styled as any).pointHoverRadius = preset.datasetStyle.pointHoverRadius
    }
    if (preset.datasetStyle.pointBorderWidth !== undefined) {
      ;(styled as any).pointBorderWidth = preset.datasetStyle.pointBorderWidth
    }
    if (preset.datasetStyle.pointHoverBorderWidth !== undefined) {
      ;(styled as any).pointHoverBorderWidth = preset.datasetStyle.pointHoverBorderWidth
    }
    if (preset.datasetStyle.pointStyle !== undefined) {
      ;(styled as any).pointStyle = preset.datasetStyle.pointStyle
    }
    if (preset.datasetStyle.borderRadius != null) {
      ;(styled as any).borderRadius = preset.datasetStyle.borderRadius
    }
    if (preset.datasetStyle.hoverOffset != null) {
      ;(styled as any).hoverOffset = preset.datasetStyle.hoverOffset
    }
    if (preset.datasetStyle.datasetPattern !== undefined) {
      styled.datasetPattern = preset.datasetStyle.datasetPattern
    }

    // Area chart in grouped mode: apply 50% opacity to prevent opaque background blocking datasets
    if ((dsChartType === 'area' || styled.fill) && isGrouped) {
      if (Array.isArray(styled.backgroundColor)) {
        styled.backgroundColor = styled.backgroundColor.map(c =>
          typeof c === 'string' ? applyOpacityToColor(c, 50) : c
        ) as any
      } else if (typeof styled.backgroundColor === 'string') {
        styled.backgroundColor = applyOpacityToColor(styled.backgroundColor, 50) as any
      }
    }

    return styled
  })

  // ── 2. Build merged config ──────────────────────────────
  // Start from the type-appropriate defaults, then layer the preset's snapshot
  const baseConfig = getDefaultConfigForType(newChartType)
  const mergedConfig = deepMergeConfigs(baseConfig, preset.configSnapshot)

  // ── 3. Preserve user's content text ─────────────────────
  if (currentConfig.plugins) {
    const currentPlugins = currentConfig.plugins as any
    if (currentPlugins.title?.text) {
      if (!mergedConfig.plugins) mergedConfig.plugins = {}
      ;(mergedConfig.plugins as any).title = {
        ...((mergedConfig.plugins as any).title || {}),
        text: currentPlugins.title.text,
      }
    }
    if (currentPlugins.subtitle?.text) {
      if (!mergedConfig.plugins) mergedConfig.plugins = {}
      ;(mergedConfig.plugins as any).subtitle = {
        ...((mergedConfig.plugins as any).subtitle || {}),
        text: currentPlugins.subtitle.text,
      }
    }
  }

  // Preserve and semantically transfer Cartesian scales (axis titles, number formats, thresholds, zero lines)
  const isHorizontalChartType = (type: string) =>
    type === 'horizontalBar' || type === 'horizontalBar3d' || type === 'funnel'

  const currentCfg = currentConfig as any
  const mergedCfg = mergedConfig as any
  const oldChartType = currentCfg.type || (currentData.datasets[0] as any)?.chartType || (currentData.datasets[0] as any)?.type || 'bar'
  const isOldHorizontal = isHorizontalChartType(oldChartType) || currentCfg.indexAxis === 'y'
  const isNewHorizontal = isHorizontalChartType(newChartType) || mergedCfg.indexAxis === 'y'

  const oldScales = currentCfg.scales
  if (mergedCfg.scales && (mergedCfg.scales.x || mergedCfg.scales.y)) {
    const oldCategoryAxis = isOldHorizontal ? oldScales?.y : oldScales?.x
    const oldValueAxis = isOldHorizontal ? oldScales?.x : oldScales?.y
    const targetCategoryKey = isNewHorizontal ? 'y' : 'x'
    const targetValueKey = isNewHorizontal ? 'x' : 'y'

    // Transfer / Sanitize Category Axis
    const targetCatAxis = mergedCfg.scales[targetCategoryKey]
    if (targetCatAxis) {
      const userCatTitleText = oldCategoryAxis?.title?.text
      const hasUserCatTitle = typeof userCatTitleText === 'string' && userCatTitleText.trim().length > 0
      if (hasUserCatTitle) {
        if (!targetCatAxis.title) targetCatAxis.title = {}
        targetCatAxis.title.text = userCatTitleText
        targetCatAxis.title.display = oldCategoryAxis?.title?.display ?? true
      } else {
        // Strip dummy preset titles if user did not specify a category title
        if (targetCatAxis.title) {
          delete targetCatAxis.title.text
          targetCatAxis.title.display = false
        }
      }
    }

    // Transfer / Sanitize Value Axis
    const targetValAxis = mergedCfg.scales[targetValueKey]
    if (targetValAxis) {
      const userValTitleText = oldValueAxis?.title?.text
      const hasUserValTitle = typeof userValTitleText === 'string' && userValTitleText.trim().length > 0
      if (hasUserValTitle) {
        if (!targetValAxis.title) targetValAxis.title = {}
        targetValAxis.title.text = userValTitleText
        targetValAxis.title.display = oldValueAxis?.title?.display ?? true
      } else {
        // Strip dummy preset titles if user did not specify a value title
        if (targetValAxis.title) {
          delete targetValAxis.title.text
          targetValAxis.title.display = false
        }
      }

      // Preserve tick numberFormat on value axis
      if (oldValueAxis?.ticks?.numberFormat) {
        targetValAxis.ticks = {
          ...(targetValAxis.ticks || {}),
          numberFormat: oldValueAxis.ticks.numberFormat,
        }
      }

      // Preserve threshold (goal line / benchmark)
      if (oldValueAxis?.threshold !== undefined) {
        targetValAxis.threshold = oldValueAxis.threshold
      }

      // Preserve zero line settings
      if (oldValueAxis?.highlightZeroLine !== undefined) {
        targetValAxis.highlightZeroLine = oldValueAxis.highlightZeroLine
      }
      if (oldValueAxis?.zeroLineColor) {
        targetValAxis.zeroLineColor = oldValueAxis.zeroLineColor
      }
    }

    // Preserve secondary axis y1 if present
    if (oldScales?.y1) {
      mergedCfg.scales.y1 = {
        ...(mergedCfg.scales.y1 || {}),
        ...oldScales.y1,
      }
    }
  }

  // Radial scale transfer
  if ((newChartType === 'radar' || newChartType === 'polarArea') && mergedCfg.scales?.r) {
    const oldValueAxis = isOldHorizontal ? oldScales?.x : oldScales?.y
    if (oldValueAxis?.ticks?.numberFormat) {
      mergedCfg.scales.r.ticks = {
        ...(mergedCfg.scales.r.ticks || {}),
        numberFormat: oldValueAxis.ticks.numberFormat,
      }
    }
  } else if ((oldChartType === 'radar' || oldChartType === 'polarArea') && oldScales?.r?.ticks?.numberFormat) {
    const targetValueKey = isNewHorizontal ? 'x' : 'y'
    if (mergedCfg.scales?.[targetValueKey]) {
      mergedCfg.scales[targetValueKey].ticks = {
        ...(mergedCfg.scales[targetValueKey].ticks || {}),
        numberFormat: oldScales.r.ticks.numberFormat,
      }
    }
  }

  // Preserve root-level number format
  if (currentCfg.numberFormat) {
    mergedCfg.numberFormat = currentCfg.numberFormat
  }

  // ── 4. Handle dimensions ────────────────────────────────
  if (options.applyDimensions && preset.dimensions) {
    mergedConfig.width = preset.dimensions.width
    mergedConfig.height = preset.dimensions.height
    mergedConfig.manualDimensions = true
    mergedConfig.responsive = false
  } else {
    // Preserve the user's current dimension settings
    mergedConfig.width = currentConfig.width
    mergedConfig.height = currentConfig.height
    mergedConfig.manualDimensions = currentConfig.manualDimensions
    mergedConfig.responsive = currentConfig.responsive
  }

  // Always clear these flags — they don't belong to presets
  mergedConfig.templateDimensions = false
  mergedConfig.originalDimensions = false
  mergedConfig.dynamicDimension = false

  // ── 5. Backfill per-dataset chartConfig ─────────────────
  const finalDatasets = styledDatasets.map(ds => ({
    ...ds,
    chartConfig: JSON.parse(JSON.stringify(mergedConfig)),
  }))

  return {
    chartType: newChartType,
    chartData: {
      ...currentData,
      labels: adjustedLabels,
      datasets: finalDatasets,
    },
    chartConfig: mergedConfig,
  }
}

// ========================================
// SANITIZE CONFIG — The data-safety firewall
// ========================================

/**
 * Strip all data-dependent properties from a chart config.
 * The result is safe to serialize and store as a preset.
 *
 * STRIPS:
 *   - scales.*.min / max / suggestedMin / suggestedMax
 *   - scales.*.threshold (goal lines/benchmarks)
 *   - scales.*.title.text (user-specific axis titles)
 *   - scales.*.ticks.numberFormat / root numberFormat
 *   - scales.*.ticks.stepSize / callback
 *   - plugins.title.text / plugins.subtitle.text
 *   - plugins.datalabels.formatter (function — can't serialize)
 *   - plugins.customLabels / customLabelsConfig
 *   - templateDimensions / originalDimensions / dynamicDimension
 *   - width / height (saved separately in preset.dimensions)
 *   - manualDimensions / responsive (saved separately)
 *
 * PRESERVES everything else (background, legend, grid styling, 3D, etc.)
 */
export function sanitizeConfig(config: ExtendedChartOptions): Record<string, any> {
  // Deep clone to prevent mutating the source
  const clean: any = JSON.parse(JSON.stringify(config))

  // ── Strip scale values and user-specific scale metadata ──────────────────────────
  if (clean.scales) {
    for (const axisKey of Object.keys(clean.scales)) {
      const axis = clean.scales[axisKey]
      if (!axis || typeof axis !== 'object') continue

      delete axis.min
      delete axis.max
      delete axis.suggestedMin
      delete axis.suggestedMax
      delete axis.threshold // User goal line / benchmark

      if (axis.title) {
        delete axis.title.text // Never leak active user axis title text into published preset
      }

      if (axis.ticks) {
        delete axis.ticks.stepSize
        delete axis.ticks.callback
        delete axis.ticks.numberFormat // Strip data-specific number formatting
      }
    }
  }

  delete clean.numberFormat // Root numberFormat if present

  // ── Strip content text ──────────────────────────────────
  if (clean.plugins?.title) {
    delete clean.plugins.title.text
  }
  if (clean.plugins?.subtitle) {
    delete clean.plugins.subtitle.text
  }

  // ── Strip non-serializable functions ────────────────────
  if (clean.plugins?.datalabels?.formatter) {
    delete clean.plugins.datalabels.formatter
  }

  // ── Strip custom label plugin data ──────────────────────
  // These contain absolute positions tied to specific data geometries
  delete clean.plugins?.customLabels
  delete clean.plugins?.customLabelsConfig

  // ── Strip dimension-mode flags ──────────────────────────
  // Dimensions are stored separately in preset.dimensions
  delete clean.width
  delete clean.height
  delete clean.manualDimensions
  delete clean.responsive
  delete clean.templateDimensions
  delete clean.originalDimensions
  delete clean.dynamicDimension

  return clean
}

// ========================================
// COLOR UTILITIES
// ========================================

/**
 * Scale a base color array to any target length via cycling.
 * If baseColors is empty, falls back to generateColorPalette().
 */
export function scaleColors(baseColors: string[], targetLength: number): string[] {
  if (!baseColors || baseColors.length === 0) {
    return generateColorPalette(targetLength)
  }
  if (targetLength <= 0) return []
  if (targetLength <= baseColors.length) {
    return baseColors.slice(0, targetLength)
  }

  // Cycle through base colors
  const result: string[] = []
  for (let i = 0; i < targetLength; i++) {
    result.push(baseColors[i % baseColors.length])
  }
  return result
}

/**
 * Extract up to 8 unique base colors from a dataset's backgroundColor.
 */
function extractBaseColors(dataset: ExtendedChartDataset | undefined): string[] {
  if (!dataset) return []

  const bg = dataset.backgroundColor
  if (!bg) return []

  // If it's a single string
  if (typeof bg === 'string') return [bg]

  // If it's an array, deduplicate and take first 8
  if (Array.isArray(bg)) {
    const unique: string[] = []
    for (const color of bg) {
      if (typeof color === 'string' && !unique.includes(color)) {
        unique.push(color)
      }
      if (unique.length >= 8) break
    }
    return unique
  }

  return []
}

/**
 * Extract up to 8 unique border colors from a dataset's borderColor.
 */
function extractBaseBorderColors(dataset: ExtendedChartDataset | undefined): string[] {
  if (!dataset) return []

  const bc = dataset.borderColor
  if (!bc) return []

  if (typeof bc === 'string') return [bc]

  if (Array.isArray(bc)) {
    const unique: string[] = []
    for (const color of bc) {
      if (typeof color === 'string' && !unique.includes(color)) {
        unique.push(color)
      }
      if (unique.length >= 8) break
    }
    return unique
  }

  return []
}

// ========================================
// DEEP MERGE UTILITY
// ========================================

/**
 * Deep merge two config objects. Source values override target values.
 * Arrays are replaced (not concatenated).
 * Functions in target are preserved if source doesn't provide a replacement.
 */
function deepMergeConfigs(
  target: Record<string, any>,
  source: Record<string, any>
): ExtendedChartOptions {
  const result: any = JSON.parse(JSON.stringify(target))

  for (const key of Object.keys(source)) {
    const sourceVal = source[key]
    const targetVal = result[key]

    if (sourceVal === null || sourceVal === undefined) {
      continue // Don't overwrite with null/undefined
    }

    if (
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal) &&
      targetVal !== null
    ) {
      // Recurse into nested objects
      result[key] = deepMergeConfigs(targetVal, sourceVal)
    } else {
      // Primitives, arrays, and type mismatches → replace
      result[key] = JSON.parse(JSON.stringify(sourceVal))
    }
  }

  return result
}

// ========================================
// PRESET COMPATIBILITY CHECK
// ========================================

/**
 * Check if a preset is compatible with the current chart data.
 * Returns a compatibility score and warnings.
 */
export function checkPresetCompatibility(
  preset: ChartStylePreset,
  chartData: ExtendedChartData
): { compatible: boolean; warnings: string[] } {
  const warnings: string[] = []
  const datasetCount = chartData.datasets.length
  const dataLength = chartData.labels?.length || 0

  // Pie/doughnut/polarArea work best with single dataset
  const singleDatasetTypes = ['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d']
  if (singleDatasetTypes.includes(preset.chartType) && datasetCount > 1) {
    warnings.push(`${preset.name} works best with a single dataset. Only the first dataset will be shown.`)
  }

  // Scatter/bubble need {x, y} data format
  const coordTypes = ['scatter', 'bubble']
  if (coordTypes.includes(preset.chartType)) {
    const firstData = chartData.datasets[0]?.data?.[0]
    if (firstData != null && typeof firstData !== 'object') {
      warnings.push(`${preset.name} requires coordinate data (x/y). Your data may not render correctly.`)
    }
  }

  // Radar needs at least 3 data points to look good
  if (preset.chartType === 'radar' && dataLength < 3) {
    warnings.push('Radar charts work best with 3+ data points.')
  }

  return {
    compatible: warnings.length === 0,
    warnings,
  }
}
