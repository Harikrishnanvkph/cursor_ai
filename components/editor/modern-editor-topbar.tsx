"use client"

import React, { useState, useEffect, useMemo, memo } from "react"
import Link from "next/link"
import { useStore } from "zustand"
import { useShallow } from "zustand/react/shallow"
import {
  ChevronDown,
  Check,
  Undo2,
  Redo2,
  Pencil,
  Loader2,
  Download,
  Ellipsis,
  Upload,
  Sparkles,
  FileImage,
  ImageIcon,
  FileCode,
  FileText,
  BarChart2,
  Layers,
  Save,
  Trash2,
  Share2,
  Copy,
  ExternalLink,
  Plus,
  SquarePen,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { ChartTypeSelector } from "@/components/chart-preview/chart-type-selector"
import { PublishStyleDialog } from "@/components/chart-style-gallery/publish-dialog"
import { UpdatePresetDialog } from "@/components/chart-style-gallery/update-preset-dialog"
import { useAuth } from "@/components/auth/AuthProvider"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore, ensureDefaultFormatSelected } from "@/lib/stores/format-gallery-store"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { dataService } from "@/lib/data-service"
import type { useZoomPan } from "@/lib/hooks/use-zoom-pan"
import type { useChartRename } from "@/lib/hooks/use-chart-rename"
import type { useChartExport } from "@/lib/hooks/use-chart-export"

interface ModernEditorTopBarProps {
  activeApp?: "editor" | "aichat"
  chartType: string
  onChartTypeChange: (type: string) => void
  chartContainerRef: React.RefObject<HTMLDivElement | null>
  rename: ReturnType<typeof useChartRename>
  zoomPan: ReturnType<typeof useZoomPan>
  exports: ReturnType<typeof useChartExport>
  hasJSON: boolean
  hasData: boolean
  isSaving: boolean
  isSharingLink: boolean
  currentSnapshotId: string | null
  onSaveClick: () => void
  onClearClick: () => void
  onCopyShareLink: () => void
  onOpenShareLink: () => void
  onNewChatClick?: () => void
}

