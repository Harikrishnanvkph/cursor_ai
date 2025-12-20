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
  Pencil,
  Loader2
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Chart as ChartJS } from "chart.js"

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
  const renameInputRef = useRef<HTMLInputElement>(null)

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

  // Check if this is a template mode snapshot
  const isTemplateMode = conversation.snapshot?.is_template_mode && conversation.snapshot?.template_structure

  if (viewMode === "list") {
    return (
      <Card className="group border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {/* Enhanced Mini Preview */}
            <div 
              className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-300 transition-all duration-300 group-hover:scale-105 relative"
              onClick={() => onPreview(conversation)}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:12px_12px]"></div>
              </div>
              
              {/* Icon */}
              <div className="relative z-10">
                {isTemplateMode ? (
                  <LayoutTemplate className="w-8 h-8 text-purple-500" />
                ) : (
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                )}
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            {/* Enhanced Info Section */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate mb-1 group-hover:text-blue-900 transition-colors">
                    {conversation.title}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(conversation.timestamp)}</span>
                    </div>
                    {conversation.messages.length > 0 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{conversation.messages.length} messages</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <Badge className={`${getChartTypeColor(conversation.snapshot?.chartType || "")} border text-sm px-3 py-1 font-medium flex-shrink-0`}>
                  {isTemplateMode ? (
                    <div className="flex items-center gap-1.5">
                      <LayoutTemplate className="w-3.5 h-3.5" />
                      Template
                    </div>
                  ) : (
                    conversation.snapshot?.chartType || "Unknown"
                  )}
                </Badge>
              </div>
            </div>

            {/* Enhanced Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={() => onPreview(conversation)}
                variant="outline"
                size="sm"
                className="gap-2 h-9 px-4 border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                onClick={() => onEdit(conversation)}
                variant="outline"
                size="sm"
                className="gap-2 h-9 px-4 border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all"
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Rename
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
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
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
    <Card className="group relative overflow-hidden border-0 shadow-lg bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Gradient Border Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="relative space-y-4 p-5">
        {/* Chart Preview */}
        <div
          className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 overflow-hidden cursor-pointer hover:border-blue-300 transition-all duration-300 group-hover:scale-[1.02] flex items-center justify-center relative"
          onClick={() => onPreview(conversation)}
        >
          {/* Preview Background Pattern */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(59,130,246,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          </div>
          
          {/* Chart Icon */}
          <div className="relative z-10 p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-sm">
            {isTemplateMode ? (
              <LayoutTemplate className="w-8 h-8 text-purple-500" />
            ) : (
              <BarChart3 className="w-8 h-8 text-blue-500" />
            )}
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 transform scale-75 group-hover:scale-100 transition-transform duration-300">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Title and Metadata */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold text-gray-900 truncate leading-tight group-hover:text-blue-900 transition-colors">
              {conversation.title}
            </h3>
          </div>
          
          <div className="flex items-center justify-between">
            <Badge className={`${getChartTypeColor(conversation.snapshot?.chartType || "")} border text-xs px-3 py-1 font-medium`}>
              {isTemplateMode ? (
                <div className="flex items-center gap-1">
                  <LayoutTemplate className="w-3 h-3" />
                  Template
                </div>
              ) : (
                conversation.snapshot?.chartType || "Unknown"
              )}
            </Badge>
            
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(conversation.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Enhanced Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <Button
            onClick={() => onEdit(conversation)}
            variant="outline"
            size="sm"
            className="flex-1 gap-2 h-9 text-xs font-medium border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="flex-1 gap-2 h-9 text-xs font-medium border-gray-200 hover:border-green-300 hover:bg-green-50 hover:text-green-700 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="h-9 w-9 p-0 border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-all"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onPreview(conversation)}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowRenameDialog(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Rename
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
              <DropdownMenuItem onClick={handleDelete} className="text-red-600 focus:text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>

      {/* Rename Dialog */}
      {showRenameDialog && (
        <div
          className="fixed inset-0 z-[130] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isRenaming) {
              setShowRenameDialog(false)
            }
          }}
        >
          <div className="fixed inset-0 bg-black/40" />
          <div className="relative z-[131] w-[92vw] max-w-md rounded-lg bg-white border border-gray-200 shadow-xl p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Pencil className="h-5 w-5 text-blue-600" />
                Rename Chart
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Enter a new name for this chart.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleRename(); }}>
              <div className="mb-5">
                <Label htmlFor="rename-input" className="text-sm font-medium text-gray-700">
                  Chart Name
                </Label>
                <Input
                  ref={renameInputRef}
                  id="rename-input"
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
                  className="inline-flex items-center justify-center h-9 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="inline-flex items-center justify-center h-9 rounded-md bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 shadow-sm transition-colors disabled:opacity-50"
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
          </div>
        </div>
      )}
    </Card>
  )
}

