/**
 * Format Utility Functions
 * 
 * Extracts format skeleton structure into a clean metadata object
 * that can be sent to the AI backend for format-aware content generation.
 * 
 * This is the format-mode equivalent of template-utils.ts's extractTemplateStructure().
 */

import type {
  FormatBlueprintRow,
  FormatSkeleton,
  FormatZone,
  TextZone,
  StatZone,
  ChartZone,
  FormatColorPalette,
} from './format-types'

// ========================================
// FORMAT STRUCTURE METADATA — Sent to AI
// ========================================

/** Metadata describing a single zone for the AI prompt */
export interface FormatZoneMetadata {
  id: string
  type: string              // 'text' | 'chart' | 'stat'
  role?: string             // 'title' | 'subtitle' | 'body' | 'source' | 'callout' | 'highlight' | 'secondary' | 'tertiary'
  maxCharacters: number     // Calculated from zone dimensions + font size
  maxLines: number          // Calculated from height / (fontSize * lineHeight)
  adminMessage?: string     // Zone's message field (admin-authored instruction)
  userNote?: string         // User's note for this zone (from formatZoneNotes)
}

/** Theme information derived from the format's color palette and zones */
export interface FormatThemeMetadata {
  mood: string              // e.g., 'dark-professional', 'light-clean', 'warm-social'
  primaryColor: string
  backgroundColor: string
  textColor: string
  fontFamily: string        // Dominant font from zones
}

/** Complete format structure sent to the AI backend */
export interface FormatStructureMetadata {
  formatName: string
  formatDescription: string
  category: string          // 'infographic' | 'social' | 'report' | 'presentation'
  dimensions: {
    width: number
    height: number
    aspect: string
    label: string
  }
  theme: FormatThemeMetadata
  zones: FormatZoneMetadata[]
}

// ========================================
// EXTRACTION FUNCTIONS
// ========================================

/**
 * Extract format structure metadata for the AI backend.
 * 
 * This converts the raw format skeleton into a clean, AI-digestible
 * structure with calculated character limits per zone, theme info,
 * and zone-level instructions.
 */
export function extractFormatStructure(
  format: FormatBlueprintRow,
  zoneNotes?: Record<string, string>
): FormatStructureMetadata {
  const skeleton = format.skeleton as unknown as FormatSkeleton

  // Only include content zones (text, chart, stat) — skip background, decoration
  const contentZones = (skeleton.zones || []).filter(
    z => ['text', 'chart', 'stat'].includes(z.type)
  )

  return {
    formatName: skeleton.name,
    formatDescription: skeleton.description,
    category: skeleton.category,
    dimensions: skeleton.dimensions,
    theme: extractTheme(skeleton),
    zones: contentZones.map(z => extractZoneMetadata(z, zoneNotes)),
  }
}

/**
 * Extract theme metadata from the format skeleton.
 */
function extractTheme(skeleton: FormatSkeleton): FormatThemeMetadata {
  const palette = skeleton.colorPalette

  return {
    mood: inferMood(palette),
    primaryColor: palette.primary,
    backgroundColor: palette.background,
    textColor: palette.text,
    fontFamily: extractDominantFont(skeleton.zones),
  }
}

/**
 * Extract metadata for a single zone, including calculated character limits.
 */
function extractZoneMetadata(
  zone: FormatZone,
  zoneNotes?: Record<string, string>
): FormatZoneMetadata {
  const meta: FormatZoneMetadata = {
    id: zone.id,
    type: zone.type,
    maxCharacters: 200,  // default fallback
    maxLines: 4,         // default fallback
  }

  // Set role for text and stat zones
  if (zone.type === 'text') {
    const textZone = zone as TextZone
    meta.role = textZone.role
    const { maxChars, maxLines } = calculateTextLimits(textZone)
    meta.maxCharacters = textZone.maxLength || maxChars
    meta.maxLines = maxLines
  } else if (zone.type === 'stat') {
    const statZone = zone as StatZone
    meta.role = statZone.role
    // Stats are short — value + label
    meta.maxCharacters = 30
    meta.maxLines = 2
  } else if (zone.type === 'chart') {
    meta.role = 'chart'
    // Chart zones don't have text limits, but we include them for context
    meta.maxCharacters = 0
    meta.maxLines = 0
  }

  // Include admin-authored message if present
  if (zone.message) {
    meta.adminMessage = zone.message
  }

  // Include user note if present
  if (zoneNotes?.[zone.id]) {
    meta.userNote = zoneNotes[zone.id]
  }

  return meta
}

