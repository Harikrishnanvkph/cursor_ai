"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
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
  Camera,
  Layers,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  LayoutGrid
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { useDecorationStore, type DecorationShape } from "@/lib/stores/decoration-store"
import { decorationFileRegistry } from "@/lib/stores/decoration-file-registry"
import { toast } from "sonner"

export type StockProvider = 'pexels' | 'unsplash'

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

const PEXELS_CATEGORIES = [
  { id: 'trending', label: 'Trending', query: '' },
  { id: 'business', label: 'Business', query: 'business' },
  { id: 'technology', label: 'Technology', query: 'technology' },
  { id: 'nature', label: 'Nature', query: 'nature' },
  { id: 'charts', label: 'Charts & Data', query: 'analytics data' },
  { id: 'office', label: 'Office', query: 'office workspace' },
  { id: 'finance', label: 'Finance', query: 'finance' },
  { id: 'people', label: 'People', query: 'people' },
  { id: 'abstract', label: 'Abstract', query: 'abstract texture' },
  { id: 'minimal', label: 'Minimal', query: 'minimal' },
  { id: 'city', label: 'City', query: 'city architecture' },
]

const UNSPLASH_CATEGORIES = [
  { id: 'trending', label: 'Curated', query: '' },
  { id: 'business', label: 'Business & Work', query: 'business work' },
  { id: 'technology', label: 'Technology', query: 'technology' },
  { id: 'charts', label: 'Data & Charts', query: 'data visualization' },
  { id: 'architecture', label: 'Architecture', query: 'architecture' },
  { id: 'nature', label: 'Nature', query: 'nature landscape' },
  { id: 'finance', label: 'Finance', query: 'finance' },
  { id: 'minimal', label: 'Minimal', query: 'minimalist' },
  { id: 'textures', label: 'Textures', query: 'textures patterns' },
  { id: 'wallpapers', label: 'Backgrounds', query: 'wallpaper background' },
]

const ORIENTATIONS = [
  { id: '', label: 'All', icon: LayoutGrid, tooltip: 'All Orientations' },
  { id: 'landscape', label: 'Landscape', icon: RectangleHorizontal, tooltip: 'Landscape (Horizontal)' },
  { id: 'portrait', label: 'Portrait', icon: RectangleVertical, tooltip: 'Portrait (Vertical)' },
  { id: 'square', label: 'Square', icon: Square, tooltip: 'Square (1:1)' },
]

