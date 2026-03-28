"use client"

import { cn } from "@/lib/utils"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import {
  AlignEndHorizontal,
  Database,
  Palette,
  Grid,
  Tag,
  Layers,
  SlidersHorizontal,
  Download,
  ChevronRight,
  FileText,
  Type,
  BarChart3,
  LayoutGrid,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onToggleLeftSidebar?: () => void
  isLeftSidebarCollapsed?: boolean
}

// ═══════════════════════════════════════════
// Chart Mode Tabs (original)
// ═══════════════════════════════════════════
const CHART_TABS = [
  { id: "types_toggles", label: "Types and Toggles", icon: AlignEndHorizontal },
  { id: "datasets_slices", label: "Datasets and Slices", icon: Database },
  { id: "design", label: "Design", icon: Palette },
  { id: "axes", label: "Axes", icon: Grid },
  { id: "labels", label: "Legend and Label", icon: Tag },
  { id: "overlay", label: "Overlay", icon: Layers },
  { id: "advanced", label: "Advanced", icon: SlidersHorizontal },
  { id: "templates", label: "Templates", icon: FileText },
  { id: "export", label: "Export", icon: Download },
]

// ═══════════════════════════════════════════
// Template/Format Mode Tabs (NEW)
// ═══════════════════════════════════════════
const TEMPLATE_TABS = [
  { id: "tpl_templates", label: "Templates", icon: FileText },
  { id: "tpl_text", label: "Text Areas", icon: Type },
  { id: "tpl_chart_zone", label: "Chart Zone", icon: BarChart3 },
  { id: "tpl_decorations", label: "Decorations", icon: Sparkles },
  { id: "tpl_format_zones", label: "Format Zones", icon: LayoutGrid },
  { id: "export", label: "Export", icon: Download },
]

// Export for use in editor/page.tsx
export { CHART_TABS, TEMPLATE_TABS }

export function Sidebar({ activeTab, onTabChange, onToggleLeftSidebar, isLeftSidebarCollapsed }: SidebarProps) {
  const {
    chartMode,
    chartData,
    activeDatasetIndex,
    setActiveDatasetIndex,
    groups,
    activeGroupId,
    setActiveGroupId
  } = useChartStore()

  const { editorMode, setEditorMode, currentTemplate } = useTemplateStore()
  const { selectedFormatId } = useFormatGalleryStore()

  const datasets = chartData.datasets || []
  const isTemplateMode = editorMode === 'template'

  // Choose tabs based on current editor mode
  const tabs = isTemplateMode ? TEMPLATE_TABS : CHART_TABS

  // Filter out Format Zones tab if no format is selected
  const visibleTabs = tabs.filter(tab => {
    if (tab.id === 'tpl_format_zones' && !selectedFormatId) return false
    return true
  })

  const handleBackToChart = () => {
    setEditorMode('chart')
    onTabChange('types_toggles')
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 p-3 flex flex-col overflow-hidden">
      <div className={cn(
        "flex items-center flex-shrink-0 gap-2 mb-4",
        !onToggleLeftSidebar && "mb-2"
      )}>
        <div className="flex-1 min-w-0">
          {isTemplateMode ? (
            // Template mode header
            <div className="h-8 flex items-center px-3 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest truncate">
                {selectedFormatId ? '🎨 Format Editor' : '📄 Template Editor'}
              </span>
            </div>
          ) : (
            // Chart mode header (original)
            <>
              {((chartMode === 'single' && datasets.length === 0) || (chartMode === 'grouped' && groups.length === 0)) ? (
                <div className="h-8 flex items-center px-3 bg-gray-50 border border-gray-100 rounded-lg shadow-sm">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chart Editor</span>
                </div>
              ) : chartMode === 'single' ? (
                <Select
                  value={activeDatasetIndex.toString()}
                  onValueChange={(val) => setActiveDatasetIndex(parseInt(val))}
                >
                  <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((ds: any, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {ds.sourceTitle || ds.label || `Dataset ${i + 1}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select
                  value={activeGroupId}
                  onValueChange={setActiveGroupId}
                >
                  <SelectTrigger className="h-8 text-xs bg-gray-50 border-gray-200 hover:bg-gray-100 transition-colors">
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}
        </div>

        {onToggleLeftSidebar && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleLeftSidebar}
            className="h-8 w-8 p-0 hover:bg-gray-200 hover:shadow-sm transition-all duration-200 rounded-lg flex-shrink-0"
            title={isLeftSidebarCollapsed ? "Expand Left Sidebar" : "Collapse Left Sidebar"}
          >
            <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isLeftSidebarCollapsed ? '' : 'rotate-180'}`} />
          </Button>
        )}
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-sm border",
                activeTab === tab.id
                  ? isTemplateMode
                    ? "bg-amber-50 text-amber-700 border-amber-200 shadow-sm"
                    : "bg-blue-50 text-blue-700 border-blue-200 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-transparent",
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="font-medium truncate">{tab.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Back to Chart button (only in template mode) */}
      {isTemplateMode && (
        <div className="pt-2 border-t border-gray-100 mt-2 flex-shrink-0">
          <button
            onClick={handleBackToChart}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-all duration-200"
          >
            <ArrowLeftRight className="h-4 w-4" />
            <span>Back to Chart Editor</span>
          </button>
        </div>
      )}
    </div>
  )
}
