import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useChartStore } from "@/lib/chart-store"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface MoreTabProps {
    axis: 'x' | 'y' | 'y1'
    config: any
    onUpdate: (path: string, value: any) => void
    updateConfig: (path: string, value: any) => void
    chartType?: string
}

export function MoreTab({ axis, config, onUpdate, updateConfig, chartType }: MoreTabProps) {
    const { chartData } = useChartStore()
    const [axisLineDropdownOpen, setAxisLineDropdownOpen] = useState(false)
    const [scaleConfigDropdownOpen, setScaleConfigDropdownOpen] = useState(false)

    // Check if any slice value is below zero
    const hasNegativeValues = chartData?.datasets?.some((ds: any) => 
        Array.isArray(ds.data) && ds.data.some((val: any) => {
            if (typeof val === 'number') return val < 0;
            if (Array.isArray(val)) return val[0] < 0 || val[1] < 0;
            if (val && typeof val === 'object') {
                return (typeof val.y === 'number' && val.y < 0) || (typeof val.x === 'number' && val.x < 0);
            }
            return false;
        })
    ) || false;

    const isZeroLineHighlighted = config?.highlightZeroLine === true || 
        (config?.highlightZeroLine === undefined && hasNegativeValues);

    // Track grace mode independently so clearing the input doesn't break percent mode
    const [graceIsPercent, setGraceIsPercent] = useState(() => {
        const g = config?.grace;
        if (typeof g === 'string' && g.endsWith('%')) return true;
        if (g === undefined || g === null) return true; // default to percent
        return false;
    });

    // Sync mode if config.grace changes externally (e.g. preset applied)
    useEffect(() => {
        const g = config?.grace;
        if (typeof g === 'string' && g.endsWith('%')) {
            setGraceIsPercent(true);
        } else if (g !== undefined && g !== null && typeof g === 'number') {
            setGraceIsPercent(false);
        }
    }, [config?.grace]);

    // Extract the numeric part of grace for the input
    // IMPORTANT: 0 is a valid grace value — don't use || which treats 0 as falsy
    const graceNumericValue = (() => {
        const g = config?.grace;
        if (typeof g === 'string' && g.endsWith('%')) {
            const parsed = parseFloat(g);
            return isNaN(parsed) ? 5 : parsed;
        }
        if (typeof g === 'number') return g;
        return 5;
    })();

    const isValueAxis = (['y', 'y1'].includes(axis) && !['horizontalBar', 'horizontalBar3d', 'funnel'].includes(chartType || '')) ||
                        (axis === 'x' && ['horizontalBar', 'horizontalBar3d', 'funnel'].includes(chartType || ''));

    return (
        <div className="space-y-3 overflow-y-auto overflow-x-hidden h-full">
            {/* Begin at Zero (Y and Y1 axis) */}
            {['y', 'y1'].includes(axis) && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <Label className="text-xs font-semibold text-slate-800">Begin at Zero</Label>
                    <Switch
                        checked={!!config?.beginAtZero}
                        onCheckedChange={(checked) => updateConfig('beginAtZero', checked)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>
            )}

            {/* Zero Line Highlight (Value Axis only) */}
            {isValueAxis && (
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-2xs">
                    <div className="space-y-0.5">
                        <Label className="text-xs font-semibold text-slate-800 font-sans">Highlight Zero Line</Label>
                        <p className="text-[11px] text-slate-500 font-sans">Bold the 0 baseline on the grid</p>
                    </div>
                    <Switch
                        checked={isZeroLineHighlighted}
                        onCheckedChange={(checked) => updateConfig('highlightZeroLine', checked)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>
            )}

            {/* Axis Line Section - Dropdown */}
            <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                <div
                    className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                        axisLineDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                    )}
                    onClick={() => setAxisLineDropdownOpen(!axisLineDropdownOpen)}
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        <h3 className="text-xs font-semibold text-slate-800">Axis Line</h3>
                    </div>
                    <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                            checked={config?.border?.display !== false}
                            onCheckedChange={(checked) => updateConfig('border.display', checked)}
                            className="data-[state=checked]:bg-blue-600"
                        />
                        <button
                            type="button"
                            onClick={() => setAxisLineDropdownOpen(!axisLineDropdownOpen)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                            aria-label="Toggle axis line options"
                        >
                            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", axisLineDropdownOpen && "rotate-180")} />
                        </button>
                    </div>
                </div>

                {/* Dropdown Content */}
                {axisLineDropdownOpen && (
                    <div className="p-3.5 space-y-3.5 bg-white">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Color */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-700">Line Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-7 h-7 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                                        style={{ backgroundColor: config?.border?.color || '#666666' }}
                                        onClick={() => document.getElementById(`axis-line-color-${axis}`)?.click()}
                                    />
                                    <input
                                        id={`axis-line-color-${axis}`}
                                        type="color"
                                        value={config?.border?.color || '#666666'}
                                        onChange={(e) => updateConfig('border.color', e.target.value)}
                                        className="sr-only"
                                    />
                                    <Input
                                        value={config?.border?.color || '#666666'}
                                        onChange={(e) => updateConfig('border.color', e.target.value)}
                                        className="h-8 text-xs font-mono uppercase bg-white flex-1 min-w-0"
                                        placeholder="#666666"
                                    />
                                </div>
                            </div>

                            {/* Width */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-700">Line Width</Label>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="number"
                                        value={config?.border?.width || ''}
                                        onChange={(e) => updateConfig('border.width', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="1"
                                        className="h-8 text-xs bg-white flex-1 min-w-0"
                                        min={0}
                                        max={10}
                                        step={0.5}
                                    />
                                    <span className="text-xs text-slate-400 shrink-0">px</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scale Configuration Section - Dropdown */}
            <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                <div
                    className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                        scaleConfigDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                    )}
                    onClick={() => setScaleConfigDropdownOpen(!scaleConfigDropdownOpen)}
                >
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full" />
                        <h3 className="text-xs font-semibold text-slate-800">Scale Bounds & Grace</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setScaleConfigDropdownOpen(!scaleConfigDropdownOpen)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                        aria-label="Toggle scale configuration options"
                    >
                        <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", scaleConfigDropdownOpen && "rotate-180")} />
                    </button>
                </div>

                {/* Dropdown Content */}
                {scaleConfigDropdownOpen && (
                    <div className="p-3.5 space-y-3.5 bg-white">
                        <div className="grid grid-cols-2 gap-3 items-end">
                            {/* Scale Bounds */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-700">Scale Bounds</Label>
                                <Select
                                    value={config?.bounds || 'ticks'}
                                    onValueChange={(value) => {
                                        if (value === 'data') {
                                            onUpdate(`scales.${axis}`, {
                                                ...config,
                                                bounds: value,
                                                grace: 0
                                            })
                                        } else {
                                            updateConfig('bounds', value)
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-8 text-xs bg-white">
                                        <SelectValue placeholder="Select bounds" />
                                    </SelectTrigger>
                                    <SelectContent position="popper" sideOffset={4}>
                                        <SelectItem value="ticks">Ticks</SelectItem>
                                        <SelectItem value="data">Data</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Grace */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium text-slate-700">Grace (Headroom)</Label>
                                <div className="flex items-center gap-1.5">
                                    <Input
                                        type="number"
                                        value={graceNumericValue}
                                        onChange={(e) => {
                                            const num = e.target.value === '' ? 0 : Number(e.target.value);
                                            updateConfig('grace', graceIsPercent ? `${num}%` : num);
                                        }}
                                        placeholder="5"
                                        className="h-8 text-xs bg-white flex-1 min-w-0"
                                        min={0}
                                        step={1}
                                        disabled={config?.bounds === 'data'}
                                    />
                                    <button
                                        type="button"
                                        className={`h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all shrink-0 ${
                                            graceIsPercent
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                        }`}
                                        disabled={config?.bounds === 'data'}
                                        onClick={() => {
                                            const newIsPercent = !graceIsPercent;
                                            setGraceIsPercent(newIsPercent);
                                            const num = graceNumericValue;
                                            updateConfig('grace', newIsPercent ? `${num}%` : num);
                                        }}
                                        title={graceIsPercent ? 'Percentage mode (click for absolute)' : 'Absolute mode (click for percentage)'}
                                    >
                                        {graceIsPercent ? '%' : '#'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
