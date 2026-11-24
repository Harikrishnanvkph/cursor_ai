import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useChartData } from "@/lib/hooks/use-chart-state"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { PaddingControl } from "@/components/ui/padding-control"
import { NumberFormattingSection } from "../number-formatting-section"
import {
    FontSettingSection,
    mapChartJsFontValue,
    applyChartJsFontPatch,
} from "@/components/ui/font-setting-section"
import { useIsModernPanel, MODERN_PANEL_UI } from "@/components/editor/modern-panel-context"

interface GeneralTabProps {
    axis: 'x' | 'y' | 'y1'
    config: any
    chartType?: string
    updateConfig: (path: string, value: any) => void
    updateNestedConfig: (basePath: string, path: string, value: any) => void
}

export function GeneralTab({ axis, config, chartType, updateConfig, updateNestedConfig }: GeneralTabProps) {
    const isModern = useIsModernPanel()
    const [titleDropdownOpen, setTitleDropdownOpen] = useState(false)
    const [labelAppearanceDropdownOpen, setLabelAppearanceDropdownOpen] = useState(false)
    const [gridAppearanceDropdownOpen, setGridAppearanceDropdownOpen] = useState(false)
    const titleInputRef = useRef<HTMLInputElement>(null)
    const hasHealedY1PosRef = useRef(false)

    // Ensure Right Y-Axis (Y2) defaults to 'right' position
    useEffect(() => {
        if (!hasHealedY1PosRef.current && axis === 'y1') {
            if (!config?.position || config?.position === 'left') {
                updateConfig('position', 'right');
            }
            hasHealedY1PosRef.current = true;
        }
    }, [axis, config?.position, updateConfig]);

    const chartData = useChartData()
    const { updateDataset } = useChartActions()
    const datasets = chartData?.datasets || []
    const y1Datasets = datasets.filter((ds: any) => ds?.yAxisID === 'y1' && !ds.hidden)
    const canEnableY1 = datasets.length >= 2
    const isY1AxisActive = canEnableY1 && y1Datasets.length > 0 && config?.display !== false

    // Auto-heal single-dataset charts: A single dataset must always plot on the primary Left Y-Axis
    useEffect(() => {
        if (datasets.length < 2) {
            datasets.forEach((ds: any, idx: number) => {
                if (ds?.yAxisID === 'y1') {
                    updateDataset(idx, { yAxisID: 'y' });
                }
            });
        }
    }, [datasets.length]);

    const lineDashOptions = [
        { label: 'Solid', value: '[]' },
        { label: 'Dashed', value: '[5,5]' },
        { label: 'Dotted', value: '[2,2]' },
        { label: 'Dash-Dot', value: '[5,2,2,2]' },
    ]

    const currentDash = config?.grid?.borderDash || config?.border?.dash || []
    const currentDashStr = JSON.stringify(currentDash)
    const currentDashLabel = lineDashOptions.find(opt => opt.value === currentDashStr)?.label || 'Custom'

    return (
        <div className="space-y-3">
            {/* Main Toggle */}
            <div
                className={
                    isModern
                        ? MODERN_PANEL_UI.sectionBanner
                        : "flex items-center justify-between p-3.5 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 shadow-2xs"
                }
            >
                <div className="flex flex-col">
                    <Label className={isModern ? "text-xs font-semibold text-slate-800" : "text-xs font-semibold text-blue-950"}>
                        Show {axis === 'y1' ? 'Right Y-Axis (Y2)' : `${axis.toUpperCase()}-Axis`}
                    </Label>
                    {axis === 'y1' && (
                        <span className={isModern ? "text-[11px] text-slate-500" : "text-[11px] text-blue-600/80"}>
                            {datasets.length < 2
                                ? 'Requires at least 2 datasets'
                                : y1Datasets.length > 0
                                ? `${y1Datasets.length} dataset${y1Datasets.length > 1 ? 's' : ''} mapped`
                                : 'Requires at least 1 dataset assigned below'}
                        </span>
                    )}
                </div>
                <Switch
                    disabled={axis === 'y1' && datasets.length < 2}
                    checked={axis === 'y1' ? isY1AxisActive : config?.display !== false}
                    onCheckedChange={(checked) => {
                        if (axis === 'y1') {
                            if (checked) {
                                if (datasets.length < 2) {
                                    return;
                                }
                                updateConfig('display', true);
                                updateConfig('position', 'right');
                                if (y1Datasets.length === 0 && datasets.length > 1) {
                                    const targetIdx = 1;
                                    updateDataset(targetIdx, { yAxisID: 'y1' });
                                }
                            } else {
                                updateConfig('display', false);
                                // Cleanly unmap all datasets from y1 back to y when disabling Right Y
                                datasets.forEach((ds: any, idx: number) => {
                                    if (ds?.yAxisID === 'y1') {
                                        updateDataset(idx, { yAxisID: 'y' });
                                    }
                                });
                            }
                        } else {
                            updateConfig('display', checked);
                        }
                    }}
                    className="data-[state=checked]:bg-blue-600"
                />
            </div>

            {/* Secondary Axis Datasets Assignment Card (when axis is y1) */}
            {axis === 'y1' && (
                <div className="p-3 bg-white rounded-lg border border-purple-200/80 shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                            <span className="text-xs font-semibold text-gray-800">Secondary Axis Datasets</span>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            {y1Datasets.length} / {datasets.length} mapped to Y2
                        </span>
                    </div>

                    {datasets.length < 2 ? (
                        <div className="p-2.5 rounded-md bg-amber-50/90 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed space-y-1">
                            <span className="font-semibold block text-amber-800">Requires at least 2 datasets</span>
                            <span>A secondary Y-axis compares two different metrics. Add a 2nd dataset in the Datasets panel to assign it to the Right Y-Axis.</span>
                        </div>
                    ) : y1Datasets.length === 0 ? (
                        <div className="p-2.5 rounded-md bg-amber-50/80 border border-amber-200/70 text-amber-800 text-[11px] leading-relaxed">
                            No datasets are currently mapped to the Right Y2 axis. Select which dataset(s) below should plot against the right axis.
                        </div>
                    ) : null}

                    <div className="space-y-1.5 pt-1">
                        {datasets.map((ds: any, idx: number) => {
                            const isRight = ds?.yAxisID === 'y1';
                            const dsColor = Array.isArray(ds.borderColor)
                                ? ds.borderColor[0]
                                : (ds.borderColor || (Array.isArray(ds.backgroundColor) ? ds.backgroundColor[0] : ds.backgroundColor) || '#3b82f6');

                            return (
                                <div
                                    key={ds.id || idx}
                                    className="flex items-center justify-between p-2 rounded-md bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                                            style={{ backgroundColor: typeof dsColor === 'string' ? dsColor : '#3b82f6' }}
                                        />
                                        <span className="text-xs font-medium text-gray-700 truncate">
                                            {ds.label || `Dataset ${idx + 1}`}
                                        </span>
                                        {ds.hidden && (
                                            <span className="text-[9px] text-gray-400 italic">(hidden)</span>
                                        )}
                                    </div>

                                    <div className="flex items-center rounded-md border border-gray-200 p-0.5 bg-white text-[10px] font-medium flex-shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isRight) {
                                                    updateDataset(idx, { yAxisID: 'y' });
                                                }
                                            }}
                                            className={cn(
                                                "px-2 py-0.5 rounded transition-colors cursor-pointer",
                                                !isRight
                                                    ? "bg-slate-200 text-slate-800 font-semibold shadow-xs"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                            )}
                                        >
                                            Left (Y)
                                        </button>
                                        <button
                                            type="button"
                                            disabled={datasets.length < 2}
                                            onClick={() => {
                                                if (datasets.length < 2) {
                                                    return;
                                                }
                                                if (!isRight) {
                                                    updateDataset(idx, { yAxisID: 'y1' });
                                                    if (config?.display === false) {
                                                        updateConfig('display', true);
                                                    }
                                                }
                                            }}
                                            className={cn(
                                                "px-2 py-0.5 rounded transition-colors",
                                                datasets.length < 2
                                                    ? "opacity-40 cursor-not-allowed text-gray-400"
                                                    : "cursor-pointer",
                                                isRight
                                                    ? "bg-purple-600 text-white font-semibold shadow-xs"
                                                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                            )}
                                        >
                                            Right (Y2)
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {config?.display !== false && (
                <div className="space-y-3">
                    {/* Title Section */}
                    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                        <div
                            className={cn(
                                "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                                titleDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                            )}
                            onClick={() => setTitleDropdownOpen(!titleDropdownOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                                <h3 className="text-xs font-semibold text-slate-800">Title</h3>
                            </div>
                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                    checked={config?.title?.display !== false}
                                    onCheckedChange={(checked) => updateConfig('title.display', checked)}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setTitleDropdownOpen(!titleDropdownOpen)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                    aria-label="Toggle title options"
                                >
                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", titleDropdownOpen && "rotate-180")} />
                                </button>
                            </div>
                        </div>

                        {/* Title Options */}
                        {titleDropdownOpen && (
                            <div className="p-3.5 space-y-3.5 bg-white">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-700">Text</Label>
                                    <Input
                                        ref={titleInputRef}
                                        value={config?.title?.text || ''}
                                        onChange={(e) => updateConfig('title.text', e.target.value)}
                                        placeholder={`Enter ${axis.toUpperCase()}-axis title`}
                                        className="h-8 text-xs bg-white"
                                    />
                                </div>

                                <FontSettingSection
                                    idPrefix={`axis-title-${axis}`}
                                    value={mapChartJsFontValue(config?.title?.font, config?.title?.color)}
                                    defaultFamily="Arial"
                                    defaultSize={12}
                                    defaultWeight="400"
                                    defaultColor="#374151"
                                    sizeMin={8}
                                    sizeMax={48}
                                    onChange={(patch) =>
                                        applyChartJsFontPatch(
                                            patch,
                                            (field, val) => updateConfig(`title.font.${field}`, val),
                                            (color) => updateConfig('title.color', color)
                                        )
                                    }
                                />

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-700">Alignment</Label>
                                    <Select
                                        value={config?.title?.align || 'center'}
                                        onValueChange={(value) => updateConfig('title.align', value)}
                                    >
                                        <SelectTrigger className="h-8 text-xs bg-white">
                                            <SelectValue placeholder="Center" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="start">Start (Left / Top)</SelectItem>
                                            <SelectItem value="center">Center</SelectItem>
                                            <SelectItem value="end">End (Right / Bottom)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <PaddingControl
                                    label="Padding"
                                    value={config?.title?.padding}
                                    defaultValue={4}
                                    onChange={(val) => updateConfig('title.padding', val)}
                                />
                            </div>
                        )}
                    </div>

                    {/* Label Appearance Section */}
                    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                        <div
                            className={cn(
                                "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                                labelAppearanceDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                            )}
                            onClick={() => setLabelAppearanceDropdownOpen(!labelAppearanceDropdownOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                                <h3 className="text-xs font-semibold text-slate-800">Label Appearance</h3>
                            </div>
                            <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                    checked={config?.ticks?.display !== false}
                                    onCheckedChange={(checked) => updateConfig('ticks.display', checked)}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setLabelAppearanceDropdownOpen(!labelAppearanceDropdownOpen)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                    aria-label="Toggle label appearance options"
                                >
                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", labelAppearanceDropdownOpen && "rotate-180")} />
                                </button>
                            </div>
                        </div>

                        {/* Label Options */}
                        {labelAppearanceDropdownOpen && (
                            <div className="p-3.5 space-y-3.5 bg-white">
                                <FontSettingSection
                                    idPrefix={`axis-ticks-${axis}`}
                                    value={mapChartJsFontValue(config?.ticks?.font, config?.ticks?.color)}
                                    defaultFamily="Arial"
                                    defaultSize={12}
                                    defaultWeight="400"
                                    defaultColor="#6b7280"
                                    sizeMin={8}
                                    sizeMax={36}
                                    onChange={(patch) =>
                                        applyChartJsFontPatch(
                                            patch,
                                            (field, val) => updateConfig(`ticks.font.${field}`, val),
                                            (color) => updateConfig('ticks.color', color)
                                        )
                                    }
                                />

                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-700">Rotation</Label>
                                    <div className="flex items-center gap-1.5">
                                        <Input
                                            type="number"
                                            value={config?.ticks?.maxRotation ?? ''}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? undefined : Number(e.target.value)
                                                updateConfig('ticks.maxRotation', value)
                                                updateConfig('ticks.minRotation', value)
                                            }}
                                            placeholder="0"
                                            className="h-8 text-xs bg-white flex-1 min-w-0"
                                            min={-90}
                                            max={90}
                                        />
                                        <span className="text-xs text-slate-400 shrink-0">°</span>
                                    </div>
                                </div>

                                <PaddingControl
                                    label="Padding"
                                    value={config?.ticks?.padding}
                                    defaultValue={3}
                                    mode="top-bottom"
                                    max={60}
                                    onChange={(val) => updateConfig('ticks.padding', val)}
                                />

                                {/* Number & Value Formatting Section */}
                                <NumberFormattingSection
                                    value={config?.ticks?.numberFormat}
                                    onChange={(newFmt) => updateConfig('ticks.numberFormat', newFmt)}
                                    defaultOpen={false}
                                />
                            </div>
                        )}
                    </div>

                    {/* Line Appearance Section */}
                    <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-2xs transition-all">
                        <div
                            className={cn(
                                "flex items-center justify-between px-3.5 py-2.5 cursor-pointer select-none transition-colors",
                                gridAppearanceDropdownOpen ? "bg-slate-50/80 border-b border-slate-100" : "bg-slate-50/40 hover:bg-slate-50/80"
                            )}
                            onClick={() => setGridAppearanceDropdownOpen(!gridAppearanceDropdownOpen)}
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-600 rounded-full" />
                                <h3 className="text-xs font-semibold text-slate-800">Line Appearance</h3>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setGridAppearanceDropdownOpen(!gridAppearanceDropdownOpen)
                                }}
                                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                aria-label="Toggle line appearance options"
                            >
                                <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", gridAppearanceDropdownOpen && "rotate-180")} />
                            </button>
                        </div>

                        {/* Line Appearance Options */}
                        {gridAppearanceDropdownOpen && (
                            <div className="p-3.5 space-y-4 bg-white">
                                {/* Top Toggles: Axis Line & Grid Line */}
                                <div className="grid grid-cols-2 gap-2.5">
                                    <div className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                                        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">Axis Line</span>
                                        <Switch
                                            checked={config?.border?.display !== false}
                                            onCheckedChange={(checked) => updateConfig('border.display', checked)}
                                            className="data-[state=checked]:bg-blue-600 scale-90"
                                            aria-label="Toggle Axis Line"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                                        <span className="text-xs font-medium text-slate-700 whitespace-nowrap">Grid Line</span>
                                        <Switch
                                            checked={config?.grid?.drawOnChartArea !== false}
                                            onCheckedChange={(checked) => updateConfig('grid.drawOnChartArea', checked)}
                                            className="data-[state=checked]:bg-blue-600 scale-90"
                                            aria-label="Toggle Grid Line"
                                        />
                                    </div>
                                </div>

                                {/* Axis Line Section */}
                                <div className="space-y-2.5 pt-1 border-t border-slate-100">
                                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Axis Line</span>
                                    <div className="grid grid-cols-2 gap-3 items-end">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-700">Color</Label>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-8 h-8 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                                                    style={{ backgroundColor: config?.border?.color || '#e5e7eb' }}
                                                    onClick={() => document.getElementById(`axis-border-color-${axis}`)?.click()}
                                                />
                                                <input
                                                    id={`axis-border-color-${axis}`}
                                                    type="color"
                                                    value={config?.border?.color || '#e5e7eb'}
                                                    onChange={(e) => updateConfig('border.color', e.target.value)}
                                                    className="sr-only"
                                                />
                                                <Input
                                                    value={config?.border?.color || '#e5e7eb'}
                                                    onChange={(e) => updateConfig('border.color', e.target.value)}
                                                    className="h-8 text-xs font-mono uppercase bg-white flex-1 min-w-0"
                                                    placeholder="#e5e7eb"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-700">Width</Label>
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    type="number"
                                                    value={config?.border?.width ?? ''}
                                                    onChange={(e) => updateConfig('border.width', e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="1"
                                                    className="h-8 text-xs bg-white flex-1 min-w-0"
                                                    min={0}
                                                    max={10}
                                                    step={0.5}
                                                />
                                                <span className="text-[11px] text-slate-400 shrink-0">px</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Grid Line Section */}
                                <div className="space-y-3 pt-1 border-t border-slate-100">
                                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Grid Line</span>
                                    <div className="grid grid-cols-[auto_1fr_1fr] gap-2.5 items-end">
                                        <div className="space-y-1">
                                            <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Color</Label>
                                            <div className="flex items-center h-8">
                                                <div
                                                    className="w-8 h-8 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                                                    style={{ backgroundColor: config?.grid?.color || '#e5e7eb' }}
                                                    onClick={() => document.getElementById(`grid-color-${axis}`)?.click()}
                                                    title={config?.grid?.color || '#e5e7eb'}
                                                />
                                                <input
                                                    id={`grid-color-${axis}`}
                                                    type="color"
                                                    value={config?.grid?.color || '#e5e7eb'}
                                                    onChange={(e) => updateConfig('grid.color', e.target.value)}
                                                    className="sr-only"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Width</Label>
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    type="number"
                                                    value={config?.grid?.lineWidth ?? ''}
                                                    onChange={(e) => updateConfig('grid.lineWidth', e.target.value ? Number(e.target.value) : undefined)}
                                                    placeholder="1"
                                                    className="h-8 text-xs bg-white flex-1 min-w-0 px-2"
                                                    min={0}
                                                    max={10}
                                                    step={0.5}
                                                />
                                                <span className="text-[11px] text-slate-400 shrink-0">px</span>
                                            </div>
                                        </div>

                                        <div className="space-y-1 min-w-0">
                                            <Label className="text-[11px] font-medium text-slate-700 whitespace-nowrap block">Style</Label>
                                            <Select
                                                value={currentDashStr}
                                                onValueChange={(value) => {
                                                    const parsed = JSON.parse(value)
                                                    updateConfig('grid.borderDash', parsed)
                                                    updateConfig('border.dash', parsed)
                                                }}
                                            >
                                                <SelectTrigger className="h-8 text-xs bg-white px-2">
                                                    <SelectValue placeholder="Select">
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
                                    <div className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-2.5">
                                        <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block">Custom Dash Pattern</span>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-slate-500 font-medium">Dash</Label>
                                                <Input
                                                    type="number"
                                                    value={(currentDash && currentDash[0]) || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value ? Number(e.target.value) : 0
                                                        const newDash = [value, currentDash[1] || value]
                                                        updateConfig('grid.borderDash', newDash)
                                                        updateConfig('border.dash', newDash)
                                                    }}
                                                    placeholder="0"
                                                    className="h-8 text-xs bg-white"
                                                    min={0}
                                                    max={20}
                                                    step={1}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-slate-500 font-medium">Gap</Label>
                                                <Input
                                                    type="number"
                                                    value={(currentDash && currentDash[1]) || ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value ? Number(e.target.value) : 0
                                                        const newDash = [currentDash[0] || value, value]
                                                        updateConfig('grid.borderDash', newDash)
                                                        updateConfig('border.dash', newDash)
                                                    }}
                                                    placeholder="0"
                                                    className="h-8 text-xs bg-white"
                                                    min={0}
                                                    max={20}
                                                    step={1}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[11px] text-slate-500 font-medium">Offset</Label>
                                                <Input
                                                    type="number"
                                                    value={config?.grid?.borderDashOffset ?? config?.border?.dashOffset ?? ''}
                                                    onChange={(e) => {
                                                        const value = e.target.value ? Number(e.target.value) : 0
                                                        updateConfig('grid.borderDashOffset', value)
                                                        updateConfig('border.dashOffset', value)
                                                    }}
                                                    placeholder="0"
                                                    className="h-8 text-xs bg-white"
                                                    min={0}
                                                    max={20}
                                                    step={1}
                                                />
                                            </div>
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
