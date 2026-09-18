"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react"

import { useRouter } from "next/navigation"
import { Send, ArrowUp, BarChart2, Plus, SquarePen, Pencil, PencilRuler, RotateCcw, Edit3, MessageSquare, Sparkles, ArrowRight, X, ChevronLeft, ChevronRight, ChevronDown, PanelLeft, PanelRight, Settings, Brain, Bot, Info, LayoutDashboard, Layers, Menu, MoreVertical, Check, Palette, Cloud, Trash2, Download, FileImage, ImageIcon, FileCode, FileText, Maximize2, MessageCircleDashed, ChartColumnBig, Eye, Loader2, History, ToolCase, Share2, Copy, ExternalLink, PieChart, LineChart } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuPortal } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STANDARD_CHART_TYPES, THREE_D_CHART_TYPES } from "@/lib/chart-types"
import { useChartExport } from "@/lib/hooks/use-chart-export"
import { saveChartToCloud } from "@/lib/save-utils"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { dataService } from "@/lib/data-service"
import { ChartLayout } from "@/components/chart-layout"
import { ChartPreview } from "@/components/chart-preview"
import { useHistoryStore } from "@/lib/history-store"
import { useTemplateStore } from "@/lib/template-store"
import { useChartRename } from "@/lib/hooks/use-chart-rename"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/AuthProvider"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { HistoryDropdown } from "@/components/history-dropdown"
import { UndoRedoButtons } from "@/components/ui/undo-redo-buttons"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { clearStoreData } from "@/lib/utils"
import { SaveChartDialog } from "@/components/ui/save-chart-dialog"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { Zap } from "lucide-react"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel";
import { ModeChangeConfirmDialog } from "@/components/dialogs/mode-change-confirm-dialog"
import { Chart } from "react-chartjs-2"
import { toast } from "sonner"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { FormatGallery } from "@/components/gallery/FormatGallery"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { ChartStyleGalleryPage } from "@/components/chart-style-gallery/ChartStyleGalleryPage"
import { useSidebarContext } from "@/components/landing/sidebar-context"
import { useIsMobile, useIsTablet } from "@/lib/hooks/use-screen-dimensions"
import { PromptTemplate, chartTemplate, ChatWindow } from "@/components/landing"
import { ConfigSidebar } from "@/components/config-sidebar"

export default function LandingPage() {
  return <LandingPageContent />
}

