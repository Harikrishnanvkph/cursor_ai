/**
 * Variant Engine
 * 
 * Maps chart data + content into format skeletons to produce RenderedFormat objects.
 * This is the core logic for the multi-format chart gallery.
 *
 * Flow:
 *   1. User asks LLM → response includes chart data (labels, datasets, config)
 *   2. Gallery opens with available format skeletons
 *   3. For each skeleton, the variant engine produces a RenderedFormat preview
 *   4. User selects a format → full render with mapped content
 */

import type {
  FormatSkeleton,
  FormatBlueprintRow,
  FormatZone,
  TextZone,
  ChartZone,
  StatZone,
  BackgroundZone,
  DecorationZone,
  RenderedZone,
  RenderedFormat,
  LLMContentPackage,
  FormatColorPalette,
  ContentStat,
} from '@/lib/format-types'
import { deepCloneConfig } from '@/lib/utils/config-freeze'

// ========================================
// CONTENT EXTRACTION — Build LLMContentPackage from existing chart data
// ========================================

/**
 * Extract an LLMContentPackage from the current chart store state.
 * This is a "bridge" function that converts existing chart data
 * into the format expected by the variant engine, without requiring
 * LLM prompt changes yet.
 */
export function extractContentFromChartData(
  chartType: string,
  chartData: { labels: string[]; datasets: any[] },
  chartConfig: Record<string, any>
): LLMContentPackage {
  const title = chartConfig?.plugins?.title?.text || 'Chart Data'
  const subtitle = chartConfig?.plugins?.subtitle?.text || ''
  const labels = chartData?.labels || []
  const datasets = chartData?.datasets || []

  // Extract stats from the data by finding the most notable values
  const stats: ContentStat[] = extractStats(datasets, labels)

  // Generate keywords from labels and title
  const keywords = generateKeywords(title, subtitle, labels)

  // Determine data story type
  const dataStory = inferDataStory(chartType, datasets)

  // Suggest chart types for variant generation
  const suggestedChartTypes = suggestChartTypes(chartType)

  // Generate meaningful body text from the actual data
  const body = generateBodyText(title, subtitle, labels, datasets, stats, dataStory, chartType)

  // Generate a source line from subtitle or data context
  const source = generateSourceText(subtitle, title)

  // Generate a meaningful callout
  const callout = generateCalloutText(stats, labels, datasets, dataStory)

  return {
    title,
    subtitle: subtitle || undefined,
    body,
    source,
    callout,
    stats,
    keywords,
    dataStory,
    chartData: {
      labels,
      datasets,
    },
    suggestedChartTypes,
    chartConfig: deepCloneConfig(chartConfig),
  }
}

/**
 * Extract notable statistics from chart datasets
 */
function extractStats(datasets: any[], labels: string[]): ContentStat[] {
  const stats: ContentStat[] = []
  if (!datasets.length) return stats

  const firstDataset = datasets[0]
  const data = firstDataset?.data || []
  if (!data.length) return stats

  // Find max value
  const maxIdx = data.indexOf(Math.max(...data.filter((v: any) => typeof v === 'number')))
  if (maxIdx >= 0) {
    stats.push({
      value: formatNumber(data[maxIdx]),
      label: labels[maxIdx] || `Highest (${firstDataset.label || 'Dataset 1'})`,
    })
  }

  // Find min value
  const minIdx = data.indexOf(Math.min(...data.filter((v: any) => typeof v === 'number')))
  if (minIdx >= 0 && minIdx !== maxIdx) {
    stats.push({
      value: formatNumber(data[minIdx]),
      label: labels[minIdx] || `Lowest (${firstDataset.label || 'Dataset 1'})`,
    })
  }

  // Total / sum as third stat
  const sum = data.reduce((acc: number, v: any) => acc + (typeof v === 'number' ? v : 0), 0)
  if (sum > 0) {
    stats.push({
      value: formatNumber(sum),
      label: 'Total',
    })
  }

  return stats.slice(0, 3) // Max 3 stats
}

/**
 * Format large numbers for display
 */
