"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartStore } from "@/lib/chart-store"
import { useChartConfig, useChartType, useChartData } from "@/lib/hooks/use-chart-state"
import { AxisSettings } from "./axis-settings"
import { RadialAxisSettings } from "./radial-axis-settings"
import { ArcSettings } from "./arc-settings"
import { GaugeScaleSettings } from "./gauge-scale-settings"
import { TimelineAxisSettings } from "./timeline-axis-settings"
import { GoalLinesTab } from "./goal-lines-tab"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { cn, setNestedProperty } from "@/lib/utils"

export function AxesPanel() {
  const chartConfig = useChartConfig()
  const chartType = useChartType()
  const chartData = useChartData()
  const chartMode = useChartStore(state => state.chartMode)
  const { updateChartConfig } = useChartActions()
  const [ySubAxis, setYSubAxis] = useState<'y' | 'y1'>('y')

  const handleConfigUpdate = (path: string, value: any) => {
    // Fetch latest config directly from store to prevent closure staleness on rapid sequential updates
    const currentConfig = useChartStore.getState().getActiveChartConfig();
    const newConfig = setNestedProperty(currentConfig, path, value)
    updateChartConfig(newConfig)
  }

  // Handle gauge charts - show GaugeScaleSettings
  if (chartType === 'gauge') {
    return (
      <GaugeScaleSettings
        options={chartConfig}
        onUpdate={handleConfigUpdate}
      />
    )
  }

  // Handle pie and doughnut charts - show ArcSettings
  if (['pie', 'doughnut', 'pie3d', 'doughnut3d'].includes(chartType)) {
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

  // Check if y1 is currently in use by any dataset and scale config
  const datasets = chartData?.datasets || []
  const y1Datasets = datasets.filter((ds: any) => ds?.yAxisID === 'y1' && !ds.hidden)
  const hasY1InUse = y1Datasets.length > 0 && chartConfig.scales?.y1?.display !== false
  const hasGoalLineInUse = !!(chartConfig?.scales?.y?.threshold?.enabled || chartConfig?.scales?.y1?.threshold?.enabled)

  // Handle Cartesian charts (X-Axis, Y-Axis, and Goal Lines)
  return (
    <Tabs defaultValue="x" className="w-full">
      <TabsList className={cn("grid w-full gap-1 h-auto p-1 bg-gray-100 rounded-lg", chartType === 'timeline' ? "grid-cols-4" : "grid-cols-3")}>
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
        {chartType === 'timeline' && (
          <TabsTrigger
            value="timeline"
            className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 font-medium"
          >
            <span>Timeline</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block" />
          </TabsTrigger>
        )}
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

      {chartType === 'timeline' && (
        <TabsContent value="timeline" className="mt-4">
          <TimelineAxisSettings
            options={chartConfig}
            onUpdate={handleConfigUpdate}
          />
        </TabsContent>
      )}

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
