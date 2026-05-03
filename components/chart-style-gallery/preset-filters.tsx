"use client"

import React, { useState } from "react"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { Search, X } from "lucide-react"
import type { PresetCategory } from "@/lib/chart-style-types"
import type { SupportedChartType } from "@/lib/chart-defaults"

const CHART_TYPE_OPTIONS: { label: string; value: SupportedChartType | 'all' }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Bar', value: 'bar' },
  { label: 'Line', value: 'line' },
  { label: 'Pie', value: 'pie' },
  { label: 'Doughnut', value: 'doughnut' },
  { label: 'Radar', value: 'radar' },
  { label: 'Polar', value: 'polarArea' },
  { label: 'H. Bar', value: 'horizontalBar' },
  { label: '3D Bar', value: 'bar3d' as SupportedChartType },
  { label: '3D Pie', value: 'pie3d' as SupportedChartType },
  { label: 'Stacked', value: 'stackedBar' as SupportedChartType },
]

const CATEGORY_OPTIONS: { label: string; value: PresetCategory | 'all'; color: string }[] = [
  { label: 'All', value: 'all', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { label: 'Minimal', value: 'minimal', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  { label: 'Bold', value: 'bold', color: 'bg-orange-50 text-orange-600 border-orange-200' },
  { label: 'Pastel', value: 'pastel', color: 'bg-pink-50 text-pink-600 border-pink-200' },
  { label: 'Dark', value: 'dark', color: 'bg-gray-700 text-gray-100 border-gray-600' },
  { label: 'Pro', value: 'professional', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  { label: '3D', value: '3d', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  { label: 'Earthy', value: 'earthy', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Gradient', value: 'gradient', color: 'bg-indigo-50 text-indigo-600 border-indigo-200' },
]

export function PresetFilters() {
  const { filters, setFilters, resetFilters } = useChartStyleStore()
  const [showSearch, setShowSearch] = useState(false)
  const hasActiveFilters = filters.chartType !== 'all' || filters.category !== 'all' || filters.searchQuery !== ''

  return (
    <div className="px-3 py-2.5 border-b border-gray-100 flex-shrink-0 space-y-2">
      {/* Search toggle + clear */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-1.5 rounded-md transition-colors ${showSearch ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {showSearch && (
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            placeholder="Search styles..."
            className="flex-1 px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 placeholder:text-gray-400"
            autoFocus
          />
        )}

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="ml-auto flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-violet-600 hover:bg-violet-50 transition-colors"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>

      {/* Chart type pills */}
      <div className="flex gap-1 flex-wrap">
        {CHART_TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilters({ chartType: opt.value as any })}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all ${
              filters.chartType === opt.value
                ? 'bg-violet-100 text-violet-700 border-violet-300 shadow-sm'
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category pills */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORY_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilters({ category: opt.value as any })}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-all ${
              filters.category === opt.value
                ? opt.color + ' shadow-sm'
                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
