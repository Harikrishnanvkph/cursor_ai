"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { type Conversation, useHistoryStore } from "@/lib/history-store"
import { useChartStore } from "@/lib/chart-store"
import { useTemplateStore } from "@/lib/template-store"
import ChartGenerator from "@/lib/chart_generator"
import { TemplateChartPreview } from "@/components/template-chart-preview"
import { Chart as ChartJS } from "chart.js"
import { toast } from "sonner"
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
  AlertCircle
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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

        // If template mode, also load template into store
        if (updatedConv.snapshot.is_template_mode && updatedConv.snapshot.template_structure) {
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
      }
    }
  }, [liveConversation.snapshot, liveConversation.id, liveConversation.messages.length, activeTab, setFullChart, setCurrentTemplate, setEditorMode, clearAllTemplateState, restoreConversation])

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

      const chart = new ChartJS(ctx, {
        type: liveConversation.snapshot.chartType as any,
        data: liveConversation.snapshot.chartData,
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

  const handleDownloadHTML = () => {
    if (!liveConversation.snapshot?.chartData) {
      toast.error("Chart data not yet loaded")
      return
    }

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
      type: '${liveConversation.snapshot.chartType}',
      data: ${JSON.stringify(liveConversation.snapshot.chartData)},
      options: ${JSON.stringify(liveConversation.snapshot.chartConfig)}
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

    toast.success("HTML downloaded successfully!")
  }

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast.success("Share link copied to clipboard!")
  }

  const handleOpenInNewTab = () => {
    window.open(`/chart/${conversation.id}`, "_blank")
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
      bar: "bg-blue-100 text-blue-700 border-blue-200",
      line: "bg-green-100 text-green-700 border-green-200",
      pie: "bg-purple-100 text-purple-700 border-purple-200",
      doughnut: "bg-pink-100 text-pink-700 border-pink-200",
      radar: "bg-orange-100 text-orange-700 border-orange-200",
      polarArea: "bg-cyan-100 text-cyan-700 border-cyan-200",
      bubble: "bg-indigo-100 text-indigo-700 border-indigo-200",
      scatter: "bg-teal-100 text-teal-700 border-teal-200",
    }
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  // Get badge info based on mode
  const getBadgeInfo = () => {
    if (isTemplateMode) {
      return {
        label: "Template",
        className: "bg-purple-100 text-purple-700 border-purple-200",
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

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[95vw] h-[95vh] flex flex-col p-0 [&>button:last-child]:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                  <Badge className={`${badgeInfo.className} border text-xs px-3 py-0.5 flex items-center`}>
                    {badgeInfo.icon}
                    {badgeInfo.label}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(liveConversation.timestamp)}
                  </span>
                  {liveConversation.messages.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {liveConversation.messages.length} message{liveConversation.messages.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <DialogTitle className="text-xl font-semibold text-gray-900">
                  {liveConversation.title}
                </DialogTitle>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <TabsList className="flex gap-2 rounded-md bg-gray-100 p-1 shadow-inner">
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    <Maximize2 className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger
                    value="share"
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </TabsTrigger>
                  <TabsTrigger
                    value="export"
                    className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-gray-600 transition-colors data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </TabsTrigger>
                </TabsList>
                <Button
                  onClick={() => onEdit(liveConversation)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit in AI Chat
                </Button>
                <Button
                  onClick={() => onEditInAdvanced(liveConversation)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <PencilRuler className="h-4 w-4" />
                  Advanced Editor
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-gray-500 hover:text-gray-900"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </DialogClose>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <TabsContent value="preview" className="h-full p-4 mt-0">
              <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="w-full h-full">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-500">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
                      <p className="text-sm font-medium">Loading full chart data...</p>
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-red-500 px-6 text-center">
                      <AlertCircle className="h-10 w-10" />
                      <p className="text-sm font-medium">{error}</p>
                      <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                        Retry
                      </Button>
                    </div>
                  ) : liveConversation.snapshot?.chartData && activeTab === "preview" ? (
                    isTemplateMode ? (
                      <TemplateChartPreview />
                    ) : (
                      <ChartGenerator />
                    )
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p>No preview available</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="share" className="p-4 mt-0 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Share this Chart</h3>

                <div className="space-y-3">
                  {/* Share Link */}
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                      Public Share Link
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shareUrl}
                        readOnly
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-lg bg-white text-xs"
                      />
                      <Button onClick={handleCopyShareLink} size="sm" variant="outline" className="h-8 px-2 text-xs">
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">
                      Anyone with this link can view your chart
                    </p>
                  </div>

                  {/* Open in New Tab */}
                  <Button
                    onClick={handleOpenInNewTab}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-2" />
                    Open in New Tab
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="export" className="p-4 mt-0 space-y-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Export Options</h3>

                <div className="grid gap-3">
                  {/* PNG Export */}
                  <button
                    onClick={handleDownloadPNG}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                  >
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ImageIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Download as PNG</h4>
                      <p className="text-xs text-gray-600">
                        High-quality image file (1920x1080) perfect for presentations
                      </p>
                    </div>
                  </button>

                  {/* HTML Export */}
                  <button
                    onClick={handleDownloadHTML}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-all text-left"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <FileCode className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm text-gray-900 mb-0.5">Download as HTML</h4>
                      <p className="text-xs text-gray-600">
                        Self-contained HTML file with interactive chart
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>


      </DialogContent>
    </Dialog>
  )
}

