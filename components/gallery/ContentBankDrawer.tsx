"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import {
  Sparkles,
  X,
  Copy,
  Check,
  ArrowRightLeft,
  GripVertical,
  Image as ImageIcon,
  Type,
  FileText,
  Quote,
  Search,
  ExternalLink,
  Layers,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info
} from "lucide-react"
import { toast } from "sonner"
import type { ContentBankTextBlock, ContentBankTitle, ContentBankSubtitle, ContentBankPhrase, ContentBankSliceImage } from "@/lib/format-types"

type TabType = "all" | "text" | "titles" | "media" | "sources"

/** Length tier badge colors */
const LENGTH_BADGE: Record<string, { label: string; color: string }> = {
  'extra-long': { label: '500w+', color: 'bg-red-50 text-red-700 border-red-200' },
  'long': { label: '300w+', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'medium-long': { label: '200w+', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'medium': { label: '100w+', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'short': { label: '50w+', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'list': { label: 'Bullets', color: 'bg-purple-50 text-purple-700 border-purple-200' },
}

/** Collapsible text block card with word count badge and expand/collapse for long content */
function TextBlockCard({
  block,
  htmlContent,
  plainContent,
  hasBullets,
  wordCount,
  isLongBlock,
  copiedId,
  onDragStart,
  onCopy,
  onApply,
}: {
  block: ContentBankTextBlock
  htmlContent: string
  plainContent: string
  hasBullets: boolean
  wordCount: number
  isLongBlock: boolean
  copiedId: string | null
  onDragStart: (e: React.DragEvent, type: string, content: string, label: string, plainText?: string) => void
  onCopy: (text: string, id: string) => void
  onApply: (content: string, label: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const badge = LENGTH_BADGE[block.length || ''] || { label: block.length || '', color: 'bg-gray-50 text-gray-600 border-gray-200' }
  const PREVIEW_WORDS = 80
  const displayText = isLongBlock && !expanded
    ? block.text.split(/\s+/).slice(0, PREVIEW_WORDS).join(' ') + '…'
    : block.text

  return (
    <div
      draggable={true}
      onDragStart={(e) => onDragStart(e, "text", htmlContent, block.category, plainContent)}
      className="group bg-white rounded-xl border border-gray-200/80 p-3 hover:border-purple-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-300 group-hover:text-purple-500 transition-colors">
            <GripVertical className="w-3.5 h-3.5" />
          </span>
          <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
            {block.category}
          </span>
          {hasBullets ? (
            <span className="text-[10px] font-bold bg-purple-100/70 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200">
              {block.bullets!.length} bullets
            </span>
          ) : (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badge.color}`}>
              {badge.label} · {wordCount}w
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={() => onCopy(plainContent, block.id)}
            className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Copy text & bullets"
          >
            {copiedId === block.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => onApply(htmlContent, block.category)}
            className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-semibold border border-purple-200/80 transition-all flex items-center gap-1"
            title="Apply to selected zone"
          >
            <ArrowRightLeft className="w-3 h-3" />
            <span>Apply</span>
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-700 leading-relaxed font-normal">
        {displayText}
      </p>

      {isLongBlock && (
        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded) }}
          className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-800 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Show less' : `Show all ${wordCount} words`}
        </button>
      )}

      {hasBullets && (
        <ul className="mt-2 pl-4 list-disc space-y-0.5 text-[11px] text-gray-600">
          {block.bullets!.map((b, bIdx) => (
            <li key={bIdx}>{b}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ContentBankDrawer() {
  const {
    isContentBankOpen,
    closeContentBank,
    contentPackage,
    selectedZoneId,
    setSelectedZoneId,
    setZoneContentOverride,
    updateZoneContent,
    selectedFormatSnapshot,
    formats,
    userFormats,
    selectedFormatId,
    setContextualImageUrl
  } = useFormatGalleryStore()

  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [unsplashQuery, setUnsplashQuery] = useState("")
  const [isSearchingImages, setIsSearchingImages] = useState(false)
  const [fetchedImages, setFetchedImages] = useState<Array<{ url: string; authorName?: string; query: string }>>([])

  // Get active format working copy to enumerate available zones
  const activeFormat = useMemo(() => {
    if (selectedFormatSnapshot) return selectedFormatSnapshot
    if (selectedFormatId) {
      return [...formats, ...userFormats].find(f => f.id === selectedFormatId) || null
    }
    return null
  }, [selectedFormatSnapshot, selectedFormatId, formats, userFormats])

  const availableZones = useMemo(() => {
    if (!activeFormat?.skeleton?.zones) return []
    return (activeFormat.skeleton.zones as any[]).filter(z => z.type !== 'chart')
  }, [activeFormat])

  const selectedZone = useMemo(() => {
    if (!selectedZoneId || !availableZones.length) return null
    return availableZones.find(z => z.id === selectedZoneId) || null
  }, [selectedZoneId, availableZones])

  const bank = contentPackage?.contentBank

  const currentTopicKey = useMemo(() => {
    const queries = bank?.generalImageQueries && bank.generalImageQueries.length > 0
      ? bank.generalImageQueries.slice(0, 3)
      : (contentPackage?.visualKeywords && contentPackage.visualKeywords.length > 0
          ? contentPackage.visualKeywords.slice(0, 3)
          : [contentPackage?.title || 'technology'])
    return queries.join('|')
  }, [bank?.generalImageQueries, contentPackage?.visualKeywords, contentPackage?.title])

  const lastLoadedTopicKeyRef = useRef<string>('')

  // Load general images from Unsplash in parallel based on AI visual keywords or queries
  useEffect(() => {
    if (!isContentBankOpen || !bank) return
    if (lastLoadedTopicKeyRef.current === currentTopicKey && fetchedImages.length > 0) return

    const queries = bank.generalImageQueries && bank.generalImageQueries.length > 0
      ? bank.generalImageQueries.slice(0, 3)
      : (contentPackage?.visualKeywords && contentPackage.visualKeywords.length > 0
          ? contentPackage.visualKeywords.slice(0, 3)
          : [contentPackage?.title || 'technology'])

    async function loadGeneralImages() {
      setIsSearchingImages(true)
      try {
        // Parallelize Unsplash queries concurrently instead of sequential waterfall
        const fetchPromises = queries.map(async (q) => {
          try {
            const res = await fetch(`/api/unsplash?query=${encodeURIComponent(q)}`)
            if (res.ok) {
              const data = await res.json()
              if (data.url) {
                return { url: data.url, authorName: data.authorName, query: q }
              }
            }
          } catch (e) {
            console.warn('Could not fetch Unsplash image for:', q, e)
          }
          return null
        })

        const settled = await Promise.allSettled(fetchPromises)
        const results: Array<{ url: string; authorName?: string; query: string }> = []
        settled.forEach((item) => {
          if (item.status === 'fulfilled' && item.value) {
            if (!results.some(r => r.url === item.value!.url)) {
              results.push(item.value)
            }
          }
        })

        setFetchedImages(results)
        lastLoadedTopicKeyRef.current = currentTopicKey
      } finally {
        setIsSearchingImages(false)
      }
    }

    loadGeneralImages()
  }, [isContentBankOpen, bank, currentTopicKey, fetchedImages.length])

  // Custom search Unsplash
  const handleCustomImageSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!unsplashQuery.trim()) return

    setIsSearchingImages(true)
    try {
      const res = await fetch(`/api/unsplash?query=${encodeURIComponent(unsplashQuery.trim())}`)
      if (res.ok) {
        const data = await res.json()
        if (data.url) {
          setFetchedImages(prev => [{ url: data.url, authorName: data.authorName, query: unsplashQuery.trim() }, ...prev.slice(0, 5)])
          toast.success(`Found image for "${unsplashQuery.trim()}"`)
        } else {
          toast.info(`No image found for "${unsplashQuery.trim()}"`)
        }
      } else {
        toast.error('Failed to search Unsplash')
      }
    } catch (err) {
      console.error(err)
      toast.error('Unsplash request failed')
    } finally {
      setIsSearchingImages(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success("Copied to clipboard")
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleApplyToZone = (content: string, label: string, targetZoneId?: string) => {
    const targetId = targetZoneId || selectedZoneId
    if (!targetId) {
      if (availableZones.length > 0) {
        // Fall back to first suitable text zone
        const firstText = availableZones.find(z => z.type === 'text')
        if (firstText) {
          setZoneContentOverride(firstText.id, content)
          updateZoneContent(firstText.id, content)
          toast.success(`Applied "${label}" to ${firstText.role || firstText.id}`)
          return
        }
      }
      toast.info("Please select a canvas zone first to apply content into it.")
      return
    }

    setZoneContentOverride(targetId, content)
    updateZoneContent(targetId, content)
    const targetName = availableZones.find(z => z.id === targetId)?.role || targetId
    toast.success(`Applied "${label}" to ${targetName}`)
  }

  const handleApplyImageToBackground = (url: string) => {
    setContextualImageUrl(url)
    const bgZone = availableZones.find(z => z.type === 'background')
    if (bgZone) {
      setZoneContentOverride(bgZone.id, url)
      updateZoneContent(bgZone.id, url)
    }
    toast.success("Applied image to background")
  }

/** Helper to format text block into HTML or clean plain text, including bullets */
function getBlockFormattedContent(block: ContentBankTextBlock, asHtml = true): string {
  if (block.bullets && Array.isArray(block.bullets) && block.bullets.length > 0) {
    if (asHtml) {
      const headerHtml = block.text && block.text.trim() ? `<p><strong>${block.text.trim()}</strong></p>` : ''
      const listItems = block.bullets.map(b => `<li>${b}</li>`).join('')
      return `${headerHtml}<ul>${listItems}</ul>`
    } else {
      const headerText = block.text && block.text.trim() ? `${block.text.trim()}\n` : ''
      const listText = block.bullets.map(b => `• ${b}`).join('\n')
      return `${headerText}${listText}`
    }
  }
  return block.text || ''
}

  // Drag start handler
  const handleDragStart = (e: React.DragEvent, type: string, content: string, label: string, plainText?: string) => {
    const payload = JSON.stringify({ type, content, label })
    e.dataTransfer.setData("application/json", payload)
    e.dataTransfer.setData("text/plain", plainText || content)
    e.dataTransfer.effectAllowed = "copyMove"
  }

  if (!isContentBankOpen || !contentPackage) return null

  const textBlocks: ContentBankTextBlock[] = bank?.textBlocks || []
  const titles: ContentBankTitle[] = bank?.titles || []
  const subtitles: ContentBankSubtitle[] = bank?.subtitles || []
  const phrases: ContentBankPhrase[] = bank?.catchyPhrases || []
  const sliceImages: ContentBankSliceImage[] = bank?.sliceImages || []
  const sources: string[] = bank?.sources || [contentPackage?.source || "Verified Dataset"]

  const totalAssets = textBlocks.length + titles.length + subtitles.length + phrases.length + fetchedImages.length + sliceImages.length

  return (
    <div
      className="fixed inset-y-0 right-0 w-[440px] max-w-[95vw] bg-white shadow-2xl z-[120] border-l border-gray-200 flex flex-col animate-in slide-in-from-right duration-300 font-sans"
      style={{ willChange: "transform" }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 via-indigo-50/50 to-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-purple-200 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 leading-none">AI Content Bank</h3>
          </div>
          <button
            onClick={closeContentBank}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Zone Quick-Selector */}
        <div className="mt-3 px-3 py-1.5 bg-white/95 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 shrink-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${selectedZoneId ? "bg-emerald-500 ring-2 ring-emerald-100" : "bg-slate-300"}`} />
            <span className="text-xs font-semibold text-slate-700">Target Zone:</span>
          </div>

          {availableZones.length > 0 ? (
            <select
              value={selectedZoneId || ""}
              onChange={(e) => setSelectedZoneId(e.target.value || null)}
              className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1 bg-slate-50 hover:bg-slate-100/80 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 flex-1 max-w-[250px] truncate transition-colors cursor-pointer"
            >
              <option value="">Select target zone on canvas...</option>
              {availableZones.map(z => (
                <option key={z.id} value={z.id}>
                  {z.role || z.type} ({z.id})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-slate-400 italic text-[11px]">No zones available</span>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-2.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: "All", count: totalAssets },
            { id: "text", label: "Text", count: textBlocks.length },
            { id: "titles", label: "Titles & Phrases", count: titles.length + subtitles.length + phrases.length },
            { id: "media", label: "Media", count: fetchedImages.length + sliceImages.length },
            { id: "sources", label: "Sources", count: sources.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? "bg-white text-purple-700 font-semibold shadow-xs border border-slate-200/50"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50 font-medium"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                activeTab === tab.id ? "bg-purple-100 text-purple-700" : "bg-slate-200/70 text-slate-500"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Drawer Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">

        {/* ── TAB: ALL or TEXT BLOCKS ── */}
        {(activeTab === "all" || activeTab === "text") && (
          <section className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5 text-purple-600" />
              <span>Categorized Text Blocks ({textBlocks.length})</span>
            </div>

            <div className="space-y-2.5">
              {textBlocks.map((block) => {
                const htmlContent = getBlockFormattedContent(block, true)
                const plainContent = getBlockFormattedContent(block, false)
                const hasBullets = Boolean(block.bullets && Array.isArray(block.bullets) && block.bullets.length > 0)
                const wordCount = block.text ? block.text.split(/\s+/).filter(Boolean).length : 0
                const isLongBlock = wordCount > 120

                return (
                  <TextBlockCard
                    key={block.id}
                    block={block}
                    htmlContent={htmlContent}
                    plainContent={plainContent}
                    hasBullets={hasBullets}
                    wordCount={wordCount}
                    isLongBlock={isLongBlock}
                    copiedId={copiedId}
                    onDragStart={handleDragStart}
                    onCopy={handleCopy}
                    onApply={handleApplyToZone}
                  />
                )
              })}
            </div>
          </section>
        )}

        {/* ── TAB: ALL or TITLES & PHRASES ── */}
        {(activeTab === "all" || activeTab === "titles") && (
          <section className="space-y-4">
            {/* 3 Titles */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>3 Alternate Titles</span>
              </div>
              <div className="space-y-2">
                {titles.map((t) => (
                  <div
                    key={t.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, "title", t.text, `${t.style} Title`)}
                    className="group bg-white rounded-xl border border-gray-200/80 p-2.5 hover:border-blue-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100">
                            {t.style}
                          </span>
                          <span className="text-[10px] text-gray-400">{t.text.length} chars</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-900 truncate" title={t.text}>
                          {t.text}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(t.text, t.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Copy title"
                      >
                        {copiedId === t.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleApplyToZone(t.text, `${t.style} Title`)}
                        className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold border border-blue-200/80 transition-all flex items-center gap-1"
                        title="Apply to selected zone"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Subtitles */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>3 Alternate Subtitles</span>
              </div>
              <div className="space-y-2">
                {subtitles.map((s) => (
                  <div
                    key={s.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, "subtitle", s.text, `${s.style} Subtitle`)}
                    className="group bg-white rounded-xl border border-gray-200/80 p-2.5 hover:border-teal-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-teal-500 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-100">
                            {s.style}
                          </span>
                          <span className="text-[10px] text-gray-400">{s.text.length} chars</span>
                        </div>
                        <p className="text-xs text-gray-700 truncate" title={s.text}>
                          {s.text}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(s.text, s.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Copy subtitle"
                      >
                        {copiedId === s.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleApplyToZone(s.text, `${s.style} Subtitle`)}
                        className="px-2 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-semibold border border-teal-200/80 transition-all flex items-center gap-1"
                        title="Apply to selected zone"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3 Catchy Phrases */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <Quote className="w-3.5 h-3.5 text-amber-600" />
                <span>3 Catchy Phrases & Callouts</span>
              </div>
              <div className="space-y-2">
                {phrases.map((p) => (
                  <div
                    key={p.id}
                    draggable={true}
                    onDragStart={(e) => handleDragStart(e, "phrase", p.phrase, "Catchy Phrase")}
                    className="group bg-white rounded-xl border border-gray-200/80 p-2.5 hover:border-amber-300 hover:shadow-sm transition-all cursor-grab active:cursor-grabbing flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-amber-500 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60 uppercase">
                          Kicker / Callout
                        </span>
                        <p className="text-xs font-medium text-gray-800 mt-0.5 line-clamp-2" title={p.phrase}>
                          &ldquo;{p.phrase}&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(p.phrase, p.id)}
                        className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                        title="Copy phrase"
                      >
                        {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleApplyToZone(p.phrase, "Callout Phrase")}
                        className="px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-semibold border border-amber-200/80 transition-all flex items-center gap-1"
                        title="Apply to selected zone"
                      >
                        <ArrowRightLeft className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── TAB: ALL or MEDIA & IMAGES ── */}
        {(activeTab === "all" || activeTab === "media") && (
          <section className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Media & Visual Assets</span>
            </div>

            {/* Live Search Unsplash */}
            <form onSubmit={handleCustomImageSearch} className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Unsplash (e.g. finance, data, nature)..."
                  value={unsplashQuery}
                  onChange={(e) => setUnsplashQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSearchingImages || !unsplashQuery.trim()}
                className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-1"
              >
                {isSearchingImages ? <RefreshCw className="w-3 h-3 animate-spin" /> : "Search"}
              </button>
            </form>

            {/* General Images Grid */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-gray-600">General Imagery (Unsplash)</div>
              {fetchedImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {fetchedImages.map((img, idx) => (
                    <div
                      key={idx}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, "image", img.url, `Image (${img.query})`)}
                      className="group relative rounded-xl border border-gray-200 overflow-hidden bg-gray-100 hover:border-purple-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-gray-200">
                        <img
                          src={img.url}
                          alt={img.query}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-1.5 bg-white/95 text-[10px] flex items-center justify-between">
                        <span className="truncate max-w-[90px] font-medium text-gray-700 capitalize" title={img.query}>
                          {img.query}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApplyImageToBackground(img.url)}
                            className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold"
                            title="Set as Canvas Background"
                          >
                            Set BG
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : isSearchingImages ? (
                <div className="p-4 text-center text-xs text-gray-400 bg-white rounded-xl border border-gray-100 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-500" />
                  <span>Fetching contextual images...</span>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                  No images fetched yet. Search above to find photography.
                </div>
              )}
            </div>

            {/* Slice / Data Point Images */}
            {sliceImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-gray-600">Data Slice Images & Icons ({sliceImages.length})</span>
                  <span className="text-[10px] text-gray-400">Resolved Flags / Logos</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {sliceImages.map((s, idx) => (
                    <div
                      key={idx}
                      draggable={true}
                      onDragStart={(e) => handleDragStart(e, "image", s.imageUrl || "", `${s.label} Icon`)}
                      className="group bg-white rounded-lg border border-gray-200 p-2 flex items-center gap-2 hover:border-purple-300 hover:shadow-xs transition-all cursor-grab active:cursor-grabbing"
                    >
                      <GripVertical className="w-3 h-3 text-gray-300 group-hover:text-purple-500 shrink-0" />
                      {s.imageUrl ? (
                        <div className="w-6 h-6 rounded overflow-hidden bg-gray-50 border border-gray-200 flex-shrink-0">
                          <img src={s.imageUrl} alt={s.label} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-[10px]">
                          #
                        </div>
                      )}
                      <span className="text-xs font-medium text-gray-800 truncate flex-1" title={s.label}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── TAB: ALL or SOURCES & CITATIONS ── */}
        {(activeTab === "all" || activeTab === "sources") && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800 uppercase tracking-wider">
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sources & Citations</span>
              </div>
            </div>

            <div className="space-y-2">
              {sources.map((src, idx) => (
                <div
                  key={idx}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, "source", src, "Source Citation")}
                  className="group bg-white rounded-xl border border-gray-200/80 p-2.5 hover:border-emerald-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-grab active:cursor-grabbing"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-emerald-500 shrink-0" />
                    <p className="text-xs text-gray-800 font-medium truncate" title={src}>
                      {src}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleCopy(src, `src-${idx}`)}
                      className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title="Copy source citation"
                    >
                      {copiedId === `src-${idx}` ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleApplyToZone(src, "Source")}
                      className="px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-semibold border border-emerald-200/80 transition-all flex items-center gap-1"
                      title="Apply to selected zone"
                    >
                      <ArrowRightLeft className="w-3 h-3" />
                      <span>Apply</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Keywords pill list */}
            {contentPackage?.keywords && contentPackage.keywords.length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Keywords & Visual Tags</span>
                <div className="flex flex-wrap gap-1">
                  {contentPackage.keywords.map((k: string, kIdx: number) => (
                    <span
                      key={kIdx}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-purple-300 cursor-pointer"
                      onClick={() => {
                        setUnsplashQuery(k)
                        setActiveTab("media")
                      }}
                      title="Search photos with this tag"
                    >
                      #{k}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 bg-white text-[11px] text-gray-500 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          <span>Drag card onto canvas or select zone & click <b>Apply</b></span>
        </div>
        <button
          onClick={closeContentBank}
          className="text-xs font-semibold text-gray-600 hover:text-gray-900"
        >
          Done
        </button>
      </div>
    </div>
  )
}
