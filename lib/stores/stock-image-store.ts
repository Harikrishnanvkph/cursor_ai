import { create } from "zustand"
import {
  type StockProvider,
  type PixabayImageType,
  type UnifiedPhoto,
  fetchStockPhotos,
  deduplicateStockPhotos,
} from "@/lib/utils/stock-image-search"
import { checkContentSafety } from "@/lib/safety/content-filter"

export interface CachedStockResult {
  photos: UnifiedPhoto[]
  total: number
  page: number
  timestamp: number
}

const MAX_CACHE_ENTRIES = 40
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

export function makeStockCacheKey(
  provider: StockProvider,
  query: string,
  pixabayType: PixabayImageType = "all"
): string {
  const typePart = provider === "pixabay" ? pixabayType : "all"
  return `${provider}::${typePart}::${query.trim().toLowerCase()}`
}

interface StockImageStoreState {
  provider: StockProvider
  pixabayType: PixabayImageType
  query: string
  committedQuery: string
  hasSearched: boolean
  photos: UnifiedPhoto[]
  page: number
  totalResults: number
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  cache: Record<string, CachedStockResult>

  setQuery: (query: string) => void
  setProvider: (provider: StockProvider, options?: { restoreEmptyCache?: boolean }) => boolean
  setPixabayType: (type: PixabayImageType) => boolean
  clearSearch: () => void
  getCached: (provider: StockProvider, query: string, pixabayType?: PixabayImageType) => CachedStockResult | null
  searchStock: (params: {
    provider: StockProvider
    query: string
    page?: number
    append?: boolean
    pixabayType?: PixabayImageType
    perPage?: number
    signal?: AbortSignal
  }) => Promise<void>
}

export const useStockImageStore = create<StockImageStoreState>((set, get) => ({
  provider: "pexels",
  pixabayType: "all",
  query: "",
  committedQuery: "",
  hasSearched: false,
  photos: [],
  page: 1,
  totalResults: 0,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  cache: {},

  setQuery: (query) => set({ query }),

  getCached: (provider, query, pixabayType = "all") => {
    const key = makeStockCacheKey(provider, query, pixabayType)
    const entry = get().cache[key]
    if (!entry) return null
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      return null
    }
    return entry
  },

  setProvider: (nextProvider, options) => {
    const state = get()
    if (nextProvider === state.provider) return false

    const trimmed = state.query.trim()
    const canRestore = trimmed.length > 0 || options?.restoreEmptyCache === true
    const cached = canRestore
      ? state.getCached(nextProvider, trimmed, state.pixabayType)
      : null

    if (cached) {
      set({
        provider: nextProvider,
        committedQuery: trimmed,
        hasSearched: true,
        photos: cached.photos,
        totalResults: cached.total,
        page: cached.page,
        error: null,
        isLoading: false,
        isLoadingMore: false,
      })
      return true
    }

    set({
      provider: nextProvider,
      committedQuery: "",
      hasSearched: false,
      photos: [],
      totalResults: 0,
      page: 1,
      error: null,
      isLoading: false,
      isLoadingMore: false,
    })
    return false
  },

  setPixabayType: (nextType) => {
    const state = get()
    if (nextType === state.pixabayType) return false

    const targetQuery = (state.committedQuery || state.query).trim()
    const cached =
      state.provider === "pixabay" && (targetQuery.length > 0 || state.hasSearched)
        ? state.getCached("pixabay", targetQuery, nextType)
        : null

    if (cached) {
      set({
        pixabayType: nextType,
        committedQuery: targetQuery,
        hasSearched: true,
        photos: cached.photos,
        totalResults: cached.total,
        page: cached.page,
        error: null,
        isLoading: false,
        isLoadingMore: false,
      })
      return true
    }

    set({ pixabayType: nextType })
    return false
  },

  clearSearch: () =>
    set({
      query: "",
      committedQuery: "",
      hasSearched: false,
      photos: [],
      page: 1,
      totalResults: 0,
      error: null,
      isLoading: false,
      isLoadingMore: false,
    }),

  searchStock: async ({
    provider,
    query,
    page = 1,
    append = false,
    pixabayType = "all",
    perPage = 24,
    signal,
  }) => {
    const trimmed = query.trim()

    if (trimmed) {
      const safety = checkContentSafety(trimmed)
      if (safety.isDisallowed) {
        set({
          provider,
          pixabayType,
          query,
          committedQuery: trimmed,
          hasSearched: true,
          photos: [],
          totalResults: 0,
          page: 1,
          error: safety.reason || "Search restricted: Adult or explicit keywords are not permitted.",
          isLoading: false,
          isLoadingMore: false,
        })
        return
      }
    }

    // Serve page 1 immediately from cache without an API request
    if (!append && page === 1) {
      const cached = get().getCached(provider, trimmed, pixabayType)
      if (cached) {
        set({
          provider,
          pixabayType,
          query,
          committedQuery: trimmed,
          hasSearched: true,
          photos: cached.photos,
          totalResults: cached.total,
          page: cached.page,
          error: null,
          isLoading: false,
          isLoadingMore: false,
        })
        return
      }
    }

    if (append) {
      set({ isLoadingMore: true })
    } else {
      set({
        provider,
        pixabayType,
        query,
        committedQuery: trimmed,
        hasSearched: true,
        isLoading: true,
        error: null,
      })
    }

    try {
      const result = await fetchStockPhotos({
        provider,
        query: trimmed,
        page,
        perPage,
        pixabayType,
        signal,
      })

      if (result.warning) {
        set({
          photos: [],
          totalResults: 0,
          error: result.warning,
          isLoading: false,
          isLoadingMore: false,
        })
        return
      }

      const prevPhotos = append ? get().photos : []
      const nextPhotos = append
        ? deduplicateStockPhotos([...prevPhotos, ...result.photos])
        : result.photos

      const cacheKey = makeStockCacheKey(provider, trimmed, pixabayType)
      const currentCache = { ...get().cache }
      const keys = Object.keys(currentCache)
      if (keys.length >= MAX_CACHE_ENTRIES && !currentCache[cacheKey]) {
        // Evict oldest entry
        let oldestKey = keys[0]
        let oldestTime = currentCache[oldestKey]?.timestamp ?? Infinity
        for (const k of keys) {
          if ((currentCache[k]?.timestamp ?? Infinity) < oldestTime) {
            oldestKey = k
            oldestTime = currentCache[k].timestamp
          }
        }
        delete currentCache[oldestKey]
      }

      currentCache[cacheKey] = {
        photos: nextPhotos,
        total: result.total,
        page,
        timestamp: Date.now(),
      }

      set({
        provider,
        pixabayType,
        committedQuery: trimmed,
        hasSearched: true,
        photos: nextPhotos,
        totalResults: result.total,
        page,
        error: null,
        cache: currentCache,
      })
    } catch (err: any) {
      if (err?.name === "AbortError") return
      set({
        error: err?.message || `Failed to load images from ${provider}.`,
      })
    } finally {
      set({
        isLoading: false,
        isLoadingMore: false,
      })
    }
  },
}))
