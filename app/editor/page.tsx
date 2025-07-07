"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { ConfigPanel } from "@/components/config-panel"
import { useChartStore } from "@/lib/chart-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PanelLeft, PanelRight, Plus, Sparkles } from "lucide-react"
import Link from "next/link"

export default function EditorPage() {
  const [activeTab, setActiveTab] = useState("types_toggles")
  const { chartConfig } = useChartStore()
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Navigation */}
      {leftSidebarCollapsed ? (
        <div className="w-16 flex-shrink-0 flex flex-col h-full items-center bg-white border-r border-gray-200 p-2">
          {/* Top button: Back (ArrowLeft) + AI (Sparkles) icon, side by side, navigates to /landing */}
          <Link href="/landing" className="mb-6 mt-4">
            <Button variant="outline" size="icon" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex flex-row items-center justify-center gap-1">
              <ArrowLeft className="h-5 w-5" />
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          {/* Sidebar icons (remove first icon) */}
          {[
            { id: "types_toggles", icon: "BarChart3" },
            { id: "datasets_slices", icon: "Database" },
            { id: "design", icon: "Palette" },
            { id: "axes", icon: "Grid" },
            { id: "labels", icon: "Tag" },
            { id: "animations", icon: "Zap" },
            { id: "advanced", icon: "Settings" },
            { id: "export", icon: "Download" },
          ].map((tab, idx) => {
            const Icon = require("lucide-react")[tab.icon]
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-2 p-2 rounded hover:bg-gray-100 ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-gray-500"}`}
                title={tab.id.replace("_", " ")}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="w-64 flex-shrink-0 flex flex-col h-full">
          <div className="p-4">
            <Link href="/landing" className="block mb-4">
              <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Generate AI Chart
              </Button>
            </Link>
            <div className="border-b mb-4"></div>
            <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
        </div>
      )}

      {/* Center Area - Chart Preview */}
      <div className="flex-1 min-w-0 pr-4 pl-2 py-4">
        <ChartPreview
          onToggleLeftSidebar={() => setLeftSidebarCollapsed((v) => !v)}
          isLeftSidebarCollapsed={leftSidebarCollapsed}
          onToggleSidebar={() => setRightSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={rightSidebarCollapsed}
        />
      </div>

      {/* Right Panel - Configuration */}
      {!rightSidebarCollapsed && (
        <div className="w-80 flex-shrink-0 border-l bg-white overflow-hidden">
          <ConfigPanel activeTab={activeTab} />
        </div>
      )}
    </div>
  )
} 