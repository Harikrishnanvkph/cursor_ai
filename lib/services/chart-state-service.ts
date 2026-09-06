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
        let updatedSingleModeData = { ...state.singleModeData };
        let updatedGroupedModeData = { ...state.groupedModeData };
        let updatedGroups = [...(state.groups || [DEFAULT_GROUP])];

        // 1. Commit outgoing mode state
        if (state.chartMode === 'single') {
            const outgoingIdx = state.activeDatasetIndex;
            const currentConfig = state.chartConfig;
            const currentLabels = state.chartData.labels;

            const committedDatasets = (state.chartData.datasets || []).map((ds, i) => {
                if (i === outgoingIdx) {
                    return {
                        ...ds,
                        chartConfig: currentConfig ? JSON.parse(JSON.stringify(currentConfig)) : ds.chartConfig,
                        sliceLabels: currentLabels && currentLabels.length > 0 ? [...currentLabels] : ds.sliceLabels
                    };
                }
                return ds;
            });

            updatedSingleModeData = {
                ...state.chartData,
                datasets: committedDatasets
            };
        } else {
            // Outgoing was grouped mode: commit config to active group
            const currentConfig = state.chartConfig;
            if (currentConfig && state.activeGroupId) {
                updatedGroups = updatedGroups.map(g =>
                    g.id === state.activeGroupId
                        ? { ...g, chartConfig: JSON.parse(JSON.stringify(currentConfig)) }
                        : g
                );
            }
            updatedGroupedModeData = { ...state.chartData };
        }

        // 2. Resolve incoming mode state
        let targetModeData: ExtendedChartData;
        let newActiveDatasetIndex = 0;
        let newChartType: SupportedChartType = 'bar';
        let newConfig: ExtendedChartOptions;
        let newActiveGroupId = state.activeGroupId;

        if (mode === 'single') {
            targetModeData = JSON.parse(JSON.stringify(updatedSingleModeData));
            const lastSingleIndex = state.lastSingleModeActiveIndex ?? state.activeDatasetIndex ?? 0;
            if (targetModeData.datasets && targetModeData.datasets.length > lastSingleIndex) {
                newActiveDatasetIndex = lastSingleIndex;
            } else {
                newActiveDatasetIndex = 0;
            }

            const activeDs = targetModeData.datasets?.[newActiveDatasetIndex];
            newChartType = activeDs?.chartType || (activeDs?.type as SupportedChartType) || 'bar';

            newConfig = activeDs?.chartConfig
                ? JSON.parse(JSON.stringify(activeDs.chartConfig))
                : (() => {
                    const fresh = JSON.parse(JSON.stringify(getDefaultConfigForType(newChartType)));
                    fresh.decorationShapes = [];
                    return fresh;
                })();

            const resolvedLabels = (activeDs?.sliceLabels && activeDs.sliceLabels.length > 0)
                ? [...activeDs.sliceLabels]
                : (targetModeData.labels || []);
            targetModeData.labels = resolvedLabels;
        } else {
            // Switching to grouped mode
            targetModeData = JSON.parse(JSON.stringify(updatedGroupedModeData));
            const activeGroup = updatedGroups.find(g => g.id === state.activeGroupId) || updatedGroups[0];
            newActiveGroupId = activeGroup?.id || 'default';

            if (activeGroup && activeGroup.baseChartType) {
                newChartType = activeGroup.baseChartType;
            } else if (targetModeData.datasets) {
                const groupDatasets = targetModeData.datasets.filter(d => d.groupId === newActiveGroupId);
                if (groupDatasets.length > 0 && groupDatasets[0].chartType) {
                    newChartType = groupDatasets[0].chartType;
                }
            }

            newConfig = activeGroup?.chartConfig
                ? JSON.parse(JSON.stringify(activeGroup.chartConfig))
                : (() => {
                    const fresh = JSON.parse(JSON.stringify(getDefaultConfigForType(newChartType)));
                    fresh.decorationShapes = [];
                    return fresh;
                })();

            const groupDatasets = (targetModeData.datasets || []).filter(d => d.groupId === newActiveGroupId);
            const resolvedLabels = (groupDatasets.length > 0 && groupDatasets[0].sliceLabels && groupDatasets[0].sliceLabels.length > 0)
                ? [...groupDatasets[0].sliceLabels]
                : (targetModeData.labels || []);
            targetModeData.labels = resolvedLabels;
        }

        return {
            chartMode: mode,
            chartData: targetModeData,
            chartType: newChartType,
            chartConfig: newConfig,
            groups: updatedGroups,
            activeGroupId: newActiveGroupId,
            activeDatasetIndex: newActiveDatasetIndex,
            singleModeData: mode === 'single' ? targetModeData : updatedSingleModeData,
            groupedModeData: mode === 'grouped' ? targetModeData : updatedGroupedModeData,
            lastSingleModeActiveIndex: mode === 'single' ? newActiveDatasetIndex : state.lastSingleModeActiveIndex
        };
    }

    static resetChart(): Partial<ChartState> {
        // Create new config for bar chart
        let newConfig = getDefaultConfigForType('bar');

        // Preserve manual/responsive/dimension settings for mobile devices
        const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
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
                sourceTitle: (name !== undefined && name !== null && name.trim() !== "") ? name : (ds.sourceTitle || "Untitled Chart"),
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
            // When replacing an existing grouped chart (AI modification), reuse the current group ID
            // to update in-place instead of creating a duplicate group
            let tempGroupId: string;
            const hasExistingActiveGroup = replaceMode && state.activeGroupId && 
                state.groups.some(g => g.id === state.activeGroupId);

            if (hasExistingActiveGroup) {
                tempGroupId = state.activeGroupId!;
            } else {
                // Generate a new group ID only when there's no existing group to replace
                const cleanName = (name || chartType || 'load')
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .slice(0, 4)
                    .toLowerCase();
                const random = Math.random().toString(36).substr(2, 6);
                tempGroupId = `${cleanName}${random}`.slice(0, 10);
            }

            const coordinateTypes = ['scatter', 'bubble'];
            const firstDatasetChartType = processedDatasets[0]?.chartType || chartType;
            const category = coordinateTypes.includes(firstDatasetChartType) ? 'coordinate' : 'categorical';

            const displayName = (name !== undefined && name !== null && name.trim() !== '') ? name : (chartType ? `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Group` : 'Group');
            const savedUniformity = (chartConfig as any)?.visualSettings?.uniformityMode || 'uniform';
            const tempGroup: ChartGroup = {
                id: tempGroupId,
                name: displayName,
                category,
                uniformityMode: savedUniformity,
                baseChartType: (chartConfig as any)?.baseChartType || firstDatasetChartType || (chartType as SupportedChartType),
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
                // Update the existing group with new configuration
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
            
            // CRITICAL FIX: Before appending, save the CURRENT active config AND shared labels
            // into the outgoing active dataset so they aren't lost when we switch
            if (state.chartMode === 'single' && state.activeDatasetIndex >= 0 && state.activeDatasetIndex < existingDatasets.length) {
                const commitUpdates: any = {};
                if (state.chartData.labels && state.chartData.labels.length > 0) {
                    commitUpdates.sliceLabels = [...state.chartData.labels];
                }
                if (state.chartConfig) {
                    commitUpdates.chartConfig = JSON.parse(JSON.stringify(state.chartConfig));
                }
                if (Object.keys(commitUpdates).length > 0) {
                    existingDatasets[state.activeDatasetIndex] = {
                        ...existingDatasets[state.activeDatasetIndex],
                        ...commitUpdates
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

        // The newly loaded chart becomes the active chart, so its active config and title are the incoming ones
        const finalConfig = chartConfig ? JSON.parse(JSON.stringify(chartConfig)) : state.chartConfig;
        const finalTitle = (name !== undefined && name !== null && name.trim() !== '') ? name : (state.chartTitle || "Untitled Chart");

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
            originalCloudDimensions: id ? state.originalCloudDimensions : null,
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
