"use client"

import React, { useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUp, BarChart2, SquarePen, Edit3,
  MessageSquare, Sparkles, ChevronLeft, ChevronRight, ChevronDown,
  Info, LayoutDashboard, Bot, Brain, ExternalLink
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { chartTemplate } from "./prompt_template"
import { useSidebarContext } from "./sidebar-context"
import { toast } from "sonner"

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
    selectedModel,
    setSelectedModel,
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

    try {
      await continueConversation(userInput)
    } catch (err: any) {
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
  }, [input, isProcessing, continueConversation, isChatDisabled, setInput, textareaRef])

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
    <aside className={`z-10 flex flex-col border-r border-slate-200/80 shadow-md bg-white/40 backdrop-blur-xl ${leftSidebarOpen ? 'w-[320px]' : 'w-14'} overflow-hidden flex-shrink-0`}>
      {leftSidebarOpen ? (
        <>
          {/* Unified Header with Title */}
          <div className="flex flex-col border-b border-slate-200/80 bg-transparent shadow-xs">
            <div className="flex flex-col items-center justify-center pt-4 pb-2.5 text-center w-full">
              <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent drop-shadow-sm">
                AI Chart Generator
              </span>
            </div>

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => router.push('/board')}
                  className="bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 rounded-xl px-2.5 py-1.5 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  title="Go to Dashboard"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
                <button
                  onClick={() => router.push('/editor')}
                  className="bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200/80 rounded-xl px-2.5 py-1.5 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  title="Go to Infographic Editor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
              </div>
              <div className="flex gap-1.5">
                <button
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-100 hover:border-indigo-200 rounded-xl px-2.5 py-1.5 font-semibold transition-all text-xs flex items-center gap-1 shadow-sm"
                  onClick={handleNewConversation}
                  title="New Conversation"
                >
                  <SquarePen className="w-3.5 h-3.5" />
                </button>
                <button
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 border border-slate-200/60 rounded-xl px-2.5 py-1.5 transition-all text-xs shadow-sm"
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
            className="p-4 border-t border-slate-200/80 bg-transparent flex flex-col gap-2 flex-shrink-0"
          >
            <div className="flex items-center justify-between px-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1.5 py-1 px-2.5 bg-white hover:bg-slate-50 border border-slate-200/60 rounded-xl shadow-xs">
                    <Bot className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      {selectedModel === 'gemini-search'
                        ? 'Gemini 2.5 + Search'
                        : selectedModel === 'deepseek-search'
                        ? 'DeepSeek + Search'
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
                    <span>DeepSeek + Search</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedModel('gemini-search')} className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer hover:bg-slate-50 rounded-lg text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Gemini 2.5 + Search</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="relative flex items-center w-full bg-white border border-slate-200 hover:border-slate-300 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-50/50 transition-all rounded-2xl p-1.5 shadow-xs">
              <textarea
                ref={textareaRef}
                className="flex-1 px-3 py-2 text-sm bg-transparent border-0 outline-none resize-none max-h-[140px] min-h-[38px] leading-relaxed transition-all font-sans text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none disabled:opacity-50"
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
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0 transition-all duration-200 shadow-sm disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100"
                disabled={isProcessing || !input.trim() || isChatDisabled}
              >
                <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </form>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-transparent font-sans scrollbar-thin scrollbar-thumb-slate-200/80 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`px-4 py-3 max-w-[85%] whitespace-pre-wrap break-words text-sm leading-relaxed ${msg.role === "user"
                  ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white self-end ml-auto border border-indigo-400/20 rounded-2xl rounded-tr-sm font-semibold shadow-xs"
                  : "bg-indigo-50/40 text-slate-800 self-start mr-auto border border-indigo-200/70 rounded-2xl rounded-tl-sm px-4 py-3 shadow-[0_2px_8px_rgba(99,102,241,0.04)] font-medium"
                  }`}
                style={{ wordBreak: 'break-word' }}
              >
                <div className="flex items-start gap-3">
                  {msg.role === 'assistant' && (
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-xs text-white flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5" />
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
              <div className="bg-indigo-50/40 text-slate-800 self-start mr-auto border border-indigo-200/70 rounded-2xl rounded-tl-sm px-4 py-3 shadow-[0_2px_8px_rgba(99,102,241,0.04)] font-medium max-w-[85%]">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-xs text-white flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white border-t-transparent"></div>
                  </div>
                  <span className="text-sm">Processing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

        </>
      ) : (
        // Collapsed Sidebar - Icon Only
        <div className="flex flex-col items-center h-full py-4 bg-transparent group">
          <div className="flex flex-col items-center space-y-4 w-full">
            {/* Application Logo - Always shows logo, routes to home */}
            <button
              onClick={() => router.push("/")}
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 rounded-xl shadow-xs transition-all hover:shadow-sm"
              title="Go to Home"
            >
              <BarChart2 className="w-4 h-4" />
            </button>

            {/* Expand Sidebar Icon - Separate ChevronRight icon */}
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all hover:shadow-sm"
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
              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 rounded-xl shadow-xs transition-all hover:shadow-sm"
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
              className={`p-1.5 rounded-xl border shadow-xs transition-all ${hasActiveChart
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200/60 hover:shadow-sm'
                : 'text-slate-400 bg-slate-50/50 border-slate-200/40 cursor-not-allowed'
                }`}
              title={hasActiveChart ? "Current Chat" : "No active chat"}
              disabled={!hasActiveChart}
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* External Link Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all hover:shadow-sm"
                  title="Quick Navigation"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-40 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-lg rounded-xl p-1.5">
                <DropdownMenuItem
                  onClick={() => router.push('/board')}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Board Page</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/editor')}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Editor Page</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </aside>
  )
}
