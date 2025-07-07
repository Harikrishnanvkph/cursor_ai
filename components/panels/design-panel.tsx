"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChartStore } from "@/lib/chart-store"
import { ImageIcon, Layers, Sparkles } from "lucide-react";
import { RadarPanel } from "./radar-panel"; // Added import for RadarPanel
import { PiePanel } from "./pie-panel"; // Added import for PiePanel

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

export function DesignPanel() {
  const { chartConfig, updateChartConfig, chartType } = useChartStore(); // Added chartType

  const handleConfigUpdate = (path: string, value: any) => {
    const newConfig = { ...chartConfig }
    const keys = path.split(".")
    let current: any = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {}
      }
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="title" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="title">Title</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="legend">Legend</TabsTrigger>
        </TabsList>

        <TabsContent value="title" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Chart Title
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

                  <div>
                    <Label className="text-xs font-medium">Subtitle</Label>
                    <Input 
                      value={chartConfig.plugins?.title?.subtitle || ""}
                      onChange={(e) => handleConfigUpdate("plugins.title.subtitle", e.target.value)}
                      placeholder="Chart Subtitle" 
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
                        className="w-12 h-8 rounded border"
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
                      <Label className="text-xs font-medium">Text Alignment</Label>
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
                    />
                    <div className="text-xs text-gray-500 mt-1">{(chartConfig.plugins?.title as any)?.padding || 10}px</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Text Shadow</Label>
                    <Switch
                      checked={!!(chartConfig.plugins?.title as any)?.shadow}
                      onCheckedChange={(checked) => handleConfigUpdate("plugins.title.shadow", checked ? {
                        color: 'rgba(0,0,0,0.2)',
                        blur: 4,
                        offsetX: 2,
                        offsetY: 2
                      } : false)}
                    />
                  </div>

                  {(chartConfig.plugins?.title as any)?.shadow && (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                      <div>
                        <Label className="text-xs font-medium">Shadow Color</Label>
                        <Input 
                          type="color" 
                          value={((chartConfig.plugins?.title as any)?.shadow?.color as string) || "rgba(0,0,0,0.2)"}
                          onChange={(e) => handleConfigUpdate("plugins.title.shadow.color", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <Label className="text-xs font-medium">Blur</Label>
                          <Slider 
                            value={[((chartConfig.plugins?.title as any)?.shadow?.blur as number) || 4]} 
                            onValueChange={([value]) => handleConfigUpdate("plugins.title.shadow.blur", value)}
                            max={20} 
                            min={0} 
                            step={1} 
                          />
                          <div className="text-xs text-gray-500 mt-1">{((chartConfig.plugins?.title as any)?.shadow?.blur as number) || 4}px</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Offset X</Label>
                          <Slider 
                            value={[((chartConfig.plugins?.title as any)?.shadow?.offsetX as number) || 2]} 
                            onValueChange={([value]) => handleConfigUpdate("plugins.title.shadow.offsetX", value)}
                            max={10} 
                            min={-10} 
                            step={1} 
                          />
                          <div className="text-xs text-gray-500 mt-1">{((chartConfig.plugins?.title as any)?.shadow?.offsetX as number) || 2}px</div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Offset Y</Label>
                          <Slider 
                            value={[((chartConfig.plugins?.title as any)?.shadow?.offsetY as number) || 2]} 
                            onValueChange={([value]) => handleConfigUpdate("plugins.title.shadow.offsetY", value)}
                            max={10} 
                            min={-10} 
                            step={1} 
                          />
                          <div className="text-xs text-gray-500 mt-1">{((chartConfig.plugins?.title as any)?.shadow?.offsetY as number) || 2}px</div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Text Outline</Label>
                    <Switch
                      checked={!!(chartConfig.plugins?.title as any)?.stroke}
                      onCheckedChange={(checked) => handleConfigUpdate("plugins.title.stroke", checked ? {
                        color: '#000000',
                        width: 1
                      } : false)}
                    />
                  </div>

                  {(chartConfig.plugins?.title as any)?.stroke && (
                    <div className="space-y-3 pt-2 border-t border-gray-200">
                  <div>
                        <Label className="text-xs font-medium">Outline Color</Label>
                        <Input 
                          type="color" 
                          value={((chartConfig.plugins?.title as any)?.stroke?.color as string) || "#000000"}
                          onChange={(e) => handleConfigUpdate("plugins.title.stroke.color", e.target.value)}
                          className="h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Outline Width</Label>
                        <Slider 
                          value={[((chartConfig.plugins?.title as any)?.stroke?.width as number) || 1]} 
                          onValueChange={([value]) => handleConfigUpdate("plugins.title.stroke.width", value)}
                          max={5} 
                          min={0.5} 
                          step={0.5} 
                        />
                        <div className="text-xs text-gray-500 mt-1">{((chartConfig.plugins?.title as any)?.stroke?.width as number) || 1}px</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Text Rotation</Label>
                    <Switch
                      checked={!!(chartConfig.plugins?.title as any)?.rotation}
                      onCheckedChange={(checked) => handleConfigUpdate("plugins.title.rotation", checked ? 0 : false)}
                    />
                  </div>

                  {(chartConfig.plugins?.title as any)?.rotation !== false && (
                    <div className="pt-2 border-t border-gray-200">
                      <Label className="text-xs font-medium">Rotation Angle</Label>
                    <Slider 
                      value={[(chartConfig.plugins?.title as any)?.rotation || 0]} 
                      onValueChange={([value]) => handleConfigUpdate("plugins.title.rotation", value)}
                      max={360} 
                      min={-360} 
                      step={15} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{(chartConfig.plugins?.title as any)?.rotation || 0}°</div>
                  </div>
                  )}
                </>
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

              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Transparent Background</Label>
                <Switch
                  checked={chartConfig.backgroundColor === "transparent"}
                  onCheckedChange={(checked) => handleConfigUpdate("backgroundColor", checked ? "transparent" : "#ffffff")}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Chart Border</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Show Border</Label>
                <Switch 
                  checked={!!chartConfig.borderWidth}
                  onCheckedChange={(checked) => handleConfigUpdate('borderWidth', checked ? 1 : 0)}
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Border Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.borderColor || "#000000"}
                    onChange={(e) => handleConfigUpdate("borderColor", e.target.value)}
                    className="w-12 h-8 rounded border"
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
                  max={10} 
                  min={0} 
                  step={1} 
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.borderWidth || 0}px</div>
              </div>

              <div>
                <Label className="text-xs font-medium">Border Style</Label>
                <Select>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Solid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                    <SelectItem value="double">Double</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Border Radius</Label>
                <Slider
                  value={[chartConfig.borderRadius || 0]}
                  onValueChange={([value]) => handleConfigUpdate("borderRadius", value)}
                  max={20}
                  min={0}
                  step={1}
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.borderRadius || 0}px</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legend" className="mt-4 space-y-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Legend Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Show Legend</Label>
                <Switch
                  checked={chartConfig.plugins?.legend?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("plugins.legend.display", checked)}
                />
              </div>

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

                  <div>
                    <Label className="text-xs font-medium">Legend Position</Label>
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
                    <Label className="text-xs font-medium">Legend Alignment</Label>
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
                    <Slider 
                      value={[((chartConfig.plugins?.legend?.labels as any)?.font?.size as number) || 12]} 
                      onValueChange={([value]: number[]) => {
                        // Update both font size properties for compatibility
                        handleConfigUpdate("plugins.legend.labels.font.size", value);
                      }}
                      max={24} 
                      min={8} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {((chartConfig.plugins?.legend?.labels as any)?.font?.size as number) || 12}px
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
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      {((chartConfig.plugins?.legend?.labels as any)?.boxHeight as number) || 12}px
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Padding</Label>
                    <Slider 
                      value={[((chartConfig.plugins?.legend?.labels as any)?.padding as number) || 10]} 
                      onValueChange={([value]: number[]) => handleConfigUpdate("plugins.legend.labels.padding", value)}
                      max={50} 
                      min={0} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig.plugins?.legend?.labels as any)?.padding as number) || 10}px</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Reverse Order</Label>
                    <Switch
                      checked={!!(chartConfig.plugins?.legend as any)?.reverse}
                      onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.reverse", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Use Point Style</Label>
                    <Switch
                      checked={!!(chartConfig.plugins?.legend?.labels as any)?.usePointStyle}
                      onCheckedChange={(checked: boolean) => {
                        handleConfigUpdate("plugins.legend.labels.usePointStyle", checked);
                        // Also update the pointStyle to a default if enabling
                        if (checked && !(chartConfig.plugins?.legend?.labels as any)?.pointStyle) {
                          handleConfigUpdate("plugins.legend.labels.pointStyle", "circle");
                        }
                      }}
                    />
                  </div>

                  <div>
                    <Label className="text-xs font-medium">Point Style</Label>
                    <Select
                      value={((chartConfig.plugins?.legend?.labels as any)?.pointStyle as string) || "circle"}
                      onValueChange={(value: string) => handleConfigUpdate("plugins.legend.labels.pointStyle", value)}
                      disabled={!(chartConfig.plugins?.legend?.labels as any)?.usePointStyle}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Circle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="cross">Cross</SelectItem>
                        <SelectItem value="rect">Rectangle</SelectItem>
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

                  <div>
                    <Label className="text-xs font-medium">Max Columns</Label>
                    <Input 
                      type="number" 
                      value={((chartConfig.plugins?.legend as any)?.maxColumns as number) || 1}
                      onChange={(e) => handleConfigUpdate("plugins.legend.maxColumns", parseInt(e.target.value))}
                      min="1" 
                      max="10" 
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Full Size</Label>
                    <Switch
                      checked={!!(chartConfig.plugins?.legend as any)?.fullSize}
                      onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.fullSize", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">RTL (Right to Left)</Label>
                    <Switch
                      checked={!!(chartConfig.plugins?.legend as any)?.rtl}
                      onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.rtl", checked)}
                    />
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
