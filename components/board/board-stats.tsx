"use client"

import React, { useMemo } from "react"
import { type Conversation } from "@/lib/history-store"
import {
  BarChart2,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus,
  LayoutGrid,
  FileText,
  Layers,
  Target,
  Activity,
} from "lucide-react"

interface BoardStatsProps {
  conversations: Conversation[]
  allConversations: Conversation[]
}

// ─── Tiny helpers ────────────────────────────────────────────────────────────

function TrendBadge({ value }: { value: number }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-medium text-slate-400 dark:text-slate-500">
        <Minus className="w-3 h-3" />
        No change
      </span>
    )
  }
  const positive = value > 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-rose-500 dark:text-rose-400"
      }`}
    >
      {positive ? (
        <ArrowUp className="w-3 h-3" />
      ) : (
        <ArrowDown className="w-3 h-3" />
      )}
      {Math.abs(Math.round(value))}% vs last week
    </span>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  iconGradient: string
  value: string | number
  label: string
  sublabel?: string
  valueColor: string
  trend?: React.ReactNode
}

function StatCard({
  icon,
  iconGradient,
  value,
  label,
  sublabel,
  valueColor,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 p-5 flex flex-col gap-3">
      {/* Icon + trend row */}
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${iconGradient} flex items-center justify-center shadow-sm`}
        >
          <span className="text-white [&>svg]:w-5 [&>svg]:h-5">{icon}</span>
        </div>
        {trend && <div className="pt-0.5">{trend}</div>}
      </div>

      {/* Value */}
      <div>
        <p className={`text-3xl font-bold tracking-tight leading-none ${valueColor}`}>
          {value}
        </p>
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </p>
        {sublabel && (
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {sublabel}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Mini progress bar ────────────────────────────────────────────────────────

function MiniBar({
  pct,
  colorClass,
}: {
  pct: number
  colorClass: string
}) {
  return (
    <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-slate-800 overflow-hidden">
      <div
        className={`h-full rounded-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.max(pct, 2)}%` }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function BoardStats({ conversations, allConversations }: BoardStatsProps) {
  const stats = useMemo(() => {
    const totalCharts = allConversations.length
    const visibleCharts = conversations.length

    const typeCount: Record<string, number> = {}
    allConversations.forEach(conv => {
      const type = conv.snapshot?.chartType || "unknown"
      typeCount[type] = (typeCount[type] || 0) + 1
    })

    const mostUsedType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    const chartsThisWeek = allConversations.filter(conv => conv.timestamp > weekAgo).length

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000
    const chartsLastWeek = allConversations.filter(conv =>
      conv.timestamp > twoWeeksAgo && conv.timestamp <= weekAgo
    ).length

    const weeklyTrend = chartsLastWeek === 0
      ? (chartsThisWeek > 0 ? 100 : 0)
      : ((chartsThisWeek - chartsLastWeek) / chartsLastWeek) * 100

    const fourWeeksAgo = Date.now() - 28 * 24 * 60 * 60 * 1000
    const chartsLastMonth = allConversations.filter(conv => conv.timestamp > fourWeeksAgo).length
    const avgPerWeek = Math.round(chartsLastMonth / 4)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const chartsToday = allConversations.filter(conv => conv.timestamp > todayStart.getTime()).length

    let templateCount = 0
    let groupedCount = 0
    let singleCount = 0

    allConversations.forEach(conv => {
      if (conv.is_template_mode) {
        templateCount++
      } else if (conv.chart_mode === "grouped") {
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
      singleCount,
    }
  }, [conversations, allConversations])

  const total = stats.totalCharts || 1 // avoid /0
  const singlePct  = Math.round((stats.singleCount   / total) * 100)
  const groupedPct = Math.round((stats.groupedCount  / total) * 100)
  const templatePct = Math.round((stats.templateCount / total) * 100)

  const mostPopularLabel =
    stats.mostUsedType
      ? `${stats.mostUsedType[0].charAt(0).toUpperCase()}${stats.mostUsedType[0].slice(1)} (${stats.mostUsedType[1]})`
      : "—"

  return (
    <div className="space-y-4">
      {/* ── Stat cards grid ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Charts */}
        <StatCard
          icon={<BarChart2 />}
          iconGradient="from-blue-500 to-cyan-500"
          value={stats.totalCharts}
          label="Total Charts"
          sublabel={`${stats.visibleCharts} visible`}
          valueColor="text-blue-600 dark:text-blue-400"
        />

        {/* This Week */}
        <StatCard
          icon={<Calendar />}
          iconGradient="from-emerald-500 to-teal-500"
          value={stats.chartsThisWeek}
          label="This Week"
          sublabel={`${stats.chartsToday} today`}
          valueColor="text-emerald-600 dark:text-emerald-400"
          trend={<TrendBadge value={stats.weeklyTrend} />}
        />

        {/* Weekly Average */}
        <StatCard
          icon={<Activity />}
          iconGradient="from-violet-500 to-purple-500"
          value={stats.avgPerWeek}
          label="Weekly Avg"
          sublabel="past 4 weeks"
          valueColor="text-violet-600 dark:text-violet-400"
        />

        {/* Most Popular */}
        <StatCard
          icon={<Target />}
          iconGradient="from-orange-500 to-amber-500"
          value={mostPopularLabel}
          label="Most Popular"
          sublabel="chart type"
          valueColor="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* ── Chart mode breakdown ── */}
      <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-900/50 rounded-2xl border border-zinc-200 dark:border-slate-800 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-sm">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Chart Mode Breakdown
          </p>
          <span className="ml-auto text-xs text-slate-400 dark:text-slate-500 font-medium">
            {stats.totalCharts} total
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {/* Single */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-900/30">
                <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Single
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">
              {stats.singleCount}
            </p>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{singlePct}%</span>
            </div>
            <MiniBar pct={singlePct} colorClass="bg-blue-500" />
          </div>

          {/* Grouped */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-violet-50 dark:bg-violet-900/30">
                <LayoutGrid className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Grouped
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">
              {stats.groupedCount}
            </p>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{groupedPct}%</span>
            </div>
            <MiniBar pct={groupedPct} colorClass="bg-violet-500" />
          </div>

          {/* Template */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-900/30">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              </span>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Template
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-none">
              {stats.templateCount}
            </p>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] text-slate-400 dark:text-slate-500">{templatePct}%</span>
            </div>
            <MiniBar pct={templatePct} colorClass="bg-amber-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
