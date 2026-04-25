"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Palette } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { type ExtendedChartDataset } from "@/lib/chart-store"
import { darkenColor, hexToRgba, getHexFromColor, applyOpacityToColor } from "@/lib/utils/color-utils"

interface ColorsTabProps {
    chartMode: string
    chartType: string
    chartData: any
    activeDatasetIndex: number
    filteredDatasets: ExtendedChartDataset[]
    colorMode: 'slice' | 'dataset'
    setColorMode: (mode: 'slice' | 'dataset') => void
    colorOpacity: number
    setColorOpacity: (opacity: number) => void
    borderColorMode: 'auto' | 'manual'
    manualBorderColor: string
    handleUpdateDataset: (datasetIndex: number, updates: Partial<ExtendedChartDataset> | string, value?: any) => void
    updateDataset: (datasetIndex: number, updates: Partial<ExtendedChartDataset>) => void
}

const COLOR_PALETTES = [
    { name: 'Default', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'] },
    { name: 'Vibrant', colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'] },
    { name: 'Pastel', colors: ['#fad2d2', '#d4e4ff', '#c7f2d0', '#fff2a8', '#e5d4ff', '#ffd8e5'] },
    { name: 'Earth', colors: ['#8d6e63', '#a1887f', '#bcaaa4', '#d7ccc8', '#8bc34a', '#4caf50'] },
    { name: 'Ocean', colors: ['#006064', '#0097a7', '#00acc1', '#00bcd4', '#26c6da', '#4dd0e1'] },
]

const QUICK_COLORS = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
    '#06b6d4', '#f97316', '#14b8a6', '#eab308', '#a855f7', '#f43f5e',
    '#0ea5e9', '#dc2626', '#059669', '#ca8a04', '#9333ea', '#e11d48',
    '#22c55e', '#f59e0b', '#6366f1', '#d946ef', '#84cc16', '#fb923c'
]

export function ColorsTab({
    chartMode,
    chartData,
    activeDatasetIndex,
    colorMode,
    setColorMode,
    colorOpacity,
    setColorOpacity,
    borderColorMode,
    manualBorderColor,
    handleUpdateDataset,
    updateDataset,
}: ColorsTabProps) {

    const applyColorPalette = (colors: string[]) => {
        if (chartMode === 'single') {
            const activeDataset = chartData.datasets[activeDatasetIndex]
            if (!activeDataset) return

            const sliceColors = colors.slice(0, activeDataset.data.length)
            const borderColors = borderColorMode === 'manual'
                ? Array(activeDataset.data.length).fill(manualBorderColor)
                : sliceColors.map((c: string) => darkenColor(c, 20))

            handleUpdateDataset(activeDatasetIndex, {
                backgroundColor: sliceColors,
                borderColor: borderColors
            })
        } else {
            chartData.datasets.forEach((dataset: any, datasetIndex: number) => {
                const datasetColor = colors[datasetIndex % colors.length]
                if (colorMode === 'dataset') {
                    const borderColors = borderColorMode === 'manual'
                        ? Array(dataset.data.length).fill(manualBorderColor)
                        : Array(dataset.data.length).fill(darkenColor(datasetColor, 20))

                    handleUpdateDataset(datasetIndex, {
                        backgroundColor: Array(dataset.data.length).fill(datasetColor),
                        borderColor: borderColors,
                        datasetColorMode: 'single'
                    })
                } else {
                    const sliceColors = colors.slice(0, dataset.data.length)
                    const borderColors = borderColorMode === 'manual'
                        ? Array(dataset.data.length).fill(manualBorderColor)
                        : sliceColors.map((c: string) => darkenColor(c, 20))

                    handleUpdateDataset(datasetIndex, {
                        backgroundColor: sliceColors,
                        borderColor: borderColors,
                        datasetColorMode: 'slice'
                    })
                }
            })
        }
    }

    const applyQuickColor = (color: string, opacity?: number) => {
        const activeDataset = chartData.datasets[activeDatasetIndex]
        if (!activeDataset) return

        const alpha = (opacity !== undefined ? opacity : colorOpacity) / 100
        const finalColor = alpha < 1 ? hexToRgba(color, alpha) : color

        const sliceCount = activeDataset.data.length

        let finalBorderColor
        if (borderColorMode === 'manual') {
            finalBorderColor = Array(sliceCount).fill(manualBorderColor)
        } else {
            const darkenedColor = darkenColor(color, 20)
            finalBorderColor = Array(sliceCount).fill(alpha < 1 ? hexToRgba(darkenedColor, alpha) : darkenedColor)
        }

        handleUpdateDataset(activeDatasetIndex, {
            backgroundColor: Array(sliceCount).fill(finalColor),
            borderColor: finalBorderColor,
            datasetColorMode: chartMode === 'grouped' ? colorMode : undefined
        })
    }

    const applyOpacity = (opacity: number) => {
        const activeDataset = chartData.datasets[activeDatasetIndex]
        if (!activeDataset) return

        let newBgColors: any
        if (Array.isArray(activeDataset.backgroundColor)) {
            newBgColors = activeDataset.backgroundColor.map((color: any) =>
                typeof color === 'string' ? applyOpacityToColor(color, opacity) : color
            )
        } else if (typeof activeDataset.backgroundColor === 'string') {
            newBgColors = applyOpacityToColor(activeDataset.backgroundColor, opacity)
        } else {
            newBgColors = activeDataset.backgroundColor
        }

        const preservedBorderColor = Array.isArray(activeDataset.borderColor)
            ? [...activeDataset.borderColor]
            : activeDataset.borderColor

        handleUpdateDataset(activeDatasetIndex, {
            backgroundColor: newBgColors,
            borderColor: preservedBorderColor as any,
            datasetColorMode: chartMode === 'grouped' ? colorMode : undefined
        })
    }

    const getCurrentColor = () => {
        const activeDataset = chartData.datasets[activeDatasetIndex]
        if (!activeDataset) return '#3b82f6'

        const bgColor = activeDataset.backgroundColor
        if (Array.isArray(bgColor)) {
            const firstColor = bgColor[0]
            return typeof firstColor === 'string' ? firstColor : '#3b82f6'
        }
        return typeof bgColor === 'string' ? bgColor : '#3b82f6'
    }

    const getCurrentOpacity = () => {
        const activeDataset = chartData.datasets[activeDatasetIndex]
        if (!activeDataset) return 100

        let firstColor = ''
        if (Array.isArray(activeDataset.backgroundColor)) {
            const color = activeDataset.backgroundColor[0]
            firstColor = typeof color === 'string' ? color : ''
        } else {
            const color = activeDataset.backgroundColor
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

    return (
        <div className="space-y-4">
            {/* Color Mode Selection - Only show for grouped mode */}
            {chartMode === 'grouped' && (
                <>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Color Mode</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant={colorMode === 'slice' ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setColorMode('slice')}
                            >
                                Slice Colors
                            </Button>
                            <Button
                                variant={colorMode === 'dataset' ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() => setColorMode('dataset')}
                            >
                                Dataset Colors
                            </Button>
                        </div>
                    </div>

                    {/* Individual Colors */}
                    <div className="space-y-2 mt-3">
                        <Label className="text-xs font-medium text-gray-700">
                            {colorMode === 'slice' ? 'Slice Colors' : 'Dataset Colors'}
                        </Label>
                        <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200 max-h-60 overflow-y-auto">
                            {colorMode === 'slice' ? (
                                <>
                                    {(chartData.labels || []).map((label: any, sliceIndex: number) => {
                                        const firstDataset = chartData.datasets[0];
                                        const currentColor = Array.isArray(firstDataset?.backgroundColor)
                                            ? firstDataset.backgroundColor[sliceIndex] || '#3b82f6'
                                            : firstDataset?.backgroundColor || '#3b82f6';

                                        return (
                                            <div key={sliceIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                                                <span className="text-xs font-medium">
                                                    {String(label) || `Slice ${sliceIndex + 1}`}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                        style={{ backgroundColor: typeof currentColor === 'string' ? currentColor : '#3b82f6' }}
                                                        onClick={() => document.getElementById(`slice-color-${sliceIndex}`)?.click()}
                                                    />
                                                    <input
                                                        id={`slice-color-${sliceIndex}`}
                                                        type="color"
                                                        value={typeof currentColor === 'string' ? currentColor : '#3b82f6'}
                                                        onChange={(e) => {
                                                            chartData.datasets.forEach((dataset: any, datasetIndex: number) => {
                                                                const newBgColors = Array.isArray(dataset.backgroundColor)
                                                                    ? [...dataset.backgroundColor]
                                                                    : Array(dataset.data.length).fill(dataset.backgroundColor || '#3b82f6');
                                                                const newBorderColors = Array.isArray(dataset.borderColor)
                                                                    ? [...dataset.borderColor]
                                                                    : Array(dataset.data.length).fill(dataset.borderColor || '#1d4ed8');

                                                                newBgColors[sliceIndex] = e.target.value;
                                                                newBorderColors[sliceIndex] = darkenColor(e.target.value, 20);

                                                                handleUpdateDataset(datasetIndex, {
                                                                    backgroundColor: newBgColors,
                                                                    borderColor: newBorderColors,
                                                                    datasetColorMode: 'slice',
                                                                    lastSliceColors: newBgColors
                                                                });
                                                            });
                                                        }}
                                                        className="invisible w-0"
                                                    />
                                                    <Input
                                                        value={typeof currentColor === 'string' ? currentColor : '#3b82f6'}
                                                        onChange={(e) => {
                                                            chartData.datasets.forEach((dataset: any, datasetIndex: number) => {
                                                                const newBgColors = Array.isArray(dataset.backgroundColor)
                                                                    ? [...dataset.backgroundColor]
                                                                    : Array(dataset.data.length).fill(dataset.backgroundColor || '#3b82f6');
                                                                const newBorderColors = Array.isArray(dataset.borderColor)
                                                                    ? [...dataset.borderColor]
                                                                    : Array(dataset.data.length).fill(dataset.borderColor || '#1d4ed8');

                                                                newBgColors[sliceIndex] = e.target.value;
                                                                newBorderColors[sliceIndex] = darkenColor(e.target.value, 20);

                                                                handleUpdateDataset(datasetIndex, {
                                                                    backgroundColor: newBgColors,
                                                                    borderColor: newBorderColors,
                                                                    datasetColorMode: 'slice',
                                                                    lastSliceColors: newBgColors
                                                                });
                                                            });
                                                        }}
                                                        className="w-20 h-6 text-xs font-mono uppercase"
                                                        placeholder="#3b82f6"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </>
                            ) : (
                                <>
                                    {chartData.datasets.map((dataset: any, datasetIndex: number) => (
                                        <div key={datasetIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                                            <span className="text-xs font-medium">
                                                {dataset.label || `Dataset ${datasetIndex + 1}`}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                                                    style={{
                                                        backgroundColor: Array.isArray(dataset.backgroundColor)
                                                            ? dataset.backgroundColor[0]
                                                            : dataset.backgroundColor
                                                    }}
                                                    onClick={() => document.getElementById(`dataset-color-${datasetIndex}`)?.click()}
                                                />
                                                <input
                                                    id={`dataset-color-${datasetIndex}`}
                                                    type="color"
                                                    value={Array.isArray(dataset.backgroundColor)
                                                        ? dataset.backgroundColor[0]
                                                        : dataset.backgroundColor || '#3b82f6'}
                                                    onChange={(e) => {
                                                        const sliceCount = dataset.data.length;
                                                        handleUpdateDataset(datasetIndex, {
                                                            backgroundColor: Array(sliceCount).fill(e.target.value),
                                                            borderColor: Array(sliceCount).fill(darkenColor(e.target.value, 20)),
                                                            datasetColorMode: 'single',
                                                            lastDatasetColor: e.target.value
                                                        })
                                                    }}
                                                    className="invisible w-0"
                                                />
                                                <Input
                                                    value={Array.isArray(dataset.backgroundColor)
                                                        ? dataset.backgroundColor[0]
                                                        : dataset.backgroundColor || '#3b82f6'}
                                                    onChange={(e) => {
                                                        const sliceCount = dataset.data.length;
                                                        handleUpdateDataset(datasetIndex, {
                                                            backgroundColor: Array(sliceCount).fill(e.target.value),
                                                            borderColor: Array(sliceCount).fill(darkenColor(e.target.value, 20)),
                                                            datasetColorMode: 'single',
                                                            lastDatasetColor: e.target.value
                                                        })
                                                    }}
                                                    className="w-20 h-6 text-xs font-mono uppercase"
                                                    placeholder="#3b82f6"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Opacity Control for Grouped Mode */}
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
                                        chartData.datasets.forEach((_: any, datasetIndex: number) => {
                                            const dataset = chartData.datasets[datasetIndex]

                                            let newBgColors: any
                                            if (Array.isArray(dataset.backgroundColor)) {
                                                newBgColors = dataset.backgroundColor.map((color: any) =>
                                                    typeof color === 'string' ? applyOpacityToColor(color, 100) : color
                                                )
                                            } else if (typeof dataset.backgroundColor === 'string') {
                                                newBgColors = applyOpacityToColor(dataset.backgroundColor, 100)
                                            } else {
                                                newBgColors = dataset.backgroundColor
                                            }

                                            const preservedBorderColor = Array.isArray(dataset.borderColor)
                                                ? [...dataset.borderColor]
                                                : dataset.borderColor

                                            updateDataset(datasetIndex, {
                                                backgroundColor: newBgColors,
                                                borderColor: preservedBorderColor as any,
                                                datasetColorMode: colorMode === 'dataset' ? 'single' : 'slice'
                                            })
                                        })
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
                                    chartData.datasets.forEach((_: any, datasetIndex: number) => {
                                        const dataset = chartData.datasets[datasetIndex]

                                        let newBgColors: any
                                        if (Array.isArray(dataset.backgroundColor)) {
                                            newBgColors = dataset.backgroundColor.map((color: any) =>
                                                typeof color === 'string' ? applyOpacityToColor(color, value[0]) : color
                                            )
                                        } else if (typeof dataset.backgroundColor === 'string') {
                                            newBgColors = applyOpacityToColor(dataset.backgroundColor, value[0])
                                        } else {
                                            newBgColors = dataset.backgroundColor
                                        }

                                        const preservedBorderColor = Array.isArray(dataset.borderColor)
                                            ? [...dataset.borderColor]
                                            : dataset.borderColor

                                        updateDataset(datasetIndex, {
                                            backgroundColor: newBgColors,
                                            borderColor: preservedBorderColor as any,
                                            datasetColorMode: colorMode === 'dataset' ? 'single' : 'slice'
                                        })
                                    })
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
                            Adjusts opacity for background colors (borders unchanged)
                        </p>
                    </div>
                </>
            )}

            {/* Color Picker for Single Mode */}
            {chartMode === 'single' && (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Dataset Color</Label>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex-1 flex items-center gap-3">
                                <div className="relative">
                                    <div
                                        className="absolute inset-0 rounded-lg"
                                        style={{
                                            backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                                            backgroundSize: '8px 8px',
                                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                                        }}
                                    />
                                    <div
                                        className="relative w-12 h-12 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                                        style={{ backgroundColor: getCurrentColor() }}
                                        onClick={() => document.getElementById('single-mode-color-picker')?.click()}
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="text-xs font-medium text-gray-700">Current Color</div>
                                    <div className="text-[10px] text-gray-500 font-mono uppercase">{getCurrentColor()}</div>
                                </div>
                            </div>
                            <input
                                id="single-mode-color-picker"
                                type="color"
                                value={getHexFromColor(getCurrentColor())}
                                onChange={(e) => applyQuickColor(e.target.value)}
                                className="invisible w-0 h-0"
                            />
                        </div>
                    </div>

                    {/* Opacity/Transparency Control */}
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

                    {/* Quick Color Swatches */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium text-gray-700">Pick Quick Dataset Colors</Label>
                        <div className="grid grid-cols-8 gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            {QUICK_COLORS.map((color, index) => (
                                <button
                                    key={index}
                                    className="w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                                    onClick={() => {
                                        setColorOpacity(100)
                                        applyQuickColor(color, 100)
                                    }}
                                    title={color}
                                >
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                                            backgroundSize: '4px 4px',
                                            backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
                                        }}
                                    />
                                    <div
                                        className="absolute inset-0"
                                        style={{ backgroundColor: color }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Preset Palettes */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xs font-semibold text-gray-900">Preset Palettes</h3>
                </div>

                <div className="space-y-2">
                    <div className="grid gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        {COLOR_PALETTES.map((palette, index) => (
                            <button
                                key={index}
                                className="flex items-center justify-between p-2 bg-white rounded border hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer"
                                onClick={() => applyColorPalette(palette.colors)}
                                title={`Apply ${palette.name} palette`}
                            >
                                <span className="text-xs font-medium text-gray-700">{palette.name}</span>
                                <div className="flex gap-1">
                                    {palette.colors.map((color, colorIndex) => (
                                        <div
                                            key={colorIndex}
                                            className="w-5 h-5 rounded border border-white shadow-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Reset Button */}
                    <div className="flex justify-center">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs w-full"
                            onClick={() => applyColorPalette(COLOR_PALETTES[0].colors)}
                        >
                            <Palette className="h-3 w-3 mr-1" />
                            Reset to Default Palette
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
