"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type Conversation } from "@/lib/history-store"
import {
  BarChart2,
  TrendingUp,
  Clock,
  Layers,
  Activity,
  Zap,
  Target,
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  LayoutGrid,
  FileText
} from "lucide-react"

interface BoardStatsProps {
  conversations: Conversation[]
  allConversations: Conversation[]
}

export function BoardStats({ conversations, allConversations }: BoardStatsProps) {
  const stats = useMemo(() => {
    const totalCharts = allConversations.length
    const visibleCharts = conversations.length

    // Count by chart type
    const typeCount: Record<string, number> = {}
    allConversations.forEach(conv => {
      const type = conv.snapshot?.chartType || "unknown"
      typeCount[type] = (typeCount[type] || 0) + 1
    })

    // Most used type
    const mostUsedType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]

    // Charts created this week
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const chartsThisWeek = allConversations.filter(conv => conv.timestamp > weekAgo).length

    // Charts created last week for comparison
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
    const chartsLastWeek = allConversations.filter(conv =>
      conv.timestamp > twoWeeksAgo && conv.timestamp <= weekAgo
    ).length

    // Calculate trend
    const weeklyTrend = chartsLastWeek === 0
      ? (chartsThisWeek > 0 ? 100 : 0)
      : ((chartsThisWeek - chartsLastWeek) / chartsLastWeek) * 100

    // Average charts per week (over last 4 weeks)
    const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000
    const chartsLastMonth = allConversations.filter(conv => conv.timestamp > fourWeeksAgo).length
    const avgPerWeek = Math.round(chartsLastMonth / 4)

    // Charts created today
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const chartsToday = allConversations.filter(conv => conv.timestamp > todayStart.getTime()).length

    // Count by chart mode
    // Template mode: is_template_mode === true
    // Grouped mode: is_template_mode is falsy AND chart_mode === 'grouped'
    // Single mode: everything else (not template, not grouped)
    let templateCount = 0
    let groupedCount = 0
    let singleCount = 0

    allConversations.forEach(conv => {
      if (conv.is_template_mode) {
        templateCount++
      } else if (conv.chart_mode === 'grouped') {
        groupedCount++
      } else {
        singleCount++
      }
    })

    return {
      totalCharts,
      visibleCharts,
      typeCount,
      mostUsedType,
      chartsThisWeek,
      chartsLastWeek,
      weeklyTrend,
      avgPerWeek,
      chartsToday,
      templateCount,
      groupedCount,
      singleCount
    }
  }, [conversations, allConversations])

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowUp className="h-3 w-3 text-green-600" />
    if (trend < 0) return <ArrowDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-400" />
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return "text-green-600"
    if (trend < 0) return "text-red-600"
    return "text-gray-400"
  }

  const statCards = [
    {
      title: "Total Charts",
      value: stats.totalCharts,
      subtitle: stats.chartsToday > 0 ? `${stats.chartsToday} created today` : "Ready to create more",
      icon: BarChart2,
      textColor: "text-blue-600",
      iconBg: "bg-blue-50/50 text-blue-600 border-blue-100",
      trend: null
    },
    {
      title: "This Week",
      value: stats.chartsThisWeek,
      subtitle: `${Math.abs(stats.weeklyTrend).toFixed(0)}% vs last week`,
      icon: TrendingUp,
      textColor: "text-emerald-600",
      iconBg: "bg-emerald-50/50 text-emerald-600 border-emerald-100",
      trend: stats.weeklyTrend
    },
    {
      title: "Weekly Average",
      value: stats.avgPerWeek,
      subtitle: "Over last 4 weeks",
      icon: Activity,
      textColor: "text-purple-600",
      iconBg: "bg-purple-50/50 text-purple-600 border-purple-100",
      trend: null
    },
    {
      title: "Most Popular",
      value: stats.mostUsedType?.[0] || "None yet",
      subtitle: stats.mostUsedType ? `${stats.mostUsedType[1]} charts` : "Create your first",
      icon: Target,
      textColor: "text-orange-600",
      iconBg: "bg-orange-50/50 text-orange-600 border-orange-100",
      trend: null
    }
  ]

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="border border-zinc-200 bg-white hover:border-zinc-300 transition-all duration-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-zinc-900 tracking-tight">
                      {typeof stat.value === "string" ? (
                        <span className="text-lg capitalize">{stat.value}</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                    {stat.trend !== null && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(stat.trend)}
                        <span className={`text-xs font-semibold ${getTrendColor(stat.trend)}`}>
                          {Math.abs(stat.trend).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-[12px] text-zinc-500 mt-1 truncate">{stat.subtitle}</p>
                </div>

                <div className={`p-2.5 rounded-lg border ${stat.iconBg} flex-shrink-0 flex items-center justify-center`}>
                  <stat.icon className="h-4.5 w-4.5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Mode Breakdown */}
      {stats.totalCharts > 0 && (
        <Card className="border border-zinc-200 bg-white shadow-none">
          <CardHeader className="py-3 px-5 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-zinc-400" />
                Chart Mode Breakdown
              </CardTitle>
              <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-100 text-xs shadow-none">
                {stats.totalCharts} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 py-4">
            <div className="grid grid-cols-3 gap-3">
              {/* Single */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="p-2 bg-blue-500/10 border border-blue-200 rounded-lg flex-shrink-0">
                  <BarChart2 className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-xs font-medium text-zinc-700">Single</span>
                  <span className="text-lg font-bold text-blue-600">{stats.singleCount}</span>
                </div>
              </div>

              {/* Grouped */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="p-2 bg-purple-500/10 border border-purple-200 rounded-lg flex-shrink-0">
                  <LayoutGrid className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-xs font-medium text-zinc-700">Grouped</span>
                  <span className="text-lg font-bold text-purple-600">{stats.groupedCount}</span>
                </div>
              </div>

              {/* Template */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-zinc-150 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                <div className="p-2 bg-emerald-500/10 border border-emerald-200 rounded-lg flex-shrink-0">
                  <FileText className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-xs font-medium text-zinc-700">Template</span>
                  <span className="text-lg font-bold text-emerald-600">{stats.templateCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

