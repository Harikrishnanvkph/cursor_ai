import React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaddingControl } from "@/components/ui/padding-control"
import {
    FontSettingSection,
    mapChartJsFontValue,
    applyChartJsFontPatch,
} from "@/components/ui/font-setting-section"
import { useIsModernPanel, MODERN_PANEL_UI } from "@/components/editor/modern-panel-context"

interface TitleTabProps {
    chartConfig: any
    handleConfigUpdate: (path: string, value: any) => void
}

export function TitleTab({ chartConfig, handleConfigUpdate }: TitleTabProps) {
    const isModern = useIsModernPanel()
    return (
        <div className={isModern ? "space-y-3" : "space-y-4 mt-2"}>
            {/* ==================== TITLE SECTION ==================== */}
            <div className={isModern ? MODERN_PANEL_UI.card : "rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs"}>
                {/* Header with toggle */}
                <div className={isModern ? MODERN_PANEL_UI.sectionHeaderRow : "flex items-center justify-between p-3 bg-blue-50/70 border-b border-blue-100/70"}>
                    <div>
                        <Label className={isModern ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-blue-950"}>Chart Title</Label>
                        <p className={isModern ? "text-[11px] text-slate-500" : "text-[11px] text-blue-700/80"}>Primary heading above your chart</p>
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

                        <FontSettingSection
                            idPrefix="chart-title"
                            value={mapChartJsFontValue(chartConfig.plugins?.title?.font, chartConfig.plugins?.title?.color)}
                            defaultFamily="Arial"
                            defaultSize={16}
                            defaultWeight="700"
                            defaultColor="#000000"
                            sizeMin={8}
                            sizeMax={48}
                            onChange={(patch) =>
                                applyChartJsFontPatch(
                                    patch,
                                    (field, val) => handleConfigUpdate(`plugins.title.font.${field}`, val),
                                    (color) => handleConfigUpdate("plugins.title.color", color)
                                )
                            }
                        />

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
            <div className={isModern ? MODERN_PANEL_UI.card : "rounded-xl border border-gray-200 bg-white overflow-hidden shadow-2xs"}>
                {/* Header with toggle */}
                <div className={isModern ? MODERN_PANEL_UI.sectionHeaderRow : "flex items-center justify-between p-3 bg-blue-50/70 border-b border-blue-100/70"}>
                    <div>
                        <Label className={isModern ? "text-xs font-semibold text-slate-800" : "text-sm font-semibold text-blue-950"}>Chart Subtitle</Label>
                        <p className={isModern ? "text-[11px] text-slate-500" : "text-[11px] text-blue-700/80"}>Secondary heading below chart title</p>
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

                        <FontSettingSection
                            idPrefix="chart-subtitle"
                            value={mapChartJsFontValue(chartConfig.plugins?.subtitle?.font, chartConfig.plugins?.subtitle?.color)}
                            defaultFamily="Arial"
                            defaultSize={12}
                            defaultWeight="400"
                            defaultColor="#666666"
                            sizeMin={8}
                            sizeMax={48}
                            onChange={(patch) =>
                                applyChartJsFontPatch(
                                    patch,
                                    (field, val) => handleConfigUpdate(`plugins.subtitle.font.${field}`, val),
                                    (color) => handleConfigUpdate("plugins.subtitle.color", color)
                                )
                            }
                        />

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
