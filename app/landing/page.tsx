"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Send, BarChart2, Plus, RotateCcw, Edit3, MessageSquare, Sparkles, ArrowRight, ChevronDown, ChevronUp, X, ChevronLeft, ChevronRight, PanelLeft, PanelRight } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { ChartLayout } from "@/components/chart-layout"
import { useHistoryStore } from "@/lib/history-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { HistoryDropdown } from "@/components/history-dropdown"
import { clearStoreData } from "@/lib/utils"

const chartTemplate =
  "Create a bar chart comparing the top 5 countries by smartphone usage in 2025. Include country names on the x-axis and number of users on the y-axis."

const modificationExamples = [
  "Make the bars red",
  "Add a title",
  "Show only the top 3 items",
  "Change to a pie chart",
  "Make the bars thicker"
]

export default function LandingPage() {
  const router = useRouter()
  const { chartConfig, chartData, setFullChart, resetChart, hasJSON, setHasJSON } = useChartStore()
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
  const [suggestionsOpen, setSuggestionsOpen] = useState(true)
  const [showActiveBanner, setShowActiveBanner] = useState(true)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true)

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userInput = input.trim()
    setInput("")

    if (textareaRef.current) {
      textareaRef.current.style.height = "48px"
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
        textareaRef.current.style.height = "48px"
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      }
    }, 0)
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      if (e.target.value === "") {
        textareaRef.current.style.height = "48px"
        textareaRef.current.style.overflowY = "hidden"
      } else {
      textareaRef.current.style.height = "48px"
      const maxHeight = 160
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
      textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden"
      }
    }
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const hasActiveChart = currentChartState !== null && hasJSON

  useEffect(() => {
    // When a new chart is received, show the banner and expand suggestions
    if (hasActiveChart) {
      setShowActiveBanner(true)
      setSuggestionsOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasActiveChart])

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

  return (
    <div className="flex h-screen w-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Floating global header for history and avatar, only when no chart is created */}
      {!hasActiveChart && (
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
      <aside className={`transition-all duration-300 z-10 flex flex-col border-r border-white/20 shadow-2xl bg-white/90 backdrop-blur-xl ${leftSidebarOpen ? 'w-[340px]' : 'w-0'} rounded-tl-2xl rounded-bl-2xl`}>
        {leftSidebarOpen && (
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
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-lg backdrop-blur-sm transition-all duration-200 text-xs border border-white/20 hover:scale-105 flex items-center gap-1"
                  onClick={() => router.push("/editor")}
                >
                  Full Editor <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
            {/* Conversation Status */}
            {hasActiveChart && showActiveBanner && (
              <div className="relative px-6 py-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200/50">
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
            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-6 border-t border-white/20 bg-gradient-to-br from-white/90 to-slate-50/90 flex gap-3 rounded-b-3xl shadow-inner backdrop-blur-sm"
            >
              <textarea
                ref={textareaRef}
                className="flex-1 rounded-xl border border-slate-200/50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 resize-none max-h-32 min-h-[48px] leading-relaxed transition-all font-sans shadow-sm backdrop-blur-sm"
                placeholder={hasActiveChart ? "Modify the chart..." : "Describe your chart..."}
                value={input}
                onChange={handleInputChange}
                disabled={isProcessing}
                rows={1}
                style={{ height: "48px", overflowY: textareaRef.current && textareaRef.current.scrollHeight > 128 ? 'auto' : 'hidden' }}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    handleSend(e)
                  }
                }}
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-3 rounded-xl shadow-lg disabled:opacity-50 transition-all duration-200 transform hover:scale-105 focus:scale-105 disabled:hover:scale-100"
                disabled={isProcessing || !input.trim()}
                style={{ alignSelf: "flex-end", height: 48 }}
              >
                <Send className="inline-block w-5 h-5" />
              </button>
            </form>
          </>
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
          <div className="flex items-center justify-center h-full p-12">
            <div className="flex flex-col items-center justify-center w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-16">
              <div className="flex flex-col items-center justify-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-xl mb-4">
                  <BarChart2 className="w-6 h-6 text-white" />
              </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent mb-3 text-center">
                Create Your First Chart
              </h2>
                <p className="text-slate-600 text-center max-w-md mx-auto leading-relaxed text-base">
                Describe the chart you want to create in natural language. I'll generate it for you and you can ask me to modify it further!
              </p>
              </div>
              <div className="space-y-3 w-full max-w-md">
                <button
                  onClick={handleTemplateClick}
                  className="w-full bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-slate-800 font-medium px-4 py-3 rounded-xl border border-indigo-200/50 transition-all duration-200 text-left hover:shadow-lg group text-sm"
                >
                  <div className="font-semibold flex items-center gap-2 mb-1">
                    <div className="p-1 bg-indigo-100 rounded group-hover:bg-indigo-200 transition-colors">
                      <BarChart2 className="w-4 h-4 text-indigo-600" />
                    </div>
                    Sample Request
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed">{chartTemplate}</div>
                </button>
                <div className="text-center">
                  <div className="text-xs text-slate-500">
                    Or type your own request in the chat panel →
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 