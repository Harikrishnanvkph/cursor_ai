"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { trackUnsplashDownload } from "@/lib/utils/unsplash-utils"
import {
  Search,
  X as XIcon,
  Loader2,
  ImageIcon,
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDecorationStore, type DecorationShape } from "@/lib/stores/decoration-store"
import { decorationFileRegistry } from "@/lib/stores/decoration-file-registry"
import { checkContentSafety } from "@/lib/safety/content-filter"
import {
  type StockProvider,
  type PixabayImageType,
  type UnifiedPhoto,
  PIXABAY_TYPES,
  PROVIDER_META,
} from "@/lib/utils/stock-image-search"
import { useStockImageStore } from "@/lib/stores/stock-image-store"
import {
  PexelsLogo,
  UnsplashLogo,
  PixabayLogo,
  WikimediaLogo,
  renderProviderLogo,
} from "@/components/shared/stock-provider-logos"
import { AddImageModal, type AddImageResult } from "@/components/shared/add-image-modal"
import { toast } from "sonner"

export type { StockProvider, PixabayImageType, UnifiedPhoto }

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

export function PexelsImageTab({ renderElementList, imagesListRef }: PexelsImageTabProps) {
  const { shapes, addShape, setSelectedShapeId, setDrawingMode } = useDecorationStore()

  // Shared Stock Image Store (synced & cached across Decorations -> Images and Add Image modals)
  const {
    provider,
    pixabayType,
    query,
    hasSearched,
    photos,
    page,
    totalResults,
    isLoading,
    isLoadingMore,
    error,
    setQuery,
    setProvider,
    setPixabayType,
    searchStock,
  } = useStockImageStore()

  const [addingId, setAddingId] = useState<string | number | null>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // ── "Add Image" Modal State ───────────────────────────────────
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // Fetch photos via shared cache-backed store
  const fetchPhotos = useCallback(async (
    targetProvider: StockProvider,
    targetQuery: string,
    targetPage: number,
    append: boolean = false,
    targetPixabayType: PixabayImageType = 'all'
  ) => {
    await searchStock({
      provider: targetProvider,
      query: targetQuery,
      page: targetPage,
      append,
      pixabayType: targetPixabayType,
      perPage: 24,
    })
  }, [searchStock])

  // Initial load on mount only if no cached/active results exist yet
  useEffect(() => {
    const state = useStockImageStore.getState()
    if (!state.hasSearched && state.photos.length === 0) {
      fetchPhotos(state.provider, state.query, 1, false, state.pixabayType)
    }
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [fetchPhotos])

  // Handle Provider switch (uses cache when available, otherwise fetches)
  const handleProviderSwitch = (newProvider: StockProvider) => {
    if (newProvider === provider) return
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    const restored = setProvider(newProvider, { restoreEmptyCache: true })
    if (!restored) {
      const currentQuery = useStockImageStore.getState().query
      fetchPhotos(newProvider, currentQuery, 1, false, pixabayType)
    }
  }

  // Handle Pixabay type switch (uses cache when available, otherwise fetches)
  const handlePixabayTypeSwitch = (nextType: PixabayImageType) => {
    if (nextType === pixabayType) return
    const restored = setPixabayType(nextType)
    if (!restored) {
      const currentQuery = useStockImageStore.getState().query
      fetchPhotos('pixabay', currentQuery, 1, false, nextType)
    }
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
        toast.warning("Search restricted: Adult or explicit terms are not permitted.")
        fetchPhotos(provider, val, 1, false, pixabayType)
        return
      }
    }

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
    if (photo.source === 'unsplash') {
      trackUnsplashDownload({
        downloadLocation: photo.downloadLocation,
        photoId: photo.id,
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

    setTimeout(() => {
      setAddingId(null)
    }, 400)
  }

  // ── Modal Handlers (Add Image Modal) ──────────────────────────
  const handleConfirmAddModalImage = (result: AddImageResult) => {
    const finalUrl = result.url.trim()
    if (!finalUrl) return

    if (result.source === 'file' && result.file) {
      decorationFileRegistry.set(finalUrl, result.file)
    }

    let width = 200
    let height = 200

    if (result.dimensions?.width && result.dimensions?.height) {
      const aspect = result.dimensions.width / result.dimensions.height
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
  }

  const imageElements = shapes.filter(s => s.type === 'deco-image')
  const hasMore = photos.length < totalResults

  return (
    <div className="space-y-3.5">
      {/* ── 1. Header Action Row: [ Add Image ] + [ Select API Dropdown ] ── */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
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
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
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
                  onClick={() => handlePixabayTypeSwitch(t.id)}
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
                      <div className="text-[10px] text-white/95 font-medium bg-black/55 backdrop-blur-xs px-1.5 py-1 rounded-md">
                        <a
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-between gap-1 w-full text-white hover:text-blue-300 transition-colors"
                          title={`${photo.photographerName} on ${meta.label}`}
                        >
                          <span className="truncate drop-shadow-xs flex items-center gap-1 min-w-0">
                            <span className="opacity-75 text-[9px] shrink-0">By</span>
                            <span className="truncate underline decoration-white/60">
                              {photo.photographerName}
                            </span>
                          </span>
                          <ExternalLink className="w-3 h-3 stroke-[2.5] shrink-0" />
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
      <AddImageModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSelectImage={handleConfirmAddModalImage}
        showSearchTab={false}
      />
    </div>
  )
}
