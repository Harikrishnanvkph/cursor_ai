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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ChartPreviewModal } from "@/components/board/chart-preview-modal"
import { ChartCard } from "@/components/board/chart-card"
import { BoardStats, TotalChartsBadge } from "@/components/board/board-stats"
import { toast } from "sonner"
import { dataService } from "@/lib/data-service"
import {
  BarChart2,
  BarChart3,
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
  Trash2,
  Menu,
  SlidersHorizontal
} from "lucide-react"
import { getChartTypeDotColor, formatChartTypeName } from "@/lib/chart-type-meta"
import Link from "next/link"
import Image from "next/image"

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false)
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  // Focus search input when expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchExpanded])

  // Lock body scroll and handle Escape key for mobile menu
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileMenuOpen(false)
    }
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)
    return () => {
      document.body.style.overflow = ""
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isMobileMenuOpen])

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
    return Array.from(types).sort((a, b) => formatChartTypeName(a).localeCompare(formatChartTypeName(b)))
  }, [conversations])

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

  const singleCount = useMemo(() => conversations.filter(c => !c.is_template_mode && c.chart_mode !== 'grouped').length, [conversations])
  const groupCount = useMemo(() => conversations.filter(c => !c.is_template_mode && c.chart_mode === 'grouped').length, [conversations])
  const templateCount = useMemo(() => conversations.filter(c => c.is_template_mode).length, [conversations])

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
        displayName: formatChartTypeName(type),
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        color: getChartTypeDotColor(type)
      }))
      .sort((a, b) => b.count - a.count)
  }, [currentConversations])

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filterType !== "all") count++
    if (sortBy !== "newest") count++
    if (viewMode !== "grid") count++
    return count
  }, [filterType, sortBy, viewMode])

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-5">
          <div className="relative mx-auto w-16 h-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <BarChart2 className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">Loading Dashboard</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Fetching your charts...</p>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">

      {/* Modern Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1600px] mx-auto px-2 xs:px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo and Title */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Mobile Menu Icon (< 450px) */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex phab:hidden p-1 -ml-1 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg items-center justify-center cursor-pointer"
                aria-label="Open Navigation Menu"
              >
                <Menu className="h-5 w-5" />
              </button>

              <Image src="/logo.png" alt="Logo" width={26} height={26} className="rounded-lg shrink-0" />
              <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight hidden phab:block">
                Dashboard
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Single dropdown for My Charts vs My Images (hidden below 450px, available in mobile sidebar) */}
              <div className="hidden phab:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50/90 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-none transition-all gap-1.5 flex items-center justify-center shrink-0"
                    >
                      {viewTab === "charts" ? (
                        <>
                          <BarChart3 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                          <span>My Charts</span>
                        </>
                      ) : (
                        <>
                          <ImageIcon className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                          <span>My Images</span>
                        </>
                      )}
                      <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500 shrink-0 ml-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 p-1 z-50">
                    <DropdownMenuItem
                      onClick={() => setViewTab("charts")}
                      className={`text-xs font-medium gap-2 cursor-pointer rounded-md ${
                        viewTab === "charts"
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-semibold"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <BarChart3 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                      <span className="flex-1">My Charts</span>
                      {viewTab === "charts" && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setViewTab("images")}
                      className={`text-xs font-medium gap-2 cursor-pointer rounded-md ${
                        viewTab === "images"
                          ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-semibold"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      <ImageIcon className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                      <span className="flex-1">My Images</span>
                      {viewTab === "images" && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile (451px to 639px): Unified Create Dropdown (hidden below 450px, available in mobile sidebar) */}
              <div className="hidden phab:flex sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      size="sm"
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-xs h-8 px-2.5 rounded-lg gap-1.5 flex items-center justify-center shadow-sm shadow-violet-500/20 transition-all active:scale-95 shrink-0"
                    >
                      <Sparkles className="h-3.5 w-3.5 shrink-0" />
                      <span>Create</span>
                      <ChevronDown className="h-3 w-3 opacity-75 shrink-0" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 p-1.5 z-50">
                    <DropdownMenuItem asChild>
                      <Link href="/landing" className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer">
                        <div className="w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-950/60 flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                          <Sparkles className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">Create with AI</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Generate from natural language</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild>
                      <Link href="/editor" className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer">
                        <div className="w-7 h-7 rounded-md bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                          <Edit3 className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                            <span className="hidden md:inline">Advanced Editor</span>
                            <span className="md:hidden">Editor</span>
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Canvas & layout designer</p>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Desktop (>=640px): Dedicated Buttons */}
              <div className="hidden sm:flex items-center gap-2">
                <Link href="/landing">
                  <Button 
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-xs h-8 px-3 rounded-lg gap-1.5 flex items-center justify-center shadow-sm shadow-violet-500/20 transition-all hover:shadow-md hover:shadow-violet-500/30 hover:-translate-y-px"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Create with AI</span>
                  </Button>
                </Link>
                <Link href="/editor">
                  <Button 
                    variant="outline" 
                    className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 text-slate-700 dark:text-slate-300 font-semibold text-xs h-8 px-3 rounded-lg gap-1.5 flex items-center justify-center shadow-none transition-all"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Advanced Editor</span>
                    <span className="md:hidden">Editor</span>
                  </Button>
                </Link>
              </div>

              <div className="w-[1px] h-4 sm:h-5 bg-slate-200 dark:bg-slate-700 mx-0.5 sm:mx-1 shrink-0 hidden phab:block"></div>
              <div className="shrink-0">
                <SimpleProfileDropdown size="sm" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Sidebar Drawer (< 450px, Instant GPU-Accelerated) */}
      <div
        className={`fixed inset-0 z-50 phab:hidden transition-opacity duration-75 ${
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute inset-0 bg-black/60"
          aria-hidden="true"
        />

        {/* Sidebar Drawer Container */}
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          className={`absolute inset-y-0 left-0 w-[85vw] max-w-[360px] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl transform-gpu transition-transform duration-100 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Header: App icon + aichartor.com + Close Button */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-lg shrink-0" />
              <span className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                aichartor.com
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Close Navigation Menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
            {/* Section 1: Options */}
            <div>
              <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Options
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setViewTab("charts")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    viewTab === "charts"
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <BarChart3 className={`h-4 w-4 shrink-0 ${viewTab === "charts" ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className="flex-1 text-left">My Charts</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {conversations.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setViewTab("images")
                    setIsMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                    viewTab === "images"
                      ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-bold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <ImageIcon className={`h-4 w-4 shrink-0 ${viewTab === "images" ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`} />
                  <span className="flex-1 text-left">My Images</span>
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 my-1" />

            {/* Section 2: Pages */}
            <div>
              <div className="px-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Pages
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    router.push("/landing")
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300 cursor-pointer group"
                >
                  <Sparkles className="h-4 w-4 text-violet-500 dark:text-violet-400 shrink-0" />
                  <span className="flex-1 text-left">AI Chart</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    router.push("/editor")
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 dark:hover:text-violet-300 cursor-pointer group"
                >
                  <Edit3 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 shrink-0" />
                  <span className="flex-1 text-left">Advanced Editor</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Secondary Sub-header (Tabs) */}
      <div className={viewTab === "charts" ? "bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800" : "hidden"}>
        <div className="max-w-[1600px] mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-1.5 sm:gap-4">
            {/* Mobile Tab Dropdown (below 361px) */}
            <div className="xs:hidden py-1 min-w-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 text-xs font-semibold rounded-lg border-violet-200 dark:border-violet-800/60 bg-violet-50/70 dark:bg-violet-950/40 text-violet-800 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/50 shadow-none gap-1.5 flex items-center justify-center shrink-0"
                  >
                    {activeTab === "single" && (
                      <>
                        <BarChart2 className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span className="truncate">Single Chart</span>
                        <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-violet-200/70 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200">
                          {singleCount}
                        </span>
                      </>
                    )}
                    {activeTab === "group" && (
                      <>
                        <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span className="truncate">Group Chart</span>
                        <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-violet-200/70 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200">
                          {groupCount}
                        </span>
                      </>
                    )}
                    {activeTab === "templates" && (
                      <>
                        <LayoutTemplate className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400 shrink-0" />
                        <span className="truncate">Templates</span>
                        <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-violet-200/70 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200">
                          {templateCount}
                        </span>
                      </>
                    )}
                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-44 z-50 p-1">
                  <DropdownMenuItem
                    onClick={() => setActiveTab("single")}
                    className={`text-xs py-2 cursor-pointer gap-2 rounded-md ${
                      activeTab === "single"
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <BarChart2 className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="flex-1">Single Chart</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {singleCount}
                    </span>
                    {activeTab === "single" && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setActiveTab("group")}
                    className={`text-xs py-2 cursor-pointer gap-2 rounded-md ${
                      activeTab === "group"
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="flex-1">Group Chart</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {groupCount}
                    </span>
                    {activeTab === "group" && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setActiveTab("templates")}
                    className={`text-xs py-2 cursor-pointer gap-2 rounded-md ${
                      activeTab === "templates"
                        ? "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300 font-semibold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <LayoutTemplate className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                    <span className="flex-1">Templates</span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {templateCount}
                    </span>
                    {activeTab === "templates" && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Standard Tabs Navigation (>= 361px) */}
            <nav 
              className="hidden xs:flex space-x-1 sm:space-x-2 -mb-px overflow-x-auto flex-1 min-w-0" 
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              aria-label="Tabs"
            >
              <button
                onClick={() => {
                  setActiveTab("single")
                }}
                className={`flex items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1.5 sm:px-2 border-b-2 font-medium text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "single"
                    ? "border-violet-600 text-violet-700 dark:text-violet-400 dark:border-violet-500"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <BarChart2 className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${activeTab === "single" ? "text-violet-500 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span className={`inline sm:hidden font-semibold text-xs ${activeTab === "single" ? "text-violet-800 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>Single</span>
                <span className={`hidden sm:inline font-semibold text-[13px] ${activeTab === "single" ? "text-violet-800 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>Single Chart</span>
                <span className={`ml-0.5 sm:ml-1.5 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold border rounded-full ${
                  activeTab === "single"
                    ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}>
                  {singleCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("group")
                }}
                className={`flex items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1.5 sm:px-2 border-b-2 font-medium text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "group"
                    ? "border-violet-600 text-violet-700 dark:text-violet-400 dark:border-violet-500"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <Layers className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${activeTab === "group" ? "text-violet-500 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span className={`inline sm:hidden font-semibold text-xs ${activeTab === "group" ? "text-violet-800 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>Group</span>
                <span className={`hidden sm:inline font-semibold text-[13px] ${activeTab === "group" ? "text-violet-800 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>Group Chart</span>
                <span className={`ml-0.5 sm:ml-1.5 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold border rounded-full ${
                  activeTab === "group"
                    ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}>
                  {groupCount}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("templates")
                }}
                className={`flex items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 px-1.5 sm:px-2 border-b-2 font-medium text-xs transition-all whitespace-nowrap shrink-0 ${
                  activeTab === "templates"
                    ? "border-violet-600 text-violet-700 dark:text-violet-400 dark:border-violet-500"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                <LayoutTemplate className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${activeTab === "templates" ? "text-violet-500 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span className={`font-semibold text-xs sm:text-[13px] ${activeTab === "templates" ? "text-violet-800 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>Templates</span>
                <span className={`ml-0.5 sm:ml-1.5 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-[11px] font-bold border rounded-full ${
                  activeTab === "templates"
                    ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}>
                  {templateCount}
                </span>
              </button>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 py-1 sm:py-1.5">
              {/* Total Charts Counter (hidden below 1024px) */}
              <div className="hidden lg:block">
                <TotalChartsBadge totalCount={conversations.length} />
              </div>

              {/* Info Toggle Icon Button (mobile/tablet only) */}
              <button
                onClick={() => setShowMobileInfo(!showMobileInfo)}
                className={`lg:hidden flex items-center justify-center h-7 w-7 sm:h-8 sm:w-auto sm:px-2 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-xs transition-all whitespace-nowrap shrink-0 ${
                  showMobileInfo
                    ? "bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-950/50 dark:border-violet-800 dark:text-violet-300"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
                title="Analytics"
              >
                <Info className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${showMobileInfo ? "text-violet-500 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`} />
                <span className={`hidden sm:inline font-semibold text-[13px] ml-1.5 ${showMobileInfo ? "text-violet-800 dark:text-violet-300" : "text-slate-700 dark:text-slate-300"}`}>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        
        <div className={viewTab === "charts" ? "block" : "hidden"}>
          {(activeTab === "single" || activeTab === "group" || activeTab === "templates") && (
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Left Column (Search + Filters + Charts List) */}
            <div className="flex-1 min-w-0 w-full space-y-5">
              {/* Storage Quota Banner */}
              <BoardStats allConversations={conversations} />

              {/* Search and Filters Toolbar */}
              <div className="w-full">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full">
                  {/* Search Input & Mobile Consolidated Filter Trigger Button */}
                  <div className="flex items-center gap-2 w-full flex-1 min-w-0">
                    <div className="relative group flex-1 min-w-0">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 group-focus-within:text-violet-500 transition-colors" />
                      <Input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search your charts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-8 py-2 text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 rounded-lg focus-visible:ring-1 focus-visible:ring-violet-500 focus-visible:border-violet-500 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-none w-full"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        </button>
                      )}
                    </div>

                    {/* Consolidated Filter & Options Trigger Button (shown only <= 450px) */}
                    <button
                      type="button"
                      onClick={() => setIsFilterSheetOpen(true)}
                      className={`flex phab:hidden h-9 px-2.5 rounded-lg border text-xs font-semibold items-center justify-center gap-1.5 shrink-0 transition-all cursor-pointer relative shadow-none ${
                        activeFiltersCount > 0
                          ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                      aria-label="Filter and sort options"
                      title="Filter and sort options"
                    >
                      <SlidersHorizontal className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                      {activeFiltersCount > 0 ? (
                        <span className="w-4 h-4 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Filter</span>
                      )}
                    </button>
                  </div>

                  {/* Filter Controls: Full row on desktop/tablet, hidden <= 450px */}
                  <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 shrink-0 hidden phab:flex">
                    {/* Type Filter */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 px-2.5 sm:px-3 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 hover:border-violet-200 dark:hover:border-violet-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-none transition-all gap-1.5 flex items-center justify-center flex-1 sm:flex-none">
                          <Filter className={`h-3.5 w-3.5 ${filterType !== "all" ? "text-violet-600 dark:text-violet-400" : "text-slate-400 dark:text-slate-500"}`} />
                          <span>
                            {filterType === "all" ? "Type" : formatChartTypeName(filterType)}
                          </span>
                          <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 max-h-[280px] overflow-y-auto">
                        <DropdownMenuItem onClick={() => setFilterType("all")} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer">
                          <Folder className="h-4 w-4 mr-2 text-zinc-400" />
                          All Types
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {chartTypes.map(type => {
                          const isSelected = filterType === type
                          return (
                            <DropdownMenuItem key={type} onClick={() => setFilterType(type)} className="focus:bg-violet-50 focus:text-violet-700 text-xs py-2 cursor-pointer justify-between">
                              <div className="flex items-center gap-2 truncate">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getChartTypeDotColor(type)}`} />
                                <span className="truncate">{formatChartTypeName(type)}</span>
                              </div>
                              {isSelected && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0 ml-1" />}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Sort */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="h-9 px-2.5 sm:px-3 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-700 hover:border-violet-200 dark:hover:border-violet-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-none transition-all gap-1.5 flex items-center justify-center flex-1 sm:flex-none">
                          {sortBy === "oldest" ? <SortAsc className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" /> : <SortDesc className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
                          <span className="hidden xs:inline sm:hidden md:inline">
                            {sortBy === "newest" ? "Newest" : sortBy === "oldest" ? "Oldest" : "Name"}
                          </span>
                          <ChevronDown className="h-3 w-3 text-slate-400 dark:text-slate-500" />
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

                    {/* View Mode Toggle Segment */}
                    <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 shrink-0">
                      <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded transition-all ${viewMode === "grid"
                            ? "bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          }`}
                        title="Grid View"
                      >
                        <Grid3x3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded transition-all ${viewMode === "list"
                            ? "bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-400 shadow-sm border border-slate-200/50 dark:border-slate-600/50"
                            : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          }`}
                        title="List View"
                      >
                        <List className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Refresh */}
                    <Button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      variant="outline"
                      className="h-9 px-2.5 sm:px-3 bg-white dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-none flex items-center justify-center shrink-0"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-slate-400 dark:text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
                      <span className="hidden md:inline">Refresh</span>
                    </Button>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(searchQuery || filterType !== "all") && (
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    <span className="text-[10px] xs:text-xs text-slate-500 dark:text-slate-400">Active filters:</span>
                    {searchQuery && (
                      <Badge variant="secondary" className="gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 shadow-none text-[11px] font-semibold py-0.5 px-2">
                        Search: &ldquo;{searchQuery}&rdquo;
                        <button onClick={() => setSearchQuery("")} className="ml-1 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full p-0.5 transition-colors">
                          <X className="h-3.5 w-3.5 text-violet-400 dark:text-violet-500" />
                        </button>
                      </Badge>
                    )}
                    {filterType !== "all" && (
                      <Badge variant="secondary" className="gap-1 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 shadow-none text-[11px] font-semibold py-0.5 px-2">
                        Type: {formatChartTypeName(filterType)}
                        <button onClick={() => setFilterType("all")} className="ml-1 hover:bg-violet-100 dark:hover:bg-violet-900/50 rounded-full p-0.5 transition-colors">
                          <X className="h-3.5 w-3.5 text-violet-400 dark:text-violet-500" />
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
                      className="text-xs h-6 px-2 text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:bg-violet-50/50 dark:hover:bg-violet-950/30"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>

              {/* Enhanced Charts Grid/List */}
              {filteredConversations.length === 0 ? (
                <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-2xl">
                  <CardContent className="py-20 text-center">
                    <div className="max-w-md mx-auto space-y-6">
                      {/* Empty State icon */}
                      <div className="relative mx-auto w-fit">
                        <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-100 dark:border-violet-800/40 rounded-2xl mx-auto flex items-center justify-center mb-2">
                          {activeTab === "templates" ? (
                            <LayoutTemplate className="h-10 w-10 text-violet-500 dark:text-violet-400" />
                          ) : activeTab === "group" ? (
                            <Layers className="h-10 w-10 text-violet-500 dark:text-violet-400" />
                          ) : (
                            <BarChart2 className="h-10 w-10 text-violet-500 dark:text-violet-400" />
                          )}
                        </div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-800/40 rounded-full flex items-center justify-center shadow-sm">
                          <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          {searchQuery || filterType !== "all"
                            ? "No matching items"
                            : activeTab === "templates"
                            ? "Blueprint Templates"
                            : activeTab === "group"
                            ? "No group charts yet"
                            : "Ready to create amazing charts?"}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
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
                          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-sm shadow-violet-500/20 hover:shadow-md hover:shadow-violet-500/25 transition-all rounded-lg">
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
                            <Button variant="outline" className="border-slate-200 dark:border-slate-700 dark:text-slate-300 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-200 dark:hover:border-violet-700 hover:text-violet-700 dark:hover:text-violet-400 text-xs font-semibold rounded-lg">
                              <Edit3 className="h-3.5 w-3.5 mr-1.5" />
                              Advanced Editor
                            </Button>
                          </Link>
                        )}
                      </div>

                      {/* Quick Tips */}
                      {!searchQuery && filterType === "all" && activeTab !== "templates" && (
                        <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-left">
                          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">💡 Quick Tips</h4>
                          <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5">
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
                      <h2 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {activeTab === "templates" 
                          ? "Your Templates" 
                          : activeTab === "single" 
                          ? "Single Charts" 
                          : activeTab === "group" 
                          ? "Group Charts" 
                          : "Your Charts"}
                      </h2>
                    </div>

                    {filteredConversations.length !== currentConversations.length && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSearchQuery("")
                          setFilterType("all")
                        }}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:bg-violet-50/55 dark:hover:bg-violet-950/30 font-semibold"
                      >
                        Show all {currentConversations.length} {activeTab === "templates" ? 'templates' : 'charts'}
                      </Button>
                    )}
                  </div>

                  {/* Charts Display */}
                  <div className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-5"
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
                        className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 dark:text-slate-300 text-xs font-semibold text-slate-700 shadow-none rounded-lg px-6"
                      >
                        Load More Charts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile & Tablet Analytics & Help Slide-over Sheet */}
            <Sheet open={showMobileInfo} onOpenChange={setShowMobileInfo}>
              <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto p-4 sm:p-6 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
                <SheetHeader className="mb-4 text-left">
                  <SheetTitle className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Info className="h-4 w-4 text-violet-500" />
                    Analytics & Quick Help
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    Analytics overview and quick tips
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 pb-6">
                  {/* Total Charts Overview Panel */}
                  <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-xl overflow-hidden">
                    <CardContent className="p-3 sm:p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-xs shrink-0">
                            <BarChart2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              Total Charts
                            </span>
                            <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                              {conversations.length}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60">
                          All Categories
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-center">
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Single</div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{singleCount}</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Group</div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{groupCount}</div>
                        </div>
                        <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">Templates</div>
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{templateCount}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* About / Summary Panel */}
                  <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-xl">
                    <CardHeader className="py-3 px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <LayoutDashboard className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                        {activeTab === 'templates' ? 'About Templates' : activeTab === 'group' ? 'About Grouped Charts' : 'About Single Charts'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                          <BarChart2 className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                          Total Created
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{quickStats.total} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                          Active this week
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{quickStats.thisWeek} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <span className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                          Weekly Average
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{quickStats.avgPerWeek} avg</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Chart Types Distribution Panel */}
                  {typeDistribution.length > 0 && (
                    <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-xl">
                      <CardHeader className="py-3 px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {activeTab === 'templates' ? 'Template Chart Types' : 'Chart Types'}
                        </CardTitle>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                          {typeDistribution.length} {typeDistribution.length === 1 ? 'type' : 'types'}
                        </span>
                      </CardHeader>
                      <CardContent className="p-3 sm:p-4">
                        {/* Multi-color distribution bar */}
                        <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-4 border border-slate-200 dark:border-slate-700">
                          {typeDistribution.map((item, idx) => (
                            <div
                              key={idx}
                              className={item.color}
                              style={{ width: `${item.percentage}%` }}
                              title={`${item.displayName}: ${item.percentage}% (${item.count})`}
                            />
                          ))}
                        </div>
                        {/* Arranged Chart Type items */}
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 xs:gap-x-3 xs:gap-y-2">
                          {typeDistribution.map((item, idx) => {
                            const isSelected = filterType === item.type
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setFilterType(isSelected ? "all" : item.type)
                                  setShowMobileInfo(false)
                                }}
                                className={`flex items-center gap-1.5 text-[11px] xs:text-xs py-1 px-1.5 rounded-lg transition-all text-left cursor-pointer group ${
                                  isSelected
                                    ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-semibold ring-1 ring-violet-300 dark:ring-violet-700"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                }`}
                                title={`Click to filter by ${item.displayName}`}
                              >
                                <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                                <span className="font-medium truncate flex-1">{item.displayName}</span>
                                <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1 shrink-0 font-normal">{item.percentage}%</span>
                              </button>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Tips Panel */}
                  <Card className="border border-violet-100 dark:border-violet-900/40 bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-900 dark:to-violet-950/20 shadow-sm rounded-xl">
                    <CardHeader className="py-3 px-3 sm:px-4 border-b border-violet-100/60 dark:border-violet-900/40">
                      <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                        Quick Help
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4">
                      <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed">
                        <li>Use the <strong className="text-violet-700 dark:text-violet-400 font-semibold">Create with AI</strong> button to draft a new chart in natural language.</li>
                        <li>Toggle the <strong className="text-violet-700 dark:text-violet-400 font-semibold">Advanced Editor</strong> to precisely align grids, customize legends, or export canvas data.</li>
                        <li>Share links are fully public and require no authentication to view.</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </SheetContent>
            </Sheet>

            {/* Right Column (Sidebar Analytics) */}
            <div className="w-full lg:w-80 flex-shrink-0 space-y-4 lg:sticky lg:top-24 hidden lg:block">
              {/* About / Summary Panel */}
              <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-xl">
                <CardHeader className="py-3 px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <LayoutDashboard className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                    {activeTab === 'templates' ? 'About Templates' : activeTab === 'group' ? 'About Grouped Charts' : 'About Single Charts'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <BarChart2 className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      Total Created
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{quickStats.total} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      Active this week
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{quickStats.thisWeek} {activeTab === 'templates' ? 'templates' : 'charts'}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-violet-500 dark:text-violet-400" />
                      Weekly Average
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{quickStats.avgPerWeek} avg</span>
                  </div>
                </CardContent>
              </Card>

              {/* Chart Types Distribution Panel */}
              {typeDistribution.length > 0 && (
                <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-xl">
                  <CardHeader className="py-3 px-3 sm:px-4 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {activeTab === 'templates' ? 'Template Chart Types' : 'Chart Types'}
                    </CardTitle>
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                      {typeDistribution.length} {typeDistribution.length === 1 ? 'type' : 'types'}
                    </span>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4">
                    {/* Multi-color distribution bar */}
                    <div className="h-2 w-full rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800 mb-4 border border-slate-200 dark:border-slate-700">
                      {typeDistribution.map((item, idx) => (
                        <div
                           key={idx}
                           className={item.color}
                           style={{ width: `${item.percentage}%` }}
                           title={`${item.displayName}: ${item.percentage}% (${item.count})`}
                        />
                      ))}
                    </div>
                    {/* Arranged Chart Type items */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 xs:gap-x-3 xs:gap-y-2">
                      {typeDistribution.map((item, idx) => {
                        const isSelected = filterType === item.type
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setFilterType(isSelected ? "all" : item.type)}
                            className={`flex items-center gap-1.5 text-[11px] xs:text-xs py-1 px-1.5 rounded-lg transition-all text-left cursor-pointer group ${
                              isSelected
                                ? "bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 font-semibold ring-1 ring-violet-300 dark:ring-violet-700"
                                : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                            }`}
                            title={`Click to filter by ${item.displayName}`}
                          >
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                            <span className="font-medium truncate flex-1">{item.displayName}</span>
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] ml-1 shrink-0 font-normal">{item.percentage}%</span>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips Panel */}
              <Card className="border border-violet-100 dark:border-violet-900/40 bg-gradient-to-br from-white to-violet-50/30 dark:from-slate-900 dark:to-violet-950/20 shadow-sm rounded-xl">
                <CardHeader className="py-3 px-3 sm:px-4 border-b border-violet-100/60 dark:border-violet-900/40">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400 flex items-center gap-2">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
                    Quick Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4">
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-2.5 list-disc pl-4 leading-relaxed">
                    <li>Use the <strong className="text-violet-700 dark:text-violet-400 font-semibold">Create with AI</strong> button to draft a new chart in natural language.</li>
                    <li>Toggle the <strong className="text-violet-700 dark:text-violet-400 font-semibold">Advanced Editor</strong> to precisely align grids, customize legends, or export canvas data.</li>
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

      {/* Mobile Consolidated Filter & Sort Bottom Sheet (<= 450px) */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
          <SheetHeader className="text-left pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                Filter & Options
              </SheetTitle>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterType("all")
                    setSortBy("newest")
                    setViewMode("grid")
                  }}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Reset All
                </button>
              )}
            </div>
            <SheetDescription className="sr-only">
              Quick filters, sorting, and view layout settings
            </SheetDescription>
          </SheetHeader>

          <div className="py-4 space-y-4">
            {/* View Mode Layout */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                View Layout
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    viewMode === "grid"
                      ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                  Grid View
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    viewMode === "list"
                      ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <List className="h-4 w-4" />
                  List View
                </button>
              </div>
            </div>

            {/* Sort Order */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
                Sort By
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSortBy("newest")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                    sortBy === "newest"
                      ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Newest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("oldest")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                    sortBy === "oldest"
                      ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Oldest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("name")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                    sortBy === "name"
                      ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Name
                </button>
              </div>
            </div>

            {/* Chart Type Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Chart Type
                </label>
                {filterType !== "all" && (
                  <span className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">
                    {formatChartTypeName(filterType)}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                <button
                  type="button"
                  onClick={() => setFilterType("all")}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    filterType === "all"
                      ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                      : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Folder className="h-3.5 w-3.5 text-slate-400" />
                    All Types
                  </span>
                  {filterType === "all" && <Check className="h-3.5 w-3.5 text-violet-600" />}
                </button>
                {chartTypes.map(type => {
                  const isSelected = filterType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFilterType(isSelected ? "all" : type)}
                      className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                        isSelected
                          ? "bg-violet-50 dark:bg-violet-950/50 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300"
                          : "bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${getChartTypeDotColor(type)}`} />
                        <span className="truncate">{formatChartTypeName(type)}</span>
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0 ml-1" />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions: Refresh & Apply */}
            <div className="pt-2 flex items-center gap-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="h-10 px-3 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-lg flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                type="button"
                onClick={() => setIsFilterSheetOpen(false)}
                className="flex-1 h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Apply & Close
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            My Uploaded Images
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage your images in Supabase Storage. View active chart/template mappings and delete images with cascading warning checks.
          </p>
        </div>
        <div className="bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 rounded-full px-3 py-1 text-xs font-bold self-start md:self-center shadow-none">
          {images.length} {images.length === 1 ? "image" : "images"} uploaded
        </div>
      </div>

      {images.length === 0 ? (
        <Card className="border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 shadow-sm rounded-2xl py-16 text-center">
          <CardContent className="max-w-md mx-auto space-y-6">
            <div className="relative mx-auto w-fit">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/30 dark:to-indigo-950/30 border border-violet-100 dark:border-violet-800/40 rounded-2xl mx-auto flex items-center justify-center mb-2">
                <ImageIcon className="h-10 w-10 text-violet-500 dark:text-violet-400" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-white dark:bg-slate-800 border border-violet-100 dark:border-violet-800/40 rounded-full flex items-center justify-center shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">No uploaded images</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                Images you upload inside custom layout formats, image zones, or chart decorations will appear here automatically.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {images.map((img) => (
            <Card key={img.id} className="border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-900/90 shadow-sm rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col group">
              {/* Image Thumbnail */}
              <div className="relative aspect-video bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-center overflow-hidden p-4 group-hover:bg-slate-100/60 dark:group-hover:bg-slate-800/70 transition-colors">
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
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate" title={img.filename}>
                      {img.filename}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      Uploaded {new Date(img.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>

                  {/* Mapping Badges */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Mapped to:</p>
                    
                    {(!img.mappings?.charts?.length && 
                      !img.mappings?.templates?.length && 
                      !img.mappings?.formats?.length) ? (
                      <Badge variant="outline" className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700 shadow-none font-semibold text-[10px] py-0.5 px-1.5">
                        Unused / No mappings
                      </Badge>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                        {img.mappings.charts?.map((c: any) => (
                          <Badge key={c.id} variant="outline" className="bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200/60 dark:border-blue-800/50 shadow-none font-semibold text-[10px] py-0.5 px-1.5 truncate max-w-[200px]" title={`Chart: ${c.title}`}>
                            Chart: {c.title}
                          </Badge>
                        ))}
                        {img.mappings.templates?.map((t: any) => (
                          <Badge key={t.id} variant="outline" className="bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/50 shadow-none font-semibold text-[10px] py-0.5 px-1.5 truncate max-w-[200px]" title={`Template: ${t.name}`}>
                            Tpl: {t.name}
                          </Badge>
                        ))}
                        {img.mappings.formats?.map((f: any) => (
                          <Badge key={f.id} variant="outline" className="bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50 shadow-none font-semibold text-[10px] py-0.5 px-1.5 truncate max-w-[200px]" title={`Format: ${f.name}`}>
                            Fmt: {f.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    onClick={() => handleCopyUrl(img.id, img.image_url)}
                    variant="outline"
                    className="flex-1 h-8 text-xs font-semibold px-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg gap-1 flex items-center justify-center shadow-none transition-all"
                  >
                    {copiedId === img.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
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
                    className="h-8 w-8 p-0 border-red-200 dark:border-red-900/50 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 rounded-lg flex items-center justify-center shadow-none transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-150">
          <Card className="w-full max-w-md border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-900 rounded-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <CardHeader className="bg-red-50/60 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/40 p-5">
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5 flex-shrink-0" />
                <CardTitle className="text-base font-bold text-red-950 dark:text-red-200">Delete Uploaded Image?</CardTitle>
              </div>
              <CardDescription className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                This action is permanent and will delete the image file from storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm text-slate-700 dark:text-slate-300">
              <p>Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100">{deletingImage.filename}</strong>?</p>
              
              {(deletingImage.mappings?.charts?.length > 0 || 
                deletingImage.mappings?.templates?.length > 0 || 
                deletingImage.mappings?.formats?.length > 0) ? (
                <div className="p-4 bg-red-50/80 dark:bg-red-950/20 border border-red-200/70 dark:border-red-900/40 rounded-xl space-y-2.5">
                  <p className="text-xs font-bold text-red-800 dark:text-red-300">
                    ⚠️ CRITICAL: Deleting this image will also delete all associated mappings:
                  </p>
                  <ul className="text-xs text-red-900 dark:text-red-200 space-y-1.5 list-disc pl-4 font-semibold leading-relaxed">
                    {deletingImage.mappings.charts?.map((c: any) => (
                      <li key={c.id}>Chart: <span className="text-red-950 dark:text-red-100">{c.title}</span></li>
                    ))}
                    {deletingImage.mappings.templates?.map((t: any) => (
                      <li key={t.id}>Template: <span className="text-red-950 dark:text-red-100">{t.name}</span></li>
                    ))}
                    {deletingImage.mappings.formats?.map((f: any) => (
                      <li key={f.id}>Format Blueprint: <span className="text-red-950 dark:text-red-100">{f.name}</span></li>
                    ))}
                  </ul>
                  <p className="text-[10px] text-red-700 dark:text-red-400 italic">
                    Note: If associated charts/templates are deleted, their corresponding database conversations and layout files will be permanently purged.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3 rounded-xl leading-relaxed">
                  This image is currently not used in any charts, templates, or format configurations. It is safe to delete.
                </p>
              )}
            </CardContent>
            <div className="bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700/80 p-4 flex items-center justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setDeletingImage(null)} 
                disabled={isDeleting}
                className="h-8 text-xs font-semibold px-4 border-slate-200 dark:border-slate-700 bg-white dark:bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg shadow-none transition-all"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="h-8 text-xs font-semibold px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 shadow-none transition-all"
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

