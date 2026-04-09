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
 * GroupedSettingsFilter - Shows Group and Dataset dropdowns
 * at the top of Design, Labels, and Advanced panels when in grouped mode.
 * 
 * Group dropdown: shows the current active group (synced with chart store)
 * Dataset dropdown: shows datasets within the group + "All" option (default)
 * 
 * When "All" is selected, settings apply to all datasets in the group.
 * When a specific dataset is selected, settings apply only to that dataset.
 */
export function GroupedSettingsFilter() {
  const {
    chartMode,
    chartData,
    groups,
    activeGroupId,
    setActiveGroupId,
  } = useChartStore()

  const {
    settingsGroupId,
    settingsDatasetId,
    setSettingsGroupId,
    setSettingsDatasetId,
  } = useUIStore()

  // The effective group is either the override from settings or the active group
  const effectiveGroupId = settingsGroupId || activeGroupId

  // Get datasets for the effective group
  const groupDatasets = chartData.datasets
    .map((ds: any, i: number) => ({ ds, index: i }))
    .filter(({ ds }: any) => ds.groupId === effectiveGroupId)

  // Sync: when the active group changes in chart store, reset settings filter
  useEffect(() => {
    setSettingsGroupId(null)
    setSettingsDatasetId(null)
  }, [activeGroupId, setSettingsGroupId, setSettingsDatasetId])

  // Don't render if not in grouped mode
  if (chartMode !== 'grouped') return null

  // Don't render if no groups exist
  if (!groups || groups.length === 0) return null

  const handleGroupChange = (value: string) => {
    // Change both the chart store active group and the settings filter
    setActiveGroupId(value)
    setSettingsGroupId(null) // Reset to use active group
    setSettingsDatasetId(null)
  }

  const handleDatasetChange = (value: string) => {
    setSettingsDatasetId(value === 'all' ? null : value)
  }

  return (
    <div className="flex items-start gap-3 pb-3 mb-1 border-b border-gray-100">
      {/* Group Dropdown */}
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
          Group
        </label>
        <Select value={effectiveGroupId} onValueChange={handleGroupChange}>
          <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id} className="text-xs">
                {group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Dataset Dropdown */}
      <div className="flex-1 min-w-0">
        <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
          Dataset
        </label>
        <Select
          value={settingsDatasetId || 'all'}
          onValueChange={handleDatasetChange}
        >
          <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs font-medium text-blue-600">
              All Datasets
            </SelectItem>
            {groupDatasets.length > 0 && <SelectSeparator />}
            {groupDatasets.map(({ ds, index }: any) => (
              <SelectItem key={index} value={String(index)} className="text-xs">
                {ds.label || ds.sourceTitle || `Dataset ${index + 1}`}
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
 * based on the grouped settings filter state.
 * 
 * - If "All" is selected (settingsDatasetId is null), returns all dataset indices in the group
 * - If a specific dataset is selected, returns only that dataset index
 * - In single mode, returns [activeDatasetIndex] (no change from existing behavior)
 */
export function useGroupedSettingsTarget() {
  const {
    chartMode,
    chartData,
    activeDatasetIndex,
    activeGroupId,
  } = useChartStore()

  const { settingsDatasetId } = useUIStore()

  if (chartMode === 'single') {
    return {
      targetIndices: [activeDatasetIndex],
      primaryIndex: activeDatasetIndex,
      isAllDatasets: false,
      isSingleDataset: true,
    }
  }

  // Grouped mode
  if (settingsDatasetId !== null) {
    // A specific dataset is selected
    const specificIndex = parseInt(settingsDatasetId)
    return {
      targetIndices: [specificIndex],
      primaryIndex: specificIndex,
      isAllDatasets: false,
      isSingleDataset: true,
    }
  }

  // "All" is selected - target all datasets in the active group
  const groupIndices = chartData.datasets
    .map((ds: any, i: number) => ({ ds, i }))
    .filter(({ ds }: any) => ds.groupId === activeGroupId)
    .map(({ i }: any) => i)

  return {
    targetIndices: groupIndices,
    primaryIndex: groupIndices[0] ?? 0,
    isAllDatasets: true,
    isSingleDataset: false,
  }
}
