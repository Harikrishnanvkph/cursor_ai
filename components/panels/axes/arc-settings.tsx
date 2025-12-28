"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

interface ArcSettingsProps {
    chartType: string
    options: any
    onUpdate: (path: string, value: any) => void
}

export function ArcSettings({ chartType, options, onUpdate }: ArcSettingsProps) {
    const [generalOpen, setGeneralOpen] = useState(true)
    const [hoverOpen, setHoverOpen] = useState(false)
    const [borderOpen, setBorderOpen] = useState(false)

    // Get current values with defaults
    const cutout = options?.cutout ?? (chartType === 'doughnut' ? '50%' : '0%')
    const rotation = options?.rotation ?? 0
    const circumference = options?.circumference ?? 360
    const spacing = options?.spacing ?? 0
    const borderRadius = options?.borderRadius ?? 0
    const borderWidth = options?.borderWidth ?? 2
    const borderAlign = options?.borderAlign ?? 'center'
    const hoverOffset = options?.hoverOffset ?? 4
    const hoverBorderWidth = options?.hoverBorderWidth ?? 1

    // Parse cutout value (handle both percentage and pixel values)
    const cutoutValue = typeof cutout === 'string'
        ? parseInt(cutout.replace('%', '')) || 0
        : cutout

    const isPieOrDoughnut = ['pie', 'doughnut'].includes(chartType)
    const isPolarArea = chartType === 'polarArea'

    return (
        <div className="space-y-4">
            {/* General Arc Settings */}
            <div className="space-y-3">
                <div
                    className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
                    onClick={() => setGeneralOpen(!generalOpen)}
                >
                    <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900 flex-1">Slice Configuration</h3>
                    <div className="ml-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${generalOpen ? 'rotate-180' : ''}`}>
                            <path d="M6 9L12 15L18 9" />
                        </svg>
                    </div>
                </div>

                {generalOpen && (
                    <div className="bg-orange-50 rounded-lg p-3 space-y-4">
                        {/* Cutout (Doughnut hole size) */}
                        {isPieOrDoughnut && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Cutout (Hole Size)</Label>
                                    <span className="text-xs text-gray-500">{cutoutValue}%</span>
                                </div>
                                <Slider
                                    value={[cutoutValue]}
                                    onValueChange={([value]) => onUpdate('cutout', `${value}%`)}
                                    max={90}
                                    min={0}
                                    step={5}
                                    className="mt-1"
                                />
                                <p className="text-xs text-gray-500">0% = Pie chart, 50%+ = Doughnut</p>
                            </div>
                        )}

                        {/* Rotation */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Rotation</Label>
                                <span className="text-xs text-gray-500">{rotation}°</span>
                            </div>
                            <Slider
                                value={[rotation]}
                                onValueChange={([value]) => onUpdate('rotation', value)}
                                max={360}
                                min={-360}
                                step={15}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500">Starting angle of the first slice</p>
                        </div>

                        {/* Circumference */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Circumference</Label>
                                <span className="text-xs text-gray-500">{circumference}°</span>
                            </div>
                            <Slider
                                value={[circumference]}
                                onValueChange={([value]) => onUpdate('circumference', value)}
                                max={360}
                                min={0}
                                step={15}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500">Arc sweep (180° = half circle, 360° = full)</p>
                        </div>

                        {/* Spacing between slices */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Slice Spacing</Label>
                                <span className="text-xs text-gray-500">{spacing}px</span>
                            </div>
                            <Slider
                                value={[spacing]}
                                onValueChange={([value]) => onUpdate('spacing', value)}
                                max={20}
                                min={0}
                                step={1}
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Border Settings */}
            <div className="space-y-3">
                <div
                    className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
                    onClick={() => setBorderOpen(!borderOpen)}
                >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900 flex-1">Border & Corners</h3>
                    <div className="ml-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${borderOpen ? 'rotate-180' : ''}`}>
                            <path d="M6 9L12 15L18 9" />
                        </svg>
                    </div>
                </div>

                {borderOpen && (
                    <div className="bg-blue-50 rounded-lg p-3 space-y-4">
                        {/* Border Radius */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Border Radius</Label>
                                <span className="text-xs text-gray-500">{borderRadius}px</span>
                            </div>
                            <Slider
                                value={[borderRadius]}
                                onValueChange={([value]) => onUpdate('borderRadius', value)}
                                max={30}
                                min={0}
                                step={1}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500">Rounded corners on slices</p>
                        </div>

                        {/* Border Width */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Border Width</Label>
                                <span className="text-xs text-gray-500">{borderWidth}px</span>
                            </div>
                            <Slider
                                value={[borderWidth]}
                                onValueChange={([value]) => onUpdate('borderWidth', value)}
                                max={10}
                                min={0}
                                step={1}
                                className="mt-1"
                            />
                        </div>

                        {/* Border Align */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Border Alignment</Label>
                            <Select
                                value={borderAlign}
                                onValueChange={(value) => onUpdate('borderAlign', value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="center">Center</SelectItem>
                                    <SelectItem value="inner">Inner</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}
            </div>

            {/* Hover Effects */}
            <div className="space-y-3">
                <div
                    className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
                    onClick={() => setHoverOpen(!hoverOpen)}
                >
                    <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
                    <h3 className="text-sm font-semibold text-gray-900 flex-1">Hover Effects</h3>
                    <div className="ml-2 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${hoverOpen ? 'rotate-180' : ''}`}>
                            <path d="M6 9L12 15L18 9" />
                        </svg>
                    </div>
                </div>

                {hoverOpen && (
                    <div className="bg-pink-50 rounded-lg p-3 space-y-4">
                        {/* Hover Offset */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Hover Offset</Label>
                                <span className="text-xs text-gray-500">{hoverOffset}px</span>
                            </div>
                            <Slider
                                value={[hoverOffset]}
                                onValueChange={([value]) => onUpdate('hoverOffset', value)}
                                max={30}
                                min={0}
                                step={2}
                                className="mt-1"
                            />
                            <p className="text-xs text-gray-500">Slice pull-out distance on hover</p>
                        </div>

                        {/* Hover Border Width */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-medium">Hover Border Width</Label>
                                <span className="text-xs text-gray-500">{hoverBorderWidth}px</span>
                            </div>
                            <Slider
                                value={[hoverBorderWidth]}
                                onValueChange={([value]) => onUpdate('hoverBorderWidth', value)}
                                max={10}
                                min={0}
                                step={1}
                                className="mt-1"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
