"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useChartStore } from "@/lib/chart-store"
import { Copy, RotateCcw } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
  const {
    chartConfig,
    chartData,
    chartType,
    updateChartConfig,
    activeDatasetIndex,
    chartMode,
    datasetBackups
  } = useChartStore()
  const [rawOpen, setRawOpen] = useState(false)
  const [watermarkOpen, setWatermarkOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [generalAnimOpen, setGeneralAnimOpen] = useState(false)
  const [hoverAnimOpen, setHoverAnimOpen] = useState(false)
  const [hoverEnabled, setHoverEnabled] = useState(chartConfig.interaction?.mode !== undefined && chartConfig.interaction?.mode !== false)


  const currentDatasetIndex = chartMode === 'single' ? activeDatasetIndex : 0
  const hasBackup = datasetBackups.has(currentDatasetIndex)

  const handleConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...chartConfig }
    let current = newConfig

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

  const handleResetConfig = () => {
    updateChartConfig({
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { top: 10, right: 10, bottom: 10, left: 10 }
      },
      plugins: {
        title: {
          display: true,
          text: "My Chart",
        },
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
          },
        },
        y: {
          display: true,
          grid: {
            display: true,
          },
        },
      },
    })
  }





  return (
    <div className="space-y-2">


      {/* Tooltip Settings Section */}
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setTooltipOpen(!tooltipOpen)}
        >
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Tooltip Settings</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={chartConfig.plugins?.tooltip?.enabled !== false}
              onCheckedChange={(checked) => handleConfigUpdate("plugins.tooltip.enabled", checked)}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${tooltipOpen ? 'rotate-180' : ''}`}> <path d="M6 9L12 15L18 9" /> </svg>
          </div>
        </div>
        <div className="bg-green-50 rounded-lg">
          {tooltipOpen && (
            <div className={`px-3 py-3 space-y-2 ${chartConfig.plugins?.tooltip?.enabled === false ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium">Tooltip Display Mode</Label>
                  <Select
                    value={chartConfig.plugins?.tooltip?.customDisplayMode || "slice"}
                    onValueChange={value => handleConfigUpdate("plugins.tooltip.customDisplayMode", value)}
                    disabled={chartConfig.plugins?.tooltip?.enabled === false}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
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
                <div>
                  <Label className="text-xs font-medium">Font Family</Label>
                  <Select
                    value={chartConfig.plugins?.tooltip?.bodyFont?.family || "Arial"}
                    onValueChange={value => handleConfigUpdate("plugins.tooltip.bodyFont.family", value)}
                  >
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium">Background Color</Label>
                  <Input
                    type="color"
                    value={chartConfig.plugins?.tooltip?.backgroundColor || "#000000"}
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
                  <Label className="text-xs font-medium">Text Color</Label>
                  <Input
                    type="color"
                    value={chartConfig.plugins?.tooltip?.bodyColor || "#ffffff"}
                    onChange={e => handleConfigUpdate("plugins.tooltip.bodyColor", e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Border Color</Label>
                  <Input
                    type="color"
                    value={chartConfig.plugins?.tooltip?.borderColor || "#cccccc"}
                    onChange={e => handleConfigUpdate("plugins.tooltip.borderColor", e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Border Width</Label>
                  <Input
                    type="number"
                    min={0}
                    value={chartConfig.plugins?.tooltip?.borderWidth ?? 1}
                    onChange={e => handleConfigUpdate("plugins.tooltip.borderWidth", e.target.value ? Number(e.target.value) : 0)}
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Font Size</Label>
                  <Input
                    type="number"
                    min={8}
                    value={chartConfig.plugins?.tooltip?.bodyFont?.size ?? 12}
                    onChange={e => handleConfigUpdate("plugins.tooltip.bodyFont.size", e.target.value ? Number(e.target.value) : 12)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* General Animations Section */}
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setGeneralAnimOpen(!generalAnimOpen)}
        >
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">General Animations</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={chartConfig.animation !== false}
              onCheckedChange={(checked) => handleConfigUpdate("animation", checked ? {} : false)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${generalAnimOpen ? 'rotate-180' : ''}`}>
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        {generalAnimOpen && chartConfig.animation !== false && (
          <div className="bg-blue-50 rounded-lg p-3 space-y-3">
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
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setHoverAnimOpen(!hoverAnimOpen)}
        >
          <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Hover Animation</h3>
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={hoverEnabled}
              onCheckedChange={handleHoverEnabledChange}
              className="data-[state=checked]:bg-pink-600"
            />
          </div>
          <div className="ml-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${hoverAnimOpen ? 'rotate-180' : ''}`}>
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        <div className="bg-pink-50 rounded-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-black">Hover Mode</span>
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
      <div className="space-y-2">
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setWatermarkOpen(!watermarkOpen)}
        >
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Watermark</h3>
          <div className="ml-auto flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${watermarkOpen ? 'rotate-180' : ''}`}> <path d="M6 9L12 15L18 9" /> </svg>
          </div>
        </div>
        {
          watermarkOpen && (
            <div className="bg-purple-50 rounded-lg p-3 space-y-2">
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
                    style: "tiled"
                  } : false)}
                  className="data-[state=checked]:bg-purple-600"
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

      {/* Raw Config Section */}
      < div className="space-y-3" >
        <div
          className="flex items-center gap-2 py-2 px-2 border-b cursor-pointer hover:bg-gray-50 transition-colors rounded"
          onClick={() => setRawOpen(!rawOpen)}
        >
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Raw Configuration</h3>
          <div className="ml-auto flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transform transition-transform ${rawOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9" />
            </svg>
          </div>
        </div>
        {
          rawOpen && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-3 border border-gray-100">
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCopyConfig} className="flex-1 h-8 text-xs bg-white hover:bg-gray-100">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Config
                </Button>
                <Button variant="outline" onClick={handleResetConfig} className="flex-1 h-8 text-xs bg-white hover:bg-gray-100">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <Label className="text-xs font-medium">Chart.js Configuration (Read-only)</Label>
                <Textarea
                  value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
                  readOnly
                  className="h-40 font-mono text-xs bg-white"
                />
              </div>
            </div>
          )
        }
      </div >
    </div >
  )
}
