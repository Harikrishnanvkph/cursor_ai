"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Send, BarChart2, Plus, SquarePen ,PencilRuler ,RotateCcw, Edit3, MessageSquare, Sparkles, ArrowRight, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, PanelLeft, PanelRight, Settings, User } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { ChartLayout } from "@/components/chart-layout"
import { ChartPreview } from "@/components/chart-preview"
import { useHistoryStore } from "@/lib/history-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HistoryDropdown } from "@/components/history-dropdown"
import { clearStoreData } from "@/lib/utils"
import { ResponsiveAnimationsPanel } from "@/components/panels/responsive-animations-panel";
import { Chart } from "react-chartjs-2"
import { PromptTemplate, chartTemplate, ChatWindow } from "@/components/landing"
import { ConfigSidebar } from "@/components/config-sidebar"

const modificationExamples = [
  "Make the bars red",
  "Add a title",
  "Show only the top 3 items",
  "Change to a pie chart",
  "Make the bars thicker"
]

export default function LandingPage() {
  const router = useRouter()
  const { chartConfig, chartData, chartType, setFullChart, resetChart, hasJSON, setHasJSON } = useChartStore()
  const { 
    messages, 
    currentChartState,
    isProcessing,
    continueConversation,
    startNewConversation,
    clearMessages
  } = useChatStore()
  const { addConversation } = useHistoryStore()
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [showActiveBanner, setShowActiveBanner] = useState(true)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)
  
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
  
  // Tablet-specific states
  const [tabletRightSidebarOpen, setTabletRightSidebarOpen] = useState(false)
  const [tabletRightSidebarContent, setTabletRightSidebarContent] = useState<'messages' | 'tools' | 'history' | null>(null)

  // Mobile-specific states (reuse tablet sidebar logic but different positioning)
  const [mobileRightSidebarOpen, setMobileRightSidebarOpen] = useState(false)
  const [mobileRightSidebarContent, setMobileRightSidebarContent] = useState<'messages' | 'tools' | 'history' | null>(null)

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userInput = input.trim()
    setInput("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "36px"
    }

    await continueConversation(userInput)

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }, [input, isProcessing, continueConversation])

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
            const maxHeight = 80
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
  }, [startNewConversation])

  const handleResetChart = useCallback(() => {
    clearMessages()
    resetChart()
    setHasJSON(false)
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

  const hasActiveChart = currentChartState !== null && hasJSON

  useEffect(() => {
    // When a new chart is received, show the banner and expand suggestions
    if (hasActiveChart) {
      setShowActiveBanner(true)
      setSuggestionsOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveChart])

  // Auto-hide banner after 8 seconds if not manually closed
  useEffect(() => {
    if (showActiveBanner && hasActiveChart) {
      const timer = setTimeout(() => {
        setShowActiveBanner(false)
      }, 8000) // 8 seconds

      return () => clearTimeout(timer)
    }
  }, [showActiveBanner, hasActiveChart])

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
            
            {/* Right: Advanced Editor Button */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push("/editor")}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <PencilRuler className="w-4 h-4" />
                <span className="hidden sm:inline">Advanced Editor</span>
                <span className="sm:hidden">ADV Editor</span>
              </button>
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
          <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-100 border-2 border-blue-200">
            <User className="h-5 w-5 text-blue-600" />
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-16 mt-16 relative flex flex-col">
          {/* Main Chart Area */}
          <div className="flex-1 p-4 flex flex-col">
            {chartData?.datasets?.length > 0 && hasJSON ? (
              <div className="flex-1 h-full">
                <ChartPreview 
                  onToggleSidebar={() => {}} 
                  isSidebarCollapsed={true}
                  onToggleLeftSidebar={() => {}}
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
                   <ChatWindow
                     messages={messages}
                     input={input}
                     setInput={setInput}
                     onSend={handleSend}
                     isProcessing={isProcessing}
                     hasActiveChart={hasActiveChart}
                     showActiveBanner={showActiveBanner}
                     setShowActiveBanner={setShowActiveBanner}
                     suggestionsOpen={suggestionsOpen}
                     setSuggestionsOpen={setSuggestionsOpen}
                     modificationExamples={modificationExamples}
                     messagesEndRef={messagesEndRef}
                     textareaRef={textareaRef}
                     handleInputChange={handleInputChange}
                     handlePaste={handlePaste}
                     compact={true}
                   />
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
            
            {/* Right: Advanced Editor Button */}
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => router.push("/editor")}
                className="flex items-center gap-1.5 p-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg text-xs font-semibold transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <PencilRuler className="w-3.5 h-3.5" />
                <span>ADV Editor</span>
              </button>
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
                  onToggleSidebar={() => {}} 
                  isSidebarCollapsed={true}
                  onToggleLeftSidebar={() => {}}
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
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${
                mobileRightSidebarContent === 'messages' && mobileRightSidebarOpen
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
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${
                mobileRightSidebarContent === 'tools' && mobileRightSidebarOpen
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
              className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 ${
                mobileRightSidebarContent === 'history' && mobileRightSidebarOpen
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
            <button className="flex flex-col items-center justify-center p-2 min-w-0">
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 border border-blue-200 mb-1">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <span className="text-xs font-medium text-gray-600">Profile</span>
            </button>
            
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
                    suggestionsOpen={suggestionsOpen}
                    setSuggestionsOpen={setSuggestionsOpen}
                    modificationExamples={modificationExamples}
                    textareaRef={textareaRef}
                    messagesEndRef={messagesEndRef}
                  />
                )}
                
                {mobileRightSidebarContent === 'tools' && (
                  <div className="h-full">
                    <ConfigSidebar />
                  </div>
                )}
                
                {mobileRightSidebarContent === 'history' && (
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

  // Desktop Layout (default)
  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating global header for history and avatar, only when no chart is created */}
      {(!chartData?.datasets?.length || !hasJSON) && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3">
          <HistoryDropdown />
          <button
            onClick={clearStoreData}
            className="px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded border border-red-200 transition-colors"
            title="Clear store data (fixes migration issues)"
          >
            Clear Data
          </button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-200 text-blue-700 font-bold">U</AvatarFallback>
          </Avatar>
        </div>
      )}
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(156,146,172,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
      </div>
      {/* Left Sidebar / Chat */}
      <aside className={`transition-all duration-300 z-10 flex flex-col border-r border-white/20 shadow-2xl bg-white/90 backdrop-blur-xl ${leftSidebarOpen ? 'w-[340px]' : 'w-16'} rounded-tl-2xl rounded-bl-2xl`}>
        {leftSidebarOpen ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-white/20 rounded-lg backdrop-blur-sm">
                  <BarChart2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white tracking-tight">AIChartor</span>
                  <div className="text-xs text-white/80 font-medium leading-tight">AI Chart Generator</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 text-xs border border-white/20 flex items-center gap-1 hover:scale-105"
                  onClick={handleNewConversation}
                  title="New Conversation"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-2 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 text-xs border border-white/20 hover:scale-105"
                  onClick={() => setLeftSidebarOpen(false)}
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 text-xs border border-white/20 hover:scale-105 flex items-center gap-1"
                  onClick={() => router.push("/editor")}
                >
                  Full Editor <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
            

            
                         {/* Input */}
             <form
               onSubmit={handleSend}
               className="p-2 border-t border-white/20 bg-gradient-to-br from-white/90 to-slate-50/90 flex gap-2 rounded-b-3xl shadow-inner backdrop-blur-sm flex-shrink-0"
             >
               <textarea
                 ref={textareaRef}
                 className="flex-1 rounded-lg border border-slate-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 resize-none max-h-24 min-h-[40px] leading-relaxed transition-colors font-sans shadow-sm backdrop-blur-sm"
                 placeholder={hasActiveChart ? "Modify the chart..." : "Describe your chart..."}
                 value={input}
                 onChange={handleInputChange}
                 onPaste={handlePaste}
                 disabled={isProcessing}
                 rows={1}
                 onKeyDown={e => {
                   if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                     e.preventDefault();
                     handleSend(e)
                   }
                 }}
               />
               <button
                 type="submit"
                 className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-3 py-2 rounded-lg shadow-lg disabled:opacity-50 transition-all duration-200 transform hover:scale-105 focus:scale-105 disabled:hover:scale-100"
                 disabled={isProcessing || !input.trim()}
                 style={{ alignSelf: "flex-end", height: 40 }}
               >
                 <Send className="inline-block w-4 h-4" />
               </button>
             </form>

            {/* Modification Examples */}
            {hasActiveChart && (
              <div className={`w-full transition-all duration-200 ${suggestionsOpen ? 'pb-2' : 'py-1'}`}
                   style={{minHeight: suggestionsOpen ? undefined : '0', marginBottom: suggestionsOpen ? '0.25rem' : '0'}}>
                <button
                  type="button"
                  className="flex items-center w-full text-xs font-semibold text-slate-600 mb-1 pl-3 pr-2 py-1 hover:bg-slate-100 rounded transition-colors select-none"
                  onClick={() => setSuggestionsOpen(v => !v)}
                  aria-expanded={suggestionsOpen}
                  style={{justifyContent: 'space-between'}}
                >
                  <span className="flex items-center gap-1"><Sparkles className="w-4 h-4" /> Try asking me to:</span>
                  {suggestionsOpen ? (
                    <ChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <ChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
                {suggestionsOpen && (
                  <div className="flex flex-wrap gap-1.5 px-1 pb-1">
                    {modificationExamples.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setInput(example)}
                        className="text-xs bg-white/80 hover:bg-white border border-slate-200/50 rounded-full px-3 py-1 text-slate-700 hover:text-slate-900 hover:border-slate-300 transition-all duration-200 hover:scale-105 shadow-sm backdrop-blur-sm"
                        style={{marginBottom: '2px'}}
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gradient-to-b from-white/80 to-slate-50/80 font-sans">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl px-4 py-3 max-w-[90%] whitespace-pre-wrap break-words shadow-lg font-medium text-sm transition-all duration-300 transform hover:scale-[1.02] ${
                    msg.role === "user"
                      ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white self-end ml-auto border border-indigo-400/30 shadow-indigo-500/25"
                      : "bg-gradient-to-br from-white to-slate-50 text-slate-800 self-start mr-auto border border-slate-200/50 shadow-slate-500/10"
                  }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  <div className="flex items-start gap-3">
                    {msg.role === 'assistant' && (
                      <div className="p-1.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex-shrink-0">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                      </div>
                    )}
                    <div className="flex-1">
                      {msg.content}
                      {msg.chartSnapshot && (
                        <div className="mt-3 text-xs opacity-80 flex items-center gap-2 bg-white/50 rounded-lg px-2 py-1.5">
                          <Edit3 className="w-3 h-3" />
                          Chart {msg.action === 'create' ? 'created' : 'updated'}
                          {msg.changes && msg.changes.length > 0 && (
                            <span className="ml-1">• {msg.changes.length} change{msg.changes.length > 1 ? 's' : ''}</span>
                          )}
                        </div>
                      )}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="mt-3 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl text-xs text-blue-800 border border-blue-200/50">
                          <div className="font-semibold mb-2 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            Suggestions:
                          </div>
                          <ul className="space-y-1.5">
                            {msg.suggestions.map((suggestion, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-blue-500 font-bold">•</span>
                                <span>{suggestion}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
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
                  onClick={() => setShowActiveBanner(false)}
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
            {/* Application Logo / Expand Icon - Transforms on hover */}
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 group-hover:shadow-md"
              title="Expand Sidebar"
            >
              <BarChart2 className="w-6 h-6 text-white transition-all duration-200 group-hover:hidden" />
              <ChevronRight className="w-6 h-6 text-white hidden transition-all duration-200 group-hover:block" />
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
              <Plus className="w-5 h-5" />
            </button>
            
            {/* Message Icon - Show current chat */}
            <button
              onClick={() => {
                if (hasActiveChart) {
                  setLeftSidebarOpen(true);
                }
              }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                hasActiveChart 
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