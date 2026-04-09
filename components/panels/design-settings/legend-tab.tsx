import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { PiePanel } from "../pie-panel"

type ConfigPathUpdate = {
    path: string;
    value: any;
}

export function LegendTab({
    chartConfig,
    chartType,
    handleConfigUpdate,
    applyConfigUpdates
}: {
    chartConfig: any;
    chartType: string;
    handleConfigUpdate: (path: string, value: any) => void;
    applyConfigUpdates: (updates: ConfigPathUpdate[]) => void;
}) {
    return (
        <div className="space-y-4 mt-4">
            {/* Show Legend Toggle */}
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                <Label className="text-sm font-medium text-green-900">Show Legend</Label>
                <Switch
                    checked={chartConfig.plugins?.legend?.display !== false}
                    onCheckedChange={(checked) => handleConfigUpdate("plugins.legend.display", checked)}
                    className="data-[state=checked]:bg-green-600"
                />
            </div>

            {chartConfig.plugins?.legend?.display === false && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800 leading-relaxed">
                        <strong>Enable Legend</strong> to display a color-coded key that helps viewers understand what each data series represents.
                    </p>
                </div>
            )}

            {chartConfig.plugins?.legend?.display !== false && (
                <>
                    {/* Legend Type */}
                    <div className="space-y-1">
                        <Label className="text-xs font-medium">Legend Type</Label>
                        <Select
                            value={(chartConfig.plugins as any)?.legendType || "dataset"}
                            onValueChange={(value) => handleConfigUpdate("plugins.legendType", value)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Legend Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="slice">Slice Only</SelectItem>
                                <SelectItem value="dataset">Datasets Only</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-medium">Position</Label>
                            <Select
                                value={(chartConfig.plugins?.legend as any)?.position || "top"}
                                onValueChange={(value) => handleConfigUpdate("plugins.legend.position", value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Top" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="top">Top</SelectItem>
                                    <SelectItem value="bottom">Bottom</SelectItem>
                                    <SelectItem value="left">Left</SelectItem>
                                    <SelectItem value="right">Right</SelectItem>
                                    <SelectItem value="chartArea">Chart Area</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Alignment</Label>
                            <Select
                                value={((chartConfig.plugins?.legend as any)?.align as string) || "center"}
                                onValueChange={(value: string) => handleConfigUpdate("plugins.legend.align", value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Center" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="start">Start</SelectItem>
                                    <SelectItem value="center">Center</SelectItem>
                                    <SelectItem value="end">End</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-medium">Orientation</Label>
                            <Select
                                value={((chartConfig.plugins?.legend as any)?.orientation as string) || "horizontal"}
                                onValueChange={(value: string) => handleConfigUpdate("plugins.legend.orientation", value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Horizontal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="horizontal">Horizontal</SelectItem>
                                    <SelectItem value="vertical">Vertical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Font Size</Label>
                            <Input
                                type="number"
                                value={((chartConfig.plugins?.legend?.labels as any)?.font?.size as number) || 12}
                                onChange={(e) => {
                                    const value = Number(e.target.value) || 12;
                                    handleConfigUpdate("plugins.legend.labels.font.size", value);
                                }}
                                min={8}
                                max={48}
                                step={1}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-center">
                        <div>
                            <Label className="text-xs font-medium">Use Point Style</Label>
                            <div className="flex items-center gap-3 mt-1">
                                <Switch
                                    checked={!!(chartConfig.plugins?.legend?.labels as any)?.usePointStyle}
                                    onCheckedChange={(checked: boolean) => {
                                        const updates: ConfigPathUpdate[] = [
                                            { path: "plugins.legend.labels.usePointStyle", value: checked },
                                        ];
                                        const hasPointStyle = !!(chartConfig.plugins?.legend?.labels as any)?.pointStyle;
                                        if (checked && !hasPointStyle) {
                                            updates.push({ path: "plugins.legend.labels.pointStyle", value: "rect" });
                                        }
                                        applyConfigUpdates(updates);
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Point Style</Label>
                            <Select
                                value={((chartConfig.plugins?.legend?.labels as any)?.pointStyle as string) || "rect"}
                                onValueChange={(value: string) => handleConfigUpdate("plugins.legend.labels.pointStyle", value)}
                                disabled={!(chartConfig.plugins?.legend?.labels as any)?.usePointStyle}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Rectangle" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="rect">Rectangle</SelectItem>
                                    <SelectItem value="circle">Circle</SelectItem>
                                    <SelectItem value="cross">Cross</SelectItem>
                                    <SelectItem value="star">Star</SelectItem>
                                    <SelectItem value="triangle">Triangle</SelectItem>
                                    <SelectItem value="dash">Dash</SelectItem>
                                    <SelectItem value="line">Line</SelectItem>
                                    <SelectItem value="rectRounded">Rectangle Rounded</SelectItem>
                                    <SelectItem value="rectRot">Diamond</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-medium">Font Color</Label>
                        <div className="flex gap-2 text-xs">
                            <input
                                type="color"
                                value={(chartConfig.plugins?.legend?.labels as any)?.color || "#000000"}
                                onChange={(e) => handleConfigUpdate("plugins.legend.labels.color", e.target.value)}
                                className="w-12 h-8 rounded border"
                            />
                            <Input
                                value={(chartConfig.plugins?.legend?.labels as any)?.color || "#000000"}
                                onChange={(e) => handleConfigUpdate("plugins.legend.labels.color", e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-medium">Font Family</Label>
                            <Select
                                value={((chartConfig.plugins?.legend?.labels as any)?.font?.family as string) || "Arial"}
                                onValueChange={(value: string) => handleConfigUpdate("plugins.legend.labels.font.family", value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Default" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Arial">Arial</SelectItem>
                                    <SelectItem value="Lucida Console">Lucida Console</SelectItem>
                                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                    <SelectItem value="Open Sans">Open Sans</SelectItem>
                                    <SelectItem value="Courier">Courier New</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Font Weight</Label>
                            <Select
                                value={((chartConfig.plugins?.legend?.labels as any)?.font?.weight as string) || "400"}
                                onValueChange={(value: string) => handleConfigUpdate("plugins.legend.labels.font.weight", value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Normal" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="400">Normal</SelectItem>
                                    <SelectItem value="700">Bold</SelectItem>
                                    <SelectItem value="800">Extra Bold</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-medium">Box Width</Label>
                            <Slider
                                value={[((chartConfig.plugins?.legend?.labels as any)?.boxWidth as number) || 40]}
                                onValueChange={([value]: number[]) => handleConfigUpdate("plugins.legend.labels.boxWidth", value)}
                                max={100}
                                min={10}
                                step={1}
                                className="mt-2"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {((chartConfig.plugins?.legend?.labels as any)?.boxWidth as number) || 40}px
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Box Height</Label>
                            <Slider
                                value={[((chartConfig.plugins?.legend?.labels as any)?.boxHeight as number) || 12]}
                                onValueChange={([value]: number[]) => handleConfigUpdate("plugins.legend.labels.boxHeight", value)}
                                max={50}
                                min={5}
                                step={1}
                                className="mt-2"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                                {((chartConfig.plugins?.legend?.labels as any)?.boxHeight as number) || 12}px
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-medium">Padding</Label>
                            <Slider
                                value={[((chartConfig.plugins?.legend?.labels as any)?.padding as number) || 10]}
                                onValueChange={([value]: number[]) => handleConfigUpdate("plugins.legend.labels.padding", value)}
                                max={50}
                                min={0}
                                step={1}
                                className="mt-2"
                            />
                            <div className="text-xs text-gray-500 mt-1">{((chartConfig.plugins?.legend?.labels as any)?.padding as number) || 10}px</div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Max Columns</Label>
                            <Input
                                type="number"
                                value={((chartConfig.plugins?.legend as any)?.maxColumns as number) || 1}
                                onChange={(e) => handleConfigUpdate("plugins.legend.maxColumns", parseInt(e.target.value))}
                                min={1}
                                max={10}
                                className="h-8 text-xs mt-2"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Reverse Order</Label>
                        <Switch
                            checked={!!(chartConfig.plugins?.legend as any)?.reverse}
                            onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.reverse", checked)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-medium">Full Size</Label>
                            <div className="flex items-center mt-1">
                                <Switch
                                    checked={!!(chartConfig.plugins?.legend as any)?.fullSize}
                                    onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.fullSize", checked)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Text Icon Reverse</Label>
                            <div className="flex items-center mt-1">
                                <Switch
                                    checked={!!(chartConfig.plugins?.legend as any)?.rtl}
                                    onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.rtl", checked)}
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs font-medium">Text Direction</Label>
                        <Select
                            value={((chartConfig.plugins?.legend as any)?.textDirection as string) || "ltr"}
                            onValueChange={(value: string) => handleConfigUpdate("plugins.legend.textDirection", value)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="LTR" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ltr">Left to Right</SelectItem>
                                <SelectItem value="rtl">Right to Left</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}

            {chartType === 'pie' && (
                <PiePanel />
            )}
        </div>
    )
}
