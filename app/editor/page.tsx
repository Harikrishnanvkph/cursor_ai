"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { ConfigPanel } from "@/components/config-panel"
import { useChartStore } from "@/lib/chart-store"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, BarChart3, Database, Palette, Grid, Tag, Zap, Settings, Download } from "lucide-react"
import Link from "next/link"
import React from "react"
import { ResizableChartArea } from "@/components/resizable-chart-area"

const TABS = [
  { id: "types_toggles", label: "Types", icon: BarChart3 },
  { id: "datasets_slices", label: "Datasets", icon: Database },
  { id: "design", label: "Design", icon: Palette },
  { id: "axes", label: "Axes", icon: Grid },
  { id: "labels", label: "Labels", icon: Tag },
  { id: "animations", label: "Animations", icon: Zap },
  { id: "advanced", label: "Advanced", icon: Settings },
  { id: "export", label: "Export", icon: Download },
]

// Custom hook to detect <=576px
function useIsMobile576() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 576 : false
  );
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 576);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// Custom hook to get screen dimensions
function useScreenDimensions() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    function updateDimensions() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);
  
  return dimensions;
}

export default function EditorPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [activeTab, setActiveTab] = useState("types_toggles")
  const { chartConfig, updateChartConfig } = useChartStore()
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<string | null>(null)
  const isMobile = useIsMobile576();
  const { width: screenWidth, height: screenHeight } = useScreenDimensions();

  // Auto-apply mobile dimensions when Manual Dimensions is enabled on mobile
  useEffect(() => {
    if (isMobile && screenWidth > 0) {
      // Automatically enable Manual Dimensions on mobile devices
      const mobileWidth = `${screenWidth}px`;
      const mobileHeight = `${screenWidth}px`; // Same as width for square aspect
      
      updateChartConfig({
        ...chartConfig,
        manualDimensions: true,
        responsive: false,
        maintainAspectRatio: false,
        width: mobileWidth,
        height: mobileHeight
      });
    }
  }, [isMobile, screenWidth, updateChartConfig]);

  if (!mounted) {
    return null; // Or a loading spinner if you prefer
  }

  // Mobile layout for <=576px
  if (isMobile) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gray-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b bg-white flex-shrink-0">
          <Link href="/landing">
            <Button variant="outline" className="xs400:p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex flex-row items-center justify-center gap-1">
              <ArrowLeft className="h-5 w-5 xs400:hidden" />
              Generate
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-gray-900 xs400:text-base">Chart Editor</span>
            {isMobile && (
              <span className="text-xs text-gray-500">
                {screenWidth}px × {screenWidth}px
              </span>
            )}
          </div>
          <div className="w-10" /> {/* Spacer for symmetry */}
        </div>
        {/* Chart Preview */}
        <div className="flex-1 flex items-start justify-center p-2 pb-20 overflow-hidden">
          <div className="w-full max-w-full overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <ChartPreview />
          </div>
        </div>
        {/* Bottom Navigation - horizontally scrollable, tiles never squish */}
        {/* fixed right-0 left-0 bottom-0 top-0 */}
        <nav className="fixed right-0 left-0 bottom-0 w-full bg-white border-t z-50 overflow-x-auto whitespace-nowrap flex-shrink-0">
          <div className="flex flex-row min-w-full">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobilePanel(tab.id)}
                  className={`flex flex-col items-center justify-center px-2 py-2 min-w-[64px] flex-shrink-0 flex-grow text-center ${mobilePanel === tab.id ? "text-blue-700" : "text-gray-500"}`}
                  style={{ maxWidth: 96 }}
                >
                  <Icon className="h-6 w-6 mb-1 mx-auto" />
                  <span className="text-xs font-medium truncate w-full">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
        {/* Bottom Sheet/Drawer for Active Panel */}
        {mobilePanel && (
          <div className="fixed bottom-0 left-0 w-full max-w-[480px] mx-auto bg-white rounded-t-2xl shadow-2xl z-[60] animate-slide-up flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="flex items-center justify-between px-4 py-2 border-b">
              <span className="font-semibold text-base">{TABS.find(t => t.id === mobilePanel)?.label}</span>
              <button onClick={() => setMobilePanel(null)} className="text-gray-400 hover:text-gray-700 p-1">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              <ConfigPanel activeTab={mobilePanel} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop layout for >576px (original, unchanged)
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Navigation */}
      {leftSidebarCollapsed ? (
        <div className="w-16 flex-shrink-0 flex flex-col h-full items-center bg-white border-r border-gray-200 p-2">
          <Link href="/landing" className="mb-6 mt-4">
            <Button variant="outline" size="icon" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex flex-row items-center justify-center gap-1">
              <ArrowLeft className="h-5 w-5" />
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-2 p-2 rounded hover:bg-gray-100 ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-gray-500"}`}
                title={tab.label}
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