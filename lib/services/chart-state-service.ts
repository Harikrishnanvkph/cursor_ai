import {
    ExtendedChartData,
    ChartMode,
    ChartGroup,
    SupportedChartType,
    ExtendedChartOptions,
    DEFAULT_GROUP,
    singleModeDefaultData,
    groupedModeDefaultData,
    getDefaultConfigForType,
    CustomChartType
} from "../chart-defaults"


// Define the shape of the store state needed by this service
export interface ChartState {
    chartType: SupportedChartType
    chartData: ExtendedChartData
    chartConfig: ExtendedChartOptions
    chartMode: ChartMode
    activeDatasetIndex: number
    lastSingleModeActiveIndex?: number
    singleModeData: ExtendedChartData
    groupedModeData: ExtendedChartData
    groups: ChartGroup[]
    activeGroupId: string
    chartTitle: string | null
    currentSnapshotId: string | null
    hasJSON: boolean
    originalCloudDimensions: { width: string; height: string } | null
    datasetBackups: Map<number, { labels: string[], data: any[], backgroundColor: any, borderColor: any, pointImages: any[], pointImageConfig: any[] }>
    legendFilter: { datasets: Record<number, boolean>; slices: Record<number, boolean> }
}

export class ChartStateService {
    static setChartMode(
        mode: ChartMode,
        state: ChartState
    ): Partial<ChartState> {
        // NOTE: Clearing backendConversationId is handled by the store action
        // that calls this service. This service stays purely functional.

        // Save current mode's data before switching
        const currentModeData = state.chartData;

        // Persist single mode index if currently in single mode
        const lastSingleIndex = state.chartMode === 'single'
            ? state.activeDatasetIndex
            : state.lastSingleModeActiveIndex;

        // Define backup updates
        const backupUpdates = state.chartMode === 'single'
            ? { singleModeData: currentModeData, lastSingleModeActiveIndex: lastSingleIndex }
            : { groupedModeData: currentModeData };

        // Get the data for the target mode (either saved data or default)
        let targetModeData: ExtendedChartData;
        if (mode === 'single') {
            targetModeData = state.singleModeData;
        } else {
            targetModeData = state.groupedModeData;
        }

        // Determine new active dataset index
        let newActiveDatasetIndex = 0;
        if (mode === 'single') {
            // Restore last active index if valid
            if (lastSingleIndex !== undefined && targetModeData.datasets.length > lastSingleIndex) {
                newActiveDatasetIndex = lastSingleIndex;
            }
        }

        // Infer Chart Type
        let newChartType = state.chartType;

        if (mode === 'grouped') {
            // In Grouped Mode, we MUST prioritize the active group's chart type
            const activeGroup = state.groups.find(g => g.id === state.activeGroupId);

            if (activeGroup && activeGroup.baseChartType) {
                // 1. Prefer Active Group's base type
                newChartType = activeGroup.baseChartType;
            } else if (activeGroup && targetModeData.datasets) {
                // 2. If no base type, look for datasets in this specific group
                const groupDatasets = targetModeData.datasets.filter(d => d.groupId === state.activeGroupId);
                if (groupDatasets.length > 0 && groupDatasets[0].chartType) {
                    newChartType = groupDatasets[0].chartType;
                } else if (targetModeData.datasets.length > 0) {
                    // 3. Fallback to first dataset in list
                    newChartType = targetModeData.datasets[0].chartType || 'bar';
                }
            }
        } else {
            // Single Mode: Use the restored active dataset's type
            if (targetModeData.datasets && targetModeData.datasets.length > 0) {
                newChartType = targetModeData.datasets[newActiveDatasetIndex].chartType || 'bar';
            } else {
                newChartType = 'bar';
            }
        }

        // Resolve the config for the target mode
        let newConfig = state.chartConfig;
        if (mode === 'single') {
            // Use the active dataset's config if available
            const activeDs = targetModeData.datasets?.[newActiveDatasetIndex];
            if (activeDs?.chartConfig) {
                newConfig = activeDs.chartConfig;
            }
        } else {
            // Use the active group's config if available
            const activeGroup = state.groups.find(g => g.id === state.activeGroupId);
            if (activeGroup?.chartConfig) {
                newConfig = activeGroup.chartConfig;
            }
        }

        return {
            chartMode: mode,
            chartData: targetModeData,
            chartType: newChartType,
            chartConfig: newConfig,
            activeDatasetIndex: newActiveDatasetIndex,
            // Update the mode-specific storage
            ...backupUpdates,
            ...(mode === 'single' ? { singleModeData: targetModeData } : { groupedModeData: targetModeData }),
        } as Partial<ChartState>;
    }

