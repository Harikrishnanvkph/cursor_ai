"use client"

import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { LayoutDashboard, Edit3 } from "lucide-react"
import { useState, useEffect } from "react"

/**
 * Client island for the hero section's secondary CTA button.
 * Shows "View Dashboard" for authenticated users, "Try Advanced Editor" for guests.
 * Renders the public/default button on SSR to match server output and prevent layout shift.
 */
export function HeroAuthCta() {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isAuthenticated = mounted && !!user

  if (isAuthenticated) {
    return (
      <Button asChild size="lg" variant="outline" className="px-8 py-6 text-base font-semibold bg-white border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 rounded-xl">
        <Link href="/board">
          <LayoutDashboard className="w-5 h-5 mr-2" />
          View Dashboard
        </Link>
      </Button>
    )
  }

  return (
    <Button asChild size="lg" variant="outline" className="px-8 py-6 text-base font-semibold bg-white border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300 rounded-xl">
      <Link href="/editor">
        <Edit3 className="w-5 h-5 mr-2" />
        Try Advanced Editor
      </Link>
    </Button>
  )
}
