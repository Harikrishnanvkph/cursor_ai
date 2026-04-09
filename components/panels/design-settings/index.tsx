"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { LegendTab } from "./legend-tab"
import { TitleTab } from "./title-tab"
import { BackgroundTab } from "./background-tab"
import { setNestedProperty } from "@/lib/utils"

type ConfigPathUpdate = {
    path: string;
    value: any;
}

export function DesignPanel() {
    const { chartConfig, chartType, chartData } = useChartStore()
    const { updateChartConfig, updateDataset } = useChartActions()

    const applyConfigUpdates = (updates: ConfigPathUpdate[]) => {
        let newConfig = { ...chartConfig }

        updates.forEach(({ path, value }) => {
            newConfig = setNestedProperty(newConfig, path, value);
        })

        updateChartConfig(newConfig)
    }

    const handleConfigUpdate = (path: string, value: any) => {
        applyConfigUpdates([{ path, value }])
    }

    const handleUpdateDataset = (datasetIndex: number, property: string, value: any) => {
        updateDataset(datasetIndex, { [property]: value })
    }

    return (
        <div className="space-y-4">
            <Tabs defaultValue="legend" className="w-full">
                <div className="overflow-x-auto">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="legend">Legend</TabsTrigger>
                        <TabsTrigger value="title">Title</TabsTrigger>
                        <TabsTrigger value="background">Background</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="legend">
                    <LegendTab
                        chartConfig={chartConfig}
                        chartType={chartType}
                        applyConfigUpdates={applyConfigUpdates}
                        handleConfigUpdate={handleConfigUpdate}
                    />
                </TabsContent>

                <TabsContent value="title">
                    <TitleTab
                        chartConfig={chartConfig}
                        handleConfigUpdate={handleConfigUpdate}
                    />
                </TabsContent>

                <TabsContent value="background">
                    <BackgroundTab
                        chartConfig={chartConfig}
                        handleConfigUpdate={handleConfigUpdate}
                    />
                </TabsContent>
            </Tabs>
        </div>
    )
}
