"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { useHistoryStore, type Conversation } from "@/lib/history-store"
import { useChartStore } from "@/lib/chart-store"
import { useChatStore } from "@/lib/chat-store"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { ChartPreviewModal } from "@/components/board/chart-preview-modal"
import { ChartCard } from "@/components/board/chart-card"
import { BoardStats } from "@/components/board/board-stats"
import { toast } from "sonner"
import {
  BarChart2,
  TrendingUp,
  Sparkles,
  MessageSquare,
  Edit3,
  LayoutDashboard,
  Search,
  Filter,
  Grid3x3,
  List,
  SortAsc,
  SortDesc,
  Loader2,
  Plus,
  RefreshCw
} from "lucide-react"
import Link from "next/link"

export default function BoardPage() {
  return (
    <ProtectedRoute>
      <BoardPageContent />
    </ProtectedRoute>
  )
}

function BoardPageContent() {
  const { user } = useAuth()
  const router = useRouter()
  const { conversations, loadConversationsFromBackend, loading } = useHistoryStore()
  const [selectedChart, setSelectedChart] = useState<Conversation | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "name">("newest")
  const [filterType, setFilterType] = useState<string>("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load conversations from backend on mount
  useEffect(() => {
    if (user && mounted) {
      loadConversationsFromBackend()
    }
  }, [user, mounted, loadConversationsFromBackend])

  // Get unique chart types for filtering
  const chartTypes = useMemo(() => {
    const types = new Set<string>()
    conversations.forEach(conv => {
      if (conv.snapshot?.chartType) {
        types.add(conv.snapshot.chartType)
      }
    })
    return Array.from(types)
  }, [conversations])

  // Filter and sort conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations.filter(conv => {
      // Only show conversations with snapshots
      if (!conv.snapshot) return false

      // Search filter
      if (searchQuery && !conv.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Type filter
      if (filterType !== "all" && conv.snapshot.chartType !== filterType) {
        return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return b.timestamp - a.timestamp
        case "oldest":
          return a.timestamp - b.timestamp
        case "name":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    return filtered
  }, [conversations, searchQuery, filterType, sortBy])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await loadConversationsFromBackend()
      toast.success("Charts refreshed successfully!")
    } catch (error) {
      toast.error("Failed to refresh charts")
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleEdit = (conv: Conversation) => {
    // Restore conversation and navigate to AI Chat or Editor
    useHistoryStore.getState().restoreConversation(conv.id)
    toast.success("Chart loaded!")
    router.push("/landing")
  }

  const handleEditInAdvanced = (conv: Conversation) => {
    // Restore conversation and navigate to Editor
    useHistoryStore.getState().restoreConversation(conv.id)
    toast.success("Chart loaded in editor!")
    router.push("/editor")
  }

  if (!mounted) {
    return null
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your charts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo and Title */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg shadow-lg">
                <LayoutDashboard className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Board</h1>
                <p className="text-xs text-gray-500 hidden sm:block">Manage all your charts</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-white rounded-md shadow-sm transition-all relative"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Board</span>
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-600 rounded-full"></div>
                </button>
                <button
                  onClick={() => router.push('/landing')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => router.push('/editor')}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-white rounded-md transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editor</span>
                </button>
              </div>

              <Link href="/landing">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Plus className="h-4 w-4 mr-1" />
                  New Chart
                </Button>
              </Link>

              <SimpleProfileDropdown size="md" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Statistics Dashboard */}
        <BoardStats conversations={filteredConversations} allConversations={conversations} />

        {/* Search and Filters */}
        <div className="mb-4">
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search charts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Filter by Type */}
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-gray-500" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    {chartTypes.map(type => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  {sortBy === "oldest" ? <SortAsc className="h-3.5 w-3.5 text-gray-500" /> : <SortDesc className="h-3.5 w-3.5 text-gray-500" />}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="name">Name</option>
                  </select>
                </div>

                {/* View Mode */}
                <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="Grid View"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === "list" ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>

                {/* Refresh */}
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 px-2 text-sm"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid/List */}
        {filteredConversations.length === 0 ? (
          <Card className="border-gray-200 shadow-sm">
            <CardContent className="py-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="p-3 bg-gray-100 rounded-full w-fit mx-auto mb-3">
                  <BarChart2 className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Charts Yet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  {searchQuery || filterType !== "all"
                    ? "No charts match your filters. Try adjusting your search or filters."
                    : "Start creating beautiful charts with our AI-powered tools!"}
                </p>
                <Link href="/landing">
                  <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Your First Chart
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            {filteredConversations.map((conv) => (
              <ChartCard
                key={conv.id}
                conversation={conv}
                viewMode={viewMode}
                onPreview={setSelectedChart}
                onEdit={handleEdit}
                onEditInAdvanced={handleEditInAdvanced}
              />
            ))}
          </div>
        )}
      </main>

      {/* Chart Preview Modal */}
      {selectedChart && (
        <ChartPreviewModal
          conversation={selectedChart}
          onClose={() => setSelectedChart(null)}
          onEdit={handleEdit}
          onEditInAdvanced={handleEditInAdvanced}
        />
      )}
    </div>
  )
}