    static resetChart(): Partial<ChartState> {
        // Create new config for bar chart
        let newConfig = getDefaultConfigForType('bar');

        // Preserve manual/responsive/dimension settings for mobile devices
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 576;
        if (isMobile) {
            // Note: We can't access current state config here easily without passing state,
            // but typically resets clear everything. 
            // If preservation is critical, we should pass state. 
            // For now, standard reset behavior (clearing manual dimensions) is acceptable for a full reset.
        }

        return {
            chartType: 'bar',
            chartData: singleModeDefaultData(), // Default to single mode data
            chartConfig: newConfig,

            // Full Reset of All Modes
            singleModeData: singleModeDefaultData(),
            groupedModeData: groupedModeDefaultData(),

            // Reset Grouping
            groups: [DEFAULT_GROUP],
            activeGroupId: 'default',

            // Reset UI State
            chartMode: 'single',
            chartTitle: null, // Clear title
            activeDatasetIndex: 0,

            hasJSON: false,
            currentSnapshotId: null,
            originalCloudDimensions: null,


        } as any;
    }

    static setFullChart(
        params: {
            chartType: SupportedChartType;
            chartData: ExtendedChartData;
            chartConfig: ExtendedChartOptions;
            id?: string;
            name?: string;
            conversationId?: string;
            replaceMode?: boolean
        },
        state: ChartState
    ): Partial<ChartState> {
        const { chartType, chartData, chartConfig, id, name, conversationId, replaceMode = false } = params;

        // Process datasets to ensure they have mode property set
        const datasetCount = chartData?.datasets?.length || 0;
        let processedDatasets = chartData?.datasets?.map((ds: any) => {
            // Determine inferred mode if not set
            const inferredMode = datasetCount > 1 ? 'grouped' : 'single';

            return {
                ...ds,
                mode: ds.mode || inferredMode,
                chartType: ds.chartType || chartType,
                // Backfill per-dataset chartConfig from top-level config if not present
                chartConfig: ds.chartConfig || JSON.parse(JSON.stringify(chartConfig)),
                // Assign source title if provided
                sourceTitle: ds.sourceTitle || name,
                // Assign source ID if provided
                sourceId: ds.sourceId || conversationId || id,
                // Ensure the dataset owns its labels so they aren't lost
                sliceLabels: ds.sliceLabels && ds.sliceLabels.length > 0 
                    ? ds.sliceLabels 
                    : (chartData.labels ? [...chartData.labels] : [])
            };
        }) || [];

        // Create a temporary group for loaded grouped datasets
        let updatedGroups = state.groups;
        let newActiveGroupId = state.activeGroupId;

        const hasGroupedDatasets = processedDatasets.some((ds: any) => ds.mode === 'grouped');

        if (hasGroupedDatasets && datasetCount > 0) {
            // Generate temp group ID
            const cleanName = (name || chartType || 'load')
                .replace(/[^a-zA-Z0-9]/g, '')
                .slice(0, 4)
                .toLowerCase();
            const random = Math.random().toString(36).substr(2, 6);
            const tempGroupId = `${cleanName}${random}`.slice(0, 10);

            const coordinateTypes = ['scatter', 'bubble'];
            const firstDatasetChartType = processedDatasets[0]?.chartType || chartType;
            const category = coordinateTypes.includes(firstDatasetChartType) ? 'coordinate' : 'categorical';

            const displayName = name || `Loaded: ${chartType || 'Chart'}`;
            const tempGroup: ChartGroup = {
                id: tempGroupId,
                name: displayName,
                category,
                uniformityMode: 'uniform',
                baseChartType: chartType as SupportedChartType,
                isDefault: false,
                createdAt: Date.now(),
                sourceId: conversationId || id,
                sourceTitle: name,
                chartConfig: JSON.parse(JSON.stringify(chartConfig)) // Per-group config
            };

            const groupExists = state.groups.some(g => g.id === tempGroupId);
            if (!groupExists) {
                updatedGroups = [...state.groups, tempGroup];
            } else {
                // If replacing an existing group (like 'default'), update it with the new configuration
                updatedGroups = state.groups.map(g => 
                    g.id === tempGroupId ? { ...g, ...tempGroup } : g
                );
            }

            processedDatasets = processedDatasets.map((ds: any) => {
                if (ds.mode === 'grouped') {
                    return { ...ds, groupId: tempGroupId };
                }
                return ds;
            });

            newActiveGroupId = tempGroupId;

            if (!replaceMode) {
                const existingDatasetsFromOtherGroups = state.chartData.datasets.filter(ds =>
                    ds.groupId !== tempGroupId
                );
                processedDatasets = [...existingDatasetsFromOtherGroups, ...processedDatasets];
            }
        } else if (datasetCount > 0 && !replaceMode) {
            let existingDatasets = [...state.chartData.datasets];
            
            // CRITICAL FIX: Before appending, save the CURRENT shared labels into the outgoing 
            // active dataset's sliceLabels so that it doesn't lose its labels when we switch
            if (state.chartMode === 'single' && state.activeDatasetIndex >= 0 && state.activeDatasetIndex < existingDatasets.length) {
                if (state.chartData.labels && state.chartData.labels.length > 0) {
                     existingDatasets[state.activeDatasetIndex] = {
                         ...existingDatasets[state.activeDatasetIndex],
                         sliceLabels: [...state.chartData.labels]
                     };
                }
            }
            processedDatasets = [...existingDatasets, ...processedDatasets];
        }

        const isAppending = !replaceMode && state.chartData.datasets.length > 0;
        
        // Since the new dataset becomes the active dataset, the shared labels 
        // must match the incoming dataset's labels.
        const finalLabels = chartData.labels && chartData.labels.length > 0 
            ? chartData.labels 
            : state.chartData.labels;

        const processedChartData = {
            ...(isAppending ? state.chartData : chartData),
            labels: finalLabels,
            datasets: processedDatasets
        };

        const hasSingleDatasets = processedDatasets.some((ds: any) => ds.mode === 'single');

        let newMode = state.chartMode;
        let newSingleModeData = state.singleModeData;
        let newGroupedModeData = state.groupedModeData;

        const totalDatasetCount = processedDatasets.length;

        if (hasGroupedDatasets && !hasSingleDatasets) {
            newMode = 'grouped';
            newGroupedModeData = processedChartData;
        } else if (hasSingleDatasets && !hasGroupedDatasets) {
            newMode = 'single';
            newSingleModeData = processedChartData;
        } else if (hasGroupedDatasets && hasSingleDatasets) {
            newMode = 'grouped';
            newGroupedModeData = processedChartData;
            newSingleModeData = processedChartData;
        } else {
            if (totalDatasetCount > 1) {
                if (state.chartMode === 'grouped') {
                    newMode = 'grouped';
                    newGroupedModeData = processedChartData;
                } else {
                    newMode = 'single';
                    newSingleModeData = processedChartData;
                }
            } else {
                newMode = 'single';
                newSingleModeData = processedChartData;
            }
        }

        // Keep the new configuration and title for the active chart
        const finalConfig = isAppending ? state.chartConfig : (chartConfig || state.chartConfig);
        const finalTitle = isAppending ? state.chartTitle : (name || state.chartTitle);

        return {
            chartType,
            chartData: processedDatasets.length ? processedChartData : chartData,
            chartConfig: finalConfig,
            chartMode: newMode,
            singleModeData: newSingleModeData,
            groupedModeData: newGroupedModeData,
            groups: updatedGroups,
            activeGroupId: newActiveGroupId,
            activeDatasetIndex: Math.max(0, processedDatasets.length - datasetCount),
            currentSnapshotId: id !== undefined ? id || null : state.currentSnapshotId,
            chartTitle: finalTitle,
            // Also return other properties that might be needed
        };
    }


