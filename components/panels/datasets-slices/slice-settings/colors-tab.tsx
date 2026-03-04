import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface ColorsTabProps {
    chartMode: string
    currentDataset: any
    chartData: any
    globalColor: string
    setGlobalColor: (color: string) => void
    updateDataset: (datasetIndex: number, updates: any) => void
    currentSliceLabels: string[]
    handleColorChange: (pointIndex: number, color: string) => void
}

export function ColorsTab({
    chartMode,
    currentDataset,
    chartData,
    globalColor,
    setGlobalColor,
    updateDataset,
    currentSliceLabels,
    handleColorChange
}: ColorsTabProps) {
    if (!currentDataset) return null;

    return (
        <div className="space-y-4">
            {/* Global Color (Single mode only) */}
            {chartMode === 'single' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                        <h3 className="text-[0.80rem] font-semibold text-gray-900">Global Color</h3>
                    </div>
                    <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={globalColor}
                                onChange={(e) => setGlobalColor(e.target.value)}
                                className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer"
                            />
                            <Input value={globalColor} onChange={(e) => setGlobalColor(e.target.value)} className="w-24 h-8 text-xs font-mono uppercase" />
                        </div>
                        <Button
                            size="sm"
                            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
                            onClick={() => {
                                const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
                                if (datasetIndex === -1) return
                                // Single call ensures color mode and color are applied atomically
                                updateDataset(datasetIndex, { datasetColorMode: 'single', color: globalColor })
                            }}
                        >
                            Apply to All
                        </Button>
                    </div>
                </div>
            )}

            {/* Colors Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                    <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                    <h3 className="text-[0.80rem] font-semibold text-gray-900">Individual Colors</h3>
                </div>

                <div className="bg-pink-50 rounded-lg p-3">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {currentDataset.data.map((_: any, pointIndex: number) => {
                            const currentColor = Array.isArray(currentDataset.backgroundColor)
                                ? currentDataset.backgroundColor[pointIndex]
                                : currentDataset.backgroundColor

                            // Check if color is transparent
                            const isTransparent = currentColor && (
                                currentColor.includes('rgba') && currentColor.includes(', 0)') ||
                                currentColor.includes('rgba') && currentColor.includes(', 0.00)') ||
                                currentColor === 'transparent'
                            )

                            return (
                                <div key={pointIndex} className="flex items-center justify-between p-2 bg-white rounded border min-w-0">
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                        <span className="text-xs font-medium text-gray-500 flex-shrink-0">#{pointIndex + 1}</span>
                                        <span className="text-xs truncate">{String(currentSliceLabels[pointIndex] || `Point ${pointIndex + 1}`)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <div
                                            className="w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform relative"
                                            style={{ backgroundColor: currentColor || '#3b82f6' }}
                                            onClick={() => document.getElementById(`slice-color-${pointIndex}`)?.click()}
                                        >
                                            {/* Transparent indicator - diagonal stripes */}
                                            {isTransparent && (
                                                <div className="absolute inset-0 rounded" style={{
                                                    backgroundImage: `repeating-linear-gradient(
                            45deg,
                            #ccc 0px,
                            #ccc 2px,
                            transparent 2px,
                            transparent 4px
                          )`
                                                }} />
                                            )}
                                            {/* Transparent indicator - "T" text */}
                                            {isTransparent && (
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <span className="text-[8px] font-bold text-red-600">T</span>
                                                </div>
                                            )}
                                        </div>
                                        <input
                                            id={`slice-color-${pointIndex}`}
                                            type="color"
                                            value={currentColor || '#3b82f6'}
                                            onChange={(e) => handleColorChange(pointIndex, e.target.value)}
                                            className="invisible w-0"
                                        />
                                        <Input
                                            value={currentColor || '#3b82f6'}
                                            onChange={(e) => handleColorChange(pointIndex, e.target.value)}
                                            className="w-20 h-6 text-xs font-mono uppercase"
                                            placeholder="#3b82f6"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}
