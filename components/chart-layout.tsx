"use client"

import { ChartPreview } from "@/components/chart-preview"
import { ConfigSidebar } from "@/components/config-sidebar"
import { useChartStore } from "@/lib/chart-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

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
          isCollapsed ? "right-0" : "right-[280px]"
        )}
        style={{
          left: 0,
          width: isCollapsed ? '100%' : 'calc(100% - 280px)'
        }}
      >
        <ChartPreview 
          onToggleSidebar={toggleSidebar} 
          isSidebarCollapsed={isCollapsed}
          onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          isLeftSidebarCollapsed={!leftSidebarOpen}
        />
      </div>

      {/* Right Sidebar */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 border-l bg-white shadow-lg transition-all duration-300",
          isCollapsed ? "w-0" : "w-[280px]"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className={cn(
          "h-full overflow-auto transition-opacity duration-200",
          isCollapsed ? "opacity-0" : "opacity-100"
        )}>
          <ConfigSidebar />
        </div>
        {/* Toggle Button moved to ChartPreview header */}
      </div>
    </div>
  )
}