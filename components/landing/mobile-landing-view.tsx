"use client"

import React, { useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Menu, SquarePen, MoreVertical, Pencil, Check, Loader2, Palette, Eye, Maximize2,
  Cloud, Share2, ChevronDown, Copy, ExternalLink, Download, FileImage, FileCode,
  FileText, Trash2, ChartColumnBig, MessageCircleDashed, LineChart, PieChart,
  BarChart2, ArrowRight, Sparkles, Settings, Plus, Square, ArrowUp, Zap, Bot,
  Compass, Globe, Brain, ImageIcon, X, History, ToolCase, LayoutDashboard, Edit3
} from "lucide-react"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STANDARD_CHART_TYPES, THREE_D_CHART_TYPES } from "@/lib/chart-types"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { HistoryDropdown } from "@/components/history-dropdown"
import { ConfigSidebar } from "@/components/config-sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { PromptTemplate, ChatWindow } from "@/components/landing"
import { SaveChartDialog } from "@/components/ui/save-chart-dialog"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { useChartRename } from "@/lib/hooks/use-chart-rename"
import { useChartExport } from "@/lib/hooks/use-chart-export"
import { useSidebarInputContext } from "@/components/landing/sidebar-context"
import { dataService } from "@/lib/data-service"
import { toast } from "sonner"
import {
  parseDim, getAspectRatio, getChartTypeName,
  ChartAreaSkeleton, GenerationProgressView
} from "./landing-helpers"

export interface MobileLandingViewProps {
  user: any
  storeHydrated: boolean
  contentReady: boolean
  hasJSON: boolean
  chartData: any
  chartType: string
  setChartType: (val: any) => void
  isProcessing: boolean
  messages: any[]
  input: string
  setInput: (input: string) => void
  handleSend: (e?: React.FormEvent) => void
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handlePaste: () => void
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  isChatDisabled: boolean
  hasActiveChart: boolean
  showActiveBanner: boolean
  setShowActiveBanner: (show: boolean) => void
  selectedModel: 'deepseek' | 'deepseek-search' | 'deepseek-brave' | 'gemini-search' | 'perplexity'
  setSelectedModel: (m: any) => void
  includeImages: boolean
  setIncludeImages: (i: boolean) => void
  aiCreditsRemaining: number
  aiCreditsLimit: number
  isUpgradeOpen: boolean
  setIsUpgradeOpen: (open: boolean) => void
  isTemplateModalOpen: boolean
  setIsTemplateModalOpen: (open: boolean) => void
  currentChartState: any
  handleNewConversation: () => void
  handleResetChart: () => void
  activeConfig: any
  originalCloudDimensions: any
  currentSnapshotId: string | null
  renderedFormat: any
  showSaveChartDialog: boolean
  setShowSaveChartDialog: (open: boolean) => void
  saveChartDialogName: string
  isUpdate: boolean
  isSaving: boolean
  handleSaveChart: (name: string) => Promise<void>
  handleSaveToCloudClick: () => void
}

