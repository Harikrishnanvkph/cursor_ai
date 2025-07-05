"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartStore } from "@/lib/chart-store"
import { AxisSettings } from "./axis-settings"
import { RadialAxisSettings } from "./radial-axis-settings"

export function AxesPanel() {
  const { chartConfig, updateChartConfig, chartType } = useChartStore()

  const handleConfigUpdate = (path: string, value: any) => {
    const newConfig = JSON.parse(JSON.stringify(chartConfig))
    const keys = path.split('.')
    let current = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
  }

  // Handle pie and doughnut charts (no axes)
  if (['pie', 'doughnut'].includes(chartType)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Axes Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This chart type has specialized axis configuration.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Handle radar and polar area charts (radial axes)
  if (['radar', 'polarArea'].includes(chartType)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Radial Axis Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <RadialAxisSettings
            config={chartConfig.scales?.r || {}}
            onUpdate={handleConfigUpdate}
          />
        </CardContent>
      </Card>
    )
  }

  // Handle Cartesian charts (X and Y axes)
  return (
    <Tabs defaultValue="x" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="x">X-Axis</TabsTrigger>
        <TabsTrigger value="y">Y-Axis</TabsTrigger>
      </TabsList>

      <TabsContent value="x" className="mt-4">
        <AxisSettings
          axis="x"
          config={chartConfig.scales?.x || {}}
          onUpdate={handleConfigUpdate}
        />
      </TabsContent>

      <TabsContent value="y" className="mt-4">
        <AxisSettings
          axis="y"
          config={chartConfig.scales?.y || {}}
          onUpdate={handleConfigUpdate}
        />
      </TabsContent>
    </Tabs>
  )
}
