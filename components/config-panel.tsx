"use client"

import { DatasetPanel } from "./panels/dataset-panel"
import { DesignPanel } from "./panels/design-settings"
import { AxesPanel } from "./panels/axes/axes-panel"
import { LabelsPanel } from "./panels/labels-panel"
import { CombinedStylingPanel } from "./panels/combined-styling-panel"

import { AdvancedPanel } from "./panels/advanced-panel"

import { TypesTogglesPanel } from "./panels/types-toggles-panel"
import { DatasetsSlicesPanel } from "./panels/datasets-slices-panel"
import { TemplatesPanel, TemplateContentPanel } from "./panels/template-settings"
import { TemplateChartZonePanel } from "./panels/template-panels/template-chart-zone-panel"
import { FormatZonesPanel } from "./panels/template-panels/format-zones-panel"
import { DecorationsPanel } from "./panels/template-panels/decorations-panel"
import { BackgroundPanel } from "./panels/template-panels/background-panel"
import { Button } from "@/components/ui/button"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { PanelRight, Settings, Save, Trash2, Loader2, Share2, Copy, ExternalLink, SquarePen, BarChart2, Layers } from "lucide-react"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { HistoryDropdown } from "@/components/history-dropdown"
import { useChartStore } from "@/lib/chart-store"
import { saveChartToCloud } from "@/lib/save-utils"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { dataService } from "@/lib/data-service"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { clearCurrentChart } from "@/lib/storage-utils"

import { DEFAULT_GROUP } from "@/lib/chart-store"
import { ClearChartDialog } from "./dialogs/clear-chart-dialog"

interface ConfigPanelProps {
  activeTab: string
  onToggleSidebar?: () => void
  isSidebarCollapsed?: boolean
  onTabChange?: (tab: string) => void
  onNewChart?: () => void
  onSaveClick?: () => void
}

export function ConfigPanel({ activeTab, onToggleSidebar, isSidebarCollapsed, onTabChange, onNewChart, onSaveClick }: ConfigPanelProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, signOut } = useAuth();
  const router = useRouter();
  const { chartType, chartData, chartConfig, hasJSON, resetChart, setHasJSON, currentSnapshotId } = useChartStore();
  const { messages, clearMessages, startNewConversation, setBackendConversationId } = useChatStore();

  const [showClearDialog, setShowClearDialog] = useState(false)
  const [isSharingLink, setIsSharingLink] = useState(false);

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
  };

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
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);

    await saveChartToCloud({
      user,
      onSaveComplete: () => {
        setIsSaving(false);
      }
    });
  };

  const handleCancel = () => {
    setShowClearDialog(true)
  };

  const renderPanel = () => {
    switch (activeTab) {
      // ═══ Chart Mode Panels ═══
      case "types_toggles":
        return <TypesTogglesPanel />
      case "datasets_slices":
        return <DatasetsSlicesPanel />
      case "datasets":
        return <DatasetPanel />
      case "design":
        return <CombinedStylingPanel initialTab="bg" />
      case "labels":
        return <CombinedStylingPanel initialTab="labels" />
      case "styling":
        return <CombinedStylingPanel initialTab="styling" />
      case "axes":
        return <AxesPanel />

      case "decorations":
        return <DecorationsPanel />
      case "advanced":
        return <AdvancedPanel />
      case "templates":
      case "tpl_templates":
        return <TemplatesPanel />

      case "tpl_content":
        return <TemplateContentPanel />
      case "tpl_chart_zone":
        return <TemplateChartZonePanel onTabChange={onTabChange} />
      case "tpl_decorations":
        return <DecorationsPanel />
      case "tpl_background":
        return <BackgroundPanel />

      case "tpl_format_zones":
        return <FormatZonesPanel />
      default:
        return <TypesTogglesPanel />
    }
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-white border-l border-gray-200 shadow-sm">
      {/* Header - Hidden on mobile */}
      {!isMobile && (
        <div className="flex items-center justify-between py-1.5 px-3 border-b border-gray-200 bg-white">
          {/* Expand/Collapse Button */}
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <PanelRight className="w-4 h-4" />
            </button>
          )}

          {/* 1. New / Add Dropdown — Single Chart or Grouped Chart */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={!hasJSON}
                className="p-1.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-500 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer outline-none"
                title={!hasJSON ? "Create a chart first to add datasets/groups" : "Add Single or Grouped Chart"}
              >
                <SquarePen className="w-4 h-4 text-blue-600 dark:text-blue-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 z-50 bg-white border border-slate-200 shadow-md rounded-md p-1">
              <DropdownMenuItem
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openAddDatasetModal'));
                }}
                className="flex items-center gap-2 px-2.5 py-2 text-xs cursor-pointer font-medium hover:bg-slate-100 rounded-md text-slate-700"
              >
                <BarChart2 className="h-4 w-4 text-blue-600" />
                <div className="flex flex-col">
                  <span className="font-semibold">Single Chart</span>
                  <span className="text-[10px] text-slate-400">Add dataset to chart</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('openNewGroupModal'));
                }}
                className="flex items-center gap-2 px-2.5 py-2 text-xs cursor-pointer font-medium hover:bg-slate-100 rounded-md text-slate-700"
              >
                <Layers className="h-4 w-4 text-purple-600" />
                <div className="flex flex-col">
                  <span className="font-semibold">Grouped Chart</span>
                  <span className="text-[10px] text-slate-400">Create a new group</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 2. Save Button */}
          <button
            type="button"
            onClick={onSaveClick || handleSave}
            disabled={!hasJSON || isSaving}
            className="p-1.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-500 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40 transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer outline-none"
            title="Save chart to online database"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> : <Save className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />}
          </button>

          {/* 3. Delete / Clear Button */}
          <button
            type="button"
            onClick={handleCancel}
            disabled={!hasJSON}
            className="p-1.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/40 transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent cursor-pointer outline-none"
            title="Clear chart and start new"
          >
            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
          </button>

          {/* 4. Share Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={isSharingLink || !currentSnapshotId}
                className="p-1.5 h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 dark:text-slate-400 dark:hover:text-blue-400 dark:hover:bg-blue-950/40 transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-slate-600 cursor-pointer"
                title={!currentSnapshotId ? "Save to share" : "Share options"}
              >
                {isSharingLink ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40 z-50 bg-white border border-slate-200 shadow-md rounded-md p-1">
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

          {/* 5. History Dropdown */}
          <HistoryDropdown
            variant="inline"
            className="border-0 bg-transparent shadow-none hover:bg-slate-100 hover:text-slate-900 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 flex-shrink-0"
          />

          {/* Profile Icon - Dropdown Menu - Always visible */}
          <div className="flex-shrink-0">
            <SimpleProfileDropdown size="sm" />
          </div>
        </div>
      )}

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto pt-2.5 px-4 pb-4 bg-white">
        <div className="animate-in fade-in duration-200">
          {renderPanel()}
        </div>
      </div>
      {/* Clear Confirmation Dialog */}
      {/* Clear Confirmation Dialog */}
      <ClearChartDialog
        open={showClearDialog}
        onOpenChange={setShowClearDialog}
      />
    </div>
  )
}