export function PexelsImageTab({ renderElementList, imagesListRef }: PexelsImageTabProps) {
  const { shapes, addShape, setSelectedShapeId, setDrawingMode } = useDecorationStore()

  // Provider state: 'pexels' or 'unsplash'
  const [provider, setProvider] = useState<StockProvider>('pexels')

  // Search & Filtering state
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("trending")
  const [orientation, setOrientation] = useState("")
  const [photos, setPhotos] = useState<UnifiedPhoto[]>([])
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | number | null>(null)

  // Custom upload & URL controls
  const [showCustomUpload, setShowCustomUpload] = useState(false)
  const [customUrl, setCustomUrl] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  const currentCategories = provider === 'unsplash' ? UNSPLASH_CATEGORIES : PEXELS_CATEGORIES

  // Fetch photos from proxy API route
  const fetchPhotos = useCallback(async (
    targetProvider: StockProvider,
    targetQuery: string,
    targetPage: number,
    targetOrientation: string,
    append: boolean = false
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
        params.set('query', targetQuery.trim())
      }

      if (targetOrientation) {
        if (targetProvider === 'unsplash') {
          // Unsplash uses 'squarish' instead of 'square'
          params.set('orientation', targetOrientation === 'square' ? 'squarish' : targetOrientation)
        } else {
          params.set('orientation', targetOrientation)
        }
      }

      const endpoint = targetProvider === 'unsplash' ? '/api/unsplash' : '/api/pexels'
      const res = await fetch(`${endpoint}?${params.toString()}`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || `Error ${res.status}: Failed to load images from ${targetProvider}`)
      }

      const data = await res.json()
      let mappedPhotos: UnifiedPhoto[] = []
      let total = 0

      if (targetProvider === 'unsplash') {
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

      if (append) {
        setPhotos(prev => [...prev, ...mappedPhotos])
      } else {
        setPhotos(mappedPhotos)
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

  // Initial load
  useEffect(() => {
    fetchPhotos(provider, query, 1, orientation, false)
  }, [provider, orientation, fetchPhotos])

  // Handle Provider switch
  const handleProviderSwitch = (newProvider: StockProvider) => {
    if (newProvider === provider) return
    setProvider(newProvider)
    setActiveCategory('trending')
    setPhotos([])
    setPage(1)
  }

  // Handle Search input change with debounce
  const handleQueryChange = (val: string) => {
    setQuery(val)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }

    searchDebounceRef.current = setTimeout(() => {
      setActiveCategory(val ? '' : 'trending')
      fetchPhotos(provider, val, 1, orientation, false)
    }, 500)
  }

  // Handle Category selection
  const handleCategorySelect = (cat: { id: string; label: string; query: string }) => {
    setActiveCategory(cat.id)
    setQuery(cat.query)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
    fetchPhotos(provider, cat.query, 1, orientation, false)
  }

  // Handle Orientation change
  const handleOrientationChange = (ori: string) => {
    setOrientation(ori)
    fetchPhotos(provider, query, 1, ori, false)
  }

  // Load More Photos
  const handleLoadMore = () => {
    if (isLoadingMore || isLoading) return
    const nextPage = page + 1
    fetchPhotos(provider, query, nextPage, orientation, true)
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

    // Calculate width & height keeping original aspect ratio
    const aspect = (photo.width && photo.height) ? (photo.width / photo.height) : 1.33
    let width = 220
    let height = Math.round(width / aspect)

    if (height > 280) {
      height = 280
      width = Math.round(height * aspect)
    } else if (height < 70) {
      height = 70
      width = Math.round(height * aspect)
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
      imageUrl: photo.fullUrl,
      imageFit: 'cover',
      borderRadius: 4,
    })

    if (newShapeId) {
      setSelectedShapeId(newShapeId)
    }
    setDrawingMode(null)

    const providerLabel = photo.source === 'unsplash' ? 'Unsplash' : 'Pexels'
    toast.success(`Added photo by ${photo.photographerName} from ${providerLabel}`)

    setTimeout(() => {
      setAddingId(null)
    }, 400)
  }

  // Custom File Upload
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const blobUrl = URL.createObjectURL(file)
    decorationFileRegistry.set(blobUrl, file)

    const newShapeId = addShape({
      type: 'deco-image',
      x: 60,
      y: 60,
      width: 180,
      height: 180,
      rotation: 0,
      fillColor: 'transparent',
      fillOpacity: 100,
      strokeColor: '#cbd5e1',
      strokeWidth: 0,
      strokeStyle: 'solid',
      visible: true,
      locked: false,
      zIndex: shapes.length + 1,
      imageUrl: blobUrl,
      imageFit: 'contain',
      borderRadius: 0,
    })

    if (newShapeId) {
      setSelectedShapeId(newShapeId)
    }
    setDrawingMode(null)
    toast.success("Uploaded custom image to canvas!")
    e.target.value = ''
  }

  // Custom URL Submit
  const handleAddCustomUrl = () => {
    if (!customUrl.trim()) return

    const newShapeId = addShape({
      type: 'deco-image',
      x: 60,
      y: 60,
      width: 180,
      height: 180,
      rotation: 0,
      fillColor: 'transparent',
      fillOpacity: 100,
      strokeColor: '#cbd5e1',
      strokeWidth: 0,
      strokeStyle: 'solid',
      visible: true,
      locked: false,
      zIndex: shapes.length + 1,
      imageUrl: customUrl.trim(),
      imageFit: 'contain',
      borderRadius: 0,
    })

    if (newShapeId) {
      setSelectedShapeId(newShapeId)
    }
    setDrawingMode(null)
    toast.success("Added image from URL!")
    setCustomUrl("")
  }

  const imageElements = shapes.filter(s => s.type === 'deco-image')
  const hasMore = photos.length < totalResults

  return (
    <div className="space-y-3.5">
      {/* ── 0. Provider Switcher (Pexels / Unsplash) ─────────────── */}
      <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-lg border border-slate-200/70 shadow-2xs">
        <button
          type="button"
          onClick={() => handleProviderSwitch('pexels')}
          className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
            provider === 'pexels'
              ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-200/60'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
          }`}
        >
          <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded shrink-0" fill="none">
            <rect width="32" height="32" rx="6" fill="#05A081" />
            <path d="M12 9h4.5a4.5 4.5 0 0 1 4.5 4.5v0a4.5 4.5 0 0 1-4.5 4.5H15v5h-3V9zm3 3v3h1.5a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 0-1.5-1.5H15z" fill="#ffffff" />
          </svg>
          <span>Pexels</span>
        </button>

        <button
          type="button"
          onClick={() => handleProviderSwitch('unsplash')}
          className={`py-1.5 px-2 rounded-md flex items-center justify-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
            provider === 'unsplash'
              ? 'bg-white text-slate-900 shadow-2xs border border-slate-300'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
          }`}
        >
          <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 shrink-0 fill-current text-slate-900" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
          </svg>
          <span>Unsplash</span>
        </button>
      </div>

      {/* ── 1. Search Bar ────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <Input
            type="text"
            placeholder={`Search free photos on ${provider === 'pexels' ? 'Pexels' : 'Unsplash'}...`}
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
                fetchPhotos(provider, query, 1, orientation, false)
              }
            }}
            className="h-8.5 pl-8 pr-8 text-xs bg-slate-50/70 border-slate-200/80 rounded-lg placeholder:text-slate-400 focus:bg-white focus:border-blue-400 transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                setActiveCategory("trending")
                fetchPhotos(provider, "", 1, orientation, false)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              <XIcon className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Orientation Filter & Provider Partner Badge Row */}
        <div className="flex items-center justify-between gap-1.5 px-0.5">
          {/* Segmented orientation icon buttons */}
          <div className="flex items-center p-0.5 bg-slate-100/90 rounded-lg border border-slate-200/70 shadow-2xs">
            {ORIENTATIONS.map(ori => {
              const Icon = ori.icon
              const isSelected = orientation === ori.id
              return (
                <button
                  key={ori.id}
                  type="button"
                  onClick={() => handleOrientationChange(ori.id)}
                  title={ori.tooltip}
                  className={`h-6.5 px-2 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              )
            })}
          </div>

          {/* Official Attribution Badge */}
          {provider === 'pexels' ? (
            <a
              href="https://www.pexels.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/70 transition-all text-[11px] font-medium group cursor-pointer shadow-2xs shrink-0"
              title="Photos provided by Pexels"
            >
              <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded shrink-0" fill="none">
                <rect width="32" height="32" rx="6" fill="#05A081" />
                <path d="M12 9h4.5a4.5 4.5 0 0 1 4.5 4.5v0a4.5 4.5 0 0 1-4.5 4.5H15v5h-3V9zm3 3v3h1.5a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 0-1.5-1.5H15z" fill="#ffffff" />
              </svg>
              <span className="font-semibold tracking-tight">Photos by Pexels</span>
              <ExternalLink className="h-2.5 w-2.5 text-emerald-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          ) : (
            <a
              href="https://unsplash.com/?utm_source=aichartor&utm_medium=referral"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/70 text-slate-800 border border-slate-300/80 transition-all text-[11px] font-medium group cursor-pointer shadow-2xs shrink-0"
              title="Photos provided by Unsplash"
            >
              <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 shrink-0 fill-current text-slate-900" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
              </svg>
              <span className="font-semibold tracking-tight">Photos by Unsplash</span>
              <ExternalLink className="h-2.5 w-2.5 text-slate-600 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
            </a>
          )}
        </div>
      </div>

      {/* ── 2. Category Filter Pills ─────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        {currentCategories.map((cat) => {
          const isSelected = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all text-xs font-medium cursor-pointer ${
                isSelected
                  ? "bg-slate-900 text-white shadow-2xs font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800"
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ── 3. Custom Upload & Direct URL Accordion ───────────────── */}
      <div className="border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50/50">
        <button
          type="button"
          onClick={() => setShowCustomUpload(!showCustomUpload)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Upload className="h-3.5 w-3.5 text-blue-500" />
            <span>Upload or Add by URL</span>
          </div>
          {showCustomUpload ? (
            <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>

        {showCustomUpload && (
          <div className="p-2.5 space-y-2 border-t border-slate-200/70 bg-white">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleUploadFile}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8.5 text-xs font-medium border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5 mr-1.5 text-slate-500" />
              Choose file from device
            </Button>

            <div className="flex gap-1.5">
              <Input
                placeholder="Paste image URL (https://...)"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomUrl()
                }}
                className="h-8.5 text-xs flex-1 rounded-lg border-slate-200/80 placeholder:font-normal placeholder:text-slate-400"
              />
              <Button
                variant="outline"
                size="sm"
                className="h-8.5 text-xs px-3"
                disabled={!customUrl.trim()}
                onClick={handleAddCustomUrl}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Photos Results Header ─────────────────────────────── */}
      <div className="flex justify-between items-center px-0.5 pt-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Camera className={`w-3.5 h-3.5 ${provider === 'pexels' ? 'text-emerald-600' : 'text-slate-900'}`} />
            {isLoading
              ? "Loading..."
              : activeCategory === 'trending' && !query
              ? `Curated ${provider === 'pexels' ? 'Pexels' : 'Unsplash'}`
              : `"${query}"`}
          </span>
          <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
            {totalResults > 0 ? totalResults.toLocaleString() : photos.length}
          </span>
          {orientation && (
            <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md capitalize">
              {orientation}
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">Click to add</span>
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
            onClick={() => fetchPhotos(provider, query, 1, orientation, false)}
            className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100/60"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry
          </Button>
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-500" />
          <p className="text-xs font-medium text-slate-600">No photos found for "{query}"</p>
          <p className="text-[10px] text-slate-400 mt-1">Try another keyword or select a category above</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1">
            {photos.map((photo) => {
              const isAdding = addingId === photo.id
              const avgBg = photo.avgColor || '#e2e8f0'

              return (
                <div
                  key={`${photo.source}-${photo.id}`}
                  onClick={() => handleAddPhotoToCanvas(photo)}
                  className={`group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-2xs hover:shadow-md transition-all select-none ${
                    photo.source === 'unsplash' ? 'hover:border-slate-800' : 'hover:border-emerald-400'
                  }`}
                  style={{ backgroundColor: avgBg }}
                  title={`${photo.alt} (by ${photo.photographerName})`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <img
                      src={photo.thumbUrl}
                      alt={photo.alt}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                      {/* Top Action Badge */}
                      <div className="self-end">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5 ${
                          photo.source === 'unsplash'
                            ? 'bg-white text-slate-900'
                            : 'bg-white/95 text-emerald-700'
                        }`}>
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
                          title={`View ${photo.photographerName} on ${photo.source === 'unsplash' ? 'Unsplash' : 'Pexels'}`}
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
          {provider === 'pexels' ? (
            <div className="pt-2.5 pb-1 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 rounded shrink-0" fill="none">
                  <rect width="32" height="32" rx="6" fill="#05A081" />
                  <path d="M12 9h4.5a4.5 4.5 0 0 1 4.5 4.5v0a4.5 4.5 0 0 1-4.5 4.5H15v5h-3V9zm3 3v3h1.5a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 0-1.5-1.5H15z" fill="#ffffff" />
                </svg>
                <span>Photos provided by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline">Pexels</a></span>
              </div>
              <a
                href="https://www.pexels.com/license/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Free License
              </a>
            </div>
          ) : (
            <div className="pt-2.5 pb-1 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <svg viewBox="0 0 32 32" className="w-3.5 h-3.5 shrink-0 fill-current text-slate-900" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 9V0h12v9H10zm12 5h10v18H0V14h10v9h12v-9z"/>
                </svg>
                <span>Photos provided by <a href="https://unsplash.com/?utm_source=aichartor&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-900 hover:underline">Unsplash</a></span>
              </div>
              <a
                href="https://unsplash.com/license?utm_source=aichartor&utm_medium=referral"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                Unsplash License
              </a>
            </div>
          )}
        </div>
      )}

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
    </div>
  )
}
