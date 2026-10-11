"use client"

import React, { useState, useEffect } from "react"
import { Sparkles, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/lib/chat-store"
import { toast } from "sonner"

// --- Pure Helper Functions ---

export function parseDim(val: any): number | null {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    const parsed = parseInt(val)
    if (!isNaN(parsed)) return parsed
  }
  return null
}

export function getAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b)
  }
  const divisor = gcd(width, height)
  const rX = width / divisor
  const rY = height / divisor

  const ratio = width / height
  if (Math.abs(ratio - 1) < 0.02) return '1:1'
  if (Math.abs(ratio - 16 / 9) < 0.02) return '16:9'
  if (Math.abs(ratio - 4 / 3) < 0.02) return '4:3'
  if (Math.abs(ratio - 3 / 2) < 0.02) return '3:2'
  if (Math.abs(ratio - 4 / 5) < 0.02) return '4:5'
  if (Math.abs(ratio - 9 / 16) < 0.02) return '9:16'

  return `${rX}:${rY}`
}

export function getChartTypeName(type: string): string {
  switch (type) {
    case 'bar': return 'Bar'
    case 'horizontalBar': return 'H. Bar'
    case 'stackedBar': return 'Stacked Bar'
    case 'line': return 'Line'
    case 'area': return 'Area'
    case 'pie': return 'Pie'
    case 'doughnut': return 'Doughnut'
    case 'polarArea': return 'Polar Area'
    case 'radar': return 'Radar'
    case 'scatter': return 'Scatter'
    case 'bubble': return 'Bubble'
    default: return 'Chart'
  }
}

// --- Shared Visual Components ---

/** Skeleton placeholder for the chart + right sidebar area while store hydrates */
export function ChartAreaSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center h-full relative z-10 bg-transparent">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
        <div className="relative">
          {/* Outer spinning ring */}
          <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin shadow-lg"></div>
          {/* Inner pulsing core */}
          <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 animate-pulse">
            Preparing Workspace
          </span>
          <span className="text-xs text-gray-400 mt-1">Loading your context...</span>
        </div>
      </div>
    </div>
  )
}

/** Rich generation progress visual on main canvas during AI generation */
export function GenerationProgressView() {
  const [progress, setProgress] = useState(12)

  const steps = [
    "Analyzing your prompt and requirements...",
    "Extracting categories, series, and values...",
    "Composing visualization layout...",
    "Formatting styles, legends, and color palettes...",
  ]

  // Dynamic realistic progression timer
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 32) {
          return prev + 1.6
        } else if (prev < 64) {
          return prev + 1.1
        } else if (prev < 84) {
          return prev + 0.6
        } else if (prev < 96) {
          return prev + 0.15
        }
        return prev
      })
    }, 140)

    return () => clearInterval(timer)
  }, [])

  const stepIndex = progress < 30 ? 0 : progress < 60 ? 1 : progress < 85 ? 2 : 3

  return (
    <div className="flex flex-1 items-center justify-center h-full relative z-10 bg-transparent px-4">
      <div className="flex flex-col items-center max-w-sm w-full p-8 rounded-3xl bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 shadow-2xl text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-xl shadow-indigo-500/20 animate-pulse">
            <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
            </div>
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900 animate-ping" />
        </div>

        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 mb-1">
          Generating Your Chart
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 min-h-[32px] flex items-center justify-center transition-all px-2">
          {steps[stepIndex]}
        </p>

        {/* Dynamic progressing bar with percentage & animated light beam */}
        <div className="w-full mb-6">
          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-medium mb-1.5 px-0.5">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Step {stepIndex + 1} of {steps.length}</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
              {Math.min(99, Math.round(progress))}%
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden relative shadow-inner p-[1px]">
            <div
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden shadow-xs"
              style={{ width: `${Math.min(99, progress)}%` }}
            >
              {/* Animated shimmer beam running across the bar */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-progress-shimmer" />
            </div>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            useChatStore.getState().stopGeneration()
            toast.info("Generation cancelled")
          }}
          className="text-xs h-8 px-4 rounded-xl gap-1.5 text-slate-600 dark:text-slate-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900/50 cursor-pointer"
        >
          <Square className="w-3 h-3 fill-current text-red-500" />
          <span>Cancel Generation</span>
        </Button>
      </div>
    </div>
  )
}

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px]"></div>
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[100px]"></div>
      <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/15 blur-[100px]"></div>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-300"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>
    </div>
  )
}
