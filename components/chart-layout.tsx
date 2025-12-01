"use client"

import { ChartPreview } from "@/components/chart-preview"
import { ConfigSidebar } from "@/components/config-sidebar"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Settings, Save, X, Loader2 } from "lucide-react"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useAuth } from "@/components/auth/AuthProvider"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { Button } from "@/components/ui/button"
import { dataService } from "@/lib/data-service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"

export function ChartLayout({ leftSidebarOpen, setLeftSidebarOpen }: { leftSidebarOpen: boolean, setLeftSidebarOpen: (open: boolean) => void }) {
  const { chartData, chartType, chartConfig, hasJSON } = useChartStore()
  const { user, signOut } = useAuth()
  const { startNewConversation, clearMessages } = useChatStore()
  const { editorMode, currentTemplate } = useTemplateStore()
  const router = useRouter()
  const hasChartData = chartData.datasets.length > 0
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Save chart to backend
  const handleSave = async () => {
    if (!user) {
      toast.error("Please sign in to save charts")
      return
    }

    if (!hasJSON) {
      toast.error("No chart to save")
      return
    }

    setIsSaving(true)
    try {
      // Get actual messages from chat store
      const chatMessages = useChatStore.getState().messages
      const existingBackendId = useChatStore.getState().backendConversationId
      
      let conversationId: string
      let isUpdate = false
      
      // Check if this chart is already saved to backend
      if (existingBackendId) {
        conversationId = existingBackendId
        isUpdate = true
      } else {
        
        // Create new conversation
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
        
        // Store the backend conversation ID
        useChatStore.getState().setBackendConversationId(conversationId)
      }
      
      // Now we have conversationId (either existing or newly created)
      
      // Normalize chartConfig before saving: convert dynamicDimension to manualDimensions
      const normalizedConfig = (() => {
        const config = { ...chartConfig };
        
        // If dynamicDimension is active, convert it to manualDimensions
        if (config.dynamicDimension === true) {
          config.manualDimensions = true;
          config.responsive = false;
          delete config.dynamicDimension; // Remove the dynamicDimension flag
          
          // Ensure width and height are preserved
          if (!config.width) config.width = '800px';
          if (!config.height) config.height = '600px';
        } else {
          // Clean up - ensure only responsive OR manualDimensions is set
          delete config.dynamicDimension;
          
          if (config.responsive === true) {
            config.manualDimensions = false;
          } else if (config.manualDimensions === true) {
            config.responsive = false;
          }
        }
        
        return config;
      })();

      // Extract template data if in template mode OR if currentTemplate exists (loaded from history)
      // This ensures templates loaded from history are saved as templates even if editorMode was changed
      let templateStructureToSave = null
      let templateContentToSave = null

      // Check if we have a template (either from editorMode or from loaded history)
      if (currentTemplate && (editorMode === 'template' || currentTemplate.id === 'current-cloud-template')) {
        // Save complete template structure (independent copy)
        templateStructureToSave = currentTemplate
        
        // Extract text area content
        templateContentToSave = {}
        currentTemplate.textAreas.forEach(area => {
          if (templateContentToSave[area.type]) {
            // Handle multiple areas of same type
            if (Array.isArray(templateContentToSave[area.type])) {
              templateContentToSave[area.type].push(area.content)
            } else {
              templateContentToSave[area.type] = [templateContentToSave[area.type], area.content]
            }
          } else {
            templateContentToSave[area.type] = area.content
          }
        })
      }

      // Get current snapshot ID for updates
      const { currentSnapshotId, setCurrentSnapshotId } = useChartStore.getState()

      // Fallback: if we don't have a snapshot ID in memory but this conversation
      // already exists, fetch the current snapshot from backend to get its ID.
      let snapshotIdForUpdate: string | undefined = currentSnapshotId || undefined
      if (!snapshotIdForUpdate && isUpdate) {
        try {
          const currentSnapshot = await dataService.getCurrentChartSnapshot(conversationId)
          if (currentSnapshot.data?.id) {
            snapshotIdForUpdate = currentSnapshot.data.id
            setCurrentSnapshotId(snapshotIdForUpdate)
          }
        } catch {
          // If this fails, we'll fall back to creating a new snapshot
        }
      }

      // Save chart snapshot (updates if snapshotId exists, otherwise creates new)
      const snapshotResult = await dataService.saveChartSnapshot(
        conversationId,
        chartType,
        chartData,
        normalizedConfig,
        templateStructureToSave,
        templateContentToSave,
        snapshotIdForUpdate
      )
        
      if (snapshotResult.error) {
        console.error('Failed to save chart snapshot:', snapshotResult.error)
        toast.error("Failed to save chart snapshot. Please try again.")
        return
      }
      
      // Get the snapshot ID for linking messages
      const snapshotId = snapshotResult.data?.id

      // Update current snapshot ID in store after save
      if (snapshotId) {
        setCurrentSnapshotId(snapshotId)
      }
      
      if (isUpdate) {
        // For updates, we don't need to add any automatic messages
        // The chart snapshot is saved as a new version, which is sufficient
      } else {
        // For new saves, save all actual chat messages
        const messagesToSave = chatMessages.filter(m => {
          // Skip the generic initial message since backend already creates it
          return !(m.role === 'assistant' && m.content.includes('Hi! Describe the chart'));
        })
        
        // Save each message to backend in order
        let savedCount = 0
        for (let i = 0; i < messagesToSave.length; i++) {
          const msg = messagesToSave[i]
          try {
            // For assistant messages with chart snapshots, link to the saved snapshot
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
            // Continue saving other messages even if one fails
          }
        }
        console.log(`✅ Saved ${savedCount}/${messagesToSave.length} messages`)
      }
      
      toast.success(isUpdate ? "Chart updated successfully!" : "Chart saved successfully!")
      console.log(`✅ Chart ${isUpdate ? 'updated' : 'saved'} to backend:`, conversationId)
      
      // Clear the chart from localStorage after successful save
      clearCurrentChart()
      
      // Also clear localStorage history to prevent duplicates
      // The backend now contains the authoritative history
      if (typeof window !== 'undefined') {
        const userId = localStorage.getItem('user-id') || 'anonymous'
        const historyKey = `chat-history-${userId}`
        try {
          const historyData = localStorage.getItem(historyKey)
          if (historyData) {
            // Keep the localStorage history structure but clear conversations array
            // This ensures the store doesn't break but prevents duplicate entries
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
      useChatStore.getState().setBackendConversationId(conversationId)
    } catch (error) {
      console.error('Failed to save chart:', error)
      toast.error("Failed to save chart. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  // Cancel and clear chart
  const handleCancel = () => {
    // Clear all chart data from localStorage using storage-utils
    clearCurrentChart()
    
    // Clear messages and reset stores
    clearMessages()
    startNewConversation()
    
    // Reset chart store
    useChartStore.getState().resetChart()
    useChartStore.getState().setHasJSON(false)
    
    toast.success("Chart cleared from localStorage")
    
    // Navigate to new chart creation (landing page)
    router.push('/landing')
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
                onClick={handleSave}
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
            <div className="flex-1 overflow-y-auto">
              <ConfigSidebar />
            </div>
          </>
        )}
      </div>
    </div>
  )
}