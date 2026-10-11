"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartStore } from "@/lib/chart-store"
import { useChartConfig, useChartType, useChartData } from "@/lib/hooks/use-chart-state"
import { AxisSettings } from "./axis-settings"
import { RadialAxisSettings } from "./radial-axis-settings"
import { ArcSettings } from "./arc-settings"
import { GoalLinesTab } from "./goal-lines-tab"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { cn, setNestedProperty } from "@/lib/utils"

export function AxesPanel() {
  const chartConfig = useChartConfig()
  const chartType = useChartType()
  const chartData = useChartData()
  const chartMode = useChartStore(state => state.chartMode)
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

  const [ySubAxis, setYSubAxis] = useState<'y' | 'y1'>('y')

  // Check if y1 is currently in use by any dataset and scale config
  const datasets = chartData?.datasets || []
  const y1Datasets = datasets.filter((ds: any) => ds?.yAxisID === 'y1' && !ds.hidden)
  const hasY1InUse = y1Datasets.length > 0 && chartConfig.scales?.y1?.display !== false
  const hasGoalLineInUse = !!(chartConfig?.scales?.y?.threshold?.enabled || chartConfig?.scales?.y1?.threshold?.enabled)

  // Handle Cartesian charts (X-Axis, Y-Axis, and Goal Lines)
  return (
    <Tabs defaultValue="x" className="w-full">
      <TabsList className="grid w-full grid-cols-3 gap-1 h-auto p-1 bg-gray-100 rounded-lg">
        <TabsTrigger
          value="x"
          className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700"
        >
          X-Axis
        </TabsTrigger>
        <TabsTrigger
          value="y"
          className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1.5"
        >
          <span>Y-Axis</span>
          {hasY1InUse && (
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600 inline-block" title="Secondary Y2 axis active" />
          )}
        </TabsTrigger>
        <TabsTrigger
          value="goals"
          className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
        >
          <span>Goal Lines</span>
          {hasGoalLineInUse ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" title="Goal line active" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
          )}
        </TabsTrigger>
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
        {/* Sub-selector under Y-Axis: Left Y-Axis vs Right Y-Axis (Grouped mode + eligible types only) */}
        {chartMode === 'grouped' && ['bar', 'line', 'area', 'scatter', 'bubble', 'bar3d'].includes(chartType) ? (
          <>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100/90 rounded-lg border border-gray-200/70 mb-4">
              <button
                type="button"
                onClick={() => setYSubAxis('y')}
                className={cn(
                  "py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  ySubAxis === 'y'
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/50"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                <span>Left Y-Axis</span>
              </button>
              <button
                type="button"
                onClick={() => setYSubAxis('y1')}
                className={cn(
                  "py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  ySubAxis === 'y1'
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/50"
                    : "text-gray-500 hover:text-gray-800"
                )}
              >
                <span>Right Y-Axis</span>
                {hasY1InUse ? (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 text-purple-700 leading-tight">
                    {y1Datasets.length}
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" title="No datasets mapped" />
                )}
              </button>
            </div>

            {ySubAxis === 'y' ? (
              <AxisSettings
                key="y"
                axis="y"
                config={chartConfig.scales?.y || {}}
                onUpdate={handleConfigUpdate}
                chartType={chartType}
              />
            ) : (
              <AxisSettings
                key="y1"
                axis="y1"
                config={chartConfig.scales?.y1 || {}}
                onUpdate={handleConfigUpdate}
                chartType={chartType}
              />
            )}
          </>
        ) : (
          /* Single mode: Only show Left Y-Axis, no Right Y option */
          <AxisSettings
            key="y"
            axis="y"
            config={chartConfig.scales?.y || {}}
            onUpdate={handleConfigUpdate}
            chartType={chartType}
          />
        )}
      </TabsContent>

      <TabsContent value="goals" className="mt-4">
        <GoalLinesTab
          chartConfig={chartConfig}
          onUpdate={handleConfigUpdate}
          hasY1InUse={hasY1InUse}
        />
      </TabsContent>
    </Tabs>
  )
}
