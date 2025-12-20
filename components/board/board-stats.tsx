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
  PieChart,
  LineChart,
  Activity,
  Zap,
  Target,
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus
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

    return {
      totalCharts,
      visibleCharts,
      typeCount,
      mostUsedType,
      chartsThisWeek,
      chartsLastWeek,
      weeklyTrend,
      avgPerWeek,
      chartsToday
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
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="relative overflow-hidden border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`} />
            
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-gray-900">
                      {typeof stat.value === "string" ? (
                        <span className="text-lg capitalize">{stat.value}</span>
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
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                
                <div className={`p-3 ${stat.iconBg} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Progress bar for visual appeal */}
              <div className="w-full bg-gray-200/50 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full transition-all duration-1000 ease-out`}
                  style={{ 
                    width: typeof stat.value === "number" 
                      ? `${Math.min((stat.value / Math.max(...statCards.map(s => typeof s.value === "number" ? s.value : 0))) * 100, 100)}%`
                      : "100%"
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Type Distribution */}
      {Object.keys(stats.typeCount).length > 0 && (
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Chart Type Distribution
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">Your most used chart types</p>
              </div>
              <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                {Object.keys(stats.typeCount).length} types
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(stats.typeCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([type, count], index) => {
                  const percentage = (count / stats.totalCharts) * 100
                  const colors = [
                    { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-100" },
                    { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-100" },
                    { bg: "bg-purple-500", text: "text-purple-700", light: "bg-purple-100" },
                    { bg: "bg-orange-500", text: "text-orange-700", light: "bg-orange-100" },
                    { bg: "bg-pink-500", text: "text-pink-700", light: "bg-pink-100" },
                    { bg: "bg-indigo-500", text: "text-indigo-700", light: "bg-indigo-100" }
                  ]
                  const color = colors[index % colors.length]
                  
                  return (
                    <div key={type} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
                      <div className={`w-3 h-3 ${color.bg} rounded-full flex-shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 capitalize truncate">
                            {type}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {count} ({percentage.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-full ${color.bg} rounded-full transition-all duration-500 ease-out`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

