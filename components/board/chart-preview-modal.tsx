"use client"

import React, { useEffect, useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Conversation, useHistoryStore } from "@/lib/history-store"
import { useChartStore } from "@/lib/chart-store"
import { chartTypeMapping, type SupportedChartType } from "@/lib/chart-defaults"
import { useTemplateStore } from "@/lib/template-store"
import { useFormatGalleryStore } from "@/lib/stores/format-gallery-store"
import { dataService } from "@/lib/data-service"
import ChartGenerator from "@/lib/chart_generator"
import { TemplateChartPreview } from "@/components/template-chart-preview"
import { Chart as ChartJS } from "chart.js"
import { toast } from "sonner"
import { parseDimension } from "@/lib/utils/dimension-utils"
import {
  X,
  Download,
  Edit3,
  Share2,
  ExternalLink,
  Copy,
  Image as ImageIcon,
  FileCode,
  PencilRuler,
  Calendar,
  MessageSquare,
  Maximize2,
  LayoutTemplate,
  Loader2,
  AlertCircle,
  Sparkles,
  ZoomIn,
  ZoomOut,
  Hand,
  Search
} from "lucide-react"
import { embedImagesAsBase64 } from "@/lib/utils/html-export-utils"
import { useZoomPan } from "@/lib/hooks/use-zoom-pan"
import { useUIStore } from "@/lib/stores/ui-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Slider } from "@/components/ui/slider"
import { ChartPreviewCanvas } from "@/components/chart-preview/chart-preview-canvas"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"

const ZOOM_VALUES: number[] = (() => {
  let values: number[] = [];
  for (let i = 10; i <= 50; i += 1) values.push(i);
  for (let i = 52; i <= 100; i += 2) values.push(i);
  for (let i = 103; i <= 160; i += 3) values.push(i);
  for (let i = 165; i <= 210; i += 5) values.push(i);
  for (let i = 216; i <= 300; i += 6) values.push(i);
  for (let i = 310; i <= 380; i += 10) values.push(i);
  for (let i = 392; i <= 500; i += 12) values.push(i);
  return values;
})();

interface ChartPreviewModalProps {
  conversation: Conversation
  onClose: () => void
  onEdit: (conv: Conversation) => void
  onEditInAdvanced: (conv: Conversation) => void
}

