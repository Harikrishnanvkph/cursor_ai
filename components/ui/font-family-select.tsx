"use client"

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  UNIFIED_FONT_FAMILIES,
  FONT_WEIGHT_OPTIONS,
  FontFamilyOption,
  FontWeightOption,
  findFontByInput,
  ensureGoogleFontLoaded,
  registerDynamicFont,
  normalizeFontWeight,
} from '@/lib/typography-registry'
import { cn } from '@/lib/utils'
import { Search, X, Check, Type, ChevronDown, Globe, Loader2 } from 'lucide-react'

// Curated font options from universal typography registry (excluding 'default')
const FONT_OPTIONS = UNIFIED_FONT_FAMILIES.filter(f => f.value !== 'default')

export const FONT_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sans-serif', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Script' },
  { id: 'monospace', label: 'Mono' },
] as const

// ═════════════════════════════════════════════════════════════
// 1. Centered Modal Font Family Selector Component
// ═════════════════════════════════════════════════════════════

export interface FontFamilyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: string
  onSelectFont: (fontValue: string, font?: FontFamilyOption) => void
  includeDefault?: boolean
}

export function FontFamilyModal({
  open,
  onOpenChange,
  value,
  onSelectFont,
  includeDefault = false,
}: FontFamilyModalProps) {
  const matchedFont = useMemo(() => findFontByInput(value), [value])
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [visibleCount, setVisibleCount] = useState(35)
  const [apiFonts, setApiFonts] = useState<FontFamilyOption[]>([])
  const [isSearchingApi, setIsSearchingApi] = useState(false)

  // Auto-focus search input when opening & reset state on close
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    } else {
      setSearch('')
      setSelectedCategory('all')
      setVisibleCount(35)
      setApiFonts([])
      setIsSearchingApi(false)
    }
  }, [open])

  // Filter local curated fonts based on category and search query
  const filteredFonts = useMemo(() => {
    const q = search.toLowerCase().trim()
    return FONT_OPTIONS.filter(f => {
      const matchCat = selectedCategory === 'all' || f.category === selectedCategory
      const matchSearch =
        !q ||
        f.label.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q) ||
        f.value.toLowerCase().includes(q) ||
        f.aliases?.some(a => a.toLowerCase().includes(q)) ||
        f.googleFontName?.toLowerCase().includes(q)
      return matchCat && matchSearch
    })
  }, [search, selectedCategory])

  const visibleFonts = useMemo(() => {
    return filteredFonts.slice(0, visibleCount)
  }, [filteredFonts, visibleCount])

  // Preload top visible Google fonts on render/scroll
  useEffect(() => {
    if (!open) return
    visibleFonts.slice(0, 15).forEach(f => {
      if (f.isGoogleFont) {
        ensureGoogleFontLoaded(f.value)
      }
    })
  }, [open, visibleFonts])

  // Query Google Fonts Search API when searching online catalog
  useEffect(() => {
    const trimmed = search.trim()
    if (trimmed.length < 2) {
      setApiFonts([])
      setIsSearchingApi(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearchingApi(true)
      try {
        const catParam = selectedCategory !== 'all' ? `&category=${selectedCategory}` : ''
        const res = await fetch(`/api/fonts/search?q=${encodeURIComponent(trimmed)}${catParam}&limit=20`)
        if (res.ok) {
          const data = await res.json()
          const remoteList: FontFamilyOption[] = data.fonts || []
          // Exclude any fonts already in the local curated list
          const localIds = new Set(FONT_OPTIONS.map(f => f.id))
          const freshRemote = remoteList.filter(f => !localIds.has(f.id))
          setApiFonts(freshRemote)
        }
      } catch (err) {
        console.warn('Google Fonts API search error:', err)
      } finally {
        setIsSearchingApi(false)
      }
    }, 200)

    return () => clearTimeout(timer)
  }, [search, selectedCategory])

  const handleSelect = useCallback((font: FontFamilyOption) => {
    registerDynamicFont(font)
    ensureGoogleFontLoaded(font.value)
    onSelectFont(font.value, font)
    onOpenChange(false)
  }, [onSelectFont, onOpenChange])

  const handleSelectDefault = useCallback(() => {
    const defaultOption = UNIFIED_FONT_FAMILIES.find(f => f.id === 'default')
    onSelectFont('default', defaultOption)
    onOpenChange(false)
  }, [onSelectFont, onOpenChange])

  const handleLoadCustomFont = useCallback((customName: string) => {
    const trimmed = customName.trim()
    if (!trimmed) return
    const customFont: FontFamilyOption = {
      id: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      label: trimmed,
      value: `'${trimmed}', sans-serif`,
      category: 'sans-serif',
      isGoogleFont: true,
      googleFontName: trimmed,
      weights: [400, 700],
    }
    handleSelect(customFont)
  }, [handleSelect])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        forceBodyPortal={true}
        disableAnimation={true}
        hideCloseButton={true}
        overlayClassName="fixed inset-0 z-[190] bg-black/40"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[200] w-[94vw] max-w-[420px] max-h-[85vh] p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col gap-2.5 overflow-hidden text-slate-900 dark:text-slate-100"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Select Font Family</DialogTitle>
        </DialogHeader>

        {/* Top Header & Search Bar */}
        <div className="space-y-2 shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-blue-600" />
              Font Family
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={e => {
                const val = e.target.value
                setSearch(val)
                if (val.trim() && selectedCategory !== 'all') {
                  setSelectedCategory('all')
                }
                setVisibleCount(35)
              }}
              placeholder="Search all Google fonts (e.g. Times, Inter, Orbitron)..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 text-slate-900 dark:text-slate-100 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  searchInputRef.current?.focus()
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-700 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
            {FONT_CATEGORIES.map(cat => {
              const isCatActive = selectedCategory === cat.id
              const count = cat.id === 'all'
                ? FONT_OPTIONS.length
                : FONT_OPTIONS.filter(f => f.category === cat.id).length
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat.id)
                    setVisibleCount(35)
                  }}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                    isCatActive
                      ? 'bg-blue-600 text-white shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {cat.label} ({count})
                </button>
              )
            })}
          </div>
        </div>

        {/* Scrollable Font List */}
        <div className="flex-1 min-h-0 overflow-y-auto max-h-[350px] pr-1 space-y-0.5 divide-y divide-slate-100 dark:divide-slate-800/60 overscroll-contain select-none">
          {/* Optional Default / Inherit Option */}
          {includeDefault && !search && selectedCategory === 'all' && (
            <button
              type="button"
              onClick={handleSelectDefault}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
                value === 'default' || !value
                  ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-medium leading-snug">Default / Inherit</span>
                <span className="text-[9px] text-slate-400 font-sans uppercase tracking-wider font-normal mt-0.5">SYSTEM</span>
              </div>
              {(value === 'default' || !value) && (
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
              )}
            </button>
          )}

          {/* Curated Local Fonts */}
          {visibleFonts.map(f => {
            const isSelected = matchedFont?.id === f.id || value === f.value || value === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelect(f)}
                onMouseEnter={() => {
                  if (f.isGoogleFont) ensureGoogleFontLoaded(f.value)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
                  isSelected
                    ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span
                    className="text-sm truncate leading-snug"
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans uppercase tracking-wider font-normal mt-0.5">
                    {f.category}
                  </span>
                </div>
                {isSelected && (
                  <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
                )}
              </button>
            )
          })}

          {/* Show More Button */}
          {visibleCount < filteredFonts.length && (
            <div className="pt-2 pb-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40 h-8 cursor-pointer"
                onClick={() => setVisibleCount(c => c + 35)}
              >
                Show More ({filteredFonts.length - visibleCount} remaining)
              </Button>
            </div>
          )}

          {/* Searching Google Fonts Catalog Indicator */}
          {isSearchingApi && (
            <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span>Searching Google Fonts catalog...</span>
            </div>
          )}

          {/* Online Google Fonts Results */}
          {apiFonts.length > 0 && (
            <div className="pt-2">
              <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-500" />
                <span>Google Fonts Catalog ({apiFonts.length} online matches)</span>
              </div>
              {apiFonts.map(f => {
                const isSelected = matchedFont?.id === f.id || value === f.value
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => handleSelect(f)}
                    onMouseEnter={() => ensureGoogleFontLoaded(f.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span
                        className="text-sm truncate leading-snug"
                        style={{ fontFamily: f.value }}
                      >
                        {f.label}
                      </span>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-sans mt-0.5">
                        <span className="uppercase tracking-wider font-normal">{f.category}</span>
                        <span>•</span>
                        <span className="text-blue-500 font-medium">Google Font</span>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1.5" />
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Fallback Load Button */}
          {visibleFonts.length === 0 && apiFonts.length === 0 && !isSearchingApi && search.trim() && (
            <div className="py-6 text-center space-y-2.5">
              <p className="text-xs text-slate-400">
                No matching font found in curated library.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950/40 h-8 cursor-pointer"
                onClick={() => handleLoadCustomFont(search)}
              >
                Load "{search.trim()}" from Google Fonts
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ═════════════════════════════════════════════════════════════
// 2. Dropdown Replacement Button: FontFamilySelect
// ═════════════════════════════════════════════════════════════

export interface FontFamilySelectProps {
  value?: string
  onValueChange: (value: string, font?: FontFamilyOption) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
  includeDefault?: boolean
  outputFormat?: 'css' | 'id' | 'name' // 'css' = font.value, 'id' = font.id, 'name' = font.label
  disabled?: boolean
  id?: string
}

export function FontFamilySelect({
  value,
  onValueChange,
  placeholder = 'Select Font',
  className,
  triggerClassName,
  includeDefault = false,
  outputFormat = 'css',
  disabled = false,
  id,
}: FontFamilySelectProps) {
  const [open, setOpen] = useState(false)
  const matchedFont = useMemo(() => findFontByInput(value), [value])

  // Automatically preload current Google Font when mounted or changed
  useEffect(() => {
    if (matchedFont?.isGoogleFont) {
      ensureGoogleFontLoaded(matchedFont.value)
    } else if (value && value !== 'default') {
      ensureGoogleFontLoaded(value)
    }
  }, [matchedFont, value])

  const displayLabel = useMemo(() => {
    if (matchedFont) return matchedFont.label
    if (!value || value === 'default') return placeholder
    return value.split(',')[0].replace(/['"]/g, '').trim() || placeholder
  }, [matchedFont, value, placeholder])

  const handleSelectFont = (fontValue: string, font?: FontFamilyOption) => {
    let outVal = fontValue
    if (font) {
      if (outputFormat === 'id') outVal = font.id
      else if (outputFormat === 'name') outVal = font.label
    }
    onValueChange(outVal, font)
  }

  return (
    <div className={cn('relative w-full', className)}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "h-8 w-full px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg flex items-center justify-between shadow-2xs hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors text-slate-800 dark:text-slate-200 group text-left cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none",
          triggerClassName
        )}
        title={`Font: ${displayLabel}`}
      >
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <Type className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
          <span
            className="truncate font-medium text-slate-800 dark:text-slate-200"
            style={{ fontFamily: matchedFont?.value }}
          >
            {displayLabel}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0 ml-1" />
      </button>

      <FontFamilyModal
        open={open}
        onOpenChange={setOpen}
        value={value}
        onSelectFont={handleSelectFont}
        includeDefault={includeDefault}
      />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════
// 3. Unified Font Weight Select Component (Preserved as is)
// ═════════════════════════════════════════════════════════════

export interface FontWeightSelectProps {
  value?: string | number
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
  outputFormat?: 'numeric' | 'named' // 'numeric' = '400', '700'; 'named' = 'normal', 'bold'
  disabled?: boolean
  id?: string
}

export function FontWeightSelect({
  value,
  onValueChange,
  placeholder = 'Regular (400)',
  className,
  triggerClassName,
  outputFormat = 'numeric',
  disabled = false,
  id,
}: FontWeightSelectProps) {
  const activeNumericStr = normalizeFontWeight(value)
  const activeOption = FONT_WEIGHT_OPTIONS.find(opt => opt.value === activeNumericStr)
  const displayLabel = activeOption ? activeOption.label.replace(/\s*\(\d+\)/, '') : undefined

  const handleSelect = (numericValue: string) => {
    if (outputFormat === 'named') {
      const num = parseInt(numericValue, 10)
      if (num >= 700) onValueChange('bold')
      else if (num <= 300) onValueChange('lighter')
      else onValueChange('normal')
      return
    }
    onValueChange(numericValue)
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Select value={activeNumericStr} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={cn('h-8 text-xs bg-white px-2.5', triggerClassName)}
        >
          <SelectValue placeholder={placeholder}>
            {displayLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-60 z-[120]">
          {FONT_WEIGHT_OPTIONS.map(opt => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              className="text-xs cursor-pointer"
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
