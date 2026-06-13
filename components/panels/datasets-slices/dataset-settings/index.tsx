"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { useState, useEffect, useMemo } from "react"
import { useChartStore, type ExtendedChartDataset } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { getDefaultImageConfig as getDefaultImageConfigFromStore } from "@/lib/plugins/universal-image-plugin"
import { useChatStore } from "@/lib/chat-store"
import { toast } from "sonner"
import {
    Plus,
    Upload,
    X,
} from "lucide-react"
import { darkenColor, rgbaToHex } from "@/lib/utils/color-utils"
import { useEditorSidebarContext } from "@/components/editor/editor-sidebar-context"

// Tab sub-components
import { GeneralTab } from "./general-tab"
import { ColorsTab } from "./colors-tab"
import { ImagesTab } from "./images-tab"

interface DatasetSettingsProps {
    className?: string
}

type DatasetTab = 'general' | 'colors' | 'images'

export function DatasetSettings({ className }: DatasetSettingsProps) {
    const { setActiveTab: setSidebarActiveTab } = useEditorSidebarContext()
    const {
        chartData,
        chartType,
        chartMode,
        setChartMode,
        activeDatasetIndex,
        setActiveDatasetIndex,
        chartConfig,
        groups,
        activeGroupId,
        hasJSON,
        setHasJSON,
    } = useChartStore()

    const { updateChartConfig } = useChartActions()

    const uniformityMode = chartConfig?.visualSettings?.uniformityMode || 'uniform';
    const setUniformityMode = (mode: 'uniform' | 'mixed') => {
        updateChartConfig({
            ...chartConfig,
            visualSettings: {
                ...chartConfig?.visualSettings,
                uniformityMode: mode,
                fillArea: chartConfig?.visualSettings?.fillArea ?? true,
                showBorder: chartConfig?.visualSettings?.showBorder ?? true,
                showImages: chartConfig?.visualSettings?.showImages ?? true,
                showLabels: chartConfig?.visualSettings?.showLabels ?? false,
            }
        });
    };

    const {
        addDataset,
        removeDataset,
        updateDataset,
        updatePointImage,
        updateLabels,
        setChartType,
        addGroup,
        updateGroup,
        deleteGroup,
        setActiveGroup,
    } = useChartActions()

    // ─── Tab state ───
    const [activeTab, setActiveTab] = useState<DatasetTab>('general')

    // ─── General tab state ───
    const [datasetsDropdownOpen, setDatasetsDropdownOpen] = useState(true)
    const [showAddDatasetModal, setShowAddDatasetModal] = useState(false)

    // ─── Colors tab state ───
    const [colorOpacity, setColorOpacity] = useState(100)
    const [borderColorMode, setBorderColorMode] = useState<'auto' | 'manual'>('auto')
    const [manualBorderColor, setManualBorderColor] = useState('#000000')

    // ─── Images tab state ───
    const [selectedImageType, setSelectedImageType] = useState('regular')
    const [imageUploadUrl, setImageUploadUrl] = useState('')

    // ─── Full edit modal state ───
    const [showFullEditModal, setShowFullEditModal] = useState(false)
    const [fullEditRows, setFullEditRows] = useState<{ label: string; value: number; color: string; imageUrl: string | null; x?: number; y?: number; r?: number }[]>([])
    const [editingDatasetIndex, setEditingDatasetIndex] = useState<number>(0)
    const [editingDatasetName, setEditingDatasetName] = useState<string>("")
    const [editingColorMode, setEditingColorMode] = useState<'slice' | 'dataset'>('slice')
    const [editingDatasetColor, setEditingDatasetColor] = useState<string>('#3b82f6')
    const [editingChartType, setEditingChartType] = useState<import("@/lib/chart-store").SupportedChartType>('bar')
    const [preservedSliceColors, setPreservedSliceColors] = useState<string[]>([])

    // ─── Delete confirmation state ───
    const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
    const [datasetToDelete, setDatasetToDelete] = useState<number | null>(null)
    const [showGroupDeleteDialog, setShowGroupDeleteDialog] = useState(false)
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null)

    // ─── Filtered datasets ───
    const filteredDatasets = chartData.datasets.filter(dataset => {
        if (dataset.mode) {
            if (dataset.mode !== chartMode) return false;
            if (chartMode === 'grouped' && dataset.groupId !== activeGroupId) {
                return false;
            }
            return true;
        }
        return true
    })

    // Derive colorMode from persisted dataset state so it survives tab switches
    const colorMode = useMemo(() => {
        if (chartMode !== 'grouped' || filteredDatasets.length === 0) return 'dataset';
        return (filteredDatasets[0] as any)?.datasetColorMode === 'slice' ? 'slice' : 'dataset';
    }, [chartMode, filteredDatasets]);

    // Sync opacity slider to reflect the actual opacity of the current mode's colors
    useEffect(() => {
        if (chartMode !== 'grouped' || filteredDatasets.length === 0) return;
        const firstDataset = filteredDatasets[0];
        const firstColor = Array.isArray(firstDataset.backgroundColor)
            ? firstDataset.backgroundColor[0]
            : firstDataset.backgroundColor;
        if (typeof firstColor === 'string' && firstColor.startsWith('rgba')) {
            const match = firstColor.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/);
            if (match) {
                setColorOpacity(Math.round(parseFloat(match[1]) * 100));
                return;
            }
        }
        setColorOpacity(100);
    }, [colorMode, chartMode, filteredDatasets]);

    // Sync backendConversationId to match the active single-mode dataset or active grouped-mode group
    useEffect(() => {
        if (chartMode === 'single') {
            if (chartData.datasets && chartData.datasets.length > 0) {
                const activeDs = chartData.datasets[activeDatasetIndex];
                const sourceId = activeDs?.sourceId || null;
                useChatStore.getState().setBackendConversationId(sourceId);
            } else {
                useChatStore.getState().setBackendConversationId(null);
            }
        } else {
            const activeGroup = groups.find(g => g.id === activeGroupId);
            const sourceId = activeGroup?.sourceId || null;
            useChatStore.getState().setBackendConversationId(sourceId);
        }
    }, [chartMode, activeDatasetIndex, activeGroupId, chartData.datasets, groups]);

    // ─── Handlers ───

    const handleChartModeChange = (mode: 'single' | 'grouped') => {
        setChartMode(mode);
        if (!hasJSON) setHasJSON(true);
        if (mode === 'single' && activeDatasetIndex === -1) {
            setActiveDatasetIndex(0);
        }
    };

    const handleConvertToGrouped = () => {
        const currentState = useChartStore.getState();

        // Derive group name from chart title or first dataset name
        const chartTitle = currentState.chartConfig?.plugins?.title?.text;
        const firstDataset = currentState.chartData?.datasets?.[0];
        const groupName = (typeof chartTitle === 'string' && chartTitle && chartTitle !== 'My Chart')
            ? chartTitle
            : firstDataset?.sourceTitle || firstDataset?.label || 'Group 0';

        // Determine category from chart type
        const isCoordinate = ['scatter', 'bubble'].includes(chartType);
        const category = isCoordinate ? 'coordinate' as const : 'categorical' as const;

        // Create the group via GroupService
        const groupId = addGroup({
            name: groupName,
            category,
            uniformityMode: 'uniform',
            baseChartType: chartType,
            chartConfig: currentState.chartConfig ? JSON.parse(JSON.stringify(currentState.chartConfig)) : undefined,
            sourceId: useChatStore.getState().backendConversationId || undefined,
            sourceTitle: groupName,
        });

        // Migrate all existing datasets into the new group
        const updatedDatasets = currentState.chartData.datasets.map((ds: any) => ({
            ...ds,
            groupId: groupId,
            mode: 'grouped',
        }));

        // Update the store: switch mode, update datasets, mirror to groupedModeData, and clear singleModeData
        const newChartData = { ...currentState.chartData, datasets: updatedDatasets };
        useChartStore.setState({
            chartMode: 'grouped',
            chartData: newChartData,
            groupedModeData: newChartData,
            singleModeData: { labels: [], datasets: [] }, // Clear single mode data since it's migrated
        });

        if (!hasJSON) setHasJSON(true);
        toast.success(`Converted to grouped chart "${groupName}"`);
    };

    const handleActiveGroupChange = (groupId: string) => {
        setActiveGroup(groupId);
        const group = groups.find(g => g.id === groupId);
        if (group?.sourceId) {
            useChatStore.getState().setBackendConversationId(group.sourceId);
        } else {
            useChatStore.getState().setBackendConversationId(null);
        }
    };

    const handleActiveDatasetChange = (index: number) => {
        setActiveDatasetIndex(index);
        if (!hasJSON) setHasJSON(true);

        if (chartMode === 'single') {
            const dataset = chartData.datasets[index];
            if (dataset && (dataset as any).chartType) {
                setChartType((dataset as any).chartType);
            }

            const sourceId = (dataset as any)?.sourceId;
            if (sourceId) {
                useChatStore.getState().setBackendConversationId(sourceId);
            } else {
                useChatStore.getState().setBackendConversationId(null);
            }
        }
    };

    const handleUpdateDataset = (datasetIndex: number, updates: Partial<ExtendedChartDataset> | string, value?: any) => {
        if (typeof updates === 'string') {
            updateDataset(datasetIndex, { [updates]: value });
        } else {
            updateDataset(datasetIndex, updates);
        }
    };

    const handleOpenAddDatasetModal = () => {
        setShowAddDatasetModal(true);
    };

    const handleDatasetTileClick = (datasetIndex: number) => {
        const dataset = filteredDatasets[datasetIndex]
        if (!dataset) return

        const datasetChartType = (dataset as any).chartType || chartType
        const isCoordinateChart = datasetChartType === 'scatter' || datasetChartType === 'bubble'

        setEditingChartType(datasetChartType)

        const currentSliceLabels = dataset.sliceLabels || chartData.labels || []

        const rows: { label: string; value: number; color: string; imageUrl: string | null; x?: number; y?: number; r?: number }[] = dataset.data.map((val, i) => {
            const rawColor = Array.isArray(dataset.backgroundColor)
                ? (dataset.backgroundColor[i] as string)
                : (dataset.backgroundColor as string) || '#3b82f6'

            if (isCoordinateChart && typeof val === 'object' && val !== null) {
                const point = val as { x: number; y: number; r?: number }
                return {
                    label: String(currentSliceLabels[i] || `Point ${i + 1}`),
                    value: 0,
                    color: rgbaToHex(rawColor),
                    imageUrl: dataset.pointImages?.[i] || null,
                    x: point.x ?? 0,
                    y: point.y ?? 0,
                    r: point.r ?? (datasetChartType === 'bubble' ? 10 : undefined),
                }
            } else {
                return {
                    label: String(currentSliceLabels[i] || `Slice ${i + 1}`),
                    value: typeof val === 'number' ? val : (Array.isArray(val) ? ((val[1] - val[0]) as number) : (val as any)?.y ?? 0),
                    color: rgbaToHex(rawColor),
                    imageUrl: dataset.pointImages?.[i] || null,
                }
            }
        })

        setFullEditRows(rows)
        setEditingDatasetIndex(datasetIndex)
        setEditingDatasetName(dataset.label || dataset.sourceTitle || `Dataset ${datasetIndex + 1}`)

        const isSingleColorMode = (dataset as any).datasetColorMode === 'single' ||
            (typeof dataset.backgroundColor === 'string')
        const currentColorMode = isSingleColorMode ? 'dataset' : 'slice'

        setEditingColorMode(currentColorMode)

        if (currentColorMode === 'dataset') {
            const singleColor = typeof dataset.backgroundColor === 'string'
                ? dataset.backgroundColor
                : (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : '#3b82f6')
            setEditingDatasetColor(rgbaToHex(singleColor))
        } else {
            const firstColor = Array.isArray(dataset.backgroundColor)
                ? dataset.backgroundColor[0]
                : dataset.backgroundColor || '#3b82f6'
            setEditingDatasetColor(rgbaToHex(firstColor))
        }

        setPreservedSliceColors(rows.map(row => row.color))
        setShowFullEditModal(true)
    }

    const handleDeleteClick = (datasetIndex: number) => {
        setDatasetToDelete(datasetIndex)
        setShowDeleteConfirmDialog(true)
    }

    const handleConfirmDelete = () => {
        if (datasetToDelete !== null) {
            const datasetToRemove = filteredDatasets[datasetToDelete];
            const actualIndex = chartData.datasets.findIndex(d => d === datasetToRemove);
            if (actualIndex !== -1) {
                // Calculate the new active dataset index before deletion
                let newActiveIndex = activeDatasetIndex;
                const remainingDatasets = chartData.datasets.filter((_, i) => i !== actualIndex);
                
                if (activeDatasetIndex === actualIndex) {
                    // Active dataset is being deleted
                    if (remainingDatasets.length > 0) {
                        newActiveIndex = Math.min(actualIndex, remainingDatasets.length - 1);
                    } else {
                        newActiveIndex = 0;
                    }
                } else if (activeDatasetIndex > actualIndex) {
                    // Shifting index down
                    newActiveIndex = activeDatasetIndex - 1;
                }

                // Perform deletion
                removeDataset(actualIndex);

                // Update active dataset index
                setActiveDatasetIndex(newActiveIndex);

                // Sync chart settings for single/grouped mode
                if (remainingDatasets.length === 0) {
                    useChatStore.getState().setBackendConversationId(null);
                    useChartStore.setState({ chartTitle: null, currentSnapshotId: null });
                } else if (chartMode === 'single') {
                    const newActiveDataset = remainingDatasets[newActiveIndex];
                    if (newActiveDataset) {
                        const newType = newActiveDataset.chartType || (newActiveDataset as any).type || 'bar';
                        setChartType(newType);

                        const sourceId = (newActiveDataset as any)?.sourceId;
                        if (sourceId) {
                            useChatStore.getState().setBackendConversationId(sourceId);
                        } else {
                            useChatStore.getState().setBackendConversationId(null);
                        }
                    }
                }
            }
            setShowDeleteConfirmDialog(false);
            setDatasetToDelete(null);
        }
    }

    const handleCancelDelete = () => {
        setShowDeleteConfirmDialog(false)
        setDatasetToDelete(null)
    }

    const handleColorModeChange = (mode: 'slice' | 'dataset') => {
        setEditingColorMode(mode)
        if (mode === 'slice') {
            setFullEditRows(prev => prev.map((row, index) => ({
                ...row,
                color: preservedSliceColors[index] || row.color
            })))
        } else {
            setFullEditRows(prev => prev.map(row => ({
                ...row,
                color: editingDatasetColor
            })))
        }
    }

    const handleDatasetColorChange = (color: string) => {
        setEditingDatasetColor(color)
        if (editingColorMode === 'dataset') {
            setFullEditRows(prev => prev.map(row => ({
                ...row,
                color: color
            })))
        }
    }

    // ─── Effects ───

    // Listen for openAddDatasetModal event from chart preview empty state
    useEffect(() => {
        const handleOpenAddDatasetModalEvent = () => {
            setShowAddDatasetModal(true);
        };
        window.addEventListener('openAddDatasetModal', handleOpenAddDatasetModalEvent);
        return () => {
            window.removeEventListener('openAddDatasetModal', handleOpenAddDatasetModalEvent);
        };
    }, []);

    // Auto-switch to uniform mode for incompatible chart types in grouped mode
    useEffect(() => {
        if (chartMode === 'grouped' && ['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble', 'pie3d', 'doughnut3d'].includes(chartType as any) && uniformityMode === 'mixed') {
            setUniformityMode('uniform');
        }
    }, [chartType, chartMode, uniformityMode, setUniformityMode]);

    // Handle slice/dataset color mode toggling — called explicitly by button clicks only
    const handleColorModeToggle = (newMode: 'slice' | 'dataset') => {
        if (chartMode !== 'grouped') return;
        if (newMode === colorMode) return;

        const DEFAULT_PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

        chartData.datasets.forEach((dataset, datasetIndex) => {
            if ((dataset as any).mode !== 'grouped') return;

            if (newMode === 'dataset') {
                // Switching TO dataset mode:
                let updates: any = {};

                // 1. Save current slice colors so we can restore them later
                if (Array.isArray(dataset.backgroundColor) && dataset.backgroundColor.length > 0) {
                    const bg = dataset.backgroundColor as string[];
                    const hasDifferentColors = bg.some((c: string) => c !== bg[0]);
                    if (hasDifferentColors) {
                        updates.lastSliceColors = [...bg];
                    }
                }

                // 2. Determine the base color: prefer saved dataset color, then current first color, then palette
                const savedDatasetColor = (dataset as any).lastDatasetColor;
                const baseColor = savedDatasetColor
                    || (dataset as any).color
                    || (Array.isArray(dataset.backgroundColor)
                        ? (dataset.backgroundColor[0] || DEFAULT_PALETTE[datasetIndex % DEFAULT_PALETTE.length])
                        : (dataset.backgroundColor || DEFAULT_PALETTE[datasetIndex % DEFAULT_PALETTE.length]));

                // 3. Flood all slices with the uniform dataset color
                updates.backgroundColor = Array(dataset.data.length).fill(baseColor);
                updates.borderColor = Array(dataset.data.length).fill(darkenColor(baseColor, 20));
                updates.datasetColorMode = 'single';

                // Apply all updates in one call
                handleUpdateDataset(datasetIndex, updates);

            } else {
                // Switching TO slice mode:
                let updates: any = {};

                // 1. Save current dataset color so we can restore it when switching back
                const currentUniformColor = Array.isArray(dataset.backgroundColor)
                    ? (dataset.backgroundColor[0] || DEFAULT_PALETTE[datasetIndex % DEFAULT_PALETTE.length])
                    : (dataset.backgroundColor || DEFAULT_PALETTE[datasetIndex % DEFAULT_PALETTE.length]);
                updates.lastDatasetColor = currentUniformColor;

                // 2. Restore previously saved slice colors, or assign default palette colors
                const saved = (dataset as any).lastSliceColors;
                if (Array.isArray(saved) && saved.length === dataset.data.length) {
                    updates.backgroundColor = [...saved];
                    updates.borderColor = saved.map((c: string) => darkenColor(c, 20));
                } else {
                    // No saved colors — assign default palette colors per slice
                    const sliceColors = dataset.data.map((_: any, i: number) =>
                        DEFAULT_PALETTE[i % DEFAULT_PALETTE.length]
                    );
                    updates.backgroundColor = sliceColors;
                    updates.borderColor = sliceColors.map((c: string) => darkenColor(c, 20));
                }

                updates.datasetColorMode = 'slice';

                // Apply all updates in one call
                handleUpdateDataset(datasetIndex, updates);
            }
        });
    };

    // Update opacity state when dataset changes in single mode
    useEffect(() => {
        if (chartMode === 'single' && activeDatasetIndex >= 0) {
            const activeDataset = chartData.datasets[activeDatasetIndex]
            if (!activeDataset) return

            const bgColor = Array.isArray(activeDataset.backgroundColor)
                ? activeDataset.backgroundColor[0]
                : activeDataset.backgroundColor

            if (bgColor && bgColor.startsWith('rgba')) {
                const match = bgColor.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
                if (match) {
                    const detectedOpacity = Math.round(parseFloat(match[1]) * 100)
                    setColorOpacity(detectedOpacity)
                }
            } else {
                setColorOpacity(100)
            }

            const firstPointConfig = activeDataset.pointImageConfig?.[0]
            if (firstPointConfig?.type) {
                setSelectedImageType(firstPointConfig.type)
            } else {
                setSelectedImageType('regular')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDatasetIndex, chartMode, chartData]);

    // ─── Render ───

    return (
        <div className="space-y-4">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap max-w-full px-2">
                {[
                    { id: 'general' as const, label: 'General' },
                    { id: 'colors' as const, label: 'Colors' },
                    { id: 'images' as const, label: 'Images' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-0">
                {activeTab === 'general' && (
                    <GeneralTab
                        chartMode={chartMode}
                        chartType={chartType}

                        groups={groups}
                        activeGroupId={activeGroupId}
                        activeDatasetIndex={activeDatasetIndex}
                        chartData={chartData}
                        chartConfig={chartConfig}
                        filteredDatasets={filteredDatasets}
                        datasetsDropdownOpen={datasetsDropdownOpen}
                        showAddDatasetModal={showAddDatasetModal}
                        setDatasetsDropdownOpen={setDatasetsDropdownOpen}
                        setShowAddDatasetModal={setShowAddDatasetModal}
                        handleChartModeChange={handleChartModeChange}
                        handleConvertToGrouped={handleConvertToGrouped}

                        handleActiveGroupChange={handleActiveGroupChange}
                        handleActiveDatasetChange={handleActiveDatasetChange}
                        handleOpenAddDatasetModal={handleOpenAddDatasetModal}
                        handleDatasetTileClick={handleDatasetTileClick}
                        handleDeleteClick={handleDeleteClick}
                        addGroup={addGroup}
                        updateGroup={updateGroup}
                        setGroupToDelete={setGroupToDelete}
                        setShowGroupDeleteDialog={setShowGroupDeleteDialog}
                        addDataset={addDataset}
                        updateChartConfig={updateChartConfig}
                    />
                )}
                {activeTab === 'colors' && (
                    chartType === 'waterfall' ? (
                        <div className="flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 my-2">
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full mb-3 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/30">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 animate-pulse">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122l9.37-9.37m0 0l-1.06-1.06a1.5 1.5 0 00-2.12 0L6.75 15.686a.75.75 0 00-.22.53v2.25c0 .414.336.75.75.75h2.25c.199 0 .39-.079.53-.22l9.37-9.37z" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1.5 font-sans">Waterfall Chart Colors</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[240px] leading-relaxed mb-4 font-sans">
                                Color schemes for Increase, Decrease, and Total steps are customized together in the <span className="font-semibold text-slate-700 dark:text-slate-300">Styling tab</span> to keep them consistent.
                            </p>
                            <button
                                onClick={() => setSidebarActiveTab('labels')}
                                className="group relative px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm hover:shadow active:scale-98 transition-all duration-200 flex items-center gap-1.5"
                            >
                                <span>Go to Styling & Labels</span>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </button>
                        </div>
                    ) : (
                        <ColorsTab
                            chartMode={chartMode}
                            chartType={chartType}
                            chartData={chartData}
                            activeDatasetIndex={activeDatasetIndex}
                            filteredDatasets={filteredDatasets}
                            colorMode={colorMode}
                            setColorMode={handleColorModeToggle}
                            colorOpacity={colorOpacity}
                            setColorOpacity={setColorOpacity}
                            borderColorMode={borderColorMode}
                            manualBorderColor={manualBorderColor}
                            handleUpdateDataset={handleUpdateDataset}
                            updateDataset={updateDataset}
                        />
                    )
                )}
                {activeTab === 'images' && (
                    <ImagesTab
                        chartMode={chartMode}
                        chartType={chartType}
                        chartData={chartData}
                        activeDatasetIndex={activeDatasetIndex}
                        selectedImageType={selectedImageType}
                        setSelectedImageType={setSelectedImageType}
                        imageUploadUrl={imageUploadUrl}
                        setImageUploadUrl={setImageUploadUrl}
                        updatePointImage={updatePointImage}
                        updateDataset={updateDataset}
                        activeGroupId={activeGroupId}
                        groups={groups}
                    />
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Dataset</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to remove this dataset from the current chart? This will only remove it from the active workspace and won't delete any saved files from your cloud history unless you save the changes.
                        </p>
                        {datasetToDelete !== null && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium text-gray-900">
                                    Dataset: {chartMode === 'single'
                                        ? (filteredDatasets[datasetToDelete]?.sourceTitle || filteredDatasets[datasetToDelete]?.label || `Dataset ${datasetToDelete + 1}`)
                                        : (filteredDatasets[datasetToDelete]?.label || filteredDatasets[datasetToDelete]?.sourceTitle || `Dataset ${datasetToDelete + 1}`)
                                    }
                                </p>
                                <p className="text-xs text-gray-500">
                                    {filteredDatasets[datasetToDelete]?.data.length || 0} data points
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleCancelDelete}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleConfirmDelete}>
                            Delete Dataset
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Group Delete Confirmation Dialog */}
            <Dialog open={showGroupDeleteDialog} onOpenChange={setShowGroupDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete Group</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Are you sure you want to remove this group from the current chart? All datasets in this group will be removed from the active workspace. This won't delete any saved files from your cloud history unless you save the changes.
                        </p>
                        {groupToDelete !== null && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                                <p className="text-sm font-medium text-gray-900">
                                    Group: {groups.find(g => g.id === groupToDelete)?.name || 'Unknown'}
                                </p>
                                <p className="text-xs text-red-600 font-medium">
                                    {chartData.datasets.filter(d => d.groupId === groupToDelete).length} dataset(s) will be removed from workspace
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowGroupDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (groupToDelete) {
                                    const groupName = groups.find(g => g.id === groupToDelete)?.name || 'Unknown';
                                    deleteGroup(groupToDelete);
                                    toast.success(`Deleted group "${groupName}"`);
                                }
                                setShowGroupDeleteDialog(false);
                                setGroupToDelete(null);
                            }}
                        >
                            Delete Group
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Full Edit Modal */}
            <Dialog open={showFullEditModal} onOpenChange={setShowFullEditModal}>
                <DialogContent className="max-w-3xl w-full">
                    <DialogHeader>
                        <DialogTitle>
                            {chartType === 'scatter' || chartType === 'bubble'
                                ? `Edit Coordinate Data (${chartType === 'bubble' ? 'Bubble' : 'Scatter'})`
                                : 'Edit Dataset'}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Dataset Name and Color Section */}
                    <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 space-y-1">
                                <Label className="text-xs font-medium text-gray-600">Dataset Name</Label>
                                <Input
                                    value={editingDatasetName}
                                    onChange={(e) => setEditingDatasetName(e.target.value)}
                                    placeholder="Enter dataset name"
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-gray-600">Color Mode</Label>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-md px-2 py-1">
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="color-mode"
                                                value="slice"
                                                checked={editingColorMode === 'slice'}
                                                onChange={() => handleColorModeChange('slice')}
                                                className="w-3 h-3 text-blue-600"
                                            />
                                            <span className="text-xs text-gray-600">Slice</span>
                                        </label>
                                        <label className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="color-mode"
                                                value="dataset"
                                                checked={editingColorMode === 'dataset'}
                                                onChange={() => handleColorModeChange('dataset')}
                                                className="w-3 h-3 text-blue-600"
                                            />
                                            <span className="text-xs text-gray-600">Dataset</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <input
                                            type="color"
                                            value={editingDatasetColor}
                                            onChange={(e) => handleDatasetColorChange(e.target.value)}
                                            disabled={editingColorMode === 'slice'}
                                            className={`w-7 h-7 p-0 border-0 rounded cursor-pointer ${editingColorMode === 'slice' ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        />
                                        <Input
                                            value={editingDatasetColor}
                                            onChange={(e) => handleDatasetColorChange(e.target.value)}
                                            disabled={editingColorMode === 'slice'}
                                            className={`h-7 text-xs w-16 font-mono ${editingColorMode === 'slice' ? 'opacity-40' : ''}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-auto max-h-[55vh] space-y-1.5 mt-3">
                        {/* Header Row */}
                        {fullEditRows.length > 0 && (
                            <div className={`grid gap-1.5 items-center py-1.5 px-2 bg-gray-50 rounded-md border border-gray-100 text-xs font-medium text-gray-500 ${editingChartType === 'scatter' || editingChartType === 'bubble' ? (editingChartType === 'bubble' ? 'grid-cols-12' : 'grid-cols-10') : 'grid-cols-12'}`}>
                                {editingChartType === 'scatter' || editingChartType === 'bubble' ? (
                                    <>
                                        <div className="col-span-3">Label</div>
                                        <div className="col-span-2">X</div>
                                        <div className="col-span-2">Y</div>
                                        {editingChartType === 'bubble' && <div className="col-span-2">Size (R)</div>}
                                        <div className="col-span-3">Color</div>
                                    </>
                                ) : (
                                    <>
                                        <div className="col-span-4">Name</div>
                                        <div className="col-span-2">Value</div>
                                        <div className="col-span-3">Color</div>
                                        <div className="col-span-3">Image</div>
                                    </>
                                )}
                            </div>
                        )}
                        {fullEditRows.map((row, i) => {
                            const isCoordinateChart = editingChartType === 'scatter' || editingChartType === 'bubble'

                            if (isCoordinateChart) {
                                return (
                                    <div key={i} className={`grid gap-1.5 items-center py-1.5 px-2 border border-gray-100 rounded-md bg-white hover:border-gray-200 transition-colors ${editingChartType === 'bubble' ? 'grid-cols-12' : 'grid-cols-10'}`}>
                                        <div className="col-span-3">
                                            <Input value={row.label} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} className="h-7 text-xs" placeholder={`Point ${i + 1}`} />
                                        </div>
                                        <div className="col-span-2">
                                            <Input type="number" value={row.x ?? 0} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, x: Number(e.target.value) } : r))} className="h-7 text-xs" placeholder="X" step="0.1" />
                                        </div>
                                        <div className="col-span-2">
                                            <Input type="number" value={row.y ?? 0} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, y: Number(e.target.value) } : r))} className="h-7 text-xs" placeholder="Y" step="0.1" />
                                        </div>
                                        {editingChartType === 'bubble' && (
                                            <div className="col-span-2">
                                                <Input type="number" value={row.r ?? 10} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, r: Number(e.target.value) } : r))} className="h-7 text-xs" placeholder="R" min="1" step="1" />
                                            </div>
                                        )}
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-1">
                                                <input type="color" className={`w-7 h-7 p-0 border-0 rounded cursor-pointer ${editingColorMode === 'dataset' ? 'opacity-40' : ''}`} value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} disabled={editingColorMode === 'dataset'} />
                                                <Input className={`h-7 text-xs flex-1 font-mono ${editingColorMode === 'dataset' ? 'opacity-40' : ''}`} value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} disabled={editingColorMode === 'dataset'} placeholder="#hex" />
                                            </div>
                                        </div>
                                    </div>
                                )
                            } else {
                                return (
                                    <div key={i} className="grid grid-cols-12 gap-1.5 items-center py-1.5 px-2 border border-gray-100 rounded-md bg-white hover:border-gray-200 transition-colors">
                                        <div className="col-span-4">
                                            <Input value={row.label} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))} className="h-7 text-xs" placeholder={`Name ${i + 1}`} />
                                        </div>
                                        <div className="col-span-2">
                                            <Input type="number" value={row.value} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, value: Number(e.target.value) } : r))} className="h-7 text-xs" placeholder="Value" />
                                        </div>
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-1">
                                                <input type="color" className={`w-7 h-7 p-0 border-0 rounded cursor-pointer ${editingColorMode === 'dataset' ? 'opacity-40' : ''}`} value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} disabled={editingColorMode === 'dataset'} />
                                                <Input className={`h-7 text-xs flex-1 font-mono ${editingColorMode === 'dataset' ? 'opacity-40' : ''}`} value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} disabled={editingColorMode === 'dataset'} placeholder="#hex" />
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs px-2"
                                                    onClick={async () => {
                                                        const input = document.createElement('input')
                                                        input.type = 'file'
                                                        input.accept = 'image/*'
                                                        input.onchange = async (e) => {
                                                            const file = (e.target as HTMLInputElement).files?.[0]
                                                            if (!file) return

                                                            const {
                                                                compressImage,
                                                                validateImageFile,
                                                                getAvailableLocalStorageSpace,
                                                                shouldCleanupImages,
                                                                getImagesToCleanup,
                                                                wouldExceedQuota
                                                            } = await import('@/lib/image-utils')

                                                            if (!validateImageFile(file, 10)) {
                                                                toast.error('Invalid image file. Please select an image file under 10MB.')
                                                                return
                                                            }

                                                            try {
                                                                const availableSpace = getAvailableLocalStorageSpace()
                                                                if (availableSpace < 200 * 1024) {
                                                                    const cleanupInfo = shouldCleanupImages(chartData, 1 * 1024 * 1024)
                                                                    if (cleanupInfo.needed) {
                                                                        chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                                                                            const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
                                                                            if (indicesToRemove.length > 0) {
                                                                                const newPointImages = [...(dataset.pointImages || [])]
                                                                                indicesToRemove.forEach((idx: number) => {
                                                                                    newPointImages[idx] = null
                                                                                })
                                                                                updateDataset(dsIdx, { pointImages: newPointImages })
                                                                            }
                                                                        })
                                                                    }
                                                                }

                                                                const compressedImageUrl = await compressImage(file, 600, 600, 0.7, true)

                                                                if (wouldExceedQuota(compressedImageUrl)) {
                                                                    const cleanupInfo = shouldCleanupImages(chartData, 2 * 1024 * 1024)
                                                                    if (cleanupInfo.needed) {
                                                                        chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                                                                            const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
                                                                            if (indicesToRemove.length > 0) {
                                                                                const newPointImages = [...(dataset.pointImages || [])]
                                                                                indicesToRemove.forEach((idx: number) => {
                                                                                    newPointImages[idx] = null
                                                                                })
                                                                                updateDataset(dsIdx, { pointImages: newPointImages })
                                                                            }
                                                                        })
                                                                        if (wouldExceedQuota(compressedImageUrl)) {
                                                                            toast.error('Storage quota exceeded. Please remove some images.')
                                                                            return
                                                                        }
                                                                    }
                                                                }

                                                                setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, imageUrl: compressedImageUrl } : r))
                                                            } catch (error: any) {
                                                                console.error('Error compressing image:', error)
                                                                if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
                                                                    toast.error('Storage quota exceeded. Please remove some images.')
                                                                } else {
                                                                    toast.error('Failed to process image. Please try a smaller file.')
                                                                }
                                                            }
                                                        }
                                                        input.click()
                                                    }}
                                                >
                                                    <Upload className="h-3 w-3 mr-1" /> {fullEditRows[i]?.imageUrl ? 'Change' : 'Upload'}
                                                </Button>
                                                {!!fullEditRows[i]?.imageUrl && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, imageUrl: null } : r))}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    </div>
                    <div className="flex justify-end gap-1.5 pt-3 border-t border-gray-100">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={() => {
                                if (fullEditRows.length === 0) return
                                const datasetIndex = editingDatasetIndex
                                if (datasetIndex === -1 || !filteredDatasets[datasetIndex]) return

                                const isCoordinateChart = chartType === 'scatter' || chartType === 'bubble'

                                const labels = fullEditRows.map(r => r.label)
                                const colors = fullEditRows.map(r => r.color)
                                const images = fullEditRows.map(r => r.imageUrl)

                                if (isCoordinateChart) {
                                    const coordinateData = fullEditRows.map(r => {
                                        const point: { x: number; y: number; r?: number } = {
                                            x: r.x ?? 0,
                                            y: r.y ?? 0,
                                        }
                                        if (chartType === 'bubble') {
                                            point.r = r.r ?? 10
                                        }
                                        return point
                                    })

                                    updateDataset(datasetIndex, {
                                        label: editingDatasetName,
                                        sliceLabels: labels,
                                        data: coordinateData as any,
                                        backgroundColor: editingColorMode === 'dataset' ? editingDatasetColor : (colors as any),
                                        datasetColorMode: editingColorMode === 'dataset' ? 'single' : 'slice',
                                        color: editingColorMode === 'dataset' ? editingDatasetColor : undefined,
                                    })
                                } else {
                                    const values = fullEditRows.map(r => r.value)

                                    updateDataset(datasetIndex, {
                                        label: editingDatasetName,
                                        sliceLabels: labels,
                                        data: values as any,
                                        backgroundColor: editingColorMode === 'dataset' ? editingDatasetColor : (colors as any),
                                        pointImages: images as any,
                                        datasetColorMode: editingColorMode === 'dataset' ? 'single' : 'slice',
                                        color: editingColorMode === 'dataset' ? editingDatasetColor : undefined,
                                    })
                                }

                                updateLabels(labels)
                                setShowFullEditModal(false)
                            }}
                        >
                            Save
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
