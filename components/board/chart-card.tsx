"use client"

import React, { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type Conversation } from "@/lib/history-store"
import { useHistoryStore } from "@/lib/history-store"
import { dataService } from "@/lib/data-service"
import { toast } from "sonner"
import {
  Eye,
  Edit3,
  Download,
  Share2,
  Trash2,
  MoreVertical,
  Copy,
  ExternalLink,
  PencilRuler,
  Calendar,
  BarChart3,
  LayoutTemplate,
  Activity,
  Pencil,
  Loader2,
  MessageSquare,
  PieChart,
  LineChart
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Chart as ChartJS } from "chart.js"
import "@/lib/chart-registration"
import { chartTypeMapping, type SupportedChartType } from "@/lib/chart-defaults"
import { DecorationShapeRenderer } from "@/components/decorations/DecorationShapeRenderer"

interface ChartCardProps {
  conversation: Conversation
  viewMode: "grid" | "list"
  onPreview: (conv: Conversation) => void
  onEdit: (conv: Conversation) => void
  onEditInAdvanced: (conv: Conversation) => void
}

export function ChartCard({ conversation, viewMode, onPreview, onEdit, onEditInAdvanced }: ChartCardProps) {
  const { deleteConversation, updateConversation } = useHistoryStore()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [newName, setNewName] = useState(conversation.title)
  const [isRenaming, setIsRenaming] = useState(false)
  const [shareTab, setShareTab] = useState<"share" | "embed">("share")
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Viewport-aware live preview states
  const [isVisible, setIsVisible] = useState(false)
  const [snapshotData, setSnapshotData] = useState<{
    chartType: string
    chartData: any
    chartConfig: any
    is_template_mode?: boolean
    template_structure?: any
    template_content?: any
  } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<ChartJS | null>(null)

  // Intersection Observer — two-way: mount when entering viewport, unmount when leaving
  useEffect(() => {
    if (viewMode !== "grid") {
      setIsVisible(false)
      return
    }

    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting)
      },
      { rootMargin: "200px" } // Pre-mount slightly before visible, keep alive slightly after leaving
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [viewMode])

  // Dynamic snapshot data fetching — only fetches once, cached in state permanently
  useEffect(() => {
    if (!isVisible || viewMode !== "grid") return

    // Already have cached data from a previous mount — skip entirely (no server call)
    if (snapshotData) return

    // If conversation already contains full details, utilize immediately
    if (conversation.snapshot && conversation.snapshot.chartData) {
      setSnapshotData({
        chartType: conversation.snapshot.chartType,
        chartData: conversation.snapshot.chartData,
        chartConfig: conversation.snapshot.chartConfig,
        is_template_mode: conversation.snapshot.is_template_mode || false,
        template_structure: conversation.snapshot.template_structure,
        template_content: conversation.snapshot.template_content
      })
      return
    }

    const loadSnapshot = async () => {
      setIsLoading(true)
      setFetchError(null)
      try {
        const response = await dataService.getCurrentChartSnapshot(conversation.id)
        if (response.error) {
          throw new Error(response.error)
        }
        if (response.data) {
          setSnapshotData({
            chartType: response.data.chart_type,
            chartData: response.data.chart_data,
            chartConfig: response.data.chart_config,
            is_template_mode: response.data.is_template_mode || false,
            template_structure: response.data.template_structure,
            template_content: response.data.template_content
          })
        }
      } catch (err: any) {
        console.warn(`Failed to lazy-load preview snapshot for card ${conversation.id}:`, err)
        setFetchError("Preview unavailable")
      } finally {
        setIsLoading(false)
      }
    }
    loadSnapshot()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, conversation.id, conversation.snapshot, viewMode])

  const [templateScale, setTemplateScale] = useState(1)

  useEffect(() => {
    if (!containerRef.current || !snapshotData?.template_structure || viewMode !== "grid" || !isVisible) return
    
    const updateScale = () => {
      if (!containerRef.current || !snapshotData?.template_structure) return
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight
      
      const templateW = snapshotData.template_structure.width || 800
      const templateH = snapshotData.template_structure.height || 600
      
      const scaleX = containerWidth / templateW
      const scaleY = containerHeight / templateH
      setTemplateScale(Math.min(scaleX, scaleY))
    }

    updateScale()
    
    const resizeObserver = new ResizeObserver(() => {
      updateScale()
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [snapshotData?.template_structure, viewMode, isVisible])

  // ChartJS instance instantiation & cleanup — destroys when card leaves viewport, recreates on re-entry
  useEffect(() => {
    if (!canvasRef.current || !snapshotData || viewMode !== "grid" || !isVisible) {
      // Destroy chart if scrolled off-screen
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
      return
    }

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clean up any existing chart before creating a new one
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
      chartInstanceRef.current = null
    }

    try {
      // Configure high-performance static rendering
      const options = {
        ...(snapshotData.chartConfig || {}),
        responsive: true,
        maintainAspectRatio: false,
        animation: false, // Turn off active animations for smooth scrolling
        plugins: {
          ...(snapshotData.chartConfig?.plugins || {}),
          legend: { display: false },     // Hide legend in list card previews
          tooltip: { enabled: false },    // Disable active mouse tooltips
          datalabels: { display: false }, // Hide text values labels
          title: { display: false },      // Hide title inside thumbnail to prevent squishing
          subtitle: { display: false }    // Hide subtitle inside thumbnail to prevent squishing
        },
        scales: {
          ...(snapshotData.chartConfig?.scales || {}),
          x: { display: false, grid: { display: false } },
          y: { display: false, grid: { display: false } }
        }
      }

      const resolvedType = chartTypeMapping[snapshotData.chartType as SupportedChartType] || snapshotData.chartType;

      const mappedDatasets = (snapshotData.chartData?.datasets || []).map((ds: any) => {
        const mappedDs = { ...ds }
        if (ds.type) {
          mappedDs.type = chartTypeMapping[ds.type as SupportedChartType] || ds.type
        }
        if (ds.chartType) {
          mappedDs.chartType = chartTypeMapping[ds.chartType as SupportedChartType] || ds.chartType
        }
        return mappedDs
      })

      const mappedChartData = {
        ...snapshotData.chartData,
        datasets: mappedDatasets
      }

      chartInstanceRef.current = new ChartJS(ctx, {
        type: resolvedType as any,
        data: mappedChartData as any,
        options: options as any
      })
    } catch (err) {
      console.warn("ChartJS preview rendering error:", err)
    }

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [snapshotData, viewMode, isVisible])

  // Focus input when rename dialog opens
  useEffect(() => {
    if (showRenameDialog && renameInputRef.current) {
      setTimeout(() => {
        renameInputRef.current?.focus()
        renameInputRef.current?.select()
      }, 100)
    }
  }, [showRenameDialog])

  const handleRename = async () => {
    if (!newName.trim() || newName === conversation.title) {
      setShowRenameDialog(false)
      return
    }

    setIsRenaming(true)
    try {
      // Update in backend
      const result = await dataService.updateConversation(conversation.id, { title: newName.trim() })
      if (result.error) {
        throw new Error(result.error)
      }

      // Update local state using existing updateConversation method
      updateConversation(conversation.id, { title: newName.trim() })

      toast.success("Chart renamed successfully")
      setShowRenameDialog(false)
    } catch (error) {
      console.error("Rename error:", error)
      toast.error("Failed to rename chart")
    } finally {
      setIsRenaming(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this chart?")) return

    setIsDeleting(true)
    try {
      await deleteConversation(conversation.id)
      toast.success("Chart deleted successfully")
    } catch (error) {
      toast.error("Failed to delete chart")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDownload = async () => {
    if (!conversation.snapshot) return

    try {
      // Create a temporary canvas to render the chart
      const canvas = document.createElement("canvas")
      canvas.width = 1200
      canvas.height = 800

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        toast.error("Failed to create canvas context")
        return
      }

      const resolvedType = chartTypeMapping[conversation.snapshot.chartType as SupportedChartType] || conversation.snapshot.chartType;

      const mappedDatasets = (conversation.snapshot.chartData?.datasets || []).map((ds: any) => {
        const mappedDs = { ...ds }
        if (ds.type) {
          mappedDs.type = chartTypeMapping[ds.type as SupportedChartType] || ds.type
        }
        if (ds.chartType) {
          mappedDs.chartType = chartTypeMapping[ds.chartType as SupportedChartType] || ds.chartType
        }
        return mappedDs
      })

      const mappedChartData = {
        ...conversation.snapshot.chartData,
        datasets: mappedDatasets
      }

      // Create chart instance
      const chart = new ChartJS(ctx, {
        type: resolvedType as any,
        data: mappedChartData as any,
        options: {
          ...conversation.snapshot.chartConfig,
          animation: false,
          responsive: false,
        },
      })

      // Wait for chart to render
      await new Promise(resolve => setTimeout(resolve, 500))

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate image")
          return
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        chart.destroy()
        toast.success("Chart downloaded successfully!")
      })
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download chart")
    }
  }

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/chart/${conversation.id}`
    navigator.clipboard.writeText(shareUrl)
    toast.success("Share link copied to clipboard!")
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    })
  }

  const getChartTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      bar: "bg-violet-50 text-violet-750 border-violet-100",
      line: "bg-fuchsia-50 text-fuchsia-750 border-fuchsia-100",
      pie: "bg-purple-50 text-purple-750 border-purple-100",
      doughnut: "bg-pink-50 text-pink-750 border-pink-100",
      radar: "bg-indigo-50 text-indigo-750 border-indigo-100",
      polarArea: "bg-rose-50 text-rose-750 border-rose-100",
      bubble: "bg-blue-50 text-blue-750 border-blue-100",
      scatter: "bg-cyan-50 text-cyan-750 border-cyan-100",
    }
    return colors[type] || "bg-zinc-50 text-zinc-700 border-zinc-150"
  }

  // Check if this is a template mode snapshot
  const isTemplateMode = !!(
    conversation.is_template_mode ||
    conversation.snapshot?.is_template_mode ||
    snapshotData?.is_template_mode
  )

  const getChartIcon = (sizeClass = "w-8 h-8") => {
    if (isTemplateMode) return <LayoutTemplate className={`${sizeClass} text-purple-500`} />;

    const type = conversation.snapshot?.chartType;
    switch (type) {
      case 'pie':
      case 'doughnut':
      case 'polarArea':
        return <PieChart className={`${sizeClass} text-pink-500`} />;
      case 'line':
      case 'radar':
        return <LineChart className={`${sizeClass} text-green-500`} />;
      case 'scatter':
      case 'bubble':
        return <Activity className={`${sizeClass} text-orange-500`} />;
      default:
        return <BarChart3 className={`${sizeClass} text-blue-500`} />;
    }
  };

  if (viewMode === "list") {
    return (
      <Card className="group border shadow-none border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 rounded-xl overflow-hidden">
        <div className="p-3.5 sm:py-3.5 sm:px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
          
          {/* Left Section: Icon + Title/Date Info */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            {/* Compact Mini Preview Icon Box */}
            <div
              className="flex-shrink-0 w-14 h-14 bg-zinc-50 bg-[radial-gradient(#e4e4e7_1px,transparent_1px)] [background-size:8px_8px] rounded-xl border border-zinc-200 flex items-center justify-center cursor-pointer hover:border-violet-300 hover:shadow-sm transition-all duration-200 relative group/icon overflow-hidden"
              onClick={() => onPreview(conversation)}
              title="Preview Chart"
            >
              <div className="relative z-10 scale-95 transition-transform duration-200 group-hover:scale-100">
                {getChartIcon("w-6 h-6")}
              </div>
              <div className="absolute inset-0 bg-violet-500/5 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-xl">
                <Eye className="w-4 h-4 text-violet-600" />
              </div>
            </div>

            {/* Info Section */}
            <div className="min-w-0 flex-1 flex flex-col justify-center">
              <h3 
                className="text-[14.5px] font-semibold text-zinc-950 truncate hover:text-violet-700 cursor-pointer transition-colors leading-tight"
                onClick={() => onPreview(conversation)}
              >
                {conversation.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-zinc-400 shrink-0 align-middle" />
                  <span className="leading-none">{formatDate(conversation.timestamp)}</span>
                </div>
                {conversation.messages.length > 0 && (
                  <div className="flex items-center gap-1.5 border-l border-zinc-200 pl-3">
                    <MessageSquare className="h-3.5 w-3.5 text-zinc-400 shrink-0 align-middle" />
                    <span className="leading-none">{conversation.messages.length} messages</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section: Badge Tag + Actions */}
          <div className="flex items-center justify-between sm:justify-end gap-5 flex-shrink-0">
            {/* Badge Tag */}
            {isTemplateMode ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-full text-[11px] font-semibold bg-purple-50 text-purple-750 border-purple-100 shrink-0 select-none leading-none">
                <LayoutTemplate className="w-3 h-3 text-purple-600 shrink-0" />
                Template
              </span>
            ) : (
              <span className={`inline-flex items-center px-2.5 py-0.5 border rounded-full text-[11px] font-semibold capitalize shrink-0 select-none leading-none ${getChartTypeColor(conversation.snapshot?.chartType || "")}`}>
                {conversation.snapshot?.chartType || "Unknown"}
              </span>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => onPreview(conversation)}
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-[11px] font-semibold border-zinc-200 text-zinc-700 bg-white hover:border-violet-300 hover:bg-violet-50 hover:text-violet-750 transition-all rounded-lg px-3 shadow-none cursor-pointer"
              >
                <Eye className="h-3.5 w-3.5 text-zinc-500" />
                Preview
              </Button>
              <Button
                onClick={() => onEdit(conversation)}
                variant="outline"
                size="sm"
                className="gap-1.5 h-8 text-[11px] font-semibold border-zinc-200 text-zinc-700 bg-white hover:border-violet-300 hover:bg-violet-50 hover:text-violet-750 transition-all rounded-lg px-3 shadow-none cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5 text-zinc-500" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-zinc-200 text-zinc-500 bg-white hover:border-violet-300 hover:bg-violet-50 hover:text-violet-750 transition-all rounded-lg shadow-none cursor-pointer">
                    <MoreVertical className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onSelect={() => setShowRenameDialog(true)} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditInAdvanced(conversation)} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                    <PencilRuler className="h-4 w-4 mr-2" />
                    Advanced Editor
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDownload} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-650 focus:text-red-600 focus:bg-red-50/50 text-xs py-2 cursor-pointer">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

        </div>

        <Dialog open={showRenameDialog} onOpenChange={(open) => { if (!isRenaming) setShowRenameDialog(open); }}>
          <DialogContent className="max-w-md p-5 bg-white border border-gray-200 rounded-lg shadow-xl" hideCloseButton={isRenaming}>
            <DialogHeader className="mb-4">
              <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-600" />
                Rename Chart
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-gray-600">
                Enter a new name for this chart.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
              <div className="mb-5">
                <Label htmlFor="rename-input-list" className="text-sm font-medium text-gray-700">
                  Chart Name
                </Label>
                <Input
                  ref={renameInputRef}
                  id="rename-input-list"
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Awesome Chart"
                  className="mt-1.5"
                  disabled={isRenaming}
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {newName.length}/100 characters
                </p>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRenameDialog(false)}
                  disabled={isRenaming}
                  className="inline-flex items-center justify-center h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="inline-flex items-center justify-center h-9 rounded-md bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-750 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shadow-sm transition-colors disabled:opacity-50"
                >
                  {isRenaming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Renaming...
                    </>
                  ) : (
                    'Rename'
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // Grid view
  return (
    <Card className="group relative overflow-hidden border shadow-sm border-gray-200 bg-white hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <CardContent className="relative space-y-4 p-5">
        {/* Chart Preview */}
        <div
          ref={containerRef}
          className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-violet-300 transition-all duration-300 group-hover:scale-[1.02] flex items-center justify-center relative"
          onClick={() => onPreview(conversation)}
        >
          {/* Preview Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(139,92,246,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          </div>

          {/* Dynamic Render Conditions */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-50/50 backdrop-blur-[1px] animate-pulse">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
                <span className="text-[10px] font-bold text-violet-700 tracking-wider uppercase">Loading chart...</span>
              </div>
            </div>
          )}

          {snapshotData && !isLoading && !fetchError ? (
            isTemplateMode && snapshotData.template_structure ? (
              <div
                className="absolute inset-0 overflow-hidden flex items-center justify-center bg-zinc-50 bg-[radial-gradient(#e4e4e7_1.2px,transparent_1.2px)] [background-size:12px_12px] p-4"
              >
                {/* Scaled Real Template Wrapper */}
                <div
                  className="relative origin-top-left shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-zinc-200 rounded-lg overflow-hidden"
                  style={{
                    width: snapshotData.template_structure.width || 800,
                    height: snapshotData.template_structure.height || 600,
                    transform: `scale(${templateScale})`,
                    transformOrigin: 'top left',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: -((snapshotData.template_structure.height || 600) * templateScale) / 2,
                    marginLeft: -((snapshotData.template_structure.width || 800) * templateScale) / 2,
                  }}
                >
                  {/* Real Background Layer */}
                  {(() => {
                    const bg = snapshotData.template_structure.background || { type: 'color', color: '#ffffff' };
                    if (bg.type === 'color' || bg.type === undefined) {
                      return <div className="absolute inset-0" style={{ backgroundColor: bg.color || '#ffffff', opacity: (bg.opacity ?? 100) / 100 }} />;
                    }
                    if (bg.type === 'gradient') {
                      const color1 = bg.gradientColor1 || '#ffffff';
                      const color2 = bg.gradientColor2 || '#000000';
                      const direction = bg.gradientDirection || 'to right';
                      const gradient = bg.gradientType === 'radial' 
                        ? `radial-gradient(circle, ${color1}, ${color2})`
                        : `linear-gradient(${direction}, ${color1}, ${color2})`;
                      return <div className="absolute inset-0" style={{ backgroundImage: gradient, opacity: (bg.opacity ?? 100) / 100 }} />;
                    }
                    if (bg.type === 'image' && bg.imageUrl) {
                      const size = bg.imageFit === 'fill' ? '100% 100%' : bg.imageFit === 'contain' ? 'contain' : 'cover';
                      return <div className="absolute inset-0" style={{ backgroundImage: `url(${bg.imageUrl})`, backgroundSize: size, backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: (bg.opacity ?? 100) / 100 }} />;
                    }
                    return null;
                  })()}

                  {/* Real Text Area Zones */}
                  {(snapshotData.template_structure.textAreas || [])
                    .filter((ta: any) => ta.visible)
                    .map((ta: any) => {
                      const areaContent = snapshotData.template_content?.[ta.type];
                      let contentText = ta.content || '';
                      if (areaContent !== undefined) {
                        if (Array.isArray(areaContent)) {
                          const sameTypeAreas = snapshotData.template_structure.textAreas.filter((item: any) => item.type === ta.type);
                          const index = sameTypeAreas.indexOf(ta);
                          contentText = areaContent[index] || areaContent[0] || ta.content;
                        } else {
                          contentText = areaContent;
                        }
                      }
                      
                      return (
                        <div
                          key={ta.id}
                          className="absolute overflow-hidden"
                          style={{
                            left: ta.position.x,
                            top: ta.position.y,
                            width: ta.position.width,
                            height: ta.position.height,
                            fontSize: `${ta.style?.fontSize || 16}px`,
                            fontFamily: ta.style?.fontFamily,
                            fontWeight: ta.style?.fontWeight,
                            color: ta.style?.color,
                            textAlign: ta.style?.textAlign,
                            lineHeight: ta.style?.lineHeight || 1.2,
                            padding: '4px',
                            wordBreak: 'break-word',
                          }}
                          dangerouslySetInnerHTML={{ __html: contentText }}
                        />
                      );
                    })}

                  {/* Real Bounded Chart Zone */}
                  {snapshotData.template_structure.chartArea && (
                    <div
                      className="absolute"
                      style={{
                        left: snapshotData.template_structure.chartArea.x,
                        top: snapshotData.template_structure.chartArea.y,
                        width: snapshotData.template_structure.chartArea.width,
                        height: snapshotData.template_structure.chartArea.height,
                      }}
                    >
                      <canvas ref={canvasRef} className="w-full h-full" />
                    </div>
                  )}

                  {/* Decoration Shapes Layer */}
                  <DecorationShapeRenderer
                    containerWidth={snapshotData.template_structure.width || 800}
                    containerHeight={snapshotData.template_structure.height || 600}
                    readOnly={true}
                    shapes={snapshotData.chartConfig?.decorationShapes || snapshotData.template_structure?.decorations || []}
                  />
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 p-3.5 flex items-center justify-center w-full h-full bg-white/95">
                <canvas ref={canvasRef} className="w-full h-full max-h-full max-w-full" />
              </div>
            )
          ) : (
            !isLoading && (
              <div className="relative z-10 p-4 bg-white rounded-xl shadow-sm border border-gray-100">
                {getChartIcon()}
              </div>
            )
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white rounded-full p-2 border border-gray-100 transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Eye className="w-5 h-5 text-violet-600" />
            </div>
          </div>
        </div>

        {/* Row 1: Title */}
        <h3 className="text-base font-semibold text-gray-900 truncate leading-tight group-hover:text-violet-900 transition-colors">
          {conversation.title}
        </h3>

        {/* Row 2: Badge + Date + Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1.5">
          {/* Left: Badge + Date */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Badge className={`${getChartTypeColor(conversation.snapshot?.chartType || "")} border text-[11px] px-2 py-0.5 font-medium rounded-full shadow-none shrink-0`}>
              {isTemplateMode ? (
                <div className="flex items-center gap-1">
                  <LayoutTemplate className="w-3 h-3" />
                  Template
                </div>
              ) : (
                conversation.snapshot?.chartType || "Unknown"
              )}
            </Badge>
            <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(conversation.timestamp)}</span>
            </div>
          </div>

          {/* Right: Icon Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
          <Button
            onClick={() => onEditInAdvanced(conversation)}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-zinc-200 text-zinc-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all shadow-none rounded-lg"
            title="Edit in Editor"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 border-zinc-200 text-zinc-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all shadow-none rounded-lg"
            title="Export PNG"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0 border-zinc-200 text-zinc-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all shadow-none rounded-lg"
                title="Share"
              >
                <Share2 className="h-3.5 w-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-3">
              {/* Share vs Embed Toggle */}
              <div className="flex items-center gap-0.5 bg-zinc-100 rounded-lg p-0.5 border border-zinc-200/50 mb-3 select-none">
                <button
                  onClick={() => setShareTab("share")}
                  className={`flex-1 py-1 text-center text-xs font-semibold rounded-md transition-all ${
                    shareTab === "share"
                      ? "bg-white text-violet-700 shadow-sm border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-900 bg-transparent"
                  }`}
                >
                  Share
                </button>
                <button
                  onClick={() => setShareTab("embed")}
                  className={`flex-1 py-1 text-center text-xs font-semibold rounded-md transition-all ${
                    shareTab === "embed"
                      ? "bg-white text-violet-700 shadow-sm border border-zinc-200/50"
                      : "text-zinc-500 hover:text-zinc-900 bg-transparent"
                  }`}
                >
                  Embed
                </button>
              </div>
              {/* Copy / Open Actions */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    const url = shareTab === "share"
                      ? `${window.location.origin}/share/${conversation.id}`
                      : `${window.location.origin}/chart/${conversation.id}`
                    navigator.clipboard.writeText(url)
                    toast.success(shareTab === "share" ? "Share link copied!" : "Embed link copied!")
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-zinc-700 hover:text-violet-750 hover:bg-violet-50/50 rounded-md border border-zinc-200/60 hover:border-violet-100 transition-all"
                >
                  <Copy className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Copy</span>
                </button>
                <button
                  onClick={() => {
                    const url = shareTab === "share"
                      ? `/share/${conversation.id}`
                      : `/chart/${conversation.id}`
                    window.open(url, "_blank")
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-zinc-700 hover:text-violet-750 hover:bg-violet-50/50 rounded-md border border-zinc-200/60 hover:border-violet-100 transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Open</span>
                </button>
              </div>
            </PopoverContent>
          </Popover>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-zinc-200 text-zinc-500 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition-all shadow-none rounded-lg">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPreview(conversation)} className="focus:bg-violet-50 focus:text-violet-700">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowRenameDialog(true)} className="focus:bg-violet-50 focus:text-violet-700">
                <Pencil className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-650 focus:text-red-650 focus:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          </div>
        </div>
      </CardContent>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={(open) => { if (!isRenaming) setShowRenameDialog(open); }}>
        <DialogContent className="max-w-md p-5 bg-white border border-gray-200 rounded-lg shadow-xl" hideCloseButton={isRenaming}>
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Pencil className="h-5 w-5 text-blue-600" />
              Rename Chart
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-gray-600">
              Enter a new name for this chart.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
            <div className="mb-5">
              <Label htmlFor="rename-input-grid" className="text-sm font-medium text-gray-700">
                Chart Name
              </Label>
              <Input
                ref={renameInputRef}
                id="rename-input-grid"
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="My Awesome Chart"
                className="mt-1.5"
                disabled={isRenaming}
                maxLength={100}
              />
              <p className="mt-1 text-xs text-gray-500">
                {newName.length}/100 characters
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowRenameDialog(false)}
                disabled={isRenaming}
                className="inline-flex items-center justify-center h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRenaming}
                className="inline-flex items-center justify-center h-9 rounded-md bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-750 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 shadow-sm transition-colors disabled:opacity-50"
              >
                {isRenaming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Renaming...
                  </>
                ) : (
                  'Rename'
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

