"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  History,
  MessageCircleDashed,
  ArrowUp,
  Square,
  ChevronLeft,
} from "lucide-react"
import { PencilSparkles } from "@/components/icons/pencil-sparkles"
import { cn } from "@/lib/utils"
import { HistoryDropdown } from "@/components/history-dropdown"
import { ConfigSidebar } from "@/components/config-sidebar"
import { ModernPanelProvider } from "@/components/editor/modern-panel-context"
import { ChatWindow } from "@/components/aichat/chat-window"
import { ModernChatHeaderBar } from "@/components/aichat/modern-chat-header-bar"
import { useChatStore } from "@/lib/chat-store"

export type ModernAiChatRailTab = "recents" | "chat" | "tools"

const DEFAULT_PANEL_WIDTH = 340
const MIN_PANEL_WIDTH = 280
const MAX_PANEL_WIDTH = 460

export interface ModernAiChatLeftSidebarProps {
  activeTab: ModernAiChatRailTab
  onTabChange: (tab: ModernAiChatRailTab) => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  isTablet?: boolean

  // Chat props
  messages: any[]
  input: string
  setInput: (value: string) => void
  onSend: (e?: React.FormEvent) => void
  onInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onPaste?: () => void
  onNewChat: () => void
  isProcessing: boolean
  isChatDisabled: boolean
  hasActiveChart: boolean
  showActiveBanner: boolean
  setShowActiveBanner: (show: boolean) => void
  selectedModel: 'deepseek' | 'deepseek-search' | 'deepseek-brave' | 'gemini-search' | 'perplexity'
  setSelectedModel: (model: 'deepseek' | 'deepseek-search' | 'deepseek-brave' | 'gemini-search' | 'perplexity') => void
  includeImages: boolean
  setIncludeImages: (include: boolean) => void
  aiCreditsRemaining: number
  aiCreditsLimit: number
  freeAiCreditsRemaining?: number
  purchasedAiCredits?: number
  onOpenUpgrade: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  currentChartState: any
}

const RAIL_SECTIONS: Array<{
  id: Exclude<ModernAiChatRailTab, "recents">
  label: string
  title: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
}> = [
  { id: "chat", label: "Chat", title: "AI Chat Conversation", icon: MessageCircleDashed },
  { id: "tools", label: "Tools", title: "Chart & Template Settings", icon: PencilSparkles },
]

