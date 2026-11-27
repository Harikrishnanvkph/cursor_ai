"use client"

import { useChartStore, type SupportedChartType } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useTemplateStore } from "@/lib/template-store"
import { Label } from "@/components/ui/label"
import { ChartTypeSelector } from "@/components/chart-preview/chart-type-selector"
import { Switch } from "@/components/ui/switch"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel"
import { Sparkles } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useIsModernPanel, MODERN_PANEL_UI } from "@/components/editor/modern-panel-context"
import { cn } from "@/lib/utils"

export function TypesTogglesPanel() {
  const isModern = useIsModernPanel()
  const {
    chartType,
    chartData,
    chartConfig,
    hasJSON,
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


  return (
    <div className={isModern ? "space-y-0" : "space-y-3"}>
      {/* Mode Toggle & Chart Type — shown in legacy mode or when no chart is loaded yet (Modern mode puts them in top bar once active) */}
      {!(isModern && hasJSON) && (
        <div className={isModern ? "space-y-3 pb-3 mb-2.5 border-b border-slate-200/80" : "space-y-3"}>
          {/* Mode Toggle - Chart/Template */}
          <div className="flex items-center justify-between gap-3">
            <span className={isModern ? "text-xs font-semibold text-slate-700" : "text-xs font-medium text-gray-700"}>
              Mode
            </span>
            <div
              className={
                isModern
                  ? cn("flex items-center gap-0.5 h-8", MODERN_PANEL_UI.segTrack)
                  : "flex items-center gap-1 bg-gray-100 rounded-full p-0.5 border border-gray-200"
              }
            >
              <button
                type="button"
                onClick={() => setEditorMode('chart')}
                className={
                  isModern
                    ? cn(
                        "h-full px-3 text-xs leading-none rounded-[6px] flex items-center justify-center transition-colors cursor-pointer min-w-[64px]",
                        editorMode === 'chart'
                          ? MODERN_PANEL_UI.segItemActive
                          : "text-slate-600 hover:text-slate-900 font-medium"
                      )
                    : `px-3 py-1 text-xs font-medium rounded-full transition-all min-w-[60px] ${editorMode === 'chart'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-transparent text-gray-500 hover:text-gray-700'
                      }`
                }
              >
                Chart
              </button>
              <button
                type="button"
                onClick={() => setEditorMode('template')}
                className={
                  isModern
                    ? cn(
                        "h-full px-3 text-xs leading-none rounded-[6px] flex items-center justify-center transition-colors cursor-pointer min-w-[64px]",
                        editorMode === 'template'
                          ? MODERN_PANEL_UI.segItemActive
                          : "text-slate-600 hover:text-slate-900 font-medium"
                      )
                    : `px-3 py-1 text-xs font-medium rounded-full transition-all min-w-[60px] ${editorMode === 'template'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-transparent text-gray-500 hover:text-gray-700'
                      }`
                }
              >
                Template
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className={isModern ? "text-xs font-semibold text-slate-700" : undefined}>Chart Type</Label>
            <ChartTypeSelector
              value={chartType}
              onChange={handleChartTypeChange}
              variant="sidebar"
            />
          </div>
        </div>
      )}

      <div
        className={
          isModern
            ? "pb-3 border-b border-slate-200/80 space-y-2"
            : "flex items-center justify-between gap-1 px-1 mb-2"
        }
      >
        {isModern && (
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Display
          </span>
        )}
        <div className={isModern ? "grid grid-cols-5 gap-1" : "contents"}>
          <div className="flex flex-col items-center gap-1.5">
            <Switch
              id="fill-toggle"
              checked={fillArea}
              onCheckedChange={toggleFillArea}
              className={isModern ? "scale-[0.85]" : "scale-75 data-[state=unchecked]:bg-input/50"}
            />
            <Label htmlFor="fill-toggle" className={isModern ? "text-[11px] font-medium text-slate-700 cursor-pointer" : "text-xs text-gray-600"}>Fill</Label>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Switch
              id="border-toggle"
              checked={showBorder}
              onCheckedChange={toggleShowBorder}
              disabled={!fillArea}
              className={isModern ? "scale-[0.85] disabled:opacity-50" : "scale-75 data-[state=unchecked]:bg-input/50"}
            />
            <Label htmlFor="border-toggle" className={isModern ? `text-[11px] font-medium cursor-pointer ${!fillArea ? 'text-slate-400' : 'text-slate-700'}` : "text-xs text-gray-600"}>Border</Label>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Switch
              id="show-images-toggle"
              checked={chartType === 'timeline' ? false : showImages}
              onCheckedChange={toggleShowImages}
              disabled={chartType === 'timeline'}
              className={isModern ? "scale-[0.85] disabled:opacity-50" : "scale-75 data-[state=unchecked]:bg-input/50 disabled:opacity-50"}
            />
            <Label htmlFor="show-images-toggle" className={isModern ? `text-[11px] font-medium cursor-pointer ${chartType === 'timeline' ? 'text-slate-400' : 'text-slate-700'}` : `text-xs ${chartType === 'timeline' ? 'text-gray-400' : 'text-gray-600'}`}>Image</Label>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Switch
              id="show-labels-toggle"
              checked={chartType === 'timeline' ? false : labelChecked}
              onCheckedChange={toggleShowLabels}
              disabled={chartType === 'timeline'}
              className={isModern ? "scale-[0.85] disabled:opacity-50" : "scale-75 data-[state=unchecked]:bg-input/50 disabled:opacity-50"}
            />
            <Label htmlFor="show-labels-toggle" className={isModern ? `text-[11px] font-medium cursor-pointer ${chartType === 'timeline' ? 'text-slate-400' : 'text-slate-700'}` : `text-xs ${chartType === 'timeline' ? 'text-gray-400' : 'text-gray-600'}`}>Label</Label>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <Switch
              id="show-legend-toggle"
              checked={legendChecked}
              onCheckedChange={toggleShowLegend}
              className={isModern ? "scale-[0.85]" : "scale-75 data-[state=unchecked]:bg-input/50"}
            />
            <Label htmlFor="show-legend-toggle" className={isModern ? "text-[11px] font-medium text-slate-700 cursor-pointer" : "text-xs text-gray-600"}>Legend</Label>
          </div>
        </div>
      </div>

      {/* Modern Gradient Area Fill Toggle (for Area & Line charts) */}
      {isAreaOrLine && fillArea && (
        <div
          className={
            isModern
              ? "py-2.5 border-b border-slate-200/80 space-y-2"
              : "p-2.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 rounded-xl border border-blue-100 space-y-2"
          }
        >
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-1.5 text-xs font-semibold", isModern ? "text-slate-800" : "text-blue-950")}>
              <Sparkles className={cn("w-3.5 h-3.5", isModern ? "text-indigo-600" : "text-blue-600")} />
              <span>Area Fill Style</span>
            </div>
            <div
              className={
                isModern
                  ? cn("flex items-center gap-0.5", MODERN_PANEL_UI.subSegTrack)
                  : "flex items-center gap-1 bg-white p-0.5 rounded-lg border border-gray-200 shadow-2xs"
              }
            >
              <button
                type="button"
                onClick={() => handleGradientModeToggle(false)}
                className={
                  isModern
                    ? cn(
                        "px-2.5 py-0.5 text-[11px] rounded-[5px] transition-colors cursor-pointer",
                        !isGradientActive ? MODERN_PANEL_UI.subSegItemActive : "text-slate-500 hover:text-slate-800 font-medium"
                      )
                    : `px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                        !isGradientActive ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-800'
                      }`
                }
              >
                Solid
              </button>
              <button
                type="button"
                onClick={() => handleGradientModeToggle(true)}
                className={
                  isModern
                    ? cn(
                        "px-2.5 py-0.5 text-[11px] rounded-[5px] transition-colors cursor-pointer",
                        isGradientActive ? MODERN_PANEL_UI.subSegItemActive : "text-slate-500 hover:text-slate-800 font-medium"
                      )
                    : `px-2 py-0.5 text-[10px] font-medium rounded-md transition-all ${
                        isGradientActive ? 'bg-blue-600 text-white shadow-xs font-semibold' : 'text-gray-500 hover:text-gray-800'
                      }`
                }
              >
                Gradient
              </button>
            </div>
          </div>

          {isGradientActive && (
            <div className={cn("flex items-center gap-2 pt-2 border-t", isModern ? "border-slate-200/70" : "border-blue-100/70")}>
              <span className="text-[11px] text-slate-500 shrink-0 font-medium">Glow Preset</span>
              <Select value={currentGradientPreset} onValueChange={handleGradientPresetChange}>
                <SelectTrigger className={cn("h-7 text-xs bg-white flex-1", isModern ? "border-slate-200/80" : "border-blue-200 text-[11px]")}>
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

      {/* Responsive Animations */}
      <ResponsiveAnimationsPanel />
    </div>
  )
}            