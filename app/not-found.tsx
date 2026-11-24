"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GeistSans } from "geist/font/sans"
import { Home, ArrowLeft, Sparkles, Sliders, LayoutDashboard, ArrowUpRight } from "lucide-react"
import { useAuth } from "@/components/auth/AuthProvider"
import { SimpleProfileDropdown } from "@/components/ui/simple-profile-dropdown"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const QUICK_DESTINATIONS = [
  {
    href: "/aichat",
    title: "AI Chat",
    description: "Generate charts with AI prompts",
    icon: Sparkles,
  },
  {
    href: "/editor",
    title: "Advanced Editor",
    description: "Customize data, axes & layouts",
    icon: Sliders,
  },
  {
    href: "/board",
    title: "Dashboard",
    description: "Manage your saved charts",
    icon: LayoutDashboard,
  },
] as const

export default function NotFound() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/")
    }
  }

  return (
    <div
      className={`${GeistSans.variable} ${GeistSans.className} font-sans min-h-screen flex flex-col bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-x-clip`}
    >
      {/* Subtle ambient background grid & radial indigo glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(120,120,128,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(120,120,128,0.05) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-indigo-500/[0.04] to-transparent" />
      </div>

      {/* Floating Brand Logo (Top Left) */}
      <Link
        href="/"
        className="fixed top-5 left-5 sm:top-6 sm:left-8 z-50 flex items-center group transition-transform duration-200 active:scale-95"
      >
        <img
          src="/images/new%20logo%20Text.png"
          alt="AIChartor"
          className="h-4 sm:h-[18px] w-auto object-contain transition-transform duration-300 group-hover:scale-105 dark:invert"
        />
      </Link>

      {/* Floating Profile Avatar (Top Right) */}
      <div className="fixed top-4 right-5 sm:top-5 sm:right-8 z-50 flex items-center">
        {mounted && user ? (
          <SimpleProfileDropdown />
        ) : mounted && loading && !user ? (
          <div
            aria-hidden="true"
            className="h-8 w-8 rounded-full bg-neutral-200/70 dark:bg-slate-800/70 animate-pulse"
          />
        ) : null}
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
        <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
          {/* Status Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            <span>404 · Page not found</span>
          </div>

          {/* Mini Chart 404 Illustration Card */}
          <div className="w-48 h-28 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-3.5 flex flex-col justify-between mx-auto mb-5 select-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
              <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500">
                404_not_found
              </span>
            </div>

            <div className="flex items-end gap-2 h-14 px-1">
              <div className="h-6 flex-1 rounded-md bg-gradient-to-t from-blue-600 to-indigo-500 opacity-75" />
              <div className="h-11 flex-1 rounded-md bg-gradient-to-t from-blue-600 to-indigo-500 opacity-90" />
              <div className="h-8 flex-1 rounded-md bg-gradient-to-t from-indigo-600 to-violet-500 opacity-85" />
              <div className="h-12 flex-1 rounded-md border-2 border-dashed border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/30 flex items-center justify-center text-xs font-bold text-indigo-500 dark:text-indigo-400">
                ?
              </div>
            </div>
          </div>

          {/* Headline & Description */}
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
            This page isn&apos;t on the chart
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2.5 leading-relaxed">
            The URL you entered doesn&apos;t match any page on AIChartor—it may have been moved, renamed, or mistyped.
          </p>

          {/* Primary & Secondary Actions */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
            <Link
              href="/"
              className="h-10 px-5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-semibold shadow-sm inline-flex items-center gap-2 transition-all"
            >
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>

            <button
              type="button"
              onClick={handleGoBack}
              className="h-10 px-5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
          </div>

          {/* Quick Destination Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl mt-8 pt-6 border-t border-slate-200/70 dark:border-slate-800/80 text-left">
            {QUICK_DESTINATIONS.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm p-3.5 flex flex-col justify-between transition-all duration-150"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {item.title}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>

      {/* Footer matching AuthPageShell */}
      <footer className="relative z-10 border-t border-neutral-200/80 dark:border-slate-800/70 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} AIChartor. All rights reserved.</span>
            <Link href="/privacy" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Terms
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Theme</span>
            <ThemeToggle className="h-8 w-8 rounded-lg border border-neutral-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 shadow-sm transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  )
}
