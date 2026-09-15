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
    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 rounded-xl shadow-xs shrink-0">
      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-xs shrink-0">
        <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
      </div>
      <div className="flex items-center gap-1.5 text-xs">
        <span className="text-slate-600 dark:text-slate-300 font-semibold hidden sm:inline">
          Total Charts
        </span>
        <span className="text-slate-600 dark:text-slate-300 font-semibold sm:hidden">
          Total
        </span>
        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60">
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

  const savedCount = user ? savedChartsCount : allConversations.length
  const storagePct = Math.min(100, Math.round((savedCount / cloudLimit) * 100))

  return (
    <div>
      {/* ── Subscription & Cloud Storage Quota Banner ── */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-white to-purple-50/70 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-slate-800 p-3.5 sm:p-4 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Cloud className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Cloud Storage Quota
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isPro 
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-xs' 
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}>
                {isPro ? 'PRO PLAN' : 'FREE PLAN'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              {savedCount} of {cloudLimit} charts saved in cloud &bull; {aiCreditsRemaining}/{aiCreditsLimit} AI credits left
            </p>
          </div>
        </div>

        <div className="w-full sm:w-64 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>Storage Used</span>
            <span className={storagePct >= 90 ? 'text-rose-600 font-bold' : ''}>{savedCount} / {cloudLimit} ({storagePct}%)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                storagePct >= 100 
                  ? 'bg-rose-500' 
                  : storagePct >= 80 
                  ? 'bg-amber-500' 
                  : 'bg-gradient-to-r from-indigo-500 to-purple-500'
              }`}
              style={{ width: `${Math.max(storagePct, 2)}%` }}
            />
          </div>
        </div>

        {!isPro && (
          <button
            type="button"
            onClick={() => setIsUpgradeOpen(true)}
            className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-semibold shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Upgrade to Pro ($5/mo &bull; 30 saves)</span>
          </button>
        )}
      </div>

      <UpgradeProDialog 
        open={isUpgradeOpen} 
        onOpenChange={setIsUpgradeOpen} 
        featureHighlight="cloud" 
        title="Need More Cloud Storage?"
        description={`You have saved ${savedCount} of your ${cloudLimit} charts on the Free plan. Upgrade to Pro to save up to 30 charts and get 50 AI credits/month.`}
      />
    </div>
  )
}
