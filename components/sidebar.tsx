"use client"

import { cn } from "@/lib/utils"
import { useChartStore } from "@/lib/chart-store"
import {
  AlignEndHorizontal,
  Database,
  Palette,
  Grid,
  Tag,
  Layers,
  SlidersHorizontal,
  Download,
  ChevronRight,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
  const {
    chartMode,
    chartData,
    activeDatasetIndex,
    setActiveDatasetIndex,
    groups,
    activeGroupId,
    setActiveGroupId
  } = useChartStore()

  const datasets = chartData.datasets || []

  return (
    <div className="h-full bg-white border-r border-gray-200 p-3 flex flex-col overflow-hidden">
      <div className={cn(
        "flex items-center flex-shrink-0 gap-2 mb-4",
        !onToggleLeftSidebar && "mb-2"
      )}>
        <div className="flex-1 min-w-0">
          {chartMode === 'single' ? (
            <Select
              value={activeDatasetIndex.toString()}
              onValueChange={(val) => setActiveDatasetIndex(parseInt(val))}
            >
              <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                <SelectValue placeholder="Select dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map((ds: any, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    {ds.sourceTitle || ds.label || `Dataset ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select
              value={activeGroupId}
              onValueChange={setActiveGroupId}
            >
              <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                <SelectValue placeholder="Select group" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {onToggleLeftSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLeftSidebar}
            className="h-8 w-8 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg flex-shrink-0"
            title={isLeftSidebarCollapsed ? "Expand Left Sidebar" : "Collapse Left Sidebar"}
          >
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
