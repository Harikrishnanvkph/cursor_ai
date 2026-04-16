"use client"

import { DatasetPanel } from "./panels/dataset-panel"
import { DesignPanel } from "./panels/design-settings"
import { AxesPanel } from "./panels/axes/axes-panel"
import { LabelsPanel } from "./panels/labels-panel"
import { OverlayPanel } from "./panels/overlay-panel"
import { AdvancedPanel } from "./panels/advanced-panel"
import { ExportPanel } from "./panels/export-panel"
import { TypesTogglesPanel } from "./panels/types-toggles-panel"
import { DatasetsSlicesPanel } from "./panels/datasets-slices-panel"
import { TemplatesPanel, TemplateContentPanel } from "./panels/template-settings"
import { TemplateTextPanel } from "./panels/template-panels/template-text-panel"
import { TemplateChartZonePanel } from "./panels/template-panels/template-chart-zone-panel"
import { FormatZonesPanel } from "./panels/template-panels/format-zones-panel"
import { DecorationsPanel } from "./panels/template-panels/decorations-panel"
import { BackgroundPanel } from "./panels/template-panels/background-panel"
import { GroupedSettingsFilter } from "./panels/grouped-settings-filter"
import { Button } from "@/components/ui/button"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { ChevronLeft, Settings, Save, X, Loader2, Plus } from "lucide-react"
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
  const { chartType, chartData, chartConfig, hasJSON, resetChart, setHasJSON } = useChartStore();
  const { messages, clearMessages, startNewConversation, setBackendConversationId } = useChatStore();

  const [showClearDialog, setShowClearDialog] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 576);
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
        return <DesignPanel />
      case "axes":
        return <AxesPanel />
      case "labels":
        return <LabelsPanel />
      case "overlay":
        return <OverlayPanel />
      case "advanced":
        return <AdvancedPanel />
      case "templates":
      case "tpl_templates":
        return <TemplatesPanel />
      case "export":
        return <ExportPanel onTabChange={onTabChange} />
      case "tpl_content":
        return <TemplateContentPanel />
      case "tpl_text":
        return <TemplateTextPanel />
      case "tpl_chart_zone":
        return <TemplateChartZonePanel />
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
              <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${isSidebarCollapsed ? '' : 'rotate-180'}`} />
            </Button>
          )}

          {/* Action Buttons: New, Save, Cancel, History */}
          <div className="flex gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={onNewChart}
              className="h-8 px-3 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
              title="Create new chart from scratch"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={onSaveClick || handleSave}
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
        {/* Grouped Mode Settings Filter - shows Group/Dataset dropdowns */}
        {activeTab === 'labels' && (
          <GroupedSettingsFilter />
        )}
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