function formatNumber(n: number): string {
  if (typeof n !== 'number') return String(n)
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1_000).toFixed(1)}K`
  if (Number.isInteger(n)) return n.toLocaleString()
  return n.toFixed(1)
}

/**
 * Generate a meaningful body paragraph from the actual chart data.
 * Produces a contextual narrative instead of a generic placeholder.
 */
function generateBodyText(
  title: string,
  subtitle: string,
  labels: string[],
  datasets: any[],
  stats: ContentStat[],
  dataStory: string,
  chartType: string
): string {
  if (!datasets.length || !labels.length) {
    return title !== 'Chart Data' ? title : ''
  }

  const firstDataset = datasets[0]
  const data: number[] = (firstDataset?.data || []).filter((v: any) => typeof v === 'number')
  if (!data.length) return subtitle || title

  // Build ranked entries (label + value) sorted descending
  const ranked = labels
    .map((label, i) => ({ label, value: data[i] }))
    .filter(e => typeof e.value === 'number')
    .sort((a, b) => b.value - a.value)

  const topEntries = ranked.slice(0, 3)
  const datasetLabel = firstDataset?.label || ''

  // Build narrative based on data story type
  const parts: string[] = []

  if (dataStory === 'ranking' || dataStory === 'comparison') {
    // "China leads with 980M, followed by India (780M) and the United States (250M)."
    if (topEntries.length >= 2) {
      parts.push(
        `${topEntries[0].label} leads with ${formatNumber(topEntries[0].value)}`
      )
      const followers = topEntries.slice(1).map(
        e => `${e.label} (${formatNumber(e.value)})`
      )
      parts[0] += `, followed by ${followers.join(' and ')}.`
    } else if (topEntries.length === 1) {
      parts.push(`${topEntries[0].label} leads at ${formatNumber(topEntries[0].value)}.`)
    }

    // Add range/spread context
    if (ranked.length >= 2) {
      const gap = ranked[0].value - ranked[ranked.length - 1].value
      if (gap > 0) {
        parts.push(
          `The data spans ${ranked.length} ${labels.length > 1 ? 'categories' : 'entries'} with a range of ${formatNumber(gap)}.`
        )
      }
    }
  } else if (dataStory === 'trend') {
    // Describe the trend direction
    const first = data[0]
    const last = data[data.length - 1]
    const change = last - first
    const pctChange = first !== 0 ? ((change / Math.abs(first)) * 100) : 0

    if (change > 0) {
      parts.push(
        `The trend shows growth from ${formatNumber(first)} to ${formatNumber(last)}${Math.abs(pctChange) >= 1 ? `, a ${Math.abs(pctChange).toFixed(0)}% increase` : ''} over the period.`
      )
    } else if (change < 0) {
      parts.push(
        `The trend shows a decline from ${formatNumber(first)} to ${formatNumber(last)}${Math.abs(pctChange) >= 1 ? `, a ${Math.abs(pctChange).toFixed(0)}% decrease` : ''} over the period.`
      )
    } else {
      parts.push(`Values remained stable at ${formatNumber(first)} across the period.`)
    }

    // Mention peak
    if (stats.length > 0) {
      parts.push(`Peak value: ${stats[0].value} (${stats[0].label}).`)
    }
  } else if (dataStory === 'composition') {
    // Describe share/composition
    const total = data.reduce((s, v) => s + v, 0)
    if (total > 0 && topEntries.length >= 1) {
      const topPct = ((topEntries[0].value / total) * 100).toFixed(0)
      parts.push(
        `${topEntries[0].label} accounts for ${topPct}% of the total (${formatNumber(total)}).`
      )
      if (topEntries.length >= 2) {
        const secondPct = ((topEntries[1].value / total) * 100).toFixed(0)
        parts.push(
          `${topEntries[1].label} follows at ${secondPct}%.`
        )
      }
    }
  } else if (dataStory === 'distribution') {
    // Describe spread
    const avg = data.reduce((s, v) => s + v, 0) / data.length
    parts.push(
      `The data averages ${formatNumber(avg)} across ${data.length} observations, ranging from ${formatNumber(Math.min(...data))} to ${formatNumber(Math.max(...data))}.`
    )
  }

  // Fallback if nothing was generated
  if (parts.length === 0) {
    if (subtitle) {
      parts.push(subtitle)
    } else if (title !== 'Chart Data') {
      parts.push(`${title} — covering ${labels.length} data points.`)
    }
  }

  return parts.join(' ')
}

/**
 * Generate a source/attribution text from chart metadata.
 */
function generateSourceText(subtitle: string, title: string): string | undefined {
  // If subtitle looks like a source attribution, use it directly
  if (subtitle) {
    const lowerSub = subtitle.toLowerCase()
    if (
      lowerSub.includes('source') ||
      lowerSub.includes('data from') ||
      lowerSub.includes('based on') ||
      lowerSub.includes('according to') ||
      lowerSub.includes('report') ||
      lowerSub.includes('survey') ||
      lowerSub.includes('as of') ||
      lowerSub.includes('estimated')
    ) {
      return subtitle
    }
    // Use subtitle as supplementary context
    return subtitle
  }
  return undefined
}

/**
 * Generate a punchy callout text from the most notable data insight.
 */
function generateCalloutText(
  stats: ContentStat[],
  labels: string[],
  datasets: any[],
  dataStory: string
): string | undefined {
  if (!stats.length) return undefined

  const topStat = stats[0]

  // For composition charts, express as percentage callout
  if (dataStory === 'composition' && datasets.length > 0) {
    const data = datasets[0]?.data || []
    const total = data.reduce((s: number, v: any) => s + (typeof v === 'number' ? v : 0), 0)
    if (total > 0 && typeof data[0] === 'number') {
      // Find the max value's percentage
      const maxVal = Math.max(...data.filter((v: any) => typeof v === 'number'))
      const pct = ((maxVal / total) * 100).toFixed(0)
      return `${pct}% — ${topStat.label}`
    }
  }

  // For trends, show the change
  if (dataStory === 'trend' && datasets.length > 0) {
    const data = datasets[0]?.data || []
    const numData = data.filter((v: any) => typeof v === 'number')
    if (numData.length >= 2) {
      const change = numData[numData.length - 1] - numData[0]
      const direction = change >= 0 ? '↑' : '↓'
      return `${direction} ${formatNumber(Math.abs(change))} change`
    }
  }

  // Default: show the top stat prominently
  return `${topStat.value} — ${topStat.label}`
}

/**
 * Generate keywords from chart context
 */
function generateKeywords(title: string, subtitle: string, labels: string[]): string[] {
  const text = `${title} ${subtitle} ${labels.join(' ')}`.toLowerCase()
  const words = text.split(/\s+/).filter(w => w.length > 3)
  // Deduplicate
  return [...new Set(words)].slice(0, 10)
}

/**
 * Infer the data story type from chart properties
 */
function inferDataStory(
  chartType: string,
  datasets: any[]
): 'comparison' | 'trend' | 'distribution' | 'ranking' | 'composition' {
  const type = chartType.toLowerCase()
  if (['pie', 'doughnut', 'pie3d', 'doughnut3d'].includes(type)) return 'composition'
  if (['line', 'area'].includes(type)) return 'trend'
  if (['bar', 'bar3d', 'horizontalBar'].includes(type)) {
    return datasets.length > 1 ? 'comparison' : 'ranking'
  }
  if (['scatter', 'bubble'].includes(type)) return 'distribution'
  return 'comparison'
}

/**
 * Suggest alternative chart types for variant diversification
 */
export function suggestChartTypes(currentType: string): string[] {
  const suggestions: Record<string, string[]> = {
    bar: ['bar', 'horizontalBar', 'pie', 'doughnut', 'line'],
    bar3d: ['bar3d', 'bar', 'pie3d', 'doughnut3d'],
    line: ['line', 'bar', 'area', 'scatter'],
    pie: ['pie', 'doughnut', 'bar', 'pie3d'],
    pie3d: ['pie3d', 'doughnut3d', 'pie', 'bar3d'],
    doughnut: ['doughnut', 'pie', 'bar', 'doughnut3d'],
    doughnut3d: ['doughnut3d', 'pie3d', 'doughnut', 'bar3d'],
    scatter: ['scatter', 'bubble', 'line'],
    radar: ['radar', 'polarArea', 'bar'],
    polarArea: ['polarArea', 'radar', 'doughnut'],
  }
  return suggestions[currentType] || [currentType, 'bar', 'pie']
}

// ========================================
// RENDERING — Map content into skeleton zones
// ========================================

/**
 * Render a single format: merge a skeleton + content package → RenderedFormat
 */
export function renderFormat(
  blueprint: FormatBlueprintRow,
  content: LLMContentPackage,
  chartTypeOverride?: string,
  contextualImageUrl?: string
): RenderedFormat {
  const skeleton = blueprint.skeleton as unknown as FormatSkeleton
  const zones = skeleton.zones || []
  const palette = skeleton.colorPalette
  const chartType = chartTypeOverride || content.suggestedChartTypes?.[0] || 'bar'

  // Render each zone
  const renderedZones: RenderedZone[] = zones.map(zone =>
    renderZone(zone, content, palette, chartType, contextualImageUrl)
  )

  // Build variant label
  const variantLabel = `${skeleton.name} · ${chartType} · ${skeleton.dimensions.aspect}`

  return {
    skeleton,
    renderedZones,
    chartType,
    colorPalette: palette,
    variantId: `${blueprint.id}-${chartType}`,
    variantLabel,
  }
}

/**
 * Render a single zone by mapping content into it
 */
function renderZone(
  zone: FormatZone,
  content: LLMContentPackage,
  palette: FormatColorPalette,
  chartType: string,
  contextualImageUrl?: string
): RenderedZone {
  switch (zone.type) {
    case 'text':
      return renderTextZone(zone as TextZone, content)
    case 'chart':
      return renderChartZone(zone as ChartZone, content, palette, chartType)
    case 'stat':
      return renderStatZone(zone as StatZone, content)
    case 'background':
      return renderBackgroundZone(zone as BackgroundZone, content, contextualImageUrl)
    case 'decoration':
      return renderDecorationZone(zone as DecorationZone)
    default:
      return { zone }
  }
}

/**
 * Map text content to a text zone based on role
 */
function renderTextZone(zone: TextZone, content: LLMContentPackage): RenderedZone {
  let text = ''
  switch (zone.role) {
    case 'title':
      text = content.title || 'Untitled'
      break
    case 'subtitle':
      text = content.subtitle || ''
      break
    case 'body':
      text = content.body || ''
      break
    case 'source':
      text = content.source || ''
      break
    case 'callout':
      text = content.callout || ''
      break
  }

  // Enforce character limits to prevent overflow/clipping:
  // 1. Use explicit maxLength if set by the format admin
  // 2. Otherwise, calculate from zone dimensions and font size
  let effectiveMaxLength = zone.maxLength || 0
  if (!effectiveMaxLength && zone.position && zone.style) {
    const { width, height } = zone.position
    const fontSize = zone.style.fontSize || 16
    const lineHeight = zone.style.lineHeight || 1.5
    const padding = 16
    const avgCharWidth = fontSize * 0.55
    const charsPerLine = Math.floor((width - padding) / avgCharWidth)
    const maxLines = Math.max(1, Math.floor((height - padding) / (fontSize * lineHeight)))
    effectiveMaxLength = charsPerLine * maxLines
  }

  if (effectiveMaxLength > 0 && text.length > effectiveMaxLength) {
    text = text.substring(0, effectiveMaxLength - 1) + '…'
  }

  return {
    zone,
    resolvedContent: text,
  }
}

/**
 * Map chart data to a chart zone
 */
function renderChartZone(
  zone: ChartZone,
  content: LLMContentPackage,
  palette: FormatColorPalette,
  chartType: string
): RenderedZone {
  // Apply palette colors to datasets
  const coloredData = applyPaletteToData(content.chartData, palette)

  // Build chart config
  // Deep clone to prevent mutation leaking back to chart store's source config
  const config: Record<string, any> = deepCloneConfig(content.chartConfig || {});
  config.responsive = true;
  config.maintainAspectRatio = false;

  // Apply zone-specific chart config
  if (zone.chartConfig) {
    if (zone.chartConfig.legendPosition && zone.chartConfig.legendPosition !== 'none') {
      config.plugins = config.plugins || {}
      config.plugins.legend = {
        ...(config.plugins?.legend || {}),
        position: zone.chartConfig.legendPosition,
      }
      if (zone.chartConfig.legendColor) {
        config.plugins.legend.labels = {
          ...(config.plugins?.legend?.labels || {}),
          color: zone.chartConfig.legendColor,
        }
      }
    } else if (zone.chartConfig.legendPosition === 'none') {
      config.plugins = config.plugins || {}
      config.plugins.legend = { display: false }
    }

    if (zone.chartConfig.showGrid === false) {
      config.scales = config.scales || {}
      config.scales.x = { ...(config.scales?.x || {}), grid: { display: false } }
      config.scales.y = { ...(config.scales?.y || {}), grid: { display: false } }
    }

    if (zone.chartConfig.backgroundColor) {
      config.backgroundColor = zone.chartConfig.backgroundColor
    }
  }

  return {
    zone,
    resolvedChartType: chartType,
    resolvedChartData: coloredData,
    resolvedChartConfig: config,
  }
}

/**
 * Map stat data to a stat zone
 */
function renderStatZone(zone: StatZone, content: LLMContentPackage): RenderedZone {
  const stats = content.stats || []
  let stat: ContentStat | undefined

  switch (zone.role) {
    case 'highlight':
      stat = stats[0] // Primary/most important stat
      break
    case 'secondary':
      stat = stats[1]
      break
    case 'tertiary':
      stat = stats[2]
      break
  }

  return {
    zone,
    resolvedValue: stat?.value || '—',
    resolvedLabel: stat?.label || '',
  }
}

/**
 * Map background content to a background zone
 */
function renderBackgroundZone(
  zone: BackgroundZone, 
  content: LLMContentPackage,
  contextualImageUrl?: string
): RenderedZone {
  const result: RenderedZone = { zone }

  // If the zone has a pre-filled background image, use it only if type is 'image'
  if (zone.style.type === 'image' && zone.style.imageUrl) {
    result.resolvedImageUrl = zone.style.imageUrl
    return result
  }

  // Use dynamically fetched contextual image if required by this zone
  if (zone.contextual && contextualImageUrl) {
    result.resolvedImageUrl = contextualImageUrl
    return result
  }

  // For gradient backgrounds, resolve from the zone style
  if (zone.style.type === 'gradient' && zone.style.gradientColor1 && zone.style.gradientColor2) {
    const direction = zone.style.gradientDirection || '135deg'
    result.resolvedGradient = `linear-gradient(${direction}, ${zone.style.gradientColor1}, ${zone.style.gradientColor2})`
    return result
  }

  // For solid backgrounds
  if (zone.style.type === 'solid' && zone.style.color) {
    result.resolvedGradient = zone.style.color
    return result
  }

  // Fallback: generate a gradient based on palette
  if (zone.contextual && content.keywords?.length > 0) {
    // Placeholder fallback if fetch failed: use palette colors as gradient
    result.resolvedGradient = `linear-gradient(135deg, ${zone.style.gradientColor1 || '#667eea'}, ${zone.style.gradientColor2 || '#764ba2'})`
  }

  return result
}

/**
 * Resolve decoration zone (SVGs, borders, dividers — mostly pre-filled)
 */
function renderDecorationZone(zone: DecorationZone): RenderedZone {
  return {
    zone,
    resolvedSvg: zone.style.svgContent || undefined,
  }
}

// ========================================
// COLOR UTILITIES
// ========================================

/**
 * Apply format palette colors to chart datasets
 */
function applyPaletteToData(
  chartData: { labels: string[]; datasets: any[] },
  palette: FormatColorPalette
): { labels: string[]; datasets: any[] } {
  if (!chartData?.datasets) return chartData

  // Use chartColors from palette, or generate from primary/secondary/accent
  const colors = palette.chartColors || generateChartColors(palette, chartData.labels?.length || 5)

  return {
    labels: chartData.labels,
    datasets: chartData.datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || (
        // For pie/doughnut: use array of colors
        Array.isArray(ds.data) && ds.data.length > 1 && !ds.label
          ? colors
          : colors[i % colors.length]
      ),
      borderColor: ds.borderColor || colors[i % colors.length],
    })),
  }
}

/**
 * Generate chart colors from a palette
 */
function generateChartColors(palette: FormatColorPalette, count: number): string[] {
  const baseColors = [
    palette.primary,
    palette.secondary,
    palette.accent,
    adjustColor(palette.primary, 30),
    adjustColor(palette.secondary, -30),
    adjustColor(palette.accent, 20),
  ]

  // Extend if more colors needed
  while (baseColors.length < count) {
    baseColors.push(adjustColor(baseColors[baseColors.length % 3], baseColors.length * 15))
  }

  return baseColors.slice(0, count)
}

/**
 * Simple hue-shift for color variation (operates on hex colors)
 */
function adjustColor(hex: string, amount: number): string {
  try {
    // Parse hex
    let color = hex.replace('#', '')
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
    }
    const r = Math.max(0, Math.min(255, parseInt(color.substring(0, 2), 16) + amount))
    const g = Math.max(0, Math.min(255, parseInt(color.substring(2, 4), 16) + amount))
    const b = Math.max(0, Math.min(255, parseInt(color.substring(4, 6), 16) + amount))
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  } catch {
    return hex
  }
}

// ========================================
// BATCH RENDERING — Generate all variants for gallery
// ========================================

/**
 * Generate rendered variants for all format blueprints
 * Used by FormatGallery to show preview cards with filled content
 */
export function generateGalleryVariants(
  blueprints: FormatBlueprintRow[],
  content: LLMContentPackage,
  contextualImageUrl?: string
): RenderedFormat[] {
  const variants: RenderedFormat[] = []

  for (const blueprint of blueprints) {
    const skeleton = blueprint.skeleton as unknown as FormatSkeleton

    // Get chart types that work well with this format
    const preferredTypes = skeleton.zones
      ?.filter((z: FormatZone) => z.type === 'chart')
      ?.flatMap((z: ChartZone) => z.chartConfig?.preferredChartTypes || [])

    // Use first preferred type, or the first suggested type from content
    const chartType =
      preferredTypes?.[0] ||
      content.suggestedChartTypes?.[0] ||
      'bar'

    try {
      const rendered = renderFormat(blueprint, content, chartType, contextualImageUrl)
      variants.push(rendered)
    } catch (err) {
      console.warn(`Failed to render variant for format ${blueprint.name}:`, err)
    }
  }

  return variants
}
