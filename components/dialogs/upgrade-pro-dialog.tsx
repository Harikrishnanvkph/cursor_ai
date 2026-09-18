"use client"

import React, { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { useGeoLocation } from "@/hooks/useGeoLocation"
import { RegionSelector } from "@/components/pricing/RegionSelector"
import { initiateCheckout } from "@/lib/payment-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sparkles, Zap, Cloud, Edit3, ShieldCheck, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UpgradeProDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  featureHighlight?: 'ai' | 'cloud' | 'all'
}

export function UpgradeProDialog({
  open,
  onOpenChange,
  title = "Upgrade to Pro",
  description = "Unlock higher AI generation limits, expanded cloud storage, and premium export capabilities.",
  featureHighlight = 'all'
}: UpgradeProDialogProps) {
  const { user } = useAuth()
  const { region, isIndia, setRegion } = useGeoLocation()
  const [isUpgrading, setIsUpgrading] = useState(false)

  const handleUpgrade = async () => {
    if (!user) {
      window.location.href = "/signin"
      return
    }
    setIsUpgrading(true)
    try {
      await initiateCheckout({
        planTier: 'pro',
        billingCycle: 'monthly',
        regionOverride: region,
        user,
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (err) => {
          console.error("Upgrade error:", err)
          setIsUpgrading(false)
        }
      })
    } catch (err) {
      console.error(err)
      setIsUpgrading(false)
    }
  }

  const isAlreadyPro = user?.subscription_tier === 'pro'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-indigo-100 dark:border-slate-800 shadow-2xl">
        {/* Modal Top Banner */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 px-6 pt-7 pb-6 text-white overflow-hidden">
          <div className="absolute -top-12 -right-12 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-indigo-100 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Simple, Transparent Pricing</span>
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              {title}
            </DialogTitle>
            <DialogDescription className="text-indigo-100/90 text-sm mt-1.5 leading-relaxed">
              {description}
            </DialogDescription>

            {/* Price Tag */}
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight">
                {isIndia ? "₹399" : "$5"}
              </span>
              <span className="text-sm font-medium text-indigo-200">/ month</span>
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 font-semibold border border-emerald-400/30">
                Cancel anytime
              </span>
            </div>

            {/* Region Switcher inside dialog */}
            <div className="mt-3 flex items-center justify-between bg-black/20 backdrop-blur-md rounded-xl p-1 px-2 border border-white/10">
              <span className="text-[11px] text-indigo-200 font-medium">Region:</span>
              <RegionSelector
                variant="compact"
                region={region}
                onSelectRegion={setRegion}
              />
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="p-6 space-y-4 bg-white dark:bg-slate-900">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            What's included in Pro:
          </div>

          <div className="space-y-3">
            {/* AI Credits */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              featureHighlight === 'ai' 
                ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/60 ring-2 ring-indigo-500/20' 
                : 'bg-slate-50/70 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-800'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    50 AI Credits / month
                  </p>
                  <span className="text-xs font-bold text-indigo-650 dark:text-indigo-400">
                    5x more
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Generate and iterate on complex charts with DeepSeek and Gemini Realtime.
                </p>
              </div>
            </div>

            {/* Cloud Saves */}
            <div className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
              featureHighlight === 'cloud' 
                ? 'bg-indigo-50/70 border-indigo-200 dark:bg-indigo-950/30 dark:border-indigo-800/60 ring-2 ring-indigo-500/20' 
                : 'bg-slate-50/70 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-800'
            }`}>
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Cloud className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Maximum 30 Cloud Saves
                  </p>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    3x more
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Save and manage up to 30 custom charts and dashboards in your cloud board.
                </p>
              </div>
            </div>

            {/* Advanced Editor */}
            <div className="flex items-start gap-3 p-3 rounded-xl border bg-slate-50/70 border-slate-200/60 dark:bg-slate-800/40 dark:border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Edit3 className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Complete Access to Advanced Editor
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Full control over themes, animations, palettes, dimensions, and typography.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isUpgrading}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Maybe later
          </button>

          {isAlreadyPro ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>You are already on Pro</span>
            </div>
          ) : (
            <Button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-md shadow-indigo-500/25 px-5 h-10 rounded-xl flex items-center gap-2 transition-all active:scale-95"
            >
              {isUpgrading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Activating Pro...</span>
                </>
              ) : (
                <>
                  <span>Upgrade to Pro ({isIndia ? "₹399" : "$5"}/mo)</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
