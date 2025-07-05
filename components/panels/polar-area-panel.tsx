"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartStore } from "@/lib/chart-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

interface PolarAreaPanelProps {
  className?: string
}

export function PolarAreaPanel({ className }: PolarAreaPanelProps) {
  const { chartConfig, chartType, updateChartConfig } = useChartStore()

  if (chartType !== 'polarArea') return null

  // Access polar area-specific scale options, defaulting if not present
  const rScaleOptions = (chartConfig.scales?.r as any) || {}

  const handlePolarAreaScaleUpdate = (path: string, value: any) => {
    const newConfig = { ...chartConfig }
    if (!newConfig.scales) newConfig.scales = {}
    if (!newConfig.scales.r) newConfig.scales.r = {}

    let current = newConfig.scales.r as any
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
          <CardTitle className="text-sm">Polar Area Chart Axes Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="scale">Scale</TabsTrigger>
            <TabsTrigger value="grid">Grid Lines</TabsTrigger>
            <TabsTrigger value="angle">Angle Lines</TabsTrigger>
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
                  onChange={(e) => handlePolarAreaScaleUpdate('min', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
              <div>
                <Label>Max Value</Label>
                <Input
                  type="number"
                  value={rScaleOptions.max ?? ''}
                  placeholder="Auto"
                  onChange={(e) => handlePolarAreaScaleUpdate('max', e.target.value === '' ? undefined : Number(e.target.value))}
                />
              </div>
            </div>
            <div>
              <Label>Step Size (Ticks)</Label>
              <Input
                type="number"
                value={rScaleOptions.ticks?.stepSize ?? ''}
                placeholder="Auto"
                onChange={(e) => handlePolarAreaScaleUpdate('ticks.stepSize', e.target.value === '' ? undefined : Number(e.target.value))}
                step="any"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Begin at Zero</Label>
              <Switch
                checked={rScaleOptions.beginAtZero !== false}
                onCheckedChange={(checked) => handlePolarAreaScaleUpdate('beginAtZero', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Show Scale Labels (Ticks)</Label>
              <Switch
                checked={rScaleOptions.ticks?.display !== false}
                onCheckedChange={(checked) => handlePolarAreaScaleUpdate('ticks.display', checked)}
              />
            </div>
            {rScaleOptions.ticks?.display !== false && (
              <div className="pl-4 space-y-4 border-l-2 border-gray-100">
                  <div>
                    <Label>Tick Label Color</Label>
                    <Input
                      type="color"
                      value={rScaleOptions.ticks?.color || '#666666'}
                      onChange={(e) => handlePolarAreaScaleUpdate('ticks.color', e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
                  <div>
                    <Label>Tick Backdrop Color (for contrast)</Label>
                    <Input
                      type="color"
                      value={rScaleOptions.ticks?.backdropColor || 'rgba(0,0,0,0)'} // Default to transparent
                      onChange={(e) => handlePolarAreaScaleUpdate('ticks.backdropColor', e.target.value)}
                      className="w-full h-8"
                    />
                  </div>
              </div>
            )}
          </TabsContent>

          {/* Grid Lines Tab */}
          <TabsContent value="grid" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Grid Lines</Label>
              <Switch
                checked={rScaleOptions.grid?.display !== false}
                onCheckedChange={(checked) => handlePolarAreaScaleUpdate('grid.display', checked)}
              />
            </div>
            {rScaleOptions.grid?.display !== false && (
              <div className="pl-4 space-y-4 border-l-2 border-gray-100">
                <div>
                  <Label>Grid Line Color</Label>
                  <Input
                    type="color"
                    value={rScaleOptions.grid?.color || '#CCCCCC'}
                    onChange={(e) => handlePolarAreaScaleUpdate('grid.color', e.target.value)}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <Label>Grid Line Width</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[rScaleOptions.grid?.lineWidth || 1]}
                      onValueChange={([value]) => handlePolarAreaScaleUpdate('grid.lineWidth', value)}
                      min={0.5}
                      max={5}
                      step={0.1}
                    />
                    <span className="text-sm w-10">{rScaleOptions.grid?.lineWidth || 1}px</span>
                  </div>
                </div>
                {/* Circular grid option might not be as relevant or behave differently for PolarArea, keeping for now */}
                <div className="flex items-center justify-between">
                  <Label>Circular Grid (Shape)</Label>
                  <Switch
                    checked={rScaleOptions.grid?.circular === true}
                    onCheckedChange={(checked) => handlePolarAreaScaleUpdate('grid.circular', checked)}
                  />
                  <p className="text-xs text-gray-500">Off for polygon shape.</p>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Angle Lines Tab */}
          <TabsContent value="angle" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Show Angle Lines</Label>
              <Switch
                checked={rScaleOptions.angleLines?.display !== false}
                onCheckedChange={(checked) => handlePolarAreaScaleUpdate('angleLines.display', checked)}
              />
            </div>
            {rScaleOptions.angleLines?.display !== false && (
              <div className="pl-4 space-y-4 border-l-2 border-gray-100">
                <div>
                  <Label>Angle Line Color</Label>
                  <Input
                    type="color"
                    value={rScaleOptions.angleLines?.color || '#CCCCCC'}
                    onChange={(e) => handlePolarAreaScaleUpdate('angleLines.color', e.target.value)}
                    className="w-full h-8"
                  />
                </div>
                <div>
                  <Label>Angle Line Width</Label>
                  <div className="flex items-center gap-2">
                    <Slider
                      value={[rScaleOptions.angleLines?.lineWidth || 1]}
                      onValueChange={([value]) => handlePolarAreaScaleUpdate('angleLines.lineWidth', value)}
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
        </CardContent>
      </Card>
    </Tabs>
  )
}
