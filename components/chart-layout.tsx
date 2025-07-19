"use client"

import { ChartPreview } from "@/components/chart-preview"
import { ConfigSidebar } from "@/components/config-sidebar"
import { useChartStore } from "@/lib/chart-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Settings, User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HistoryDropdown } from "@/components/history-dropdown"

export function ChartLayout({ leftSidebarOpen, setLeftSidebarOpen }: { leftSidebarOpen: boolean, setLeftSidebarOpen: (open: boolean) => void }) {
  const { chartData } = useChartStore()
  const hasChartData = chartData.datasets.length > 0
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Handle chart resize when sidebar toggles
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'))
    }
    
    const timer = setTimeout(handleResize, 300) // Match this with your transition duration
    return () => clearTimeout(timer)
  }, [isCollapsed, leftSidebarOpen])

  return (
    <div className="flex flex-1 h-full overflow-hidden relative">
      {/* Chart Area */}
      <div 
        className={cn(
          "transition-all duration-300 p-4 overflow-auto absolute inset-0 right-auto",
          isCollapsed ? "right-16" : "right-[280px]"
        )}
        style={{
          left: 0,
          width: isCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 280px)'
        }}
      >
        <ChartPreview 
          onToggleSidebar={toggleSidebar} 
          isSidebarCollapsed={isCollapsed}
          onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          isLeftSidebarCollapsed={!leftSidebarOpen}
        />
      </div>

      {/* Right Sidebar (Config Panel) - Collapsible */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 border-l bg-white shadow-lg transition-all duration-300 flex flex-col z-10",
          isCollapsed ? "w-16" : "w-[280px]"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isCollapsed ? (
          // Collapsed state: show icon stack
          <div className="flex flex-col items-center h-full py-4 group">
            {/* Profile Icon (outlined user in blue circle) */}
            <div className="h-10 w-10 mb-2 flex items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            {/* Expand Icon */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 group-hover:scale-105"
              title="Expand Settings"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Vertical Text */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap">
                Expand to Tweak General Settings
              </span>
            </div>
            {/* Settings Icon */}
            <button
              className="mb-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 group-hover:scale-105"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        ) : (
          // Expanded state: show ConfigSidebar with top bar (expand, history, profile)
          <>
            <div className="flex items-center justify-between p-3 border-b bg-gray-50/50 gap-2">
              {/* Expand/Collapse Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800"
                title="Collapse Settings"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              {/* History Dropdown */}
              <div className="flex-1 flex justify-center">
                <HistoryDropdown />
              </div>
              {/* Profile Icon (outlined user in blue circle) */}
              <div className="h-8 w-8 ml-2 flex items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200">
                <User className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConfigSidebar />
            </div>
          </>
        )}
      </div>
    </div>
  )
}