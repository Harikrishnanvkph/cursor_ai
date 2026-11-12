import React, { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { FontFamilySelect, FontWeightSelect } from "@/components/ui/font-family-select"
import { PaddingControl, Padding4Way } from "@/components/ui/padding-control"

interface TitleTabProps {
    chartConfig: any
    handleConfigUpdate: (path: string, value: any) => void
}

export function TitleTab({ chartConfig, handleConfigUpdate }: TitleTabProps) {
    return (
        <div className="space-y-4 mt-2">
            {/* ==================== TITLE SECTION ==================== */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                {/* Header with toggle */}
                <div className="flex items-center justify-between p-3 bg-blue-50/70 border-b border-blue-100/70">
                    <div>
                        <Label className="text-sm font-semibold text-blue-950">Chart Title</Label>
                        <p className="text-[11px] text-blue-700/80">Primary heading above your chart</p>
                    </div>
                    <Switch
                        checked={chartConfig.plugins?.title?.display || false}
                        onCheckedChange={(checked) => handleConfigUpdate("plugins.title.display", checked)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                {chartConfig.plugins?.title?.display && (
                    <div className="p-3.5 space-y-3.5">
                        <div>
                            <Label className="text-xs font-medium">Title Text</Label>
                            <Input
                                value={chartConfig.plugins?.title?.text || ""}
                                onChange={(e) => handleConfigUpdate("plugins.title.text", e.target.value)}
                                placeholder="Chart Title"
                                className="h-8 text-xs mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Family</Label>
                                <FontFamilySelect
                                    value={(chartConfig.plugins?.title?.font as any)?.family || "Arial"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.title.font.family", value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Weight</Label>
                                <FontWeightSelect
                                    value={String((chartConfig.plugins?.title?.font as any)?.weight || "700")}
                                    onValueChange={(value) => handleConfigUpdate("plugins.title.font.weight", value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Size</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={chartConfig.plugins?.title?.font?.size || 16}
                                        onChange={(e) => handleConfigUpdate("plugins.title.font.size", Number(e.target.value))}
                                        className="h-8 text-xs"
                                        min={8}
                                        max={48}
                                    />
                                    <span className="text-xs text-gray-500">px</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Text Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: chartConfig.plugins?.title?.color || "#000000" }}
                                        onClick={() => document.getElementById('title-color-picker')?.click()}
                                    />
                                    <input
                                        id="title-color-picker"
                                        type="color"
                                        value={chartConfig.plugins?.title?.color || "#000000"}
                                        onChange={(e) => handleConfigUpdate("plugins.title.color", e.target.value)}
                                        className="sr-only"
                                    />
                                    <Input
                                        value={chartConfig.plugins?.title?.color || "#000000"}
                                        onChange={(e) => handleConfigUpdate("plugins.title.color", e.target.value)}
                                        className="h-8 text-xs font-mono uppercase flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Alignment</Label>
                                <Select
                                    value={(chartConfig.plugins?.title as any)?.align || "center"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.title.align", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Center" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="start">Left</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="end">Right</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Position</Label>
                                <Select
                                    value={(chartConfig.plugins?.title as any)?.position || "top"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.title.position", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Top" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top">Top</SelectItem>
                                        <SelectItem value="bottom">Bottom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <PaddingControl
                            label="Padding"
                            value={chartConfig.plugins?.title?.padding}
                            defaultValue={10}
                            onChange={(val) => handleConfigUpdate("plugins.title.padding", val)}
                        />
                    </div>
                )}
            </div>

            {/* ==================== SUBTITLE SECTION ==================== */}
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs">
                {/* Header with toggle */}
                <div className="flex items-center justify-between p-3 bg-blue-50/70 border-b border-blue-100/70">
                    <div>
                        <Label className="text-sm font-semibold text-blue-950">Chart Subtitle</Label>
                        <p className="text-[11px] text-blue-700/80">Secondary heading below chart title</p>
                    </div>
                    <Switch
                        checked={chartConfig.plugins?.subtitle?.display || false}
                        onCheckedChange={(checked) => handleConfigUpdate("plugins.subtitle.display", checked)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                {chartConfig.plugins?.subtitle?.display && (
                    <div className="p-3.5 space-y-3.5">
                        <div>
                            <Label className="text-xs font-medium">Subtitle Text</Label>
                            <Input
                                value={chartConfig.plugins?.subtitle?.text || ""}
                                onChange={(e) => handleConfigUpdate("plugins.subtitle.text", e.target.value)}
                                placeholder="Custom Chart Subtitle"
                                className="h-8 text-xs mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Family</Label>
                                <FontFamilySelect
                                    value={(chartConfig.plugins?.subtitle?.font as any)?.family || "Arial"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.subtitle.font.family", value)}
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Weight</Label>
                                <FontWeightSelect
                                    value={String((chartConfig.plugins?.subtitle?.font as any)?.weight || "400")}
                                    onValueChange={(value) => handleConfigUpdate("plugins.subtitle.font.weight", value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Size</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        value={chartConfig.plugins?.subtitle?.font?.size || 12}
                                        onChange={(e) => handleConfigUpdate("plugins.subtitle.font.size", Number(e.target.value))}
                                        className="h-8 text-xs"
                                        min={8}
                                        max={48}
                                    />
                                    <span className="text-xs text-gray-500">px</span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Text Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="relative w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform overflow-hidden flex-shrink-0"
                                        style={{ backgroundColor: chartConfig.plugins?.subtitle?.color || "#666666" }}
                                    >
                                        <input
                                            type="color"
                                            value={chartConfig.plugins?.subtitle?.color || "#666666"}
                                            onChange={(e) => handleConfigUpdate("plugins.subtitle.color", e.target.value)}
                                            className="absolute -inset-2 w-[200%] h-[200%] opacity-0 cursor-pointer"
                                        />
                                    </div>
                                    <Input
                                        value={chartConfig.plugins?.subtitle?.color || "#666666"}
                                        onChange={(e) => handleConfigUpdate("plugins.subtitle.color", e.target.value)}
                                        className="h-8 text-xs font-mono uppercase flex-1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Alignment</Label>
                                <Select
                                    value={(chartConfig.plugins?.subtitle as any)?.align || "center"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.subtitle.align", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Center" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="start">Left</SelectItem>
                                        <SelectItem value="center">Center</SelectItem>
                                        <SelectItem value="end">Right</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Position</Label>
                                <Select
                                    value={(chartConfig.plugins?.subtitle as any)?.position || "top"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.subtitle.position", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Top" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="top">Top</SelectItem>
                                        <SelectItem value="bottom">Bottom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <PaddingControl
                            label="Padding"
                            value={chartConfig.plugins?.subtitle?.padding}
                            defaultValue={0}
                            onChange={(val) => handleConfigUpdate("plugins.subtitle.padding", val)}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
