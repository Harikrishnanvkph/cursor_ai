"use client"

import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { type ExtendedChartDataset } from "@/lib/chart-store"
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
} from "lucide-react"
import { AddDatasetModal } from "../add-dataset-modal"
import { useChatStore } from "@/lib/chat-store"
import { toast } from "sonner"

interface GeneralTabProps {
    chartMode: string
    chartType: string
    uniformityMode: string
    groups: any[]
    activeGroupId: string
    activeDatasetIndex: number
    chartData: any
    filteredDatasets: ExtendedChartDataset[]
    datasetsDropdownOpen: boolean
    showAddDatasetModal: boolean
    setDatasetsDropdownOpen: (open: boolean) => void
    setShowAddDatasetModal: (open: boolean) => void
    handleChartModeChange: (mode: 'single' | 'grouped') => void
    handleConvertToGrouped: () => void
    setUniformityMode: (mode: 'uniform' | 'mixed') => void
    handleActiveGroupChange: (groupId: string) => void
    handleActiveDatasetChange: (index: number) => void
    handleOpenAddDatasetModal: () => void
    handleDatasetTileClick: (index: number) => void
    handleDeleteClick: (index: number) => void
    addGroup: (opts: any) => void
    setGroupToDelete: (id: string | null) => void
    setShowGroupDeleteDialog: (show: boolean) => void
    addDataset: (dataset: ExtendedChartDataset) => void
}

