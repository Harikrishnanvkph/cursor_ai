"use client"

import React, { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type Conversation } from "@/lib/history-store"
import {
  BarChart2,
  TrendingUp,
  Clock,
  Layers,
  PieChart,
  LineChart,
  Activity
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

    // Average charts per week (over last 4 weeks)
    const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000
    const chartsLastMonth = allConversations.filter(conv => conv.timestamp > fourWeeksAgo).length
    const avgPerWeek = Math.round(chartsLastMonth / 4)

    return {
      totalCharts,
      visibleCharts,
      typeCount,
      mostUsedType,
      chartsThisWeek,
      avgPerWeek
    }
  }, [conversations, allConversations])

  const statCards = [
    {
      title: "Total Charts",
      value: stats.totalCharts,
      icon: BarChart2,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "This Week",
      value: stats.chartsThisWeek,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "Avg per Week",
      value: stats.avgPerWeek,
      icon: Activity,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "Most Used",
      value: stats.mostUsedType?.[0] || "None",
      subtitle: stats.mostUsedType ? `${stats.mostUsedType[1]} charts` : "",
      icon: PieChart,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600"
    }
  ]

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((stat, index) => (
          <Card key={index} className="border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-0.5">
                    {typeof stat.value === "string" ? (
                      <span className="text-base capitalize">{stat.value}</span>
                    ) : (
                      stat.value
                    )}
                  </p>
                  {stat.subtitle && (
                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                  )}
                </div>
                <div className={`p-2 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

