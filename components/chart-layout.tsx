"use client"

import { ChartPreview } from "@/components/chart-preview"
import { ConfigSidebar } from "@/components/config-sidebar"
import { useChartStore } from "@/lib/chart-store"
import { saveChartToCloud } from "@/lib/save-utils"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
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
import { useHistoryStore } from "@/lib/history-store"
import { ClearChartDialog } from "@/components/dialogs/clear-chart-dialog"

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

  // Pre-save check that may show dimension mismatch dialog
  const handleSaveClick = () => {
    if (!user) {
      toast.error("Please sign in to save charts")
      return
    }

    if (!hasJSON) {
      toast.error("No chart to save")
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

  // Handle chart resize when sidebar toggles
  useEffect(() => {
    const handleResize = () => {
      window.dispatchEvent(new Event('resize'))
    }

    const timer = setTimeout(handleResize, 300) // Match this with your transition duration
    return () => clearTimeout(timer)
  }, [isCollapsed, leftSidebarOpen])

  return (
    <div className="flex flex-1 h-full overflow-hidden relative">
      {/* Chart Area */}
      <div
        className={cn(
          "transition-all duration-300 p-4 overflow-auto absolute inset-0 right-auto",
          isCollapsed ? "right-16" : "right-[280px]"
        )}
        style={{
          left: 0,
          width: isCollapsed ? 'calc(100% - 64px)' : 'calc(100% - 280px)'
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
          "absolute landing-right-sidebar right-0 top-0 bottom-0 border-l bg-white shadow-lg transition-all duration-300 flex flex-col z-10",
          isCollapsed ? "w-16" : "w-[280px]"
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {isCollapsed ? (
          // Collapsed state: show profile, expand button, and action buttons
          <div className="flex flex-col items-center h-full py-2 group">
            {/* Profile Icon - Top */}
            <div className="p-2 border-b border-gray-200 w-full flex justify-center">
              <SimpleProfileDropdown size="md" />
            </div>

            {/* Expand Button - Below Profile */}
            <div className="p-2 w-full flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSidebar}
                className="h-10 w-10 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg"
                title="Expand Settings"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons: Save, Cancel, History - Below expand button */}
            <div className="flex flex-col items-center gap-2 px-2 w-full">
              <Button
                size="sm"
                variant="default"
                onClick={handleSaveClick}
                disabled={!hasJSON || isSaving}
                className="h-10 w-10 p-0 bg-green-600 hover:bg-green-700 text-white"
                title="Save chart to online database"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={!hasJSON}
                className="h-10 w-10 p-0 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                title="Clear chart and start new"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="h-10 w-10">
                <HistoryDropdown variant="compact" />
              </div>
            </div>

            {/* Spacer to push buttons to top */}
            <div className="flex-1"></div>
          </div>
        ) : (
          // Expanded state: show ConfigSidebar with top bar (expand, history, profile)
          <>
            <div className="flex items-center p-3 border-b bg-gray-50/50 gap-3">
              {/* Expand/Collapse Button */}
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 flex-shrink-0"
                title="Collapse Settings"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Action Buttons: Save, Cancel, History */}
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSaveClick}
                  disabled={!hasJSON || isSaving}
                  className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white"
                  title="Save chart to online database"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={!hasJSON}
                  className="h-8 px-3 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  title="Clear chart and start new"
                >
                  <X className="w-3 h-3" />
                </Button>
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
        welcomeLabel="Close and Open New Chat"
        welcomeDescription="Closes the chart view and starts a new conversation."
        onSuccess={() => {
          router.push('/landing')
        }}
      />
    </div>
  )
}