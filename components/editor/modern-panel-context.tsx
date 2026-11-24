"use client"

import React, { createContext, useContext } from "react"

const ModernPanelContext = createContext(false)

/**
 * Marks a sidebar subtree as using the uniform Modern tools panel UI.
 * Default interface never mounts this provider, guaranteeing 100% visual isolation.
 */
export function ModernPanelProvider({
  children,
  enabled = true,
}: {
  children: React.ReactNode
  enabled?: boolean
}) {
  return (
    <ModernPanelContext.Provider value={enabled}>
      {children}
    </ModernPanelContext.Provider>
  )
}

export function useIsModernPanel(): boolean {
  return useContext(ModernPanelContext)
}

/**
 * Shared lightweight Tailwind utility tokens for uniform Modern sidebar chrome.
 * Pure static strings — zero runtime overhead, zero heavy visual effects.
 */
export const MODERN_PANEL_UI = {
  // Primary segmented control (top-level sub-tabs inside a panel)
  segTrack:
    "p-[3px] bg-slate-100/90 rounded-lg border border-slate-200/70",
  segItemBase:
    "text-xs py-1.5 px-2 rounded-[6px] transition-colors cursor-pointer font-medium text-slate-600 hover:text-slate-900",
  segItemActive:
    "bg-white text-slate-900 font-semibold shadow-sm",
  segTriggerRadix:
    "text-xs py-1.5 px-2 rounded-[6px] transition-colors cursor-pointer font-medium text-slate-600 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:font-semibold data-[state=active]:shadow-sm",

  // Secondary nested segmented control (e.g. Dataset -> General/Colors/Images, Axis -> General/Ticks/More)
  subSegTrack:
    "p-[3px] bg-slate-100/70 rounded-lg border border-slate-200/60",
  subSegItemBase:
    "text-[11px] py-1 px-2 rounded-[6px] transition-colors cursor-pointer font-medium text-slate-500 hover:text-slate-800",
  subSegItemActive:
    "bg-white text-indigo-700 font-semibold shadow-sm",

  // Icon + label segmented tab bar (Style & Graphics top bars)
  iconTabTrack:
    "p-[3px] bg-slate-100/90 rounded-lg border border-slate-200/70",
  iconTabItemBase:
    "flex-1 py-1.5 px-1 flex flex-col items-center justify-center gap-0.5 rounded-[6px] transition-colors cursor-pointer text-slate-500 hover:text-slate-900 font-medium",
  iconTabItemActive:
    "bg-white text-indigo-700 font-semibold shadow-sm",

  // Uniform accordion / section card
  card:
    "rounded-xl border border-slate-200/80 bg-white overflow-hidden",
  cardHeader:
    "w-full flex items-center gap-2 px-3 py-2.5 text-left cursor-pointer hover:bg-slate-50/80 transition-colors select-none",
  cardHeaderOpen:
    "bg-slate-50/60 border-b border-slate-100",
  cardTitle:
    "text-xs font-semibold text-slate-800",
  cardBody:
    "p-3 space-y-3 bg-white",
  cardBodyMuted:
    "p-3 space-y-2.5 bg-slate-50/40",

  // Section banner card (Title / Subtitle / Legend / Background / Axis Show toggle)
  sectionHeaderRow:
    "flex items-center justify-between gap-2 px-3 py-2.5 bg-slate-50/80 border-b border-slate-100",
  sectionBanner:
    "flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-50/80 border border-slate-200/80",
} as const
