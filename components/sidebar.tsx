"use client"

import { BarChart3, Palette, Download, Database, Grid, Tag, Zap, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: "types_toggles", label: "Types and Toggles", icon: BarChart3 },
  { id: "datasets_slices", label: "Datasets and Slices", icon: Database },
  { id: "design", label: "Design", icon: Palette },
  { id: "axes", label: "Axes", icon: Grid },
  { id: "labels", label: "Labels", icon: Tag },
  { id: "animations", label: "Animations", icon: Zap },
  { id: "advanced", label: "Advanced", icon: Settings },
  { id: "export", label: "Export", icon: Download },
]

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="h-full bg-white border-r border-gray-200 p-3 flex flex-col overflow-hidden">
      <div className="flex items-center gap-2 mb-6 flex-shrink-0">
        <BarChart3 className="h-6 w-6 text-blue-600" />
        <span className="text-lg font-bold text-gray-900 truncate">Chart Builder</span>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-sm",
                activeTab === tab.id
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
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
