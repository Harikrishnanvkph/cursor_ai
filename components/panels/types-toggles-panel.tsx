"use client"

import { useChartStore, type SupportedChartType } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useTemplateStore } from "@/lib/template-store"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ChartTypeSelector } from "@/components/chart-preview/chart-type-selector"
import { Switch } from "@/components/ui/switch"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"
import { Target, Sparkles, ChevronRight } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function TypesTogglesPanel() {
  const {
    chartType,
    chartData,
    chartConfig,
    getActiveChartConfig,
  } = useChartStore()

  // Read from the RESOLVED active config (per-dataset in single mode, per-group in grouped mode)
  // This ensures toggles always reflect what the chart actually renders, even after undo/redo.
  const activeConfig = getActiveChartConfig();
  const visualSettings = activeConfig?.visualSettings || { fillArea: true, showBorder: true, showImages: true, showLabels: false, uniformityMode: 'uniform' as const };
  const fillArea = visualSettings.fillArea;
  const showBorder = visualSettings.showBorder;
  const showImages = visualSettings.showImages;

  const {
    setChartType,
    toggleFillArea,
    toggleShowBorder,
    toggleShowImages,
    toggleShowLabels,
    toggleShowLegend,
    updateDataset,
    updateChartConfig,
  } = useChartActions()
  const { editorMode, setEditorMode } = useTemplateStore()

  const handleChartTypeChange = (type: string) => {
    // Use centralized chart type change handler from hook
    // This handles transition detection, type change, and legendType update
    setChartType(type as SupportedChartType);
  }

  // Derive label checked state from the active config (not the global mirror)
  const labelChecked = !!visualSettings.showLabels;

  // Derive legend checked state from the active config
  const legendChecked = (activeConfig.plugins as any)?.legend?.display !== false;

  const isAreaOrLine = chartType === 'area' || chartType === 'line'
  const isGradientActive = (chartData.datasets || []).some(ds => ds.gradientFill)
  const currentGradientPreset = (chartData.datasets || [])[0]?.gradientPreset || 'subtle'

  const handleGradientModeToggle = (enableGradient: boolean) => {
    (chartData.datasets || []).forEach((_, idx) => {
      updateDataset(idx, {
        fill: 'origin',
        gradientFill: enableGradient,
        gradientPreset: enableGradient ? 'subtle' : undefined,
        gradientTopOpacity: enableGradient ? 0.45 : undefined,
        gradientBottomOpacity: enableGradient ? 0.0 : undefined,
      })
    })
  }

  const handleGradientPresetChange = (preset: string) => {
    let top = 0.45
    let bottom = 0.0
    if (preset === 'vibrant') { top = 0.75; bottom = 0.05; }
    else if (preset === 'soft') { top = 0.25; bottom = 0.0; }
    (chartData.datasets || []).forEach((_, idx) => {
      updateDataset(idx, {
        gradientPreset: preset as 'subtle' | 'vibrant' | 'soft' | 'custom',
        gradientTopOpacity: top,
        gradientBottomOpacity: bottom,
      })
    })
  }

  const yThreshold = (activeConfig.scales as any)?.y?.threshold || {}
  const isThresholdActive = yThreshold.enabled === true

  const handleThresholdToggle = (enabled: boolean) => {
    const current = (activeConfig.scales as any)?.y?.threshold || {}
    const newConfig = {
      ...activeConfig,
      scales: {
        ...activeConfig.scales,
        y: {
          ...(activeConfig.scales as any)?.y,
          threshold: {
            ...current,
            enabled,
            value: typeof current.value === 'number' && !isNaN(current.value) ? current.value : 100,
            label: current.label !== undefined ? current.label : 'Target',
            color: current.color || '#ef4444',
            style: current.style || 'dashed',
            width: typeof current.width === 'number' ? current.width : 2,
            position: current.position || 'end',
          }
        }
      }
    }
    updateChartConfig(newConfig)
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle - Chart/Template */}
      <div className="flex items-center justify-between gap-3 mb-1">
        <span className="text-xs font-medium text-gray-700">Mode</span>
        <div
          className="flex items-center gap-1 bg-gray-100 rounded-full p-0.5 border border-gray-200"
        >
          <button
            onClick={() => setEditorMode('chart')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all min-w-[60px] ${editorMode === 'chart'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Chart
          </button>
          <button
            onClick={() => setEditorMode('template')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-all min-w-[60px] ${editorMode === 'template'
              ? 'bg-blue-500 text-white shadow-sm'
              : 'bg-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Template
          </button>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Chart Type</Label>
        <ChartTypeSelector
          value={chartType}
          onChange={handleChartTypeChange}
          variant="sidebar"
        />
      </div>

      <div className="flex items-center justify-between gap-1 px-1 mb-2">
        <div className="flex flex-col items-center gap-1">
          <Switch 
            id="fill-toggle" 
            checked={fillArea} 
            onCheckedChange={toggleFillArea} 
            className="scale-75 data-[state=unchecked]:bg-input/50" 
          />
          <Label htmlFor="fill-toggle" className="text-xs text-gray-600">Fill</Label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch id="border-toggle" checked={showBorder} onCheckedChange={toggleShowBorder} disabled={!fillArea} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="border-toggle" className="text-xs text-gray-600">Border</Label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch id="show-images-toggle" checked={showImages} onCheckedChange={toggleShowImages} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="show-images-toggle" className="text-xs text-gray-600">Image</Label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch id="show-labels-toggle" checked={labelChecked} onCheckedChange={toggleShowLabels} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="show-labels-toggle" className="text-xs text-gray-600">Label</Label>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Switch id="show-legend-toggle" checked={legendChecked} onCheckedChange={toggleShowLegend} className="scale-75 data-[state=unchecked]:bg-input/50" />
          <Label htmlFor="show-legend-toggle" className="text-xs text-gray-600">Legend</Label>
        </div>
      </div>

      {/* Modern Gradient Area Fill Toggle (for Area & Line charts) */}
      {isAreaOrLine && fillArea && (
        <div className="p-2.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-950">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Area Fill Style</span>
            </div>
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200 shadow-2xs">
              <button
                type="button"
                onClick={() => handleGradientModeToggle(false)}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                  !isGradientActive ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => handleGradientModeToggle(true)}
                className={`px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                  isGradientActive ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Gradient
              </button>
            </div>
          </div>

          {isGradientActive && (
            <div className="flex items-center gap-2 pt-1 border-t border-blue-100/70">
              <span className="text-[10px] text-gray-500 shrink-0 font-medium">Glow Preset:</span>
              <Select value={currentGradientPreset} onValueChange={handleGradientPresetChange}>
                <SelectTrigger className="h-7 text-[11px] bg-white border-blue-200 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subtle">Subtle Glow (45% → 0%)</SelectItem>
                  <SelectItem value="vibrant">Vibrant Glow (75% → 5%)</SelectItem>
                  <SelectItem value="soft">Soft Tint (25% → 0%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Goal & Benchmark Line Quick Toggle */}
      <div className="p-2.5 bg-white rounded-xl border border-gray-200/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full transition-colors ${isThresholdActive ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-gray-300'}`} />
          <div>
            <div className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-gray-600" />
              <span>Goal / Target Line</span>
            </div>
            <div className="text-[10px] text-gray-500">
              {isThresholdActive ? `Active at ${yThreshold.value ?? 100} (${yThreshold.label || 'Target'})` : 'Scale-locked benchmark line'}
            </div>
          </div>
        </div>
        <Switch
          checked={isThresholdActive}
          onCheckedChange={handleThresholdToggle}
          className="data-[state=checked]:bg-blue-600 scale-75"
        />
      </div>

      {/* Responsive Animations */}
      <ResponsiveAnimationsPanel />
    </div>
  )
}            