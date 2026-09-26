"use client"

import React, { useRef, useCallback, useEffect } from "react"
import { Send, MessageSquare, Edit3, Sparkles, X, Brain, BarChart2, LineChart, PieChart, ArrowRight, Square } from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useChatStore } from "@/lib/chat-store"
import { toast } from "sonner"

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
  const { user } = useAuth()
  const userGreetingName = React.useMemo(() => {
    if (!user) return ""
    const name = (user as any)?.name || (user as any)?.user_metadata?.full_name || (user as any)?.email?.split('@')[0]
    return name || ""
  }, [user])

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
            textareaRef.current.style.height = "44px"
            textareaRef.current.style.overflowY = "hidden"
          } else {
            textareaRef.current.style.height = "44px"
            const maxHeight = 150
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight + 2, maxHeight)}px`
            textareaRef.current.style.overflowY = textareaRef.current.scrollHeight + 2 > maxHeight ? "auto" : "hidden"
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
        textareaRef.current.style.height = "44px"
        const maxHeight = 150
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight + 2, maxHeight)}px`
        textareaRef.current.style.overflowY = textareaRef.current.scrollHeight + 2 > maxHeight ? "auto" : "hidden"
      }
    }, 10)
  }, [handlePaste, textareaRef])

  const isConversationEmpty = messages.length === 0 || messages.every(m =>
    m.role === 'assistant' && (
      m.content.includes('Hi! Describe the chart') ||
      m.content.includes('Please attach a template') ||
      m.content.includes('Select a template from the options') ||
      m.content.includes('Describe your chart content') ||
      m.content.includes('Please select a format')
    )
  )

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Messages or Gemini Hero Empty State */}
      <div className="flex-1 overflow-y-auto px-3.5 pt-3.5 pb-24 space-y-3 bg-transparent font-sans flex flex-col">
        {isConversationEmpty ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8 animate-in fade-in duration-300 select-none">
            {/* Glowing 4-pointed Gemini Star (mobile screen size only) */}
            <div className="relative mb-5 flex items-center justify-center md:hidden">
              <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/25 to-pink-500/20 blur-xl animate-pulse pointer-events-none" />
              <div className="relative w-14 h-14 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-md shadow-indigo-500/5 flex items-center justify-center backdrop-blur-md">
                <svg
                  className="w-8 h-8"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="geminiStarChatWindowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="35%" stopColor="#818cf8" />
                      <stop offset="70%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#f472b6" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
                    fill="url(#geminiStarChatWindowGrad)"
                  />
                </svg>
              </div>
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1.5">
              Let's Jump in{userGreetingName ? (
                <>
                  ,{" "}
                  <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {userGreetingName}
                  </span>
                </>
              ) : ""}
            </h2>

            {isChatDisabled ? (
              <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-2xl text-sm text-amber-800 font-medium mb-4 max-w-sm leading-relaxed">
                <p className="font-semibold mb-1">Template Required</p>
                <p className="text-xs">{disabledMessage || "Please attach a template to start the conversation."}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
                Type or Select a prompt
              </p>
            )}

            {!isChatDisabled && (
              <TooltipProvider delayDuration={100}>
                <div className="w-full flex flex-col gap-2 max-w-xs">
                  {[
                    {
                      label: "Top Tech Companies by Market Cap",
                      icon: BarChart2,
                      prompt: "Create a bar chart comparing the top 5 tech companies by market cap in USD billions",
                    },
                    {
                      label: "Quarterly Revenue Growth",
                      icon: LineChart,
                      prompt: "Create a line chart showing quarterly revenue growth from Q1 to Q4",
                    },
                    {
                      label: "Global Smartphone Market Share",
                      icon: PieChart,
                      prompt: "Create a donut chart of global smartphone market share by leading brands",
                    },
                  ].map((item, idx) => {
                    const Icon = item.icon
                    return (
                      <Tooltip key={idx}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(item.prompt)
                              if (textareaRef?.current) {
                                textareaRef.current.focus()
                              }
                            }}
                            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left bg-slate-50/80 dark:bg-slate-900/80 hover:bg-indigo-50/60 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-200/80 shadow-2xs transition-all active:scale-[0.98] group cursor-pointer"
                            title={item.prompt}
                          >
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-900 dark:group-hover:text-indigo-300 flex-1 truncate">
                              {item.label}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          sideOffset={8}
                          className="max-w-[300px] p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 text-xs leading-relaxed z-[150]"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-1">
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>Full Prompt</span>
                          </div>
                          <p className="text-slate-100 font-medium select-none">{item.prompt}</p>
                        </TooltipContent>
                      </Tooltip>
                    )
                  })}
                </div>
              </TooltipProvider>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages
              .filter(m => !(m.role === 'assistant' && (
                m.content.includes('Hi! Describe the chart') ||
                m.content.includes('Please attach a template') ||
                m.content.includes('Select a template from the options') ||
                m.content.includes('Describe your chart content') ||
                m.content.includes('Please select a format')
              )))
              .map((msg, idx) => (
                <div
                  key={idx}
                  className={`rounded-2xl px-4 py-3 w-[95%] whitespace-pre-wrap break-words shadow-xs font-medium text-sm ${msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white self-end ml-auto border border-indigo-400/30 shadow-indigo-500/20"
                    : "bg-slate-100/90 dark:bg-slate-900 text-slate-800 dark:text-slate-100 self-start mr-auto border border-slate-200/70 dark:border-slate-800"
                    }`}
                  style={{ wordBreak: 'break-word' }}
                >
                  <div className="flex items-start gap-3">
                    {msg.role === 'assistant' && (
                      <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg flex-shrink-0 shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      {msg.content}
                      {msg.chartSnapshot && (
                        <div className="mt-3 text-xs opacity-85 flex items-center gap-2 bg-white/70 dark:bg-slate-800/70 rounded-lg px-2 py-1.5 border border-slate-200/50 dark:border-slate-700/50">
                          <Edit3 className="w-3 h-3" />
                          <span>Chart {msg.action === 'create' ? 'created' : 'updated'}</span>
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
              <div className="bg-slate-100/90 dark:bg-slate-900 text-slate-800 dark:text-slate-100 self-start mr-auto border border-slate-200/70 dark:border-slate-800 rounded-2xl px-4 py-3 w-[95%] shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                    </div>
                    <span className="text-sm font-medium">Processing your request...</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      useChatStore.getState().stopGeneration()
                      toast.info("Generation cancelled")
                    }}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3 h-3 fill-current text-red-500" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

    </div>
  )
} 