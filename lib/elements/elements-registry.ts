/**
 * Curated Canvas Elements & Designs Registry
 * 
 * Provides types, color detection, and dynamic CDN streaming for 200+ design elements.
 * The 200+ SVG codes are hosted externally on jsDelivr CDN (Harikrishnanvkph/design-elements-cdn)
 * to keep this main repository 100% clean and free of heavy SVG markup.
 */

export interface CanvasDesignElement {
  id: string
  name: string
  category: 'brushes' | 'splatters' | 'highlighters' | 'ribbons' | 'doodles'
  tags: string[]
  width: number
  height: number
  defaultColor: string
  svg: string
}

/**
 * Detects whether an SVG is intrinsically multi-colored (has gradients or multiple distinct non-neutral color fills/strokes)
 */
export function isMulticolorSvg(svgContent?: string | null): boolean {
  if (!svgContent) return false

  // 1. Gradients indicate multi-color designs
  if (
    svgContent.includes('<linearGradient') ||
    svgContent.includes('<radialGradient') ||
    svgContent.includes('gradientUnits') ||
    svgContent.includes('<stop')
  ) {
    return true
  }

  // 2. Extract all fill / stroke / color values
  const colorMatches = svgContent.match(
    /(?:fill|stroke|stop-color|color)=["'](#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\))["']/gi
  )

  if (colorMatches && colorMatches.length > 0) {
    const neutralColors = new Set(['#000', '#000000', '#fff', '#ffffff', '#111', '#111111'])
    const uniqueColors = new Set<string>()

    for (const match of colorMatches) {
      const val = match
        .replace(/^(fill|stroke|stop-color|color)=["']/i, '')
        .replace(/["']$/, '')
        .toLowerCase()
      if (val && val !== 'none' && val !== 'transparent' && val !== 'currentcolor') {
        uniqueColors.add(val)
      }
    }

    if (uniqueColors.size > 1) return true

    for (const color of uniqueColors) {
      if (!neutralColors.has(color)) {
        return true
      }
    }
  }

  return false
}

/**
 * Extracts all distinct editable colors (hex, rgb, hsl, currentColor) from an SVG string
 */
export function extractSvgColors(svgContent?: string | null): string[] {
  if (!svgContent) return []

  const colors = new Set<string>()

  // 1. Matches fill="...", stroke="...", stop-color="..."
  const attrMatches =
    svgContent.match(
      /(?:fill|stroke|stop-color)=["'](#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|currentColor)["']/gi
    ) || []
  for (const m of attrMatches) {
    const val = m.replace(/^(fill|stroke|stop-color)=["']/i, '').replace(/["']$/, '').trim()
    if (val && val !== 'none' && val !== 'transparent') {
      colors.add(val)
    }
  }

  // 2. Matches CSS style rules e.g. style="fill: #...; stroke: #..."
  const styleMatches =
    svgContent.match(
      /(?:fill|stroke|stop-color)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|currentColor)/gi
    ) || []
  for (const m of styleMatches) {
    const val = m.replace(/^(fill|stroke|stop-color)\s*:\s*/i, '').trim()
    if (val && val !== 'none' && val !== 'transparent') {
      colors.add(val)
    }
  }

  if (colors.size === 0) {
    return ['#0F172A']
  }

  return Array.from(colors).slice(0, 6)
}

/**
 * Replaces a specific color inside an SVG with a new target color
 */
export function replaceSvgColor(svg: string, fromColor: string, toColor: string): string {
  if (!svg || !fromColor || !toColor) return svg

  if (fromColor.toLowerCase() === 'currentcolor') {
    return svg.replace(/\bcurrentColor\b/gi, toColor)
  }

  const escaped = fromColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`((?:fill|stroke|stop-color)\\s*[:=]\\s*["']?)${escaped}(?=["';\\s>])`, 'gi')
  return svg.replace(regex, `$1${toColor}`)
}

export const ELEMENT_CATEGORIES = [
  { id: 'all', label: 'All Elements', icon: 'Sparkles' },
  { id: 'brushes', label: 'Brush Strokes', icon: 'Paintbrush' },
  { id: 'splatters', label: 'Splatters & Drips', icon: 'Droplets' },
  { id: 'highlighters', label: 'Highlighters & Underlines', icon: 'Highlighter' },
  { id: 'ribbons', label: 'Ribbons & Banners', icon: 'Bookmark' },
  { id: 'doodles', label: 'Doodles & Accents', icon: 'Smile' },
] as const

// All design elements are streamed dynamically on-demand from jsDelivr CDN
// Keeping this main repository 100% free of local SVG code
export const DESIGN_ELEMENTS_LIBRARY: CanvasDesignElement[] = []
