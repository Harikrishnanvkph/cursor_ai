"use client"

import React, { useRef, useCallback, useEffect } from "react"
import { Send, MessageSquare, Edit3, Sparkles, ChevronUp, ChevronDown, X } from "lucide-react"

interface ChatMessage {
  role: 'assistant' | 'user'
  content: string
  timestamp: number
  chartSnapshot?: any
  action?: 'create' | 'modify' | 'update' | 'reset'
  changes?: string[]
  suggestions?: string[]
}

interface ChatWindowProps {
  messages: ChatMessage[]
  input: string
  setInput: (input: string) => void
  onSend: (e?: React.FormEvent) => Promise<void>
  isProcessing: boolean
  hasActiveChart: boolean
  showActiveBanner: boolean
  setShowActiveBanner: (show: boolean) => void
  suggestionsOpen: boolean
  setSuggestionsOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  modificationExamples: string[]
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handlePaste: () => void
  className?: string
  compact?: boolean
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
  suggestionsOpen,
  setSuggestionsOpen,
  modificationExamples,
  messagesEndRef,
  textareaRef,
  handleInputChange,
  handlePaste,
  className = "",
  compact = false
}: ChatWindowProps) {

  // Enhanced input change handler with auto-resize
  const enhancedHandleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleInputChange(e)
    
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
    handlePaste()
    
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
      {/* Input */}
      <form
        onSubmit={onSend}
        className="p-2 border-t border-white/20 bg-gradient-to-br from-white/90 to-slate-50/90 flex gap-2 shadow-inner backdrop-blur-sm flex-shrink-0"
      >
        <textarea
          ref={textareaRef}
          className="flex-1 rounded-lg border border-slate-200/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent bg-white/80 resize-none max-h-20 min-h-[36px] leading-relaxed transition-colors shadow-sm backdrop-blur-sm"
          placeholder={hasActiveChart ? "Modify the chart..." : "Describe your chart..."}
          value={input}
          onChange={enhancedHandleInputChange}
          onPaste={enhancedHandlePaste}
          disabled={isProcessing}
          rows={1}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              onSend(e)
            }
          }}
        />
        <button
          type="submit"
          className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-2.5 py-2 rounded-lg shadow-lg disabled:opacity-50 transition-all duration-200 transform hover:scale-105 focus:scale-105 disabled:hover:scale-100 self-end"
          disabled={isProcessing || !input.trim()}
        >
          <Send className="inline-block w-3.5 h-3.5" />
        </button>
      </form>

      {/* Modification Examples */}
      {hasActiveChart && (
        <div className={`transition-all duration-200 ${suggestionsOpen ? 'pb-2' : 'py-1'} flex-shrink-0`}>
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
        <div className="relative px-4 py-3 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-200/50 flex-shrink-0">
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
    </div>
  )
} 