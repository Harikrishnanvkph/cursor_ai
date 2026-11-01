"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEditorSidebarContext } from "./editor-sidebar-context"
import { Sidebar, CHART_TABS, TEMPLATE_TABS, getVisibleTemplateTabs } from "@/components/sidebar"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { cn } from "@/lib/utils"
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
  BarChart2,
  PanelLeft,
  ExternalLink,
  Edit3,
  History
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"

export function EditorLeftSidebar() {
  const router = useRouter()
  const {
    activeTab,
    setActiveTab,
    leftSidebarCollapsed,
    setLeftSidebarCollapsed,
    sidebarView,
    setSidebarView
  } = useEditorSidebarContext()

  const { editorMode } = useTemplateStore()
  const { selectedFormatId } = useFormatGalleryStore()
  const sidebarRef = React.useRef<HTMLDivElement>(null)

  const TABS = React.useMemo(() => {
    if (editorMode === 'template') {
      return getVisibleTemplateTabs(selectedFormatId)
    }
    return CHART_TABS
  }, [editorMode, selectedFormatId])

  return (
    <div
      ref={sidebarRef}
      className={`h-full bg-white border-r border-gray-200 flex flex-col relative z-10 ${
        leftSidebarCollapsed 
          ? "w-16 items-center" 
          : "w-56"
      }`}
    >
      {leftSidebarCollapsed ? (
        /* Collapsed Sidebar Content - w-16 static width, hides text labels, fits perfect */
        <div className="w-16 flex-shrink-0 flex flex-col h-full items-center py-3 overflow-hidden group">
          <div className="flex flex-col items-center space-y-3 w-full">
            {/* Company Logo / Toggle Sidebar */}
            <button
              onClick={() => setLeftSidebarCollapsed(false)}
              className="p-2 bg-white border border-slate-200 rounded-xl shadow-xs hover:bg-slate-50 transition-all flex items-center justify-center w-9 h-9 outline-none focus:outline-none focus-visible:outline-none"
              title="Expand Sidebar"
            >
              {/* Logo image, hidden when parent sidebar is hovered */}
              <img src="/logo.png" alt="Company Logo" className="w-5 h-5 object-contain group-hover:hidden" />
              
              {/* PanelLeft icon, visible only when parent sidebar is hovered */}
              <PanelLeft className="w-5 h-5 hidden group-hover:block text-slate-500 hover:text-slate-800" />
            </button>

            {/* Quick Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all hover:shadow-sm outline-none focus:outline-none focus-visible:outline-none"
                  title="Quick Navigation"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-64 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl rounded-2xl p-1.5">
                <DropdownMenuItem
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-default bg-indigo-50/60 text-indigo-600"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="text-sm font-semibold leading-tight">
                      Advanced Editor
                    </span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Full canvas & infographic design
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-200/70" />

                <DropdownMenuItem
                  onClick={() => router.push('/landing')}
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      AI Chart
                    </span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Create charts with AI prompts
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/board')}
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      Dashboard
                    </span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Manage saved charts & templates
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-10 h-px bg-gray-200 my-4" />

          {/* Config Tabs Icons — natural height, scrollable only if screen is very short */}
          <div className="flex flex-col items-center space-y-1 w-full overflow-y-auto overflow-x-hidden no-scrollbar">
            {/* Recents / History Icon */}
            <button
              onClick={() => {
                setSidebarView('recents')
                setLeftSidebarCollapsed(false)
              }}
              className={cn(
                "p-2 rounded-lg flex items-center justify-center w-10 h-10 transition-all duration-200",
                sidebarView === 'recents'
                  ? "bg-slate-100 text-slate-800 shadow-sm border border-slate-200"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              )}
              title="Recents"
            >
              <History className="w-4 h-4" />
            </button>

            <div className="w-6 h-px bg-gray-200 my-1" />

            {TABS.map((tab) => {
              const Icon = tab.icon
              const isTabActive = sidebarView === 'tools' && activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSidebarView('tools')
                    if (tab.id === 'templates') {
                      const templateStore = useTemplateStore.getState()
                      if (!templateStore.currentTemplate) {
                        templateStore.applyTemplate('template-1')
                      }
                      useTemplateStore.getState().setEditorMode('template')
                      setActiveTab('tpl_templates')
                    } else {
                      setActiveTab(tab.id)
                    }
                    // Do NOT expand the sidebar here — expanding should only happen
                    // via the logo/expand button or clicking the empty sidebar area.
                  }}
                  className={`p-2 rounded-lg flex items-center justify-center w-10 h-10 transition-all duration-200 ${isTabActive
                    ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  title={tab.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Empty space — clicking here expands the sidebar */}
          <div
            className="flex-1 w-full cursor-pointer"
            onClick={() => setLeftSidebarCollapsed(false)}
            title="Expand Sidebar"
          />
        </div>
      ) : (
        /* Expanded Sidebar Content - w-56 fixed content view, prevents text-wrapping during width transition */
        <div className="w-56 flex-shrink-0 flex flex-col h-full overflow-hidden">
          {/* Header: Logo + Advanced Editor Dropdown & Toggle Sidebar */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-2 py-1.5 -ml-1 rounded-xl hover:bg-slate-100 transition-colors group cursor-pointer outline-none focus:outline-none focus-visible:outline-none select-none"
                  title="Switch View"
                >
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-semibold tracking-tight text-slate-800">
                    Advanced Editor
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xl z-50">
                <DropdownMenuItem
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-default bg-indigo-50/60 text-indigo-600"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="text-sm font-semibold leading-tight">
                      Advanced Editor
                    </span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Full canvas & infographic design
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-200/70" />

                <DropdownMenuItem
                  onClick={() => router.push('/landing')}
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      AI Chart
                    </span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Create charts with AI prompts
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/board')}
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      Dashboard
                    </span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Manage saved charts & templates
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Right: Toggle Sidebar Button */}
            <button
              onClick={() => setLeftSidebarCollapsed(true)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
              title="Close Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <Sidebar
              activeTab={activeTab}
              onTabChange={setActiveTab}
              isLeftSidebarCollapsed={leftSidebarCollapsed}
            />
          </div>
        </div>
      )}
    </div>
  )
}
