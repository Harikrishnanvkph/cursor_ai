import {
    ExtendedChartData,
    ExtendedChartOptions,
    SupportedChartType,
    VisualSettings
} from "../chart-defaults"
import { ChartState } from "./chart-state-service"

// Define a type for the store actions needed for undo
type CaptureUndoFn = (data: any) => void;
type ShouldDebounceFn = (type: string, source: string) => boolean;

interface StyleServiceDependencies {
    captureUndoPoint: CaptureUndoFn;
    shouldDebounceUndoOperation: ShouldDebounceFn;
}

export class ChartStyleService {
    static toggleFillArea(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartData: ExtendedChartData; chartConfig: ExtendedChartOptions } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: true, uniformityMode: 'uniform' as const };
        const newFillArea = !currentSettings.fillArea;
        const currentShowBorder = currentSettings.showBorder;

        // Update datasets
        const newDatasets = state.chartData.datasets.map(dataset => ({
            ...dataset,
            fill: newFillArea,
            borderWidth: newFillArea ? (currentShowBorder ? 2 : 0) : 2
        }));

        const newChartConfig = {
            ...state.chartConfig,
            visualSettings: {
                ...currentSettings,
                fillArea: newFillArea,
                showBorder: newFillArea ? currentShowBorder : true
            }
        };

        const newState = {
            chartData: {
                ...state.chartData,
                datasets: newDatasets
            },
            chartConfig: newChartConfig
        };

        // Undo
        if (state.hasJSON && newDatasets.some(dataset => dataset.fill !== currentSettings.fillArea)) {
            try {
                if (!dependencies.shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
                    dependencies.captureUndoPoint({
                        type: 'manual_design_change',
                        previousState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: state.chartConfig
                        },
                        currentState: {
                            chartType: state.chartType,
                            chartData: newState.chartData,
                            chartConfig: newState.chartConfig
                        },
                        toolSource: 'style-toggles',
                        changeDescription: `Fill area ${newFillArea ? 'enabled' : 'disabled'}`
                    });
                }
            } catch (error) {
                console.warn('Failed to capture undo point for fill toggle:', error);
            }
        }

        return newState;
    }

    static toggleShowBorder(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): Partial<ChartState> & { chartConfig?: ExtendedChartOptions, chartData?: ExtendedChartData } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: true, uniformityMode: 'uniform' as const };

        if (!currentSettings.fillArea) {
            return {};
        }

        const newShowBorder = !currentSettings.showBorder;

        // Update datasets
        const newDatasets = state.chartData.datasets.map(dataset => ({
            ...dataset,
            borderWidth: newShowBorder ? 2 : 0
        }));

        const newChartConfig = {
            ...state.chartConfig,
            visualSettings: {
                ...currentSettings,
                showBorder: newShowBorder
            }
        };

        const newState = {
            chartData: {
                ...state.chartData,
                datasets: newDatasets
            },
            chartConfig: newChartConfig
        };

        // Undo
        if (state.hasJSON && newShowBorder !== currentSettings.showBorder) {
            try {
                if (!dependencies.shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
                    dependencies.captureUndoPoint({
                        type: 'manual_design_change',
                        previousState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: state.chartConfig
                        },
                        currentState: {
                            chartType: state.chartType,
                            chartData: newState.chartData,
                            chartConfig: newState.chartConfig
                        },
                        toolSource: 'style-toggles',
                        changeDescription: `Border ${newShowBorder ? 'enabled' : 'disabled'}`
                    });
                }
            } catch (error) {
                console.warn('Failed to capture undo point for border toggle:', error);
            }
        }

        return newState;
    }

    static toggleShowImages(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartConfig: ExtendedChartOptions } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: true, uniformityMode: 'uniform' as const };
        const newShowImages = !currentSettings.showImages;

        const newChartConfig = {
            ...state.chartConfig,
            visualSettings: {
                ...currentSettings,
                showImages: newShowImages
            }
        };

        if (state.hasJSON) {
            try {
                if (!dependencies.shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
                    dependencies.captureUndoPoint({
                        type: 'manual_design_change',
                        previousState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: state.chartConfig
                        },
                        currentState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: newChartConfig
                        },
                        toolSource: 'style-toggles',
                        changeDescription: `Images ${newShowImages ? 'shown' : 'hidden'}`
                    });
                }
            } catch (error) {
                console.warn('Failed to capture undo point for image toggle:', error);
            }
        }

        return { chartConfig: newChartConfig };
    }

    static toggleShowLabels(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartConfig: ExtendedChartOptions } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: true, uniformityMode: 'uniform' as const };
        const currentDisplay = (state.chartConfig.plugins as any)?.customLabelsConfig?.display !== false;
        const newShowLabels = !currentDisplay;

        const newChartConfig = {
            ...state.chartConfig,
            visualSettings: {
                ...currentSettings,
                showLabels: newShowLabels
            }
        };

        if (!newChartConfig.plugins) newChartConfig.plugins = {};

        newChartConfig.plugins.datalabels = {
            ...(newChartConfig.plugins.datalabels || {}),
            display: newShowLabels
        };

        newChartConfig.plugins.customLabelsConfig = {
            ...(newChartConfig.plugins.customLabelsConfig || {}),
            display: newShowLabels
        };

        if (state.hasJSON) {
            try {
                if (!dependencies.shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
                    dependencies.captureUndoPoint({
                        type: 'manual_design_change',
                        previousState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: state.chartConfig
                        },
                        currentState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: newChartConfig
                        },
                        toolSource: 'style-toggles',
                        changeDescription: `Labels ${newShowLabels ? 'shown' : 'hidden'}`
                    });
                }
            } catch (error) {
                console.warn('Failed to capture undo point for label toggle:', error);
            }
        }

        return {
            chartConfig: newChartConfig
        };
    }

    static toggleShowLegend(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartConfig: ExtendedChartOptions } {
        const currentDisplay = (state.chartConfig.plugins as any)?.legend?.display !== false;
        const newShowLegend = !currentDisplay;

        const newChartConfig = { ...state.chartConfig };
        if (!newChartConfig.plugins) newChartConfig.plugins = {};

        newChartConfig.plugins.legend = {
            ...(newChartConfig.plugins.legend || {}),
            display: newShowLegend
        };

        if (state.hasJSON) {
            try {
                if (!dependencies.shouldDebounceUndoOperation('manual_design_change', 'style-toggles')) {
                    dependencies.captureUndoPoint({
                        type: 'manual_design_change',
                        previousState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: state.chartConfig
                        },
                        currentState: {
                            chartType: state.chartType,
                            chartData: state.chartData,
                            chartConfig: newChartConfig
                        },
                        toolSource: 'style-toggles',
                        changeDescription: `Legend ${newShowLegend ? 'shown' : 'hidden'}`
                    });
                }
            } catch (error) {
                console.warn('Failed to capture undo point for legend toggle:', error);
            }
        }

        return { chartConfig: newChartConfig };
    }
}
