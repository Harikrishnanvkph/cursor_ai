import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

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
    if (!currentDataset) return null;

    return (
        <div className="space-y-4">
            {/* Data Management */}
            <div className="space-y-3">
                <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-blue-900">
                            {currentDataset.data.length} Data Point{currentDataset.data.length !== 1 ? 's' : ''}
                        </Label>
                        <Button
                            size="sm"
                            onClick={() => setShowAddPointModal(true)}
                            disabled={chartMode === 'grouped' && filteredDatasets.length > 1}
                            className="h-7 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Point
                        </Button>
                    </div>

                    {chartMode === 'grouped' && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-xs text-yellow-800">
                                <strong>Grouped Mode:</strong> Editing Slice names, Adding/removing points is disabled to maintain dataset consistency.
                            </p>
                        </div>
                    )}

                    {chartMode === 'grouped' && filteredDatasets.length === 1 && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-800">
                                <strong>Grouped Mode:</strong> This is the first dataset. You can customize points and structure.
                            </p>
                        </div>
                    )}

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
                                                disabled={chartMode === 'grouped' && filteredDatasets.length > 1}
                                                title={chartMode === 'grouped' && filteredDatasets.length > 1 ? 'Cannot remove points in Grouped Mode' : 'Remove point'}
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
                                                disabled={chartMode === 'grouped' && filteredDatasets.length > 1}
                                                title={chartMode === 'grouped' && filteredDatasets.length > 1 ? 'Cannot remove points in Grouped Mode' : 'Remove point'}
                                            >
                                                <Trash2 className="h-3 w-3 text-red-500" />
                                            </button>
                                        </div>
                                    </div>
                                )
                            }
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
