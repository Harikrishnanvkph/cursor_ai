"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X as XIcon, Loader2, Globe, Smile, Sparkles } from "lucide-react"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import {
  DESIGN_ELEMENTS_LIBRARY,
  ELEMENT_CATEGORIES,
  type CanvasDesignElement,
  isMulticolorSvg
} from "@/lib/elements/elements-registry"
import { toast } from "sonner"

// Quick trending tags for vector icons
const ICON_TAGS = ["arrow", "brush", "crown", "star", "heart", "fire", "sparkle", "check", "badge", "circle", "smile", "hand"]

// Standard emoji styles available on Cloudflare Edge CDN (100% Free, zero server load)
const EMOJI_STYLES = [
  { id: "fluent-emoji-flat", label: "Fluent" },
  { id: "twemoji", label: "Twemoji" },
  { id: "noto", label: "Noto" },
  { id: "openmoji", label: "OpenMoji" },
]

// Instant-load emoji categories (Single batch fetch from Cloudflare CDN)
const EMOJI_CATEGORIES = [
  { id: "trending", label: "🔥 Trending", items: ["fire", "rocket", "party-popper", "hundred-points", "sparkles", "glowing-star", "red-heart", "thumbs-up", "smiling-face-with-heart-eyes", "money-bag", "trophy", "crown", "high-voltage", "eyes"] },
  { id: "smileys", label: "😀 Smileys", items: ["grinning-face", "face-with-tears-of-joy", "smiling-face-with-sunglasses", "smiling-face-with-heart-eyes", "winking-face", "partying-face", "thinking-face", "crying-face", "loudly-crying-face", "exploding-head", "nerd-face"] },
  { id: "gestures", label: "👋 Gestures", items: ["thumbs-up", "thumbs-down", "clapping-hands", "folded-hands", "waving-hand", "victory-hand", "ok-hand", "flexed-biceps", "handshake", "crossed-fingers"] },
  { id: "animals", label: "🐶 Animals", items: ["dog-face", "cat-face", "lion", "tiger-face", "unicorn", "eagle", "butterfly", "monkey-face", "panda", "bear"] },
  { id: "food", label: "🍕 Food", items: ["pizza", "hamburger", "taco", "french-fries", "sushi", "doughnut", "birthday-cake", "ice-cream", "popcorn", "hot-beverage"] },
  { id: "activities", label: "⚽ Activities", items: ["trophy", "1st-place-medal", "bullseye", "soccer-ball", "basketball", "video-game", "ticket", "party-popper"] },
  { id: "symbols", label: "💖 Symbols", items: ["red-heart", "sparkling-heart", "hundred-points", "fire", "sparkles", "check-mark-button", "cross-mark", "warning", "light-bulb"] },
]

interface LoadedVector {
  fullName: string
  shortName: string
  viewBox: string
  body: string
}

interface VectorSearchTabProps {
  renderElementList: (
    elements: any[],
    emptyIcon: React.ElementType,
    emptyText: string,
    listType?: "section" | "shapes"
  ) => React.ReactNode
  elementsListRef?: React.RefObject<HTMLDivElement | null>
}

