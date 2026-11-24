"use client"

import React, { useState } from "react"
import {
  Sparkles,
  Globe,
  Compass,
  Check,
  ChevronDown,
  Zap,
  ImageIcon,
  Info,
  BarChart2,
  LayoutTemplate,
  ArrowUpRight,
} from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type ChatModelId =
  | "deepseek"
  | "deepseek-search"
  | "deepseek-brave"
  | "gemini-search"
  | "perplexity"

interface ModernChatHeaderBarProps {
  selectedModel: ChatModelId
  setSelectedModel: (model: ChatModelId) => void
  includeImages: boolean
  setIncludeImages: (include: boolean) => void
  aiCreditsRemaining: number
  aiCreditsLimit: number
  freeAiCreditsRemaining?: number
  purchasedAiCredits?: number
  onOpenUpgrade?: () => void
}

const MODEL_OPTIONS: Array<{
  id: ChatModelId
  name: string
  description: string
  renderIcon: (className?: string) => React.ReactNode
}> = [
  {
    id: "gemini-search",
    name: "Gemini Realtime",
    description: "Google search + real-time data",
    renderIcon: (cls) => <Sparkles className={cn("w-3.5 h-3.5 text-amber-500 shrink-0", cls)} />,
  },
  {
    id: "deepseek-search",
    name: "Deepseek Realtime",
    description: "Live web data enrichment",
    renderIcon: (cls) => <Sparkles className={cn("w-3.5 h-3.5 text-blue-500 shrink-0", cls)} />,
  },
  {
    id: "deepseek-brave",
    name: "DeepSeek Brave",
    description: "Brave web search engine",
    renderIcon: (cls) => <Compass className={cn("w-3.5 h-3.5 text-orange-500 shrink-0", cls)} />,
  },
  {
    id: "perplexity",
    name: "Perplexity Realtime",
    description: "Citation-grade live search",
    renderIcon: (cls) => <Globe className={cn("w-3.5 h-3.5 text-teal-500 shrink-0", cls)} />,
  },
  {
    id: "deepseek",
    name: "Deepseek Web",
    description: "Fast general chart generation",
    renderIcon: (cls) => <Globe className={cn("w-3.5 h-3.5 text-indigo-600 shrink-0", cls)} />,
  },
]

