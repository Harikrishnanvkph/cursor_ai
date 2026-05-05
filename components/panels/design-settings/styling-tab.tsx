import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Palette, CircleDot, Activity, ChevronDown, Brush, Info } from "lucide-react"
import { darkenColor } from "@/lib/utils/color-utils"
import { useState } from "react"
import type { ChartType } from "chart.js"
import { useGroupedSettingsTarget } from "@/components/panels/grouped-settings-filter"
import { useChartStore } from "@/lib/chart-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { PATTERN_TYPES, type PatternConfig } from "@/lib/plugins/slice-pattern-plugin"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { Switch } from "@/components/ui/switch"

/** Small inline toggle for Point Fill setting — lives inside the Point Settings section */
function PointFillToggle() {
    const chartConfig = useChartStore(s => s.chartConfig)
    const { toggleFillPoints } = useChartActions()
    const fillPoints = chartConfig?.visualSettings?.fillPoints !== false
    return (
        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
                <CircleDot className="h-3.5 w-3.5 text-gray-500" />
                <Label className="text-xs font-medium text-gray-700">Filled Points</Label>
            </div>
            <Switch
                id="filled-points-toggle"
                checked={fillPoints}
                onCheckedChange={toggleFillPoints}
                className="scale-75 data-[state=unchecked]:bg-input/50"
            />
        </div>
    )
}

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

    // Use the shared grouped settings target hook for per-dataset filtering
    const { targetIndices: getTargetDatasetIndicesArray, primaryIndex } = useGroupedSettingsTarget()
    const getTargetDatasetIndices = () => getTargetDatasetIndicesArray

    // Slice-level targeting (single mode only)
    const chartMode = useChartStore(s => s.chartMode)
    const { settingsSliceIndex } = useUIStore()
    const isSingleMode = chartMode === 'single'
    const isSliceMode = isSingleMode && settingsSliceIndex !== null

    // Safely get a reference to the primary dataset we are editing to read its current values
    const primaryDataset = chartData.datasets[primaryIndex] || chartData.datasets[0] || {};

    /**
     * Helper: update a dataset property with per-slice awareness.
     * - If a specific slice is selected, converts scalar property to an array and modifies only that index.
     * - If "All" is selected, applies uniformly to all slices.
     */
    const handleSliceAwareUpdate = (property: string, value: any, defaultValue: any) => {
        if (isSliceMode) {
            // Per-slice update: modify only the selected index
            getTargetDatasetIndices().forEach(index => {
                const ds = chartData.datasets[index]
                if (!ds) return
                const sliceCount = (ds.data || []).length
                const existing = ds[property]
                // Convert to array if needed
                let arr: any[]
                if (Array.isArray(existing)) {
                    arr = [...existing]
                } else {
                    arr = new Array(sliceCount).fill(existing ?? defaultValue)
                }
                // Ensure array is long enough
                while (arr.length < sliceCount) arr.push(defaultValue)
                arr[settingsSliceIndex] = value
                handleUpdateDataset(index, property, arr)
            })
        } else {
            // "All" mode: apply uniformly
            getTargetDatasetIndices().forEach(index => {
                handleUpdateDataset(index, property, value)
            })
        }
    }

    /**
     * Read a property value for the current slice or the whole dataset.
     * If a specific slice is selected, tries to read from the array at that index.
     */
    const readSliceAwareValue = (property: string, defaultValue: any) => {
        const val = primaryDataset[property]
        if (isSliceMode && Array.isArray(val) && settingsSliceIndex < val.length) {
            return val[settingsSliceIndex]
        }
        return Array.isArray(val) ? val[0] : (val ?? defaultValue)
    }

    return (
        <div className="space-y-3 mt-4">
            {/* Slice Border Styling - Only for slice-based and bar charts */}
            {(chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea' || chartType === 'bar' || chartType === 'horizontalBar' || chartType === 'stackedBar' as any || chartType === 'pie3d' as any || chartType === 'doughnut3d' as any || chartType === 'bar3d' as any || chartType === 'horizontalBar3d' as any) && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <Palette className="h-4 w-4 text-blue-900" />
                        <h3 className="text-sm font-semibold text-blue-900">
                            {(chartType === 'pie' || chartType === 'doughnut' || chartType === 'polarArea' || chartType === 'pie3d' || chartType === 'doughnut3d') ? 'Slice Border Styling' : 'Bar Border Styling'}
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
                                    value={Number(readSliceAwareValue('borderWidth', 2))}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 2
                                        handleSliceAwareUpdate('borderWidth', value, 2)
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
                                    value={Number(readSliceAwareValue('borderRadius', 0))}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 0
                                        handleSliceAwareUpdate('borderRadius', value, 0)
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
                                        handleSliceAwareUpdate('borderColor', e.target.value, '#000000')
                                    }}
                                    className="absolute opacity-0 w-0 h-0"
                                />
                                <Input
                                    value={manualBorderColor}
                                    onChange={(e) => {
                                        setManualBorderColor(e.target.value)
                                        handleSliceAwareUpdate('borderColor', e.target.value, '#000000')
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

                    {/* Filled Points Toggle */}
                    <PointFillToggle />

                    {/* Row 1: Point Radius, Hover Radius, Border Width */}
                    <div className={`grid gap-3 ${chartType === 'bubble' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {/* Point Radius - not for bubble (bubble uses r value in data) */}
                        {chartType !== 'bubble' && (
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Point Radius</Label>
                                <Input
                                    type="number"
                                    value={Number(readSliceAwareValue('pointRadius', 5))}
                                    onChange={(e) => {
                                        const value = e.target.value ? Number(e.target.value) : 5
                                        handleSliceAwareUpdate('pointRadius', value, 5)
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
                                value={Number(readSliceAwareValue('pointHoverRadius', 8))}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 8
                                    handleSliceAwareUpdate('pointHoverRadius', value, 8)
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
                                value={Number(readSliceAwareValue('pointBorderWidth', 1))}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 1
                                    handleSliceAwareUpdate('pointBorderWidth', value, 1)
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
                                value={readSliceAwareValue('pointStyle', 'circle')}
                                onValueChange={(value) => {
                                    handleSliceAwareUpdate('pointStyle', value, 'circle')
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
                                value={Number(readSliceAwareValue('pointHoverBorderWidth', 2))}
                                onChange={(e) => {
                                    const value = e.target.value ? Number(e.target.value) : 2
                                    handleSliceAwareUpdate('pointHoverBorderWidth', value, 2)
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

            {/* 3D Effect Settings - Only for pie3d and doughnut3d */}
            {(chartType === 'pie3d' as any || chartType === 'doughnut3d' as any) && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <svg className="h-4 w-4 text-blue-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <ellipse cx="12" cy="10" rx="10" ry="6" />
                            <path d="M2 10v4c0 3.31 4.48 6 10 6s10-2.69 10-6v-4" />
                        </svg>
                        <h3 className="text-sm font-semibold text-blue-900">
                            3D Effect Settings
                        </h3>
                    </div>

                    {/* Depth */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Depth</Label>
                            <span className="text-xs text-gray-500">{(chartConfig.plugins as any)?.pie3d?.depth ?? 20}px</span>
                        </div>
                        <Slider
                            value={[Number((chartConfig.plugins as any)?.pie3d?.depth ?? 20)]}
                            onValueChange={([value]) => handleConfigUpdate('plugins.pie3d.depth', value)}
                            min={1}
                            max={200}
                            step={1}
                        />
                    </div>

                    {/* Tilt */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Tilt Angle</Label>
                            <span className="text-xs text-gray-500">{Math.round((1 - Number((chartConfig.plugins as any)?.pie3d?.tilt ?? 0.75)) * 100)}°</span>
                        </div>
                        <Slider
                            value={[Number((chartConfig.plugins as any)?.pie3d?.tilt ?? 0.75)]}
                            onValueChange={([value]) => handleConfigUpdate('plugins.pie3d.tilt', value)}
                            min={0.4}
                            max={1.0}
                            step={0.05}
                        />
                        <div className="flex justify-between text-[10px] text-gray-400">
                            <span>More tilted</span>
                            <span>Flat</span>
                        </div>
                    </div>

                    {/* Wall Darkening */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Wall Darkening</Label>
                            <span className="text-xs text-gray-500">{Math.round(Number((chartConfig.plugins as any)?.pie3d?.darken ?? 0.25) * 100)}%</span>
                        </div>
                        <Slider
                            value={[Number((chartConfig.plugins as any)?.pie3d?.darken ?? 0.25)]}
                            onValueChange={([value]) => handleConfigUpdate('plugins.pie3d.darken', value)}
                            min={0}
                            max={0.6}
                            step={0.05}
                        />
                    </div>

                    {/* Shadow Settings */}
                    <div className="pt-2 border-t border-blue-100 space-y-3">
                        <div className="text-xs font-medium text-blue-900">Shadow</div>

                        <div className="space-y-3">
                            {/* Shadow Blur */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Blur</Label>
                                <div className="flex items-center gap-2">
                                    <Slider
                                        value={[Number((chartConfig.plugins as any)?.pie3d?.shadowBlur ?? 10)]}
                                        onValueChange={([value]) => handleConfigUpdate('plugins.pie3d.shadowBlur', value)}
                                        min={0}
                                        max={40}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <span className="text-xs text-gray-500 w-6 text-right">{(chartConfig.plugins as any)?.pie3d?.shadowBlur ?? 10}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Shadow Offset X */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Offset X</Label>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[Number((chartConfig.plugins as any)?.pie3d?.shadowOffsetX ?? 0)]}
                                            onValueChange={([value]) => handleConfigUpdate('plugins.pie3d.shadowOffsetX', value)}
                                            min={-30}
                                            max={30}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-xs text-gray-500 w-6 text-right">{(chartConfig.plugins as any)?.pie3d?.shadowOffsetX ?? 0}</span>
                                    </div>
                                </div>

                                {/* Shadow Offset Y */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Offset Y</Label>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[Number((chartConfig.plugins as any)?.pie3d?.shadowOffsetY ?? 5)]}
                                            onValueChange={([value]) => handleConfigUpdate('plugins.pie3d.shadowOffsetY', value)}
                                            min={-30}
                                            max={30}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-xs text-gray-500 w-6 text-right">{(chartConfig.plugins as any)?.pie3d?.shadowOffsetY ?? 5}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shadow Color */}
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Shadow Color</Label>
                            <div className="flex items-center gap-2 h-8">
                                <div
                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: (chartConfig.plugins as any)?.pie3d?.shadowColor || 'rgba(0,0,0,0.3)' }}
                                    onClick={() => document.getElementById('pie3d-shadow-color-picker')?.click()}
                                />
                                <input
                                    id="pie3d-shadow-color-picker"
                                    type="color"
                                    value="#000000"
                                    onChange={(e) => {
                                        // Convert hex to rgba with 0.3 alpha
                                        const hex = e.target.value;
                                        const r = parseInt(hex.slice(1, 3), 16);
                                        const g = parseInt(hex.slice(3, 5), 16);
                                        const b = parseInt(hex.slice(5, 7), 16);
                                        handleConfigUpdate('plugins.pie3d.shadowColor', `rgba(${r},${g},${b},0.3)`);
                                    }}
                                    className="absolute opacity-0 w-0 h-0"
                                />
                                <Input
                                    value={(chartConfig.plugins as any)?.pie3d?.shadowColor || 'rgba(0,0,0,0.3)'}
                                    onChange={(e) => handleConfigUpdate('plugins.pie3d.shadowColor', e.target.value)}
                                    className="h-8 text-xs flex-1"
                                    placeholder="rgba(0,0,0,0.3)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 3D Bar Effect Settings - Only for bar3d and horizontalBar3d */}
            {(chartType === 'bar3d' as any || chartType === 'horizontalBar3d' as any) && (
                <div className="space-y-3 mt-4 border-gray-100">
                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <svg className="h-4 w-4 text-blue-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                            <polyline points="3.29 7 12 12 20.71 7" />
                            <line x1="12" y1="22" x2="12" y2="12" />
                        </svg>
                        <h3 className="text-sm font-semibold text-blue-900">
                            3D Bar Settings
                        </h3>
                    </div>

                    {/* Depth */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">3D Depth</Label>
                            <span className="text-xs text-gray-500">{(chartConfig.plugins as any)?.bar3d?.depth ?? 12}px</span>
                        </div>
                        <Slider
                            value={[Number((chartConfig.plugins as any)?.bar3d?.depth ?? 12)]}
                            onValueChange={([value]) => handleConfigUpdate('plugins.bar3d.depth', value)}
                            min={1}
                            max={100}
                            step={1}
                        />
                    </div>

                    {/* Angle */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">Perspective Angle</Label>
                            <span className="text-xs text-gray-500">{(chartConfig.plugins as any)?.bar3d?.angle ?? 45}°</span>
                        </div>
                        <Slider
                            value={[Number((chartConfig.plugins as any)?.bar3d?.angle ?? 45)]}
                            onValueChange={([value]) => handleConfigUpdate('plugins.bar3d.angle', value)}
                            min={0}
                            max={90}
                            step={5}
                        />
                        <div className="flex justify-between text-[10px] text-gray-400">
                            <span>Sideways</span>
                            <span>Frontal</span>
                        </div>
                    </div>

                    {/* Shading */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium">3D Shading (Darken)</Label>
                            <span className="text-xs text-gray-500">{Math.round(Number((chartConfig.plugins as any)?.bar3d?.darken ?? 0.2) * 100)}%</span>
                        </div>
                        <Slider
                            value={[Number((chartConfig.plugins as any)?.bar3d?.darken ?? 0.2)]}
                            onValueChange={([value]) => handleConfigUpdate('plugins.bar3d.darken', value)}
                            min={0}
                            max={0.5}
                            step={0.05}
                        />
                    </div>

                    {/* Shadow Settings for 3D Bars */}
                    <div className="pt-2 border-t border-blue-100 space-y-3">
                        <div className="text-xs font-medium text-blue-900">Shadow</div>

                        <div className="space-y-3">
                            {/* Shadow Blur */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Blur</Label>
                                <div className="flex items-center gap-2">
                                    <Slider
                                        value={[Number((chartConfig.plugins as any)?.bar3d?.shadowBlur ?? 10)]}
                                        onValueChange={([value]) => handleConfigUpdate('plugins.bar3d.shadowBlur', value)}
                                        min={0}
                                        max={40}
                                        step={1}
                                        className="flex-1"
                                    />
                                    <span className="text-xs text-gray-500 w-6 text-right">{(chartConfig.plugins as any)?.bar3d?.shadowBlur ?? 10}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Shadow Offset X */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Offset X</Label>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[Number((chartConfig.plugins as any)?.bar3d?.shadowOffsetX ?? 0)]}
                                            onValueChange={([value]) => handleConfigUpdate('plugins.bar3d.shadowOffsetX', value)}
                                            min={-30}
                                            max={30}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-xs text-gray-500 w-6 text-right">{(chartConfig.plugins as any)?.bar3d?.shadowOffsetX ?? 0}</span>
                                    </div>
                                </div>

                                {/* Shadow Offset Y */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Offset Y</Label>
                                    <div className="flex items-center gap-2">
                                        <Slider
                                            value={[Number((chartConfig.plugins as any)?.bar3d?.shadowOffsetY ?? 5)]}
                                            onValueChange={([value]) => handleConfigUpdate('plugins.bar3d.shadowOffsetY', value)}
                                            min={-30}
                                            max={30}
                                            step={1}
                                            className="flex-1"
                                        />
                                        <span className="text-xs text-gray-500 w-6 text-right">{(chartConfig.plugins as any)?.bar3d?.shadowOffsetY ?? 5}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shadow Color */}
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Shadow Color</Label>
                            <div className="flex items-center gap-2 h-8">
                                <div
                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: (chartConfig.plugins as any)?.bar3d?.shadowColor || 'rgba(0,0,0,0.3)' }}
                                    onClick={() => document.getElementById('bar3d-shadow-color-picker')?.click()}
                                />
                                <input
                                    id="bar3d-shadow-color-picker"
                                    type="color"
                                    value="#000000"
                                    onChange={(e) => {
                                        const hex = e.target.value;
                                        const r = parseInt(hex.slice(1, 3), 16);
                                        const g = parseInt(hex.slice(3, 5), 16);
                                        const b = parseInt(hex.slice(5, 7), 16);
                                        handleConfigUpdate('plugins.bar3d.shadowColor', `rgba(${r},${g},${b},0.3)`);
                                    }}
                                    className="absolute opacity-0 w-0 h-0"
                                />
                                <Input
                                    value={(chartConfig.plugins as any)?.bar3d?.shadowColor || 'rgba(0,0,0,0.3)'}
                                    onChange={(e) => handleConfigUpdate('plugins.bar3d.shadowColor', e.target.value)}
                                    className="h-8 text-xs flex-1"
                                    placeholder="rgba(0,0,0,0.3)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ Draw Designs on Slices ═══════ */}
            <DrawDesignsSection
                chartData={chartData}
                chartType={chartType}
                handleUpdateDataset={handleUpdateDataset}
            />
        </div>
    )
}

// ── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_PATTERN: PatternConfig = {
    type: '',
    color: 'rgba(0,0,0,0.5)',
    lineWidth: 2,
    spacing: 8,
    opacity: 100,
};

// Chart types that should NOT show this section
const EXCLUDED_CHART_TYPES = ['line', 'scatter', 'bubble'];
// Chart types that use dataset-area mode instead of per-slice
const AREA_MODE_TYPES = ['area', 'radar'];

// ── Sub-component ───────────────────────────────────────────────────────────

interface DrawDesignsSectionProps {
    chartData: any;
    chartType: ChartType | 'polarArea' | 'radar' | 'scatter' | 'bubble';
    handleUpdateDataset: (datasetIndex: number, property: string, value: any) => void;
}

function DrawDesignsSection({ chartData, chartType, handleUpdateDataset }: DrawDesignsSectionProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedSliceIndex, setSelectedSliceIndex] = useState(0);

    const chartMode = useChartStore(s => s.chartMode);
    const { targetIndices: getTargetDatasetIndicesArray, primaryIndex } = useGroupedSettingsTarget();
    const getTargetDatasetIndices = () => getTargetDatasetIndicesArray;

    const primaryDataset = chartData.datasets[primaryIndex] || chartData.datasets[0] || {};

    // Don't render for excluded types
    if (EXCLUDED_CHART_TYPES.includes(chartType as string)) return null;

    const isAreaMode = AREA_MODE_TYPES.includes(chartType as string);
    const isGroupedMode = chartMode === 'grouped';
    const isSingleMode = chartMode === 'single';

    // Determine whether we show per-slice selection (only single mode + non-area chart types)
    const showSlicePicker = isSingleMode && !isAreaMode;

    // Read current pattern config
    const getCurrentPattern = (): PatternConfig | null => {
        if (isAreaMode || isGroupedMode) {
            return primaryDataset.datasetPattern || null;
        }
        // Per-slice in single mode
        const patterns = primaryDataset.slicePatterns;
        if (patterns && patterns[selectedSliceIndex]) {
            return patterns[selectedSliceIndex];
        }
        return null;
    };

    const currentPattern = getCurrentPattern();
    const currentType = currentPattern?.type || '';
    const currentColor = currentPattern?.color || DEFAULT_PATTERN.color;
    const currentLineWidth = currentPattern?.lineWidth ?? DEFAULT_PATTERN.lineWidth;
    const currentSpacing = currentPattern?.spacing ?? DEFAULT_PATTERN.spacing;
    const currentOpacity = currentPattern?.opacity ?? 100;

    // Apply pattern update
    const applyPattern = (updates: Partial<PatternConfig>) => {
        const indices = getTargetDatasetIndices();

        if (isAreaMode || isGroupedMode) {
            // Whole-dataset pattern
            const current: PatternConfig = primaryDataset.datasetPattern || { ...DEFAULT_PATTERN };
            const newPattern: PatternConfig = { ...current, ...updates };
            // If type is cleared, remove the pattern
            if (!newPattern.type) {
                indices.forEach(idx => handleUpdateDataset(idx, 'datasetPattern', null));
            } else {
                indices.forEach(idx => handleUpdateDataset(idx, 'datasetPattern', newPattern));
            }
        } else {
            // Per-slice pattern
            indices.forEach(idx => {
                const ds = chartData.datasets[idx];
                if (!ds) return;
                const sliceCount = (ds.data || []).length;
                const patterns: (PatternConfig | null)[] = [...(ds.slicePatterns || new Array(sliceCount).fill(null))];
                // Ensure array is long enough
                while (patterns.length < sliceCount) patterns.push(null);

                const current: PatternConfig = patterns[selectedSliceIndex] || { ...DEFAULT_PATTERN };
                const newPattern: PatternConfig = { ...current, ...updates };

                if (!newPattern.type) {
                    patterns[selectedSliceIndex] = null;
                } else {
                    patterns[selectedSliceIndex] = newPattern;
                }
                handleUpdateDataset(idx, 'slicePatterns', patterns);
            });
        }
    };

    // Remove pattern
    const removePattern = () => {
        applyPattern({ type: '' });
    };

    // Get slice labels for the picker
    const sliceLabels: string[] = primaryDataset.sliceLabels ||
        (chartData.labels || []).map(String) ||
        (primaryDataset.data || []).map((_: any, i: number) => `Slice ${i + 1}`);

    return (
        <div className="space-y-2">
            {/* Collapsible header */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors"
            >
                <Brush className="h-4 w-4 text-blue-900" />
                <span className="text-sm font-semibold text-blue-900 flex-1 text-left">Draw Designs on Slices</span>
                <span
                    className="relative group"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Info className="h-3.5 w-3.5 text-blue-400 hover:text-blue-700 transition-colors" />
                    <span className="absolute right-0 top-5 z-50 hidden group-hover:block w-48 p-2 text-xs text-white bg-gray-800 rounded-lg shadow-lg">
                        {isGroupedMode
                            ? 'Pattern applies to the entire selected dataset in grouped mode.'
                            : isAreaMode
                            ? "Pattern applies to the current dataset's filled area."
                            : 'Select a slice and apply a decorative pattern overlay.'}
                    </span>
                </span>
                <ChevronDown className={`h-4 w-4 text-blue-900 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="space-y-3 pl-1 pr-1">
                    {/* Slice picker — only for single-mode, non-area chart types */}
                    {showSlicePicker && (
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Slice</Label>
                            <Select
                                value={String(selectedSliceIndex)}
                                onValueChange={(val) => setSelectedSliceIndex(Number(val))}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {sliceLabels.map((label: string, idx: number) => (
                                        <SelectItem key={idx} value={String(idx)}>{label || `Slice ${idx + 1}`}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}


                    {/* Design picker */}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium">Design</Label>
                        <Select
                            value={currentType || 'none'}
                            onValueChange={(val) => {
                                if (val === 'none') {
                                    removePattern();
                                } else {
                                    applyPattern({ type: val });
                                }
                            }}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {Object.entries(PATTERN_TYPES).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Pattern customization — only show if a pattern is selected */}
                    {currentType && (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            {/* Color */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Pattern Color</Label>
                                <div className="flex items-center gap-2 h-8 relative">
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
                                        style={{ backgroundColor: currentColor }}
                                        onClick={() => document.getElementById('pattern-color-picker')?.click()}
                                    />
                                    <input
                                        id="pattern-color-picker"
                                        type="color"
                                        value={currentColor.startsWith('#') ? currentColor : '#000000'}
                                        onChange={(e) => applyPattern({ color: e.target.value })}
                                        className="sr-only"
                                    />
                                    <Input
                                        value={currentColor}
                                        onChange={(e) => applyPattern({ color: e.target.value })}
                                        className="h-8 text-xs flex-1"
                                        placeholder="rgba(0,0,0,0.5)"
                                    />
                                </div>
                            </div>

                            {/* Line Width & Spacing */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Line Width</Label>
                                        <span className="text-xs text-gray-500">{currentLineWidth}px</span>
                                    </div>
                                    <Slider
                                        value={[currentLineWidth]}
                                        onValueChange={([val]) => applyPattern({ lineWidth: val })}
                                        min={1}
                                        max={8}
                                        step={0.5}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Spacing</Label>
                                        <span className="text-xs text-gray-500">{currentSpacing}px</span>
                                    </div>
                                    <Slider
                                        value={[currentSpacing]}
                                        onValueChange={([val]) => applyPattern({ spacing: val })}
                                        min={4}
                                        max={30}
                                        step={1}
                                    />
                                </div>
                            </div>

                            {/* Opacity */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Opacity</Label>
                                    <span className="text-xs text-gray-500">{currentOpacity}%</span>
                                </div>
                                <Slider
                                    value={[currentOpacity]}
                                    onValueChange={([val]) => applyPattern({ opacity: val })}
                                    min={5}
                                    max={100}
                                    step={5}
                                />
                            </div>

                            {/* Remove pattern button */}
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                onClick={removePattern}
                            >
                                Remove Pattern
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
