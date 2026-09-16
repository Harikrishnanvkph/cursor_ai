"use client"

import React, { useState } from "react"
import { type Conversation } from "@/lib/history-store"
import { useSubscriptionQuota } from "@/lib/hooks/use-subscription-quota"
import { UpgradeProDialog } from "@/components/dialogs/upgrade-pro-dialog"
import {
  BarChart2,
  Cloud,
  Sparkles,
} from "lucide-react"

interface BoardStatsProps {
  conversations?: Conversation[]
  allConversations?: Conversation[]
}

/**
 * TotalChartsBadge displays the total chart count widget in the subheader tab row.
 */
export function TotalChartsBadge({
  totalCount,
}: {
  totalCount: number
}) {
  return (
    <div 
      className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-lg sm:rounded-xl shadow-xs shrink-0"
      title={`Total Charts: ${totalCount}`}
    >
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-xs shrink-0">
        <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </div>
      <div className="flex items-center gap-1 sm:gap-1.5 text-xs">
        <span className="text-slate-600 dark:text-slate-300 font-semibold hidden md:inline">
          Total Charts
        </span>
        <span className="text-slate-600 dark:text-slate-300 font-semibold xs450:hidden hide-below-450 md:hidden">
          Total
        </span>
        <span className="px-1.5 sm:px-2 py-0.2 sm:py-0.5 text-[11px] sm:text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
          {totalCount}
        </span>
      </div>
    </div>
  )
}

/**
 * BoardStats renders the Cloud Storage Quota Banner & Upgrade Dialog.
 * Redundant stat cards and breakdown section have been removed to eliminate duplicate metrics.
 */
export function BoardStats({ allConversations = [] }: BoardStatsProps) {
  const { user, isPro, cloudChartsLimit: cloudLimit, savedChartsCount, aiCreditsLimit, aiCreditsRemaining } = useSubscriptionQuota()
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false)

  const effectiveCloudLimit = cloudLimit || 30
  const effectiveAiLimit = aiCreditsLimit || 50
  const savedCount = user ? savedChartsCount : allConversations.length

  const storagePct = Math.min(100, Math.round((savedCount / effectiveCloudLimit) * 100))
  const creditsPct = Math.min(100, Math.round((aiCreditsRemaining / effectiveAiLimit) * 100))

  return (
    <div>
      {/* ── Simplified Plan & Quotas Overview ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 sm:px-4 sm:py-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-6">
        
        {/* 1) The Plan User Is In */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
            isPro 
              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-xs' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
          }`}>
            {isPro ? 'Pro Plan' : 'Free Plan'}
          </span>
          {!isPro && (
            <button
              type="button"
              onClick={() => setIsUpgradeOpen(true)}
              className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 hover:underline cursor-pointer ml-1"
            >
              Upgrade
            </button>
          )}
        </div>

        {/* 2) Slider: Number of Cloud Charts (e.g. 48/50) */}
        <div className="flex-1 min-w-[160px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Cloud className="w-3.5 h-3.5 text-violet-500 shrink-0" />
              <span>Cloud Storage</span>
            </span>
            <span className={storagePct >= 100 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
              {savedCount}/{effectiveCloudLimit}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                storagePct >= 100 
                  ? 'bg-rose-500' 
                  : storagePct >= 80 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-violet-500 to-indigo-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(storagePct, 2))}%` }}
            />
          </div>
        </div>

        {/* 3) Slider: AI Credits Available */}
        <div className="flex-1 min-w-[160px] flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>AI Credits</span>
            </span>
            <span className={creditsPct <= 10 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
              {aiCreditsRemaining}/{effectiveAiLimit}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                creditsPct <= 10 
                  ? 'bg-rose-500' 
                  : creditsPct <= 30 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-amber-400 to-violet-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(creditsPct, 2))}%` }}
            />
          </div>
        </div>

      </div>

      <UpgradeProDialog 
        open={isUpgradeOpen} 
        onOpenChange={setIsUpgradeOpen} 
        featureHighlight="cloud" 
        title="Need More Cloud Storage?"
        description={`You have saved ${savedCount} of your ${effectiveCloudLimit} charts on the Free plan. Upgrade to Pro to save up to 30 charts and get 50 AI credits/month.`}
      />
    </div>
  )
}
