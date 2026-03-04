import { useChartStore } from "@/lib/chart-store"
import { DatasetService } from '../services/dataset-service'
import { ChartTypeService } from '../services/chart-type-service'
import { ChartConfigService } from '../services/chart-config-service'
import { UndoBridge } from '../services/undo-bridge'
import { ChartTransformService } from '../services/chart-transform-service'
import { GroupService } from '../services/group-service'
import { ChartStateService } from "@/lib/services/chart-state-service"
import { OverlayService } from '../services/overlay-service'
import type { ExtendedChartDataset, SupportedChartType } from "@/lib/chart-defaults"
import type { OverlayImage, OverlayText, OverlayShape } from '@/lib/types/overlay'

export const useChartActions = () => {
    // Get setters from the store
    // We do NOT select state here to avoid stale closures in actions
    const setChartData = useChartStore(s => s.setChartData)
    const setChartMode = useChartStore(s => s.setChartMode)
    const setActiveDatasetIndex = useChartStore(s => s.setActiveDatasetIndex)

    // Store toggles that just proxy directly
    const toggleFillArea = useChartStore(s => s.toggleFillArea)
    const toggleShowBorder = useChartStore(s => s.toggleShowBorder)
    const toggleShowImages = useChartStore(s => s.toggleShowImages)
    const toggleShowLabels = useChartStore(s => s.toggleShowLabels)
    const toggleShowLegend = useChartStore(s => s.toggleShowLegend)

    // --- Data Operations (Batch 1) ---

    const addDataset = (dataset: ExtendedChartDataset) => {
        const currentState = useChartStore.getState()
        const newState = DatasetService.addDataset(dataset, {
            chartType: currentState.chartType,
            chartData: currentState.chartData,
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
            groupedModeData: currentState.groupedModeData
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

    // Chart Operations
    const setChartType = (type: SupportedChartType) => {
        const currentState = useChartStore.getState()

        // Use service to calculate new state
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

        // Capture undo point
        if (currentState.hasJSON) {
            try {
                const previousState = {
                    chartType: currentState.chartType,
                    chartData: JSON.parse(JSON.stringify(currentState.chartData)),
                    chartConfig: JSON.parse(JSON.stringify(currentState.chartConfig))
                }

                UndoBridge.capture({
                    type: 'manual_chart_type_change',
                    previousState: previousState,
                    currentState: {
                        chartType: newState.chartType,
                        chartData: newState.chartData,
                        chartConfig: newState.chartConfig
                    },
                    toolSource: 'chart-type-selector',
                    changeDescription: `Chart type changed from ${currentState.chartType} to ${type}`
                })
            } catch (error) {
                console.warn('Failed to capture undo point for chart type change:', error)
            }
        }

        // Build final state: mirror chartData AND chartConfig into mode-specific storage
        // In grouped mode, the chart reads config from group.chartConfig (via resolveActiveConfig),
        // not from state.chartConfig. So we must update the active group's chartConfig too.
        const finalState: any = {
            ...newState,
        };

        if (currentState.chartMode === 'single') {
            // Single mode: write config into the active dataset's chartConfig
            const newDatasets = newState.chartData.datasets.map((ds: any, i: number) =>
                i === currentState.activeDatasetIndex ? { ...ds, chartConfig: newState.chartConfig } : ds
            );
            finalState.chartData = { ...newState.chartData, datasets: newDatasets };
            finalState.singleModeData = finalState.chartData;
        } else {
            // Grouped mode: write config into the active group's chartConfig
            finalState.groups = currentState.groups.map((g: any) =>
                g.id === currentState.activeGroupId ? { ...g, chartConfig: newState.chartConfig } : g
            );
            finalState.groupedModeData = newState.chartData;
        }

        useChartStore.setState(finalState)
    }

    const updateChartConfig = (config: any) => {
        const currentState = useChartStore.getState()
        // Resolve the current active config for accurate undo state
        const activeConfig = currentState.getActiveChartConfig()

        if (currentState.hasJSON) {
            try {
                UndoBridge.capture({
                    type: 'manual_config_change',
                    previousState: {
                        chartType: currentState.chartType,
                        chartData: currentState.chartData,
                        chartConfig: activeConfig
                    },
                    currentState: {
                        chartType: currentState.chartType,
                        chartData: currentState.chartData,
                        chartConfig: config
                    },
                    toolSource: 'config-sidebar',
                    changeDescription: 'Chart configuration updated'
                })
            } catch (error) {
                console.warn('Failed to capture undo point for config change:', error)
            }
        }

        const normalizedConfig = ChartConfigService.normalizeConfig(config, currentState.chartType)
        // Use the store's updateChartConfig action which routes to the correct dataset/group
        useChartStore.getState().updateChartConfig(normalizedConfig)
    }

    // Transforms
    const sortDataset = (index: number, order: 'asc' | 'desc') => {
        const newState = ChartTransformService.sortDataset(useChartStore.getState(), index, order)
        if (newState) useChartStore.setState(newState)
    }

    const reverseDataset = (index: number) => {
        const newState = ChartTransformService.reverseDataset(useChartStore.getState(), index)
        if (newState) useChartStore.setState(newState)
    }

    const filterTopN = (index: number, n: number) => {
        const newState = ChartTransformService.filterTopN(useChartStore.getState(), index, n)
        if (newState) useChartStore.setState(newState)
    }

    const filterAboveThreshold = (index: number, threshold: number) => {
        const newState = ChartTransformService.filterAboveThreshold(useChartStore.getState(), index, threshold)
        if (newState) useChartStore.setState(newState)
    }

    const filterBelowThreshold = (index: number, threshold: number) => {
        const newState = ChartTransformService.filterBelowThreshold(useChartStore.getState(), index, threshold)
        if (newState) useChartStore.setState(newState)
    }

    const normalizeDataset = (index: number, range: [number, number]) => {
        const newState = ChartTransformService.normalizeDataset(useChartStore.getState(), index, range)
        if (newState) useChartStore.setState(newState)
    }

    const convertToPercentage = (index: number) => {
        const newState = ChartTransformService.convertToPercentage(useChartStore.getState(), index)
        if (newState) useChartStore.setState(newState)
    }

    const roundDataset = (index: number, decimals: number) => {
        const newState = ChartTransformService.roundDataset(useChartStore.getState(), index, decimals)
        if (newState) useChartStore.setState(newState)
    }

    const scaleDataset = (index: number, factor: number) => {
        const newState = ChartTransformService.scaleDataset(useChartStore.getState(), index, factor)
        if (newState) useChartStore.setState(newState)
    }

    const offsetDataset = (index: number, offset: number) => {
        const newState = ChartTransformService.offsetDataset(useChartStore.getState(), index, offset)
        if (newState) useChartStore.setState(newState)
    }

    const backupDatasetState = (index: number) => {
        const newState = ChartTransformService.createBackup(useChartStore.getState(), index)
        if (newState) useChartStore.setState(newState)
    }

    const restoreDatasetState = (index: number) => {
        const newState = ChartTransformService.restoreDatasetState(useChartStore.getState(), index)
        if (newState) useChartStore.setState(newState)
    }

    const resetDatasetOperations = (index: number) => {
        restoreDatasetState(index)
    }

    // Groups
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
            chartType: currentState.chartType
        })
        useChartStore.setState(newState)
    }

    // Overlays
    const addOverlayImage = (image: Omit<OverlayImage, 'id'>) => {
        const newState = OverlayService.addOverlayImage(image, { overlayImages: useChartStore.getState().overlayImages })
        useChartStore.setState(newState)
    }

    const updateOverlayImage = (id: string, updates: Partial<OverlayImage>) => {
        const newState = OverlayService.updateOverlayImage(id, updates, { overlayImages: useChartStore.getState().overlayImages })
        useChartStore.setState(newState)
    }

    const removeOverlayImage = (id: string) => {
        const newState = OverlayService.removeOverlayImage(id, { overlayImages: useChartStore.getState().overlayImages })
        useChartStore.setState(newState)
    }

    const addOverlayText = (text: Omit<OverlayText, 'id'>) => {
        const newState = OverlayService.addOverlayText(text, { overlayTexts: useChartStore.getState().overlayTexts })
        useChartStore.setState(newState)
    }

    const updateOverlayText = (id: string, updates: Partial<OverlayText>) => {
        const newState = OverlayService.updateOverlayText(id, updates, { overlayTexts: useChartStore.getState().overlayTexts })
        useChartStore.setState(newState)
    }

    const removeOverlayText = (id: string) => {
        const newState = OverlayService.removeOverlayText(id, { overlayTexts: useChartStore.getState().overlayTexts })
        useChartStore.setState(newState)
    }

    const addOverlayShape = (shape: Omit<OverlayShape, 'id'>) => {
        const newState = OverlayService.addOverlayShape(shape, { overlayShapes: useChartStore.getState().overlayShapes })
        useChartStore.setState(newState)
    }

    const updateOverlayShape = (id: string, updates: Partial<OverlayShape>) => {
        const newState = OverlayService.updateOverlayShape(id, updates, { overlayShapes: useChartStore.getState().overlayShapes })
        useChartStore.setState(newState)
    }

    const removeOverlayShape = (id: string) => {
        const newState = OverlayService.removeOverlayShape(id, { overlayShapes: useChartStore.getState().overlayShapes })
        useChartStore.setState(newState)
    }

    const clearOverlayShapes = () => {
        const newState = OverlayService.clearOverlayShapes()
        useChartStore.setState(newState)
    }

    return {
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
        toggleFillArea,
        toggleShowBorder,
        toggleShowImages,
        toggleShowLabels,
        toggleShowLegend,
        // Transforms
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
        // Groups
        addGroup,
        updateGroup,
        deleteGroup,
        setActiveGroup,
        // Overlays
        addOverlayImage,
        updateOverlayImage,
        removeOverlayImage,
        addOverlayText,
        updateOverlayText,
        removeOverlayText,
        addOverlayShape,
        updateOverlayShape,
        removeOverlayShape,
        clearOverlayShapes
    }
}
