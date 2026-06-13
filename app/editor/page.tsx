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
import { ArrowLeft, Sparkles, AlignEndHorizontal, Database, Palette, Grid, Tag, Layers, Settings, Menu, Download, ChevronLeft, ChevronRight, FileText, Save, X, Loader2, Plus, Info, LayoutDashboard, MessageSquare, Edit3, BarChart2, SlidersHorizontal, PanelLeft, ExternalLink, Share2, Copy, MoreVertical, Pencil, Check, Cloud, Trash2, ChevronDown, Maximize2, Eye, FileImage, ImageIcon, FileCode, Ellipsis } from "lucide-react"
import React from "react"
import Link from "next/link"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STANDARD_CHART_TYPES, THREE_D_CHART_TYPES } from "@/lib/chart-types"
import { useChartExport } from "@/lib/hooks/use-chart-export"
import { useChartRename } from "@/lib/hooks/use-chart-rename"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useChatStore } from "@/lib/chat-store"
import { useEditorSidebarContext } from "@/components/editor/editor-sidebar-context"
import { useHistoryStore } from "@/lib/history-store"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { SaveChartDialog } from "@/components/ui/save-chart-dialog"
import { ClearChartDialog } from "@/components/dialogs/clear-chart-dialog"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { useDecorationStore } from "@/lib/stores/decoration-store"
import { cleanupDecorationFiles } from "@/lib/stores/decoration-file-registry"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EditorWelcomeScreen } from "@/components/editor-welcome-screen"
import { DimensionMismatchDialog } from "@/components/dialogs/dimension-mismatch-dialog"
import { SaveModeConflictDialog } from "@/components/dialogs/save-mode-conflict-dialog"
import { ChartSetupDialog, type ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
import { applyPresetToChart } from "@/lib/chart-style-engine"
import type { PresetCategory } from "@/lib/chart-style-types"
import { getPresetById } from "@/lib/chart-style-defaults"
import { useChartStyleStore } from "@/lib/stores/chart-style-store"

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
  return <EditorPageContent />
}

