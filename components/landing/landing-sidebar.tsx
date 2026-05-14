"use client"

import React, { useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUp, BarChart2, SquarePen, Edit3,
  MessageSquare, Sparkles, ChevronLeft, ChevronRight,
  Info, LayoutDashboard
} from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { chartTemplate } from "./prompt_template"
import { useSidebarContext } from "./sidebar-context"

interface LandingSidebarProps {
  leftSidebarOpen: boolean
  setLeftSidebarOpen: (open: boolean) => void
}

export function LandingSidebar({ leftSidebarOpen, setLeftSidebarOpen }: LandingSidebarProps) {
  const router = useRouter()
  const { hasJSON } = useChartStore()
  const {
    messages,
    currentChartState,
    isProcessing,
    continueConversation,
    startNewConversation,
    setMessages,
  } = useChatStore()

  const { generateMode, currentTemplate } = useTemplateStore()

  // Use shared context for input so external components (e.g. PromptTemplate) can write to it
  const { chatInput: input, setChatInput: setInput, textareaRef } = useSidebarContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if chat should be disabled (only template mode requires a template; format mode is always enabled)
  const isChatDisabled = (generateMode === 'template' && !currentTemplate)
  const hasActiveChart = currentChartState !== null && hasJSON

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

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)

    if (textareaRef.current) {
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

      const timeoutId = setTimeout(updateHeight, 16)
      textareaRef.current.dataset.resizeTimeout = timeoutId.toString()
    }
  }, [])

  const handlePaste = useCallback(() => {
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <aside className={`z-10 flex flex-col border-r border-gray-200 shadow-2xl bg-white ${leftSidebarOpen ? 'w-[320px]' : 'w-14'} overflow-hidden flex-shrink-0`}>
      {leftSidebarOpen ? (
        <>
          {/* Unified Header with Title */}
          <div className="flex flex-col border-b border-white/20 bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
            <div className="flex justify-center pt-3 pb-2">
              <span className="text-[11px] font-bold text-white/90 uppercase tracking-[0.15em] drop-shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                AI Chart Generator
              </span>
            </div>

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/board')}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs border border-white/20 flex items-center gap-1.5"
                  title="Go to Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
                <button
                  onClick={() => router.push('/editor')}
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors text-xs border border-white/20 flex items-center gap-1.5"
                  title="Go to Infographic Editor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
              </div>
              <div className="flex gap-1">
                <button
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-2 py-1.5 rounded-lg transition-colors text-xs border border-white/20 flex items-center gap-1"
                  onClick={handleNewConversation}
                  title="New Conversation"
                >
                  <SquarePen className="w-3.5 h-3.5" />
                </button>
                <button
                  className="bg-white/20 hover:bg-white/30 text-white font-semibold px-2 py-1.5 rounded-lg transition-colors text-xs border border-white/20"
                  onClick={() => setLeftSidebarOpen(false)}
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSend}
            className="p-3 border-t border-gray-200 bg-white flex items-end gap-2 flex-shrink-0"
          >
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
          </form>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-gradient-to-b from-white/80 to-slate-50/80 font-sans">
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
                        <Sparkles className="w-4 h-4 text-blue-600" />
                      </div>
                      {msg.chartSnapshot && (
                        <div className="relative group">
                          <Info className="w-3 h-3 text-blue-400 hover:text-blue-600 cursor-help transition-colors" />
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 transition-opacity duration-200 delay-0 group-hover:opacity-100 group-hover:delay-300 pointer-events-none whitespace-nowrap z-50">
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

        </>
      ) : (
        // Collapsed Sidebar - Icon Only
        <div className="flex flex-col items-center h-full py-4 group">
          <div className="flex flex-col items-center space-y-4 w-full">
            {/* Application Logo - Always shows logo, routes to home */}
            <button
              onClick={() => router.push("/")}
              className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg transition-shadow hover:shadow-md"
              title="Go to Home"
            >
              <BarChart2 className="w-5 h-5 text-white" />
            </button>

            {/* Expand Sidebar Icon - Separate ChevronRight icon */}
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 text-gray-500 hover:text-blue-600 transition-colors hover:shadow-md"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* New Chat Icon */}
            <button
              onClick={() => {
                handleNewConversation();
                setLeftSidebarOpen(true);
              }}
              className="p-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200 text-gray-600 hover:text-blue-600"
              title="New Chat"
            >
              <SquarePen className="w-4 h-4" />
            </button>

            {/* Message Icon - Show current chat */}
            <button
              onClick={() => {
                if (hasActiveChart) {
                  setLeftSidebarOpen(true);
                }
              }}
              className={`p-1.5 rounded-lg transition-all duration-200 ${hasActiveChart
                ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                }`}
              title={hasActiveChart ? "Current Chat" : "No active chat"}
              disabled={!hasActiveChart}
            >
              <MessageSquare className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-auto pt-4 pb-4 w-full flex justify-center">
            <button
              onClick={() => router.push('/editor')}
              className="group/btn relative flex flex-col items-center justify-center py-4 px-1.5 gap-3 rounded-lg bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 hover:shadow-sm transition-all duration-200 w-full mx-2 max-w-[40px]"
              title="Advanced Editor"
            >
              <Edit3 className="w-4 h-4 text-gray-500 group-hover/btn:text-blue-600 transition-colors" />
              <div className="writing-vertical-rl rotate-180 text-[10px] font-medium text-gray-500 tracking-wider group-hover/btn:text-blue-600 transition-colors uppercase antialiased" style={{ textRendering: 'optimizeLegibility' }}>
                Advanced Editor
              </div>
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
