"use client"

import React, { useState } from "react"
import {
  Settings,
  Sparkles,
  Globe,
  Brain,
  Check,
  ChevronDown,
  Zap,
  ImageIcon,
  SlidersHorizontal,
  Plus,
  Compass,
} from "lucide-react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

interface ChatSettingsPopoverProps {
  selectedModel: 'deepseek' | 'deepseek-search' | 'deepseek-brave' | 'gemini-search' | 'perplexity'
  setSelectedModel: (model: 'deepseek' | 'deepseek-search' | 'deepseek-brave' | 'gemini-search' | 'perplexity') => void
  includeImages: boolean
  setIncludeImages: (include: boolean) => void
  aiCreditsRemaining: number
  aiCreditsLimit: number
  onOpenUpgrade?: () => void
  iconVariant?: 'gear' | 'tune' | 'plus'
}

export function ChatSettingsPopover({
  selectedModel,
  setSelectedModel,
  includeImages,
  setIncludeImages,
  aiCreditsRemaining,
  aiCreditsLimit,
  onOpenUpgrade,
  iconVariant = 'gear',
}: ChatSettingsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setIsModelDropdownOpen(false)
    }
  }

  const getModelDetails = (model: string) => {
    switch (model) {
      case 'gemini-search':
        return {
          name: 'Gemini Realtime',
          icon: <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />,
        }
      case 'deepseek-search':
        return {
          name: 'Deepseek Realtime',
          icon: <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />,
        }
      case 'deepseek-brave':
        return {
          name: 'DeepSeek Brave',
          icon: <Compass className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />,
        }
      case 'perplexity':
        return {
          name: 'Perplexity Realtime',
          icon: <Globe className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />,
        }
      case 'deepseek':
      default:
        return {
          name: 'DeepSeek Chat',
          icon: <Brain className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />,
        }
    }
  }

  const currentModel = getModelDetails(selectedModel)

  const models: Array<'gemini-search' | 'deepseek-search' | 'deepseek-brave' | 'perplexity' | 'deepseek'> = [
    'gemini-search',
    'deepseek-search',
    'deepseek-brave',
    'perplexity',
    'deepseek',
  ]

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`p-1.5 rounded-lg border transition-all relative cursor-pointer group shadow-2xs ${
            isOpen
              ? 'text-indigo-600 bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
              : 'text-slate-600 hover:text-indigo-600 bg-slate-100/90 hover:bg-indigo-50/80 border-slate-200 hover:border-indigo-200'
          }`}
          title="AI Engine, Credits & Preferences"
        >
          {iconVariant === 'tune' ? (
            <SlidersHorizontal className={`w-3.5 h-3.5 transition-transform duration-300 stroke-[2.2] ${isOpen ? 'text-indigo-600 scale-110' : 'group-hover:scale-105'}`} />
          ) : iconVariant === 'plus' ? (
            <Plus className={`w-3.5 h-3.5 transition-transform duration-300 stroke-[2.5] ${isOpen ? 'rotate-45 text-indigo-600' : 'group-hover:rotate-90'}`} />
          ) : (
            <Settings className={`w-3.5 h-3.5 transition-transform duration-300 stroke-[2.2] ${isOpen ? 'rotate-45 text-indigo-600' : 'group-hover:rotate-45'}`} />
          )}
          {includeImages && (
            <span
              className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-600 ring-1 ring-white"
              title="Images enabled"
            />
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="top"
        sideOffset={8}
        className="w-72 bg-white border border-slate-200 shadow-xl rounded-2xl p-2.5 z-50 flex flex-col gap-2 font-sans"
      >
        {/* 1. Remaining AI Credits Card inside Dropdown */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100/90 shadow-2xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 fill-current" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">Credits Remaining</span>
              <span className="text-[10px] text-slate-400">Monthly AI quota</span>
            </div>
          </div>
          {onOpenUpgrade && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onOpenUpgrade()
              }}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-bold transition-all border shadow-2xs cursor-pointer ${
                aiCreditsRemaining <= 0
                  ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                  : aiCreditsRemaining <= 2
                  ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200/80 hover:bg-indigo-100'
              }`}
              title="Click to view subscription plans or upgrade"
            >
              <Zap className="w-3 h-3 text-current" />
              <span>{aiCreditsRemaining}/{aiCreditsLimit}</span>
            </button>
          )}
        </div>

        {/* 2. AI Model Selection in a Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/80 transition-colors cursor-pointer text-left shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-50/70 text-indigo-600 flex items-center justify-center flex-shrink-0">
                {currentModel.icon}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Engine</span>
                <span className="text-xs font-semibold text-slate-800">
                  {currentModel.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-[11px] font-medium">Select</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isModelDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                }`}
              />
            </div>
          </button>

          {/* Model Options List (Expanded when dropdown is opened) */}
          {isModelDropdownOpen && (
            <div className="mt-1.5 p-1 rounded-xl border border-slate-100 bg-slate-50/80 shadow-xs space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
              {models.map((modelKey) => {
                const item = getModelDetails(modelKey)
                const isSelected = selectedModel === modelKey
                return (
                  <button
                    key={modelKey}
                    type="button"
                    onClick={() => {
                      setSelectedModel(modelKey)
                      setIsModelDropdownOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium cursor-pointer rounded-lg transition-colors text-left ${
                      isSelected
                        ? 'bg-indigo-50/80 text-indigo-950 font-semibold'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {item.icon}
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 ml-2 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* 3. Auto-enrich with Web Images Switch */}
        <div
          onClick={() => setIncludeImages(!includeImages)}
          className="flex items-center justify-between p-2 rounded-xl border border-slate-100 hover:border-slate-200 bg-white hover:bg-slate-50/80 cursor-pointer transition-colors select-none shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800">Include Web Images</span>
              <span className="text-[10px] text-slate-400">Auto-enrich charts with logos & icons</span>
            </div>
          </div>
          <button
            type="button"
            aria-checked={includeImages}
            onClick={(e) => {
              e.stopPropagation()
              setIncludeImages(!includeImages)
            }}
            className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent outline-none transition-colors duration-200 ${
              includeImages ? 'bg-indigo-600' : 'bg-slate-200'
            }`}
            title={includeImages ? 'Auto-fetch images enabled' : 'Auto-fetch images disabled'}
          >
            <span
              className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs transition duration-200 ${
                includeImages ? 'translate-x-3.5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
