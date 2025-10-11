"use client"

import { ChartPreview } from "@/components/chart-preview"
import { ConfigSidebar } from "@/components/config-sidebar"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Settings, Save, X } from "lucide-react"
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
        console.log('📝 Updating existing conversation:', existingBackendId)
        conversationId = existingBackendId
        isUpdate = true
        
        // Optionally update conversation title if needed
        const firstUserMessage = chatMessages.find(m => m.role === 'user')
        if (firstUserMessage) {
          const conversationTitle = firstUserMessage.content.length > 60 
            ? firstUserMessage.content.slice(0, 57) + '...' 
            : firstUserMessage.content
          
          await dataService.updateConversation(conversationId, {
            title: conversationTitle,
            description: 'Chart updated from editor'
          })
        }
      } else {
        console.log('💾 Creating new conversation')
        
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
      
      // Get the snapshot ID for linking messages
      const snapshotId = snapshotResult.data?.id
      
      if (isUpdate) {
        // For updates, only add new messages since last save
        // This is a simple approach - just add a message indicating the update
        try {
          await dataService.addMessage(
            conversationId,
            'user',
            'Updated chart configuration',
            snapshotId,
            'update',
            ['Chart modified in editor']
          )
          console.log('✅ Added update message to existing conversation')
        } catch (msgError) {
          console.error('Failed to add update message:', msgError)
        }
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
      
      // Reset the UI
      clearMessages()
      startNewConversation()
      useChartStore.getState().resetChart()
      useChartStore.getState().setHasJSON(false)
      
      // Navigate to landing page
      setTimeout(() => {
        router.push('/landing')
      }, 1000)
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
          // Collapsed state: show icon stack
          <div className="flex flex-col items-center h-full py-4 group">
            {/* Profile Icon - Dropdown Menu */}
            <div className="mb-2">
              <SimpleProfileDropdown size="md" />
            </div>
            {/* Expand Icon */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 group-hover:scale-105"
              title="Expand Settings"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {/* Vertical Text */}
            <div className="flex-1 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600 transform -rotate-90 whitespace-nowrap">
                Expand to Tweak General Settings
              </span>
            </div>
            {/* Settings Icon */}
            <button
              className="mb-2 p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-800 group-hover:scale-105"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
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
                  <Save className="w-3 h-3" />
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
                <HistoryDropdown variant="compact" />
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