export function ChartPreviewModal({ conversation, onClose, onEdit, onEditInAdvanced }: ChartPreviewModalProps) {
  const [activeTab, setActiveTab] = useState("preview")
  const [shareUrl, setShareUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const [isEditingWithAI, setIsEditingWithAI] = useState(false)
  const [isOpeningAdvanced, setIsOpeningAdvanced] = useState(false)
  const [shareTab, setShareTab] = useState<"share" | "embed">("share")
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomPan = useZoomPan()
  const canvasBgType = useUIStore(s => s.canvasBgType)
  const canvasBgColor = useUIStore(s => s.canvasBgColor)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    setContainerSize({ width: el.clientWidth, height: el.clientHeight })

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height })
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const { setFullChart } = useChartStore()
  const { conversations, restoreConversation } = useHistoryStore()
  const { setCurrentTemplate, setEditorMode, clearAllTemplateState } = useTemplateStore()

  // Get the "live" version of the conversation from the global store.
  // This is CRITICAL because full data (snapshots) is lazy-loaded. 
  // The 'conversation' prop is a static snapshot from the moment the user clicked "Preview".
  const liveConversation = conversations.find(c => c.id === conversation.id) || conversation

  // Check if this is a template mode snapshot - use live data
  const isTemplateMode = liveConversation.snapshot?.is_template_mode && liveConversation.snapshot?.template_structure

  useEffect(() => {
    // Generate share URL
    setShareUrl(`${window.location.origin}/chart/${conversation.id}`)
  }, [conversation.id])

  // --- Ctrl + mouse wheel/trackpad zoom handler ---
  const { setZoom } = zoomPan;
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (container.contains(e.target as Node)) {
        if (e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();

          const zoomFactor = 1.05;
          setZoom(prev => {
            const newZoom = e.deltaY < 0 ? prev * zoomFactor : prev / zoomFactor;
            return Math.min(Math.max(newZoom, 0.1), 5);
          });
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
    };
  }, [setZoom]);

  // Load chart/template data into stores when modal opens
  useEffect(() => {
    const loadData = async () => {
      // Use liveConversation to check for missing data
      if (!liveConversation.snapshot || activeTab !== "preview") return;

      // Check if we need to lazy-load the full conversation data
      if (!liveConversation.snapshot.chartData || !liveConversation.messages.length) {
        setIsLoading(true);
        setError(null);
        try {
          await restoreConversation(liveConversation.id);
        } catch (err: any) {
          console.error("Failed to lazy-load chart data:", err);
          setError("Failed to load chart details. Please try again.");
          setIsLoading(false);
          return;
        }
        setIsLoading(false);
      }

      // Re-fetch the updated conversation from store after restore
      const updatedConv = useHistoryStore.getState().conversations.find(c => c.id === liveConversation.id) || liveConversation;

      // Once we have (or already had) data, load it into stores
      if (updatedConv.snapshot?.chartData) {
        setFullChart({
          chartType: updatedConv.snapshot.chartType,
          chartData: updatedConv.snapshot.chartData,
          chartConfig: updatedConv.snapshot.chartConfig
        })

        // Restore format mode if snapshot has format data
        const chartConfig = updatedConv.snapshot.chartConfig as any;
        if (chartConfig?.formatData) {
          const { formatId, contentPackage, contextualImageUrl } = chartConfig.formatData;
          const formatStore = useFormatGalleryStore.getState();
          
          let templateStructure = updatedConv.snapshot.template_structure;
          if (!templateStructure || templateStructure.isFormatReference || !templateStructure.zones) {
            setIsLoading(true);
            try {
              const formatRes = await dataService.getFormat(formatId);
              if (formatRes.data && formatRes.data.skeleton) {
                templateStructure = formatRes.data.skeleton;
              }
            } catch (e) {
              console.error("Failed to fetch format skeleton in preview modal", e);
            } finally {
              setIsLoading(false);
            }
          }
          
          useFormatGalleryStore.setState({
            selectedFormatId: formatId,
            selectedChartType: updatedConv.snapshot.chartType,
            contentPackage: contentPackage || formatStore.contentPackage,
            contextualImageUrl: contextualImageUrl || formatStore.contextualImageUrl,
            selectedFormatSnapshot: {
              id: formatId,
              name: 'Persisted Format',
              skeleton: templateStructure,
              dimensions: templateStructure?.dimensions || { width: 800, height: 600, aspect: '4:3', label: 'Default' }
            } as any
          });
          
          const templateStore = useTemplateStore.getState();
          templateStore.clearAllTemplateState(); // Clear standard templates
          templateStore.setEditorMode('template'); // Set to template mode for format rendering
          templateStore.setGenerateMode('format'); // Set to format mode so Browse Formats button remains
          templateStore.setTemplateSavedToCloud(true);
        } else if (updatedConv.snapshot.is_template_mode && updatedConv.snapshot.template_structure) {
          // If template mode, also load template into store
          const template = updatedConv.snapshot.template_structure
          const content = updatedConv.snapshot.template_content

          if (content && template.textAreas) {
            const updatedTextAreas = template.textAreas.map((area: any) => {
              const areaContent = content[area.type]
              if (areaContent !== undefined) {
                return { ...area, content: areaContent }
              }
              return area
            })
            setCurrentTemplate({ ...template, textAreas: updatedTextAreas })
          } else {
            setCurrentTemplate(template)
          }
          setEditorMode('template')
        }
      }
    };

    loadData();

    return () => {
      if (isTemplateMode) {
        clearAllTemplateState()
        useFormatGalleryStore.getState().clearSelection()
      }
    }
  }, [liveConversation.snapshot, liveConversation.id, liveConversation.messages.length, activeTab, setFullChart, setCurrentTemplate, setEditorMode, clearAllTemplateState, restoreConversation, isTemplateMode])

  const handleDownloadPNG = async () => {
    if (!liveConversation.snapshot?.chartData) {
      toast.error("Chart data not yet loaded")
      return
    }

    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1920
      canvas.height = 1080

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        toast.error("Failed to create canvas context")
        return
      }

      const resolvedType = chartTypeMapping[liveConversation.snapshot.chartType as SupportedChartType] || liveConversation.snapshot.chartType;
      const chart = new ChartJS(ctx, {
        type: resolvedType as any,
        data: {
          ...liveConversation.snapshot.chartData,
          datasets: (liveConversation.snapshot.chartData?.datasets || []).map((ds: any) => ({
            ...ds,
            type: ds.type ? (chartTypeMapping[ds.type as SupportedChartType] || ds.type) : undefined
          }))
        },
        options: {
          ...liveConversation.snapshot.chartConfig,
          animation: false,
          responsive: false,
        },
      })

      await new Promise(resolve => setTimeout(resolve, 500))

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
        toast.success("PNG downloaded successfully!")
      })
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download PNG")
    }
  }

  const handleDownloadHTML = async () => {
    if (!liveConversation.snapshot?.chartData) {
      toast.error("Chart data not yet loaded")
      return
    }

    try {
      toast.loading("Preparing HTML export (embedding images)...", { id: "html-export" })

      // Convert all images to Base64 so the HTML file is fully standalone offline
      const { chartData, chartConfig } = await embedImagesAsBase64(
        liveConversation.snapshot.chartData,
        liveConversation.snapshot.chartConfig
      )

      const resolvedType = chartTypeMapping[liveConversation.snapshot.chartType as SupportedChartType] || liveConversation.snapshot.chartType;

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${liveConversation.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 1200px;
      width: 100%;
    }
    h1 {
      margin: 0 0 24px 0;
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
    }
    .chart-container {
      position: relative;
      height: 600px;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${liveConversation.title}</h1>
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </div>
  
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: '${resolvedType}',
      data: ${JSON.stringify(chartData)},
      options: ${JSON.stringify(chartConfig)}
    });
  </script>
</body>
</html>`

      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("HTML downloaded successfully!", { id: "html-export" })
    } catch (error) {
      console.error("HTML export error:", error)
      toast.error("Failed to generate HTML", { id: "html-export" })
    }
  }

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success("Share link copied to clipboard!")
  }

  const handleOpenInNewTab = () => {
    window.open(`/chart/${conversation.id}`, "_blank")
  }

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => {
          toast.error(`Error enabling fullscreen: ${err.message}`)
        })
      } else {
        document.exitFullscreen()
      }
    }
  }

  const handleResetChart = () => {
    zoomPan.setZoom(1.0)
    zoomPan.setPanOffset({ x: 0, y: 0 })
    zoomPan.setPanMode(false)
    toast.success("Chart view reset successfully")
  }

  const handleRefreshChart = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await restoreConversation(liveConversation.id)
      toast.success("Chart refreshed successfully!")
    } catch (err: any) {
      setError("Failed to refresh chart. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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

  // Get badge info based on mode
  const getBadgeInfo = () => {
    if (isTemplateMode) {
      return {
        label: "Template",
        className: "bg-purple-50 text-purple-750 border-purple-100",
        icon: <LayoutTemplate className="h-3 w-3 mr-1" />
      }
    }
    return {
      label: liveConversation.snapshot?.chartType || "Unknown",
      className: getChartTypeColor(liveConversation.snapshot?.chartType || ""),
      icon: null
    }
  }

  const badgeInfo = getBadgeInfo()

  const isResponsive = liveConversation.snapshot?.chartConfig?.responsive !== false
  const chartWidth = !isResponsive ? parseDimension(liveConversation.snapshot?.chartConfig?.width, 800) : 800
  const chartHeight = !isResponsive ? parseDimension(liveConversation.snapshot?.chartConfig?.height, 600) : 600

  let scale = 1
  if (!isResponsive && containerSize.width > 0 && containerSize.height > 0) {
    const padding = 32 // Save some margins around the fixed dimensions
    const scaleX = Math.max(10, containerSize.width - padding) / chartWidth
    const scaleY = Math.max(10, containerSize.height - padding) / chartHeight
    scale = Math.min(scaleX, scaleY, 1.0)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] flex flex-col gap-0 p-0 [&>button:last-child]:hidden bg-[#f6f8fa]">
        {/* Header */}
        <DialogHeader className="px-4 py-2.5 border-b border-zinc-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-zinc-950 flex items-center gap-2">
                <span className="truncate max-w-[320px] sm:max-w-[450px]">{liveConversation.title}</span>
                <Badge className={`rounded-full shadow-none border ${badgeInfo.className} text-[10px] font-semibold px-2 py-0.5 flex items-center justify-center h-5 lowercase gap-1`}>
                  {badgeInfo.icon}
                  {badgeInfo.label}
                </Badge>
              </DialogTitle>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-100 rounded-lg transition-all"
                    title="Share Options"
                  >
                    <Share2 className="h-4.5 w-4.5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-3 z-[9999]">
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

                  {/* Actions Row */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        const url = shareTab === "share"
                          ? `${window.location.origin}/share/${conversation.id}`
                          : `${window.location.origin}/chart/${conversation.id}`
                        navigator.clipboard.writeText(url)
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
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-zinc-500 hover:text-violet-600 hover:bg-violet-50 border border-transparent hover:border-violet-100 rounded-lg transition-all"
                    title="Export Options"
                  >
                    <Download className="h-4.5 w-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleDownloadPNG} className="focus:bg-violet-50 focus:text-violet-700">
                    <ImageIcon className="h-4 w-4 mr-2 text-zinc-450" />
                    Download PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadHTML} className="focus:bg-violet-50 focus:text-violet-700">
                    <FileCode className="h-4 w-4 mr-2 text-zinc-450" />
                    Download HTML
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-[1px] h-5 bg-zinc-200 mx-1"></div>

               <Button
                onClick={() => {
                  setIsEditingWithAI(true)
                  onEdit(liveConversation)
                }}
                disabled={isEditingWithAI || isOpeningAdvanced}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-semibold border-zinc-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition-all shadow-none"
              >
                {isEditingWithAI ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                )}
                Edit with AI
              </Button>

              <Button
                onClick={() => {
                  setIsOpeningAdvanced(true)
                  onEditInAdvanced(liveConversation)
                }}
                disabled={isEditingWithAI || isOpeningAdvanced}
                variant="outline"
                size="sm"
                className="h-9 gap-1.5 text-xs font-semibold border-zinc-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 rounded-lg transition-all shadow-none"
              >
                {isOpeningAdvanced ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-500" />
                ) : (
                  <PencilRuler className="h-3.5 w-3.5 text-violet-500" />
                )}
                Advanced Editor
              </Button>

              <div className="w-[1px] h-5 bg-zinc-200 mx-1"></div>

              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-150 rounded-lg transition-all"
                >
                  <X className="h-4.5 w-4.5" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>

        {/* Full-bleed Chart Preview Area with dynamic scale-to-fit canvas sizing, zooming and panning */}
        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div
            ref={containerRef}
            className="w-full h-full relative z-10 flex items-center justify-center overflow-hidden"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              backgroundColor: canvasBgType === 'transparent' ? 'transparent' : canvasBgColor,
              backgroundImage: canvasBgType === 'transparent' ? `linear-gradient(45deg, #f1f5f9 25%, transparent 25%), linear-gradient(-45deg, #f1f5f9 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f5f9 75%), linear-gradient(-45deg, transparent 75%, #f1f5f9 75%)` : undefined,
              backgroundSize: canvasBgType === 'transparent' ? '20px 20px' : undefined,
              backgroundPosition: canvasBgType === 'transparent' ? '0 0, 0 10px, 10px -10px, -10px 0px' : undefined,
            }}
          >
              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-3 text-zinc-500">
                  <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
                  <p className="text-xs font-semibold">Loading full chart data...</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center gap-4 text-red-500 px-6 text-center max-w-sm">
                  <AlertCircle className="h-10 w-10 text-red-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-zinc-800">Preview Error</p>
                    <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{error}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="border-red-200 text-red-650 hover:bg-red-50/50">
                    Retry
                  </Button>
                </div>
              ) : liveConversation.snapshot?.chartData ? (
                isTemplateMode ? (
                  <TemplateChartPreview readOnly zoomPan={zoomPan} />
                ) : (
                  <ChartPreviewCanvas
                    chartContainerRef={containerRef}
                    chartConfig={liveConversation.snapshot?.chartConfig}
                    zoomPan={zoomPan}
                  />
                )
              ) : (
                <div className="flex items-center justify-center text-zinc-400 text-sm">
                  <p>No preview available</p>
                </div>
              )}
            </div>

            {/* Dynamic floating interactive controls (Zoom, Pan, Reset) */}
            {!isLoading && !error && liveConversation.snapshot?.chartData && (() => {
              const currentZoomPct = Math.round(zoomPan.zoom * 100);
              let closestIndex = 0;
              let minDiff = Infinity;
              for (let i = 0; i < ZOOM_VALUES.length; i++) {
                const diff = Math.abs(ZOOM_VALUES[i] - currentZoomPct);
                if (diff < minDiff) {
                  minDiff = diff;
                  closestIndex = i;
                }
              }

              return (
                <div className="absolute bottom-4 right-4 z-30 flex items-center gap-0.5 border border-slate-200 rounded-md p-0.5 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.05)] select-none">
                  {/* Zoom Dropdown Trigger */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs px-2 text-violet-600 hover:text-violet-750 font-semibold select-none w-[76px] justify-start gap-1.5 hover:bg-violet-50/50 rounded transition-colors"
                        title="Zoom Options"
                      >
                        <Search className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                        <span className="tabular-nums">{currentZoomPct}%</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 p-2 z-[9999]">
                      <DropdownMenuItem
                        onClick={() => { zoomPan.setZoom(1); zoomPan.setPanOffset({ x: 0, y: 0 }); }}
                        className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100"
                      >
                        <span className="flex-1">100% (Fit to View)</span>
                      </DropdownMenuItem>

                      {!isResponsive && (
                        <DropdownMenuItem
                          onClick={() => {
                            const applyFullDimension = () => {
                              let baseScale = 1.0;
                              if (containerRef?.current) {
                                const cWidth = containerRef.current.clientWidth || 800;
                                const cHeight = containerRef.current.clientHeight || 600;
                                const padding = 64;
                                const availableWidth = Math.max(10, cWidth - padding);
                                const availableHeight = Math.max(10, cHeight - padding);
                                const scaleX = availableWidth / chartWidth;
                                const scaleY = availableHeight / chartHeight;
                                baseScale = Math.min(scaleX, scaleY, 1.0);
                              }
                              zoomPan.setZoom(1.0 / baseScale);
                              zoomPan.setPanOffset({ x: 0, y: 0 });
                            };
                            applyFullDimension();
                            setTimeout(applyFullDimension, 50);
                          }}
                          className="text-xs py-1.5 cursor-pointer font-medium text-slate-700 focus:bg-slate-100"
                        >
                          <span className="flex-1">Full Dimension</span>
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuSeparator className="my-1" />

                      <div className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <Slider
                          min={0}
                          max={ZOOM_VALUES.length - 1}
                          step={1}
                          value={[closestIndex]}
                          onValueChange={(value) => {
                            const newZoomPct = ZOOM_VALUES[value[0]];
                            zoomPan.setZoom(newZoomPct / 100);
                          }}
                          className="cursor-pointer"
                        />
                      </div>

                      <DropdownMenuSeparator className="my-1" />
                      <div className="flex items-center justify-between gap-1 px-1">
                        <DropdownMenuItem
                          onSelect={(e) => { e.preventDefault(); zoomPan.handleZoomOut(); }}
                          className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-slate-100"
                          title="Zoom Out"
                        >
                          <ZoomOut className="h-4 w-4 text-slate-500" />
                        </DropdownMenuItem>
                        <div className="w-[1px] h-4 bg-slate-200" />
                        <DropdownMenuItem
                          onSelect={(e) => { e.preventDefault(); zoomPan.handleZoomIn(); }}
                          className="flex-1 flex items-center justify-center py-2 cursor-pointer focus:bg-slate-100"
                          title="Zoom In"
                        >
                          <ZoomIn className="h-4 w-4 text-slate-500" />
                        </DropdownMenuItem>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Divider */}
                  <div className="w-[1px] h-4 bg-slate-200 mx-0.5" />

                  {/* Pan Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => zoomPan.setPanMode(!zoomPan.panMode)}
                    className={`h-7 w-7 p-0 transition-all rounded ${
                      zoomPan.panMode
                        ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white shadow-sm"
                        : "hover:bg-slate-100 text-slate-600"
                    }`}
                    title={zoomPan.panMode ? "Disable Pan Mode" : "Enable Pan Mode"}
                  >
                    <Hand className="h-4 w-4" />
                  </Button>
                </div>
              );
            })()}
        </div>
      </DialogContent>
    </Dialog>
  )
}

