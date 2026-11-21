import { useChartStore } from "@/lib/chart-store"
import { DatasetService } from '../services/dataset-service'
import { ChartTypeService } from '../services/chart-type-service'
import { ChartConfigService } from '../services/chart-config-service'
import { ChartTransformService } from '../services/chart-transform-service'
import { GroupService } from '../services/group-service'
import { ChartStateService } from "@/lib/services/chart-state-service"
import type { ExtendedChartDataset, SupportedChartType } from "@/lib/chart-defaults"
import { toast } from "sonner"
import { isChartTypeCompatible, getChartIncompatibilityReason } from "@/lib/chart-types"

const addDataset = (dataset: ExtendedChartDataset) => {
    const currentState = useChartStore.getState()
    const newState = DatasetService.addDataset(dataset, {
        chartType: currentState.chartType,
        chartData: currentState.chartData,
        chartConfig: currentState.chartConfig,
        groups: currentState.groups,
        activeGroupId: currentState.activeGroupId,
        chartMode: currentState.chartMode,
        activeDatasetIndex: currentState.activeDatasetIndex,
        singleModeData: currentState.singleModeData,
        groupedModeData: currentState.groupedModeData
    })
    useChartStore.setState(newState)
}

const removeDataset = (index: number) => {
    const currentState = useChartStore.getState()
    const newState = DatasetService.removeDataset(index, {
        chartData: currentState.chartData,
        groups: currentState.groups,
        chartMode: currentState.chartMode,
        singleModeData: currentState.singleModeData,
        groupedModeData: currentState.groupedModeData,
        activeDatasetIndex: currentState.activeDatasetIndex
    })
    useChartStore.setState(newState)
}

const updateDataset = (index: number, updates: Partial<ExtendedChartDataset> & { addPoint?: boolean; removePoint?: boolean; randomizeColors?: boolean }) => {
    const currentState = useChartStore.getState()
    const newState = DatasetService.updateDataset(index, updates, {
        chartType: currentState.chartType,
        chartData: currentState.chartData,
        chartConfig: currentState.chartConfig,
        chartMode: currentState.chartMode,
        hasJSON: currentState.hasJSON,
        singleModeData: currentState.singleModeData,
        groupedModeData: currentState.groupedModeData
    })
    if (newState) {
        useChartStore.setState(newState)
    }
}

const updateDataPoint = (datasetIndex: number, pointIndex: number, field: string, value: any) => {
    const currentState = useChartStore.getState()
    const newState = DatasetService.updateDataPoint(datasetIndex, pointIndex, field, value, {
        chartData: currentState.chartData,
        chartMode: currentState.chartMode,
        singleModeData: currentState.singleModeData,
        groupedModeData: currentState.groupedModeData
    })
    useChartStore.setState(newState)
}

const updatePointImage = (datasetIndex: number, pointIndex: number, imageUrl: string, imageConfig: any) => {
    const currentState = useChartStore.getState()
    const changes = DatasetService.updatePointImage(datasetIndex, pointIndex, imageUrl, imageConfig, currentState)
    if (changes) {
        useChartStore.setState(changes)
    }
}

const updateLabels = (labels: string[]) => {
    const currentState = useChartStore.getState()
    const changes = DatasetService.updateLabels(labels, {
        chartData: currentState.chartData,
        chartMode: currentState.chartMode,
        activeDatasetIndex: currentState.activeDatasetIndex,
        activeGroupId: currentState.activeGroupId,
        singleModeData: currentState.singleModeData,
        groupedModeData: currentState.groupedModeData,
        hasJSON: currentState.hasJSON
    })
    useChartStore.setState(changes)
}

const toggleDatasetVisibility = (index: number) => {
    const currentState = useChartStore.getState()
    const changes = ChartStateService.toggleDatasetVisibility(index, currentState)
    useChartStore.setState(changes)
}

const toggleSliceVisibility = (index: number) => {
    const currentState = useChartStore.getState()
    const changes = ChartStateService.toggleSliceVisibility(index, currentState)
    useChartStore.setState(changes)
}

const setChartType = (type: SupportedChartType) => {
    const currentState = useChartStore.getState()
    if (currentState.chartType === type) return

    if (!isChartTypeCompatible(type, currentState.chartType)) {
        toast.error(getChartIncompatibilityReason(type, currentState.chartType))
        return
    }

    const newState = ChartTypeService.applyChartTypeChange(
        currentState.chartType,
        type,
        {
            chartData: currentState.chartData,
            chartConfig: currentState.chartConfig,
            chartMode: currentState.chartMode,
            activeDatasetIndex: currentState.activeDatasetIndex,
            uniformityMode: currentState.uniformityMode
        }
    )

    if (!newState) return

    const finalState: any = { ...newState }
    if (currentState.chartMode === 'single') {
        const newDatasets = newState.chartData.datasets.map((ds: any, i: number) =>
            i === currentState.activeDatasetIndex ? { ...ds, chartConfig: JSON.parse(JSON.stringify(newState.chartConfig)) } : ds
        )
        finalState.chartData = { ...newState.chartData, datasets: newDatasets }
        finalState.singleModeData = finalState.chartData
    } else {
        finalState.groups = currentState.groups.map((g: any) =>
            g.id === currentState.activeGroupId ? { ...g, chartConfig: JSON.parse(JSON.stringify(newState.chartConfig)) } : g
        )
        finalState.chartData = newState.chartData
        finalState.groupedModeData = newState.chartData
    }

    useChartStore.setState(finalState)
}

const updateChartConfig = (config: any) => {
    const currentState = useChartStore.getState()
    const normalizedConfig = ChartConfigService.normalizeConfig(config, currentState.chartType)
    currentState.updateChartConfig(normalizedConfig)
}

