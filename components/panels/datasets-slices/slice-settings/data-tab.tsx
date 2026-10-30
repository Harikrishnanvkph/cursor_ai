import { useState, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Upload, Database, TrendingUp, Calendar, ChevronDown, ChevronUp, Layers } from "lucide-react"
import { DataImportModal } from "@/components/dialogs/data-import-modal"

interface DataTabProps {
    chartMode: string
    filteredDatasets: any[]
    currentDataset: any
    isSelectedGroupCoordinateChart: boolean
    selectedGroupChartType: string
    currentSliceLabels: string[]
    handleLabelChange: (pointIndex: number, value: string) => void
    removeSlice: (sliceIndex: number) => void
    handleDataPointUpdate: (pointIndex: number, value: string, field?: 'x' | 'y' | 'r') => void
    setShowAddPointModal: (show: boolean) => void
}

export function DataTab({
    chartMode,
    filteredDatasets,
    currentDataset,
    isSelectedGroupCoordinateChart,
    selectedGroupChartType,
    currentSliceLabels,
    handleLabelChange,
    removeSlice,
    handleDataPointUpdate,
    setShowAddPointModal
}: DataTabProps) {
    const [showImportModal, setShowImportModal] = useState(false)
    const [showAllRows, setShowAllRows] = useState(false)

    if (!currentDataset) return null

    const totalPoints = currentDataset.data?.length || 0
    const isDense = totalPoints > 50 || selectedGroupChartType === 'timeline'

    // Compute summary stats for dense datasets
    const stats = useMemo(() => {
        if (!isDense || totalPoints === 0) return null

        const firstLabel = currentSliceLabels[0] || 'Start'
        const lastLabel = currentSliceLabels[currentSliceLabels.length - 1] || 'End'

        let minVal = Infinity
        let maxVal = -Infinity
        let sum = 0
        let validCount = 0

        for (const item of currentDataset.data) {
            const val = typeof item === 'number' ? item : (typeof item === 'object' && item?.y !== undefined ? Number(item.y) : NaN)
            if (!isNaN(val)) {
                if (val < minVal) minVal = val
                if (val > maxVal) maxVal = val
                sum += val
                validCount++
            }
        }

        const avgVal = validCount > 0 ? (sum / validCount).toFixed(2) : 'N/A'
        const lastVal = validCount > 0 ? (typeof currentDataset.data[totalPoints - 1] === 'number' ? currentDataset.data[totalPoints - 1] : currentDataset.data[totalPoints - 1]?.y ?? 'N/A') : 'N/A'

        return {
            firstLabel,
            lastLabel,
            minVal: minVal === Infinity ? 'N/A' : minVal.toLocaleString(),
            maxVal: maxVal === -Infinity ? 'N/A' : maxVal.toLocaleString(),
            avgVal,
            lastVal: typeof lastVal === 'number' ? lastVal.toLocaleString() : lastVal
        }
    }, [isDense, totalPoints, currentDataset.data, currentSliceLabels])

    return (
        <div className="space-y-4">
            {/* Header with counts and action buttons */}
            <div className="space-y-3">
                <div className="bg-blue-50/70 border border-blue-100 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5">
                            <Database className="w-3.5 h-3.5 text-blue-700" />
                            <Label className="text-xs font-semibold text-blue-900">
                                {totalPoints.toLocaleString()} Data Point{totalPoints !== 1 ? 's' : ''}
                            </Label>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setShowImportModal(true)}
                                className="h-7 text-xs bg-white text-blue-700 hover:bg-blue-50 border-blue-200 shadow-xs font-medium"
                            >
                                <Upload className="h-3 w-3 mr-1" />
                                Import / Paste
                            </Button>
                            <Button
                                size="sm"
                                onClick={() => setShowAddPointModal(true)}
                                className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Point
                            </Button>
                        </div>
                    </div>

                    {chartMode === 'grouped' && (
                        <div className="p-2 bg-blue-100/60 border border-blue-200/80 rounded-lg">
                            <p className="text-xs text-blue-800">
                                <strong>Grouped Mode:</strong> Adding, removing, or importing points applies uniformly across all datasets in this group.
                            </p>
                        </div>
                    )}

                    {/* Dense Dataset Summary Guard Card */}
                    {isDense && stats && (
                        <div className="bg-white rounded-lg border border-blue-200 p-3 space-y-2.5 shadow-2xs">
                            <div className="flex items-center justify-between">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <TrendingUp className="w-2.5 h-2.5" />
                                    Dense Dataset Mode Active
                                </span>
                                <span className="text-[11px] text-slate-500 font-mono">
                                    {totalPoints.toLocaleString()} entries
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Span</span>
                                    <span className="font-semibold text-slate-800 truncate block text-[11px]" title={`${stats.firstLabel} → ${stats.lastLabel}`}>
                                        {stats.firstLabel} → {stats.lastLabel}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Latest Value</span>
                                    <span className="font-semibold text-emerald-700 font-mono block text-[11px]">
                                        {stats.lastVal}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Min</span>
                                    <span className="font-medium text-slate-700 font-mono block text-[11px]">
                                        {stats.minVal}
                                    </span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Max</span>
                                    <span className="font-medium text-slate-700 font-mono block text-[11px]">
                                        {stats.maxVal}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-1 flex items-center justify-between border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowAllRows(!showAllRows)}
                                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 transition-colors"
                                >
                                    {showAllRows ? (
                                        <>
                                            <ChevronUp className="w-3 h-3" />
                                            Hide individual row editors
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="w-3 h-3" />
                                            Show all {totalPoints} row inputs (may affect performance)
                                        </>
                                    )}
                                </button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowImportModal(true)}
                                    className="h-6 text-[10px] px-2 text-slate-700"
                                >
                                    Replace Data
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Row Editors (rendered when dataset is small OR user explicitly toggled expand) */}
                    {(!isDense || showAllRows) && (
                        <div className="space-y-1.5 pt-2 border-t border-blue-200 max-h-96 overflow-y-auto">
                            {currentDataset.data.map((dataPoint: any, pointIndex: number) => {
                                if (isSelectedGroupCoordinateChart) {
                                    // Enhanced layout for scatter/bubble charts with more space
                                    return (
                                        <div
                                            key={pointIndex}
                                            className="p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all space-y-2"
                                        >
                                            {/* First row: Index, Label, Delete */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500 font-medium min-w-[24px]">#{pointIndex + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        value={String(currentSliceLabels[pointIndex] ?? '')}
                                                        onChange={(e) => handleLabelChange(pointIndex, e.target.value)}
                                                        disabled={chartMode === 'grouped'}
                                                        className="w-full h-7 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition disabled:bg-gray-100 disabled:text-gray-500"
                                                        placeholder={`Point ${pointIndex + 1}`}
                                                    />
                                                </div>
                                                <button
                                                    className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                    onClick={() => removeSlice(pointIndex)}
                                                    disabled={currentDataset.data.length <= 1}
                                                    title={currentDataset.data.length <= 1 ? 'Cannot remove last point' : 'Remove point (applies to all datasets)'}
                                                >
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                </button>
                                            </div>
                                            {/* Second row: Coordinate inputs */}
                                            <div className={`grid gap-2 pl-7 ${selectedGroupChartType === 'bubble' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-medium">X</label>
                                                    <input
                                                        type="number"
                                                        value={typeof dataPoint === 'object' && dataPoint?.x !== undefined ? dataPoint.x : ''}
                                                        onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value, 'x')}
                                                        className="w-full h-7 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition"
                                                        placeholder="0"
                                                        step="0.1"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-gray-500 font-medium">Y</label>
                                                    <input
                                                        type="number"
                                                        value={typeof dataPoint === 'object' && dataPoint?.y !== undefined ? dataPoint.y : ''}
                                                        onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value, 'y')}
                                                        className="w-full h-7 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition"
                                                        placeholder="0"
                                                        step="0.1"
                                                    />
                                                </div>
                                                {selectedGroupChartType === 'bubble' && (
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] text-gray-500 font-medium">Size (R)</label>
                                                        <input
                                                            type="number"
                                                            value={typeof dataPoint === 'object' && dataPoint?.r !== undefined ? dataPoint.r : ''}
                                                            onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value, 'r')}
                                                            className="w-full h-7 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition"
                                                            placeholder="10"
                                                            min="1"
                                                            step="1"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                } else {
                                    // Original compact layout for categorical charts
                                    return (
                                        <div
                                            key={pointIndex}
                                            className="p-2 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-gray-500 font-medium min-w-[24px]">#{pointIndex + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <input
                                                        value={String(currentSliceLabels[pointIndex] ?? '')}
                                                        onChange={(e) => handleLabelChange(pointIndex, e.target.value)}
                                                        disabled={chartMode === 'grouped'}
                                                        className="w-full h-7 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition disabled:bg-gray-100 disabled:text-gray-500"
                                                        placeholder={`Name ${pointIndex + 1}`}
                                                    />
                                                </div>
                                                <div className="w-16 min-w-0">
                                                    <input
                                                        type="number"
                                                        value={typeof dataPoint === 'number' ? dataPoint : ''}
                                                        onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value)}
                                                        className="w-full h-7 px-1 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition"
                                                        placeholder="Value"
                                                    />
                                                </div>
                                                <button
                                                    className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                                                    onClick={() => removeSlice(pointIndex)}
                                                    disabled={currentDataset.data.length <= 1}
                                                    title={currentDataset.data.length <= 1 ? 'Cannot remove last point' : 'Remove point (applies to all datasets)'}
                                                >
                                                    <Trash2 className="h-3 w-3 text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    )
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Data Import Modal */}
            <DataImportModal
                open={showImportModal}
                onOpenChange={setShowImportModal}
                defaultChartType={selectedGroupChartType === 'timeline' ? 'timeline' : 'line'}
            />
        </div>
    )
}
