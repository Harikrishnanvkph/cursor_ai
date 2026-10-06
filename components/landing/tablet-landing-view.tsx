"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  BarChart2, SquarePen, MessageSquare, Settings, Square, X,
  LayoutDashboard, Edit3, ArrowUp, Cloud, Trash2, Loader2,
  Share2, RotateCcw
} from "lucide-react"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { HistoryDropdown } from "@/components/history-dropdown"
import { ConfigSidebar } from "@/components/config-sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { PromptTemplate, ChatWindow } from "@/components/landing"
import { ChatSettingsPopover } from "@/components/landing/chat-settings-popover"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { SaveChartDialog } from "@/components/ui/save-chart-dialog"
import { ModeChangeConfirmDialog } from "@/components/dialogs/mode-change-confirm-dialog"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { dataService } from "@/lib/data-service"
import { toast } from "sonner"
import { AnimatedBackground, ChartAreaSkeleton, GenerationProgressView } from "./landing-helpers"

export interface TabletLandingViewProps {
  user?: any
  handleNewConversation: () => void
  handleResetChart: () => void
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
  currentSnapshotId?: string | null
  showSaveChartDialog: boolean
  setShowSaveChartDialog: (open: boolean) => void
  saveChartDialogName: string
  isUpdate: boolean
  isSaving: boolean
  handleSaveChart: (name: string) => Promise<void>
  handleSaveToCloudClick: () => void
  showModeChangeConfirm?: boolean
  setModeChangeConfirm?: (open: boolean) => void
  confirmModeChange?: () => void
  cancelModeChange?: () => void
}

