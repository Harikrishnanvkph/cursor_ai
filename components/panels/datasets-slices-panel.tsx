"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useChartStore } from "@/lib/chart-store"
import { DatasetSettings } from "./datasets-slices/dataset-settings"
import { SliceSettings } from "./datasets-slices/slice-settings"
import { useIsModernPanel, MODERN_PANEL_UI } from "@/components/editor/modern-panel-context"
import { cn } from "@/lib/utils"

export function DatasetsSlicesPanel() {
  const isModern = useIsModernPanel()
  const { chartType } = useChartStore()
  const isTimeline = chartType === 'timeline'
  const [activeTab, setActiveTab] = useState<string>("datasets")

  useEffect(() => {
    if (isTimeline && activeTab === "slices") {
      setActiveTab("datasets")
    }
  }, [isTimeline, activeTab])

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList
        className={
          isModern
            ? cn("grid w-full grid-cols-2 gap-1 h-auto", MODERN_PANEL_UI.segTrack)
            : "grid w-full grid-cols-2 gap-1 h-auto p-1 bg-slate-100/90 rounded-xl border border-slate-200/70"
        }
      >
        <TabsTrigger
          value="datasets"
          className={
            isModern
              ? MODERN_PANEL_UI.segTriggerRadix
              : "text-xs font-medium py-1.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800"
          }
        >
          Datasets
        </TabsTrigger>
        {!isTimeline ? (
          <TabsTrigger
            value="slices"
            className={
              isModern
                ? MODERN_PANEL_UI.segTriggerRadix
                : "text-xs font-medium py-1.5 rounded-lg transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs text-slate-500 hover:text-slate-800"
            }
          >
            Slices
          </TabsTrigger>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs font-medium py-1.5 rounded-[6px] text-slate-400 bg-slate-50/70 text-center cursor-not-allowed select-none opacity-70">
                  Slices (N/A)
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs max-w-[220px]">
                Timeline Series data points are continuous time-series coordinates managed at the dataset level.
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TabsList>

      <TabsContent value="datasets" className="mt-3">
        <DatasetSettings />
      </TabsContent>

      {!isTimeline && (
        <TabsContent value="slices" className="mt-3">
          <SliceSettings />
        </TabsContent>
      )}
    </Tabs>
  )
} 