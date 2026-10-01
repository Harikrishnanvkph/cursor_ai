"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { BarChart2, SquarePen, MessageSquare, Settings, Square, X, LayoutDashboard, Edit3, ArrowUp } from "lucide-react"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { HistoryDropdown } from "@/components/history-dropdown"
import { ConfigSidebar } from "@/components/config-sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { PromptTemplate, ChatWindow } from "@/components/landing"
import { ChatSettingsPopover } from "@/components/landing/chat-settings-popover"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { useChatStore } from "@/lib/chat-store"
import { toast } from "sonner"
import { AnimatedBackground, ChartAreaSkeleton, GenerationProgressView } from "./landing-helpers"

export interface TabletLandingViewProps {
  handleNewConversation: () => void
  storeHydrated: boolean
  contentReady: boolean
  hasJSON: boolean
  chartData: any
  isProcessing: boolean
  messages: any[]
  input: string
  setInput: (input: string) => void
  handleSend: (e?: React.FormEvent) => void
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handlePaste: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isChatDisabled: boolean
  hasActiveChart: boolean
  showActiveBanner: boolean
  setShowActiveBanner: (show: boolean) => void
  selectedModel: 'deepseek' | 'deepseek-search' | 'deepseek-brave' | 'gemini-search' | 'perplexity'
  setSelectedModel: (m: any) => void
  includeImages: boolean
  setIncludeImages: (i: boolean) => void
  aiCreditsRemaining: number
  aiCreditsLimit: number
  isUpgradeOpen: boolean
  setIsUpgradeOpen: (open: boolean) => void
  isTemplateModalOpen: boolean
  setIsTemplateModalOpen: (open: boolean) => void
  currentChartState: any
}

