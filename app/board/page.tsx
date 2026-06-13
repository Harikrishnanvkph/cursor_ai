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
import { dataService } from "@/lib/data-service"
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
  LayoutTemplate,
  Layers,
  X,
  PieChart,
  LineChart,
  Gauge,
  Compass,
  Activity,
  Info,
  Image as ImageIcon,
  Copy,
  Check,
  Trash2
} from "lucide-react"
import Link from "next/link"

function getChartTypeIcon(type: string) {
  const normalizedType = type?.toLowerCase() || ""
  if (normalizedType.includes("bar")) return BarChart2
  if (normalizedType.includes("line")) return LineChart
  if (normalizedType.includes("pie") || normalizedType.includes("doughnut")) return PieChart
  if (normalizedType.includes("gauge")) return Gauge
  if (normalizedType.includes("radar") || normalizedType.includes("polar")) return Compass
  if (normalizedType.includes("scatter") || normalizedType.includes("bubble")) return Activity
  return BarChart2
}

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
  const [activeTab, setActiveTab] = useState<"single" | "group" | "templates">("single")
  const [visibleCount, setVisibleCount] = useState(12)
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [showMobileInfo, setShowMobileInfo] = useState(false)
  const [viewTab, setViewTab] = useState<"charts" | "images">("charts")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  // Load conversations from backend on mount
  useEffect(() => {
    if (user) {
      loadConversationsFromBackend()
    }
  }, [user, loadConversationsFromBackend])

  // Reset pagination visible count when filters or tab switches
  useEffect(() => {
    setVisibleCount(12)
  }, [activeTab, searchQuery, filterType])

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

  const getChartTypeDotColor = (type: string) => {
    const colors: Record<string, string> = {
      bar: "bg-[#3178c6]", // TS blue
      line: "bg-[#2b7489]", // C++ teal
      pie: "bg-[#563d7c]", // CSS purple
      doughnut: "bg-[#e34c26]", // HTML red
      radar: "bg-[#f1e05a]", // JS yellow
      polarArea: "bg-[#89e051]", // Shell green
      bubble: "bg-[#178600]", // C# green
      scatter: "bg-[#3572A5]", // Python blue
    }
    return colors[type] || "bg-[#8b949e]"
  }

  // Filter conversations by active tab
  const currentConversations = useMemo(() => {
    if (activeTab === "templates") {
      return conversations.filter(c => c.is_template_mode)
    }
    if (activeTab === "single") {
      return conversations.filter(c => !c.is_template_mode && c.chart_mode !== 'grouped')
    }
    if (activeTab === "group") {
      return conversations.filter(c => !c.is_template_mode && c.chart_mode === 'grouped')
    }
    return conversations.filter(c => !c.is_template_mode)
  }, [conversations, activeTab])

  const typeDistribution = useMemo(() => {
    const typeCount: Record<string, number> = {}
    let total = 0
    currentConversations.forEach(conv => {
      const type = conv.snapshot?.chartType
      if (type) {
        typeCount[type] = (typeCount[type] || 0) + 1
        total++
      }
    })

    return Object.entries(typeCount)
      .map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: getChartTypeDotColor(type)
      }))
      .sort((a, b) => b.count - a.count)
  }, [currentConversations])

  const filteredConversations = useMemo(() => {
    let filtered = currentConversations.filter(conv => {
      // Search filter
      if (searchQuery && !conv.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Type filter (only apply if snapshot is available)
      if (filterType !== "all" && conv.snapshot?.chartType !== filterType) {
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
  }, [currentConversations, searchQuery, filterType, sortBy])

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
    router.push("/landing")
  }

  const handleEditInAdvanced = (conv: Conversation) => {
    // Restore conversation and navigate to Editor
    useHistoryStore.getState().restoreConversation(conv.id)
    router.push("/editor")
  }

  // Quick stats for header
  const quickStats = useMemo(() => {
    const total = currentConversations.length
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const thisWeek = currentConversations.filter(conv => conv.timestamp > weekAgo).length
    const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000
    const lastMonth = currentConversations.filter(conv => conv.timestamp > fourWeeksAgo).length
    const avgPerWeek = Math.round(lastMonth / 4)
    return { total, thisWeek, avgPerWeek }
  }, [currentConversations])



  if (loading && conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/20 to-indigo-50/40 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-100 border-t-violet-600 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-violet-600" />
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
    <div className="min-h-screen bg-[#f6f8fa] text-zinc-900">
      {/* Modern Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-none">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo and Title */}
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-zinc-950 tracking-tight">Dashboard</h1>
            </div>

            {/* Actions: Direct buttons for AI Chat and Advanced Editor */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Segmented control view switcher for My Charts vs My Images */}
              <div className="flex items-center bg-zinc-150/80 rounded-lg p-0.5 border border-zinc-200/60 mr-1 sm:mr-2 shrink-0">
                <Button
                  onClick={() => setViewTab("charts")}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-md shadow-none transition-all gap-1.5 flex items-center justify-center shrink-0 ${
                    viewTab === "charts"
                      ? "bg-white text-zinc-950 hover:bg-white border-zinc-200/40 shadow-sm"
                      : "bg-transparent text-zinc-500 hover:text-zinc-900 border-none hover:bg-transparent"
                  }`}
                  variant="ghost"
                  size="sm"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>My Charts</span>
                </Button>
                <Button
                  onClick={() => setViewTab("images")}
                  className={`h-7 px-2.5 text-xs font-semibold rounded-md shadow-none transition-all gap-1.5 flex items-center justify-center shrink-0 ${
                    viewTab === "images"
                      ? "bg-white text-zinc-950 hover:bg-white border-zinc-200/40 shadow-sm"
                      : "bg-transparent text-zinc-500 hover:text-zinc-900 border-none hover:bg-transparent"
                  }`}
                  variant="ghost"
                  size="sm"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>My Images</span>
                </Button>
              </div>

              <Link href="/landing">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs h-8 rounded-md px-2.5 sm:px-3 gap-1.5 flex items-center justify-center shadow-none transition-all">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Create with AI</span>
                </Button>
              </Link>
              <Link href="/editor">
                <Button variant="outline" className="border border-zinc-200 bg-white hover:bg-zinc-50 hover:text-zinc-900 text-zinc-700 font-semibold text-xs h-8 rounded-md px-2.5 sm:px-3 gap-1.5 flex items-center justify-center shadow-none transition-all">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Advanced Editor</span>
                </Button>
              </Link>
              <div className="w-[1px] h-5 bg-zinc-200 mx-0.5 sm:mx-1"></div>
              <SimpleProfileDropdown size="sm" />
            </div>
          </div>
        </div>
      </header>

      {/* GitHub-style Secondary Sub-header (Tabs) */}
      <div className={viewTab === "charts" ? "bg-white border-b border-zinc-200" : "hidden"}>
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <nav 
              className="flex space-x-4 sm:space-x-6 -mb-px overflow-x-auto flex-1" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              aria-label="Tabs"
            >
              <button
                onClick={() => {
                  setActiveTab("single")
                  setShowMobileInfo(false)
                }}
                className={`flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                  activeTab === "single" && !showMobileInfo
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
                }`}
              >
                <BarChart2 className={`h-4 w-4 ${activeTab === "single" && !showMobileInfo ? "text-violet-500" : "text-zinc-400"}`} />
                <span className={`hidden mob:inline font-semibold text-[13px] ${activeTab === "single" && !showMobileInfo ? "text-violet-900" : "text-zinc-800"}`}>Single Chart</span>
                <span className={`ml-0.5 sm:ml-1.5 px-2 py-0.5 text-[11px] font-bold border rounded-full shadow-none ${
                  activeTab === "single" && !showMobileInfo
                    ? "bg-violet-50 text-violet-700 border-violet-200"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                }`}>
                  {conversations.filter(c => !c.is_template_mode && c.chart_mode !== 'grouped').length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("group")
                  setShowMobileInfo(false)
                }}
                className={`flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                  activeTab === "group" && !showMobileInfo
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
                }`}
              >
                <Layers className={`h-4 w-4 ${activeTab === "group" && !showMobileInfo ? "text-violet-500" : "text-zinc-400"}`} />
                <span className={`hidden mob:inline font-semibold text-[13px] ${activeTab === "group" && !showMobileInfo ? "text-violet-900" : "text-zinc-800"}`}>Group chart</span>
                <span className={`ml-0.5 sm:ml-1.5 px-2 py-0.5 text-[11px] font-bold border rounded-full shadow-none ${
                  activeTab === "group" && !showMobileInfo
                    ? "bg-violet-50 text-violet-700 border-violet-200"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                }`}>
                  {conversations.filter(c => !c.is_template_mode && c.chart_mode === 'grouped').length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("templates")
                  setShowMobileInfo(false)
                }}
                className={`flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                  activeTab === "templates" && !showMobileInfo
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
                }`}
              >
                <LayoutTemplate className={`h-4 w-4 ${activeTab === "templates" && !showMobileInfo ? "text-violet-500" : "text-zinc-400"}`} />
                <span className={`hidden mob:inline font-semibold text-[13px] ${activeTab === "templates" && !showMobileInfo ? "text-violet-900" : "text-zinc-800"}`}>Templates</span>
                <span className={`ml-0.5 sm:ml-1.5 px-2 py-0.5 text-[11px] font-bold border rounded-full shadow-none ${
                  activeTab === "templates" && !showMobileInfo
                    ? "bg-violet-50 text-violet-700 border-violet-200"
                    : "bg-zinc-100 text-zinc-600 border-zinc-200"
                }`}>
                  {conversations.filter(c => c.is_template_mode).length}
                </span>
              </button>
            </nav>

            {/* Info Toggle Icon Button (only visible on mobile/tablet below lg breakpoint) */}
            <button
              onClick={() => setShowMobileInfo(!showMobileInfo)}
              className={`lg:hidden flex items-center gap-1.5 py-3 px-1 border-b-2 font-medium text-xs transition-all whitespace-nowrap ${
                showMobileInfo
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 hover:border-zinc-300"
              }`}
              title="Show Analytics & Help"
            >
              <Info className={`h-4 w-4 ${showMobileInfo ? "text-violet-500" : "text-zinc-400"}`} />
              <span className={`hidden sm:inline font-semibold text-[13px] ${showMobileInfo ? "text-violet-900" : "text-zinc-800"}`}>Analytics & Help</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        <div className={viewTab === "charts" ? "block" : "hidden"}>
          {(activeTab === "single" || activeTab === "group" || activeTab === "templates") && (
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left Column (Search + Filters + Charts List) */}
            <div className={`flex-1 min-w-0 w-full space-y-6 ${showMobileInfo ? "hidden lg:block" : "block"}`}>
              {/* Search and Filters Card */}
              <Card className="border border-zinc-200 bg-white shadow-none rounded-lg">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 w-full">
                    {/* Enhanced Search Input: Visible on screens >= 376px OR when expanded on Small Mobile */}
                    <div className={`relative group flex-1 ${isSearchExpanded ? "flex" : "hidden xs:flex"}`}>
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-violet-500 transition-colors hidden mob:block" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search your charts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => setTimeout(() => setIsSearchExpanded(false), 200)}
                        className="pl-3.5 mob:pl-10 pr-8 py-2 text-sm border-zinc-200 rounded-lg focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 bg-zinc-50/50 hover:bg-white transition-all shadow-none w-full"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-zinc-100 rounded-full transition-colors"
                        >
                          <X className="h-3.5 w-3.5 text-zinc-400" />
                        </button>
                      )}
                    </div>

                    {/* Filter Controls Row: Hidden when search is expanded on Small Mobile (< 376px) */}
                    <div className={`items-center justify-between xs:justify-start gap-1.5 xs:gap-2 flex-1 xs:flex-none shrink-0 ${isSearchExpanded ? "hidden xs:flex" : "flex"}`}>
                      {/* Search Icon Button: Collapsed mode, visible only on Small Mobile (< 376px) */}
                      <Button
                        variant="outline"
                        onClick={() => setIsSearchExpanded(true)}
                        className="h-9 w-9 p-0 bg-white hover:bg-violet-50/50 hover:text-violet-700 hover:border-violet-200 rounded-lg xs:hidden shadow-none shrink-0 flex items-center justify-center"
                        title="Search"
                      >
                        <Search className="h-4 w-4 text-zinc-400" />
                      </Button>

                      {/* Type Filter */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-9 w-9 p-0 mob:w-auto mob:px-2.5 sm:mob:px-3 bg-white hover:bg-violet-50/50 hover:text-violet-700 hover:border-violet-200 rounded-lg text-xs font-semibold text-zinc-700 shadow-none transition-all gap-1.5 flex items-center justify-center">
                            <Filter className={`h-3.5 w-3.5 ${filterType !== "all" ? "text-violet-600" : "text-zinc-400"}`} />
                            <span className="hidden md:inline">
                              {filterType === "all" ? "Type" : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                            </span>
                            <ChevronDown className="h-3 w-3 text-zinc-400 hidden mob:block" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 max-h-[280px] overflow-y-auto">
                          <DropdownMenuItem onClick={() => setFilterType("all")} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                            <Folder className="h-4 w-4 mr-2 text-zinc-400" />
                            All Types
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {chartTypes.map(type => {
                            const IconComponent = getChartTypeIcon(type)
                            return (
                              <DropdownMenuItem key={type} onClick={() => setFilterType(type)} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                                <IconComponent className="h-4 w-4 mr-2 text-zinc-400" />
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </DropdownMenuItem>
                            )
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Sort */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="h-9 w-9 p-0 mob:w-auto mob:px-2.5 sm:mob:px-3 bg-white hover:bg-violet-50/50 hover:text-violet-700 hover:border-violet-200 rounded-lg text-xs font-semibold text-zinc-700 shadow-none transition-all gap-1.5 flex items-center justify-center">
                            {sortBy === "oldest" ? <SortAsc className="h-3.5 w-3.5 text-zinc-400" /> : <SortDesc className="h-3.5 w-3.5 text-zinc-400" />}
                            <span className="hidden md:inline">
                              Sort: {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Name"}
                            </span>
                            <ChevronDown className="h-3 w-3 text-zinc-400 hidden mob:block" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => setSortBy("newest")} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                            <Clock className="h-4 w-4 mr-2 text-zinc-400" />
                            Newest First
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("oldest")} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                            <Calendar className="h-4 w-4 mr-2 text-zinc-400" />
                            Oldest First
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setSortBy("name")} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                            <Settings2 className="h-4 w-4 mr-2 text-zinc-400" />
                            Alphabetical
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* View Mode Toggle Segment (Desktop/Large Mobile) */}
                      <div className="hidden mob:flex items-center gap-0.5 bg-zinc-100 rounded-lg p-1 border border-zinc-200 shrink-0">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-1.5 rounded transition-all ${viewMode === "grid"
                              ? "bg-white text-violet-700 shadow-sm border border-zinc-200/50"
                              : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                            }`}
                          title="Grid View"
                        >
                          <Grid3x3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`p-1.5 rounded transition-all ${viewMode === "list"
                              ? "bg-white text-violet-700 shadow-sm border border-zinc-200/50"
                              : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
                            }`}
                          title="List View"
                        >
                          <List className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* View Mode Toggle Dropdown (Mobile-only: visible below 426px) */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild className="flex mob:hidden">
                          <Button variant="outline" className="h-9 w-9 p-0 bg-white hover:bg-violet-50/50 hover:text-violet-700 hover:border-violet-200 rounded-lg text-xs font-semibold text-zinc-700 shadow-none transition-all flex items-center justify-center shrink-0">
                            {viewMode === "grid" ? <Grid3x3 className="h-3.5 w-3.5 text-violet-600" /> : <List className="h-3.5 w-3.5 text-violet-600" />}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem onClick={() => setViewMode("grid")} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                            <Grid3x3 className="h-4 w-4 mr-2 text-zinc-400" />
                            Grid View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setViewMode("list")} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                            <List className="h-4 w-4 mr-2 text-zinc-400" />
                            List View
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Refresh */}
                      <Button
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        variant="outline"
                        className="h-9 w-9 p-0 mob:w-auto mob:px-2.5 sm:mob:px-3 bg-white hover:bg-zinc-50 border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 shadow-none flex items-center justify-center shrink-0"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 text-zinc-400 ${isRefreshing ? "animate-spin" : ""}`} />
                        <span className="hidden md:inline">Refresh</span>
                      </Button>
                    </div>
                  </div>

                  {/* Active Filters Display */}
                  {(searchQuery || filterType !== "all") && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-zinc-100">
                      <span className="text-[10px] xs:text-xs text-zinc-500">Active filters:</span>
                      {searchQuery && (
                        <Badge variant="secondary" className="gap-1 rounded bg-violet-50 text-violet-700 border border-violet-200 shadow-none text-[11px] font-semibold py-0.5 px-2">
                          Search: "{searchQuery}"
                          <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-violet-100 rounded-full p-0.5 transition-colors">
                            <X className="h-3.5 w-3.5 text-violet-400" />
                          </button>
                        </Badge>
                      )}
                      {filterType !== "all" && (
                        <Badge variant="secondary" className="gap-1 rounded bg-violet-50 text-violet-700 border border-violet-200 shadow-none text-[11px] font-semibold py-0.5 px-2">
                          Type: {filterType}
                          <button onClick={() => setFilterType("all")} className="ml-1 hover:bg-violet-100 rounded-full p-0.5 transition-colors">
                            <X className="h-3.5 w-3.5 text-violet-400" />
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
                        className="text-xs h-6 px-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50/50"
                      >
                        Clear all
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enhanced Charts Grid/List */}
              {filteredConversations.length === 0 ? (
                <Card className="border border-zinc-200 bg-white shadow-none rounded-lg">
                  <CardContent className="py-16 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                      {/* Enhanced Empty State */}
                      <div className="relative">
                        <div className="w-20 h-20 bg-zinc-50 border border-zinc-200 rounded-xl mx-auto flex items-center justify-center mb-6">
                          {activeTab === "templates" ? (
                            <LayoutTemplate className="h-10 w-10 text-violet-500" />
                          ) : activeTab === "group" ? (
                            <Layers className="h-10 w-10 text-violet-500" />
                          ) : (
                            <BarChart2 className="h-10 w-10 text-violet-500" />
                          )}
                        </div>
                        <div className="absolute top-0 right-1/3 translate-x-4 w-6 h-6 bg-violet-50 border border-violet-200 rounded-full flex items-center justify-center shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-zinc-900">
                          {searchQuery || filterType !== "all"
                            ? "No matching items"
                            : activeTab === "templates"
                            ? "Blueprint Templates"
                            : activeTab === "group"
                            ? "No group charts yet"
                            : "Ready to create amazing charts?"}
                        </h3>
                        <p className="text-zinc-500 text-sm leading-relaxed">
                          {searchQuery || filterType !== "all"
                            ? "Try adjusting your search terms or filters to find what you're looking for."
                            : activeTab === "templates"
                            ? "Create reusable, professional layout blueprints for your charts. Add custom text zones, heading areas, and pre-styled headers."
                            : activeTab === "group"
                            ? "Create multi-dataset grouped visualizations, combined bar/line/area layers, and interactive comparative dashboards."
                            : "Transform your data into beautiful, interactive visualizations with our AI-powered tools. Get started in seconds!"}
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Link href={activeTab === "templates" ? "/landing" : "/landing"}>
                          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-none">
                            {activeTab === "templates" ? (
                              <>
                                <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
                                Create a Template Chart
                              </>
                            ) : (
                              <>
                                <Zap className="h-3.5 w-3.5 mr-1.5" />
                                Create with AI
                              </>
                            )}
                          </Button>
                        </Link>
                        {activeTab !== "templates" && (
                          <Link href="/editor">
                            <Button variant="outline" className="border-zinc-200 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700 text-xs font-semibold text-zinc-700">
                              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                              Advanced Editor
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Quick Tips */}
                      {!searchQuery && filterType === "all" && activeTab !== "templates" && (
                        <div className="mt-8 p-4 bg-zinc-50 rounded-xl border border-zinc-200 text-left">
                          <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider mb-2">💡 Quick Tips</h4>
                          <ul className="text-xs text-zinc-500 space-y-1">
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
                <div className="space-y-4">
                  {/* Results Summary */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                        {activeTab === "templates" 
                          ? "Your Templates" 
                          : activeTab === "single" 
                          ? "Single Charts" 
                          : activeTab === "group" 
                          ? "Group Charts" 
                          : "Your Charts"}
                      </h2>
                      <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 font-bold text-xs shadow-none">
                        {filteredConversations.length} {filteredConversations.length === 1 
                          ? (activeTab === "templates" ? 'template' : 'chart') 
                          : (activeTab === "templates" ? 'templates' : 'charts')}
                      </Badge>
                    </div>

                    {filteredConversations.length !== currentConversations.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setFilterType("all")
                        }}
                        className="text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50/55 font-semibold"
                      >
                        Show all {currentConversations.length} {activeTab === "templates" ? 'templates' : 'charts'}
                      </Button>
                    )}
                  </div>

                  {/* Charts Display */}
                  <div className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6"
                      : "space-y-2"
                  }>
                    {filteredConversations.slice(0, visibleCount).map((conv) => (
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

                  {/* Load More / Pagination */}
                  {filteredConversations.length > visibleCount && (
                    <div className="text-center pt-8">
                      <Button
                        onClick={() => setVisibleCount((prev) => prev + 12)}
                        variant="outline"
                        className="border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-none"
                      >
                        Load More Charts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Info Area: Visible only on screens < lg when showMobileInfo is true */}
            {showMobileInfo && (
              <div className="w-full space-y-6 lg:hidden">
                {/* About / Summary Panel */}
                <Card className="border border-zinc-200 bg-white shadow-none rounded-lg">
                  <CardHeader className="py-3 px-3 sm:px-4 border-b border-zinc-100">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <LayoutDashboard className="h-3.5 w-3.5 text-violet-500" />
                      {activeTab === 'templates' ? 'About Templates' : activeTab === 'group' ? 'About Grouped Charts' : 'About Single Charts'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <span className="flex items-center gap-2">
                        <BarChart2 className="h-4 w-4 text-violet-500" />
                        Total Created
                      </span>
                      <span className="font-semibold text-zinc-900">{quickStats.total} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <span className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-violet-500" />
                        Active this week
                      </span>
                      <span className="font-semibold text-zinc-900">{quickStats.thisWeek} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-zinc-600">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-violet-500" />
                        Weekly Average
                      </span>
                      <span className="font-semibold text-zinc-900">{quickStats.avgPerWeek} avg</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Chart Types Distribution Panel (GitHub style) */}
                {typeDistribution.length > 0 && (
                  <Card className="border border-zinc-200 bg-white shadow-none rounded-lg">
                    <CardHeader className="py-3 px-3 sm:px-4 border-b border-zinc-100">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                        {activeTab === 'templates' ? 'Template Chart Types' : 'Chart Types'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      {/* Language bar representation */}
                      <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-100 mb-4 border border-zinc-200">
                        {typeDistribution.map((item, idx) => (
                          <div
                             key={idx}
                             className={item.color}
                             style={{ width: `${item.percentage}%` }}
                             title={`${item.type}: ${item.percentage}%`}
                          />
                        ))}
                      </div>
                      {/* Language dot descriptions */}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-2 xs:gap-x-4 xs:gap-y-2.5">
                        {typeDistribution.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-[11px] xs:text-xs">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                            <span className="font-medium text-zinc-700 capitalize truncate">{item.type}</span>
                            <span className="text-zinc-400 text-[10px] ml-auto">{item.percentage}%</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tips Panel */}
                <Card className="border border-violet-100 bg-gradient-to-br from-white to-violet-50/20 shadow-none rounded-lg">
                  <CardHeader className="py-3 px-3 sm:px-4 border-b border-violet-100/60">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                      Quick Help
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    <ul className="text-xs text-zinc-650 space-y-2.5 list-disc pl-4 leading-relaxed">
                      <li>Use the <strong className="text-violet-750 font-semibold">Create with AI</strong> button to draft a new chart in natural language.</li>
                      <li>Toggle the <strong className="text-violet-750 font-semibold">Advanced Editor</strong> to precisely align grids, customize legends, or export canvas data.</li>
                      <li>Share links are fully public and require no authentication to view.</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Right Column (Sidebar Analytics) */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24 hidden lg:block">
              {/* About / Summary Panel */}
              <Card className="border border-zinc-200 bg-white shadow-none rounded-lg">
                <CardHeader className="py-3 px-3 sm:px-4 border-b border-zinc-100">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <LayoutDashboard className="h-3.5 w-3.5 text-violet-500" />
                    {activeTab === 'templates' ? 'About Templates' : activeTab === 'group' ? 'About Grouped Charts' : 'About Single Charts'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-violet-500" />
                      Total Created
                    </span>
                    <span className="font-semibold text-zinc-900">{quickStats.total} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-violet-500" />
                      Active this week
                    </span>
                    <span className="font-semibold text-zinc-900">{quickStats.thisWeek} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-600">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-violet-500" />
                      Weekly Average
                    </span>
                    <span className="font-semibold text-zinc-900">{quickStats.avgPerWeek} avg</span>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Types Distribution Panel (GitHub style) */}
              {typeDistribution.length > 0 && (
                <Card className="border border-zinc-200 bg-white shadow-none rounded-lg">
                  <CardHeader className="py-3 px-3 sm:px-4 border-b border-zinc-100">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      {activeTab === 'templates' ? 'Template Chart Types' : 'Chart Types'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    {/* Language bar visual representation */}
                    <div className="h-2 w-full rounded-full overflow-hidden flex bg-zinc-100 mb-4 border border-zinc-200">
                      {typeDistribution.map((item, idx) => (
                        <div
                           key={idx}
                           className={item.color}
                           style={{ width: `${item.percentage}%` }}
                           title={`${item.type}: ${item.percentage}%`}
                        />
                      ))}
                    </div>
                    {/* Language dot descriptions */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-2 xs:gap-x-4 xs:gap-y-2.5">
                      {typeDistribution.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 text-[11px] xs:text-xs">
                          <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0`} />
                          <span className="font-medium text-zinc-700 capitalize truncate">{item.type}</span>
                          <span className="text-zinc-400 text-[10px] ml-auto">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips Panel */}
              <Card className="border border-violet-100 bg-gradient-to-br from-white to-violet-50/20 shadow-none rounded-lg">
                <CardHeader className="py-3 px-3 sm:px-4 border-b border-violet-100/60">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-700 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    Quick Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ul className="text-xs text-zinc-650 space-y-2.5 list-disc pl-4 leading-relaxed">
                    <li>Use the <strong className="text-violet-750 font-semibold">Create with AI</strong> button to draft a new chart in natural language.</li>
                    <li>Toggle the <strong className="text-violet-750 font-semibold">Advanced Editor</strong> to precisely align grids, customize legends, or export canvas data.</li>
                    <li>Share links are fully public and require no authentication to view.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        </div>

        {viewTab === "images" && (
          <MyImagesManager loadConversationsFromBackend={loadConversationsFromBackend} />
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

interface MyImagesManagerProps {
  loadConversationsFromBackend: () => Promise<void>;
}

function MyImagesManager({ loadConversationsFromBackend }: MyImagesManagerProps) {
  const [images, setImages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [deletingImage, setDeletingImage] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchImages = async () => {
    setLoading(true)
    try {
      const res = await dataService.getMyImages()
      if (res.data) {
        setImages(res.data)
      } else {
        toast.error(res.error || "Failed to load images")
      }
    } catch (err) {
      toast.error("Failed to load images")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  const handleCopyUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    toast.success("Image URL copied to clipboard!")
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async () => {
    if (!deletingImage) return
    setIsDeleting(true)
    try {
      const res = await dataService.deleteMyImage(deletingImage.id)
      if (res.data?.success) {
        toast.success("Image deleted successfully!")
        setDeletingImage(null)
        fetchImages()
        // Reload conversations to sync the dashboard charts if any were cascaded
        if (
          res.data.cascade?.charts?.length > 0 || 
          res.data.cascade?.templates?.length > 0 || 
          res.data.cascade?.formats?.length > 0
        ) {
          loadConversationsFromBackend()
        }
      } else {
        toast.error(res.error || "Failed to delete image")
      }
    } catch (err) {
      toast.error("Failed to delete image")
    } finally {
      setIsDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
        <p className="text-sm text-zinc-500 font-semibold animate-pulse">Loading uploaded images...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 pb-5">
        <div>
          <h2 className="text-lg font-bold text-zinc-950 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-violet-600" />
            My Uploaded Images
          </h2>
          <p className="text-zinc-500 text-sm mt-1">
            Manage your images in Supabase Storage. View active chart/template mappings and delete images with cascading warning checks.
          </p>
        </div>
        <div className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1 text-xs font-bold self-start md:self-center shadow-none">
          {images.length} {images.length === 1 ? "image" : "images"} uploaded
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="border border-zinc-200 bg-white shadow-none rounded-lg py-16 text-center">
          <CardContent className="max-w-md mx-auto space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-zinc-50 border border-zinc-200 rounded-xl mx-auto flex items-center justify-center mb-6">
                <ImageIcon className="h-10 w-10 text-violet-500" />
              </div>
              <div className="absolute top-0 right-1/3 translate-x-4 w-6 h-6 bg-violet-50 border border-violet-200 rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-violet-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-zinc-900">No uploaded images</h3>
              <p className="text-zinc-500 text-sm leading-relaxed">
                Images you upload inside custom layout formats, image zones, or chart decorations will appear here automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((img) => (
            <Card key={img.id} className="border border-zinc-200 bg-white shadow-none rounded-xl overflow-hidden hover:border-zinc-300 transition-all flex flex-col group">
              {/* Image Thumbnail */}
              <div className="relative aspect-video bg-zinc-50 border-b border-zinc-100 flex items-center justify-center overflow-hidden p-4 group-hover:bg-zinc-100/60 transition-colors">
                <img
                  src={img.image_url}
                  alt={img.filename}
                  className="max-h-full max-w-full object-contain rounded shadow-sm hover:scale-102 transition-transform duration-300"
                />
              </div>

              {/* Card Body */}
              <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  {/* Filename & Date */}
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900 truncate" title={img.filename}>
                      {img.filename}
                    </h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Uploaded {new Date(img.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Mapping Badges */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Mapped to:</p>
                    
                    {(!img.mappings?.charts?.length && 
                      !img.mappings?.templates?.length && 
                      !img.mappings?.formats?.length) ? (
                      <Badge variant="outline" className="bg-zinc-50 text-zinc-500 border-zinc-200/60 shadow-none font-semibold text-[10px] py-0.5 px-1.5">
                        Unused / No mappings
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {img.mappings.charts?.map((c: any) => (
                          <Badge key={c.id} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200/60 shadow-none font-semibold text-[10px] py-0.5 px-1.5 truncate max-w-[200px]" title={`Chart: ${c.title}`}>
                            Chart: {c.title}
                          </Badge>
                        ))}
                        {img.mappings.templates?.map((t: any) => (
                          <Badge key={t.id} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200/60 shadow-none font-semibold text-[10px] py-0.5 px-1.5 truncate max-w-[200px]" title={`Template: ${t.name}`}>
                            Tpl: {t.name}
                          </Badge>
                        ))}
                        {img.mappings.formats?.map((f: any) => (
                          <Badge key={f.id} variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200/60 shadow-none font-semibold text-[10px] py-0.5 px-1.5 truncate max-w-[200px]" title={`Format: ${f.name}`}>
                            Fmt: {f.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                  <Button
                    onClick={() => handleCopyUrl(img.id, img.image_url)}
                    variant="outline"
                    className="flex-1 h-8 text-xs font-semibold px-2 border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 rounded-md gap-1 flex items-center justify-center shadow-none transition-all"
                  >
                    {copiedId === img.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => setDeletingImage(img)}
                    variant="outline"
                    className="h-8 w-8 p-0 border-red-200 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 rounded-md flex items-center justify-center shadow-none transition-all"
                    title="Delete Image"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Warning Modal */}
      {deletingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-md border border-zinc-200 shadow-2xl bg-white rounded-xl overflow-hidden animate-in zoom-in-95 duration-150">
            <CardHeader className="bg-red-50/50 border-b border-red-100 p-5">
              <div className="flex items-center gap-3 text-red-600">
                <Trash2 className="h-5 w-5 flex-shrink-0" />
                <CardTitle className="text-base font-bold text-red-950">Delete Uploaded Image?</CardTitle>
              </div>
              <CardDescription className="text-zinc-500 text-xs mt-1">
                This action is permanent and will delete the image file from storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm text-zinc-750">
              <p>Are you sure you want to delete <strong className="text-zinc-900">{deletingImage.filename}</strong>?</p>
              
              {(deletingImage.mappings?.charts?.length > 0 || 
                deletingImage.mappings?.templates?.length > 0 || 
                deletingImage.mappings?.formats?.length > 0) ? (
                <div className="p-4 bg-red-50/80 border border-red-150/70 rounded-lg space-y-2.5">
                  <p className="text-xs font-bold text-red-800">
                    ⚠️ CRITICAL: Deleting this image will also delete all associated mappings:
                  </p>
                  <ul className="text-xs text-red-900 space-y-1.5 list-disc pl-4 font-semibold leading-relaxed">
                    {deletingImage.mappings.charts?.map((c: any) => (
                      <li key={c.id}>Chart: <span className="text-red-950">{c.title}</span></li>
                    ))}
                    {deletingImage.mappings.templates?.map((t: any) => (
                      <li key={t.id}>Template: <span className="text-red-950">{t.name}</span></li>
                    ))}
                    {deletingImage.mappings.formats?.map((f: any) => (
                      <li key={f.id}>Format Blueprint: <span className="text-red-950">{f.name}</span></li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-red-700 italic">
                    Note: If associated charts/templates are deleted, their corresponding database conversations and layout files will be permanently purged.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-zinc-500 bg-zinc-50 border border-zinc-200 p-3 rounded-lg leading-relaxed">
                  This image is currently not used in any charts, templates, or format configurations. It is safe to delete.
                </p>
              )}
            </CardContent>
            <div className="bg-zinc-50 border-t border-zinc-150 p-4 flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeletingImage(null)} 
                disabled={isDeleting}
                className="h-8 text-xs font-semibold px-4 border-zinc-200 bg-white hover:bg-zinc-100 text-zinc-700 rounded-md shadow-none transition-all"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="h-8 text-xs font-semibold px-4 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-1.5 shadow-none transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Permanently"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

