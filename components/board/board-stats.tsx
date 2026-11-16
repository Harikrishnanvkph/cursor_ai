"use client"

import React, { useState } from "react"
import { type Conversation } from "@/lib/history-store"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import { Cloud, Sparkles } from "lucide-react"

interface BoardStatsProps {
  conversations?: Conversation[]
  allConversations?: Conversation[]
  className?: string
}

/**
 * BoardStats renders the compact Plan, Cloud Storage Quota, & AI Credits bar
 * aligned to match the Search & Filter toolbar height on desktop and stack cleanly on smaller screens.
 */
export function BoardStats({ allConversations = [], className = "" }: BoardStatsProps) {
  const {
    user,
    isPro,
    isLite,
    cloudChartsLimit: cloudLimit,
    savedChartsCount,
    aiCreditsLimit,
    aiCreditsRemaining,
  } = useSubscriptionQuota()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

  const effectiveCloudLimit = cloudLimit || 5
  const effectiveAiLimit = aiCreditsLimit || 10
  const savedCount = user ? savedChartsCount : allConversations.length

  const storagePct = Math.min(100, Math.round((savedCount / effectiveCloudLimit) * 100))
  const creditsPct = Math.min(100, Math.round((aiCreditsRemaining / effectiveAiLimit) * 100))

  return (
    <div className={className}>
      {/* Plan & Quotas Overview */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl px-3 py-2 sm:py-0 sm:h-10 sm:px-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3.5 xl:gap-4">
        {/* 1) Plan Badge + Buy Credits */}
        <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider leading-tight ${
              isPro
                ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs"
                : isLite
                ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {isPro ? "Pro User" : isLite ? "Lite User" : "Free Plan"}
          </span>
          <button
            type="button"
            onClick={() => setIsUpgradeOpen(true)}
            className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 hover:underline cursor-pointer whitespace-nowrap"
          >
            + Buy Credits
          </button>
        </div>

        <div className="hidden sm:block w-px h-5 bg-slate-200/80 dark:bg-slate-800 shrink-0" />

        {/* 2) Quotas: Cloud Storage & AI Credits */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-1 sm:items-center gap-2.5 sm:gap-3.5 xl:gap-4">
          {/* Cloud Storage */}
          <div className="flex-1 min-w-0 sm:min-w-[135px] lg:w-[148px] xl:w-[172px] 2xl:w-[192px] lg:flex-none flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                <Cloud className="w-3 h-3 text-violet-500 shrink-0" />
                <span className="truncate">Cloud Storage</span>
              </span>
              <span className={`tabular-nums shrink-0 ${storagePct >= 100 ? "text-rose-600 dark:text-rose-400 font-bold" : ""}`}>
                {savedCount}/{effectiveCloudLimit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  storagePct >= 100
                    ? "bg-rose-500"
                    : storagePct >= 80
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-violet-500 to-indigo-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(storagePct, 2))}%` }}
              />
            </div>
          </div>

          {/* AI Credits */}
          <div className="flex-1 min-w-0 sm:min-w-[125px] lg:w-[136px] xl:w-[160px] 2xl:w-[180px] lg:flex-none flex flex-col justify-center gap-1">
            <div className="flex items-center justify-between gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300 leading-none">
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate">
                <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
                <span className="truncate">AI Credits</span>
              </span>
              <span className={`tabular-nums shrink-0 ${creditsPct <= 10 ? "text-rose-600 dark:text-rose-400 font-bold" : ""}`}>
                {aiCreditsRemaining}/{effectiveAiLimit}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  creditsPct <= 10
                    ? "bg-rose-500"
                    : creditsPct <= 30
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-amber-400 to-violet-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(creditsPct, 2))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <UpgradeProDialog
        open={isUpgradeOpen}
        onOpenChange={setIsUpgradeOpen}
        featureHighlight="cloud"
        title="Need More Cloud Save Credits?"
        description={`You have used ${savedCount} of your ${effectiveCloudLimit} cloud save credits. Choose a top-up pack to keep saving your charts.`}
      />
    </div>
  )
}
