import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useRef, useEffect } from "react"
import { FontFamilySelect, FontWeightSelect } from "@/components/ui/font-family-select"
import { useChartData } from "@/lib/hooks/use-chart-state"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ChevronDown } from "lucide-react"
import { PaddingControl } from "@/components/ui/padding-control"

interface GeneralTabProps {
    axis: 'x' | 'y' | 'y1'
    config: any
    chartType?: string
    updateConfig: (path: string, value: any) => void
    updateNestedConfig: (basePath: string, path: string, value: any) => void
}

export function GeneralTab({ axis, config, chartType, updateConfig, updateNestedConfig }: GeneralTabProps) {
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
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200/70 bg-gradient-to-r from-blue-50/70 to-indigo-50/40 shadow-2xs">
                <div className="flex flex-col">
                    <Label className="text-xs font-semibold text-blue-950">
                        Show {axis === 'y1' ? 'Right Y-Axis (Y2)' : `${axis.toUpperCase()}-Axis`}
                    </Label>
                    {axis === 'y1' && (
                        <span className="text-[11px] text-blue-600/80">
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
                                    toast.error('Right Y-Axis requires at least 2 datasets');
                                    return;
                                }
                                updateConfig('display', true);
                                updateConfig('position', 'right');
                                if (y1Datasets.length === 0 && datasets.length > 1) {
                                    const targetIdx = 1;
                                    updateDataset(targetIdx, { yAxisID: 'y1' });
                                    toast.success(`Assigned "${datasets[targetIdx].label || `Dataset ${targetIdx + 1}`}" to Right Y-Axis (Y2)`);
                                } else {
                                    toast.success('Right Y-Axis (Y2) enabled');
                                }
                            } else {
                                updateConfig('display', false);
                                // Cleanly unmap all datasets from y1 back to y when disabling Right Y
                                datasets.forEach((ds: any, idx: number) => {
                                    if (ds?.yAxisID === 'y1') {
                                        updateDataset(idx, { yAxisID: 'y' });
                                    }
                                });
                                toast.info('Right Y-Axis (Y2) hidden');
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
                                                    toast.info(`Moved "${ds.label || `Dataset ${idx + 1}`}" to Left Y-Axis`);
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
                                                    toast.error('Add a 2nd dataset to use the Right Y-Axis');
                                                    return;
                                                }
                                                if (!isRight) {
                                                    updateDataset(idx, { yAxisID: 'y1' });
                                                    if (config?.display === false) {
                                                        updateConfig('display', true);
                                                    }
                                                    toast.success(`Moved "${ds.label || `Dataset ${idx + 1}`}" to Right Y2`);
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

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Font Family</Label>
                                        <FontFamilySelect
                                            value={config?.title?.font?.family || 'Arial'}
                                            onValueChange={(value) => updateConfig('title.font.family', value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Font Weight</Label>
                                        <FontWeightSelect
                                            value={String(config?.title?.font?.weight || 'normal')}
                                            onValueChange={(value) => updateConfig('title.font.weight', value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Font Size</Label>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="number"
                                                value={config?.title?.font?.size || ''}
                                                onChange={(e) => updateConfig('title.font.size', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="12"
                                                className="h-8 text-xs bg-white flex-1 min-w-0"
                                                min={8}
                                                max={48}
                                            />
                                            <span className="text-xs text-slate-400 shrink-0">px</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Color</Label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                                                style={{ backgroundColor: config?.title?.color || '#374151' }}
                                                onClick={() => document.getElementById(`title-color-${axis}`)?.click()}
                                            />
                                            <input
                                                id={`title-color-${axis}`}
                                                type="color"
                                                value={config?.title?.color || '#374151'}
                                                onChange={(e) => updateConfig('title.color', e.target.value)}
                                                className="sr-only"
                                            />
                                            <Input
                                                value={config?.title?.color || '#374151'}
                                                onChange={(e) => updateConfig('title.color', e.target.value)}
                                                className="h-8 text-xs font-mono uppercase bg-white flex-1 min-w-0"
                                                placeholder="#374151"
                                            />
                                        </div>
                                    </div>
                                </div>

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
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Font Family</Label>
                                        <FontFamilySelect
                                            value={config?.ticks?.font?.family || 'Arial'}
                                            onValueChange={(value) => updateConfig('ticks.font.family', value)}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Font Weight</Label>
                                        <FontWeightSelect
                                            value={String(config?.ticks?.font?.weight || 'normal')}
                                            onValueChange={(value) => updateConfig('ticks.font.weight', value)}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Font Size</Label>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="number"
                                                value={config?.ticks?.font?.size || ''}
                                                onChange={(e) => updateConfig('ticks.font.size', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="12"
                                                className="h-8 text-xs bg-white flex-1 min-w-0"
                                                min={8}
                                                max={36}
                                            />
                                            <span className="text-xs text-slate-400 shrink-0">px</span>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Color</Label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                                                style={{ backgroundColor: config?.ticks?.color || '#6b7280' }}
                                                onClick={() => document.getElementById(`tick-color-${axis}`)?.click()}
                                            />
                                            <input
                                                id={`tick-color-${axis}`}
                                                type="color"
                                                value={config?.ticks?.color || '#6b7280'}
                                                onChange={(e) => updateConfig('ticks.color', e.target.value)}
                                                className="sr-only"
                                            />
                                            <Input
                                                value={config?.ticks?.color || '#6b7280'}
                                                onChange={(e) => updateConfig('ticks.color', e.target.value)}
                                                className="h-8 text-xs font-mono uppercase bg-white flex-1 min-w-0"
                                                placeholder="#6b7280"
                                            />
                                        </div>
                                    </div>
                                </div>

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
                            </div>
                        )}
                    </div>

                    {/* Grid Appearance Section */}
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
                                <h3 className="text-xs font-semibold text-slate-800">Grid Appearance</h3>
                            </div>
                            <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <Switch
                                    checked={config?.grid?.display !== false}
                                    onCheckedChange={(checked) => updateConfig('grid.display', checked)}
                                    className="data-[state=checked]:bg-blue-600"
                                />
                                <button
                                    type="button"
                                    onClick={() => setGridAppearanceDropdownOpen(!gridAppearanceDropdownOpen)}
                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                                    aria-label="Toggle grid appearance options"
                                >
                                    <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", gridAppearanceDropdownOpen && "rotate-180")} />
                                </button>
                            </div>
                        </div>

                        {/* Grid Options */}
                        {gridAppearanceDropdownOpen && (
                            <div className="p-3.5 space-y-3.5 bg-white">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Grid Color</Label>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-7 h-7 rounded-lg border border-slate-200/80 shadow-2xs cursor-pointer hover:scale-105 transition-transform shrink-0"
                                                style={{ backgroundColor: config?.grid?.color || '#e5e7eb' }}
                                                onClick={() => document.getElementById(`grid-color-${axis}`)?.click()}
                                            />
                                            <input
                                                id={`grid-color-${axis}`}
                                                type="color"
                                                value={config?.grid?.color || '#e5e7eb'}
                                                onChange={(e) => updateConfig('grid.color', e.target.value)}
                                                className="sr-only"
                                            />
                                            <Input
                                                value={config?.grid?.color || '#e5e7eb'}
                                                onChange={(e) => updateConfig('grid.color', e.target.value)}
                                                className="h-8 text-xs font-mono uppercase bg-white flex-1 min-w-0"
                                                placeholder="#e5e7eb"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Line Width</Label>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="number"
                                                value={config?.grid?.lineWidth ?? ''}
                                                onChange={(e) => updateConfig('grid.lineWidth', e.target.value ? Number(e.target.value) : undefined)}
                                                placeholder="1"
                                                className="h-8 text-xs bg-white flex-1 min-w-0"
                                                min={0}
                                                max={10}
                                                step={0.5}
                                            />
                                            <span className="text-xs text-slate-400 shrink-0">px</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 items-end">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Line Style</Label>
                                        <Select
                                            value={currentDashStr}
                                            onValueChange={(value) => {
                                                const parsed = JSON.parse(value)
                                                updateConfig('grid.borderDash', parsed)
                                                updateConfig('border.dash', parsed)
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white">
                                                <SelectValue placeholder="Select style">
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

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-slate-700">Chart Area Lines</Label>
                                        <div className="flex items-center justify-between h-8 px-2.5 rounded-lg border border-slate-200/80 bg-slate-50/50">
                                            <span className="text-xs text-slate-600">Draw on Chart</span>
                                            <Switch
                                                checked={config?.grid?.drawOnChartArea !== false}
                                                onCheckedChange={(checked) => updateConfig('grid.drawOnChartArea', checked)}
                                                className="data-[state=checked]:bg-blue-600 scale-90"
                                            />
                                        </div>
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
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
