"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"

import { useRouter } from "next/navigation"
import { Send, BarChart2, Plus, SquarePen, PencilRuler, RotateCcw, Edit3, MessageSquare, Sparkles, ArrowRight, X, ChevronLeft, ChevronRight, PanelLeft, PanelRight, Settings, Brain, Info, LayoutDashboard } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { dataService } from "@/lib/data-service"
import { ChartLayout } from "@/components/chart-layout"
import { ChartPreview } from "@/components/chart-preview"
import { useHistoryStore } from "@/lib/history-store"
import { useTemplateStore } from "@/lib/template-store"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth/AuthProvider"
import { HistoryDropdown } from "@/components/history-dropdown"
import { UndoRedoButtons } from "@/components/ui/undo-redo-buttons"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"

import { clearStoreData } from "@/lib/utils"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel";
import { Chart } from "react-chartjs-2"
import { PromptTemplate, chartTemplate, ChatWindow } from "@/components/landing"
import { ConfigSidebar } from "@/components/config-sidebar"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { toast } from "sonner"

export default function LandingPage() {
  return (
    <ProtectedRoute>
      <LandingPageContent />
    </ProtectedRoute>
  )
}

function LandingPageContent() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { chartConfig, chartData, chartType, setFullChart, resetChart, hasJSON, setHasJSON } = useChartStore()
  const {
    messages,
    currentChartState,
    isProcessing,
    continueConversation,
    startNewConversation,
    clearMessages,
    setMessages,
    backendConversationId
  } = useChatStore()

  const { addConversation, loadConversationsFromBackend, restoreConversation } = useHistoryStore()
  const { generateMode, currentTemplate, syncTemplatesFromCloud } = useTemplateStore()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const hasRestoredRef = useRef(false)
  const lastSyncedChartStateRef = useRef<string | null>(null)

  // If chart store has data but currentChartState is null, try to restore from chart store
  // Use a ref to prevent infinite loops
  useEffect(() => {
    if (hasJSON && chartData && !currentChartState && !hasRestoredRef.current) {
      hasRestoredRef.current = true
      const chatStore = useChatStore.getState()
      if (chatStore.updateChartState) {
        chatStore.updateChartState({
          chartType: chartType as any,
          chartData: chartData as any,
          chartConfig: chartConfig as any
        })
      }
    }
    // Reset ref when currentChartState becomes available
    if (currentChartState) {
      hasRestoredRef.current = false
    }
  }, [hasJSON, chartType, chartData, currentChartState, chartConfig])

  // Check if chat should be disabled (template mode but no template attached)
  const isChatDisabled = generateMode === 'template' && !currentTemplate

  // Update initial message when template mode changes
  useEffect(() => {
    // Only update if we have just the initial message
    if (messages.length === 1 && messages[0].role === 'assistant') {
      const templateMessage = 'Please attach a template to start the conversation. Select a template from the options via "Choose From Templates".';
      const defaultMessage = 'Hi! Describe the chart you want to create, or ask me to modify an existing chart.';

      const shouldShowTemplateMessage = generateMode === 'template' && !currentTemplate;
      const currentMessage = messages[0].content;

      if (shouldShowTemplateMessage && currentMessage !== templateMessage) {
        setMessages([{
          ...messages[0],
          content: templateMessage
        }]);
      } else if (!shouldShowTemplateMessage && currentMessage === templateMessage) {
        setMessages([{
          ...messages[0],
          content: defaultMessage
        }]);
      }
    }
  }, [generateMode, currentTemplate, messages, setMessages])
  const [showActiveBanner, setShowActiveBanner] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  const [hasLoadedBackendData, setHasLoadedBackendData] = useState(false)

  // Custom hook for tablet detection (577px-1024px)
  const [isTablet, setIsTablet] = useState(false)
  // Custom hook for mobile detection (<576px)
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Immediate synchronous detection before any render
    const width = window.innerWidth
    const tabletSize = width >= 577 && width <= 1024
    const mobileSize = width < 576

    // Set states synchronously first
    setIsClient(true)
    setIsTablet(tabletSize)
    setIsMobile(mobileSize)

    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsTablet(width >= 577 && width <= 1024)
      setIsMobile(width < 576)
    }

    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isProcessing || isChatDisabled) return

    const userInput = input.trim()
    setInput("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "36px"
    }

    await continueConversation(userInput)

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }, [input, isProcessing, continueConversation, isChatDisabled])

  const handleTemplateClick = useCallback(() => {
    setInput(chartTemplate)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.style.height = "36px"
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, 0)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    // Optimized height update with debouncing
    if (textareaRef.current) {
      // Clear any existing timeout
      if (textareaRef.current.dataset.resizeTimeout) {
        clearTimeout(Number(textareaRef.current.dataset.resizeTimeout))
      }

      const updateHeight = () => {
        if (textareaRef.current) {
          if (e.target.value === "") {
            textareaRef.current.style.height = "36px"
            textareaRef.current.style.overflowY = "hidden"
          } else {
            textareaRef.current.style.height = "36px"
            const maxHeight = 100
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
            textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden"
          }
        }
      }

      // Debounce the height update to reduce performance impact
      const timeoutId = setTimeout(updateHeight, 16) // ~60fps
      textareaRef.current.dataset.resizeTimeout = timeoutId.toString()
    }
  }, [])

  // Handle paste events specifically to ensure proper height update
  const handlePaste = useCallback(() => {
    // Single timeout for paste operations to reduce performance impact
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "36px"
        const maxHeight = 80
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden"
      }
    }, 10)
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Sync currentChartState from chat store to chart store when it changes
  useEffect(() => {
    if (currentChartState) {
      // Create a hash of the chart state to detect actual changes
      const chartStateHash = JSON.stringify({
        type: currentChartState.chartType,
        dataHash: JSON.stringify(currentChartState.chartData?.datasets?.[0]?.data || []),
        configHash: JSON.stringify(currentChartState.chartConfig?.plugins || {})
      })

      // Only sync if this is a different chart state to prevent infinite loops
      if (lastSyncedChartStateRef.current !== chartStateHash) {
        lastSyncedChartStateRef.current = chartStateHash

        // Skip calling setFullChart if datasets already have groupIds assigned
        // This means the data came from restoreConversation which already called setFullChart
        const datasetsHaveGroupIds = currentChartState.chartData?.datasets?.some(
          (ds: any) => ds.groupId
        );

        if (!datasetsHaveGroupIds) {
          setFullChart({
            chartType: currentChartState.chartType,
            chartData: currentChartState.chartData,
            chartConfig: currentChartState.chartConfig
          })
        }
        setHasJSON(true)
      }
    } else {
      // Reset ref when currentChartState is cleared
      lastSyncedChartStateRef.current = null
    }
  }, [currentChartState, setFullChart, setHasJSON])

  const hasActiveChart = currentChartState !== null && hasJSON

  useEffect(() => {
    // When a new chart is received, show the banner only if it hasn't been shown before
    if (hasActiveChart) {
      // Check if banner has been shown for this chart session
      const chartDataHash = JSON.stringify(currentChartState?.chartData?.datasets?.[0]?.data || [])
      const bannerShownKey = `chartBannerShown_${currentChartState?.chartType}_${chartDataHash}`
      const hasBannerBeenShown = sessionStorage.getItem(bannerShownKey)

      if (!hasBannerBeenShown) {
        setShowActiveBanner(true)
        // Mark this banner as shown for this chart session with timestamp
        sessionStorage.setItem(bannerShownKey, 'true')
        sessionStorage.setItem(bannerShownKey + '_timestamp', Date.now().toString())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveChart, currentChartState])

  // Auto-hide banner after 8 seconds if not manually closed
  useEffect(() => {
    if (showActiveBanner && hasActiveChart) {
      const timer = setTimeout(() => {
        setShowActiveBanner(false)
        // Mark this banner as shown when auto-hidden
        if (currentChartState) {
          const chartDataHash = JSON.stringify(currentChartState.chartData?.datasets?.[0]?.data || [])
          const bannerShownKey = `chartBannerShown_${currentChartState.chartType}_${chartDataHash}`
          sessionStorage.setItem(bannerShownKey, 'true')
          sessionStorage.setItem(bannerShownKey + '_timestamp', Date.now().toString())
        }
      }, 8000) // 8 seconds

      return () => clearTimeout(timer)
    }
  }, [showActiveBanner, hasActiveChart, currentChartState])

  // Clean up old banner flags when component unmounts or chart changes significantly
  useEffect(() => {
    const cleanupOldBannerFlags = () => {
      const currentTime = Date.now()
      const maxAge = 24 * 60 * 60 * 1000 // 24 hours

      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('chartBannerShown_')) {
          try {
            const timestamp = sessionStorage.getItem(key + '_timestamp')
            if (timestamp && (currentTime - parseInt(timestamp)) > maxAge) {
              sessionStorage.removeItem(key)
              sessionStorage.removeItem(key + '_timestamp')
            }
          } catch (error) {
            // If there's an error, remove the key anyway
            sessionStorage.removeItem(key)
            sessionStorage.removeItem(key + '_timestamp')
          }
        }
      })
    }

    // Clean up on mount and when chart changes
    cleanupOldBannerFlags()

    // Set up interval to clean up old flags
    const interval = setInterval(cleanupOldBannerFlags, 60 * 60 * 1000) // Every hour

    return () => clearInterval(interval)
  }, [currentChartState])

  // Handle migration errors by clearing localStorage
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.error?.message?.includes('migrate')) {
        console.warn('Migration error detected, clearing store data...')
        clearStoreData()
        window.location.reload()
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // Show loading until client-side hydration
  if (!isClient) {
    return (
      <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Tablet Layout (577px - 1024px)
  if (isTablet) {
    return (
      <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-lg">
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
              <SimpleProfileDropdown size="md" />
            </div>
          </div>
        </header>

        {/* Left Icon Sidebar */}
        <aside className="fixed left-0 top-16 bottom-0 w-16 bg-white/90 backdrop-blur-xl border-r border-white/20 shadow-lg z-30 flex flex-col items-center py-4 space-y-4">

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
          <SimpleProfileDropdown size="md" />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-16 mt-16 relative flex flex-col">
          {/* Main Chart Area */}
          <div className="flex-1 p-4 flex flex-col">
            {chartData?.datasets?.length > 0 && hasJSON ? (
              <div className="flex-1 h-full">
                <ChartPreview
                  onToggleSidebar={() => { }}
                  isSidebarCollapsed={true}
                  onToggleLeftSidebar={() => { }}
                  isLeftSidebarCollapsed={true}
                />
              </div>
            ) : (
              <PromptTemplate
                size="default"
                onSampleClick={(template) => {
                  setInput(template);
                  setTabletRightSidebarContent('messages');
                  setTabletRightSidebarOpen(true);
                }}
              />
            )}
          </div>
        </main>

        {/* Overlaying Right Sidebar */}
        {tabletRightSidebarOpen && (
          <div className="fixed inset-0 z-50">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={closeTabletSidebar}
            />

            {/* Sidebar */}
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl border-l border-white/20 transform transition-transform duration-300 flex flex-col">
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
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all relative"
                          title="Dashboard"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Board</span>
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-700 bg-white rounded-md shadow-sm transition-all relative"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>AI Chat</span>
                          <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"></div>
                        </button>
                        <button
                          onClick={() => router.push('/editor')}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all relative"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editor</span>
                        </button>
                      </div>
                    </div>
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
                  <div className="p-4">
                    <HistoryDropdown />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Mobile Layout (< 576px)
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-xl border-b border-white/30 shadow-lg">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left: App Logo */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg">
                <BarChart2 className="h-5 w-5 text-white" />
              </div>
            </div>

            {/* Center: Main Title */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent tracking-wide text-center">
                AI Charts
              </h1>
            </div>

            {/* Right: Profile */}
            <div className="flex items-center gap-2 min-w-0">
              <SimpleProfileDropdown size="sm" />
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 mt-14 mb-16 relative flex flex-col overflow-hidden">
          {/* Chart/Template Area */}
          <div className="flex-1 p-3 flex flex-col">
            {chartData?.datasets?.length > 0 && hasJSON ? (
              <div className="flex-1 h-full">
                <ChartPreview
                  onToggleSidebar={() => { }}
                  isSidebarCollapsed={true}
                  onToggleLeftSidebar={() => { }}
                  isLeftSidebarCollapsed={true}
                />
              </div>
            ) : (
              <PromptTemplate
                size="compact"
                onSampleClick={(template) => {
                  setInput(template);
                  setMobileRightSidebarContent('messages');
                  setMobileRightSidebarOpen(true);
                }}
              />
            )}
          </div>
        </main>

        {/* Bottom Navigation Bar */}
        <nav className="fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 backdrop-blur-xl border-t border-white/30 shadow-lg">
          <div className="flex items-center justify-around h-full px-2">

            {/* New Chat Icon */}
            <button
              onClick={() => {
                handleNewConversation();
                // Auto-open messages sidebar for new chat
                setMobileRightSidebarContent('messages');
                setMobileRightSidebarOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600 min-w-0"
              title="New Chat"
            >
              <SquarePen className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">New</span>
            </button>

            {/* Messages Icon */}
            <button
              onClick={() => handleMobileIconClick('messages')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${mobileRightSidebarContent === 'messages' && mobileRightSidebarOpen
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              title="Messages"
            >
              <MessageSquare className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Chat</span>
            </button>

            {/* Tools Icon */}
            <button
              onClick={() => handleMobileIconClick('tools')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${mobileRightSidebarContent === 'tools' && mobileRightSidebarOpen
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              title="Tools"
            >
              <Settings className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Tools</span>
            </button>

            {/* History Icon */}
            <button
              onClick={() => handleMobileIconClick('history')}
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${mobileRightSidebarContent === 'history' && mobileRightSidebarOpen
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                }`}
              title="History"
            >
              <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-medium">History</span>
            </button>

            {/* Profile Icon */}
            <div className="flex flex-col items-center justify-center p-2 min-w-0">
              <SimpleProfileDropdown size="md" variant="avatar" className="mb-1" />
              <span className="text-xs font-medium text-gray-600">Profile</span>
            </div>

          </div>
        </nav>

        {/* Right Overlay Sidebar for Mobile */}
        {mobileRightSidebarOpen && (
          <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" onClick={closeMobileSidebar}>
            <div
              className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white/95 backdrop-blur-xl shadow-2xl border-l border-white/30 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/20">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {mobileRightSidebarContent}
                </h2>
                <button
                  onClick={closeMobileSidebar}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sidebar Content */}
              <div className="flex-1 overflow-hidden">
                {mobileRightSidebarContent === 'messages' && (
                  <>
                    {/* Navigation Section - Mobile */}
                    <div className="p-3 bg-white/95 flex-shrink-0">
                      <div className="flex items-center gap-0 bg-gray-50 rounded-lg p-1">
                        <button
                          onClick={() => router.push('/board')}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all relative"
                          title="Dashboard"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>Board</span>
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-700 bg-white rounded-md shadow-sm transition-all relative"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>AI Chat</span>
                          <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"></div>
                        </button>
                        <button
                          onClick={() => router.push('/editor')}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all relative"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Editor</span>
                        </button>
                      </div>
                    </div>
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
                      disabledMessage="Please attach a template to start the conversation."
                      messagesEndRef={messagesEndRef}
                      textareaRef={textareaRef}
                      currentChartState={currentChartState}
                    />
                  </>
                )}

                {mobileRightSidebarContent === 'tools' && (
                  <div className="h-full">
                    <ConfigSidebar />
                  </div>
                )}

                {mobileRightSidebarContent === 'history' && (
                  <div className="p-4">
                    <HistoryDropdown variant="full" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Desktop Layout (default)
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating global header for history and avatar, only when no chart is created - Desktop only */}
      {(!chartData?.datasets?.length || !hasJSON) && !isTablet && !isMobile && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">

          <HistoryDropdown variant="full" />
          <SimpleProfileDropdown size="md" />
        </div>
      )}
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(156,146,172,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      {/* Left Sidebar / Chat */}
      <aside className={`transition-all duration-300 z-10 flex flex-col border-r border-white/20 shadow-2xl bg-white/90 backdrop-blur-xl ${leftSidebarOpen ? 'w-[320px]' : 'w-16'} rounded-tl-2xl rounded-bl-2xl`}>
        {leftSidebarOpen ? (
          <>
            {/* Navigation Section */}
            <div className="p-2 bg-white/95">
              <div className="flex items-center gap-0 bg-gray-50 rounded-lg p-1">
                <button
                  onClick={() => router.push('/board')}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all relative"
                  title="Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
                <button
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold text-indigo-700 bg-white rounded-md shadow-sm transition-all relative"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"></div>
                </button>
                <button
                  onClick={() => router.push('/editor')}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all relative"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/')}
                  className="p-1 bg-white/20 hover:bg-white/30 rounded-lg backdrop-blur-sm transition-colors"
                  aria-label="Home"
                >
                  <BarChart2 className="w-5 h-5 text-white" />
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 text-xs border border-white/20 flex items-center gap-1 hover:scale-105"
                  onClick={handleNewConversation}
                  title="New Conversation"
                >
                  <SquarePen className="w-3.5 h-3.5" />
                </button>
                <button
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 text-xs border border-white/20 hover:scale-105"
                  onClick={() => setLeftSidebarOpen(false)}
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-2 border-t border-white/20 bg-gradient-to-br from-blue/90 to-blue-50/90 flex gap-2 shadow-inner backdrop-blur-sm flex-shrink-0"
            >
              <textarea
                ref={textareaRef}
                className="flex-1 rounded-lg border border-slate-200/100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 resize-none max-h-24 min-h-[40px] leading-relaxed transition-colors font-sans shadow-sm backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder={isChatDisabled ? "Attach a template to start..." : (hasActiveChart ? "Modify the chart..." : "Describe your chart...")}
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
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg shadow-lg disabled:opacity-50 transition-all duration-200 transform hover:scale-105 focus:scale-105 disabled:hover:scale-100"
                disabled={isProcessing || !input.trim() || isChatDisabled}
                style={{ alignSelf: "flex-end", height: 40 }}
              >
                <Send className="inline-block w-4 h-4" />
              </button>
            </form>

            {/* Messages */}
            <div className="lex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gradient-to-b from-white/80 to-slate-50/80 font-sans">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl px-4 py-3 max-w-[90%] whitespace-pre-wrap break-words shadow-lg font-medium text-sm ${msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white self-end ml-auto border border-indigo-400/30 shadow-indigo-500/25"
                    : "bg-gradient-to-br from-white to-slate-50 text-slate-800 self-start mr-auto border border-slate-200/50 shadow-slate-500/10"
                    }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  <div className="flex items-start gap-3">
                    {msg.role === 'assistant' && (
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="p-1.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                          <Brain className="w-4 h-4 text-blue-600" />
                        </div>
                        {msg.chartSnapshot && (
                          <div className="relative group">
                            <Info className="w-3 h-3 text-blue-400 hover:text-blue-600 cursor-help transition-colors" />
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                              <div className="space-y-1">
                                {msg.chartSnapshot && (
                                  <div className="flex items-center gap-1">
                                    <Edit3 className="w-3 h-3" />
                                    <span>Chart {msg.action === 'create' ? 'created' : 'updated'}</span>
                                    {msg.changes && msg.changes.length > 0 && (
                                      <span>• {msg.changes.length} change{msg.changes.length > 1 ? 's' : ''}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              {/* Arrow */}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex-1 text-sm">
                      {msg.content}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="bg-gradient-to-br from-white to-slate-50 text-slate-800 self-start mr-auto border border-slate-200/50 rounded-2xl px-4 py-3 max-w-[90%] shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                    <span className="text-sm font-medium">Processing your request...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Conversation Status Banner - Now at bottom */}
            {hasActiveChart && showActiveBanner && (
              <div className="relative px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-200/50 flex-shrink-0">
                <button
                  className="absolute top-2 right-2 p-1 rounded hover:bg-emerald-100 transition-colors"
                  onClick={() => {
                    setShowActiveBanner(false)
                    // Mark this banner as shown for the current chart session
                    if (hasActiveChart && currentChartState) {
                      const chartDataHash = JSON.stringify(currentChartState.chartData?.datasets?.[0]?.data || [])
                      const bannerShownKey = `chartBannerShown_${currentChartState.chartType}_${chartDataHash}`
                      sessionStorage.setItem(bannerShownKey, 'true')
                      sessionStorage.setItem(bannerShownKey + '_timestamp', Date.now().toString())
                    }
                  }}
                  aria-label="Close banner"
                >
                  <X className="w-4 h-4 text-emerald-700" />
                </button>
                <div className="flex items-center gap-3 text-sm text-emerald-800">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-semibold">Active Chart Conversation</span>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Ask me to modify your chart!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          // Collapsed Sidebar - Icon Only
          <div className="flex flex-col items-center h-full py-4 space-y-4 group">
            {/* Application Logo - Always shows logo, routes to home */}
            <button
              onClick={() => router.push("/")}
              className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-md"
              title="Go to Home"
            >
              <BarChart2 className="w-6 h-6 text-white" />
            </button>

            {/* Expand Sidebar Icon - Separate ChevronRight icon */}
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-500 hover:text-blue-600 hover:shadow-md hover:scale-105"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* New Chat Icon */}
            <button
              onClick={() => {
                handleNewConversation();
                setLeftSidebarOpen(true);
              }}
              className="p-2 rounded-lg hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600"
              title="New Chat"
            >
              <SquarePen className="w-5 h-5" />
            </button>

            {/* Message Icon - Show current chat */}
            <button
              onClick={() => {
                if (hasActiveChart) {
                  setLeftSidebarOpen(true);
                }
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${hasActiveChart
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              title={hasActiveChart ? "Current Chat" : "No active chat"}
              disabled={!hasActiveChart}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {/* History Icon */}
            <button
              onClick={() => {
                // This will trigger the history dropdown
                const historyButton = document.querySelector('[data-history-dropdown]') as HTMLButtonElement;
                if (historyButton) {
                  historyButton.click();
                }
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800"
              title="Chat History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        )}
      </aside>
      {/* Main Content Area */}
      <div className="flex-1 relative z-10">
        {chartData?.datasets?.length > 0 && hasJSON ? (
          <ChartLayout
            leftSidebarOpen={leftSidebarOpen}
            setLeftSidebarOpen={setLeftSidebarOpen}
          />
        ) : (
          <PromptTemplate
            size="large"
            className="p-12"
            onSampleClick={handleTemplateClick}
          />
        )}
      </div>
    </div>
  )
} 