const applyTransformWithModeSync = (newState: Partial<any> | null) => {
    if (!newState) return
    const { chartMode } = useChartStore.getState()
    if (newState.chartData) {
        const modeDataUpdate = chartMode === 'single'
            ? { singleModeData: newState.chartData }
            : { groupedModeData: newState.chartData }
        useChartStore.setState({ ...newState, ...modeDataUpdate })
    } else {
        useChartStore.setState(newState)
    }
}

const sortDataset = (index: number, order: 'asc' | 'desc' | 'label-asc' | 'label-desc') => {
    applyTransformWithModeSync(ChartTransformService.sortDataset(useChartStore.getState(), index, order))
}
const reverseDataset = (index: number) => {
    applyTransformWithModeSync(ChartTransformService.reverseDataset(useChartStore.getState(), index))
}
const filterTopN = (index: number, n: number) => {
    applyTransformWithModeSync(ChartTransformService.filterTopN(useChartStore.getState(), index, n))
}
const filterAboveThreshold = (index: number, threshold: number) => {
    applyTransformWithModeSync(ChartTransformService.filterAboveThreshold(useChartStore.getState(), index, threshold))
}
const filterBelowThreshold = (index: number, threshold: number) => {
    applyTransformWithModeSync(ChartTransformService.filterBelowThreshold(useChartStore.getState(), index, threshold))
}
const normalizeDataset = (index: number, range: string = '0-100') => {
    applyTransformWithModeSync(ChartTransformService.normalizeDataset(useChartStore.getState(), index, range))
}
const convertToPercentage = (index: number) => {
    applyTransformWithModeSync(ChartTransformService.convertToPercentage(useChartStore.getState(), index))
}
const roundDataset = (index: number, decimals: number) => {
    applyTransformWithModeSync(ChartTransformService.roundDataset(useChartStore.getState(), index, decimals))
}
const scaleDataset = (index: number, factor: number) => {
    applyTransformWithModeSync(ChartTransformService.scaleDataset(useChartStore.getState(), index, factor))
}
const offsetDataset = (index: number, offset: number) => {
    applyTransformWithModeSync(ChartTransformService.offsetDataset(useChartStore.getState(), index, offset))
}
const backupDatasetState = (index: number) => {
    const newState = ChartTransformService.createBackup(useChartStore.getState(), index)
    if (newState) useChartStore.setState(newState)
}
const restoreDatasetState = (index: number) => {
    applyTransformWithModeSync(ChartTransformService.restoreDatasetState(useChartStore.getState(), index))
}
const resetDatasetOperations = (index: number) => {
    restoreDatasetState(index)
}
const addGroup = (groupData: any) => {
    const { id, newState } = GroupService.addGroup(groupData, { groups: useChartStore.getState().groups })
    useChartStore.setState(newState)
    return id
}
const updateGroup = (id: string, updates: any) => {
    const newState = GroupService.updateGroup(id, updates, { groups: useChartStore.getState().groups })
    useChartStore.setState(newState)
}
const deleteGroup = (id: string) => {
    const currentState = useChartStore.getState()
    const newState = GroupService.deleteGroup(id, {
        groups: currentState.groups,
        activeGroupId: currentState.activeGroupId,
        chartType: currentState.chartType,
        groupedModeData: currentState.groupedModeData
    })
    if (newState) useChartStore.setState(newState)
}
const setActiveGroup = (id: string) => {
    const currentState = useChartStore.getState()
    const newState = GroupService.setActiveGroup(id, {
        groups: currentState.groups,
        activeGroupId: currentState.activeGroupId,
        chartType: currentState.chartType,
        chartConfig: currentState.chartConfig,
        chartData: currentState.chartData,
        groupedModeData: currentState.groupedModeData,
        chartTitle: currentState.chartTitle,
        currentSnapshotId: currentState.currentSnapshotId
    })
    useChartStore.setState(newState)
}

const CHART_ACTIONS = Object.freeze({
    addDataset,
    removeDataset,
    updateDataset,
    updateDataPoint,
    updatePointImage,
    updateLabels,
    toggleDatasetVisibility,
    toggleSliceVisibility,
    setChartType,
    updateChartConfig,
    setChartData: (...args: Parameters<ReturnType<typeof useChartStore.getState>['setChartData']>) =>
        useChartStore.getState().setChartData(...args),
    setChartMode: (...args: Parameters<ReturnType<typeof useChartStore.getState>['setChartMode']>) =>
        useChartStore.getState().setChartMode(...args),
    setActiveDatasetIndex: (...args: Parameters<ReturnType<typeof useChartStore.getState>['setActiveDatasetIndex']>) =>
        useChartStore.getState().setActiveDatasetIndex(...args),
    toggleFillArea: () => useChartStore.getState().toggleFillArea(),
    toggleFillPoints: () => useChartStore.getState().toggleFillPoints(),
    toggleShowBorder: () => useChartStore.getState().toggleShowBorder(),
    toggleShowImages: () => useChartStore.getState().toggleShowImages(),
    toggleShowLabels: () => useChartStore.getState().toggleShowLabels(),
    toggleShowLegend: () => useChartStore.getState().toggleShowLegend(),
    sortDataset,
    reverseDataset,
    filterTopN,
    filterAboveThreshold,
    filterBelowThreshold,
    normalizeDataset,
    convertToPercentage,
    roundDataset,
    scaleDataset,
    offsetDataset,
    backupDatasetState,
    restoreDatasetState,
    resetDatasetOperations,
    addGroup,
    updateGroup,
    deleteGroup,
    setActiveGroup,
})

/**
 * Returns a frozen singleton bag of chart actions with permanent referential stability.
 */
export const useChartActions = () => CHART_ACTIONS
