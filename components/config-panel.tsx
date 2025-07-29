"use client"

import { DatasetPanel } from "./panels/dataset-panel"
import { DesignPanel } from "./panels/design-panel"
import { AxesPanel } from "./panels/axes/axes-panel"
import { LabelsPanel } from "./panels/labels-panel"
import { OverlayPanel } from "./panels/overlay-panel"
import { AnimationsPanel } from "./panels/animations-panel"
import { AdvancedPanel } from "./panels/advanced-panel"
import { ExportPanel } from "./panels/export-panel"
import { TypesTogglesPanel } from "./panels/types-toggles-panel"
import { DatasetsSlicesPanel } from "./panels/datasets-slices-panel"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, User, Settings } from "lucide-react"
import { useEffect, useState } from "react"

interface ConfigPanelProps {
  activeTab: string
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onTabChange?: (tab: string) => void
}

export function ConfigPanel({ activeTab, onToggleSidebar, isSidebarCollapsed, onTabChange }: ConfigPanelProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 576);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const renderPanel = () => {
    switch (activeTab) {
      case "types_toggles":
        return <TypesTogglesPanel />
      case "datasets_slices":
        return <DatasetsSlicesPanel activeTab={activeTab} />
      case "datasets":
        return <DatasetPanel />
      case "design":
        return <DesignPanel />
      case "axes":
        return <AxesPanel />
      case "labels":
        return <LabelsPanel />
      case "overlay":
        return <OverlayPanel />
      case "animations":
        return <AnimationsPanel />
      case "advanced":
        return <AdvancedPanel />
      case "export":
        return <ExportPanel onTabChange={onTabChange} />
      default:
        return <TypesTogglesPanel />
    }
  }

  const getPanelTitle = () => {
    const titles: Record<string, string> = {
      types_toggles: "Chart Types",
      datasets_slices: "Datasets & Slices",
      datasets: "Datasets",
      design: "Design",
      axes: "Axes",
      labels: "Labels",
      overlay: "Overlays",
      animations: "Animations",
      advanced: "Advanced",
      export: "Export"
    }
    return titles[activeTab] || "Configuration"
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-l border-gray-200 shadow-sm">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-3">
            {onToggleSidebar && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleSidebar}
                className="h-8 w-8 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
              </Button>
            )}
            <div className="flex flex-col">
              <h3 className="text-sm font-semibold text-gray-900 leading-tight">{getPanelTitle()}</h3>
              <p className="text-xs text-gray-500 leading-tight">
                {activeTab === 'overlay' ? 'Floating Images and Texts' : 'Customize your chart'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Avatar className="h-8 w-8 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group">
              <AvatarFallback className="bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700 text-xs font-medium group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-200">
                <User className="h-3 w-3" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      )}
      
      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="animate-in fade-in duration-200">
          {renderPanel()}
        </div>
      </div>
    </div>
  )
}
