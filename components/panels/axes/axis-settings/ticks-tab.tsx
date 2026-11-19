import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import {
    FontSettingSection,
    mapChartJsFontValue,
    applyChartJsFontPatch,
} from "@/components/ui/font-setting-section"

interface TicksTabProps {
    axis: 'x' | 'y' | 'y1'
    config: any
    chartType?: string
    updateConfig: (path: string, value: any) => void
    updateNestedConfig: (basePath: string, path: string, value: any) => void
}

export function TicksTab({ axis, config, chartType, updateConfig, updateNestedConfig }: TicksTabProps) {
    const [tickMarkConfigDropdownOpen, setTickMarkConfigDropdownOpen] = useState(false)
    const [tickConfigDropdownOpen, setTickConfigDropdownOpen] = useState(false)
    const [majorTicksDropdownOpen, setMajorTicksDropdownOpen] = useState(false)

    return (
        <div className="space-y-3 overflow-y-auto overflow-x-hidden h-full pr-0 relative isolate">
            <div className="space-y-3 relative">
                {/* Tick Mark Section */}
                <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                    <div
                        className={cn(
                            "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                            tickMarkConfigDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                        )}
                        onClick={() => setTickMarkConfigDropdownOpen(!tickMarkConfigDropdownOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            <h3 className="text-xs font-semibold text-slate-800">Tick Marks</h3>
                        </div>
                        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Switch
                                checked={config?.grid?.tickLength !== 0}
                                onCheckedChange={(checked) => updateConfig('grid.tickLength', checked ? 8 : 0)}
                                className="data-[state=checked]:bg-blue-600"
                            />
                            <button
                                type="button"
                                onClick={() => setTickMarkConfigDropdownOpen(!tickMarkConfigDropdownOpen)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                aria-label="Toggle tick mark options"
                            >
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", tickMarkConfigDropdownOpen && "rotate-180")} />
                            </button>
                        </div>
                    </div>

                    {/* Tick Mark Options */}
                    {tickMarkConfigDropdownOpen && (
                        <div className="p-3.5 bg-white">
                            <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2.5 items-end">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Color</Label>
                                    <div className="flex items-center h-8">
                                        <div
                                            className="w-8 h-8 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                                            style={{ backgroundColor: config?.grid?.tickColor || '#666666' }}
                                            onClick={() => document.getElementById(`grid-tick-color-${axis}`)?.click()}
                                            title={config?.grid?.tickColor || '#666666'}
                                        />
                                        <input
                                            id={`grid-tick-color-${axis}`}
                                            type="color"
                                            value={config?.grid?.tickColor || '#666666'}
                                            onChange={(e) => updateConfig('grid.tickColor', e.target.value)}
                                            className="sr-only"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1 min-w-0">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Width</Label>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            value={config?.grid?.tickWidth || ''}
                                            onChange={(e) => updateConfig('grid.tickWidth', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="1"
                                            className="h-8 text-xs bg-white flex-1 min-w-0 px-2"
                                            min={0}
                                            max={10}
                                            step={0.5}
                                        />
                                        <span className="text-[11px] text-slate-400 shrink-0">px</span>
                                    </div>
                                </div>

                                <div className="space-y-1 min-w-0">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Length</Label>
                                    <div className="flex items-center gap-1">
                                        <Input
                                            type="number"
                                            value={config?.grid?.tickLength || ''}
                                            onChange={(e) => updateConfig('grid.tickLength', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="6"
                                            className="h-8 text-xs bg-white flex-1 min-w-0 px-2"
                                            min={0}
                                            max={20}
                                            step={1}
                                        />
                                        <span className="text-[11px] text-slate-400 shrink-0">px</span>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Grid Offset</Label>
                                    <div className="flex items-center justify-center h-8">
                                        <Switch
                                            checked={config?.grid?.offset ?? ['bar', 'horizontalBar', 'stacked'].includes(chartType || '')}
                                            onCheckedChange={(checked) => updateConfig('grid.offset', checked)}
                                            className="data-[state=checked]:bg-blue-600 scale-90"
                                            aria-label="Grid Offset"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tick Configuration Section */}
                <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                    <div
                        className={cn(
                            "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                            tickConfigDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                        )}
                        onClick={() => setTickConfigDropdownOpen(!tickConfigDropdownOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            <h3 className="text-xs font-semibold text-slate-800">Scale & Ticks Configuration</h3>
                        </div>
                        <button
                            type="button"
                            onClick={() => setTickConfigDropdownOpen(!tickConfigDropdownOpen)}
                            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                            aria-label="Toggle tick configuration options"
                        >
                            <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", tickConfigDropdownOpen && "rotate-180")} />
                        </button>
                    </div>

                    {/* Dropdown Content */}
                    {tickConfigDropdownOpen && (
                        <div className="p-3.5 space-y-3 bg-white">
                            {/* Row 1: 3 columns */}
                            <div className="grid grid-cols-3 gap-2.5 items-end">
                                <div className="space-y-1 min-w-0">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Max Ticks</Label>
                                    <Input
                                        type="number"
                                        value={config?.ticks?.maxTicksLimit || ''}
                                        onChange={(e) => updateConfig('ticks.maxTicksLimit', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="11"
                                        className="h-8 text-xs bg-white min-w-0 px-2"
                                        min={2}
                                        max={20}
                                    />
                                </div>

                                <div className="space-y-1 min-w-0">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Step Size</Label>
                                    <Input
                                        type="number"
                                        value={config?.ticks?.stepSize || ''}
                                        onChange={(e) => updateConfig('ticks.stepSize', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="Auto"
                                        className="h-8 text-xs bg-white min-w-0 px-2"
                                        min={0}
                                        step={0.1}
                                    />
                                </div>

                                <div className="space-y-1 min-w-0">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Min Value</Label>
                                    <Input
                                        type="number"
                                        value={config?.min ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : undefined
                                            updateConfig('min', value)
                                        }}
                                        placeholder="Auto"
                                        className="h-8 text-xs bg-white min-w-0 px-2"
                                    />
                                </div>
                            </div>

                            {/* Row 2: 3 columns */}
                            <div className="grid grid-cols-3 gap-2.5 items-end">
                                <div className="space-y-1 min-w-0">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Max Value</Label>
                                    <Input
                                        type="number"
                                        value={config?.max ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : undefined
                                            updateConfig('max', value)
                                        }}
                                        placeholder="Auto"
                                        className="h-8 text-xs bg-white min-w-0 px-2"
                                    />
                                </div>

                                <div className="space-y-1 min-w-0">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Cross Align</Label>
                                    <Select
                                        value={config?.ticks?.crossAlign || 'near'}
                                        onValueChange={(value) => updateConfig('ticks.crossAlign', value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-white px-2">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="near">Near</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="far">Far</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {config?.ticks?.autoSkip !== false ? (
                                    <div className="space-y-1 min-w-0">
                                        <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Skip Padding</Label>
                                        <div className="flex items-center gap-1">
                                            <Input
                                                type="number"
                                                value={config?.ticks?.autoSkipPadding || ''}
                                                onChange={(e) => updateConfig('ticks.autoSkipPadding', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="3"
                                                className="h-8 text-xs bg-white flex-1 min-w-0 px-2"
                                                min={0}
                                                max={20}
                                            />
                                            <span className="text-[11px] text-slate-400 shrink-0">px</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div />
                                )}
                            </div>

                            {/* Note about numeric scales */}
                            {(config?.type === 'category' || config?.type === 'time') && (
                                <div className="px-3 py-2 bg-amber-50/80 border border-amber-200/70 rounded-lg">
                                    <p className="text-[11px] text-amber-800 flex items-center gap-1.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-600">
                                            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                        Min/Max values only apply to numeric scales (current type: {config?.type || 'category'}).
                                    </p>
                                </div>
                            )}

                            {/* Row 3: 2 columns */}
                            <div className="grid grid-cols-2 gap-2.5 items-end">
                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Auto Skip</Label>
                                    <div className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                                        <span className="text-xs text-slate-600 whitespace-nowrap">Skip overlap</span>
                                        <Switch
                                            checked={config?.ticks?.autoSkip !== false}
                                            onCheckedChange={(checked) => updateConfig('ticks.autoSkip', checked)}
                                            className="data-[state=checked]:bg-blue-600 scale-90"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Mirror</Label>
                                    <div className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                                        <span className="text-xs text-slate-600 whitespace-nowrap">Inside Chart</span>
                                        <Switch
                                            checked={!!config?.ticks?.mirror}
                                            onCheckedChange={(checked) => updateConfig('ticks.mirror', checked)}
                                            className="data-[state=checked]:bg-blue-600 scale-90"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Major Ticks Section */}
                <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                    <div
                        className={cn(
                            "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                            majorTicksDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                        )}
                        onClick={() => setMajorTicksDropdownOpen(!majorTicksDropdownOpen)}
                    >
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            <h3 className="text-xs font-semibold text-slate-800">Major Ticks</h3>
                        </div>
                        <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Switch
                                checked={!!config?.ticks?.major?.enabled}
                                onCheckedChange={(checked) => updateNestedConfig('ticks.major', 'enabled', checked)}
                                className="data-[state=checked]:bg-blue-600"
                            />
                            <button
                                type="button"
                                onClick={() => setMajorTicksDropdownOpen(!majorTicksDropdownOpen)}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                aria-label="Toggle major ticks options"
                            >
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", majorTicksDropdownOpen && "rotate-180")} />
                            </button>
                        </div>
                    </div>

                    {/* Major Ticks Dropdown Content */}
                    {majorTicksDropdownOpen && (
                        <div className="p-3.5 bg-white">
                            <FontSettingSection
                                idPrefix={`major-ticks-${axis}`}
                                value={{
                                    ...mapChartJsFontValue(
                                        config?.ticks?.major?.font,
                                        config?.ticks?.major?.color
                                    ),
                                    style:
                                        config?.ticks?.major?.font?.style ||
                                        (config?.ticks?.major?.fontStyle === 'italic' ? 'italic' : 'normal'),
                                }}
                                defaultFamily={config?.ticks?.font?.family || 'Arial'}
                                defaultSize={14}
                                defaultWeight="700"
                                defaultColor="#000000"
                                sizeMin={8}
                                sizeMax={24}
                                onChange={(patch) =>
                                    applyChartJsFontPatch(
                                        patch,
                                        (field, val) => updateNestedConfig('ticks.major.font', field, val),
                                        (color) => updateNestedConfig('ticks.major', 'color', color)
                                    )
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
