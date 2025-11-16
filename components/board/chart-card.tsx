"use client"

import React, { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Conversation } from "@/lib/history-store"
import { useHistoryStore } from "@/lib/history-store"
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
  BarChart3
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Chart as ChartJS } from "chart.js"
import { MiniChartPreview } from "./mini-chart-preview"

interface ChartCardProps {
  conversation: Conversation
  viewMode: "grid" | "list"
  onPreview: (conv: Conversation) => void
  onEdit: (conv: Conversation) => void
  onEditInAdvanced: (conv: Conversation) => void
}

export function ChartCard({ conversation, viewMode, onPreview, onEdit, onEditInAdvanced }: ChartCardProps) {
  const { deleteConversation } = useHistoryStore()
  const [isDeleting, setIsDeleting] = useState(false)

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

      // Create chart instance
      const chart = new ChartJS(ctx, {
        type: conversation.snapshot.chartType as any,
        data: conversation.snapshot.chartData,
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

  if (viewMode === "list") {
    return (
      <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Mini Preview */}
            <div className="flex-shrink-0 w-20 h-20 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
              {conversation.snapshot && (
                <MiniChartPreview snapshot={conversation.snapshot} />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate mb-0.5">
                    {conversation.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(conversation.timestamp)}</span>
                  </div>
                </div>
                <Badge className={`${getChartTypeColor(conversation.snapshot?.chartType || "")} border text-xs px-2 py-0.5`}>
                  {conversation.snapshot?.chartType || "Unknown"}
                </Badge>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <Button
                onClick={() => onPreview(conversation)}
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-xs px-2"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
              <Button
                onClick={() => onEdit(conversation)}
                variant="outline"
                size="sm"
                className="gap-1 h-8 text-xs px-2"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onEditInAdvanced(conversation)}>
                    <PencilRuler className="h-4 w-4 mr-2" />
                    Advanced Editor
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownload}>
                    <Download className="h-4 w-4 mr-2" />
                    Download PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Copy Share Link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Grid view
  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 group overflow-hidden">
      <CardContent className="space-y-2 p-3">
        {/* Chart Preview */}
        <div 
          className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-300 transition-colors"
          onClick={() => onPreview(conversation)}
        >
          {conversation.snapshot && (
            <MiniChartPreview snapshot={conversation.snapshot} />
          )}
        </div>

        {/* Title and Badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate mb-0.5">
              {conversation.title}
            </h3>
            <div className="flex items-center gap-2">
              <Badge className={`${getChartTypeColor(conversation.snapshot?.chartType || "")} border text-xs px-2 py-0.5`}>
                {conversation.snapshot?.chartType || "Unknown"}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(conversation.timestamp)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1.5 pt-1.5 border-t border-gray-100">
          <Button
            onClick={() => onEdit(conversation)}
            variant="outline"
            size="sm"
            className="flex-1 gap-1 h-7 text-xs px-2"
          >
            <Edit3 className="h-3 w-3" />
            Edit
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex-1 gap-1 h-7 text-xs px-2"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <Share2 className="h-3 w-3" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPreview(conversation)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(conversation)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit in AI Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEditInAdvanced(conversation)}>
                <PencilRuler className="h-4 w-4 mr-2" />
                Advanced Editor
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Copy Share Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  )
}

