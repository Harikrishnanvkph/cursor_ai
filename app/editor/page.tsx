"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { ConfigPanel } from "@/components/config-panel"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { useAuth } from "@/components/auth/AuthProvider"
import { dataService } from "@/lib/data-service"
import { Button } from "@/components/ui/button"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { ArrowLeft, Sparkles, AlignEndHorizontal, Database, Palette, Grid, Tag, Layers, Zap, Settings, Download, ChevronLeft, ChevronRight, FileText, Save, X, Loader2 } from "lucide-react"
import Link from "next/link"
import React from "react"
import { ResizableChartArea } from "@/components/resizable-chart-area"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useChatStore } from "@/lib/chat-store"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"

const TABS = [
  { id: "types_toggles", label: "Types", icon: AlignEndHorizontal },
  { id: "datasets_slices", label: "Datasets", icon: Database },
  { id: "design", label: "Design", icon: Palette },
  { id: "axes", label: "Axes", icon: Grid },
  { id: "labels", label: "Labels", icon: Tag },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "animations", label: "Animations", icon: Zap },
  { id: "advanced", label: "Advanced", icon: Settings },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "export", label: "Export", icon: Download },
]

// Custom hook to detect <=576px
function useIsMobile576() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 576 : false
  );
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth <= 576);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isMobile;
}

// Custom hook to get screen dimensions
function useScreenDimensions() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  useEffect(() => {
    function updateDimensions() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    }
    
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);
  
  return dimensions;
}

