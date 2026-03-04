import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface MoreTabProps {
    axis: 'x' | 'y'
    config: any
    onUpdate: (path: string, value: any) => void
    updateConfig: (path: string, value: any) => void
}

export function MoreTab({ axis, config, onUpdate, updateConfig }: MoreTabProps) {
    const [axisLineDropdownOpen, setAxisLineDropdownOpen] = useState(false)
    const [scaleConfigDropdownOpen, setScaleConfigDropdownOpen] = useState(false)

    return (
        <div className="space-y-2 overflow-y-auto overflow-x-hidden h-full">
            {/* Begin at Zero (Y-axis only) */}
            {axis === 'y' && (
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Label className="text-sm font-medium text-blue-900">Begin at Zero</Label>
                    <Switch
                        checked={!!config?.beginAtZero}
                        onCheckedChange={(checked) => updateConfig('beginAtZero', checked)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>
            )}

            {/* Axis Line Section - Dropdown */}
            <div className="space-y-0">
                <div
                    className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                    onClick={() => setAxisLineDropdownOpen(!axisLineDropdownOpen)}
                >
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Axis Line</h3>
                    <div className="ml-auto flex items-center gap-2">
                        <div onClick={(e) => e.stopPropagation()}>
                            <Switch
                                checked={config?.border?.display !== false}
                                onCheckedChange={(checked) => updateConfig('border.display', checked)}
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
                            className={`transform transition-transform ${axisLineDropdownOpen ? 'rotate-180' : ''}`}
                        >
                            <path d="M6 9L12 15L18 9" />
                        </svg>
                    </div>
                </div>

                {/* Dropdown Content */}
                {axisLineDropdownOpen && (
                    <div className="bg-orange-50 rounded-b-lg p-3 space-y-3 border-x border-b border-orange-100">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Color */}
                            <div className="flex flex-col items-start gap-1">
                                <Label className="text-xs font-medium">Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform flex-shrink-0"
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
                                        className="w-20 h-8 text-xs font-mono uppercase"
                                        placeholder="#666666"
                                    />
                                </div>
                            </div>

                            {/* Width */}
                            <div className="flex flex-col items-start gap-1">
                                <Label className="text-xs font-medium">Width</Label>
                                <Input
                                    type="number"
                                    value={config?.border?.width || ''}
                                    onChange={(e) => updateConfig('border.width', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="1"
                                    className="h-8 text-xs w-full"
                                    min={0}
                                    max={10}
                                    step={0.5}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scale Configuration Section - Dropdown */}
            <div className="space-y-0">
                <div
                    className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
                    onClick={() => setScaleConfigDropdownOpen(!scaleConfigDropdownOpen)}
                >
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900">Scale Configuration</h3>
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
                        className={`ml-auto transform transition-transform ${scaleConfigDropdownOpen ? 'rotate-180' : ''}`}
                    >
                        <path d="M6 9L12 15L18 9" />
                    </svg>
                </div>

                {/* Dropdown Content */}
                {scaleConfigDropdownOpen && (
                    <div className="bg-purple-50 rounded-b-lg p-3 space-y-3 relative overflow-hidden border-x border-b border-purple-100">
                        {/* Scale Bounds */}
                        <div className="space-y-1">
                            <Label className="text-xs font-medium">Scale Bounds</Label>
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
                                <SelectTrigger className="h-8 text-xs">
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
                            <Label className="text-xs font-medium">Grace</Label>
                            <Input
                                type="number"
                                value={config?.grace ?? 5}
                                onChange={(e) => updateConfig('grace', e.target.value ? Number(e.target.value) : 5)}
                                placeholder="5"
                                className="h-8 text-xs"
                                min={0}
                                step={0.1}
                                disabled={config?.bounds === 'data'}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