function EditorPageContent() {
  const {
    editPresetId,
    setEditPresetId,
    isBuiltInPreset,
    setIsBuiltInPreset,
    presetMetadata,
    setPresetMetadata
  } = useChartStyleStore()
  const [showUpdatePresetDialog, setShowUpdatePresetDialog] = useState(false)

  // Helper function to load compatible dummy data for chart type
  const generateDummyDataForType = (type: string): any => {
    const isArcType = ['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d', 'gauge'].includes(type);
    if (isArcType) {
      return {
        labels: ["Category A", "Category B", "Category C", "Category D", "Category E"],
        datasets: [{
          label: "Sample Data",
          data: [30, 20, 15, 25, 10],
          chartType: type,
        }]
      };
    }

    if (type === 'waterfall') {
      return {
        labels: ["Start", "Q1 Sales", "Refunds", "Q2 Sales", "Tax", "Net"],
        datasets: [{
          label: "Cashflow",
          data: [100, 30, -10, 45, -15, 150],
          chartType: "waterfall",
        }]
      };
    }

    if (type === 'gauge') {
      return {
        labels: ["Speed"],
        datasets: [{
          label: "Value",
          data: [65],
          chartType: "gauge",
        }]
      };
    }

    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [{
        label: "Sample Dataset",
        data: [12, 19, 3, 5, 2, 8, 15],
        chartType: type,
      }]
    };
  };

  const generateDummyGroupedData = (type: string): any => {
    return {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      datasets: [
        {
          label: "Dataset A",
          data: [12, 19, 3, 5, 2, 8, 15],
          chartType: type,
          groupId: "default",
        },
        {
          label: "Dataset B",
          data: [7, 11, 5, 8, 3, 10, 12],
          chartType: type,
          groupId: "default",
        }
      ]
    };
  };

  const loadPresetForEditing = async (id: string) => {
    try {
      let parsedPreset: any = null
      let presetName = ''
      let isBuiltIn = false

      // Check if it is a built-in preset first to avoid redundant API errors for official presets
      const builtInPreset = getPresetById(id)

      let res: any = null
      if (builtInPreset) {
        isBuiltIn = true
      } else {
        try {
          res = await dataService.getChartStylePreset(id)
        } catch (err) {
          // If the DB query fails or throws (e.g. 404), treat it as not found in DB so we can fallback
          res = { error: err }
        }
      }

      if (res && !res.error && res.data) {
        const rawPreset = res.data
        presetName = rawPreset.name
        isBuiltIn = false

        setPresetMetadata({
          name: rawPreset.name,
          description: rawPreset.description || '',
          category: rawPreset.category || 'minimal',
          tags: rawPreset.tags || [],
          isOfficial: rawPreset.is_official || false,
        })

        parsedPreset = {
          id: rawPreset.id,
          name: rawPreset.name,
          description: rawPreset.description || '',
          chartType: rawPreset.chart_type,
          colorStrategy: rawPreset.color_strategy,
          configSnapshot: rawPreset.config_snapshot || {},
          datasetStyle: rawPreset.dataset_style || {},
          dimensions: rawPreset.dimensions || null,
          category: rawPreset.category || 'minimal',
          tags: rawPreset.tags || [],
          isOfficial: rawPreset.is_official || false,
          sortOrder: rawPreset.sort_order || 100,
        }
      } else {
        // Fallback to hardcoded built-in presets
        if (!builtInPreset) throw new Error("Preset not found in database or built-in defaults")

        presetName = builtInPreset.name
        isBuiltIn = true

        setPresetMetadata({
          name: builtInPreset.name,
          description: builtInPreset.description || '',
          category: builtInPreset.category || 'minimal',
          tags: builtInPreset.tags || [],
          isOfficial: builtInPreset.isOfficial || false,
        })

        parsedPreset = {
          id: builtInPreset.id,
          name: builtInPreset.name,
          description: builtInPreset.description || '',
          chartType: builtInPreset.chartType,
          colorStrategy: builtInPreset.colorStrategy,
          configSnapshot: builtInPreset.configSnapshot || {},
          datasetStyle: builtInPreset.datasetStyle || {},
          dimensions: builtInPreset.dimensions || null,
          category: builtInPreset.category || 'minimal',
          tags: builtInPreset.tags || [],
          isOfficial: builtInPreset.isOfficial || false,
          sortOrder: builtInPreset.sortOrder || 100,
        }
      }

      setIsBuiltInPreset(isBuiltIn)

      const dummy = parsedPreset.colorStrategy.mode === 'grouped'
        ? generateDummyGroupedData(parsedPreset.chartType)
        : generateDummyDataForType(parsedPreset.chartType)

      const result = applyPresetToChart(parsedPreset, dummy, parsedPreset.configSnapshot)

      clearCurrentChart()
      clearMessages()
      startNewConversation()
      
      useChartStore.setState({
        chartType: result.chartType as any,
        chartData: result.chartData,
        chartConfig: result.chartConfig,
        hasJSON: true,
        chartMode: parsedPreset.colorStrategy.mode === 'grouped' ? 'grouped' : 'single',
      })
      setHasJSON(true)
      
      setActiveTab('styling')
      toast.success(`Preset "${presetName}" loaded for editing with dummy data!${isBuiltIn ? ' (Built-in preset)' : ''}`)
    } catch (err: any) {
      console.error("Failed to load preset for editing:", err)
      toast.error(err.message || "Failed to load preset")
    }
  }

  // ── Decoration store isolation ──
  // When entering the editor via client-side navigation, force rehydrate to flush
  // any format-builder shapes. Skip on hard refresh to prevent hydration race conditions.
  useEffect(() => {
    if (useDecorationStore.persist?.hasHydrated()) {
      useDecorationStore.persist?.rehydrate?.()
    }
    return () => {
      cleanupDecorationFiles()
    }
  }, [])

  // Keep decoration store isolated correctly based on active editor mode
  useEffect(() => {
    // Only sync if hydrated to avoid overwriting IDB with empty state during load
    if (useDecorationStore.persist?.hasHydrated()) {
      useDecorationStore.getState().setActiveMode(useTemplateStore.getState().editorMode)
    }
  }, [useTemplateStore.getState().editorMode])

  const { user, signOut } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeTab, setActiveTab, leftSidebarCollapsed, setLeftSidebarCollapsed } = useEditorSidebarContext()
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false)
  const chartConfig = useChartConfig()
  const chartType = useChartType()
  const chartData = useChartData()
  const hasJSON = useHasJSON()
  const currentSnapshotId = useCurrentSnapshotId()

  // Track whether the chart store has finished IDB hydration.
  const [storeHydrated, setStoreHydrated] = useState(() =>
    !!(useChartStore.persist as any)?.hasHydrated?.()
  )

  useEffect(() => {
    if (storeHydrated) return
    // Check synchronously first — hydration may have completed between render and effect
    if ((useChartStore.persist as any)?.hasHydrated?.()) {
      setStoreHydrated(true)
      return
    }
    const unsub = (useChartStore.persist as any)?.onFinishHydration?.(() => {
      setStoreHydrated(true)
    })
    return () => { unsub?.() }
  }, [storeHydrated])

  // Actions (stable functions, safe to pick from store)
  const resetChart = useChartStore(s => s.resetChart)
  const setHasJSON = useChartStore(s => s.setHasJSON)
  const setCurrentSnapshotId = useChartStore(s => s.setCurrentSnapshotId)

  const { updateChartConfig, setChartType } = useChartActions()
  const { setEditorMode, currentTemplate, editorMode, syncTemplatesFromCloud, templateInBackground } = useTemplateStore()
  const { selectedFormatId, contentPackage, formats, userFormats, selectedFormatSnapshot } = useFormatGalleryStore()
  const { messages, clearMessages, startNewConversation, setBackendConversationId } = useChatStore()
  const originalCloudDimensions = useChartStore(s => s.originalCloudDimensions)
  const rename = useChartRename()
  const exports = useChartExport()
  const [exportExpanded, setExportExpanded] = useState(false)
  const [shareExpanded, setShareExpanded] = useState(false)

  const activeConfig = useChartStore(s => {
    if (s.chartMode === 'single') {
      const ds = s.chartData.datasets[s.activeDatasetIndex];
      return ds?.chartConfig ?? s.chartConfig;
    }
    const group = s.groups?.find(g => g.id === s.activeGroupId);
    return group?.chartConfig ?? s.chartConfig;
  });

  const renderedFormat = useMemo(() => {
    if (!selectedFormatId || !contentPackage) return null;
    return selectedFormatSnapshot 
      || [...formats, ...userFormats].find(f => f.id === selectedFormatId);
  }, [selectedFormatId, contentPackage, selectedFormatSnapshot, formats, userFormats]);

  const parseDim = (val: any): number | null => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseInt(val);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  };

  const getAspectRatio = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => {
      return b === 0 ? a : gcd(b, a % b);
    };
    const divisor = gcd(width, height);
    const rX = width / divisor;
    const rY = height / divisor;
    
    const ratio = width / height;
    if (Math.abs(ratio - 1) < 0.02) return '1:1';
    if (Math.abs(ratio - 16/9) < 0.02) return '16:9';
    if (Math.abs(ratio - 4/3) < 0.02) return '4:3';
    if (Math.abs(ratio - 3/2) < 0.02) return '3:2';
    if (Math.abs(ratio - 4/5) < 0.02) return '4:5';
    if (Math.abs(ratio - 9/16) < 0.02) return '9:16';
    
    return `${rX}:${rY}`;
  };

  const getChartTypeName = (type: string): string => {
    switch (type) {
      case 'bar': return 'Bar';
      case 'bar3d': return '3D Bar';
      case 'line': return 'Line';
      case 'area': return 'Area';
      case 'pie': return 'Pie';
      case 'pie3d': return '3D Pie';
      case 'doughnut': return 'Doughnut';
      case 'doughnut3d': return '3D Doughnut';
      case 'polarArea': return 'Polar Area';
      case 'radar': return 'Radar';
      case 'scatter': return 'Scatter';
      case 'bubble': return 'Bubble';
      case 'waterfall': return 'Waterfall';
      case 'gauge': return 'Gauge';
      default: return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
    }
  };

  // We no longer have local leftSidebarCollapsed here since it's in context
  const [mobilePanel, setMobilePanel] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSharingLink, setIsSharingLink] = useState(false)
  const [showSaveConfirmDialog, setShowSaveConfirmDialog] = useState(false)
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [showSaveChartDialog, setShowSaveChartDialog] = useState(false)
  const [showClearDialog, setShowClearDialog] = useState(false)
  const [showModeConflictDialog, setShowModeConflictDialog] = useState(false)
  const [currentChartName, setCurrentChartName] = useState<string>("")

  const handleCopyShareLink = async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.");
      return;
    }
    try {
      setIsSharingLink(true);
      toast.loading("Generating share link...", { id: "share-link" });
      const response = await dataService.generateShareLink(currentSnapshotId);
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link");
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!", { id: "share-link" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" });
      console.error("Share error:", err);
    } finally {
      setIsSharingLink(false);
    }
  }

  const handleOpenShareLink = async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.");
      return;
    }
    const newWindow = window.open("about:blank", "_blank");
    if (!newWindow) {
      toast.error("Pop-up blocked! Please allow popups for this site.");
      return;
    }
    try {
      setIsSharingLink(true);
      toast.loading("Generating share link...", { id: "share-link" });
      const response = await dataService.generateShareLink(currentSnapshotId);
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link");
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`;
      newWindow.location.href = shareUrl;
      toast.success("Opened share link!", { id: "share-link" });
    } catch (err: any) {
      newWindow.close();
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" });
      console.error("Share error:", err);
    } finally {
      setIsSharingLink(false);
    }
  }

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

  // Sandwich menu state
  const [sandwichOpen, setSandwichOpen] = useState(false)

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

  // Respect ?tab= or ?editPresetId= query parameters
  // Respect ?tab= query parameter (e.g., /editor?tab=templates)
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
      // Clean the URL so it goes back to /editor without query params
      router.replace("/editor")
    }

    const presetIdParam = searchParams.get('editPresetId')
    if (presetIdParam) {
      setEditPresetId(presetIdParam)
      router.replace("/editor")
      loadPresetForEditing(presetIdParam)
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



  // Listen for custom events to change active tab
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      const { tab } = event.detail;
      setActiveTab(tab);
      setMobilePanel(tab);
      
      // Explicitly sync editor mode if a specific tab is targeted
      if (tab.startsWith('tpl_')) {
        setEditorMode('template');
      } else if (CHART_TABS.some(t => t.id === tab && tab !== 'templates')) {
        setEditorMode('chart');
      }
    };

    window.addEventListener('changeActiveTab', handleTabChange as EventListener);
    return () => {
      window.removeEventListener('changeActiveTab', handleTabChange as EventListener);
    };
  }, [setActiveTab, setEditorMode]);



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
    setActiveTab('tpl_templates')
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
    if (editPresetId) {
      setShowUpdatePresetDialog(true)
      return
    }

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

  const saveClickRef = useRef(handleSaveClick);
  useEffect(() => {
    saveClickRef.current = handleSaveClick;
  });

  useEffect(() => {
    const handleTriggerSave = () => saveClickRef.current();
    window.addEventListener('triggerSaveClick', handleTriggerSave);
    return () => window.removeEventListener('triggerSaveClick', handleTriggerSave);
  }, []);

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
    setTimeout(() => {
      setShowClearDialog(true)
    }, 150);
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
      // No meaningful data, show setup dialog directly
      setShowSetupDialog(true)
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

    // Clear all decoration shapes
    useDecorationStore.getState().clearShapes()
    setHasJSON(false)
    setBackendConversationId(null)
    // Clear all template state to prevent data cascading to new charts
    useTemplateStore.getState().clearAllTemplateState()
    
    // Clear editPresetId state
    setEditPresetId(null)
    setPresetMetadata(null)

    // Show new chart setup
    setShowSetupDialog(true)
  };

  // Handle dimensions confirmed from the setup dialog
  const handleDimensionsConfirmed = (dims: ChartDimensions) => {
    setShowSetupDialog(false)
    setEditPresetId(null)
    setPresetMetadata(null)

    // Set editor mode to chart
    setEditorMode('chart')

    // Push the chosen dimensions into the store config
    useChartStore.getState().initializeChartDimensions(dims.width, dims.height, dims.isResponsive)

    // Clear everything just in case
    clearCurrentChart()
    clearMessages()
    startNewConversation()

    // Initialize empty chart
    useChartStore.getState().setFullChart({
      chartType: 'bar', // default type
      chartData: { labels: [], datasets: [] },
      chartConfig: useChartStore.getState().chartConfig // this now has the dimensions applied
    })


    useDecorationStore.getState().clearShapes()
    setHasJSON(false) // Wait until they add data to set to true

    // Go to datasets tab
    setActiveTab('datasets_slices')
    const sizeLabel = dims.isResponsive ? 'Responsive' : `${dims.width}×${dims.height} px`
    toast.success(`Chart created (${sizeLabel}). Navigate to Datasets to add your data.`)
  };

  const renderCenterAreaLoader = () => (
    <div className="flex flex-1 items-center justify-center h-full relative">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin shadow-lg"></div>
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
            Preparing Editor
          </span>
          <span className="text-xs text-gray-400 mt-1">Loading workspace...</span>
        </div>
      </div>
    </div>
  );

  // Mobile layout for <=576px
  if (isMobile) {
    return (
      <div className="fixed inset-0 w-full h-full bg-gray-50 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b bg-white flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button 
              onClick={() => setSandwichOpen(true)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-all active:scale-90 flex-shrink-0"
              title="Open Menu"
            >
              <Menu className="w-5.5 h-5.5 text-slate-700" />
            </button>
            <Link href="/landing" className="flex items-center gap-2 px-1 text-slate-700 min-w-0">
              <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain flex-shrink-0" />
              <span className="hidden mob:inline text-slate-800 dark:text-slate-100 font-bold text-base tracking-tight select-none truncate">
                Chartography<span className="text-indigo-600 dark:text-indigo-400">.in</span>
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {hasJSON && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all active:scale-90"
                    title="More Options"
                  >
                    <Ellipsis className="w-5.5 h-5.5 text-slate-700 dark:text-slate-300" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[270px] p-1.5 z-[100] bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl shadow-xl space-y-1">
                {/* File Name & Metadata Section */}
                <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/60 mb-1 space-y-0.5 animate-none" onClick={(e) => e.stopPropagation()}>
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
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-650 transition-colors flex-shrink-0" 
                          title="Rename"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 text-[9.5px] text-slate-400 dark:text-slate-500 font-medium select-none leading-normal w-full">
                    {(() => {
                      const cfgW = parseDim(activeConfig?.width);
                      const cfgH = parseDim(activeConfig?.height);
                      
                      let w = 800;
                      let h = 600;
                      
                      if (editorMode === 'template') {
                        if (renderedFormat) {
                          w = renderedFormat.skeleton?.dimensions?.width || 800;
                          h = renderedFormat.skeleton?.dimensions?.height || 600;
                        } else {
                          const template = currentTemplate || templateInBackground;
                          if (template) {
                            w = template.width;
                            h = template.height;
                          }
                        }
                      } else {
                        w = cfgW || (originalCloudDimensions ? parseDim(originalCloudDimensions.width) : null) || 800;
                        h = cfgH || (originalCloudDimensions ? parseDim(originalCloudDimensions.height) : null) || 600;
                      }
                      
                      const aspect = getAspectRatio(w, h);
                      
                      const leftLabel = (editorMode === 'template' && currentTemplate)
                        ? `Template - ${currentTemplate.name || "Template"}`
                        : `Chart - ${getChartTypeName(chartType)}`;
                        
                      return (
                        <>
                          <span className="truncate flex-1 min-w-0 text-left" title={leftLabel}>
                            {leftLabel}
                          </span>
                          <span className="flex-shrink-0 text-right font-semibold tabular-nums text-slate-450 dark:text-slate-405">
                            {aspect} | {w}px × {h}px
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* 1. Segmented Mode Toggle */}
                <div className="px-2.5 py-0.5 flex justify-center mb-0.5">
                  <div className="flex w-full bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-inner">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const templateStore = useTemplateStore.getState();
                        templateStore.setGenerateMode('chart');
                        templateStore.setEditorMode('chart');
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
                        e.stopPropagation();
                        const templateStore = useTemplateStore.getState();
                        templateStore.setGenerateMode('template');
                        if (!templateStore.currentTemplate) {
                          templateStore.applyTemplate('template-1');
                        }
                        templateStore.setEditorMode('template');
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

                {/* 2. Select Dropdown for Chart Types */}
                <div className="px-2.5 py-1">
                  <Select 
                    value={chartType} 
                    onValueChange={(val) => {
                      setChartType(val as any);
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
                      setMobilePanel('styling');
                    }}
                    className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    <Palette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>Chart Gallery</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('triggerToggleGuides'));
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
                    window.dispatchEvent(new CustomEvent('triggerFullscreen'));
                  }}
                  className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  <Maximize2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Fullscreen</span>
                </DropdownMenuItem>

                {/* 4. Save Chart/Template to Cloud */}
                <DropdownMenuItem 
                  onSelect={handleSaveClick}
                  className="flex items-center gap-2 px-2.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  <Cloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <span>Save to Cloud</span>
                </DropdownMenuItem>

                {/* 4.5 Share Collapsible Accordion */}
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    if (!currentSnapshotId) {
                      toast.error("Please save your chart to the cloud first to share.");
                      return;
                    }
                    setShareExpanded(!shareExpanded);
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
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-755 dark:text-slate-355"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Copy Link</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleOpenShareLink}
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-755 dark:text-slate-355"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                      <span>Open Link</span>
                    </DropdownMenuItem>
                  </div>
                )}

                {/* 5. Export Collapsible Accordion */}
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault();
                    setExportExpanded(!exportExpanded);
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
                        <DropdownMenuItem 
                          onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'png' } }))}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                        >
                          <FileImage className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>PNG Image</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => window.dispatchEvent(new CustomEvent('triggerTemplateExport', { detail: { format: 'html' } }))}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                        >
                          <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Interactive HTML</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem 
                          onClick={exports.handleExport} 
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                        >
                          <FileImage className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>PNG Image</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={exports.handleExportJPEG} 
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                        >
                          <ImageIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>JPEG Image</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={exports.handleExportHTML} 
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                        >
                          <FileCode className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>Interactive HTML</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={exports.handleExportCSV} 
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md text-xs font-medium cursor-pointer text-slate-750 dark:text-slate-355"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>CSV Data</span>
                        </DropdownMenuItem>
                      </>
                    )}
                  </div>
                )}

                {/* 6. Reset / Clear Chart */}
                <DropdownMenuItem 
                  onSelect={handleCancel}
                  className="flex items-center gap-2 px-2.5 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-650 dark:text-red-450 rounded-lg text-xs font-medium cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-450" />
                  <span>Clear Workspace</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            )}
            <SimpleProfileDropdown size="sm" />
          </div>
        </div>
        {/* Chart Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 pb-20 overflow-hidden">
          <div className="w-full max-w-full flex-1 flex flex-col overflow-auto" style={{ maxHeight: 'calc(100vh - 120px)', height: '100%' }}>
            {!storeHydrated ? (
              renderCenterAreaLoader()
            ) : hasJSON ? (
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
                  onClick={() => {
                    if (tab.id === 'templates') {
                      const templateStore = useTemplateStore.getState()
                      if (!templateStore.currentTemplate) {
                        templateStore.applyTemplate('template-1')
                      }
                      setEditorMode('template')
                      setMobilePanel('tpl_templates')
                      setActiveTab('tpl_templates')
                    } else {
                      setMobilePanel(tab.id)
                    }
                  }}
                  className={`grow shrink-0 flex flex-col items-center justify-center px-2 py-2 min-w-[60px] text-center ${mobilePanel === tab.id ? "text-blue-700" : "text-gray-500"}`}
                >
                  <Icon className="h-6 w-6 mb-1 mx-auto" />
                  <span className="text-xs font-medium truncate w-full">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </nav>
        {/* Backdrop for mobile drawer */}
        {mobilePanel && (
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[55] transition-opacity duration-200"
            onClick={() => setMobilePanel(null)}
          />
        )}

        {/* Bottom Sheet/Drawer for Active Panel */}
        {mobilePanel && (
          <div className="fixed bottom-0 left-0 w-full mx-auto bg-white rounded-t-2xl shadow-2xl z-[60] animate-slide-up flex flex-col" style={{ height: '80vh' }}>
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

        {/* Clear Chart Dialog */}
        <ClearChartDialog
          open={showClearDialog}
          onOpenChange={setShowClearDialog}
          onSuccess={() => {
            // Additional success logic if needed
          }}
        />

        {/* Save Mode Conflict Dialog */}
        <SaveModeConflictDialog
          isOpen={showModeConflictDialog}
          onClose={() => setShowModeConflictDialog(false)}
          onSaveChartDiscardTemplate={handleSaveChartDiscardTemplate}
          onSaveAsSeparateChart={handleSaveAsSeparateChart}
          isSaving={isSaving}
        />

        {/* Setup Dialog for New Charts */}
        <ChartSetupDialog
          open={showSetupDialog}
          onClose={() => setShowSetupDialog(false)}
          onConfirm={handleDimensionsConfirmed}
        />
        {/* Sandwich Backdrop overlay */}
        {sandwichOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            style={{ zIndex: 90 }}
            onClick={() => setSandwichOpen(false)}
          />
        )}

        {/* Sandwich Drawer Window */}
        <div 
          className={`fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200 flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${
            sandwichOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ zIndex: 100, width: '280px' }}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between pl-[18px] pr-3 py-2.5 border-b border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-6 w-6 object-contain" />
              <span className="text-sm font-bold text-slate-700">Chartography.in</span>
            </div>
            <button 
              onClick={() => setSandwichOpen(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Drawer Content - Scrollable */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-0 py-2">
            <div className="flex items-center gap-2 mx-2 mb-2">
              {/* Board Button */}
              <button
                onClick={() => {
                  router.push('/board');
                  setSandwichOpen(false);
                }}
                className="flex-1 h-9 flex items-center justify-center gap-2 px-3 hover:bg-slate-50 border border-slate-200/60 rounded-lg transition-all active:scale-95 shadow-sm text-slate-700 font-semibold text-sm"
                title="Board"
              >
                <LayoutDashboard className="w-4 h-4 text-slate-500" />
                <span>Board</span>
              </button>

              {/* AI Button */}
              <button
                onClick={() => {
                  router.push('/landing');
                  setSandwichOpen(false);
                }}
                className="flex-1 h-9 flex items-center justify-center gap-2 px-3 hover:bg-slate-50 border border-slate-200/60 rounded-lg transition-all active:scale-95 shadow-sm text-slate-700 font-semibold text-sm"
                title="AI Chat"
              >
                <Sparkles className="w-4 h-4 text-slate-500" />
                <span>AI Chat</span>
              </button>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-slate-100 mb-2" />

            {/* History Section - remaining space */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <HistoryDropdown variant="sidebar" onConversationRestored={() => setSandwichOpen(false)} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Tablet overlay sidebar logic
  if (isTablet) {
    return (
      <div className="flex h-full w-full bg-gray-50 overflow-hidden relative">
        {/* Left Sidebar - Collapsed by default, shows only icons */}
        <div className="w-16 flex-shrink-0 flex flex-col h-full items-center py-3 bg-white border-r border-gray-200 overflow-hidden group">
          <div className="flex flex-col items-center space-y-3 w-full">
            {/* Company Logo / Toggle Sidebar */}
            <button
              onClick={() => setLeftSidebarCollapsed(false)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl shadow-xs hover:bg-slate-100 transition-all flex items-center justify-center w-9 h-9"
              title="Expand Sidebar"
            >
              {/* Logo image, hidden when parent sidebar is hovered */}
              <img src="/logo.png" alt="Company Logo" className="w-5 h-5 object-contain group-hover:hidden" />
              
              {/* PanelLeft icon, visible only when parent sidebar is hovered */}
              <PanelLeft className="w-5 h-5 hidden group-hover:block text-slate-500 hover:text-slate-800" />
            </button>

            {/* Quick Navigation Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200/60 shadow-xs transition-all hover:shadow-sm"
                  title="Quick Navigation"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-40 z-50 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-lg rounded-xl p-1.5">
                <DropdownMenuItem
                  onClick={() => router.push('/board')}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                  <span>Board</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/landing')}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                  <span>AI Chat</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="w-10 h-px bg-gray-200 my-4" />

          {/* Config Tabs Icons */}
          <div className="flex flex-col items-center space-y-1 w-full flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'templates') {
                      const templateStore = useTemplateStore.getState()
                      if (!templateStore.currentTemplate) {
                        templateStore.applyTemplate('template-1')
                      }
                      useTemplateStore.getState().setEditorMode('template')
                      setActiveTab('tpl_templates')
                    } else {
                      setActiveTab(tab.id)
                    }
                    setRightSidebarCollapsed(false)
                  }}
                  className={`p-2 rounded-lg flex items-center justify-center w-10 h-10 transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  title={tab.label}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Chart Area (between left and right sidebars) */}
        <div className="flex-1 min-w-0 pr-4 pl-2 pt-2 pb-4">
          {!storeHydrated ? (
            renderCenterAreaLoader()
          ) : hasJSON ? (
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

          {/* Action Buttons: Share, Save, Cancel, History - Below collapse button */}
          <div className="flex flex-col items-center gap-2 px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSharingLink || !currentSnapshotId}
                  className="h-10 w-10 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!currentSnapshotId ? "Save to share" : "Share options"}
                >
                  {isSharingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-40 z-50 bg-white border border-slate-200 shadow-md rounded-md p-1">
                <DropdownMenuItem onClick={handleCopyShareLink} className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer font-medium hover:bg-slate-100 rounded-md">
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenShareLink} className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer font-medium hover:bg-slate-100 rounded-md">
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  <span>Open Link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <HistoryDropdown variant="compact" className="h-10 w-10 p-0" />
          </div>

          {/* Spacer to push buttons to top */}
          <div className="flex-1"></div>
        </div>

        {/* Left Sidebar Overlay when expanded */}
        {(!leftSidebarCollapsed) && (
          <div className="fixed top-0 left-0 h-full w-52 z-40 bg-white shadow-2xl border-r border-gray-200 flex flex-col overflow-hidden">
            {/* Unified Editor Header */}
            <div className="flex flex-col border-b border-gray-100 flex-shrink-0 pt-2 pb-2">
              <div className="flex justify-center mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2.5">
                  <img src="/logo.png" alt="Company Logo" className="w-[22px] h-[22px] object-contain" />
                  <span className="text-slate-300 font-light text-sm">|</span>
                  <span>Advanced Editor</span>
                </span>
              </div>

              <div className="flex items-center px-2">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    onClick={() => router.push('/board')}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 px-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 shadow-sm transition-colors"
                    title="Board"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
                    <span>Board</span>
                  </button>
                  <button
                    onClick={() => router.push('/landing')}
                    className="flex-1 flex items-center justify-center gap-1.5 h-8 px-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 rounded-md border border-slate-200 shadow-sm transition-colors"
                    title="AI Chat"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    <span>AI Chat</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-hidden pt-1">
              <Sidebar
                activeTab={activeTab}
                onTabChange={setActiveTab}
                onToggleLeftSidebar={() => setLeftSidebarCollapsed(true)}
                isLeftSidebarCollapsed={leftSidebarCollapsed}
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

  // Desktop layout for >1024px
  // The layout wrapper and left sidebar are handled by layout.tsx (App Shell Architecture)
  return (
    <>
      {/* Center Area - Chart Preview */}
      <div className="flex-1 min-w-0 pr-4 pl-1 pt-2 pb-4 h-full overflow-hidden flex flex-col">
        {!storeHydrated ? (
          renderCenterAreaLoader()
        ) : hasJSON ? (
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

          {/* Action Buttons: Share, Save, Cancel, History - Below collapse button */}
          <div className="flex flex-col items-center gap-2 px-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSharingLink || !currentSnapshotId}
                  className="h-10 w-10 p-0 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!currentSnapshotId ? "Save to share" : "Share options"}
                >
                  {isSharingLink ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Share2 className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right" className="w-40 z-50 bg-white border border-slate-200 shadow-md rounded-md p-1">
                <DropdownMenuItem onClick={handleCopyShareLink} className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer font-medium hover:bg-slate-100 rounded-md">
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleOpenShareLink} className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer font-medium hover:bg-slate-100 rounded-md">
                  <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
                  <span>Open Link</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <HistoryDropdown variant="compact" className="h-10 w-10 p-0" />
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
        onSuccess={() => {
          // Additional success logic if needed
        }}
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

      {/* Setup Dialog for New Charts */}
      <ChartSetupDialog
        open={showSetupDialog}
        onClose={() => setShowSetupDialog(false)}
        onConfirm={handleDimensionsConfirmed}
      />

    </>
  )
}




