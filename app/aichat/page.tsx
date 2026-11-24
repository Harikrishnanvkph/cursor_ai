"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import { useShallow } from "zustand/react/shallow"
import { useRouter } from "next/navigation"
import { Square } from "lucide-react"
import { saveChartToCloud } from "@/lib/save-utils"
import { getEffectiveChartTitle, resolveActiveCloudConversationId, useChartRename } from "@/lib/hooks/use-chart-rename"
import { useChartStore, prepareChartDataForSave } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { ChartLayout } from "@/components/chart-layout"
import { useHistoryStore } from "@/lib/history-store"
import { useTemplateStore } from "@/lib/template-store"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { HistoryDropdown } from "@/components/history-dropdown"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { toast } from "sonner"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useSettingsStore } from "@/lib/stores/settings-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useChartExport } from "@/lib/hooks/use-chart-export"
import { useZoomPan } from "@/lib/hooks/use-zoom-pan"
import { dataService } from "@/lib/data-service"
import { DatasetService } from "@/lib/services/dataset-service"
import { GroupService } from "@/lib/services/group-service"
import { parseDimension } from "@/lib/utils/dimension-utils"
import { useSidebarContext, useSidebarInputDispatch } from "@/components/aichat/sidebar-context"
import { useIsMobile, useIsTablet } from "@/lib/hooks/use-screen-dimensions"
import { PromptTemplate, chartTemplate } from "@/components/aichat/prompt_template"
import { ChartAreaSkeleton, GenerationProgressView } from "@/components/aichat/aichat-helpers"
import { ChartPreview } from "@/components/chart-preview"
import { ModernEditorTopBar } from "@/components/editor/modern-editor-topbar"
import { ModernWorkspaceBottomBar } from "@/components/editor/modern-workspace-bottombar"
import { ModernAiChatLeftSidebar, type ModernAiChatRailTab } from "@/components/aichat/modern-aichat-left-sidebar"

const SaveChartDialog = dynamic(() => import("@/components/ui/save-chart-dialog").then(m => m.SaveChartDialog), { ssr: false })
const ModeChangeConfirmDialog = dynamic(() => import("@/components/dialogs/mode-change-confirm-dialog").then(m => m.ModeChangeConfirmDialog), { ssr: false })
const DimensionMismatchDialog = dynamic(() => import("@/components/dialogs/dimension-mismatch-dialog").then(m => m.DimensionMismatchDialog), { ssr: false })
const SaveModeConflictDialog = dynamic(() => import("@/components/dialogs/save-mode-conflict-dialog").then(m => m.SaveModeConflictDialog), { ssr: false })
const ClearChartDialog = dynamic(() => import("@/components/dialogs/clear-chart-dialog").then(m => m.ClearChartDialog), { ssr: false })
const FormatGallery = dynamic(() => import("@/components/gallery/FormatGallery").then(m => m.FormatGallery), { ssr: false })
const ChartStyleGalleryPage = dynamic(() => import("@/components/chart-style-gallery/ChartStyleGalleryPage").then(m => m.ChartStyleGalleryPage), { ssr: false })
const TabletAiChatView = dynamic(
  () => import("@/components/aichat/tablet-aichat-view").then(m => m.TabletAiChatView),
  { ssr: false, loading: () => <ChartAreaSkeleton /> }
)
const MobileAiChatView = dynamic(
  () => import("@/components/aichat/mobile-aichat-view").then(m => m.MobileAiChatView),
  { ssr: false, loading: () => <ChartAreaSkeleton /> }
)

export default function AiChatPage() {
  return <AiChatPageContent />
}

