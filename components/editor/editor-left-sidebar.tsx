"use client"

import React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEditorSidebarContext } from "./editor-sidebar-context"
import { Sidebar, CHART_TABS, TEMPLATE_TABS } from "@/components/sidebar"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import {
  ChevronRight,
  ChevronLeft,
  LayoutDashboard,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
  BarChart2,
  PanelLeft,
  ExternalLink,
  Edit3
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"

export function EditorLeftSidebar() {
  const router = useRouter()
  const { activeTab, setActiveTab, leftSidebarCollapsed, setLeftSidebarCollapsed } = useEditorSidebarContext()

  const { editorMode } = useTemplateStore()
  const { selectedFormatId } = useFormatGalleryStore()

  const TABS = React.useMemo(() => {
    if (editorMode === 'template') {
      return TEMPLATE_TABS.filter(tab => {
        if (tab.id === 'tpl_format_zones' && !selectedFormatId) return false
        return true
      })
    }
    return CHART_TABS
  }, [editorMode, selectedFormatId])

  if (leftSidebarCollapsed) {
    return (
      <div className="w-16 flex-shrink-0 flex flex-col h-full items-center bg-white border-r border-gray-200 py-3 z-10 group">
        <div className="flex flex-col items-center space-y-3 w-full">
          {/* Company Logo / Toggle Sidebar */}
          <button
            onClick={() => setLeftSidebarCollapsed(false)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:bg-slate-100 transition-all flex items-center justify-center w-9 h-9"
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
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all hover:shadow-sm"
                title="Quick Navigation"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right" className="w-40 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-lg rounded-xl p-1.5">
              <DropdownMenuItem
                onClick={() => router.push('/board')}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Board Page</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push('/landing')}
                className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                <span>AI Chat Page</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-10 h-px bg-gray-200 my-4" />

        {/* Config Tabs Icons */}
        <div className="flex flex-col items-center space-y-1 w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
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
                  setLeftSidebarCollapsed(false)
                }}
                className={`p-2 rounded-lg flex items-center justify-center w-10 h-10 transition-all duration-200 ${activeTab === tab.id
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
      </div>
    )
  }

  return (
    <div className="w-64 flex-shrink-0 flex flex-col h-full bg-white border-r border-gray-200 shadow-sm z-10">
      {/* Unified Editor Header */}
      <div className="flex flex-col border-b border-gray-100 flex-shrink-0 pt-2 pb-2">
        <div className="flex justify-center mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2.5">
            <img src="/logo.png" alt="Company Logo" className="w-[22px] h-[22px] object-contain" />
            <span className="text-slate-300 font-light text-sm">|</span>
            <span>Advanced Editor</span>
          </span>
        </div>

        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-1.5 flex-1">
            <button
              onClick={() => router.push('/board')}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 shadow-sm transition-colors"
              title="Go to Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Board</span>
            </button>
            <button
              onClick={() => router.push('/landing')}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 shadow-sm transition-colors"
              title="Go to AI Chat"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>AI Chat</span>
            </button>
          </div>
          <div className="flex gap-1 ml-1.5">
            <button
              className="h-7 w-7 flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-md transition-colors"
              onClick={() => setLeftSidebarCollapsed(true)}
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden pt-1">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  )
}
