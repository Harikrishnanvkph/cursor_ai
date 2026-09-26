"use client"

import React, { useRef, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUp, BarChart2, SquarePen, Edit3,
  MessageSquare, Sparkles, ChevronLeft, ChevronRight, ChevronDown,
  Info, LayoutDashboard, Bot, Brain, ExternalLink, ImageIcon, Zap, Globe,
  LineChart, PieChart, ArrowRight, Settings, Check, Square
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { chartTemplate } from "./prompt_template"
import { useSidebarContext } from "./sidebar-context"
import { ChatSettingsPopover } from "./chat-settings-popover"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

interface LandingSidebarProps {
  leftSidebarOpen: boolean
  setLeftSidebarOpen: (open: boolean) => void
}

export function LandingSidebar({ leftSidebarOpen, setLeftSidebarOpen }: LandingSidebarProps) {
  const router = useRouter()
  const { user, isPro, aiCreditsLimit, aiCreditsRemaining } = useSubscriptionQuota()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

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
    includeImages,
    setIncludeImages,
  } = useChatStore()

  const { generateMode, currentTemplate } = useTemplateStore()

  // Use shared context for input so external components (e.g. PromptTemplate) can write to it
  const { chatInput: input, setChatInput: setInput, textareaRef } = useSidebarContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Check if chat should be disabled (only template mode requires a template; format mode is always enabled)
  const isChatDisabled = (generateMode === 'template' && !currentTemplate)
  const hasActiveChart = currentChartState !== null && hasJSON

  const userGreetingName = React.useMemo(() => {
    if (!user) return ""
    return (
      (user.user_metadata?.full_name as string) ||
      (user.user_metadata?.name as string) ||
      user.email?.split("@")[0] ||
      ""
    )
  }, [user])

  const isConversationEmpty = messages.length === 0 || messages.every(m =>
    m.role === 'assistant' && (
      m.content.includes('Hi! Describe the chart') ||
      m.content.includes('Please attach a template') ||
      m.content.includes('Select a template from the options') ||
      m.content.includes('Describe your chart content') ||
      m.content.includes('Please select a format')
    )
  )

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
            textareaRef.current.style.height = "34px"
            textareaRef.current.style.overflowY = "hidden"
          }
        }, 50)
      }
    }

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 100)
  }, [input, isProcessing, continueConversation, isChatDisabled, setInput, textareaRef, user, aiCreditsRemaining, aiCreditsLimit])

  // Auto-adjust textarea to 1 row (34px) or 2 rows max (58px) depending on content height needed
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const el = textareaRef.current
      if (!el.value) {
        el.style.height = "34px"
        el.style.overflowY = "hidden"
      } else {
        el.style.height = "auto"
        const singleRowHeight = 34
        const twoRowsMaxHeight = 58 // max height for 2 rows of text with padding
        const scrollH = el.scrollHeight
        const targetH = Math.max(singleRowHeight, Math.min(scrollH, twoRowsMaxHeight))
        el.style.height = `${targetH}px`
        el.style.overflowY = scrollH > twoRowsMaxHeight ? "auto" : "hidden"
      }
    }
  }, [textareaRef])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    adjustTextareaHeight()
  }, [adjustTextareaHeight])

  const handlePaste = useCallback(() => {
    requestAnimationFrame(adjustTextareaHeight)
  }, [adjustTextareaHeight])

  useEffect(() => {
    adjustTextareaHeight()
  }, [input, adjustTextareaHeight])

  const handleNewConversation = useCallback(() => {
    try {
      useChartStyleStore.getState().closeGallery()
      useFormatGalleryStore.getState().closeGallery()
    } catch (e) {}
    startNewConversation()
    setInput("")
  }, [startNewConversation])

  // Auto-scroll to bottom when new messages arrive (avoid scrolling on initial mount)
  const prevMessagesCountRef = useRef(messages.length)
  useEffect(() => {
    if (messages.length > 1 && messages.length > prevMessagesCountRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
    prevMessagesCountRef.current = messages.length
  }, [messages])

  return (
    <aside className={`z-10 flex flex-col border-r border-slate-200/80 shadow-md bg-white/40 backdrop-blur-xl ${leftSidebarOpen ? 'w-[320px]' : 'w-14'} overflow-hidden flex-shrink-0`}>
      {leftSidebarOpen ? (
        <>
          {/* Unified Header with Title */}
          <div className="flex flex-col border-b border-slate-200/80 bg-transparent shadow-xs">
            <div className="flex items-center justify-center gap-2 pt-4 pb-2.5 text-center w-full">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
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
            className="p-4 bg-transparent flex flex-col gap-2 flex-shrink-0"
          >
            {/* Input Capsule with Textarea and vertical Gear + Send column */}
            <div className="relative flex items-stretch w-full bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 hover:border-indigo-400 dark:hover:border-indigo-700 focus-within:border-indigo-600 dark:focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/15 shadow-md shadow-indigo-500/5 transition-all rounded-2xl p-2 min-h-[58px]">
              <textarea
                ref={textareaRef}
                className="flex-1 px-2 py-1 text-sm bg-transparent border-0 outline-none resize-none min-h-[34px] max-h-[58px] leading-relaxed transition-all font-sans text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-0 focus:outline-none disabled:opacity-50"
                placeholder={isChatDisabled ? "Attach a template to start..." : (hasActiveChart ? "Modify the chart..." : "Ask AI to Generate Chart...")}
                value={input}
                onChange={handleInputChange}
                onPaste={handlePaste}
                disabled={isProcessing || isChatDisabled}
                rows={1}
                onKeyDown={e => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    if (!isChatDisabled && input.trim()) {
                      handleSend(e)
                    }
                  }
                }}
              />
              <div className="flex flex-col items-center justify-between pl-1 flex-shrink-0 gap-1.5">
                {/* Gear Icon: inside textbox, opens popover with remaining credits, model dropdown, and image toggle */}
                <ChatSettingsPopover
                  selectedModel={selectedModel}
                  setSelectedModel={setSelectedModel}
                  includeImages={includeImages}
                  setIncludeImages={setIncludeImages}
                  aiCreditsRemaining={aiCreditsRemaining}
                  aiCreditsLimit={aiCreditsLimit}
                  onOpenUpgrade={() => setIsUpgradeOpen(true)}
                />

                {/* Send / Stop Button */}
                {isProcessing ? (
                  <button
                    type="button"
                    onClick={() => {
                      useChatStore.getState().stopGeneration()
                      toast.info("Generation cancelled")
                    }}
                    className="bg-red-500 hover:bg-red-600 active:scale-95 text-white w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200 shadow-2xs cursor-pointer"
                    title="Stop generation"
                  >
                    <Square className="w-3 h-3 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white w-7 h-7 flex items-center justify-center rounded-lg flex-shrink-0 transition-all duration-200 shadow-2xs disabled:opacity-30 disabled:hover:bg-indigo-600 disabled:active:scale-100"
                    disabled={!input.trim() || isChatDisabled}
                  >
                    <ArrowUp className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Messages or Gemini Hero Empty State */}
          <div className="flex-1 overflow-y-auto px-4 py-3 bg-transparent font-sans scrollbar-thin scrollbar-thumb-slate-200/80 scrollbar-track-transparent flex flex-col">
            {isConversationEmpty ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2 py-6 animate-in fade-in duration-300 select-none">
                {/* Glowing 4-pointed Gemini Star (mobile screen size only) */}
                <div className="relative mb-5 flex items-center justify-center md:hidden">
                  <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/25 to-pink-500/20 blur-xl animate-pulse pointer-events-none" />
                  <div className="relative w-14 h-14 rounded-2xl bg-white/90 border border-slate-200/80 shadow-md shadow-indigo-500/5 flex items-center justify-center backdrop-blur-md">
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient id="geminiStarSidebarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="35%" stopColor="#818cf8" />
                          <stop offset="70%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
                        fill="url(#geminiStarSidebarGrad)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Personalized Greeting */}
                <h2 className="text-lg font-bold tracking-tight text-slate-800 mb-1.5">
                  Let's Jump in{userGreetingName ? (
                    <>
                      ,{" "}
                      <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {userGreetingName}
                      </span>
                    </>
                  ) : ""}
                </h2>

                {/* Contextual Subtitle */}
                {isChatDisabled ? (
                  <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-800 font-medium mb-4 max-w-[280px] leading-relaxed">
                    Please attach a template from the options above to start your conversation.
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 max-w-[280px] mb-5 leading-relaxed">
                    Type or Select a prompt
                  </p>
                )}

                {/* Starter Prompt Chips */}
                {!isChatDisabled && (
                  <TooltipProvider delayDuration={100}>
                    <div className="w-full flex flex-col gap-2 max-w-[280px]">
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
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left bg-slate-50/80 dark:bg-slate-900/80 hover:bg-indigo-50/70 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-2xs transition-all active:scale-[0.98] group cursor-pointer"
                                title={item.prompt}
                              >
                                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/40 transition-colors flex-shrink-0">
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-200 group-hover:text-indigo-950 dark:group-hover:text-indigo-200 flex-1 truncate">
                                  {item.label}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent
                              side="right"
                              sideOffset={8}
                              className="max-w-[280px] p-3 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 text-xs leading-relaxed z-[150]"
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
                      className={`px-4 py-3 w-[95%] whitespace-pre-wrap break-words text-sm leading-relaxed ${msg.role === "user"
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
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 transition-opacity duration-200 delay-0 group-hover:opacity-100 group-hover:delay-300 pointer-events-none whitespace-nowrap z-50">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1">
                                      <Edit3 className="w-3 h-3" />
                                      <span>Chart {msg.action === 'create' ? 'created' : 'updated'}</span>
                                      {msg.changes && msg.changes.length > 0 && (
                                        <span>• {msg.changes.length} change{msg.changes.length > 1 ? 's' : ''}</span>
                                      )}
                                    </div>
                                  </div>
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
                  <div className="bg-indigo-50/40 text-slate-800 self-start mr-auto border border-indigo-200/70 rounded-2xl rounded-tl-sm px-4 py-3 shadow-[0_2px_8px_rgba(99,102,241,0.04)] font-medium w-[95%]">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-xs text-white flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4.5 w-4.5 border-2 border-white border-t-transparent"></div>
                      </div>
                      <span className="text-sm">Processing...</span>
                    </div>
                  </div>
                )}
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
      <UpgradeProDialog 
        open={isUpgradeOpen} 
        onOpenChange={setIsUpgradeOpen} 
        featureHighlight="ai" 
        title="Need More AI Credits?"
        description={`You have ${aiCreditsRemaining} AI credits remaining of your monthly ${aiCreditsLimit} limit. Upgrade to Pro for 50 credits/month.`}
      />
    </aside>
  )
}
