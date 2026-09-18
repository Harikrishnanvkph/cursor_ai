"use client"

import React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function PaymentCancelPage() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason") || "Payment was cancelled or could not be completed."

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-8 text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
          Checkout Incomplete
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
          {reason}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/pricing" className="flex-1">
            <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 rounded-xl flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" />
              <span>Retry Checkout</span>
            </Button>
          </Link>
          <Link href="/editor" className="flex-1">
            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-800 py-5 rounded-xl font-medium flex items-center justify-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Return to App</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
