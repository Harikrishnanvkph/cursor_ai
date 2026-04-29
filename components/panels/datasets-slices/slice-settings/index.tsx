"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { getDefaultImageType, getDefaultImageSize, getImageOptionsForChartType, getDefaultImageConfig } from "@/lib/plugins/universal-image-plugin"
import { useChatStore } from "@/lib/chat-store"
import { Plus, Trash2, Layers, Edit } from "lucide-react"
import { toast } from "sonner"
import { EditSlicesModal } from "../EditSlicesModal"
import { DataTab } from "./data-tab"
import { ColorsTab } from "./colors-tab"
import { ImagesTab } from "./images-tab"
import { rgbaToHex } from "@/lib/utils/color-utils" // Replacing inline rgbaToHex

interface SliceSettingsProps {
    className?: string
}

type SliceTab = 'data' | 'colors' | 'images'

export function SliceSettings({ className }: SliceSettingsProps) {
    const {
        chartData,
        chartType,
        chartMode,
        activeGroupId,
        activeDatasetIndex,
        setActiveDatasetIndex,
        groups,
    } = useChartStore()

    const { updateDataset, updatePointImage, updateDataPoint, updateLabels, setChartType, setActiveGroup } = useChartActions()

    const [activeTab, setActiveTab] = useState<SliceTab>('data')
    const [showImageModal, setShowImageModal] = useState(false)
    const [selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(null)
    const [showAddPointModal, setShowAddPointModal] = useState(false)
    const [newPointName, setNewPointName] = useState("")
    const [newPointValue, setNewPointValue] = useState("")
    const [newPointColor, setNewPointColor] = useState("#1E90FF")
    const [newPointX, setNewPointX] = useState("")
    const [newPointY, setNewPointY] = useState("")
    const [newPointR, setNewPointR] = useState("10")
    const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0)
    const [showEditSlicesModal, setShowEditSlicesModal] = useState(false)
    const [showFullEditModal, setShowFullEditModal] = useState(false)
    const [globalColor, setGlobalColor] = useState<string>("#3b82f6")
    const [imageSelectedIndex, setImageSelectedIndex] = useState<number>(0)
    const [fullEditRows, setFullEditRows] = useState<{ label: string; value: number; color: string; imageUrl: string | null; x?: number; y?: number; r?: number }[]>([])
    const [selectedViewGroupId, setSelectedViewGroupId] = useState<string>(activeGroupId || 'default')

    useEffect(() => {
        if (chartMode === 'grouped' && activeGroupId) {
            setSelectedViewGroupId(activeGroupId);
        }
    }, [activeGroupId, chartMode])

    const filteredDatasets = chartData.datasets.filter((dataset: any) => {
        if (dataset.mode) {
            return dataset.mode === chartMode
        }
        return true
    })

    const currentDataset = filteredDatasets[selectedDatasetIndex] || null
    const currentSliceLabels = (currentDataset?.sliceLabels || chartData.labels || []) as string[]

    const getSelectedGroupChartType = (): string => {
        if (chartMode === 'grouped' && selectedViewGroupId !== 'default') {
            const group = groups?.find(g => g.id === selectedViewGroupId);
            if (group?.baseChartType) {
                return group.baseChartType;
            }
        }
        if (currentDataset?.data?.length > 0) {
            const firstDataPoint = currentDataset.data[0];
            if (typeof firstDataPoint === 'object' && firstDataPoint !== null) {
                if ('x' in firstDataPoint || 'y' in firstDataPoint) {
                    if ('r' in firstDataPoint) return 'bubble';
                    return 'scatter';
                }
            }
            return chartType;
        }
        return chartType;
    };

    const selectedGroupChartType = getSelectedGroupChartType();
    const isSelectedGroupCoordinateChart = selectedGroupChartType === 'scatter' || selectedGroupChartType === 'bubble';

    useEffect(() => {
        setSelectedDatasetIndex(activeDatasetIndex ?? 0)
    }, [activeDatasetIndex, chartMode])

    useEffect(() => {
        if (chartMode === 'grouped') {
            const groupDatasets = filteredDatasets
                .map((d: any, globalIndex: number) => ({ ...d, globalIndex }))
                .filter((d: any) => d.groupId === selectedViewGroupId || (!d.groupId && selectedViewGroupId === 'default'));

            if (groupDatasets.length > 0) {
                handleDatasetChange(groupDatasets[0].globalIndex);
            }
        }
    }, [selectedViewGroupId])

    useEffect(() => {
        if (!currentDataset) return
        let derived = '#3b82f6'
        const bg = (currentDataset as any).backgroundColor
        if ((currentDataset as any).datasetColorMode === 'single') {
            if (typeof (currentDataset as any).color === 'string' && (currentDataset as any).color) {
                derived = (currentDataset as any).color
            } else if (Array.isArray(bg) && typeof bg[0] === 'string' && bg[0]) {
                derived = bg[0] as string
            } else if (typeof bg === 'string' && bg) {
                derived = bg as string
            }
        } else {
            if (Array.isArray(bg) && typeof bg[0] === 'string' && bg[0]) {
                derived = bg[0] as string
            }
        }
        setGlobalColor(derived)
    }, [selectedDatasetIndex, currentDataset, chartMode, chartData])

    const handleDatasetChange = (index: number) => {
        setSelectedDatasetIndex(index)
        setActiveDatasetIndex(index)

        if (chartMode === 'single') {
            const dataset = chartData.datasets[index]
            if (dataset && (dataset as any).chartType) {
                setChartType((dataset as any).chartType)
            }

            const sourceId = (dataset as any)?.sourceId;
            if (sourceId) {
                useChatStore.getState().setBackendConversationId(sourceId);
            } else {
                useChatStore.getState().setBackendConversationId(null);
            }
        }
    }

    const handleDataPointUpdate = (pointIndex: number, value: string, field: 'x' | 'y' | 'r' = 'y') => {
        if (!currentDataset) return
        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
        if (datasetIndex === -1) return

        const numValue = parseFloat(value)
        if (isNaN(numValue)) {
            updateDataPoint(datasetIndex, pointIndex, field, null)
            return
        }
        if (chartType === 'scatter' || chartType === 'bubble') {
            updateDataPoint(datasetIndex, pointIndex, field, numValue)
        } else {
            updateDataPoint(datasetIndex, pointIndex, 'y', numValue)
        }
    }

    const handleLabelChange = (pointIndex: number, value: string) => {
        if (!currentDataset) return

        if (chartMode === 'grouped') {
            console.warn('Slice names cannot be changed in Grouped Mode to maintain dataset consistency')
            return
        }

        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
        if (datasetIndex === -1) return

        const newLabels = [...(currentDataset.sliceLabels || currentDataset.data.map((_: any, i: number) => `Slice ${i + 1}`))]
        newLabels[pointIndex] = value
        updateDataset(datasetIndex, { sliceLabels: newLabels })
        if (chartMode === 'single') {
            updateLabels(newLabels)
        }
    }

    const handleColorChange = (pointIndex: number, color: string) => {
        if (!currentDataset) return
        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
        if (datasetIndex === -1) return

        const newBackgroundColors = Array.isArray(currentDataset.backgroundColor)
            ? [...currentDataset.backgroundColor]
            : Array(currentDataset.data.length).fill(currentDataset.backgroundColor)

        newBackgroundColors[pointIndex] = color
        updateDataset(datasetIndex, { backgroundColor: newBackgroundColors })
    }

    // The huge handleImageUpload and handleImageUrlChange have been moved completely to images-tab.tsx 
    // We only export these thin wrappers that get passed down if needed, but we don't need them if they're implemented inside ImagesTab directly.
    // We will pass the necessary functions and state down.

    const addSlice = () => {
        if (!currentDataset) return
        if (chartMode === 'grouped' && filteredDatasets.length > 1) {
            console.warn('Adding slices is not allowed in Grouped Mode to maintain dataset consistency')
            return
        }
        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
        if (datasetIndex === -1) return

        const newData = [...currentDataset.data, 0]
        const newLabels = [...(currentDataset.sliceLabels || []), `Slice ${newData.length}`]

        updateDataset(datasetIndex, {
            data: newData,
            pointImages: [...(currentDataset.pointImages || []), null],
            pointImageConfig: [...(currentDataset.pointImageConfig || []), {
                type: getDefaultImageType(chartType),
                size: getDefaultImageSize(chartType),
                position: "center",
                arrow: false,
            }]
        })
        updateLabels(newLabels as string[])
    }

    const removeSlice = (sliceIndex: number) => {
        if (!currentDataset) return
        if (chartMode === 'grouped' && filteredDatasets.length > 1) {
            console.warn('Removing slices is not allowed in Grouped Mode to maintain dataset consistency')
            return
        }
        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
        if (datasetIndex === -1) return

        const newData = currentDataset.data.filter((_: any, i: number) => i !== sliceIndex)
        const newLabels = (currentDataset.sliceLabels || []).filter((_: any, i: number) => i !== sliceIndex)

        updateDataset(datasetIndex, {
            data: newData,
            pointImages: (currentDataset.pointImages || []).filter((_: any, i: number) => i !== sliceIndex),
            pointImageConfig: (currentDataset.pointImageConfig || []).filter((_: any, i: number) => i !== sliceIndex)
        })
        updateLabels(newLabels as string[])
    }

    const handleAddPoint = () => {
        if (!currentDataset) return
        if (chartMode === 'grouped' && filteredDatasets.length > 1) {
            console.warn('Adding points is not allowed in Grouped Mode to maintain dataset consistency')
            return
        }
        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
        if (datasetIndex === -1) return

        const isCoordinateChart = chartType === 'scatter' || chartType === 'bubble'
        let newData: any[]
        if (isCoordinateChart) {
            const point: { x: number; y: number; r?: number } = {
                x: Number(newPointX) || 0,
                y: Number(newPointY) || 0,
            }
            if (chartType === 'bubble') {
                point.r = Number(newPointR) || 10
            }
            newData = [...currentDataset.data, point]
        } else {
            newData = [...currentDataset.data, Number(newPointValue)]
        }

        const newLabels = [...(currentDataset.sliceLabels || []), newPointName]
        const newColors = Array.isArray(currentDataset.backgroundColor)
            ? [...currentDataset.backgroundColor, newPointColor]
            : Array(newData.length).fill(newPointColor)

        updateDataset(datasetIndex, {
            data: newData,
            backgroundColor: newColors,
            pointImages: [...(currentDataset.pointImages || []), null],
            pointImageConfig: [...(currentDataset.pointImageConfig || []), getDefaultImageConfig(chartType)]
        })
        updateLabels(newLabels as string[])
        setShowAddPointModal(false)
        setNewPointName("")
        setNewPointValue("")
        setNewPointX("")
        setNewPointY("")
        setNewPointR("10")
        setNewPointColor("#1E90FF")
    }

    const renderTabContent = (tab: SliceTab) => {
        switch (tab) {
            case 'data':
                return <DataTab
                    chartMode={chartMode}
                    filteredDatasets={filteredDatasets}
                    currentDataset={currentDataset}
                    isSelectedGroupCoordinateChart={isSelectedGroupCoordinateChart}
                    selectedGroupChartType={selectedGroupChartType}
                    currentSliceLabels={currentSliceLabels}
                    handleLabelChange={handleLabelChange}
                    removeSlice={removeSlice}
                    handleDataPointUpdate={handleDataPointUpdate}
                    setShowAddPointModal={setShowAddPointModal}
                />
            case 'colors':
                return <ColorsTab
                    chartMode={chartMode}
                    currentDataset={currentDataset}
                    chartData={chartData}
                    globalColor={globalColor}
                    setGlobalColor={setGlobalColor}
                    updateDataset={updateDataset}
                    currentSliceLabels={currentSliceLabels}
                    handleColorChange={handleColorChange}
                />
            case 'images':
                return <ImagesTab
                    chartMode={chartMode}
                    chartType={chartType}
                    chartData={chartData}
                    currentDataset={currentDataset}
                    currentSliceLabels={currentSliceLabels}
                    imageSelectedIndex={imageSelectedIndex}
                    setImageSelectedIndex={setImageSelectedIndex}
                    getImageOptionsForChartType={getImageOptionsForChartType as any}
                    getDefaultImageConfig={getDefaultImageConfig as any}
                    getDefaultImageSize={getDefaultImageSize as any}
                    handleImageUpload={(pointIndex, event) => { }} // Handled internally in ImagesTab now
                    handleImageUrlChange={(pointIndex, url) => { }} // Handled internally in ImagesTab now
                    handleImageConfigChange={(pointIndex, keyOrUpdates, value) => {
                        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
                        if (datasetIndex === -1) return
                        const currentConfig = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
                        const imageUrl = (currentDataset.pointImages?.[pointIndex] as string | undefined) ?? ''

                        let newConfig;
                        if (typeof keyOrUpdates === 'string') {
                            newConfig = { ...currentConfig, [keyOrUpdates]: value };
                            if (keyOrUpdates === 'arrowLine' && value === false) {
                                newConfig.arrowHead = false;
                            }
                        } else {
                            newConfig = { ...currentConfig, ...keyOrUpdates };
                        }

                        updatePointImage(datasetIndex, pointIndex, imageUrl, newConfig);
                    }}
                    updatePointImage={updatePointImage}
                    updateDataset={updateDataset}
                />
            default:
                return null
        }
    }

    if (!currentDataset) {
        return (
            <div className="flex items-center justify-center p-8 text-center">
                <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-900">No Dataset Available</p>
                    <p className="text-xs text-gray-500">Please add a dataset first to manage slices.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Dataset Selection */}
            <div className="space-y-2">
                {chartMode === 'grouped' && (
                    <div className="flex justify-center mb-3">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowEditSlicesModal(true)}
                            className="w-full gap-2 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-medium shadow-sm"
                        >
                            <Layers className="w-4 h-4" />
                            Edit All Group Datasets
                        </Button>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    {chartMode === 'grouped' ? (
                        <div className="flex items-end gap-3 w-full">
                            <div className="flex-1 min-w-0">
                                <Label className="text-[0.70rem] font-medium text-gray-500 mb-1 block">Group</Label>
                                <Select
                                    value={selectedViewGroupId}
                                    onValueChange={(value) => {
                                        setSelectedViewGroupId(value);
                                        setActiveGroup(value);

                                        const group = groups.find(g => g.id === value);
                                        if (group?.sourceId) {
                                            useChatStore.getState().setBackendConversationId(group.sourceId);
                                        } else {
                                            useChatStore.getState().setBackendConversationId(null);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-8 w-full text-xs bg-blue-50 border-blue-200 hover:bg-blue-100">
                                        <SelectValue placeholder="Select Group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem key="default" value="default">Default Group</SelectItem>
                                        {(groups || []).filter(g => !g.isDefault).map(group => (
                                            <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 min-w-0">
                                <Label className="text-[0.70rem] font-medium text-gray-500 mb-1 block">Dataset</Label>
                                {(() => {
                                    const groupDatasets = filteredDatasets
                                        .map((d: any, globalIndex: number) => ({ ...d, globalIndex }))
                                        .filter((d: any) => d.groupId === selectedViewGroupId || (!d.groupId && selectedViewGroupId === 'default'));

                                    if (groupDatasets.length === 0) {
                                        return (
                                            <div className="h-8 w-full flex items-center justify-center border rounded bg-gray-50 text-xs text-gray-400 italic">
                                                No datasets
                                            </div>
                                        );
                                    }

                                    return (
                                        <Select value={String(selectedDatasetIndex)} onValueChange={(value) => handleDatasetChange(Number(value))}>
                                            <SelectTrigger className="h-8 w-full text-xs bg-blue-50 border-blue-200 hover:bg-blue-100">
                                                <span className="text-xs truncate">
                                                    {filteredDatasets[selectedDatasetIndex]?.label || `Dataset ${selectedDatasetIndex + 1}`}
                                                </span>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {groupDatasets.map((dataset: any) => (
                                                    <SelectItem key={dataset.globalIndex} value={String(dataset.globalIndex)}>
                                                        {dataset.label || `Dataset ${dataset.globalIndex + 1}`} ({dataset.data.length} pts)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    );
                                })()}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-end gap-3 w-full">
                            <div className="flex-1 min-w-0">
                                <Label className="text-[0.70rem] font-medium text-gray-500 mb-1 block">Dataset</Label>
                                <Select value={String(selectedDatasetIndex)} onValueChange={(value) => handleDatasetChange(Number(value))}>
                                    <SelectTrigger className="h-8 w-full text-xs bg-blue-50 border-blue-200 hover:bg-blue-100">
                                        <span className="text-xs truncate">{chartMode === 'single' ? (filteredDatasets[selectedDatasetIndex]?.sourceTitle || filteredDatasets[selectedDatasetIndex]?.label || `Dataset ${selectedDatasetIndex + 1}`) : (filteredDatasets[selectedDatasetIndex]?.label || `Dataset ${selectedDatasetIndex + 1}`)}</span>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filteredDatasets.map((dataset: any, index: number) => (
                                            <SelectItem key={index} value={String(index)}>
                                                {chartMode === 'single'
                                                    ? (dataset.sourceTitle || dataset.label || `Dataset ${index + 1}`)
                                                    : (dataset.label || `Dataset ${index + 1}`)
                                                } ({dataset.data.length} pts)
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1.5 bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 hover:from-blue-100 hover:to-blue-200 text-blue-700 font-medium shadow-sm text-xs"
                                onClick={() => {
                                    if (!currentDataset) return
                                    const isCoordinateChart = isSelectedGroupCoordinateChart
                                    const rows = currentDataset.data.map((val: any, i: number) => {
                                        const rawColor = Array.isArray(currentDataset.backgroundColor)
                                            ? (currentDataset.backgroundColor[i] as string)
                                            : (currentDataset.backgroundColor as string) || '#3b82f6'

                                        if (isCoordinateChart && typeof val === 'object' && val !== null) {
                                            const point = val as { x: number; y: number; r?: number }
                                            return {
                                                label: String(currentSliceLabels[i] || `Point ${i + 1}`),
                                                value: 0,
                                                color: rgbaToHex(rawColor),
                                                imageUrl: currentDataset.pointImages?.[i] || null,
                                                x: point.x ?? 0,
                                                y: point.y ?? 0,
                                                r: point.r ?? (selectedGroupChartType === 'bubble' ? 10 : undefined),
                                            }
                                        } else {
                                            return {
                                                label: String(currentSliceLabels[i] || `Slice ${i + 1}`),
                                                value: typeof val === 'number' ? val : (Array.isArray(val) ? (val[1] as number) : (val as any)?.y ?? 0),
                                                color: rgbaToHex(rawColor),
                                                imageUrl: currentDataset.pointImages?.[i] || null,
                                            }
                                        }
                                    })
                                    setFullEditRows(rows as any)
                                    setShowFullEditModal(true)
                                }}>
                                <Edit className="w-3 h-3" />
                                Full Edit
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap max-w-full px-2">
                {[
                    { id: 'data' as const, label: 'Data' },
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

            <div className="min-h-0">
                {renderTabContent(activeTab)}
            </div>

            <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configure Point Image</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <p className="text-xs text-gray-600">
                            Advanced image configuration options for point #{selectedSliceIndex !== null ? selectedSliceIndex + 1 : 0} will be available here.
                        </p>
                    </div>
                    <DialogClose asChild>
                        <Button className="mt-4">Close</Button>
                    </DialogClose>
                </DialogContent>
            </Dialog>

            <Dialog open={showAddPointModal} onOpenChange={setShowAddPointModal}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>
                            {chartType === 'scatter' || chartType === 'bubble'
                                ? `Add New Point (${chartType === 'bubble' ? 'Bubble' : 'Scatter'})`
                                : 'Add New Point'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Label <span className="text-red-500">*</span></label>
                            <input
                                value={newPointName}
                                onChange={e => setNewPointName(e.target.value)}
                                className="w-full h-9 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-xs font-normal transition"
                                placeholder={chartType === 'scatter' || chartType === 'bubble' ? 'Point label' : 'Name'}
                            />
                        </div>

                        {chartType === 'scatter' || chartType === 'bubble' ? (
                            <>
                                <div className={`grid gap-3 ${chartType === 'bubble' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">X <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            value={newPointX}
                                            onChange={e => setNewPointX(e.target.value)}
                                            className="w-full h-9 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-xs font-normal transition"
                                            placeholder="0"
                                            step="0.1"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 mb-1 block">Y <span className="text-red-500">*</span></label>
                                        <input
                                            type="number"
                                            value={newPointY}
                                            onChange={e => setNewPointY(e.target.value)}
                                            className="w-full h-9 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-xs font-normal transition"
                                            placeholder="0"
                                            step="0.1"
                                        />
                                    </div>
                                    {chartType === 'bubble' && (
                                        <div>
                                            <label className="text-xs font-medium text-gray-600 mb-1 block">Size (R)</label>
                                            <input
                                                type="number"
                                                value={newPointR}
                                                onChange={e => setNewPointR(e.target.value)}
                                                className="w-full h-9 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-xs font-normal transition"
                                                placeholder="10"
                                                min="1"
                                                step="1"
                                            />
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div>
                                <label className="text-xs font-medium text-gray-600 mb-1 block">Value <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    value={newPointValue}
                                    onChange={e => setNewPointValue(e.target.value)}
                                    className="w-full h-9 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-xs font-normal transition"
                                    placeholder="Value"
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-xs font-medium text-gray-600 mb-1 block">Color</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={newPointColor}
                                    onChange={e => setNewPointColor(e.target.value)}
                                    className="w-12 h-8 p-0 border-0 bg-transparent cursor-pointer"
                                />
                                <span className="text-xs text-gray-500">{newPointColor}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <DialogClose asChild>
                            <Button variant="outline" size="sm">Cancel</Button>
                        </DialogClose>
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={
                                !newPointName.trim() ||
                                ((chartType === 'scatter' || chartType === 'bubble')
                                    ? (!newPointX.trim() || !newPointY.trim())
                                    : !newPointValue.trim())
                            }
                            onClick={handleAddPoint}
                        >
                            Add
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <EditSlicesModal
                open={showEditSlicesModal}
                onOpenChange={setShowEditSlicesModal}
                chartData={chartData}
                chartType={chartType}
                groups={groups as any}
                activeGroupId={activeGroupId}
                chartMode={chartMode}
                onSave={(newSliceLabels, newValues, editedGroupId) => {
                    chartData.datasets.forEach((ds: any, i: number) => {
                        const isInEditedGroup = ds.groupId === editedGroupId || (!ds.groupId && editedGroupId === 'default');

                        if (chartMode === 'grouped' && !isInEditedGroup) {
                            return;
                        }

                        let pic = ds.pointImageConfig || [];
                        const diff = newSliceLabels.length - pic.length;
                        if (diff > 0) {
                            pic = [...pic, ...Array(diff).fill(getDefaultImageConfig(chartType))];
                        } else if (diff < 0) {
                            pic = pic.slice(0, newSliceLabels.length);
                        }

                        let bg = Array.isArray(ds.backgroundColor) ? [...ds.backgroundColor] : Array(ds.data.length).fill(ds.backgroundColor || "#1E90FF");
                        const bgDiff = newSliceLabels.length - bg.length;
                        if (bgDiff > 0) {
                            bg = [...bg, ...Array(bgDiff).fill("#1E90FF")];
                        } else if (bgDiff < 0) {
                            bg = bg.slice(0, newSliceLabels.length);
                        }

                        let pis = ds.pointImages || [];
                        const pisDiff = newSliceLabels.length - pis.length;
                        if (pisDiff > 0) {
                            pis = [...pis, ...Array(pisDiff).fill(null)];
                        } else if (pisDiff < 0) {
                            pis = pis.slice(0, newSliceLabels.length);
                        }
                        updateDataset(i, {
                            sliceLabels: newSliceLabels,
                            data: newValues.map(row => row[i] ?? 0),
                            pointImageConfig: pic,
                            pointImages: pis,
                            backgroundColor: bg,
                        });
                    });

                    if (chartMode === 'single' || editedGroupId === 'default') {
                        updateLabels(newSliceLabels);
                    }
                }}
            />

            <Dialog open={showFullEditModal} onOpenChange={setShowFullEditModal}>
                <DialogContent className="max-w-3xl w-full max-h-[80vh] flex flex-col p-0 gap-0">
                    <DialogHeader className="px-4 py-3 border-b bg-gray-50/50">
                        <DialogTitle className="text-base font-semibold">
                            {isSelectedGroupCoordinateChart
                                ? `Edit Points (${selectedGroupChartType === 'bubble' ? 'Bubble' : 'Scatter'})`
                                : 'Edit Data Points'}
                        </DialogTitle>
                    </DialogHeader>

                    <div className={`grid gap-1.5 items-center px-4 py-2 bg-gray-50 border-b text-[10px] font-medium text-gray-500 ${isSelectedGroupCoordinateChart ? (selectedGroupChartType === 'bubble' ? 'grid-cols-12' : 'grid-cols-10') : 'grid-cols-12'}`}>
                        {isSelectedGroupCoordinateChart ? (
                            <>
                                <div className="col-span-3">Label</div>
                                <div className="col-span-2">X</div>
                                <div className="col-span-2">Y</div>
                                {selectedGroupChartType === 'bubble' && <div className="col-span-2">Size (R)</div>}
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

                    <div className="flex-1 overflow-auto px-4 py-2 space-y-1.5">
                        {chartMode === 'single' && fullEditRows.map((row, i) => {
                            const isCoordinateChart = isSelectedGroupCoordinateChart

                            if (isCoordinateChart) {
                                return (
                                    <div key={i} className={`grid gap-1.5 items-center py-1.5 px-2 border border-gray-100 rounded-md bg-white hover:border-gray-200 transition-colors ${selectedGroupChartType === 'bubble' ? 'grid-cols-12' : 'grid-cols-10'}`}>
                                        <div className="col-span-3">
                                            <Input
                                                value={row.label}
                                                onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))}
                                                className="h-7 text-xs"
                                                placeholder={`Point ${i + 1}`}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                value={row.x ?? 0}
                                                onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, x: Number(e.target.value) } : r))}
                                                className="h-7 text-xs"
                                                placeholder="X"
                                                step="0.1"
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                value={row.y ?? 0}
                                                onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, y: Number(e.target.value) } : r))}
                                                className="h-7 text-xs"
                                                placeholder="Y"
                                                step="0.1"
                                            />
                                        </div>
                                        {selectedGroupChartType === 'bubble' && (
                                            <div className="col-span-2">
                                                <Input
                                                    type="number"
                                                    value={row.r ?? 10}
                                                    onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, r: Number(e.target.value) } : r))}
                                                    className="h-7 text-xs"
                                                    placeholder="R"
                                                    min="1"
                                                    step="1"
                                                />
                                            </div>
                                        )}
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-1.5">
                                                <input
                                                    type="color"
                                                    className="w-7 h-7 p-0 border border-gray-200 rounded cursor-pointer"
                                                    value={row.color}
                                                    onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))}
                                                />
                                                <Input
                                                    className="h-7 text-xs flex-1"
                                                    value={row.color}
                                                    onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )
                            } else {
                                return (
                                    <div key={i} className="grid grid-cols-12 gap-1.5 items-center py-1.5 px-2 border border-gray-100 rounded-md bg-white hover:border-gray-200 transition-colors">
                                        <div className="col-span-4">
                                            <Input
                                                value={row.label}
                                                onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))}
                                                className="h-7 text-xs"
                                                placeholder={`Slice ${i + 1}`}
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Input
                                                type="number"
                                                value={row.value === 0 ? '' : row.value}
                                                onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, value: Number(e.target.value) } : r))}
                                                className="h-7 text-xs"
                                                placeholder="Value"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-1.5">
                                                <input type="color" className="w-7 h-7 p-0 border border-gray-200 rounded cursor-pointer" value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} />
                                                <Input className="h-7 text-xs flex-1" value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} />
                                            </div>
                                        </div>
                                        <div className="col-span-3">
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs flex-1 border-dashed gap-1"
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
                                                                toast.error('Invalid image file. Please select an image under 10MB.')
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
                                                                                indicesToRemove.forEach((idx2: number) => {
                                                                                    newPointImages[idx2] = null
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
                                                                                indicesToRemove.forEach((idx2: number) => {
                                                                                    newPointImages[idx2] = null
                                                                                })
                                                                                updateDataset(dsIdx, { pointImages: newPointImages })
                                                                            }
                                                                        })
                                                                    }
                                                                    if (wouldExceedQuota(compressedImageUrl)) {
                                                                        toast.error('Storage quota exceeded. Please remove some images.')
                                                                        return
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
                                                    {fullEditRows[i]?.imageUrl ? 'Change' : 'Upload'}
                                                </Button>
                                                {!!fullEditRows[i]?.imageUrl && (
                                                    <Button
                                                        variant="default"
                                                        size="icon"
                                                        className="h-7 w-7 text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                        onClick={() => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, imageUrl: null } : r))}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    </div>
                    <DialogFooter className="px-4 py-3 border-t bg-gray-50/50 gap-2 sm:gap-0">
                        <div className="flex-1 flex justify-start">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50 h-8 text-xs"
                                onClick={() => {
                                    const isCoordinateChart = chartType === 'scatter' || chartType === 'bubble'
                                    const newRow = isCoordinateChart ? {
                                        label: `Point ${fullEditRows.length + 1}`,
                                        value: 0,
                                        x: 0,
                                        y: 0,
                                        r: chartType === 'bubble' ? 10 : undefined,
                                        color: globalColor,
                                        imageUrl: null
                                    } : {
                                        label: `Slice ${fullEditRows.length + 1}`,
                                        value: 0,
                                        color: globalColor,
                                        imageUrl: null
                                    }
                                    setFullEditRows([...fullEditRows, newRow])
                                }}
                            >
                                <Plus className="w-3.5 h-3.5" />
                                Add Point
                            </Button>
                        </div>
                        <DialogClose asChild>
                            <Button variant="ghost" size="sm" className="h-8">Cancel</Button>
                        </DialogClose>
                        <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white h-8 min-w-[80px]"
                            onClick={() => {
                                if (!currentDataset) return
                                const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
                                if (datasetIndex === -1) return

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
                                        sliceLabels: labels,
                                        data: coordinateData as any,
                                        backgroundColor: colors as any,
                                    })
                                } else {
                                    const values = fullEditRows.map(r => r.value)
                                    updateDataset(datasetIndex, {
                                        sliceLabels: labels,
                                        data: values as any,
                                        backgroundColor: colors as any,
                                        pointImages: images as any,
                                    })
                                }

                                updateLabels(labels)
                                setShowFullEditModal(false)
                            }}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    )
}
