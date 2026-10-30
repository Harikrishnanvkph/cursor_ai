"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useChartStore } from "@/lib/chart-store"
import { DatasetSettings } from "./datasets-slices/dataset-settings"
import { SliceSettings } from "./datasets-slices/slice-settings"

export function DatasetsSlicesPanel() {
  const { chartType } = useChartStore()
  const isTimeline = chartType === 'timeline'

  return (
    <Tabs defaultValue="datasets" value="datasets" className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 bg-gray-100 rounded-lg">
        <TabsTrigger
          value="datasets"
          className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700"
        >
          Datasets
        </TabsTrigger>
        {!isTimeline ? (
          <TabsTrigger
            value="slices"
            className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700"
          >
            Slices
          </TabsTrigger>
        ) : (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-xs py-2 rounded-md text-gray-400 bg-gray-50/70 text-center cursor-not-allowed select-none opacity-60">
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

      <TabsContent value="datasets" className="mt-2.5">
        <DatasetSettings />
      </TabsContent>

      {!isTimeline && (
        <TabsContent value="slices" className="mt-2.5">
          <SliceSettings />
        </TabsContent>
      )}
    </Tabs>
  )
} 