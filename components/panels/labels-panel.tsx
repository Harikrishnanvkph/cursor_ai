"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { useChartStore } from "@/lib/chart-store"
import { Info } from "lucide-react"
import { RadarPanel } from "./radar-panel"
import { PiePanel } from "./pie-panel"

type ConfigPathUpdate = {
    path: string;
    value: any;
};

export function LabelsPanel() {
    const { chartConfig, updateChartConfig, chartData, chartType } = useChartStore()

    // Helper to update customLabelsConfig in chartConfig
    const handleCustomLabelConfigUpdate = (path: string, value: any) => {
        const keys = path.split(".")
        const newConfig = { ...chartConfig }
        if (!newConfig.plugins) newConfig.plugins = {}
        if (!newConfig.plugins.customLabelsConfig) newConfig.plugins.customLabelsConfig = {}
        let current = newConfig.plugins.customLabelsConfig
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {}
            current = current[keys[i]]
        }
        current[keys[keys.length - 1]] = value
        updateChartConfig(newConfig)
    }

    // Helper to update general chartConfig (for Legend settings)
    const handleConfigUpdate = (path: string, value: any) => {
        const keys = path.split(".");
        const newConfig = { ...chartConfig };
        let current: any = newConfig;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) current[keys[i]] = {};
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        updateChartConfig(newConfig);
    };

    // Apply multiple config updates at once
    const applyConfigUpdates = (updates: ConfigPathUpdate[]) => {
        const newConfig = { ...chartConfig };
        for (const { path, value } of updates) {
            const keys = path.split(".");
            let current: any = newConfig;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!current[keys[i]]) current[keys[i]] = {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        }
        updateChartConfig(newConfig);
    };

    // Read current custom label config
    const customLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};

    return (
        <div className="space-y-4">
            {/* Top-level Label/Legend tabs */}
            <Tabs defaultValue="label" className="w-full">
                <TabsList className="grid w-full grid-cols-2 text-xs">
                    <TabsTrigger value="label">Label</TabsTrigger>
                    <TabsTrigger value="legend">Legend</TabsTrigger>
                </TabsList>

                {/* ==================== LABEL TAB ==================== */}
                <TabsContent value="label" className="mt-4">
                    <Tabs defaultValue="data-labels" className="w-full">
                        <TabsList className="w-full h-auto p-0 bg-transparent border-b border-gray-200 rounded-none justify-start gap-4">
                            <TabsTrigger
                                value="data-labels"
                                className="text-xs px-1 pb-2 pt-0 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                            >
                                Data
                            </TabsTrigger>
                            <TabsTrigger
                                value="custom"
                                className="text-xs px-1 pb-2 pt-0 rounded-none bg-transparent border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                            >
                                Custom
                            </TabsTrigger>
                        </TabsList>

                        {/* ==================== DATA LABELS TAB ==================== */}
                        <TabsContent value="data-labels" className="space-y-4 mt-4">

                            {/* Show Data Labels Toggle */}
                            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <Label className="text-sm font-medium text-blue-900">Show Data Labels</Label>
                                <Switch
                                    checked={customLabelsConfig.display !== false}
                                    onCheckedChange={(checked) => handleCustomLabelConfigUpdate("display", checked)}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>

                            {/* Content and Position */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Content</Label>
                                    <Select
                                        value={customLabelsConfig.labelContent || "value"}
                                        onValueChange={(value) => handleCustomLabelConfigUpdate("labelContent", value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="value">Value</SelectItem>
                                            <SelectItem value="label">Label</SelectItem>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="index">Index</SelectItem>
                                            <SelectItem value="dataset">Dataset</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Position</Label>
                                    <Select
                                        value={customLabelsConfig.anchor || "center"}
                                        onValueChange={(value) => handleCustomLabelConfigUpdate("anchor", value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="top">Top</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="bottom">Bottom</SelectItem>
                                            <SelectItem value="callout">Callout</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Callout Arrow Options - Only show when callout is selected */}
                            {customLabelsConfig.anchor === 'callout' && (
                                <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 space-y-3">
                                    <p className="text-xs font-semibold text-orange-800">Callout Arrow Settings</p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium">Arrow Line</Label>
                                            <Switch
                                                checked={customLabelsConfig.arrowLine !== false}
                                                onCheckedChange={(checked) => handleCustomLabelConfigUpdate("arrowLine", checked)}
                                                className="data-[state=checked]:bg-orange-600"
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-medium">Arrow Head</Label>
                                            <Switch
                                                checked={customLabelsConfig.arrowHead !== false}
                                                onCheckedChange={(checked) => handleCustomLabelConfigUpdate("arrowHead", checked)}
                                                className="data-[state=checked]:bg-orange-600"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">End Gap</Label>
                                            <Input
                                                type="number"
                                                value={customLabelsConfig.arrowEndGap ?? ''}
                                                onChange={(e) => handleCustomLabelConfigUpdate("arrowEndGap", e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="8"
                                                className="h-8 text-xs"
                                                min={0}
                                                max={30}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Arrow Color</Label>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: customLabelsConfig.arrowColor || '#333333' }}
                                                    onClick={() => document.getElementById('arrow-color')?.click()}
                                                />
                                                <input
                                                    id="arrow-color"
                                                    type="color"
                                                    value={customLabelsConfig.arrowColor || '#333333'}
                                                    onChange={(e) => handleCustomLabelConfigUpdate("arrowColor", e.target.value)}
                                                    className="sr-only"
                                                />
                                                <Input
                                                    value={customLabelsConfig.arrowColor || '#333333'}
                                                    onChange={(e) => handleCustomLabelConfigUpdate("arrowColor", e.target.value)}
                                                    className="w-20 h-8 text-xs font-mono uppercase"
                                                    placeholder="#333"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-orange-700">🎯 You can drag labels in the chart to reposition!</p>
                                </div>
                            )}


                            {/* Shape and Font Family */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Shape</Label>
                                    <Select
                                        value={customLabelsConfig.shape || 'none'}
                                        onValueChange={(value) => handleCustomLabelConfigUpdate("shape", value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="rectangle">Rectangle</SelectItem>
                                            <SelectItem value="circle">Circle</SelectItem>
                                            <SelectItem value="star">Star</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Font Family</Label>
                                    <Select
                                        value={customLabelsConfig.fontFamily || "Arial"}
                                        onValueChange={(value) => handleCustomLabelConfigUpdate("fontFamily", value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Arial">Arial</SelectItem>
                                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                                            <SelectItem value="Times">Times</SelectItem>
                                            <SelectItem value="Courier">Courier</SelectItem>
                                            <SelectItem value="Georgia">Georgia</SelectItem>
                                            <SelectItem value="Verdana">Verdana</SelectItem>
                                            <SelectItem value="Impact">Impact</SelectItem>
                                            <SelectItem value="Trebuchet MS">Trebuchet</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Font Size and Weight */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Font Size</Label>
                                    <Input
                                        type="number"
                                        value={customLabelsConfig.fontSize || ''}
                                        onChange={(e) => handleCustomLabelConfigUpdate("fontSize", e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="14"
                                        className="h-8 text-xs"
                                        min={8}
                                        max={24}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Weight</Label>
                                    <Select
                                        value={customLabelsConfig.fontWeight || "bold"}
                                        onValueChange={(value) => handleCustomLabelConfigUpdate("fontWeight", value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="normal">Normal</SelectItem>
                                            <SelectItem value="bold">Bold</SelectItem>
                                            <SelectItem value="lighter">Lighter</SelectItem>
                                            <SelectItem value="bolder">Bolder</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Label Color */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Color</Label>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                            style={{ backgroundColor: customLabelsConfig.color || '#000000' }}
                                            onClick={() => document.getElementById('label-color')?.click()}
                                        />
                                        <input
                                            id="label-color"
                                            type="color"
                                            value={customLabelsConfig.color || '#000000'}
                                            onChange={(e) => handleCustomLabelConfigUpdate("color", e.target.value)}
                                            className="sr-only"
                                        />
                                        <Input
                                            value={customLabelsConfig.color || '#000000'}
                                            onChange={(e) => handleCustomLabelConfigUpdate("color", e.target.value)}
                                            className="w-24 h-8 text-xs font-mono uppercase"
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Background and Border Colors (only when shape is not none) */}
                            {customLabelsConfig.shape !== 'none' && (
                                <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Background</Label>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: customLabelsConfig.backgroundColor || '#ffffff' }}
                                                    onClick={() => document.getElementById('label-bg-color')?.click()}
                                                />
                                                <input
                                                    id="label-bg-color"
                                                    type="color"
                                                    value={customLabelsConfig.backgroundColor || '#ffffff'}
                                                    onChange={(e) => handleCustomLabelConfigUpdate("backgroundColor", e.target.value)}
                                                    className="sr-only"
                                                />
                                                <Input
                                                    value={customLabelsConfig.backgroundColor || '#ffffff'}
                                                    onChange={(e) => handleCustomLabelConfigUpdate("backgroundColor", e.target.value)}
                                                    className="w-20 h-8 text-xs font-mono uppercase"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Border</Label>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                                                    style={{ backgroundColor: customLabelsConfig.borderColor || '#000000' }}
                                                    onClick={() => document.getElementById('label-border-color')?.click()}
                                                />
                                                <input
                                                    id="label-border-color"
                                                    type="color"
                                                    value={customLabelsConfig.borderColor || '#000000'}
                                                    onChange={(e) => handleCustomLabelConfigUpdate("borderColor", e.target.value)}
                                                    className="sr-only"
                                                />
                                                <Input
                                                    value={customLabelsConfig.borderColor || '#000000'}
                                                    onChange={(e) => handleCustomLabelConfigUpdate("borderColor", e.target.value)}
                                                    className="w-20 h-8 text-xs font-mono uppercase"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Border Width, Radius, Padding */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Border W.</Label>
                                            <Input
                                                type="number"
                                                value={customLabelsConfig.borderWidth || ''}
                                                onChange={(e) => handleCustomLabelConfigUpdate("borderWidth", e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="2"
                                                className="h-8 text-xs"
                                                min={0}
                                                max={8}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Radius</Label>
                                            <Input
                                                type="number"
                                                value={customLabelsConfig.borderRadius || ''}
                                                onChange={(e) => handleCustomLabelConfigUpdate("borderRadius", e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="6"
                                                className="h-8 text-xs"
                                                min={0}
                                                max={20}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium">Padding</Label>
                                            <Input
                                                type="number"
                                                value={customLabelsConfig.padding || ''}
                                                onChange={(e) => handleCustomLabelConfigUpdate("padding", e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="6"
                                                className="h-8 text-xs"
                                                min={0}
                                                max={20}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        {/* ==================== CUSTOM TAB ==================== */}
                        <TabsContent value="custom" className="space-y-4 mt-4">

                            {/* Prefix & Suffix */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Prefix</Label>
                                    <Input
                                        value={customLabelsConfig.prefix || ""}
                                        onChange={(e) => handleCustomLabelConfigUpdate("prefix", e.target.value)}
                                        placeholder="$, #, @"
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Suffix</Label>
                                    <Input
                                        value={customLabelsConfig.suffix || ""}
                                        onChange={(e) => handleCustomLabelConfigUpdate("suffix", e.target.value)}
                                        placeholder="%, °C, K"
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Separators */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Thousands Sep.</Label>
                                    <Input
                                        value={customLabelsConfig.thousandsSeparator || ","}
                                        onChange={(e) => handleCustomLabelConfigUpdate("thousandsSeparator", e.target.value)}
                                        placeholder=","
                                        className="h-8 text-xs"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Decimal Sep.</Label>
                                    <Input
                                        value={customLabelsConfig.decimalSeparator || "."}
                                        onChange={(e) => handleCustomLabelConfigUpdate("decimalSeparator", e.target.value)}
                                        placeholder="."
                                        className="h-8 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Decimals and Format */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Decimal Places</Label>
                                    <Select
                                        value={String(customLabelsConfig.decimals ?? 0)}
                                        onValueChange={(value) => handleCustomLabelConfigUpdate("decimals", parseInt(value))}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="0" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="0">0</SelectItem>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="4">4</SelectItem>
                                            <SelectItem value="5">5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium">Number Format</Label>
                                    <Select
                                        value={customLabelsConfig.numberFormat || "default"}
                                        onValueChange={(value) => handleCustomLabelConfigUpdate("numberFormat", value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="default">Default</SelectItem>
                                            <SelectItem value="currency">Currency</SelectItem>
                                            <SelectItem value="percent">Percent</SelectItem>
                                            <SelectItem value="scientific">Scientific</SelectItem>
                                            <SelectItem value="compact">Compact</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Currency Symbol */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <Label className="text-xs font-medium">Currency Symbol</Label>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={200}>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="text-xs">
                                                Set <strong>Number Format</strong> to <strong>Currency</strong> for this to work
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Select
                                    value={customLabelsConfig.currencySymbol || "$"}
                                    onValueChange={(value) => handleCustomLabelConfigUpdate("currencySymbol", value)}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="$">$ (USD)</SelectItem>
                                        <SelectItem value="€">€ (EUR)</SelectItem>
                                        <SelectItem value="£">£ (GBP)</SelectItem>
                                        <SelectItem value="¥">¥ (JPY)</SelectItem>
                                        <SelectItem value="₹">₹ (INR)</SelectItem>
                                        <SelectItem value="₽">₽ (RUB)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Toggles Row 1 */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Abbreviate Large</Label>
                                    <Switch
                                        checked={customLabelsConfig.abbreviateLargeNumbers || false}
                                        onCheckedChange={(checked) => handleCustomLabelConfigUpdate("abbreviateLargeNumbers", checked)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium">Plus Sign</Label>
                                    <Switch
                                        checked={customLabelsConfig.showPlusSign || false}
                                        onCheckedChange={(checked) => handleCustomLabelConfigUpdate("showPlusSign", checked)}
                                    />
                                </div>
                            </div>

                            {/* Custom Formatter */}
                            <div className="space-y-1">
                                <Label className="text-xs font-medium">Custom Formatter</Label>
                                <Textarea
                                    value={customLabelsConfig.customFormatter || ""}
                                    onChange={(e) => handleCustomLabelConfigUpdate("customFormatter", e.target.value)}
                                    placeholder="function(value) { return value + ' units'; }"
                                    className="h-16 text-xs font-mono"
                                />
                            </div>

                            {/* Conditional Formatting */}
                            <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                    <Label className="text-xs font-medium">Conditional Format</Label>
                                    <TooltipProvider>
                                        <Tooltip delayDuration={200}>
                                            <TooltipTrigger asChild>
                                                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs text-xs">
                                                <p className="font-semibold mb-1">Conditional Formatting Features:</p>
                                                <ul className="list-disc pl-3 space-y-0.5">
                                                    <li><code>text</code> - Change label text</li>
                                                    <li><code>color</code> - Change text color</li>
                                                    <li><code>fontSize</code> - Dynamic font size (number)</li>
                                                    <li><code>fontWeight</code> - Bold/normal</li>
                                                    <li><code>backgroundColor</code> - Label background</li>
                                                    <li><code>borderColor</code> - Label border</li>
                                                </ul>
                                                <p className="mt-1 text-muted-foreground">Example:</p>
                                                <code className="block text-[10px] mt-0.5">if (value {'>'} 100) return {'{'} text: 'High', color: '#22c55e', fontSize: 16 {'}'}</code>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <Textarea
                                    value={customLabelsConfig.conditionalFormatting || ""}
                                    onChange={(e) => handleCustomLabelConfigUpdate("conditionalFormatting", e.target.value)}
                                    placeholder="if (value > 100) return { text: 'High', color: '#22c55e' };"
                                    className="h-16 text-xs font-mono"
                                />
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                {/* ==================== LEGEND TAB ==================== */}
                <TabsContent value="legend" className="space-y-4 mt-4">
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
                                    value={chartConfig.plugins?.legendType || "dataset"}
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
                                        value={chartConfig.plugins?.legend?.position || "top"}
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
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={chartConfig.plugins?.legend?.labels?.color || "#000000"}
                                        onChange={(e) => handleConfigUpdate("plugins.legend.labels.color", e.target.value)}
                                        className="w-12 h-8 rounded border"
                                    />
                                    <Input
                                        value={chartConfig.plugins?.legend?.labels?.color || "#000000"}
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

                    {/* Specialized panels for specific chart types */}
                    {chartType === 'radar' && (
                        <RadarPanel />
                    )}

                    {chartType === 'pie' && (
                        <PiePanel />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
