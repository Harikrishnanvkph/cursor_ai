import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { getHexFromColor, applyOpacityToColor } from "@/lib/utils/color-utils"

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
    const getCurrentOpacity = () => {
        if (!currentDataset) return 100

        let firstColor = ''
        if (Array.isArray(currentDataset.backgroundColor)) {
            const color = currentDataset.backgroundColor[0]
            firstColor = typeof color === 'string' ? color : ''
        } else {
            const color = currentDataset.backgroundColor
            firstColor = typeof color === 'string' ? color : ''
        }

        if (firstColor && firstColor.startsWith('rgba')) {
            const match = firstColor.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
            if (match) {
                return Math.round(parseFloat(match[1]) * 100)
            }
        }
        return 100
    }

    const [colorOpacity, setColorOpacity] = useState(getCurrentOpacity())

    // Sync state when currentDataset changes
    useEffect(() => {
        setColorOpacity(getCurrentOpacity())
    }, [currentDataset])

    const applyOpacity = (opacity: number) => {
        const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
        if (datasetIndex === -1) return

        let newBgColors: any
        if (Array.isArray(currentDataset.backgroundColor)) {
            newBgColors = currentDataset.backgroundColor.map((color: any) =>
                typeof color === 'string' ? applyOpacityToColor(color, opacity) : color
            )
        } else if (typeof currentDataset.backgroundColor === 'string') {
            newBgColors = applyOpacityToColor(currentDataset.backgroundColor, opacity)
        } else {
            newBgColors = currentDataset.backgroundColor
        }

        const preservedBorderColor = Array.isArray(currentDataset.borderColor)
            ? [...currentDataset.borderColor]
            : currentDataset.borderColor

        updateDataset(datasetIndex, {
            backgroundColor: newBgColors,
            borderColor: preservedBorderColor as any
        })
    }

    const handleSingleColorChange = (pointIndex: number, newColor: string) => {
        const finalColor = applyOpacityToColor(newColor, colorOpacity)
        handleColorChange(pointIndex, finalColor)
    }

    if (!currentDataset) return null;

    return (
        <div className="space-y-4">
            {/* Global Color (Single mode only) */}
            {chartMode === 'single' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 pb-1 border-b">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <h3 className="text-xs font-semibold text-gray-900">Global Color</h3>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 flex items-center justify-between">
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
                            className="h-8 text-xs bg-blue-600 hover:bg-blue-700"
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

            {/* Opacity Control */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-gray-700">Opacity</Label>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">{colorOpacity}%</span>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs"
                            onClick={() => {
                                setColorOpacity(100)
                                applyOpacity(100)
                            }}
                            title="Reset to fully opaque"
                        >
                            Reset
                        </Button>
                    </div>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Slider
                        value={[colorOpacity]}
                        onValueChange={(value) => {
                            setColorOpacity(value[0])
                            applyOpacity(value[0])
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="w-full"
                    />
                    <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                        <span>Transparent</span>
                        <span>Opaque</span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 italic">
                    Adjusts opacity of background colors (borders unchanged)
                </p>
            </div>

            {/* Colors Section */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xs font-semibold text-gray-900">Individual Colors</h3>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
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
                                            value={getHexFromColor(currentColor || '#3b82f6')}
                                            onChange={(e) => handleSingleColorChange(pointIndex, e.target.value)}
                                            className="invisible w-0"
                                        />
                                        <Input
                                            value={currentColor || '#3b82f6'}
                                            onChange={(e) => handleSingleColorChange(pointIndex, e.target.value)}
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

