import { checkContentSafety } from "@/lib/safety/content-filter"
import { UNSPLASH_HOME_URL, UNSPLASH_LICENSE_URL, withUnsplashUtm } from "@/lib/utils/unsplash-utils"

export type StockProvider = "pexels" | "unsplash" | "pixabay" | "wikimedia"
export type PixabayImageType = "all" | "photo" | "illustration" | "vector"

export interface UnifiedPhoto {
  id: string | number
  width: number
  height: number
  url: string
  thumbUrl: string
  fullUrl: string
  avgColor: string
  alt: string
  photographerName: string
  photographerUrl: string
  source: StockProvider
  license?: string
  imageType?: string
  downloadLocation?: string
}

export const PIXABAY_TYPES: Array<{ id: PixabayImageType; label: string }> = [
  { id: "all", label: "All" },
  { id: "photo", label: "Photos" },
  { id: "illustration", label: "Illustrations" },
  { id: "vector", label: "Vectors" },
]

export const PROVIDER_META: Record<
  StockProvider,
  {
    label: string
    searchPlaceholder: string
    homeUrl: string
    licenseUrl: string
    licenseLabel: string
    footerPrefix: string
    badgeLabel: string
    badgeClasses: string
    badgeIconColor: string
    cardHoverBorder: string
    addBadgeClasses: string
    footerLinkClasses: string
  }
> = {
  pexels: {
    label: "Pexels",
    searchPlaceholder: "Search Pexels...",
    homeUrl: "https://www.pexels.com",
    licenseUrl: "https://www.pexels.com/license/",
    licenseLabel: "Free License",
    footerPrefix: "Photos provided by",
    badgeLabel: "Photos by Pexels",
    badgeClasses: "bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-200/70",
    badgeIconColor: "text-emerald-600",
    cardHoverBorder: "hover:border-emerald-400",
    addBadgeClasses: "bg-white/95 text-emerald-700",
    footerLinkClasses: "text-emerald-700 hover:text-emerald-800",
  },
  unsplash: {
    label: "Unsplash",
    searchPlaceholder: "Search Unsplash...",
    homeUrl: UNSPLASH_HOME_URL,
    licenseUrl: UNSPLASH_LICENSE_URL,
    licenseLabel: "Unsplash License",
    footerPrefix: "Photos provided by",
    badgeLabel: "Photos by Unsplash",
    badgeClasses: "bg-slate-100 hover:bg-slate-200/70 text-slate-800 border-slate-300/80",
    badgeIconColor: "text-slate-600",
    cardHoverBorder: "hover:border-slate-800",
    addBadgeClasses: "bg-white text-slate-900",
    footerLinkClasses: "text-slate-900",
  },
  pixabay: {
    label: "Pixabay",
    searchPlaceholder: "Search Pixabay...",
    homeUrl: "https://pixabay.com",
    licenseUrl: "https://pixabay.com/service/license-summary/",
    licenseLabel: "Pixabay License",
    footerPrefix: "Images provided by",
    badgeLabel: "Pixabay",
    badgeClasses: "bg-teal-50/90 hover:bg-teal-100 text-teal-900 border-teal-200/80",
    badgeIconColor: "text-teal-600",
    cardHoverBorder: "hover:border-teal-500",
    addBadgeClasses: "bg-white/95 text-teal-800",
    footerLinkClasses: "text-teal-700 hover:text-teal-800",
  },
  wikimedia: {
    label: "Wikimedia Commons",
    searchPlaceholder: "Search Wikimedia...",
    homeUrl: "https://commons.wikimedia.org",
    licenseUrl: "https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia",
    licenseLabel: "Public Domain / CC0",
    footerPrefix: "Media from",
    badgeLabel: "Wikimedia",
    badgeClasses: "bg-blue-50/90 hover:bg-blue-100 text-blue-900 border-blue-200/70",
    badgeIconColor: "text-blue-600",
    cardHoverBorder: "hover:border-blue-400",
    addBadgeClasses: "bg-white text-blue-800",
    footerLinkClasses: "text-blue-700",
  },
}

