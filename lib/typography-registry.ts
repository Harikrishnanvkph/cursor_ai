/**
 * Universal Typography Registry & Font Loader for AI Chartor
 * 
 * Provides a single source of truth for:
 * 1. Curated font families (Google Fonts + Standard System Fonts)
 * 2. Proper CSS font-family strings with fallbacks
 * 3. Dynamic Google Font loading via the CSS Font Loading API
 * 4. Standardized numeric font weights (300 - 900)
 */

export interface FontFamilyOption {
  id: string
  label: string
  value: string
  category: 'sans-serif' | 'serif' | 'display' | 'monospace'
  isGoogleFont: boolean
  googleFontName?: string
  weights?: number[]
}

export interface FontWeightOption {
  label: string
  value: string
  numeric: number
}

// ── Standard Numeric Font Weights ─────────────────────────────
export const FONT_WEIGHT_OPTIONS: FontWeightOption[] = [
  { label: 'Light (300)', value: '300', numeric: 300 },
  { label: 'Regular (400)', value: '400', numeric: 400 },
  { label: 'Medium (500)', value: '500', numeric: 500 },
  { label: 'Semi Bold (600)', value: '600', numeric: 600 },
  { label: 'Bold (700)', value: '700', numeric: 700 },
  { label: 'Extra Bold (800)', value: '800', numeric: 800 },
  { label: 'Black (900)', value: '900', numeric: 900 },
]

// ── Unified Font Families Registry ────────────────────────────
export const UNIFIED_FONT_FAMILIES: FontFamilyOption[] = [
  // Default / Inherit
  {
    id: 'default',
    label: 'Default',
    value: 'default',
    category: 'sans-serif',
    isGoogleFont: false,
  },
  // Core Sans-Serif
  {
    id: 'inter',
    label: 'Inter',
    value: "'Inter', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Inter',
    weights: [300, 400, 500, 600, 700, 800, 900]
  },
  {
    id: 'roboto',
    label: 'Roboto',
    value: "'Roboto', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Roboto',
    weights: [300, 400, 500, 700, 900]
  },
  {
    id: 'poppins',
    label: 'Poppins',
    value: "'Poppins', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Poppins',
    weights: [300, 400, 500, 600, 700, 800, 900]
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    value: "'Open Sans', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Open Sans',
    weights: [300, 400, 500, 600, 700, 800]
  },
  {
    id: 'lato',
    label: 'Lato',
    value: "'Lato', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Lato',
    weights: [300, 400, 700, 900]
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    value: "'Montserrat', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Montserrat',
    weights: [300, 400, 500, 600, 700, 800, 900]
  },
  {
    id: 'outfit',
    label: 'Outfit',
    value: "'Outfit', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Outfit',
    weights: [300, 400, 500, 600, 700, 800, 900]
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    value: "'DM Sans', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'DM Sans',
    weights: [400, 500, 700]
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    value: "'Space Grotesk', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Space Grotesk',
    weights: [300, 400, 500, 600, 700]
  },
  {
    id: 'raleway',
    label: 'Raleway',
    value: "'Raleway', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Raleway',
    weights: [300, 400, 500, 600, 700, 800, 900]
  },
  {
    id: 'nunito',
    label: 'Nunito',
    value: "'Nunito', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Nunito',
    weights: [300, 400, 600, 700, 800, 900]
  },
  {
    id: 'cabin',
    label: 'Cabin',
    value: "'Cabin', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Cabin',
    weights: [400, 500, 600, 700]
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu',
    value: "'Ubuntu', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Ubuntu',
    weights: [300, 400, 500, 700]
  },
  {
    id: 'source-sans-pro',
    label: 'Source Sans Pro',
    value: "'Source Sans Pro', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Source Sans 3',
    weights: [300, 400, 600, 700, 900]
  },
  // Display & Condensed
  {
    id: 'oswald',
    label: 'Oswald',
    value: "'Oswald', sans-serif",
    category: 'display',
    isGoogleFont: true,
    googleFontName: 'Oswald',
    weights: [300, 400, 500, 600, 700]
  },
  // Serif Fonts
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    value: "'Playfair Display', serif",
    category: 'serif',
    isGoogleFont: true,
    googleFontName: 'Playfair Display',
    weights: [400, 500, 600, 700, 800, 900]
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    value: "'Merriweather', serif",
    category: 'serif',
    isGoogleFont: true,
    googleFontName: 'Merriweather',
    weights: [300, 400, 700, 900]
  },
  {
    id: 'georgia',
    label: 'Georgia',
    value: 'Georgia, serif',
    category: 'serif',
    isGoogleFont: false,
  },
  {
    id: 'times-new-roman',
    label: 'Times New Roman',
    value: "'Times New Roman', Times, serif",
    category: 'serif',
    isGoogleFont: false,
  },
  // Standard System Sans-Serif
  {
    id: 'arial',
    label: 'Arial',
    value: 'Arial, Helvetica, sans-serif',
    category: 'sans-serif',
    isGoogleFont: false,
  },
  {
    id: 'helvetica',
    label: 'Helvetica',
    value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    category: 'sans-serif',
    isGoogleFont: false,
  },
  {
    id: 'verdana',
    label: 'Verdana',
    value: 'Verdana, Geneva, sans-serif',
    category: 'sans-serif',
    isGoogleFont: false,
  },
  {
    id: 'trebuchet-ms',
    label: 'Trebuchet MS',
    value: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif",
    category: 'sans-serif',
    isGoogleFont: false,
  },
  {
    id: 'impact',
    label: 'Impact',
    value: 'Impact, Charcoal, sans-serif',
    category: 'display',
    isGoogleFont: false,
  },
  // Monospace
  {
    id: 'courier-new',
    label: 'Courier New',
    value: "'Courier New', Courier, monospace",
    category: 'monospace',
    isGoogleFont: false,
  },
]