export function TabletLandingView({
  handleNewConversation,
  storeHydrated,
  contentReady,
  hasJSON,
  chartData,
  isProcessing,
  messages,
  input,
  setInput,
  handleSend,
  handleInputChange,
  handlePaste,
  textareaRef,
  messagesEndRef,
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
  isUpgradeOpen,
  setIsUpgradeOpen,
  isTemplateModalOpen,
  setIsTemplateModalOpen,
  currentChartState,
}: TabletLandingViewProps) {
  const router = useRouter()
  const [tabletRightSidebarOpen, setTabletRightSidebarOpen] = useState(false)
  const [tabletRightSidebarContent, setTabletRightSidebarContent] = useState<'messages' | 'tools' | 'history' | null>(null)

  const handleTabletIconClick = useCallback((contentType: 'messages' | 'tools' | 'history') => {
    if (tabletRightSidebarContent === contentType && tabletRightSidebarOpen) {
      setTabletRightSidebarOpen(false)
      setTabletRightSidebarContent(null)
    } else {
      setTabletRightSidebarContent(contentType)
      setTabletRightSidebarOpen(true)
    }
  }, [tabletRightSidebarContent, tabletRightSidebarOpen])

  const closeTabletSidebar = useCallback(() => {
    setTabletRightSidebarOpen(false)
    setTabletRightSidebarContent(null)
  }, [])

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 flex overflow-hidden">
      <AnimatedBackground />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between h-full px-6">
          {/* Left: App Logo */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <BarChart2 className="h-6 w-6 text-white" />
            </div>
          </div>

          {/* Center: Main Title */}
          <div className="flex-1 flex justify-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-wide text-center">
              Generate AI Charts
            </h1>
          </div>

          {/* Right: Profile */}
          <div className="flex items-center gap-3 min-w-0">
            <SimpleProfileDropdown size="sm" />
          </div>
        </div>
      </header>

      {/* Left Icon Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-16 bg-white border-r border-gray-200 shadow-sm z-30 flex flex-col items-center py-4 space-y-4">
        {/* New Chat Icon */}
        <button
          onClick={() => {
            handleNewConversation()
            // Auto-open messages sidebar for new chat
            setTabletRightSidebarContent('messages')
            setTabletRightSidebarOpen(true)
          }}
          className="p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600"
          title="New Chat"
        >
          <SquarePen className="w-5 h-5" />
        </button>

        {/* Message Icon */}
        <button
          onClick={() => handleTabletIconClick('messages')}
          className={`p-2 rounded-lg transition-all duration-200 ${
            tabletRightSidebarContent === 'messages' && tabletRightSidebarOpen
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Messages"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Tools Icon */}
        <button
          onClick={() => handleTabletIconClick('tools')}
          className={`p-2 rounded-lg transition-all duration-200 ${
            tabletRightSidebarContent === 'tools' && tabletRightSidebarOpen
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="Tools"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* History Icon */}
        <button
          onClick={() => handleTabletIconClick('history')}
          className={`p-2 rounded-lg transition-all duration-200 ${
            tabletRightSidebarContent === 'history' && tabletRightSidebarOpen
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title="History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Profile Icon at bottom */}
        <div className="flex-1"></div>
        <SimpleProfileDropdown size="sm" />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-16 mt-16 relative flex flex-col">
        {/* Main Chart Area */}
        <div className="flex-1 p-4 flex flex-col relative">
          {(!storeHydrated || (!contentReady && hasJSON)) && (
            <div className="absolute inset-0 z-20 p-4 bg-slate-50/90 backdrop-blur-sm rounded-xl">
              <ChartAreaSkeleton />
            </div>
          )}
          {chartData?.datasets?.length > 0 && hasJSON ? (
            <div className="flex-1 h-full relative">
              {isProcessing && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-indigo-200/80 dark:border-indigo-800 shadow-lg flex items-center gap-2.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                    Updating chart...
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      useChatStore.getState().stopGeneration()
                      toast.info("Generation cancelled")
                    }}
                    className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 text-slate-600 dark:text-slate-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Square className="w-2.5 h-2.5 fill-current text-red-500" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
              <ChartPreview
                onToggleSidebar={() => {}}
                isSidebarCollapsed={true}
                onToggleLeftSidebar={() => {}}
                isLeftSidebarCollapsed={true}
              />
            </div>
          ) : isProcessing ? (
            <GenerationProgressView />
          ) : storeHydrated ? (
            <PromptTemplate
              size="default"
              onSampleClick={(template) => {
                setInput(template)
                setTabletRightSidebarContent('messages')
                setTabletRightSidebarOpen(true)
              }}
              isTemplateModalOpen={isTemplateModalOpen}
              setIsTemplateModalOpen={setIsTemplateModalOpen}
            />
          ) : null}
        </div>
      </main>

      {/* Overlaying Right Sidebar */}
      {tabletRightSidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeTabletSidebar} />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl border-l border-white/20 flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 capitalize">
                {tabletRightSidebarContent}
              </h3>
              <button
                onClick={closeTabletSidebar}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 min-h-0 flex flex-col">
              {tabletRightSidebarContent === 'messages' && (
                <>
                  {/* Navigation Section - Tablet */}
                  <div className="p-3 bg-white/95 flex-shrink-0">
                    <div className="flex items-center gap-0 bg-gray-50 rounded-lg p-1">
                      <button
                        onClick={() => router.push('/board')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors relative"
                        title="Dashboard"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Board</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-700 bg-white rounded-md shadow-sm transition-colors relative">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>AI Chat</span>
                        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"></div>
                      </button>
                      <button
                        onClick={() => router.push('/editor')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-colors relative"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editor</span>
                      </button>
                    </div>
                  </div>

                  {/* Chat Input - Tablet */}
                  <form
                    onSubmit={handleSend}
                    className="p-3 border-b border-gray-200 bg-white flex flex-col gap-2 flex-shrink-0"
                  >
                    {/* Tablet Input Capsule with Textarea and vertical Gear + Send column */}
                    <div className="relative flex items-stretch w-full bg-white border border-indigo-200/80 hover:border-indigo-400 focus-within:border-indigo-600 focus-within:ring-4 focus-within:ring-indigo-500/15 shadow-md shadow-indigo-500/5 transition-all rounded-2xl p-2 min-h-[58px]">
                      <textarea
                        ref={textareaRef}
                        className="flex-1 px-2 py-1 text-sm bg-transparent border-0 outline-none resize-none min-h-[34px] max-h-[58px] leading-relaxed transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder={isChatDisabled ? "Attach a template to start..." : (hasActiveChart ? "Modify the chart..." : "Ask AI to Generate Chart...")}
                        value={input}
                        onChange={handleInputChange}
                        onPaste={handlePaste}
                        disabled={isProcessing || isChatDisabled}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                            e.preventDefault()
                            if (!isChatDisabled) {
                              handleSend(e)
                            }
                          }
                        }}
                      />
                      <div className="flex flex-col items-center justify-between pl-1 flex-shrink-0 gap-1.5">
                        {/* Gear Icon: inside textbox, opens popover with remaining credits, model dropdown, and image toggle */}
                        <ChatSettingsPopover
                          selectedModel={selectedModel}
                          setSelectedModel={setSelectedModel}
                          includeImages={includeImages}
                          setIncludeImages={setIncludeImages}
                          aiCreditsRemaining={aiCreditsRemaining}
                          aiCreditsLimit={aiCreditsLimit}
                          onOpenUpgrade={() => setIsUpgradeOpen(true)}
                        />

                        {/* Send Button */}
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 disabled:opacity-50 transition-all duration-200 shadow-2xs"
                          disabled={isProcessing || !input.trim() || isChatDisabled}
                        >
                          <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>
                  </form>

                  <ChatWindow
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    onSend={handleSend}
                    isProcessing={isProcessing}
                    hasActiveChart={hasActiveChart}
                    showActiveBanner={showActiveBanner}
                    setShowActiveBanner={setShowActiveBanner}
                    messagesEndRef={messagesEndRef}
                    textareaRef={textareaRef}
                    isChatDisabled={isChatDisabled}
                    disabledMessage="Please attach a template to start the conversation."
                    compact={true}
                    currentChartState={currentChartState}
                  />
                </>
              )}

              {tabletRightSidebarContent === 'tools' && (
                <div className="h-full overflow-auto">
                  <ConfigSidebar />
                </div>
              )}

              {tabletRightSidebarContent === 'history' && (
                <div className="h-full bg-white">
                  <HistoryDropdown variant="sidebar" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <UpgradeProDialog
        open={isUpgradeOpen}
        onOpenChange={setIsUpgradeOpen}
        featureHighlight="ai"
        title="Need More AI Credits?"
        description={`You have ${aiCreditsRemaining} AI credits remaining of your monthly ${aiCreditsLimit} limit. Upgrade to Pro for 50 credits/month.`}
      />
    </div>
  )
}
