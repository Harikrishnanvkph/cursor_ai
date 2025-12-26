"use client"

import React, { useState } from "react"
import { AlignEndHorizontal, Database, Palette, Grid, Tag, Settings, Download, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TypesTogglesPanel } from "@/components/panels/types-toggles-panel"
import { DatasetsSlicesPanel } from "@/components/panels/datasets-slices-panel"
import { DesignPanel } from "@/components/panels/design-panel"
import { AxesPanel } from "@/components/panels/axes/axes-panel"
import { LabelsPanel } from "@/components/panels/labels-panel"
import { AdvancedPanel } from "@/components/panels/advanced-panel"
import { ExportPanel } from "@/components/panels/export-panel"
import { TemplatesPanel } from "@/components/panels/templates-panel"

const TABLET_TABS = [
  { id: "types_toggles", label: "Types", icon: AlignEndHorizontal },
  { id: "datasets_slices", label: "Data", icon: Database },
  { id: "design", label: "Style", icon: Palette },
  { id: "axes", label: "Axes", icon: Grid },
  { id: "labels", label: "Labels", icon: Tag },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "advanced", label: "Advanced", icon: Settings },
  { id: "export", label: "Export", icon: Download },
]

interface TabletConfigSidebarProps {
  className?: string
  defaultTab?: string
}

export function TabletConfigSidebar({
  className = "",
  defaultTab = "types_toggles"
}: TabletConfigSidebarProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const renderPanel = (tabId: string) => {
    switch (tabId) {
      case "types_toggles":
        return <TypesTogglesPanel />
      case "datasets_slices":
        return <DatasetsSlicesPanel activeTab={tabId} />
      case "design":
        return <DesignPanel />
      case "axes":
        return <AxesPanel />
      case "labels":
        return <LabelsPanel />
      case "templates":
        return <TemplatesPanel />
      case "advanced":
        return <AdvancedPanel />
      case "export":
        return <ExportPanel />
      default:
        return <TypesTogglesPanel />
    }
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Tab Navigation */}
      <div className="flex-shrink-0 border-b border-gray-200">
        <div className="grid grid-cols-4 gap-1 p-2">
          {TABLET_TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 h-auto py-2 text-xs transition-all duration-200 ${activeTab === tab.id
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        <div className="animate-in fade-in duration-200">
          {renderPanel(activeTab)}
        </div>
      </div>
    </div>
  )
} 