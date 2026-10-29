"use client"

import React, { useEffect, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UNIFIED_FONT_FAMILIES,
  FONT_WEIGHT_OPTIONS,
  FontFamilyOption,
  FontWeightOption,
  findFontByInput,
  ensureGoogleFontLoaded,
  normalizeFontWeight,
} from '@/lib/typography-registry'
import { cn } from '@/lib/utils'

export interface FontFamilySelectProps {
  value?: string
  onValueChange: (value: string, font?: FontFamilyOption) => void
  placeholder?: string
  className?: string
  triggerClassName?: string
  includeDefault?: boolean
  outputFormat?: 'css' | 'id' | 'name' // 'css' = font.value (e.g. "'Inter', sans-serif"), 'id' = font.id, 'name' = font.label
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
  // Find current matched font option using robust fuzzy/alias/value resolution
  const matchedFont = useMemo(() => findFontByInput(value), [value])

  // Automatically preload current Google Font when mounted or changed
  useEffect(() => {
    if (matchedFont?.isGoogleFont) {
      ensureGoogleFontLoaded(matchedFont.value)
    } else if (value) {
      ensureGoogleFontLoaded(value)
    }
  }, [matchedFont, value])

  // Group fonts into clean categories
  const categories = useMemo(() => {
    const list = includeDefault
      ? UNIFIED_FONT_FAMILIES
      : UNIFIED_FONT_FAMILIES.filter(f => f.id !== 'default')

    const sans = list.filter(f => f.category === 'sans-serif' && f.id !== 'default')
    const serif = list.filter(f => f.category === 'serif')
    const display = list.filter(f => f.category === 'display')
    const mono = list.filter(f => f.category === 'monospace')
    const defaultOption = list.find(f => f.id === 'default')

    return {
      defaultOption,
      groups: [
        { label: 'Sans-Serif', fonts: sans },
        { label: 'Serif', fonts: serif },
        { label: 'Display & Condensed', fonts: display },
        { label: 'Monospace', fonts: mono },
      ].filter(g => g.fonts.length > 0),
    }
  }, [includeDefault])

  // The active select item value: use font.id for clean, exact Radix UI key matching
  const activeId = matchedFont ? matchedFont.id : (includeDefault ? 'default' : 'arial')

  const handleSelect = (selectedId: string) => {
    const font = UNIFIED_FONT_FAMILIES.find(f => f.id === selectedId)
    if (!font) return

    // Immediately trigger dynamic font download if it's a Google Font
    if (font.isGoogleFont) {
      ensureGoogleFontLoaded(font.value)
    }

    let outVal = font.value
    if (outputFormat === 'id') outVal = font.id
    else if (outputFormat === 'name') outVal = font.label

    onValueChange(outVal, font)
  }

  return (
    <div className={cn('relative w-full', className)}>
      <Select value={activeId} onValueChange={handleSelect} disabled={disabled}>
        <SelectTrigger
          id={id}
          className={cn('h-8 text-xs bg-white', triggerClassName)}
          style={{ fontFamily: matchedFont ? matchedFont.value : undefined }}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-72 w-56 z-[120]">
          {categories.defaultOption && (
            <>
              <SelectItem value="default" className="text-xs font-medium cursor-pointer">
                {categories.defaultOption.label}
              </SelectItem>
              <SelectSeparator className="my-1" />
            </>
          )}

          {categories.groups.map((group, groupIdx) => (
            <React.Fragment key={group.label}>
              {groupIdx > 0 && <SelectSeparator className="my-1" />}
              <SelectGroup>
                <SelectLabel className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2 py-1 select-none">
                  {group.label}
                </SelectLabel>
                {group.fonts.map(f => (
                  <SelectItem
                    key={f.id}
                    value={f.id}
                    className="text-xs cursor-pointer py-1.5"
                    style={{ fontFamily: f.value }}
                  >
                    {f.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// ── Standard Unified Font Weight Select Component ─────────────

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
  // Normalize whatever weight input was passed (e.g. 'normal', 'bold', 600, '700') to canonical numeric string
  const activeNumericStr = normalizeFontWeight(value)

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
          className={cn('h-8 text-xs bg-white', triggerClassName)}
        >
          <SelectValue placeholder={placeholder} />
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