export function TabletLandingView({
  user,
  handleNewConversation,
  handleResetChart,
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
  currentSnapshotId,
  showSaveChartDialog,
  setShowSaveChartDialog,
  saveChartDialogName,
  isUpdate,
  isSaving,
  handleSaveChart,
  handleSaveToCloudClick,
  showModeChangeConfirm = false,
  setModeChangeConfirm,
  confirmModeChange,
  cancelModeChange,
}: TabletLandingViewProps) {
  const router = useRouter()
  const [tabletRightSidebarOpen, setTabletRightSidebarOpen] = useState(false)
  const [tabletRightSidebarContent, setTabletRightSidebarContent] = useState<'messages' | 'tools' | 'history' | null>(null)
  const [isSharingLink, setIsSharingLink] = useState(false)

  const { editorMode, currentTemplate, templateInBackground } = useTemplateStore()
  const hasVisualContent = Boolean(
    (chartData?.datasets?.length > 0 && hasJSON) ||
    (editorMode === 'template' && (currentTemplate || templateInBackground))
  )

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

  const handleCopyShareLink = useCallback(async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved to cloud before sharing.")
      return
    }
    try {
      setIsSharingLink(true)
      toast.loading("Generating share link...", { id: "tablet-share" })
      const response = await dataService.generateShareLink(currentSnapshotId)
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link")
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Share link copied to clipboard!", { id: "tablet-share" })
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link.", { id: "tablet-share" })
    } finally {
      setIsSharingLink(false)
    }
  }, [currentSnapshotId])

  return (
    <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex overflow-hidden">
      <AnimatedBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between h-full px-5">
          {/* Left: App Logo with click to Home */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
              title="Go to Home"
            >
              <BarChart2 className="h-5 w-5 text-white" />
            </button>
            <span className="hidden sm:inline text-sm font-bold text-slate-800 dark:text-slate-100">
              Chartography
            </span>
          </div>

          {/* Center: Main Title */}
          <div className="flex-1 flex justify-center px-2">
            <h1 className="text-base sm:text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 dark:from-blue-400 dark:via-purple-400 dark:to-indigo-400 bg-clip-text text-transparent tracking-wide text-center truncate">
              Generate AI Charts
            </h1>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Save to Cloud Button */}
            {hasActiveChart && (
              <button
                onClick={handleSaveToCloudClick}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                title="Save chart to cloud"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                <span>{isUpdate ? "Update" : "Save"}</span>
              </button>
            )}

            {/* Share Link Button */}
            {hasActiveChart && currentSnapshotId && (
              <button
                onClick={handleCopyShareLink}
                disabled={isSharingLink}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors shadow-xs cursor-pointer"
                title="Copy share link"
              >
                <Share2 className="w-4 h-4" />
              </button>
            )}

            {/* Clear Workspace Button */}
            {hasActiveChart && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear the current workspace and chat?")) {
                    handleResetChart()
                    toast.success("Workspace cleared successfully")
                  }
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 transition-colors cursor-pointer"
                title="Clear Workspace"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <SimpleProfileDropdown size="sm" />
          </div>
        </div>
      </header>

      {/* Left Icon Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-16 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 shadow-sm z-30 flex flex-col items-center py-4 space-y-3 transition-colors">
        {/* New Chat Icon */}
        <button
          onClick={() => {
            handleNewConversation()
            setTabletRightSidebarContent('messages')
            setTabletRightSidebarOpen(true)
          }}
          className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800 transition-all duration-200 text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
          title="New Chat"
        >
          <SquarePen className="w-5 h-5" />
        </button>

        {/* Message Icon */}
        <button
          onClick={() => handleTabletIconClick('messages')}
          className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
            tabletRightSidebarContent === 'messages' && tabletRightSidebarOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
              : 'text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
          }`}
          title="Messages"
        >
          <MessageSquare className="w-5 h-5" />
        </button>

        {/* Tools Icon */}
        <button
          onClick={() => handleTabletIconClick('tools')}
          className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
            tabletRightSidebarContent === 'tools' && tabletRightSidebarOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
              : 'text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
          }`}
          title="Tools"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* History Icon */}
        <button
          onClick={() => handleTabletIconClick('history')}
          className={`p-2 rounded-xl transition-all duration-200 cursor-pointer ${
            tabletRightSidebarContent === 'history' && tabletRightSidebarOpen
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
              : 'text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
          }`}
          title="History"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-slate-200 dark:bg-slate-800 my-1" />

        {/* Navigation to Board Page */}
        <button
          onClick={() => router.push('/board')}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          title="Dashboard / Board"
        >
          <LayoutDashboard className="w-5 h-5" />
        </button>

        {/* Navigation to Editor Page */}
        <button
          onClick={() => router.push('/editor')}
          className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
          title="Advanced Editor"
        >
          <Edit3 className="w-5 h-5" />
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-16 mt-16 relative flex flex-col">
        {/* Main Chart Area */}
        <div className="flex-1 p-3 sm:p-4 flex flex-col relative">
          {(!storeHydrated || (!contentReady && hasJSON)) && (
            <div className="absolute inset-0 z-20 p-4 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm rounded-xl">
              <ChartAreaSkeleton />
            </div>
          )}
          {hasVisualContent ? (
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
                isTablet={true}
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

      {/* Overlaying Right Sidebar (Non-blocking transparent backdrop) */}
      {tabletRightSidebarOpen && (
        <div className="fixed inset-0 z-50">
          {/* Non-dimming click-outside backdrop so chart remains visible */}
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={closeTabletSidebar} />

          {/* Sidebar */}
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-950 shadow-2xl border-l border-slate-200/80 dark:border-slate-800 flex flex-col transition-colors">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-800 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 capitalize text-sm">
                {tabletRightSidebarContent}
              </h3>
              <button
                onClick={closeTabletSidebar}
                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors text-gray-500 dark:text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 min-h-0 flex flex-col">
              {tabletRightSidebarContent === 'messages' && (
                <>
                  {/* Navigation Pill Strip - Tablet */}
                  <div className="p-3 bg-white/95 dark:bg-slate-950 flex-shrink-0">
                    <div className="flex items-center gap-0 bg-gray-50 dark:bg-slate-900 rounded-lg p-1 border border-slate-200/60 dark:border-slate-800">
                      <button
                        onClick={() => router.push('/board')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors relative cursor-pointer"
                        title="Dashboard"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5" />
                        <span>Board</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400 bg-white dark:bg-slate-800 rounded-md shadow-sm transition-colors relative">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>AI Chat</span>
                        <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"></div>
                      </button>
                      <button
                        onClick={() => router.push('/editor')}
                        className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-colors relative cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editor</span>
                      </button>
                    </div>
                  </div>

                  {/* Chat Input - Tablet */}
                  <form
                    onSubmit={handleSend}
                    className="p-3 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col gap-2 flex-shrink-0"
                  >
                    <div className="relative flex items-stretch w-full bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 shadow-md shadow-indigo-500/5 transition-all rounded-2xl p-2 min-h-[58px]">
                      <textarea
                        ref={textareaRef}
                        className="flex-1 px-2 py-1 text-sm bg-transparent border-0 outline-none resize-none min-h-[34px] max-h-[58px] leading-relaxed transition-all font-sans text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <ChatSettingsPopover
                          selectedModel={selectedModel}
                          setSelectedModel={setSelectedModel}
                          includeImages={includeImages}
                          setIncludeImages={setIncludeImages}
                          aiCreditsRemaining={aiCreditsRemaining}
                          aiCreditsLimit={aiCreditsLimit}
                          onOpenUpgrade={() => setIsUpgradeOpen(true)}
                        />

                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 disabled:opacity-50 transition-all duration-200 shadow-2xs cursor-pointer"
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
                <div className="h-full overflow-auto bg-slate-50/50 dark:bg-slate-900/50">
                  <ConfigSidebar />
                </div>
              )}

              {tabletRightSidebarContent === 'history' && (
                <div className="h-full bg-white dark:bg-slate-950">
                  <HistoryDropdown variant="sidebar" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog Popup for Tablet */}
      <SaveChartDialog
        open={showSaveChartDialog}
        defaultName={saveChartDialogName}
        isUpdate={isUpdate}
        isSaving={isSaving}
        onSave={handleSaveChart}
        onCancel={() => setShowSaveChartDialog(false)}
      />

      {/* Mode Change Confirmation Dialog for Tablet */}
      {setModeChangeConfirm && confirmModeChange && cancelModeChange && (
        <ModeChangeConfirmDialog
          open={showModeChangeConfirm}
          onOpenChange={setModeChangeConfirm}
          onConfirm={confirmModeChange}
          onCancel={cancelModeChange}
        />
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
