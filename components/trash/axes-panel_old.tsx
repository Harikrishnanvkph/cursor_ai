"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChartStore } from "@/lib/chart-store"
import { BarChart2, Grid, Ruler, Target } from "lucide-react";
import { RadarPanel } from "../panels/radar-panel";
import { PiePanel } from "../panels/pie-panel";
import { PolarAreaPanel } from "../panels/polar-area-panel";

export function AxesPanel() {
  const { chartConfig, updateChartConfig, chartType } = useChartStore()

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

  // Handle radar and pie first
  if (chartType === 'radar') {
    return <RadarPanel />;
  }

  if (chartType === 'polarArea') {
    return <PolarAreaPanel />;
  }

  if (chartType === 'pie' || chartType === 'doughnut') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pie/Doughnut Structural Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="startAngle">Start Angle (degrees)</Label>
            <Input
              id="startAngle"
              type="number"
              value={chartConfig.startAngle ?? 0}
              onChange={(e) => handleConfigUpdate("startAngle", parseInt(e.target.value, 10))}
              placeholder="0"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Angle where the first slice begins (e.g., 0 for 3 o'clock, -90 for 12 o'clock).</p>
          </div>
          <div>
            <Label htmlFor="circumference">Circumference (degrees)</Label>
            <Input
              id="circumference"
              type="number"
              value={chartConfig.circumference ?? 360}
              onChange={(e) => handleConfigUpdate("circumference", parseInt(e.target.value, 10))}
              placeholder="360"
              min="0"
              max="360"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">Total angle of the chart (e.g., 360 for full circle, 180 for semi-circle).</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartType === 'stackedBar') {
    // Show y axis stacked as always enabled and disabled
    return (
      <Card><CardHeader><CardTitle>Axes</CardTitle></CardHeader><CardContent>
        <div className="flex items-center space-x-2">
          <Switch checked disabled />
          <Label>Stacked (Always On for Stacked Bar)</Label>
        </div>
      </CardContent></Card>
    );
  }

  // Only show axes for chart types that support them (Cartesian)
  const supportsCartesianAxes = ["bar", "line", "scatter", "bubble"].includes(chartType)

  if (!supportsCartesianAxes) {
    return (
      <div className="space-y-6">
        <div className="text-center text-gray-500 py-8">
          <BarChart2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Specific axes configuration is not available or not applicable for '{chartType}' charts.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="x-axis" className="w-full">
        <TabsList className="grid w-full grid-cols-4 text-xs">
          <TabsTrigger value="x-axis">X-Axis</TabsTrigger>
          <TabsTrigger value="y-axis">Y-Axis</TabsTrigger>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="ticks">Ticks</TabsTrigger>
        </TabsList>

        <TabsContent value="x-axis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                X-Axis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.display", checked)}
                />
                <Label>Show X-Axis</Label>
              </div>

              <div>
                <Label>Axis Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Linear" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="logarithmic">Logarithmic</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="timeseries">Time Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Position</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Bottom" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bottom">Bottom</SelectItem>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={chartConfig.scales?.x?.title?.text || ""}
                  onChange={(e) => handleConfigUpdate("scales.x.title.text", e.target.value)}
                  placeholder="X-Axis Title"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.title?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.title.display", checked)}
                />
                <Label>Show Title</Label>
              </div>

              <div>
                <Label>Title Font Size</Label>
                <Slider
                  value={[chartConfig.scales?.x?.title?.font?.size || 12]}
                  onValueChange={([value]) => handleConfigUpdate("scales.x.title.font.size", value)}
                  max={24}
                  min={8}
                  step={1}
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.x?.title?.font?.size || 12}px</div>
              </div>

              <div>
                <Label>Title Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.scales?.x?.title?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.x.title.color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={chartConfig.scales?.x?.title?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.x.title.color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Axis Line Width</Label>
                <Slider
                  value={[chartConfig.scales?.x?.border?.width || 1]}
                  onValueChange={([value]) => handleConfigUpdate("scales.x.border.width", value)}
                  max={10}
                  min={0}
                  step={1}
                />
              </div>

              <div>
                <Label>Axis Line Color</Label>
                <Input
                  type="color"
                  value={chartConfig.scales?.x?.border?.color || "#e5e7eb"}
                  onChange={(e) => handleConfigUpdate("scales.x.border.color", e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Reverse Axis</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Stacked</Label>
              </div>

              <div>
                <Label>Offset</Label>
                <Switch />
              </div>

              <div>
                <Label>Weight</Label>
                <Slider defaultValue={[1]} max={10} min={0} step={1} />
              </div>

              <div>
                <Label>Axis Bounds</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="ticks">Ticks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Grace</Label>
                <Input type="number" placeholder="0" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="y-axis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Ruler className="h-4 w-4 rotate-90" />
                Y-Axis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.display", checked)}
                />
                <Label>Show Y-Axis</Label>
              </div>

              <div>
                <Label>Axis Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Linear" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="logarithmic">Logarithmic</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                    <SelectItem value="time">Time</SelectItem>
                    <SelectItem value="timeseries">Time Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Position</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Left" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={chartConfig.scales?.y?.title?.text || ""}
                  onChange={(e) => handleConfigUpdate("scales.y.title.text", e.target.value)}
                  placeholder="Y-Axis Title"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.title?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.title.display", checked)}
                />
                <Label>Show Title</Label>
              </div>

              <div>
                <Label>Title Font Size</Label>
                <Slider
                  value={[chartConfig.scales?.y?.title?.font?.size || 12]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.title.font.size", value)}
                  max={24}
                  min={8}
                  step={1}
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.y?.title?.font?.size || 12}px</div>
              </div>

              <div>
                <Label>Title Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.scales?.y?.title?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.y.title.color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={chartConfig.scales?.y?.title?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.y.title.color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Axis Line Width</Label>
                <Slider
                  value={[chartConfig.scales?.y?.border?.width || 1]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.border.width", value)}
                  max={10}
                  min={0}
                  step={1}
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.y?.border?.width || 1}px</div>
              </div>

              <div>
                <Label>Axis Line Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.scales?.y?.border?.color || "#e5e7eb"}
                    onChange={(e) => handleConfigUpdate("scales.y.border.color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={chartConfig.scales?.y?.border?.color || "#e5e7eb"}
                    onChange={(e) => handleConfigUpdate("scales.y.border.color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Value</Label>
                  <Input
                    type="number"
                    value={chartConfig.scales?.y?.min || ""}
                    onChange={(e) =>
                      handleConfigUpdate("scales.y.min", e.target.value ? Number.parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Auto"
                  />
                </div>

                <div>
                  <Label>Max Value</Label>
                  <Input
                    type="number"
                    value={chartConfig.scales?.y?.max || ""}
                    onChange={(e) =>
                      handleConfigUpdate("scales.y.max", e.target.value ? Number.parseFloat(e.target.value) : undefined)
                    }
                    placeholder="Auto"
                  />
                </div>
              </div>

              <div>
                <Label>Suggested Min</Label>
                <Input type="number" placeholder="Auto" />
              </div>

              <div>
                <Label>Suggested Max</Label>
                <Input type="number" placeholder="Auto" />
              </div>

              <div>
                <Label>Step Size</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.stepSize || ""}
                  onChange={(e) =>
                    handleConfigUpdate("scales.y.stepSize", e.target.value ? Number(e.target.value) : undefined)
                  }
                  placeholder="Auto"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.beginAtZero || false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.beginAtZero", checked)}
                />
                <Label>Begin at Zero</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.reverse || false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.reverse", checked)}
                />
                <Label>Reverse Axis</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.stacked || false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.stacked", checked)}
                />
                <Label>Stacked</Label>
              </div>

              <div>
                <Label>Offset</Label>
                <Switch
                  checked={chartConfig.scales?.y?.offset || false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.offset", checked)}
                />
              </div>

              <div>
                <Label>Weight</Label>
                <Slider
                  value={[chartConfig.scales?.y?.weight || 1]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.weight", value)}
                  max={10}
                  min={0}
                  step={1}
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.y?.weight || 1}</div>
              </div>

              <div>
                <Label>Axis Bounds</Label>
                <Select
                  value={chartConfig.scales?.y?.bounds || 'data'}
                  onValueChange={(value) => handleConfigUpdate("scales.y.bounds", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Data" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="ticks">Ticks</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Grace</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.grace || ""}
                  onChange={(e) => handleConfigUpdate("scales.y.grace", e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="0"
                />
              </div>

              <div>
                <Label>Alignment</Label>
                <Select
                  value={chartConfig.scales?.y?.alignToPixels ? "pixel" : "center"}
                  onValueChange={(value) => handleConfigUpdate("scales.y.alignToPixels", value === "pixel")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                    <SelectItem value="pixel">Pixel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Axis ID</Label>
                <Input 
                  value={chartConfig.scales?.y?.id || "y"}
                  onChange={(e) => handleConfigUpdate("scales.y.id", e.target.value)}
                  placeholder="y" 
                />
              </div>
              <div>
                <Label>Group ID</Label>
                <Input 
                  value={chartConfig.scales?.y?.group || ""}
                  onChange={(e) => handleConfigUpdate("scales.y.group", e.target.value)}
                  placeholder="default" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Grid className="h-4 w-4" />
                Grid Lines Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 font-medium mb-1">✅ Clean Grid Lines</p>
                <p className="text-xs text-green-600">
                  Grid lines are configured to appear within the chart area but stop exactly at the axis lines,
                  preventing them from extending into the tick area and creating a cleaner appearance.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.grid?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.grid.display", checked)}
                />
                <Label>Show X-Grid Lines</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.grid?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.grid.display", checked)}
                />
                <Label>Show Y-Grid Lines</Label>
              </div>

              <div>
                <Label>X-Grid Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.scales?.x?.grid?.color || "#e5e7eb"}
                    onChange={(e) => handleConfigUpdate("scales.x.grid.color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={chartConfig.scales?.x?.grid?.color || "#e5e7eb"}
                    onChange={(e) => handleConfigUpdate("scales.x.grid.color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Y-Grid Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.scales?.y?.grid?.color || "#e5e7eb"}
                    onChange={(e) => handleConfigUpdate("scales.y.grid.color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={chartConfig.scales?.y?.grid?.color || "#e5e7eb"}
                    onChange={(e) => handleConfigUpdate("scales.y.grid.color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>X-Grid Line Width</Label>
                <Slider
                  value={[chartConfig.scales?.x?.grid?.lineWidth || 1]}
                  onValueChange={([value]) => handleConfigUpdate("scales.x.grid.lineWidth", value)}
                  max={5}
                  min={0}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Y-Grid Line Width</Label>
                <Slider
                  value={[chartConfig.scales?.y?.grid?.lineWidth || 1]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.grid.lineWidth", value)}
                  max={5}
                  min={0}
                  step={0.5}
                />
              </div>

              <div>
                <Label>Grid Line Dash Pattern</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Solid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed [5,5]</SelectItem>
                    <SelectItem value="dotted">Dotted [2,2]</SelectItem>
                    <SelectItem value="dashdot">Dash-Dot [5,2,2,2]</SelectItem>
                    <SelectItem value="longdash">Long Dash [10,5]</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.grid?.drawOnChartArea !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.grid.drawOnChartArea", checked)}
                />
                <Label>Draw on Chart Area</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.grid?.drawTicks || false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.grid.drawTicks", checked)}
                />
                <Label>Extend Grid Lines into Tick Area</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Draw Ticks</Label>
              </div>

              <div>
                <Label>Tick Length</Label>
                <Slider defaultValue={[8]} max={20} min={0} step={1} />
              </div>

              <div>
                <Label>Tick Width</Label>
                <Slider defaultValue={[1]} max={5} min={0} step={0.5} />
              </div>

              <div>
                <Label>Tick Color</Label>
                <Input type="color" defaultValue="#666666" />
              </div>

              <div>
                <Label>Z-Index</Label>
                <Slider defaultValue={[0]} max={10} min={-10} step={1} />
              </div>

              <div className="flex items-center space-x-2">
                <Switch />
                <Label>Circular Grid (Radar)</Label>
              </div>

              <div>
                <Label>Angle Lines</Label>
                <Switch />
              </div>

              <div>
                <Label>Point Labels</Label>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Tick Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.ticks?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.ticks.display", checked)}
                />
                <Label>Show X-Axis Ticks</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.ticks?.display !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.ticks.display", checked)}
                />
                <Label>Show Y-Axis Ticks</Label>
              </div>

              <div>
                <Label>X-Tick Font Size</Label>
                <Slider
                  value={[chartConfig.scales?.x?.ticks?.font?.size || 12]}
                  onValueChange={([value]) => handleConfigUpdate("scales.x.ticks.font.size", value)}
                  max={20}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.x?.ticks?.font?.size || 12}px</div>
              </div>

              <div>
                <Label>Y-Tick Font Size</Label>
                <Slider
                  value={[chartConfig.scales?.y?.ticks?.font?.size || 12]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.ticks.font.size", value)}
                  max={20}
                  min={8}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.y?.ticks?.font?.size || 12}px</div>
              </div>

              <div>
                <Label>X-Tick Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.scales?.x?.ticks?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.x.ticks.color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={chartConfig.scales?.x?.ticks?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.x.ticks.color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>Y-Tick Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={chartConfig.scales?.y?.ticks?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.y.ticks.color", e.target.value)}
                    className="w-10 h-8 rounded border"
                  />
                  <Input
                    value={chartConfig.scales?.y?.ticks?.color || "#666666"}
                    onChange={(e) => handleConfigUpdate("scales.y.ticks.color", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label>X-Tick Rotation</Label>
                <Slider
                  value={[chartConfig.scales?.x?.ticks?.maxRotation || 0]}
                  onValueChange={([value]) => handleConfigUpdate("scales.x.ticks.maxRotation", value)}
                  max={90}
                  min={0}
                  step={15}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.x?.ticks?.maxRotation || 0}°</div>
              </div>

              <div>
                <Label>Y-Tick Rotation</Label>
                <Slider
                  value={[chartConfig.scales?.y?.ticks?.maxRotation || 0]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.ticks.maxRotation", value)}
                  max={90}
                  min={0}
                  step={15}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.y?.ticks?.maxRotation || 0}°</div>
              </div>

              <div>
                <Label>X-Tick Padding</Label>
                <Slider
                  value={[chartConfig.scales?.x?.ticks?.padding || 8]}
                  onValueChange={([value]) => handleConfigUpdate("scales.x.ticks.padding", value)}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.x?.ticks?.padding || 8}px</div>
              </div>

              <div>
                <Label>Y-Tick Padding</Label>
                <Slider
                  value={[chartConfig.scales?.y?.ticks?.padding || 8]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.ticks.padding", value)}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.y?.ticks?.padding || 8}px</div>
              </div>

              <div>
                <Label>X-Tick Font Family</Label>
                <Select
                  value={chartConfig.scales?.x?.ticks?.font?.family || ""}
                  onValueChange={(value) => handleConfigUpdate("scales.x.ticks.font.family", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Y-Tick Font Family</Label>
                <Select
                  value={chartConfig.scales?.y?.ticks?.font?.family || ""}
                  onValueChange={(value) => handleConfigUpdate("scales.y.ticks.font.family", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="Arial">Arial</SelectItem>
                    <SelectItem value="Helvetica">Helvetica</SelectItem>
                    <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                    <SelectItem value="Courier New">Courier New</SelectItem>
                    <SelectItem value="Georgia">Georgia</SelectItem>
                    <SelectItem value="Verdana">Verdana</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>X-Tick Font Weight</Label>
                <Select
                  value={chartConfig.scales?.x?.ticks?.font?.weight || "normal"}
                  onValueChange={(value) => handleConfigUpdate("scales.x.ticks.font.weight", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Lighter</SelectItem>
                    <SelectItem value="bolder">Bolder</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="600">600</SelectItem>
                    <SelectItem value="700">700</SelectItem>
                    <SelectItem value="800">800</SelectItem>
                    <SelectItem value="900">900</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Y-Tick Font Weight</Label>
                <Select
                  value={chartConfig.scales?.y?.ticks?.font?.weight || "normal"}
                  onValueChange={(value) => handleConfigUpdate("scales.y.ticks.font.weight", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Lighter</SelectItem>
                    <SelectItem value="bolder">Bolder</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="200">200</SelectItem>
                    <SelectItem value="300">300</SelectItem>
                    <SelectItem value="400">400</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="600">600</SelectItem>
                    <SelectItem value="700">700</SelectItem>
                    <SelectItem value="800">800</SelectItem>
                    <SelectItem value="900">900</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Max X-Tick Limit</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.x?.ticks?.maxTicksLimit || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.x.ticks.maxTicksLimit",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="11"
                />
              </div>

              <div>
                <Label>Max Y-Tick Limit</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.ticks?.maxTicksLimit || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.y.ticks.maxTicksLimit",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="11"
                />
              </div>

              <div>
                <Label>Min X-Tick Limit</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.x?.ticks?.minTicksLimit || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.x.ticks.minTicksLimit",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="2"
                />
              </div>

              <div>
                <Label>Min Y-Tick Limit</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.ticks?.minTicksLimit || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.y.ticks.minTicksLimit",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="2"
                />
              </div>

              <div>
                <Label>X-Tick Precision</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.x?.ticks?.precision || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.x.ticks.precision",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div>
                <Label>Y-Tick Precision</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.ticks?.precision || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.y.ticks.precision",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div>
                <Label>X-Tick Step Size</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.x?.ticks?.stepSize || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.x.ticks.stepSize",
                      e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div>
                <Label>Y-Tick Step Size</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.ticks?.stepSize || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.y.ticks.stepSize",
                      e.target.value ? Number.parseFloat(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div>
                <Label>X-Tick Count</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.x?.ticks?.count || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.x.ticks.count",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div>
                <Label>Y-Tick Count</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.ticks?.count || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.y.ticks.count",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div>
                <Label>X-Tick Sample Size</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.x?.ticks?.sampleSize || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.x.ticks.sampleSize",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div>
                <Label>Y-Tick Sample Size</Label>
                <Input
                  type="number"
                  value={chartConfig.scales?.y?.ticks?.sampleSize || ""}
                  onChange={(e) =>
                    handleConfigUpdate(
                      "scales.y.ticks.sampleSize",
                      e.target.value ? Number.parseInt(e.target.value) : undefined,
                    )
                  }
                  placeholder="Auto"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.ticks?.autoSkip !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.ticks.autoSkip", checked)}
                />
                <Label>Auto Skip X-Ticks</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.ticks?.autoSkip !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.ticks.autoSkip", checked)}
                />
                <Label>Auto Skip Y-Ticks</Label>
              </div>

              <div>
                <Label>X-Tick Auto Skip Padding</Label>
                <Slider
                  value={[chartConfig.scales?.x?.ticks?.autoSkipPadding || 3]}
                  onValueChange={([value]) => handleConfigUpdate("scales.x.ticks.autoSkipPadding", value)}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.x?.ticks?.autoSkipPadding || 3}px</div>
              </div>

              <div>
                <Label>Y-Tick Auto Skip Padding</Label>
                <Slider
                  value={[chartConfig.scales?.y?.ticks?.autoSkipPadding || 3]}
                  onValueChange={([value]) => handleConfigUpdate("scales.y.ticks.autoSkipPadding", value)}
                  max={20}
                  min={0}
                  step={1}
                  className="mt-2"
                />
                <div className="text-xs text-gray-500 mt-1">{chartConfig.scales?.y?.ticks?.autoSkipPadding || 3}px</div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.ticks?.includeBounds !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.ticks.includeBounds", checked)}
                />
                <Label>Include X-Axis Bounds</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.ticks?.includeBounds !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.ticks.includeBounds", checked)}
                />
                <Label>Include Y-Axis Bounds</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.ticks?.labelOffset !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.ticks.labelOffset", checked)}
                />
                <Label>X-Tick Label Offset</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.ticks?.labelOffset !== false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.ticks.labelOffset", checked)}
                />
                <Label>Y-Tick Label Offset</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.x?.ticks?.mirror || false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.x.ticks.mirror", checked)}
                />
                <Label>Mirror X-Ticks</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={chartConfig.scales?.y?.ticks?.mirror || false}
                  onCheckedChange={(checked) => handleConfigUpdate("scales.y.ticks.mirror", checked)}
                />
                <Label>Mirror Y-Ticks</Label>
              </div>

              <div>
                <Label>X-Tick Alignment</Label>
                <Select
                  value={chartConfig.scales?.x?.ticks?.align || "center"}
                  onValueChange={(value) => handleConfigUpdate("scales.x.ticks.align", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                    <SelectItem value="inner">Inner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Y-Tick Alignment</Label>
                <Select
                  value={chartConfig.scales?.y?.ticks?.align || "center"}
                  onValueChange={(value) => handleConfigUpdate("scales.y.ticks.align", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">Start</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="end">End</SelectItem>
                    <SelectItem value="inner">Inner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>X-Tick Cross Align</Label>
                <Select
                  value={chartConfig.scales?.x?.ticks?.crossAlign || "near"}
                  onValueChange={(value) => handleConfigUpdate("scales.x.ticks.crossAlign", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="near">Near</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="far">Far</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Y-Tick Cross Align</Label>
                <Select
                  value={chartConfig.scales?.y?.ticks?.crossAlign || "near"}
                  onValueChange={(value) => handleConfigUpdate("scales.y.ticks.crossAlign", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="near">Near</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="far">Far</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 font-medium mb-2">💡 Tick Configuration Tips</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  <li>
                    • <strong>Auto Skip:</strong> Automatically hides overlapping labels
                  </li>
                  <li>
                    • <strong>Step Size:</strong> Controls the interval between tick marks
                  </li>
                  <li>
                    • <strong>Max/Min Limits:</strong> Controls how many ticks are shown
                  </li>
                  <li>
                    • <strong>Rotation:</strong> Rotates labels to prevent overlap
                  </li>
                  <li>
                    • <strong>Padding:</strong> Adds space between labels and axis
                  </li>
                  <li>
                    • <strong>Mirror:</strong> Shows labels on opposite side of axis
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
