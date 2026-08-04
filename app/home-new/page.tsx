"use client"

import React, { useState } from "react"
import { useTheme } from "next-themes"
import { SiteHeader } from "@/components/site-header"
import { Sparkles, Sliders, LayoutDashboard, ArrowRight, Layers, PanelLeft, Share2, Settings, Palette, AlertTriangle, CheckCircle2, RefreshCw, Maximize2, Database, Layout, Grid, MessageSquare, MousePointer2, Pencil, Minus, ArrowLeftRight, Square, Circle, Triangle, Star, Hexagon, Heart, Cloud, Plus, Type, Lock, Copy, Trash2, MoreHorizontal, BarChart2, PieChart, FolderOpen, Save, TrendingUp, ChevronLeft, ChevronRight, AlignLeft, CircleDot, Target, Box, Filter, Gauge, LayoutGrid, Activity, Download, Check, Zap, ChevronDown } from "lucide-react"

// Gemini-style four-pointed star icon
function GeminiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14 2C14 8.627 8.627 14 2 14C8.627 14 14 19.373 14 26C14 19.373 19.373 14 26 14C19.373 14 14 8.627 14 2Z"
        fill="currentColor"
      />
    </svg>
  )
}

const TABS = [
  { id: "ai-chat", label: "AI Chat", icon: GeminiIcon },
  { id: "editor", label: "Advanced Editor", icon: Sliders },
  { id: "board", label: "Board", icon: LayoutDashboard },
]

const SUBTITLES: Record<string, string> = {
  "ai-chat": "Prompt in. Chart out. Instantly.",
  "editor": "Colors, fonts, layouts — full control.",
  "board": "Arrange charts into a shareable canvas.",
}// ── AI CHAT BENTO ──────────────────────────────────────────
function AiChatBento() {
  return (
    /* Fixed-height container so percentage heights work correctly */
    <div className="flex flex-col lg:flex-row gap-4 lg:h-[600px]">

      {/* ── LEFT COLUMN — W:35% ── */}
      <div className="flex flex-col gap-4 lg:w-[35%]">

        {/* Card 1 — H:35% — Pull Realtime Data */}
        <div className="lg:flex-[35] rounded-2xl bg-slate-950 border border-slate-800 p-6 flex flex-col justify-between overflow-hidden relative min-h-[180px]">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-[60%]">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 tracking-wider uppercase bg-indigo-500/10 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Connect
            </span>
            <h2 className="mt-2 text-xl font-semibold text-slate-100 leading-snug  tracking-wide">
              Pull Realtime Data<br />on any topic
            </h2>
          </div>

          {/* Realtime clock chart illustration positioned on the right */}
          <div className="absolute right-2 bottom-2 w-[160px] h-[160px] z-10 flex items-center justify-center pointer-events-none">
            <img
              src="/realtime-clock-chart.png"
              alt="Realtime clock chart"
              className="w-full h-full object-contain dark:brightness-110 dark:contrast-110"
            />
          </div>
        </div>

        {/* Card 2 — H:65% — NLP Chat */}
        <div className="lg:flex-[65] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4 overflow-hidden min-h-[220px]">
          <div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase bg-indigo-100 dark:bg-indigo-950/40 px-2 py-0.5 rounded">Conversational</span>
            <p className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-200 leading-snug">
              Experience Natural Language Prompt to Create and Modify chart as you go
            </p>
          </div>

          {/* Chat bubbles container */}
          <div className="flex flex-col gap-3 mt-1">
            {/* AI greeting */}
            <div className="self-start flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-600 dark:text-slate-300 shadow-sm max-w-[85%]">
              <GeminiIcon className="w-3 h-3 text-indigo-500 shrink-0" />
              <span>How can I help you?</span>
            </div>

            {/* User message */}
            <div className="self-end bg-indigo-600 rounded-xl px-3.5 py-2 text-xs text-white max-w-[85%] shadow-sm shadow-indigo-500/10">
              Give me top 10 Billionaires
            </div>

            {/* AI response */}
            <div className="self-start flex gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-[85%] shadow-sm">
              <GeminiIcon className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
              <span>
                Here is the top 10 richest people in the world, based on Bloomberg data. Elon Musk leads with $619 billion...
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ── RIGHT COLUMN — W:65% ── */}
      <div className="flex flex-col gap-4 lg:flex-1">

        {/* Card 3 — H:65% — Prompt to Create */}
        <div className="lg:flex-[65] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 pt-5 pb-5 px-5 sm:pt-5 sm:pb-5 sm:px-6 flex flex-col overflow-hidden min-h-[320px]">

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white leading-snug tracking-tight mb-3">
            Prompt To Create <span className='bg-clip-text font-bold text-transparent bg-gradient-to-b from-indigo-500 to-purple-500'>Stunning Charts, Infographic Templates</span>
          </h3>

          {/* Mosaic container with floating prompt bar */}
          <div className="relative flex-1">

            {/* Floating prompt bar — overlays on top of the mosaic */}
            <div className="absolute top-[38%] left-[8%] right-[8%] z-30 flex items-center gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 shadow-xl shadow-slate-200/80 dark:shadow-slate-950/80">
              <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 animate-pulse" />
              <span className="flex-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-mono truncate">
                Show top 10 highest-grossing Hollywood films...
              </span>
              <button className="shrink-0 w-8 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors shadow-md shadow-indigo-500/20">
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Tightly packed mosaic — 3 columns with tuned flex ratios */}
            <div className="flex gap-1.5 h-full">

              {/* LEFT COLUMN (~38%) — 16:9 on top, 1:1 + 4:5 on bottom */}
              <div className="flex-[38] flex flex-col gap-1.5">
                {/* 16:9 Landscape — flex-[49] gives ~50% height → width/height ≈ 16:9 */}
                <div className="flex-[49] bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center overflow-hidden group">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">16:9</span>
                </div>
                {/* Bottom row — 1:1 (flex-5) + 4:5 (flex-4) */}
                <div className="flex-[51] flex gap-1.5">
                  <div className="flex-[5] bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center overflow-hidden group">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">1:1</span>
                  </div>
                  <div className="flex-[4] bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center overflow-hidden group">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">4:5</span>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN (~25%) — 9:16 tall portrait spanning full height */}
              <div className="flex-[25] bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center overflow-hidden group">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">9:16</span>
              </div>

              {/* RIGHT COLUMN (~34%) — 4:3 on top, 3:2 + 1:2 on bottom */}
              <div className="flex-[34] flex flex-col gap-1.5">
                {/* 4:3 — flex-[59] gives ~59% height → width/height ≈ 4:3 */}
                <div className="flex-[59] bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center overflow-hidden group">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">4:3</span>
                </div>
                {/* Bottom row — 3:2 (flex-3) + 1:2 (flex-1) */}
                <div className="flex-[41] flex gap-1.5">
                  <div className="flex-[3] bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center overflow-hidden group">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">3:2</span>
                  </div>
                  <div className="flex-[1] bg-slate-200/80 dark:bg-slate-800/60 border border-slate-300/50 dark:border-slate-700/50 flex items-center justify-center overflow-hidden group">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">1:2</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div className="lg:flex-[35] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-row justify-between items-center overflow-hidden min-h-[120px]">
          <div className="flex-none">
            {/* <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase bg-indigo-100 dark:bg-indigo-950/40 px-2 py-0.5 rounded">Endpoints</span> */}
            <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white leading-snug">
              Generate Images<br />For Endpoints<br />Increase Productivity
            </h3>
          </div>
          {/* GPU export share line chart illustration */}
          <div className="flex-1 max-w-[330px] flex items-center justify-end ml-auto">
            <img
              src="/gpu-export-share.png"
              alt="GPU Export Share"
              className="w-full h-auto object-contain dark:brightness-105"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DECORATE DESIGN BENTO CARD ────────────────────────────