export function ModernAiChatLeftSidebar({
  activeTab,
  onTabChange,
  collapsed,
  onCollapsedChange,
  isTablet = false,
  messages,
  input,
  setInput,
  onSend,
  onInputChange,
  onPaste,
  onNewChat,
  isProcessing,
  isChatDisabled,
  hasActiveChart,
  showActiveBanner,
  setShowActiveBanner,
  selectedModel,
  setSelectedModel,
  includeImages,
  setIncludeImages,
  aiCreditsRemaining,
  aiCreditsLimit,
  freeAiCreditsRemaining,
  purchasedAiCredits,
  onOpenUpgrade,
  textareaRef,
  messagesEndRef,
  currentChartState,
}: ModernAiChatLeftSidebarProps) {
  const [panelWidth, setPanelWidth] = useState<number>(DEFAULT_PANEL_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const resizeStartXRef = useRef<number>(0)
  const resizeStartWidthRef = useRef<number>(DEFAULT_PANEL_WIDTH)

  const handleRailClick = useCallback(
    (tabId: ModernAiChatRailTab) => {
      if (!collapsed && activeTab === tabId) {
        onCollapsedChange(true)
        return
      }
      onTabChange(tabId)
      onCollapsedChange(false)
    },
    [activeTab, collapsed, onTabChange, onCollapsedChange]
  )

  // Drag-resize handlers for contextual panel (desktop only)
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

  // Auto-adjust textarea height cleanly whenever input changes or chat tab opens
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    if (!el.value) {
      el.style.height = "34px"
      el.style.overflowY = "hidden"
    } else {
      el.style.height = "auto"
      const nextHeight = Math.max(34, Math.min(el.scrollHeight, 64))
      el.style.height = `${nextHeight}px`
      el.style.overflowY = el.scrollHeight > 64 ? "auto" : "hidden"
    }
  }, [textareaRef])

  useEffect(() => {
    if (!collapsed && activeTab === "chat") {
      adjustTextareaHeight()
    }
  }, [input, collapsed, activeTab, adjustTextareaHeight])

  const handleInternalInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onInputChange) {
        onInputChange(e)
      } else {
        setInput(e.target.value)
      }
      adjustTextareaHeight()
    },
    [onInputChange, setInput, adjustTextareaHeight]
  )

  const handleInternalPaste = useCallback(() => {
    if (onPaste) {
      onPaste()
    } else {
      requestAnimationFrame(adjustTextareaHeight)
    }
  }, [onPaste, adjustTextareaHeight])

  const isRecentsOpen = !collapsed && activeTab === "recents"

  return (
    <>
      {/* 78px Vertical Navigation Rail */}
      <aside
        aria-label="Workspace sections"
        className="w-[78px] flex-shrink-0 h-full bg-white border-r border-slate-200/90 flex flex-col items-center py-2 select-none z-20 antialiased"
      >
        {/* Recents Rail Item */}
        <div className="w-full px-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => handleRailClick("recents")}
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

        {/* Chat & Tools Sections */}
        <nav className="flex-1 w-full flex flex-col items-center gap-1 px-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          {RAIL_SECTIONS.map(item => {
            const Icon = item.icon
            const isOpen = !collapsed && activeTab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRailClick(item.id)}
                title={item.title}
                aria-current={isOpen ? "page" : undefined}
                className={cn(
                  "relative w-full flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  isOpen
                    ? "bg-indigo-50/80 text-indigo-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-100/80 hover:text-slate-950 font-medium"
                )}
              >
                {isOpen && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-indigo-600" />
                )}
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                <span className="text-xs leading-tight tracking-normal text-center whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Tablet backdrop when contextual panel overlays the canvas */}
      {isTablet && !collapsed && (
        <div
          className="fixed inset-0 top-[52px] left-[78px] bg-black/20 z-20 transition-opacity"
          onClick={() => onCollapsedChange(true)}
        />
      )}

      {/* Adjacent Contextual Panel */}
      {!collapsed && (
        <aside
          aria-label="Workspace panel"
          className={cn(
            "h-full bg-white border-r border-slate-200/90 flex flex-col min-h-0 relative antialiased",
            isTablet
              ? "fixed left-[78px] top-[52px] bottom-0 w-80 max-w-[calc(100vw-78px)] z-30 shadow-xl"
              : "flex-shrink-0 z-10"
          )}
          style={isTablet ? undefined : { width: `${panelWidth}px` }}
        >
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-white">
            {activeTab === "recents" && (
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <HistoryDropdown
                  variant="sidebar"
                  onConversationRestored={() => {
                    if (isTablet) onCollapsedChange(true)
                  }}
                />
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                {/* Compact Controls Bar: AI Engine, Web Images toggle, Credits & Usage Info */}
                <ModernChatHeaderBar
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  includeImages={includeImages}
                  setIncludeImages={setIncludeImages}
                  aiCreditsRemaining={aiCreditsRemaining}
                  aiCreditsLimit={aiCreditsLimit}
                  freeAiCreditsRemaining={freeAiCreditsRemaining}
                  purchasedAiCredits={purchasedAiCredits}
                  onOpenUpgrade={onOpenUpgrade}
                />

                {/* Prompt Form */}
                <form
                  onSubmit={onSend}
                  className="p-3.5 bg-transparent flex flex-col gap-2 flex-shrink-0"
                >
                  <div className="relative flex items-stretch w-full bg-white border border-indigo-200/80 hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/15 shadow-sm transition-[border-color,box-shadow] rounded-2xl p-2 min-h-[52px]">
                    <textarea
                      ref={textareaRef}
                      className="flex-1 px-2 py-1 text-sm bg-transparent border-0 outline-none resize-none min-h-[34px] max-h-[64px] leading-relaxed font-sans text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none disabled:opacity-50"
                      placeholder={hasActiveChart ? "Modify the chart..." : "Ask AI to Generate Chart..."}
                      value={input}
                      onChange={handleInternalInputChange}
                      onPaste={handleInternalPaste}
                      disabled={isProcessing || isChatDisabled}
                      rows={1}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                          e.preventDefault()
                          if (!isChatDisabled && input.trim()) {
                            onSend(e)
                          }
                        }
                      }}
                    />
                    <div className="flex items-stretch pl-1.5 flex-shrink-0">
                      {isProcessing ? (
                        <button
                          type="button"
                          onClick={() => useChatStore.getState().stopGeneration()}
                          className="bg-red-500 hover:bg-red-600 active:scale-95 text-white w-9 min-h-[34px] flex items-center justify-center rounded-xl flex-shrink-0 transition-[background-color,transform] duration-150 shadow-sm cursor-pointer"
                          title="Stop generation"
                          aria-label="Stop generation"
                        >
                          <Square className="w-3.5 h-3.5 fill-current" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-9 min-h-[34px] flex items-center justify-center rounded-xl flex-shrink-0 transition-[background-color,transform,opacity] duration-150 shadow-sm disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100 cursor-pointer"
                          disabled={!input.trim() || isChatDisabled}
                          title="Send message"
                          aria-label="Send message"
                        >
                          <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </form>

                {/* Conversation History & Hero State */}
                <div className="flex-1 min-h-0 overflow-hidden font-sans">
                  <ChatWindow
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    onSend={onSend}
                    isProcessing={isProcessing}
                    hasActiveChart={hasActiveChart}
                    showActiveBanner={showActiveBanner}
                    setShowActiveBanner={setShowActiveBanner}
                    messagesEndRef={messagesEndRef}
                    textareaRef={textareaRef}
                    currentChartState={currentChartState}
                    isChatDisabled={isChatDisabled}
                  />
                </div>
              </div>
            )}

            {activeTab === "tools" && (
              <ModernPanelProvider>
                <div className="modern-tools-scope flex-1 min-h-0 overflow-hidden flex flex-col">
                  <ConfigSidebar variant="modern" />
                </div>
              </ModernPanelProvider>
            )}
          </div>

          {/* Right-edge Resize Handle (Desktop) */}
          {!isTablet && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize panel"
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
            onClick={() => onCollapsedChange(true)}
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
