"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChartStore } from "@/lib/chart-store"
import { DatasetSettings } from "./datasets-slices/dataset-settings"
import { SliceSettings } from "./datasets-slices/slice-settings"

export function DatasetsSlicesPanel() {
  const { chartType } = useChartStore()

  // All chart types now support full Datasets & Slices Configuration
  return (
    <Tabs defaultValue="datasets" className="w-full">
      <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 bg-gray-100 rounded-lg">
        <TabsTrigger
          value="datasets"
          className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700"
        >
          Datasets
        </TabsTrigger>
        <TabsTrigger
          value="slices"
          className="text-xs py-2 rounded-md transition-all data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm text-gray-500 hover:text-gray-700"
        >
          Slices
        </TabsTrigger>
      </TabsList>

      <TabsContent value="datasets" className="mt-2.5">
        <DatasetSettings />
      </TabsContent>

      <TabsContent value="slices" className="mt-2.5">
        <SliceSettings />
      </TabsContent>
    </Tabs>
  )
} 