export function IconifySearchTab({ renderElementList, elementsListRef }: VectorSearchTabProps) {
  const { shapes, addShape, setSelectedShapeId, setDrawingMode, globalShapeSettings } = useDecorationStore()

  // Mode: "elements" (Canva Design Elements) vs "icons" (200k+ Iconify) vs "emojis" (15k+ Vector Emojis)
  const [mode, setMode] = useState<"elements" | "icons" | "emojis">("elements")

  // ── Elements State (Canva Design Elements) ──
  const [cdnElements, setCdnElements] = useState<CanvasDesignElement[]>([])
  const [isLoadingCdn, setIsLoadingCdn] = useState(false)
  const [elementSearch, setElementSearch] = useState("")
  const [elementCategory, setElementCategory] = useState<string>("all")

  // Load CDN elements on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("cached_cdn_elements_v1")
      } catch {}
      const cached = sessionStorage.getItem("cached_cdn_elements_v2")
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCdnElements(parsed)
            return
          }
        } catch {}
      }
    }

    const loadCdnElements = async () => {
      setIsLoadingCdn(true)
      try {
        const cdnUrl =
          process.env.NEXT_PUBLIC_ELEMENTS_CDN_URL ||
          "https://cdn.jsdelivr.net/gh/Harikrishnanvkph/design-elements-cdn@v2.0.0/catalog.json"
        const res = await fetch(cdnUrl)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setCdnElements(data)
            try {
              sessionStorage.setItem("cached_cdn_elements_v2", JSON.stringify(data))
            } catch {}
          }
        }
      } catch (err) {
        console.warn("[CDN Elements] Fallback to empty library:", err)
      } finally {
        setIsLoadingCdn(false)
      }
    }

    loadCdnElements()
  }, [])

  const elementsPool = cdnElements.length > 0 ? cdnElements : DESIGN_ELEMENTS_LIBRARY
  const filteredElements = useMemo(() => {
    return elementsPool.filter((elem) => {
      const matchesCategory = elementCategory === "all" || elem.category === elementCategory
      const matchesSearch =
        !elementSearch ||
        elem.name.toLowerCase().includes(elementSearch.toLowerCase()) ||
        elem.tags.some((t) => t.toLowerCase().includes(elementSearch.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [elementsPool, elementCategory, elementSearch])

  const handleAddDesignElement = (element: CanvasDesignElement) => {
    const isMulti = isMulticolorSvg(element.svg)
    const newId = addShape({
      type: "deco-svg",
      x: 60,
      y: 60,
      width: Math.min(element.width || 120, 200),
      height: Math.min(element.height || 60, 150),
      rotation: 0,
      fillColor: isMulti ? "original" : (globalShapeSettings?.fillColor || element.defaultColor),
      fillOpacity: 100,
      strokeColor: isMulti ? "original" : (globalShapeSettings?.fillColor || element.defaultColor),
      strokeWidth: 0,
      strokeStyle: "solid",
      visible: true,
      locked: false,
      zIndex: shapes.length + 1,
      svgContent: element.svg,
      originalSvg: element.svg,
    })
    setSelectedShapeId(newId)
    setDrawingMode(null)
    toast.success(`Added ${element.name} to canvas!`)
  }

  // ── Icons & Emojis Search state ──
  const [query, setQuery] = useState("arrow")
  const [icons, setIcons] = useState<string[]>([])
  const [vectorDataMap, setVectorDataMap] = useState<Record<string, LoadedVector>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [isAddingId, setIsAddingId] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Emoji-specific states
  const [emojiStyle, setEmojiStyle] = useState("fluent-emoji-flat")
  const [activeCategory, setActiveCategory] = useState("trending")

  // Shared batch vector body loader directly from Cloudflare Edge CDN (Zero server load)
  const loadBatchFromCdn = useCallback(async (prefixMap: Map<string, string[]>): Promise<Record<string, LoadedVector>> => {
    const loadedMap: Record<string, LoadedVector> = {}
    await Promise.all(
      Array.from(prefixMap.entries()).map(async ([prefix, names]) => {
        try {
          const batchUrl = `https://api.iconify.design/${prefix}.json?icons=${names.map(encodeURIComponent).join(",")}`
          const bRes = await fetch(batchUrl)
          if (!bRes.ok) return
          const bJson = await bRes.json()

          for (const name of names) {
            const iconData =
              bJson.icons?.[name] ||
              (bJson.aliases?.[name] ? bJson.icons?.[bJson.aliases[name].parent] : null)

            if (iconData?.body) {
              const w = iconData.width || bJson.width || 24
              const h = iconData.height || bJson.height || 24
              const left = iconData.left || bJson.left || 0
              const top = iconData.top || bJson.top || 0
              const fullName = `${prefix}:${name}`
              loadedMap[fullName] = {
                fullName,
                shortName: name,
                viewBox: `${left} ${top} ${w} ${h}`,
                body: iconData.body,
              }
            }
          }
        } catch (err) {
          console.warn(`[CDN Batch] Failed for ${prefix}:`, err)
        }
      })
    )
    return loadedMap
  }, [])

  // Fetch icons or emojis from Cloudflare CDN
  const executeSearch = useCallback(async (searchQuery: string, currentMode: "elements" | "icons" | "emojis", stylePrefix: string) => {
    if (currentMode === "elements") return

    const trimmed = searchQuery.trim()

    // When in emoji mode without search query, load pre-curated instant category
    if (currentMode === "emojis" && !trimmed) {
      setIsLoading(true)
      try {
        const cat = EMOJI_CATEGORIES.find((c) => c.id === activeCategory) || EMOJI_CATEGORIES[0]
        const fullNames = cat.items.map((n) => `${stylePrefix}:${n}`)
        setIcons(fullNames)

        const prefixMap = new Map<string, string[]>([[stylePrefix, cat.items]])
        const loaded = await loadBatchFromCdn(prefixMap)
        setVectorDataMap((prev) => ({ ...prev, ...loaded }))
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (!trimmed) {
      setIcons([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const searchUrl = currentMode === "emojis"
        ? `https://api.iconify.design/search?query=${encodeURIComponent(trimmed)}&prefix=${encodeURIComponent(stylePrefix)}&limit=48`
        : `https://api.iconify.design/search?query=${encodeURIComponent(trimmed)}&limit=48`

      const res = await fetch(searchUrl)
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      const iconList: string[] = data.icons || []
      setIcons(iconList)

      // Group icons by prefix for single parallel batch request
      const prefixMap = new Map<string, string[]>()
      for (const full of iconList) {
        const [p, n] = full.split(":")
        if (p && n) {
          if (!prefixMap.has(p)) prefixMap.set(p, [])
          prefixMap.get(p)!.push(n)
        }
      }

      const loaded = await loadBatchFromCdn(prefixMap)
      setVectorDataMap((prev) => ({ ...prev, ...loaded }))
    } catch (err) {
      console.warn("[Search Error]:", err)
      setIcons([])
    } finally {
      setIsLoading(false)
    }
  }, [activeCategory, loadBatchFromCdn])

  // Debounced search trigger
  useEffect(() => {
    if (mode === "elements") return

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(query, mode, emojiStyle)
    }, 280)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [query, mode, emojiStyle, activeCategory, executeSearch])

  // Switch mode handler
  const handleModeChange = (newMode: "elements" | "icons" | "emojis") => {
    setMode(newMode)
    if (newMode === "icons") {
      setQuery("arrow")
    } else if (newMode === "emojis") {
      setQuery("")
    }
  }

  // Click-to-add handler for icons/emojis: adds scalable vector to canvas with multi-color palette support
  const handleAddVector = async (fullName: string) => {
    setIsAddingId(fullName)
    try {
      let vector = vectorDataMap[fullName]
      if (!vector) {
        const [prefix, rawName] = fullName.includes(":") ? fullName.split(":") : ["", fullName]
        if (prefix && rawName) {
          const map = await loadBatchFromCdn(new Map([[prefix, [rawName]]]))
          vector = map[fullName]
        }
      }

      let svgText = ""
      if (vector?.body) {
        svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vector.viewBox}">${vector.body}</svg>`
      } else {
        const [prefix, rawName] = fullName.split(":")
        const fallbackRes = await fetch(`https://api.iconify.design/${prefix}/${encodeURIComponent(rawName)}.svg`)
        if (!fallbackRes.ok) throw new Error("Could not download SVG from CDN")
        svgText = await fallbackRes.text()
      }

      const isMulti = isMulticolorSvg(svgText)
      const newId = addShape({
        type: "deco-svg",
        x: 80,
        y: 80,
        width: 80,
        height: 80,
        rotation: 0,
        fillColor: isMulti ? "original" : "#0F172A",
        fillOpacity: 100,
        strokeColor: isMulti ? "original" : "#0F172A",
        strokeWidth: 0,
        strokeStyle: "solid",
        visible: true,
        locked: false,
        zIndex: shapes.length + 1,
        svgContent: svgText,
        originalSvg: svgText,
      })

      setSelectedShapeId(newId)
      setDrawingMode(null)

      const shortName = fullName.split(":")[1] || fullName
      toast.success(`Added "${shortName.replace(/-/g, " ")}" to canvas!`)
    } catch (err) {
      console.error("[Vector Add] Failed:", err)
      toast.error("Failed to load SVG vector")
    } finally {
      setIsAddingId(null)
    }
  }

  return (
    <div className="space-y-3.5">
      {/* ── 1. Mode Switcher: Elements vs Icons vs Emojis ── */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-xl">
        <button
          type="button"
          onClick={() => handleModeChange("elements")}
          title="Design Elements"
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
            mode === "elements"
              ? "bg-white text-slate-900 shadow-2xs font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>Elements</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("icons")}
          title="Vector Icons"
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
            mode === "icons"
              ? "bg-white text-slate-900 shadow-2xs font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <Globe className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>Icons</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("emojis")}
          title="Vector Emojis"
          className={`flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all cursor-pointer ${
            mode === "emojis"
              ? "bg-white text-slate-900 shadow-2xs font-semibold"
              : "text-slate-500 hover:text-slate-800 font-medium"
          }`}
        >
          <Smile className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span>Emojis</span>
        </button>
      </div>

      {/* ── 2. SUB-VIEW: ELEMENTS (Canva Style Designs) ── */}
      {mode === "elements" ? (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search elements, brushes, doodles..."
              value={elementSearch}
              onChange={(e) => setElementSearch(e.target.value)}
              className="h-8.5 pl-8 pr-7 text-xs bg-slate-50/70 border-slate-200/80 rounded-lg placeholder:text-slate-400 focus:bg-white focus:border-blue-400 transition-colors"
            />
            {elementSearch && (
              <button
                type="button"
                onClick={() => setElementSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {ELEMENT_CATEGORIES.map((cat) => {
              const isSelected = elementCategory === cat.id
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setElementCategory(cat.id)}
                  className={`px-3 py-1 rounded-full whitespace-nowrap transition-all text-xs font-medium cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800"
                  }`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>

          {/* Elements Gallery Header */}
          <div className="flex justify-between items-center px-0.5 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                {isLoadingCdn && <Loader2 className="h-3 w-3 animate-spin text-amber-500" />}
                Design Library
              </span>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {filteredElements.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Click to add</span>
          </div>

          {/* Elements Grid */}
          {isLoadingCdn && filteredElements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-amber-500 mb-2" />
              <span className="text-xs">Streaming elements from CDN...</span>
            </div>
          ) : filteredElements.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-30 text-amber-500" />
              <p className="text-xs font-medium">No elements found</p>
              <p className="text-[11px] text-slate-400 mt-1">Try another search keyword or category</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
              {filteredElements.map((elem) => (
                <button
                  key={elem.id}
                  type="button"
                  onClick={() => handleAddDesignElement(elem)}
                  title={elem.name}
                  className="group relative flex flex-col items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-blue-400/80 hover:shadow-xs transition-all text-left cursor-pointer"
                >
                  <div className="w-full h-16 flex items-center justify-center overflow-hidden p-1">
                    <div
                      className="w-full h-full flex items-center justify-center transition-transform group-hover:scale-108 duration-200"
                      style={{ color: elem.defaultColor }}
                      dangerouslySetInnerHTML={{ __html: elem.svg }}
                    />
                  </div>
                  <div className="w-full mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                    <span className="text-[11px] font-medium text-slate-700 truncate block group-hover:text-blue-600 transition-colors">
                      {elem.name}
                    </span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0 border border-black/10"
                      style={{ backgroundColor: elem.defaultColor }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── 3. SUB-VIEW: ICONS & EMOJIS ── */
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <Input
              type="text"
              placeholder={mode === "icons" ? "Search 200k+ vector icons..." : "Search 15k+ vector emojis..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-8.5 pl-8 pr-7 text-xs bg-slate-50/70 border-slate-200/80 rounded-lg placeholder:text-slate-400 focus:bg-white focus:border-blue-400 transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
              >
                <XIcon className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Mode-Specific Sub-Controls */}
          {mode === "icons" ? (
            // Trending Icon Tags
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {ICON_TAGS.map((tag) => {
                const isSelected = query.toLowerCase() === tag
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setQuery(tag)}
                    className={`px-3 py-1 rounded-full capitalize whitespace-nowrap transition-all text-xs font-medium cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800"
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          ) : (
            // Emoji Controls: Style Switcher & Category Pills
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1 p-1 bg-slate-100/80 rounded-xl">
                {EMOJI_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setEmojiStyle(style.id)}
                    className={`flex-1 py-1 px-1.5 text-xs font-medium rounded-lg transition-all text-center cursor-pointer ${
                      emojiStyle === style.id
                        ? "bg-white text-slate-900 shadow-2xs font-semibold"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {style.label}
                  </button>
                ))}
              </div>

              {!query && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
                  {EMOJI_CATEGORIES.map((cat) => {
                    const isSelected = activeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3 py-1 rounded-full whitespace-nowrap transition-all text-xs font-medium cursor-pointer ${
                          isSelected
                            ? "bg-slate-900 text-white shadow-2xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-800"
                        }`}
                      >
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Results Header */}
          <div className="flex justify-between items-center px-0.5 pt-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                ) : mode === "icons" ? (
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Smile className="w-3.5 h-3.5 text-pink-500" />
                )}
                {isLoading ? "Fetching..." : mode === "icons" ? "Icon Library" : "Emoji Library"}
              </span>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                {icons.length}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">Click to add</span>
          </div>

          {/* Results Grid */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500 mb-2" />
              <span className="text-xs">Loading vectors from Edge CDN...</span>
            </div>
          ) : icons.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-30 text-blue-400" />
              <p className="text-xs font-medium">No vectors found for "{query}"</p>
              <p className="text-[11px] text-slate-400 mt-1">Try another keyword or tag</p>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2 max-h-[320px] overflow-y-auto pr-1">
              {icons.map((fullName) => {
                const vector = vectorDataMap[fullName]
                const shortName = fullName.split(":")[1] || fullName
                const isAdding = isAddingId === fullName

                return (
                  <button
                    key={fullName}
                    type="button"
                    onClick={() => handleAddVector(fullName)}
                    disabled={isAdding}
                    title={shortName.replace(/-/g, " ")}
                    className="group relative flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/80 hover:border-blue-400/80 hover:shadow-xs transition-all text-center aspect-square cursor-pointer"
                  >
                    {isAdding ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600 my-auto" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100/80 flex items-center justify-center relative overflow-hidden group-hover:bg-white group-hover:border-blue-200 transition-colors p-1.5">
                        {vector ? (
                          <svg
                            viewBox={vector.viewBox}
                            className="w-full h-full text-slate-700 transition-transform group-hover:scale-110 pointer-events-none"
                            dangerouslySetInnerHTML={{ __html: vector.body }}
                          />
                        ) : (
                          <div className="w-4 h-4 rounded bg-slate-200/60 animate-pulse" />
                        )}
                      </div>
                    )}
                    <span className="text-[10px] font-medium text-slate-600 truncate w-full mt-1.5 group-hover:text-blue-600 capitalize">
                      {shortName.replace(/-/g, " ")}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 4. Active Graphics On Canvas (shared for elements, icons, and emojis) ── */}
      <div ref={elementsListRef} className="pt-3 border-t border-slate-200/80">
        <div className="flex justify-between items-center mb-2 px-0.5">
          <span className="text-xs font-semibold text-slate-700">
            Active Graphics On Canvas
          </span>
        </div>
        {renderElementList(
          shapes.filter((s) => s.type === "deco-svg"),
          Sparkles,
          "No graphics on canvas yet. Click any element, icon, or emoji above to add!",
          "section"
        )}
      </div>
    </div>
  )
}

// Alias export for backward compatibility
export const VectorSearchTab = IconifySearchTab
