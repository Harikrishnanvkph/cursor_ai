import { ChartGroup, SupportedChartType, ExtendedChartData } from '../chart-defaults';

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
    ) => {
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
            groupedModeData: ExtendedChartData;
        }
    ) => {
        if (id === 'default') return null; // Cannot delete default group

        const newGroups = currentState.groups.filter(g => g.id !== id);
        let newActiveId = currentState.activeGroupId;
        let newChartType = currentState.chartType;

        // If active group is deleted, switch to default or first available
        if (currentState.activeGroupId === id) {
            newActiveId = newGroups[0]?.id || 'default';

            // Sync chart type with the new active group
            const newActiveGroup = newGroups.find(g => g.id === newActiveId);
            if (newActiveGroup) {
                if (newActiveGroup.baseChartType) {
                    newChartType = newActiveGroup.baseChartType;
                } else if (currentState.groupedModeData.datasets) {
                    // If no base type, check for datasets in this specific group
                    const groupDatasets = currentState.groupedModeData.datasets.filter(d => d.groupId === newActiveId);
                    if (groupDatasets.length > 0 && groupDatasets[0].chartType) {
                        newChartType = groupDatasets[0].chartType;
                    }
                }
            }
        }

        return {
            groups: newGroups,
            activeGroupId: newActiveId,
            chartType: newChartType
        };
    },

    setActiveGroup: (
        id: string,
        currentState: {
            groups: ChartGroup[];
            chartType: SupportedChartType;
            chartConfig?: any;
        }
    ) => {
        const group = currentState.groups.find(g => g.id === id);
        let newChartType = currentState.chartType;

        if (group && group.baseChartType) {
            newChartType = group.baseChartType;
        }

        // Resolve active group's chartConfig (clone current but clear decorationShapes if group has no config)
        const currentConfig = currentState.chartConfig || {};
        const newConfig = group?.chartConfig
            ? JSON.parse(JSON.stringify(group.chartConfig))
            : { ...currentConfig, decorationShapes: [] };

        // Update the group's own chartConfig in the groups array so it's not undefined
        const updatedGroups = currentState.groups.map(g =>
            g.id === id ? { ...g, chartConfig: newConfig } : g
        );

        const result: any = {
            activeGroupId: id,
            chartType: newChartType,
            chartConfig: newConfig,
            groups: updatedGroups
        };

        return result;
    }
};
