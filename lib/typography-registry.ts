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
  aliases?: string[]
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

/**
 * Normalizes any font weight (numeric or descriptive) to a standard numeric string ('300'-'900').
 */
export function normalizeFontWeight(input?: string | number): string {
  if (input === undefined || input === null || input === '') return '400'
  const str = String(input).trim().toLowerCase()
  if (str === 'normal' || str === 'regular') return '400'
  if (str === 'bold') return '700'
  if (str === 'bolder' || str === 'black' || str === 'heavy') return '900'
  if (str === 'lighter' || str === 'light') return '300'
  if (str === 'medium') return '500'
  if (str === 'semibold' || str === 'semi-bold' || str === 'demibold') return '600'
  if (str === 'extrabold' || str === 'extra-bold') return '800'
  if (str === 'thin') return '300'
  if (str === 'extralight' || str === 'extra-light') return '300'

  const num = parseInt(str, 10)
  if (!isNaN(num)) {
    const closest = FONT_WEIGHT_OPTIONS.reduce((prev, curr) =>
      Math.abs(curr.numeric - num) < Math.abs(prev.numeric - num) ? curr : prev
    )
    return closest.value
  }
  return '400'
}

// ── Unified Font Families Registry ────────────────────────────
export const UNIFIED_FONT_FAMILIES: FontFamilyOption[] = [
  // Default / Inherit
  {
    id: 'default',
    label: 'Default',
    value: 'default',
    category: 'sans-serif',
    isGoogleFont: false,
    aliases: ['inherit', 'initial'],
  },
  // Core Google Sans-Serif
  {
    id: 'inter',
    label: 'Inter',
    value: "'Inter', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Inter',
    weights: [300, 400, 500, 600, 700, 800, 900],
    aliases: ['inter'],
  },
  {
    id: 'roboto',
    label: 'Roboto',
    value: "'Roboto', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Roboto',
    weights: [300, 400, 500, 700, 900],
    aliases: ['roboto'],
  },
  {
    id: 'poppins',
    label: 'Poppins',
    value: "'Poppins', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Poppins',
    weights: [300, 400, 500, 600, 700, 800, 900],
    aliases: ['poppins'],
  },
  {
    id: 'open-sans',
    label: 'Open Sans',
    value: "'Open Sans', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Open Sans',
    weights: [300, 400, 500, 600, 700, 800],
    aliases: ['open sans', 'opensans'],
  },
  {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    value: "'Plus Jakarta Sans', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Plus Jakarta Sans',
    weights: [300, 400, 500, 600, 700, 800],
    aliases: ['plus jakarta sans', 'plusjakartasans', 'jakarta sans'],
  },
  {
    id: 'lato',
    label: 'Lato',
    value: "'Lato', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Lato',
    weights: [300, 400, 700, 900],
    aliases: ['lato'],
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    value: "'Montserrat', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Montserrat',
    weights: [300, 400, 500, 600, 700, 800, 900],
    aliases: ['montserrat'],
  },
  {
    id: 'outfit',
    label: 'Outfit',
    value: "'Outfit', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Outfit',
    weights: [300, 400, 500, 600, 700, 800, 900],
    aliases: ['outfit'],
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    value: "'DM Sans', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'DM Sans',
    weights: [400, 500, 700],
    aliases: ['dm sans', 'dmsans'],
  },
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    value: "'Space Grotesk', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Space Grotesk',
    weights: [300, 400, 500, 600, 700],
    aliases: ['space grotesk', 'spacegrotesk'],
  },
  {
    id: 'raleway',
    label: 'Raleway',
    value: "'Raleway', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Raleway',
    weights: [300, 400, 500, 600, 700, 800, 900],
    aliases: ['raleway'],
  },
  {
    id: 'nunito',
    label: 'Nunito',
    value: "'Nunito', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Nunito',
    weights: [300, 400, 600, 700, 800, 900],
    aliases: ['nunito'],
  },
  {
    id: 'cabin',
    label: 'Cabin',
    value: "'Cabin', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Cabin',
    weights: [400, 500, 600, 700],
    aliases: ['cabin'],
  },
  {
    id: 'ubuntu',
    label: 'Ubuntu',
    value: "'Ubuntu', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Ubuntu',
    weights: [300, 400, 500, 700],
    aliases: ['ubuntu'],
  },
  {
    id: 'source-sans-3',
    label: 'Source Sans 3',
    value: "'Source Sans 3', 'Source Sans Pro', sans-serif",
    category: 'sans-serif',
    isGoogleFont: true,
    googleFontName: 'Source Sans 3',
    weights: [300, 400, 600, 700, 900],
    aliases: ['source-sans-pro', 'source sans pro', 'source sans 3', 'sourcesanspro'],
  },
  // Display & Condensed
  {
    id: 'oswald',
    label: 'Oswald',
    value: "'Oswald', sans-serif",
    category: 'display',
    isGoogleFont: true,
    googleFontName: 'Oswald',
    weights: [300, 400, 500, 600, 700],
    aliases: ['oswald'],
  },
  {
    id: 'impact',
    label: 'Impact',
    value: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
    category: 'display',
    isGoogleFont: false,
    aliases: ['impact'],
  },
  // Serif Fonts
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    value: "'Playfair Display', Georgia, serif",
    category: 'serif',
    isGoogleFont: true,
    googleFontName: 'Playfair Display',
    weights: [400, 500, 600, 700, 800, 900],
    aliases: ['playfair display', 'playfairdisplay'],
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    value: "'Merriweather', Georgia, serif",
    category: 'serif',
    isGoogleFont: true,
    googleFontName: 'Merriweather',
    weights: [300, 400, 700, 900],
    aliases: ['merriweather'],
  },
  {
    id: 'lora',
    label: 'Lora',
    value: "'Lora', Georgia, serif",
    category: 'serif',
    isGoogleFont: true,
    googleFontName: 'Lora',
    weights: [400, 500, 600, 700],
    aliases: ['lora'],
  },
  {
    id: 'georgia',
    label: 'Georgia',
    value: "Georgia, 'Times New Roman', Times, serif",
    category: 'serif',
    isGoogleFont: false,
    aliases: ['georgia'],
  },
  {
    id: 'times-new-roman',
    label: 'Times New Roman',
    value: "'Times New Roman', Times, Georgia, serif",
    category: 'serif',
    isGoogleFont: false,
    aliases: ['times new roman', 'times', 'timesnewroman'],
  },
  // Standard System Sans-Serif
  {
    id: 'arial',
    label: 'Arial',
    value: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
    category: 'sans-serif',
    isGoogleFont: false,
    aliases: ['arial'],
  },
  {
    id: 'helvetica',
    label: 'Helvetica',
    value: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    category: 'sans-serif',
    isGoogleFont: false,
    aliases: ['helvetica', 'helvetica neue'],
  },
  {
    id: 'verdana',
    label: 'Verdana',
    value: "Verdana, Geneva, Tahoma, sans-serif",
    category: 'sans-serif',
    isGoogleFont: false,
    aliases: ['verdana'],
  },
  {
    id: 'trebuchet-ms',
    label: 'Trebuchet MS',
    value: "'Trebuchet MS', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif",
    category: 'sans-serif',
    isGoogleFont: false,
    aliases: ['trebuchet ms', 'trebuchet'],
  },
  // Monospace
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    value: "'JetBrains Mono', monospace",
    category: 'monospace',
    isGoogleFont: true,
    googleFontName: 'JetBrains Mono',
    weights: [300, 400, 500, 700],
    aliases: ['jetbrains mono', 'jetbrainsmono'],
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    value: "'Fira Code', monospace",
    category: 'monospace',
    isGoogleFont: true,
    googleFontName: 'Fira Code',
    weights: [300, 400, 500, 600, 700],
    aliases: ['fira code', 'firacode'],
  },
  {
    id: 'courier-new',
    label: 'Courier New',
    value: "'Courier New', Courier, monospace",
    category: 'monospace',
    isGoogleFont: false,
    aliases: ['courier new', 'courier', 'couriernew', 'lucida console', 'lucidaconsole'],
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
 * - "source-sans-pro" / "Source Sans Pro" / "source sans 3"
 * - "Arial"
 */
export function findFontByInput(input?: string): FontFamilyOption | undefined {
  if (!input) return undefined
  const raw = input.trim()
  if (!raw || raw === 'default' || raw === 'inherit') {
    return UNIFIED_FONT_FAMILIES.find(f => f.id === 'default')
  }

  // 1. Exact value match (e.g. "'Inter', sans-serif")
  const directValueMatch = UNIFIED_FONT_FAMILIES.find(f => f.value.toLowerCase() === raw.toLowerCase())
  if (directValueMatch) return directValueMatch

  // Clean primary family name (e.g., "'Space Grotesk', sans-serif" -> "space grotesk")
  const cleaned = raw.split(',')[0].replace(/['"]/g, '').trim().toLowerCase()
  if (!cleaned) return undefined

  // 2. Exact match against id, label, googleFontName, or aliases
  const match = UNIFIED_FONT_FAMILIES.find(f =>
    f.id.toLowerCase() === cleaned ||
    f.label.toLowerCase() === cleaned ||
    f.googleFontName?.toLowerCase() === cleaned ||
    f.aliases?.some(alias => alias.toLowerCase() === cleaned)
  )
  if (match) return match

  // 3. Fallback: Substring matching (e.g. "open sans regular" -> "open sans")
  return UNIFIED_FONT_FAMILIES.find(f =>
    cleaned.includes(f.label.toLowerCase()) ||
    f.aliases?.some(alias => cleaned.includes(alias.toLowerCase()))
  )
}

/**
 * Injects preconnect links for Google Fonts to accelerate DNS/TLS handshakes.
 */
function ensureGoogleFontPreconnect() {
  if (typeof document === 'undefined') return
  if (!document.getElementById('gf-preconnect-api')) {
    const l1 = document.createElement('link')
    l1.id = 'gf-preconnect-api'
    l1.rel = 'preconnect'
    l1.href = 'https://fonts.googleapis.com'
    document.head.appendChild(l1)

    const l2 = document.createElement('link')
    l2.id = 'gf-preconnect-static'
    l2.rel = 'preconnect'
    l2.crossOrigin = 'anonymous'
    l2.href = 'https://fonts.gstatic.com'
    document.head.appendChild(l2)
  }
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
    ensureGoogleFontPreconnect()

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

