"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { useGeoLocation } from "@/hooks/useGeoLocation"
import { initiateCheckout } from "@/lib/payment-client"
import {
  AI_CREDIT_PACKS,
  CLOUD_CREDIT_PACKS,
  type CreditPackId,
} from "@/lib/subscription-config"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Zap, Cloud, Check, Loader2, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

function renderFeatureText(text: string, highlightWord?: string, isProPack?: boolean) {
  if (!highlightWord || !text.includes(highlightWord)) {
    return text
  }
  const parts = text.split(highlightWord)
  return (
    <>
      {parts[0]}
      <span
        className={`px-1 py-0.2 rounded font-bold text-[10.5px] inline-block ${
          isProPack
            ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
            : "bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300/60 dark:border-amber-700/60"
        }`}
      >
        {highlightWord}
      </span>
      {parts.slice(1).join(highlightWord)}
    </>
  )
}

interface UpgradeProDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title?: string
  description?: string
  featureHighlight?: "ai" | "cloud" | "all"
}

export function UpgradeProDialog({
  open,
  onOpenChange,
  featureHighlight = "all",
}: UpgradeProDialogProps) {
  const { user } = useAuth()
  const { region, isIndia, currencySymbol } = useGeoLocation()
  const [creditTab, setCreditTab] = useState<"ai" | "cloud">(
    featureHighlight === "cloud" ? "cloud" : "ai"
  )
  const [purchasingPackId, setPurchasingPackId] = useState<CreditPackId | null>(null)

  useEffect(() => {
    if (open) {
      setCreditTab(featureHighlight === "cloud" ? "cloud" : "ai")
    }
  }, [open, featureHighlight])

  const firstAiBonusClaimed = Boolean(user?.first_ai_bonus_claimed)
  const activePacks = creditTab === "ai" ? AI_CREDIT_PACKS : CLOUD_CREDIT_PACKS

  const handleBuyPack = async (packId: CreditPackId) => {
    if (!user) {
      window.location.href = "/signin"
      return
    }

    setPurchasingPackId(packId)
    try {
      await initiateCheckout({
        packId,
        planTier: packId.includes("pro") ? "pro" : "lite",
        billingCycle: "one_time",
        regionOverride: region,
        user,
        onBeforeOpen: () => {
          setPurchasingPackId(null)
          onOpenChange(false)
        },
        onSuccess: () => {
          setPurchasingPackId(null)
          onOpenChange(false)
        },
        onError: (err) => {
          console.error("Credit pack purchase error:", err)
          setPurchasingPackId(null)
          alert(err.message || "Failed to initiate payment")
        },
      })
    } catch (err: any) {
      console.error(err)
      setPurchasingPackId(null)
      alert(err.message || "Failed to initiate checkout")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[660px] p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl bg-white dark:bg-slate-900 flex flex-col [&>button]:top-4.5 [&>button]:right-4.5 [&>button]:text-slate-400 [&>button]:hover:text-slate-700 dark:[&>button]:hover:text-white">
        {/* Simple & Clean Header */}
        <div className="px-6 pt-5 pb-3.5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 pr-8">
            <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              Top Up Credits
            </DialogTitle>

            {/* Tab Switcher: AI Credits | Cloud Credits */}
            <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-neutral-900 border border-slate-200/80 dark:border-neutral-800 select-none">
              <button
                type="button"
                onClick={() => setCreditTab("ai")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                  creditTab === "ai"
                    ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>AI Credits</span>
              </button>
              <button
                type="button"
                onClick={() => setCreditTab("cloud")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer ${
                  creditTab === "cloud"
                    ? "bg-white dark:bg-neutral-800 text-slate-900 dark:text-white shadow-xs"
                    : "text-slate-500 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Cloud className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
                <span>Cloud Credits</span>
              </button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Choose an AI or cloud save credits top-up pack.
          </DialogDescription>
        </div>

        {/* 2-Column Pack Cards (Lite $2 | Pro $5) */}
        <div className="p-5 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {activePacks.map((pack) => {
              const isProPack = pack.popular
              const isBuyingThis = purchasingPackId === pack.id

              return (
                <div
                  key={pack.id}
                  className={`rounded-2xl p-5 flex flex-col justify-between border transition-all ${
                    isProPack
                      ? "bg-slate-900 text-white border-indigo-500 shadow-lg ring-1 ring-indigo-500/20"
                      : "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-slate-200 dark:border-slate-800 shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-base font-bold tracking-tight">{pack.userTitle}</span>
                      <span
                        className={`text-[10.5px] font-bold px-2.5 py-0.5 rounded-full ${
                          isProPack
                            ? "bg-indigo-500/25 text-indigo-200 border border-indigo-400/30"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {pack.badge}
                      </span>
                    </div>

                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-extrabold tracking-tight">
                        {currencySymbol}
                        {isIndia ? (pack.priceInr || (pack.priceUsd === 2 ? 99 : 249)) : pack.priceUsd}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">one-time</span>
                    </div>

                    <div className="mt-1 mb-4">
                      <span
                        className={`text-sm font-bold ${
                          isProPack ? "text-indigo-300" : "text-indigo-600 dark:text-indigo-400"
                        }`}
                      >
                        {pack.headlineGrant}
                      </span>
                    </div>

                    <ul className="space-y-2 pt-3 border-t border-slate-200/70 dark:border-slate-800">
                      {pack.features.map((feat, idx) => {
                        const alreadyClaimedBonus = feat.firstPurchaseOnly && firstAiBonusClaimed
                        return (
                          <li key={idx} className="flex items-start gap-2 text-xs leading-normal">
                            <Check
                              className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                                isProPack ? "text-indigo-400" : "text-indigo-600 dark:text-indigo-400"
                              }`}
                            />
                            <div className="flex flex-col">
                              <span className={isProPack ? "text-slate-200" : "text-slate-700 dark:text-slate-300 font-medium"}>
                                {renderFeatureText(feat.text, feat.highlightWord, isProPack)}
                              </span>
                              {alreadyClaimedBonus && (
                                <span className="text-[10px] text-emerald-400 font-semibold mt-0.5">
                                  ✓ Already claimed on first payment
                                </span>
                              )}
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <Button
                    type="button"
                    onClick={() => handleBuyPack(pack.id)}
                    disabled={purchasingPackId !== null}
                    className={`mt-5 w-full h-10 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      isProPack
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
                        : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 shadow-xs"
                    }`}
                  >
                    {isBuyingThis ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <span>{pack.ctaLabel}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Clean Footer with Link to Pricing Details */}
        <div className="px-6 py-3.5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={purchasingPackId !== null}
            className="font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Maybe later
          </button>
          <Link
            href="/pricing"
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            <span>More details - Pricing Page</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
