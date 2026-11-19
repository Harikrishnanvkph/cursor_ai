"use client"

import React, { useRef, useEffect } from "react"
import { Search, X as XIcon, ImageIcon, ExternalLink, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  type StockProvider,
  type PixabayImageType,
  type UnifiedPhoto,
  PIXABAY_TYPES,
  PROVIDER_META,
} from "@/lib/utils/stock-image-search"
import { useStockImageStore } from "@/lib/stores/stock-image-store"
import { trackUnsplashDownload } from "@/lib/utils/unsplash-utils"
import {
  PexelsLogo,
  UnsplashLogo,
  PixabayLogo,
  WikimediaLogo,
  renderProviderLogo,
} from "./stock-provider-logos"

interface StockImageSearchProps {
  onSelectPhoto: (photo: UnifiedPhoto) => void
}

/**
 * Minimal stock image API search view backed by the shared useStockImageStore cache.
 * Never triggers an API request until the user enters a non-empty keyword and submits.
 */
export function StockImageSearch({ onSelectPhoto }: StockImageSearchProps) {
  const {
    provider,
    pixabayType,
    query,
    committedQuery,
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
    clearSearch,
    searchStock,
  } = useStockImageStore()

  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const runSearch = (
    targetProvider: StockProvider,
    targetQuery: string,
    targetPage: number,
    append: boolean,
    targetPixabayType: PixabayImageType
  ) => {
    if (!targetQuery.trim()) return
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    searchStock({
      provider: targetProvider,
      query: targetQuery,
      page: targetPage,
      append,
      pixabayType: targetPixabayType,
      perPage: 24,
      signal: controller.signal,
    })
  }

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!query.trim() || isLoading) return
    runSearch(provider, query, 1, false, pixabayType)
  }

  const handleProviderChange = (next: StockProvider) => {
    if (next === provider) return
    abortRef.current?.abort()
    setProvider(next, { restoreEmptyCache: false })
  }

  const handlePixabayTypeChange = (nextType: PixabayImageType) => {
    if (nextType === pixabayType) return
    const restoredFromCache = setPixabayType(nextType)
    if (!restoredFromCache && hasSearched && committedQuery.trim()) {
      runSearch("pixabay", committedQuery, 1, false, nextType)
    }
  }

  const handleClear = () => {
    abortRef.current?.abort()
    clearSearch()
  }

  const handlePhotoClick = (photo: UnifiedPhoto) => {
    if (photo.source === "unsplash") {
      trackUnsplashDownload({
        downloadLocation: photo.downloadLocation,
        photoId: photo.id,
      })
    }
    onSelectPhoto(photo)
  }

  // Only show results in the modal search tab when a real keyword search has been performed
  // (so curated empty-query results from Decorations -> Images don't skip the prompt).
  const showKeywordResults = hasSearched && committedQuery.trim().length > 0
  const hasMore = photos.length < totalResults

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-2.5 min-w-0">
      {/* Provider + Search Bar (stacks cleanly down to 250px) */}
      <form onSubmit={handleSubmit} className="flex flex-col min-[360px]:flex-row gap-1.5 min-w-0 shrink-0">
        <Select value={provider} onValueChange={(val: StockProvider) => handleProviderChange(val)}>
          <SelectTrigger className="h-8 w-full min-[360px]:w-[122px] shrink-0 text-xs font-medium bg-white border-slate-200 rounded-md px-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-xs">
            <SelectItem value="pexels" className="cursor-pointer">
              <div className="flex items-center gap-1.5">
                <PexelsLogo className="w-3.5 h-3.5 rounded shrink-0" />
                <span>Pexels</span>
              </div>
            </SelectItem>
            <SelectItem value="unsplash" className="cursor-pointer">
              <div className="flex items-center gap-1.5">
                <UnsplashLogo className="w-3.5 h-3.5 shrink-0 fill-current text-slate-900" />
                <span>Unsplash</span>
              </div>
            </SelectItem>
            <SelectItem value="pixabay" className="cursor-pointer">
              <div className="flex items-center gap-1.5">
                <PixabayLogo className="w-3.5 h-3.5 rounded shrink-0" />
                <span>Pixabay</span>
              </div>
            </SelectItem>
            <SelectItem value="wikimedia" className="cursor-pointer">
              <div className="flex items-center gap-1.5">
                <WikimediaLogo className="w-3.5 h-3.5 shrink-0" />
                <span>Wikimedia</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1.5 flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={PROVIDER_META[provider].searchPlaceholder}
              className="h-8 pl-8 pr-7 text-xs bg-white border-slate-200 rounded-md min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!query.trim() || isLoading}
            className="h-8 px-2.5 text-xs bg-slate-900 hover:bg-slate-800 text-white shrink-0 rounded-md"
          >
            {isLoading ? "..." : "Search"}
          </Button>
        </div>
      </form>

      {/* Pixabay Type Pills */}
      {provider === "pixabay" && (
        <div className="flex flex-wrap items-center gap-1 shrink-0">
          {PIXABAY_TYPES.map((t) => {
            const selected = pixabayType === t.id
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handlePixabayTypeChange(t.id)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer ${
                  selected
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Results Area (fills remaining fixed modal height) */}
      <div className="flex-1 min-h-0 flex flex-col">
        {!showKeywordResults ? (
          <div className="flex-1 border border-dashed border-slate-200 rounded-lg px-3 flex flex-col items-center justify-center text-center bg-slate-50/60">
            <Search className="w-6 h-6 mb-1.5 text-slate-400" />
            <p className="text-xs font-medium text-slate-700">Search for an image</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enter a keyword above and press Enter or Search.
            </p>
          </div>
        ) : isLoading ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 min-[300px]:grid-cols-2 gap-2 content-start">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] rounded-md bg-slate-100 border border-slate-200"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-3 bg-red-50/60 border border-red-200 rounded-lg space-y-2">
            <p className="text-xs font-medium text-red-700">Failed to load images</p>
            <p className="text-[11px] text-red-600 break-words">{error}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => runSearch(provider, committedQuery, 1, false, pixabayType)}
              className="h-7 text-xs border-red-300 text-red-700 hover:bg-red-100/60"
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-3 border border-dashed border-slate-200 rounded-lg text-slate-500">
            <ImageIcon className="h-6 w-6 mb-1.5 opacity-40" />
            <p className="text-xs font-medium text-slate-700">No images found for "{committedQuery}"</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Try another keyword or provider.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2">
            <div className="grid grid-cols-1 min-[300px]:grid-cols-2 gap-2">
              {photos.map((photo) => {
                const meta = PROVIDER_META[photo.source]
                const isGraphic =
                  Boolean(photo.imageType && photo.imageType !== "photo") ||
                  (photo.source === "wikimedia" &&
                    /\.(png|webp|svg)(\?|$)/i.test(photo.thumbUrl || photo.fullUrl || ""))

                return (
                  <div
                    key={`${photo.source}-${photo.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => handlePhotoClick(photo)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        handlePhotoClick(photo)
                      }
                    }}
                    className={`group relative text-left rounded-md overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/40 ${meta.cardHoverBorder}`}
                    style={{ backgroundColor: isGraphic ? "#f1f5f9" : photo.avgColor || "#e2e8f0" }}
                    title={`${photo.alt} (${photo.photographerName})`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                      <img
                        src={photo.thumbUrl}
                        alt={photo.alt}
                        loading="lazy"
                        className={`w-full h-full ${isGraphic ? "object-contain p-1" : "object-cover"}`}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-0.5 flex items-center justify-between gap-1 text-[10px] text-white">
                        <a
                          href={photo.photographerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="truncate underline decoration-white/60 hover:text-blue-200 min-w-0"
                          title={`${photo.photographerName} on ${meta.label}`}
                        >
                          {photo.photographerName}
                        </a>
                        <span className="font-semibold shrink-0">Select</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {hasMore && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runSearch(provider, committedQuery, page + 1, true, pixabayType)}
                disabled={isLoadingMore}
                className="w-full h-7 text-xs border-slate-200 text-slate-700"
              >
                {isLoadingMore ? "Loading..." : `Load More (${photos.length} of ${totalResults.toLocaleString()})`}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Minimal Attribution Footer */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {renderProviderLogo(provider, "w-3 h-3 rounded shrink-0")}
          <span className="truncate">
            {PROVIDER_META[provider].footerPrefix}{" "}
            <a
              href={PROVIDER_META[provider].homeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium hover:underline ${PROVIDER_META[provider].footerLinkClasses}`}
            >
              {PROVIDER_META[provider].label}
            </a>
          </span>
        </div>
        <a
          href={PROVIDER_META[provider].licenseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-600 shrink-0"
        >
          <span>{PROVIDER_META[provider].licenseLabel}</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>
    </div>
  )
}
