"use client"
import { useState, useEffect, useRef, useMemo } from "react"
import dynamic from "next/dynamic"

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
import type { ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
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

const ChartSetupDialog = dynamic(
    () => import("@/components/dialogs/chart-setup-dialog").then(m => m.ChartSetupDialog),
    { ssr: false }
)

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
            await saveChartTitle(trimmed, { silent: true });
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

    const renderDatasetTypeIcon = (type: string | undefined) => {
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
    };

    const formatDatasetTypeLabel = (type: unknown) => {
        const labels: Record<string, string> = {
            horizontalBar: 'H. Bar',
            horizontalBar3d: '3D H. Bar',
            bar3d: '3D Bar',
            pie3d: '3D Pie',
            doughnut3d: '3D Doughnut',
            stackedBar: 'Stacked Bar',
            polarArea: 'Polar Area',
        };
        return labels[type as string] || (typeof type === 'string' ? type.charAt(0).toUpperCase() + type.slice(1) : 'Chart');
    };

    const renderDatasetsList = () => (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between gap-2 bg-slate-50/80 px-3 py-2.5 border-b border-slate-200/70 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    <Label className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap">Datasets</Label>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/70 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                        {filteredDatasets.length}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                        size="sm"
                        onClick={() => {
                            setIsCreatingNewGroup(false);
                            handleOpenAddDatasetModal();
                        }}
                        className="h-7 px-2.5 text-[11px] gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
                    >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        {chartMode === 'grouped' ? 'Dataset' : 'Add'}
                    </Button>

                    <button
                        type="button"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 cursor-pointer transition-colors shrink-0"
                        onClick={() => setDatasetsDropdownOpen(!datasetsDropdownOpen)}
                        title={datasetsDropdownOpen ? "Collapse datasets" : "Expand datasets"}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
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
                    </button>
                </div>
            </div>

            {datasetsDropdownOpen && (
                <div className="bg-slate-50/40 p-2.5 space-y-2">
                    {filteredDatasets.length > 0 && (
                        <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200/70">
                            <span className="text-[11px] text-slate-500 font-medium shrink-0 whitespace-nowrap">Active</span>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleFocusActiveDataset();
                                }}
                                title={`Jump to ${activeDatasetName}`}
                                className="min-w-0 flex-1 flex items-center justify-end gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                            >
                                <span className="truncate">{activeDatasetName}</span>
                                <ChevronRight className="h-3 w-3 shrink-0 text-blue-400" />
                            </button>
                        </div>
                    )}
                    <div ref={datasetsContainerRef} className="max-h-96 overflow-y-auto space-y-1.5 scroll-smooth">
                        {filteredDatasets.length === 0 ? (
                            <div className="text-center py-6 px-3 bg-white rounded-xl border border-dashed border-slate-200">
                                <p className="text-xs font-medium text-slate-500">No datasets yet</p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Click &quot;+ {chartMode === 'grouped' ? 'Dataset' : 'Add'}&quot; to create one.
                                </p>
                            </div>
                        ) : (
                            filteredDatasets.map((dataset, datasetIndex) => {
                                const actualIndex = chartData.datasets.indexOf(dataset);
                                const isActive = actualIndex === activeDatasetIndex;
                                const type = (dataset.chartType || dataset.type || chartType) as string | undefined;
                                const title = chartMode === 'single'
                                    ? (dataset.sourceTitle || dataset.label || `Dataset ${datasetIndex + 1}`)
                                    : (dataset.label || dataset.sourceTitle || `Dataset ${datasetIndex + 1}`);

                                return (
                                    <div
                                        key={datasetIndex}
                                        data-active={isActive}
                                        onClick={() => {
                                            if (actualIndex !== -1) {
                                                handleActiveDatasetChange(actualIndex);
                                            }
                                        }}
                                        className={`group relative p-2.5 rounded-xl transition-all cursor-pointer border ${isActive
                                            ? 'bg-blue-50/60 border-blue-300/90 shadow-2xs ring-1 ring-blue-500/15'
                                            : 'bg-white border-slate-200/75 hover:border-slate-300 hover:shadow-2xs'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            {/* Chart Type Badge */}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive
                                                ? 'bg-blue-600 text-white shadow-2xs'
                                                : 'bg-slate-100 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600'
                                                }`}>
                                                {renderDatasetTypeIcon(type)}
                                            </div>

                                            {/* Title + Meta */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-semibold text-slate-800 truncate" title={title}>
                                                    {title}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                                                    <span className="font-medium text-slate-600">
                                                        {formatDatasetTypeLabel(type)}
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span>{dataset.data.length} pts</span>
                                                    {(chartMode === 'grouped' || isActive) && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className={`inline-flex items-center gap-1 font-medium ${dataset.hidden ? "text-slate-400" : "text-emerald-600"}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${dataset.hidden ? "bg-slate-300" : "bg-emerald-500"}`} />
                                                                {dataset.hidden ? "Hidden" : "Visible"}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-0.5 shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    title="Edit dataset"
                                                    className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer"
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
                                                    title="Delete dataset"
                                                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
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
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderGroupsList = () => (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            <div className="flex items-center justify-between gap-2 bg-slate-50/80 px-3 py-2.5 border-b border-slate-200/70 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    <Label className="text-xs font-semibold text-slate-800 tracking-tight whitespace-nowrap">Groups</Label>
                    <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200/70 px-1.5 py-0.5 rounded-full font-semibold leading-none">
                        {groups.length}
                    </span>
                </div>
                <Button
                    size="sm"
                    onClick={() => {
                        setIsCreatingNewGroup(true);
                        setShowAddDatasetModal(true);
                    }}
                    className="h-7 px-2.5 text-[11px] gap-1 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-2xs transition-all active:scale-95 shrink-0 cursor-pointer"
                >
                    <Plus className="h-3.5 w-3.5 shrink-0" />
                    Group
                </Button>
            </div>

            <div className="bg-slate-50/40 p-2.5 space-y-2">
                <div className="max-h-96 overflow-y-auto space-y-1.5 scroll-smooth">
                    {groups.length === 0 ? (
                        <div className="text-center py-6 px-3 bg-white rounded-xl border border-dashed border-slate-200">
                            <p className="text-xs font-medium text-slate-500">No groups yet</p>
                            <p className="text-[11px] text-slate-400 mt-1">Click &quot;+ Group&quot; to create a new group.</p>
                        </div>
                    ) : (
                        groups.map((group) => {
                            const isSelected = group.id === activeGroupId;
                            const count = getGroupDatasetCount(group.id);
                            return (
                                <div
                                    key={group.id}
                                    onClick={() => handleActiveGroupChange(group.id)}
                                    className={`group relative p-2.5 rounded-xl transition-all cursor-pointer border ${
                                        isSelected
                                            ? 'bg-blue-50/60 border-blue-300/90 ring-1 ring-blue-500/15 shadow-2xs'
                                            : 'bg-white border-slate-200/75 hover:border-slate-300 hover:shadow-2xs'
                                    }`}
                                >
                                    {/* Top row: Title + badges + delete */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                            <span className="text-xs font-semibold text-slate-800 truncate" title={group.name}>
                                                {group.name}
                                            </span>
                                            {isSelected && (
                                                <span className="text-[9px] font-semibold bg-blue-600 text-white px-1.5 py-0.5 rounded-full shrink-0">
                                                    Active
                                                </span>
                                            )}
                                            {group.isDefault && (
                                                <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-md font-medium shrink-0">
                                                    Default
                                                </span>
                                            )}
                                        </div>

                                        {!group.isDefault && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 -mr-1 cursor-pointer"
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
                                    <div className="flex items-center justify-between gap-2 mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {group.category ? (
                                                <span className="px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/60 font-medium">
                                                    {group.category === 'coordinate' ? 'Coordinate' : 'Categorical'}
                                                </span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 font-medium">
                                                    Unset
                                                </span>
                                            )}
                                            {group.uniformityMode && (
                                                <span className="px-1.5 py-0.5 rounded-md bg-violet-50 text-violet-700 border border-violet-200/60 capitalize font-medium">
                                                    {group.uniformityMode}
                                                </span>
                                            )}
                                        </div>

                                        <span className="text-slate-500 font-medium shrink-0">
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
        <div className="space-y-3.5">
            {/* Chart Mode Section */}
            <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-0.5">
                    Chart Mode
                </Label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl">
                    <button
                        type="button"
                        onClick={() => handleChartModeChange('single')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                            chartMode === 'single'
                                ? 'bg-white text-blue-600 font-semibold shadow-xs ring-1 ring-slate-200/70'
                                : 'text-slate-500 hover:text-slate-800 font-medium'
                        }`}
                    >
                        <BarChart2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Single</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => handleChartModeChange('grouped')}
                        className={`flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg text-xs transition-all cursor-pointer ${
                            chartMode === 'grouped'
                                ? 'bg-white text-blue-600 font-semibold shadow-xs ring-1 ring-slate-200/70'
                                : 'text-slate-500 hover:text-slate-800 font-medium'
                        }`}
                    >
                        <Layers className="h-3.5 w-3.5 shrink-0" />
                        <span>Grouped</span>
                    </button>
                </div>
            </div>

            {/* Mode-specific content */}
            {chartMode === 'grouped' ? (
                <div className="space-y-3">
                    {/* Two Tabs: Groups vs Datasets */}
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl text-xs font-medium">
                        <button
                            type="button"
                            onClick={() => setGroupedTab('groups')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                groupedTab === 'groups'
                                    ? 'bg-white text-slate-900 shadow-xs font-semibold ring-1 ring-slate-200/70'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            <span>Groups</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                                groupedTab === 'groups'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                    : 'bg-slate-200/80 text-slate-600'
                            }`}>
                                {groups.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGroupedTab('datasets')}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                groupedTab === 'datasets'
                                    ? 'bg-white text-blue-600 shadow-xs font-semibold ring-1 ring-slate-200/70'
                                    : 'text-slate-500 hover:text-slate-900'
                            }`}
                        >
                            <BarChart2 className="h-3.5 w-3.5" />
                            <span>Datasets</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold leading-none ${
                                groupedTab === 'datasets'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200/60'
                                    : 'bg-slate-200/80 text-slate-600'
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
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50/80 border border-slate-200/80 rounded-xl shadow-2xs">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">Group</span>
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
                                                        className="h-6 px-2 text-xs font-semibold bg-white border border-blue-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 flex-1 min-w-0"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={handleSaveGroupName}
                                                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-md cursor-pointer"
                                                        title="Save name"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditingGroupName(false)}
                                                        className="p-1 text-slate-400 hover:bg-slate-100 rounded-md cursor-pointer"
                                                        title="Cancel"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <span className="text-xs font-semibold text-slate-900 truncate" title={activeGroup?.name}>
                                                        {activeGroup?.name || 'Selected Group'}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditingGroupNameValue(activeGroup?.name || '');
                                                            setIsEditingGroupName(true);
                                                        }}
                                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                                        title="Rename group"
                                                    >
                                                        <Pencil className="h-3 w-3" />
                                                    </button>
                                                    {activeGroup?.category && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 font-medium shrink-0">
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
                initialDimensions={
                    (isEditModeModal || (!isCreatingNewGroup && chartMode === 'grouped'))
                        ? memoizedDimensions
                        : undefined
                }
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
                                    await saveChartTitle(groupName, { silent: true });
                                }
                            } else {
                                const firstDataset = datasets[0];
                                const targetIdx = (activeDatasetIndex >= 0 && activeDatasetIndex < currentData.datasets.length) ? activeDatasetIndex : 0;
                                const existingTarget = currentData.datasets[targetIdx] || {};
                                const previousTitle = getEffectiveChartTitle();
                                const trimmedGroupName = groupName?.trim();

                                // Sync canvas title if it still matches the previous chart name or default "Chart 1"
                                let updatedTargetConfig = existingTarget.chartConfig || store.getActiveChartConfig();
                                if (trimmedGroupName && updatedTargetConfig?.plugins?.title) {
                                    const currentCanvasText = String(updatedTargetConfig.plugins.title.text || '').trim();
                                    if (!currentCanvasText || currentCanvasText === previousTitle || currentCanvasText === 'Chart 1') {
                                        const clonedConfig = JSON.parse(JSON.stringify(updatedTargetConfig));
                                        clonedConfig.plugins = clonedConfig.plugins || {};
                                        clonedConfig.plugins.title = {
                                            ...clonedConfig.plugins.title,
                                            text: trimmedGroupName,
                                        };
                                        updatedTargetConfig = clonedConfig;
                                    }
                                }

                                const updatedDatasets = [...currentData.datasets];
                                updatedDatasets[targetIdx] = {
                                    ...existingTarget,
                                    ...firstDataset,
                                    label: firstDataset.name || firstDataset.label || existingTarget.label,
                                    chartType: newChartType || firstDataset.type || firstDataset.chartType || existingTarget.chartType,
                                    sliceLabels: firstDataset.sliceLabels || existingTarget.sliceLabels || currentData.labels,
                                    chartConfig: updatedTargetConfig,
                                };
                                const newChartData = {
                                    ...currentData,
                                    labels: firstDataset.sliceLabels || existingTarget.sliceLabels || currentData.labels,
                                    datasets: updatedDatasets,
                                };
                                useChartStore.setState({
                                    chartData: newChartData,
                                    singleModeData: newChartData,
                                    chartConfig: updatedTargetConfig,
                                    ...(newChartType && targetIdx === activeDatasetIndex ? { chartType: newChartType as any } : {})
                                });
                                useChatStore.getState().updateChartState({
                                    chartType: newChartType || store.chartType,
                                    chartData: newChartData,
                                    chartConfig: updatedTargetConfig
                                });
                                if (trimmedGroupName) {
                                    await saveChartTitle(trimmedGroupName, { silent: true });
                                }
                            }
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
                        freshGroupConfig.templateDimensions = false;
                        freshGroupConfig.originalDimensions = false;
                        if (dims.isResponsive) {
                            freshGroupConfig.responsive = true;
                            freshGroupConfig.manualDimensions = false;
                            freshGroupConfig.dynamicDimension = false;
                            freshGroupConfig.width = `${dims.width}px`;
                            freshGroupConfig.height = `${dims.height}px`;
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

                        // Switch to grouped mode FIRST so we never leak singleModeData datasets into groupedModeData
                        const chartStoreBeforeAppend = useChartStore.getState();
                        if (chartStoreBeforeAppend.chartMode !== 'grouped') {
                            chartStoreBeforeAppend.setChartMode('grouped');
                        }

                        if (datasets && datasets.length > 0) {
                            const store = useChartStore.getState();
                            const currentGroupedData = store.groupedModeData || { labels: [], datasets: [] };
                            const newGroupDatasets = datasets.map(dataset => ({
                                ...dataset,
                                groupId: newGroupId,
                                mode: 'grouped',
                                chartConfig: freshGroupConfig
                            }));
                            const newChartData = {
                                ...currentGroupedData,
                                datasets: [...(currentGroupedData.datasets || []), ...newGroupDatasets]
                            };
                            useChartStore.setState({
                                chartData: newChartData,
                                groupedModeData: newChartData,
                                chartType: targetType
                            });
                        }

                        useChartStore.getState().setActiveGroupId(newGroupId);
                        updateChartConfig(freshGroupConfig);
                        setGroupedTab('datasets');

                        useChatStore.getState().setBackendConversationId(null);
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
                        if (groupName && currentGroup && currentGroup.name !== groupName) {
                            await saveChartTitle(groupName, { silent: true });
                        }

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
                        }
                    } else {
                        // chartMode === 'single': adding new dataset/chart, completely isolated with clean default settings
                        const targetType = (newChartType || 'bar') as SupportedChartType;
                        const freshSingleConfig = JSON.parse(JSON.stringify(getDefaultConfigForType(targetType)));
                        freshSingleConfig.templateDimensions = false;
                        freshSingleConfig.originalDimensions = false;
                        if (dims.isResponsive) {
                            freshSingleConfig.responsive = true;
                            freshSingleConfig.manualDimensions = false;
                            freshSingleConfig.dynamicDimension = false;
                            freshSingleConfig.width = `${dims.width}px`;
                            freshSingleConfig.height = `${dims.height}px`;
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
                            const trimmedName = groupName?.trim() || undefined;
                            datasets.forEach(dataset => {
                                addDataset({
                                    ...dataset,
                                    chartType: targetType,
                                    chartConfig: freshSingleConfig,
                                    mode: 'single',
                                    ...(trimmedName ? { sourceTitle: trimmedName } : {})
                                });
                            });
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
                initialGroupName={
                    isCreatingNewGroup
                        ? `Group ${groups.length + 1}`
                        : chartMode === 'grouped'
                            ? groups.find(g => g.id === activeGroupId)?.name
                            : isEditModeModal
                                ? (getEffectiveChartTitle() || chartConfig?.plugins?.title?.text || `Chart ${activeDatasetIndex + 1}`)
                                : `Chart ${filteredDatasets.length + 1}`
                }
                initialUniformityMode={!isCreatingNewGroup && chartMode === 'grouped' ? (chartConfig?.visualSettings?.uniformityMode || 'uniform') : undefined}
                confirmButtonText={isEditModeModal ? "Update Chart" : (isCreatingNewGroup ? "Create Group" : (chartMode === 'grouped' ? "Update Chart" : undefined))}
            />

        </div>
    )
}
