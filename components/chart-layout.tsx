"use client"

import { ChartPreview } from "@/components/chart-preview"
import { ConfigSidebar } from "@/components/config-sidebar"
import { useChartStore } from "@/lib/chart-store"
import { saveChartToCloud } from "@/lib/save-utils"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { cn } from "@/lib/utils"
import { useState, useEffect, useRef } from "react"
import { useUIStore } from "@/lib/stores/ui-store"
import { ChevronLeft, ChevronRight, Settings, Save, X, Loader2 } from "lucide-react"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useAuth } from "@/components/auth/AuthProvider"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { Button } from "@/components/ui/button"
import { dataService } from "@/lib/data-service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"
import { DimensionMismatchDialog } from "@/components/dialogs/dimension-mismatch-dialog"
import { SaveChartDialog } from "@/components/ui/save-chart-dialog"
import { SaveModeConflictDialog } from "@/components/dialogs/save-mode-conflict-dialog"
import { useHistoryStore } from "@/lib/history-store"
import { ClearChartDialog } from "@/components/dialogs/clear-chart-dialog"
import { FormatGallery } from "@/components/gallery/FormatGallery"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { FullSizeFormatView } from "@/components/gallery/FullSizeFormatView"

// parseDimension imported from shared utility
import { parseDimension } from "@/lib/utils/dimension-utils"