// ========================================
// CALCULATION HELPERS
// ========================================

/**
 * Calculate character and line limits from zone dimensions and text style.
 * 
 * Uses a conservative estimate: average character width ≈ 0.55 × fontSize.
 * This works well for Inter/sans-serif fonts at typical infographic sizes.
 */
function calculateTextLimits(zone: TextZone): { maxChars: number; maxLines: number } {
  if (!zone.position || !zone.style) {
    return { maxChars: 200, maxLines: 4 }
  }

  const { width, height } = zone.position
  const fontSize = zone.style.fontSize || 16
  const lineHeight = zone.style.lineHeight || 1.5
  const padding = 16 // 8px padding on each side (matching template-chart-preview)

  const effectiveWidth = width - padding
  const effectiveHeight = height - padding

  // Average character width for sans-serif fonts ≈ 0.55 × fontSize
  // This is conservative to prevent overflow
  const avgCharWidth = fontSize * 0.55
  const charsPerLine = Math.floor(effectiveWidth / avgCharWidth)
  const lineHeightPx = fontSize * lineHeight
  const maxLines = Math.max(1, Math.floor(effectiveHeight / lineHeightPx))
  const maxChars = charsPerLine * maxLines

  return { maxChars, maxLines }
}

/**
 * Calculate max characters from zone dimensions (exported for use in renderTextZone).
 */
export function calculateMaxCharsFromDimensions(zone: FormatZone): number | undefined {
  if (zone.type !== 'text') return undefined
  const textZone = zone as TextZone
  if (!textZone.position || !textZone.style) return undefined
  const { maxChars } = calculateTextLimits(textZone)
  return maxChars
}

/**
 * Infer a mood descriptor from the color palette.
 * This helps the AI maintain thematic consistency.
 */
function inferMood(palette: FormatColorPalette): string {
  const bg = palette.background.toLowerCase()
  const text = palette.text.toLowerCase()

  // Parse background luminance (rough estimate from hex)
  const bgLuminance = hexLuminance(bg)
  const textLuminance = hexLuminance(text)

  const isDark = bgLuminance < 0.3
  const isLight = bgLuminance > 0.7

  // Check for warm or cool tones
  const primary = palette.primary.toLowerCase()
  const isWarm = isWarmColor(primary)
  const isCool = !isWarm

  if (isDark && isCool) return 'dark-professional'
  if (isDark && isWarm) return 'dark-bold'
  if (isLight && isCool) return 'light-clean'
  if (isLight && isWarm) return 'light-warm'
  return 'balanced'
}

/**
 * Extract the most commonly used font family from zones.
 */
function extractDominantFont(zones: FormatZone[]): string {
  const fontCounts: Record<string, number> = {}

  for (const zone of zones) {
    let font: string | undefined
    if (zone.type === 'text') {
      font = (zone as TextZone).style?.fontFamily
    } else if (zone.type === 'stat') {
      font = (zone as StatZone).style?.valueFontFamily || (zone as StatZone).style?.labelFontFamily
    }
    if (font) {
      fontCounts[font] = (fontCounts[font] || 0) + 1
    }
  }

  // Return the most common font, or default
  const sorted = Object.entries(fontCounts).sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] || 'Inter, sans-serif'
}

/**
 * Rough luminance from hex color (0 = black, 1 = white).
 */
