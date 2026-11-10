"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Search, X as XIcon, Loader2, Globe, Smile, Sparkles } from "lucide-react"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { isMulticolorSvg } from "@/lib/elements/elements-registry"
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
  const { shapes, addShape, setSelectedShapeId, setDrawingMode } = useDecorationStore()

  // Mode: "icons" (200k+ Iconify) vs "emojis" (15k+ Vector Emojis)
  const [mode, setMode] = useState<"icons" | "emojis">("icons")

  // Search state
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
  const executeSearch = useCallback(async (searchQuery: string, currentMode: "icons" | "emojis", stylePrefix: string) => {
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
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    searchTimeoutRef.current = setTimeout(() => {
      executeSearch(query, mode, emojiStyle)
    }, 280)

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [query, mode, emojiStyle, activeCategory, executeSearch])

  // Switch mode handler
  const handleModeChange = (newMode: "icons" | "emojis") => {
    setMode(newMode)
    setQuery(newMode === "icons" ? "arrow" : "")
  }

  // Click-to-add handler: adds scalable vector to canvas with multi-color palette support
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
    <div className="space-y-3">
      {/* 1. Mode Switcher: Icons vs Emojis */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
        <button
          type="button"
          onClick={() => handleModeChange("icons")}
          className={`flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-md transition-all ${
            mode === "icons"
              ? "bg-white text-indigo-600 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Icons (200k+)</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("emojis")}
          className={`flex items-center justify-center gap-1.5 py-1 text-xs font-semibold rounded-md transition-all ${
            mode === "emojis"
              ? "bg-white text-amber-600 shadow-xs"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Smile className="w-3.5 h-3.5" />
          <span>Emojis (15k+)</span>
        </button>
      </div>

      {/* 2. Search Input */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <Input
          type="text"
          placeholder={mode === "icons" ? "Search 200,000+ vector icons..." : "Search 15,000+ vector emojis..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 pl-8 pr-7 text-xs bg-slate-50/60 focus:bg-white"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
          >
            <XIcon className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* 3. Mode-Specific Sub-Controls */}
      {mode === "icons" ? (
        // Trending Icon Tags
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
          {ICON_TAGS.map((tag) => {
            const isSelected = query.toLowerCase() === tag
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setQuery(tag)}
                className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition-all font-medium ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tag}
              </button>
            )
          })}
        </div>
      ) : (
        // Emoji Controls: Style Switcher & Category Pills
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-1 p-0.5 bg-slate-100/70 rounded-md">
            {EMOJI_STYLES.map((style) => (
              <button
                key={style.id}
                type="button"
                onClick={() => setEmojiStyle(style.id)}
                className={`flex-1 py-0.5 px-1 text-[10px] font-medium rounded transition-all text-center ${
                  emojiStyle === style.id
                    ? "bg-white text-amber-600 shadow-xs font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {style.label}
              </button>
            ))}
          </div>

          {!query && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] no-scrollbar">
              {EMOJI_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all font-medium ${
                      isSelected
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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

      {/* 4. Results Header */}
      <div className="flex justify-between items-center px-1 text-[10px] text-slate-400">
        <span className="uppercase font-bold tracking-wider flex items-center gap-1">
          {mode === "icons" ? (
            <Globe className="w-3 h-3 text-indigo-500" />
          ) : (
            <Smile className="w-3 h-3 text-amber-500" />
          )}
          {isLoading ? "Fetching from CDN..." : `Results (${icons.length})`}
        </span>
        <span>Click to add</span>
      </div>

      {/* 5. Results Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mb-2" />
          <span className="text-xs">Loading vectors from Edge CDN...</span>
        </div>
      ) : icons.length === 0 ? (
        <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
          <Globe className="h-8 w-8 mx-auto mb-2 opacity-30 text-indigo-400" />
          <p className="text-xs font-medium">No vectors found for "{query}"</p>
          <p className="text-[10px] text-slate-400 mt-1">Try another keyword or tag</p>
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
                className="group relative flex flex-col items-center justify-center p-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-indigo-50/50 hover:border-indigo-400 hover:shadow-xs transition-all text-center aspect-square"
              >
                {isAdding ? (
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600 my-auto" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden group-hover:bg-white group-hover:border-indigo-200 transition-colors p-1">
                    {vector ? (
                      <svg
                        viewBox={vector.viewBox}
                        className="w-full h-full text-slate-700 transition-transform group-hover:scale-115 pointer-events-none"
                        dangerouslySetInnerHTML={{ __html: vector.body }}
                      />
                    ) : (
                      <div className="w-4 h-4 rounded bg-slate-200/60 animate-pulse" />
                    )}
                  </div>
                )}
                <span className="text-[9px] font-medium text-slate-500 truncate w-full mt-1 opacity-70 group-hover:opacity-100 group-hover:text-indigo-600 capitalize">
                  {shortName.replace(/-/g, " ")}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* 6. Layered Design Elements History */}
      <div ref={elementsListRef} className="pt-2 border-t border-slate-100">
        <div className="flex justify-between items-center mb-1.5">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Active Elements On Canvas
          </Label>
        </div>
        {renderElementList(
          shapes.filter((s) => s.type === "deco-svg"),
          Sparkles,
          "No elements on canvas yet. Click any vector above to add!",
          "section"
        )}
      </div>
    </div>
  )
}

// Alias export for backward compatibility
export const VectorSearchTab = IconifySearchTab
