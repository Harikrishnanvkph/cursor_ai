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
import { Copy, RotateCcw, Sparkles } from "lucide-react"
import { useState } from "react"

export function AdvancedPanel() {
  const { chartConfig, chartData, chartType, updateChartConfig } = useChartStore()
  const [effectsOpen, setEffectsOpen] = useState(false)
  const [rawOpen, setRawOpen] = useState(false)
  const [watermarkOpen, setWatermarkOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [hoverEnabled, setHoverEnabled] = useState(chartConfig.interaction?.mode !== undefined && chartConfig.interaction?.mode !== false)

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
      maintainAspectRatio : false,
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

  const handleHoverEnabledChange = (checked: boolean) => {
    setHoverEnabled(checked)
    handleConfigUpdate('interaction.mode', checked ? (chartConfig.interaction?.mode || 'point') : undefined)
  }

  return (
    <div className="space-y-4">
      {/* Tooltip Settings Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Tooltip Settings</h3>
          <Switch
            checked={chartConfig.plugins?.tooltip?.enabled !== false}
            onCheckedChange={(checked) => handleConfigUpdate("plugins.tooltip.enabled", checked)}
            className="data-[state=checked]:bg-green-600"
          />
          <button
            onClick={() => setTooltipOpen(!tooltipOpen)}
            className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Toggle Tooltip Settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${tooltipOpen ? 'rotate-180' : ''}`}> <path d="M6 9L12 15L18 9"/> </svg>
          </button>
        </div>
        <div className="bg-green-50 rounded-lg">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-black">Tooltip Display Mode</span>
            <Select
              value={chartConfig.plugins?.tooltip?.customDisplayMode || "slice"}
              onValueChange={value => handleConfigUpdate("plugins.tooltip.customDisplayMode", value)}
              disabled={chartConfig.plugins?.tooltip?.enabled === false}
            >
              <SelectTrigger className="h-8 text-xs w-32">
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
          {tooltipOpen && (
            <div className={`px-3 pb-3 space-y-3 ${chartConfig.plugins?.tooltip?.enabled === false ? 'opacity-50 pointer-events-none' : ''}`}> 
              <div className="grid grid-cols-2 gap-3">
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
                      <SelectItem value="Courier New">Courier New</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Tahoma">Tahoma</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Palatino">Palatino</SelectItem>
                      <SelectItem value="Garamond">Garamond</SelectItem>
                      <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                      <SelectItem value="Impact">Impact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Effects Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Visual Effects
          </h3>
          <button
            onClick={() => setEffectsOpen(!effectsOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
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
              className={`transform transition-transform ${effectsOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        {effectsOpen && (
          <div className="bg-orange-50 rounded-lg p-3 space-y-3">
            {/* Drop Shadow */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Drop Shadow</Label>
              <Switch
                checked={!!(chartConfig as any)?.shadow}
                onCheckedChange={(checked) => handleConfigUpdate("shadow", checked ? {
                  blur: 10,
                  color: 'rgba(0,0,0,0.2)',
                  offsetX: 0,
                  offsetY: 0
                } : false)}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
            {(chartConfig as any)?.shadow && (
              <div className="space-y-3 pt-2 border-t border-orange-200">
                <div>
                  <Label className="text-xs font-medium">Shadow Blur</Label>
                  <Slider 
                    value={[((chartConfig as any)?.shadow?.blur as number) || 10]} 
                    onValueChange={([value]) => handleConfigUpdate("shadow.blur", value)}
                    max={50}
                    min={0}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Shadow Color</Label>
                  <Input
                    type="color"
                    value={(chartConfig as any)?.shadow?.color || '#000000'}
                    onChange={(e) => handleConfigUpdate("shadow.color", e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Offset X</Label>
                  <Slider 
                    value={[((chartConfig as any)?.shadow?.offsetX as number) || 0]} 
                    onValueChange={([value]) => handleConfigUpdate("shadow.offsetX", value)}
                    max={50}
                    min={-50}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Offset Y</Label>
                  <Slider 
                    value={[((chartConfig as any)?.shadow?.offsetY as number) || 0]} 
                    onValueChange={([value]) => handleConfigUpdate("shadow.offsetY", value)}
                    max={50}
                    min={-50}
                    step={1}
                  />
                </div>
              </div>
            )}
            {/* Glow Effect */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Glow Effect</Label>
              <Switch
                checked={!!(chartConfig as any)?.glow}
                onCheckedChange={(checked) => handleConfigUpdate("glow", checked ? {
                  color: '#ffffff',
                  intensity: 5
                } : false)}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
            {(chartConfig as any)?.glow && (
              <div className="space-y-3 pt-2 border-t border-orange-200">
                <div>
                  <Label className="text-xs font-medium">Glow Color</Label>
                  <Input 
                    type="color" 
                    value={((chartConfig as any)?.glow?.color as string) || "#ffffff"}
                    onChange={(e) => handleConfigUpdate("glow.color", e.target.value)}
                    className="h-8"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Glow Intensity</Label>
                  <Slider 
                    value={[((chartConfig as any)?.glow?.intensity as number) || 5]} 
                    onValueChange={([value]) => handleConfigUpdate("glow.intensity", value)}
                    max={10} 
                    min={0} 
                    step={1} 
                  />
                </div>
              </div>
            )}
            {/* 3D Effect */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">3D Effect</Label>
              <Switch
                checked={!!(chartConfig as any)?.threeD}
                onCheckedChange={(checked) => handleConfigUpdate("threeD", checked ? {
                  depth: 20
                } : false)}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
            {(chartConfig as any)?.threeD && (
              <div className="pt-2 border-t border-orange-200">
                <Label className="text-xs font-medium">3D Depth</Label>
                <Slider 
                  value={[((chartConfig as any)?.threeD?.depth as number) || 20]} 
                  onValueChange={([value]) => handleConfigUpdate("threeD.depth", value)}
                  max={50} 
                  min={0} 
                  step={1} 
                />
              </div>
            )}
            {/* Blur Background */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Blur Background</Label>
              <Switch
                checked={!!(chartConfig as any)?.blur}
                onCheckedChange={(checked) => handleConfigUpdate("blur", checked ? {
                  amount: 5
                } : false)}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
            {(chartConfig as any)?.blur && (
              <div className="pt-2 border-t border-orange-200">
                <Label className="text-xs font-medium">Blur Amount</Label>
                <Slider 
                  value={[((chartConfig as any)?.blur?.amount as number) || 5]} 
                  onValueChange={([value]) => handleConfigUpdate("blur.amount", value)}
                  max={10} 
                  min={0} 
                  step={1} 
                />
              </div>
            )}
            {/* Noise Texture */}
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Noise Texture</Label>
              <Switch
                checked={!!(chartConfig as any)?.noise}
                onCheckedChange={(checked) => handleConfigUpdate("noise", checked ? {
                  intensity: 50
                } : false)}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
            {(chartConfig as any)?.noise && (
              <div className="pt-2 border-t border-orange-200">
                <Label className="text-xs font-medium">Noise Intensity</Label>
                <Slider 
                  value={[((chartConfig as any)?.noise?.intensity as number) || 50]} 
                  onValueChange={([value]) => handleConfigUpdate("noise.intensity", value)}
                  max={100} 
                  min={0} 
                  step={1} 
                />
              </div>
            )}
            {/* Filter Effects */}
            <div>
              <Label className="text-xs font-medium">Filter Effects</Label>
              <Select
                value={((chartConfig as any)?.filter?.type as string) || "none"}
                onValueChange={(value) => handleConfigUpdate("filter.type", value)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sepia">Sepia</SelectItem>
                  <SelectItem value="grayscale">Grayscale</SelectItem>
                  <SelectItem value="invert">Invert</SelectItem>
                  <SelectItem value="brightness">Brightness</SelectItem>
                  <SelectItem value="contrast">Contrast</SelectItem>
                  <SelectItem value="saturate">Saturate</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {((chartConfig as any)?.filter?.type as string) !== "none" && (
              <div>
                <Label className="text-xs font-medium">Filter Intensity</Label>
                <Slider 
                  value={[((chartConfig as any)?.filter?.intensity as number) || 100]} 
                  onValueChange={([value]) => handleConfigUpdate("filter.intensity", value)}
                  max={200} 
                  min={0} 
                  step={1} 
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Watermark Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Watermark</h3>
          <button
            onClick={() => setWatermarkOpen(!watermarkOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Toggle Watermark"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transform transition-transform ${watermarkOpen ? 'rotate-180' : ''}`}> <path d="M6 9L12 15L18 9"/> </svg>
          </button>
        </div>
        {watermarkOpen && (
          <div className="bg-gray-50 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Show Watermark</Label>
              <Switch
                checked={!!(chartConfig as any)?.watermark}
                onCheckedChange={(checked) => handleConfigUpdate("watermark", checked ? {
                  text: "",
                  position: "bottom-right",
                  opacity: 30,
                  size: 12,
                  color: "#cccccc",
                  imageUrl: ""
                } : false)}
                className="data-[state=checked]:bg-gray-600"
              />
            </div>
            {(chartConfig as any)?.watermark && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-medium">Watermark Text</Label>
                  <Input 
                    placeholder="Your watermark text"
                    value={((chartConfig as any)?.watermark?.text as string) || ""}
                    onChange={(e) => handleConfigUpdate("watermark.text", e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Opacity</Label>
                    <Slider 
                      value={[((chartConfig as any)?.watermark?.opacity as number) || 30]} 
                      onValueChange={([value]) => handleConfigUpdate("watermark.opacity", value)}
                      max={100} 
                      min={0} 
                      step={1} 
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Size</Label>
                    <Slider 
                      value={[((chartConfig as any)?.watermark?.size as number) || 12]} 
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
                    value={((chartConfig as any)?.watermark?.color as string) || "#cccccc"}
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
        )}
      </div>

      {/* Raw Config Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Raw Configuration</h3>
          <button
            onClick={() => setRawOpen(!rawOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Toggle Raw Config"
          >
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
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        <div className="bg-green-50 rounded-lg p-3 space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyConfig} className="flex-1 h-8 text-xs">
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
            <Button variant="outline" onClick={handleResetConfig} className="flex-1 h-8 text-xs">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          {rawOpen && (
            <div className="space-y-2 pt-2 border-t border-green-200">
              <Label className="text-xs font-medium">Chart.js Configuration (Read-only)</Label>
              <Textarea
                value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
                readOnly
                className="h-40 font-mono text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
