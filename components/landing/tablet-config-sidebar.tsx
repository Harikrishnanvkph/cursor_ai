"use client"

import React, { useState } from "react"
import { AlignEndHorizontal, Database, PanelTop, LayoutTemplate, Palette, Grid, Tag, Settings, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TypesTogglesPanel } from "@/components/panels/types-toggles-panel"
import { DatasetsSlicesPanel } from "@/components/panels/datasets-slices-panel"
import { DesignPanel } from "@/components/panels/design-settings"
import { AxesPanel } from "@/components/panels/axes/axes-panel"
import { LabelsPanel } from "@/components/panels/labels-panel"
import { CombinedStylingPanel } from "@/components/panels/combined-styling-panel"
import { AdvancedPanel } from "@/components/panels/advanced-panel"

import { TemplatesPanel, TemplateContentPanel } from "@/components/panels/template-settings"

const TABLET_TABS = [
  { id: "types_toggles", label: "General", icon: AlignEndHorizontal },
  { id: "datasets_slices", label: "Datasets", icon: Database },
  { id: "styling", label: "Appearance", icon: Palette },
  { id: "axes", label: "Scales", icon: Grid },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "tpl_content", label: "Content", icon: FileText },
  { id: "advanced", label: "More", icon: Settings },
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
        return <DatasetsSlicesPanel />
      case "design":
      case "labels":
      case "styling":
        return <CombinedStylingPanel />
      case "axes":
        return <AxesPanel />
      case "templates":
        return <TemplatesPanel />
      case "tpl_content":
        return <TemplateContentPanel />
      case "advanced":
        return <AdvancedPanel />

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
                className={`flex flex-col items-center gap-1 h-auto py-2 text-xs ${activeTab === tab.id
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
        <div className="animate-in fade-in">
          {renderPanel(activeTab)}
        </div>
      </div>
    </div>
  )
} 