export function deduplicateStockPhotos(list: UnifiedPhoto[]): UnifiedPhoto[] {
  const seen = new Set<string>()
  return list.filter((item) => {
    const uniqueKey = `${item.source}-${item.id}`
    if (seen.has(uniqueKey)) return false
    seen.add(uniqueKey)
    return true
  })
}

export async function fetchStockPhotos({
  provider,
  query,
  page = 1,
  perPage = 24,
  pixabayType = "all",
  signal,
}: {
  provider: StockProvider
  query: string
  page?: number
  perPage?: number
  pixabayType?: PixabayImageType
  signal?: AbortSignal
}): Promise<{ photos: UnifiedPhoto[]; total: number; warning?: string }> {
  const trimmed = query.trim()
  if (trimmed) {
    const safety = checkContentSafety(trimmed)
    if (safety.isDisallowed) {
      return {
        photos: [],
        total: 0,
        warning: safety.reason || "Search restricted: Adult or explicit keywords are not permitted.",
      }
    }
  }

  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  })
  if (trimmed) {
    params.set("query", trimmed)
  }
  if (provider === "pixabay") {
    params.set("image_type", pixabayType)
  }

  const endpointMap: Record<StockProvider, string> = {
    pexels: "/api/pexels",
    unsplash: "/api/unsplash",
    pixabay: "/api/pixabay",
    wikimedia: "/api/wikimedia",
  }

  const res = await fetch(`${endpointMap[provider]}?${params.toString()}`, { signal })
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.error || `Error ${res.status}: Failed to load images from ${provider}`)
  }

  const data = await res.json()
  if (data.warning) {
    return { photos: [], total: 0, warning: data.warning }
  }

  let mappedPhotos: UnifiedPhoto[] = []
  let total = 0

  if (provider === "wikimedia" || provider === "pixabay") {
    const rawPhotos: any[] = data.photos || data.results || []
    const isPixabay = provider === "pixabay"
    mappedPhotos = rawPhotos.map((p: any) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      url: p.url,
      thumbUrl: p.thumbUrl,
      fullUrl: p.fullUrl,
      avgColor: p.avgColor || "#e2e8f0",
      alt: p.alt || (isPixabay ? "Pixabay Image" : "Wikimedia Commons Image"),
      photographerName: p.photographerName || (isPixabay ? "Pixabay Contributor" : "Wikimedia Contributor"),
      photographerUrl: p.photographerUrl || (isPixabay ? "https://pixabay.com" : "https://commons.wikimedia.org"),
      source: provider,
      imageType: p.imageType,
      license: p.license || (isPixabay ? "Pixabay Content License" : "Creative Commons / Public Domain"),
    }))
    total = typeof data.total === "number" ? data.total : mappedPhotos.length
  } else if (provider === "unsplash") {
    const rawPhotos: any[] = data.photos || data.results || []
    mappedPhotos = rawPhotos.map((p: any) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      url: withUnsplashUtm(p.links?.html),
      thumbUrl: p.urls?.small || p.urls?.thumb || p.urls?.regular,
      fullUrl: p.urls?.regular || p.urls?.full || p.urls?.small,
      avgColor: p.color || "#e2e8f0",
      alt: p.alt || p.description || "Unsplash Photo",
      photographerName: p.user?.name || "Unsplash Photographer",
      photographerUrl: withUnsplashUtm(p.user?.links?.html),
      source: "unsplash",
      downloadLocation: p.links?.download_location,
    }))
    total = data.total || 1000
  } else {
    const rawPhotos: any[] = data.photos || []
    mappedPhotos = rawPhotos.map((p: any) => ({
      id: p.id,
      width: p.width,
      height: p.height,
      url: p.url,
      thumbUrl: p.src?.medium || p.src?.small,
      fullUrl: p.src?.large2x || p.src?.large || p.src?.medium || p.src?.original,
      avgColor: p.avg_color || "#e2e8f0",
      alt: p.alt || "Pexels Photo",
      photographerName: p.photographer,
      photographerUrl: p.photographer_url,
      source: "pexels",
    }))
    total = data.total_results || 0
  }

  return {
    photos: deduplicateStockPhotos(mappedPhotos),
    total,
  }
}
