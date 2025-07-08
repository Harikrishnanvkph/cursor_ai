"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChartStore, getDefaultImageType, getDefaultImageSize, getImageOptionsForChartType, type ExtendedChartDataset, type SupportedChartType } from "@/lib/chart-store"
import {
  Plus,
  Trash2,
  GripVertical,
  BarChart3,
  Shuffle,
  ImageIcon,
  Upload,
  Target,
  ArrowUpRight,
  MousePointer2,
} from "lucide-react"

type DataPoint = number | { x: number; y: number } | null

export function DatasetPanel() {
  const { chartData, chartType, addDataset, removeDataset, updateDataset, setChartType, updatePointImage, updateDataPoint } =
    useChartStore()
  const [newDatasetName, setNewDatasetName] = useState("")

  const handleAddDataset = () => {
    if (newDatasetName.trim()) {
      const colors = generateColorPalette(5)
      const newDataset: ExtendedChartDataset = {
        label: newDatasetName,
        data: [10, 20, 30, 40, 50],
        backgroundColor: colors,
        borderColor: colors.map((c) => darkenColor(c, 20)),
        borderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 8,
        tension: 0.4,
        fill: false,
        pointImages: Array(5).fill(null),
        pointImageConfig: Array(5).fill({
          type: getDefaultImageType(chartType),
          size: getDefaultImageSize(chartType),
          position: "center",
          arrow: false,
        }),
      }

      addDataset(newDataset)
      setNewDatasetName("")
    }
  }

  const generateColorPalette = (count: number) => {
    const colors = []
    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count
      colors.push(`hsl(${hue}, 70%, 50%)`)
    }
    return colors
  }

  const darkenColor = (color: string, percent: number) => {
    if (color.startsWith("hsl")) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
      if (match) {
        const [, h, s, l] = match
        const newL = Math.max(0, Number.parseInt(l) - percent)
        return `hsl(${h}, ${s}%, ${newL}%)`
      }
    }
    return color
  }

  const handleUpdateDataset = (datasetIndex: number, property: keyof ExtendedChartDataset, value: any) => {
    const dataset = chartData.datasets[datasetIndex]
    if (!dataset) return

    const updatedDataset = { ...dataset, [property]: value }
    updateDataset(datasetIndex, updatedDataset)
  }

  const handleDataPointUpdate = (datasetIndex: number, pointIndex: number, value: string, field: 'x' | 'y' | 'r' = 'y') => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      updateDataPoint(datasetIndex, pointIndex, field, null)
      return
    }

    if (chartType === 'scatter' || chartType === 'bubble') {
      updateDataPoint(datasetIndex, pointIndex, field, numValue)
    } else {
      updateDataPoint(datasetIndex, pointIndex, 'y', numValue)
    }
  }

  const generateRandomData = (datasetIndex: number) => {
    const newData = Array.from({ length: chartData.datasets[datasetIndex].data.length }, () =>
      Math.floor(Math.random() * 100),
    )
    handleUpdateDataset(datasetIndex, "data", newData)
  }

  const handleChartTypeChange = (type: string) => {
    const newType = type === 'horizontalBar' ? 'bar' : type
    if (type === 'stackedBar') {
      setChartType('stackedBar' as SupportedChartType)
      chartData.datasets.forEach((dataset, index) => {
        handleUpdateDataset(index, 'type', 'bar')
      })
      return
    }
    setChartType(newType)
    
    // Update dataset types when chart type changes
    chartData.datasets.forEach((dataset, index) => {
      const newTypeForDataset = (type === 'horizontalBar' || type === 'stackedBar') ? 'bar' : type
      handleUpdateDataset(index, 'type', newTypeForDataset)
    })
  }

  const handleImageUpload = (datasetIndex: number, pointIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        updatePointImage(datasetIndex, pointIndex, imageUrl, {})
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (datasetIndex: number, pointIndex: number, imageUrl: string) => {
    updatePointImage(datasetIndex, pointIndex, imageUrl, {})
  }

  const handleImageConfigChange = (datasetIndex: number, pointIndex: number, configKey: string, value: any) => {
    const dataset = chartData.datasets[datasetIndex]
    const currentImageUrl = dataset.pointImages?.[pointIndex] || ""
    const currentConfig = dataset.pointImageConfig?.[pointIndex] || {}
    updatePointImage(datasetIndex, pointIndex, currentImageUrl, { ...currentConfig, [configKey]: value })
  }

  const imageOptions = getImageOptionsForChartType(chartType)

  return (
    <div className="space-y-6">
      {/* Chart Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Chart Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Chart Type</Label>
            <Select value={chartType} onValueChange={handleChartTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="horizontalBar">Horizontal Bar</SelectItem>
                <SelectItem value="stackedBar">Stacked Bar</SelectItem>
                <SelectItem value="line">Line</SelectItem>
                <SelectItem value="area">Area</SelectItem>
                <SelectItem value="pie">Pie</SelectItem>
                <SelectItem value="doughnut">Doughnut</SelectItem>
                <SelectItem value="radar">Radar</SelectItem>
                <SelectItem value="polarArea">Polar Area</SelectItem>
                <SelectItem value="scatter">Scatter</SelectItem>
                <SelectItem value="bubble">Bubble</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Chart Width</Label>
              <Input type="number" placeholder="Auto" />
            </div>
            <div>
              <Label>Chart Height</Label>
              <Input type="number" placeholder="Auto" />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch defaultChecked />
            <Label>Responsive</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch defaultChecked />
            <Label>Maintain Aspect Ratio</Label>
          </div>
        </CardContent>
      </Card>

      {/* Dataset Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Dataset</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Dataset name"
              value={newDatasetName}
              onChange={(e) => setNewDatasetName(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddDataset()}
            />
            <Button onClick={handleAddDataset}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button variant="outline" size="sm" onClick={() => generateRandomData(0)}>
              <Shuffle className="h-4 w-4 mr-1" />
              Shuffle
            </Button>
            <Button variant="outline" size="sm">
              Sort A-Z
            </Button>
            <Button variant="outline" size="sm">
              Sort Values
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Individual Datasets */}
      <div className="space-y-6">
        {chartData.datasets.map((dataset: ExtendedChartDataset, datasetIndex: number) => (
          <Card
            key={datasetIndex}
            className="border-l-4"
            style={{
              borderLeftColor: Array.isArray(dataset.backgroundColor)
                ? dataset.backgroundColor[0]
                : dataset.backgroundColor,
            }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {dataset.label || `Dataset ${datasetIndex + 1}`}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => generateRandomData(datasetIndex)}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => removeDataset(datasetIndex)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1 h-auto p-1">
                  <TabsTrigger value="basic" className="text-xs py-2">
                    Basic
                  </TabsTrigger>
                  <TabsTrigger value="colors" className="text-xs py-2">
                    Colors
                  </TabsTrigger>
                  <TabsTrigger value="images" className="text-xs py-2">
                    Images
                  </TabsTrigger>
                  <TabsTrigger value="style" className="text-xs py-2">
                    Style
                  </TabsTrigger>
                  <TabsTrigger value="data" className="text-xs py-2">
                    Data
                  </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                  <TabsContent value="basic" className="space-y-6 mt-0">
                    <div>
                      <Label className="text-sm font-medium">Dataset Label</Label>
                      <Input
                        value={dataset.label}
                        onChange={(e) => handleUpdateDataset(datasetIndex, "label", e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Chart Type Override</Label>
                      <Select
                        value={dataset.type || chartType}
                        onValueChange={(value) => handleUpdateDataset(datasetIndex, "type", value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bar">Bar</SelectItem>
                          <SelectItem value="line">Line</SelectItem>
                          <SelectItem value="scatter">Scatter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={dataset.hidden !== true}
                        onCheckedChange={(checked) => handleUpdateDataset(datasetIndex, "hidden", !checked)}
                      />
                      <Label className="text-sm font-medium">Visible</Label>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Order (Z-Index)</Label>
                      <Slider
                        value={[dataset.order || 0]}
                        onValueChange={([value]) => handleUpdateDataset(datasetIndex, "order", value)}
                        max={10}
                        min={-10}
                        step={1}
                        className="mt-3"
                      />
                      <div className="text-xs text-gray-500 mt-2">{dataset.order || 0}</div>
                    </div>
                  </TabsContent>

                  <TabsContent value="colors" className="space-y-6 mt-0">
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Individual Point Colors</Label>
                      <div className="grid grid-cols-5 gap-3">
                        {dataset.data.map((value, pointIndex) => (
                          <div key={pointIndex} className="text-center">
                            <input
                              type="color"
                              value={
                                Array.isArray(dataset.backgroundColor)
                                  ? dataset.backgroundColor[pointIndex]
                                  : dataset.backgroundColor
                              }
                              onChange={(e) => {
                                const newColors = Array.isArray(dataset.backgroundColor)
                                  ? [...dataset.backgroundColor]
                                  : Array(dataset.data.length).fill(dataset.backgroundColor)
                                newColors[pointIndex] = e.target.value
                                handleUpdateDataset(datasetIndex, "backgroundColor", newColors)
                              }}
                              className="w-full h-10 rounded border cursor-pointer"
                            />
                            <div className="text-xs mt-2 text-gray-600">{pointIndex + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="images" className="space-y-6 mt-0">
                    <div>
                      <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Point Images for {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart
                      </Label>
                      <p className="text-xs text-gray-500 mb-6">
                        Add images to data points. Different chart types support different image placements.
                      </p>

                      <div className="space-y-6">
                        {dataset.data.map((value, pointIndex) => (
                          <Card key={pointIndex} className="p-4 bg-gray-50">
                            <div className="flex items-center gap-3 mb-4">
                              <div
                                className="w-5 h-5 rounded"
                                style={{
                                  backgroundColor: Array.isArray(dataset.backgroundColor)
                                    ? dataset.backgroundColor[pointIndex]
                                    : dataset.backgroundColor,
                                }}
                              />
                              <Label className="font-medium text-sm">
                                Point {pointIndex + 1} ({typeof chartData.labels?.[pointIndex] === 'string' ? chartData.labels[pointIndex] : `Value: ${typeof value === 'object' ? JSON.stringify(value) : value}`})
                              </Label>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <Label className="text-xs font-medium">Image URL</Label>
                                <Input
                                  placeholder="https://example.com/image.jpg"
                                  value={dataset.pointImages?.[pointIndex] || ""}
                                  onChange={(e) => handleImageUrlChange(datasetIndex, pointIndex, e.target.value)}
                                  className="text-xs mt-2"
                                />
                              </div>

                              <div>
                                <Label className="text-xs font-medium">Upload Image</Label>
                                <div className="flex gap-2 mt-2">
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(datasetIndex, pointIndex, e)}
                                    className="text-xs"
                                  />
                                  <Button variant="outline" size="sm">
                                    <Upload className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-xs font-medium">Image Type</Label>
                                  <Select
                                    value={dataset.pointImageConfig?.[pointIndex]?.type || "circle"}
                                    onValueChange={(value) =>
                                      handleImageConfigChange(datasetIndex, pointIndex, "type", value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 mt-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {imageOptions.types.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-xs font-medium">Image Size</Label>
                                  <Slider
                                    value={[dataset.pointImageConfig?.[pointIndex]?.size || 25]}
                                    onValueChange={([value]) =>
                                      handleImageConfigChange(datasetIndex, pointIndex, "size", value)
                                    }
                                    max={60}
                                    min={10}
                                    step={5}
                                    className="mt-3"
                                  />
                                  <div className="text-xs text-gray-500 mt-1">
                                    {dataset.pointImageConfig?.[pointIndex]?.size || 25}px
                                  </div>
                                </div>
                              </div>

                              {imageOptions.positions.length > 0 && (
                                <div>
                                  <Label className="text-xs font-medium">Position</Label>
                                  <Select
                                    value={dataset.pointImageConfig?.[pointIndex]?.position || "center"}
                                    onValueChange={(value) =>
                                      handleImageConfigChange(datasetIndex, pointIndex, "position", value)
                                    }
                                  >
                                    <SelectTrigger className="h-8 mt-2">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {imageOptions.positions.map((position) => (
                                        <SelectItem key={position.value} value={position.value}>
                                          <div className="flex items-center gap-2">
                                            {position.value === "callout" && <ArrowUpRight className="h-3 w-3" />}
                                            {position.value === "center" && <Target className="h-3 w-3" />}
                                            {position.label}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {imageOptions.supportsFill && (
                                <div className="space-y-3">
                                  <div className="flex items-center space-x-3">
                                    <Switch
                                      checked={dataset.pointImageConfig?.[pointIndex]?.fillBar || false}
                                      onCheckedChange={(checked) =>
                                        handleImageConfigChange(datasetIndex, pointIndex, "fillBar", checked)
                                      }
                                    />
                                    <Label className="text-xs font-medium">Fill Bar with Image</Label>
                                  </div>

                                  {dataset.pointImageConfig?.[pointIndex]?.fillBar && (
                                    <div>
                                      <Label className="text-xs font-medium">Image Fit</Label>
                                      <Select
                                        value={dataset.pointImageConfig?.[pointIndex]?.imageFit || "fill"}
                                        onValueChange={(value) =>
                                          handleImageConfigChange(datasetIndex, pointIndex, "imageFit", value)
                                        }
                                      >
                                        <SelectTrigger className="h-8 mt-2">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="fill">Fill (Stretch)</SelectItem>
                                          <SelectItem value="cover">Cover (Maintain Ratio)</SelectItem>
                                          <SelectItem value="contain">Contain (Fit Inside)</SelectItem>
                                        </SelectContent>
                                      </Select>

                                      <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 mt-3">
                                        <p className="text-xs text-amber-700 font-medium mb-1">💡 Bar Fill Mode</p>
                                        <p className="text-xs text-amber-600">
                                          This will fill the entire bar with your image. Choose "Fill" to stretch the
                                          image, "Cover" to maintain aspect ratio while covering the bar, or "Contain"
                                          to fit the image inside the bar.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {imageOptions.supportsArrow &&
                                dataset.pointImageConfig?.[pointIndex]?.position === "callout" && (
                                  <div className="space-y-3">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <MousePointer2 className="h-4 w-4 text-blue-600" />
                                        <p className="text-sm text-blue-700 font-semibold">Interactive Callout</p>
                                      </div>
                                      <p className="text-xs text-blue-600 leading-relaxed">
                                        🎯 <strong>Click and drag</strong> the image circle in the chart to move the
                                        callout anywhere you want!
                                        <br />🔄 The arrow will automatically adjust as you drag.
                                      </p>
                                    </div>

                                    <div className="flex items-center space-x-3">
                                      <Switch
                                        checked={dataset.pointImageConfig?.[pointIndex]?.arrowLine !== false}
                                        onCheckedChange={(checked) => handleImageConfigChange(datasetIndex, pointIndex, "arrowLine", checked)}
                                      />
                                      <Label className="text-xs font-medium">Show Arrow Line</Label>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                      <Switch
                                        checked={dataset.pointImageConfig?.[pointIndex]?.arrowHead !== false}
                                        onCheckedChange={(checked) => handleImageConfigChange(datasetIndex, pointIndex, "arrowHead", checked)}
                                      />
                                      <Label className="text-xs font-medium">Show Arrow Head</Label>
                                    </div>
                                    {(dataset.pointImageConfig?.[pointIndex]?.arrowLine !== false || dataset.pointImageConfig?.[pointIndex]?.arrowHead !== false) && (
                                      <div>
                                        <Label className="text-xs font-medium">Arrow End Distance from Image</Label>
                                        <Slider
                                          value={[dataset.pointImageConfig?.[pointIndex]?.arrowEndGap ?? 8]}
                                          onValueChange={([value]) => handleImageConfigChange(datasetIndex, pointIndex, "arrowEndGap", value)}
                                          max={30}
                                          min={0}
                                          step={1}
                                        />
                                        <div className="text-xs text-gray-500 mt-1">{dataset.pointImageConfig?.[pointIndex]?.arrowEndGap ?? 8}px</div>
                                      </div>
                                    )}

                                    <div className="flex items-center space-x-3">
                                      <Switch
                                        checked={dataset.pointImageConfig?.[pointIndex]?.arrow || false}
                                        onCheckedChange={(checked) =>
                                          handleImageConfigChange(datasetIndex, pointIndex, "arrow", checked)
                                        }
                                      />
                                      <Label className="text-xs font-medium">Show Arrow</Label>
                                    </div>

                                    <div>
                                      <Label className="text-xs font-medium">Arrow Color</Label>
                                      <Input
                                        type="color"
                                        value={dataset.pointImageConfig?.[pointIndex]?.arrowColor || "#666666"}
                                        onChange={(e) =>
                                          handleImageConfigChange(
                                            datasetIndex,
                                            pointIndex,
                                            "arrowColor",
                                            e.target.value,
                                          )
                                        }
                                        className="h-8 mt-2"
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs font-medium">Initial Distance from Point</Label>
                                      <Slider
                                        value={[dataset.pointImageConfig?.[pointIndex]?.offset || 40]}
                                        onValueChange={([value]) =>
                                          handleImageConfigChange(datasetIndex, pointIndex, "offset", value)
                                        }
                                        max={100}
                                        min={20}
                                        step={5}
                                        className="mt-3"
                                      />
                                      <div className="text-xs text-gray-500 mt-1">
                                        {dataset.pointImageConfig?.[pointIndex]?.offset || 40}px
                                      </div>
                                    </div>

                                    <div>
                                      <Label className="text-xs font-medium">Border Color</Label>
                                      <Input
                                        type="color"
                                        value={dataset.pointImageConfig?.[pointIndex]?.borderColor || "#ffffff"}
                                        onChange={(e) =>
                                          handleImageConfigChange(
                                            datasetIndex,
                                            pointIndex,
                                            "borderColor",
                                            e.target.value,
                                          )
                                        }
                                        className="h-8 mt-2"
                                      />
                                    </div>

                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Reset callout position to default
                                        handleImageConfigChange(datasetIndex, pointIndex, "calloutX", undefined)
                                        handleImageConfigChange(datasetIndex, pointIndex, "calloutY", undefined)
                                      }}
                                      className="w-full"
                                    >
                                      Reset Callout Position
                                    </Button>
                                  </div>
                                )}

                              {dataset.pointImages?.[pointIndex] && (
                                <div>
                                  <Label className="text-xs font-medium">Preview</Label>
                                  <div className="w-16 h-16 border rounded overflow-hidden bg-white mt-2">
                                    <img
                                      src={dataset.pointImages[pointIndex] || "/placeholder.svg"}
                                      alt={`Point ${pointIndex + 1}`}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = "none"
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleImageUrlChange(datasetIndex, pointIndex, "")}
                                className="w-full"
                              >
                                Remove Image
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="style" className="space-y-6 mt-0">
                    <div>
                      <Label className="text-sm font-medium">Border Width</Label>
                      <Slider
                        value={[typeof dataset.borderWidth === 'number' ? dataset.borderWidth : 2]}
                        onValueChange={([value]) => handleUpdateDataset(datasetIndex, "borderWidth", value)}
                        max={10}
                        min={0}
                        step={1}
                        className="mt-3"
                      />
                      <div className="text-xs text-gray-500 mt-2">
                        {typeof dataset.borderWidth === 'number' ? dataset.borderWidth : 2}px
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Point Radius</Label>
                      <Slider
                        value={[dataset.pointRadius || 3]}
                        onValueChange={([value]) => handleUpdateDataset(datasetIndex, "pointRadius", value)}
                        max={15}
                        min={0}
                        step={1}
                        className="mt-3"
                      />
                      <div className="text-xs text-gray-500 mt-2">{dataset.pointRadius || 3}px</div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Line Tension (Curve)</Label>
                      <Slider
                        value={[dataset.tension || 0]}
                        onValueChange={([value]) => handleUpdateDataset(datasetIndex, "tension", value)}
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-3"
                      />
                      <div className="text-xs text-gray-500 mt-2">{((dataset.tension || 0) * 100).toFixed(0)}%</div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Switch
                        checked={dataset.fill || false}
                        onCheckedChange={(checked) => handleUpdateDataset(datasetIndex, "fill", checked)}
                      />
                      <Label className="text-sm font-medium">Fill Area</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="data" className="space-y-6 mt-0">
                    <div>
                      <Label className="text-sm font-medium">Data Values</Label>
                      <div className="space-y-3 mt-3">
                        {(dataset.data as DataPoint[]).map((value: DataPoint, pointIndex: number) => (
                          <div key={pointIndex} className="flex gap-3 items-center">
                            <span className="w-8 text-sm font-medium">{pointIndex + 1}:</span>
                            {(chartType === 'scatter' || chartType === 'bubble') ? (
                              <>
                                <Input
                                  type="number"
                                  placeholder="X"
                                  value={typeof value === 'object' && value !== null ? value.x : 0}
                                  onChange={(e) => handleDataPointUpdate(datasetIndex, pointIndex, e.target.value, 'x')}
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  placeholder="Y"
                                  value={typeof value === 'object' && value !== null ? value.y : 0}
                                  onChange={(e) => handleDataPointUpdate(datasetIndex, pointIndex, e.target.value, 'y')}
                                  className="flex-1"
                                />
                                {chartType === 'bubble' && (
                                  <Input
                                    type="number"
                                    placeholder="R"
                                    value={typeof value === 'object' && value !== null ? (value as any).r : 10}
                                    onChange={(e) => handleDataPointUpdate(datasetIndex, pointIndex, e.target.value, 'r')}
                                    className="flex-1"
                                  />
                                )}
                              </>
                            ) : (
                              <Input
                                type="number"
                                value={typeof value === 'object' && value !== null ? value.y : value || 0}
                                onChange={(e) => handleDataPointUpdate(datasetIndex, pointIndex, e.target.value)}
                                className="flex-1"
                              />
                            )}
                            <input
                              type="color"
                              value={
                                Array.isArray(dataset.backgroundColor)
                                  ? dataset.backgroundColor[pointIndex]
                                  : dataset.backgroundColor
                              }
                              onChange={(e) => {
                                const newColors = Array.isArray(dataset.backgroundColor)
                                  ? [...dataset.backgroundColor]
                                  : Array(dataset.data.length).fill(dataset.backgroundColor)
                                newColors[pointIndex] = e.target.value
                                handleUpdateDataset(datasetIndex, "backgroundColor", newColors)
                              }}
                              className="w-10 h-10 rounded border cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newData = [...dataset.data, 0]
                          const newColors = Array.isArray(dataset.backgroundColor)
                            ? [...dataset.backgroundColor, generateColorPalette(1)[0]]
                            : dataset.backgroundColor
                          const newBorderColors = Array.isArray(dataset.borderColor)
                            ? [...dataset.borderColor, darkenColor(generateColorPalette(1)[0], 20)]
                            : dataset.borderColor

                          handleUpdateDataset(datasetIndex, "data", newData)
                          handleUpdateDataset(datasetIndex, "backgroundColor", newColors)
                          handleUpdateDataset(datasetIndex, "borderColor", newBorderColors)

                          // Add image slots
                          const newPointImages = [...(dataset.pointImages || []), null]
                          const newPointImageConfig = [
                            ...(dataset.pointImageConfig || []),
                            {
                              type: getDefaultImageType(chartType),
                              size: getDefaultImageSize(chartType),
                              position: "center",
                              arrow: false,
                            },
                          ]
                          handleUpdateDataset(datasetIndex, "pointImages", newPointImages)
                          handleUpdateDataset(datasetIndex, "pointImageConfig", newPointImageConfig)
                        }}
                      >
                        Add Point
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (dataset.data.length > 1) {
                            const newData = dataset.data.slice(0, -1)
                            const newColors = Array.isArray(dataset.backgroundColor)
                              ? dataset.backgroundColor.slice(0, -1)
                              : dataset.backgroundColor
                            const newBorderColors = Array.isArray(dataset.borderColor)
                              ? dataset.borderColor.slice(0, -1)
                              : dataset.borderColor

                            handleUpdateDataset(datasetIndex, "data", newData)
                            handleUpdateDataset(datasetIndex, "backgroundColor", newColors)
                            handleUpdateDataset(datasetIndex, "borderColor", newBorderColors)

                            // Remove image slots
                            const newPointImages = (dataset.pointImages || []).slice(0, -1)
                            const newPointImageConfig = (dataset.pointImageConfig || []).slice(0, -1)
                            handleUpdateDataset(datasetIndex, "pointImages", newPointImages)
                            handleUpdateDataset(datasetIndex, "pointImageConfig", newPointImageConfig)
                          }
                        }}
                      >
                        Remove Point
                      </Button>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
