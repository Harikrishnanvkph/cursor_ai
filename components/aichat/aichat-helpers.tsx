"use client"

import React, { useState, useEffect } from "react"
import { Sparkles, Square, Check, Loader2 } from "lucide-react"
import { useChatStore } from "@/lib/chat-store"

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
      <div className="flex flex-col items-center gap-3.5">
        <div className="w-10 h-10 rounded-full border-[3px] border-slate-200 dark:border-slate-800 border-t-violet-600 dark:border-t-violet-400 animate-spin" />
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            Preparing Workspace
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Loading your context...</span>
        </div>
      </div>
    </div>
  )
}

/** Rich generation progress visual on main canvas during AI generation */
export function GenerationProgressView() {
  const [progress, setProgress] = useState(12)

  const phases = [
    { title: "Understanding prompt & intent", detail: "Analyzing your prompt and chart requirements..." },
    { title: "Structuring series & metrics", detail: "Extracting categories, series, and values..." },
    { title: "Composing visual layout", detail: "Configuring axes, geometry, and proportions..." },
    { title: "Polishing palette & typography", detail: "Applying styles, legends, and color harmony..." },
  ]

  // Dynamic realistic progression timer (integer steps aligned with 300ms transition)
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 96) return prev
        if (prev < 32) return prev + 4
        if (prev < 64) return prev + 3
        if (prev < 84) return prev + 2
        return prev + 1
      })
    }, 350)

    return () => clearInterval(timer)
  }, [])

  const stepIndex = progress < 30 ? 0 : progress < 60 ? 1 : progress < 85 ? 2 : 3
  const roundedProgress = Math.min(99, progress)

  return (
    <div className="flex flex-1 items-center justify-center h-full relative z-10 bg-transparent px-4">
      <div className="w-full max-w-[380px] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-[0_8px_30px_rgba(15,23,42,0.06)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] p-6 text-center animate-in fade-in zoom-in-95 duration-200 select-none">
        {/* Header Emblem */}
        <div className="relative mx-auto mb-4 w-12 h-12 flex items-center justify-center">
          <div
            aria-hidden="true"
            className="absolute -inset-2.5 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="absolute -inset-1.5 rounded-full border-2 border-transparent border-t-indigo-600 dark:border-t-indigo-400 border-r-indigo-500/30 animate-spin transform-gpu [will-change:transform] pointer-events-none"
          />
          <div className="relative w-11 h-11 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>

        {/* Heading & Live Subtitle */}
        <h3 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
          Generating your chart
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
          {phases[stepIndex].detail}
        </p>

        {/* 4-Stage Checklist Box */}
        <div className="mt-4 mb-4 rounded-xl bg-slate-50/80 dark:bg-slate-950/60 border border-slate-200/70 dark:border-slate-800 p-3 space-y-2 text-left">
          {phases.map((phase, idx) => {
            const isDone = idx < stepIndex
            const isCurrent = idx === stepIndex
            return (
              <div key={phase.title} className="flex items-center gap-2.5">
                {isDone ? (
                  <span className="w-4 h-4 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                  </span>
                ) : isCurrent ? (
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    <Loader2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                  </span>
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  </span>
                )}
                <span
                  className={
                    isDone
                      ? "text-xs font-medium text-slate-600 dark:text-slate-400"
                      : isCurrent
                      ? "text-xs font-semibold text-slate-900 dark:text-slate-100"
                      : "text-xs text-slate-400 dark:text-slate-500"
                  }
                >
                  {phase.title}
                </span>
              </div>
            )
          })}
        </div>

        {/* Progress Track & Percentage */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium mb-1.5">
            <span>
              Step {stepIndex + 1} of {phases.length}
            </span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400 tabular-nums">
              {roundedProgress}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 h-full w-full rounded-full origin-left transition-transform duration-300 ease-out transform-gpu"
              style={{ transform: `scaleX(${roundedProgress / 100})` }}
            />
          </div>
        </div>

        {/* Stop Generation Button */}
        <button
          type="button"
          onClick={() => {
            useChatStore.getState().stopGeneration()
          }}
          className="mt-4 w-full h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-900/60 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Square className="w-2.5 h-2.5 fill-current text-rose-500" />
          <span>Stop generation</span>
        </button>
      </div>
    </div>
  )
}

export function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Crisp Grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(148, 163, 184, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.045) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      ></div>
    </div>
  )
}
