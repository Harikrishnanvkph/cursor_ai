import { NextResponse } from 'next/server'

interface CachedFont {
  id: string
  label: string
  value: string
  category: 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting'
  isGoogleFont: boolean
  googleFontName: string
  weights: number[]
  popularity: number
}

// In-memory cache across server requests
let cachedFonts: CachedFont[] | null = null
let lastFetched = 0
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 // 24 hours

function mapCategory(cat?: string): 'sans-serif' | 'serif' | 'display' | 'monospace' | 'handwriting' {
  const c = String(cat || '').toLowerCase().replace(/[\s-_]/g, '')
  if (c.includes('sans')) return 'sans-serif'
  if (c.includes('serif')) return 'serif'
  if (c.includes('mono')) return 'monospace'
  if (c.includes('hand') || c.includes('script')) return 'handwriting'
  if (c.includes('display')) return 'display'
  return 'sans-serif'
}

function getFallback(cat: string): string {
  switch (cat) {
    case 'serif': return ', Georgia, serif'
    case 'monospace': return ', Monaco, monospace'
    case 'handwriting': return ', cursive'
    case 'display': return ', cursive, sans-serif'
    default: return ', sans-serif'
  }
}

async function getOrFetchGoogleFonts(): Promise<CachedFont[]> {
  const now = Date.now()
  if (cachedFonts && now - lastFetched < CACHE_TTL_MS) {
    return cachedFonts
  }

  try {
    const res = await fetch('https://fonts.google.com/metadata/fonts', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
      next: { revalidate: 86400 } // Cache 24h
    })

    if (!res.ok) {
      console.warn(`[Google Fonts API] Upstream returned status ${res.status}`)
      return cachedFonts || []
    }

    const data = await res.json()
    const list: any[] = data.familyMetadataList || data.familyList || []

    cachedFonts = list.map((f: any) => {
      const cat = mapCategory(f.category)
      const weights = f.fonts
        ? Object.keys(f.fonts)
            .map(w => parseInt(w, 10))
            .filter(w => !isNaN(w) && w >= 100 && w <= 900)
        : [400, 700]

      const uniqueWeights = Array.from(new Set(weights)).sort((a, b) => a - b)

      return {
        id: f.family.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        label: f.family,
        value: `'${f.family}'${getFallback(cat)}`,
        category: cat,
        isGoogleFont: true,
        googleFontName: f.family,
        weights: uniqueWeights.length > 0 ? uniqueWeights : [400, 700],
        popularity: typeof f.popularity === 'number' ? f.popularity : 9999,
      }
    })

    lastFetched = now
    return cachedFonts
  } catch (error) {
    console.error('[Google Fonts API] Error fetching font metadata:', error)
    return cachedFonts || []
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const q = (searchParams.get('q') || '').trim().toLowerCase()
    const category = searchParams.get('category') || 'all'
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '30', 10), 1), 60)

    const allFonts = await getOrFetchGoogleFonts()

    let results = allFonts

    if (category && category !== 'all') {
      results = results.filter(f => f.category === category)
    }

    if (q) {
      results = results.filter(f =>
        f.label.toLowerCase().includes(q) ||
        f.id.includes(q)
      )

      // Rank results: exact name match first, prefix match second, then by popularity
      results.sort((a, b) => {
        const aName = a.label.toLowerCase()
        const bName = b.label.toLowerCase()

        if (aName === q && bName !== q) return -1
        if (bName === q && aName !== q) return 1

        const aPrefix = aName.startsWith(q)
        const bPrefix = bName.startsWith(q)
        if (aPrefix && !bPrefix) return -1
        if (bPrefix && !aPrefix) return 1

        return a.popularity - b.popularity
      })
    } else {
      // Default: sort by popularity
      results.sort((a, b) => a.popularity - b.popularity)
    }

    return NextResponse.json({
      fonts: results.slice(0, limit),
      total: results.length,
    })
  } catch (error) {
    console.error('[Google Fonts Search API] Error:', error)
    return NextResponse.json({ fonts: [], total: 0 }, { status: 500 })
  }
}
