"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartStore } from "@/lib/chart-store"
import { AxisSettings } from "./axis-settings"
import { RadialAxisSettings } from "./radial-axis-settings"
import { ArcSettings } from "./arc-settings"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { setNestedProperty } from "@/lib/utils"

export function AxesPanel() {
  const { chartConfig, chartType } = useChartStore()
  const { updateChartConfig } = useChartActions()

  const handleConfigUpdate = (path: string, value: any) => {
    // Fetch latest config directly from store to prevent closure staleness on rapid sequential updates
    const currentConfig = useChartStore.getState().getActiveChartConfig();
    const newConfig = setNestedProperty(currentConfig, path, value)
    updateChartConfig(newConfig)
  }

  // Handle gauge charts - show informative message
  if (chartType === 'gauge') {
    return (
      <Card className="w-full mt-4">
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-3 bg-amber-50 text-amber-500 rounded-full border border-amber-100">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="font-semibold text-gray-900">Axes Disabled for Gauge</h3>
            <p className="text-sm text-gray-500 max-w-[280px]">
              Gauge charts do not use standard axes. Please navigate to the <strong className="text-blue-600">Styling & Labels</strong> tab to configure your gauge needles and scale values.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Handle pie and doughnut charts - show ArcSettings
  if (['pie', 'doughnut'].includes(chartType)) {
    return (
      <ArcSettings
        chartType={chartType}
        options={chartConfig}
        onUpdate={handleConfigUpdate}
      />
    )
  }

  // Handle radar and polar area charts (radial axes)
  if (['radar', 'polarArea'].includes(chartType)) {
    return (
      <RadialAxisSettings
        config={chartConfig.scales?.r || {}}
        onUpdate={handleConfigUpdate}
        chartType={chartType}
      />
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
          chartType={chartType}
        />
      </TabsContent>

      <TabsContent value="y" className="mt-4">
        <AxisSettings
          axis="y"
          config={chartConfig.scales?.y || {}}
          onUpdate={handleConfigUpdate}
          chartType={chartType}
        />
      </TabsContent>
    </Tabs>
  )
}
