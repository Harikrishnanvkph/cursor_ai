import { ChartGroup, SupportedChartType, ExtendedChartData, getDefaultConfigForType } from '../chart-defaults';

export const GroupService = {
    addGroup: (
        groupData: Omit<ChartGroup, 'id' | 'createdAt'>,
        currentState: {
            groups: ChartGroup[];
        }
    ): { id: string; newState: { groups: ChartGroup[]; activeGroupId: string } } => {
        const id = Math.random().toString(36).substr(2, 9);
        const newGroup = { ...groupData, id, createdAt: Date.now() } as ChartGroup;
        return {
            id,
            newState: {
                groups: [...currentState.groups, newGroup],
                activeGroupId: id
            }
        };
    },

    updateGroup: (
        id: string,
        updates: Partial<ChartGroup>,
        currentState: {
            groups: ChartGroup[];
        }
    ): { groups: ChartGroup[] } => {
        return {
            groups: currentState.groups.map(g => g.id === id ? { ...g, ...updates } : g)
        };
    },

    deleteGroup: (
        id: string,
        currentState: {
            groups: ChartGroup[];
            activeGroupId: string;
            chartType: SupportedChartType;
            chartData?: ExtendedChartData;
            groupedModeData?: ExtendedChartData;
        }
    ): {
        groups: ChartGroup[];
        activeGroupId: string;
        chartType: SupportedChartType;
        chartConfig?: any;
        chartTitle?: string | null;
        currentSnapshotId?: string | null;
    } | null => {
        if (id === 'default') return null; // Cannot delete default group

        const newGroups = currentState.groups.filter(g => g.id !== id);
        let newActiveId = currentState.activeGroupId;
        let newChartType = currentState.chartType;
        const result: any = {
            groups: newGroups,
            activeGroupId: newActiveId,
            chartType: newChartType
        };

        // If active group is deleted, switch to default or first available and sync its state
        if (currentState.activeGroupId === id) {
            newActiveId = newGroups.length > 0 ? newGroups[0].id : 'default';
            const activeGroup = newGroups.find(g => g.id === newActiveId);
            if (activeGroup && activeGroup.baseChartType) {
                newChartType = activeGroup.baseChartType;
            } else {
                const allDatasets = currentState.chartData?.datasets || currentState.groupedModeData?.datasets || [];
                if (allDatasets.length > 0) {
                    const groupDatasets = allDatasets.filter(ds => ds.groupId === newActiveId);
                    if (groupDatasets.length > 0 && groupDatasets[0].chartType) {
                        newChartType = groupDatasets[0].chartType;
                    }
                }
            }

            result.activeGroupId = newActiveId;
            result.chartType = newChartType;
            result.chartTitle = activeGroup?.name || activeGroup?.sourceTitle || null;
            result.currentSnapshotId = activeGroup?.sourceSnapshotId || null;
            result.originalCloudDimensions = activeGroup?.sourceId && activeGroup?.chartConfig?.width && activeGroup?.chartConfig?.height
                ? { width: String(activeGroup.chartConfig.width), height: String(activeGroup.chartConfig.height) }
                : null;
            if (activeGroup?.chartConfig) {
                result.chartConfig = JSON.parse(JSON.stringify(activeGroup.chartConfig));
            }
        }

        return result;
    },

    setActiveGroup: (
        id: string,
        currentState: {
            groups: ChartGroup[];
            activeGroupId: string;
            chartType: SupportedChartType;
            chartConfig?: any;
            chartData?: ExtendedChartData;
            groupedModeData?: ExtendedChartData;
            chartTitle?: string | null;
            currentSnapshotId?: string | null;
        }
    ) => {
        const outgoingGroupId = currentState.activeGroupId;
        const currentConfig = currentState.chartConfig;

        // 1. Commit outgoing group's chartConfig (and snapshot reference)
        let updatedGroups = currentState.groups.map(g => {
            if (g.id === outgoingGroupId && g.id !== id && currentConfig) {
                return {
                    ...g,
                    chartConfig: JSON.parse(JSON.stringify(currentConfig)),
                    sourceSnapshotId: g.sourceSnapshotId || (g.sourceId && currentState.currentSnapshotId ? currentState.currentSnapshotId : undefined)
                };
            }
            return g;
        });

        // 2. Resolve incoming group and its isolated config
        const incomingGroup = updatedGroups.find(g => g.id === id);
        let newChartType = currentState.chartType;

        if (incomingGroup && incomingGroup.baseChartType) {
            newChartType = incomingGroup.baseChartType;
        }

        const newConfig = incomingGroup?.chartConfig
            ? JSON.parse(JSON.stringify(incomingGroup.chartConfig))
            : (() => {
                const freshConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(newChartType)));
                freshConfig.decorationShapes = [];
                return freshConfig;
            })();

        // 3. Update incoming group in groups array
        updatedGroups = updatedGroups.map(g =>
            g.id === id ? { ...g, chartConfig: newConfig } : g
        );

        // 4. Resolve labels for incoming group's datasets
        const allDatasets = currentState.chartData?.datasets || currentState.groupedModeData?.datasets || [];
        const groupDatasets = allDatasets.filter(ds => ds.groupId === id);
        const newLabels = (groupDatasets.length > 0 && groupDatasets[0].sliceLabels && groupDatasets[0].sliceLabels.length > 0)
            ? [...groupDatasets[0].sliceLabels]
            : (currentState.chartData?.labels || []);

        const outgoingGroup = currentState.groups.find(g => g.id === outgoingGroupId);
        const resolvedSnapshotId = incomingGroup?.sourceSnapshotId
            || (incomingGroup?.sourceId && incomingGroup.sourceId === outgoingGroup?.sourceId ? currentState.currentSnapshotId : null)
            || null;
        const resolvedCloudDims = incomingGroup?.sourceId && newConfig?.width && newConfig?.height
            ? { width: String(newConfig.width), height: String(newConfig.height) }
            : null;

        const result: any = {
            activeGroupId: id,
            chartType: newChartType,
            chartConfig: newConfig,
            groups: updatedGroups,
            chartTitle: incomingGroup?.name || incomingGroup?.sourceTitle || null,
            currentSnapshotId: resolvedSnapshotId,
            originalCloudDimensions: resolvedCloudDims,
        };

        if (currentState.chartData) {
            const newChartData = { ...currentState.chartData, labels: newLabels };
            result.chartData = newChartData;
            result.groupedModeData = newChartData;
        }

        return result;
    }
};
