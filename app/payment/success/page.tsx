"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/components/auth/AuthProvider"
import { CheckCircle2, Sparkles, ArrowRight, Zap, Cloud, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentSuccessPage() {
  const { user, refresh } = useAuth()
  const searchParams = useSearchParams()

  const gateway = searchParams.get("gateway") || "Payment"
  const plan = searchParams.get("plan") || "Pro"
  const billingCycle = searchParams.get("cycle") || "monthly"

  // Automatically refresh user auth state so the Pro tier reflects immediately
  useEffect(() => {
    refresh()
    const timer = setTimeout(() => {
      refresh()
    }, 2000)
    return () => clearTimeout(timer)
  }, [refresh])

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Background decorative glowing accents */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-50 dark:ring-emerald-950/30 animate-in zoom-in-75 duration-300">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-3 border border-indigo-200/50 dark:border-indigo-800/40">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Payment Successful</span>
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
          Welcome to {plan.toUpperCase()}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Your payment via <strong className="capitalize">{gateway}</strong> was confirmed. Your account limits have been unlocked immediately.
        </p>

        {/* Unlocked Features Pill Box */}
        <div className="grid grid-cols-2 gap-3 text-left mb-8">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5">
            <Zap className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">50 AI Credits</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Refreshed for this cycle</div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2.5">
            <Cloud className="w-5 h-5 text-purple-500 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white">30 Cloud Saves</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Cloud board capacity</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/editor" className="flex-1">
            <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-6 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all">
              <span>Open Advanced Editor</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
          <Link href="/board" className="flex-1">
            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 py-6 rounded-xl font-medium">
              View Board
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
