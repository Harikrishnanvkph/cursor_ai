import {
    ExtendedChartData,
    ExtendedChartOptions,
    SupportedChartType,
    VisualSettings
} from "../chart-defaults"
import { ChartState } from "./chart-state-service"

// Simplified dependencies — undo is handled automatically by zundo middleware
type ShouldDebounceFn = (type: string, source: string) => boolean;

interface StyleServiceDependencies {
    shouldDebounceUndoOperation: ShouldDebounceFn;
}

export class ChartStyleService {
    static toggleFillArea(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartData: ExtendedChartData; chartConfig: ExtendedChartOptions } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: false, uniformityMode: 'uniform' as const };
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

        return {
            chartData: {
                ...state.chartData,
                datasets: newDatasets
            },
            chartConfig: newChartConfig
        };
    }

    static toggleFillPoints(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartData: ExtendedChartData; chartConfig: ExtendedChartOptions } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, fillPoints: true, showBorder: true, showImages: true, showLabels: false, uniformityMode: 'uniform' as const };
        const newFillPoints = currentSettings.fillPoints !== false ? false : true;

        const newChartConfig = {
            ...state.chartConfig,
            visualSettings: {
                ...currentSettings,
                fillPoints: newFillPoints
            }
        };

        return {
            chartData: state.chartData,
            chartConfig: newChartConfig
        };
    }

    static toggleShowBorder(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): Partial<ChartState> & { chartConfig?: ExtendedChartOptions, chartData?: ExtendedChartData } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: false, uniformityMode: 'uniform' as const };

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

        return {
            chartData: {
                ...state.chartData,
                datasets: newDatasets
            },
            chartConfig: newChartConfig
        };
    }

    static toggleShowImages(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartConfig: ExtendedChartOptions } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: false, uniformityMode: 'uniform' as const };
        const newShowImages = !currentSettings.showImages;

        const newChartConfig = {
            ...state.chartConfig,
            visualSettings: {
                ...currentSettings,
                showImages: newShowImages
            }
        };

        return { chartConfig: newChartConfig };
    }

    static toggleShowLabels(
        state: ChartState,
        dependencies: StyleServiceDependencies
    ): { chartConfig: ExtendedChartOptions } {
        const currentSettings = state.chartConfig.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: false, uniformityMode: 'uniform' as const };
        const currentDisplay = (state.chartConfig.plugins as any)?.customLabelsConfig?.display === true;
        const newShowLabels = !currentDisplay;

        const newChartConfig = {
            ...state.chartConfig,
            visualSettings: {
                ...currentSettings,
                showLabels: newShowLabels
            },
            plugins: {
                ...(state.chartConfig.plugins || {})
            }
        };

        newChartConfig.plugins.datalabels = {
            ...(newChartConfig.plugins.datalabels || {}),
            display: newShowLabels
        };

        newChartConfig.plugins.customLabelsConfig = {
            ...(newChartConfig.plugins.customLabelsConfig || {}),
            display: newShowLabels
        };

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

        const newChartConfig = { 
            ...state.chartConfig,
            plugins: {
                ...(state.chartConfig.plugins || {})
            }
        };

        newChartConfig.plugins.legend = {
            ...(newChartConfig.plugins.legend || {}),
            display: newShowLegend
        };

        return { chartConfig: newChartConfig };
    }
}
