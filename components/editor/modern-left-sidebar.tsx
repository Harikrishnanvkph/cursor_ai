"use client"

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { useShallow } from "zustand/react/shallow"
import { ChevronLeft, ArrowLeftRight, History, LayoutTemplate } from "lucide-react"
import { cn } from "@/lib/utils"
import { CHART_TABS, getVisibleTemplateTabs } from "@/components/sidebar"
import { ConfigPanel } from "@/components/config-panel"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useEditorSidebarContext } from "@/components/editor/editor-sidebar-context"
import { ModernPanelProvider } from "@/components/editor/modern-panel-context"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore, ensureDefaultFormatSelected } from "@/lib/stores/format-gallery-store"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const DEFAULT_PANEL_WIDTH = 320
const MIN_PANEL_WIDTH = 260
const MAX_PANEL_WIDTH = 440

const RAIL_SHORT_LABELS: Record<string, string> = {
  tpl_format_zones: "Zones",
}

interface ModernLeftSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onNewChart?: () => void
  onSaveClick?: () => void
  isTablet?: boolean
}

export function ModernLeftSidebar({
  activeTab,
  onTabChange,
  onNewChart,
  onSaveClick,
  isTablet = false,
}: ModernLeftSidebarProps) {
  const {
    leftSidebarCollapsed,
    setLeftSidebarCollapsed,
    sidebarView,
    setSidebarView,
  } = useEditorSidebarContext()

  const {
    chartMode,
    chartData,
    activeDatasetIndex,
    setActiveDatasetIndex,
    groups,
    activeGroupId,
    setActiveGroupId,
  } = useChartStore(
    useShallow(s => ({
      chartMode: s.chartMode,
      chartData: s.chartData,
      activeDatasetIndex: s.activeDatasetIndex,
      setActiveDatasetIndex: s.setActiveDatasetIndex,
      groups: s.groups,
      activeGroupId: s.activeGroupId,
      setActiveGroupId: s.setActiveGroupId,
    }))
  )

  const { editorMode, setEditorMode } = useTemplateStore(
    useShallow(s => ({
      editorMode: s.editorMode,
      setEditorMode: s.setEditorMode,
    }))
  )
  const selectedFormatId = useFormatGalleryStore(s => s.selectedFormatId)

  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_PANEL_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartXRef = useRef<number>(0)
  const resizeStartWidthRef = useRef<number>(DEFAULT_PANEL_WIDTH)

  const datasets = chartData.datasets || []
  const isTemplateMode = editorMode === "template"

  const visibleTabs = useMemo(() => {
    return isTemplateMode ? getVisibleTemplateTabs(selectedFormatId) : CHART_TABS
  }, [isTemplateMode, selectedFormatId])

  const handleBackToChart = useCallback(() => {
    setEditorMode("chart")
    onTabChange("types_toggles")
    setSidebarView("tools")
  }, [setEditorMode, onTabChange, setSidebarView])

  const handleRecentsClick = () => {
    if (sidebarView === "recents" && !leftSidebarCollapsed) {
      setLeftSidebarCollapsed(true)
    } else {
      setSidebarView("recents")
      setLeftSidebarCollapsed(false)
    }
  }

  const handleTabClick = (tabId: string) => {
    if (tabId === "templates") {
      const templateStore = useTemplateStore.getState()
      ensureDefaultFormatSelected(useChartStore.getState().chartType || "bar")
      templateStore.setGenerateMode("format")
      templateStore.setEditorMode("template")
      onTabChange("tpl_templates")
      setSidebarView("tools")
      setLeftSidebarCollapsed(false)
      return
    }

    if (sidebarView === "tools" && activeTab === tabId) {
      setLeftSidebarCollapsed(prev => !prev)
      return
    }

    setSidebarView("tools")
    onTabChange(tabId)
    setLeftSidebarCollapsed(false)
  }

  // Drag-resize handlers for contextual panel
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isTablet) return
      e.preventDefault()
      resizeStartXRef.current = e.clientX
      resizeStartWidthRef.current = panelWidth
      setIsResizing(true)
    },
    [isTablet, panelWidth]
  )

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartXRef.current
      const nextWidth = Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, resizeStartWidthRef.current + delta))
      setPanelWidth(nextWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.body.style.userSelect = "none"
    document.body.style.cursor = "col-resize"
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.body.style.userSelect = ""
      document.body.style.cursor = ""
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  const hasChartEntities =
    (chartMode === "single" && datasets.length > 0) ||
    (chartMode === "grouped" && groups.length > 0)

  const renderPanelHeader = () => {
    if (sidebarView === "recents") {
      return null
    }

    if (!isTemplateMode && !hasChartEntities) {
      return null
    }

    return (
      <div className="flex flex-col flex-shrink-0">
        {/* Contextual Entity / Mode Sub-Bar */}
        <div className="px-3.5 py-2.5 bg-white border-b border-slate-200/80">
          {isTemplateMode ? (
            <div className="flex items-center justify-between gap-2">
              <div className="h-7 flex items-center gap-1.5 px-2.5 bg-amber-50 border border-amber-200/80 rounded-lg min-w-0">
                <LayoutTemplate className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span className="text-[11px] font-semibold text-amber-800 tracking-tight truncate">
                  {selectedFormatId ? "Format Editor" : "Template Editor"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleBackToChart}
                className="h-7 px-2.5 flex items-center gap-1 rounded-lg text-[11px] font-semibold text-indigo-600 bg-white hover:bg-indigo-50/70 border border-slate-200/90 transition-colors duration-150 shrink-0 cursor-pointer"
                title="Back to Chart Editor"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Back to Chart</span>
              </button>
            </div>
          ) : chartMode === "single" ? (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Dataset</span>
              <Select
                value={activeDatasetIndex.toString()}
                onValueChange={val => setActiveDatasetIndex(parseInt(val, 10))}
              >
                <SelectTrigger className="h-8 text-xs font-medium text-slate-800 bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/70 transition-colors duration-150 shadow-none rounded-lg flex-1 min-w-0">
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
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700 shrink-0">Group</span>
              <Select value={activeGroupId} onValueChange={setActiveGroupId}>
                <SelectTrigger className="h-8 text-xs font-medium text-slate-800 bg-slate-50/70 border-slate-200/90 hover:bg-slate-100/70 transition-colors duration-150 shadow-none rounded-lg flex-1 min-w-0">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    )
  }

  const isRecentsSelected = sidebarView === "recents"
  const isRecentsOpen = isRecentsSelected && !leftSidebarCollapsed

  return (
    <>
      {/* 78px Vertical Navigation Rail */}
      <aside
        aria-label="Editor sections"
        className="w-[78px] flex-shrink-0 h-full bg-white border-r border-slate-200/90 flex flex-col items-center py-2 select-none z-20 antialiased"
      >
        {/* Recents Rail Item — unified vertical Icon + Label rhythm */}
        <div className="w-full px-1 flex-shrink-0">
          <button
            type="button"
            onClick={handleRecentsClick}
            title="Recent Charts & History"
            aria-current={isRecentsOpen ? "page" : undefined}
            className={cn(
              "relative w-full flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              isRecentsOpen
                ? "bg-indigo-50/80 text-indigo-700 font-semibold"
                : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium"
            )}
          >
            {isRecentsOpen && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-indigo-600" />
            )}
            <History className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
            <span className="text-xs leading-tight tracking-normal text-center whitespace-nowrap">
              Recents
            </span>
          </button>
        </div>

        <div className="w-8 h-px bg-slate-100 my-1.5 flex-shrink-0" />

        {/* Section Tabs */}
        <nav className="flex-1 w-full flex flex-col items-center gap-1 px-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {visibleTabs.map(tab => {
            const Icon = tab.icon
            const isSelected = sidebarView === "tools" && activeTab === tab.id
            const isTabOpen = isSelected && !leftSidebarCollapsed
            const railLabel = RAIL_SHORT_LABELS[tab.id] || tab.label
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabClick(tab.id)}
                title={tab.label}
                aria-current={isTabOpen ? "page" : undefined}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  isTabOpen
                    ? isTemplateMode
                      ? "bg-amber-50/90 text-amber-800 font-semibold"
                      : "bg-indigo-50/80 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium"
                )}
              >
                {isTabOpen && (
                  <span
                    className={cn(
                      "absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full",
                      isTemplateMode ? "bg-amber-500" : "bg-indigo-600"
                    )}
                  />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                <span className="text-xs leading-tight tracking-normal text-center whitespace-nowrap">
                  {railLabel}
                </span>
              </button>
            )
          })}
        </nav>

        {/* Back to Chart quick button on rail in Template mode */}
        {isTemplateMode && (
          <div className="pt-1.5 border-t border-slate-100 mt-1.5 w-full px-1 flex-shrink-0">
            <button
              type="button"
              onClick={handleBackToChart}
              title="Back to Chart Editor"
              className="w-full flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl text-indigo-700 hover:bg-indigo-50/70 font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeftRight className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <span className="text-xs leading-tight tracking-normal text-center whitespace-nowrap">
                Chart
              </span>
            </button>
          </div>
        )}
      </aside>

      {/* Tablet backdrop when contextual panel overlays the canvas */}
      {isTablet && !leftSidebarCollapsed && (
        <div
          className="fixed inset-0 top-[52px] left-[78px] bg-black/20 z-20 transition-opacity"
          onClick={() => setLeftSidebarCollapsed(true)}
        />
      )}

      {/* Adjacent Contextual Panel */}
      {!leftSidebarCollapsed && (
        <aside
          aria-label="Section controls"
          className={cn(
            "h-full bg-white border-r border-slate-200/90 flex flex-col min-h-0 relative",
            isTablet
              ? "fixed left-[78px] top-[52px] bottom-0 w-80 max-w-[calc(100vw-78px)] z-30 shadow-xl"
              : "flex-shrink-0 z-10"
          )}
          style={isTablet ? undefined : { width: `${panelWidth}px` }}
        >
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
            {renderPanelHeader()}

            <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
              {sidebarView === "recents" ? (
                <HistoryDropdown variant="sidebar" />
              ) : (
                <ModernPanelProvider>
                  <div className="modern-tools-scope flex-1 min-h-0 flex flex-col overflow-hidden">
                    <ConfigPanel
                      hideHeader
                      className="border-l-0 shadow-none"
                      activeTab={activeTab}
                      onTabChange={onTabChange}
                      onNewChart={onNewChart}
                      onSaveClick={onSaveClick}
                    />
                  </div>
                </ModernPanelProvider>
              )}
            </div>
          </div>

          {/* Right-edge Resize Handle (Desktop) */}
          {!isTablet && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize settings panel"
              onMouseDown={handleResizeMouseDown}
              onDoubleClick={() => setPanelWidth(DEFAULT_PANEL_WIDTH)}
              title="Drag to resize · Double-click to reset"
              className={cn(
                "absolute top-0 right-0 bottom-0 w-1 cursor-col-resize z-20 transition-colors",
                isResizing ? "bg-indigo-400/70" : "hover:bg-indigo-300/60"
              )}
            />
          )}

          {/* Canva-style Floating Edge Collapse Handle */}
          <button
            type="button"
            onClick={() => setLeftSidebarCollapsed(true)}
            title="Collapse panel"
            aria-label="Collapse panel"
            className="absolute top-1/2 -translate-y-1/2 -right-3.5 w-3.5 h-11 bg-white border border-l-0 border-slate-200/90 rounded-r-md shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer z-30"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
        </aside>
      )}
    </>
  )
}
