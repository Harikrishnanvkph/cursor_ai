import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useRef } from "react"
import { ScaleType } from "chart.js"

interface GeneralTabProps {
    axis: 'x' | 'y'
    config: any
    updateConfig: (path: string, value: any) => void
    updateNestedConfig: (basePath: string, path: string, value: any) => void
}

const axisTypeOptions: { value: ScaleType; label: string }[] = [
    { value: 'category', label: 'Category' },
    { value: 'linear', label: 'Linear' },
    { value: 'logarithmic', label: 'Logarithmic' },
    { value: 'time', label: 'Time' }
]

const positionOptions = (axis: 'x' | 'y') => [
    { value: axis === 'x' ? 'bottom' : 'left', label: axis === 'x' ? 'Bottom' : 'Left' },
    { value: axis === 'x' ? 'top' : 'right', label: axis === 'x' ? 'Top' : 'Right' },
    { value: 'center', label: 'Center' },
]

export function GeneralTab({ axis, config, updateConfig, updateNestedConfig }: GeneralTabProps) {
    const [titleDropdownOpen, setTitleDropdownOpen] = useState(false)
    const [labelAppearanceDropdownOpen, setLabelAppearanceDropdownOpen] = useState(false)
    const [gridAppearanceDropdownOpen, setGridAppearanceDropdownOpen] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)

    const lineDashOptions = [
        { label: 'Solid', value: '[]' },
        { label: 'Dashed', value: '[5,5]' },
        { label: 'Dotted', value: '[2,2]' },
        { label: 'Dash-Dot', value: '[5,2,2,2]' },
    ]

    const currentDash = config?.border?.dash || []
    const currentDashStr = JSON.stringify(currentDash)
    const currentDashLabel = lineDashOptions.find(opt => opt.value === currentDashStr)?.label || 'Custom'

    return (
        <div className="space-y-2">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg border border-blue-100">
                <Label className="text-sm font-medium text-blue-900">Show {axis.toUpperCase()}-Axis</Label>
                <Switch
                    checked={config?.display !== false}
                    onCheckedChange={(checked) => updateConfig('display', checked)}
                    className="data-[state=checked]:bg-blue-600"
                />
            </div>

            {config?.display !== false && (
                <div className="space-y-2">
                    {/* Type and Position */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Type</Label>
                            <Select
                                value={config?.type || 'category'}
                                onValueChange={(value) => updateConfig('type', value)}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {axisTypeOptions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Position</Label>
                            <Select
                                value={config?.position || (axis === 'x' ? 'bottom' : 'left')}
                                onValueChange={(value) => updateConfig('position', value)}
                            >
                                <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select position" />
                                </SelectTrigger>
                                <SelectContent>
                                    {positionOptions(axis).map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Title Section */}
                    <div className="space-y-0">
                        <div
                            className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                            onClick={() => setTitleDropdownOpen(!titleDropdownOpen)}
                        >
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-gray-900">Title</h3>
                            <div className="ml-auto flex items-center gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                        checked={!!config?.title?.display}
                                        onCheckedChange={(checked) => {
                                            updateConfig('title.display', checked)
                                            if (checked) {
                                                setTimeout(() => {
                                                    titleInputRef.current?.focus()
                                                }, 100)
                                            }
                                        }}
                                        className="data-[state=checked]:bg-blue-600"
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
                                    className={`transform transition-transform ${titleDropdownOpen ? 'rotate-180' : ''}`}
                                >
                                    <path d="M6 9L12 15L18 9" />
                                </svg>
                            </div>
                        </div>

                        {/* Dropdown Content */}
                        {titleDropdownOpen && (
                            <div className="bg-blue-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto border-x border-b border-blue-100">
                                {/* Title Text Input */}
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Text</Label>
                                    <Input
                                        ref={titleInputRef}
                                        value={config?.title?.text || ''}
                                        onChange={(e) => updateConfig('title.text', e.target.value)}
                                        onFocus={(e) => {
                                            if (!config?.title?.text) {
                                                updateConfig('title.text', `${axis.toUpperCase()}-Axis`)
                                            }
                                        }}
                                        placeholder={`${axis.toUpperCase()}-Axis`}
                                        className="h-8 text-xs"
                                    />
                                </div>

                                {/* Color */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Color</Label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                style={{ backgroundColor: config?.title?.color || '#666666' }}
                                                onClick={() => document.getElementById(`title-color-${axis}`)?.click()}
                                            />
                                            <input
                                                id={`title-color-${axis}`}
                                                type="color"
                                                value={config?.title?.color || '#666666'}
                                                onChange={(e) => updateConfig('title.color', e.target.value)}
                                                className="sr-only"
                                            />
                                            <Input
                                                value={config?.title?.color || '#666666'}
                                                onChange={(e) => updateConfig('title.color', e.target.value)}
                                                className="w-24 h-8 text-xs font-mono uppercase"
                                                placeholder="#666666"
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
                                            value={config?.title?.font?.size || ''}
                                            onChange={(e) => updateNestedConfig('title.font', 'size', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="12"
                                            className="h-8 text-xs pr-1"
                                            min={8}
                                            max={24}
                                            step={1}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Weight</Label>
                                        <Select
                                            value={config?.title?.font?.weight || '400'}
                                            onValueChange={(value) => updateNestedConfig('title.font', 'weight', value)}
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

                                {/* Font Style and Family */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Style</Label>
                                        <Select
                                            value={config?.title?.font?.style || 'normal'}
                                            onValueChange={(value) => updateNestedConfig('title.font', 'style', value)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="italic">Italic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Font Family</Label>
                                        <Select
                                            value={config?.title?.font?.family || 'Arial'}
                                            onValueChange={(value) => updateNestedConfig('title.font', 'family', value)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Arial">Arial</SelectItem>
                                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                                <SelectItem value="Georgia">Georgia</SelectItem>
                                                <SelectItem value="Verdana">Verdana</SelectItem>
                                                <SelectItem value="Courier New">Courier New</SelectItem>
                                                <SelectItem value="system-ui">System UI</SelectItem>
                                                <SelectItem value="monospace">Monospace</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Padding and Alignment */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Padding</Label>
                                        <Input
                                            type="number"
                                            value={config?.title?.padding || ''}
                                            onChange={(e) => updateConfig('title.padding', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="0"
                                            className="h-8 text-xs"
                                            min={0}
                                            max={20}
                                            step={1}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Alignment</Label>
                                        <Select
                                            value={config?.title?.align || 'center'}
                                            onValueChange={(value) => updateConfig('title.align', value)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="start">Left</SelectItem>
                                                <SelectItem value="center">Center</SelectItem>
                                                <SelectItem value="end">Right</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Label Appearance Section */}
                    <div className="space-y-0">
                        <div
                            className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                            onClick={() => setLabelAppearanceDropdownOpen(!labelAppearanceDropdownOpen)}
                        >
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-gray-900">Label Appearance</h3>
                            <div className="ml-auto flex items-center gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                        checked={config?.ticks?.display !== false}
                                        onCheckedChange={(checked) => updateConfig('ticks.display', checked)}
                                        className="data-[state=checked]:bg-blue-600"
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
                                    className={`transform transition-transform ${labelAppearanceDropdownOpen ? 'rotate-180' : ''}`}
                                >
                                    <path d="M6 9L12 15L18 9" />
                                </svg>
                            </div>
                        </div>

                        {/* Dropdown Content */}
                        {labelAppearanceDropdownOpen && (
                            <div className="bg-blue-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto border-x border-b border-blue-100">
                                {/* Color */}
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-medium">Color</Label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                style={{ backgroundColor: config?.ticks?.color || '#666666' }}
                                                onClick={() => document.getElementById(`tick-color-${axis}`)?.click()}
                                            />
                                            <input
                                                id={`tick-color-${axis}`}
                                                type="color"
                                                value={config?.ticks?.color || '#666666'}
                                                onChange={(e) => updateConfig('ticks.color', e.target.value)}
                                                className="sr-only"
                                            />
                                            <Input
                                                value={config?.ticks?.color || '#666666'}
                                                onChange={(e) => updateConfig('ticks.color', e.target.value)}
                                                className="w-24 h-8 text-xs font-mono uppercase"
                                                placeholder="#666666"
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
                                            value={config?.ticks?.font?.size || ''}
                                            onChange={(e) => updateNestedConfig('ticks.font', 'size', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="12"
                                            className="h-8 text-xs"
                                            min={8}
                                            max={24}
                                            step={1}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Align</Label>
                                        <Select
                                            value={config?.ticks?.align || 'center'}
                                            onValueChange={(value) => updateConfig('ticks.align', value)}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="start">Start</SelectItem>
                                                <SelectItem value="center">Center</SelectItem>
                                                <SelectItem value="end">End</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Rotation</Label>
                                    <Input
                                        type="number"
                                        value={config?.ticks?.minRotation || ''}
                                        onChange={(e) => updateConfig('ticks.minRotation', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="0°"
                                        className="h-8 text-xs"
                                        min={0}
                                        max={90}
                                        step={5}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Grid Appearance Section */}
                    <div className="space-y-0">
                        <div
                            className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                            onClick={() => setGridAppearanceDropdownOpen(!gridAppearanceDropdownOpen)}
                        >
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-gray-900">Grid Appearance</h3>
                            <div className="ml-auto flex items-center gap-2">
                                <div onClick={(e) => e.stopPropagation()}>
                                    <Switch
                                        checked={config?.grid?.display !== false}
                                        onCheckedChange={(checked) => updateConfig('grid.display', checked)}
                                        className="data-[state=checked]:bg-blue-600"
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
                                    className={`transform transition-transform ${gridAppearanceDropdownOpen ? 'rotate-180' : ''}`}
                                >
                                    <path d="M6 9L12 15L18 9" />
                                </svg>
                            </div>
                        </div>

                        {/* Dropdown Content */}
                        {gridAppearanceDropdownOpen && (
                            <div className="bg-blue-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden max-h-96 overflow-y-auto border-x border-b border-blue-100">
                                {/* Color and Ref. Lines */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col items-start gap-1">
                                        <Label className="text-xs font-medium">Color</Label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                style={{ backgroundColor: config?.grid?.color || '#e5e7eb' }}
                                                onClick={() => document.getElementById(`grid-color-${axis}`)?.click()}
                                            />
                                            <input
                                                id={`grid-color-${axis}`}
                                                type="color"
                                                value={config?.grid?.color || '#e5e7eb'}
                                                onChange={(e) => updateConfig('grid.color', e.target.value)}
                                                className="sr-only"
                                            />
                                            <Input
                                                value={config?.grid?.color || '#e5e7eb'}
                                                onChange={(e) => updateConfig('grid.color', e.target.value)}
                                                className="w-20 h-8 text-xs font-mono uppercase"
                                                placeholder="#e5e7eb"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-start gap-1">
                                        <Label className="text-xs font-medium">Ref. Lines</Label>
                                        <Switch
                                            checked={config?.grid?.drawOnChartArea !== false}
                                            onCheckedChange={(checked) => updateConfig('grid.drawOnChartArea', checked)}
                                            className="data-[state=checked]:bg-blue-600"
                                        />
                                    </div>
                                </div>

                                {/* Line Properties */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Line Width</Label>
                                        <Input
                                            type="number"
                                            value={config?.grid?.lineWidth || ''}
                                            onChange={(e) => updateConfig('grid.lineWidth', e.target.value ? Number(e.target.value) : undefined)}
                                            placeholder="1"
                                            className="h-8 text-xs"
                                            min={0}
                                            max={5}
                                            step={0.1}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium">Line Style</Label>
                                        <Select
                                            value={currentDashStr}
                                            onValueChange={(value) => updateConfig('border.dash', JSON.parse(value))}
                                        >
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Select style">
                                                    {currentDashLabel}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent position="popper" sideOffset={4}>
                                                {lineDashOptions.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Custom Dash Pattern */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium text-gray-700">Custom Dash Pattern</Label>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">Dash Length</Label>
                                            <Input
                                                type="number"
                                                value={(config?.border?.dash && config?.border?.dash[0]) || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value ? Number(e.target.value) : 0
                                                    const currentDashList = config?.border?.dash || [0, 0]
                                                    updateConfig('border.dash', [value, currentDashList[1] || value])
                                                }}
                                                placeholder="0"
                                                className="h-8 text-xs"
                                                min={0}
                                                max={20}
                                                step={1}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">Gap Length</Label>
                                            <Input
                                                type="number"
                                                value={(config?.border?.dash && config?.border?.dash[1]) || ''}
                                                onChange={(e) => {
                                                    const value = e.target.value ? Number(e.target.value) : 0
                                                    const currentDashList = config?.border?.dash || [0, 0]
                                                    updateConfig('border.dash', [currentDashList[0] || value, value])
                                                }}
                                                placeholder="0"
                                                className="h-8 text-xs"
                                                min={0}
                                                max={20}
                                                step={1}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs text-gray-600">Dash Offset</Label>
                                            <Input
                                                type="number"
                                                value={config?.border?.dashOffset || ''}
                                                onChange={(e) => updateConfig('border.dashOffset', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="0"
                                                className="h-8 text-xs"
                                                min={0}
                                                max={20}
                                                step={1}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
