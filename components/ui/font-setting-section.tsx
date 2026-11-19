"use client"

import React, { useEffect, useRef, useState } from "react"
import { Italic, Underline, Strikethrough } from "lucide-react"
import { cn } from "@/lib/utils"
import { getHexFromColor } from "@/lib/utils/color-utils"
import type { FontTextTransform } from "@/lib/utils/font-decoration"
import { FontFamilySelect, FontWeightSelect } from "@/components/ui/font-family-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export interface FontSettingValue {
  family?: string
  size?: number
  weight?: string | number
  style?: string
  color?: string
  underline?: boolean
  strikethrough?: boolean
  textTransform?: FontTextTransform
  letterSpacing?: number
}

export interface FontSettingPatch {
  family?: string
  size?: number
  weight?: string
  style?: string
  color?: string
  underline?: boolean
  strikethrough?: boolean
  textTransform?: FontTextTransform
  letterSpacing?: number
}

export function mapChartJsFontValue(fontObj: any, color?: string): FontSettingValue {
  if (!fontObj || typeof fontObj !== "object") return { color }
  return {
    family: fontObj.family,
    size: fontObj.size,
    weight: fontObj.weight,
    style: fontObj.style,
    underline: fontObj.underline,
    strikethrough: fontObj.strikethrough,
    textTransform: fontObj.textTransform,
    letterSpacing: fontObj.letterSpacing,
    color,
  }
}

export function applyChartJsFontPatch(
  patch: FontSettingPatch,
  setFontField: (field: "family" | "size" | "weight" | "style" | "underline" | "strikethrough" | "textTransform" | "letterSpacing", value: any) => void,
  setColor?: (color: string) => void
) {
  if (patch.family !== undefined) setFontField("family", patch.family)
  if (patch.size !== undefined) setFontField("size", patch.size)
  if (patch.weight !== undefined) setFontField("weight", patch.weight)
  if (patch.style !== undefined) setFontField("style", patch.style)
  if (patch.underline !== undefined) setFontField("underline", patch.underline)
  if (patch.strikethrough !== undefined) setFontField("strikethrough", patch.strikethrough)
  if (patch.textTransform !== undefined) setFontField("textTransform", patch.textTransform)
  if (patch.letterSpacing !== undefined) setFontField("letterSpacing", patch.letterSpacing)
  if (patch.color !== undefined && setColor) setColor(patch.color)
}

export interface FontSettingSectionProps {
  title?: string
  headerRight?: React.ReactNode
  value: FontSettingValue
  onChange: (patch: FontSettingPatch) => void
  defaultFamily?: string
  defaultSize?: number
  defaultWeight?: string
  defaultColor?: string
  includeDefaultFamily?: boolean
  fontFamilyOutputFormat?: "css" | "id" | "name"
  weightOutputFormat?: "numeric" | "named"
  sizeMin?: number
  sizeMax?: number
  showFamily?: boolean
  showSize?: boolean
  showWeight?: boolean
  showStyle?: boolean
  showDecoration?: boolean
  showTextCase?: boolean
  showLetterSpacing?: boolean
  showColor?: boolean
  disabled?: boolean
  className?: string
  idPrefix?: string
}

function LetterSpacingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 4v16" />
      <path d="M19 4v16" />
      <path d="M9.5 14l2.5-7 2.5 7" />
      <path d="M10.2 12h3.6" />
      <path d="M8 18h8" />
    </svg>
  )
}

const TEXT_CASE_LABELS: Record<FontTextTransform, string> = {
  none: "Aa",
  uppercase: "AA",
  lowercase: "aa",
  capitalize: "Ab",
}

