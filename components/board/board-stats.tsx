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
      gradient: "from-blue-500 via-blue-600 to-blue-700",
      bgGradient: "from-blue-50 to-blue-100/50",
      iconBg: "bg-blue-500",
      trend: null
    },
    {
      title: "This Week",
      value: stats.chartsThisWeek,
      subtitle: `${Math.abs(stats.weeklyTrend).toFixed(0)}% vs last week`,
      icon: TrendingUp,
      gradient: "from-emerald-500 via-emerald-600 to-emerald-700",
      bgGradient: "from-emerald-50 to-emerald-100/50",
      iconBg: "bg-emerald-500",
      trend: stats.weeklyTrend
    },
    {
      title: "Weekly Average",
      value: stats.avgPerWeek,
      subtitle: "Over last 4 weeks",
      icon: Activity,
      gradient: "from-purple-500 via-purple-600 to-purple-700",
      bgGradient: "from-purple-50 to-purple-100/50",
      iconBg: "bg-purple-500",
      trend: null
    },
    {
      title: "Most Popular",
      value: stats.mostUsedType?.[0] || "None yet",
      subtitle: stats.mostUsedType ? `${stats.mostUsedType[1]} charts` : "Create your first",
      icon: Target,
      gradient: "from-orange-500 via-orange-600 to-orange-700",
      bgGradient: "from-orange-50 to-orange-100/50",
      iconBg: "bg-orange-500",
      trend: null
    }
  ]

  return (
    <div className="space-y-4">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`} />

            <CardContent className="relative p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold text-gray-900">
                      {typeof stat.value === "string" ? (
                        <span className="text-base capitalize">{stat.value}</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                    {stat.trend !== null && (
                      <div className="flex items-center gap-1">
                        {getTrendIcon(stat.trend)}
                        <span className={`text-xs font-medium ${getTrendColor(stat.trend)}`}>
                          {Math.abs(stat.trend).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.subtitle}</p>
                </div>

                <div className={`p-2 ${stat.iconBg} rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Mode Breakdown */}
      {stats.totalCharts > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="py-3 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-600" />
                Chart Mode Breakdown
              </CardTitle>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                {stats.totalCharts} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4 pt-0">
            <div className="grid grid-cols-3 gap-3">
              {/* Single */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50/60 hover:bg-blue-100/60 transition-colors">
                <div className="p-2 bg-blue-500 rounded-lg shadow flex-shrink-0">
                  <BarChart2 className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-700">Single</span>
                  <span className="text-lg font-bold text-blue-700">{stats.singleCount}</span>
                </div>
              </div>

              {/* Grouped */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50/60 hover:bg-purple-100/60 transition-colors">
                <div className="p-2 bg-purple-500 rounded-lg shadow flex-shrink-0">
                  <LayoutGrid className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-700">Grouped</span>
                  <span className="text-lg font-bold text-purple-700">{stats.groupedCount}</span>
                </div>
              </div>

              {/* Template */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/60 hover:bg-emerald-100/60 transition-colors">
                <div className="p-2 bg-emerald-500 rounded-lg shadow flex-shrink-0">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center justify-between flex-1 min-w-0">
                  <span className="text-xs font-medium text-gray-700">Template</span>
                  <span className="text-lg font-bold text-emerald-700">{stats.templateCount}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