export function ModernChatHeaderBar({
  selectedModel,
  setSelectedModel,
  includeImages,
  setIncludeImages,
  aiCreditsRemaining,
  aiCreditsLimit,
  freeAiCreditsRemaining,
  purchasedAiCredits,
  onOpenUpgrade,
}: ModernChatHeaderBarProps) {
  const [modelOpen, setModelOpen] = useState(false)
  const [creditsOpen, setCreditsOpen] = useState(false)

  const currentModel =
    MODEL_OPTIONS.find((m) => m.id === selectedModel) || MODEL_OPTIONS[MODEL_OPTIONS.length - 1]

  const creditPercent =
    aiCreditsLimit > 0
      ? Math.max(0, Math.min(100, Math.round((aiCreditsRemaining / aiCreditsLimit) * 100)))
      : 0

  const isOutOfCredits = aiCreditsRemaining <= 0
  const isLowCredits = !isOutOfCredits && aiCreditsRemaining <= 2

  return (
    <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200/70 flex items-center gap-1.5 flex-shrink-0 antialiased">
      {/* 1. Compact Model Selector */}
      <Popover open={modelOpen} onOpenChange={setModelOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-7 px-2 flex-1 min-w-0 flex items-center justify-between gap-1.5 rounded-lg border bg-white text-xs font-medium text-slate-700 shadow-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              modelOpen
                ? "border-indigo-300 ring-2 ring-indigo-500/15 text-slate-900"
                : "border-slate-200/90 hover:border-slate-300 hover:bg-slate-50/70"
            )}
            title={`AI Engine: ${currentModel.name}`}
          >
            <span className="flex items-center gap-1.5 min-w-0">
              {currentModel.renderIcon()}
              <span className="truncate">{currentModel.name}</span>
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 text-slate-400 shrink-0 transition-transform duration-150",
                modelOpen && "rotate-180 text-indigo-600"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-64 p-1.5 bg-white border border-slate-200 shadow-lg rounded-xl z-50 font-sans"
        >
          <div className="px-2 py-1 mb-1 flex items-center justify-between border-b border-slate-100">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              AI Engine
            </span>
            <span className="text-[10px] font-medium text-slate-400">
              Standard credit rate
            </span>
          </div>
          <div className="space-y-0.5">
            {MODEL_OPTIONS.map((model) => {
              const isSelected = selectedModel === model.id
              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => {
                    setSelectedModel(model.id)
                    setModelOpen(false)
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-left transition-colors cursor-pointer",
                    isSelected
                      ? "bg-indigo-50/80 text-indigo-950"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {model.renderIcon()}
                    <div className="min-w-0">
                      <div className={cn("text-xs leading-tight truncate", isSelected ? "font-semibold" : "font-medium")}>
                        {model.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">
                        {model.description}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>

      {/* 2. Compact Web Images Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={includeImages}
        onClick={() => setIncludeImages(!includeImages)}
        title={
          includeImages
            ? "Web Images ON — Auto-enrich charts with logos & icons (click to turn off)"
            : "Web Images OFF — Click to auto-enrich charts with logos & icons"
        }
        className={cn(
          "h-7 px-2 rounded-lg border flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 shadow-sm",
          includeImages
            ? "bg-indigo-50/80 border-indigo-200/90 text-indigo-700 hover:bg-indigo-100/70"
            : "bg-white border-slate-200/90 text-slate-500 hover:border-slate-300 hover:text-slate-700"
        )}
      >
        <ImageIcon className="w-3.5 h-3.5 shrink-0" />
        <span
          className={cn(
            "relative inline-flex h-3.5 w-6 shrink-0 items-center rounded-full transition-colors",
            includeImages ? "bg-indigo-600" : "bg-slate-300"
          )}
        >
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full bg-white shadow-sm transition-transform",
              includeImages ? "translate-x-3" : "translate-x-0.5"
            )}
          />
        </span>
      </button>

      {/* 3. Compact Credits Badge + Usage Info Popover */}
      <Popover open={creditsOpen} onOpenChange={setCreditsOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-7 px-2 rounded-lg border flex items-center gap-1 text-xs font-semibold shrink-0 shadow-sm transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
              isOutOfCredits
                ? "bg-rose-50 text-rose-600 border-rose-200/90 hover:bg-rose-100/80"
                : isLowCredits
                ? "bg-amber-50 text-amber-700 border-amber-200/90 hover:bg-amber-100/80"
                : "bg-indigo-50/80 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100/70"
            )}
            title="Credits available — click for credit usage details"
          >
            <Zap className="w-3 h-3 fill-current shrink-0" />
            <span className="tabular-nums leading-none">
              {aiCreditsRemaining}/{aiCreditsLimit}
            </span>
            <Info className="w-3 h-3 opacity-65 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={6}
          className="w-72 p-3 bg-white border border-slate-200 shadow-lg rounded-xl z-50 font-sans space-y-3"
        >
          {/* Balance Summary */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "w-5 h-5 rounded-md flex items-center justify-center shrink-0",
                    isOutOfCredits
                      ? "bg-rose-50 text-rose-600"
                      : isLowCredits
                      ? "bg-amber-50 text-amber-600"
                      : "bg-indigo-50 text-indigo-600"
                  )}
                >
                  <Zap className="w-3 h-3 fill-current" />
                </div>
                <span className="text-xs font-semibold text-slate-800">
                  Credits Remaining
                </span>
              </div>
              <span
                className={cn(
                  "text-xs font-bold tabular-nums",
                  isOutOfCredits
                    ? "text-rose-600"
                    : isLowCredits
                    ? "text-amber-600"
                    : "text-indigo-700"
                )}
              >
                {aiCreditsRemaining} / {aiCreditsLimit}
              </span>
            </div>

            {/* Thin Usage Bar */}
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isOutOfCredits
                    ? "bg-rose-500"
                    : isLowCredits
                    ? "bg-amber-500"
                    : "bg-indigo-600"
                )}
                style={{ width: `${creditPercent}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {purchasedAiCredits && purchasedAiCredits > 0
                ? `${freeAiCreditsRemaining ?? 0} free monthly + ${purchasedAiCredits} purchased credits`
                : "Monthly AI credit quota"}
            </p>
          </div>

          {/* Credit Cost Breakdown */}
          <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Credit Usage Info
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <BarChart2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Chart Generate / Edit
              </span>
              <span className="font-semibold text-slate-800 tabular-nums">
                1 credit
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <LayoutTemplate className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Template / Format
              </span>
              <span className="font-semibold text-slate-800 tabular-nums">
                2 credits
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium min-w-0">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">Web Images ({includeImages ? "On" : "Off"})</span>
              </span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-md leading-none shrink-0">
                Included
              </span>
            </div>

            <div className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50/80 text-xs">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium min-w-0">
                {currentModel.renderIcon()}
                <span className="truncate">{currentModel.name}</span>
              </span>
              <span className="text-[11px] font-medium text-slate-500 shrink-0">
                Standard
              </span>
            </div>
          </div>

          {/* Upgrade / Top Up Action */}
          {onOpenUpgrade && (
            <button
              type="button"
              onClick={() => {
                setCreditsOpen(false)
                onOpenUpgrade()
              }}
              className="w-full h-8 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>{isOutOfCredits ? "Get More Credits" : "View Plans & Credits"}</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
            </button>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}
