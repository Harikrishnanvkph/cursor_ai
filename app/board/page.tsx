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
import { Input } from "@/components/ui/input"
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
  RefreshCw,
  Calendar,
  Clock,
  Zap,
  ArrowUpRight,
  ChevronDown,
  Settings2,
  Folder,
  Star,
  X
} from "lucide-react"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

  // Quick stats for header
  const quickStats = useMemo(() => {
    const total = conversations.length
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const thisWeek = conversations.filter(conv => conv.timestamp > weekAgo).length
    return { total, thisWeek }
  }, [conversations])

  if (!mounted) {
    return null
  }

  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Loading Dashboard</h3>
            <p className="text-gray-600">Fetching your charts...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Modern Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                    <LayoutDashboard className="h-6 w-6 text-white" />
                  </div>
                  {quickStats.thisWeek > 0 && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{quickStats.thisWeek}</span>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                  <p className="text-sm text-gray-500">{quickStats.total} charts created</p>
                </div>
              </div>
            </div>

            {/* Navigation Pills */}
            <div className="hidden md:flex items-center gap-1 bg-gray-100/80 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50">
              <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-sm transition-all">
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => router.push('/landing')}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                <span>AI Chat</span>
              </button>
              <button
                onClick={() => router.push('/editor')}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-white/80 rounded-lg transition-all"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editor</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link href="/landing">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                  <Plus className="h-4 w-4 mr-2" />
                  New Chart
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <SimpleProfileDropdown size="md" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Statistics Dashboard */}
        <div className="mb-8">
          <BoardStats conversations={filteredConversations} allConversations={conversations} />
        </div>

        {/* Modern Search and Filters */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Enhanced Search */}
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <Input
                    type="text"
                    placeholder="Search your charts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-3 text-base border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50/50 hover:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  )}
                </div>

                {/* Filter Controls */}
                <div className="flex items-center gap-3">
                  {/* Type Filter */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-white/80 hover:bg-white border-gray-200 rounded-xl">
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">
                          {filterType === "all" ? "All Types" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setFilterType("all")}>
                        <Folder className="h-4 w-4 mr-2" />
                        All Types
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {chartTypes.map(type => (
                        <DropdownMenuItem key={type} onClick={() => setFilterType(type)}>
                          <BarChart2 className="h-4 w-4 mr-2" />
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Sort */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-2 bg-white/80 hover:bg-white border-gray-200 rounded-xl">
                        {sortBy === "oldest" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        <span className="hidden sm:inline">
                          {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Name"}
                        </span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setSortBy("newest")}>
                        <Clock className="h-4 w-4 mr-2" />
                        Newest First
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                        <Calendar className="h-4 w-4 mr-2" />
                        Oldest First
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSortBy("name")}>
                        <Settings2 className="h-4 w-4 mr-2" />
                        Alphabetical
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-0.5 bg-gray-100 rounded-xl p-1 border border-gray-200">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === "grid" 
                          ? "bg-white text-blue-600 shadow-sm" 
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-2 rounded-lg transition-all ${
                        viewMode === "list" 
                          ? "bg-white text-blue-600 shadow-sm" 
                          : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                    className="gap-2 bg-white/80 hover:bg-white border-gray-200 rounded-xl"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span className="hidden sm:inline">Refresh</span>
                  </Button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchQuery || filterType !== "all") && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Active filters:</span>
                  {searchQuery && (
                    <Badge variant="secondary" className="gap-1">
                      Search: "{searchQuery}"
                      <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterType !== "all" && (
                    <Badge variant="secondary" className="gap-1">
                      Type: {filterType}
                      <button onClick={() => setFilterType("all")} className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("")
                      setFilterType("all")
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Charts Grid/List */}
        {filteredConversations.length === 0 ? (
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="py-16 text-center">
              <div className="max-w-md mx-auto space-y-6">
                {/* Enhanced Empty State */}
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl mx-auto flex items-center justify-center mb-6">
                    <BarChart2 className="h-12 w-12 text-blue-500" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {searchQuery || filterType !== "all"
                      ? "No matching charts"
                      : "Ready to create amazing charts?"}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {searchQuery || filterType !== "all"
                      ? "Try adjusting your search terms or filters to find what you're looking for."
                      : "Transform your data into beautiful, interactive visualizations with our AI-powered tools. Get started in seconds!"}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/landing">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5">
                      <Zap className="h-4 w-4 mr-2" />
                      Create with AI
                      <ArrowUpRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                  <Link href="/editor">
                    <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Advanced Editor
                    </Button>
                  </Link>
                </div>

                {/* Quick Tips */}
                {!searchQuery && filterType === "all" && (
                  <div className="mt-8 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Quick Tips</h4>
                    <ul className="text-xs text-blue-700 space-y-1 text-left">
                      <li>• Describe your chart in natural language</li>
                      <li>• Upload CSV files for instant visualization</li>
                      <li>• Use templates for professional layouts</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  Your Charts
                </h2>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  {filteredConversations.length} {filteredConversations.length === 1 ? 'chart' : 'charts'}
                </Badge>
              </div>
              
              {filteredConversations.length !== conversations.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setFilterType("all")
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Show all {conversations.length} charts
                </Button>
              )}
            </div>

            {/* Charts Display */}
            <div className={
              viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
                : "space-y-4"
            }>
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

            {/* Load More / Pagination could go here */}
            {filteredConversations.length > 12 && (
              <div className="text-center pt-8">
                <Button variant="outline" className="bg-white/80 hover:bg-white">
                  Load More Charts
                </Button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Enhanced Chart Preview Modal */}
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

