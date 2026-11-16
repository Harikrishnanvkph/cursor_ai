"use client"

import React, { useEffect } from "react"
import { GeistSans } from "geist/font/sans"
import {
  BarChart2,
  BarChart3,
  Clock,
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export interface TypeDistributionItem {
  type: string
  displayName: string
  count: number
  percentage: number
  color: string
}

interface AnalyticsSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  totalCharts: number
  activeTab: "single" | "group" | "templates"
  quickStats: {
    total: number
    thisWeek: number
    avgPerWeek: number
  }
  typeDistribution: TypeDistributionItem[]
  filterType: string
  onSelectFilterType: (type: string) => void
}

export const AnalyticsSidebar = React.memo(function AnalyticsSidebar({
  open,
  onOpenChange,
  totalCharts,
  activeTab,
  quickStats,
  typeDistribution,
  filterType,
  onSelectFilterType,
}: AnalyticsSidebarProps) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onOpenChange])

  const activeCategoryLabel =
    activeTab === "templates"
      ? "Templates"
      : activeTab === "group"
      ? "Grouped Charts"
      : "Single Charts"

  const itemNoun = activeTab === "templates" ? "templates" : "charts"

  return (
    <div
      aria-hidden={!open}
      className={`fixed inset-0 z-[60] ${
        open ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      {/* Lightweight backdrop */}
      <div
        onClick={() => onOpenChange(false)}
        className={`absolute inset-0 bg-slate-950/30 dark:bg-black/55 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        aria-hidden="true"
      />

      {/* GPU-accelerated Floating Sidebar */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Board Analytics"
        style={{ contain: "layout paint" }}
        className={`fixed inset-y-0 right-0 h-[100dvh] w-[92vw] max-w-[390px] sm:inset-y-3 sm:right-3 sm:h-[calc(100dvh-1.5rem)] sm:w-[400px] sm:max-w-[calc(100vw-1.5rem)] sm:rounded-2xl bg-white dark:bg-slate-900 border-l sm:border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden transform-gpu transition-transform duration-100 ease-out ${GeistSans.variable} ${GeistSans.className} font-sans ${
          open ? "translate-x-0" : "translate-x-[calc(100%+1.5rem)]"
        }`}
      >
        {/* Floating Sidebar Header */}
        <div className="px-4 py-3.5 sm:px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-violet-500/20 shrink-0">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight truncate">
                Board Analytics
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Workspace summary &amp; distribution
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            tabIndex={open ? 0 : -1}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Close Analytics"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 space-y-4">
          {/* Total Charts Summary Card */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-50/90 via-white to-violet-50/40 dark:from-slate-800/50 dark:via-slate-900 dark:to-violet-950/25 shadow-xs rounded-xl overflow-hidden">
            <CardContent className="p-3.5 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Total Charts
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 leading-none tracking-tight tabular-nums">
                        {totalCharts}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                        saved in workspace
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 shrink-0">
                  All Categories
                </span>
              </div>
            </CardContent>
          </Card>

          {/* About Active Category Stats */}
          <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-xl">
            <CardHeader className="py-2.5 px-3.5 sm:px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <LayoutDashboard className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                About {activeCategoryLabel}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-3.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <BarChart2 className="h-3 w-3 text-violet-500 dark:text-violet-400 shrink-0" />
                    <span className="truncate">Created</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none tabular-nums">
                    {quickStats.total}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                    {itemNoun}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">This Week</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none tabular-nums">
                    {quickStats.thisWeek}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                    active
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50/90 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <Clock className="h-3 w-3 text-indigo-500 dark:text-indigo-400 shrink-0" />
                    <span className="truncate">Weekly Avg</span>
                  </div>
                  <div className="text-base font-bold text-slate-900 dark:text-slate-100 leading-none tabular-nums">
                    {quickStats.avgPerWeek}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                    per week
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chart Types Distribution Panel */}
          {typeDistribution.length > 0 && (
            <Card className="border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs rounded-xl">
              <CardHeader className="py-2.5 px-3.5 sm:px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0 gap-2">
                <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                  {activeTab === "templates" ? "Template Chart Types" : "Chart Types"}
                </CardTitle>
                <div className="flex items-center gap-2 shrink-0">
                  {filterType !== "all" && (
                    <button
                      type="button"
                      tabIndex={open ? 0 : -1}
                      onClick={() => onSelectFilterType("all")}
                      className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {typeDistribution.length} {typeDistribution.length === 1 ? "type" : "types"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-3.5 sm:p-4">
                {/* Multi-color distribution bar */}
                <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-3.5 border border-slate-200/80 dark:border-slate-700">
                  {typeDistribution.map((item) => (
                    <div
                      key={item.type}
                      className={item.color}
                      style={{ width: `${Math.max(item.percentage, 2)}%` }}
                      title={`${item.displayName}: ${item.count} (${item.percentage}%)`}
                    />
                  ))}
                </div>

                {/* Interactive Chart Type Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  {typeDistribution.map((item) => {
                    const isSelected = filterType === item.type
                    return (
                      <button
                        key={item.type}
                        type="button"
                        tabIndex={open ? 0 : -1}
                        onClick={() => {
                          onSelectFilterType(isSelected ? "all" : item.type)
                          if (typeof window !== "undefined" && window.innerWidth < 640) {
                            onOpenChange(false)
                          }
                        }}
                        className={`flex items-center gap-1.5 text-xs py-1.5 px-2 rounded-lg transition-colors text-left cursor-pointer border min-w-0 ${
                          isSelected
                            ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300 font-semibold"
                            : "bg-slate-50/60 dark:bg-slate-800/40 border-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700"
                        }`}
                        title={`Click to filter by ${item.displayName}`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${item.color} shrink-0`} />
                        <span className="font-medium truncate flex-1 text-[11px] sm:text-xs">
                          {item.displayName}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0 tabular-nums font-medium">
                          {item.count} · {item.percentage}%
                        </span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Help Panel */}
          <Card className="border border-violet-100 dark:border-violet-900/40 bg-gradient-to-br from-white to-violet-50/40 dark:from-slate-900 dark:to-violet-950/20 shadow-xs rounded-xl">
            <CardHeader className="py-2.5 px-3.5 sm:px-4 border-b border-violet-100/60 dark:border-violet-900/40">
              <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                Quick Help
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3.5 sm:p-4">
              <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2 list-disc pl-4 leading-relaxed">
                <li>
                  Use <strong className="text-violet-700 dark:text-violet-400 font-semibold">Create with AI</strong> to draft a new chart in natural language.
                </li>
                <li>
                  Open the <strong className="text-violet-700 dark:text-violet-400 font-semibold">Advanced Editor</strong> to precisely align grids, customize legends, or export canvas data.
                </li>
                <li>
                  Click any chart type above to filter your board, or share public links without authentication.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  )
})