export function ChartLayout({ leftSidebarOpen, setLeftSidebarOpen }: { leftSidebarOpen: boolean, setLeftSidebarOpen: (open: boolean) => void }) {
  const { chartData, chartType, chartConfig, hasJSON } = useChartStore()
  const { user, signOut } = useAuth()
  const { startNewConversation, clearMessages } = useChatStore()
  const { editorMode, currentTemplate, setEditorMode } = useTemplateStore()
  const router = useRouter()
  const hasChartData = chartData.datasets.length > 0

  const { isSidebarCollapsed: isCollapsed, toggleSidebar } = useUIStore()
  const { isGalleryOpen, selectedFormatId } = useFormatGalleryStore()
  const [isHovering, setIsHovering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
    toast.info("Switched to Template Mode. You can now save with correct dimensions.")
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
      const conversationTitle = `Chart copy - ${new Date().toLocaleDateString()}`
      const response = await dataService.createConversation(
        conversationTitle,
        'Standalone chart copy (no template)'
      )

      if (response.error || !response.data) {
        toast.error("Failed to create chart copy")
        return
      }

      const newConversationId = response.data.id

      // Save chart snapshot WITHOUT template
      const snapshotResult = await dataService.saveChartSnapshot(
        newConversationId,
        chartType,
        chartData,
        chartConfig,
        null,  // NO template structure
        null   // NO template content
      )

      if (snapshotResult.error) {
        toast.error("Failed to save chart snapshot")
        return
      }

      // Clear local template state (clears both currentTemplate and templateInBackground)
      useTemplateStore.getState().clearAllTemplateState()

      // Update local state to point to new entry
      useChatStore.getState().setBackendConversationId(newConversationId)
      if (snapshotResult.data?.id) {
        useChartStore.getState().setCurrentSnapshotId(snapshotResult.data.id)
      }

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
      const conversationTitle = `Chart copy - ${new Date().toLocaleDateString()}`
      const response = await dataService.createConversation(
        conversationTitle,
        'Standalone chart copy (no template)'
      )
      if (response.error || !response.data) {
        toast.error("Failed to create chart copy")
        return
      }
      const newConversationId = response.data.id
      const snapshotResult = await dataService.saveChartSnapshot(
        newConversationId,
        chartType,
        chartData,
        chartConfig,
        null,  // NO template
        null
      )
      if (snapshotResult.error) {
        toast.error("Failed to save chart snapshot")
        return
      }
      // Don't touch the original template chart - just update local state to new entry
      useChatStore.getState().setBackendConversationId(newConversationId)
      if (snapshotResult.data?.id) {
        useChartStore.getState().setCurrentSnapshotId(snapshotResult.data.id)
      }
      // Clear template and format state locally
      useTemplateStore.getState().clearAllTemplateState()
      useFormatGalleryStore.getState().setSelectedFormat(null, 'bar')
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
    // Get the existing backend ID to check if this is an update
    const existingBackendId = useChatStore.getState().backendConversationId

    if (existingBackendId) {
      // If updating, fetch the current title from history store (in case it was renamed from board)
      const conversations = useHistoryStore.getState().conversations
      const existingConversation = conversations.find(c => c.id === existingBackendId)
      if (existingConversation) {
        setCurrentChartName(existingConversation.title)
      }
      setShowSaveChartDialog(true)
    } else {
      // NEW: Use simple "Untitled" for new local charts
      setCurrentChartName("Untitled")
      setShowSaveChartDialog(true)
    }
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

  const saveClickRef = useRef(handleSaveClick);
  useEffect(() => {
    saveClickRef.current = handleSaveClick;
  });

  useEffect(() => {
    const handleTriggerSave = () => {
      console.log("[ChartLayout] Received triggerSaveClick event! Invoking saveClickRef.current()");
      saveClickRef.current();
    };
    window.addEventListener('triggerSaveClick', handleTriggerSave);
    document.addEventListener('triggerSaveClick', handleTriggerSave);
    return () => {
      window.removeEventListener('triggerSaveClick', handleTriggerSave);
      document.removeEventListener('triggerSaveClick', handleTriggerSave);
    };
  }, []);

  // Handle chart resize when sidebar toggles
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'))
    }

    const timer = setTimeout(handleResize, 10) // Small delay for layout update
    return () => clearTimeout(timer)
  }, [isCollapsed, leftSidebarOpen])

  return (
    <div className="flex flex-1 h-full overflow-hidden relative">
      <div
        className={cn(
          "p-4 overflow-auto absolute inset-0 right-auto",
          isCollapsed ? "right-14" : "right-[280px]"
        )}
        style={{
          left: 0,
          width: isCollapsed ? 'calc(100% - 56px)' : 'calc(100% - 280px)'
        }}
      >
        <ChartPreview
          onToggleSidebar={toggleSidebar}
          isSidebarCollapsed={isCollapsed}
          onToggleLeftSidebar={() => setLeftSidebarOpen(!leftSidebarOpen)}
          isLeftSidebarCollapsed={!leftSidebarOpen}
        />
      </div>

      {/* Right Sidebar (Config Panel) - Collapsible */}
      <div
        className={cn(
          "absolute landing-right-sidebar right-0 top-0 bottom-0 border-l border-slate-200/80 bg-slate-50/60 backdrop-blur-xl shadow-md flex flex-col z-10",
          isCollapsed ? "w-14" : "w-[280px]"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isCollapsed ? (
          // Collapsed state: show profile, expand button, and action buttons
          <div className="flex flex-col items-center h-full py-4 bg-slate-50/60 backdrop-blur-xl group">
            <div className="flex flex-col items-center space-y-4 w-full">
              {/* Profile Icon - Top */}
              <div className="pb-4 border-b border-slate-200/60 w-full flex justify-center">
                <SimpleProfileDropdown size="sm" />
              </div>

              {/* Expand Button - Below Profile */}
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all duration-200 hover:shadow-sm"
                title="Expand Settings"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Action Buttons: Save, Cancel, History */}
              <button
                onClick={handleSaveClick}
                disabled={!hasJSON || isSaving}
                className="p-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 hover:border-indigo-200 text-indigo-600 transition-all duration-200 shadow-xs disabled:opacity-30 flex items-center justify-center"
                title="Save chart to online database"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              </button>

              <button
                onClick={handleCancel}
                disabled={!hasJSON}
                className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100/50 hover:border-red-200 text-red-600 transition-all duration-200 shadow-xs disabled:opacity-30 flex items-center justify-center"
                title="Clear chart and start new"
              >
                <X className="w-4 h-4" />
              </button>

              <HistoryDropdown variant="compact" />
            </div>

            {/* Spacer to push buttons to top */}
            <div className="flex-1"></div>
          </div>
        ) : (
          // Expanded state: show ConfigSidebar with top bar (expand, history, profile)
          <>
            <div className="flex items-center p-2.5 border-b border-slate-200/80 bg-white/40 gap-2">
              {/* Expand/Collapse Button */}
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 p-0 flex items-center justify-center rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all duration-200 flex-shrink-0"
                title="Collapse Settings"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              {/* Action Buttons: Save, Cancel, History */}
              <div className="flex gap-1.5 flex-shrink-0 items-center">
                <button
                  onClick={handleSaveClick}
                  disabled={!hasJSON || isSaving}
                  className="h-8 w-8 p-0 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100/50 hover:border-indigo-200 text-indigo-600 transition-all duration-200 shadow-xs disabled:opacity-30 flex items-center justify-center"
                  title="Save chart to online database"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!hasJSON}
                  className="h-8 w-8 p-0 rounded-xl bg-red-50 hover:bg-red-100 border border-red-100/50 hover:border-red-200 text-red-600 transition-all duration-200 shadow-xs disabled:opacity-30 flex items-center justify-center"
                  title="Clear chart and start new"
                >
                  <X className="w-4 h-4" />
                </button>
                <HistoryDropdown variant="inline" />
              </div>

              {/* Spacer to push profile to the right */}
              <div className="flex-1"></div>

              {/* Profile Icon - Dropdown Menu - Always visible */}
              <div className="flex-shrink-0">
                <SimpleProfileDropdown size="sm" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConfigSidebar />
            </div>
          </>
        )}
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
        isUpdate={!!useChatStore.getState().backendConversationId}
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
          router.push('/landing')
        }}
      />
    </div>
  )
}