function hexLuminance(hex: string): number {
  try {
    let color = hex.replace('#', '')
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
    }
    const r = parseInt(color.substring(0, 2), 16) / 255
    const g = parseInt(color.substring(2, 4), 16) / 255
    const b = parseInt(color.substring(4, 6), 16) / 255
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  } catch {
    return 0.5
  }
}

/**
 * Check if a hex color has warm undertones (red/orange/yellow).
 */
function isWarmColor(hex: string): boolean {
  try {
    let color = hex.replace('#', '')
    if (color.length === 3) {
      color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2]
    }
    const r = parseInt(color.substring(0, 2), 16)
    const g = parseInt(color.substring(2, 4), 16)
    const b = parseInt(color.substring(4, 6), 16)
    // Warm if red channel dominates or red+green (yellow/orange) dominate blue
    return r > b && (r + g) > (b * 2.5)
  } catch {
    return false
  }
}

// ========================================
// PROMPT FORMATTING — Human-readable for AI
// ========================================

/**
 * Formats the format structure metadata into a human-readable prompt section.
 * This is appended to the AI prompt when in format mode.
 */
export function formatStructureForPrompt(structure: FormatStructureMetadata): string {
  const lines: string[] = []

  lines.push(`FORMAT STRUCTURE:`)
  lines.push(`- Name: "${structure.formatName}"`)
  lines.push(`- Category: ${structure.category}`)
  lines.push(`- Dimensions: ${structure.dimensions.width}×${structure.dimensions.height} (${structure.dimensions.aspect}, ${structure.dimensions.label})`)
  lines.push(`- Theme: ${structure.theme.mood} (primary: ${structure.theme.primaryColor}, bg: ${structure.theme.backgroundColor}, font: ${structure.theme.fontFamily})`)
  lines.push(``)
  lines.push(`CONTENT ZONES TO FILL:`)

  const textZones = structure.zones.filter(z => z.type === 'text')
  const statZones = structure.zones.filter(z => z.type === 'stat')
  const chartZones = structure.zones.filter(z => z.type === 'chart')

  let idx = 1
  for (const zone of textZones) {
    let desc = `${idx}. ${(zone.role || zone.type).toUpperCase()} (max ${zone.maxCharacters} chars, ${zone.maxLines} lines)`
    if (zone.adminMessage) desc += ` — Admin instruction: "${zone.adminMessage}"`
    if (zone.userNote) desc += ` — User note: "${zone.userNote}"`
    lines.push(desc)
    idx++
  }

  for (const zone of statZones) {
    let desc = `${idx}. STAT_${(zone.role || 'highlight').toUpperCase()}: A key statistic (value + short label)`
    if (zone.userNote) desc += ` — User note: "${zone.userNote}"`
    lines.push(desc)
    idx++
  }

  if (chartZones.length > 0) {
    lines.push(`${idx}. CHART: The chart zone is filled automatically from chart data.`)
  }

  lines.push(``)
  lines.push(`IMPORTANT:`)
  lines.push(`- Keep all text WITHIN the character limits to prevent overflow/clipping`)
  lines.push(`- Maintain a consistent ${structure.theme.mood} tone across ALL zones`)
  lines.push(`- The body should provide genuine analytical insight, not generic descriptions`)
  lines.push(`- Stats should highlight the most impactful numbers from the data`)
  lines.push(`- Source should be a real or plausible data attribution`)
  lines.push(``)
  lines.push(`In addition to chartType/chartData/chartConfig, also return a "formatContent" object:`)
  lines.push(`{`)
  lines.push(`  "formatContent": {`)
  lines.push(`    "title": "...",`)
  lines.push(`    "subtitle": "...",`)
  lines.push(`    "body": "...",`)
  lines.push(`    "source": "...",`)
  lines.push(`    "callout": "...",`)
  lines.push(`    "stats": [{ "value": "...", "label": "..." }],`)
  lines.push(`    "mood": "${structure.theme.mood}",`)
  lines.push(`    "keywords": ["..."]`)
  lines.push(`  }`)
  lines.push(`}`)

  return lines.join('\n')
}
