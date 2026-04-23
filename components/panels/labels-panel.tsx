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
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { Info } from "lucide-react"
import { PiePanel } from "./pie-panel"
import { PolarAreaPanel } from "./polar-area-panel"
import { setNestedProperty } from "@/lib/utils"
import { useGroupedSettingsTarget, GroupedSettingsFilter } from "./grouped-settings-filter"
import { SliceSettingsFilter } from "./slice-settings-filter"
import { StylingTab } from "./design-settings/styling-tab"
import { useUIStore } from "@/lib/stores/ui-store"

type ConfigPathUpdate = {
    path: string;
    value: any;
};

export function LabelsPanel() {
    const { chartConfig, chartData, chartMode, chartType } = useChartStore()
    const { updateChartConfig, updateDataset } = useChartActions()
    const { targetIndices, isAllDatasets } = useGroupedSettingsTarget()

    const isGroupedMode = chartMode === 'grouped';
    const isSingleMode = chartMode === 'single';
    const applyToAll = isAllDatasets;

    // Slice-level targeting (single mode only)
    const { settingsSliceIndex } = useUIStore()
    const isSliceMode = isSingleMode && settingsSliceIndex !== null
    const activeDatasetIndex = useChartStore(s => s.activeDatasetIndex)

    // Helper to update customLabelsConfig in chartConfig
    const handleCustomLabelConfigUpdate = (path: string, value: any) => {
        if (isSliceMode) {
            // Per-slice override: store only the changed property in sliceLabelOverrides
            const dsIndex = targetIndices[0] ?? activeDatasetIndex
            const ds = chartData.datasets[dsIndex]
            if (!ds) return
            const overrides = { ...((ds as any).sliceLabelOverrides || {}) }
            const sliceOverride = { ...(overrides[settingsSliceIndex] || {}) }
            sliceOverride[path] = value
            overrides[settingsSliceIndex] = sliceOverride
            updateDataset(dsIndex, { sliceLabelOverrides: overrides })
        } else if (!applyToAll) {
            targetIndices.forEach((index: number) => {
                const ds = chartData.datasets[index];
                if (!ds) return;
                const currentConfig = (ds as any).customLabelsConfig || {};
                const newConfig = setNestedProperty({ ...currentConfig }, path, value);
                updateDataset(index, { customLabelsConfig: newConfig });
            });
        } else {
            const fullPath = `plugins.customLabelsConfig.${path}`;
            const newConfig = setNestedProperty(chartConfig, fullPath, value);
            updateChartConfig(newConfig);
            
            // Clear individual dataset overrides for this property when updating globally
            chartData.datasets.forEach((ds: any, index: number) => {
                if (ds && ds.customLabelsConfig && ds.customLabelsConfig[path] !== undefined) {
                    const clonedConfig = { ...ds.customLabelsConfig };
                    delete clonedConfig[path];
                    updateDataset(index, { customLabelsConfig: clonedConfig });
                }
            });

            // Also clear this specific property from all sliceLabelOverrides
            chartData.datasets.forEach((ds: any, index: number) => {
                if (ds && ds.sliceLabelOverrides) {
                    const overrides = { ...ds.sliceLabelOverrides }
                    let changed = false
                    for (const sliceIdx of Object.keys(overrides)) {
                        if (overrides[sliceIdx] && overrides[sliceIdx][path] !== undefined) {
                            overrides[sliceIdx] = { ...overrides[sliceIdx] }
                            delete overrides[sliceIdx][path]
                            // Clean up empty overrides
                            if (Object.keys(overrides[sliceIdx]).length === 0) {
                                delete overrides[sliceIdx]
                            }
                            changed = true
                        }
                    }
                    if (changed) {
                        updateDataset(index, { sliceLabelOverrides: Object.keys(overrides).length > 0 ? overrides : undefined })
                    }
                }
            });
        }
    }

    // Helper to update general chartConfig (for Legend settings)
    const handleConfigUpdate = (path: string, value: any) => {
        const newConfig = setNestedProperty(chartConfig, path, value);
        updateChartConfig(newConfig);
    };

    const handleUpdateDataset = (datasetIndex: number, property: string, value: any) => {
        updateDataset(datasetIndex, { [property]: value })
    }

    // Apply multiple config updates at once
    const applyConfigUpdates = (updates: ConfigPathUpdate[]) => {
        let newConfig = { ...chartConfig };
        for (const { path, value } of updates) {
            newConfig = setNestedProperty(newConfig, path, value);
        }
        updateChartConfig(newConfig);
    };

    // Read current custom label config
    let customLabelsConfig = ((chartConfig.plugins as any)?.customLabelsConfig) || {};
    
    // Override with dataset specific config if targeting a specific dataset
    if (!applyToAll) {
        if (targetIndices.length > 0) {
            const ds = chartData.datasets[targetIndices[0]];
            if (ds && (ds as any).customLabelsConfig) {
                // Merge to ensure missing properties fallback to global
                customLabelsConfig = { ...customLabelsConfig, ...(ds as any).customLabelsConfig };
            }
        }
    }

    // Override with per-slice config if a specific slice is selected
    if (isSliceMode) {
        const dsIndex = targetIndices[0] ?? activeDatasetIndex
        const ds = chartData.datasets[dsIndex]
        if (ds) {
            // First merge dataset-level overrides
            if ((ds as any).customLabelsConfig) {
                customLabelsConfig = { ...customLabelsConfig, ...(ds as any).customLabelsConfig };
            }
            // Then merge slice-level overrides (highest priority)
            const sliceOverride = (ds as any).sliceLabelOverrides?.[settingsSliceIndex]
            if (sliceOverride) {
                customLabelsConfig = { ...customLabelsConfig, ...sliceOverride }
            }
        }
    }

    return (
        <div className="space-y-4">
            {/* Slice Filter for single mode */}
            {isSingleMode && <SliceSettingsFilter />}

            {/* Top-level Label/Styling tabs */}
            <Tabs defaultValue="styling" className="w-full">
                <TabsList className="grid w-full grid-cols-2 text-xs">
                    <TabsTrigger value="styling">Styling</TabsTrigger>
                    <TabsTrigger value="label">Label</TabsTrigger>
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
                                    onCheckedChange={(checked) => {
                                        if (isGroupedMode && !applyToAll) {
                                            handleCustomLabelConfigUpdate("display", checked);
                                        } else {
                                            applyConfigUpdates([
                                                { path: "plugins.datalabels.display", value: checked },
                                                { path: "plugins.customLabelsConfig.display", value: checked }
                                            ]);
                                        }
                                    }}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                            </div>

                            {/* Position and Content */}
                            <div className="grid grid-cols-2 gap-3">
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

                {/* ==================== STYLING TAB ==================== */}
                <TabsContent value="styling" className="mt-4">
                    <StylingTab
                        chartData={chartData}
                        chartConfig={chartConfig}
                        chartType={chartType as any}
                        handleUpdateDataset={handleUpdateDataset}
                        handleConfigUpdate={handleConfigUpdate}
                    />
                </TabsContent>
            </Tabs>

            {/* Specialized panels for specific chart types */}
            {(chartType === 'pie' || chartType === 'doughnut') && (
                <PiePanel />
            )}
            {chartType === 'polarArea' && (
                <PolarAreaPanel />
            )}
        </div>
    )
}