function DecorateDesignCard() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? (resolvedTheme === "dark" || theme === "dark") : false

  return (
    <div className={`rounded-2xl border p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between items-stretch min-h-[340px] overflow-hidden relative w-full text-left transition-colors duration-300 ${isDark
      ? "bg-slate-900 border-slate-800 text-white shadow-none"
      : "bg-slate-50 border-slate-200 text-slate-900 shadow-none"
      }`}>
      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
      )}

      {/* Left column: Context details & Visual HTML Previews */}
      <div className="flex-1 z-10 flex flex-col justify-between max-w-md">
        <div>
          <h3 className={`text-xl font-semibold leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
            Add Visual Depth with Shapes &amp; Overlays
          </h3>
        </div>

        {/* Header for Floating Context Boxes */}
        <div className={`mt-3 text-[11px] font-bold tracking-wider uppercase font-mono px-1 ${isDark ? "text-indigo-300" : "text-indigo-700"
          }`}>
          Custom Overlays with Text, Image, &amp; SVG
        </div>

        {/* Floating Visual Context Elements directly under Title */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1.5 flex-1">
          {/* 1st Floating Graphic: Text Callout Overlay */}
          <div className="relative py-6 px-4 flex flex-col items-center justify-center min-h-[220px] h-full overflow-hidden">
            {/* Floating 2-row toolbar preview */}
            <div className="flex flex-col items-center gap-1.5 mb-4 scale-[1.05] transform-gpu">
              <div className="flex items-center gap-1.5 bg-white text-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-semibold shadow-md border border-slate-200">
                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md font-bold">Edit</span>
                <span className="font-bold">B</span>
                <Palette className="w-3 h-3 text-slate-600" />
                <span className="font-mono text-[9px]">Arial</span>
                <MoreHorizontal className="w-3 h-3 text-slate-600" />
              </div>
              <div className="flex items-center gap-1.5 bg-white text-slate-700 px-2 py-0.5 rounded-lg text-[9px] shadow-sm border border-slate-200">
                <Lock className="w-3 h-3" />
                <Copy className="w-3 h-3" />
                <Trash2 className="w-3 h-3" />
                <MoreHorizontal className="w-3 h-3" />
              </div>
            </div>

            {/* Rotated text callout box */}
            <div className={`relative transform -rotate-6 border-2 border-dashed px-4 py-2 rounded-lg text-center shadow-md transition-colors ${isDark
              ? "border-indigo-400 bg-indigo-500/15 text-white"
              : "border-indigo-500 bg-indigo-50/80 text-indigo-950"
              }`}>
              {/* Top rotation pin */}
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full border-2 bg-white ${isDark ? "border-indigo-400" : "border-indigo-500"
                }`} />
              <div className={`absolute -top-4 left-1/2 -translate-x-1/2 w-0.5 h-4 ${isDark ? "bg-indigo-400" : "bg-indigo-500"
                }`} />
              <span className={`text-sm font-extrabold tracking-wider font-sans antialiased ${isDark ? "text-white" : "text-indigo-950"
                }`}>
                chartography.in
              </span>
              {/* Corner resize handles */}
              <div className={`absolute -top-1.5 -left-1.5 w-2 h-2 rounded-xs ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`} />
              <div className={`absolute -top-1.5 -right-1.5 w-2 h-2 rounded-xs ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`} />
              <div className={`absolute -bottom-1.5 -left-1.5 w-2 h-2 rounded-xs ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`} />
              <div className={`absolute -bottom-1.5 -right-1.5 w-2 h-2 rounded-xs ${isDark ? "bg-indigo-400" : "bg-indigo-500"}`} />
            </div>
          </div>

          {/* 2nd Floating Graphic: Image & Diagram Overlay with Free Dragging */}
          <div className="relative p-4 min-h-[220px] h-full overflow-hidden flex flex-col justify-end">
            {/* Simple background bar chart series */}
            <div className="flex items-end justify-between gap-2 h-28 w-full px-2 opacity-50">
              <div className="w-full bg-sky-400/80 rounded-t h-[60%]" />
              <div className="w-full bg-rose-400/80 rounded-t h-[90%]" />
              <div className="w-full bg-teal-400/80 rounded-t h-[40%]" />
              <div className="w-full bg-amber-400/80 rounded-t h-[75%]" />
              <div className="w-full bg-purple-400/80 rounded-t h-[35%]" />
            </div>

            {/* Overlaid Diagram Graphic with dashed selection border */}
            <div className={`absolute top-4 right-4 w-32 h-24 border-2 border-dashed bg-white rounded-lg p-1 flex flex-col items-center justify-center shadow-2xl ${isDark ? "border-indigo-400" : "border-indigo-500"
              }`}>
              {/* Mini action bar above image */}
              <div className="absolute -top-4 right-1 bg-white text-slate-700 px-1.5 py-0.5 rounded text-[8px] flex items-center gap-1 shadow-md border border-slate-200 z-10">
                <Lock className="w-2.5 h-2.5" />
                <Copy className="w-2.5 h-2.5" />
                <Trash2 className="w-2.5 h-2.5" />
              </div>
              {/* Actual User-provided Infographic Image */}
              <img
                src="/overlay-infographic.jpg"
                alt="Infographic Overlay"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover rounded-md"
              />

              {/* Hand Pointer Drag Icon at bottom right */}
              <div className="absolute -bottom-3 -right-3 bg-amber-500 text-slate-950 rounded-full p-1.5 shadow-lg border-2 border-amber-300 z-10 hover:scale-110 transition-transform duration-200 cursor-pointer">
                <MousePointer2 className="w-4 h-4 fill-slate-950 stroke-slate-950" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right column: Shapes Toolbar Preview */}
      <div className="flex flex-col gap-2 shrink-0 w-full sm:w-[260px] justify-center">
        <div className={`text-[11px] font-bold tracking-wider uppercase font-mono px-1 ${isDark ? "text-indigo-300" : "text-indigo-700"
          }`}>
          Vector Shape Tools
        </div>

        <div className={`w-full backdrop-blur-md transform-gpu rounded-xl border flex flex-col p-3.5 relative overflow-hidden transition-colors ${isDark
          ? "bg-slate-950/70 border-slate-800/90 shadow-2xl"
          : "bg-slate-50 border-slate-200/90 shadow-md"
          }`}>
          {/* Visual Toolbar Grid */}
          <div className="space-y-3 font-mono">
            {/* TOOLS */}
            <div>
              <div className={`mb-1.5 text-[8.5px] font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-600"
                }`}>TOOLS</div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg font-sans text-[10px] font-bold shadow-xs transition-colors ${isDark
                  ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                  : "bg-white border border-slate-300/80 text-slate-900"
                  }`}>
                  <MousePointer2 className={`w-3 h-3 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                  <span>Select</span>
                </div>
                <div className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg font-sans text-[10px] font-bold shadow-xs transition-colors ${isDark
                  ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                  : "bg-white border border-slate-300/80 text-slate-900"
                  }`}>
                  <Layers className={`w-3 h-3 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                  <span>Marquee</span>
                </div>
                <div className={`flex items-center justify-center gap-1 px-1.5 py-1.5 rounded-lg font-sans text-[10px] font-bold shadow-xs transition-colors ${isDark
                  ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                  : "bg-white border border-slate-300/80 text-slate-900"
                  }`}>
                  <Pencil className={`w-3 h-3 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                  <span>Draw</span>
                </div>
              </div>
            </div>

            {/* LINES */}
            <div>
              <div className={`mb-1.5 text-[8.5px] font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-600"
                }`}>LINES</div>
              <div className="flex gap-1.5">
                {[Minus, ArrowRight, ArrowLeftRight, Grid].map((IconComp, idx) => (
                  <div key={idx} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-200"
                    : "bg-white border border-slate-300/80 text-slate-800"
                    }`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* SHAPES */}
            <div>
              <div className={`mb-1.5 text-[8.5px] font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-600"
                }`}>SHAPES</div>
              <div className="grid grid-cols-5 gap-1.5">
                {[Square, Circle, Triangle, Star, Hexagon, Heart, Cloud, MessageSquare, Palette, Sparkles].map((ShapeComp, idx) => (
                  <div key={idx} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${isDark
                    ? "bg-indigo-600/20 border border-indigo-500/30 text-indigo-200"
                    : "bg-white border border-slate-300/80 text-slate-800"
                    }`}>
                    <ShapeComp className="w-3.5 h-3.5" />
                  </div>
                ))}
              </div>
            </div>

            {/* ANNOTATIONS & OVERLAYS */}
            <div className={`pt-2 border-t flex items-center justify-between opacity-90 ${isDark ? "border-slate-800/80" : "border-slate-200"
              }`}>
              <span className={`text-[8px] font-bold tracking-wider ${isDark ? "text-slate-500" : "text-slate-600"
                }`}>ANNOTATIONS &amp; OVERLAYS</span>
              <div className={`flex items-center gap-1 text-[8.5px] font-sans font-bold px-2 py-0.5 rounded-full border transition-colors ${isDark
                ? "text-indigo-300 bg-indigo-500/10 border-indigo-500/20"
                : "text-indigo-700 bg-indigo-50 border-indigo-200/80"
                }`}>
                <Plus className="w-2.5 h-2.5" />
                <span>15+ More Available</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── ADVANCED EDITOR BENTO ──────────────────────────────────
function AdvancedControlsCard() {
  const [activeTab, setActiveTab] = useState<"chart" | "template">("chart")

  return (
    <div className="w-full flex flex-col items-center text-center font-sans p-2">
      {/* Top Header Text */}
      <div className="max-w-md mx-auto mb-3">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Flexible Display Modes
        </h3>
      </div>

      {/* Connected Segmented Pill Switcher [ Chart | Template ] */}
      <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xs mb-4 shrink-0 select-none">
        <button
          onClick={() => setActiveTab("chart")}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === "chart"
            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          Chart
        </button>
        <button
          onClick={() => setActiveTab("template")}
          className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === "template"
            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          Template
        </button>
      </div>

      {/* Main Preview Box directly below the pill control (Compact Original Size) */}
      <div className="w-full max-w-md h-[240px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-lg flex items-center justify-center relative overflow-hidden group">
        <div className="w-full h-full flex items-center justify-center p-1">
          {activeTab === "chart" ? (
            <img
              src="/smartphone-chart.png"
              alt="Standalone Chart View"
              className="w-full h-auto max-h-[200px] object-contain rounded-lg shadow-md animate-in fade-in zoom-in-95 duration-250"
            />
          ) : (
            <img
              src="/smartphone-template.png"
              alt="Infographic Template View"
              className="w-full h-auto max-h-[200px] object-contain rounded-lg shadow-md animate-in fade-in zoom-in-95 duration-250"
            />
          )}
        </div>
      </div>
    </div>
  )
}

function EditorOptionsCard() {
  const [activeMenu, setActiveMenu] = useState<"general" | "datasets" | "appearance" | "scales" | "decorations" | "templates" | "more">("general")

  const menuItems = [
    {
      id: "general",
      label: "General",
      icon: Sliders,
      desc: (
        <span>
          Switch modes between <strong className="font-semibold text-white">Chart</strong> or <strong className="font-semibold text-white">Template</strong> editor. Choose <strong className="font-semibold text-white">Standard</strong> or <strong className="font-semibold text-white">3D chart</strong> types, configure canvas <strong className="font-semibold text-white">Dimensions &amp; Padding</strong>, toggle basic elements like <strong className="font-semibold text-white">Borders &amp; Legends</strong>, or use <strong className="font-semibold text-white">Quick Tools</strong> to sort and filter data.
        </span>
      )
    },
    {
      id: "datasets",
      label: "Datasets",
      icon: Database,
      desc: (
        <span>
          Edit raw cell values in the <strong className="font-semibold text-white">Spreadsheet</strong>. Map columns to <strong className="font-semibold text-white">Axes</strong>, adjust active <strong className="font-semibold text-white">Series</strong>, and customize individual series <strong className="font-semibold text-white">Colors</strong> and <strong className="font-semibold text-white">Label Offsets</strong>.
        </span>
      )
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
      desc: (
        <span>
          Style canvas <strong className="font-semibold text-white">Backgrounds</strong> (solids, gradients, images), format <strong className="font-semibold text-white">Titles &amp; Subtitles</strong>, configure the <strong className="font-semibold text-white">Legend</strong> layout, adjust bar/line <strong className="font-semibold text-white">Styling</strong>, and customize <strong className="font-semibold text-white">Data Labels</strong>.
        </span>
      )
    },
    {
      id: "scales",
      label: "Scales",
      icon: Grid,
      desc: (
        <span>
          Fine-tune Cartesian <strong className="font-semibold text-white">X-Axis</strong> &amp; <strong className="font-semibold text-white">Y-Axis</strong> gridlines and boundaries, configure circular <strong className="font-semibold text-white">Radial Scales</strong> (radar rings), or customize pie <strong className="font-semibold text-white">Arc Angles</strong> and <strong className="font-semibold text-white">Inner Cutouts</strong>.
        </span>
      )
    },
    {
      id: "decorations",
      label: "Decorations",
      icon: Layers,
      desc: (
        <span>
          Activate the vector <strong className="font-semibold text-white">Drawing Canvas</strong> to add custom <strong className="font-semibold text-white">Shapes</strong> (arrows, rects, stars), place rich <strong className="font-semibold text-white">Text Callouts</strong>, overlay image uploads, and manage element layering.
        </span>
      )
    },
    {
      id: "templates",
      label: "Templates",
      icon: Layout,
      desc: (
        <span>
          Select from a gallery of <strong className="font-semibold text-white">Infographic Layouts</strong> to wrap your chart with pre-structured template content, headlines, footer citations, and metadata cards.
        </span>
      )
    },
    {
      id: "more",
      label: "More",
      icon: Settings,
      desc: (
        <span>
          Configure interactive hover <strong className="font-semibold text-white">Tooltips</strong>, customize brand <strong className="font-semibold text-white">Watermarks</strong>, tweak chart <strong className="font-semibold text-white">Animations</strong> (easings/durations), and inspect or edit the raw <strong className="font-semibold text-white">JSON Payload</strong> directly.
        </span>
      )
    }
  ]

  const activeItem = menuItems.find(item => item.id === activeMenu) || menuItems[0]

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 p-6 md:p-8 flex flex-col sm:flex-row gap-6 justify-between items-stretch min-h-[340px] overflow-hidden relative w-full text-left">
      <div className="absolute inset-0 bg-white/5 pointer-events-none" />

      {/* Left side: Context details */}
      <div className="flex-1 z-10 flex flex-col justify-between max-w-sm">
        <div>
          <h3 className="text-xl font-semibold text-white leading-snug">
            Effortlessly Configure Charts &amp; Templates with Complete Control
          </h3>
        </div>

        {/* Dynamic Detail Card describing selected option */}
        <div className="mt-6 bg-white/10 border border-white/15 rounded-xl p-4 transition-all duration-300 min-h-[85px] flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <activeItem.icon className="w-4 h-4 text-white" />
            <span className="text-xs font-bold text-white font-sans antialiased">{activeItem.label} Tools</span>
          </div>
          <div className="text-[11.5px] text-blue-100/90 leading-relaxed font-sans antialiased">
            {activeItem.desc}
          </div>
        </div>
      </div>

      {/* Right side: Glassy Text UI Navigation */}
      <div className="w-full sm:w-[240px] bg-slate-950/20 backdrop-blur-md rounded-xl border border-white/10 flex flex-col shrink-0 p-3.5 relative overflow-hidden transition-all duration-300">
        {/* Navigation list */}
        <div className="flex-1 flex flex-col gap-1">
          {menuItems.map((item) => {
            const isSelected = activeMenu === item.id
            const IconComp = item.icon
            return (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-left text-xs font-medium font-sans antialiased transition-all duration-200 ${isSelected
                  ? "bg-white/20 text-white border border-white/20 shadow-lg scale-[1.01]"
                  : "text-white/70 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
              >
                <IconComp className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-white/60"}`} />
                <span className="flex-1 truncate">{item.label}</span>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse shrink-0" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AspectResizerCard() {
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16" | "1:1" | "4:3">("16:9")

  const aspectConfig = {
    "16:9": { label: "16:9", desc: "Landscape Presentation", width: "w-44", height: "h-24", dim: "1200x675" },
    "9:16": { label: "9:16", desc: "Mobile Story Canvas", width: "w-24", height: "h-40", dim: "1080x1920" },
    "1:1": { label: "1:1", desc: "Square Social Tile", width: "w-32", height: "h-32", dim: "1080x1080" },
    "4:3": { label: "4:3", desc: "Classic Document Print", width: "w-38", height: "h-28", dim: "800x600" }
  }

  return (
    <div className="w-full flex flex-col items-center text-center font-sans p-2">
      {/* Top Header Title */}
      <div className="max-w-md mx-auto mb-3">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Fluid Resizing &amp; Aspect Locks
        </h3>
      </div>

      {/* Connected Segmented Pill Switcher [ 16:9 | 9:16 | 1:1 | 4:3 ] */}
      <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xs mb-4 shrink-0 select-none">
        {(["16:9", "9:16", "1:1", "4:3"] as const).map((ratio) => {
          const isSelected = aspectRatio === ratio
          return (
            <button
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${isSelected
                ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
            >
              {ratio}
            </button>
          )
        })}
      </div>

      {/* Main Preview Box Directly Below */}
      <div className="w-full max-w-md h-[240px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-lg flex items-center justify-center relative overflow-hidden group">
        <div
          className={`bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl flex flex-col justify-between p-2 shadow-md transition-all duration-300 ease-out ${aspectConfig[aspectRatio].width} ${aspectConfig[aspectRatio].height}`}
        >
          {/* Header readout */}
          <div className="flex justify-between items-center text-[8px] font-mono text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 pb-1">
            <span>{aspectConfig[aspectRatio].label} ASPECT</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{aspectConfig[aspectRatio].dim}</span>
          </div>

          {/* Bar Chart Simulation Graphic */}
          <div className="flex-1 flex gap-1 items-end py-2 px-1 justify-around">
            <div className="w-2.5 bg-teal-500 rounded-t h-[40%]" />
            <div className="w-2.5 bg-indigo-500 rounded-t h-[65%]" />
            <div className="w-2.5 bg-teal-500 rounded-t h-[50%]" />
            {aspectRatio !== "9:16" && (
              <>
                <div className="w-2.5 bg-indigo-600 rounded-t h-[85%]" />
                <div className="w-2.5 bg-teal-500 rounded-t h-[60%]" />
              </>
            )}
          </div>

          {/* Bottom Label */}
          <div className="text-center text-[8px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-0.5">
            {aspectConfig[aspectRatio].desc}
          </div>
        </div>
      </div>
    </div>
  )
}

function CloudExportShareCard() {
  const [activeTab, setActiveTab] = useState<"save" | "export" | "share">("save")

  const infoConfig = {
    save: {
      title: "Cloud Sync & Storage",
      desc: "Save charts securely to Supabase cloud storage for instant retrieval anytime.",
      icon: Cloud,
      detail: "Synced across all devices & team workspaces"
    },
    export: {
      title: "High-Res Export",
      desc: "Export high-resolution PNG, SVG vector graphics, or interactive HTML embeds.",
      icon: Download,
      detail: "Supports 4K PNG, Vector SVG & Standalone HTML"
    },
    share: {
      title: "Instant Live Share",
      desc: "Generate public share links or embed interactive live charts anywhere with single click.",
      icon: Share2,
      detail: "Public web link & iframe embed code ready"
    }
  }

  const activeData = infoConfig[activeTab]

  return (
    <div className="w-full flex flex-col items-center text-center font-sans p-2">
      {/* Top Header Title */}
      <div className="max-w-md mx-auto mb-3">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Save, Share &amp; Export
        </h3>
      </div>

      {/* Connected Segmented Pill Switcher [ Save | Export | Share ] */}
      <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xs mb-4 shrink-0 select-none">
        <button
          onClick={() => setActiveTab("save")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === "save"
            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          Save
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === "export"
            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          Export
        </button>
        <button
          onClick={() => setActiveTab("share")}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${activeTab === "share"
            ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
        >
          Share
        </button>
      </div>

      {/* Main Preview Box Directly Below */}
      <div className="w-full max-w-md h-[240px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-center relative overflow-hidden group">
        <div className="w-full h-full flex flex-col justify-between p-2 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 mt-1">
            <activeData.icon className="w-6 h-6 shrink-0" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">{activeData.title}</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium my-2 px-2">
            {activeData.desc}
          </p>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 shadow-2xs">
            <span className="text-[10.5px] font-mono font-semibold text-teal-600 dark:text-teal-400 block">
              {activeData.detail}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── PRICING SECTION ─────────────────────────────────────────
function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly")

  const plans = [
    {
      name: "Free",
      badge: "Starter",
      description: "Essential AI charting tools for quick standalone visuals.",
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: [
        "10 AI Chart Generation Credits / mo",
        "5 Core Chart Types (Bar, Line, Pie, Donut)",
        "Standard PNG Export",
        "Basic Canvas Customization",
        "Community Templates Gallery",
      ],
      cta: "Get Started Free",
      isPopular: false,
    },
    {
      name: "Pro",
      badge: "Most Popular",
      description: "Full infographic studio & power tools for pros & creators.",
      monthlyPrice: 19,
      yearlyPrice: 15,
      features: [
        "Unlimited AI Generation Prompts",
        "All 17+ Studio Chart Types (3D, Gauge, Funnel)",
        "Infographic Templates & Multi-Zone Layouts",
        "Vector Decoration Tools & Callout Shapes",
        "High-Res 4K PNG, SVG & Live HTML Export",
        "Supabase Cloud Storage & Project History",
        "Custom Canvas Aspect Ratios (16:9, 9:16, 1:1, 4:3)",
      ],
      cta: "Start 14-Day Free Trial",
      isPopular: true,
    },
    {
      name: "Enterprise",
      badge: "Teams & Agencies",
      description: "Advanced team collaboration & dedicated AI processing.",
      monthlyPrice: 49,
      yearlyPrice: 39,
      features: [
        "Everything in Pro Plan",
        "Unlimited Team Workspaces & Sharing",
        "Custom Brand Watermarks & Palette Presets",
        "High-Priority AI Pipeline & Dedicated Compute",
        "24/7 Priority Support & Onboarding",
        "Custom Export Webhooks & API Access",
      ],
      cta: "Contact Sales",
      isPopular: false,
    },
  ]

  return (
    <div className="mt-24 pt-12 font-sans max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
          Simple, Transparent Pricing
        </h2>
        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 font-normal leading-relaxed">
          Choose the right plan to unlock full AI charting power, pro infographic templates, vector decorations, and high-res exports.
        </p>

        {/* Billing Switcher */}
        <div className="mt-6 inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-2xs select-none">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${billingCycle === "monthly"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${billingCycle === "yearly"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
          >
            <span>Yearly</span>
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => {
          const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice
          return (
            <div
              key={plan.name}
              className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative transition-all duration-300 ${plan.isPopular
                ? "bg-slate-900 text-white dark:bg-slate-900/90 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/10 scale-102"
                : "bg-white dark:bg-slate-900/60 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-md"
                }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-extrabold uppercase tracking-wider rounded-full shadow-md">
                  {plan.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  {!plan.isPopular && (
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className={`mt-2 text-xs leading-relaxed ${plan.isPopular ? "text-slate-300" : "text-slate-500 dark:text-slate-400"}`}>
                  {plan.description}
                </p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">${price}</span>
                  <span className={`text-xs font-medium ${plan.isPopular ? "text-slate-400" : "text-slate-500 dark:text-slate-400"}`}>
                    / month {billingCycle === "yearly" && price > 0 ? "(billed annually)" : ""}
                  </span>
                </div>

                <ul className="mt-8 space-y-3">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs">
                      <Check className={`w-4 h-4 shrink-0 mt-0.5 ${plan.isPopular ? "text-indigo-400" : "text-indigo-600 dark:text-indigo-400"}`} />
                      <span className={plan.isPopular ? "text-slate-200 font-medium" : "text-slate-700 dark:text-slate-300 font-medium"}>
                        {feat}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-4">
                <button
                  className={`w-full py-3 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${plan.isPopular
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 active:scale-98"
                    : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 active:scale-98"
                    }`}
                >
                  {plan.cta}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── SITE FOOTER ─────────────────────────────────────────────
function SiteFooter() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    pages: false,
    company: false,
  })

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const sections = [
    {
      id: "pages",
      title: "Pages",
      links: [
        { label: "AI Chart Generator", href: "/landing", isBold: true },
        { label: "Advanced Chart Editor", href: "/editor", isBold: true },
        { label: "Dashboard", href: "/board", isBold: true },
        { label: "Documentation", href: "/documentation" },
        { label: "Upcoming Enhancements", href: "#upcoming" },
      ],
    },
    {
      id: "company",
      title: "Company",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Privacy Policy", href: "/privacy" },
        { label: "Terms of Service", href: "/terms" },
        { label: "Contact Support", href: "#" },
      ],
    },
  ]

  return (
    <footer className="mt-28 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 font-sans text-slate-600 dark:text-slate-400 text-xs antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">

        {/* Main Grid: Stacked on Mobile/Tablet, 4 Columns on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Brand & Mission (Spans 2 columns on lg screens) */}
          <div className="lg:col-span-2 space-y-4 text-left">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <GeminiIcon className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Chartography
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
              The AI-powered charting &amp; infographic platform. Transform raw data into publication-ready charts, interactive templates, and custom vector graphic stories in seconds.
            </p>
          </div>

          {/* Mobile & Tablet Accordion / Desktop Column Views */}
          {sections.map((sec) => {
            const isOpen = openSections[sec.id]
            return (
              <div key={sec.id} className="border-b lg:border-b-0 border-slate-200 dark:border-slate-800 pb-4 lg:pb-0">
                {/* Mobile / Tablet Accordion Header */}
                <button
                  onClick={() => toggleSection(sec.id)}
                  className="w-full flex items-center justify-between py-2 lg:py-0 lg:cursor-default text-left font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white"
                >
                  <span>{sec.title}</span>
                  <ChevronDown className={`w-4 h-4 lg:hidden transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Content Links: Collapsible on Mobile/Tablet (<lg), Always Open on Desktop (lg:) */}
                <ul className={`mt-3 space-y-2 font-medium transition-all duration-200 overflow-hidden ${isOpen ? "block max-h-96 opacity-100" : "hidden lg:block max-h-96 lg:opacity-100"}`}>
                  {sec.links.map((link, idx) => (
                    <li key={idx}>
                      <a
                        href={link.href}
                        className={`transition-colors inline-block py-1 sm:py-0.5 ${
                          link.isBold
                            ? "font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300"
                            : "hover:text-indigo-600 dark:hover:text-indigo-400"
                        }`}
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}

        </div>

        {/* Bottom copyright bar */}
        <div className="mt-12 lg:mt-16 pt-8 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center font-medium text-slate-500 dark:text-slate-400 text-center">
          <p>© {new Date().getFullYear()} Chartography. All rights reserved.</p>
        </div>

      </div>
    </footer>
  )
}

function EditorWorkspaceHubCard() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-teal-600 p-6 flex flex-col justify-between min-h-[340px] overflow-hidden relative group text-white">
      <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />

      <div>
        <h3 className="text-xl font-semibold leading-snug text-white">
          All-in-One Charting Studio
        </h3>
        <p className="mt-2 text-xs leading-relaxed font-sans text-sky-100">
          A complete workspace to transform raw data into polished, publication-ready charts and visual stories.
        </p>
      </div>

      {/* Structured Feature List */}
      <div className="mt-4 flex-1 flex flex-col justify-between relative space-y-2.5 font-sans">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors">
          <Database className="w-4 h-4 shrink-0 text-sky-200" />
          <div className="text-xs font-semibold text-white">Dataset &amp; Series Control</div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors">
          <Palette className="w-4 h-4 shrink-0 text-sky-200" />
          <div className="text-xs font-semibold text-white">Aesthetics &amp; Typography</div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors">
          <Grid className="w-4 h-4 shrink-0 text-sky-200" />
          <div className="text-xs font-semibold text-white">Scales, Grids &amp; Layouts</div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors">
          <Layers className="w-4 h-4 shrink-0 text-sky-200" />
          <div className="text-xs font-semibold text-white">Vector Canvas &amp; Overlays</div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/15 border border-white/20 text-white hover:bg-white/25 transition-colors">
          <MoreHorizontal className="w-4 h-4 shrink-0 text-sky-200" />
          <div className="text-xs font-semibold text-white">More Options &amp; Utilities</div>
        </div>
      </div>
    </div>
  )
}

function CloudControlsHubCard() {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted ? (resolvedTheme === "dark" || theme === "dark") : false

  return (
    <div className={`rounded-2xl border p-6 flex flex-col justify-between min-h-[340px] overflow-hidden relative group transition-colors duration-300 ${isDark
      ? "bg-slate-900 border-slate-800 text-white shadow-none"
      : "bg-slate-50 border-slate-200 text-slate-900 shadow-none"
      }`}>
      {isDark && (
        <div className="absolute inset-0 bg-gradient-to-b from-sky-500/10 via-indigo-500/5 to-transparent pointer-events-none" />
      )}

      <div>
        <h3 className={`text-lg font-semibold leading-snug ${isDark ? "text-white" : "text-slate-900"}`}>
          Modes, Presets &amp; Cloud Sync
        </h3>
        <p className={`mt-2 text-xs leading-relaxed font-sans ${isDark ? "text-slate-400" : "text-slate-700 font-normal"}`}>
          Switch chart modes, pick from 20+ chart types, apply template presets, and seamlessly save, share, or load cloud charts.
        </p>
      </div>

      {/* Feature Grid Graphic */}
      <div className="mt-4 flex-1 flex flex-col justify-between relative font-sans">
        <div className="flex-1 flex flex-col justify-around py-1 space-y-3">
          {/* Row 1: Chart Modes & Types */}
          <div>
            <div className={`text-[8.5px] font-mono font-bold tracking-wider uppercase mb-1.5 ${isDark ? "text-slate-500" : "text-slate-600"
              }`}>CHART MODES &amp; TYPES</div>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isDark
                ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-indigo-50/60 hover:border-indigo-300"
                }`}>
                <BarChart2 className={`w-4 h-4 shrink-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                <span className="truncate">Chart &amp; 3D Mode</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isDark
                ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-indigo-50/60 hover:border-indigo-300"
                }`}>
                <PieChart className={`w-4 h-4 shrink-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                <span className="truncate">20+ Chart Types</span>
              </div>
            </div>
          </div>

          {/* Row 2: Template Presets & Layouts */}
          <div>
            <div className={`text-[8.5px] font-mono font-bold tracking-wider uppercase mb-1.5 ${isDark ? "text-slate-500" : "text-slate-600"
              }`}>TEMPLATES &amp; PRESETS</div>
            <div className="grid grid-cols-2 gap-2">
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isDark
                ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-indigo-50/60 hover:border-indigo-300"
                }`}>
                <Layout className={`w-4 h-4 shrink-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                <span className="truncate">Template Layouts</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isDark
                ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-indigo-50/60 hover:border-indigo-300"
                }`}>
                <Sparkles className={`w-4 h-4 shrink-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                <span className="truncate">Design Presets</span>
              </div>
            </div>
          </div>

          {/* Row 3: Cloud Sync, Save & Share */}
          <div>
            <div className={`text-[8.5px] font-mono font-bold tracking-wider uppercase mb-1.5 ${isDark ? "text-slate-500" : "text-slate-600"
              }`}>CLOUD &amp; EXPORT</div>
            <div className="grid grid-cols-3 gap-1.5">
              <div className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-semibold transition-colors ${isDark
                ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-indigo-50/60 hover:border-indigo-300"
                }`}>
                <Save className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                <span className="truncate">Save</span>
              </div>
              <div className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-semibold transition-colors ${isDark
                ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-indigo-50/60 hover:border-indigo-300"
                }`}>
                <FolderOpen className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                <span className="truncate">Load Cloud</span>
              </div>
              <div className={`flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-[11px] font-semibold transition-colors ${isDark
                ? "bg-indigo-600/25 border border-indigo-500/40 text-indigo-200"
                : "bg-white border border-slate-200 text-slate-900 shadow-2xs hover:bg-indigo-50/60 hover:border-indigo-300"
                }`}>
                <Share2 className={`w-3.5 h-3.5 shrink-0 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
                <span className="truncate">Share</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditorBento() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* Card 1: Decorate Design - Shapes & Overlays (lg:col-span-2) */}
      <div className="lg:col-span-2 flex">
        <DecorateDesignCard />
      </div>

      {/* Card 2: Editor Workspace Hub (col-span-1) */}
      <EditorWorkspaceHubCard />

      {/* Card 3: Cloud & Controls Hub (col-span-1) */}
      <CloudControlsHubCard />

      {/* Card 4: Aspect Ratio & Viewport Resizer (lg:col-span-2) */}
      <div className="lg:col-span-2 flex">
        <EditorOptionsCard />
      </div>

    </div>
  )
}

// ── BOARD BENTO ────────────────────────────────────────────
function BoardBento() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">

      {/* Left Tile: Canvas (2/3 width, full height) */}
      <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-sky-600 to-teal-600 p-7 flex flex-col justify-between min-h-[360px] overflow-hidden relative">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
        <div>
          <LayoutDashboard className="w-6 h-6 text-sky-200 mb-3" />
          <h3 className="text-xl md:text-2xl font-semibold text-white leading-snug whitespace-nowrap overflow-hidden text-ellipsis">
            One Interface to View all your creations and Assets
          </h3>
          <p className="mt-2 text-sky-100 text-xs md:text-sm leading-relaxed max-w-xl">
            Access, search, filter, and manage all your charts, templates, and visual assets in one centralized dashboard.
          </p>
        </div>
        {/* Glossy Animated Dashboard Mockup (90% Match to Dashboard Image 1) */}
        <div className="mt-5 rounded-2xl bg-slate-50/95 border border-white/30 p-3 shadow-2xl backdrop-blur-md relative overflow-hidden group/dash">
          {/* Subtle Ambient Glass Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/dash:animate-[shimmer_2s_infinite] pointer-events-none" />

          {/* Top Bar Navigation Mockup */}
          <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-200/80 text-slate-800">
            {/* Header Title + Tabs */}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm bg-gradient-to-br from-violet-600 to-indigo-600 shadow-xs animate-pulse" />
              <span className="text-[11px] font-extrabold text-slate-900 tracking-tight">Dashboard</span>
              <div className="hidden sm:flex items-center gap-1 ml-2 bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-bold text-slate-700">
                <span className="bg-white text-violet-700 px-1.5 py-0.5 rounded-md shadow-2xs">Single Chart <span className="text-[8px] bg-violet-100 text-violet-800 px-1 rounded-full ml-0.5">248</span></span>
                <span className="px-1.5 py-0.5 text-slate-500">Group Chart</span>
                <span className="px-1.5 py-0.5 text-slate-500">Templates</span>
              </div>
            </div>

            {/* Top Right Action Pills */}
            <div className="flex items-center gap-1">
              <div className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[8.5px] font-bold text-slate-700 shadow-2xs">My Charts</div>
              <div className="px-2 py-0.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[8.5px] font-extrabold shadow-xs flex items-center gap-1">
                <span>+ AI</span>
              </div>
            </div>
          </div>

          {/* Main Dashboard Layout Grid: 2 Left Cards + Right Sidebar */}
          <div className="grid grid-cols-12 gap-2">
            {/* Left Content Area (8 Cols) - 2 Charts Grid */}
            <div className="col-span-8 space-y-2">
              {/* Filter / Search Bar Row */}
              <div className="flex items-center justify-between gap-1.5 bg-white p-1.5 rounded-lg border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5 text-slate-400 text-[9px] flex-1 px-1">
                  <span>🔍</span>
                  <span className="text-slate-400 font-medium">Search charts...</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-semibold text-slate-600">
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">Type</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200">Sort</span>
                </div>
              </div>

              {/* 2 Chart Tiles Grid (Simple Clean Charts) */}
              <div className="grid grid-cols-2 gap-2">
                {/* Tile 1: Product Score Simple Bar Chart */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-2xs flex flex-col justify-between relative overflow-hidden group/tile1 hover:border-slate-300 transition-colors">
                  <div className="text-[9.5px] font-bold text-slate-800 tracking-tight">Product Score</div>

                  {/* Very Simple Clean Bar Chart Graphic */}
                  <div className="my-1.5 h-16 bg-slate-50 rounded-lg border border-slate-100 p-1 flex items-end justify-between gap-1">
                    <div className="w-1/6 bg-indigo-300 rounded-t-xs h-[30%] transition-all duration-300 group-hover/tile1:bg-indigo-400" />
                    <div className="w-1/6 bg-indigo-400 rounded-t-xs h-[50%] transition-all duration-300 group-hover/tile1:bg-indigo-500" />
                    <div className="w-1/6 bg-indigo-400 rounded-t-xs h-[75%] transition-all duration-300 group-hover/tile1:bg-indigo-500" />
                    <div className="w-1/6 bg-indigo-500 rounded-t-xs h-[65%] transition-all duration-300 group-hover/tile1:bg-indigo-600" />
                    <div className="w-1/6 bg-indigo-500 rounded-t-xs h-[85%] transition-all duration-300 group-hover/tile1:bg-indigo-600" />
                    <div className="w-1/6 bg-indigo-600 rounded-t-xs h-[100%]" />
                  </div>

                  {/* Tile Footer Pills */}
                  <div className="flex items-center justify-between pt-0.5 text-[7.5px] text-slate-400">
                    <span className="bg-slate-100 text-slate-600 font-bold px-1 py-0.5 rounded border border-slate-200">bar</span>
                    <span>800 × 600</span>
                  </div>
                </div>

                {/* Tile 2: Revenue Today Simple Line Chart */}
                <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-2xs flex flex-col justify-between relative overflow-hidden group/tile2 hover:border-slate-300 transition-colors">
                  <div className="text-[9.5px] font-bold text-slate-800 tracking-tight">Revenue Today</div>

                  {/* Very Simple Clean Line Chart Graphic */}
                  <div className="my-1.5 h-16 bg-slate-50 rounded-lg border border-slate-100 p-1.5 flex items-center justify-center relative overflow-hidden">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      {/* Area Fill Gradient under line */}
                      <path d="M 5 30 Q 25 10 45 22 T 85 8 L 85 35 L 5 35 Z" className="fill-sky-500/10" />
                      {/* Smooth Line Path */}
                      <path d="M 5 30 Q 25 10 45 22 T 85 8" className="stroke-sky-500 stroke-[2.5] stroke-linecap-round stroke-linejoin-round" />
                      {/* Line Points */}
                      <circle cx="5" cy="30" r="2" className="fill-white stroke-sky-500 stroke-[1.5]" />
                      <circle cx="25" cy="14" r="2" className="fill-white stroke-sky-500 stroke-[1.5]" />
                      <circle cx="45" cy="22" r="2" className="fill-white stroke-sky-500 stroke-[1.5]" />
                      <circle cx="65" cy="16" r="2" className="fill-white stroke-sky-500 stroke-[1.5]" />
                      <circle cx="85" cy="8" r="2" className="fill-white stroke-sky-500 stroke-[1.5]" />
                    </svg>
                  </div>

                  {/* Tile Footer Pills */}
                  <div className="flex items-center justify-between pt-0.5 text-[7.5px] text-slate-400">
                    <span className="bg-slate-100 text-slate-600 font-bold px-1 py-0.5 rounded border border-slate-200">line</span>
                    <span>800 × 900</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sidebar Area (4 Cols) - About + Chart Types */}
            <div className="col-span-4 space-y-2">
              {/* About Single Charts Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-2xs space-y-1.5">
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">About Single Charts</div>
                <div className="space-y-1 text-[8px] text-slate-600">
                  <div className="flex justify-between"><span>Total Created</span><span className="font-extrabold text-slate-900">248</span></div>
                  <div className="flex justify-between"><span>Active this week</span><span className="font-extrabold text-slate-900">34</span></div>
                  <div className="flex justify-between"><span>Weekly Average</span><span className="font-extrabold text-slate-900">28 avg</span></div>
                </div>
              </div>

              {/* Chart Types Breakdown */}
              <div className="bg-white rounded-xl border border-slate-200/90 p-2 shadow-2xs space-y-1.5">
                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Chart Types</div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="w-[42%] bg-violet-600" />
                  <div className="w-[28%] bg-sky-500" />
                  <div className="w-[18%] bg-emerald-500" />
                  <div className="w-[12%] bg-amber-400" />
                </div>
                <div className="grid grid-cols-2 gap-1 text-[7.5px] font-semibold text-slate-700 pt-0.5">
                  <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-violet-600" />Bar (42%)</div>
                  <div className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-sky-500" />Line (28%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: 2 Stacked Cards (1/3 width, Height Ratio 2:1) */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        {/* Top Right Card: Share, Preview, Download & Navigate (Height Ratio 2) */}
        <div className="flex-[2] rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between overflow-hidden min-h-[220px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <Share2 className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live Actions</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
              Share, Preview, Download &amp; Navigate
            </h3>
            <p className="mt-1.5 text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Share live public URLs, instantly preview charts, download high-res exports, and navigate your creations seamlessly.
            </p>

            {/* Quick Action Badges */}
            <div className="grid grid-cols-2 gap-2 mt-4 text-[10.5px] font-semibold">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                <Share2 className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                <span className="truncate">Share &amp; Embed</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                <Maximize2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">Quick Preview</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                <Save className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="truncate">Export Designs</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 shadow-2xs">
                <FolderOpen className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">Navigate &amp; Edit</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Right Card: Quick Tiles to View Your Design Trend (Height Ratio 1, Pure Text) */}
        <div className="flex-[1] rounded-2xl bg-slate-900 dark:bg-slate-800 p-5 flex flex-col justify-between overflow-hidden min-h-[110px]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="text-lg font-semibold text-white leading-snug">
                Quick Tiles to View Your Design Trend
              </h3>
              <TrendingUp className="w-4 h-4 text-violet-400 shrink-0" />
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Monitor chart creation metrics, active weekly designs, and visual category trends at a glance.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── CHART RENDERER HELPER ──────────────────────────────────
function ChartRenderer({ type, mode }: { type: string; mode: "single" | "grouped" }) {
  if (type === "bar") {
    return mode === "single" ? (
      <div className="w-full h-44 flex items-end justify-around gap-3 px-6">
        <div className="w-12 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg h-[45%] transition-all duration-500 hover:h-[55%]" />
        <div className="w-12 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg h-[70%] transition-all duration-500 hover:h-[80%]" />
        <div className="w-12 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg h-[55%] transition-all duration-500 hover:h-[65%]" />
        <div className="w-12 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg h-[90%] transition-all duration-500 hover:h-[100%]" />
        <div className="w-12 bg-gradient-to-t from-teal-600 to-teal-400 rounded-t-lg h-[65%] transition-all duration-500 hover:h-[75%]" />
      </div>
    ) : (
      <div className="w-full h-44 flex items-end justify-around gap-4 px-4">
        <div className="flex items-end gap-1.5 h-full">
          <div className="w-6 bg-teal-500 rounded-t-md h-[50%]" />
          <div className="w-6 bg-indigo-500 rounded-t-md h-[75%]" />
          <div className="w-6 bg-amber-400 rounded-t-md h-[40%]" />
        </div>
        <div className="flex items-end gap-1.5 h-full">
          <div className="w-6 bg-teal-500 rounded-t-md h-[70%]" />
          <div className="w-6 bg-indigo-500 rounded-t-md h-[90%]" />
          <div className="w-6 bg-amber-400 rounded-t-md h-[60%]" />
        </div>
        <div className="flex items-end gap-1.5 h-full">
          <div className="w-6 bg-teal-500 rounded-t-md h-[60%]" />
          <div className="w-6 bg-indigo-500 rounded-t-md h-[45%]" />
          <div className="w-6 bg-amber-400 rounded-t-md h-[80%]" />
        </div>
      </div>
    )
  }

  if (type === "pie") {
    return mode === "single" ? (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible transform -rotate-90">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#14b8a6" strokeWidth="20" strokeDasharray="125 251.2" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="20" strokeDasharray="75 251.2" strokeDashoffset="-125" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="51.2 251.2" strokeDashoffset="-200" />
        </svg>
      </div>
    ) : (
      <div className="flex items-center gap-6">
        <div className="relative w-36 h-36 flex flex-col items-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#14b8a6" strokeWidth="20" strokeDasharray="150 251.2" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="20" strokeDasharray="101.2 251.2" strokeDashoffset="-150" />
          </svg>
          <span className="text-[10px] text-slate-400 font-bold mt-1">Series A</span>
        </div>
        <div className="relative w-36 h-36 flex flex-col items-center">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f59e0b" strokeWidth="20" strokeDasharray="180 251.2" />
            <circle cx="50" cy="50" r="40" fill="transparent" stroke="#ec4899" strokeWidth="20" strokeDasharray="71.2 251.2" strokeDashoffset="-180" />
          </svg>
          <span className="text-[10px] text-slate-400 font-bold mt-1">Series B</span>
        </div>
      </div>
    )
  }

  if (type === "horizontal-bar") {
    return mode === "single" ? (
      <div className="w-full space-y-3 px-6">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold"><span>Category A</span><span>85%</span></div>
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full w-[85%]" /></div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold"><span>Category B</span><span>62%</span></div>
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full w-[62%]" /></div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold"><span>Category C</span><span>44%</span></div>
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-teal-500 rounded-full w-[44%]" /></div>
        </div>
      </div>
    ) : (
      <div className="w-full space-y-3 px-6">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold"><span>Region North</span></div>
          <div className="flex gap-1 h-3.5">
            <div className="h-full bg-teal-500 rounded-l-md w-[50%]" />
            <div className="h-full bg-indigo-500 rounded-r-md w-[35%]" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold"><span>Region South</span></div>
          <div className="flex gap-1 h-3.5">
            <div className="h-full bg-teal-500 rounded-l-md w-[65%]" />
            <div className="h-full bg-indigo-500 rounded-r-md w-[25%]" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold"><span>Region West</span></div>
          <div className="flex gap-1 h-3.5">
            <div className="h-full bg-teal-500 rounded-l-md w-[40%]" />
            <div className="h-full bg-indigo-500 rounded-r-md w-[45%]" />
          </div>
        </div>
      </div>
    )
  }

  if (type === "donut") {
    return mode === "single" ? (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#14b8a6" strokeWidth="14" strokeDasharray="140 238.7" />
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#6366f1" strokeWidth="14" strokeDasharray="60 238.7" strokeDashoffset="-140" />
          <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f59e0b" strokeWidth="14" strokeDasharray="38.7 238.7" strokeDashoffset="-200" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
          <span className="text-sm font-extrabold text-slate-800 dark:text-white">$248.5K</span>
        </div>
      </div>
    ) : (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#14b8a6" strokeWidth="8" strokeDasharray="160 251.2" />
          <circle cx="50" cy="50" r="40" fill="transparent" stroke="#6366f1" strokeWidth="8" strokeDasharray="91.2 251.2" strokeDashoffset="-160" />
          <circle cx="50" cy="50" r="28" fill="transparent" stroke="#f59e0b" strokeWidth="8" strokeDasharray="100 175.9" />
          <circle cx="50" cy="50" r="28" fill="transparent" stroke="#ec4899" strokeWidth="8" strokeDasharray="75.9 175.9" strokeDashoffset="-100" />
        </svg>
        <div className="absolute text-[9px] font-bold text-slate-400">Multi-Ring</div>
      </div>
    )
  }

  if (type === "radar") {
    return (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <polygon points="50,10 90,38 75,85 25,85 10,38" fill="none" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-700" />
          <polygon points="50,25 75,42 66,73 34,73 25,42" fill="none" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-700" />
          <polygon points="50,40 60,49 56,61 44,61 40,49" fill="none" stroke="#cbd5e1" strokeWidth="1" className="dark:stroke-slate-700" />
          <polygon points="50,15 82,40 70,78 30,70 18,36" fill="rgba(20, 184, 166, 0.35)" stroke="#14b8a6" strokeWidth="2" />
          {mode === "grouped" && (
            <polygon points="50,28 72,48 60,82 40,75 22,45" fill="rgba(99, 102, 241, 0.35)" stroke="#6366f1" strokeWidth="2" />
          )}
        </svg>
      </div>
    )
  }

  if (type === "polar") {
    return (
      <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible transform -rotate-90">
          <circle cx="50" cy="50" r="42" fill="rgba(20, 184, 166, 0.3)" stroke="#14b8a6" strokeWidth="1" />
          <circle cx="50" cy="50" r="32" fill="rgba(99, 102, 241, 0.4)" stroke="#6366f1" strokeWidth="1" />
          <circle cx="50" cy="50" r="22" fill="rgba(245, 158, 11, 0.5)" stroke="#f59e0b" strokeWidth="1" />
        </svg>
      </div>
    )
  }

  if (type === "3d-bar") {
    return (
      <div className="w-full h-44 flex items-center justify-center gap-6 px-4">
        <div className="relative w-10 h-32 flex flex-col justify-end">
          <div className="w-full h-[60%] bg-teal-500 relative transform -skew-y-12 rounded-t-xs">
            <div className="absolute top-0 right-0 h-full w-2 bg-teal-600 transform skew-y-12 origin-top-right" />
            <div className="absolute top-0 left-0 w-full h-2 bg-teal-300 transform -skew-x-12 origin-top-left" />
          </div>
        </div>
        <div className="relative w-10 h-32 flex flex-col justify-end">
          <div className="w-full h-[85%] bg-indigo-500 relative transform -skew-y-12 rounded-t-xs">
            <div className="absolute top-0 right-0 h-full w-2 bg-indigo-600 transform skew-y-12 origin-top-right" />
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-300 transform -skew-x-12 origin-top-left" />
          </div>
        </div>
        <div className="relative w-10 h-32 flex flex-col justify-end">
          <div className="w-full h-[45%] bg-amber-400 relative transform -skew-y-12 rounded-t-xs">
            <div className="absolute top-0 right-0 h-full w-2 bg-amber-500 transform skew-y-12 origin-top-right" />
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-200 transform -skew-x-12 origin-top-left" />
          </div>
        </div>
      </div>
    )
  }

  if (type === "scatter" || type === "bubble") {
    return (
      <div className="w-full h-44 relative bg-slate-200/50 dark:bg-slate-950/50 rounded-xl border border-slate-300 dark:border-slate-800 p-4">
        <div className="absolute bottom-4 left-4 right-4 h-px bg-slate-300 dark:bg-slate-700" />
        <div className="absolute top-4 bottom-4 left-4 w-px bg-slate-300 dark:bg-slate-700" />
        <div className="absolute bottom-10 left-12 w-4 h-4 rounded-full bg-teal-500/80 shadow-xs" />
        <div className="absolute bottom-20 left-24 w-6 h-6 rounded-full bg-teal-500/80 shadow-xs" />
        <div className="absolute bottom-14 left-44 w-3 h-3 rounded-full bg-teal-500/80" />
        <div className="absolute bottom-28 left-56 w-7 h-7 rounded-full bg-teal-500/80 shadow-xs" />
        {mode === "grouped" && (
          <>
            <div className="absolute bottom-16 left-16 w-5 h-5 rounded-full bg-indigo-500/80 shadow-xs" />
            <div className="absolute bottom-24 left-36 w-4 h-4 rounded-full bg-indigo-500/80" />
            <div className="absolute bottom-8 left-48 w-6 h-6 rounded-full bg-indigo-500/80 shadow-xs" />
          </>
        )}
      </div>
    )
  }

  if (type === "stacked-bar") {
    return (
      <div className="w-full h-44 flex items-end justify-around gap-6 px-8">
        <div className="w-10 h-[80%] flex flex-col justify-end rounded-t-lg overflow-hidden">
          <div className="h-[40%] bg-teal-500" />
          <div className="h-[35%] bg-indigo-500" />
          <div className="h-[25%] bg-amber-400" />
        </div>
        <div className="w-10 h-[95%] flex flex-col justify-end rounded-t-lg overflow-hidden">
          <div className="h-[50%] bg-teal-500" />
          <div className="h-[30%] bg-indigo-500" />
          <div className="h-[20%] bg-amber-400" />
        </div>
        <div className="w-10 h-[65%] flex flex-col justify-end rounded-t-lg overflow-hidden">
          <div className="h-[30%] bg-teal-500" />
          <div className="h-[40%] bg-indigo-500" />
          <div className="h-[30%] bg-amber-400" />
        </div>
      </div>
    )
  }

  if (type === "funnel") {
    return (
      <div className="w-full h-44 flex flex-col items-center justify-center gap-1.5 px-12">
        <div className="w-full h-7 bg-teal-500 rounded-md flex items-center justify-center text-[10px] text-white font-bold">100% Leads</div>
        <div className="w-[80%] h-7 bg-teal-600 rounded-md flex items-center justify-center text-[10px] text-white font-bold">75% Prospects</div>
        <div className="w-[60%] h-7 bg-indigo-500 rounded-md flex items-center justify-center text-[10px] text-white font-bold">45% Offers</div>
        <div className="w-[40%] h-7 bg-indigo-600 rounded-md flex items-center justify-center text-[10px] text-white font-bold">25% Deals</div>
      </div>
    )
  }

  if (type === "heatmap" || type === "treemap") {
    return (
      <div className="w-full h-44 grid grid-cols-4 gap-1.5 p-2">
        <div className="bg-teal-600 rounded-md flex items-center justify-center text-[10px] text-white font-bold">92</div>
        <div className="bg-teal-400 rounded-md flex items-center justify-center text-[10px] text-white font-bold">45</div>
        <div className="bg-indigo-500 rounded-md flex items-center justify-center text-[10px] text-white font-bold">78</div>
        <div className="bg-amber-400 rounded-md flex items-center justify-center text-[10px] text-white font-bold">30</div>
        <div className="bg-indigo-600 rounded-md flex items-center justify-center text-[10px] text-white font-bold">88</div>
        <div className="bg-teal-500 rounded-md flex items-center justify-center text-[10px] text-white font-bold">64</div>
        <div className="bg-teal-300 rounded-md flex items-center justify-center text-[10px] text-slate-900 font-bold">22</div>
        <div className="bg-indigo-400 rounded-md flex items-center justify-center text-[10px] text-white font-bold">50</div>
      </div>
    )
  }

  return (
    <div className="w-full h-44 relative flex items-center justify-center">
      <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40" fill="none">
        <path d="M 5 30 Q 25 10 45 22 T 85 8 L 85 35 L 5 35 Z" fill={type === "area" ? "url(#areaGradSection)" : "none"} />
        <path d="M 5 30 Q 25 10 45 22 T 85 8" stroke="#14b8a6" strokeWidth="2.5" strokeLinecap="round" />
        {mode === "grouped" && (
          <path d="M 5 20 Q 25 32 45 14 T 85 18" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="3 3" />
        )}
        <circle cx="5" cy="30" r="2.5" fill="#ffffff" stroke="#14b8a6" strokeWidth="1.5" />
        <circle cx="25" cy="14" r="2.5" fill="#ffffff" stroke="#14b8a6" strokeWidth="1.5" />
        <circle cx="45" cy="22" r="2.5" fill="#ffffff" stroke="#14b8a6" strokeWidth="1.5" />
        <circle cx="65" cy="16" r="2.5" fill="#ffffff" stroke="#14b8a6" strokeWidth="1.5" />
        <circle cx="85" cy="8" r="2.5" fill="#ffffff" stroke="#14b8a6" strokeWidth="1.5" />
        <defs>
          <linearGradient id="areaGradSection" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// ── CHARTS SHOWCASE SECTION ─────────────────────────────────
function ChartsShowcaseSection() {
  const [mode, setMode] = useState<"single" | "grouped">("single")
  const [selectedType, setSelectedType] = useState<string>("bar")

  // 5 example charts for preview cycling
  const exampleTypes = [
    { id: "bar", label: "Bar" },
    { id: "line", label: "Line" },
    { id: "pie", label: "Pie" },
    { id: "donut", label: "Donut" },
    { id: "horizontal-bar", label: "Horizontal Bar" },
  ]

  // All supported chart types in clean logical order
  const supportedChartTypes = [
    { id: "bar", label: "Bar", icon: BarChart2 },
    { id: "line", label: "Line", icon: TrendingUp },
    { id: "area", label: "Area", icon: Activity },
    { id: "pie", label: "Pie", icon: PieChart },
    { id: "donut", label: "Donut", icon: CircleDot },
    { id: "horizontal-bar", label: "Horizontal Bar", icon: AlignLeft },
    { id: "stacked-bar", label: "Stacked Bar", icon: Layers },
    { id: "radar", label: "Radar", icon: Hexagon },
    { id: "polar", label: "Polar", icon: Target },
    { id: "scatter", label: "Scatter", icon: Sparkles },
    { id: "bubble", label: "Bubble", icon: Circle },
    { id: "3d-bar", label: "3D Bar", icon: Box },
    { id: "3d-pie", label: "3D Pie", icon: PieChart },
    { id: "3d-donut", label: "3D Donut", icon: CircleDot },
    { id: "gauge", label: "Gauge", icon: Gauge },
    { id: "funnel", label: "Funnel", icon: Filter },
    { id: "waterfall", label: "Waterfall", icon: BarChart2 },
  ]

  const currentIndex = exampleTypes.findIndex(c => c.id === selectedType)

  const handlePrev = () => {
    const nextIdx = (currentIndex - 1 + exampleTypes.length) % exampleTypes.length
    setSelectedType(exampleTypes[nextIdx].id)
  }

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % exampleTypes.length
    setSelectedType(exampleTypes[nextIdx].id)
  }

  return (
    <div className="mt-24 pt-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* Left Side (Vertically centered to match reference image) */}
        <div className="lg:col-span-6 space-y-5">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              Charts
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-md">
              Create publication-ready single and grouped chart visualizations tailored to your dataset in seconds.
            </p>
          </div>

          <ul className="space-y-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium list-disc list-inside marker:text-slate-800 dark:marker:text-slate-200">
            <li>Get Realtime Data.</li>
            <li>Choose from different chart Preset/Theme as per Your wish.</li>
            <li>Supports Grouped Dataset for Professional Presentations.</li>
            <li>Supports 17+ Chart types to choose as per your need.</li>
          </ul>

          {/* Bottom Row: Horizontal icon tags */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1 pb-0.5">
            {supportedChartTypes.map((c) => {
              const Icon = c.icon
              return (
                <div
                  key={c.id}
                  title={c.label}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0 select-none hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-600 dark:text-slate-400" />
                  <span>{c.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Side: Clean Light Floating Preview Container */}
        <div className="lg:col-span-6 flex flex-col items-end justify-between">
          {/* Top Radio Switch */}
          <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="chart-mode-clean"
                checked={mode === "single"}
                onChange={() => setMode("single")}
                className="w-3.5 h-3.5 text-teal-600 focus:ring-teal-500"
              />
              Single
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="radio"
                name="chart-mode-clean"
                checked={mode === "grouped"}
                onChange={() => setMode("grouped")}
                className="w-3.5 h-3.5 text-teal-600 focus:ring-teal-500"
              />
              Grouped
            </label>
          </div>

          {/* Floating Card Box with Taller Height, Floating Buttons & Pure Chart View */}
          <div className="w-full max-w-lg h-[330px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-lg flex items-center justify-center relative overflow-hidden group">
            {/* Pure Chart Renderer View */}
            <div className="w-full h-full flex items-center justify-center p-2">
              <ChartRenderer type={selectedType} mode={mode} />
            </div>

            {/* Left Floating Arrow Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous chart"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all shadow-md cursor-pointer z-10"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>

            {/* Left Floating Arrow Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous chart"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all shadow-md cursor-pointer z-10"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>

            {/* Right Floating Arrow Button */}
            <button
              onClick={handleNext}
              aria-label="Next chart"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all shadow-md cursor-pointer z-10"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── TEMPLATE PREVIEW HELPER ──────────────────────────────────
function TemplatePreviewRenderer({ templateId }: { templateId: string }) {
  if (templateId === "infographic-pro") {
    return (
      <div className="w-full h-full bg-white dark:bg-slate-950 rounded-xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between shadow-xs transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">2026 Infographic Report</span>
          </div>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 font-mono font-semibold">Pro Preset</span>
        </div>
        <div className="grid grid-cols-3 gap-2 my-2">
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-[9px] text-slate-500">Revenue</div>
            <div className="text-xs font-extrabold text-teal-600 dark:text-teal-400">$84.2K</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-[9px] text-slate-500">Growth</div>
            <div className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">+42%</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-[9px] text-slate-500">Accuracy</div>
            <div className="text-xs font-extrabold text-purple-600 dark:text-purple-400">99.4%</div>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 dark:bg-slate-900 rounded-lg p-2 flex items-end justify-between gap-1.5 border border-slate-100 dark:border-slate-800">
          <div className="w-1/5 bg-teal-500 rounded-t h-[40%]" />
          <div className="w-1/5 bg-teal-500 rounded-t h-[75%]" />
          <div className="w-1/5 bg-teal-500 rounded-t h-[55%]" />
          <div className="w-1/5 bg-teal-500 rounded-t h-[90%]" />
          <div className="w-1/5 bg-teal-600 rounded-t h-[65%]" />
        </div>
      </div>
    )
  }

  if (templateId === "executive-report") {
    return (
      <div className="w-full h-full bg-slate-900 text-white rounded-xl p-3 sm:p-4 border border-slate-800 flex flex-col justify-between shadow-xs transition-all">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <span className="text-[11px] font-bold text-slate-200">Executive Briefing</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-900 text-indigo-200 font-mono font-semibold">16:9 Landscape</span>
        </div>
        <div className="flex gap-3 my-2 items-center flex-1">
          <div className="w-1/2 space-y-2">
            <div className="h-2 w-3/4 bg-slate-700 rounded" />
            <div className="h-2 w-full bg-slate-800 rounded" />
            <div className="h-2 w-5/6 bg-slate-800 rounded" />
            <div className="h-6 w-full bg-indigo-600/30 rounded border border-indigo-500/40 mt-3 flex items-center px-2 text-[9px] text-indigo-300">
              AI Summary Zone Active
            </div>
          </div>
          <div className="w-1/2 h-full bg-slate-800/80 rounded-lg p-2 flex items-center justify-center">
            <svg viewBox="0 0 100 60" className="w-full h-full">
              <path d="M 10 50 Q 30 10 50 35 T 90 15" fill="none" stroke="#818cf8" strokeWidth="3" />
              <circle cx="90" cy="15" r="4" fill="#818cf8" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (templateId === "dark-minimal") {
    return (
      <div className="w-full h-full bg-slate-950 text-white rounded-xl p-3 sm:p-4 border border-purple-900/40 flex flex-col justify-between shadow-xs transition-all">
        <div className="flex items-center justify-between border-b border-purple-900/30 pb-2">
          <span className="text-[11px] font-bold text-purple-300">Neon Glass Minimal</span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 font-mono font-semibold">Dark Mode</span>
        </div>
        <div className="flex-1 my-2 bg-purple-950/20 rounded-lg p-3 border border-purple-800/30 flex flex-col justify-between">
          <div className="flex justify-between items-center text-[10px] text-purple-200">
            <span>Performance Index</span>
            <span className="text-purple-400 font-bold">98.5</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden my-2">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[85%]" />
          </div>
          <div className="text-[9px] text-slate-400">Tailored AI Insights Zone Included</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-emerald-950/20 dark:bg-emerald-950/40 text-slate-800 dark:text-emerald-100 rounded-xl p-3 sm:p-4 border border-emerald-500/30 flex flex-col justify-between shadow-xs transition-all">
      <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">AI Storyboard Poster</span>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-mono font-semibold">Custom Zones</span>
      </div>
      <div className="grid grid-cols-2 gap-2 my-2 flex-1">
        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-500/20 flex flex-col justify-between">
          <div className="text-[9px] font-bold text-emerald-600">Chart Zone A</div>
          <div className="h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded w-3/4" />
          <div className="h-1.5 bg-emerald-300 dark:bg-emerald-700 rounded w-1/2" />
        </div>
        <div className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-emerald-500/20 flex flex-col justify-between">
          <div className="text-[9px] font-bold text-emerald-600">Text Zone B</div>
          <div className="h-1.5 bg-emerald-200 dark:bg-emerald-800 rounded w-full" />
          <div className="h-1.5 bg-emerald-300 dark:bg-emerald-700 rounded w-4/5" />
        </div>
      </div>
    </div>
  )
}

// ── TEMPLATES SHOWCASE SECTION ───────────────────────────────
function TemplatesShowcaseSection() {
  const [activeTemplateIdx, setActiveTemplateIdx] = useState(0)

  const templates = [
    { id: "infographic-pro", title: "Infographic Pro" },
    { id: "executive-report", title: "Executive Report" },
    { id: "dark-minimal", title: "Dark Minimal Glass" },
    { id: "ai-storyboard", title: "AI Storyboard Poster" },
  ]

  const handlePrev = () => {
    setActiveTemplateIdx((prev) => (prev - 1 + templates.length) % templates.length)
  }

  const handleNext = () => {
    setActiveTemplateIdx((prev) => (prev + 1) % templates.length)
  }

  return (
    <div className="mt-20 sm:mt-24 pt-6 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

        {/* Left Side: Fixed-Size Preview Box (Matching Previous Section Box Size) */}
        <div className="lg:col-span-6 flex flex-col items-start w-full">
          <div className="w-full max-w-lg h-[330px] bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg flex items-center justify-center relative overflow-hidden group">

            {/* Template Graphic Renderer */}
            <div className="w-full h-full flex flex-col justify-between overflow-hidden">
              <TemplatePreviewRenderer templateId={templates[activeTemplateIdx].id} />
            </div>

            {/* Left Floating Chevron Button */}
            <button
              onClick={handlePrev}
              aria-label="Previous template"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all shadow-md cursor-pointer z-10"
            >
              <ChevronLeft className="w-4.5 h-4.5" />
            </button>

            {/* Right Floating Chevron Button */}
            <button
              onClick={handleNext}
              aria-label="Next template"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8.5 h-8.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 hover:scale-105 transition-all shadow-md cursor-pointer z-10"
            >
              <ChevronRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Right Side: Text & Bullet Points (Matching Wireframe Image 1:1) */}
        <div className="lg:col-span-6 space-y-4 max-w-full overflow-hidden">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight break-words">
              Templates
            </h2>
            <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-md break-words font-normal">
              Create publication-ready, pro infographic chart templates with intelligent layouts in a single click
            </p>
          </div>

          <ul className="space-y-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-medium list-disc list-inside marker:text-slate-800 dark:marker:text-slate-200 break-words">
            <li>Explore templates across a variety of themes and aspect ratios.</li>
            <li>Design Customized High Quality Templates with dedicated Tools</li>
            <li>Design eye-catching graphics inside templates with Decoration tools</li>
            <li>Get Tailored AI response from created Templates Zones</li>
          </ul>
        </div>

      </div>
    </div>
  )
}

// ── MAIN PAGE ──────────────────────────────────────────────
export default function HomeNewPage() {
  const [activeTab, setActiveTab] = useState("ai-chat")

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 relative overflow-hidden">

      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="animate-float-slow absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px]" />
        <div className="animate-float-medium absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <SiteHeader />

      <main className="relative z-10">

        {/* ── HERO ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-10 items-center mt-4 lg:mt-6">

            <div className="lg:col-span-4 space-y-5 text-left">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white">
                Generate &amp; Style <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                  Charts with AI
                </span>
              </h1>
              <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed font-light max-w-md">
                Chartography.in merges powerful conversational AI generation with a pixel-perfect design editor. Describe your data story in plain English, apply professional templates, and fine-tune styling to match your brand.
              </p>
            </div>

            <div className="lg:col-span-3 relative h-[380px] lg:h-[420px]">
              <div className="absolute top-10 right-0 z-10 w-[90%] rounded-2xl overflow-hidden shadow-2xl border border-slate-200/40 dark:border-slate-700/40 group">
                <img src="/chart-preview.png" alt="AI Generated Chart" className="w-full h-auto object-cover group-hover:scale-[1.012] transition-transform duration-500 ease-out" />
              </div>
              <div className="absolute top-0 left-0 z-20 w-[82%] bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl px-3.5 py-2.5 flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
                <span className="flex-1 text-sm text-slate-500 dark:text-slate-400 font-mono truncate">Show top 10 highest-grossing Hollywood films...</span>
                <button className="shrink-0 w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center transition-colors duration-200 shadow-md shadow-indigo-500/30">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES SECTION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">

          {/* Heading */}
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              One platform for your entire charting workflow
            </h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-base font-light transition-all duration-200">
              {SUBTITLES[activeTab]}
            </p>
          </div>

          {/* Tab bar */}
          <div className="flex justify-center mb-8 overflow-x-auto pb-1">
            <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1.5 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${activeTab === id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm border border-slate-200/60 dark:border-slate-600"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Bento grid per tab content */}
          <div key={activeTab} className="mt-12 animate-in fade-in duration-300">
            {activeTab === "ai-chat" && <AiChatBento />}
            {activeTab === "editor" && <EditorBento />}
            {activeTab === "board" && <BoardBento />}
          </div>

          {/* New Charts Showcase Section */}
          <ChartsShowcaseSection />

          {/* New Templates Showcase Section */}
          <TemplatesShowcaseSection />

          {/* Standalone duplicate boxes completely below the sections */}
          <div className="mt-24 pt-16 font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto items-start">
              <div className="flex">
                <AdvancedControlsCard />
              </div>
              <div className="flex">
                <AspectResizerCard />
              </div>
              <div className="flex">
                <CloudExportShareCard />
              </div>
            </div>

            {/* Pricing Section directly below the 3-card row */}
            <PricingSection />
          </div>

        </section>

      </main>

      {/* Site Footer */}
      <SiteFooter />
    </div>
  )
}
