"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DesignPanel } from "./design-settings"
import { LabelsPanel } from "./labels-panel"
import { GroupedSettingsFilter } from "./grouped-settings-filter"

export function CombinedStylingPanel() {
    return (
        <div className="space-y-4">
            <Tabs defaultValue="components" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="components">Components</TabsTrigger>
                    <TabsTrigger value="styling">Design</TabsTrigger>
                </TabsList>
                
                <TabsContent value="components" className="mt-4">
                    <DesignPanel />
                </TabsContent>
                
                <TabsContent value="styling" className="mt-4">
                    <GroupedSettingsFilter />
                    <LabelsPanel />
                </TabsContent>
            </Tabs>
        </div>
    )
}
