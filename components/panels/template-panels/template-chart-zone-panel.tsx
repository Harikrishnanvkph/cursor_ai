"use client"

import React, { useState } from "react"
import { useTemplateStore } from "@/lib/template-store"
import { useChartStore } from "@/lib/chart-store"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { BarChart3, Link2, Link2Off } from "lucide-react"

export function TemplateChartZonePanel() {
  const { currentTemplate } = useTemplateStore()
  const chartStore = useChartStore()

  // Track whether user wants linked (uniform) or unlinked (per-side) padding
  const [linked, setLinked] = useState(true)

  if (!currentTemplate) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No template selected.</p>
        <p className="text-xs mt-1 text-gray-400">Select a template first.</p>
      </div>
    )
  }

  const chartArea = currentTemplate.chartArea

  // Calculate percentage of total canvas
  const pctW = currentTemplate.width > 0 ? Math.round((chartArea.width / currentTemplate.width) * 100) : 0
  const pctH = currentTemplate.height > 0 ? Math.round((chartArea.height / currentTemplate.height) * 100) : 0

  // ── Canvas Padding helpers ──────────────────
  const rawPadding = chartStore?.chartConfig?.layout?.padding
  const getPaddingValue = (side: 'top' | 'right' | 'bottom' | 'left'): number => {
    if (typeof rawPadding === 'number') return rawPadding
    if (rawPadding && typeof rawPadding === 'object') return (rawPadding as any)[side] ?? 0
    return 0
  }

  const paddingTop = getPaddingValue('top')
  const paddingRight = getPaddingValue('right')
  const paddingBottom = getPaddingValue('bottom')
  const paddingLeft = getPaddingValue('left')

  const updatePadding = (newPadding: number | { top: number; right: number; bottom: number; left: number }) => {
    chartStore.updateChartConfig({
      ...chartStore.chartConfig,
      layout: {
        ...(chartStore.chartConfig.layout || {}),
        padding: newPadding
      }
    } as any)
  }

  const handlePaddingChange = (side: 'top' | 'right' | 'bottom' | 'left', value: string) => {
    const num = Math.max(0, parseInt(value) || 0)

    if (linked) {
      // Uniform — set all sides to the same value
      updatePadding(num)
    } else {
      // Per-side — update only the specified side
      const currentPadding = typeof rawPadding === 'number'
        ? { top: rawPadding, right: rawPadding, bottom: rawPadding, left: rawPadding }
        : { top: 0, right: 0, bottom: 0, left: 0, ...(typeof rawPadding === 'object' ? rawPadding : {}) }

      updatePadding({ ...currentPadding, [side]: num })
    }
  }

  const hasPadding = paddingTop > 0 || paddingRight > 0 || paddingBottom > 0 || paddingLeft > 0

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          Chart Area
        </h3>

        {/* Visual Preview */}
        <div className="mb-4 bg-gray-50 rounded-lg p-3">
          <div
            className="relative mx-auto bg-white rounded border border-gray-200"
            style={{
              width: 200,
              height: Math.round(200 * (currentTemplate.height / currentTemplate.width)),
              maxHeight: 150,
            }}
          >
            {/* Chart zone box */}
            <div
              className="absolute bg-blue-50 border-2 border-blue-400 border-dashed rounded-sm"
              style={{
                left: `${currentTemplate.width > 0 ? (chartArea.x / currentTemplate.width) * 100 : 0}%`,
                top: `${currentTemplate.height > 0 ? (chartArea.y / currentTemplate.height) * 100 : 0}%`,
                width: `${pctW}%`,
                height: `${pctH}%`,
              }}
            >
              {/* Padding inset visualization */}
              {hasPadding ? (
                <div
                  className="absolute bg-blue-200/40 border border-blue-300 rounded-[1px]"
                  style={{
                    top: `${chartArea.height > 0 ? Math.min((paddingTop / chartArea.height) * 100, 45) : 0}%`,
                    left: `${chartArea.width > 0 ? Math.min((paddingLeft / chartArea.width) * 100, 45) : 0}%`,
                    right: `${chartArea.width > 0 ? Math.min((paddingRight / chartArea.width) * 100, 45) : 0}%`,
                    bottom: `${chartArea.height > 0 ? Math.min((paddingBottom / chartArea.height) * 100, 45) : 0}%`,
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-semibold text-blue-700">
                    Chart
                  </span>
                </div>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold text-blue-600">
                  Chart
                </span>
              )}
            </div>
          </div>
          <p className="text-center text-[10px] text-gray-400 mt-2">
            {currentTemplate.width} × {currentTemplate.height}px canvas · Chart zone {pctW}% × {pctH}%
          </p>
        </div>

        {/* ── Canvas Padding Controls ──────────────── */}
        {chartStore && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-gray-900 font-medium">Canvas Padding</Label>
              <button
                className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium transition-colors border ${
                  linked
                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100 hover:text-gray-700'
                }`}
                onClick={() => {
                  if (linked) {
                    // Switching to per-side: expand current uniform value into object
                    const val = paddingTop
                    updatePadding({ top: val, right: val, bottom: val, left: val })
                  } else {
                    // Switching to uniform: collapse to single value (use top as default)
                    updatePadding(paddingTop)
                  }
                  setLinked(!linked)
                }}
                title={linked ? 'All Sides — update all sides together' : 'Single Side — set each side independently'}
              >
                {linked ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                {linked ? 'All Sides' : 'Single Side'}
              </button>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Padding shrinks the chart drawing area inward. The chart always stays within its zone.
            </p>

            {linked ? (
              /* ── Uniform: single input ───────── */
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-14 shrink-0">All sides</span>
                <Input
                  type="number"
                  value={paddingTop}
                  onChange={(e) => handlePaddingChange('top', e.target.value)}
                  className="h-7 text-sm flex-1"
                  min={0}
                  max={200}
                />
                <span className="text-[10px] text-gray-400">px</span>
              </div>
            ) : (
              /* ── Per-side: four inputs ──────── */
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 w-8 shrink-0">Top</span>
                  <Input
                    type="number"
                    value={paddingTop}
                    onChange={(e) => handlePaddingChange('top', e.target.value)}
                    className="h-7 text-sm"
                    min={0}
                    max={200}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 w-8 shrink-0">Right</span>
                  <Input
                    type="number"
                    value={paddingRight}
                    onChange={(e) => handlePaddingChange('right', e.target.value)}
                    className="h-7 text-sm"
                    min={0}
                    max={200}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 w-8 shrink-0">Bottom</span>
                  <Input
                    type="number"
                    value={paddingBottom}
                    onChange={(e) => handlePaddingChange('bottom', e.target.value)}
                    className="h-7 text-sm"
                    min={0}
                    max={200}
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-400 w-8 shrink-0">Left</span>
                  <Input
                    type="number"
                    value={paddingLeft}
                    onChange={(e) => handlePaddingChange('left', e.target.value)}
                    className="h-7 text-sm"
                    min={0}
                    max={200}
                  />
                </div>
              </div>
            )}

            {/* Quick stats */}
            <div className="bg-gray-50 rounded-md p-2 text-xs text-gray-500 space-y-1 mt-2">
              <div className="flex justify-between">
                <span>Zone size</span>
                <span className="font-medium text-gray-700">{chartArea.width} × {chartArea.height}px</span>
              </div>
              <div className="flex justify-between">
                <span>Padding</span>
                <span className="font-medium text-gray-700">
                  {linked || (paddingTop === paddingRight && paddingRight === paddingBottom && paddingBottom === paddingLeft)
                    ? `${paddingTop}px`
                    : `${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft}px`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode</span>
                <span className="font-medium text-blue-600">Responsive</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
