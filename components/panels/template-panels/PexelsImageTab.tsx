"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import {
  Search,
  X as XIcon,
  Loader2,
  ImageIcon,
  ExternalLink,
  Upload,
  Plus,
  Sparkles,
  RefreshCw,
  Layers,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  Globe,
  Trash2,
  Check
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { useDecorationStore, type DecorationShape } from "@/lib/stores/decoration-store"
import { decorationFileRegistry } from "@/lib/stores/decoration-file-registry"
import { checkContentSafety } from "@/lib/safety/content-filter"
import { toast } from "sonner"

export type StockProvider = 'pexels' | 'unsplash' | 'pixabay' | 'wikimedia'
export type PixabayImageType = 'all' | 'photo' | 'illustration' | 'vector'

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

// Retained for backward compatibility
export interface PexelsPhoto {
  id: number
  width: number
  height: number
  url: string
  photographer: string
  photographer_url: string
  photographer_id?: number
  avg_color?: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt?: string
}

interface PexelsImageTabProps {
  renderElementList: (
    elements: DecorationShape[],
    icon: React.ElementType,
    emptyMessage: string,
    tabType: 'elements' | 'shapes' | 'section'
  ) => React.ReactNode
  imagesListRef?: React.RefObject<HTMLDivElement | null>
}

