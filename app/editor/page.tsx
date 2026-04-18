"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Sidebar, CHART_TABS, TEMPLATE_TABS } from "@/components/sidebar"
import { ChartPreview } from "@/components/chart-preview"
import { ConfigPanel } from "@/components/config-panel"
import { useChartStore } from "@/lib/chart-store"
import { saveChartToCloud } from "@/lib/save-utils"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useTemplateStore } from "@/lib/template-store"
import { useAuth } from "@/components/auth/AuthProvider"
import { dataService } from "@/lib/data-service"
import { Button } from "@/components/ui/button"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { ArrowLeft, Sparkles, AlignEndHorizontal, Database, Palette, Grid, Tag, Layers, Settings, Download, ChevronLeft, ChevronRight, FileText, Save, X, Loader2, Plus, Info, LayoutDashboard, MessageSquare, Edit3 } from "lucide-react"
import Link from "next/link"
import React from "react"
import { ResizableChartArea } from "@/components/resizable-chart-area"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useChatStore } from "@/lib/chat-store"
import { useHistoryStore } from "@/lib/history-store"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SaveChartDialog } from "@/components/ui/save-chart-dialog"
import { ClearChartDialog } from "@/components/dialogs/clear-chart-dialog"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { FullSizeFormatView } from "@/components/gallery/FullSizeFormatView"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditorWelcomeScreen } from "@/components/editor-welcome-screen"
import { DimensionMismatchDialog } from "@/components/dialogs/dimension-mismatch-dialog"
import { SaveModeConflictDialog } from "@/components/dialogs/save-mode-conflict-dialog"

