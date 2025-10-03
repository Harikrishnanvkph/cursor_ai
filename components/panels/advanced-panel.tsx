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
import { Copy, RotateCcw, Sparkles, ArrowUpNarrowWide, ArrowDownWideNarrow, Undo2, ArrowUpDown, ArrowUpAZ, ArrowDownZA, Trophy, TrendingUp, TrendingDown, BarChart3, Percent, Hash, X, Divide, Plus, Minus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function AdvancedPanel() {
  const { 
    chartConfig, 
    chartData, 
    chartType, 
    updateChartConfig,
    activeDatasetIndex,
    chartMode,
    sortDataset,
    reverseDataset,
    filterTopN,
    filterAboveThreshold,
    filterBelowThreshold,
    normalizeDataset,
    convertToPercentage,
    roundDataset,
    scaleDataset,
    offsetDataset,
    datasetBackups,
    resetDatasetOperations
  } = useChartStore()
  const [effectsOpen, setEffectsOpen] = useState(false)
  const [rawOpen, setRawOpen] = useState(false)
  const [watermarkOpen, setWatermarkOpen] = useState(false)
  const [tooltipOpen, setTooltipOpen] = useState(false)
  const [quickToolsOpen, setQuickToolsOpen] = useState(true)
  const [hoverEnabled, setHoverEnabled] = useState(chartConfig.interaction?.mode !== undefined && chartConfig.interaction?.mode !== false)
  const [thresholdValue, setThresholdValue] = useState(50)
  
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

  const handleSortAscending = () => {
    sortDataset(currentDatasetIndex, 'asc')
  }

  const handleSortDescending = () => {
    sortDataset(currentDatasetIndex, 'desc')
  }

  const handleSortLabelAZ = () => {
    sortDataset(currentDatasetIndex, 'label-asc')
  }

  const handleSortLabelZA = () => {
    sortDataset(currentDatasetIndex, 'label-desc')
  }

  const handleReverse = () => {
    reverseDataset(currentDatasetIndex)
  }

  const handleTop5 = () => {
    filterTopN(currentDatasetIndex, 5)
  }

  const handleTop10 = () => {
    filterTopN(currentDatasetIndex, 10)
  }

  const handleAboveThreshold = () => {
    filterAboveThreshold(currentDatasetIndex, thresholdValue)
  }

  const handleBelowThreshold = () => {
    filterBelowThreshold(currentDatasetIndex, thresholdValue)
  }

  const handleNormalize = () => {
    normalizeDataset(currentDatasetIndex, '0-100')
  }

  const handleConvertToPercentage = () => {
    convertToPercentage(currentDatasetIndex)
  }

  const handleRound1Decimal = () => {
    roundDataset(currentDatasetIndex, 1)
  }

  const handleRound2Decimals = () => {
    roundDataset(currentDatasetIndex, 2)
  }

  const handleDoubleValues = () => {
    scaleDataset(currentDatasetIndex, 2)
  }

  const handleHalfValues = () => {
    scaleDataset(currentDatasetIndex, 0.5)
  }

  const handleResetOperations = () => {
    resetDatasetOperations(currentDatasetIndex)
    toast.success('Reset to original state', { duration: 2000 })
  }

  return (
    <div className="space-y-4">
      {/* Quick Tools Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900 flex-1">Quick Tools</h3>
          <button
            onClick={() => setQuickToolsOpen(!quickToolsOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="Toggle Quick Tools"
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
              className={`transform transition-transform ${quickToolsOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        {quickToolsOpen && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 space-y-4 border border-blue-100">
            {/* Reordering Operations */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-blue-900">🔄 Reordering</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSortAscending}
                  className="h-10 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  title="Sort Ascending (Low to High)"
                >
                  <ArrowUpNarrowWide className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSortDescending}
                  className="h-10 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  title="Sort Descending (High to Low)"
                >
                  <ArrowDownWideNarrow className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSortLabelAZ}
                  className="h-10 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  title="Sort by Label A-Z"
                >
                  <ArrowUpAZ className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSortLabelZA}
                  className="h-10 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group"
                  title="Sort by Label Z-A"
                >
                  <ArrowDownZA className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReverse}
                  className="h-10 bg-white hover:bg-blue-50 hover:border-blue-300 transition-all group col-span-2"
                  title="Reverse Order"
                >
                  <ArrowUpDown className="h-5 w-5 text-blue-600 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Filtering Operations */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-blue-900">🔍 Filtering</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTop5}
                  className="h-10 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title="Show Top 5 Values"
                >
                  <Trophy className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTop10}
                  className="h-10 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title="Show Top 10 Values"
                >
                  <Trophy className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAboveThreshold}
                  className="h-10 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title={`Show values above ${thresholdValue}`}
                >
                  <TrendingUp className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBelowThreshold}
                  className="h-10 bg-white hover:bg-green-50 hover:border-green-300 transition-all group"
                  title={`Show values below ${thresholdValue}`}
                >
                  <TrendingDown className="h-5 w-5 text-green-600 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-gray-600">Threshold:</Label>
                <input
                  type="number"
                  value={thresholdValue}
                  onChange={(e) => setThresholdValue(Number(e.target.value))}
                  className="w-16 px-2 py-1 text-xs border rounded bg-white"
                  min="0"
                />
              </div>
            </div>

            {/* Value Transformations */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-blue-900">📈 Transformations</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNormalize}
                  className="h-10 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Normalize to 0-100 range"
                >
                  <BarChart3 className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConvertToPercentage}
                  className="h-10 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Convert to percentages"
                >
                  <Percent className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRound1Decimal}
                  className="h-10 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Round to 1 decimal place"
                >
                  <Hash className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRound2Decimals}
                  className="h-10 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Round to 2 decimal places"
                >
                  <Hash className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDoubleValues}
                  className="h-10 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Double all values"
                >
                  <X className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHalfValues}
                  className="h-10 bg-white hover:bg-purple-50 hover:border-purple-300 transition-all group"
                  title="Half all values"
                >
                  <Divide className="h-5 w-5 text-purple-600 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>

            {/* Reset Button */}
            {hasBackup && (
              <div className="pt-2 border-t border-blue-200">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetOperations}
                  className="w-full h-9 bg-white hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 transition-all group"
                >
                  <Undo2 className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium">Reset to Original</span>
                </Button>
              </div>
            )}
            
            {!hasBackup && (
              <div className="pt-2 border-t border-blue-200">
                <p className="text-xs text-center text-gray-500 py-2">
                  No changes to reset
                </p>
              </div>
            )}
          </div>
        )}
      </div>

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