// Custom hook to detect 577-1024px
function useIsTablet() {
  const [isTablet, setIsTablet] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 577 && window.innerWidth <= 1024 : false
  );
  useEffect(() => {
    function handleResize() {
      setIsTablet(window.innerWidth >= 577 && window.innerWidth <= 1024);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return isTablet;
}

export default function EditorPage() {
  return (
    <ProtectedRoute>
      <EditorPageContent />
    </ProtectedRoute>
  )
}

function EditorPageContent() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { user, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("types_toggles")
  const { chartConfig, updateChartConfig, chartType, chartData, hasJSON, resetChart, setHasJSON } = useChartStore()
  const { setEditorMode } = useTemplateStore()
  const { messages, clearMessages, startNewConversation, setBackendConversationId } = useChatStore()
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const isMobile = useIsMobile576();
  const isTablet = useIsTablet();
  const { width: screenWidth, height: screenHeight } = useScreenDimensions();

  // On tablet, collapse both sidebars by default on mount
  useEffect(() => {
    if (isTablet) {
      setLeftSidebarCollapsed(true);
      setRightSidebarCollapsed(true);
    }
  }, [isTablet]);

  // Auto-apply mobile dimensions when Manual Dimensions is enabled on mobile
  useEffect(() => {
    if (isMobile && screenWidth > 0) {
      // Automatically enable Manual Dimensions on mobile devices
      const mobileWidth = `${screenWidth}px`;
      const mobileHeight = `${screenWidth}px`; // Same as width for square aspect
      
      updateChartConfig({
        ...chartConfig,
        manualDimensions: true,
        responsive: false,
        maintainAspectRatio: false,
        width: mobileWidth,
        height: mobileHeight
      });
    }
  }, [isMobile, screenWidth, updateChartConfig]);

  // Listen for custom events to change active tab
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      setActiveTab(tab);
      setMobilePanel(tab);
    };

    window.addEventListener('changeActiveTab', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('changeActiveTab', handleTabChange as EventListener);
    };
  }, []);

  // Handle mode switching based on active tab
  useEffect(() => {
    // Template-specific tabs: templates, export
    const templateTabs = ['templates', 'export'];
    
    if (templateTabs.includes(activeTab)) {
      setEditorMode('template');
    } else {
      // Chart-specific tabs: types_toggles, datasets_slices, design, axes, labels, overlay, animations, advanced
      setEditorMode('chart');
    }
  }, [activeTab, setEditorMode]);

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

  // ❌ BACKEND SYNC DISABLED - Editor changes should NOT auto-save
  // Charts should ONLY save when user explicitly clicks Save button
  // This was causing duplicate conversations to be created
  // useEffect(() => {
  //   if (!user || !hasJSON) return;
  //   
  //   // Debounce sync - save after 3 seconds of inactivity
  //   const syncTimer = setTimeout(async () => {
  //     try {
  //       // Get or create conversation for editor session
  //       const conversationTitle = `Chart edited on ${new Date().toLocaleDateString()}`;
  //       const response = await dataService.createConversation(
  //         conversationTitle,
  //         'Chart edited in advanced editor'
  //       );
  //       
  //       if (response.data) {
  //         await dataService.saveChartSnapshot(
  //           response.data.id,
  //           chartType,
  //           chartData,
  //           chartConfig
  //         );
  //         console.log('✅ Editor changes synced to backend');
  //       }
  //     } catch (error) {
  //       console.warn('Editor sync failed (changes saved locally):', error);
  //     }
  //   }, 3000);
  //   
  //   return () => clearTimeout(syncTimer);
  // }, [user, chartType, chartData, chartConfig, hasJSON]);

  if (!mounted) {
    return null; // Or a loading spinner if you prefer
  }

  // Mobile layout for <=576px
  if (isMobile) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gray-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b bg-white flex-shrink-0">
          <Link href="/landing">
            <Button variant="outline" className="xs400:p-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex flex-row items-center justify-center gap-1">
              <ArrowLeft className="h-5 w-5 xs400:hidden" />
              Generate
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-col items-center">
            <span className="font-bold text-lg text-gray-900 xs400:text-base">Chart Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <SimpleProfileDropdown size="sm" />
          </div>
        </div>
        {/* Chart Preview */}
        <div className="flex-1 flex items-start justify-center p-2 pb-20 overflow-hidden">
          <div className="w-full max-w-full overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)' }}>
            <ChartPreview />
          </div>
        </div>
        {/* Bottom Navigation - horizontally scrollable, tiles never squish */}
        {/* fixed right-0 left-0 bottom-0 top-0 */}
        <nav className="fixed right-0 left-0 bottom-0 w-full bg-white border-t z-50 overflow-x-auto whitespace-nowrap flex-shrink-0">
          <div className="flex flex-row min-w-full">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setMobilePanel(tab.id)}
                  className={`flex flex-col items-center justify-center px-2 py-2 min-w-[64px] flex-shrink-0 flex-grow text-center ${mobilePanel === tab.id ? "text-blue-700" : "text-gray-500"}`}
                  style={{ maxWidth: 96 }}
                >
                  <Icon className="h-6 w-6 mb-1 mx-auto" />
                  <span className="text-xs font-medium truncate w-full">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
        {/* Bottom Sheet/Drawer for Active Panel */}
        {mobilePanel && (
          <div className="fixed bottom-0 left-0 w-full mx-auto bg-white rounded-t-2xl shadow-2xl z-[60] animate-slide-up flex flex-col" style={{ height: '70vh' }}>
            <div className="flex items-center justify-between px-4 py-1 border-b">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = TABS.find(t => t.id === mobilePanel)?.icon
                  return Icon ? <Icon className="h-4 w-4 text-blue-600" /> : null
                })()}
                <span className="font-semibold text-sm">{TABS.find(t => t.id === mobilePanel)?.label}</span>
              </div>
              <button onClick={() => setMobilePanel(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1">
                          <ConfigPanel 
              activeTab={mobilePanel} 
              onToggleSidebar={() => setMobilePanel(null)}
              isSidebarCollapsed={false}
              onTabChange={setMobilePanel}
            />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Tablet overlay sidebar logic
  if (isTablet) {
    return (
      <div className="flex h-screen bg-gray-50 overflow-hidden relative">
        {/* Left Sidebar - Collapsed by default, shows only icons */}
        <div className="w-16 flex-shrink-0 flex flex-col h-full items-center bg-white border-r border-gray-200 p-2">
          <Link href="/landing" className="mb-4 mt-4">
            <Button variant="outline" size="icon" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex flex-row items-center justify-center gap-1">
              <ArrowLeft className="h-5 w-5" />
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          
          {/* Expand Left Sidebar Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftSidebarCollapsed(false)}
            className="h-10 w-10 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg mb-4"
            title="Expand Left Sidebar"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-2 p-2 rounded hover:bg-gray-100 transition-all duration-200 ${activeTab === tab.id ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-500"}`}
                title={tab.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>

        {/* Chart Area (between left and right sidebars) */}
        <div className="flex-1 min-w-0 pr-4 pl-2 py-4">
          <ChartPreview
            onToggleLeftSidebar={() => setLeftSidebarCollapsed((v) => !v)}
            isLeftSidebarCollapsed={leftSidebarCollapsed}
            onToggleSidebar={() => setRightSidebarCollapsed((v) => !v)}
            isSidebarCollapsed={rightSidebarCollapsed}
          />
        </div>

        {/* Right Sidebar - Collapsed by default, shows profile, expand button, and action buttons */}
        <div className="w-16 flex-shrink-0 flex flex-col h-full bg-white border-l border-gray-200 shadow-sm">
          {/* Profile Button - Top */}
          <div className="p-2 border-b border-gray-200">
            <div className="mx-auto">
              <SimpleProfileDropdown size="md" />
            </div>
          </div>
          
          {/* Expand Button */}
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightSidebarCollapsed(false)}
              className="h-10 w-10 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg mx-auto"
              title="Expand Sidebar"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
          
          {/* Action Buttons: Save, Cancel, History - Below collapse button */}
          <div className="flex flex-col items-center gap-2 px-2">
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

        {/* Left Sidebar Overlay when expanded */}
        {(!leftSidebarCollapsed) && (
          <div className="fixed top-0 left-0 h-full w-64 z-40 bg-white shadow-2xl border-r border-gray-200 transition-all duration-300 flex flex-col">
            <div className="p-4">
              <Link href="/landing" className="block mb-4">
                <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200 transition-colors">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Generate AI Chart
                </Button>
              </Link>
              <div className="border-b mb-4"></div>
              <Sidebar 
                activeTab={activeTab} 
                onTabChange={setActiveTab}
                onToggleLeftSidebar={() => setLeftSidebarCollapsed(true)}
                isLeftSidebarCollapsed={false}
              />
            </div>
          </div>
        )}

        {/* Right Sidebar Overlay when expanded */}
        {(!rightSidebarCollapsed) && (
          <div className="fixed top-0 right-0 h-full w-80 z-40 bg-white shadow-2xl border-l border-gray-200 transition-all duration-300 flex flex-col">
                      <ConfigPanel
            activeTab={activeTab}
            onToggleSidebar={() => setRightSidebarCollapsed(true)}
            isSidebarCollapsed={false}
            onTabChange={setActiveTab}
          />
          </div>
        )}

        {/* Overlay background when any sidebar is open */}
        {(!leftSidebarCollapsed || !rightSidebarCollapsed) && (
          <div className="fixed inset-0 z-30 bg-black/20 transition-opacity" onClick={() => { setLeftSidebarCollapsed(true); setRightSidebarCollapsed(true); }} />
        )}
      </div>
    );
  }

  // Desktop layout for >1024px (original, unchanged)
  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Left Sidebar - Navigation */}
      {leftSidebarCollapsed ? (
        <div className="w-16 flex-shrink-0 flex flex-col h-full items-center bg-white border-r border-gray-200 p-2">
          <Link href="/landing" className="mb-4 mt-4">
            <Button variant="outline" size="icon" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex flex-row items-center justify-center gap-1">
              <ArrowLeft className="h-5 w-5" />
              <Sparkles className="h-4 w-4" />
            </Button>
          </Link>
          
          {/* Collapse Left Sidebar Button - Above active tab */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLeftSidebarCollapsed((v) => !v)}
            className="h-10 w-10 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg mb-4"
            title="Expand Left Sidebar"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-2 p-2 rounded hover:bg-gray-100 transition-all duration-200 ${activeTab === tab.id ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-500"}`}
                title={tab.label}
              >
                <Icon className="h-5 w-5" />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="w-64 flex-shrink-0 flex flex-col h-full">
          <div className="p-4">
            <Link href="/landing" className="block mb-4">
              <Button variant="outline" className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 border-blue-200 transition-colors">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Generate AI Chart
              </Button>
            </Link>
            <div className="border-b mb-4"></div>
            <Sidebar 
              activeTab={activeTab} 
              onTabChange={setActiveTab}
              onToggleLeftSidebar={() => setLeftSidebarCollapsed((v) => !v)}
              isLeftSidebarCollapsed={leftSidebarCollapsed}
            />
          </div>
        </div>
      )}
      {/* Center Area - Chart Preview */}
      <div className="flex-1 min-w-0 pr-4 pl-2 py-4">
        <ChartPreview
            onToggleLeftSidebar={() => setLeftSidebarCollapsed((v) => !v)}
            isLeftSidebarCollapsed={leftSidebarCollapsed}
            onToggleSidebar={() => setRightSidebarCollapsed((v) => !v)}
            isSidebarCollapsed={rightSidebarCollapsed}
          />
      </div>
      {/* Right Panel - Configuration */}
      {rightSidebarCollapsed ? (
        <div className="w-16 flex-shrink-0 flex flex-col h-full bg-white border-l border-gray-200 shadow-sm">
          {/* Profile Button - Top */}
          <div className="p-2 border-b border-gray-200">
            <div className="mx-auto">
              <SimpleProfileDropdown size="md" />
            </div>
          </div>
          
          {/* Collapse/Expand Button - Below Profile */}
          <div className="p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRightSidebarCollapsed((v) => !v)}
              className="h-10 w-10 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg mx-auto"
              title="Expand Sidebar"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
          
          {/* Action Buttons: Save, Cancel, History - Below collapse button */}
          <div className="flex flex-col items-center gap-2 px-2">
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
        <div className="w-80 flex-shrink-0 border-l bg-white overflow-hidden">
          <ConfigPanel 
            activeTab={activeTab} 
            onToggleSidebar={() => setRightSidebarCollapsed((v) => !v)}
            isSidebarCollapsed={rightSidebarCollapsed}
            onTabChange={setActiveTab}
          />
        </div>
      )}
    </div>
  )
} 