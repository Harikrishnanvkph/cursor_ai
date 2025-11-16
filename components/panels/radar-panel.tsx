"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartStore } from "@/lib/chart-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface RadarPanelProps {
  className?: string
}

export function RadarPanel({ className }: RadarPanelProps) {
  const { chartConfig, chartType, updateChartConfig } = useChartStore()

  if (chartType !== 'radar') return null

  // Access radar-specific scale options, defaulting if not present
  const rScaleOptions = (chartConfig.scales?.r as any) || {}

  const handleRadarScaleUpdate = (path: string, value: any) => {
    const newConfig = { ...chartConfig }
    if (!newConfig.scales) newConfig.scales = {}
    if (!newConfig.scales.r) newConfig.scales.r = { type: 'radialLinear' } as any

    let current = newConfig.scales.r as any
    
    // Ensure type is always set
    if (!current.type) {
      current.type = 'radialLinear'
    }
    
    const pathParts = path.split('.')
    
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]]) current[pathParts[i]] = {}
      current = current[pathParts[i]]
    }
    current[pathParts[pathParts.length - 1]] = value
    updateChartConfig(newConfig)
  }

  return (
    <Tabs defaultValue="scale" className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Radar Chart Axes Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="scale">Scale</TabsTrigger>
            <TabsTrigger value="grid">Grid Lines</TabsTrigger>
            <TabsTrigger value="angle">Angle Lines</TabsTrigger>
            {/* <TabsTrigger value="labels">Point Labels</TabsTrigger> */}
          </TabsList>

          {/* Scale Tab */}
          <TabsContent value="scale" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Min Value</Label>
                <Input
                  type="number"
                  value={rScaleOptions.min ?? ''}
                  placeholder="Auto"
                  onChange={(e) => handleRadarScaleUpdate('min', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={rScaleOptions.max ?? ''}
                  placeholder="Auto"
                  onChange={(e) => handleRadarScaleUpdate('max', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>Step Size</Label>
              <Input
                type="number"
                value={rScaleOptions.ticks?.stepSize ?? ''}
                placeholder="Auto"
                onChange={(e) => handleRadarScaleUpdate('ticks.stepSize', e.target.value === '' ? undefined : Number(e.target.value))}
                step="any"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Begin at Zero</Label>
              <Switch
                checked={rScaleOptions.beginAtZero !== false}
                onCheckedChange={(checked) => handleRadarScaleUpdate('beginAtZero', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Scale Labels (Ticks)</Label>
              <Switch
                checked={rScaleOptions.ticks?.display !== false}
                onCheckedChange={(checked) => handleRadarScaleUpdate('ticks.display', checked)}
              />
            </div>
            {rScaleOptions.ticks?.display !== false && (
              <div className="pl-4 space-y-3 border-l-2 border-gray-100">
                 <div>
                    <Label className="text-xs font-normal">Tick Label Color</Label>
                    <Input
                      type="color"
                      value={rScaleOptions.ticks?.color || '#666666'}
                      onChange={(e) => handleRadarScaleUpdate('ticks.color', e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
              </div>
            )}
          </TabsContent>

          {/* Grid Lines (Web) Tab */}
          <TabsContent value="grid" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Grid Lines</Label>
              <Switch
                checked={rScaleOptions.grid?.display !== false}
                onCheckedChange={(checked) => handleRadarScaleUpdate('grid.display', checked)}
              />
            </div>
            {rScaleOptions.grid?.display !== false && (
              <div className="pl-4 space-y-4 border-l-2 border-gray-100">
                <div>
                  <Label>Grid Line Color</Label>
                  <Input
                    type="color"
                    value={rScaleOptions.grid?.color || '#CCCCCC'}
                    onChange={(e) => handleRadarScaleUpdate('grid.color', e.target.value)}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <Label>Grid Line Width</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[rScaleOptions.grid?.lineWidth || 1]}
                      onValueChange={([value]) => handleRadarScaleUpdate('grid.lineWidth', value)}
                      min={0.5}
                      max={5}
                      step={0.1}
                    />
                    <span className="text-sm w-10">{rScaleOptions.grid?.lineWidth || 1}px</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Circular Grid (Shape)</Label>
                  <Switch
                    checked={rScaleOptions.grid?.circular === true}
                    onCheckedChange={(checked) => handleRadarScaleUpdate('grid.circular', checked)}
                  />
                  <p className="text-xs text-gray-500">Off for polygon shape.</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Angle Lines (Spokes) Tab */}
          <TabsContent value="angle" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Angle Lines</Label>
              <Switch
                checked={rScaleOptions.angleLines?.display !== false}
                onCheckedChange={(checked) => handleRadarScaleUpdate('angleLines.display', checked)}
              />
            </div>
            {rScaleOptions.angleLines?.display !== false && (
              <div className="pl-4 space-y-4 border-l-2 border-gray-100">
                <div>
                  <Label>Angle Line Color</Label>
                  <Input
                    type="color"
                    value={rScaleOptions.angleLines?.color || '#CCCCCC'}
                    onChange={(e) => handleRadarScaleUpdate('angleLines.color', e.target.value)}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <Label>Angle Line Width</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[rScaleOptions.angleLines?.lineWidth || 1]}
                      onValueChange={([value]) => handleRadarScaleUpdate('angleLines.lineWidth', value)}
                      min={0.5}
                      max={5}
                      step={0.1}
                    />
                    <span className="text-sm w-10">{rScaleOptions.angleLines?.lineWidth || 1}px</span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Point Labels Tab - Placeholder for future expansion */}
          {/* <TabsContent value="labels" className="space-y-4">
            <p className="text-sm text-gray-500">Point label settings coming soon.</p>
          </TabsContent> */}
        </CardContent>
      </Card>
    </Tabs>
  )
}
