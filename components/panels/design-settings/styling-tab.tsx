import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Palette, CircleDot, Activity } from "lucide-react"
import { darkenColor } from "@/lib/utils/color-utils"
import { useState } from "react"
import type { ChartType } from "chart.js"

interface ConfigPathUpdate {
    path: string
    value: any
}

interface StylingTabProps {
    chartData: any
    chartConfig: any
    chartType: ChartType | 'polarArea' | 'radar' | 'scatter' | 'bubble'
    handleUpdateDataset: (datasetIndex: number, property: string, value: any) => void
    handleConfigUpdate: (path: string, value: any) => void
}

export function StylingTab({ chartData, chartConfig, chartType, handleUpdateDataset, handleConfigUpdate }: StylingTabProps) {
    const [borderColorMode, setBorderColorMode] = useState<'auto' | 'manual'>('auto')
    const [manualBorderColor, setManualBorderColor] = useState('#000000')

    // Import the store hook to get the mode and active indices so we only update the right datasets
    const useChartStore = require('@/lib/chart-store').useChartStore
    const { chartMode, activeDatasetIndex, activeGroupId } = useChartStore()

    // Helper to get which datasets we should be modifying based on the view mode
    const getTargetDatasetIndices = () => {
        if (chartMode === 'single') return [activeDatasetIndex];
        // In grouped mode, find all datasets that belong to this group
        return chartData.datasets
            .map((ds: any, i: number) => ({ ds, i }))
            .filter(({ ds }: any) => ds.groupId === activeGroupId)
            .map(({ i }: any) => i);
    }

    // Safely get a reference to the primary dataset we are editing to read its current values
    const primaryIndex = chartMode === 'single' ? activeDatasetIndex : (getTargetDatasetIndices()[0] ?? 0);
    const primaryDataset = chartData.datasets[primaryIndex] || chartData.datasets[0] || {};

    return (
        <div className="space-y-3 mt-4">
            {/* Slice Border Styling - Only for slice-based and bar charts */}
            {(chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea' || chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'stackedBar' as any) && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <Palette className="h-4 w-4 text-blue-900" />
                        <h3 className="text-sm font-semibold text-blue-900">
                            {(chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea') ? 'Slice Border Styling' : 'Bar Border Styling'}
                        </h3>
                    </div>

                    {/* Border Width and Border Radius - Horizontal Layout */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Border Width */}
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Border Width</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={Number(primaryDataset.borderWidth ?? 2)}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 2
                                        getTargetDatasetIndices().forEach(index => {
                                            handleUpdateDataset(index, 'borderWidth', value)
                                        })
                                    }}
                                    className="w-full h-8 text-xs"
                                    placeholder="2"
                                    min={0}
                                    max={10}
                                    step={1}
                                />
                                <span className="text-xs text-gray-500 w-4">px</span>
                            </div>
                        </div>

                        {/* Border Radius */}
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Border Radius</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    value={Number(primaryDataset.borderRadius ?? 0)}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 0
                                        getTargetDatasetIndices().forEach(index => {
                                            handleUpdateDataset(index, 'borderRadius', value)
                                        })
                                    }}
                                    className="w-full h-8 text-xs"
                                    placeholder="0"
                                    min={0}
                                    max={200}
                                    step={1}
                                />
                                <span className="text-xs text-gray-500 w-4">px</span>
                            </div>
                        </div>
                    </div>

                    {/* Border Color */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Border Color</Label>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={borderColorMode === 'auto' ? "default" : "outline"}
                                size="sm"
                                className={`h-8 text-xs flex-1 ${borderColorMode === 'auto' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                                onClick={() => {
                                    setBorderColorMode('auto')
                                    // Apply auto border colors (darkened background colors)
                                    getTargetDatasetIndices().forEach(index => {
                                        const dataset = chartData.datasets[index];
                                        if (!dataset) return;
                                        const bgColors = Array.isArray(dataset.backgroundColor)
                                            ? dataset.backgroundColor
                                            : [dataset.backgroundColor]
                                        const autoBorderColors = bgColors.map((color: string) => darkenColor(String(color), 20))
                                        handleUpdateDataset(index, 'borderColor', autoBorderColors)
                                    })
                                }}
                            >
                                Auto
                            </Button>
                            <Button
                                variant={borderColorMode === 'manual' ? "default" : "outline"}
                                size="sm"
                                className={`h-8 text-xs flex-1 ${borderColorMode === 'manual' ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}`}
                                onClick={() => setBorderColorMode('manual')}
                            >
                                Manual
                            </Button>
                        </div>

                        {borderColorMode === 'manual' && (
                            <div className="flex items-center gap-2 h-8">
                                <div
                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: manualBorderColor }}
                                    onClick={() => document.getElementById('manual-border-color-picker')?.click()}
                                />
                                <input
                                    id="manual-border-color-picker"
                                    type="color"
                                    value={manualBorderColor}
                                    onChange={(e) => {
                                        setManualBorderColor(e.target.value)
                                        // Apply manual border color to all datasets uniformly
                                        getTargetDatasetIndices().forEach(index => {
                                            const dataset = chartData.datasets[index];
                                            if (!dataset || !dataset.data) return;
                                            const sliceCount = dataset.data.length
                                            handleUpdateDataset(index, 'borderColor', Array(sliceCount).fill(e.target.value))
                                        })
                                    }}
                                    className="absolute opacity-0 w-0 h-0"
                                />
                                <Input
                                    value={manualBorderColor}
                                    onChange={(e) => {
                                        setManualBorderColor(e.target.value)
                                        getTargetDatasetIndices().forEach(index => {
                                            const dataset = chartData.datasets[index];
                                            if (!dataset || !dataset.data) return;
                                            const sliceCount = dataset.data.length
                                            handleUpdateDataset(index, 'borderColor', Array(sliceCount).fill(e.target.value))
                                        })
                                    }}
                                    className="h-8 text-xs flex-1"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Point Settings - For all point-based charts */}
            {(chartType === 'line' || chartType === 'area' as any || chartType === 'radar' || chartType === 'scatter' || chartType === 'bubble') && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <CircleDot className="h-4 w-4 text-blue-900" />
                        <h3 className="text-sm font-semibold text-blue-900">
                            Point Settings
                        </h3>
                    </div>

                    {/* Row 1: Point Radius, Hover Radius, Border Width */}
                    <div className={`grid gap-3 ${chartType === 'bubble' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {/* Point Radius - not for bubble (bubble uses r value in data) */}
                        {chartType !== 'bubble' && (
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Point Radius</Label>
                                <Input
                                    type="number"
                                    value={Number(primaryDataset.pointRadius ?? 5)}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 5
                                        getTargetDatasetIndices().forEach(index => {
                                            handleUpdateDataset(index, 'pointRadius', value)
                                        })
                                    }}
                                    className="h-8 text-xs"
                                    placeholder="5"
                                    min={0}
                                    max={20}
                                    step={1}
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Hover Radius</Label>
                            <Input
                                type="number"
                                value={Number(primaryDataset.pointHoverRadius ?? 8)}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 8
                                    getTargetDatasetIndices().forEach(index => {
                                        handleUpdateDataset(index, 'pointHoverRadius', value)
                                    })
                                }}
                                className="h-8 text-xs"
                                placeholder="8"
                                min={0}
                                max={30}
                                step={1}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Border Width</Label>
                            <Input
                                type="number"
                                value={Number(primaryDataset.pointBorderWidth ?? 1)}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 1
                                    getTargetDatasetIndices().forEach(index => {
                                        handleUpdateDataset(index, 'pointBorderWidth', value)
                                    })
                                }}
                                className="h-8 text-xs"
                                placeholder="1"
                                min={0}
                                max={5}
                                step={1}
                            />
                        </div>
                    </div>

                    {/* Row 2: Point Style, Hover Border Width */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Point Style</Label>
                            <Select
                                value={primaryDataset.pointStyle || 'circle'}
                                onValueChange={(value) => {
                                    getTargetDatasetIndices().forEach(index => {
                                        handleUpdateDataset(index, 'pointStyle', value)
                                    })
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="circle">Circle</SelectItem>
                                    <SelectItem value="cross">Cross</SelectItem>
                                    <SelectItem value="crossRot">Cross (Rotated)</SelectItem>
                                    <SelectItem value="dash">Dash</SelectItem>
                                    <SelectItem value="line">Line</SelectItem>
                                    <SelectItem value="rect">Rectangle</SelectItem>
                                    <SelectItem value="rectRounded">Rounded Rectangle</SelectItem>
                                    <SelectItem value="rectRot">Diamond</SelectItem>
                                    <SelectItem value="star">Star</SelectItem>
                                    <SelectItem value="triangle">Triangle</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Hover Border Width</Label>
                            <Input
                                type="number"
                                value={Number(primaryDataset.pointHoverBorderWidth ?? 2)}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 2
                                    getTargetDatasetIndices().forEach(index => {
                                        handleUpdateDataset(index, 'pointHoverBorderWidth', value)
                                    })
                                }}
                                className="h-8 text-xs"
                                placeholder="2"
                                min={0}
                                max={10}
                                step={1}
                            />
                        </div>
                    </div>

                    {/* Bubble-specific settings */}
                    {chartType === 'bubble' && (
                        <div className="pt-2 border-t border-blue-100 space-y-3">
                            <div className="text-xs font-medium text-blue-900">Bubble Size Range</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Min Radius</Label>
                                    <Input
                                        type="number"
                                        value={Number((chartConfig as any)?.elements?.point?.radius ?? 3)}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : 3
                                            handleConfigUpdate('elements.point.radius', value)
                                        }}
                                        className="h-8 text-xs"
                                        placeholder="3"
                                        min={1}
                                        max={20}
                                        step={1}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Max Radius</Label>
                                    <Input
                                        type="number"
                                        value={Number((chartConfig as any)?.elements?.point?.hoverRadius ?? 20)}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : 20
                                            handleConfigUpdate('elements.point.hoverRadius', value)
                                        }}
                                        className="h-8 text-xs"
                                        placeholder="20"
                                        min={5}
                                        max={50}
                                        step={1}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 italic">
                                Tip: The 'r' value in your data controls individual bubble sizes.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* Line Properties - Only for line, area, radar charts */}
            {(chartType === 'line' || chartType === 'area' as any || chartType === 'radar') && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <Activity className="h-4 w-4 text-blue-900" />
                        <h3 className="text-sm font-semibold text-blue-900">
                            Line Properties
                        </h3>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Line Width</Label>
                            <Input
                                type="number"
                                value={Number(primaryDataset.borderWidth ?? 2)}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 2
                                    getTargetDatasetIndices().forEach(index => {
                                        handleUpdateDataset(index, 'borderWidth', value)
                                    })
                                }}
                                className="h-8 text-xs"
                                placeholder="2"
                                min={0}
                                max={10}
                                step={1}
                            />
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Line Tension</Label>
                            <Slider
                                value={[Number(primaryDataset.tension ?? 0.3)]}
                                onValueChange={([value]) => {
                                    getTargetDatasetIndices().forEach(index => {
                                        handleUpdateDataset(index, 'tension', value)
                                    })
                                }}
                                min={0}
                                max={1}
                                step={0.1}
                                className="mt-2"
                            />
                            <div className="text-xs text-gray-500 mt-1">{Number(primaryDataset.tension ?? 0.3).toFixed(1)}</div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Line Style</Label>
                            <Select
                                value={
                                    primaryDataset.borderDash
                                        ? (JSON.stringify(primaryDataset.borderDash) === JSON.stringify([5, 5]) ? 'dashed' : 'dotted')
                                        : 'solid'
                                }
                                onValueChange={(value) => {
                                    const borderDash = value === 'solid' ? undefined : value === 'dashed' ? [5, 5] : [2, 2]
                                    getTargetDatasetIndices().forEach(index => {
                                        handleUpdateDataset(index, 'borderDash', borderDash)
                                    })
                                }}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="solid">Solid</SelectItem>
                                    <SelectItem value="dashed">Dashed</SelectItem>
                                    <SelectItem value="dotted">Dotted</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Area Fill Settings - Only for area charts */}
                    {chartType === 'area' as any && (
                        <div className="pt-2 border-t border-blue-100 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="text-xs font-medium text-blue-900">Area Fill Settings</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Fill Target</Label>
                                    <Select
                                        value={
                                            primaryDataset.fill === '-1' ? 'stack' :
                                                primaryDataset.fill === 'end' ? 'end' : 'origin'
                                        }
                                        onValueChange={(value) => {
                                            const fillValue = value === 'stack' ? '-1' : value
                                            getTargetDatasetIndices().forEach(index => {
                                                handleUpdateDataset(index, 'fill', fillValue)
                                            })
                                        }}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="origin">Origin (Baseline)</SelectItem>
                                            <SelectItem value="stack">Stacked (Previous Dataset)</SelectItem>
                                            <SelectItem value="end">End (Top)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Fill Opacity</Label>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[(() => {
                                                const bgColor = primaryDataset.backgroundColor
                                                const firstColor = Array.isArray(bgColor) ? bgColor[0] : bgColor
                                                if (typeof firstColor === 'string') {
                                                    if (firstColor.startsWith('rgba')) {
                                                        const match = firstColor.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)
                                                        return match ? Math.round(parseFloat(match[1]) * 100) : 60
                                                    }
                                                    if (firstColor.startsWith('#')) return 100
                                                }
                                                return 60
                                            })()]}
                                            onValueChange={([value]) => {
                                                const opacity = value / 100
                                                const convertColorToRgba = (color: string): string => {
                                                    if (!color) return `rgba(59, 130, 246, ${opacity})`
                                                    let r = 59, g = 130, b = 246
                                                    if (color.startsWith('#')) {
                                                        const hex = color.replace('#', '')
                                                        r = parseInt(hex.substring(0, 2), 16)
                                                        g = parseInt(hex.substring(2, 4), 16)
                                                        b = parseInt(hex.substring(4, 6), 16)
                                                    } else if (color.startsWith('rgba') || color.startsWith('rgb')) {
                                                        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
                                                        if (match) {
                                                            r = parseInt(match[1])
                                                            g = parseInt(match[2])
                                                            b = parseInt(match[3])
                                                        }
                                                    }
                                                    return `rgba(${r}, ${g}, ${b}, ${opacity})`
                                                }
                                                getTargetDatasetIndices().forEach(index => {
                                                    const dataset = chartData.datasets[index];
                                                    if (!dataset) return;
                                                    const bgColors = dataset.backgroundColor
                                                    if (Array.isArray(bgColors)) {
                                                        const newColors = bgColors.map((c: string) => convertColorToRgba(c))
                                                        handleUpdateDataset(index, 'backgroundColor', newColors)
                                                    } else {
                                                        handleUpdateDataset(index, 'backgroundColor', convertColorToRgba(bgColors))
                                                    }
                                                })
                                            }}
                                            min={0}
                                            max={100}
                                            step={5}
                                            className="mt-2 flex-1"
                                        />
                                        <div className="text-xs text-gray-500 mt-2 w-8 text-right">
                                            {(() => {
                                                const bgColor = primaryDataset.backgroundColor
                                                const firstColor = Array.isArray(bgColor) ? bgColor[0] : bgColor
                                                if (typeof firstColor === 'string') {
                                                    if (firstColor.startsWith('rgba')) {
                                                        const match = firstColor.match(/rgba?\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/)
                                                        return match ? Math.round(parseFloat(match[1]) * 100) : 60
                                                    }
                                                    if (firstColor.startsWith('#')) return 100
                                                }
                                                return 60
                                            })()}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
