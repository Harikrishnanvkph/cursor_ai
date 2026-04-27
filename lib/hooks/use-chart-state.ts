import { useChartStore } from "@/lib/chart-store"

/**
 * Granular hooks for accessing chart state.
 * Use these instead of `useChartStore()` to avoid unnecessary re-renders.
 * Each hook selects only the specific slice of state needed.
 */

/**
 * Resolve the active chart config based on mode:
 * - Single mode: use the active dataset's chartConfig (fallback to global)
 * - Grouped mode: use the active group's chartConfig (fallback to global)
 */
function resolveActiveConfig(state: any) {
    if (state.chartMode === 'single') {
        const ds = state.chartData?.datasets?.[state.activeDatasetIndex];
        return ds?.chartConfig ?? state.chartConfig;
    }
    const group = state.groups?.find((g: any) => g.id === state.activeGroupId);
    return group?.chartConfig ?? state.chartConfig;
}

// Data & Config
export const useChartData = () => useChartStore(state => state.chartData)
export const useChartConfig = () => useChartStore(state => resolveActiveConfig(state))
export const useChartType = () => useChartStore(state => state.chartType)

// Groups & Mode
export const useChartMode = () => useChartStore(state => state.chartMode)
export const useChartGroups = () => useChartStore(state => state.groups)
export const useActiveGroupId = () => useChartStore(state => state.activeGroupId)
export const useUniformityMode = () => useChartStore(state => resolveActiveConfig(state)?.visualSettings?.uniformityMode ?? 'uniform')

// Dataset State
export const useActiveDatasetIndex = () => useChartStore(state => state.activeDatasetIndex)



// Data Backups & Transitions
export const usePendingChartTypeChange = () => useChartStore(state => state.pendingChartTypeChange)
export const useCategoricalDataBackup = () => useChartStore(state => state.categoricalDataBackup)
export const useScatterBubbleDataBackup = () => useChartStore(state => state.scatterBubbleDataBackup)

// Global UI/Chart State
export const useHasJSON = () => useChartStore(state => state.hasJSON)
export const useChartTitle = () => useChartStore(state => state.chartTitle)
export const useGlobalChartRef = () => useChartStore(state => state.globalChartRef)
export const useOriginalCloudDimensions = () => useChartStore(state => state.originalCloudDimensions)
export const useCurrentSnapshotId = () => useChartStore(state => state.currentSnapshotId)

// Style Toggles - read from the resolved active config
export const useChartStyleOptions = () => useChartStore(state => {
    const config = resolveActiveConfig(state);
    return {
        fillArea: config?.visualSettings?.fillArea ?? true,
        showBorder: config?.visualSettings?.showBorder ?? true,
        showImages: config?.visualSettings?.showImages ?? true,
        showLabels: config?.visualSettings?.showLabels ?? true
    };
})

export const useFillArea = () => useChartStore(state => resolveActiveConfig(state)?.visualSettings?.fillArea ?? true)
export const useShowBorder = () => useChartStore(state => resolveActiveConfig(state)?.visualSettings?.showBorder ?? true)
export const useShowImages = () => useChartStore(state => resolveActiveConfig(state)?.visualSettings?.showImages ?? true)
export const useShowLabels = () => useChartStore(state => resolveActiveConfig(state)?.visualSettings?.showLabels ?? true)
export const useLegendFilter = () => useChartStore(state => state.legendFilter)