export const ModernEditorTopBar = memo(function ModernEditorTopBar({
  activeApp = "editor",
  chartType,
  onChartTypeChange,
  rename,
  exports,
  hasJSON,
  hasData,
  isSaving,
  isSharingLink,
  currentSnapshotId,
  onSaveClick,
  onClearClick,
  onCopyShareLink,
  onOpenShareLink,
  onNewChatClick,
}: ModernEditorTopBarProps) {
  const { user } = useAuth()

  const { editPresetId, isBuiltInPreset, presetMetadata } = useChartStyleStore(
    useShallow(s => ({
      editPresetId: s.editPresetId,
      isBuiltInPreset: s.isBuiltInPreset,
      presetMetadata: s.presetMetadata,
    }))
  )

  const { editorMode, setEditorMode, shouldShowTemplate } = useTemplateStore(
    useShallow(s => ({
      editorMode: s.editorMode,
      setEditorMode: s.setEditorMode,
      shouldShowTemplate: s.shouldShowTemplate,
    }))
  )

  const { selectedFormatId, selectedFormatSnapshot, formats, userFormats } = useFormatGalleryStore(
    useShallow(s => ({
      selectedFormatId: s.selectedFormatId,
      selectedFormatSnapshot: s.selectedFormatSnapshot,
      formats: s.formats,
      userFormats: s.userFormats,
    }))
  )

  const { undo: temporalUndo, redo: temporalRedo, pastStates, futureStates } = useStore(useChartStore.temporal)
  const canUndo = pastStates.length > 0
  const canRedo = futureStates.length > 0

  const [publishDialogOpen, setPublishDialogOpen] = useState(false)

  const isTemplateView = shouldShowTemplate() || (editorMode === "template" && !!selectedFormatId)

  const activeFormat = useMemo(() => {
    if (!selectedFormatId) return null
    return selectedFormatSnapshot || [...formats, ...userFormats].find(f => f.id === selectedFormatId) || null
  }, [selectedFormatId, selectedFormatSnapshot, formats, userFormats])

  // Keyboard shortcuts for Undo / Redo in Chart mode (TemplateChartPreview registers its own listener in template view)
  useEffect(() => {
    if (isTemplateView || !hasData) return
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault()
          if (e.shiftKey) {
            temporalRedo()
          } else {
            temporalUndo()
          }
        } else if (e.key === "y") {
          e.preventDefault()
          temporalRedo()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isTemplateView, hasData, temporalUndo, temporalRedo])

  const triggerPngExport = (scale: number) => {
    if (isTemplateView) {
      window.dispatchEvent(new CustomEvent("triggerTemplateExport", { detail: { format: "png", scale } }))
    } else {
      exports.handleExport(scale)
    }
  }

  const triggerJpegExport = (scale: number) => {
    if (isTemplateView) {
      window.dispatchEvent(new CustomEvent("triggerTemplateExport", { detail: { format: "jpeg", scale } }))
    } else {
      exports.handleExportJPEG(scale)
    }
  }

  const triggerHtmlExport = () => {
    if (isTemplateView) {
      window.dispatchEvent(new CustomEvent("triggerTemplateExport", { detail: { format: "html" } }))
    } else {
      exports.handleExportHTML()
    }
  }

  const controlsDisabled = !hasData
  const hasActiveChart = hasJSON && hasData

  return (
    <header className="h-[52px] min-h-[52px] px-3 lg:px-4 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2 lg:gap-4 flex-shrink-0 z-30 select-none w-full min-w-0 antialiased">
      {/* ════════════════════════════════════════════════════════════════
          ZONE 1 — LEFT: App Switcher, Mode Toggle & Chart Type Selector
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Editor Switcher Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-8 px-2 flex items-center gap-2 rounded-lg border border-transparent hover:border-slate-200/80 hover:bg-slate-100/70 transition-colors group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 flex-shrink-0"
              title="Switch View"
            >
              <img
                src="/images/aichartor-icon-logo.png"
                alt="AIChartor"
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className="hidden lg:inline text-sm font-semibold tracking-tight text-slate-800 whitespace-nowrap">
                {activeApp === "aichat" ? "AI Chart" : "Advanced Editor"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="w-64 p-1.5 rounded-xl bg-white border border-slate-200/90 shadow-lg z-50"
          >
            {activeApp === "aichat" ? (
              <>
                <DropdownMenuItem className="flex items-start justify-between px-3 py-2.5 rounded-lg cursor-default bg-indigo-50/70 text-indigo-700">
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="text-sm font-semibold leading-tight">AI Chart</span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Create charts with AI prompts
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-200/70" />

                <DropdownMenuItem asChild>
                  <Link
                    href="/editor"
                    prefetch={false}
                    className="flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors w-full"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 leading-tight">Advanced Editor</span>
                      <span className="text-xs text-slate-500 font-normal leading-normal">
                        Full canvas & infographic design
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/board"
                    prefetch={false}
                    className="flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors w-full"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 leading-tight">Dashboard</span>
                      <span className="text-xs text-slate-500 font-normal leading-normal">
                        Manage saved charts & templates
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem className="flex items-start justify-between px-3 py-2.5 rounded-lg cursor-default bg-indigo-50/70 text-indigo-700">
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="text-sm font-semibold leading-tight">Advanced Editor</span>
                    <span className="text-xs text-slate-500 font-normal leading-normal">
                      Full canvas & infographic design
                    </span>
                  </div>
                  <Check className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-slate-200/70" />

                <DropdownMenuItem asChild>
                  <Link
                    href="/aichat"
                    prefetch={false}
                    className="flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors w-full"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 leading-tight">AI Chart</span>
                      <span className="text-xs text-slate-500 font-normal leading-normal">
                        Create charts with AI prompts
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild>
                  <Link
                    href="/board"
                    prefetch={false}
                    className="flex items-start justify-between px-3 py-2.5 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors w-full"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 leading-tight">Dashboard</span>
                      <span className="text-xs text-slate-500 font-normal leading-normal">
                        Manage saved charts & templates
                      </span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveChart && (
          <>
            <div className="h-4 w-px bg-slate-200/80 mx-0.5 flex-shrink-0" />

            {/* Chart / Template Toggle & Chart Type Dropdown */}
            <div
              className={cn(
                "flex items-center gap-1.5 flex-shrink-0",
                controlsDisabled && "opacity-40 pointer-events-none select-none"
              )}
            >
              {/* Chart / Template Segmented Control — exact h-8 */}
              <div
                role="tablist"
                aria-label="Editor mode"
                className="h-8 p-[3px] flex items-center bg-slate-100 rounded-lg border border-slate-200/80"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorMode === "chart"}
                  disabled={controlsDisabled}
                  onClick={() => setEditorMode("chart")}
                  className={cn(
                    "h-full px-2.5 lg:px-3 text-xs leading-none rounded-[6px] flex items-center transition-colors duration-150 cursor-pointer",
                    editorMode === "chart"
                      ? "bg-white text-slate-900 font-semibold ring-1 ring-slate-200/90"
                      : "bg-transparent text-slate-600 hover:text-slate-900 font-medium"
                  )}
                >
                  Chart
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={editorMode === "template"}
                  disabled={controlsDisabled}
                  onClick={() => {
                    const templateStore = useTemplateStore.getState()
                    const formatStore = useFormatGalleryStore.getState()
                    if (!formatStore.selectedFormatId) {
                      ensureDefaultFormatSelected(chartType || "bar")
                      useUIStore.getState().setActiveSidebarTab("templates")
                    }
                    templateStore.setGenerateMode("format")
                    setEditorMode("template")
                  }}
                  className={cn(
                    "h-full px-2.5 lg:px-3 text-xs leading-none rounded-[6px] flex items-center transition-colors duration-150 cursor-pointer",
                    editorMode === "template"
                      ? "bg-white text-slate-900 font-semibold ring-1 ring-slate-200/90"
                      : "bg-transparent text-slate-600 hover:text-slate-900 font-medium"
                  )}
                >
                  Template
                </button>
              </div>

              {/* Chart Type Selector — matching h-8 modern variant */}
              <ChartTypeSelector
                value={chartType}
                onChange={onChartTypeChange}
                variant="modern"
                disabled={controlsDisabled}
              />
            </div>
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          ZONE 2 — CENTER: Document Title & Inline Rename
      ════════════════════════════════════════════════════════════════ */}
      {hasActiveChart && (
        <div className="hidden sm:flex items-center justify-center min-w-0 flex-1 px-1 lg:px-3 overflow-hidden">
          {rename.isRenaming && rename.canEditTitle ? (
            <div className="flex items-center gap-1 w-full max-w-[320px] min-w-0">
              <input
                ref={rename.renameInputRef as any}
                type="text"
                value={rename.renameValue}
                onChange={e => rename.setRenameValue(e.target.value)}
                onKeyDown={rename.handleRenameKeyDown}
                onBlur={() => rename.setIsRenaming(false)}
                className="h-8 flex-1 min-w-0 font-semibold text-slate-900 text-[13px] bg-slate-50 border border-indigo-400 rounded-lg px-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20"
                disabled={rename.isSavingRename}
              />
              <button
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={rename.handleSaveRename}
                disabled={rename.isSavingRename}
                className="h-8 w-8 flex items-center justify-center hover:bg-emerald-50 rounded-lg text-emerald-600 flex-shrink-0 cursor-pointer"
                title="Save Title"
              >
                {rename.isSavingRename ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ) : rename.canEditTitle ? (
            <button
              type="button"
              onClick={rename.handleStartRename}
              className="group h-8 px-2.5 flex items-center gap-1.5 min-w-0 max-w-full rounded-lg hover:bg-slate-100/80 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={`Click to rename (${rename.chartTitle})`}
            >
              <span className="font-semibold text-slate-800 text-[13px] truncate">
                {rename.chartTitle}
              </span>
              <Pencil className="h-3 w-3 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-slate-600 transition-opacity flex-shrink-0" />
            </button>
          ) : (
            <span className="font-medium text-slate-400 text-[13px] truncate px-2">
              {rename.chartTitle}
            </span>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          ZONE 3 — RIGHT: Undo/Redo, + Add / New Chat, Save, Share, Export, Overflow & Profile
      ════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-end gap-1.5 flex-shrink-0">
        {hasActiveChart && (
          <>
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => temporalUndo()}
                disabled={!hasData || !canUndo}
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  !hasData || !canUndo
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Undo2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => temporalRedo()}
                disabled={!hasData || !canRedo}
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
                className={cn(
                  "h-8 w-8 flex items-center justify-center rounded-lg text-slate-600 transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500",
                  !hasData || !canRedo
                    ? "opacity-30 cursor-not-allowed"
                    : "hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Redo2 className="w-4 h-4" />
              </button>
            </div>
            <div className="h-4 w-px bg-slate-200/80 mx-0.5 flex-shrink-0" />
          </>
        )}

        {/* Add Dataset / Group (Editor when active) or New Chat (AI Chat always visible) */}
        {activeApp === "aichat" ? (
          <button
            type="button"
            onClick={onNewChatClick}
            className={cn(
              hasActiveChart ? "hidden lg:inline-flex" : "inline-flex",
              "h-8 px-2.5 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium text-xs transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            )}
            title="Start a new AI chart conversation"
          >
            <SquarePen className="w-3.5 h-3.5 text-slate-600 shrink-0" strokeWidth={1.8} />
            <span>New Chat</span>
          </button>
        ) : hasActiveChart ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={!hasJSON}
                className="hidden lg:inline-flex h-8 px-2.5 flex-shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium text-xs transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                title={!hasJSON ? "Create a chart first to add datasets or groups" : "Add Single or Grouped Chart"}
              >
                <Plus className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Add</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 z-50 bg-white border border-slate-200/90 shadow-lg rounded-xl p-1.5">
              <DropdownMenuItem
                onClick={() => window.dispatchEvent(new CustomEvent("openAddDatasetModal"))}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs cursor-pointer font-medium hover:bg-slate-50 rounded-lg text-slate-700"
              >
                <BarChart2 className="h-4 w-4 text-indigo-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Single Chart</span>
                  <span className="text-[11px] text-slate-500">Add dataset to chart</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.dispatchEvent(new CustomEvent("openNewGroupModal"))}
                className="flex items-center gap-2.5 px-2.5 py-2 text-xs cursor-pointer font-medium hover:bg-slate-50 rounded-lg text-slate-700"
              >
                <Layers className="h-4 w-4 text-violet-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-800">Grouped Chart</span>
                  <span className="text-[11px] text-slate-500">Create a new chart group</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}

        {hasActiveChart && (
          <>
            {/* Save */}
            <button
          type="button"
          onClick={onSaveClick}
          disabled={!hasJSON || isSaving}
          className="h-8 px-2.5 lg:px-3 flex-shrink-0 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium text-xs transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          title="Save chart to online database"
        >
          {isSaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
          ) : (
            <Save className="w-3.5 h-3.5 text-slate-600 shrink-0" />
          )}
          <span className="hidden md:inline">Save</span>
        </button>

        {/* Share Quick Icon (xl+; also always in Document Menu below) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isSharingLink || !currentSnapshotId}
              className="hidden xl:flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors duration-150 disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title={!currentSnapshotId ? "Save chart first to share" : "Share chart link"}
              aria-label="Share"
            >
              {isSharingLink ? (
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              ) : (
                <Share2 className="w-4 h-4" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 z-50 bg-white border border-slate-200/90 shadow-lg rounded-xl p-1.5">
            <DropdownMenuItem
              onClick={onCopyShareLink}
              className="flex items-center gap-2 px-2.5 py-2 text-xs cursor-pointer font-medium hover:bg-slate-50 rounded-lg text-slate-700"
            >
              <Copy className="h-3.5 w-3.5 text-slate-500" />
              <span>Copy Share Link</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onOpenShareLink}
              className="flex items-center gap-2 px-2.5 py-2 text-xs cursor-pointer font-medium hover:bg-slate-50 rounded-lg text-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
              <span>Open Share Link</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-slate-200/80 mx-0.5 flex-shrink-0" />

        {/* Export Primary CTA — single bold brand accent */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={controlsDisabled}
              className="h-8 px-3 lg:px-3.5 flex-shrink-0 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
              title="Export Image / Data"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Export</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 p-1.5 z-[100] rounded-xl shadow-lg border-slate-200/90">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {isTemplateView ? (activeFormat ? "Export Format" : "Export Template") : "Export Chart"}
            </div>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                <FileImage className="h-4 w-4 text-indigo-600" />
                <span>PNG Image</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 p-1.5 z-[110]">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  PNG Quality
                </div>
                <DropdownMenuItem
                  onClick={() => triggerPngExport(4)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-indigo-50"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">Crystal Clear (4x)</span>
                      <span className="text-[10px] text-slate-500">Maximum clarity · Print-ready</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded shrink-0">
                    UHD
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => triggerPngExport(3)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">High Quality (3x)</span>
                      <span className="text-[10px] text-slate-500">Very sharp · Presentations & 4K</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">
                    3K
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => triggerPngExport(2)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-slate-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">Enhanced (2x)</span>
                      <span className="text-[10px] text-slate-500">Crisp · Web & social</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                    2K
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => triggerPngExport(1)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <FileImage className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">Normal (1x)</span>
                      <span className="text-[10px] text-slate-500">Standard resolution · Light size</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                    1x
                  </span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100">
                <ImageIcon className="h-4 w-4 text-amber-600" />
                <span>JPEG Image</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-64 p-1.5 z-[110]">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  JPEG Quality
                </div>
                <DropdownMenuItem
                  onClick={() => triggerJpegExport(4)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-amber-50"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">Crystal Clear (4x)</span>
                      <span className="text-[10px] text-slate-500">Maximum clarity · Print-ready</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded shrink-0">
                    UHD
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => triggerJpegExport(3)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-blue-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">High Quality (3x)</span>
                      <span className="text-[10px] text-slate-500">Very sharp · Presentations & 4K</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shrink-0">
                    3K
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => triggerJpegExport(2)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-slate-600 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">Enhanced (2x)</span>
                      <span className="text-[10px] text-slate-500">Crisp · Web & email</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded shrink-0">
                    2K
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => triggerJpegExport(1)}
                  className="flex items-center justify-between py-2 cursor-pointer focus:bg-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-slate-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-xs text-slate-900">Normal (1x)</span>
                      <span className="text-[10px] text-slate-500">Standard resolution · Small file</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded shrink-0">
                    1x
                  </span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator className="my-1" />

            <DropdownMenuItem
              onClick={triggerHtmlExport}
              className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100"
            >
              <FileCode className="h-4 w-4 text-emerald-600" />
              <span>
                {isTemplateView ? (activeFormat ? "Interactive HTML" : "HTML Template") : "Interactive HTML"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={exports.handleExportCSV}
              className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-md hover:bg-slate-100"
            >
              <FileText className="h-4 w-4 text-slate-500" />
              <span>CSV Data</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Document Menu (Ellipsis) — Clean, non-duplicated document actions ONLY */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={!hasJSON && activeApp !== "aichat"}
              className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              title="Document Actions"
              aria-label="Document Actions"
            >
              <Ellipsis className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 p-1.5 z-[100] rounded-xl bg-white border border-slate-200/90 shadow-lg"
          >
            {/* Compact-screen Add / New Chat actions (hidden on lg+ where main button is visible) */}
            <div className="lg:hidden">
              {activeApp === "aichat" ? (
                <>
                  <DropdownMenuItem
                    onClick={onNewChatClick}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    <SquarePen className="h-4 w-4 text-indigo-600 shrink-0" strokeWidth={1.8} />
                    <span>New Chat</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                </>
              ) : (
                <>
                  <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                    Add to Workspace
                  </div>
                  <DropdownMenuItem
                    onClick={() => window.dispatchEvent(new CustomEvent("openAddDatasetModal"))}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    <BarChart2 className="h-4 w-4 text-indigo-600 shrink-0" />
                    <span>Add Single Chart</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.dispatchEvent(new CustomEvent("openNewGroupModal"))}
                    className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    <Layers className="h-4 w-4 text-violet-600 shrink-0" />
                    <span>Add Grouped Chart</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1 bg-slate-100" />
                </>
              )}
            </div>

            {/* Share actions (always accessible, especially on < xl) */}
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Document
            </div>
            <DropdownMenuItem
              disabled={isSharingLink || !currentSnapshotId}
              onClick={onCopyShareLink}
              className="flex items-center justify-between gap-2 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2.5">
                <Copy className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span>Copy Share Link</span>
              </div>
              {!currentSnapshotId && (
                <span className="text-[10px] text-slate-400 font-normal">Save first</span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={isSharingLink || !currentSnapshotId}
              onClick={onOpenShareLink}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-slate-700 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Open Share Link</span>
            </DropdownMenuItem>

            {/* Admin-only Style Preset publishing */}
            {!isTemplateView && user?.is_admin && hasJSON && (
              <>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuItem
                  onClick={() => setPublishDialogOpen(true)}
                  className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg hover:bg-emerald-50 text-emerald-700 focus:bg-emerald-50 focus:text-emerald-700"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{editPresetId ? "Update Style Preset" : "Publish Style Preset"}</span>
                </DropdownMenuItem>
              </>
            )}

            <DropdownMenuSeparator className="my-1 bg-slate-100" />

            {/* Destructive Action — safely separated in Document Menu */}
            <DropdownMenuItem
              onClick={onClearClick}
              disabled={!hasJSON}
              className="flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium cursor-pointer rounded-lg text-red-600 hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
            >
              <Trash2 className="h-3.5 w-3.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold">Clear Workspace</span>
                <span className="text-[10px] text-red-400 font-normal">Reset canvas and start new</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
          </>
        )}

        {(hasActiveChart || activeApp === "aichat") && (
          <div className="h-4 w-px bg-slate-200/80 mx-0.5 flex-shrink-0" />
        )}

        {/* Profile Avatar & Settings */}
        <div className="flex items-center justify-center flex-shrink-0">
          <SimpleProfileDropdown size="sm" />
        </div>
      </div>

      {/* Admin Style Preset Dialogs */}
      {user?.is_admin && hasJSON && (
        editPresetId ? (
          <UpdatePresetDialog
            open={publishDialogOpen}
            onOpenChange={setPublishDialogOpen}
            presetId={editPresetId}
            initialData={presetMetadata}
            isBuiltIn={isBuiltInPreset}
            onSuccess={(newDbId) => {
              const store = useChartStyleStore.getState()
              if (newDbId && isBuiltInPreset) {
                store.setEditPresetId(newDbId)
                store.setIsBuiltInPreset(false)
                window.history.replaceState(null, "", `/editor?editPresetId=${newDbId}`)
              }
              store.invalidateCache().catch(console.error)
              const idToFetch = newDbId || editPresetId
              dataService
                .getChartStylePreset(idToFetch)
                .then(res => {
                  if (res.data) {
                    store.setPresetMetadata({
                      name: res.data.name,
                      description: res.data.description || "",
                      category: res.data.category || "minimal",
                      tags: res.data.tags || [],
                      isOfficial: res.data.is_official || false,
                    })
                  }
                })
                .catch(console.error)
            }}
          />
        ) : (
          <PublishStyleDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen} />
        )
      )}
    </header>
  )
})