function LandingPageContent() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

  const { isPro, aiCreditsLimit, aiCreditsRemaining } = useSubscriptionQuota()

  // Helpers for Canva-style mobile metadata in ellipsis menu
  const parseDim = (val: any): number | null => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  const getAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(width, height);
    const rX = width / divisor;
    const rY = height / divisor;
    
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.02) return '1:1';
    if (Math.abs(ratio - 16/9) < 0.02) return '16:9';
    if (Math.abs(ratio - 4/3) < 0.02) return '4:3';
    if (Math.abs(ratio - 3/2) < 0.02) return '3:2';
    if (Math.abs(ratio - 4/5) < 0.02) return '4:5';
    if (Math.abs(ratio - 9/16) < 0.02) return '9:16';
    
    return `${rX}:${rY}`;
  };

  const getChartTypeName = (type: string): string => {
    switch (type) {
      case 'bar': return 'Bar';
      case 'horizontalBar': return 'H. Bar';
      case 'stackedBar': return 'Stacked Bar';
      case 'line': return 'Line';
      case 'area': return 'Area';
      case 'pie': return 'Pie';
      case 'doughnut': return 'Doughnut';
      case 'polarArea': return 'Polar Area';
      case 'radar': return 'Radar';
      case 'scatter': return 'Scatter';
      case 'bubble': return 'Bubble';
      default: return 'Chart';
    }
  };
  const { chartConfig, chartData, chartType, setChartType, setFullChart, resetChart, hasJSON, setHasJSON, originalCloudDimensions, currentSnapshotId } = useChartStore()
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

  const { addConversation, loadConversationsFromBackend, restoreConversation } = useHistoryStore()
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
    if (!selectedFormatId || !contentPackage) return null;
    return selectedFormatSnapshot 
      || [...formats, ...userFormats].find(f => f.id === selectedFormatId);
  }, [selectedFormatId, contentPackage, selectedFormatSnapshot, formats, userFormats]);
  const rename = useChartRename()
  const activeConfig = useChartStore(s => {
    if (s.chartMode === 'single') {
      const ds = s.chartData.datasets[s.activeDatasetIndex];
      return ds?.chartConfig ?? s.chartConfig;
    }
    const group = s.groups?.find(g => g.id === s.activeGroupId);
    return group?.chartConfig ?? s.chartConfig;
  });
  const { isGalleryOpen: isStyleGalleryOpen } = useChartStyleStore()
  const exports = useChartExport()
  const [exportExpanded, setExportExpanded] = useState(false)
  const [shareExpanded, setShareExpanded] = useState(false)
  const [isSharingLink, setIsSharingLink] = useState(false)
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasRestoredRef = useRef(false)
  const lastSyncedChartStateRef = useRef<string | null>(null)
  const hasMountSyncedRef = useRef(false) // Track if initial mount sync has happened

  // CRITICAL: Reset refs on every mount to handle navigation properly
  // In Next.js App Router, refs persist across navigations - we must reset them
  useEffect(() => {
    hasMountSyncedRef.current = false
    lastSyncedChartStateRef.current = null
  }, []) // This runs on every mount

  // Consolidated mount-time sync: Handles both restore-from-chartStore and mount sync
  // in a single effect to prevent cascading renders that cause chart flickering.
  // 
  // Two scenarios:
  // 1. Chart store has data but currentChartState is null → restore from chart store
  // 2. Chart store has data → sync to currentChartState for undo/redo context
  //
  // Both are handled atomically to avoid intermediate renders.
  useEffect(() => {
    if (hasMountSyncedRef.current) return // Only run once per mount
    hasMountSyncedRef.current = true

    const chartStoreState = useChartStore.getState()
    const chatStoreState = useChatStore.getState()

    // If chartStore has valid data, sync it to currentChartState and set hasJSON atomically
    if (chartStoreState.hasJSON && chartStoreState.chartData?.datasets?.length > 0) {
      // Update currentChartState to match chartStore (makes chartStore authoritative)
      // DO NOT call setFullChart - chartStore already has correct data
      chatStoreState.updateChartState({
        chartType: chartStoreState.chartType as any,
        chartData: chartStoreState.chartData as any,
        chartConfig: chartStoreState.chartConfig as any
      })
      // Set hasJSON flag in the same tick to avoid a separate render cycle
      chartStoreState.setHasJSON(true)
      hasRestoredRef.current = true
    }
  }, []) // Empty deps - only runs on mount

  // Check if chat should be disabled (only template mode requires a template; format mode is always enabled)
  const isChatDisabled = (generateMode === 'template' && !currentTemplate)

  // Update initial message when template/format mode changes
  useEffect(() => {
    // Only update if we have just the initial message
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const templateMessage = 'Please attach a template to start the conversation. Select a template from the options via "Choose From Templates".';
      const formatMessage = 'Describe your chart content. You can optionally select a format first, or browse formats after generation.';
      const defaultMessage = 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.';

      const shouldShowTemplateMessage = generateMode === 'template' && !currentTemplate;
      const isFormatMode = generateMode === 'format';
      const currentMessage = messages[0].content;

      if (shouldShowTemplateMessage && currentMessage !== templateMessage) {
        setMessages([{
          ...messages[0],
          content: templateMessage
        }]);
      } else if (isFormatMode && !selectedFormatId && currentMessage !== formatMessage && currentMessage !== defaultMessage) {
        setMessages([{
          ...messages[0],
          content: formatMessage
        }]);
      } else if (!shouldShowTemplateMessage && !isFormatMode && (currentMessage === templateMessage || currentMessage === formatMessage)) {
        setMessages([{
          ...messages[0],
          content: defaultMessage
        }]);
      }
    }
  }, [generateMode, currentTemplate, selectedFormatId, messages, setMessages])
  const [showActiveBanner, setShowActiveBanner] = useState(false)
  // Desktop sidebar state comes from layout context; tablet/mobile manage their own
  const sidebarContext = useSidebarContext()
  const leftSidebarOpen = sidebarContext.leftSidebarOpen
  const setLeftSidebarOpen = sidebarContext.setLeftSidebarOpen
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [hasLoadedBackendData, setHasLoadedBackendData] = useState(false)

  // Use shared SSR-safe screen dimension hooks (initialized with defaults, updated in useEffect)
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
          setHasLoadedBackendData(true);

          // If there's a backend conversation ID, restore it to load the chart
          const chatStore = useChatStore.getState();
          if (chatStore.backendConversationId && !currentChartState) {
            restoreConversation(chatStore.backendConversationId).catch(() => {
              // Silently fail - chart will load from localStorage if available
            });
          }
        })
        .catch(() => {
          // Silently fail - user can still use the app
        });
    }

    // Reset flag when user logs out
    if (!user && hasLoadedBackendData) {
      setHasLoadedBackendData(false);
    }
  }, [user, hasLoadedBackendData, loadConversationsFromBackend, syncTemplatesFromCloud, currentChartState, restoreConversation])

  // Tablet-specific states
  const [tabletRightSidebarOpen, setTabletRightSidebarOpen] = useState(false)
  const [tabletRightSidebarContent, setTabletRightSidebarContent] = useState<'messages' | 'tools' | 'history' | null>(null)

  // Mobile-specific states (reuse tablet sidebar logic but different positioning)
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false)
  const [mobileRightSidebarContent, setMobileRightSidebarContent] = useState<'messages' | 'tools' | 'history' | null>(null)
  const [mobileActiveTab, setMobileActiveTab] = useState<'chart' | 'chat' | 'design' | 'history'>('chat')
  const [sandwichOpen, setSandwichOpen] = useState(false)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)

  const userGreetingName = useMemo(() => {
    if (!user) return ""
    return (
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      ""
    )
  }, [user])

  const [showSaveChartDialog, setShowSaveChartDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveChartDialogName, setSaveChartDialogName] = useState("");

  const handleSaveToCloudClick = () => {
    const storeTitle = useChartStore.getState().chartTitle;
    const existingBackendId = useChatStore.getState().backendConversationId;
    
    let defaultName = "Untitled Chart";
    if (existingBackendId) {
      const conversations = useHistoryStore.getState().conversations;
      const existingConversation = conversations.find(c => c.id === existingBackendId);
      if (existingConversation) {
        defaultName = existingConversation.title;
      } else if (storeTitle) {
        defaultName = storeTitle;
      }
    } else if (storeTitle) {
      defaultName = storeTitle;
    } else {
      const chartTitleFromConfig = activeConfig?.plugins?.title?.text;
      if (chartTitleFromConfig) {
        defaultName = Array.isArray(chartTitleFromConfig) ? chartTitleFromConfig.join(' ') : String(chartTitleFromConfig);
      }
    }
    
    setSaveChartDialogName(defaultName);
    setShowSaveChartDialog(true);
  };

  const handleSaveChart = async (name: string) => {
    setIsSaving(true);
    try {
      toast.loading("Saving chart to cloud...", { id: "save-toast" });
      await saveChartToCloud({
        chartName: name,
        user,
        onSaveComplete: (res) => {
          setIsSaving(false);
          setShowSaveChartDialog(false);
          toast.success(res.isUpdate ? "Chart updated successfully!" : "Chart saved successfully!", { id: "save-toast" });
        }
      });
    } catch (err) {
      setIsSaving(false);
      toast.error("Failed to save chart.", { id: "save-toast" });
    }
  };

  const handleCopyShareLink = async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.");
      return;
    }
    try {
      setIsSharingLink(true);
      toast.loading("Generating share link...", { id: "share-link" });
      const response = await dataService.generateShareLink(currentSnapshotId);
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link");
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!", { id: "share-link" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" });
      console.error("Share error:", err);
    } finally {
      setIsSharingLink(false);
    }
  }

  const handleOpenShareLink = async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.");
      return;
    }
    const newWindow = window.open("about:blank", "_blank");
    if (!newWindow) {
      toast.error("Pop-up blocked! Please allow popups for this site.");
      return;
    }
    try {
      setIsSharingLink(true);
      toast.loading("Generating share link...", { id: "share-link" });
      const response = await dataService.generateShareLink(currentSnapshotId);
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link");
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`;
      newWindow.location.href = shareUrl;
      toast.success("Opened share link!", { id: "share-link" });
    } catch (err: any) {
      newWindow.close();
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" });
      console.error("Share error:", err);
    } finally {
      setIsSharingLink(false);
    }
  }

  const isUpdate = !!backendConversationId;

  const saveClickRef = useRef(handleSaveToCloudClick);
  useEffect(() => {
    saveClickRef.current = handleSaveToCloudClick;
  });

  useEffect(() => {
    const handleTriggerSave = () => {
      console.log("[LandingPage] Received triggerSaveClick event! Invoking saveClickRef.current()");
      saveClickRef.current();
    };
    window.addEventListener('triggerSaveClick', handleTriggerSave);
    document.addEventListener('triggerSaveClick', handleTriggerSave);
    return () => {
      window.removeEventListener('triggerSaveClick', handleTriggerSave);
      document.removeEventListener('triggerSaveClick', handleTriggerSave);
    };
  }, []);

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isProcessing || isChatDisabled) return

    // Guard: Check AI credits
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

      // Update textarea height to fit the restored text
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
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }, [input, isProcessing, continueConversation, isChatDisabled, setInput, textareaRef, user, aiCreditsRemaining, aiCreditsLimit])

  const handleTemplateClick = useCallback(() => {
    // Write to local state (used by tablet/mobile layouts)
    setInput(chartTemplate)
    // Write to shared context (used by desktop sidebar via layout)
    sidebarContext.setChatInput(chartTemplate)
    setTimeout(() => {
      // Try context ref first (desktop sidebar), then local ref (tablet/mobile)
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

    // Smooth synchronous height update without async timers to prevent jumping
    const el = e.target
    if (!val) {
      el.style.height = "36px"
      el.style.overflowY = "hidden"
    } else {
      el.style.height = "auto"
      const nextHeight = Math.min(Math.max(el.scrollHeight, 36), 110)
      el.style.height = `${nextHeight}px`
      el.style.overflowY = el.scrollHeight > 110 ? "auto" : "hidden"
    }
  }, [])

  // Handle paste events specifically to ensure proper height update
  const handlePaste = useCallback(() => {
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto"
        const nextHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 36), 110)
        textareaRef.current.style.height = `${nextHeight}px`
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > 110 ? "auto" : "hidden"
      }
    })
  }, [])

  const handleNewConversation = useCallback(() => {
    startNewConversation()
    setInput("")
    setShowActiveBanner(false)
    // Clear any existing banner shown flags when starting new conversation
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('chartBannerShown_')) {
        sessionStorage.removeItem(key)
      }
    })
  }, [startNewConversation])

  const handleResetChart = useCallback(() => {
    clearMessages()
    resetChart()
    setHasJSON(false)
    setShowActiveBanner(false)
    // Clear any existing banner shown flags when resetting chart
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('chartBannerShown_')) {
        sessionStorage.removeItem(key)
      }
    })
  }, [clearMessages, resetChart, setHasJSON])

  // Tablet sidebar handlers
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

  // Mobile sidebar handlers (same logic as tablet)
  const handleMobileIconClick = useCallback((contentType: 'messages' | 'tools' | 'history') => {
    if (mobileRightSidebarContent === contentType && mobileRightSidebarOpen) {
      setMobileRightSidebarOpen(false)
      setMobileRightSidebarContent(null)
    } else {
      setMobileRightSidebarContent(contentType)
      setMobileRightSidebarOpen(true)
    }
  }, [mobileRightSidebarContent, mobileRightSidebarOpen])

  const closeMobileSidebar = useCallback(() => {
    setMobileRightSidebarOpen(false)
    setMobileRightSidebarContent(null)
  }, [])

  // Auto-scroll to bottom when new messages arrive (avoid scrolling on initial mount)
  const prevMessagesCountRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > 1 && messages.length > prevMessagesCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
    prevMessagesCountRef.current = messages.length
  }, [messages])

  // Track currentChartState changes and set hasJSON flag
  // NOTE: Do NOT call setFullChart here!
  // The source (chat-store for AI, history-store for history) already called setFullChart
  // with the correct replaceMode. Calling again would cause duplicates.
  useEffect(() => {
    if (currentChartState) {
      // Lightweight hash — avoids expensive JSON.stringify on large datasets
      const ds = currentChartState.chartData?.datasets;
      const chartStateHash = `${currentChartState.chartType}_${ds?.length || 0}_${currentChartState.chartData?.labels?.length || 0}`

      // Only update if this is a different chart state to prevent infinite loops
      if (lastSyncedChartStateRef.current !== chartStateHash) {
        lastSyncedChartStateRef.current = chartStateHash
        // Only set the flag - don't call setFullChart!
        // chartStore is already updated by chat-store or history-store
        setHasJSON(true)
      }
    } else {
      // Reset ref when currentChartState is cleared
      lastSyncedChartStateRef.current = null
    }
  }, [currentChartState, setHasJSON])

  const hasActiveChart = currentChartState !== null && hasJSON

  useEffect(() => {
    // When a new chart is received, show the banner only if it hasn't been shown before
    if (hasActiveChart) {
      // Lightweight key for banner tracking
      const ds = currentChartState?.chartData?.datasets;
      const bannerShownKey = `chartBannerShown_${currentChartState?.chartType}_${ds?.length || 0}_${currentChartState?.chartData?.labels?.length || 0}`
      const hasBannerBeenShown = sessionStorage.getItem(bannerShownKey)

      if (!hasBannerBeenShown) {
        setShowActiveBanner(true)
        // Mark this banner as shown for this chart session
        sessionStorage.setItem(bannerShownKey, 'true')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveChart, currentChartState])

  // Auto-hide banner after 8 seconds if not manually closed
  useEffect(() => {
    if (showActiveBanner && hasActiveChart) {
      const timer = setTimeout(() => {
        setShowActiveBanner(false)
      }, 8000) // 8 seconds

      return () => clearTimeout(timer)
    }
  }, [showActiveBanner, hasActiveChart])

  // Clean up old banner flags on mount (sessionStorage is tab-scoped, so minimal cleanup needed)
  useEffect(() => {
    // Single cleanup pass — no interval needed since sessionStorage is cleared on tab close
    const currentTime = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith('chartBannerShown_')) {
        // Simple cleanup: remove any stale keys (unlikely in sessionStorage)
        try {
          sessionStorage.removeItem(key)
        } catch { /* ignore */ }
      }
    })
  }, []) // Only run once on mount

  // Handle migration errors by clearing localStorage (with reload-loop guard)
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('migrate')) {
        const reloadCount = parseInt(sessionStorage.getItem('_migration_reload') || '0')
        if (reloadCount < 2) {
          console.warn(`Migration error detected (attempt ${reloadCount + 1}), clearing store data...`)
          sessionStorage.setItem('_migration_reload', String(reloadCount + 1))
          clearStoreData()
          window.location.reload()
        } else {
          console.error('Migration error persists after 2 reload attempts. Manual intervention required.')
          sessionStorage.removeItem('_migration_reload')
        }
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Wait for chart store IDB hydration to prevent flashing welcome screen
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

  // Content readiness: skeleton stays until the real content has had time to paint
  const [contentReady, setContentReady] = useState(false)

  useEffect(() => {
    if (!storeHydrated) return
    let timer: ReturnType<typeof setTimeout>
    // Wait for the next paint frame + a small buffer so the chart/format actually renders
    const raf = requestAnimationFrame(() => {
      timer = setTimeout(() => setContentReady(true), 150)
    })
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  }, [storeHydrated])

  // Tablet Layout (577px - 1024px)
  if (isTablet) {
    return (
      <div className="flex h-screen w-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 relative overflow-hidden">
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
              handleNewConversation();
              // Auto-open messages sidebar for new chat
              setTabletRightSidebarContent('messages');
              setTabletRightSidebarOpen(true);
            }}
            className="p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600"
            title="New Chat"
          >
            <SquarePen className="w-5 h-5" />
          </button>

          {/* Message Icon */}
          <button
            onClick={() => handleTabletIconClick('messages')}
            className={`p-2 rounded-lg transition-all duration-200 ${tabletRightSidebarContent === 'messages' && tabletRightSidebarOpen
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
            className={`p-2 rounded-lg transition-all duration-200 ${tabletRightSidebarContent === 'tools' && tabletRightSidebarOpen
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
            className={`p-2 rounded-lg transition-all duration-200 ${tabletRightSidebarContent === 'history' && tabletRightSidebarOpen
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
              <div className="flex-1 h-full">
                <ChartPreview
                  onToggleSidebar={() => { }}
                  isSidebarCollapsed={true}
                  onToggleLeftSidebar={() => { }}
                  isLeftSidebarCollapsed={true}
                />
              </div>
            ) : storeHydrated ? (
              <PromptTemplate
                size="default"
                onSampleClick={(template) => {
                  setInput(template);
                  setTabletRightSidebarContent('messages');
                  setTabletRightSidebarOpen(true);
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
            <div
              className="absolute inset-0 bg-black/50"
              onClick={closeTabletSidebar}
            />

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
                        <button
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-700 bg-white rounded-md shadow-sm transition-colors relative"
                        >
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
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-1.5">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 py-1 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl shadow-xs">
                                <Bot className="w-3.5 h-3.5 text-indigo-500" />
                                <span>
                                  {selectedModel === 'gemini-search'
                                    ? 'Gemini Realtime'
                                    : selectedModel === 'deepseek-search'
                                    ? 'Deepseek Realtime'
                                    : 'DeepSeek Chat'}
                                </span>
                                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48 bg-white border border-slate-200 shadow-md rounded-xl p-1 z-50">
                              <DropdownMenuItem onClick={() => setSelectedModel('deepseek')} className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 rounded-lg text-slate-700">
                                <Brain className="w-3.5 h-3.5 text-blue-500" />
                                <span>DeepSeek Chat</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedModel('deepseek-search')} className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 rounded-lg text-slate-700">
                                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                <span>Deepseek Realtime</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setSelectedModel('gemini-search')} className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 rounded-lg text-slate-700">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>Gemini Realtime</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {user && (
                            <button
                              type="button"
                              onClick={() => setIsUpgradeOpen(true)}
                              className={`flex items-center gap-1 py-1 px-2 rounded-xl text-xs font-semibold transition-all border shadow-xs cursor-pointer ${
                                aiCreditsRemaining <= 0
                                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                  : aiCreditsRemaining <= 2
                                  ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                                  : 'bg-indigo-50/70 text-indigo-700 border-indigo-200/60 hover:bg-indigo-100/80'
                              }`}
                              title="Remaining monthly AI credits. Click to view subscription plans."
                            >
                              <Zap className="w-3 h-3 text-current" />
                              <span>{aiCreditsRemaining}/{aiCreditsLimit}</span>
                            </button>
                          )}
                        </div>

                        {/* Image Toggle */}
                        <div className="flex items-center gap-2 select-none">
                          <span className="text-xs font-semibold text-slate-500">Images</span>
                          <button
                            type="button"
                            onClick={() => setIncludeImages(!includeImages)}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent outline-none ${
                              includeImages ? 'bg-indigo-600' : 'bg-slate-200'
                            }`}
                            title={includeImages ? "Auto-fetch images enabled" : "Auto-fetch images disabled"}
                          >
                            <span className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-xs ${
                              includeImages ? 'translate-x-3' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end gap-2 w-full">
                        <textarea
                          ref={textareaRef}
                          className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-300 bg-white resize-none max-h-[150px] min-h-[44px] leading-relaxed transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder={isChatDisabled ? "Attach a template to start..." : (hasActiveChart ? "Modify the chart..." : "Ask AI to Generate Chart...")}
                          value={input}
                          onChange={handleInputChange}
                          onPaste={handlePaste}
                          disabled={isProcessing || isChatDisabled}
                          rows={1}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                              e.preventDefault();
                              if (!isChatDisabled) {
                                handleSend(e)
                              }
                            }
                          }}
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-[38px] h-[38px] flex items-center justify-center rounded-full flex-shrink-0 disabled:opacity-50 transition-all duration-200 shadow-sm mb-[3px]"
                          disabled={isProcessing || !input.trim() || isChatDisabled}
                        >
                          <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                        </button>
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
                      handleInputChange={handleInputChange}
                      handlePaste={handlePaste}
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

  if (isMobile) {
    return (
      <div className="flex flex-col h-screen h-dvh w-screen bg-white dark:bg-slate-950 relative overflow-hidden font-sans">
        {/* Top Header (In-flow flex item - never covers content) */}
        <header className="w-full h-14 flex-shrink-0 z-40 bg-white dark:bg-slate-950 flex items-center justify-between px-3 xs:px-4 phab:px-5 relative">
          {/* Left: Sandwich Menu Icon */}
          <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
            <button 
              onClick={() => setSandwichOpen(true)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 text-slate-700 dark:text-slate-300 cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Center: Chart / Chat Segmented Pill Switcher (Bigger, Centered) */}
          {chartData?.datasets?.length > 0 && hasJSON && (
            <div className="absolute left-1/2 -translate-x-1/2 flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-xs z-10">
              <button
                onClick={() => setMobileActiveTab('chart')}
                className={`px-3 phab:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mobileActiveTab === 'chart'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="Chart Preview"
              >
                <ChartColumnBig className="w-4 h-4" />
                <span className="hidden phab:inline">Chart</span>
              </button>
              <button
                onClick={() => setMobileActiveTab('chat')}
                className={`px-3 phab:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  mobileActiveTab === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                title="AI Chat"
              >
                <MessageCircleDashed className="w-4 h-4" />
                <span className="hidden phab:inline">Chat</span>
              </button>
            </div>
          )}

          {/* Right: New Chat + More Options */}
          <div className="flex items-center gap-1 xs:gap-1.5 flex-shrink-0">

            {/* New Chat Button (Pencil Icon) */}
            <button 
              onClick={() => {
                handleNewConversation()
                setMobileActiveTab('chat')
              }}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition-colors flex-shrink-0 cursor-pointer"
              title="New Chat"
            >
              <SquarePen className="w-5 h-5" />
            </button>

            {/* More Options Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition-colors flex-shrink-0 cursor-pointer"
                  title="More Options"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[270px] p-1.5 z-[100] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xl space-y-1">
                  {/* File Name & Metadata Section */}
                  <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/60 mb-1 space-y-0.5" onClick={(e) => e.stopPropagation()}>
                    {rename.isRenaming && rename.canEditTitle ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={rename.renameInputRef as any}
                          type="text"
                          value={rename.renameValue}
                          onChange={(e) => rename.setRenameValue(e.target.value)}
                          onKeyDown={rename.handleRenameKeyDown}
                          onBlur={() => rename.setIsRenaming(false)}
                          className="flex-1 min-w-0 font-bold text-slate-800 dark:text-slate-100 text-xs.5 bg-transparent border-b border-indigo-500 outline-none w-full px-0 pb-0.5 focus:border-indigo-600"
                          autoFocus
                          disabled={rename.isSavingRename}
                        />
                        <button
                          onClick={rename.handleSaveRename}
                          disabled={rename.isSavingRename}
                          className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded text-emerald-600 dark:text-emerald-400 flex-shrink-0 flex items-center justify-center h-6 w-6"
                          title="Save"
                        >
                          {rename.isSavingRename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-1.5 min-w-0">
                        <span className="font-bold text-slate-800 dark:text-slate-100 text-xs.5 truncate flex-1" title={rename.chartTitle}>
                          {rename.chartTitle}
                        </span>
                        {rename.canEditTitle && (
                          <button 
                            onClick={() => rename.handleStartRename()} 
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-650 transition-colors flex-shrink-0" 
                            title="Rename"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium select-none leading-normal w-full">
                      {(() => {
                        const cfgW = parseDim(activeConfig?.width);
                        const cfgH = parseDim(activeConfig?.height);
                        
                        let w = 800;
                        let h = 600;
                        
                        if (editorMode === 'template') {
                          if (renderedFormat) {
                            w = renderedFormat.skeleton?.dimensions?.width || 800;
                            h = renderedFormat.skeleton?.dimensions?.height || 600;
                          } else {
                            const template = currentTemplate || templateInBackground;
                            if (template) {
                              w = template.width;
                              h = template.height;
                            }
                          }
                        } else {
                          w = cfgW || (originalCloudDimensions ? parseDim(originalCloudDimensions.width) : null) || 800;
                          h = cfgH || (originalCloudDimensions ? parseDim(originalCloudDimensions.height) : null) || 600;
                        }
                        
                        const aspect = getAspectRatio(w, h);
                        
                        const leftLabel = (editorMode === 'template' && currentTemplate)
                          ? `Template - ${currentTemplate.name || "Template"}`
                          : `Chart - ${getChartTypeName(chartType)}`;
                          
                        return (
                          <>
                            <span className="truncate flex-1 min-w-0 text-left" title={leftLabel}>
                              {leftLabel}
                            </span>
                            <span className="flex-shrink-0 text-right font-semibold tabular-nums text-slate-450 dark:text-slate-405">
                              {aspect} | {w}px × {h}px
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>

                  {/* 1. Real Segmented Mode Toggle (crisp text-[11px], transition-colors, antialiased to eliminate blurriness) */}
                  <div className="px-2.5 py-0.5 flex justify-center mb-0.5">
                    <div className="flex w-full bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const templateStore = useTemplateStore.getState();
                          templateStore.setGenerateMode('chart');
                          templateStore.setEditorMode('chart');
                        }} 
                        className={`flex-1 py-1 text-[11px] font-semibold rounded-full transition-colors text-center antialiased subpixel-antialiased ${
                          editorMode === 'chart' 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Chart
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const templateStore = useTemplateStore.getState();
                          templateStore.setGenerateMode('template');
                          if (!templateStore.currentTemplate) {
                            templateStore.applyTemplate('template-1');
                          }
                          templateStore.setEditorMode('template');
                        }} 
                        className={`flex-1 py-1 text-[11px] font-semibold rounded-full transition-colors text-center antialiased subpixel-antialiased ${
                          editorMode === 'template' 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        Template
                      </button>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800/80" />

                  {/* 2. Real Select Dropdown for Chart Types (Direct full-width style, no label/icon) */}
                  <div className="px-2.5 py-1">
                    <Select 
                      value={chartType} 
                      onValueChange={(val) => {
                        setChartType(val as any);
                      }}
                    >
                      <SelectTrigger className="h-9 w-full text-xs font-semibold border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-between px-3 shadow-xs transition-all active:scale-95 antialiased">
                        <div className="truncate text-slate-700 dark:text-slate-300">
                          <SelectValue placeholder="Select Chart Type" />
                        </div>
                      </SelectTrigger>
                      <SelectContent className="z-[110]">
                        {STANDARD_CHART_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-xs py-1.5">{type.label}</SelectItem>
                        ))}
                        <SelectSeparator />
                        {THREE_D_CHART_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value} className="text-xs py-1.5 font-medium text-blue-600 dark:text-blue-400">{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                   {/* 3. Dynamic Chart Gallery or Show Guides Trigger */}
                  {editorMode !== 'template' ? (
                    <DropdownMenuItem 
                      onClick={() => {
                        setMobileActiveTab('design');
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Chart Gallery</span>
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('triggerToggleGuides'));
                      }}
                      className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Show Guides</span>
                    </DropdownMenuItem>
                  )}

                  {/* 3.5 Fullscreen Trigger */}
                  <DropdownMenuItem 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('triggerFullscreen'));
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <Maximize2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Fullscreen</span>
                  </DropdownMenuItem>

                  {/* 4. Save Chart/Template to Cloud */}
                  <DropdownMenuItem 
                    onSelect={handleSaveToCloudClick}
                    className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <Cloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Save to Cloud</span>
                  </DropdownMenuItem>

                  {/* 4.5 Share Collapsible Accordion */}
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      if (!currentSnapshotId) {
                        toast.error("Please save your chart to the cloud first to share.");
                        return;
                      }
                      setShareExpanded(!shareExpanded);
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300 select-none active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Share</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${shareExpanded ? "transform rotate-180" : ""}`} />
                  </DropdownMenuItem>

                  {shareExpanded && currentSnapshotId && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                      <DropdownMenuItem 
                        onClick={handleCopyShareLink}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-755 dark:text-slate-355"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Copy Link</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleOpenShareLink}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-755 dark:text-slate-355"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Open Link</span>
                      </DropdownMenuItem>
                    </div>
                  )}

                  {/* 5. Export Collapsible Accordion (Toggles inline, avoids left-clipping, click-again closes) */}
                  <DropdownMenuItem 
                    onSelect={(e) => {
                      e.preventDefault();
                      setExportExpanded(!exportExpanded);
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300 select-none active:scale-98 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>Export</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${exportExpanded ? "transform rotate-180" : ""}`} />
                  </DropdownMenuItem>

                  {exportExpanded && (
                    <div className="pl-4 pr-1 py-1 space-y-0.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                      {editorMode === 'template' ? (
                        <>
                          <DropdownMenuItem 
                            onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'png' } }))}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <FileImage className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>PNG Image</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExportNew', { detail: { format: 'png' } }))}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <FileImage className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span>Image (New)</span>
                            <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">NEW</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'html' } }))}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Interactive HTML</span>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem 
                            onClick={exports.handleExport} 
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <FileImage className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>PNG Image</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExportNew', { detail: { format: 'png' } }))}
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <FileImage className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span>Image (New)</span>
                            <span className="ml-auto text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">NEW</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={exports.handleExportJPEG} 
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>JPEG Image</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={exports.handleExportHTML} 
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>Interactive HTML</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={exports.handleExportCSV} 
                            className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                          >
                            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                            <span>CSV Data</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </div>
                  )}

                  {/* 6. Reset / Clear Chart */}
                  <DropdownMenuItem 
                    onClick={() => {
                      if (window.confirm("Are you sure you want to clear the current workspace and chat?")) {
                        handleResetChart();
                        toast.success("Workspace cleared successfully");
                      }
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-450 rounded-lg text-xs font-medium cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span>Clear Workspace</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
          </div>
        </header>

        {/* Main Content Area - In-flow flex child positioned naturally below header */}
        <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden w-full bg-transparent">
          {/* Tab 1: Chart / Prompt */}
          {mobileActiveTab === 'chart' && (
            <div className="flex-1 p-3 flex flex-col relative w-full h-full">
              {(!storeHydrated || (!contentReady && hasJSON)) && (
                <div className="absolute inset-0 z-20 p-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm rounded-xl">
                  <ChartAreaSkeleton />
                </div>
              )}
              {chartData?.datasets?.length > 0 && hasJSON ? (
                <div className="flex-1 h-full w-full">
                  <ChartPreview
                    onToggleSidebar={() => { }}
                    isSidebarCollapsed={true}
                    onToggleLeftSidebar={() => { }}
                    isLeftSidebarCollapsed={true}
                  />
                </div>
              ) : storeHydrated ? (
                <PromptTemplate
                  size="compact"
                  onSampleClick={(template) => {
                    setInput(template);
                    sidebarContext.setChatInput(template);
                    setMobileActiveTab('chat');
                  }}
                  isTemplateModalOpen={isTemplateModalOpen}
                  setIsTemplateModalOpen={setIsTemplateModalOpen}
                />
              ) : null}
            </div>
          )}

          {/* Tab 2: AI Chat */}
          {mobileActiveTab === 'chat' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
              {messages.length === 0 ? (
                /* Gemini Hero Empty State */
                <div className="flex-1 overflow-y-auto w-full px-4 py-6 pb-28 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                  {/* Glowing 4-pointed Gemini Star */}
                  <div className="relative mb-5 flex items-center justify-center">
                    <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/25 to-pink-500/20 blur-xl animate-pulse pointer-events-none" />
                    <div className="relative w-14 h-14 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-indigo-500/5 flex items-center justify-center backdrop-blur-md">
                      <svg
                        className="w-8 h-8"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <defs>
                          <linearGradient id="geminiStarGradMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#38bdf8" />
                            <stop offset="35%" stopColor="#818cf8" />
                            <stop offset="70%" stopColor="#c084fc" />
                            <stop offset="100%" stopColor="#f472b6" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
                          fill="url(#geminiStarGradMobile)"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Personalized Greeting */}
                  <h1 className="text-xl xs:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1.5">
                    {userGreetingName ? (
                      <>
                        The mic is yours,{" "}
                        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                          {userGreetingName}
                        </span>
                      </>
                    ) : (
                      <>
                        Let's build a{" "}
                        <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                          chart
                        </span>
                      </>
                    )}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
                    Ask questions, visualize your data, or generate ready-to-present charts in seconds.
                  </p>

                  {/* Starter Prompt Chips */}
                  <div className="w-full flex flex-col gap-2 max-w-xs">
                    {[
                      { label: "Quarterly Revenue Growth", icon: LineChart, prompt: "Create a quarterly revenue growth line chart for 2024 with Q1 to Q4" },
                      { label: "Market Share Breakdown", icon: PieChart, prompt: "Create a market share breakdown donut chart for top 5 cloud providers" },
                      { label: "Customer Acquisition Funnel", icon: BarChart2, prompt: "Create a funnel chart of customer acquisition stages with conversion drop-offs" },
                    ].map((item, idx) => {
                      const Icon = item.icon
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setInput(item.prompt)
                            sidebarContext.setChatInput(item.prompt)
                            if (textareaRef.current) {
                              textareaRef.current.focus()
                            }
                          }}
                          className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all active:scale-[0.98] group"
                        >
                          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors flex-shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
                            {item.label}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : (
                /* Scrollable messages area - Full height container */
                <div className="flex-1 min-h-0 w-full h-full relative">
                  <ChatWindow
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    onSend={handleSend}
                    handleInputChange={handleInputChange}
                    handlePaste={handlePaste}
                    isProcessing={isProcessing}
                    hasActiveChart={hasActiveChart}
                    showActiveBanner={showActiveBanner}
                    setShowActiveBanner={setShowActiveBanner}
                    isChatDisabled={isChatDisabled}
                    disabledMessage="Type a message or load a template below to get started."
                    messagesEndRef={messagesEndRef}
                    textareaRef={textareaRef}
                    currentChartState={currentChartState}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Customize (ConfigSidebar) */}
          {mobileActiveTab === 'design' && (
            <div className="flex-1 h-full w-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 pb-4">
              {chartData?.datasets?.length > 0 && hasJSON ? (
                <ConfigSidebar />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-650 mb-4 border border-slate-200/60 dark:border-slate-850 shadow-sm">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Customize Design</h3>
                  <p className="text-[11px] xs:text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                    Once a chart is generated with AI Chat, you can use this tab to modify slices, toggles, colors, and design templates.
                  </p>
                  <Button
                    onClick={() => setMobileActiveTab('chat')}
                    className="mt-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 hover:scale-102 transition-all text-white text-xs font-semibold rounded-xl px-4 py-2"
                  >
                    Go to AI Chat
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: History (HistoryDropdown) */}
          {mobileActiveTab === 'history' && (
            <div className="flex-1 h-full w-full overflow-y-auto bg-white dark:bg-slate-950">
              <div className="p-1">
                <HistoryDropdown 
                  variant="sidebar" 
                  onConversationRestored={() => {
                    setMobileActiveTab('chart');
                    setSandwichOpen(false);
                  }}
                />
              </div>
            </div>
          )}
        </main>

        {/* Subtle gradient backdrop fade behind floating pill so messages fade out smoothly */}
        {mobileActiveTab === 'chat' && (
          <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-slate-950 dark:via-slate-950/85 dark:to-transparent pointer-events-none z-30" />
        )}

        {/* Floating Bottom Capsule Input Pill - True floating bar */}
        {mobileActiveTab === 'chat' && (
          <div className="fixed bottom-3.5 left-3.5 right-3.5 z-40 max-w-lg mx-auto">
            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/30 transition-shadow"
            >
              {/* Plus Button for Action Sheet */}
              <button
                type="button"
                onClick={() => setIsActionSheetOpen(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex-shrink-0 active:scale-95"
                title="Tools & Settings"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
              </button>

              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onPaste={handlePaste}
                rows={1}
                placeholder={
                  isChatDisabled
                    ? "Attach a template to start..."
                    : hasActiveChart
                    ? "Modify (colors, title, data)..."
                    : "Ask Chartography..."
                }
                disabled={isProcessing || isChatDisabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault()
                    if (!isChatDisabled && input.trim()) {
                      handleSend(e)
                    }
                  }
                }}
                className="flex-1 bg-transparent py-2 px-1 text-xs xs:text-sm focus:outline-none resize-none max-h-[100px] min-h-[36px] leading-relaxed text-slate-850 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
              />

              {/* Send / Action Button */}
              <button
                type="submit"
                disabled={isProcessing || !input.trim() || isChatDisabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${
                  input.trim() && !isProcessing && !isChatDisabled
                    ? "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-350 dark:text-slate-650 cursor-not-allowed"
                }`}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                ) : (
                  <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                )}
              </button>
            </form>
          </div>
        )}

        {/* Floating Quick Switch Pill when viewing chart */}
        {mobileActiveTab === 'chart' && chartData?.datasets?.length > 0 && hasJSON && (
          <div className="fixed bottom-4 right-4 z-40">
            <button
              type="button"
              onClick={() => {
                setMobileActiveTab('chat')
                setTimeout(() => textareaRef.current?.focus(), 100)
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/25 active:scale-95 transition-all text-xs font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modify with AI</span>
            </button>
          </div>
        )}

        {/* Action Sheet Backdrop */}
        {isActionSheetOpen && (
          <div
            className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
            onClick={() => setIsActionSheetOpen(false)}
          />
        )}

        {/* Action Sheet Modal / Bottom Sheet */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-[85] max-w-lg mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-xl shadow-xl p-3.5 pb-safe transition-transform duration-200 ease-out transform ${
            isActionSheetOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-tight">
              Tools & Preferences
            </span>
            <button
              type="button"
              onClick={() => setIsActionSheetOpen(false)}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Options List */}
          <div className="space-y-2">
            {/* AI Model Dropdown Row */}
            <div className="flex items-center justify-between py-2 px-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">AI Model</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Select model engine</span>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs cursor-pointer"
                  >
                    <span className="max-w-[115px] truncate">
                      {selectedModel === 'gemini-search'
                        ? 'Gemini Realtime'
                        : selectedModel === 'deepseek-search'
                        ? 'Deepseek Realtime'
                        : 'DeepSeek Chat'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg p-1 z-[120]">
                  <DropdownMenuItem
                    onClick={() => setSelectedModel('gemini-search')}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Gemini Realtime</div>
                      <div className="text-[10px] text-slate-400">Live search & multimodal</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedModel('deepseek-search')}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">Deepseek Realtime</div>
                      <div className="text-[10px] text-slate-400">Web search enabled</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSelectedModel('deepseek')}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                  >
                    <Brain className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                    <div>
                      <div className="font-semibold">DeepSeek Chat</div>
                      <div className="text-[10px] text-slate-400">Standard fast reasoning</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Auto-enrich with images toggle */}
            <div className="flex items-center justify-between py-2 px-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Include Web Images</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Auto-enrich charts with logos and icons</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIncludeImages(!includeImages)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                  includeImages ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    includeImages ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Sandwich Backdrop overlay */}
        {sandwichOpen && (
          <div 
            className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
            onClick={() => setSandwichOpen(false)}
          />
        )}

        {/* Sandwich Drawer Window */}
        <div 
          className={`fixed top-0 bottom-0 left-0 z-[100] w-[85vw] max-w-[360px] bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col shadow-2xl transition-transform duration-150 ease-out transform ${
            sandwichOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-850 flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Chartography.in</span>
            </div>
            <button 
              onClick={() => setSandwichOpen(false)}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Drawer Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Navigation Options */}
            <div className="space-y-2">
              {/* Active Preview */}
              <button
                onClick={() => {
                  setMobileActiveTab('chart');
                  setSandwichOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                  mobileActiveTab === 'chart'
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-semibold border-indigo-100/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <BarChart2 className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-xs xs:text-sm">Active Preview</span>
              </button>

              {/* AI Copilot Chat */}
              <button
                onClick={() => {
                  setMobileActiveTab('chat');
                  setSandwichOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                  mobileActiveTab === 'chat'
                    ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-650 dark:text-indigo-400 font-semibold border-indigo-100/30'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <MessageCircleDashed className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-xs xs:text-sm">AI Conversation</span>
              </button>

              {/* New Chat */}
              <button
                onClick={() => {
                  handleNewConversation();
                  setMobileActiveTab('chat');
                  setSandwichOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-left transition-all active:scale-98 text-slate-700 dark:text-slate-300"
              >
                <SquarePen className="w-5 h-5 text-slate-550 dark:text-slate-400 flex-shrink-0" />
                <span className="font-bold text-xs xs:text-sm">New Chat</span>
              </button>

              {/* History */}
              <button
                onClick={() => {
                  setMobileActiveTab('history');
                  setSandwichOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                  mobileActiveTab === 'history'
                    ? 'bg-slate-100/80 dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <History className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-xs xs:text-sm">History</span>
              </button>

              {/* Customize Tools */}
              <button
                onClick={() => {
                  setMobileActiveTab('design');
                  setSandwichOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                  mobileActiveTab === 'design'
                    ? 'bg-slate-100/80 dark:bg-slate-900 text-indigo-650 dark:text-indigo-400 font-semibold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <ToolCase className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-xs xs:text-sm">Customize Tools</span>
              </button>

              {/* Board */}
              <button
                onClick={() => {
                  router.push('/board');
                  setSandwichOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-left transition-all active:scale-98 text-slate-700 dark:text-slate-300"
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-xs xs:text-sm">Board</span>
              </button>

              {/* Advanced Editor */}
              <button
                onClick={() => {
                  router.push('/editor');
                  setSandwichOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-left transition-all active:scale-98 text-slate-700 dark:text-slate-300"
              >
                <Edit3 className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="font-bold text-xs xs:text-sm">Advanced Editor</span>
              </button>
            </div>
          </div>

          {/* Profile Footer - Always Fixed at Bottom */}
          <div className="border-t border-slate-100 dark:border-slate-850 p-4 bg-white dark:bg-slate-950 flex-shrink-0">
            <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800">
              <div className="flex items-center gap-2.5 min-w-0">
                <SimpleProfileDropdown size="sm" />
                <span className="block font-semibold text-slate-700 dark:text-slate-200 text-xs truncate">{user?.email || 'Guest Session'}</span>
              </div>
            </div>
          </div>
        </div>
        {/* Save Dialog Popup for Mobile Viewport */}
        <SaveChartDialog
          open={showSaveChartDialog}
          defaultName={saveChartDialogName}
          isUpdate={isUpdate}
          isSaving={isSaving}
          onSave={handleSaveChart}
          onCancel={() => setShowSaveChartDialog(false)}
        />

        {/* Upgrade Pro Dialog for Mobile Viewport */}
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

  // Desktop Layout (default)
  // The sidebar and background are rendered by layout.tsx (App Shell Architecture).
  // This page only renders the content area, directly into the layout's flex-1 container.
  return (
    <>
      {/* Floating global header for history and avatar, only when no chart is created and no template modal is open - Desktop only */}
      {storeHydrated && (!chartData?.datasets?.length || !hasJSON) && !isTablet && !isMobile && !isTemplateModalOpen && !isGalleryOpen && (
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

      {/* Real content: renders behind the skeleton, becomes visible when contentReady=true */}
      {isGalleryOpen ? (
        <FormatGallery
          leftSidebarOpen={leftSidebarOpen}
          setLeftSidebarOpen={setLeftSidebarOpen}
        />
      ) : isStyleGalleryOpen ? (
        <ChartStyleGalleryPage />
      ) : chartData?.datasets?.length > 0 && hasJSON ? (
        <ChartLayout
          leftSidebarOpen={leftSidebarOpen}
          setLeftSidebarOpen={setLeftSidebarOpen}
        />
      ) : (
        <PromptTemplate
          size="large"
          className="p-12"
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

/** Skeleton placeholder for the chart + right sidebar area while store hydrates */
function ChartAreaSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center h-full relative z-10 bg-transparent">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin shadow-lg"></div>
          {/* Inner pulsing core */}
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
            Preparing Workspace
          </span>
          <span className="text-xs text-gray-400 mt-1">Loading your context...</span>
        </div>
      </div>
    </div>
  )
}

function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px]"></div>
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[100px]"></div>
      <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/15 blur-[100px]"></div>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>
    </div>
  )
} 