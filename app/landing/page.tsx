"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Square } from "lucide-react"
import { saveChartToCloud } from "@/lib/save-utils"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { ChartLayout } from "@/components/chart-layout"
import { useHistoryStore } from "@/lib/history-store"
import { useTemplateStore } from "@/lib/template-store"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { HistoryDropdown } from "@/components/history-dropdown"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { SaveChartDialog } from "@/components/ui/save-chart-dialog"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { ModeChangeConfirmDialog } from "@/components/dialogs/mode-change-confirm-dialog"
import { toast } from "sonner"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { FormatGallery } from "@/components/gallery/FormatGallery"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { ChartStyleGalleryPage } from "@/components/chart-style-gallery/ChartStyleGalleryPage"
import { useSidebarContext, useSidebarInputContext } from "@/components/landing/sidebar-context"
import { useIsMobile, useIsTablet } from "@/lib/hooks/use-screen-dimensions"
import {
  PromptTemplate,
  chartTemplate,
  TabletLandingView,
  MobileLandingView,
  ChartAreaSkeleton,
  GenerationProgressView
} from "@/components/landing"

export default function LandingPage() {
  return <LandingPageContent />
}

function LandingPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const { isPro, aiCreditsLimit, aiCreditsRemaining } = useSubscriptionQuota()

  const {
    chartConfig,
    chartData,
    chartType,
    setChartType,
    resetChart,
    hasJSON,
    setHasJSON,
    originalCloudDimensions,
    currentSnapshotId
  } = useChartStore()

  const {
    messages,
    currentChartState,
    isProcessing,
    continueConversation,
    startNewConversation,
    clearMessages,
    setMessages,
    backendConversationId,
    selectedModel,
    setSelectedModel,
    includeImages,
    setIncludeImages
  } = useChatStore()

  const { loadConversationsFromBackend, restoreConversation } = useHistoryStore()
  const {
    generateMode,
    editorMode,
    currentTemplate,
    templateInBackground,
    syncTemplatesFromCloud,
    showModeChangeConfirm,
    setModeChangeConfirm,
    confirmModeChange,
    cancelModeChange
  } = useTemplateStore()

  const { isGalleryOpen, openGallery, selectedFormatId, contentPackage, formats, userFormats, selectedFormatSnapshot } = useFormatGalleryStore()

  const renderedFormat = useMemo(() => {
    if (!selectedFormatId || !contentPackage) return null
    return selectedFormatSnapshot || [...formats, ...userFormats].find(f => f.id === selectedFormatId)
  }, [selectedFormatId, contentPackage, selectedFormatSnapshot, formats, userFormats])

  const activeConfig = useChartStore(s => {
    if (s.chartMode === 'single') {
      const ds = s.chartData.datasets[s.activeDatasetIndex]
      return ds?.chartConfig ?? s.chartConfig
    }
    const group = s.groups?.find(g => g.id === s.activeGroupId)
    return group?.chartConfig ?? s.chartConfig
  })

  const { isGalleryOpen: isStyleGalleryOpen } = useChartStyleStore()

  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasRestoredRef = useRef(false)
  const lastSyncedChartStateRef = useRef<string | null>(null)
  const hasMountSyncedRef = useRef(false)
  const lastShownChartKeyRef = useRef<string | null>(null)

  // Reset refs and scroll position on every mount to handle navigation properly
  useEffect(() => {
    window.scrollTo(0, 0)
    hasMountSyncedRef.current = false
    lastSyncedChartStateRef.current = null
    lastShownChartKeyRef.current = null
  }, [])

  // Consolidated mount-time sync: chartStore <-> chatStore
  useEffect(() => {
    if (hasMountSyncedRef.current) return
    hasMountSyncedRef.current = true

    const chartStoreState = useChartStore.getState()
    const chatStoreState = useChatStore.getState()

    if (chartStoreState.hasJSON && chartStoreState.chartData?.datasets?.length > 0) {
      chatStoreState.updateChartState({
        chartType: chartStoreState.chartType as any,
        chartData: chartStoreState.chartData as any,
        chartConfig: chartStoreState.chartConfig as any
      })
      chartStoreState.setHasJSON(true)
      hasRestoredRef.current = true
    }
  }, [])

  // Check if chat should be disabled (only template mode requires a template; format mode is always enabled)
  const isChatDisabled = (generateMode === 'template' && !currentTemplate)

  // Update initial message when template/format mode changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const templateMessage = 'Please attach a template to start the conversation. Select a template from the options via "Choose From Templates".'
      const formatMessage = 'Describe your chart content. You can optionally select a format first, or browse formats after generation.'
      const defaultMessage = 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.'

      const shouldShowTemplateMessage = generateMode === 'template' && !currentTemplate
      const isFormatMode = generateMode === 'format'
      const currentMessage = messages[0].content

      if (shouldShowTemplateMessage && currentMessage !== templateMessage) {
        setMessages([{ ...messages[0], content: templateMessage }])
      } else if (isFormatMode && !selectedFormatId && currentMessage !== formatMessage && currentMessage !== defaultMessage) {
        setMessages([{ ...messages[0], content: formatMessage }])
      } else if (!shouldShowTemplateMessage && !isFormatMode && (currentMessage === templateMessage || currentMessage === formatMessage)) {
        setMessages([{ ...messages[0], content: defaultMessage }])
      }
    }
  }, [generateMode, currentTemplate, selectedFormatId, messages, setMessages])

  const [showActiveBanner, setShowActiveBanner] = useState(false)
  const sidebarContext = useSidebarContext(); const sidebarInputContext = useSidebarInputContext();
  const leftSidebarOpen = sidebarContext.leftSidebarOpen
  const setLeftSidebarOpen = sidebarContext.setLeftSidebarOpen
  const [hasLoadedBackendData, setHasLoadedBackendData] = useState(false)

  // Screen dimension hooks
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  // Auto-sync backend data when user logs in
  useEffect(() => {
    if (user && !hasLoadedBackendData) {
      Promise.all([
        loadConversationsFromBackend(),
        syncTemplatesFromCloud()
      ])
        .then(() => {
          setHasLoadedBackendData(true)
          const chatStore = useChatStore.getState()
          if (chatStore.backendConversationId && !currentChartState) {
            restoreConversation(chatStore.backendConversationId).catch(() => {})
          }
        })
        .catch(() => {})
    }

    if (!user && hasLoadedBackendData) {
      setHasLoadedBackendData(false)
    }
  }, [user, hasLoadedBackendData, loadConversationsFromBackend, syncTemplatesFromCloud, currentChartState, restoreConversation])

  const [showSaveChartDialog, setShowSaveChartDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveChartDialogName, setSaveChartDialogName] = useState("")

  const handleSaveToCloudClick = useCallback(() => {
    const storeTitle = useChartStore.getState().chartTitle
    const existingBackendId = useChatStore.getState().backendConversationId

    let defaultName = "Untitled Chart"
    if (existingBackendId) {
      const conversations = useHistoryStore.getState().conversations
      const existingConversation = conversations.find(c => c.id === existingBackendId)
      if (existingConversation) {
        defaultName = existingConversation.title
      } else if (storeTitle) {
        defaultName = storeTitle
      }
    } else if (storeTitle) {
      defaultName = storeTitle
    } else {
      const chartTitleFromConfig = activeConfig?.plugins?.title?.text
      if (chartTitleFromConfig) {
        defaultName = Array.isArray(chartTitleFromConfig) ? chartTitleFromConfig.join(' ') : String(chartTitleFromConfig)
      }
    }

    setSaveChartDialogName(defaultName)
    setShowSaveChartDialog(true)
  }, [activeConfig])

  const handleSaveChart = useCallback(async (name: string) => {
    setIsSaving(true)
    try {
      toast.loading("Saving chart to cloud...", { id: "save-toast" })
      await saveChartToCloud({
        chartName: name,
        user,
        onSaveComplete: (res) => {
          setIsSaving(false)
          setShowSaveChartDialog(false)
          toast.success(res.isUpdate ? "Chart updated successfully!" : "Chart saved successfully!", { id: "save-toast" })
        }
      })
    } catch {
      setIsSaving(false)
      toast.error("Failed to save chart.", { id: "save-toast" })
    }
  }, [user])

  const isUpdate = !!backendConversationId

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isProcessing || isChatDisabled) return

    if (user && aiCreditsRemaining <= 0) {
      setIsUpgradeOpen(true)
      toast.error(`You have reached your monthly limit of ${aiCreditsLimit} AI credits. Upgrade to Pro for 50 credits/month!`)
      return
    }

    const userInput = input.trim()
    setInput("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "36px"
    }

    try {
      await continueConversation(userInput)
    } catch (err: any) {
      if (err?.code === 'AI_CREDITS_EXHAUSTED' || err?.message?.toLowerCase().includes('credit')) {
        setIsUpgradeOpen(true)
      }
      setInput(userInput)
      toast.error(err.message || "Failed to process request")

      if (textareaRef.current) {
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = "36px"
            const maxHeight = 100
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
            textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden"
          }
        }, 50)
      }
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 100)
  }, [input, isProcessing, continueConversation, isChatDisabled, setInput, textareaRef, user, aiCreditsRemaining, aiCreditsLimit])

  const handleTemplateClick = useCallback(() => {
    setInput(chartTemplate)
    sidebarInputContext.setChatInput(chartTemplate)
    setTimeout(() => {
      const ref = sidebarContext.textareaRef?.current || textareaRef.current
      if (ref) {
        ref.focus()
        ref.style.height = "36px"
        ref.style.height = `${ref.scrollHeight}px`
      }
    }, 0)
  }, [sidebarContext])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setInput(val)

    const el = e.target
    if (!val) {
      el.style.height = "38px"
      el.style.overflowY = "hidden"
    } else {
      el.style.height = "auto"
      const singleRowHeight = 38
      const twoRowsMaxHeight = 68
      const nextHeight = Math.min(Math.max(el.scrollHeight, singleRowHeight), twoRowsMaxHeight)
      el.style.height = `${nextHeight}px`
      el.style.overflowY = el.scrollHeight > twoRowsMaxHeight ? "auto" : "hidden"
    }
  }, [])

  const handlePaste = useCallback(() => {
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        const singleRowHeight = 38
        const twoRowsMaxHeight = 68
        const nextHeight = Math.min(Math.max(textareaRef.current.scrollHeight, singleRowHeight), twoRowsMaxHeight)
        textareaRef.current.style.height = `${nextHeight}px`
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > twoRowsMaxHeight ? "auto" : "hidden"
      }
    })
  }, [])

  const handleNewConversation = useCallback(() => {
    try {
      useChartStyleStore.getState().closeGallery()
      useFormatGalleryStore.getState().closeGallery()
    } catch {}
    startNewConversation()
    setShowActiveBanner(false)
    useTemplateStore.getState().setEditorMode('chart')
    useTemplateStore.getState().setGenerateMode('chart')
    lastShownChartKeyRef.current = null
  }, [startNewConversation])

  const handleResetChart = useCallback(() => {
    useChatStore.getState().stopGeneration()
    try {
      useChartStyleStore.getState().closeGallery()
      useFormatGalleryStore.getState().closeGallery()
    } catch {}
    clearMessages()
    resetChart()
    setHasJSON(false)
    setShowActiveBanner(false)
    useChartStore.getState().setCurrentSnapshotId(null)
    useFormatGalleryStore.getState().resetGallery()
    useTemplateStore.getState().clearAllTemplateState()
    useTemplateStore.getState().setEditorMode('chart')
    useTemplateStore.getState().setGenerateMode('chart')
    lastShownChartKeyRef.current = null
  }, [clearMessages, resetChart, setHasJSON])

  // Auto-scroll to bottom when new messages arrive
  const prevMessagesCountRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > 1 && messages.length > prevMessagesCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
    prevMessagesCountRef.current = messages.length
  }, [messages])

  // Track currentChartState changes and set hasJSON flag
  useEffect(() => {
    if (currentChartState) {
      const ds = currentChartState.chartData?.datasets
      const chartStateHash = `${currentChartState.chartType}_${ds?.length || 0}_${currentChartState.chartData?.labels?.length || 0}`

      if (lastSyncedChartStateRef.current !== chartStateHash) {
        lastSyncedChartStateRef.current = chartStateHash
        setHasJSON(true)
      }
    } else {
      lastSyncedChartStateRef.current = null
    }
  }, [currentChartState, setHasJSON])

  const hasActiveChart = currentChartState !== null && hasJSON

  // Active banner tracking via in-memory ref
  useEffect(() => {
    if (hasActiveChart) {
      const ds = currentChartState?.chartData?.datasets
      const chartKey = `${currentChartState?.chartType}_${ds?.length || 0}_${currentChartState?.chartData?.labels?.length || 0}`
      if (lastShownChartKeyRef.current !== chartKey) {
        lastShownChartKeyRef.current = chartKey
        setShowActiveBanner(true)
      }
    }
  }, [hasActiveChart, currentChartState])

  // Auto-hide banner after 8 seconds
  useEffect(() => {
    if (showActiveBanner && hasActiveChart) {
      const timer = setTimeout(() => {
        setShowActiveBanner(false)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [showActiveBanner, hasActiveChart])

  // Store hydration guard
  const [storeHydrated, setStoreHydrated] = useState(() =>
    !!(useChartStore.persist as any)?.hasHydrated?.()
  )

  useEffect(() => {
    if (storeHydrated) return
    if ((useChartStore.persist as any)?.hasHydrated?.()) {
      setStoreHydrated(true)
      return
    }
    const unsub = (useChartStore.persist as any)?.onFinishHydration?.(() => {
      setStoreHydrated(true)
    })
    return () => { unsub?.() }
  }, [storeHydrated])

  // Content readiness
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    if (!storeHydrated) return
    let timer: ReturnType<typeof setTimeout>
    const raf = requestAnimationFrame(() => {
      timer = setTimeout(() => setContentReady(true), 150)
    })
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  }, [storeHydrated])

  // Tablet Layout (577px - 1024px)
  if (isTablet) {
    return (
      <TabletLandingView
        handleNewConversation={handleNewConversation}
        storeHydrated={storeHydrated}
        contentReady={contentReady}
        hasJSON={hasJSON}
        chartData={chartData}
        isProcessing={isProcessing}
        messages={messages}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleInputChange={handleInputChange}
        handlePaste={handlePaste}
        textareaRef={textareaRef}
        messagesEndRef={messagesEndRef}
        isChatDisabled={isChatDisabled}
        hasActiveChart={hasActiveChart}
        showActiveBanner={showActiveBanner}
        setShowActiveBanner={setShowActiveBanner}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        includeImages={includeImages}
        setIncludeImages={setIncludeImages}
        aiCreditsRemaining={aiCreditsRemaining}
        aiCreditsLimit={aiCreditsLimit}
        isUpgradeOpen={isUpgradeOpen}
        setIsUpgradeOpen={setIsUpgradeOpen}
        isTemplateModalOpen={isTemplateModalOpen}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        currentChartState={currentChartState}
      />
    )
  }

  // Mobile Layout (< 577px)
  if (isMobile) {
    return (
      <MobileLandingView
        user={user}
        storeHydrated={storeHydrated}
        contentReady={contentReady}
        hasJSON={hasJSON}
        chartData={chartData}
        chartType={chartType}
        setChartType={setChartType}
        isProcessing={isProcessing}
        messages={messages}
        input={input}
        setInput={setInput}
        handleSend={handleSend}
        handleInputChange={handleInputChange}
        handlePaste={handlePaste}
        textareaRef={textareaRef}
        messagesEndRef={messagesEndRef}
        isChatDisabled={isChatDisabled}
        hasActiveChart={hasActiveChart}
        showActiveBanner={showActiveBanner}
        setShowActiveBanner={setShowActiveBanner}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        includeImages={includeImages}
        setIncludeImages={setIncludeImages}
        aiCreditsRemaining={aiCreditsRemaining}
        aiCreditsLimit={aiCreditsLimit}
        isUpgradeOpen={isUpgradeOpen}
        setIsUpgradeOpen={setIsUpgradeOpen}
        isTemplateModalOpen={isTemplateModalOpen}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        currentChartState={currentChartState}
        handleNewConversation={handleNewConversation}
        handleResetChart={handleResetChart}
        activeConfig={activeConfig}
        originalCloudDimensions={originalCloudDimensions}
        currentSnapshotId={currentSnapshotId}
        renderedFormat={renderedFormat}
        showSaveChartDialog={showSaveChartDialog}
        setShowSaveChartDialog={setShowSaveChartDialog}
        saveChartDialogName={saveChartDialogName}
        isUpdate={isUpdate}
        isSaving={isSaving}
        handleSaveChart={handleSaveChart}
        handleSaveToCloudClick={handleSaveToCloudClick}
      />
    )
  }

  // Desktop Layout (default)
  return (
    <>
      {/* Floating global header for history and avatar */}
      {storeHydrated && (!chartData?.datasets?.length || !hasJSON) && !isTablet && !isMobile && !isTemplateModalOpen && !isGalleryOpen && !isStyleGalleryOpen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <HistoryDropdown variant="full" />
          <SimpleProfileDropdown size="sm" />
        </div>
      )}

      {/* Skeleton overlay: covers the content area until chart/format is fully painted */}
      {(!storeHydrated || (!contentReady && hasJSON)) && (
        <div className="absolute inset-0 z-20 bg-slate-50/90 backdrop-blur-sm rounded-l-2xl">
          <ChartAreaSkeleton />
        </div>
      )}

      {/* Real content */}
      {isGalleryOpen ? (
        <FormatGallery
          leftSidebarOpen={leftSidebarOpen}
          setLeftSidebarOpen={setLeftSidebarOpen}
        />
      ) : isStyleGalleryOpen ? (
        <ChartStyleGalleryPage />
      ) : chartData?.datasets?.length > 0 && hasJSON ? (
        <div className="relative w-full h-full flex-1 flex flex-col">
          {isProcessing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-200/80 dark:border-indigo-800 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                Updating chart with AI...
              </span>
              <button
                type="button"
                onClick={() => {
                  useChatStore.getState().stopGeneration()
                  toast.info("Generation cancelled")
                }}
                className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Square className="w-2.5 h-2.5 fill-current text-red-500" />
                <span>Cancel</span>
              </button>
            </div>
          )}
          <ChartLayout
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
          />
        </div>
      ) : isProcessing ? (
        <GenerationProgressView />
      ) : (
        <PromptTemplate
          size="large"
          onSampleClick={handleTemplateClick}
          isTemplateModalOpen={isTemplateModalOpen}
          setIsTemplateModalOpen={setIsTemplateModalOpen}
        />
      )}

      {/* Save Dialog Popup */}
      <SaveChartDialog
        open={showSaveChartDialog}
        defaultName={saveChartDialogName}
        isUpdate={isUpdate}
        isSaving={isSaving}
        onSave={handleSaveChart}
        onCancel={() => setShowSaveChartDialog(false)}
      />

      {/* Mode Change Confirmation Dialog */}
      <ModeChangeConfirmDialog
        open={showModeChangeConfirm}
        onOpenChange={setModeChangeConfirm}
        onConfirm={confirmModeChange}
        onCancel={cancelModeChange}
      />

      {/* Upgrade Pro Dialog for Desktop Viewport */}
      <UpgradeProDialog
        open={isUpgradeOpen}
        onOpenChange={setIsUpgradeOpen}
        featureHighlight="ai"
        title="Need More AI Credits?"
        description={`You have ${aiCreditsRemaining} AI credits remaining of your monthly ${aiCreditsLimit} limit. Upgrade to Pro for 50 credits/month.`}
      />
    </>
  )
}