export function GeneralTab({
    chartMode,
    chartType,
    uniformityMode,
    groups,
    activeGroupId,
    activeDatasetIndex,
    chartData,
    filteredDatasets,
    datasetsDropdownOpen,
    showAddDatasetModal,
    setDatasetsDropdownOpen,
    setShowAddDatasetModal,
    handleChartModeChange,
    handleConvertToGrouped,
    setUniformityMode,
    handleActiveGroupChange,
    handleActiveDatasetChange,
    handleOpenAddDatasetModal,
    handleDatasetTileClick,
    handleDeleteClick,
    addGroup,
    setGroupToDelete,
    setShowGroupDeleteDialog,
    addDataset,
}: GeneralTabProps) {

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

            {/* Convert to Grouped Chart - Only visible in Single Mode */}
            {chartMode === 'single' && filteredDatasets.length > 0 && (
                <div
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 cursor-pointer hover:bg-blue-100 hover:border-blue-300 transition-all group"
                    onClick={() => handleConvertToGrouped()}
                    title="By converting to a grouped chart, you can add more datasets to visualize and compare multiple data series on the same chart."
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="16" x2="12" y2="12" />
                        <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span className="font-medium text-xs text-blue-700 flex-1">Convert to Grouped Chart</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0">
                        <path d="M9 18l6-6-6-6" />
                    </svg>
                </div>
            )}

            {/* Uniformity Mode Section - Only for Grouped Mode */}
            {chartMode === 'grouped' && (
                <div>
                    <div className="font-semibold text-xs mb-2">Uniformity</div>
                    <div className="flex items-center gap-4 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 shadow-sm">
                        <label className={`flex items-center gap-2 cursor-pointer transition-colors text-xs ${uniformityMode === 'uniform' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}>
                            <input
                                type="radio"
                                className="accent-blue-600"
                                checked={uniformityMode === 'uniform'}
                                onChange={() => setUniformityMode('uniform')}
                            />
                            <BarChart2 className="h-4 w-4" />
                            Uniform
                        </label>
                        {(() => {
                            const firstDatasetType = filteredDatasets[0]?.chartType;
                            const isMixedDisabled = firstDatasetType && ['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'].includes(firstDatasetType);

                            return (
                                <label className={`flex items-center gap-2 cursor-pointer transition-colors text-xs ${uniformityMode === 'mixed' ? 'text-blue-700 font-bold' : 'text-gray-500'} ${isMixedDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                    <input
                                        type="radio"
                                        className="accent-blue-600"
                                        checked={uniformityMode === 'mixed'}
                                        onChange={() => setUniformityMode('mixed')}
                                        disabled={!!isMixedDisabled}
                                    />
                                    <Layers className="h-4 w-4" />
                                    Mixed
                                </label>
                            );
                        })()}
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                        {(() => {
                            const firstDatasetType = filteredDatasets[0]?.chartType;
                            const isMixedDisabled = firstDatasetType && ['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'].includes(firstDatasetType);

                            if (isMixedDisabled) {
                                return (
                                    <span className="text-blue-600 font-medium">
                                        Mixed mode is not available when the first dataset is {(() => {
                                            const labels: Record<string, string> = {
                                                pie3d: '3D Pie',
                                                doughnut3d: '3D Doughnut',
                                                bar3d: '3D Bar',
                                                horizontalBar3d: '3D Horizontal Bar'
                                            };
                                            return labels[firstDatasetType] || firstDatasetType;
                                        })()}. Only uniform mode is supported.
                                    </span>
                                );
                            }

                            return uniformityMode === 'uniform'
                                ? 'All datasets will use the same chart type selected in Types & Toggles panel.'
                                : 'Each dataset can have its own chart type selected during creation.';
                        })()}
                    </p>
                </div>
            )}

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
                                const newName = `Group ${groups.length}`;
                                addGroup({
                                    name: newName,
                                    category: null,
                                    uniformityMode: 'uniform'
                                });
                                useChatStore.getState().setBackendConversationId(null);
                                toast.success(`Created group "${newName}"`);
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

            {/* Active Dataset Selector - Single Mode */}
            {chartMode === 'single' && filteredDatasets.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Active Dataset</Label>
                    <Select value={String(activeDatasetIndex)} onValueChange={(value) => handleActiveDatasetChange(Number(value))}>
                        <SelectTrigger className="h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {filteredDatasets.map((dataset, index) => {
                                const actualIndex = chartData.datasets.indexOf(dataset);
                                return (
                                    <SelectItem key={index} value={String(actualIndex)}>
                                        {chartMode === 'single' 
                                            ? (dataset.sourceTitle || dataset.label || `Dataset ${actualIndex + 1}`)
                                            : (dataset.label || dataset.sourceTitle || `Dataset ${actualIndex + 1}`)
                                        }
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-0">
                {/* Datasets Header with Count and Actions */}
                <div
                    className="flex items-center justify-between py-2 px-2 border-b rounded-t hover:bg-gray-50 transition-colors group"
                >
                    <div
                        className="flex items-center gap-2 flex-1 cursor-pointer"
                        onClick={() => setDatasetsDropdownOpen(!datasetsDropdownOpen)}
                    >
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xs font-semibold text-gray-900">Datasets</h3>
                        <span className="bg-gray-100 text-gray-600 text-[10px] font-medium px-1.5 py-0.5 rounded-full border border-gray-200">
                            {filteredDatasets.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation()
                                handleOpenAddDatasetModal()
                            }}
                            className="h-6 px-2 text-xs bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 shadow-sm transition-all"
                        >
                            <Plus className="h-3 w-3 mr-1" />
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
                        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                            {filteredDatasets.length === 0 ? (
                                <div className="text-center py-4 px-2">
                                    <p className="text-xs text-gray-500 italic">No datasets to display.</p>
                                    <p className="text-[10px] text-gray-400 mt-1">Click &quot;+ Add&quot; to create a new dataset.</p>
                                </div>
                            ) : (
                                filteredDatasets.map((dataset, datasetIndex) => (
                                    <div
                                        key={datasetIndex}
                                        onClick={() => {
                                            const actualIndex = chartData.datasets.indexOf(dataset);
                                            if (actualIndex !== -1) {
                                                handleActiveDatasetChange(actualIndex);
                                            }
                                        }}
                                        className={`group relative p-3 rounded-lg transition-all cursor-pointer border ${chartMode === 'single' && chartData.datasets.indexOf(dataset) === activeDatasetIndex
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
            {/* Enhanced Add Dataset Modal */}
            <AddDatasetModal open={showAddDatasetModal} onOpenChange={setShowAddDatasetModal} onDatasetAdd={addDataset} />
        </div>
    )
}
