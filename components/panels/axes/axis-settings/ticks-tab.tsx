import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface TicksTabProps {
    axis: 'x' | 'y'
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
        <div className="space-y-2 overflow-y-auto overflow-x-hidden h-full pr-0 relative isolate">
            <div className="space-y-2 relative">
                {/* Tick Mark Section */}
                <div className="space-y-0">
                    <div
                        className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                        onClick={() => setTickMarkConfigDropdownOpen(!tickMarkConfigDropdownOpen)}
                    >
                        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-900">Tick Mark</h3>
                        <div className="ml-auto flex items-center gap-2">
                            <div onClick={(e) => e.stopPropagation()}>
                                <Switch
                                    checked={config?.grid?.tickLength !== 0}
                                    onCheckedChange={(checked) => updateConfig('grid.tickLength', checked ? 8 : 0)}
                                    className="data-[state=checked]:bg-green-600"
                                />
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transform transition-transform ${tickMarkConfigDropdownOpen ? 'rotate-180' : ''}`}
                            >
                                <path d="M6 9L12 15L18 9" />
                            </svg>
                        </div>
                    </div>

                    {/* Dropdown Content */}
                    {tickMarkConfigDropdownOpen && (
                        <div className="bg-green-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto border-x border-b border-green-100">
                            {/* Color */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                            style={{ backgroundColor: config?.grid?.tickColor || '#666666' }}
                                            onClick={() => document.getElementById(`grid-tick-color-${axis}`)?.click()}
                                        />
                                        <input
                                            id={`grid-tick-color-${axis}`}
                                            type="color"
                                            value={config?.grid?.tickColor || '#666666'}
                                            onChange={(e) => updateConfig('grid.tickColor', e.target.value)}
                                            className="sr-only"
                                        />
                                        <Input
                                            value={config?.grid?.tickColor || '#666666'}
                                            onChange={(e) => updateConfig('grid.tickColor', e.target.value)}
                                            className="w-24 h-8 text-xs font-mono uppercase"
                                            placeholder="#666666"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tick Width and Tick Length */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Tick Width</Label>
                                    <Input
                                        type="number"
                                        value={config?.grid?.tickWidth || ''}
                                        onChange={(e) => updateConfig('grid.tickWidth', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="1"
                                        className="h-8 text-xs"
                                        min={0}
                                        max={10}
                                        step={0.5}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Tick Length</Label>
                                    <Input
                                        type="number"
                                        value={config?.grid?.tickLength || ''}
                                        onChange={(e) => updateConfig('grid.tickLength', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="6"
                                        className="h-8 text-xs"
                                        min={0}
                                        max={20}
                                        step={1}
                                    />
                                </div>
                            </div>

                            {/* Offset Toggles */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Offset</Label>
                                    <Switch
                                        checked={config?.offset ?? ['bar', 'horizontalBar', 'stacked'].includes(chartType || '')}
                                        onCheckedChange={(checked) => updateConfig('offset', checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Grid Offset</Label>
                                    <Switch
                                        checked={config?.grid?.offset ?? ['bar', 'horizontalBar', 'stacked'].includes(chartType || '')}
                                        onCheckedChange={(checked) => updateConfig('grid.offset', checked)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Tick Configuration Section */}
                <div className="space-y-0">
                    <div
                        className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                        onClick={() => setTickConfigDropdownOpen(!tickConfigDropdownOpen)}
                    >
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-900">Tick Configuration</h3>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`ml-auto transform transition-transform ${tickConfigDropdownOpen ? 'rotate-180' : ''}`}
                        >
                            <path d="M6 9L12 15L18 9" />
                        </svg>
                    </div>

                    {/* Dropdown Content */}
                    {tickConfigDropdownOpen && (
                        <div className="bg-purple-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden border-x border-b border-purple-100">
                            {/* Limits */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Max Ticks Limit</Label>
                                    <Input
                                        type="number"
                                        value={config?.ticks?.maxTicksLimit || ''}
                                        onChange={(e) => updateConfig('ticks.maxTicksLimit', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="11"
                                        className="h-8 text-xs"
                                        min={2}
                                        max={20}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Step Size</Label>
                                    <Input
                                        type="number"
                                        value={config?.ticks?.stepSize || ''}
                                        onChange={(e) => updateConfig('ticks.stepSize', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="Auto"
                                        className="h-8 text-xs"
                                        min={0}
                                        step={0.1}
                                    />
                                </div>
                            </div>

                            {/* Min/Max Values */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Min Value</Label>
                                    <Input
                                        type="number"
                                        value={config?.min ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : undefined
                                            updateConfig('min', value)
                                        }}
                                        placeholder="Auto"
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Max Value</Label>
                                    <Input
                                        type="number"
                                        value={config?.max ?? ''}
                                        onChange={(e) => {
                                            const value = e.target.value ? Number(e.target.value) : undefined
                                            updateConfig('max', value)
                                        }}
                                        placeholder="Auto"
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Note about numeric scales */}
                            {(config?.type === 'category' || config?.type === 'time') && (
                                <div className="px-3 py-2 bg-yellow-50 rounded-lg">
                                    <p className="text-xs text-yellow-700 flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                        </svg>
                                        Min/Max values only work with numeric scales. Current type: {config?.type || 'category'}
                                    </p>
                                </div>
                            )}

                            {/* Auto Skip Settings */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Auto Skip</Label>
                                    <Switch
                                        checked={config?.ticks?.autoSkip !== false}
                                        onCheckedChange={(checked) => updateConfig('ticks.autoSkip', checked)}
                                    />
                                </div>

                                {config?.ticks?.autoSkip !== false && (
                                    <div className="pl-3 space-y-1">
                                        <Label className="text-xs font-medium">Auto Skip Padding</Label>
                                        <Input
                                            type="number"
                                            value={config?.ticks?.autoSkipPadding || ''}
                                            onChange={(e) => updateConfig('ticks.autoSkipPadding', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="3"
                                            className="h-8 text-xs"
                                            min={0}
                                            max={10}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Padding Settings */}
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Padding</Label>
                                    <Input
                                        type="number"
                                        value={config?.ticks?.padding || ''}
                                        onChange={(e) => updateConfig('ticks.padding', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="8"
                                        className="h-8 text-xs"
                                        min={0}
                                        max={20}
                                        step={1}
                                    />
                                </div>
                            </div>

                            {/* Cross Align and Mirror Settings */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Cross Align</Label>
                                    <Select
                                        value={config?.ticks?.crossAlign || 'near'}
                                        onValueChange={(value) => updateConfig('ticks.crossAlign', value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="near">Near</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="far">Far</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Mirror</Label>
                                    <div className="h-8 flex items-center">
                                        <Switch
                                            checked={!!config?.ticks?.mirror}
                                            onCheckedChange={(checked) => updateConfig('ticks.mirror', checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Major Ticks Section */}
                <div className="space-y-0">
                    <div
                        className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                        onClick={() => setMajorTicksDropdownOpen(!majorTicksDropdownOpen)}
                    >
                        <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                        <h3 className="text-sm font-semibold text-gray-900">Major Ticks</h3>
                        <div className="ml-auto flex items-center gap-2">
                            <div onClick={(e) => e.stopPropagation()}>
                                <Switch
                                    checked={!!config?.ticks?.major?.enabled}
                                    onCheckedChange={(checked) => updateNestedConfig('ticks.major', 'enabled', checked)}
                                    className="data-[state=checked]:bg-orange-600"
                                />
                            </div>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={`transform transition-transform ${majorTicksDropdownOpen ? 'rotate-180' : ''}`}
                            >
                                <path d="M6 9L12 15L18 9" />
                            </svg>
                        </div>
                    </div>

                    {/* Dropdown Content */}
                    {majorTicksDropdownOpen && (
                        <div className="bg-orange-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto border-x border-b border-orange-100">
                            {/* Color */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                            style={{ backgroundColor: config?.ticks?.major?.color || '#000000' }}
                                            onClick={() => document.getElementById(`major-tick-color-${axis}`)?.click()}
                                        />
                                        <input
                                            id={`major-tick-color-${axis}`}
                                            type="color"
                                            value={config?.ticks?.major?.color || '#000000'}
                                            onChange={(e) => updateNestedConfig('ticks.major', 'color', e.target.value)}
                                            className="sr-only"
                                        />
                                        <Input
                                            value={config?.ticks?.major?.color || '#000000'}
                                            onChange={(e) => updateNestedConfig('ticks.major', 'color', e.target.value)}
                                            className="w-24 h-8 text-xs font-mono uppercase"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Font Settings */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Font Size</Label>
                                    <Input
                                        type="number"
                                        value={config?.ticks?.major?.font?.size || ''}
                                        onChange={(e) => updateNestedConfig('ticks.major.font', 'size', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="14"
                                        className="h-8 text-xs"
                                        min={8}
                                        max={24}
                                        step={1}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Font Weight</Label>
                                    <Select
                                        value={config?.ticks?.major?.font?.weight || 'bold'}
                                        onValueChange={(value) => updateNestedConfig('ticks.major.font', 'weight', value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="400">Normal</SelectItem>
                                            <SelectItem value="600">Bold</SelectItem>
                                            <SelectItem value="900">Bolder</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Style</Label>
                                <Select
                                    value={config?.ticks?.major?.fontStyle || 'bold'}
                                    onValueChange={(value) => updateNestedConfig('ticks.major', 'fontStyle', value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="bold">Bold</SelectItem>
                                        <SelectItem value="italic">Italic</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