// ── Cache for Loaded Fonts ────────────────────────────────────
const loadedFontsCache = new Set<string>()

/**
 * Normalizes any font family input string to find the matching registry font.
 * Handles inputs like:
 * - "Space Grotesk"
 * - "'Space Grotesk', sans-serif"
 * - "Space Grotesk, sans-serif"
 */
export function findFontByInput(input?: string): FontFamilyOption | undefined {
  if (!input) return undefined
  const cleaned = input.split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
  return UNIFIED_FONT_FAMILIES.find(
    f => f.label.toLowerCase() === cleaned || f.id.toLowerCase() === cleaned || f.googleFontName?.toLowerCase() === cleaned
  )
}

/**
 * Ensures a Google Font stylesheet is injected and loaded into the browser.
 * Safe to call repeatedly; uses a cache to avoid redundant DOM operations.
 */
export async function ensureGoogleFontLoaded(fontInput?: string): Promise<boolean> {
  if (typeof window === 'undefined' || !fontInput || fontInput === 'default') {
    return true
  }

  const font = findFontByInput(fontInput)
  if (!font || !font.isGoogleFont || !font.googleFontName) {
    return true // System font or unknown, no network load needed
  }

  const fontName = font.googleFontName
  const cacheKey = fontName.toLowerCase()

  if (loadedFontsCache.has(cacheKey)) {
    return true
  }

  try {
    const linkId = `google-font-${font.id}`
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      const weightsStr = font.weights ? font.weights.join(';') : '400;500;600;700'
      const encodedName = encodeURIComponent(fontName).replace(/%20/g, '+')
      link.href = `https://fonts.googleapis.com/css2?family=${encodedName}:wght@${weightsStr}&display=swap`
      document.head.appendChild(link)
    }

    // Await document.fonts readiness for this specific family
    if ('fonts' in document && typeof (document.fonts as any).load === 'function') {
      await Promise.race([
        (document.fonts as any).load(`16px "${fontName}"`),
        new Promise(resolve => setTimeout(resolve, 1500)) // 1.5s timeout safety
      ])
    }

    loadedFontsCache.add(cacheKey)
    return true
  } catch (err) {
    console.warn(`[Typography] Failed to load Google Font "${fontName}":`, err)
    return false
  }
}

/**
 * Batch loads multiple font families simultaneously.
 */
export async function ensureFontsLoaded(fonts: (string | undefined)[]): Promise<void> {
  const promises = fonts.filter(Boolean).map(f => ensureGoogleFontLoaded(f))
  await Promise.all(promises)
}
