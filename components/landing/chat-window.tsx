"use client"

import React, { useRef, useCallback, useEffect } from "react"
import { Send, MessageSquare, Edit3, Sparkles, X, Brain } from "lucide-react"

interface ChartSnapshot {
  chartType: string
  chartData: any
  chartConfig: any
}

interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
  timestamp: number
  chartSnapshot?: ChartSnapshot
  action?: 'create' | 'modify' | 'update' | 'reset'
  changes?: string[]
}

interface ChatWindowProps {
  messages: ChatMessage[]
  input: string
  setInput: (input: string) => void
  onSend: (e?: React.FormEvent) => void
  handleInputChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handlePaste?: () => void
  isProcessing: boolean
  hasActiveChart: boolean
  showActiveBanner: boolean
  setShowActiveBanner: (show: boolean) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  currentChartState: ChartSnapshot | null
  className?: string
  compact?: boolean
  isChatDisabled?: boolean
  disabledMessage?: string
}

export function ChatWindow({
  messages,
  input,
  setInput,
  onSend,
  isProcessing,
  hasActiveChart,
  showActiveBanner,
  setShowActiveBanner,
  messagesEndRef,
  textareaRef,
  handleInputChange,
  handlePaste,
  className = "",
  currentChartState,
  isChatDisabled = false,
  disabledMessage = "Please attach a template to start the conversation."
}: ChatWindowProps) {

  // Enhanced input change handler with auto-resize
  const enhancedHandleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange?.(e)

    // Optimized auto-resize logic with debouncing for ChatWindow textarea
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
  }, [handleInputChange, textareaRef])

  // Enhanced paste handler for ChatWindow
  const enhancedHandlePaste = useCallback(() => {
    handlePaste?.()

    // Single timeout for paste operations to reduce performance impact
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = "36px"
        const maxHeight = 80
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden"
      }
    }, 10)
  }, [handlePaste, textareaRef])

  // Initial height adjustment when input value changes
  useEffect(() => {
    if (textareaRef.current && input) {
      const updateHeight = () => {
        if (textareaRef.current) {
          textareaRef.current.style.height = "36px"
          const maxHeight = 80
          textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, maxHeight)}px`
          textareaRef.current.style.overflowY = textareaRef.current.scrollHeight > maxHeight ? "auto" : "hidden"
        }
      }
      requestAnimationFrame(updateHeight)
    }
  }, [input, textareaRef])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gradient-to-b from-white/80 to-slate-50/80 font-sans">
        {/* Show disabled message if chat is disabled and no messages */}
        {isChatDisabled && messages.length === 0 && (
          <div className="flex items-center justify-center h-full px-4">
            <div className="bg-gradient-to-br from-amber-100 to-orange-100 border-3 border-amber-400 rounded-2xl px-8 py-6 max-w-md text-center shadow-2xl ring-4 ring-amber-200/50">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-amber-400 to-orange-400 rounded-full shadow-lg">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <div>
                  <p className="text-lg font-bold text-amber-900 mb-2">Template Required</p>
                  <p className="text-base text-amber-800 font-medium leading-relaxed">{disabledMessage}</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
                <div className="p-1.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex-shrink-0">
                  <Brain className="w-4 h-4 text-blue-600" />
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
        <div className="relative px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-200/50 flex-shrink-0">
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
    </div>
  )
} 