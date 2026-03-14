import { ExtendedChartDataset, ExtendedChartData, ChartGroup, SupportedChartType, getDefaultConfigForType, ChartMode } from '../chart-defaults';
import { generateColorPalette, darkenColor } from '../utils/color-utils';
import { getDefaultImageType, getDefaultImageSize, getDefaultImageConfig } from '../plugins/universal-image-plugin';
import { attemptCaptureDatasetUndo } from './undo-service';
import { areDatasetChangesMeaningful } from '../utils/dataset-utils';

export const DatasetService = {
    addDataset: (
        dataset: ExtendedChartDataset,
        currentState: {
            chartType: SupportedChartType;
            chartData: ExtendedChartData;
            groups: ChartGroup[];
            activeGroupId: string;
            chartMode: ChartMode;
            activeDatasetIndex: number;
            singleModeData: ExtendedChartData;
            groupedModeData: ExtendedChartData;
        }
    ) => {
        // For grouped mode, assign the dataset to the active group
        let finalDataset = { ...dataset };
        let updatedGroups = currentState.groups;
        let newChartType = currentState.chartType; // Track if we need to update global chartType

        if (currentState.chartMode === 'grouped') {
            finalDataset.groupId = currentState.activeGroupId;

            // If this is the first dataset in the group, set the group's category AND update global chartType
            const activeGroup = currentState.groups.find(g => g.id === currentState.activeGroupId);
            const datasetsInGroup = currentState.chartData.datasets.filter(d => d.groupId === currentState.activeGroupId);

            if (activeGroup && activeGroup.category === null && datasetsInGroup.length === 0) {
                // Determine category from dataset's chart type
                const coordinateTypes = ['scatter', 'bubble'];
                const datasetChartType = finalDataset.chartType || currentState.chartType;
                const category = coordinateTypes.includes(datasetChartType) ? 'coordinate' : 'categorical';

                updatedGroups = currentState.groups.map(g =>
                    g.id === currentState.activeGroupId
                        ? { ...g, category, baseChartType: datasetChartType }
                        : g
                );

                // Update global chartType to match the first dataset's type
                if (finalDataset.chartType) {
                    newChartType = finalDataset.chartType;
                }
            }
        }

        const newChartData = {
            ...currentState.chartData,
            datasets: [...currentState.chartData.datasets, finalDataset],
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = currentState.chartMode === 'single'
            ? { singleModeData: newChartData }
            : { groupedModeData: newChartData };

        // Single Mode Logic: Set new dataset as active and update chart type
        let newActiveDatasetIndex = currentState.activeDatasetIndex;
        if (currentState.chartMode === 'single') {
            newActiveDatasetIndex = newChartData.datasets.length - 1;
            if (finalDataset.chartType) {
                newChartType = finalDataset.chartType;
            }
        }

        return {
            chartType: newChartType,
            chartData: newChartData,
            groups: updatedGroups,
            activeDatasetIndex: newActiveDatasetIndex,
            ...modeDataUpdate,
            hasJSON: true,
        };
    },

    removeDataset: (
        index: number,
        currentState: {
            chartData: ExtendedChartData;
            groups: ChartGroup[];
            chartMode: ChartMode;
            singleModeData: ExtendedChartData;
            groupedModeData: ExtendedChartData;
        }
    ) => {
        const datasetToRemove = currentState.chartData.datasets[index];
        const groupId = datasetToRemove?.groupId;

        const newDatasets = currentState.chartData.datasets.filter((_, i) => i !== index);

        const newChartData = {
            ...currentState.chartData,
            datasets: newDatasets,
        };

        // Check if the group is now empty and reset its category
        let updatedGroups = currentState.groups;
        if (currentState.chartMode === 'grouped' && groupId) {
            const datasetsRemainingInGroup = newDatasets.filter(d => d.groupId === groupId);

            if (datasetsRemainingInGroup.length === 0) {
                // Group is empty, reset category so it can be re-determined later
                updatedGroups = currentState.groups.map(g =>
                    g.id === groupId
                        ? { ...g, category: null, baseChartType: undefined }
                        : g
                );
            }
        }

        // Update the appropriate mode-specific storage
        const modeDataUpdate = currentState.chartMode === 'single'
            ? { singleModeData: newChartData }
            : { groupedModeData: newChartData };

        return {
            chartData: newChartData,
            groups: updatedGroups,
            ...modeDataUpdate,
        };
    },

    updateDataset: (
        index: number,
        updates: Partial<ExtendedChartDataset> & { addPoint?: boolean; removePoint?: boolean; randomizeColors?: boolean; datasetColorMode?: string },
        currentState: {
            chartType: SupportedChartType;
            chartData: ExtendedChartData;
            chartConfig: any;
            chartMode: ChartMode;
            hasJSON: boolean;
            singleModeData: ExtendedChartData;
            groupedModeData: ExtendedChartData;
        }
    ) => {
        const dataset = currentState.chartData.datasets[index] as ExtendedChartDataset;
        if (!dataset) return null;

        // Store the previous state for undo comparison
        const previousState = {
            chartType: currentState.chartType,
            chartData: JSON.parse(JSON.stringify(currentState.chartData)),
            chartConfig: JSON.parse(JSON.stringify(currentState.chartConfig))
        };

        // Prevent adding/removing points in Grouped Mode
        if (currentState.chartMode === 'grouped' && currentState.chartData.datasets.length > 1 && (updates.addPoint || updates.removePoint)) {
            console.warn('Adding/removing points is not allowed in Grouped Mode to maintain dataset consistency');
            return null;
        }

        let updatedDataset = { ...dataset, ...updates } as ExtendedChartDataset;

        // Reset image callout positions when the dataset's chart type changes
        if ((updates.type && updates.type !== dataset.type) || (updates.chartType && updates.chartType !== dataset.chartType)) {
            if (Array.isArray(updatedDataset.pointImageConfig)) {
                updatedDataset.pointImageConfig = updatedDataset.pointImageConfig.map(config => {
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
        }

        let changeDescription = `Dataset ${index} updated`;

        // Add Point
        if (updates.addPoint) {
            updatedDataset.data = [...dataset.data, 0];
            const color = dataset.color || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) || generateColorPalette(1)[0];
            updatedDataset.backgroundColor = Array.isArray(dataset.backgroundColor)
                ? [...dataset.backgroundColor, color]
                : Array(dataset.data.length + 1).fill(color);
            updatedDataset.borderColor = Array.isArray(dataset.borderColor)
                ? [...dataset.borderColor, darkenColor(color, 20)]
                : Array(dataset.data.length + 1).fill(darkenColor(color, 20));
            updatedDataset.pointImages = [...(dataset.pointImages || []), null];
            updatedDataset.pointImageConfig = [
                ...(dataset.pointImageConfig || []),
                {
                    type: getDefaultImageType(currentState.chartType),
                    size: getDefaultImageSize(currentState.chartType),
                    position: "center",
                    arrow: false,
                },
            ];
            changeDescription = `Added point to dataset ${index}`;
        }
        // Remove Point
        if (updates.removePoint && dataset.data.length > 1) {
            updatedDataset.data = dataset.data.slice(0, -1);
            updatedDataset.backgroundColor = Array.isArray(dataset.backgroundColor)
                ? dataset.backgroundColor.slice(0, -1)
                : dataset.backgroundColor;
            updatedDataset.borderColor = Array.isArray(dataset.borderColor)
                ? dataset.borderColor.slice(0, -1)
                : dataset.borderColor;
            updatedDataset.pointImages = (dataset.pointImages || []).slice(0, -1);
            updatedDataset.pointImageConfig = (dataset.pointImageConfig || []).slice(0, -1);
            changeDescription = `Removed point from dataset ${index}`;
        }
        // Randomize Colors
        if (updates.randomizeColors) {
            const seed = Date.now() + Math.floor(Math.random() * 10000);
            const colors = generateColorPalette(dataset.data.length).map((c, i) => {
                return generateColorPalette(dataset.data.length)[(i + seed) % dataset.data.length];
            });
            updatedDataset.backgroundColor = colors;
            updatedDataset.borderColor = colors.map(c => darkenColor(c, 20));
            updatedDataset.lastSliceColors = colors;
            changeDescription = `Randomized colors for dataset ${index}`;
        }

        // Handle color mode changes
        if (updates.datasetColorMode) {
            if (updates.datasetColorMode === 'single') {
                if (Array.isArray(dataset.backgroundColor)) {
                    updatedDataset.lastSliceColors = [...dataset.backgroundColor];
                }
                const baseColor = dataset.color || (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : dataset.backgroundColor) || generateColorPalette(1)[0];
                updatedDataset.backgroundColor = Array(dataset.data.length).fill(baseColor);
                updatedDataset.borderColor = Array(dataset.data.length).fill(darkenColor(baseColor, 20));
            } else if (updates.datasetColorMode === 'slice') {
                const lastColors = (updatedDataset as any).lastSliceColors || dataset.lastSliceColors;
                const colors = lastColors && lastColors.length === dataset.data.length
                    ? lastColors
                    : generateColorPalette(dataset.data.length);
                updatedDataset.backgroundColor = colors;
                updatedDataset.borderColor = colors.map((color: string) => darkenColor(color, 20));
            }
        }

        // Explicit per-slice colors
        if (updates.backgroundColor && Array.isArray(updates.backgroundColor)) {
            const colors = updates.backgroundColor as string[];
            updatedDataset.backgroundColor = colors;
            if (!('borderColor' in updates)) {
                updatedDataset.borderColor = colors.map((c: string) => darkenColor(c, 20));
            }
            updatedDataset.lastSliceColors = colors;
            updatedDataset.datasetColorMode = 'slice';
        }

        // Explicit single color
        if (updates.color) {
            const baseColor = updates.color;
            updatedDataset.color = baseColor as any;
            if (updatedDataset.datasetColorMode === 'single') {
                updatedDataset.backgroundColor = Array(dataset.data.length).fill(baseColor);
                updatedDataset.borderColor = Array(dataset.data.length).fill(darkenColor(baseColor, 20));
            }
        }

        let newLabels = currentState.chartData.labels;
        // If points added/removed, update labels if needed (simple approximation)
        if (updates.addPoint) {
            newLabels = [...(currentState.chartData.labels || []), `Slice ${dataset.data.length + 1}`];
        } else if (updates.removePoint && dataset.data.length > 1) {
            newLabels = (currentState.chartData.labels || []).slice(0, -1);
        }

        const newDatasets = [...currentState.chartData.datasets];
        newDatasets[index] = updatedDataset;

        const newChartData = {
            ...currentState.chartData,
            labels: newLabels,
            datasets: newDatasets,
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = currentState.chartMode === 'single'
            ? { singleModeData: newChartData }
            : { groupedModeData: newChartData };

        const shouldSetHasJSON = (newChartData.labels?.length || 0) > 0 &&
            newChartData.datasets.length > 0 &&
            newChartData.datasets.some(d => d.data && d.data.length > 0);

        const newState = {
            chartData: newChartData,
            ...modeDataUpdate,
            hasJSON: shouldSetHasJSON || currentState.hasJSON,
        };

        // Undo capture
        if (currentState.hasJSON || shouldSetHasJSON) {
            const hasMeaningfulChanges = newDatasets.some((newDataset, idx) => {
                const previousDataset = currentState.chartData.datasets[idx];
                return areDatasetChangesMeaningful(previousDataset, newDataset);
            });

            if (hasMeaningfulChanges) {
                attemptCaptureDatasetUndo(currentState.hasJSON, previousState, { ...currentState, ...newState }, changeDescription);
            }
        }

        return newState;
    },

    updateDataPoint: (
        datasetIndex: number,
        pointIndex: number,
        field: string,
        value: any,
        currentState: {
            chartData: ExtendedChartData;
            chartMode: ChartMode;
            singleModeData: ExtendedChartData;
            groupedModeData: ExtendedChartData;
        }
    ) => {
        const newChartData = {
            ...currentState.chartData,
            datasets: currentState.chartData.datasets.map((dataset, i) =>
                i === datasetIndex
                    ? {
                        ...dataset,
                        data: dataset.data.map((point, j) =>
                            j === pointIndex
                                ? typeof point === 'object' && point !== null
                                    ? { ...point, [field]: value }
                                    : value
                                : point
                        ),
                    } as ExtendedChartDataset
                    : dataset
            ),
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = currentState.chartMode === 'single'
            ? { singleModeData: newChartData }
            : { groupedModeData: newChartData };

        return {
            chartData: newChartData,
            ...modeDataUpdate,
        };
    },

    updatePointImage: (
        datasetIndex: number,
        pointIndex: number,
        imageUrl: string,
        imageConfig: any,
        currentState: {
            chartData: ExtendedChartData;
            chartType: SupportedChartType;
            chartMode: ChartMode;
            singleModeData: ExtendedChartData;
            groupedModeData: ExtendedChartData
        }
    ) => {
        const dataset = currentState.chartData.datasets[datasetIndex];
        if (!dataset) return null;

        // Ensure arrays exist and are the correct length
        const dataLength = dataset.data.length;
        let pointImages = dataset.pointImages || [];
        let pointImageConfig = dataset.pointImageConfig || [];

        // Initialize arrays if they don't exist or are the wrong length
        if (pointImages.length !== dataLength) {
            pointImages = Array(dataLength).fill(null).map((_, idx) =>
                pointImages[idx] !== undefined ? pointImages[idx] : null
            );
        }

        if (pointImageConfig.length !== dataLength) {
            pointImageConfig = Array(dataLength).fill(null).map((_, idx) =>
                pointImageConfig[idx] || getDefaultImageConfig(currentState.chartType)
            );
        }

        // Update the specific point
        const updatedPointImages = [...pointImages];
        updatedPointImages[pointIndex] = imageUrl;

        const updatedPointImageConfig = [...pointImageConfig];
        updatedPointImageConfig[pointIndex] = {
            ...(updatedPointImageConfig[pointIndex] || getDefaultImageConfig(currentState.chartType)),
            ...imageConfig
        };

        const newChartData = {
            ...currentState.chartData,
            datasets: currentState.chartData.datasets.map((d, i) =>
                i === datasetIndex
                    ? {
                        ...d,
                        pointImages: updatedPointImages,
                        pointImageConfig: updatedPointImageConfig,
                    } as ExtendedChartDataset
                    : d
            ),
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = currentState.chartMode === 'single'
            ? { singleModeData: newChartData }
            : { groupedModeData: newChartData };

        return {
            chartData: newChartData,
            ...modeDataUpdate,
        };
    },

    updateLabels: (
        labels: string[],
        currentState: {
            chartData: ExtendedChartData;
            chartMode: ChartMode;
            singleModeData: ExtendedChartData;
            groupedModeData: ExtendedChartData;
            hasJSON: boolean;
        }
    ) => {
        const newChartData = {
            ...currentState.chartData,
            labels,
            // Also update sliceLabels in all datasets to match the new labels
            datasets: currentState.chartData.datasets.map(dataset => ({
                ...dataset,
                sliceLabels: labels // Update sliceLabels to match the new labels
            }))
        };

        // Update the appropriate mode-specific storage
        const modeDataUpdate = currentState.chartMode === 'single'
            ? { singleModeData: newChartData }
            : { groupedModeData: newChartData };

        // Set hasJSON to true if we have both labels and datasets with data
        const shouldSetHasJSON = labels.length > 0 &&
            newChartData.datasets.length > 0 &&
            newChartData.datasets.some(d => d.data && d.data.length > 0);

        return {
            chartData: newChartData,
            ...modeDataUpdate,
            hasJSON: shouldSetHasJSON || currentState.hasJSON,
        };
    }
};