export function MobileLandingView({
  user,
  storeHydrated,
  contentReady,
  hasJSON,
  chartData,
  chartType,
  setChartType,
  isProcessing,
  messages,
  input,
  setInput,
  handleSend,
  handleInputChange,
  handlePaste,
  textareaRef,
  messagesEndRef,
  isChatDisabled,
  hasActiveChart,
  showActiveBanner,
  setShowActiveBanner,
  selectedModel,
  setSelectedModel,
  includeImages,
  setIncludeImages,
  aiCreditsRemaining,
  aiCreditsLimit,
  isUpgradeOpen,
  setIsUpgradeOpen,
  isTemplateModalOpen,
  setIsTemplateModalOpen,
  currentChartState,
  handleNewConversation,
  handleResetChart,
  activeConfig,
  originalCloudDimensions,
  currentSnapshotId,
  renderedFormat,
  showSaveChartDialog,
  setShowSaveChartDialog,
  saveChartDialogName,
  isUpdate,
  isSaving,
  handleSaveChart,
  handleSaveToCloudClick,
}: MobileLandingViewProps) {
  const router = useRouter()
  const sidebarContext = useSidebarInputContext()
  const rename = useChartRename()
  const exports = useChartExport()

  const [mobileActiveTab, setMobileActiveTab] = useState<'chart' | 'chat' | 'design' | 'history'>('chat')
  const [sandwichOpen, setSandwichOpen] = useState(false)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const [exportExpanded, setExportExpanded] = useState(false)
  const [shareExpanded, setShareExpanded] = useState(false)
  const [isSharingLink, setIsSharingLink] = useState(false)

  const { editorMode, currentTemplate, templateInBackground } = useTemplateStore()

  const userGreetingName = useMemo(() => {
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

  const handleCopyShareLink = async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.")
      return
    }
    try {
      setIsSharingLink(true)
      toast.loading("Generating share link...", { id: "share-link" })
      const response = await dataService.generateShareLink(currentSnapshotId)
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link")
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`
      await navigator.clipboard.writeText(shareUrl)
      toast.success("Share link copied to clipboard!", { id: "share-link" })
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" })
      console.error("Share error:", err)
    } finally {
      setIsSharingLink(false)
    }
  }

  const handleOpenShareLink = async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.")
      return
    }
    const newWindow = window.open("about:blank", "_blank")
    if (!newWindow) {
      toast.error("Pop-up blocked! Please allow popups for this site.")
      return
    }
    try {
      setIsSharingLink(true)
      toast.loading("Generating share link...", { id: "share-link" })
      const response = await dataService.generateShareLink(currentSnapshotId)
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link")
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`
      newWindow.location.href = shareUrl
      toast.success("Opened share link!", { id: "share-link" })
    } catch (err: any) {
      newWindow.close()
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" })
      console.error("Share error:", err)
    } finally {
      setIsSharingLink(false)
    }
  }

  return (
    <div className="fixed inset-0 w-full h-full bg-white dark:bg-slate-950 flex flex-col overflow-hidden font-sans">
      {/* Top Header (In-flow flex item - never covers content) */}
      <header className="w-full h-14 flex-shrink-0 z-40 bg-white dark:bg-slate-950 flex items-center justify-between px-3 xs:px-4 phab:px-5 relative">
        {/* Left: Sandwich Menu Icon */}
        <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
          <button
            onClick={() => setSandwichOpen(true)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors flex-shrink-0 text-slate-700 dark:text-slate-300 cursor-pointer"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Chart / Chat Segmented Pill Switcher (Bigger, Centered) */}
        {chartData?.datasets?.length > 0 && hasJSON && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center p-1 bg-slate-100 dark:bg-slate-800/90 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-xs z-10">
            <button
              onClick={() => setMobileActiveTab('chart')}
              className={`px-3 phab:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mobileActiveTab === 'chart'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Chart Preview"
            >
              <ChartColumnBig className="w-4 h-4" />
              <span className="hidden phab:inline">Chart</span>
            </button>
            <button
              onClick={() => setMobileActiveTab('chat')}
              className={`px-3 phab:px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                mobileActiveTab === 'chat'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="AI Chat"
            >
              <MessageCircleDashed className="w-4 h-4" />
              <span className="hidden phab:inline">Chat</span>
            </button>
          </div>
        )}

        {/* Right: New Chat + More Options */}
        <div className="flex items-center gap-1 xs:gap-1.5 flex-shrink-0">
          {/* New Chat Button (Pencil Icon) */}
          <button
            onClick={() => {
              handleNewConversation()
              setMobileActiveTab('chat')
            }}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition-colors flex-shrink-0 cursor-pointer"
            title="New Chat"
          >
            <SquarePen className="w-5 h-5" />
          </button>

          {/* More Options Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-700 dark:text-slate-300 transition-colors flex-shrink-0 cursor-pointer"
                title="More Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[270px] p-1.5 z-[100] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xl space-y-1">
              {/* File Name & Metadata Section */}
              <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/60 mb-1 space-y-0.5" onClick={(e) => e.stopPropagation()}>
                {rename.isRenaming && rename.canEditTitle ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      ref={rename.renameInputRef as any}
                      type="text"
                      value={rename.renameValue}
                      onChange={(e) => rename.setRenameValue(e.target.value)}
                      onKeyDown={rename.handleRenameKeyDown}
                      onBlur={() => rename.setIsRenaming(false)}
                      className="flex-1 min-w-0 font-bold text-slate-800 dark:text-slate-100 text-xs.5 bg-transparent border-b border-indigo-500 outline-none w-full px-0 pb-0.5 focus:border-indigo-600"
                      autoFocus
                      disabled={rename.isSavingRename}
                    />
                    <button
                      onClick={rename.handleSaveRename}
                      disabled={rename.isSavingRename}
                      className="p-1 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded text-emerald-600 dark:text-emerald-400 flex-shrink-0 flex items-center justify-center h-6 w-6"
                      title="Save"
                    >
                      {rename.isSavingRename ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-xs.5 truncate flex-1" title={rename.chartTitle}>
                      {rename.chartTitle}
                    </span>
                    {rename.canEditTitle && (
                      <button
                        onClick={() => rename.handleStartRename()}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex-shrink-0"
                        title="Rename"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium select-none leading-normal w-full">
                  {(() => {
                    const cfgW = parseDim(activeConfig?.width)
                    const cfgH = parseDim(activeConfig?.height)

                    let w = 800
                    let h = 600

                    if (editorMode === 'template') {
                      if (renderedFormat) {
                        w = renderedFormat.skeleton?.dimensions?.width || 800
                        h = renderedFormat.skeleton?.dimensions?.height || 600
                      } else {
                        const template = currentTemplate || templateInBackground
                        if (template) {
                          w = template.width
                          h = template.height
                        }
                      }
                    } else {
                      w = cfgW || (originalCloudDimensions ? parseDim(originalCloudDimensions.width) : null) || 800
                      h = cfgH || (originalCloudDimensions ? parseDim(originalCloudDimensions.height) : null) || 600
                    }

                    const aspect = getAspectRatio(w, h)

                    const leftLabel = (editorMode === 'template' && currentTemplate)
                      ? `Template - ${currentTemplate.name || "Template"}`
                      : `Chart - ${getChartTypeName(chartType)}`

                    return (
                      <>
                        <span className="truncate flex-1 min-w-0 text-left" title={leftLabel}>
                          {leftLabel}
                        </span>
                        <span className="flex-shrink-0 text-right font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                          {aspect} | {w}px × {h}px
                        </span>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* 1. Real Segmented Mode Toggle */}
              <div className="px-2.5 py-0.5 flex justify-center mb-0.5">
                <div className="flex w-full bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const templateStore = useTemplateStore.getState()
                      templateStore.setGenerateMode('chart')
                      templateStore.setEditorMode('chart')
                    }}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-full transition-colors text-center antialiased subpixel-antialiased ${
                      editorMode === 'chart'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Chart
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const templateStore = useTemplateStore.getState()
                      templateStore.setGenerateMode('template')
                      if (!templateStore.currentTemplate) {
                        templateStore.applyTemplate('template-1')
                      }
                      templateStore.setEditorMode('template')
                    }}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-full transition-colors text-center antialiased subpixel-antialiased ${
                      editorMode === 'template'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    Template
                  </button>
                </div>
              </div>

              <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800/80" />

              {/* 2. Real Select Dropdown for Chart Types */}
              <div className="px-2.5 py-1">
                <Select
                  value={chartType}
                  onValueChange={(val) => {
                    setChartType(val as any)
                  }}
                >
                  <SelectTrigger className="h-9 w-full text-xs font-semibold border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-between px-3 shadow-xs transition-all active:scale-95 antialiased">
                    <div className="truncate text-slate-700 dark:text-slate-300">
                      <SelectValue placeholder="Select Chart Type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="z-[110]">
                    {STANDARD_CHART_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-xs py-1.5">{type.label}</SelectItem>
                    ))}
                    <SelectSeparator />
                    {THREE_D_CHART_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value} className="text-xs py-1.5 font-medium text-blue-600 dark:text-blue-400">{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 3. Dynamic Chart Gallery or Show Guides Trigger */}
              {editorMode !== 'template' ? (
                <DropdownMenuItem
                  onClick={() => {
                    setMobileActiveTab('design')
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Chart Gallery</span>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('triggerToggleGuides'))
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  <Eye className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Show Guides</span>
                </DropdownMenuItem>
              )}

              {/* 3.5 Fullscreen Trigger */}
              <DropdownMenuItem
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('triggerFullscreen'))
                }}
                className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <Maximize2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Fullscreen</span>
              </DropdownMenuItem>

              {/* 4. Save Chart/Template to Cloud */}
              <DropdownMenuItem
                onSelect={handleSaveToCloudClick}
                className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
              >
                <Cloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Save to Cloud</span>
              </DropdownMenuItem>

              {/* 4.5 Share Collapsible Accordion */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  if (!currentSnapshotId) {
                    toast.error("Please save your chart to the cloud first to share.")
                    return
                  }
                  setShareExpanded(!shareExpanded)
                }}
                className="flex items-center justify-between w-full px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300 select-none active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Share</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${shareExpanded ? "transform rotate-180" : ""}`} />
              </DropdownMenuItem>

              {shareExpanded && currentSnapshotId && (
                <div className="pl-4 pr-1 py-1 space-y-0.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  <DropdownMenuItem
                    onClick={handleCopyShareLink}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Copy Link</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleOpenShareLink}
                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Open Link</span>
                  </DropdownMenuItem>
                </div>
              )}

              {/* 5. Export Collapsible Accordion */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setExportExpanded(!exportExpanded)
                }}
                className="flex items-center justify-between w-full px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold cursor-pointer text-slate-700 dark:text-slate-300 select-none active:scale-98 transition-all"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Export</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform duration-200 ${exportExpanded ? "transform rotate-180" : ""}`} />
              </DropdownMenuItem>

              {exportExpanded && (
                <div className="pl-4 pr-1 py-1 space-y-0.5 bg-slate-50 dark:bg-slate-900/50 rounded-lg animate-in fade-in slide-in-from-top-1 duration-200">
                  {editorMode === 'template' ? (
                    <>
                      {/* PNG Quality Options */}
                      <div className="px-2 py-1 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">PNG Image</div>
                      <DropdownMenuItem
                        onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'png', scale: 4 } }))}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-md text-xs font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-slate-800 dark:text-slate-200">Crystal Clear (4x)</span>
                        </div>
                        <span className="text-[8px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 px-1.5 py-0.5 rounded">UHD</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'png', scale: 2 } }))}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <FileImage className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-800 dark:text-slate-200">Standard (2x)</span>
                        </div>
                        <span className="text-[8px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">2K</span>
                      </DropdownMenuItem>

                      {/* JPEG Quality Options */}
                      <div className="px-2 pt-1.5 pb-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">JPEG Image</div>
                      <DropdownMenuItem
                        onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'jpeg', scale: 4 } }))}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md text-xs font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="text-slate-800 dark:text-slate-200">Crystal Clear (4x)</span>
                        </div>
                        <span className="text-[8px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded">UHD</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'jpeg', scale: 2 } }))}
                        className="flex items-center justify-between px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="text-slate-800 dark:text-slate-200">Standard (2x)</span>
                        </div>
                        <span className="text-[8px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 px-1.5 py-0.5 rounded">2K</span>
                      </DropdownMenuItem>

                      {/* Other */}
                      <div className="px-2 pt-1.5 pb-0.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Other</div>
                      <DropdownMenuItem
                        onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'html' } }))}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <FileCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Interactive HTML</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={exports.handleExportCSV}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>CSV Data</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem
                        onClick={() => exports.handleExport()}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <FileImage className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>PNG Image</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => exports.handleExportJPEG()}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <FileImage className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>JPEG Image</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={exports.handleExportHTML}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Interactive HTML</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={exports.handleExportCSV}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span>Export CSV</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </div>
              )}

              {/* 6. Reset / Clear Chart */}
              <DropdownMenuItem
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear the current workspace and chat?")) {
                    handleResetChart()
                    toast.success("Workspace cleared successfully")
                  }
                }}
                className="flex items-center gap-2 px-2.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg text-xs font-medium cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>Clear Workspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative flex flex-col overflow-hidden w-full bg-transparent">
        {/* Tab 1: Chart / Prompt */}
        {mobileActiveTab === 'chart' && (
          <div className="flex-1 p-3 flex flex-col relative w-full h-full">
            {(!storeHydrated || (!contentReady && hasJSON)) && (
              <div className="absolute inset-0 z-20 p-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm rounded-xl">
                <ChartAreaSkeleton />
              </div>
            )}
            {chartData?.datasets?.length > 0 && hasJSON ? (
              <div className="flex-1 h-full w-full relative">
                {isProcessing && (
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1 rounded-full border border-indigo-200/80 dark:border-indigo-800 shadow-md flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                    <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                      Updating chart...
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        useChatStore.getState().stopGeneration()
                        toast.info("Generation cancelled")
                      }}
                      className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 text-slate-600 dark:text-slate-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Square className="w-2 h-2 fill-current text-red-500" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
                <ChartPreview
                  onToggleSidebar={() => {}}
                  isSidebarCollapsed={true}
                  onToggleLeftSidebar={() => {}}
                  isLeftSidebarCollapsed={true}
                />
              </div>
            ) : isProcessing ? (
              <GenerationProgressView />
            ) : storeHydrated ? (
              <PromptTemplate
                size="compact"
                onSampleClick={(template) => {
                  setInput(template)
                  sidebarContext.setChatInput(template)
                  setMobileActiveTab('chat')
                }}
                isTemplateModalOpen={isTemplateModalOpen}
                setIsTemplateModalOpen={setIsTemplateModalOpen}
              />
            ) : null}
          </div>
        )}

        {/* Tab 2: AI Chat */}
        {mobileActiveTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full overflow-hidden w-full relative">
            {isConversationEmpty ? (
              /* Gemini Hero Empty State */
              <div className="flex-1 overflow-y-auto w-full px-4 py-6 pb-28 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
                {/* Glowing 4-pointed Gemini Star */}
                <div className="relative mb-5 flex items-center justify-center">
                  <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-sky-400/20 via-indigo-500/25 to-pink-500/20 blur-xl animate-pulse pointer-events-none" />
                  <div className="relative w-14 h-14 rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800 shadow-lg shadow-indigo-500/5 flex items-center justify-center backdrop-blur-md">
                    <svg
                      className="w-8 h-8"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <defs>
                        <linearGradient id="geminiStarGradMobile" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="35%" stopColor="#818cf8" />
                          <stop offset="70%" stopColor="#c084fc" />
                          <stop offset="100%" stopColor="#f472b6" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
                        fill="url(#geminiStarGradMobile)"
                      />
                    </svg>
                  </div>
                </div>

                {/* Personalized Greeting */}
                <h1 className="text-xl xs:text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-1.5">
                  Let's Jump in{userGreetingName ? (
                    <>
                      ,{" "}
                      <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        {userGreetingName}
                      </span>
                    </>
                  ) : ""}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-6 leading-relaxed">
                  Type or Select a prompt
                </p>

                {/* Starter Prompt Chips */}
                <TooltipProvider delayDuration={100}>
                  <div className="w-full flex flex-col gap-2 max-w-xs">
                    {[
                      {
                        label: "Quarterly Revenue Growth",
                        icon: LineChart,
                        prompt: "Create a quarterly revenue growth line chart across Q1 to Q4",
                      },
                      {
                        label: "Market Share Breakdown",
                        icon: PieChart,
                        prompt: "Create a market share breakdown donut chart for top 5 cloud providers",
                      },
                      {
                        label: "Customer Acquisition Funnel",
                        icon: BarChart2,
                        prompt: "Create a funnel chart of customer acquisition stages with conversion drop-offs",
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
                                sidebarContext.setChatInput(item.prompt)
                                if (textareaRef.current) {
                                  textareaRef.current.focus()
                                }
                              }}
                              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-xs transition-all active:scale-[0.98] group cursor-pointer"
                              title={item.prompt}
                            >
                              <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/50 transition-colors flex-shrink-0">
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-medium text-slate-700 dark:text-slate-200 flex-1 truncate">
                                {item.label}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
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
              </div>
            ) : (
              /* Scrollable messages area */
              <div className="flex-1 min-h-0 w-full h-full relative">
                <ChatWindow
                  messages={messages}
                  input={input}
                  setInput={setInput}
                  onSend={handleSend}
                  isProcessing={isProcessing}
                  hasActiveChart={hasActiveChart}
                  showActiveBanner={showActiveBanner}
                  setShowActiveBanner={setShowActiveBanner}
                  isChatDisabled={isChatDisabled}
                  disabledMessage="Type a message or load a template below to get started."
                  messagesEndRef={messagesEndRef}
                  textareaRef={textareaRef}
                  currentChartState={currentChartState}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Customize (ConfigSidebar) */}
        {mobileActiveTab === 'design' && (
          <div className="flex-1 h-full w-full overflow-y-auto bg-slate-50/50 dark:bg-slate-950/50 pb-4">
            {chartData?.datasets?.length > 0 && hasJSON ? (
              <ConfigSidebar />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 border border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <Settings className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Customize Design</h3>
                <p className="text-[11px] xs:text-xs text-slate-500 mt-2 max-w-xs leading-relaxed">
                  Once a chart is generated with AI Chat, you can use this tab to modify slices, toggles, colors, and design templates.
                </p>
                <Button
                  onClick={() => setMobileActiveTab('chat')}
                  className="mt-4 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 hover:scale-102 transition-all text-white text-xs font-semibold rounded-xl px-4 py-2"
                >
                  Go to AI Chat
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: History (HistoryDropdown) */}
        {mobileActiveTab === 'history' && (
          <div className="flex-1 h-full w-full overflow-y-auto bg-white dark:bg-slate-950">
            <div className="p-1">
              <HistoryDropdown
                variant="sidebar"
                onConversationRestored={() => {
                  setMobileActiveTab('chart')
                  setSandwichOpen(false)
                }}
              />
            </div>
          </div>
        )}
      </main>

      {/* Subtle gradient backdrop fade behind floating pill */}
      {mobileActiveTab === 'chat' && (
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/85 to-transparent dark:from-slate-950 dark:via-slate-950/85 dark:to-transparent pointer-events-none z-30" />
      )}

      {/* Floating Bottom Capsule Input Pill */}
      {mobileActiveTab === 'chat' && (
        <div className="fixed bottom-3.5 left-3.5 right-3.5 z-40 max-w-lg mx-auto">
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/30 transition-shadow"
          >
            {/* Plus Button for Action Sheet */}
            <button
              type="button"
              onClick={() => setIsActionSheetOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all flex-shrink-0 active:scale-95"
              title="Tools & Settings"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInputChange}
              onPaste={handlePaste}
              rows={1}
              placeholder={
                isChatDisabled
                  ? "Attach a template to start..."
                  : hasActiveChart
                  ? "Modify (colors, title, data)..."
                  : "Ask Chartography..."
              }
              disabled={isProcessing || isChatDisabled}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  if (!isChatDisabled && input.trim()) {
                    handleSend(e)
                  }
                }
              }}
              className="flex-1 bg-transparent py-2 px-1 text-xs xs:text-sm focus:outline-none resize-none max-h-[100px] min-h-[36px] leading-relaxed text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Send / Action Button */}
            {isProcessing ? (
              <button
                type="button"
                onClick={() => {
                  useChatStore.getState().stopGeneration()
                  toast.info("Generation cancelled")
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 bg-red-500 hover:bg-red-600 text-white shadow-xs cursor-pointer"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim() || isChatDisabled}
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all active:scale-95 ${
                  input.trim() && !isChatDisabled
                    ? "bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </form>
        </div>
      )}

      {/* Floating Quick Switch Pill when viewing chart */}
      {mobileActiveTab === 'chart' && chartData?.datasets?.length > 0 && hasJSON && (
        <div className="fixed bottom-4 right-4 z-40">
          <button
            type="button"
            onClick={() => {
              setMobileActiveTab('chat')
              setTimeout(() => textareaRef.current?.focus(), 100)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/25 active:scale-95 transition-all text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Modify with AI</span>
          </button>
        </div>
      )}

      {/* Action Sheet Backdrop */}
      {isActionSheetOpen && (
        <div
          className="fixed inset-0 z-[80] bg-slate-900/50 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
          onClick={() => setIsActionSheetOpen(false)}
        />
      )}

      {/* Action Sheet Modal / Bottom Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[85] max-w-lg mx-auto bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-xl shadow-xl p-3.5 pb-safe transition-transform duration-200 ease-out transform ${
          isActionSheetOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-tight">
            Tools & Preferences
          </span>
          <button
            type="button"
            onClick={() => setIsActionSheetOpen(false)}
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options List */}
        <div className="space-y-2">
          {/* Remaining AI Credits Card */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Credits Remaining</span>
                <span className="text-[10px] text-slate-400">Monthly AI quota</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsActionSheetOpen(false)
                setIsUpgradeOpen(true)
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
          </div>

          {/* AI Model Dropdown Row */}
          <div className="flex items-center justify-between py-2 px-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">AI Model</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Select model engine</span>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 py-1.5 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs cursor-pointer"
                >
                  <span className="max-w-[115px] truncate">
                    {selectedModel === 'gemini-search'
                      ? 'Gemini Realtime'
                      : selectedModel === 'deepseek-search'
                      ? 'Deepseek Realtime'
                      : selectedModel === 'deepseek-brave'
                      ? 'DeepSeek Brave'
                      : selectedModel === 'perplexity'
                      ? 'Perplexity Realtime'
                      : 'DeepSeek Chat'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg p-1 z-[120]">
                <DropdownMenuItem
                  onClick={() => setSelectedModel('gemini-search')}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>Gemini Realtime</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedModel('deepseek-search')}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <span>Deepseek Realtime</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedModel('deepseek-brave')}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                >
                  <Compass className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                  <span>DeepSeek Brave</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedModel('perplexity')}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                >
                  <Globe className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  <span>Perplexity Realtime</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setSelectedModel('deepseek')}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200"
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
                  <span>DeepSeek Chat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Auto-enrich with images toggle */}
          <div className="flex items-center justify-between py-2 px-2.5 rounded-md border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Include Web Images</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Auto-enrich charts with logos and icons</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIncludeImages(!includeImages)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${
                includeImages ? "bg-indigo-600 dark:bg-indigo-500" : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                  includeImages ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Sandwich Backdrop overlay */}
      {sandwichOpen && (
        <div
          className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-xs transition-opacity duration-150 animate-in fade-in"
          onClick={() => setSandwichOpen(false)}
        />
      )}

      {/* Sandwich Drawer Window */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-[100] w-[85vw] max-w-[360px] bg-white dark:bg-slate-950 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col shadow-2xl transition-transform duration-150 ease-out transform ${
          sandwichOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Chartography.in</span>
          </div>
          <button
            onClick={() => setSandwichOpen(false)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Drawer Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Navigation Options */}
          <div className="space-y-2">
            {/* Active Preview */}
            <button
              onClick={() => {
                setMobileActiveTab('chart')
                setSandwichOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                mobileActiveTab === 'chart'
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-100/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <BarChart2 className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-xs xs:text-sm">Active Preview</span>
            </button>

            {/* AI Copilot Chat */}
            <button
              onClick={() => {
                setMobileActiveTab('chat')
                setSandwichOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                mobileActiveTab === 'chat'
                  ? 'bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 font-semibold border-indigo-100/30'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <MessageCircleDashed className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-xs xs:text-sm">AI Conversation</span>
            </button>

            {/* New Chat */}
            <button
              onClick={() => {
                handleNewConversation()
                setMobileActiveTab('chat')
                setSandwichOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-left transition-all active:scale-98 text-slate-700 dark:text-slate-300"
            >
              <SquarePen className="w-5 h-5 text-slate-500 dark:text-slate-400 flex-shrink-0" />
              <span className="font-bold text-xs xs:text-sm">New Chat</span>
            </button>

            {/* History */}
            <button
              onClick={() => {
                setMobileActiveTab('history')
                setSandwichOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                mobileActiveTab === 'history'
                  ? 'bg-slate-100/80 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <History className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-xs xs:text-sm">History</span>
            </button>

            {/* Customize Tools */}
            <button
              onClick={() => {
                setMobileActiveTab('design')
                setSandwichOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 border border-transparent rounded-xl text-left transition-all active:scale-98 ${
                mobileActiveTab === 'design'
                  ? 'bg-slate-100/80 dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-slate-900/50 text-slate-700 dark:text-slate-300'
              }`}
            >
              <ToolCase className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-xs xs:text-sm">Customize Tools</span>
            </button>

            {/* Board */}
            <button
              onClick={() => {
                router.push('/board')
                setSandwichOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-left transition-all active:scale-98 text-slate-700 dark:text-slate-300"
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-xs xs:text-sm">Board</span>
            </button>

            {/* Advanced Editor */}
            <button
              onClick={() => {
                router.push('/editor')
                setSandwichOpen(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900/50 rounded-xl text-left transition-all active:scale-98 text-slate-700 dark:text-slate-300"
            >
              <Edit3 className="w-5 h-5 flex-shrink-0 text-slate-500 dark:text-slate-400" />
              <span className="font-bold text-xs xs:text-sm">Advanced Editor</span>
            </button>
          </div>
        </div>

        {/* Profile Footer - Always Fixed at Bottom */}
        <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-950 flex-shrink-0">
          <div className="flex items-center bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-200/50 dark:border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <SimpleProfileDropdown size="sm" />
              <span className="block font-semibold text-slate-700 dark:text-slate-200 text-xs truncate">{user?.email || 'Guest Session'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog Popup for Mobile Viewport */}
      <SaveChartDialog
        open={showSaveChartDialog}
        defaultName={saveChartDialogName}
        isUpdate={isUpdate}
        isSaving={isSaving}
        onSave={handleSaveChart}
        onCancel={() => setShowSaveChartDialog(false)}
      />

      {/* Upgrade Pro Dialog for Mobile Viewport */}
      <UpgradeProDialog
        open={isUpgradeOpen}
        onOpenChange={setIsUpgradeOpen}
        featureHighlight="ai"
        title="Need More AI Credits?"
        description={`You have ${aiCreditsRemaining} AI credits remaining of your monthly ${aiCreditsLimit} limit. Upgrade to Pro for 50 credits/month.`}
      />
    </div>
  )
}