function AiChatPageContent() {
  const { user, sessionReady } = useAuth()
  const router = useRouter()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)
  const { isPro, aiCreditsLimit, aiCreditsRemaining, freeAiCreditsRemaining, purchasedAiCredits } = useSubscriptionQuota()

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
  } = useChartStore(useShallow(s => ({
    chartConfig: s.chartConfig,
    chartData: s.chartData,
    chartType: s.chartType,
    setChartType: s.setChartType,
    resetChart: s.resetChart,
    hasJSON: s.hasJSON,
    setHasJSON: s.setHasJSON,
    originalCloudDimensions: s.originalCloudDimensions,
    currentSnapshotId: s.currentSnapshotId,
  })))

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
  } = useChatStore(useShallow(s => ({
    messages: s.messages,
    currentChartState: s.currentChartState,
    isProcessing: s.isProcessing,
    continueConversation: s.continueConversation,
    startNewConversation: s.startNewConversation,
    clearMessages: s.clearMessages,
    setMessages: s.setMessages,
    backendConversationId: s.backendConversationId,
    selectedModel: s.selectedModel,
    setSelectedModel: s.setSelectedModel,
    includeImages: s.includeImages,
    setIncludeImages: s.setIncludeImages,
  })))

  const { loadConversationsFromBackend, restoreConversation } = useHistoryStore(useShallow(s => ({
    loadConversationsFromBackend: s.loadConversationsFromBackend,
    restoreConversation: s.restoreConversation,
  })))
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
  } = useTemplateStore(useShallow(s => ({
    generateMode: s.generateMode,
    editorMode: s.editorMode,
    currentTemplate: s.currentTemplate,
    templateInBackground: s.templateInBackground,
    syncTemplatesFromCloud: s.syncTemplatesFromCloud,
    showModeChangeConfirm: s.showModeChangeConfirm,
    setModeChangeConfirm: s.setModeChangeConfirm,
    confirmModeChange: s.confirmModeChange,
    cancelModeChange: s.cancelModeChange,
  })))

  const { isGalleryOpen, openGallery, selectedFormatId, contentPackage, formats, userFormats, selectedFormatSnapshot } = useFormatGalleryStore(useShallow(s => ({
    isGalleryOpen: s.isGalleryOpen,
    openGallery: s.openGallery,
    selectedFormatId: s.selectedFormatId,
    contentPackage: s.contentPackage,
    formats: s.formats,
    userFormats: s.userFormats,
    selectedFormatSnapshot: s.selectedFormatSnapshot,
  })))

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

  const isStyleGalleryOpen = useChartStyleStore(s => s.isGalleryOpen)

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

  // Auto-migrate legacy 'template' mode to modern blueprint format mode
  useEffect(() => {
    if (generateMode === 'template') {
      useTemplateStore.getState().setGenerateMode('format')
    }
  }, [generateMode])

  // Chat is always enabled in both chart and template modes
  const isChatDisabled = false

  // Update initial message when template mode changes
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const templateMessage = 'Describe your chart content. You can optionally select a template first, or browse templates after generation.'
      const defaultMessage = 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.'

      const isTemplateMode = generateMode === 'format' || generateMode === 'template'
      const currentMessage = messages[0].content

      if (isTemplateMode && !selectedFormatId && currentMessage !== templateMessage && currentMessage !== defaultMessage) {
        setMessages([{ ...messages[0], content: templateMessage }])
      } else if (!isTemplateMode && currentMessage === templateMessage) {
        setMessages([{ ...messages[0], content: defaultMessage }])
      }
    }
  }, [generateMode, selectedFormatId, messages, setMessages])

  const [showActiveBanner, setShowActiveBanner] = useState(false)
  const sidebarContext = useSidebarContext()
  const setSidebarChatInput = useSidebarInputDispatch()
  const leftSidebarOpen = sidebarContext.leftSidebarOpen
  const setLeftSidebarOpen = sidebarContext.setLeftSidebarOpen
  const [hasLoadedBackendData, setHasLoadedBackendData] = useState(false)

  // Screen dimension hooks
  const isTablet = useIsTablet()
  const isMobile = useIsMobile()

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)

  // Auto-sync backend data when user logs in (keyed on user?.id + sessionReady so stale JWTs
  // finish single-flight /auth/me refresh before parallel conversations + templates requests fire)
  const userId = user?.id
  useEffect(() => {
    if (userId && sessionReady && !hasLoadedBackendData) {
      setHasLoadedBackendData(true)
      Promise.all([
        loadConversationsFromBackend(),
        syncTemplatesFromCloud()
      ])
        .then(() => {
          const chatStore = useChatStore.getState()
          if (chatStore.backendConversationId && !currentChartState) {
            restoreConversation(chatStore.backendConversationId).catch(() => {})
          }
        })
        .catch(() => {
          setHasLoadedBackendData(false)
        })
    }

    if (!userId && hasLoadedBackendData) {
      setHasLoadedBackendData(false)
    }
  }, [userId, sessionReady, hasLoadedBackendData, loadConversationsFromBackend, syncTemplatesFromCloud, currentChartState, restoreConversation])

  const [showSaveChartDialog, setShowSaveChartDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveChartDialogName, setSaveChartDialogName] = useState("")

  const handleSaveToCloudClick = useCallback(() => {
    const existingBackendId = resolveActiveCloudConversationId()
    const effectiveTitle = getEffectiveChartTitle()

    let defaultName = "Untitled Chart"
    if (effectiveTitle && effectiveTitle !== "No Chart Available" && effectiveTitle !== "Untitled Chart") {
      defaultName = effectiveTitle
    } else if (existingBackendId) {
      const conversations = useHistoryStore.getState().conversations
      const existingConversation = conversations.find(c => c.id === existingBackendId)
      if (existingConversation?.title) {
        defaultName = existingConversation.title
      }
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
      await saveChartToCloud({
        chartName: name,
        user,
        onSaveComplete: () => {
          setIsSaving(false)
          setShowSaveChartDialog(false)
        }
      })
    } catch {
      setIsSaving(false)
    }
  }, [user])

  const isUpdate = !!backendConversationId

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isProcessing || isChatDisabled) return

    // Guard: Check AI credits (1 for chart, 2 for template/format mode)
    const templateStore = useTemplateStore.getState()
    const formatStore = useFormatGalleryStore.getState()
    const isTemplate =
      templateStore.editorMode === 'template' ||
      templateStore.generateMode === 'template' ||
      templateStore.generateMode === 'format' ||
      Boolean(formatStore.selectedFormatId) ||
      Boolean(templateStore.currentTemplate)
    const requiredCredits = isTemplate ? 2 : 1

    if (user && aiCreditsRemaining < requiredCredits) {
      setIsUpgradeOpen(true)
      toast.error(
        isTemplate
          ? `Template mode requires 2 AI credits, but you have ${aiCreditsRemaining} remaining. Top up your AI credits to continue!`
          : `You have reached your limit of ${aiCreditsLimit} AI credits. Top up your AI credits to continue!`
      )
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
    setSidebarChatInput(chartTemplate)
    setTimeout(() => {
      const ref = sidebarContext.textareaRef?.current || textareaRef.current
      if (ref) {
        ref.focus()
        ref.style.height = "36px"
        ref.style.height = `${ref.scrollHeight}px`
      }
    }, 0)
  }, [sidebarContext, setSidebarChatInput])

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
  const hasVisualContent = Boolean(
    (chartData?.datasets?.length > 0 && hasJSON) ||
    (editorMode === 'template' && (currentTemplate || templateInBackground))
  )

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

  // Content readiness - synchronously ready if already hydrated, no artificial timer delay
  const [contentReady, setContentReady] = useState(() =>
    !!(useChartStore.persist as any)?.hasHydrated?.()
  )

  useEffect(() => {
    if (!storeHydrated || contentReady) return
    const raf = requestAnimationFrame(() => {
      setContentReady(true)
    })
    return () => cancelAnimationFrame(raf)
  }, [storeHydrated, contentReady])

  // ── Modern Interface State & Handlers (/aichat Desktop & Tablet) ──
  const editorInterface = useSettingsStore(s => s.editorInterface)
  const isModern = storeHydrated && !isMobile && editorInterface === "modern"

  const [modernRailTab, setModernRailTab] = useState<ModernAiChatRailTab>("chat")
  const [modernPanelCollapsed, setModernPanelCollapsed] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)
  const zoomPan = useZoomPan()
  const rename = useChartRename()
  const exports = useChartExport({
    onToggleLeftSidebar: () => setModernPanelCollapsed(v => !v),
    isLeftSidebarCollapsed: modernPanelCollapsed,
  })
  const { setChartType: applyChartTypeChange } = useChartActions()
  const canvasBgType = useUIStore(s => s.canvasBgType)
  const canvasBgColor = useUIStore(s => s.canvasBgColor)

  const [showDimensionDialog, setShowDimensionDialog] = useState(false)
  const [dimensionMismatchInfo, setDimensionMismatchInfo] = useState<{
    templateDimensions: { width: number; height: number }
    currentDimensions: { width: number; height: number }
  } | null>(null)
  const [showModeConflictDialog, setShowModeConflictDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isSharingLink, setIsSharingLink] = useState(false)

  const checkModeConflict = useCallback((): boolean => {
    const templateState = useTemplateStore.getState()
    const formatState = useFormatGalleryStore.getState()
    const hasTemplate = !!(
      templateState.currentTemplate ||
      templateState.templateInBackground ||
      formatState.selectedFormatId
    )
    return templateState.editorMode === "chart" && templateState.templateSavedToCloud && hasTemplate
  }, [])

  const checkDimensionMismatch = useCallback((): boolean => {
    const templateState = useTemplateStore.getState()
    const templateToCheck = templateState.currentTemplate || templateState.templateInBackground
    if (!templateToCheck || !templateToCheck.chartArea) return false
    if (templateState.editorMode === "template") return false

    const templateWidth = templateToCheck.chartArea.width
    const templateHeight = templateToCheck.chartArea.height
    const currentWidth = parseDimension(chartConfig.width)
    const currentHeight = parseDimension(chartConfig.height)
    const isResponsiveMode =
      chartConfig.responsive === true && !chartConfig.manualDimensions && !chartConfig.templateDimensions

    if (isResponsiveMode || templateWidth !== currentWidth || templateHeight !== currentHeight) {
      setDimensionMismatchInfo({
        templateDimensions: { width: templateWidth, height: templateHeight },
        currentDimensions: isResponsiveMode
          ? { width: 0, height: 0 }
          : { width: currentWidth, height: currentHeight },
      })
      return true
    }
    return false
  }, [chartConfig])

  const handleModernSaveClick = useCallback(() => {
    if (!hasJSON) {
      toast.error("No chart to save")
      return
    }
    if (checkModeConflict()) {
      setShowModeConflictDialog(true)
      return
    }
    if (checkDimensionMismatch()) {
      setShowDimensionDialog(true)
      return
    }
    handleSaveToCloudClick()
  }, [hasJSON, checkModeConflict, checkDimensionMismatch, handleSaveToCloudClick])

  const handleGoToTemplateMode = useCallback(() => {
    setShowDimensionDialog(false)
    setDimensionMismatchInfo(null)
    useTemplateStore.getState().setEditorMode("template")
  }, [])

  const handleSaveAsChartOnly = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to save charts")
      return
    }
    setIsSaving(true)
    try {
      const baseTitle = getEffectiveChartTitle()
      const conversationTitle =
        baseTitle && baseTitle !== "No Chart Available" && baseTitle !== "Untitled Chart"
          ? `${baseTitle} (Copy)`
          : `Chart copy - ${new Date().toLocaleDateString()}`
      const response = await dataService.createConversation(
        conversationTitle,
        "Standalone chart copy (no template)"
      )
      if (response.error || !response.data) {
        toast.error("Failed to create chart copy")
        return
      }
      const newConversationId = response.data.id
      const liveStore = useChartStore.getState()
      const chartDataToSave = prepareChartDataForSave(
        liveStore.chartData,
        liveStore.chartMode,
        liveStore.activeDatasetIndex,
        liveStore.activeGroupId,
        conversationTitle,
        newConversationId,
        true
      )
      const snapshotResult = await dataService.saveChartSnapshot(
        newConversationId,
        liveStore.chartType,
        chartDataToSave,
        liveStore.getActiveChartConfig(),
        null,
        null
      )
      if (snapshotResult.error) {
        toast.error("Failed to save chart snapshot")
        return
      }
      useTemplateStore.getState().clearAllTemplateState()
      const newSnapshotId = snapshotResult.data?.id || null
      if (liveStore.chartMode === "single" && liveStore.chartData.datasets[liveStore.activeDatasetIndex]) {
        const updated = DatasetService.updateDataset(
          liveStore.activeDatasetIndex,
          {
            sourceId: newConversationId,
            sourceSnapshotId: newSnapshotId || undefined,
            sourceTitle: conversationTitle,
          },
          {
            chartType: liveStore.chartType,
            chartData: liveStore.chartData,
            chartConfig: liveStore.chartConfig,
            chartMode: liveStore.chartMode,
            hasJSON: liveStore.hasJSON,
            singleModeData: liveStore.singleModeData,
            groupedModeData: liveStore.groupedModeData,
          }
        )
        if (updated) useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      } else if (liveStore.chartMode === "grouped" && liveStore.activeGroupId && liveStore.groups) {
        const updated = GroupService.updateGroup(
          liveStore.activeGroupId,
          {
            name: conversationTitle,
            sourceId: newConversationId,
            sourceSnapshotId: newSnapshotId || undefined,
            sourceTitle: conversationTitle,
          },
          { groups: liveStore.groups }
        )
        useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      }
      useChatStore.getState().setBackendConversationId(newConversationId)
      if (newSnapshotId) {
        useChartStore.getState().setCurrentSnapshotId(newSnapshotId)
      }
      try {
        await useHistoryStore.getState().loadConversationsFromBackend(true)
      } catch {}
      setShowDimensionDialog(false)
      setDimensionMismatchInfo(null)
      toast.success("Chart saved as standalone copy!")
    } catch {
      toast.error("Failed to save chart copy")
    } finally {
      setIsSaving(false)
    }
  }, [user])

  const handleSaveChartDiscardTemplate = useCallback(() => {
    setShowModeConflictDialog(false)
    useTemplateStore.getState().clearAllTemplateState()
    useFormatGalleryStore.getState().setSelectedFormat(null, "bar")
    handleSaveToCloudClick()
  }, [handleSaveToCloudClick])

  const handleSaveAsSeparateChart = useCallback(async () => {
    setShowModeConflictDialog(false)
    if (!user) {
      toast.error("Please sign in to save charts")
      return
    }
    setIsSaving(true)
    try {
      const baseTitle = getEffectiveChartTitle()
      const conversationTitle =
        baseTitle && baseTitle !== "No Chart Available" && baseTitle !== "Untitled Chart"
          ? `${baseTitle} (Copy)`
          : `Chart copy - ${new Date().toLocaleDateString()}`
      const response = await dataService.createConversation(
        conversationTitle,
        "Standalone chart copy (no template)"
      )
      if (response.error || !response.data) {
        toast.error("Failed to create chart copy")
        return
      }
      const newConversationId = response.data.id
      const liveStore = useChartStore.getState()
      const chartDataToSave = prepareChartDataForSave(
        liveStore.chartData,
        liveStore.chartMode,
        liveStore.activeDatasetIndex,
        liveStore.activeGroupId,
        conversationTitle,
        newConversationId,
        true
      )
      const snapshotResult = await dataService.saveChartSnapshot(
        newConversationId,
        liveStore.chartType,
        chartDataToSave,
        liveStore.getActiveChartConfig(),
        null,
        null
      )
      if (snapshotResult.error) {
        toast.error("Failed to save chart snapshot")
        return
      }
      const newSnapshotId = snapshotResult.data?.id || null
      if (liveStore.chartMode === "single" && liveStore.chartData.datasets[liveStore.activeDatasetIndex]) {
        const updated = DatasetService.updateDataset(
          liveStore.activeDatasetIndex,
          {
            sourceId: newConversationId,
            sourceSnapshotId: newSnapshotId || undefined,
            sourceTitle: conversationTitle,
          },
          {
            chartType: liveStore.chartType,
            chartData: liveStore.chartData,
            chartConfig: liveStore.chartConfig,
            chartMode: liveStore.chartMode,
            hasJSON: liveStore.hasJSON,
            singleModeData: liveStore.singleModeData,
            groupedModeData: liveStore.groupedModeData,
          }
        )
        if (updated) useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      } else if (liveStore.chartMode === "grouped" && liveStore.activeGroupId && liveStore.groups) {
        const updated = GroupService.updateGroup(
          liveStore.activeGroupId,
          {
            name: conversationTitle,
            sourceId: newConversationId,
            sourceSnapshotId: newSnapshotId || undefined,
            sourceTitle: conversationTitle,
          },
          { groups: liveStore.groups }
        )
        useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      }
      useChatStore.getState().setBackendConversationId(newConversationId)
      if (newSnapshotId) {
        useChartStore.getState().setCurrentSnapshotId(newSnapshotId)
      }
      useTemplateStore.getState().clearAllTemplateState()
      useFormatGalleryStore.getState().setSelectedFormat(null, "bar")
      try {
        await useHistoryStore.getState().loadConversationsFromBackend(true)
      } catch {}
      toast.success("Chart saved as separate copy!")
    } catch {
      toast.error("Failed to save chart copy")
    } finally {
      setIsSaving(false)
    }
  }, [user])

  const handleCopyShareLink = useCallback(async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.")
      return
    }
    try {
      setIsSharingLink(true)
      toast.loading("Generating share link...", { id: "share-link" })
      const response = await dataService.generateShareLink(currentSnapshotId)
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link")
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Share link copied to clipboard!", { id: "share-link" })
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" })
    } finally {
      setIsSharingLink(false)
    }
  }, [currentSnapshotId])

  const handleOpenShareLink = useCallback(async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.")
      return
    }
    const newWindow = window.open("about:blank", "_blank")
    if (!newWindow) {
      toast.error("Pop-up blocked! Please allow popups for this site.")
      return
    }
    try {
      setIsSharingLink(true)
      toast.loading("Generating share link...", { id: "share-link" })
      const response = await dataService.generateShareLink(currentSnapshotId)
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link")
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`
      newWindow.location.href = shareUrl
      toast.dismiss("share-link")
    } catch (err: any) {
      newWindow.close()
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" })
    } finally {
      setIsSharingLink(false)
    }
  }, [currentSnapshotId])

  const handleModernNewChat = useCallback(() => {
    handleNewConversation()
    setInput("")
    setSidebarChatInput("")
    setModernRailTab("chat")
    setModernPanelCollapsed(false)
  }, [handleNewConversation, setSidebarChatInput])

  // Modern AI Chat Layout (Desktop & Tablet >= 768px when editorInterface === "modern")
  if (isModern) {
    return (
      <div className="flex-1 flex flex-col min-w-0 h-screen w-full overflow-hidden bg-white">
        <ModernEditorTopBar
          activeApp="aichat"
          chartType={chartType}
          onChartTypeChange={(type) => applyChartTypeChange(type as any)}
          chartContainerRef={chartContainerRef}
          rename={rename}
          zoomPan={zoomPan}
          exports={exports}
          hasJSON={hasJSON}
          hasData={hasVisualContent}
          isSaving={isSaving}
          isSharingLink={isSharingLink}
          currentSnapshotId={currentSnapshotId}
          onSaveClick={handleModernSaveClick}
          onClearClick={() => setShowClearDialog(true)}
          onCopyShareLink={handleCopyShareLink}
          onOpenShareLink={handleOpenShareLink}
          onNewChatClick={handleModernNewChat}
        />

        {/* Main Workspace Row */}
        <div className="flex-1 flex min-w-0 min-h-0 w-full bg-white overflow-hidden relative">
          <ModernAiChatLeftSidebar
            activeTab={modernRailTab}
            onTabChange={setModernRailTab}
            collapsed={modernPanelCollapsed}
            onCollapsedChange={setModernPanelCollapsed}
            isTablet={isTablet}
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onInputChange={handleInputChange}
            onPaste={handlePaste}
            onNewChat={handleModernNewChat}
            isProcessing={isProcessing}
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
            freeAiCreditsRemaining={freeAiCreditsRemaining}
            purchasedAiCredits={purchasedAiCredits}
            onOpenUpgrade={() => setIsUpgradeOpen(true)}
            textareaRef={textareaRef}
            messagesEndRef={messagesEndRef}
            currentChartState={currentChartState}
          />

          {/* Center Canvas / Content Area */}
          <div className="flex-1 min-w-0 h-full flex flex-col overflow-hidden relative bg-white">
            {!contentReady && hasJSON && !isGalleryOpen && !isStyleGalleryOpen && (
              <div className="absolute inset-0 z-20 bg-white">
                <ChartAreaSkeleton />
              </div>
            )}

            {isGalleryOpen ? (
              <FormatGallery
                leftSidebarOpen={!modernPanelCollapsed}
                setLeftSidebarOpen={(open) => setModernPanelCollapsed(!open)}
              />
            ) : isStyleGalleryOpen ? (
              <ChartStyleGalleryPage />
            ) : hasVisualContent ? (
              <div
                className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative"
                style={{
                  backgroundColor: canvasBgType === "transparent" ? "transparent" : canvasBgColor,
                  backgroundImage:
                    canvasBgType === "transparent"
                      ? `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)`
                      : undefined,
                  backgroundSize: canvasBgType === "transparent" ? "20px 20px" : undefined,
                  backgroundPosition:
                    canvasBgType === "transparent" ? "0 0, 0 10px, 10px -10px, -10px 0px" : undefined,
                }}
              >
                {isProcessing && (
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md px-4 py-2 rounded-full border border-indigo-200/80 shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
                    <span className="text-xs font-semibold text-slate-800">
                      Updating chart with AI...
                    </span>
                    <button
                      type="button"
                      onClick={() => useChatStore.getState().stopGeneration()}
                      className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-2.5 h-2.5 fill-current text-red-500" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}

                <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden">
                  <ChartPreview
                    variant="aichat"
                    hideToolbar={true}
                    externalZoomPan={zoomPan}
                    externalContainerRef={chartContainerRef}
                    onToggleLeftSidebar={() => setModernPanelCollapsed(v => !v)}
                    isLeftSidebarCollapsed={modernPanelCollapsed}
                  />
                </div>

                <ModernWorkspaceBottomBar
                  chartContainerRef={chartContainerRef}
                  zoomPan={zoomPan}
                  isSidebarCollapsed={modernPanelCollapsed}
                  onOpenDimensionsPanel={() => {
                    useUIStore.getState().setActiveSidebarTab("general")
                    setModernRailTab("tools")
                    setModernPanelCollapsed(false)
                  }}
                />
              </div>
            ) : isProcessing ? (
              <GenerationProgressView />
            ) : (
              <PromptTemplate
                size="large"
                onSampleClick={() => {
                  handleTemplateClick()
                  setModernRailTab("chat")
                  setModernPanelCollapsed(false)
                }}
                isTemplateModalOpen={isTemplateModalOpen}
                setIsTemplateModalOpen={setIsTemplateModalOpen}
              />
            )}
          </div>
        </div>

        {/* Modern AI Chat Dialogs */}
        {dimensionMismatchInfo && (
          <DimensionMismatchDialog
            isOpen={showDimensionDialog}
            onClose={() => {
              setShowDimensionDialog(false)
              setDimensionMismatchInfo(null)
            }}
            templateDimensions={dimensionMismatchInfo.templateDimensions}
            currentDimensions={dimensionMismatchInfo.currentDimensions}
            onGoToTemplateMode={handleGoToTemplateMode}
            onSaveAsChartOnly={handleSaveAsChartOnly}
            isSaving={isSaving}
          />
        )}

        <SaveModeConflictDialog
          isOpen={showModeConflictDialog}
          onClose={() => setShowModeConflictDialog(false)}
          onSaveChartDiscardTemplate={handleSaveChartDiscardTemplate}
          onSaveAsSeparateChart={handleSaveAsSeparateChart}
          isSaving={isSaving}
        />

        <ClearChartDialog
          open={showClearDialog}
          onOpenChange={setShowClearDialog}
          onSuccess={() => {
            setShowActiveBanner(false)
            lastShownChartKeyRef.current = null
          }}
        />

        <SaveChartDialog
          open={showSaveChartDialog}
          defaultName={saveChartDialogName}
          isUpdate={!!resolveActiveCloudConversationId()}
          isSaving={isSaving}
          onSave={handleSaveChart}
          onCancel={() => setShowSaveChartDialog(false)}
        />

        <ModeChangeConfirmDialog
          open={showModeChangeConfirm}
          onOpenChange={setModeChangeConfirm}
          onConfirm={confirmModeChange}
          onCancel={cancelModeChange}
        />

        <UpgradeProDialog
          open={isUpgradeOpen}
          onOpenChange={setIsUpgradeOpen}
          featureHighlight="ai"
          title="Need More AI Credits?"
          description={`You have ${aiCreditsRemaining} AI credits remaining. Choose a top-up pack to keep generating charts.`}
        />
      </div>
    )
  }

  // Universal Gallery views (accessible across Desktop, Tablet, and Mobile)
  if (isGalleryOpen) {
    return (
      <FormatGallery
        leftSidebarOpen={leftSidebarOpen}
        setLeftSidebarOpen={setLeftSidebarOpen}
      />
    )
  }

  if (isStyleGalleryOpen) {
    return <ChartStyleGalleryPage />
  }

  // Tablet Layout (768px - 1023px)
  if (isTablet) {
    return (
      <TabletAiChatView
        user={user}
        handleNewConversation={handleNewConversation}
        handleResetChart={handleResetChart}
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
        freeAiCreditsRemaining={freeAiCreditsRemaining}
        purchasedAiCredits={purchasedAiCredits}
        isUpgradeOpen={isUpgradeOpen}
        setIsUpgradeOpen={setIsUpgradeOpen}
        isTemplateModalOpen={isTemplateModalOpen}
        setIsTemplateModalOpen={setIsTemplateModalOpen}
        currentChartState={currentChartState}
        currentSnapshotId={currentSnapshotId}
        showSaveChartDialog={showSaveChartDialog}
        setShowSaveChartDialog={setShowSaveChartDialog}
        saveChartDialogName={saveChartDialogName}
        isUpdate={isUpdate}
        isSaving={isSaving}
        handleSaveChart={handleSaveChart}
        handleSaveToCloudClick={handleSaveToCloudClick}
        showModeChangeConfirm={showModeChangeConfirm}
        setModeChangeConfirm={setModeChangeConfirm}
        confirmModeChange={confirmModeChange}
        cancelModeChange={cancelModeChange}
      />
    )
  }

  // Mobile Layout (< 768px)
  if (isMobile) {
    return (
      <MobileAiChatView
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
        freeAiCreditsRemaining={freeAiCreditsRemaining}
        purchasedAiCredits={purchasedAiCredits}
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
      {storeHydrated && !hasVisualContent && !isTablet && !isMobile && !isGalleryOpen && !isStyleGalleryOpen && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <HistoryDropdown variant="full" />
          <SimpleProfileDropdown size="sm" />
        </div>
      )}

      {/* Skeleton overlay: covers the content area until chart/format is fully painted */}
      {(!storeHydrated || (!contentReady && hasJSON)) && (
        <div className="absolute inset-0 z-20 bg-white dark:bg-slate-950 rounded-l-2xl">
          <ChartAreaSkeleton />
        </div>
      )}

      {/* Real content */}
      {hasVisualContent ? (
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
        description={`You have ${aiCreditsRemaining} AI credits remaining. Choose a top-up pack to keep generating charts.`}
      />
    </>
  )
}
