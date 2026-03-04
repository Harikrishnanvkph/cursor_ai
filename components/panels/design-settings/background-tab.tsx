import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Layers, Info, Upload } from "lucide-react"

interface BackgroundTabProps {
    chartConfig: any
    handleConfigUpdate: (path: string, value: any) => void
}

export function BackgroundTab({ chartConfig, handleConfigUpdate }: BackgroundTabProps) {
    return (
        <div className="space-y-3 mt-4">
            {/* Background Settings */}
            <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <Layers className="h-4 w-4 text-blue-900" />
                    <h3 className="text-sm font-semibold text-blue-900 flex-1">Background Settings</h3>
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-blue-400 cursor-help hover:text-blue-600 transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-xs bg-slate-900 text-slate-50 border-slate-800">
                                <p>Customize your chart background with solid colors, gradients, or images. Adjust opacity and blur for visual depth.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs font-medium">Background Type</Label>
                        <Select
                            value={(chartConfig as any)?.background?.type || "color"}
                            onValueChange={(value) => handleConfigUpdate("background.type", value)}
                        >
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue placeholder="Select background type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="color">Color</SelectItem>
                                <SelectItem value="gradient">Gradient</SelectItem>
                                <SelectItem value="image">Image</SelectItem>
                                <SelectItem value="transparent">Transparent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Color background control */}
                    {((chartConfig as any)?.background?.type === undefined || (chartConfig as any)?.background?.type === "color") && (
                        <div>
                            <Label className="text-xs font-medium">Background Color</Label>
                            <div className="flex items-center gap-2 h-8">
                                <div
                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: ((chartConfig as any)?.background?.color as string) || "#ffffff" }}
                                    onClick={() => {
                                        const input = document.getElementById('bg-color-picker');
                                        if (input) input.click();
                                    }}
                                />
                                <input
                                    id="bg-color-picker"
                                    type="color"
                                    value={((chartConfig as any)?.background?.color as string) || "#ffffff"}
                                    onChange={(e) => handleConfigUpdate("background.color", e.target.value)}
                                    className="absolute opacity-0 w-0 h-0"
                                />
                                <Input
                                    value={((chartConfig as any)?.background?.color as string) || "#ffffff"}
                                    onChange={(e) => handleConfigUpdate("background.color", e.target.value)}
                                    className="h-8 text-xs flex-1"
                                />
                            </div>
                        </div>
                    )}

                    {/* Upload Image Button (visible when type is image) */}
                    {(chartConfig as any)?.background?.type === "image" && (
                        <div className="flex flex-col justify-end">
                            <Label className="text-xs font-medium mb-1.5 opacity-0 select-none">Upload</Label>
                            <Button
                                variant="outline"
                                className="h-8 text-xs w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-800 flex items-center justify-center gap-2"
                                onClick={() => {
                                    const input = document.getElementById('bg-image-upload');
                                    if (input) input.click();
                                }}
                            >
                                <Upload className="h-3.5 w-3.5" />
                                Upload Image
                            </Button>
                            <input
                                id="bg-image-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onload = (event) => {
                                            handleConfigUpdate("background.imageUrl", event.target?.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Gradient background */}
                {(chartConfig as any)?.background?.type === "gradient" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs font-medium">Gradient Type</Label>
                            <Select
                                value={((chartConfig as any)?.background?.gradientType as string) || "linear"}
                                onValueChange={(value) => handleConfigUpdate("background.gradientType", value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="Linear" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="linear">Linear</SelectItem>
                                    <SelectItem value="radial">Radial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Gradient Direction</Label>
                            <Select
                                value={((chartConfig as any)?.background?.gradientDirection as string) || "to right"}
                                onValueChange={(value) => handleConfigUpdate("background.gradientDirection", value)}
                                disabled={((chartConfig as any)?.background?.gradientType as string) === "radial"}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="to right" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="to right">Left → Right</SelectItem>
                                    <SelectItem value="to left">Right → Left</SelectItem>
                                    <SelectItem value="to bottom">Top → Bottom</SelectItem>
                                    <SelectItem value="to top">Bottom → Top</SelectItem>
                                    <SelectItem value="135deg">Diagonal (135°)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs font-medium">Gradient Colors</Label>
                            <div className="flex gap-4 mt-1">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: ((chartConfig as any)?.background?.gradientColor1 as string) || "#ffffff" }}
                                        onClick={() => {
                                            const input = document.getElementById('grad-color-1-picker');
                                            if (input) input.click();
                                        }}
                                    />
                                    <input
                                        id="grad-color-1-picker"
                                        type="color"
                                        value={((chartConfig as any)?.background?.gradientColor1 as string) || "#ffffff"}
                                        onChange={(e) => handleConfigUpdate("background.gradientColor1", e.target.value)}
                                        className="absolute opacity-0 w-0 h-0"
                                    />
                                    <span className="text-xs text-gray-500">Color 1</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                        style={{ backgroundColor: ((chartConfig as any)?.background?.gradientColor2 as string) || "#000000" }}
                                        onClick={() => {
                                            const input = document.getElementById('grad-color-2-picker');
                                            if (input) input.click();
                                        }}
                                    />
                                    <input
                                        id="grad-color-2-picker"
                                        type="color"
                                        value={((chartConfig as any)?.background?.gradientColor2 as string) || "#000000"}
                                        onChange={(e) => handleConfigUpdate("background.gradientColor2", e.target.value)}
                                        className="absolute opacity-0 w-0 h-0"
                                    />
                                    <span className="text-xs text-gray-500">Color 2</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs font-medium">Background Opacity</Label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[((chartConfig as any)?.background?.opacity as number) || 100]}
                                    onValueChange={([value]) => handleConfigUpdate("background.opacity", value)}
                                    max={100}
                                    min={0}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="text-xs w-8 text-right text-gray-500">{((chartConfig as any)?.background?.opacity as number) || 100}%</span>
                            </div>
                        </div>
                    </div>
                )}

                {(chartConfig as any)?.background?.type === "image" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <Label className="text-xs font-medium">Image URL</Label>
                            <Input
                                type="text"
                                placeholder="Enter image URL"
                                value={((chartConfig as any)?.background?.imageUrl as string) || ""}
                                onChange={(e) => handleConfigUpdate("background.imageUrl", e.target.value)}
                                className="h-8 text-xs"
                            />
                        </div>
                        <div className="col-span-2 flex items-center justify-between">
                            <Label className="text-xs font-medium">White background under image</Label>
                            <Switch
                                checked={((chartConfig as any)?.background?.imageWhiteBase ?? true)}
                                onCheckedChange={(checked) => handleConfigUpdate("background.imageWhiteBase", checked)}
                                className="data-[state=checked]:bg-blue-600"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Image Fit</Label>
                            <Select
                                value={((chartConfig as any)?.background?.imageFit as string) || "cover"}
                                onValueChange={(value) => handleConfigUpdate("background.imageFit", value)}
                            >
                                <SelectTrigger className="h-8 text-xs">
                                    <SelectValue placeholder="cover" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cover">Cover (crop)</SelectItem>
                                    <SelectItem value="contain">Contain (fit inside)</SelectItem>
                                    <SelectItem value="fill">Fill (stretch)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-medium">Image Opacity</Label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[((chartConfig as any)?.background?.opacity as number) || 100]}
                                    onValueChange={([value]) => handleConfigUpdate("background.opacity", value)}
                                    max={100}
                                    min={0}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="text-xs w-8 text-right text-gray-500">{((chartConfig as any)?.background?.opacity as number) || 100}%</span>
                            </div>
                        </div>
                        <div className="col-span-2">
                            <Label className="text-xs font-medium">Blur Image</Label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[((chartConfig as any)?.background?.blur as number) || 0]}
                                    onValueChange={([value]) => handleConfigUpdate("background.blur", value)}
                                    max={20}
                                    min={0}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="text-xs w-8 text-right text-gray-500">{((chartConfig as any)?.background?.blur as number) || 0}px</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Chart Border */}
            <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                        <svg className="h-4 w-4 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                        </svg>
                        <h3 className="text-sm font-semibold text-blue-900">Chart Border</h3>
                    </div>
                    <Switch
                        checked={!!chartConfig.borderWidth && chartConfig.borderWidth > 0}
                        onCheckedChange={(checked) => handleConfigUpdate('borderWidth', checked ? 2 : 0)}
                        className="data-[state=checked]:bg-blue-600"
                    />
                </div>

                {!!chartConfig.borderWidth && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                            <Label className="text-xs font-medium">Border Color</Label>
                            <div className="flex items-center gap-2 h-8">
                                <div
                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                    style={{ backgroundColor: chartConfig.borderColor || "#000000" }}
                                    onClick={() => {
                                        const input = document.getElementById('border-color-picker');
                                        if (input) input.click();
                                    }}
                                />
                                <input
                                    id="border-color-picker"
                                    type="color"
                                    value={chartConfig.borderColor || "#000000"}
                                    onChange={(e) => handleConfigUpdate("borderColor", e.target.value)}
                                    className="absolute opacity-0 w-0 h-0"
                                />
                                <Input
                                    value={chartConfig.borderColor || "#000000"}
                                    onChange={(e) => handleConfigUpdate("borderColor", e.target.value)}
                                    className="h-8 text-xs flex-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Border Width</Label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[chartConfig.borderWidth || 0]}
                                    onValueChange={([value]) => handleConfigUpdate("borderWidth", value)}
                                    max={20}
                                    min={0}
                                    step={1}
                                    className="mt-2 flex-1"
                                />
                                <span className="text-xs w-8 text-right text-gray-500 mt-2">{chartConfig.borderWidth || 0}px</span>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-medium">Border Radius</Label>
                            <div className="flex items-center gap-2">
                                <Slider
                                    value={[chartConfig.chartBorderRadius || 0]}
                                    onValueChange={([value]) => handleConfigUpdate("chartBorderRadius", value)}
                                    max={50}
                                    min={0}
                                    step={1}
                                    className="mt-2 flex-1"
                                />
                                <span className="text-xs w-8 text-right text-gray-500 mt-2">{chartConfig.chartBorderRadius || 0}px</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
