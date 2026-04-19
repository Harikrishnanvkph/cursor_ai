"use client"

import { useChartStore } from "@/lib/chart-store"
import { useUIStore } from "@/lib/stores/ui-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useEffect } from "react"

/**
 * SliceSettingsFilter - Shows a "Choose Slice" dropdown
 * at the top of Labels & Styling panels when in single mode.
 * 
 * "All" (default): settings apply to all slices uniformly.
 * Specific slice: settings apply only to that slice.
 * 
 * Only renders in single mode (grouped mode uses GroupedSettingsFilter instead).
 */
export function SliceSettingsFilter() {
  const {
    chartMode,
    chartData,
    activeDatasetIndex,
  } = useChartStore()

  const {
    settingsSliceIndex,
    setSettingsSliceIndex,
  } = useUIStore()

  // Get the active dataset's labels (slice names)
  const activeDataset = chartData.datasets[activeDatasetIndex]
  const sliceLabels: string[] =
    (activeDataset as any)?.sliceLabels ||
    chartData.labels?.map(String) ||
    []
  const sliceCount = activeDataset?.data?.length || sliceLabels.length

  // Reset slice selection when dataset changes
  useEffect(() => {
    setSettingsSliceIndex(null)
  }, [activeDatasetIndex, setSettingsSliceIndex])

  // Only render in single mode
  if (chartMode !== 'single') return null

  // Don't render if no slices
  if (sliceCount === 0) return null

  const handleSliceChange = (value: string) => {
    setSettingsSliceIndex(value === 'all' ? null : Number(value))
  }

  return (
    <div className="flex items-start gap-3 pb-3 mb-1 border-b border-gray-100">
      {/* Slice Dropdown */}
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
          Slice
        </label>
        <Select
          value={settingsSliceIndex !== null ? String(settingsSliceIndex) : 'all'}
          onValueChange={handleSliceChange}
        >
          <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
            <SelectValue placeholder="All Slices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-medium text-blue-600">
              All Slices
            </SelectItem>
            {sliceCount > 0 && <SelectSeparator />}
            {Array.from({ length: sliceCount }, (_, idx) => (
              <SelectItem key={idx} value={String(idx)} className="text-xs">
                {sliceLabels[idx] || `Slice ${idx + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
