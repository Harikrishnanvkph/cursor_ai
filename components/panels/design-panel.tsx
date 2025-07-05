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
    <div className="space-y-6">
      <Tabs defaultValue="title" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="title">Title</TabsTrigger>
          <TabsTrigger value="background">Background</TabsTrigger>
          <TabsTrigger value="legend">Legend</TabsTrigger>
          <TabsTrigger value="effects">Effects</TabsTrigger>
        </TabsList>

        <TabsContent value="title" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Chart Title
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.plugins?.title?.display || false}
                  onCheckedChange={(checked) => handleConfigUpdate("plugins.title.display", checked)}
                />
                <Label>Show Title</Label>
              </div>

              {chartConfig.plugins?.title?.display && (
                <>
                  <div>
                    <Label>Title Text</Label>
                    <Input
                      value={chartConfig.plugins?.title?.text || ""}
                      onChange={(e) => handleConfigUpdate("plugins.title.text", e.target.value)}
                      placeholder="Chart Title"
                    />
                  </div>

                  <div>
                    <Label>Subtitle</Label>
                    <Input placeholder="Chart Subtitle" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Font Family</Label>
                      <Select
                        value={(chartConfig.plugins?.title?.font as any)?.family || "Arial"}
                        onValueChange={(value) => handleConfigUpdate("plugins.title.font.family", value)}
                      >
                        <SelectTrigger>
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
                      <Label>Font Weight</Label>
                      <Select
                        value={(chartConfig.plugins?.title?.font as any)?.weight || "400"}
                        onValueChange={(value) => handleConfigUpdate("plugins.title.font.weight", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Normal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="100">Thin</SelectItem>
                          <SelectItem value="200">Extra Light</SelectItem>
                          <SelectItem value="300">Light</SelectItem>
                          <SelectItem value="400">Normal</SelectItem>
                          <SelectItem value="500">Medium</SelectItem>
                          <SelectItem value="600">Semi Bold</SelectItem>
                          <SelectItem value="700">Bold</SelectItem>
                          <SelectItem value="800">Extra Bold</SelectItem>
                          <SelectItem value="900">Black</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Font Size</Label>
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
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={chartConfig.plugins?.title?.color || "#000000"}
                        onChange={(e) => handleConfigUpdate("plugins.title.color", e.target.value)}
                        className="w-12 h-10 rounded border"
                      />
                      <Input
                        value={chartConfig.plugins?.title?.color || "#000000"}
                        onChange={(e) => handleConfigUpdate("plugins.title.color", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Text Alignment</Label>
                    <Select
                      value={(chartConfig.plugins?.title as any)?.align || "center"}
                      onValueChange={(value) => handleConfigUpdate("plugins.title.align", value)}
                    >
                      <SelectTrigger>
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
                    <Label>Position</Label>
                    <Select
                      value={(chartConfig.plugins?.title as any)?.position || "top"}
                      onValueChange={(value) => handleConfigUpdate("plugins.title.position", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Top" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Top</SelectItem>
                        <SelectItem value="bottom">Bottom</SelectItem>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Padding</Label>
                    <Slider 
                      value={[(chartConfig.plugins?.title as any)?.padding || 10]} 
                      onValueChange={([value]) => handleConfigUpdate("plugins.title.padding", value)}
                      max={50} 
                      min={0} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{(chartConfig.plugins?.title as any)?.padding || 10}px</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!(chartConfig.plugins?.title as any)?.shadow}
                      onCheckedChange={(checked) => handleConfigUpdate("plugins.title.shadow", checked ? {
                        color: 'rgba(0,0,0,0.2)',
                        blur: 4,
                        offsetX: 2,
                        offsetY: 2
                      } : false)}
                    />
                    <Label>Text Shadow</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!(chartConfig.plugins?.title as any)?.stroke}
                      onCheckedChange={(checked) => handleConfigUpdate("plugins.title.stroke", checked ? {
                        color: '#000000',
                        width: 1
                      } : false)}
                    />
                    <Label>Text Outline</Label>
                  </div>

                  <div>
                    <Label>Text Rotation</Label>
                    <Slider 
                      value={[(chartConfig.plugins?.title as any)?.rotation || 0]} 
                      onValueChange={([value]) => handleConfigUpdate("plugins.title.rotation", value)}
                      max={360} 
                      min={-360} 
                      step={15} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{(chartConfig.plugins?.title as any)?.rotation || 0}°</div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="background" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chart Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Background Type</Label>
                  <Select
                    value={(chartConfig as any)?.background?.type || "color"}
                    onValueChange={(value) => handleConfigUpdate("background.type", value)}
                  >
                    <SelectTrigger>
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
                    <Label>Background Color</Label>
                    <Input 
                      type="color" 
                      value={((chartConfig as any)?.background?.color as string) || "#ffffff"}
                      onChange={(e) => handleConfigUpdate("background.color", e.target.value)}
                    />
                  </div>
                )}

                {/* Gradient background */}
                {(chartConfig as any)?.background?.type === "gradient" && (
                  <>
                    <div>
                      <Label>Gradient Type</Label>
                      <Select
                        value={((chartConfig as any)?.background?.gradientType as string) || "linear"}
                        onValueChange={(value) => handleConfigUpdate("background.gradientType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Linear" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="radial">Radial</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Gradient Direction (for Linear)</Label>
                      <Select
                        value={((chartConfig as any)?.background?.gradientDirection as string) || "to right"}
                        onValueChange={(value) => handleConfigUpdate("background.gradientDirection", value)}
                        disabled={((chartConfig as any)?.background?.gradientType as string) === "radial"}
                      >
                        <SelectTrigger>
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
                      <Label>Gradient Colors</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={((chartConfig as any)?.background?.gradientColor1 as string) || "#ffffff"}
                          onChange={(e) => handleConfigUpdate("background.gradientColor1", e.target.value)}
                        />
                        <Input
                          type="color"
                          value={((chartConfig as any)?.background?.gradientColor2 as string) || "#000000"}
                          onChange={(e) => handleConfigUpdate("background.gradientColor2", e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Background Opacity</Label>
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
                      <Label>Image URL</Label>
                      <Input 
                        type="text" 
                        placeholder="Enter image URL"
                        value={((chartConfig as any)?.background?.imageUrl as string) || ""}
                        onChange={(e) => handleConfigUpdate("background.imageUrl", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Upload Image</Label>
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
                      />
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <Switch
                        checked={((chartConfig as any)?.background?.imageWhiteBase ?? true)}
                        onCheckedChange={(checked) => handleConfigUpdate("background.imageWhiteBase", checked)}
                      />
                      <Label>White background under image</Label>
                    </div>
                    <div className="mt-2">
                      <Label>Image Fit</Label>
                      <Select
                        value={((chartConfig as any)?.background?.imageFit as string) || "cover"}
                        onValueChange={(value) => handleConfigUpdate("background.imageFit", value)}
                      >
                        <SelectTrigger>
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
                      <Label>Image Opacity</Label>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Chart Border</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={!!chartConfig.borderWidth}
                  onCheckedChange={(checked) => handleConfigUpdate('borderWidth', checked ? 1 : 0)}
                />
                <Label>Show Border</Label>
              </div>

              <div>
                <Label>Border Width</Label>
                <Slider 
                  value={[chartConfig.borderWidth || 0]} 
                  onValueChange={([value]) => handleConfigUpdate('borderWidth', value)}
                  max={10} 
                  min={0} 
                  step={1} 
                />
              </div>

              <div>
                <Label>Border Color</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="color" 
                    value={chartConfig.borderColor || '#cccccc'}
                    onChange={(e) => handleConfigUpdate('borderColor', e.target.value)}
                    className="w-16 h-8 p-1"
                  />
                  <Input 
                    value={chartConfig.borderColor || '#cccccc'}
                    onChange={(e) => handleConfigUpdate('borderColor', e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Border Style</Label>
                <Select>
                  <SelectTrigger>
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
                <Label>Border Radius</Label>
                <Slider defaultValue={[0]} max={50} min={0} step={1} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Layers className="h-4 w-4" />
                Legend Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.plugins?.legend?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("plugins.legend.display", checked)}
                />
                <Label>Show Legend</Label>
              </div>

              {chartConfig.plugins?.legend?.display !== false && (
                <>
                  <div>
                    <Label>Legend Type</Label>
                    <Select
                      value={chartConfig.plugins?.legendType || "slice"}
                      onValueChange={(value) => handleConfigUpdate("plugins.legendType", value)}
                    >
                      <SelectTrigger>
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
                    <Label>Position</Label>
                    <Select
                      value={chartConfig.plugins?.legend?.position || "top"}
                      onValueChange={(value) => handleConfigUpdate("plugins.legend.position", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <Label>Alignment</Label>
                    <Select
                      value={((chartConfig.plugins?.legend as any)?.align as string) || "center"}
                      onValueChange={(value: string) => handleConfigUpdate("plugins.legend.align", value)}
                    >
                      <SelectTrigger>
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
                    <Label>Orientation</Label>
                    <Select
                      value={((chartConfig.plugins?.legend as any)?.orientation as string) || "horizontal"}
                      onValueChange={(value: string) => handleConfigUpdate("plugins.legend.orientation", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Horizontal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="horizontal">Horizontal</SelectItem>
                        <SelectItem value="vertical">Vertical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Font Size</Label>
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
                    <Label>Font Color</Label>
                    <Input 
                      type="color" 
                      value={((chartConfig.plugins?.legend?.labels as any)?.color as string) || "#000000"}
                      onChange={(e) => {
                        handleConfigUpdate("plugins.legend.labels.color", e.target.value);
                      }}
                    />
                  </div>

                  <div>
                    <Label>Font Family</Label>
                    <Select
                      value={((chartConfig.plugins?.legend?.labels as any)?.font?.family as string) || "Arial"}
                      onValueChange={(value: string) => handleConfigUpdate("plugins.legend.labels.font.family", value)}
                    >
                      <SelectTrigger>
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
                    <Label>Font Weight</Label>
                    <Select
                      value={((chartConfig.plugins?.legend?.labels as any)?.font?.weight as string) || "400"}
                      onValueChange={(value: string) => handleConfigUpdate("plugins.legend.labels.font.weight", value)}
                    >
                      <SelectTrigger>
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
                    <Label>Box Width</Label>
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
                    <Label>Box Height</Label>
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
                    <Label>Padding</Label>
                    <Slider 
                      value={[((chartConfig.plugins?.legend?.labels as any)?.padding as number) || 10]} 
                      onValueChange={([value]: number[]) => handleConfigUpdate("plugins.legend.labels.padding", value)}
                      max={50} 
                      min={0} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig.plugins?.legend?.labels as any)?.padding as number) || 10}px</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!(chartConfig.plugins?.legend as any)?.reverse}
                      onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.reverse", checked)}
                    />
                    <Label>Reverse Order</Label>
                  </div>

                  <div className="flex items-center space-x-2">
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
                    <Label>Use Point Style</Label>
                  </div>

                  <div>
                    <Label>Point Style</Label>
                    <Select
                      value={((chartConfig.plugins?.legend?.labels as any)?.pointStyle as string) || "circle"}
                      onValueChange={(value: string) => handleConfigUpdate("plugins.legend.labels.pointStyle", value)}
                      disabled={!(chartConfig.plugins?.legend?.labels as any)?.usePointStyle}
                    >
                      <SelectTrigger>
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
                    <Label>Max Columns</Label>
                    <Input 
                      type="number" 
                      value={((chartConfig.plugins?.legend as any)?.maxColumns as number) || 1}
                      onChange={(e) => handleConfigUpdate("plugins.legend.maxColumns", parseInt(e.target.value))}
                      min="1" 
                      max="10" 
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!(chartConfig.plugins?.legend as any)?.fullSize}
                      onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.fullSize", checked)}
                    />
                    <Label>Full Size</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={!!(chartConfig.plugins?.legend as any)?.rtl}
                      onCheckedChange={(checked: boolean) => handleConfigUpdate("plugins.legend.rtl", checked)}
                    />
                    <Label>RTL (Right to Left)</Label>
                  </div>

                  <div>
                    <Label>Text Direction</Label>
                    <Select
                      value={((chartConfig.plugins?.legend as any)?.textDirection as string) || "ltr"}
                      onValueChange={(value: string) => handleConfigUpdate("plugins.legend.textDirection", value)}
                    >
                      <SelectTrigger>
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


        </TabsContent>

        <TabsContent value="effects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Visual Effects</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!(chartConfig as any)?.shadow}
                  onCheckedChange={(checked) => handleConfigUpdate("shadow", checked ? {
                    blur: 10,
                    color: 'rgba(0,0,0,0.2)',
                    offsetX: 0,
                    offsetY: 0
                  } : false)}
                />
                <Label>Drop Shadow</Label>
              </div>

              {(chartConfig as any)?.shadow && (
                <>
                  <div>
                    <Label>Shadow Blur</Label>
                    <Slider 
                      value={[((chartConfig as any)?.shadow?.blur as number) || 10]} 
                      onValueChange={([value]) => handleConfigUpdate("shadow.blur", value)}
                      max={20} 
                      min={0} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.shadow?.blur as number) || 10}px</div>
                  </div>

                  <div>
                    <Label>Shadow Color</Label>
                    <Input 
                      type="color" 
                      value={((chartConfig as any)?.shadow?.color as string) || "rgba(0,0,0,0.2)"}
                      onChange={(e) => handleConfigUpdate("shadow.color", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Shadow Offset X</Label>
                    <Slider 
                      value={[((chartConfig as any)?.shadow?.offsetX as number) || 0]} 
                      onValueChange={([value]) => handleConfigUpdate("shadow.offsetX", value)}
                      max={20} 
                      min={-20} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.shadow?.offsetX as number) || 0}px</div>
                  </div>

                  <div>
                    <Label>Shadow Offset Y</Label>
                    <Slider 
                      value={[((chartConfig as any)?.shadow?.offsetY as number) || 0]} 
                      onValueChange={([value]) => handleConfigUpdate("shadow.offsetY", value)}
                      max={20} 
                      min={-20} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.shadow?.offsetY as number) || 0}px</div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!(chartConfig as any)?.glow}
                  onCheckedChange={(checked) => handleConfigUpdate("glow", checked ? {
                    color: '#ffffff',
                    intensity: 5
                  } : false)}
                />
                <Label>Glow Effect</Label>
              </div>

              {(chartConfig as any)?.glow && (
                <>
                  <div>
                    <Label>Glow Color</Label>
                    <Input 
                      type="color" 
                      value={((chartConfig as any)?.glow?.color as string) || "#ffffff"}
                      onChange={(e) => handleConfigUpdate("glow.color", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Glow Intensity</Label>
                    <Slider 
                      value={[((chartConfig as any)?.glow?.intensity as number) || 5]} 
                      onValueChange={([value]) => handleConfigUpdate("glow.intensity", value)}
                      max={10} 
                      min={0} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.glow?.intensity as number) || 5}</div>
                  </div>
                </>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!(chartConfig as any)?.threeD}
                  onCheckedChange={(checked) => handleConfigUpdate("threeD", checked ? {
                    depth: 20
                  } : false)}
                />
                <Label>3D Effect</Label>
              </div>

              {(chartConfig as any)?.threeD && (
                <div>
                  <Label>3D Depth</Label>
                  <Slider 
                    value={[((chartConfig as any)?.threeD?.depth as number) || 20]} 
                    onValueChange={([value]) => handleConfigUpdate("threeD.depth", value)}
                    max={50} 
                    min={0} 
                    step={1} 
                  />
                  <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.threeD?.depth as number) || 20}px</div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!(chartConfig as any)?.blur}
                  onCheckedChange={(checked) => handleConfigUpdate("blur", checked ? {
                    amount: 5
                  } : false)}
                />
                <Label>Blur Background</Label>
              </div>

              {(chartConfig as any)?.blur && (
                <div>
                  <Label>Blur Amount</Label>
                  <Slider 
                    value={[((chartConfig as any)?.blur?.amount as number) || 5]} 
                    onValueChange={([value]) => handleConfigUpdate("blur.amount", value)}
                    max={10} 
                    min={0} 
                    step={1} 
                  />
                  <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.blur?.amount as number) || 5}px</div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={!!(chartConfig as any)?.noise}
                  onCheckedChange={(checked) => handleConfigUpdate("noise", checked ? {
                    intensity: 50
                  } : false)}
                />
                <Label>Noise Texture</Label>
              </div>

              {(chartConfig as any)?.noise && (
                <div>
                  <Label>Noise Intensity</Label>
                  <Slider 
                    value={[((chartConfig as any)?.noise?.intensity as number) || 50]} 
                    onValueChange={([value]) => handleConfigUpdate("noise.intensity", value)}
                    max={100} 
                    min={0} 
                    step={1} 
                  />
                  <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.noise?.intensity as number) || 50}%</div>
                </div>
              )}

              <div>
                <Label>Filter Effects</Label>
                <Select
                  value={((chartConfig as any)?.filter?.type as string) || "none"}
                  onValueChange={(value) => handleConfigUpdate("filter.type", value)}
                >
                  <SelectTrigger>
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
                  <Label>Filter Intensity</Label>
                  <Slider 
                    value={[((chartConfig as any)?.filter?.intensity as number) || 100]} 
                    onValueChange={([value]) => handleConfigUpdate("filter.intensity", value)}
                    max={200} 
                    min={0} 
                    step={1} 
                  />
                  <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.filter?.intensity as number) || 100}%</div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Watermark</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
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
                />
                <Label>Show Watermark</Label>
              </div>

              {(chartConfig as any)?.watermark && (
                <>
                  <div>
                    <Label>Watermark Text</Label>
                    <Input 
                      placeholder="Your watermark text"
                      value={((chartConfig as any)?.watermark?.text as string) || ""}
                      onChange={(e) => handleConfigUpdate("watermark.text", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Watermark Position</Label>
                    <Select
                      value={((chartConfig as any)?.watermark?.position as string) || "bottom-right"}
                      onValueChange={(value) => handleConfigUpdate("watermark.position", value)}
                    >
                      <SelectTrigger>
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

                  <div>
                    <Label>Watermark Opacity</Label>
                    <Slider 
                      value={[((chartConfig as any)?.watermark?.opacity as number) || 30]} 
                      onValueChange={([value]) => handleConfigUpdate("watermark.opacity", value)}
                      max={100} 
                      min={0} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.watermark?.opacity as number) || 30}%</div>
                  </div>

                  <div>
                    <Label>Watermark Size</Label>
                    <Slider 
                      value={[((chartConfig as any)?.watermark?.size as number) || 12]} 
                      onValueChange={([value]) => handleConfigUpdate("watermark.size", value)}
                      max={48} 
                      min={8} 
                      step={1} 
                    />
                    <div className="text-xs text-gray-500 mt-1">{((chartConfig as any)?.watermark?.size as number) || 12}px</div>
                  </div>

                  <div>
                    <Label>Watermark Color</Label>
                    <Input 
                      type="color" 
                      value={((chartConfig as any)?.watermark?.color as string) || "#cccccc"}
                      onChange={(e) => handleConfigUpdate("watermark.color", e.target.value)}
                    />
                  </div>

                  <div>
                    <Label>Watermark Image URL</Label>
                    <Input 
                      placeholder="https://example.com/logo.png"
                      value={((chartConfig as any)?.watermark?.imageUrl as string) || ""}
                      onChange={(e) => handleConfigUpdate("watermark.imageUrl", e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
