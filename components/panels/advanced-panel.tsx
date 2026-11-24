"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import {
  FontSettingSection,
  mapChartJsFontValue,
  applyChartJsFontPatch,
} from "@/components/ui/font-setting-section"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { Copy, Download, ChevronDown, MessageSquare, Sparkles, MousePointerClick, Stamp, Code2 } from "lucide-react"
import { useState } from "react"
import { useIsModernPanel, MODERN_PANEL_UI } from "@/components/editor/modern-panel-context"
import { cn } from "@/lib/utils"

const allowedEasings = [
  "linear",
  "easeInQuad",
  "easeOutQuad",
  "easeInOutQuad",
  "easeInCubic",
  "easeOutCubic",
  "easeInOutCubic",
  "easeInSine",
  "easeOutSine",
  "easeInOutSine"
];

export function AdvancedPanel() {
  const isModern = useIsModernPanel()
  const {
    chartConfig,
    chartData,
    chartType,
    activeDatasetIndex,
    chartMode,
    datasetBackups
  } = useChartStore()
  const { updateChartConfig } = useChartActions()
  const [rawOpen, setRawOpen] = useState(false)
  const [watermarkOpen, setWatermarkOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [generalAnimOpen, setGeneralAnimOpen] = useState(false)
  const [hoverAnimOpen, setHoverAnimOpen] = useState(false)
  const [hoverEnabled, setHoverEnabled] = useState(chartConfig.interaction?.mode !== undefined)


  const currentDatasetIndex = chartMode === 'single' ? activeDatasetIndex : 0
  const hasBackup = datasetBackups.has(currentDatasetIndex)

  const handleConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...chartConfig }
    let current: any = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
  }

  const handleHoverEnabledChange = (checked: boolean) => {
    setHoverEnabled(checked)
    handleConfigUpdate('interaction.mode', checked ? (typeof chartConfig.interaction?.mode === 'string' ? chartConfig.interaction.mode : 'point') : undefined)
  }

  // Ensure the value is always one of the allowed options
  const easingValue = allowedEasings.includes((chartConfig.animation as any)?.easing)
    ? (chartConfig.animation as any)?.easing
    : "linear"

  const handleCopyConfig = async () => {
    const config = {
      type: chartType,
      data: chartData,
      options: chartConfig,
    }
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  const handleExportConfig = () => {
    const config = {
      type: chartType,
      data: chartData,
      options: chartConfig,
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "chart-config.json"
    link.click()
    URL.revokeObjectURL(url)
  }







  return (
    <div className={isModern ? "space-y-2.5" : "space-y-2"}>


      {/* Tooltip Settings Section */}
      <div className={isModern ? MODERN_PANEL_UI.card : "space-y-0"}>
        <div
          className={
            isModern
              ? cn(MODERN_PANEL_UI.cardHeader, tooltipOpen && MODERN_PANEL_UI.cardHeaderOpen)
              : "flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
          }
          onClick={() => setTooltipOpen(!tooltipOpen)}
        >
          {isModern ? (
            <MessageSquare className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <h3 className={cn(isModern ? MODERN_PANEL_UI.cardTitle : "text-sm font-semibold text-gray-900", "flex-1")}>Tooltip Settings</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={(chartConfig as any).plugins?.tooltip?.enabled !== false}
              onCheckedChange={(checked) => handleConfigUpdate("plugins.tooltip.enabled", checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="ml-1 flex items-center">
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-150", isModern ? "text-slate-400" : "text-current", tooltipOpen && "rotate-180")} />
          </div>
        </div>
        <div className={isModern ? undefined : "bg-blue-50 rounded-b-lg border-x border-b border-blue-100"}>
          {tooltipOpen && (
            <div className={cn(isModern ? MODERN_PANEL_UI.cardBodyMuted : "px-3 py-3 space-y-2.5", (chartConfig as any).plugins?.tooltip?.enabled === false && "opacity-50 pointer-events-none")}>
              <div>
                <Label className="text-xs font-medium">Tooltip Display Mode</Label>
                <Select
                  value={(chartConfig as any).plugins?.tooltip?.customDisplayMode || "slice"}
                  onValueChange={value => handleConfigUpdate("plugins.tooltip.customDisplayMode", value)}
                  disabled={(chartConfig as any).plugins?.tooltip?.enabled === false}
                >
                  <SelectTrigger className="h-8 text-xs mt-1 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slice">Slice Values</SelectItem>
                    <SelectItem value="dataset">Dataset Values</SelectItem>
                    <SelectItem value="xaxis">X Axis Values</SelectItem>
                    <SelectItem value="yaxis">Y Axis Values</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <FontSettingSection
                idPrefix="tooltip-body"
                value={mapChartJsFontValue(
                  (chartConfig as any).plugins?.tooltip?.bodyFont,
                  (chartConfig as any).plugins?.tooltip?.bodyColor
                )}
                defaultFamily="Arial"
                defaultSize={12}
                defaultWeight="400"
                defaultColor="#ffffff"
                sizeMin={8}
                sizeMax={36}
                disabled={(chartConfig as any).plugins?.tooltip?.enabled === false}
                onChange={(patch) =>
                  applyChartJsFontPatch(
                    patch,
                    (field, val) => handleConfigUpdate(`plugins.tooltip.bodyFont.${field}`, val),
                    (color) => handleConfigUpdate("plugins.tooltip.bodyColor", color)
                  )
                }
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium">Background Color</Label>
                  <Input
                    type="color"
                    value={(chartConfig as any).plugins?.tooltip?.backgroundColor || "#000000"}
                    onChange={e => handleConfigUpdate("plugins.tooltip.backgroundColor", e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Background Opacity</Label>
                  <Slider
                    value={[((chartConfig as any)?.plugins?.tooltip?.backgroundOpacity as number) ?? 80]}
                    onValueChange={([value]) => handleConfigUpdate("plugins.tooltip.backgroundOpacity", value)}
                    max={100}
                    min={0}
                    step={1}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Border Color</Label>
                  <Input
                    type="color"
                    value={(chartConfig as any).plugins?.tooltip?.borderColor || "#cccccc"}
                    onChange={e => handleConfigUpdate("plugins.tooltip.borderColor", e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Border Width</Label>
                  <Input
                    type="number"
                    min={0}
                    value={(chartConfig as any).plugins?.tooltip?.borderWidth ?? 1}
                    onChange={e => handleConfigUpdate("plugins.tooltip.borderWidth", e.target.value ? Number(e.target.value) : 0)}
                    className="h-8 text-xs bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* General Animations Section */}
      <div className={isModern ? MODERN_PANEL_UI.card : "space-y-0"}>
        <div
          className={
            isModern
              ? cn(MODERN_PANEL_UI.cardHeader, generalAnimOpen && chartConfig.animation !== false && MODERN_PANEL_UI.cardHeaderOpen)
              : "flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
          }
          onClick={() => setGeneralAnimOpen(!generalAnimOpen)}
        >
          {isModern ? (
            <Sparkles className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <h3 className={cn(isModern ? MODERN_PANEL_UI.cardTitle : "text-sm font-semibold text-gray-900", "flex-1")}>General Animations</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={chartConfig.animation !== false}
              onCheckedChange={(checked) => handleConfigUpdate("animation", checked ? {} : false)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="ml-1 flex items-center">
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-150", isModern ? "text-slate-400" : "text-current", generalAnimOpen && "rotate-180")} />
          </div>
        </div>
        {generalAnimOpen && chartConfig.animation !== false && (
          <div className={isModern ? MODERN_PANEL_UI.cardBodyMuted : "bg-blue-50 rounded-b-lg p-3 space-y-3 border-x border-b border-blue-100"}>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Duration</Label>
                  <span className="text-xs text-gray-500">{(chartConfig.animation as any)?.duration || 1000}ms</span>
                </div>
                <Slider
                  value={[(chartConfig.animation as any)?.duration || 1000]}
                  onValueChange={([value]) => handleConfigUpdate("animation.duration", value)}
                  max={3000}
                  min={100}
                  step={100}
                  className="mt-1"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-medium">Easing</Label>
                <Select
                  value={easingValue}
                  onValueChange={(value) => handleConfigUpdate("animation.easing", value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select easing" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="easeInQuad">Ease In</SelectItem>
                    <SelectItem value="easeOutQuad">Ease Out</SelectItem>
                    <SelectItem value="easeInOutQuad">Ease In Out</SelectItem>
                    <SelectItem value="easeInCubic">Ease In (Strong)</SelectItem>
                    <SelectItem value="easeOutCubic">Ease Out (Strong)</SelectItem>
                    <SelectItem value="easeInOutCubic">Ease In Out (Strong)</SelectItem>
                    <SelectItem value="easeInSine">Ease In (Smooth)</SelectItem>
                    <SelectItem value="easeOutSine">Ease Out (Smooth)</SelectItem>
                    <SelectItem value="easeInOutSine">Ease In Out (Smooth)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Delay</Label>
                  <span className="text-xs text-gray-500">{(chartConfig.animation as any)?.delay || 0}ms</span>
                </div>
                <Slider
                  value={[(chartConfig.animation as any)?.delay || 0]}
                  onValueChange={([value]) => handleConfigUpdate("animation.delay", value)}
                  max={2000}
                  min={0}
                  step={100}
                  className="mt-1"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hover Animation Section */}
      <div className={isModern ? MODERN_PANEL_UI.card : "space-y-0"}>
        <div
          className={
            isModern
              ? cn(MODERN_PANEL_UI.cardHeader, MODERN_PANEL_UI.cardHeaderOpen)
              : "flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
          }
          onClick={() => setHoverAnimOpen(!hoverAnimOpen)}
        >
          {isModern ? (
            <MousePointerClick className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <h3 className={cn(isModern ? MODERN_PANEL_UI.cardTitle : "text-sm font-semibold text-gray-900", "flex-1")}>Hover Animation</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={hoverEnabled}
              onCheckedChange={handleHoverEnabledChange}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="ml-1 flex items-center">
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-150", isModern ? "text-slate-400" : "text-current", hoverAnimOpen && "rotate-180")} />
          </div>
        </div>
        <div className={isModern ? "bg-slate-50/40" : "bg-blue-50 rounded-b-lg border-x border-b border-blue-100"}>
          <div className="flex items-center justify-between px-3 py-2">
            <span className={isModern ? "text-xs font-medium text-slate-700" : "text-xs font-medium text-black"}>Hover Mode</span>
            <Select
              value={chartConfig.interaction?.mode === 'nearest' ? 'nearest' : 'point'}
              onValueChange={value => handleConfigUpdate('interaction.mode', value)}
              disabled={!hoverEnabled}
            >
              <SelectTrigger className="h-8 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="point">Point</SelectItem>
                <SelectItem value="nearest">Nearest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hoverAnimOpen && (
            <div className={`px-3 pb-3 ${!hoverEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-medium">Animation Duration (ms)</Label>
                <div className="relative w-24">
                  <Input
                    type="number"
                    min={0}
                    value={(chartConfig as any).hover?.animationDuration ?? 400}
                    onChange={e => handleConfigUpdate('hover.animationDuration', e.target.value ? Number(e.target.value) : 400)}
                    className="h-8 text-xs pr-8 w-full"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">ms</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Watermark Section */}
      <div className={isModern ? MODERN_PANEL_UI.card : "space-y-0"}>
        <div
          className={
            isModern
              ? cn(MODERN_PANEL_UI.cardHeader, watermarkOpen && MODERN_PANEL_UI.cardHeaderOpen)
              : "flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
          }
          onClick={() => setWatermarkOpen(!watermarkOpen)}
        >
          {isModern ? (
            <Stamp className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          )}
          <h3 className={cn(isModern ? MODERN_PANEL_UI.cardTitle : "text-sm font-semibold text-gray-900", "flex-1")}>Watermark</h3>
          <div className="ml-auto flex items-center">
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-150", isModern ? "text-slate-400" : "text-current", watermarkOpen && "rotate-180")} />
          </div>
        </div>
        {
          watermarkOpen && (
            <div className={isModern ? MODERN_PANEL_UI.cardBodyMuted : "bg-blue-50 rounded-b-lg p-3 space-y-2 border-x border-b border-blue-100"}>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Show Watermark</Label>
                <Switch
                  checked={!!(chartConfig as any)?.watermark}
                  onCheckedChange={(checked) => handleConfigUpdate("watermark", checked ? {
                    text: "Watermark",
                    position: "bottom-right",
                    opacity: 20,
                    size: 16,
                    color: "#999999",
                    imageUrl: "",
                    style: "tiled",
                    spacingX: 50,
                    spacingY: 50,
                    angle: -30
                  } : false)}
                  className="data-[state=checked]:bg-blue-600"
                />
              </div>
              {(chartConfig as any)?.watermark && (
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs font-medium">Watermark Style</Label>
                    <Select
                      value={((chartConfig as any)?.watermark?.style as string) || "tiled"}
                      onValueChange={(value) => handleConfigUpdate("watermark.style", value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Tiled" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tiled">Tiled (Repeating Pattern)</SelectItem>
                        <SelectItem value="single">Single Position</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Watermark Text</Label>
                    <Input
                      placeholder="Your watermark text"
                      value={((chartConfig as any)?.watermark?.text as string) || ""}
                      onChange={(e) => handleConfigUpdate("watermark.text", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  {((chartConfig as any)?.watermark?.style === 'single') && (
                    <div>
                      <Label className="text-xs font-medium">Watermark Position</Label>
                      <Select
                        value={((chartConfig as any)?.watermark?.position as string) || "bottom-right"}
                        onValueChange={(value) => handleConfigUpdate("watermark.position", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Bottom Right" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Top Left</SelectItem>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="bottom-left">Bottom Left</SelectItem>
                          <SelectItem value="bottom-right">Bottom Right</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {((chartConfig as any)?.watermark?.style === 'tiled' || !(chartConfig as any)?.watermark?.style) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium">Tile Spacing X</Label>
                        <Slider
                          value={[((chartConfig as any)?.watermark?.spacingX as number) ?? 50]}
                          onValueChange={([value]) => handleConfigUpdate("watermark.spacingX", value)}
                          max={300}
                          min={0}
                          step={5}
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Tile Spacing Y</Label>
                        <Slider
                          value={[((chartConfig as any)?.watermark?.spacingY as number) ?? 50]}
                          onValueChange={([value]) => handleConfigUpdate("watermark.spacingY", value)}
                          max={300}
                          min={0}
                          step={5}
                        />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Opacity</Label>
                      <Slider
                        value={[((chartConfig as any)?.watermark?.opacity as number) || 20]}
                        onValueChange={([value]) => handleConfigUpdate("watermark.opacity", value)}
                        max={100}
                        min={0}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Size</Label>
                      <Slider
                        value={[((chartConfig as any)?.watermark?.size as number) || 16]}
                        onValueChange={([value]) => handleConfigUpdate("watermark.size", value)}
                        max={48}
                        min={8}
                        step={1}
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Rotation Angle (Degrees)</Label>
                    <Slider
                      value={[((chartConfig as any)?.watermark?.angle as number) ?? -30]}
                      onValueChange={([value]) => handleConfigUpdate("watermark.angle", value)}
                      max={360}
                      min={-360}
                      step={1}
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Watermark Color</Label>
                    <Input
                      type="color"
                      value={((chartConfig as any)?.watermark?.color as string) || "#999999"}
                      onChange={(e) => handleConfigUpdate("watermark.color", e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Watermark Image URL</Label>
                    <Input
                      placeholder="https://example.com/logo.png"
                      value={((chartConfig as any)?.watermark?.imageUrl as string) || ""}
                      onChange={(e) => handleConfigUpdate("watermark.imageUrl", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        }
      </div >

      {/* Configuration Section */}
      <div className={isModern ? MODERN_PANEL_UI.card : "space-y-0"}>
        <div
          className={
            isModern
              ? cn(MODERN_PANEL_UI.cardHeader, rawOpen && MODERN_PANEL_UI.cardHeaderOpen)
              : "flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded-t"
          }
          onClick={() => setRawOpen(!rawOpen)}
        >
          {isModern ? (
            <Code2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          ) : (
            <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          )}
          <h3 className={cn(isModern ? MODERN_PANEL_UI.cardTitle : "text-sm font-semibold text-gray-900", "flex-1")}>Configuration</h3>
          <div className="ml-auto flex items-center">
            <ChevronDown className={cn("w-4 h-4 transition-transform duration-150", isModern ? "text-slate-400" : "text-current", rawOpen && "rotate-180")} />
          </div>
        </div>
        {
          rawOpen && (
            <div className={isModern ? MODERN_PANEL_UI.cardBodyMuted : "bg-gray-50 rounded-b-lg p-3 space-y-3 border-x border-b border-gray-100"}>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={handleExportConfig} className="h-8 text-xs bg-white hover:bg-gray-100">
                  <Download className="h-3 w-3 mr-1" />
                  JSON
                </Button>
                <Button variant="outline" onClick={handleCopyConfig} className="h-8 text-xs bg-white hover:bg-gray-100">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <Label className="text-xs font-medium text-gray-700">Chart.js Config</Label>
                <Textarea
                  value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
                  readOnly
                  className="h-40 font-mono text-[10px] bg-white"
                />
              </div>
            </div>
          )
        }
      </div>
    </div >
  )
}
