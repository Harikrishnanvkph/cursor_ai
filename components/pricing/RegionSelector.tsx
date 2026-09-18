"use client"

import React from "react"
import { PaymentRegion } from "@/hooks/useGeoLocation"
import { Globe, ShieldCheck, Sparkles } from "lucide-react"

interface RegionSelectorProps {
  region: PaymentRegion
  onSelectRegion: (region: PaymentRegion) => void
  variant?: "full" | "compact"
  className?: string
}

export function RegionSelector({
  region,
  onSelectRegion,
  variant = "full",
  className = "",
}: RegionSelectorProps) {
  const isIndia = region === "IN"

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-1 border border-slate-200/80 dark:border-slate-700/80 shadow-sm ${className}`}>
        <button
          type="button"
          onClick={() => onSelectRegion("IN")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            isIndia
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>🇮🇳</span>
          <span>India (₹ INR)</span>
        </button>
        <button
          type="button"
          onClick={() => onSelectRegion("GLOBAL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            !isIndia
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <span>🌐</span>
          <span>Global ($ USD)</span>
        </button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-2.5 ${className}`}>
      {/* Segmented Control */}
      <div className="relative inline-flex p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-inner">
        <button
          type="button"
          onClick={() => onSelectRegion("IN")}
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            isIndia
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5 ring-1 ring-black/5 dark:ring-white/10"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <span className="text-base">🇮🇳</span>
          <span>India</span>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">₹ INR</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectRegion("GLOBAL")}
          className={`relative z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            !isIndia
              ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5 ring-1 ring-black/5 dark:ring-white/10"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <span className="text-base">🌐</span>
          <span>International</span>
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">$ USD</span>
        </button>
      </div>

      {/* Gateway Trust Pill */}
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 px-3 py-1 rounded-full border border-slate-200/60 dark:border-slate-800/60">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        {isIndia ? (
          <span>
            Secured by <strong className="text-slate-700 dark:text-slate-200">Razorpay</strong> (UPI, RuPay, Indian Cards & NetBanking)
          </span>
        ) : (
          <span>
            Secured by <strong className="text-slate-700 dark:text-slate-200">Dodo Payments</strong> (International Cards, Apple Pay & Google Pay)
          </span>
        )}
      </div>
    </div>
  )
}
