"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useChartStore } from "@/lib/chart-store"
import { DatasetSettings } from "./datasets-slices/dataset-settings"
import { SliceSettings } from "./datasets-slices/slice-settings"

export function DatasetsSlicesPanel() {
  const { chartType } = useChartStore()

  // All chart types now support full Datasets & Slices Configuration
  return (
    <Tabs defaultValue="datasets" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="datasets">Datasets</TabsTrigger>
        <TabsTrigger value="slices">Slices</TabsTrigger>
      </TabsList>

      <TabsContent value="datasets" className="mt-4">
        <DatasetSettings />
      </TabsContent>

      <TabsContent value="slices" className="mt-4">
        <SliceSettings />
      </TabsContent>
    </Tabs>
  )
} 