function normalizeHexForPicker(raw?: string, fallback: string = "#000000"): string {
  if (!raw) return fallback
  const hexCandidate = getHexFromColor(raw.trim())
  if (/^#[0-9a-f]{6}$/i.test(hexCandidate)) return hexCandidate
  const shortMatch = hexCandidate.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i)
  if (shortMatch) {
    return `#${shortMatch[1]}${shortMatch[1]}${shortMatch[2]}${shortMatch[2]}${shortMatch[3]}${shortMatch[3]}`
  }
  return fallback
}

export function FontSettingSection({
  title = "Font Setting",
  headerRight,
  value,
  onChange,
  defaultFamily = "Arial",
  defaultSize = 14,
  defaultWeight = "400",
  defaultColor = "#000000",
  includeDefaultFamily = false,
  fontFamilyOutputFormat = "css",
  weightOutputFormat = "numeric",
  sizeMin = 6,
  sizeMax = 120,
  showFamily = true,
  showSize = true,
  showWeight = true,
  showStyle = true,
  showDecoration = true,
  showTextCase = true,
  showLetterSpacing = true,
  showColor = true,
  disabled = false,
  className,
  idPrefix,
}: FontSettingSectionProps) {
  const effectiveSize = value.size ?? defaultSize
  const effectiveColor = value.color || defaultColor
  const effectiveFamily = value.family || (includeDefaultFamily ? "default" : defaultFamily)
  const effectiveWeight = value.weight ?? defaultWeight
  const isItalic = value.style === "italic" || value.style === "oblique"
  const isUnderline = Boolean(value.underline)
  const isStrikethrough = Boolean(value.strikethrough)
  const effectiveCase: FontTextTransform = value.textTransform || "none"
  const effectiveLetterSpacing = typeof value.letterSpacing === "number" ? value.letterSpacing : 0

  const [sizeDraft, setSizeDraft] = useState<string>(String(effectiveSize))
  const [letterSpacingOpen, setLetterSpacingOpen] = useState<boolean>(false)
  const [letterSpacingDraft, setLetterSpacingDraft] = useState<string>(String(effectiveLetterSpacing))
  const letterSpacingInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSizeDraft(String(effectiveSize))
  }, [effectiveSize])

  useEffect(() => {
    setLetterSpacingDraft(String(effectiveLetterSpacing))
  }, [effectiveLetterSpacing])

  const handleLetterSpacingInput = (raw: string) => {
    setLetterSpacingDraft(raw)
    if (raw === "" || raw === "-") return
    const parsed = Number(raw)
    if (!isNaN(parsed)) {
      onChange({ letterSpacing: Math.min(30, Math.max(-5, parsed)) })
    }
  }

  const handleLetterSpacingBlur = () => {
    const parsed = Number(letterSpacingDraft)
    if (letterSpacingDraft === "" || letterSpacingDraft === "-" || isNaN(parsed)) {
      setLetterSpacingDraft("0")
      if (value.letterSpacing !== 0 && value.letterSpacing !== undefined) {
        onChange({ letterSpacing: 0 })
      }
      return
    }
    const clamped = Math.min(30, Math.max(-5, parsed))
    setLetterSpacingDraft(String(clamped))
    if (clamped !== parsed) onChange({ letterSpacing: clamped })
  }

  const handleSizeInput = (raw: string) => {
    setSizeDraft(raw)
    if (raw === "") return
    const parsed = Number(raw)
    if (!isNaN(parsed) && parsed > 0) {
      onChange({ size: Math.min(sizeMax, Math.max(sizeMin, parsed)) })
    }
  }

  const handleSizeBlur = () => {
    const parsed = Number(sizeDraft)
    if (sizeDraft === "" || isNaN(parsed) || parsed < sizeMin) {
      const clamped = Math.max(sizeMin, Math.min(sizeMax, defaultSize))
      setSizeDraft(String(clamped))
      if (value.size !== clamped) onChange({ size: clamped })
    } else {
      const clamped = Math.min(sizeMax, Math.max(sizeMin, parsed))
      setSizeDraft(String(clamped))
      if (clamped !== parsed) onChange({ size: clamped })
    }
  }

  const pickerHex = normalizeHexForPicker(effectiveColor, normalizeHexForPicker(defaultColor))
  const hasToolbarControls = showStyle || showDecoration || showTextCase

  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-2.5 space-y-2 min-w-0",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2 min-w-0">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider truncate">
          {title}
        </span>
        {headerRight}
      </div>

      {/* Row 1: Color Box + Font Family + Size */}
      {(showColor || showFamily || showSize) && (
        <div className="flex items-center gap-1.5 min-w-0">
          {showColor && (
            <label
              title={`Text Color (${effectiveColor})`}
              className="relative h-8 w-8 shrink-0 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1 flex items-center justify-center cursor-pointer hover:border-slate-300 dark:hover:border-slate-700"
            >
              <span
                className="w-full h-full rounded-[4px] border border-black/10"
                style={{ backgroundColor: effectiveColor }}
              />
              <input
                id={idPrefix ? `${idPrefix}-font-color` : undefined}
                type="color"
                value={pickerHex}
                disabled={disabled}
                aria-label="Text Color"
                onChange={(e) => onChange({ color: e.target.value })}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
          )}

          {showFamily && (
            <FontFamilySelect
              id={idPrefix ? `${idPrefix}-font-family` : undefined}
              value={effectiveFamily}
              onValueChange={(family) => onChange({ family })}
              includeDefault={includeDefaultFamily}
              outputFormat={fontFamilyOutputFormat}
              disabled={disabled}
              className="flex-1 min-w-0"
              triggerClassName="h-8 text-xs shadow-none"
            />
          )}

          {showSize && (
            <div className="w-[70px] shrink-0 h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pl-2 pr-1.5 flex items-center gap-1 focus-within:border-blue-400">
              <input
                id={idPrefix ? `${idPrefix}-font-size` : undefined}
                type="number"
                value={sizeDraft}
                min={sizeMin}
                max={sizeMax}
                disabled={disabled}
                aria-label="Font size in pixels"
                title="Font Size (px)"
                onChange={(e) => handleSizeInput(e.target.value)}
                onBlur={handleSizeBlur}
                className="w-full min-w-0 bg-transparent text-xs text-center font-medium text-slate-800 dark:text-slate-200 outline-none [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
              />
              <span className="text-[10px] text-slate-400 select-none shrink-0">px</span>
            </div>
          )}
        </div>
      )}

      {/* Row 2: Weight + Style Strip (I / U / S / Aa) + Letter Spacing */}
      {(showWeight || hasToolbarControls || showLetterSpacing) && (
        <div className="flex items-center gap-1.5 min-w-0">
          {showWeight && (
            <FontWeightSelect
              id={idPrefix ? `${idPrefix}-font-weight` : undefined}
              value={effectiveWeight}
              onValueChange={(weight) => onChange({ weight })}
              outputFormat={weightOutputFormat}
              iconOnly
              disabled={disabled}
              className="shrink-0"
              triggerClassName="h-8 px-1.5 gap-0.5 shadow-none dark:bg-slate-900 dark:border-slate-800 [&>svg:last-child]:h-3 [&>svg:last-child]:w-3"
            />
          )}

          {hasToolbarControls && (
            <div
              className="flex flex-1 items-center h-8 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0.5 gap-0.5 min-w-0"
              role="group"
              aria-label="Font style and casing"
            >
              {showStyle && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ style: isItalic ? "normal" : "italic" })}
                  aria-pressed={isItalic}
                  title="Italic"
                  className={cn(
                    "flex-1 min-w-[20px] h-6 rounded flex items-center justify-center cursor-pointer text-xs select-none",
                    isItalic
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  )}
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
              )}

              {showDecoration && (
                <>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ underline: !isUnderline })}
                    aria-pressed={isUnderline}
                    title="Underline"
                    className={cn(
                      "flex-1 min-w-[20px] h-6 rounded flex items-center justify-center cursor-pointer text-xs select-none",
                      isUnderline
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange({ strikethrough: !isStrikethrough })}
                    aria-pressed={isStrikethrough}
                    title="Strikethrough"
                    className={cn(
                      "flex-1 min-w-[20px] h-6 rounded flex items-center justify-center cursor-pointer text-xs select-none",
                      isStrikethrough
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {showTextCase && (
                <>
                  {(showStyle || showDecoration) && (
                    <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5 shrink-0" />
                  )}
                  <Select
                    value={effectiveCase}
                    onValueChange={(val) => onChange({ textTransform: val as FontTextTransform })}
                    disabled={disabled}
                  >
                    <SelectTrigger
                      id={idPrefix ? `${idPrefix}-text-case` : undefined}
                      title="Text Case"
                      aria-label="Text Case"
                      className={cn(
                        "flex-1 h-6 w-auto min-w-[36px] border-0 shadow-none bg-transparent px-1 text-[11px] font-semibold justify-center gap-0.5 rounded focus:ring-0 [&>svg:last-child]:h-3 [&>svg:last-child]:w-3",
                        effectiveCase !== "none"
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      <SelectValue>{TEXT_CASE_LABELS[effectiveCase]}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="z-[120] min-w-[130px]">
                      <SelectItem value="none" className="text-xs cursor-pointer">
                        Aa — Normal
                      </SelectItem>
                      <SelectItem value="uppercase" className="text-xs cursor-pointer">
                        AA — UPPERCASE
                      </SelectItem>
                      <SelectItem value="lowercase" className="text-xs cursor-pointer">
                        aa — lowercase
                      </SelectItem>
                      <SelectItem value="capitalize" className="text-xs cursor-pointer">
                        Ab — Title Case
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}
            </div>
          )}

          {showLetterSpacing && (
            <Popover open={letterSpacingOpen} onOpenChange={setLetterSpacingOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={letterSpacingOpen || effectiveLetterSpacing !== 0}
                  aria-expanded={letterSpacingOpen}
                  aria-label="Letter Spacing"
                  title={
                    effectiveLetterSpacing !== 0
                      ? `Letter Spacing (${effectiveLetterSpacing}px)`
                      : "Letter Spacing"
                  }
                  className={cn(
                    "h-8 w-8 rounded-lg border flex items-center justify-center cursor-pointer text-xs select-none shrink-0",
                    letterSpacingOpen || effectiveLetterSpacing !== 0
                      ? "border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <LetterSpacingIcon className="w-3.5 h-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent
                side="top"
                align="center"
                sideOffset={6}
                onOpenAutoFocus={(e) => {
                  e.preventDefault()
                  letterSpacingInputRef.current?.focus()
                }}
                className="w-auto p-1.5 z-[120] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm animate-none"
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 pl-1 select-none whitespace-nowrap">
                    Letter Spacing
                  </span>
                  <div className="inline-flex items-center h-7 w-[64px] rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800 px-1.5 gap-0.5 focus-within:border-blue-400">
                    <input
                      ref={letterSpacingInputRef}
                      id={idPrefix ? `${idPrefix}-letter-spacing` : undefined}
                      type="number"
                      value={letterSpacingDraft}
                      min={-5}
                      max={30}
                      step={0.5}
                      disabled={disabled}
                      aria-label="Letter spacing in pixels"
                      onChange={(e) => handleLetterSpacingInput(e.target.value)}
                      onBlur={handleLetterSpacingBlur}
                      className="w-full min-w-0 bg-transparent text-xs text-center font-medium text-slate-800 dark:text-slate-200 outline-none [&::-webkit-inner-spin-button]:opacity-100 [&::-webkit-outer-spin-button]:opacity-100"
                    />
                    <span className="text-[10px] text-slate-400 select-none shrink-0">px</span>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      )}
    </div>
  )
}