// Logos
const PexelsLogo = ({ className = "w-3.5 h-3.5 rounded shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <rect width="32" height="32" rx="6" fill="#05A081" />
    <path d="M12 9h4.5a4.5 4.5 0 0 1 4.5 4.5v0a4.5 4.5 0 0 1-4.5 4.5H15v5h-3V9zm3 3v3h1.5a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 0-1.5-1.5H15z" fill="#ffffff" />
  </svg>
)

const UnsplashLogo = ({ className = "w-3.5 h-3.5 shrink-0 fill-current" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
  </svg>
)

const WikimediaLogo = ({ className = "w-3.5 h-3.5 shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#006699" />
    <path d="M16 6a10 10 0 0 1 7.07 17.07L16 16V6z" fill="#339966" />
    <path d="M8.93 23.07A10 10 0 0 1 16 6v10l-7.07 7.07z" fill="#990000" />
    <circle cx="16" cy="16" r="4.5" fill="#ffffff" />
  </svg>
)

const PixabayLogo = ({ className = "w-3.5 h-3.5 rounded shrink-0" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="#00AB6B" />
    <path
      d="M10.5 23V9h6.2c3.1 0 5.3 1.9 5.3 4.8 0 2.9-2.2 4.8-5.3 4.8h-3.1V23h-3.1zm3.1-7h2.8c1.5 0 2.5-.8 2.5-2.2 0-1.4-1-2.2-2.5-2.2h-2.8V16z"
      fill="#ffffff"
    />
  </svg>
)

const PIXABAY_TYPES: Array<{ id: PixabayImageType; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'photo', label: 'Photos' },
  { id: 'illustration', label: 'Illustrations' },
  { id: 'vector', label: 'Vectors' },
]

const PROVIDER_META: Record<StockProvider, {
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
}> = {
  pexels: {
    label: 'Pexels',
    searchPlaceholder: 'Search Pexels...',
    homeUrl: 'https://www.pexels.com',
    licenseUrl: 'https://www.pexels.com/license/',
    licenseLabel: 'Free License',
    footerPrefix: 'Photos provided by',
    badgeLabel: 'Photos by Pexels',
    badgeClasses: 'bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border-emerald-200/70',
    badgeIconColor: 'text-emerald-600',
    cardHoverBorder: 'hover:border-emerald-400',
    addBadgeClasses: 'bg-white/95 text-emerald-700',
    footerLinkClasses: 'text-emerald-700 hover:text-emerald-800',
  },
  unsplash: {
    label: 'Unsplash',
    searchPlaceholder: 'Search Unsplash...',
    homeUrl: 'https://unsplash.com/?utm_source=aichartor&utm_medium=referral',
    licenseUrl: 'https://unsplash.com/license?utm_source=aichartor&utm_medium=referral',
    licenseLabel: 'Unsplash License',
    footerPrefix: 'Photos provided by',
    badgeLabel: 'Photos by Unsplash',
    badgeClasses: 'bg-slate-100 hover:bg-slate-200/70 text-slate-800 border-slate-300/80',
    badgeIconColor: 'text-slate-600',
    cardHoverBorder: 'hover:border-slate-800',
    addBadgeClasses: 'bg-white text-slate-900',
    footerLinkClasses: 'text-slate-900',
  },
  pixabay: {
    label: 'Pixabay',
    searchPlaceholder: 'Search Pixabay photos & vectors...',
    homeUrl: 'https://pixabay.com',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    licenseLabel: 'Pixabay License',
    footerPrefix: 'Images provided by',
    badgeLabel: 'Pixabay',
    badgeClasses: 'bg-teal-50/90 hover:bg-teal-100 text-teal-900 border-teal-200/80',
    badgeIconColor: 'text-teal-600',
    cardHoverBorder: 'hover:border-teal-500',
    addBadgeClasses: 'bg-white/95 text-teal-800',
    footerLinkClasses: 'text-teal-700 hover:text-teal-800',
  },
  wikimedia: {
    label: 'Wikimedia Commons',
    searchPlaceholder: 'Search Wikimedia Commons...',
    homeUrl: 'https://commons.wikimedia.org',
    licenseUrl: 'https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia',
    licenseLabel: 'Public Domain / CC0',
    footerPrefix: 'Media from',
    badgeLabel: 'Wikimedia',
    badgeClasses: 'bg-blue-50/90 hover:bg-blue-100 text-blue-900 border-blue-200/70',
    badgeIconColor: 'text-blue-600',
    cardHoverBorder: 'hover:border-blue-400',
    addBadgeClasses: 'bg-white text-blue-800',
    footerLinkClasses: 'text-blue-700',
  },
}

const renderProviderLogo = (source: StockProvider, className?: string) => {
  switch (source) {
    case 'pexels':
      return <PexelsLogo className={className || 'w-3.5 h-3.5 rounded shrink-0'} />
    case 'unsplash':
      return <UnsplashLogo className={className || 'w-3.5 h-3.5 shrink-0 fill-current text-slate-900'} />
    case 'pixabay':
      return <PixabayLogo className={className || 'w-3.5 h-3.5 rounded shrink-0'} />
    case 'wikimedia':
      return <WikimediaLogo className={className || 'w-3.5 h-3.5 shrink-0'} />
  }
}

export function PexelsImageTab({ renderElementList, imagesListRef }: PexelsImageTabProps) {
  const { shapes, addShape, setSelectedShapeId, setDrawingMode } = useDecorationStore()

  // Provider state: 'pexels' | 'unsplash' | 'pixabay' | 'wikimedia'
  const [provider, setProvider] = useState<StockProvider>('pexels')
  const [pixabayType, setPixabayType] = useState<PixabayImageType>('all')

  // Search & Filtering state
  const [query, setQuery] = useState("")
  const [photos, setPhotos] = useState<UnifiedPhoto[]>([])
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | number | null>(null)

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // ── "Add Image" Modal States ──────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [modalTab, setModalTab] = useState<'upload' | 'url'>('upload')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [inputUrl, setInputUrl] = useState("")
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [previewDims, setPreviewDims] = useState<{ width: number; height: number } | null>(null)
  const [isValidatingUrl, setIsValidatingUrl] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)
  const modalFileInputRef = useRef<HTMLInputElement>(null)

  // Fetch photos from proxy API routes
  const fetchPhotos = useCallback(async (
    targetProvider: StockProvider,
    targetQuery: string,
    targetPage: number,
    append: boolean = false,
    targetPixabayType: PixabayImageType = 'all'
  ) => {
    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      const params = new URLSearchParams({
        page: targetPage.toString(),
        per_page: '24',
      })
      if (targetQuery.trim()) {
        const safety = checkContentSafety(targetQuery)
        if (safety.isDisallowed) {
          setPhotos([])
          setTotalResults(0)
          setError(safety.reason || "Search restricted: Adult or explicit keywords are not permitted.")
          setIsLoading(false)
          setIsLoadingMore(false)
          return
        }
        params.set('query', targetQuery.trim())
      }

      if (targetProvider === 'pixabay') {
        params.set('image_type', targetPixabayType)
      }

      const endpointMap: Record<StockProvider, string> = {
        pexels: '/api/pexels',
        unsplash: '/api/unsplash',
        pixabay: '/api/pixabay',
        wikimedia: '/api/wikimedia',
      }
      const endpoint = endpointMap[targetProvider]

      const res = await fetch(`${endpoint}?${params.toString()}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${res.status}: Failed to load images from ${targetProvider}`)
      }

      const data = await res.json()

      if (data.warning) {
        setPhotos([])
        setTotalResults(0)
        setError(data.warning)
        setIsLoading(false)
        setIsLoadingMore(false)
        return
      }
      let mappedPhotos: UnifiedPhoto[] = []
      let total = 0

      if (targetProvider === 'wikimedia' || targetProvider === 'pixabay') {
        const rawPhotos: any[] = data.photos || data.results || []
        const isPixabay = targetProvider === 'pixabay'
        mappedPhotos = rawPhotos.map((p: any) => ({
          id: p.id,
          width: p.width,
          height: p.height,
          url: p.url,
          thumbUrl: p.thumbUrl,
          fullUrl: p.fullUrl,
          avgColor: p.avgColor || '#e2e8f0',
          alt: p.alt || (isPixabay ? 'Pixabay Image' : 'Wikimedia Commons Image'),
          photographerName: p.photographerName || (isPixabay ? 'Pixabay Contributor' : 'Wikimedia Contributor'),
          photographerUrl: p.photographerUrl || (isPixabay ? 'https://pixabay.com' : 'https://commons.wikimedia.org'),
          source: targetProvider,
          imageType: p.imageType,
          license: p.license || (isPixabay ? 'Pixabay Content License' : 'Creative Commons / Public Domain'),
        }))
        total = typeof data.total === 'number' ? data.total : mappedPhotos.length
      } else if (targetProvider === 'unsplash') {
        const rawPhotos: any[] = data.photos || data.results || []
        mappedPhotos = rawPhotos.map((p: any) => ({
          id: p.id,
          width: p.width,
          height: p.height,
          url: `${p.links?.html || 'https://unsplash.com'}?utm_source=aichartor&utm_medium=referral`,
          thumbUrl: p.urls?.small || p.urls?.thumb || p.urls?.regular,
          fullUrl: p.urls?.regular || p.urls?.full || p.urls?.small,
          avgColor: p.color || '#e2e8f0',
          alt: p.alt || p.description || 'Unsplash Photo',
          photographerName: p.user?.name || 'Unsplash Photographer',
          photographerUrl: `${p.user?.links?.html || 'https://unsplash.com'}?utm_source=aichartor&utm_medium=referral`,
          source: 'unsplash',
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
          avgColor: p.avg_color || '#e2e8f0',
          alt: p.alt || 'Pexels Photo',
          photographerName: p.photographer,
          photographerUrl: p.photographer_url,
          source: 'pexels',
        }))
        total = data.total_results || 0
      }

      const deduplicatePhotos = (list: UnifiedPhoto[]) => {
        const seen = new Set<string>()
        return list.filter((item) => {
          const uniqueKey = `${item.source}-${item.id}`
          if (seen.has(uniqueKey)) return false
          seen.add(uniqueKey)
          return true
        })
      }

      if (append) {
        setPhotos(prev => deduplicatePhotos([...prev, ...mappedPhotos]))
      } else {
        setPhotos(deduplicatePhotos(mappedPhotos))
      }

      setTotalResults(total)
      setPage(targetPage)
    } catch (err: any) {
      console.error(`[${targetProvider} Tab] Fetch error:`, err)
      setError(err.message || `Failed to load photos from ${targetProvider}.`)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // Initial load & re-fetch when provider or pixabayType changes
  useEffect(() => {
    fetchPhotos(provider, query, 1, false, pixabayType)
  }, [provider, pixabayType, fetchPhotos])

  // Handle Provider switch
  const handleProviderSwitch = (newProvider: StockProvider) => {
    if (newProvider === provider) return
    setProvider(newProvider)
    setQuery("")
    setPhotos([])
    setPage(1)
  }

  // Handle Search input change with debounce
  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    if (val.trim()) {
      const safety = checkContentSafety(val)
      if (safety.isDisallowed) {
        setPhotos([])
        setTotalResults(0)
        setError(safety.reason || "Search restricted: Adult or explicit keywords are not permitted.")
        toast.warning("Search restricted: Adult or explicit terms are not permitted.")
        return
      }
    }

    setError(null)
    searchDebounceRef.current = setTimeout(() => {
      fetchPhotos(provider, val, 1, false, pixabayType)
    }, 500)
  }

  // Load More Photos
  const handleLoadMore = () => {
    if (isLoadingMore || isLoading) return
    const nextPage = page + 1
    fetchPhotos(provider, query, nextPage, true, pixabayType)
  }

  // Add photo to canvas
  const handleAddPhotoToCanvas = (photo: UnifiedPhoto) => {
    setAddingId(photo.id)

    // Unsplash Requirement: Trigger download tracking endpoint
    if (photo.source === 'unsplash' && photo.downloadLocation) {
      fetch('/api/unsplash/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          downloadLocation: photo.downloadLocation,
          photoId: photo.id,
        }),
      }).catch((err) => {
        console.warn('Unsplash download track warning:', err)
      })
    }

    // Fit cleanly inside a 220x220 bounding box while preserving original aspect ratio
    // and never letting ultra-wide banners expand past the canvas width
    const aspect = (photo.width && photo.height) ? (photo.width / photo.height) : 1.33
    const maxDim = 220
    const minDim = 48
    let width: number
    let height: number
    let clampedAspect = false

    if (aspect >= 1) {
      width = maxDim
      const naturalH = Math.round(maxDim / aspect)
      if (naturalH < minDim) {
        height = minDim
        clampedAspect = true
      } else {
        height = naturalH
      }
    } else {
      height = maxDim
      const naturalW = Math.round(maxDim * aspect)
      if (naturalW < minDim) {
        width = minDim
        clampedAspect = true
      } else {
        width = naturalW
      }
    }

    const isTransparentOrVector =
      Boolean(photo.imageType && photo.imageType !== 'photo') ||
      (photo.source === 'wikimedia' && /\.(png|webp|svg)(\?|$)/i.test(photo.fullUrl || photo.thumbUrl || ''))
    const shouldContain = isTransparentOrVector || clampedAspect

    const newShapeId = addShape({
      type: 'deco-image',
      x: 60,
      y: 60,
      width,
      height,
      rotation: 0,
      fillColor: 'transparent',
      fillOpacity: 100,
      strokeColor: '#cbd5e1',
      strokeWidth: 0,
      strokeStyle: 'solid',
      visible: true,
      locked: false,
      zIndex: shapes.length + 1,
      imageUrl: photo.fullUrl,
      imageFit: shouldContain ? 'contain' : 'cover',
      borderRadius: shouldContain ? 0 : 4,
    })

    if (newShapeId) {
      setSelectedShapeId(newShapeId)
    }
    setDrawingMode(null)

    const providerLabel = PROVIDER_META[photo.source].label

    toast.success(`Added image by ${photo.photographerName} from ${providerLabel}`)

    setTimeout(() => {
      setAddingId(null)
    }, 400)
  }

  // ── Modal Handlers (Add Image Modal) ──────────────────────────
  const handleResetModal = () => {
    setSelectedFile(null)
    setInputUrl("")
    setPreviewSrc(null)
    setPreviewDims(null)
    setUrlError(null)
    setIsValidatingUrl(false)
  }

  const handleOpenModal = () => {
    handleResetModal()
    setIsAddModalOpen(true)
  }

  const handleCloseModal = () => {
    handleResetModal()
    setIsAddModalOpen(false)
  }

  const handleModalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    const blobUrl = URL.createObjectURL(file)
    setPreviewSrc(blobUrl)

    // Measure dimensions
    const img = new Image()
    img.onload = () => {
      setPreviewDims({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = blobUrl
  }

  const handleTestUrlPreview = (url: string) => {
    const trimmed = url.trim()
    setInputUrl(trimmed)
    setUrlError(null)

    if (!trimmed) {
      setPreviewSrc(null)
      setPreviewDims(null)
      return
    }

    const safety = checkContentSafety(trimmed)
    if (safety.isDisallowed) {
      setPreviewSrc(null)
      setPreviewDims(null)
      setUrlError("This image URL contains restricted or adult keywords.")
      return
    }

    setIsValidatingUrl(true)
    const img = new Image()
    img.onload = () => {
      setPreviewSrc(trimmed)
      setPreviewDims({ width: img.naturalWidth, height: img.naturalHeight })
      setIsValidatingUrl(false)
    }
    img.onerror = () => {
      setPreviewSrc(null)
      setPreviewDims(null)
      setUrlError("Could not load image from this URL. Please verify the link.")
      setIsValidatingUrl(false)
    }
    img.src = trimmed
  }

  const handleConfirmAddModalImage = () => {
    if (!previewSrc) return

    let finalUrl = previewSrc

    if (modalTab === 'upload' && selectedFile) {
      // Register with file registry
      decorationFileRegistry.set(previewSrc, selectedFile)
    }

    // Calculate aspect ratio
    let width = 200
    let height = 200

    if (previewDims && previewDims.width && previewDims.height) {
      const aspect = previewDims.width / previewDims.height
      height = Math.round(width / aspect)
      if (height > 280) {
        height = 280
        width = Math.round(height * aspect)
      } else if (height < 70) {
        height = 70
        width = Math.round(height * aspect)
      }
    }

    const newShapeId = addShape({
      type: 'deco-image',
      x: 60,
      y: 60,
      width,
      height,
      rotation: 0,
      fillColor: 'transparent',
      fillOpacity: 100,
      strokeColor: '#cbd5e1',
      strokeWidth: 0,
      strokeStyle: 'solid',
      visible: true,
      locked: false,
      zIndex: shapes.length + 1,
      imageUrl: finalUrl,
      imageFit: 'contain',
      borderRadius: 0,
    })

    if (newShapeId) {
      setSelectedShapeId(newShapeId)
    }
    setDrawingMode(null)
    toast.success("Added image to canvas!")
    handleCloseModal()
  }

  const imageElements = shapes.filter(s => s.type === 'deco-image')
  const hasMore = photos.length < totalResults

  return (
    <div className="space-y-3.5">
      {/* ── 1. Header Action Row: [ Add Image ] + [ Select API Dropdown ] ── */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={handleOpenModal}
          className="flex-1 h-8.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Add Image</span>
        </Button>

        {/* Dropdown to select the image API */}
        <Select
          value={provider}
          onValueChange={(val: StockProvider) => handleProviderSwitch(val)}
        >
          <SelectTrigger className="w-[145px] h-8.5 text-xs font-semibold bg-white border-slate-200/90 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors">
            <SelectValue placeholder="Select API" />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="pexels" className="cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <PexelsLogo className="w-3.5 h-3.5 rounded shrink-0" />
                <span>Pexels</span>
              </div>
            </SelectItem>
            <SelectItem value="unsplash" className="cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <UnsplashLogo className="w-3.5 h-3.5 shrink-0 fill-current text-slate-900" />
                <span>Unsplash</span>
              </div>
            </SelectItem>
            <SelectItem value="pixabay" className="cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <PixabayLogo className="w-3.5 h-3.5 rounded shrink-0" />
                <span>Pixabay</span>
              </div>
            </SelectItem>
            <SelectItem value="wikimedia" className="cursor-pointer">
              <div className="flex items-center gap-2 font-medium">
                <WikimediaLogo className="w-3.5 h-3.5 shrink-0" />
                <span>Wikimedia</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── 2. Search Bar ────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={PROVIDER_META[provider].searchPlaceholder}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
                fetchPhotos(provider, query, 1, false, pixabayType)
              }
            }}
            className="h-8.5 pl-8 pr-8 text-xs bg-slate-50/70 border-slate-200/80 rounded-lg placeholder:text-slate-400 focus:bg-white focus:border-blue-400 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                fetchPhotos(provider, "", 1, false, pixabayType)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Pixabay Media Type Filter Pills (Photos / Illustrations / Vectors) */}
        {provider === 'pixabay' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            {PIXABAY_TYPES.map((t) => {
              const isSelected = pixabayType === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPixabayType(t.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all text-[11px] font-medium cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        )}

        {/* Official Attribution Badge */}
        <div className="flex items-center justify-end px-0.5">
          <a
            href={PROVIDER_META[provider].homeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-[11px] font-medium group cursor-pointer shadow-2xs shrink-0 ${PROVIDER_META[provider].badgeClasses}`}
            title={`Images provided by ${PROVIDER_META[provider].label}`}
          >
            {renderProviderLogo(provider)}
            <span className="font-semibold tracking-tight">{PROVIDER_META[provider].badgeLabel}</span>
            <ExternalLink className={`h-2.5 w-2.5 ${PROVIDER_META[provider].badgeIconColor} opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
          </a>
        </div>
      </div>

      {/* ── 5. Photos Grid / States ──────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-lg bg-slate-100 animate-pulse border border-slate-200/60"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-6 px-3 bg-red-50/60 border border-red-200/80 rounded-xl space-y-2">
          <p className="text-xs font-semibold text-red-700">Failed to load images</p>
          <p className="text-[11px] text-red-500">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPhotos(provider, query, 1, false, pixabayType)}
            className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100/60"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-500" />
          <p className="text-xs font-medium text-slate-600">No photos found for "{query}"</p>
          <p className="text-[10px] text-slate-400 mt-1">Try another keyword or switch provider above</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {photos.map((photo) => {
              const isAdding = addingId === photo.id
              const avgBg = photo.avgColor || '#e2e8f0'
              const meta = PROVIDER_META[photo.source]
              const aspect = (photo.width && photo.height) ? (photo.width / photo.height) : 1.33
              const isGraphicOrWide =
                Boolean(photo.imageType && photo.imageType !== 'photo') ||
                aspect > 2.1 ||
                aspect < 0.55 ||
                (photo.source === 'wikimedia' && /\.(png|webp|svg)(\?|$)/i.test(photo.thumbUrl || photo.fullUrl || ''))

              return (
                <div
                  key={`${photo.source}-${photo.id}`}
                  onClick={() => handleAddPhotoToCanvas(photo)}
                  className={`group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all select-none ${meta.cardHoverBorder}`}
                  style={{ backgroundColor: isGraphicOrWide ? '#e2e8f0' : avgBg }}
                  title={`${photo.alt} (${photo.photographerName})`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={photo.thumbUrl}
                      alt={photo.alt}
                      loading="lazy"
                      className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${isGraphicOrWide ? 'object-contain p-1.5' : 'object-cover'}`}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      {/* Top Action Badge */}
                      <div className="self-end">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 ${meta.addBadgeClasses}`}>
                          <Plus className="w-2.5 h-2.5 stroke-[3]" /> Add
                        </span>
                      </div>

                      {/* Bottom Photographer Attribution */}
                      <div className="text-[10px] text-white/95 truncate font-medium flex items-center justify-between bg-black/50 backdrop-blur-xs px-1.5 py-1 rounded-md">
                        <span className="truncate drop-shadow-xs flex items-center gap-1">
                          <span className="opacity-75 text-[9px]">By</span>
                          {photo.photographerName}
                        </span>
                        <a
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-white hover:text-blue-300 p-0.5 ml-1 transition-colors shrink-0"
                          title={`View on ${meta.label}`}
                        >
                          <ExternalLink className="w-3 h-3 stroke-[2.5]" />
                        </a>
                      </div>
                    </div>

                    {/* Adding Spinner overlay */}
                    {isAdding && (
                      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center text-white text-xs font-bold gap-1.5 animate-in fade-in">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Adding...</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full h-8 text-xs font-semibold text-slate-700 hover:bg-slate-100 border-slate-200"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Loading more photos...
                </>
              ) : (
                `Load More (${photos.length} of ${totalResults.toLocaleString()})`
              )}
            </Button>
          )}

          {/* Official Provider Footer Attribution */}
          <div className="pt-2.5 pb-1 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              {renderProviderLogo(provider)}
              <span>
                {PROVIDER_META[provider].footerPrefix}{" "}
                <a
                  href={PROVIDER_META[provider].homeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`font-semibold hover:underline ${PROVIDER_META[provider].footerLinkClasses}`}
                >
                  {PROVIDER_META[provider].label}
                </a>
              </span>
            </div>
            <a
              href={PROVIDER_META[provider].licenseUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
            >
              {PROVIDER_META[provider].licenseLabel}
            </a>
          </div>
        </div>
      )}

      {/* ── Terms & Fair Use Link ────────────────────────────────── */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 px-0.5">
        <span>No chart attribution required</span>
        <Link
          href="/terms#assets-and-fair-use"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
        >
          Terms &amp; Fair Use
        </Link>
      </div>

      {/* ── 6. Active Images on Canvas ───────────────────────────── */}
      <div ref={imagesListRef} className="pt-3 border-t border-slate-200/80">
        <div className="flex justify-between items-center mb-2 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-700">
              Active Images on Canvas
            </span>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
              {imageElements.length}
            </span>
          </div>
        </div>
        {renderElementList(
          imageElements,
          ImageIcon,
          "No images on canvas yet. Click any photo above to add to your chart!",
          "section"
        )}
      </div>

      {/* ── 7. ADD IMAGE MODAL (Dialog) ───────────────────────────── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent forceBodyPortal className="sm:max-w-[460px] p-5 gap-4">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-blue-600" />
              Add Custom Image
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Upload an image from your computer or paste a direct image URL.
            </DialogDescription>
          </DialogHeader>

          {/* Modal Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg border border-slate-200/80">
            <button
              type="button"
              onClick={() => {
                setModalTab('upload')
                if (!selectedFile) {
                  setPreviewSrc(null)
                  setPreviewDims(null)
                }
              }}
              className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modalTab === 'upload'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload from Device
            </button>
            <button
              type="button"
              onClick={() => {
                setModalTab('url')
                if (inputUrl.trim()) {
                  handleTestUrlPreview(inputUrl)
                } else {
                  setPreviewSrc(null)
                  setPreviewDims(null)
                }
              }}
              className={`py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                modalTab === 'url'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Add via Image URL
            </button>
          </div>

          {/* Tab 1: Upload from Device */}
          {modalTab === 'upload' && (
            <div className="space-y-3">
              <input
                ref={modalFileInputRef}
                type="file"
                accept="image/*"
                onChange={handleModalFileSelect}
                className="hidden"
              />
              <div
                onClick={() => modalFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-xl p-5 text-center cursor-pointer transition-colors space-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100/70 text-blue-600 flex items-center justify-center mx-auto">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">Click to browse or drop an image</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Supports PNG, JPG, WebP, SVG, GIF</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Add via Image URL */}
          {modalTab === 'url' && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-slate-700">Direct Image URL</Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={inputUrl}
                  onChange={(e) => handleTestUrlPreview(e.target.value)}
                  className="h-9 text-xs flex-1 rounded-lg border-slate-200 placeholder:text-slate-400"
                />
                {isValidatingUrl && (
                  <div className="flex items-center px-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
              {urlError && (
                <p className="text-[11px] text-red-500 font-medium">{urlError}</p>
              )}
            </div>
          )}

          {/* Live Preview Box */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-slate-700">Preview</Label>
            <div className="w-full h-44 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-center overflow-hidden relative">
              {previewSrc ? (
                <>
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="w-full h-full object-contain p-2"
                  />
                  {previewDims && (
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-medium">
                      {previewDims.width} × {previewDims.height} px
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewSrc(null)
                      setPreviewDims(null)
                      setSelectedFile(null)
                      setInputUrl("")
                    }}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 hover:text-red-600 p-1.5 rounded-lg shadow-sm transition-colors cursor-pointer"
                    title="Remove image"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="text-center text-slate-400 space-y-1">
                  <ImageIcon className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-medium">No image selected</p>
                  <p className="text-[10px] opacity-75">Select a file or paste a URL above</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCloseModal}
              className="h-8.5 text-xs text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!previewSrc}
              onClick={handleConfirmAddModalImage}
              className="h-8.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-medium px-4 shadow-2xs"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Add to Canvas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
