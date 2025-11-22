"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useChartStore } from "@/lib/chart-store"
import { ImageIcon, Layers, Type, Palette } from "lucide-react";
import { RadarPanel } from "./radar-panel"; // Added import for RadarPanel
import { PiePanel } from "./pie-panel"; // Added import for PiePanel
import { useState } from "react"

// Add type for slice value config
interface SliceValueConfig {
  display: boolean
  position: 'inside' | 'outside' | 'center'
  color: string
  font: {
    family: string
    size: number
    weight: string
  }
  format: 'number' | 'percentage'
  prefix: string
  suffix: string
  decimals: number
  backgroundColor: string
  padding: number
  borderRadius: number
  borderColor: string
  borderWidth: number
}

type ConfigPathUpdate = {
  path: string;
  value: any;
};

export function DesignPanel() {
  const { chartConfig, updateChartConfig, chartType, chartData, updateDataset } = useChartStore();
  const [borderColorMode, setBorderColorMode] = useState<'auto' | 'manual'>('auto');
  const [manualBorderColor, setManualBorderColor] = useState('#000000');

  const applyConfigUpdates = (updates: ConfigPathUpdate[]) => {
    const newConfig = { ...chartConfig };

    updates.forEach(({ path, value }) => {
      const keys = path.split(".");
      let current: any = newConfig;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== "object") {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
    });

    updateChartConfig(newConfig);
  };

  const handleConfigUpdate = (path: string, value: any) => {
    applyConfigUpdates([{ path, value }]);
  };

  const handleUpdateDataset = (datasetIndex: number, property: string, value: any) => {
    updateDataset(datasetIndex, { [property]: value });
  };

  const darkenColor = (color: string, percent: number) => {
    // Handle HSL colors
    if (color.startsWith("hsl")) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
      if (match) {
        const [, h, s, l] = match
        const newL = Math.max(0, Number.parseInt(l) - percent)
        return `hsl(${h}, ${s}%, ${newL}%)`
      }
    }
    
    // Handle hex colors
    if (color.startsWith("#")) {
      const hex = color.replace("#", "")
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      
      // Darken by reducing RGB values
      const factor = 1 - percent / 100
      const newR = Math.max(0, Math.round(r * factor))
      const newG = Math.max(0, Math.round(g * factor))
      const newB = Math.max(0, Math.round(b * factor))
      
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
    }
    
    // Handle rgba/rgb colors
    if (color.startsWith("rgba") || color.startsWith("rgb")) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (match) {
        const [, r, g, b, a] = match
        const factor = 1 - percent / 100
        const newR = Math.max(0, Math.round(parseInt(r) * factor))
        const newG = Math.max(0, Math.round(parseInt(g) * factor))
        const newB = Math.max(0, Math.round(parseInt(b) * factor))
        
        if (a !== undefined) {
          return `rgba(${newR}, ${newG}, ${newB}, ${a})`
        }
        return `rgb(${newR}, ${newG}, ${newB})`
      }
    }
    
    return color
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="styling" className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="styling" className="flex-shrink-0">Styling</TabsTrigger>
            <TabsTrigger value="title" className="flex-shrink-0">Title</TabsTrigger>
            <TabsTrigger value="background" className="flex-shrink-0">Background</TabsTrigger>
            <TabsTrigger value="legend" className="flex-shrink-0">Legend</TabsTrigger>
        </TabsList>
        </div>

        <TabsContent value="styling" className="mt-4 space-y-3">
          <div className="bg-purple-50 rounded-lg p-3 space-y-3">
            {/* Border Styling */}
            <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <h3 className="text-[0.80rem] font-semibold text-gray-900">Border Styling</h3>
            </div>
            
            {/* Border Width */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Border Width</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={Number(chartData.datasets[0]?.borderWidth ?? 2)}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : 2
                      chartData.datasets.forEach((_, index) => {
                        handleUpdateDataset(index, 'borderWidth', value)
                      })
                    }}
                    className="w-16 h-8 text-xs"
                    placeholder="2"
                    min={0}
                    max={10}
                    step={1}
                  />
                  <span className="text-xs text-purple-700">px</span>
                </div>
              </div>
            </div>
            
            {/* Border Color */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Border Color</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant={borderColorMode === 'auto' ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs flex-1"
                  onClick={() => {
                    setBorderColorMode('auto')
                    // Apply auto border colors (darkened background colors)
                    chartData.datasets.forEach((dataset, index) => {
                      const bgColors = Array.isArray(dataset.backgroundColor) 
                        ? dataset.backgroundColor 
                        : [dataset.backgroundColor]
                      const autoBorderColors = bgColors.map(color => darkenColor(String(color), 20))
                      handleUpdateDataset(index, 'borderColor', autoBorderColors)
                    })
                  }}
                >
                  Auto
                </Button>
                <Button
                  variant={borderColorMode === 'manual' ? "default" : "outline"}
                  size="sm"
                  className="h-8 text-xs flex-1"
                  onClick={() => setBorderColorMode('manual')}
                >
                  Manual
                </Button>
              </div>
              
              {borderColorMode === 'manual' && (
                <div className="flex items-center gap-2 p-2 bg-white rounded border border-purple-200">
                  <div 
                    className="w-10 h-10 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
                    style={{ backgroundColor: manualBorderColor }}
                    onClick={() => document.getElementById('manual-border-color-picker')?.click()}
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-700">Uniform Border</div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase">{manualBorderColor}</div>
                  </div>
                  <input
                    id="manual-border-color-picker"
                    type="color"
                    value={manualBorderColor}
                    onChange={(e) => {
                      setManualBorderColor(e.target.value)
                      // Apply manual border color to all datasets uniformly
                      chartData.datasets.forEach((dataset, index) => {
                        const sliceCount = dataset.data.length
                        handleUpdateDataset(index, 'borderColor', Array(sliceCount).fill(e.target.value))
                      })
                    }}
                    className="invisible w-0 h-0"
                  />
                </div>
              )}
            </div>
            
            {/* Border Radius */}
            <div className="space-y-1">
              <Label className="text-xs font-medium">Border Radius (Slices)</Label>
              <Slider
                value={[Number(chartData.datasets[0]?.borderRadius ?? 0)]}
                onValueChange={([value]) => {
                  chartData.datasets.forEach((_, index) => {
                    handleUpdateDataset(index, 'borderRadius', value)
                  })
                }}
                max={200}
                step={1}
                className="mt-2"
              />
              <div className="text-xs text-gray-500 mt-1">{Number(chartData.datasets[0]?.borderRadius ?? 0)}px</div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 space-y-3">
            {/* Point Edit */}
            <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <h3 className="text-[0.80rem] font-semibold text-gray-900">
                Point Edit <span className="text-xs text-gray-500">(Line, Area, Radar Charts Only)</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Point Radius</Label>
                <Input
                  type="number"
                  value={Number(chartData.datasets[0]?.pointRadius ?? 5)}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : 5
                    chartData.datasets.forEach((_, index) => {
                      handleUpdateDataset(index, 'pointRadius', value)
                    })
                  }}
                  className="h-8 text-xs"
                  placeholder="5"
                  min={0}
                  max={20}
                  step={1}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium">Hover Radius</Label>
                <Input
                  type="number"
                  value={Number((chartData.datasets[0] as any)?.pointHoverRadius ?? 8)}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : 8
                    chartData.datasets.forEach((_, index) => {
                      handleUpdateDataset(index, 'pointHoverRadius', value)
                    })
                  }}
                  className="h-8 text-xs"
                  placeholder="8"
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium">Point Border Width</Label>
                <Input
                  type="number"
                  value={Number((chartData.datasets[0] as any)?.pointBorderWidth ?? 1)}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : 1
                    chartData.datasets.forEach((_, index) => {
                      handleUpdateDataset(index, 'pointBorderWidth', value)
                    })
                  }}
                  className="h-8 text-xs"
                  placeholder="1"
                  min={0}
                  max={5}
                  step={1}
                />
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium">Hover Border Width</Label>
                <Input
                  type="number"
                  value={Number((chartData.datasets[0] as any)?.pointHoverBorderWidth ?? 2)}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : 2
                    chartData.datasets.forEach((_, index) => {
                      handleUpdateDataset(index, 'pointHoverBorderWidth', value)
                    })
                  }}
                  className="h-8 text-xs"
                  placeholder="2"
                  min={0}
                  max={10}
                  step={1}
                />
              </div>
            </div>
          </div>
          
          {/* Line Properties */}
          <div className="bg-purple-50 rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-purple-200">
              <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
              <h3 className="text-[0.80rem] font-semibold text-gray-900">
                Line Properties <span className="text-xs text-gray-500">(Line, Area Chart Only)</span>
              </h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Line Tension</Label>
                <Slider
                  value={[Number((chartData.datasets[0] as any)?.tension ?? 0.4)]}
                  onValueChange={([value]) => {
                    chartData.datasets.forEach((_, index) => {
                      handleUpdateDataset(index, 'tension', value)
                    })
                  }}
                  min={0}
                  max={1}
                  step={0.1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{Number((chartData.datasets[0] as any)?.tension ?? 0.4).toFixed(1)}</div>
              </div>
              
              <div className="space-y-1">
                <Label className="text-xs font-medium">Line Style</Label>
                <Select 
                  value={
                    (chartData.datasets[0] as any)?.borderDash 
                      ? (JSON.stringify((chartData.datasets[0] as any).borderDash) === JSON.stringify([5, 5]) ? 'dashed' : 'dotted')
                      : 'solid'
                  }
                  onValueChange={(value) => {
                    const borderDash = value === 'solid' ? undefined : value === 'dashed' ? [5, 5] : [2, 2]
                    chartData.datasets.forEach((_, index) => {
                      handleUpdateDataset(index, 'borderDash', borderDash)
                    })
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="title" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                Title Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Show Title</Label>
                <Switch
                  checked={chartConfig.plugins?.title?.display || false}
                  onCheckedChange={(checked) => handleConfigUpdate("plugins.title.display", checked)}
                />
              </div>

              {!chartConfig.plugins?.title?.display && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Enable Chart Title</strong> to add a prominent heading above your chart. 
                    You can customize the text, font, size, color, alignment, and position.
                  </p>
                </div>
              )}

              {chartConfig.plugins?.title?.display && (
                <>
                  <div>
                    <Label className="text-xs font-medium">Title Text</Label>
                    <Input
                      value={chartConfig.plugins?.title?.text || ""}
                      onChange={(e) => handleConfigUpdate("plugins.title.text", e.target.value)}
                      placeholder="Chart Title"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Font Family</Label>
                      <Select
                        value={(chartConfig.plugins?.title?.font as any)?.family || "Arial"}
                        onValueChange={(value) => handleConfigUpdate("plugins.title.font.family", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Default" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times">Times New Roman</SelectItem>
                          <SelectItem value="Courier">Courier New</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                          <SelectItem value="Verdana">Verdana</SelectItem>
                          <SelectItem value="Impact">Impact</SelectItem>
                          <SelectItem value="Comic Sans MS">Comic Sans MS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Font Weight</Label>
                      <Select
                        value={(chartConfig.plugins?.title?.font as any)?.weight || "700"}
                        onValueChange={(value) => handleConfigUpdate("plugins.title.font.weight", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Light</SelectItem>
                          <SelectItem value="700">Normal</SelectItem>
                          <SelectItem value="800">Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Font Size</Label>
                    <Slider
                      value={[chartConfig.plugins?.title?.font?.size || 16]}
                      onValueChange={([value]) => handleConfigUpdate("plugins.title.font.size", value)}
                      max={48}
                      min={8}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">{chartConfig.plugins?.title?.font?.size || 16}px</div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Text Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={chartConfig.plugins?.title?.color || "#000000"}
                        onChange={(e) => handleConfigUpdate("plugins.title.color", e.target.value)}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={chartConfig.plugins?.title?.color || "#000000"}
                        onChange={(e) => handleConfigUpdate("plugins.title.color", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs font-medium">Alignment</Label>
                      <Select
                        value={(chartConfig.plugins?.title as any)?.align || "center"}
                        onValueChange={(value) => handleConfigUpdate("plugins.title.align", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Center" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="start">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="end">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs font-medium">Position</Label>
                      <Select
                        value={(chartConfig.plugins?.title as any)?.position || "top"}
                        onValueChange={(value) => handleConfigUpdate("plugins.title.position", value)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Top" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Padding</Label>
                    <Slider 
                      value={[(chartConfig.plugins?.title as any)?.padding || 10]} 
                      onValueChange={([value]) => handleConfigUpdate("plugins.title.padding", value)}
                      max={50} 
                      min={0} 
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">{(chartConfig.plugins?.title as any)?.padding || 10}px</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Subtitle Settings Card */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Type className="h-4 w-4" />
                Subtitle Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Show Subtitle</Label>
                <Switch
                  checked={chartConfig.plugins?.subtitle?.display || false}
                  onCheckedChange={(checked) => handleConfigUpdate("plugins.subtitle.display", checked)}
                />
              </div>

              {!chartConfig.plugins?.subtitle?.display && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Enable Chart Subtitle</strong> to add a secondary heading below your chart title. 
                    The subtitle appears right after the main title.
                  </p>
                </div>
              )}

              {chartConfig.plugins?.subtitle?.display && (
                <div>
                  <Label className="text-xs font-medium">Subtitle Text</Label>
                  <Input
                    value={chartConfig.plugins?.subtitle?.text || ""}
                    onChange={(e) => handleConfigUpdate("plugins.subtitle.text", e.target.value)}
                    placeholder="Custom Chart Subtitle"
                    className="h-8 text-xs"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Background Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <div>
                <Label className="text-xs font-medium">Background Type</Label>
                  <Select
                    value={(chartConfig as any)?.background?.type || "color"}
                    onValueChange={(value) => handleConfigUpdate("background.type", value)}
                  >
                  <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select background type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="transparent">Transparent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Color background */}
                {((chartConfig as any)?.background?.type === undefined || (chartConfig as any)?.background?.type === "color") && (
                  <div>
                  <Label className="text-xs font-medium">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color" 
                      value={((chartConfig as any)?.background?.color as string) || "#ffffff"}
                      onChange={(e) => handleConfigUpdate("background.color", e.target.value)}
                      className="w-12 h-8 rounded border"
                    />
                    <Input
                      value={((chartConfig as any)?.background?.color as string) || "#ffffff"}
                      onChange={(e) => handleConfigUpdate("background.color", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  </div>
                )}

                {/* Gradient background */}
                {(chartConfig as any)?.background?.type === "gradient" && (
                  <>
                    <div>
                    <Label className="text-xs font-medium">Gradient Type</Label>
                      <Select
                        value={((chartConfig as any)?.background?.gradientType as string) || "linear"}
                        onValueChange={(value) => handleConfigUpdate("background.gradientType", value)}
                      >
                      <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Linear" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="radial">Radial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                    <Label className="text-xs font-medium">Gradient Direction (for Linear)</Label>
                      <Select
                        value={((chartConfig as any)?.background?.gradientDirection as string) || "to right"}
                        onValueChange={(value) => handleConfigUpdate("background.gradientDirection", value)}
                        disabled={((chartConfig as any)?.background?.gradientType as string) === "radial"}
                      >
                      <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="to right" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="to right">Left → Right</SelectItem>
                          <SelectItem value="to left">Right → Left</SelectItem>
                          <SelectItem value="to bottom">Top → Bottom</SelectItem>
                          <SelectItem value="to top">Bottom → Top</SelectItem>
                          <SelectItem value="135deg">Diagonal (135°)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                    <Label className="text-xs font-medium">Gradient Colors</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={((chartConfig as any)?.background?.gradientColor1 as string) || "#ffffff"}
                          onChange={(e) => handleConfigUpdate("background.gradientColor1", e.target.value)}
                        className="h-8"
                        />
                        <Input
                          type="color"
                          value={((chartConfig as any)?.background?.gradientColor2 as string) || "#000000"}
                          onChange={(e) => handleConfigUpdate("background.gradientColor2", e.target.value)}
                        className="h-8"
                        />
                      </div>
                    </div>
                    <div>
                    <Label className="text-xs font-medium">Background Opacity</Label>
                      <Slider 
                        value={[((chartConfig as any)?.background?.opacity as number) || 100]} 
                        onValueChange={([value]) => handleConfigUpdate("background.opacity", value)}
                        max={100} 
                        min={0} 
                        step={1} 
                      />
                      <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.background?.opacity as number) || 100}%</div>
                    </div>
                  </>
                )}

                {(chartConfig as any)?.background?.type === "image" && (
                  <>
                    <div>
                    <Label className="text-xs font-medium">Image URL</Label>
                      <Input 
                        type="text" 
                        placeholder="Enter image URL"
                        value={((chartConfig as any)?.background?.imageUrl as string) || ""}
                        onChange={(e) => handleConfigUpdate("background.imageUrl", e.target.value)}
                      className="h-8 text-xs"
                      />
                    </div>
                    <div>
                    <Label className="text-xs font-medium">Upload Image</Label>
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              handleConfigUpdate("background.imageUrl", event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      className="h-8 text-xs"
                      />
                    </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">White background under image</Label>
                      <Switch
                        checked={((chartConfig as any)?.background?.imageWhiteBase ?? true)}
                        onCheckedChange={(checked) => handleConfigUpdate("background.imageWhiteBase", checked)}
                      />
                    </div>
                  <div>
                    <Label className="text-xs font-medium">Image Fit</Label>
                      <Select
                        value={((chartConfig as any)?.background?.imageFit as string) || "cover"}
                        onValueChange={(value) => handleConfigUpdate("background.imageFit", value)}
                      >
                      <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="cover" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover (crop)</SelectItem>
                          <SelectItem value="contain">Contain (fit inside)</SelectItem>
                          <SelectItem value="fill">Fill (stretch)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                    <Label className="text-xs font-medium">Image Opacity</Label>
                      <Slider 
                        value={[((chartConfig as any)?.background?.opacity as number) || 100]} 
                        onValueChange={([value]) => handleConfigUpdate("background.opacity", value)}
                        max={100} 
                        min={0} 
                        step={1} 
                      />
                      <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.background?.opacity as number) || 100}%</div>
                    </div>
                  </>
                )}

              </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                </svg>
                Chart Border
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Show Border</Label>
                <Switch 
                  checked={!!chartConfig.borderWidth && chartConfig.borderWidth > 0}
                  onCheckedChange={(checked) => handleConfigUpdate('borderWidth', checked ? 2 : 0)}
                />
              </div>

              {!chartConfig.borderWidth && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Enable Chart Border</strong> to add a decorative frame around your entire chart. 
                    You can customize the border color, width, and corner radius to match your design.
                  </p>
                </div>
              )}

              {!!chartConfig.borderWidth && (
                <>
                  <div>
                    <Label className="text-xs font-medium">Border Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={chartConfig.borderColor || "#000000"}
                        onChange={(e) => handleConfigUpdate("borderColor", e.target.value)}
                        className="w-12 h-8 rounded border cursor-pointer"
                      />
                      <Input
                        value={chartConfig.borderColor || "#000000"}
                        onChange={(e) => handleConfigUpdate("borderColor", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Border Width</Label>
                    <Slider 
                      value={[chartConfig.borderWidth || 0]} 
                      onValueChange={([value]) => handleConfigUpdate("borderWidth", value)}
                      max={20} 
                      min={0} 
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">{chartConfig.borderWidth || 0}px</div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Border Radius (Chart Container)</Label>
                    <Slider
                      value={[chartConfig.chartBorderRadius || 0]}
                      onValueChange={([value]) => handleConfigUpdate("chartBorderRadius", value)}
                      max={50}
                      min={0}
                      step={1}
                      className="mt-2"
                    />
                    <div className="text-xs text-gray-500 mt-1">{chartConfig.chartBorderRadius || 0}px</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legend" className="mt-4 space-y-3">
          <Card className="pt-4">
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Show Legend</Label>
                <Switch
                  checked={chartConfig.plugins?.legend?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("plugins.legend.display", checked)}
                />
              </div>

              {chartConfig.plugins?.legend?.display === false && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Enable Legend</strong> to display a color-coded key that helps viewers understand what each data series represents. 
                    You can customize the position, alignment, font styles, and choose between slice, dataset, or both legend types. 
                    Essential for charts with multiple datasets or categories.
                  </p>
                </div>
              )}

              {chartConfig.plugins?.legend?.display !== false && (
                <>
                  <div>
                    <Label className="text-xs font-medium">Legend Type</Label>
                    <Select
                      value={chartConfig.plugins?.legendType || "slice"}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
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
                          <SelectItem value="crossRot">Cross Rotated</SelectItem>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <SelectValue placeholder="lighter" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="400">Normal</SelectItem>
                          <SelectItem value="700">Bold</SelectItem>
                          <SelectItem value="800">Extra Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                    <Label className="text-xs font-medium">Box Width</Label>
                    <Slider 
                      value={[((chartConfig.plugins?.legend?.labels as any)?.boxWidth as number) || 40]} 
                      onValueChange={([value]: number[]) => {
                        // Update both the root level and labels level for compatibility
                        // handleConfigUpdate("plugins.legend.boxWidth", value);
                        handleConfigUpdate("plugins.legend.labels.boxWidth", value);
                      }}
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
                        onValueChange={([value]: number[]) => {
                          // Update both the root level and labels level for compatibility
                          //handleConfigUpdate("plugins.legend.boxHeight", value);
                          handleConfigUpdate("plugins.legend.labels.boxHeight", value);
                        }}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                        min="1" 
                        max="10" 
                        className="h-8 text-xs mt-2 md:mt-0"
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


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
            </CardContent>
          </Card>

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
