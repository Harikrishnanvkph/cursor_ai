"use client"

import React, { useRef, useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUp, BarChart2, SquarePen, Edit3,
  MessageSquare, Sparkles, ChevronLeft, ChevronRight, ChevronDown,
  Info, LayoutDashboard, Bot, Brain, ExternalLink, ImageIcon, Zap, Globe,
  LineChart, PieChart, ArrowRight, Settings, Check, Square, PanelLeft
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
import { useSidebarContext, useSidebarInputContext } from "./sidebar-context"
import { ChatSettingsPopover } from "./chat-settings-popover"
import { ChatWindow } from "./chat-window"
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
  const { textareaRef } = useSidebarContext()
  const { chatInput: input, setChatInput: setInput } = useSidebarInputContext()
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
  }, [setInput])

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
          {/* ChatGPT-style Header with Dropdown & Action Buttons */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200/80 bg-transparent min-h-[52px]">
            {/* Left: (Logo + AI Chart) Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 px-2 py-1.5 -ml-1 rounded-xl hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none select-none group"
                  title="Switch View"
                >
                  <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
                  <span className="text-sm font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                    AI Chart
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-xl z-50">
                <DropdownMenuItem
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-default bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400"
                >
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="text-sm font-semibold leading-tight">
                      AI Chart
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-normal">
                      Create charts with AI prompts
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-200/70 dark:bg-slate-800" />

                <DropdownMenuItem
                  onClick={() => router.push('/board')}
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      Dashboard
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-normal">
                      Manage saved charts & templates
                    </span>
                  </div>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => router.push('/editor')}
                  className="flex items-start justify-between px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                      Advanced Editor
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-normal leading-normal">
                      Full canvas & infographic design
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Right: New Create Button + Toggle Sidebar */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleNewConversation}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                title="New Chat"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                title="Close Sidebar"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
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
          <div className="flex-1 overflow-hidden font-sans">
            <ChatWindow
              messages={messages}
              input={input}
              setInput={setInput}
              onSend={handleSend}
              isProcessing={isProcessing}
              hasActiveChart={hasActiveChart}
              showActiveBanner={false}
              setShowActiveBanner={() => {}}
              messagesEndRef={messagesEndRef}
              textareaRef={textareaRef}
              currentChartState={currentChartState}
              isChatDisabled={isChatDisabled}
            />
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

            {/* Expand Sidebar Icon - PanelLeft */}
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all hover:shadow-sm"
              title="Expand Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
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
              <DropdownMenuContent align="start" side="right" className="w-56 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-lg rounded-2xl p-1.5">
                <DropdownMenuItem
                  onClick={() => router.push('/board')}
                  className="flex flex-col items-start px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">Dashboard</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">Manage saved charts & templates</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/editor')}
                  className="flex flex-col items-start px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">Advanced Editor</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">Full canvas & infographic design</span>
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
