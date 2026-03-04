import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"

interface TitleTabProps {
    chartConfig: any
    handleConfigUpdate: (path: string, value: any) => void
}

export function TitleTab({ chartConfig, handleConfigUpdate }: TitleTabProps) {
    return (
        <div className="space-y-6 mt-4">
            {/* ==================== TITLE SETTINGS ==================== */}
            <div className="space-y-4">
                {/* Show Title Toggle */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Label className="text-sm font-medium text-blue-900">Show Title</Label>
                    <Switch
                        checked={chartConfig.plugins?.title?.display || false}
                        onCheckedChange={(checked) => handleConfigUpdate("plugins.title.display", checked)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                {!chartConfig.plugins?.title?.display && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>Enable Chart Title</strong> to add a prominent heading above your chart.
                            You can customize the text, font, size, color, alignment, and position.
                        </p>
                    </div>
                )}

                {chartConfig.plugins?.title?.display && (
                    <div className="space-y-4 pl-1">
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
                                <Select
                                    value={(chartConfig.plugins?.title?.font as any)?.family || "Arial"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.title.font.family", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Arial">Arial</SelectItem>
                                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                                        <SelectItem value="Times">Times New Roman</SelectItem>
                                        <SelectItem value="Courier">Courier New</SelectItem>
                                        <SelectItem value="Georgia">Georgia</SelectItem>
                                        <SelectItem value="Verdana">Verdana</SelectItem>
                                        <SelectItem value="Impact">Impact</SelectItem>
                                        <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Weight</Label>
                                <Select
                                    value={(chartConfig.plugins?.title?.font as any)?.weight || "700"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.title.font.weight", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Normal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="400">Light</SelectItem>
                                        <SelectItem value="700">Normal</SelectItem>
                                        <SelectItem value="800">Bold</SelectItem>
                                    </SelectContent>
                                </Select>
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

                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <Label className="text-xs font-medium">Padding</Label>
                                <span className="text-xs text-gray-500">{(chartConfig.plugins?.title as any)?.padding || 10}px</span>
                            </div>
                            <Slider
                                value={[(chartConfig.plugins?.title as any)?.padding || 10]}
                                onValueChange={([value]) => handleConfigUpdate("plugins.title.padding", value)}
                                max={50}
                                min={0}
                                step={1}
                                className="mt-2"
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="border-t border-gray-100 my-4" />

            {/* ==================== SUBTITLE SETTINGS ==================== */}
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Label className="text-sm font-medium text-blue-900">Show Subtitle</Label>
                    <Switch
                        checked={chartConfig.plugins?.subtitle?.display || false}
                        onCheckedChange={(checked) => handleConfigUpdate("plugins.subtitle.display", checked)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                {!chartConfig.plugins?.subtitle?.display && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800 leading-relaxed">
                            <strong>Enable Chart Subtitle</strong> to add a secondary heading below your chart title.
                        </p>
                    </div>
                )}

                {chartConfig.plugins?.subtitle?.display && (
                    <div className="space-y-4 pl-1">
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
                                <Select
                                    value={(chartConfig.plugins?.subtitle?.font as any)?.family || "Arial"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.subtitle.font.family", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Arial">Arial</SelectItem>
                                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                                        <SelectItem value="Times">Times New Roman</SelectItem>
                                        <SelectItem value="Courier">Courier New</SelectItem>
                                        <SelectItem value="Georgia">Georgia</SelectItem>
                                        <SelectItem value="Verdana">Verdana</SelectItem>
                                        <SelectItem value="Impact">Impact</SelectItem>
                                        <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Font Weight</Label>
                                <Select
                                    value={(chartConfig.plugins?.subtitle?.font as any)?.weight || "400"}
                                    onValueChange={(value) => handleConfigUpdate("plugins.subtitle.font.weight", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Normal" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="400">Normal</SelectItem>
                                        <SelectItem value="700">Bold</SelectItem>
                                        <SelectItem value="300">Light</SelectItem>
                                    </SelectContent>
                                </Select>
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
                                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: chartConfig.plugins?.subtitle?.color || "#666666" }}
                                        onClick={() => document.getElementById('subtitle-color-picker')?.click()}
                                    />
                                    <input
                                        id="subtitle-color-picker"
                                        type="color"
                                        value={chartConfig.plugins?.subtitle?.color || "#666666"}
                                        onChange={(e) => handleConfigUpdate("plugins.subtitle.color", e.target.value)}
                                        className="sr-only"
                                    />
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

                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <Label className="text-xs font-medium">Padding</Label>
                                <span className="text-xs text-gray-500">{(chartConfig.plugins?.subtitle as any)?.padding || 0}px</span>
                            </div>
                            <Slider
                                value={[(chartConfig.plugins?.subtitle as any)?.padding || 0]}
                                onValueChange={([value]) => handleConfigUpdate("plugins.subtitle.padding", value)}
                                max={50}
                                min={0}
                                step={1}
                                className="mt-2"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