    static setChartTitle(title: string | null, state: ChartState): Partial<ChartState> {
        // If in Single Mode, update the active dataset's sourceTitle
        if (state.chartMode === 'single') {
            const datasets = state.chartData.datasets.map((ds, i) => {
                if (i === state.activeDatasetIndex) {
                    return { ...ds, sourceTitle: title || undefined };
                }
                return ds;
            });

            // Also update singleModeData if we are in single mode
            const singleModeData = { ...state.chartData, datasets };

            // Also update chartTitle to keep in sync if it's the only one
            return {
                chartTitle: title,
                chartData: singleModeData,
                singleModeData: singleModeData
            };
        }
        // If in Grouped Mode, update the active Group name
        if (state.chartMode === 'grouped' && state.activeGroupId) {
            const groups = state.groups.map(g => {
                if (g.id === state.activeGroupId) {
                    return { ...g, name: title || g.name, sourceTitle: title || undefined };
                }
                return g;
            });
            return { chartTitle: title, groups };
        }

        // Single Mode fallback (already handled above) or default
        return { chartTitle: title };
    }

    static toggleDatasetVisibility(index: number, state: ChartState & { legendFilter: { datasets: Record<number, boolean>; slices: Record<number, boolean> } }): Partial<ChartState> {
        const current = (state.legendFilter.datasets as Record<number, boolean>)[index] ?? true;
        return { legendFilter: { ...state.legendFilter, datasets: { ...state.legendFilter.datasets, [index]: !current } } };
    }

    static toggleSliceVisibility(index: number, state: ChartState & { legendFilter: { datasets: Record<number, boolean>; slices: Record<number, boolean> } }): Partial<ChartState> {
        const current = (state.legendFilter.slices as Record<number, boolean>)[index] ?? true;
        return { legendFilter: { ...state.legendFilter, slices: { ...state.legendFilter.slices, [index]: !current } } };
    }
}
