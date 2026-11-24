"use client"

import dynamic from "next/dynamic"
import { ChartPreview } from "@/components/chart-preview"
import { ConfigSidebar } from "@/components/config-sidebar"
import { useChartStore, prepareChartDataForSave } from "@/lib/chart-store"
import { saveChartToCloud } from "@/lib/save-utils"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { useShallow } from "zustand/react/shallow"
import { useUIStore } from "@/lib/stores/ui-store"
import { ChevronLeft, ChevronRight, Settings, SlidersHorizontal, Save, Trash2, X, Loader2, PanelRight } from "lucide-react"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useAuth } from "@/components/auth/AuthProvider"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { Button } from "@/components/ui/button"
import { dataService } from "@/lib/data-service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"
import { useHistoryStore } from "@/lib/history-store"
import { getEffectiveChartTitle, resolveActiveCloudConversationId } from "@/lib/hooks/use-chart-rename"
import { DatasetService } from "@/lib/services/dataset-service"
import { GroupService } from "@/lib/services/group-service"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { FullSizeFormatView } from "@/components/gallery/FullSizeFormatView"

// parseDimension imported from shared utility
import { parseDimension } from "@/lib/utils/dimension-utils"
import { useIsBelow1152 } from "@/lib/hooks/use-screen-dimensions"

const DimensionMismatchDialog = dynamic(() => import("@/components/dialogs/dimension-mismatch-dialog").then(m => m.DimensionMismatchDialog), { ssr: false })
const SaveChartDialog = dynamic(() => import("@/components/ui/save-chart-dialog").then(m => m.SaveChartDialog), { ssr: false })
const SaveModeConflictDialog = dynamic(() => import("@/components/dialogs/save-mode-conflict-dialog").then(m => m.SaveModeConflictDialog), { ssr: false })
const ClearChartDialog = dynamic(() => import("@/components/dialogs/clear-chart-dialog").then(m => m.ClearChartDialog), { ssr: false })
const FormatGallery = dynamic(() => import("@/components/gallery/FormatGallery").then(m => m.FormatGallery), { ssr: false })

