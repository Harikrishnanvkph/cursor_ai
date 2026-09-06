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
 * GroupedSettingsFilter - Shows Dataset and Slice dropdowns
 * at the top of Design, Labels, and Styling panels.
 * 
 * Dataset dropdown: Select "All Datasets" or a specific dataset
 * Slice dropdown: Select "All Slices" or a specific slice/data point
 */
export function GroupedSettingsFilter() {
  const {
    chartMode,
    chartData,
    activeDatasetIndex,
    activeGroupId,
  } = useChartStore()

  const {
    settingsDatasetId,
    setSettingsDatasetId,
    settingsSliceIndex,
    setSettingsSliceIndex,
  } = useUIStore()

  // Get available datasets
  const availableDatasets = chartMode === 'grouped' && activeGroupId
    ? chartData.datasets
        .map((ds: any, i: number) => ({ ds, index: i }))
        .filter(({ ds }: any) => !ds.groupId || ds.groupId === activeGroupId)
    : chartData.datasets.map((ds: any, i: number) => ({ ds, index: i }))

  // Determine active target dataset for slice list
  const selectedDatasetIdx = settingsDatasetId !== null 
    ? parseInt(settingsDatasetId) 
    : (availableDatasets[0]?.index ?? activeDatasetIndex ?? 0)

  const targetDataset = chartData.datasets[selectedDatasetIdx] || chartData.datasets[0]

  const sliceLabels: string[] =
    (targetDataset as any)?.sliceLabels ||
    chartData.labels?.map(String) ||
    []
  const sliceCount = targetDataset?.data?.length || sliceLabels.length || 0

  // Reset slice selection when dataset or group changes
  useEffect(() => {
    setSettingsSliceIndex(null)
  }, [activeDatasetIndex, activeGroupId, setSettingsSliceIndex])

  if (!chartData?.datasets || chartData.datasets.length === 0) return null

  const handleDatasetChange = (value: string) => {
    setSettingsDatasetId(value === 'all' ? null : value)
    setSettingsSliceIndex(null) // Reset slice selection when dataset changes
  }

  const handleSliceChange = (value: string) => {
    setSettingsSliceIndex(value === 'all' ? null : Number(value))
  }

  return (
    <div className="flex items-start gap-3 pb-3 mb-1 border-b border-gray-100 dark:border-gray-800">
      {/* Dataset Dropdown */}
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
          Dataset
        </label>
        <Select
          value={settingsDatasetId !== null ? String(settingsDatasetId) : 'all'}
          onValueChange={handleDatasetChange}
        >
          <SelectTrigger className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <SelectValue placeholder="All Datasets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-medium text-blue-600">
              All Datasets
            </SelectItem>
            {availableDatasets.length > 0 && <SelectSeparator />}
            {availableDatasets.map(({ ds, index }: any) => (
              <SelectItem key={index} value={String(index)} className="text-xs">
                {ds.label || ds.name || ds.sourceTitle || `Dataset ${index + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Slice Dropdown */}
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
          Slice
        </label>
        <Select
          value={settingsSliceIndex !== null ? String(settingsSliceIndex) : 'all'}
          onValueChange={handleSliceChange}
        >
          <SelectTrigger className="h-8 text-xs bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <SelectValue placeholder="All Slices" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-medium text-blue-600">
              All Slices
            </SelectItem>
            {sliceCount > 0 && <SelectSeparator />}
            {Array.from({ length: sliceCount }, (_, idx) => (
              <SelectItem key={idx} value={String(idx)} className="text-xs">
                {sliceLabels[idx] || chartData.labels?.[idx] || `Slice ${idx + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

/**
 * Hook: useGroupedSettingsTarget
 * 
 * Returns the dataset indices that the current settings should apply to,
 * based on the settings filter state.
 */
export function useGroupedSettingsTarget() {
  const {
    chartMode,
    chartData,
    activeDatasetIndex,
    activeGroupId,
  } = useChartStore()

  const { settingsDatasetId } = useUIStore()

  if (settingsDatasetId !== null) {
    const specificIndex = parseInt(settingsDatasetId)
    return {
      targetIndices: [specificIndex],
      primaryIndex: specificIndex,
      isAllDatasets: false,
      isSingleDataset: true,
    }
  }

  if (chartMode === 'single') {
    return {
      targetIndices: [activeDatasetIndex],
      primaryIndex: activeDatasetIndex,
      isAllDatasets: true,
      isSingleDataset: chartData.datasets.length === 1,
    }
  }

  // Grouped mode with "all" selected
  const groupIndices = chartData.datasets
    .map((ds: any, i: number) => ({ ds, i }))
    .filter(({ ds }: any) => !activeGroupId || ds.groupId === activeGroupId)
    .map(({ i }: any) => i)

  return {
    targetIndices: groupIndices.length > 0 ? groupIndices : chartData.datasets.map((_, i) => i),
    primaryIndex: groupIndices[0] ?? 0,
    isAllDatasets: true,
    isSingleDataset: false,
  }
}
