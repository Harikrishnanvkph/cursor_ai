import { ChartTypeRegistry } from 'chart.js';
import {
    SupportedChartType,
    ExtendedChartData,
    ExtendedChartDataset,
    CustomChartType,
    getDefaultConfigForType,
    ChartMode
} from '../chart-defaults';

// Helper types for the service
interface ChartTypeTransitionState {
    chartType: SupportedChartType;
    chartData: ExtendedChartData;
    chartConfig: any;
    chartMode: ChartMode;
    activeDatasetIndex: number;
    requestChartTypeChange: (targetType: SupportedChartType) => boolean;
    setChartType: (type: SupportedChartType) => void;
    updateChartConfig: (config: any) => void;
    hasJSON: boolean;
}

export const ChartTypeService = {
    /**
     * Determines if a chart type transition requires a setup screen
     * (e.g. switching between categorical and scatter/bubble charts)
     */
    shouldShowTransitionSetup: (
        currentType: SupportedChartType,
        targetType: SupportedChartType,
        datasets: ExtendedChartDataset[]
    ): { needed: boolean; direction?: 'toScatter' | 'toCategorical' } => {
        const categoricalTypes = ['bar', 'horizontalBar', 'stackedBar', 'line', 'area', 'pie', 'doughnut', 'polarArea', 'radar'];
        const scatterBubbleTypes = ['scatter', 'bubble'];
        const isCurrentCategorical = categoricalTypes.includes(currentType);
        const isCurrentScatterBubble = scatterBubbleTypes.includes(currentType);
        const isNewCategorical = categoricalTypes.includes(targetType);
        const isNewScatterBubble = scatterBubbleTypes.includes(targetType);

        // CASE 1: Categorical -> Scatter/Bubble
        if (isCurrentCategorical && isNewScatterBubble && datasets.length > 0) {
            const firstDataset = datasets[0];
            const hasCategorialData = firstDataset?.data?.length > 0 &&
                typeof firstDataset.data[0] === 'number';

            if (hasCategorialData) {
                return { needed: true, direction: 'toScatter' };
            }
        }

        // CASE 2: Scatter/Bubble -> Categorical
        if (isCurrentScatterBubble && isNewCategorical && datasets.length > 0) {
            const firstDataset = datasets[0];
            const hasCoordinateData = firstDataset?.data?.length > 0 &&
                typeof firstDataset.data[0] === 'object' &&
                firstDataset.data[0] !== null &&
                'x' in firstDataset.data[0];

            if (hasCoordinateData) {
                return { needed: true, direction: 'toCategorical' };
            }
        }

        return { needed: false };
    },

    /**
     * Determines the nature of a chart type change request.
     * Returns whether a transition setup is needed or if it's a direct change.
     */
    analyzeChangeRequest: (
        currentType: SupportedChartType,
        targetType: SupportedChartType,
        datasets: ExtendedChartDataset[]
    ): { type: 'TRANSITION_NEEDED'; direction: 'toScatter' | 'toCategorical' } | { type: 'PROCEED' } => {
        const result = ChartTypeService.shouldShowTransitionSetup(currentType, targetType, datasets);
        if (result.needed && result.direction) {
            return { type: 'TRANSITION_NEEDED', direction: result.direction };
        }
        return { type: 'PROCEED' };
    },

    /**
     * Helper to determine Legend Type based on Chart Type
     */
    getLegendType: (chartType: SupportedChartType): 'slice' | 'dataset' => {
        return (chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea')
            ? 'slice'
            : 'dataset';
    },
    /**
     * Core logic for switching chart types.
     * Handles dataset type conversion, config merging, and scale updates.
     */
    applyChartTypeChange: (
        currentType: SupportedChartType,
        targetType: SupportedChartType,
        currentState: {
            chartData: ExtendedChartData;
            chartConfig: any;
            chartMode: ChartMode;
            activeDatasetIndex: number;
            uniformityMode?: 'uniform' | 'mixed';
        }
    ) => {
        // Store the previous state for undo comparison (caller fits this into undo logic)
        // Only proceed if there's an actual change
        if (currentType === targetType) return null;

        const chartJsType = targetType === ('area' as CustomChartType) ? 'line' as const : targetType;

        // Auto-switch to uniform mode check
        const nonMixedModeCharts = ['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'];
        const shouldSwitchToUniform = currentState.chartMode === 'grouped' &&
            (currentState.uniformityMode === 'mixed' || currentState.chartConfig?.visualSettings?.uniformityMode === 'mixed') &&
            nonMixedModeCharts.includes(targetType);

        const isUniformNow = currentState.chartMode === 'single' ||
            currentState.uniformityMode === 'uniform' ||
            shouldSwitchToUniform;

        // 1. Transform Datasets
        const newDatasets = currentState.chartData.datasets.map((dataset, index) => {
            const newDataset = { ...dataset } as ExtendedChartDataset;

            // In Single Mode, ONLY update the Active Dataset.
            if (currentState.chartMode === 'single' && index !== currentState.activeDatasetIndex) {
                return newDataset;
            }

            // Set the Chart.js type
            if (targetType === 'horizontalBar') {
                newDataset.type = 'bar';
            } else if (targetType === ('area' as CustomChartType)) {
                newDataset.type = 'line';
            } else if (targetType === 'stackedBar') {
                newDataset.type = 'bar';
            } else {
                newDataset.type = targetType as keyof ChartTypeRegistry;
            }

            // Update stored type for single mode active dataset AND uniform mode grouped datasets
            if (isUniformNow || (currentState.chartMode === 'single' && index === currentState.activeDatasetIndex)) {
                newDataset.chartType = targetType;
            }

            // Apply default tensions
            if (targetType === 'line' || targetType === 'area') {
                if (newDataset.tension === undefined) newDataset.tension = 0.3;
            }
            if (targetType === 'radar') {
                newDataset.tension = 0;
                newDataset.fill = true; // Radar default: fill ON
            }

            // Apply fill property (for non-radar types)
            if (targetType === 'area') {
                newDataset.fill = 'origin';
            } else if (targetType !== 'radar') {
                newDataset.fill = false; // Explicitly turn off for non-area, non-radar
            }

            // Data transformation for scatter/bubble (random seed if needed)
            if (targetType === 'scatter' || targetType === 'bubble') {
                newDataset.data = dataset.data.map((point) => {
                    if (typeof point === 'number') {
                        return targetType === 'bubble'
                            ? { x: Math.random() * 100, y: point, r: 10 }
                            : { x: Math.random() * 100, y: point };
                    }
                    return point;
                });
            }

            // Reset image callout positions when chart type changes
            if (Array.isArray(newDataset.pointImageConfig)) {
                newDataset.pointImageConfig = newDataset.pointImageConfig.map(config => {
                    if (config) {
                        return {
                            ...config,
                            calloutX: undefined,
                            calloutY: undefined
                        };
                    }
                    return config;
                });
            }

            return newDataset;
        });

        // 2. Create New Configuration
        const prevDatalabels = (currentState.chartConfig.plugins as any)?.datalabels || {};
        const prevCustomLabelsConfig = (currentState.chartConfig.plugins as any)?.customLabelsConfig || {};

        let newConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(targetType)));

        // Preserve existing settings
        if ((currentState.chartConfig as any)?.background) {
            (newConfig as any).background = (currentState.chartConfig as any).background;
        }

        const prevPlugins = currentState.chartConfig.plugins || {};
        const pluginsToPreserve = ['title', 'subtitle', 'legend', 'tooltip'];

        newConfig.plugins = newConfig.plugins || {};
        pluginsToPreserve.forEach(pluginKey => {
            if (prevPlugins[pluginKey] !== undefined) {
                newConfig.plugins[pluginKey] = {
                    ...newConfig.plugins[pluginKey],
                    ...prevPlugins[pluginKey]
                };
            }
        });

        // Set legendType
        if (targetType === 'pie' || targetType === 'doughnut' || targetType === 'polarArea') {
            (newConfig.plugins as any).legendType = 'slice';
        } else {
            (newConfig.plugins as any).legendType = 'dataset';
        }

        // Preserve mobile responsiveness settings
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 576;
        if (isMobile) {
            const keysToPreserve = ['manualDimensions', 'dynamicDimension', 'responsive', 'width', 'height'];
            keysToPreserve.forEach(key => {
                if (key in currentState.chartConfig) {
                    newConfig[key] = currentState.chartConfig[key];
                }
            });
        }

        // Restore datalabels
        if ((newConfig.plugins as any)?.datalabels) {
            (newConfig.plugins as any).datalabels = {
                ...(newConfig.plugins as any).datalabels,
                ...prevDatalabels,
            };
        }
        (newConfig.plugins as any).customLabelsConfig = prevCustomLabelsConfig;

        // Radial Type Isolation Patch:
        // When switching between radar and polarArea, always use the target type's
        // default scales.r to prevent settings from leaking between the two types.
        if (targetType === 'radar') {
            const radarConfig = getDefaultConfigForType('radar');
            const currentType = currentState.chartType;
            const isFromRadialType = currentType === 'radar' || currentType === 'polarArea';
            // If coming from another radial type, always use fresh radar scales
            if (isFromRadialType) {
                newConfig = { ...radarConfig, ...newConfig, scales: radarConfig.scales };
            } else {
                newConfig = { ...radarConfig, ...newConfig, scales: { ...radarConfig.scales, ...(newConfig.scales || {}) } };
            }
        }

        if (targetType === 'polarArea') {
            const polarConfig = getDefaultConfigForType('polarArea');
            const currentType = currentState.chartType;
            const isFromRadialType = currentType === 'radar' || currentType === 'polarArea';
            // If coming from another radial type, always use fresh polar area scales
            if (isFromRadialType) {
                newConfig = { ...polarConfig, ...newConfig, scales: polarConfig.scales };
            }
        }

        // Ensure correct scales
        const axisTypes = ['bar', 'line', 'scatter', 'bubble', 'horizontalBar'];
        const noScalesTypes = ['pie', 'doughnut'];
        const radialScaleTypes = ['radar', 'polarArea'];

        if (axisTypes.includes(chartJsType)) {
            if (!newConfig.scales || !newConfig.scales.x || !newConfig.scales.y) {
                newConfig.scales = {
                    x: { display: true, ...((newConfig.scales && newConfig.scales.x) || {}) },
                    y: { display: true, ...((newConfig.scales && newConfig.scales.y) || {}) }
                };
            }
        } else if (noScalesTypes.includes(chartJsType)) {
            if (newConfig.scales) delete newConfig.scales;
        } else if (radialScaleTypes.includes(chartJsType)) {
            if (newConfig.scales) {
                const rScale = newConfig.scales.r;
                if (newConfig.scales.x) delete newConfig.scales.x;
                if (newConfig.scales.y) delete newConfig.scales.y;
                if (rScale) newConfig.scales = { r: rScale };
            }
        }

        if (shouldSwitchToUniform) {
            newConfig.visualSettings = {
                ...(newConfig.visualSettings || {}),
                uniformityMode: 'uniform'
            };
        }

        return {
            chartType: targetType,
            chartData: {
                ...currentState.chartData,
                datasets: newDatasets,
            },
            chartConfig: newConfig,
            ...(shouldSwitchToUniform ? { uniformityMode: 'uniform' as const } : {})
        };
    }
};