export function ChartLayout({ leftSidebarOpen, setLeftSidebarOpen }: { leftSidebarOpen: boolean, setLeftSidebarOpen: (open: boolean) => void }) {
  const { hasChartData, chartConfig, hasJSON } = useChartStore(useShallow(s => ({
    hasChartData: s.chartData.datasets.length > 0,
    chartConfig: s.chartConfig,
    hasJSON: s.hasJSON,
  })))
  const { user, signOut } = useAuth()
  const { startNewConversation, clearMessages } = useChatStore(useShallow(s => ({
    startNewConversation: s.startNewConversation,
    clearMessages: s.clearMessages,
  })))
  const { editorMode, currentTemplate, setEditorMode } = useTemplateStore(useShallow(s => ({
    editorMode: s.editorMode,
    currentTemplate: s.currentTemplate,
    setEditorMode: s.setEditorMode,
  })))
  const router = useRouter()

  const { isCollapsed, toggleSidebar, setSidebarCollapsed, setActiveSidebarTab } = useUIStore(useShallow(s => ({
    isCollapsed: s.isSidebarCollapsed,
    toggleSidebar: s.toggleSidebar,
    setSidebarCollapsed: s.setSidebarCollapsed,
    setActiveSidebarTab: s.setActiveSidebarTab,
  })))
  const isBelow1152 = useIsBelow1152()
  const { isGalleryOpen, selectedFormatId } = useFormatGalleryStore(useShallow(s => ({
    isGalleryOpen: s.isGalleryOpen,
    selectedFormatId: s.selectedFormatId,
  })))
  const [isSaving, setIsSaving] = useState(false)

  const handleEditBasicSettings = () => {
    setActiveSidebarTab('general')
    setSidebarCollapsed(false)
  }

  // Dimension mismatch dialog state
  const [showDimensionDialog, setShowDimensionDialog] = useState(false)
  const [dimensionMismatchInfo, setDimensionMismatchInfo] = useState<{
    templateDimensions: { width: number; height: number }
    currentDimensions: { width: number; height: number }
  } | null>(null)

  // Save chart dialog state
  const [showSaveChartDialog, setShowSaveChartDialog] = useState(false)
  const [showModeConflictDialog, setShowModeConflictDialog] = useState(false)
  const [currentChartName, setCurrentChartName] = useState<string>("")

  // Clear chart dialog state
  const [showClearDialog, setShowClearDialog] = useState(false)



  // Check if there's a dimension mismatch between chart and template
  const checkDimensionMismatch = (): boolean => {
    const templateToCheck = currentTemplate || useTemplateStore.getState().templateInBackground

    // No template = no mismatch check needed
    if (!templateToCheck || !templateToCheck.chartArea) return false

    // In template mode = no mismatch (dimensions are locked to template)
    if (editorMode === 'template') return false

    // In chart mode with template - check dimensions
    const templateWidth = templateToCheck.chartArea.width
    const templateHeight = templateToCheck.chartArea.height
    const currentWidth = parseDimension(chartConfig.width)
    const currentHeight = parseDimension(chartConfig.height)

    // If responsive mode is active, it means the chart will NOT use fixed dimensions
    // This is a mismatch because template requires specific dimensions
    const isResponsiveMode = chartConfig.responsive === true && !chartConfig.manualDimensions && !chartConfig.templateDimensions

    // Check if dimensions differ OR if responsive mode is on (which means flexible sizing)
    if (isResponsiveMode || templateWidth !== currentWidth || templateHeight !== currentHeight) {
      setDimensionMismatchInfo({
        templateDimensions: { width: templateWidth, height: templateHeight },
        currentDimensions: isResponsiveMode
          ? { width: 0, height: 0 } // Responsive = unknown/variable dimensions
          : { width: currentWidth, height: currentHeight }
      })
      return true
    }

    return false
  }

  // Handle "Go to Template Mode" from dialog
  const handleGoToTemplateMode = () => {
    setShowDimensionDialog(false)
    setDimensionMismatchInfo(null)
    setEditorMode('template')
  }

  // Handle "Save as Chart Only" - creates NEW standalone chart copy
  const handleSaveAsChartOnly = async () => {
    if (!user) {
      toast.error("Please sign in to save charts")
      return
    }

    setIsSaving(true)
    try {
      // Create NEW conversation (chart only)
      const baseTitle = getEffectiveChartTitle()
      const conversationTitle = (baseTitle && baseTitle !== "No Chart Available" && baseTitle !== "Untitled Chart")
        ? `${baseTitle} (Copy)`
        : `Chart copy - ${new Date().toLocaleDateString()}`
      const response = await dataService.createConversation(
        conversationTitle,
        'Standalone chart copy (no template)'
      )

      if (response.error || !response.data) {
        toast.error("Failed to create chart copy")
        return
      }

      const newConversationId = response.data.id

      // Save ONLY the active chart snapshot WITHOUT template
      const liveStore = useChartStore.getState()
      const chartDataToSave = prepareChartDataForSave(
        liveStore.chartData,
        liveStore.chartMode,
        liveStore.activeDatasetIndex,
        liveStore.activeGroupId,
        conversationTitle,
        newConversationId,
        true
      )
      const snapshotResult = await dataService.saveChartSnapshot(
        newConversationId,
        liveStore.chartType,
        chartDataToSave,
        liveStore.getActiveChartConfig(),
        null,  // NO template structure
        null   // NO template content
      )

      if (snapshotResult.error) {
        toast.error("Failed to save chart snapshot")
        return
      }

      // Clear local template state (clears both currentTemplate and templateInBackground)
      useTemplateStore.getState().clearAllTemplateState()

      // Update active entity metadata AND local state to point to new entry
      const newSnapshotId = snapshotResult.data?.id || null
      if (liveStore.chartMode === 'single' && liveStore.chartData.datasets[liveStore.activeDatasetIndex]) {
        const updated = DatasetService.updateDataset(liveStore.activeDatasetIndex, {
          sourceId: newConversationId,
          sourceSnapshotId: newSnapshotId || undefined,
          sourceTitle: conversationTitle
        }, {
          chartType: liveStore.chartType,
          chartData: liveStore.chartData,
          chartConfig: liveStore.chartConfig,
          chartMode: liveStore.chartMode,
          hasJSON: liveStore.hasJSON,
          singleModeData: liveStore.singleModeData,
          groupedModeData: liveStore.groupedModeData
        })
        if (updated) useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      } else if (liveStore.chartMode === 'grouped' && liveStore.activeGroupId && liveStore.groups) {
        const updated = GroupService.updateGroup(liveStore.activeGroupId, {
          name: conversationTitle,
          sourceId: newConversationId,
          sourceSnapshotId: newSnapshotId || undefined,
          sourceTitle: conversationTitle
        }, { groups: liveStore.groups })
        useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      }
      useChatStore.getState().setBackendConversationId(newConversationId)
      if (newSnapshotId) {
        useChartStore.getState().setCurrentSnapshotId(newSnapshotId)
      }

      // Refresh history store immediately so newly saved chart appears in Recents / History
      try {
        await useHistoryStore.getState().loadConversationsFromBackend(true)
      } catch (e) {}

      // Close dialog
      setShowDimensionDialog(false)
      setDimensionMismatchInfo(null)

      toast.success("Chart saved as standalone copy!")

    } catch (error) {
      console.error('Save as chart only failed:', error)
      toast.error("Failed to save chart copy")
    } finally {
      setIsSaving(false)
    }
  }

  // Check if there's a mode conflict (template chart being saved from chart mode)
  const checkModeConflict = (): boolean => {
    const { editorMode, templateSavedToCloud, currentTemplate, templateInBackground } = useTemplateStore.getState()
    const { selectedFormatId } = useFormatGalleryStore.getState()
    const hasTemplate = !!(currentTemplate || templateInBackground || selectedFormatId)
    // Conflict: in chart mode, but this chart was originally a template/format chart from cloud
    return editorMode === 'chart' && templateSavedToCloud && hasTemplate
  }

  // Handle "Save Chart & Discard Template" — strips template/format, saves as chart-only
  const handleSaveChartDiscardTemplate = async () => {
    setShowModeConflictDialog(false)
    // Clear template and format state
    useTemplateStore.getState().clearAllTemplateState()
    useFormatGalleryStore.getState().setSelectedFormat(null, 'bar')
    // Proceed to save dialog (will now save without template)
    proceedToSaveDialog()
  }

  // Handle "Save as Separate Chart" — creates new conversation without template/format
  const handleSaveAsSeparateChart = async () => {
    setShowModeConflictDialog(false)
    if (!user) {
      toast.error("Please sign in to save charts")
      return
    }
    setIsSaving(true)
    try {
      const baseTitle = getEffectiveChartTitle()
      const conversationTitle = (baseTitle && baseTitle !== "No Chart Available" && baseTitle !== "Untitled Chart")
        ? `${baseTitle} (Copy)`
        : `Chart copy - ${new Date().toLocaleDateString()}`
      const response = await dataService.createConversation(
        conversationTitle,
        'Standalone chart copy (no template)'
      )
      if (response.error || !response.data) {
        toast.error("Failed to create chart copy")
        return
      }
      const newConversationId = response.data.id
      const liveStore = useChartStore.getState()
      const chartDataToSave = prepareChartDataForSave(
        liveStore.chartData,
        liveStore.chartMode,
        liveStore.activeDatasetIndex,
        liveStore.activeGroupId,
        conversationTitle,
        newConversationId,
        true
      )
      const snapshotResult = await dataService.saveChartSnapshot(
        newConversationId,
        liveStore.chartType,
        chartDataToSave,
        liveStore.getActiveChartConfig(),
        null,  // NO template
        null
      )
      if (snapshotResult.error) {
        toast.error("Failed to save chart snapshot")
        return
      }
      // Don't touch the original template chart - update active entity metadata & local state to new entry
      const newSnapshotId = snapshotResult.data?.id || null
      if (liveStore.chartMode === 'single' && liveStore.chartData.datasets[liveStore.activeDatasetIndex]) {
        const updated = DatasetService.updateDataset(liveStore.activeDatasetIndex, {
          sourceId: newConversationId,
          sourceSnapshotId: newSnapshotId || undefined,
          sourceTitle: conversationTitle
        }, {
          chartType: liveStore.chartType,
          chartData: liveStore.chartData,
          chartConfig: liveStore.chartConfig,
          chartMode: liveStore.chartMode,
          hasJSON: liveStore.hasJSON,
          singleModeData: liveStore.singleModeData,
          groupedModeData: liveStore.groupedModeData
        })
        if (updated) useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      } else if (liveStore.chartMode === 'grouped' && liveStore.activeGroupId && liveStore.groups) {
        const updated = GroupService.updateGroup(liveStore.activeGroupId, {
          name: conversationTitle,
          sourceId: newConversationId,
          sourceSnapshotId: newSnapshotId || undefined,
          sourceTitle: conversationTitle
        }, { groups: liveStore.groups })
        useChartStore.setState({ ...updated, chartTitle: conversationTitle })
      }
      useChatStore.getState().setBackendConversationId(newConversationId)
      if (newSnapshotId) {
        useChartStore.getState().setCurrentSnapshotId(newSnapshotId)
      }
      // Clear template and format state locally
      useTemplateStore.getState().clearAllTemplateState()
      useFormatGalleryStore.getState().setSelectedFormat(null, 'bar')

      // Refresh history store immediately so newly saved chart appears in Recents / History
      try {
        await useHistoryStore.getState().loadConversationsFromBackend(true)
      } catch (e) {}

      toast.success("Chart saved as separate copy!")
    } catch (error) {
      console.error('Save as separate chart failed:', error)
      toast.error("Failed to save chart copy")
    } finally {
      setIsSaving(false)
    }
  }

  // Pre-save check that may show mode conflict or dimension mismatch dialog
  const handleSaveClick = () => {

    if (!hasJSON) {
      toast.error("No chart to save")
      return
    }

    // Check for mode conflict FIRST (template chart being saved from chart mode)
    if (checkModeConflict()) {
      setShowModeConflictDialog(true)
      return
    }

    // Check for dimension mismatch
    if (checkDimensionMismatch()) {
      setShowDimensionDialog(true)
      return // Don't proceed with save, show dialog instead
    }

    // No mismatch - proceed to save dialog
    proceedToSaveDialog()
  }

  // Proceed to save dialog (called after dimension check passes or user bypasses mismatch)
  const proceedToSaveDialog = () => {
    const existingBackendId = resolveActiveCloudConversationId()
    const effectiveTitle = getEffectiveChartTitle()
    const conversations = useHistoryStore.getState().conversations
    const existingConversation = existingBackendId ? conversations.find(c => c.id === existingBackendId) : null

    const defaultName = (effectiveTitle && effectiveTitle !== "No Chart Available" && effectiveTitle !== "Untitled Chart")
      ? effectiveTitle
      : (existingConversation?.title || "Untitled")

    setCurrentChartName(defaultName)
    setShowSaveChartDialog(true)
  }

  // Save chart to backend (actual save logic)
  const handleSave = async (chartName?: string) => {
    setIsSaving(true);

    await saveChartToCloud({
      chartName,
      user,
      onSaveComplete: () => {
        setIsSaving(false);
      }
    });
  }

  // Cancel and clear chart - show confirmation first
  const handleCancel = () => {
    setShowClearDialog(true)
  }

  // Handle chart resize when sidebar toggles or breakpoint changes
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'))
    }

    const timer = setTimeout(handleResize, 10) // Small delay for layout update
    return () => clearTimeout(timer)
  }, [isCollapsed, leftSidebarOpen, isBelow1152])

  return (
    <div className="flex flex-1 h-full overflow-hidden relative">
      <div
        className={cn(
          "absolute inset-0 right-auto flex flex-col overflow-hidden",
          isBelow1152
            ? "right-14"
            : isCollapsed
            ? "right-14"
            : "right-[320px]"
        )}
        style={{
          left: 0,
          width: isBelow1152
            ? 'calc(100% - 56px)'
            : isCollapsed
            ? 'calc(100% - 56px)'
            : 'calc(100% - 320px)'
        }}
      >
        <ChartPreview
          variant="aichat"
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
          onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          isLeftSidebarCollapsed={!leftSidebarOpen}
        />
      </div>

      {/* Overlay Backdrop below 1152px when expanded — clicking outside collapses the sidebar */}
      {isBelow1152 && !isCollapsed && (
        <div
          className="absolute inset-0 z-20 bg-slate-950/15 cursor-pointer"
          onClick={toggleSidebar}
          title="Click to collapse sidebar"
        />
      )}

      {/* Right Sidebar (Config Panel) - Collapsible (Overlays when expanded below 1152px) */}
      <div
        className={cn(
          "absolute aichat-right-sidebar right-0 top-0 bottom-0 border-l border-slate-200/80 dark:border-slate-800 flex flex-col",
          isCollapsed
            ? "w-14 z-10 bg-white dark:bg-slate-950"
            : isBelow1152
            ? "w-[320px] z-30 shadow-2xl bg-white dark:bg-slate-950"
            : "w-[320px] z-10 bg-white dark:bg-slate-950"
        )}
      >
        {isCollapsed && (
          // Collapsed state: show profile, expand button, and action buttons
          <div className="flex flex-col items-center h-full bg-white dark:bg-slate-950 group">
            {/* Top header row - 52px aligned */}
            <div className="h-[52px] min-h-[52px] w-full flex items-center justify-center border-b border-slate-200/80 flex-shrink-0">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Expand Settings"
              >
                <PanelRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-4 w-full py-4">
              {/* Profile Icon */}
              <div className="pb-4 border-b border-slate-200/60 w-full flex justify-center">
                <SimpleProfileDropdown size="sm" />
              </div>

              {/* Action Buttons: Save, Cancel, History */}
              <button
                onClick={handleSaveClick}
                disabled={!hasJSON || isSaving}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Save chart to online database"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />}
              </button>

              <button
                onClick={handleCancel}
                disabled={!hasJSON}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                title="Clear chart and start new"
              >
                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
              </button>

              <HistoryDropdown variant="compact" className="h-8 w-8 border-0 bg-transparent shadow-none hover:bg-slate-100" />
            </div>

            {/* Edit Basic Settings Button Area — clicking expands the sidebar to basic settings */}
            <div
              className="flex-1 w-full flex flex-col items-center justify-center py-6 px-1.5 cursor-pointer"
              onClick={handleEditBasicSettings}
              title="Edit Basic Settings"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEditBasicSettings()
                }}
                className="group flex flex-col items-center justify-center gap-2.5 py-4 px-2 w-full max-w-[42px] rounded-xl border border-slate-300/80 bg-white/90 hover:bg-white hover:border-indigo-400 hover:text-indigo-600 text-slate-800 shadow-xs hover:shadow-md active:scale-95 transition-all select-none"
                title="Edit Basic Settings"
              >
                <SlidersHorizontal className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0 stroke-2" />
                <span
                  style={{ writingMode: "vertical-rl" }}
                  className="text-[11px] font-semibold tracking-wide text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 whitespace-nowrap"
                >
                  Edit Basic Settings
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Expanded state: kept mounted while collapsed so re-expanding is instant without re-creating ConfigSidebar */}
        <div className={cn("flex-col flex-1 min-h-0", isCollapsed ? "hidden" : "flex")}>
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-[52px] h-[52px] flex-shrink-0">
            {/* Expand/Collapse Button */}
            <button
              onClick={toggleSidebar}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex-shrink-0"
              title="Collapse Settings"
            >
              <PanelRight className="w-4 h-4" />
            </button>

            {/* Action Buttons: Save, Cancel, History */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleSaveClick}
                disabled={!hasJSON || isSaving}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex-shrink-0"
                title="Save chart to online database"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />}
              </button>
              <button
                onClick={handleCancel}
                disabled={!hasJSON}
                className="h-8 w-8 flex items-center justify-center rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent flex-shrink-0"
                title="Clear chart and start new"
              >
                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
              </button>
              <HistoryDropdown variant="inline" className="h-8 w-8 p-0 border-0 bg-transparent shadow-none hover:bg-slate-100 flex-shrink-0" />

              {/* Profile Icon - Dropdown Menu - Always visible */}
              <div className="flex-shrink-0">
                <SimpleProfileDropdown size="sm" />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConfigSidebar />
          </div>
        </div>
      </div>
      {/* Dimension Mismatch Dialog */}
      {dimensionMismatchInfo && (
        <DimensionMismatchDialog
          isOpen={showDimensionDialog}
          onClose={() => {
            setShowDimensionDialog(false)
            setDimensionMismatchInfo(null)
          }}
          templateDimensions={dimensionMismatchInfo.templateDimensions}
          currentDimensions={dimensionMismatchInfo.currentDimensions}
          onGoToTemplateMode={handleGoToTemplateMode}
          onSaveAsChartOnly={handleSaveAsChartOnly}
          isSaving={isSaving}
        />
      )}

      {/* Save Mode Conflict Dialog */}
      <SaveModeConflictDialog
        isOpen={showModeConflictDialog}
        onClose={() => setShowModeConflictDialog(false)}
        onSaveChartDiscardTemplate={handleSaveChartDiscardTemplate}
        onSaveAsSeparateChart={handleSaveAsSeparateChart}
        isSaving={isSaving}
      />

      {/* Save Chart Dialog with Name Input */}
      <SaveChartDialog
        open={showSaveChartDialog}
        defaultName={currentChartName}
        isUpdate={!!resolveActiveCloudConversationId()}
        isSaving={isSaving}
        onSave={(name) => {
          setShowSaveChartDialog(false)
          handleSave(name)
        }}
        onCancel={() => setShowSaveChartDialog(false)}
      />

      <ClearChartDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
        onSuccess={() => {
          router.push('/aichat')
        }}
      />
    </div>
  )
}