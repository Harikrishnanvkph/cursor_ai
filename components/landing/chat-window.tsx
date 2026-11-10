"use client"

import React, { useRef, useCallback, useEffect } from "react"
import { Send, MessageSquare, Edit3, Sparkles, X, Brain, BarChart2, LineChart, PieChart, ArrowRight, Cpu, Globe, ExternalLink } from "lucide-react"
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
  tokensUsed?: number | null
  usage?: { sent?: number; received?: number; total?: number } | null
  modelUsed?: string | null
  searchQuery?: string | null
  searchProvider?: string | null
  searchSources?: Array<{ title: string; url: string; siteName?: string }> | null
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

  // Phased progress ticker during AI generation
  const [processingPhase, setProcessingPhase] = React.useState(0)
  const processingPhases = React.useMemo(() => [
    "Structuring layout & dimensions...",
    "Synthesizing chart data & metrics...",
    "Drafting editorial story & callouts...",
    "Assembling AI Content Bank blocks...",
  ], [])

  React.useEffect(() => {
    if (!isProcessing) {
      setProcessingPhase(0)
      return
    }
    const interval = setInterval(() => {
      setProcessingPhase((prev) => (prev + 1) % processingPhases.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [isProcessing, processingPhases.length])

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
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3.5 pt-3.5 pb-24 space-y-3 bg-transparent font-sans flex flex-col min-w-0">
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
          <div className="space-y-3 w-full min-w-0">
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
                  className={`rounded-2xl px-3.5 py-3 whitespace-pre-wrap break-words shadow-xs font-medium text-sm min-w-0 overflow-hidden ${msg.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white self-end ml-auto max-w-[88%] border border-indigo-400/30 shadow-indigo-500/20"
                    : "bg-slate-100/90 dark:bg-slate-900 text-slate-800 dark:text-slate-100 self-start mr-auto w-full border border-slate-200/70 dark:border-slate-800"
                    }`}
                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                >
                  <div className="flex items-start gap-2.5 min-w-0 w-full">
                    {msg.role === 'assistant' && (
                      <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg flex-shrink-0 shadow-2xs border border-slate-200/50 dark:border-slate-700/50">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {msg.role === 'assistant' && msg.searchQuery && (
                        <div className="mb-2.5 p-2 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/70 dark:border-blue-800/50 rounded-xl text-xs min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-blue-700 dark:text-blue-300 min-w-0">
                            <Globe className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                            <span className="truncate min-w-0 flex-1">
                              Searched the web: <strong className="font-semibold text-blue-900 dark:text-blue-100">"{msg.searchQuery}"</strong>
                            </span>
                          </div>
                          {msg.searchSources && msg.searchSources.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1.5 pt-1.5 border-t border-blue-200/50 dark:border-blue-800/40 min-w-0">
                              {msg.searchSources.slice(0, 5).map((source, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200/80 dark:border-slate-700 transition-colors max-w-[180px] truncate shadow-2xs"
                                  title={source.title}
                                >
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
                                  <span className="truncate">{source.siteName || source.title}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="break-words min-w-0 leading-relaxed text-xs sm:text-sm" style={{ overflowWrap: 'anywhere' }}>
                        {msg.content}
                      </div>
                      {msg.role === 'assistant' && (Boolean(msg.tokensUsed) || Boolean(msg.usage?.total)) && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 select-none min-w-0">
                          <div className="flex items-center gap-1.5 font-normal min-w-0 flex-wrap">
                            <Cpu className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                            <span className="break-words">
                              {msg.usage && typeof msg.usage.sent === 'number' && typeof msg.usage.received === 'number' ? (
                                <>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{(msg.usage.total || msg.tokensUsed)?.toLocaleString()}</span> tokens
                                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] ml-1">
                                    ({msg.usage.sent.toLocaleString()} in · {msg.usage.received.toLocaleString()} out)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-semibold text-slate-700 dark:text-slate-200">{msg.tokensUsed?.toLocaleString()}</span> tokens
                                </>
                              )}
                            </span>
                          </div>
                          {msg.modelUsed && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 shrink-0">
                              {msg.modelUsed}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            {isProcessing && (
              <div className="bg-slate-100/90 dark:bg-slate-900 text-slate-800 dark:text-slate-100 self-start mr-auto border border-slate-200/70 dark:border-slate-800 rounded-2xl px-3.5 py-3 w-full shadow-xs min-w-0 overflow-hidden">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-2xs border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-600 border-t-transparent"></div>
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 transition-all duration-300 truncate">
                      {processingPhases[processingPhase]}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Step {processingPhase + 1} of {processingPhases.length}
                    </span>
                  </div>
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