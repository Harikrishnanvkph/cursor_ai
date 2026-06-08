"use client"

import React, { useState, useEffect } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { setNestedProperty } from "@/lib/utils"
import { Layers, Type, Activity, Palette, Tag } from "lucide-react"

import { BackgroundTab } from "./design-settings/background-tab"
import { TitleTab } from "./design-settings/title-tab"
import { LegendTab } from "./design-settings/legend-tab"
import { LabelsPanel } from "./labels-panel"
import { GroupedSettingsFilter } from "./grouped-settings-filter"

interface CombinedStylingPanelProps {
    initialTab?: string
}

export function CombinedStylingPanel({ initialTab }: CombinedStylingPanelProps) {
    const { chartConfig, chartType } = useChartStore()
    const { updateChartConfig } = useChartActions()
    const [activeTab, setActiveTab] = useState(initialTab || "bg")

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab)
        }
    }, [initialTab])

    const applyConfigUpdates = (updates: { path: string; value: any }[]) => {
        let newConfig = { ...chartConfig }
        updates.forEach(({ path, value }) => {
            newConfig = setNestedProperty(newConfig, path, value);
        })
        updateChartConfig(newConfig)
    }

    const handleConfigUpdate = (path: string, value: any) => {
        applyConfigUpdates([{ path, value }])
    }

    const tabs = [
        { id: "bg", label: "Bg", icon: Layers },
        { id: "title", label: "Title", icon: Type },
        { id: "legend", label: "Legend", icon: Activity },
        { id: "styling", label: "Styling", icon: Palette },
        { id: "labels", label: "Labels", icon: Tag },
    ]

    return (
        <div className="space-y-4">
            {/* Flat 5-tab bar */}
            <div className="flex items-center justify-between p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-1.5 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 rounded-xl ${
                                isActive
                                    ? "bg-blue-600 text-white shadow-sm font-semibold"
                                    : "bg-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-700/40 font-medium"
                            }`}
                        >
                            <Icon className={`w-[18px] h-[18px] ${isActive ? "text-white" : "text-slate-500 dark:text-slate-400"}`} />
                            <span className="text-[10px] leading-none">{tab.label}</span>
                        </button>
                    )
                })}
            </div>

            {/* Tab Panels */}
            <div className="mt-4 animate-in fade-in duration-200">
                {activeTab === "bg" && (
                    <BackgroundTab
                        chartConfig={chartConfig}
                        handleConfigUpdate={handleConfigUpdate}
                    />
                )}
                {activeTab === "title" && (
                    <TitleTab
                        chartConfig={chartConfig}
                        handleConfigUpdate={handleConfigUpdate}
                    />
                )}
                {activeTab === "legend" && (
                    <LegendTab
                        chartConfig={chartConfig}
                        chartType={chartType}
                        applyConfigUpdates={applyConfigUpdates}
                        handleConfigUpdate={handleConfigUpdate}
                    />
                )}
                {activeTab === "styling" && (
                    <div className="space-y-4">
                        <GroupedSettingsFilter />
                        <LabelsPanel mode="styling" />
                    </div>
                )}
                {activeTab === "labels" && (
                    <div className="space-y-4">
                        <GroupedSettingsFilter />
                        <LabelsPanel mode="labels" />
                    </div>
                )}
            </div>
        </div>
    )
}
