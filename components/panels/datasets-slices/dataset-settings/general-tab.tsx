"use client"
import { useState, useEffect, useRef, useMemo } from "react"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useChartStore, type ExtendedChartDataset } from "@/lib/chart-store"
import {
    Plus,
    Trash2,
    Layers,
    BarChart2,
    Pencil,
    BarChart3,
    PieChart,
    LineChart,
    ScatterChart,
    Radar,
    Activity,
    CircleDot,
    ChartBarDecreasing,
    LifeBuoy,
    ChartArea,
    ChartColumnStacked,
    Info,
    ChevronRight,
} from "lucide-react"
import { ChartSetupDialog, type ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { getEffectiveChartTitle, saveChartTitle } from "@/lib/hooks/use-chart-rename"
import { toast } from "sonner"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"


interface GeneralTabProps {
    chartMode: string
    chartType: string

    groups: any[]
    activeGroupId: string
    activeDatasetIndex: number
    chartData: any
    chartConfig: any
    filteredDatasets: ExtendedChartDataset[]
    datasetsDropdownOpen: boolean
    showAddDatasetModal: boolean
    isEditModeModal?: boolean
    setDatasetsDropdownOpen: (open: boolean) => void
    setShowAddDatasetModal: (open: boolean) => void
    setIsEditModeModal?: (edit: boolean) => void
    handleChartModeChange: (mode: 'single' | 'grouped') => void

    handleActiveGroupChange: (groupId: string) => void
    handleActiveDatasetChange: (index: number) => void
    handleOpenAddDatasetModal: () => void
    handleDatasetTileClick: (index: number) => void
    handleDeleteClick: (index: number) => void
    addGroup: (opts: any) => void
    updateGroup: (id: string, updates: any) => void
    setGroupToDelete: (id: string | null) => void
    setShowGroupDeleteDialog: (show: boolean) => void
    addDataset: (dataset: ExtendedChartDataset) => void
    updateChartConfig: (config: any) => void
}

export function GeneralTab({
    chartMode,
    chartType,

    groups,
    activeGroupId,
    activeDatasetIndex,
    chartData,
    chartConfig,
    filteredDatasets,
    datasetsDropdownOpen,
    showAddDatasetModal,
    isEditModeModal = false,
    setDatasetsDropdownOpen,
    setShowAddDatasetModal,
    setIsEditModeModal,
    handleChartModeChange,

    handleActiveGroupChange,
    handleActiveDatasetChange,
    handleOpenAddDatasetModal,
    handleDatasetTileClick,
    handleDeleteClick,
    addGroup,
    updateGroup,
    setGroupToDelete,
    setShowGroupDeleteDialog,
    addDataset,
    updateChartConfig,
}: GeneralTabProps) {
    const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
    const datasetsContainerRef = useRef<HTMLDivElement>(null);

    const handleFocusActiveDataset = () => {
        if (!datasetsDropdownOpen) {
            setDatasetsDropdownOpen(true);
            setTimeout(scrollToActive, 100);
        } else {
            scrollToActive();
        }
    };

    const scrollToActive = () => {
        const activeTile = datasetsContainerRef.current?.querySelector('[data-active="true"]');
        if (activeTile) {
            activeTile.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest'
            });
        } else {
            toast.info("Active dataset not found in the list");
        }
    };

    const activeFilteredIndex = filteredDatasets.findIndex(ds =>
        chartData.datasets.indexOf(ds) === activeDatasetIndex
    );
    const activeDs = filteredDatasets[activeFilteredIndex];
    const activeDatasetName = activeDs
        ? (chartMode === 'single'
            ? (activeDs.sourceTitle || activeDs.label || `Dataset ${activeFilteredIndex + 1}`)
            : (activeDs.label || activeDs.sourceTitle || `Dataset ${activeFilteredIndex + 1}`))
        : 'None';

    const memoizedDimensions = useMemo(() => ({
        width: parseFloat(chartConfig?.width || '800'),
        height: parseFloat(chartConfig?.height || '600'),
        isResponsive: !!chartConfig?.responsive
    }), [chartConfig?.width, chartConfig?.height, chartConfig?.responsive]);

    const memoizedExistingDatasets = useMemo(() => {
        if (!isEditModeModal && (isCreatingNewGroup || chartMode !== 'grouped')) {
            return undefined;
        }
        if (isEditModeModal && chartMode === 'single') {
            const currentTarget = chartData.datasets[activeDatasetIndex] || filteredDatasets[0];
            if (!currentTarget) return undefined;
            return [{
                ...currentTarget,
                sliceLabels: currentTarget.sliceLabels || chartData.labels || []
            }];
        }
        return filteredDatasets.map(ds => ({
            ...ds,
            sliceLabels: ds.sliceLabels || chartData.labels || []
        }));
    }, [isEditModeModal, isCreatingNewGroup, chartMode, filteredDatasets, activeDatasetIndex, chartData.datasets, chartData.labels]);

    return (
        <div className="space-y-4">
            {/* Chart Mode Section */}
            <div>
                <div className="font-semibold text-xs mb-2">Chart Mode</div>
                <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 shadow-sm">
                    <label className={`flex items-center gap-2 cursor-pointer transition-colors text-xs ${chartMode === 'single' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                        <input
                            type="radio"
                            className="accent-blue-600"
                            checked={chartMode === 'single'}
                            onChange={() => handleChartModeChange('single')}
                        />
                        <BarChart2 className="h-4 w-4" />
                        Single
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer transition-colors text-xs ${chartMode === 'grouped' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                        <input
                            type="radio"
                            className="accent-blue-600"
                            checked={chartMode === 'grouped'}
                            onChange={() => handleChartModeChange('grouped')}
                        />
                        <Layers className="h-4 w-4" />
                        Grouped
                    </label>
                </div>
            </div>

            {/* Groups Section - Only for Grouped Mode */}
            {chartMode === 'grouped' && (
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <div className="font-semibold text-xs text-gray-900">Groups</div>
                            <span className="bg-blue-50 text-blue-600 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-blue-100 shadow-sm">
                                {groups.length}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => {
                                setIsCreatingNewGroup(true);
                                setShowAddDatasetModal(true);
                            }}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            New Group
                        </Button>
                    </div>
                    <Select value={activeGroupId} onValueChange={handleActiveGroupChange}>
                        <SelectTrigger className="w-full h-9 text-xs">
                            <SelectValue placeholder="Select a group" />
                        </SelectTrigger>
                        <SelectContent>
                            {groups.map((group) => (
                                <SelectItem key={group.id} value={group.id}>
                                    <div className="flex items-center gap-2">
                                        <span title={group.name}>{group.name.length > 20 ? `${group.name.slice(0, 20)}...` : group.name}</span>
                                        {group.isDefault && (
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Default</span>
                                        )}
                                        {group.category && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${group.category === 'coordinate' ? 'bg-blue-100 text-blue-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {group.category === 'coordinate' ? 'Coord' : 'Categ'}
                                            </span>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* Active Group Info */}
                    {(() => {
                        const activeGroup = groups.find((g: any) => g.id === activeGroupId);
                        if (!activeGroup) return null;
                        return (
                            <div className="mt-2 p-2 bg-gray-50 rounded-md border border-gray-100 text-xs text-gray-600">
                                <div className="flex items-center justify-between">
                                    <span>
                                        {activeGroup.category
                                            ? `${activeGroup.category === 'coordinate' ? 'Coordinate' : 'Categorical'} • ${activeGroup.uniformityMode}`
                                            : 'Category will be set when first dataset is added'}
                                    </span>
                                    {!activeGroup.isDefault && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1.5 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => {
                                                setGroupToDelete(activeGroup.id);
                                                setShowGroupDeleteDialog(true);
                                            }}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}


            {/* Datasets List Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between bg-blue-50/70 p-2.5 rounded-t-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <Label className="text-xs font-semibold text-gray-800 tracking-wide">Datasets</Label>
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                            {filteredDatasets.length}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleOpenAddDatasetModal}
                            className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-100/50 bg-white font-medium shadow-2xs transition-all active:scale-95"
                        >
                            <Plus className="h-3.5 w-3.5 mr-1 text-blue-600" />
                            Add
                        </Button>

                        <div
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer transition-colors"
                            onClick={() => setDatasetsDropdownOpen(!datasetsDropdownOpen)}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transform transition-transform duration-200 ${datasetsDropdownOpen ? 'rotate-180' : ''}`}
                            >
                                <path d="M6 9L12 15L18 9" />
                            </svg>
                        </div>
                    </div>
                </div>

                {datasetsDropdownOpen && (
                    <div className="bg-blue-50/50 rounded-b-lg p-3 space-y-2 border-x border-b border-blue-100">
                        {filteredDatasets.length > 0 && (
                            <div className="flex items-center gap-1.5 px-1 pb-1">
                                <span className="text-[10px] text-gray-500 font-medium">Selected :</span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFocusActiveDataset();
                                    }}
                                    className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-white px-2 py-0.5 rounded border border-blue-200 shadow-xs cursor-pointer flex items-center gap-1"
                                >
                                    <span>{activeDatasetName}</span>
                                    <span className="text-[9px] text-blue-400">↵</span>
                                </button>
                            </div>
                        )}
                        <div ref={datasetsContainerRef} className="max-h-96 overflow-y-auto space-y-2 pr-1 scroll-smooth">
                            {filteredDatasets.length === 0 ? (
                                <div className="text-center py-4 px-2">
                                    <p className="text-xs text-gray-500 italic">No datasets to display.</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Click &quot;{chartMode === 'grouped' ? 'Edit' : '+ Add'}&quot; to create a new dataset.</p>
                                </div>
                            ) : (
                                filteredDatasets.map((dataset, datasetIndex) => (
                                    <div
                                        key={datasetIndex}
                                        data-active={chartData.datasets.indexOf(dataset) === activeDatasetIndex}
                                        onClick={() => {
                                            const actualIndex = chartData.datasets.indexOf(dataset);
                                            if (actualIndex !== -1) {
                                                handleActiveDatasetChange(actualIndex);
                                            }
                                        }}
                                        className={`group relative p-3 rounded-lg transition-all cursor-pointer border ${chartData.datasets.indexOf(dataset) === activeDatasetIndex
                                            ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                            : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm hover:bg-gray-50/50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex-1 flex flex-col gap-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
                                                        {chartMode === 'single'
                                                            ? (dataset.sourceTitle || dataset.label || `Dataset ${datasetIndex + 1}`)
                                                            : (dataset.label || dataset.sourceTitle || `Dataset ${datasetIndex + 1}`)
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 pl-0.5">
                                                    <span className="font-medium text-gray-500">
                                                        {(() => {
                                                            const type = dataset.chartType || dataset.type || chartType;
                                                            const labels: Record<string, string> = {
                                                                horizontalBar: 'H. Bar',
                                                                stackedBar: 'Stacked Bar',
                                                                polarArea: 'Polar Area',
                                                            };
                                                            return labels[type as string] || (typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown');
                                                        })()}
                                                    </span>
                                                    <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                    <span>{dataset.data.length} points</span>
                                                    {(chartMode === 'grouped' || datasetIndex === activeDatasetIndex) && (
                                                        <>
                                                            <span className="w-0.5 h-0.5 rounded-full bg-gray-300"></span>
                                                            <span className={dataset.hidden ? "text-gray-400" : "text-blue-600 font-medium"}>
                                                                {dataset.hidden ? "Hidden" : "Visible"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1 justify-end min-w-[60px]">
                                                {/* Idle State: Chart Type Icon */}
                                                <div className="group-hover:hidden text-gray-400">
                                                    {(() => {
                                                        const type = dataset.chartType || dataset.type || chartType;
                                                        switch (type) {
                                                            case 'horizontalBar':
                                                            case 'horizontalBar3d': return <ChartBarDecreasing className="h-4 w-4" />;
                                                            case 'bar':
                                                            case 'bar3d': return <BarChart3 className="h-4 w-4" />;
                                                            case 'stackedBar': return <ChartColumnStacked className="h-4 w-4" />;
                                                            case 'pie':
                                                            case 'pie3d': return <PieChart className="h-4 w-4" />;
                                                            case 'doughnut':
                                                            case 'doughnut3d': return <LifeBuoy className="h-4 w-4" />;
                                                            case 'area': return <ChartArea className="h-4 w-4" />;
                                                            case 'line': return <LineChart className="h-4 w-4" />;
                                                            case 'scatter':
                                                            case 'bubble': return <ScatterChart className="h-4 w-4" />;
                                                            case 'radar': return <Radar className="h-4 w-4" />;
                                                            case 'polarArea': return <CircleDot className="h-4 w-4" />;
                                                            default: return <Activity className="h-4 w-4" />;
                                                        }
                                                    })()}
                                                </div>

                                                {/* Hover State: Action Buttons */}
                                                <div className="hidden group-hover:flex items-center gap-1 animate-in fade-in duration-200">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDatasetTileClick(datasetIndex)
                                                        }}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleDeleteClick(datasetIndex)
                                                        }}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* Enhanced Chart Setup Modal for adding/editing datasets */}
            <ChartSetupDialog
                open={showAddDatasetModal}
                onClose={() => {
                    setShowAddDatasetModal(false)
                    setTimeout(() => {
                        setIsCreatingNewGroup(false)
                        if (setIsEditModeModal) setIsEditModeModal(false)
                    }, 300)
                }}
                initialDimensions={memoizedDimensions}
                onConfirm={async (dims, datasets, newChartType, newUniformityMode, groupName) => {
                    const store = useChartStore.getState();
                    const currentData = store.chartData;

                    const updatedConfig = chartConfig ? JSON.parse(JSON.stringify(chartConfig)) : {}
                    if (!isEditModeModal && (isCreatingNewGroup || chartMode === 'single')) {
                        if (dims.isResponsive) {
                            updatedConfig.responsive = true
                            updatedConfig.manualDimensions = false
                            updatedConfig.dynamicDimension = false
                        } else {
                            updatedConfig.responsive = false
                            updatedConfig.manualDimensions = true
                            updatedConfig.dynamicDimension = false
                            updatedConfig.width = `${dims.width}px`
                            updatedConfig.height = `${dims.height}px`
                        }
                    }

                    if (newUniformityMode && chartMode === 'grouped') {
                        updatedConfig.visualSettings = {
                            ...updatedConfig.visualSettings,
                            uniformityMode: newUniformityMode
                        }
                    }

                    if (isEditModeModal) {
                        if (datasets && datasets.length > 0) {
                            if (chartMode === 'grouped' && activeGroupId) {
                                const otherDatasets = currentData.datasets.filter((d: any) => d.groupId !== activeGroupId);
                                const updatedGroupDatasets = datasets.map(dataset => ({
                                    ...dataset,
                                    groupId: activeGroupId,
                                    mode: 'grouped',
                                }));
                                const newChartData = {
                                    ...currentData,
                                    datasets: [...otherDatasets, ...updatedGroupDatasets]
                                };
                                useChartStore.setState({
                                    chartData: newChartData,
                                    groupedModeData: newChartData,
                                    ...(newChartType ? { chartType: newChartType as any } : {})
                                });
                                useChatStore.getState().updateChartState({
                                    chartType: newChartType || store.chartType,
                                    chartData: newChartData,
                                    chartConfig: useChartStore.getState().getActiveChartConfig()
                                });
                                if (groupName && activeGroupId) {
                                    updateGroup(activeGroupId, { name: groupName });
                                    await saveChartTitle(groupName);
                                }
                            } else {
                                const firstDataset = datasets[0];
                                const targetIdx = (activeDatasetIndex >= 0 && activeDatasetIndex < currentData.datasets.length) ? activeDatasetIndex : 0;
                                const existingTarget = currentData.datasets[targetIdx] || {};
                                const updatedDatasets = [...currentData.datasets];
                                updatedDatasets[targetIdx] = {
                                    ...existingTarget,
                                    ...firstDataset,
                                    label: firstDataset.name || firstDataset.label || existingTarget.label,
                                    chartType: newChartType || firstDataset.type || firstDataset.chartType || existingTarget.chartType,
                                    sliceLabels: firstDataset.sliceLabels || existingTarget.sliceLabels || currentData.labels,
                                };
                                const newChartData = {
                                    ...currentData,
                                    labels: firstDataset.sliceLabels || existingTarget.sliceLabels || currentData.labels,
                                    datasets: updatedDatasets,
                                };
                                useChartStore.setState({
                                    chartData: newChartData,
                                    singleModeData: newChartData,
                                    ...(newChartType && targetIdx === activeDatasetIndex ? { chartType: newChartType as any } : {})
                                });
                                useChatStore.getState().updateChartState({
                                    chartType: newChartType || store.chartType,
                                    chartData: newChartData,
                                    chartConfig: useChartStore.getState().getActiveChartConfig()
                                });
                                if (groupName) {
                                    await saveChartTitle(groupName);
                                }
                            }
                            toast.success(`Chart updated successfully.`);
                        }
                        setShowAddDatasetModal(false);
                        setTimeout(() => {
                            if (setIsEditModeModal) setIsEditModeModal(false);
                        }, 300);
                        return;
                    }

                    if (isCreatingNewGroup) {
                        const newGroupId = addGroup({
                            name: groupName || `Group ${groups.length + 1}`,
                            category: null,
                            uniformityMode: newUniformityMode || 'uniform',
                            baseChartType: newChartType,
                            chartConfig: updatedConfig
                        });

                        if (datasets && datasets.length > 0) {
                            const store = useChartStore.getState();
                            const currentData = store.chartData;
                            const newGroupDatasets = datasets.map(dataset => ({
                                ...dataset,
                                groupId: newGroupId,
                                mode: 'grouped',
                                chartConfig: updatedConfig
                            }));
                            const newChartData = {
                                ...currentData,
                                datasets: [...currentData.datasets, ...newGroupDatasets]
                            };
                            useChartStore.setState({
                                chartData: newChartData,
                                groupedModeData: newChartData,
                                chartType: newChartType as any
                            });
                        }

                        updateChartConfig(updatedConfig);

                        const chartStore = useChartStore.getState();
                        if (chartStore.chartMode !== 'grouped') {
                            chartStore.setChartMode('grouped');
                        }
                        chartStore.setActiveGroupId(newGroupId);

                        useChatStore.getState().setBackendConversationId(null);
                        toast.success(`Created group "${groupName || `Group ${groups.length + 1}`}"`);
                    } else {
                        if (chartMode === 'grouped' && activeGroupId) {
                            const currentGroup = groups.find(g => g.id === activeGroupId);
                            const updates: any = { chartConfig: updatedConfig };
                            if (currentGroup && groupName && currentGroup.name !== groupName) {
                                updates.name = groupName;
                            }
                            updateGroup(activeGroupId, updates);

                            updateChartConfig(updatedConfig);
                        } else if (chartMode === 'single' && groupName) {
                            updatedConfig.plugins = updatedConfig.plugins || {};
                            updatedConfig.plugins.title = {
                                ...updatedConfig.plugins.title,
                                display: true,
                                text: groupName
                            };
                            useChartStore.getState().setChartTitle(groupName);
                        } else if (chartMode === 'single') {
                            updateChartConfig(updatedConfig);
                        }

                        if (datasets && datasets.length > 0) {
                            if (chartMode === 'grouped' && activeGroupId) {
                                const store = useChartStore.getState();
                                const currentData = store.chartData;
                                const otherDatasets = currentData.datasets.filter((d: any) => d.groupId !== activeGroupId);
                                const updatedGroupDatasets = datasets.map(dataset => ({
                                    ...dataset,
                                    groupId: activeGroupId,
                                    mode: 'grouped',
                                    chartConfig: updatedConfig
                                }));
                                const newChartData = {
                                    ...currentData,
                                    datasets: [...otherDatasets, ...updatedGroupDatasets]
                                };
                                useChartStore.setState({
                                    chartData: newChartData,
                                    groupedModeData: newChartData,
                                    chartType: newChartType as any
                                });
                            } else {
                                datasets.forEach(dataset => {
                                    addDataset({ ...dataset, chartConfig: updatedConfig })
                                })
                            }
                            toast.success(`Dataset updated successfully.`)
                        }
                    }

                    setShowAddDatasetModal(false)
                    setTimeout(() => {
                        setIsCreatingNewGroup(false)
                        if (setIsEditModeModal) setIsEditModeModal(false)
                    }, 300)
                    if (useTemplateStore.getState().editorMode === 'template') {
                        useTemplateStore.getState().setEditorMode('chart')
                    }
                }}
                title={isEditModeModal ? "Edit Dataset" : (isCreatingNewGroup ? "Create New Group" : (chartMode === 'grouped' ? "Edit Group Datasets" : "Set Dimensions & Add Data"))}
                datasetType={isCreatingNewGroup ? 'grouped' : (chartMode as 'single' | 'grouped')}
                isCustom={true}
                startAtStep={isEditModeModal ? 2 : (isCreatingNewGroup || chartMode === 'single' ? 1 : 2)}
                step2Title={isEditModeModal ? "Edit Dataset" : (isCreatingNewGroup ? "Add Data" : (chartMode === 'grouped' ? "Edit" : "Add Data"))}
                hideBackButton={isEditModeModal || (!isCreatingNewGroup && chartMode === 'grouped')}
                initialExistingDatasets={memoizedExistingDatasets}
                initialActiveDatasetIndex={chartMode === 'grouped' ? Math.max(0, filteredDatasets.findIndex(ds => chartData.datasets.indexOf(ds) === activeDatasetIndex)) : 0}
                initialGroupName={isCreatingNewGroup ? `Group ${groups.length + 1}` : (chartMode === 'grouped' ? groups.find(g => g.id === activeGroupId)?.name : (getEffectiveChartTitle() || chartConfig?.plugins?.title?.text || `Chart 1`))}
                initialUniformityMode={!isCreatingNewGroup && chartMode === 'grouped' ? (chartConfig?.visualSettings?.uniformityMode || 'uniform') : undefined}
                confirmButtonText={isEditModeModal ? "Update Chart" : (isCreatingNewGroup ? "Create Group" : (chartMode === 'grouped' ? "Update Chart" : undefined))}
            />
        </div>
    )
}
