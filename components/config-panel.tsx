"use client"

import { DatasetPanel } from "./panels/dataset-panel"
import { DesignPanel } from "./panels/design-panel"
import { AxesPanel } from "./panels/axes/axes-panel"
import { LabelsPanel } from "./panels/labels-panel"
import { OverlayPanel } from "./panels/overlay-panel"
import { AnimationsPanel } from "./panels/animations-panel"
import { AdvancedPanel } from "./panels/advanced-panel"
import { ExportPanel } from "./panels/export-panel"
import { TypesTogglesPanel } from "./panels/types-toggles-panel"
import { DatasetsSlicesPanel } from "./panels/datasets-slices-panel"
import { TemplatesPanel } from "./panels/templates-panel"
import { Button } from "@/components/ui/button"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { ChevronLeft, Settings, Save, X, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { dataService } from "@/lib/data-service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"

interface ConfigPanelProps {
  activeTab: string
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onTabChange?: (tab: string) => void
}

export function ConfigPanel({ activeTab, onToggleSidebar, isSidebarCollapsed, onTabChange }: ConfigPanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { chartType, chartData, chartConfig, hasJSON, resetChart, setHasJSON } = useChartStore();
  const { messages, clearMessages, startNewConversation, setBackendConversationId } = useChatStore();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 576);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSave = async () => {
    if (!hasJSON || !user) {
      toast.error("No chart to save or user not authenticated");
      return;
    }

    setIsSaving(true);
    try {
      const chatMessages = useChatStore.getState().messages
      const existingBackendId = useChatStore.getState().backendConversationId

      let conversationId: string
      let isUpdate = false

      if (existingBackendId) {
        console.log('📝 Updating existing conversation:', existingBackendId)
        conversationId = existingBackendId
        isUpdate = true

        // No need to update conversation title - it was already set when created
        // Just save the new chart snapshot version
      } else {
        console.log('💾 Creating new conversation')
        const firstUserMessage = chatMessages.find(m => m.role === 'user')
        const conversationTitle = firstUserMessage
          ? (firstUserMessage.content.length > 60
              ? firstUserMessage.content.slice(0, 57) + '...'
              : firstUserMessage.content)
          : `Chart saved on ${new Date().toLocaleDateString()}`

        const response = await dataService.createConversation(
          conversationTitle,
          'Chart saved from editor'
        )

        if (response.error) {
          console.error('Failed to create conversation:', response.error)
          toast.error("Failed to save chart. Please try again.")
          return
        }

        if (!response.data) {
          toast.error("Failed to create conversation.")
          return
        }

        conversationId = response.data.id
        useChatStore.getState().setBackendConversationId(conversationId)
      }

      // Save chart snapshot (creates new version)
      const snapshotResult = await dataService.saveChartSnapshot(
        conversationId,
        chartType,
        chartData,
        chartConfig
      )

      if (snapshotResult.error) {
        console.error('Failed to save chart snapshot:', snapshotResult.error)
        toast.error("Failed to save chart snapshot. Please try again.")
        return
      }

      const snapshotId = snapshotResult.data?.id

      if (isUpdate) {
        // For updates, we don't need to add any automatic messages
        // The chart snapshot is saved as a new version, which is sufficient
        console.log('✅ Chart snapshot updated (no additional message needed)')
      } else {
        const messagesToSave = chatMessages.filter(m => {
          return !(m.role === 'assistant' && m.content.includes('Hi! Describe the chart'));
        })

        let savedCount = 0
        for (let i = 0; i < messagesToSave.length; i++) {
          const msg = messagesToSave[i]
          try {
            const chartSnapshotId = (msg.role === 'assistant' && msg.chartSnapshot)
              ? snapshotId
              : undefined

            await dataService.addMessage(
              conversationId,
              msg.role,
              msg.content,
              chartSnapshotId,
              msg.action || undefined,
              msg.changes || undefined
            )
            savedCount++
          } catch (msgError) {
            console.error(`Failed to save message ${i}:`, msgError)
          }
        }
        console.log(`✅ Saved ${savedCount}/${messagesToSave.length} messages`)
      }

      toast.success(isUpdate ? "Chart updated successfully!" : "Chart saved successfully!")
      console.log(`✅ Chart ${isUpdate ? 'updated' : 'saved'} to backend:`, conversationId)

      clearCurrentChart()

      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('user-id') || 'anonymous'
        const historyKey = `chat-history-${userId}`
        try {
          const historyData = localStorage.getItem(historyKey)
          if (historyData) {
            const parsed = JSON.parse(historyData)
            if (parsed.state) {
              parsed.state.conversations = []
              localStorage.setItem(historyKey, JSON.stringify(parsed))
              console.log('✅ Cleared localStorage history to prevent duplicates')
            }
          }
        } catch (error) {
          console.warn('Failed to clear history:', error)
        }
      }

      // Don't clear or route - keep the user on the same page with their saved chart
      // Just update the backend conversation ID so next save will update instead of create
      setBackendConversationId(conversationId)
    } catch (error) {
      console.error('Save failed:', error)
      toast.error("Failed to save chart. Please try again.")
    } finally {
      setIsSaving(false)
    }
  };

  const handleCancel = () => {
    clearCurrentChart()
    clearMessages()
    startNewConversation()
    resetChart()
    setHasJSON(false)
    setBackendConversationId(null)
    toast.success("Chart cleared")
    router.push('/landing')
  };

  const renderPanel = () => {
    switch (activeTab) {
      case "types_toggles":
        return <TypesTogglesPanel />
      case "datasets_slices":
        return <DatasetsSlicesPanel />
      case "datasets":
        return <DatasetPanel />
      case "design":
        return <DesignPanel />
      case "axes":
        return <AxesPanel />
      case "labels":
        return <LabelsPanel />
      case "overlay":
        return <OverlayPanel />
      case "animations":
        return <AnimationsPanel />
      case "advanced":
        return <AdvancedPanel />
      case "templates":
        return <TemplatesPanel />
      case "export":
        return <ExportPanel onTabChange={onTabChange} />
      default:
        return <TypesTogglesPanel />
    }
  }


  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-l border-gray-200 shadow-sm">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <div className="flex items-center p-3 border-b bg-gray-50/50 gap-3">
          {/* Expand/Collapse Button */}
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidebar}
              className="h-8 w-8 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
          )}

          {/* Action Buttons: Save, Cancel, History */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="default"
              onClick={handleSave}
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
      )}
      
      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="animate-in fade-in duration-200">
          {renderPanel()}
        </div>
      </div>
    </div>
  )
}