import {
  useChartConfig,
  useChartType,
  useChartData,
  useHasJSON,
  useCurrentSnapshotId
} from "@/lib/hooks/use-chart-state"
import { useIsMobile576, useIsTablet, useScreenDimensions } from "@/lib/hooks/use-screen-dimensions"
import { parseDimension } from "@/lib/utils/dimension-utils"


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

  // ── Decoration store isolation ──
  // When entering the editor, force rehydrate from localStorage to flush any
  // format-builder shapes that may have leaked via client-side navigation.
  useEffect(() => {
    useDecorationStore.persist?.rehydrate?.()
  }, [])

  const { user, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState("types_toggles")

  // Granular hooks
  const chartConfig = useChartConfig()
  const chartType = useChartType()
  const chartData = useChartData()
  const hasJSON = useHasJSON()
  const currentSnapshotId = useCurrentSnapshotId()

  // Actions (stable functions, safe to pick from store)
  const resetChart = useChartStore(s => s.resetChart)
  const setHasJSON = useChartStore(s => s.setHasJSON)
  const setCurrentSnapshotId = useChartStore(s => s.setCurrentSnapshotId)

  const { updateChartConfig } = useChartActions()
  const { setEditorMode, currentTemplate, editorMode, syncTemplatesFromCloud } = useTemplateStore()
  const { selectedFormatId } = useFormatGalleryStore()
  const { messages, clearMessages, startNewConversation, setBackendConversationId } = useChatStore()
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const [mobilePanel, setMobilePanel] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false)
  const [showNewChartInfoDialog, setShowNewChartInfoDialog] = useState(false)
  const [showSaveChartDialog, setShowSaveChartDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showModeConflictDialog, setShowModeConflictDialog] = useState(false)
  const [currentChartName, setCurrentChartName] = useState<string>("")

  // Computed TABS based on editor mode — used for mobile/tablet bottom nav
  const TABS = useMemo(() => {
    if (editorMode === 'template') {
      // Filter out Format Zones if no format is selected
      return TEMPLATE_TABS.filter(tab => {
        if (tab.id === 'tpl_format_zones' && !selectedFormatId) return false
        return true
      })
    }
    return CHART_TABS
  }, [editorMode, selectedFormatId])

  // --- Remove independent hook for auto-switching to prevent loop ---

  // Dimension mismatch dialog state
  const [showDimensionDialog, setShowDimensionDialog] = useState(false)
  const [dimensionMismatchInfo, setDimensionMismatchInfo] = useState<{
    templateDimensions: { width: number; height: number }
    currentDimensions: { width: number; height: number }
  } | null>(null)
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

  // Respect ?tab= query parameter (e.g., /editor?tab=templates)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
      // Clean the URL so it goes back to /editor without query params
      router.replace("/editor")
    }
  }, [searchParams, router])

  // Auto-sync templates and load conversations from cloud when user logs in
  const { loadConversationsFromBackend } = useHistoryStore()
  useEffect(() => {
    if (user) {
      syncTemplatesFromCloud().catch((error) => {
        console.error('Failed to sync templates from cloud:', error);
      });
      loadConversationsFromBackend().catch((error) => {
        console.error('Failed to load conversations from backend:', error);
      });
    }
  }, [user, syncTemplatesFromCloud, loadConversationsFromBackend]);

  // Auto-apply mobile dimensions when Manual Dimensions is enabled on mobile
  // Read state directly from store to avoid stale closures and infinite dependency loops
  useEffect(() => {
    if (isMobile && screenWidth > 0) {
      const mobileWidth = `${screenWidth}px`;
      const mobileHeight = `${screenWidth}px`;

      // Always get the *latest* config from the store, not from the React closure
      // otherwise, we might accidentally overwrite user changes with a stale config
      const latestConfig = useChartStore.getState().chartConfig;

      // Prevent infinite loops by only updating if the dimensions actually differ
      if (
        latestConfig.width !== mobileWidth ||
        latestConfig.height !== mobileHeight ||
        latestConfig.manualDimensions !== true ||
        latestConfig.responsive !== false
      ) {
        console.log("updateChartConfig TRIGGERED from isMobile check!", {
          isMobile, screenWidth,
          lw: latestConfig.width, mw: mobileWidth,
          lh: latestConfig.height, mh: mobileHeight,
          lmd: latestConfig.manualDimensions,
          lresp: latestConfig.responsive
        });
        // We can safely call the store's action here
        useChartStore.getState().updateChartConfig({
          ...latestConfig,
          manualDimensions: true,
          responsive: false,
          maintainAspectRatio: false,
          width: mobileWidth,
          height: mobileHeight
        });
      }
    }
  }, [isMobile, screenWidth]);

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

  // Unified loop-prevention state syncing
  const prevEditorMode = useRef(editorMode);
  const prevActiveTab = useRef(activeTab);

  useEffect(() => {
    const isTemplateTabOnly = activeTab.startsWith('tpl_');
    const isChartTabOnly = CHART_TABS.some(t => t.id === activeTab && !['templates', 'export'].includes(t.id));

    // Neutral tabs: stay in current mode
    const isNeutralTab = activeTab === 'export' || activeTab === 'templates';

    const modeChanged = prevEditorMode.current !== editorMode;
    const tabChanged = prevActiveTab.current !== activeTab;

    prevEditorMode.current = editorMode;
    prevActiveTab.current = activeTab;

    if (modeChanged && !tabChanged) {
      // Mode was toggled by the top toggle
      if (editorMode === 'template' && isChartTabOnly) {
        setActiveTab('tpl_templates');
      } else if (editorMode === 'chart' && isTemplateTabOnly) {
        setActiveTab('types_toggles');
      }
    } else if (tabChanged && !modeChanged) {
      // Tab was clicked in the sidebar
      if (isNeutralTab) {
        // Do nothing, preserve current editorMode
      } else if (isTemplateTabOnly && editorMode !== 'template') {
        if (!currentTemplate) setEditorMode('template');
      } else if (isChartTabOnly && editorMode !== 'chart') {
        if (!currentTemplate) setEditorMode('chart');
      }
    } else if (!modeChanged && !tabChanged) {
      // On mount correction if state is fundamentally incoherent
      if (isTemplateTabOnly && editorMode === 'chart' && !currentTemplate) {
        setEditorMode('template');
        prevEditorMode.current = 'template';
      } else if (isChartTabOnly && editorMode === 'template') {
        setActiveTab('tpl_templates');
        prevActiveTab.current = 'tpl_templates';
      }
    }
  }, [activeTab, editorMode, currentTemplate, setActiveTab, setEditorMode]);

  // Check if there's a dimension mismatch between chart and template
  const checkDimensionMismatch = (): boolean => {
    const templateToCheck = currentTemplate || useTemplateStore.getState().templateInBackground
    const templateSavedToCloud = useTemplateStore.getState().templateSavedToCloud

    // No template = no mismatch check needed
    if (!templateToCheck || !templateToCheck.chartArea) return false

    // Template not saved to cloud = no mismatch check needed (user just browsed templates)
    if (!templateSavedToCloud) return false

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

      // Clear local template state
      useTemplateStore.getState().clearAllTemplateState()

      // Update local state to point to new entry
      setBackendConversationId(newConversationId)
      if (snapshotResult.data?.id) {
        setCurrentSnapshotId(snapshotResult.data.id)
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

  // Open save dialog instead of saving directly
  // Check if there's a mode conflict (template chart being saved from chart mode)
  const checkModeConflict = (): boolean => {
    const { editorMode, templateSavedToCloud, currentTemplate, templateInBackground } = useTemplateStore.getState()
    const hasTemplate = !!(currentTemplate || templateInBackground)
    // Conflict: in chart mode, but this chart was originally a template chart from cloud
    return editorMode === 'chart' && templateSavedToCloud && hasTemplate
  }

  // Handle "Save Chart & Discard Template" — strips template, saves as chart-only
  const handleSaveChartDiscardTemplate = async () => {
    setShowModeConflictDialog(false)
    // Clear template state so extractTemplateData() returns null
    useTemplateStore.getState().clearAllTemplateState()
    // Proceed to save dialog (will now save without template)
    proceedToSaveDialog()
  }

  // Handle "Save as Separate Chart" — creates new conversation without template
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
      setBackendConversationId(newConversationId)
      if (snapshotResult.data?.id) {
        setCurrentSnapshotId(snapshotResult.data.id)
      }
      // Clear template state locally
      useTemplateStore.getState().clearAllTemplateState()
      toast.success("Chart saved as separate copy!")
    } catch (error) {
      console.error('Save as separate chart failed:', error)
      toast.error("Failed to save chart copy")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveClick = () => {
    if (!hasJSON || !user) {
      toast.error("No chart to save or user not authenticated");
      return;
    }

    // Check for mode conflict FIRST (template chart being saved from chart mode)
    if (checkModeConflict()) {
      setShowModeConflictDialog(true)
      return
    }

    // Check for dimension mismatch
    if (checkDimensionMismatch()) {
      setShowDimensionDialog(true)
      return // Don't proceed with save dialog, show mismatch dialog instead
    }

    // No conflicts - proceed to save dialog
    proceedToSaveDialog()
  };

  const handleSave = async (chartName: string) => {
    setIsSaving(true);

    const result = await saveChartToCloud({
      chartName,
      user,
      onSaveComplete: () => {
        setIsSaving(false);
        setShowSaveChartDialog(false);
        if (chartName) {
          setCurrentChartName(chartName);
        }
      }
    });
  };

  const handleCancel = () => {
    setShowClearDialog(true)
  };

  // Handle new chart creation
  const handleNewChart = () => {
    // Check if there's meaningful existing chart data
    // First, check if we have any datasets with actual data values
    const hasActualChartData = chartData.datasets.length > 0 &&
      chartData.datasets.some(dataset =>
        dataset.data &&
        dataset.data.length > 0 &&
        dataset.data.some(value => value !== 0 && value !== null && value !== undefined)
      );

    // Check if we have a template with actual content (text areas with content)
    const hasTemplateContent = currentTemplate &&
      currentTemplate.textAreas?.some(ta => ta.content && ta.content.trim().length > 0);

    // Only show save dialog if there's BOTH hasJSON flag AND actual meaningful data
    const hasMeaningfulData = hasJSON && (hasActualChartData || hasTemplateContent);

    if (hasMeaningfulData) {
      // Show confirmation dialog
      setShowSaveConfirmDialog(true)
    } else {
      // No meaningful data, show info dialog directly
      setShowNewChartInfoDialog(true)
    }
  };

  const handleSaveAndClear = async () => {
    setShowSaveConfirmDialog(false)
    // Show the save dialog - once saved, the user will manually start a new chart
    handleSaveClick()
  };

  const handleJustClear = () => {
    setShowSaveConfirmDialog(false)
    // Clear everything
    clearCurrentChart()
    clearMessages()
    startNewConversation()
    resetChart()
    // Clear all overlay data (images, texts, shapes)
    useChartStore.getState().clearAllOverlays()
    // Clear all decoration shapes
    useDecorationStore.getState().clearShapes()
    setHasJSON(false)
    setBackendConversationId(null)
    // Clear all template state to prevent data cascading to new charts
    useTemplateStore.getState().clearAllTemplateState()
    // Show new chart info
    setShowNewChartInfoDialog(true)
  };

  const handleLoadSampleData = () => {
    setShowNewChartInfoDialog(false)
    // Set editor mode to chart when loading sample data
    setEditorMode('chart')
    // Load sample data
    const sampleData = {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [{
        label: 'Sample Dataset',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    }
    useChartStore.getState().setFullChart({
      chartType: 'bar',
      chartData: sampleData,
      chartConfig: {}
    })
    setHasJSON(true)
    toast.success("Sample data loaded")
  };

  const handleGoToDataset = () => {
    setShowNewChartInfoDialog(false)
    setActiveTab('datasets_slices')
    toast.info("Navigate to Datasets to add your data")
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
            {hasJSON ? (
              <ChartPreview
                activeTab={mobilePanel || activeTab}
                onTabChange={(tab) => {
                  setMobilePanel(tab);
                  setActiveTab(tab);
                }}
                onNewChart={handleNewChart}
              />
            ) : (
              <EditorWelcomeScreen
                onDatasetClick={() => setMobilePanel('datasets_slices')}
                size="compact"
              />
            )}
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
                onSaveClick={handleSaveClick}
              />
            </div>
          </div>
        )}

        {/* Save Chart Dialog with Name Input */}
        <SaveChartDialog
          open={showSaveChartDialog}
          defaultName={currentChartName}
          isUpdate={!!useChatStore.getState().backendConversationId}
          isSaving={isSaving}
          onSave={handleSave}
          onCancel={() => setShowSaveChartDialog(false)}
        />

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
            <ChevronRight className="h-4 w-4" />
          </Button>

          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-1 p-1.5 rounded flex flex-col items-center justify-center gap-0.5 w-full hover:bg-gray-100 transition-all duration-200 ${activeTab === tab.id ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-500"}`}
                title={tab.label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] font-medium leading-tight truncate w-full text-center">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Chart Area (between left and right sidebars) */}
        <div className="flex-1 min-w-0 pr-4 pl-2 pt-2 pb-4">
          {hasJSON ? (
            <ChartPreview
              onToggleLeftSidebar={() => setLeftSidebarCollapsed((v) => !v)}
              isLeftSidebarCollapsed={leftSidebarCollapsed}
              onToggleSidebar={() => setRightSidebarCollapsed((v) => !v)}
              isSidebarCollapsed={rightSidebarCollapsed}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onNewChart={handleNewChart}
            />
          ) : (
            <EditorWelcomeScreen
              onDatasetClick={() => setActiveTab('datasets_slices')}
            />
          )}
        </div>

        {/* Right Sidebar - Collapsed by default, shows profile, expand button, and action buttons */}
        <div className="w-16 flex-shrink-0 flex flex-col h-full bg-white border-l border-gray-200 shadow-sm z-40 relative">
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
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons: New, Save, Cancel, History - Below collapse button */}
          <div className="flex flex-col items-center gap-2 px-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChart}
              className="h-10 w-10 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              title="Create new chart from scratch"
            >
              <Plus className="h-4 w-4" />
            </Button>
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

        {/* Left Sidebar Overlay when expanded */}
        {(!leftSidebarCollapsed) && (
          <div className="fixed top-0 left-0 h-full w-64 z-40 bg-white shadow-2xl border-r border-gray-200 flex flex-col">
            <div className="p-4">
              {/* Navigation Section */}
              <div className="mb-3">
                <div className="flex justify-center mb-2.5">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                    Advanced Editor
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => router.push('/board')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => router.push('/landing')}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>AI Chat</span>
                  </button>
                </div>
              </div>

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
          <div className="fixed top-0 right-0 h-full w-80 z-40 bg-white shadow-2xl border-l border-gray-200 flex flex-col">
            <ConfigPanel
              activeTab={activeTab}
              onToggleSidebar={() => setRightSidebarCollapsed(true)}
              isSidebarCollapsed={false}
              onTabChange={setActiveTab}
              onSaveClick={handleSaveClick}
            />
          </div>
        )}

        {/* Overlay background when any sidebar is open */}
        {(!leftSidebarCollapsed || !rightSidebarCollapsed) && (
          <div className="fixed inset-0 z-30 bg-black/20 transition-opacity" onClick={() => { setLeftSidebarCollapsed(true); setRightSidebarCollapsed(true); }} />
        )}

        {/* Save Chart Dialog with Name Input */}
        <SaveChartDialog
          open={showSaveChartDialog}
          defaultName={currentChartName}
          isUpdate={!!useChatStore.getState().backendConversationId}
          isSaving={isSaving}
          onSave={handleSave}
          onCancel={() => setShowSaveChartDialog(false)}
        />

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
      </div>
    );
  }

  // Desktop layout for >1024px (original, unchanged)
  return (
    <div className="fixed inset-0 flex bg-gray-50 overflow-hidden">
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
            title={leftSidebarCollapsed ? "Expand Left Sidebar" : "Collapse Left Sidebar"}
          >
            <ChevronRight className={`h-4 w-4 ${leftSidebarCollapsed ? '' : 'rotate-180'}`} />
          </Button>

          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`mb-1 p-1.5 rounded flex flex-col items-center justify-center gap-0.5 w-full hover:bg-gray-100 transition-all duration-200 ${activeTab === tab.id ? "bg-blue-50 text-blue-700 shadow-sm" : "text-gray-500"}`}
                title={tab.label}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] font-medium leading-tight truncate w-full text-center">{tab.label}</span>
              </button>
            )
          })}
        </div>
      ) : (
        <div className="w-64 flex-shrink-0 flex flex-col h-full">
          <div className="p-2">
            {/* Navigation Section */}
            <div className="mb-2">
              <div className="flex justify-center mb-2.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em]">
                  Advanced Editor
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push('/board')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Board</span>
                </button>
                <button
                  onClick={() => router.push('/landing')}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>
              </div>
            </div>

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
      <div className="flex-1 min-w-0 pr-4 pl-1 pt-2 pb-4 h-full overflow-hidden flex flex-col">
        {hasJSON ? (
          <ChartPreview
            onToggleLeftSidebar={() => setLeftSidebarCollapsed((v) => !v)}
            isLeftSidebarCollapsed={leftSidebarCollapsed}
            onToggleSidebar={() => setRightSidebarCollapsed((v) => !v)}
            isSidebarCollapsed={rightSidebarCollapsed}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onNewChart={handleNewChart}
          />
        ) : (
          <EditorWelcomeScreen
            onDatasetClick={() => setActiveTab('datasets_slices')}
          />
        )}
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
              title={rightSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft className={`h-4 w-4 ${rightSidebarCollapsed ? '' : 'rotate-180'}`} />
            </Button>
          </div>

          {/* Action Buttons: New, Save, Cancel, History - Below collapse button */}
          <div className="flex flex-col items-center gap-2 px-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleNewChart}
              className="h-10 w-10 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              title="Create new chart from scratch"
            >
              <Plus className="h-4 w-4" />
            </Button>
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
        <div className="w-80 flex-shrink-0 border-l bg-white overflow-hidden h-full flex flex-col min-h-0">
          <ConfigPanel
            activeTab={activeTab}
            onToggleSidebar={() => setRightSidebarCollapsed((v) => !v)}
            isSidebarCollapsed={rightSidebarCollapsed}
            onTabChange={setActiveTab}
            onNewChart={handleNewChart}
            onSaveClick={handleSaveClick}
          />
        </div>
      )}

      {/* Confirmation Dialog for Save/Clear */}
      <ConfirmDialog
        open={showSaveConfirmDialog}
        onCancel={() => setShowSaveConfirmDialog(false)}
        title="Existing Chart Data"
        description="You have unsaved chart data. Would you like to save it before creating a new chart?"
        onConfirm={handleSaveAndClear}
        confirmText="Save"
        cancelText="Cancel"
        onAlternate={handleJustClear}
        alternateText="Discard"
      />

      {/* Save Chart Dialog with Name Input */}
      <SaveChartDialog
        open={showSaveChartDialog}
        defaultName={currentChartName}
        isUpdate={!!useChatStore.getState().backendConversationId}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={() => setShowSaveChartDialog(false)}
      />

      {/* Clear Chart Dialog */}
      <ClearChartDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />

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

      {/* Info Dialog for New Chart Options */}
      <Dialog open={showNewChartInfoDialog} onOpenChange={setShowNewChartInfoDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              <DialogTitle>Create New Chart</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Choose how you'd like to start creating your chart:
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={handleLoadSampleData}
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
              variant="outline"
            >
              <div className="flex items-center gap-2 w-full">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Load Sample Data</span>
              </div>
              <span className="text-xs text-left text-gray-500">
                Start with pre-loaded example data to explore chart features
              </span>
            </Button>

            <Button
              onClick={handleGoToDataset}
              className="w-full h-auto py-4 flex flex-col items-start gap-1"
              variant="outline"
            >
              <div className="flex items-center gap-2 w-full">
                <Database className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Add Your Own Data</span>
              </div>
              <span className="text-xs text-left text-gray-500">
                Navigate to the Datasets panel to input your custom data
              </span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}




