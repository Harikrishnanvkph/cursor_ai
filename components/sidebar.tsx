"use client"

import { cn } from "@/lib/utils"
import { BarChart3, AlignEndHorizontal, Database, PanelLeft, Palette, Grid, Tag, Layers, SlidersHorizontal, Download, ChevronRight, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onToggleLeftSidebar?: () => void
  isLeftSidebarCollapsed?: boolean
}

const tabs = [
  { id: "types_toggles", label: "Types and Toggles", icon: AlignEndHorizontal },
  { id: "datasets_slices", label: "Datasets and Slices", icon: Database },
  { id: "design", label: "Design", icon: Palette },
  { id: "axes", label: "Axes", icon: Grid },
  { id: "labels", label: "Legend and Label", icon: Tag },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "advanced", label: "Advanced", icon: SlidersHorizontal },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "export", label: "Export", icon: Download },
]

export function Sidebar({ activeTab, onTabChange, onToggleLeftSidebar, isLeftSidebarCollapsed }: SidebarProps) {
  return (
    <div className="h-full bg-white border-r border-gray-200 p-3 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-bold text-gray-900 truncate">Chart Builder</span>
        </div>
        {onToggleLeftSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLeftSidebar}
            className="h-8 w-8 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg"
            title={isLeftSidebarCollapsed ? "Expand Left Sidebar" : "Collapse Left Sidebar"}
          >
            {/* <PanelLeft className={`h-5 w-5 transition-colors ${isLeftSidebarCollapsed ? 'text-slate-300' : 'text-black'}`} /> */}
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isLeftSidebarCollapsed ? '' : 'rotate-180'}`} />
          </Button>
        )}
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-sm border",
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium truncate">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto pt-3 border-t border-gray-200 flex-shrink-0">
        {/* Version text removed */}
      </div>
    </div>
  )
}
