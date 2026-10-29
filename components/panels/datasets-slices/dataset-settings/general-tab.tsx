"use client"
import { useState, useEffect, useRef, useMemo } from "react"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useChartStore, type ExtendedChartDataset, getDefaultConfigForType } from "@/lib/chart-store"
import type { SupportedChartType } from "@/lib/chart-defaults"
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
    Check,
    X,
} from "lucide-react"
import { ChartSetupDialog, type ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
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
    addGroup: (opts: any) => string
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
    const { updateDataset } = useChartActions();
    const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
    const [groupedTab, setGroupedTab] = useState<'groups' | 'datasets'>('groups');
    const [isEditingGroupName, setIsEditingGroupName] = useState(false);
    const [editingGroupNameValue, setEditingGroupNameValue] = useState('');
    const datasetsContainerRef = useRef<HTMLDivElement>(null);

    const handleSaveGroupName = async () => {
        const trimmed = editingGroupNameValue.trim();
        if (!trimmed) {
            toast.error("Group name cannot be empty");
            return;
        }
        if (activeGroupId) {
            updateGroup(activeGroupId, { name: trimmed });
            await saveChartTitle(trimmed);
            toast.success(`Group renamed to "${trimmed}"`);
        }
        setIsEditingGroupName(false);
    };

    const getGroupDatasetCount = (groupId: string) => {
        return (chartData?.datasets || []).filter((d: any) => {
            if (d.mode && d.mode !== 'grouped') return false;
            return d.groupId === groupId;
        }).length;
    };

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

    const renderDatasetsList = () => (
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
                        onClick={() => {
                            setIsCreatingNewGroup(false);
                            handleOpenAddDatasetModal();
                        }}
                        className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-100/50 bg-white font-medium shadow-2xs transition-all active:scale-95"
                    >
                        <Plus className="h-3.5 w-3.5 mr-1 text-blue-600" />
                        {chartMode === 'grouped' ? 'Datasets' : 'Add'}
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
                            <div className="text-center py-6 px-2 bg-white rounded-lg border border-dashed border-gray-200">
                                <p className="text-xs text-gray-500 italic">No datasets to display.</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                    Click &quot;+ {chartMode === 'grouped' ? 'Datasets' : 'Add'}&quot; to create a new dataset.
                                </p>
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
    );

    const renderGroupsList = () => (
        <div className="space-y-2">
            <div className="flex items-center justify-between bg-blue-50/70 p-2.5 rounded-t-lg border border-blue-100">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <Label className="text-xs font-semibold text-gray-800 tracking-wide">Groups</Label>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                        {groups.length}
                    </span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        setIsCreatingNewGroup(true);
                        setShowAddDatasetModal(true);
                    }}
                    className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-100/50 bg-white font-medium shadow-2xs transition-all active:scale-95"
                >
                    <Plus className="h-3.5 w-3.5 mr-1 text-blue-600" />
                    Group
                </Button>
            </div>

            <div className="bg-blue-50/50 rounded-b-lg p-3 space-y-2 border-x border-b border-blue-100">
                <div className="max-h-96 overflow-y-auto space-y-2 pr-1 scroll-smooth">
                    {groups.length === 0 ? (
                        <div className="text-center py-6 px-2 bg-white rounded-lg border border-dashed border-gray-200">
                            <p className="text-xs text-gray-500 italic">No groups to display.</p>
                            <p className="text-[10px] text-gray-400 mt-1">Click &quot;+ Group&quot; to create a new group.</p>
                        </div>
                    ) : (
                        groups.map((group) => {
                            const isSelected = group.id === activeGroupId;
                            const count = getGroupDatasetCount(group.id);
                            return (
                                <div
                                    key={group.id}
                                    onClick={() => handleActiveGroupChange(group.id)}
                                    className={`group relative p-2.5 rounded-lg transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-blue-50/40 border-blue-400 ring-1 ring-blue-400/30 shadow-xs'
                                            : 'bg-white border-gray-200/80 hover:border-blue-200 hover:bg-gray-50/50 hover:shadow-xs'
                                    }`}
                                >
                                    {/* Top row: Title + badges + delete */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <span className="text-xs font-semibold text-gray-800 truncate" title={group.name}>
                                                {group.name}
                                            </span>
                                            {isSelected && (
                                                <span className="text-[9px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                                    Selected
                                                </span>
                                            )}
                                            {group.isDefault && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium shrink-0">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        {!group.isDefault && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded shrink-0 -mr-1"
                                                title="Delete group"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setGroupToDelete(group.id);
                                                    setShowGroupDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>

                                    {/* Bottom row: Category, uniformity, dataset count */}
                                    <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-gray-100 text-[10px]">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {group.category ? (
                                                <span className="px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-100 font-medium">
                                                    {group.category === 'coordinate' ? 'Coordinate' : 'Categorical'}
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                                                    Unset
                                                </span>
                                            )}
                                            {group.uniformityMode && (
                                                <span className="px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 capitalize font-medium">
                                                    {group.uniformityMode}
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-gray-500 font-medium shrink-0">
                                            {count} {count === 1 ? 'dataset' : 'datasets'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );

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

            {/* Mode-specific content */}
            {chartMode === 'grouped' ? (
                <div className="space-y-3">
                    {/* Two Tabs: Groups vs Datasets */}
                    <div className="grid grid-cols-2 p-1 bg-gray-100/80 border border-gray-200/60 rounded-lg text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setGroupedTab('groups')}
                            className={`flex items-center justify-center gap-2 py-1.5 rounded-md transition-all ${
                                groupedTab === 'groups'
                                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Groups</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                groupedTab === 'groups'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                                {groups.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGroupedTab('datasets')}
                            className={`flex items-center justify-center gap-2 py-1.5 rounded-md transition-all ${
                                groupedTab === 'datasets'
                                    ? 'bg-white text-blue-700 shadow-xs font-semibold'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            <BarChart2 className="h-3.5 w-3.5" />
                            <span>Datasets</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                groupedTab === 'datasets'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                                {filteredDatasets.length}
                            </span>
                        </button>
                    </div>

                    {groupedTab === 'groups' ? (
                        renderGroupsList()
                    ) : (
                        <div className="space-y-3">
                            {/* Selected Group Context Banner */}
                            {(() => {
                                const activeGroup = groups.find((g: any) => g.id === activeGroupId) || groups[0];
                                return (
                                    <div className="flex items-center justify-between p-2.5 bg-blue-50/40 border border-blue-200/80 rounded-lg shadow-2xs">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider shrink-0">Group:</span>
                                            {isEditingGroupName ? (
                                                <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                                                    <input
                                                        type="text"
                                                        value={editingGroupNameValue}
                                                        onChange={(e) => setEditingGroupNameValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSaveGroupName();
                                                            if (e.key === 'Escape') setIsEditingGroupName(false);
                                                        }}
                                                        autoFocus
                                                        className="h-6 px-2 text-xs font-semibold bg-white border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveGroupName}
                                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                                        title="Save name"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditingGroupName(false)}
                                                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                                        title="Cancel"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <span className="text-xs font-bold text-gray-900 truncate" title={activeGroup?.name}>
                                                        {activeGroup?.name || 'Selected Group'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingGroupNameValue(activeGroup?.name || '');
                                                            setIsEditingGroupName(true);
                                                        }}
                                                        className="p-0.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/50 rounded transition-colors"
                                                        title="Rename group"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                    {activeGroup?.category && (
                                                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-medium shrink-0">
                                                            {activeGroup.category === 'coordinate' ? 'Coordinate' : 'Categorical'}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {renderDatasetsList()}
                        </div>
                    )}
                </div>
            ) : (
                renderDatasetsList()
            )}

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
                        const targetType = (newChartType || 'bar') as SupportedChartType;
                        const freshGroupConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(targetType)));
                        if (dims.isResponsive) {
                            freshGroupConfig.responsive = true;
                            freshGroupConfig.manualDimensions = false;
                            freshGroupConfig.dynamicDimension = false;
                        } else {
                            freshGroupConfig.responsive = false;
                            freshGroupConfig.manualDimensions = true;
                            freshGroupConfig.dynamicDimension = false;
                            freshGroupConfig.width = `${dims.width}px`;
                            freshGroupConfig.height = `${dims.height}px`;
                        }
                        if (newUniformityMode) {
                            freshGroupConfig.visualSettings = {
                                ...freshGroupConfig.visualSettings,
                                uniformityMode: newUniformityMode
                            };
                        }
                        if (groupName && groupName.trim()) {
                            freshGroupConfig.plugins = freshGroupConfig.plugins || {};
                            freshGroupConfig.plugins.title = {
                                ...freshGroupConfig.plugins.title,
                                display: true,
                                text: groupName.trim()
                            };
                        }
                        freshGroupConfig.decorationShapes = [];

                        const newGroupId = addGroup({
                            name: groupName || `Group ${groups.length + 1}`,
                            category: null,
                            uniformityMode: newUniformityMode || 'uniform',
                            baseChartType: targetType,
                            chartConfig: freshGroupConfig
                        });

                        if (datasets && datasets.length > 0) {
                            const store = useChartStore.getState();
                            const currentData = store.chartData;
                            const newGroupDatasets = datasets.map(dataset => ({
                                ...dataset,
                                groupId: newGroupId,
                                mode: 'grouped',
                                chartConfig: freshGroupConfig
                            }));
                            const newChartData = {
                                ...currentData,
                                datasets: [...currentData.datasets, ...newGroupDatasets]
                            };
                            useChartStore.setState({
                                chartData: newChartData,
                                groupedModeData: newChartData,
                                chartType: targetType
                            });
                        }

                        updateChartConfig(freshGroupConfig);

                        const chartStore = useChartStore.getState();
                        if (chartStore.chartMode !== 'grouped') {
                            chartStore.setChartMode('grouped');
                        }
                        chartStore.setActiveGroupId(newGroupId);
                        setGroupedTab('datasets');

                        useChatStore.getState().setBackendConversationId(null);
                        toast.success(`Created group "${groupName || `Group ${groups.length + 1}`}"`);
                    } else if (chartMode === 'grouped' && activeGroupId) {
                        const currentGroup = groups.find(g => g.id === activeGroupId);
                        const existingGroupConfig = currentGroup?.chartConfig
                            ? JSON.parse(JSON.stringify(currentGroup.chartConfig))
                            : (chartConfig ? JSON.parse(JSON.stringify(chartConfig)) : {});
                        if (dims.isResponsive) {
                            existingGroupConfig.responsive = true;
                            existingGroupConfig.manualDimensions = false;
                            existingGroupConfig.dynamicDimension = false;
                        } else {
                            existingGroupConfig.responsive = false;
                            existingGroupConfig.manualDimensions = true;
                            existingGroupConfig.dynamicDimension = false;
                            existingGroupConfig.width = `${dims.width}px`;
                            existingGroupConfig.height = `${dims.height}px`;
                        }
                        if (newUniformityMode) {
                            existingGroupConfig.visualSettings = {
                                ...existingGroupConfig.visualSettings,
                                uniformityMode: newUniformityMode
                            };
                        }
                        const updates: any = { chartConfig: existingGroupConfig };
                        if (groupName && currentGroup && currentGroup.name !== groupName) {
                            updates.name = groupName;
                        }
                        updateGroup(activeGroupId, updates);
                        updateChartConfig(existingGroupConfig);

                        if (datasets && datasets.length > 0) {
                            const store = useChartStore.getState();
                            const currentData = store.chartData;
                            const otherDatasets = currentData.datasets.filter((d: any) => d.groupId !== activeGroupId);
                            const updatedGroupDatasets = datasets.map(dataset => ({
                                ...dataset,
                                groupId: activeGroupId,
                                mode: 'grouped',
                                chartConfig: existingGroupConfig
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
                            toast.success(`Dataset updated successfully.`);
                        }
                    } else {
                        // chartMode === 'single': adding new dataset/chart, completely isolated with clean default settings
                        const targetType = (newChartType || 'bar') as SupportedChartType;
                        const freshSingleConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(targetType)));
                        if (dims.isResponsive) {
                            freshSingleConfig.responsive = true;
                            freshSingleConfig.manualDimensions = false;
                            freshSingleConfig.dynamicDimension = false;
                        } else {
                            freshSingleConfig.responsive = false;
                            freshSingleConfig.manualDimensions = true;
                            freshSingleConfig.dynamicDimension = false;
                            freshSingleConfig.width = `${dims.width}px`;
                            freshSingleConfig.height = `${dims.height}px`;
                        }
                        if (groupName && groupName.trim()) {
                            freshSingleConfig.plugins = freshSingleConfig.plugins || {};
                            freshSingleConfig.plugins.title = {
                                ...freshSingleConfig.plugins.title,
                                display: true,
                                text: groupName.trim()
                            };
                        }
                        freshSingleConfig.decorationShapes = [];

                        if (datasets && datasets.length > 0) {
                            datasets.forEach(dataset => {
                                addDataset({
                                    ...dataset,
                                    chartType: targetType,
                                    chartConfig: freshSingleConfig,
                                    mode: 'single'
                                });
                            });
                            toast.success(`Single chart created successfully.`);
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
