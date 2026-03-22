"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowRight,
  BarChart3,
  Edit3,
  LayoutDashboard,
  MessageSquare,
  Play,
  Share2,
  Sparkles,
  Download,
  Wand2,
  TrendingUp,
  Palette,
  Cloud,
  CheckCircle,
  ArrowUpRight,
  Layers,
  PieChart,
  LineChart,
  BarChart4,
  Brain,
  Rocket,
  Target,
  Zap,
  MousePointerClick,
  X
} from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState<boolean>(false)

  // Only show welcome banner once per session
  useEffect(() => {
    if (typeof window === 'undefined') return
    const shown = sessionStorage.getItem('welcomeShown')
    if (!shown) {
      setShowWelcome(true)
      sessionStorage.setItem('welcomeShown', '1')
    }
  }, [])

  // Handle OAuth success redirect
  useEffect(() => {
    const oauthSuccess = searchParams.get('oauth')
    if (oauthSuccess === 'success') {
      const url = new URL(window.location.href)
      url.searchParams.delete('oauth')
      window.history.replaceState({}, '', url.toString())
      toast.success('Successfully signed in with Google!')
      const timer = setTimeout(() => setShowWelcome(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  // Auto-hide welcome banner after 5 seconds for existing users
  useEffect(() => {
    if (user && showWelcome) {
      const timer = setTimeout(() => setShowWelcome(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [user, showWelcome])

  const capabilities = [
    {
      icon: Brain,
      title: "Conversational AI",
      description: "Simply describe your data story. Our AI understands context, suggests optimal chart types, and creates publication-ready visualizations instantly.",
      gradient: "from-blue-500 to-cyan-400",
      bgGlow: "bg-blue-500/10"
    },
    {
      icon: Edit3,
      title: "Advanced Editor",
      description: "Fine-tune every detail with our comprehensive visual editor. Adjust datasets, styling, animations, overlays, and responsive behavior.",
      gradient: "from-purple-500 to-pink-400",
      bgGlow: "bg-purple-500/10"
    },
    {
      icon: LayoutDashboard,
      title: "Smart Dashboard",
      description: "Organize, manage, and analyze all your charts in one place. Track usage, share publicly, and maintain version history.",
      gradient: "from-emerald-500 to-teal-400",
      bgGlow: "bg-emerald-500/10"
    },
    {
      icon: Share2,
      title: "Universal Export",
      description: "Export as PNG, responsive HTML, or embed codes. Perfect for presentations, websites, dashboards, and marketing materials.",
      gradient: "from-orange-500 to-amber-400",
      bgGlow: "bg-orange-500/10"
    }
  ]

  const chartTypes = [
    { icon: BarChart4, name: "Bar Charts", color: "from-blue-500 to-blue-600", bg: "bg-blue-50" },
    { icon: LineChart, name: "Line Charts", color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50" },
    { icon: PieChart, name: "Pie Charts", color: "from-purple-500 to-purple-600", bg: "bg-purple-50" },
    { icon: TrendingUp, name: "Area Charts", color: "from-orange-500 to-orange-600", bg: "bg-orange-50" },
    { icon: Target, name: "Radar Charts", color: "from-pink-500 to-pink-600", bg: "bg-pink-50" },
    { icon: Layers, name: "Mixed Charts", color: "from-indigo-500 to-indigo-600", bg: "bg-indigo-50" }
  ]

  const workflow = [
    {
      step: "01",
      title: "Describe Your Vision",
      description: "Tell our AI what you want to visualize. Upload CSV data, paste text, or simply describe your chart in natural language.",
      icon: MessageSquare,
      color: "from-blue-500 to-blue-600"
    },
    {
      step: "02",
      title: "AI Creates & You Refine",
      description: "Watch as AI generates your chart instantly. Then use our advanced editor to perfect colors, layouts, animations, and interactive elements.",
      icon: Wand2,
      color: "from-purple-500 to-purple-600"
    },
    {
      step: "03",
      title: "Export & Share",
      description: "Download high-quality images, get responsive HTML code, or share via public links. Your charts work everywhere, on any device.",
      icon: Rocket,
      color: "from-emerald-500 to-emerald-600"
    }
  ]

  const stats = [
    { number: "10+", label: "Chart Types", icon: BarChart3 },
    { number: "50+", label: "Customizations", icon: Palette },
    { number: "3", label: "Export Formats", icon: Download },
    { number: "∞", label: "Possibilities", icon: Sparkles }
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
      <SiteHeader />

{/* Animations moved to globals.css */}

      {/* Loading State */}
      {loading && !user && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading AIChartor...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {(!loading || !!user) && (
        <>
          {/* Floating Welcome Popup for Authenticated Users */}
          {user && showWelcome && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] animate-pop-in pointer-events-auto">
              <div className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-indigo-500/20 rounded-2xl p-1 shadow-2xl shadow-indigo-500/20 max-w-sm w-full mx-auto ring-1 ring-white/20">
                <div className="flex items-center justify-between gap-4 pl-3 pr-2 py-1.5">
                  <div className="flex items-center gap-3">
                    {user.avatar_url ? (
                      <div className="relative">
                        <Image
                          src={user.avatar_url}
                          alt="Profile"
                          width={36}
                          height={36}
                          className="rounded-xl ring-2 ring-indigo-500/20 object-cover"
                          referrerPolicy="no-referrer"
                          priority
                        />
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {user.full_name?.[0] || user.email?.[0] || 'U'}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">
                        Welcome back, {user.full_name?.split(' ')[0] || user.email?.split('@')[0]}!
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px] px-1.5 py-0 h-4 font-medium">
                          Ready to create
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ─── HERO SECTION ─── */}
          <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 transition-colors duration-300">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="animate-float-slow absolute -top-24 -left-24 w-[420px] h-[420px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/20 blur-[100px]"></div>
              <div className="animate-float-medium absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full bg-purple-500/10 dark:bg-purple-600/20 blur-[100px]"></div>
              <div className="animate-float-fast absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-cyan-400/10 dark:bg-cyan-500/15 blur-[100px]"></div>
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

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
              <div className="text-center space-y-8">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-white/5 border border-indigo-100 dark:border-white/10 backdrop-blur-sm text-indigo-600 dark:text-indigo-300 text-sm font-medium transition-colors">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Chart Creation Platform
                  <ArrowRight className="w-3 h-3 ml-1" />
                </div>

                {/* Headline */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight leading-[1.05]">
                  <span className="block text-slate-900 dark:text-white transition-colors">Transform Data Into</span>
                  <span className="block bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 dark:from-indigo-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent animate-gradient-x">
                    Stunning Visuals
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="max-w-2xl mx-auto text-lg sm:text-xl text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                  Create professional charts in seconds with AI, then perfect them with our advanced editor.
                  From natural language to publication-ready visualizations.
                </p>

                {/* CTA buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Button asChild size="lg" className="px-8 py-6 text-base font-semibold bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:from-indigo-600 hover:via-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl">
                    <Link href="/landing">
                      <Play className="w-5 h-5 mr-2" />
                      Start Creating with AI
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>

                  {user ? (
                    <Button asChild size="lg" variant="outline" className="px-8 py-6 text-base font-semibold bg-transparent border-slate-200 dark:border-white/20 text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 rounded-xl">
                      <Link href="/board">
                        <LayoutDashboard className="w-5 h-5 mr-2" />
                        View Dashboard
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild size="lg" variant="outline" className="px-8 py-6 text-base font-semibold bg-transparent border-slate-200 dark:border-white/20 text-slate-700 dark:text-white hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/10 backdrop-blur-sm transition-all duration-300 rounded-xl">
                      <Link href="/editor">
                        <Edit3 className="w-5 h-5 mr-2" />
                        Try Advanced Editor
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Trust indicators */}
                <div className="flex items-center justify-center gap-6 text-slate-500 text-sm pt-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    No credit card required
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Charts in seconds
                  </span>
                  <span className="hidden md:flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-cyan-400" />
                    Cloud sync included
                  </span>
                </div>
              </div>
            </div>

            {/* Curved bottom separator */}
            <div className="absolute bottom-0 left-0 right-0">
              <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full text-white dark:text-slate-950 transition-colors duration-300">
                <path d="M0 60L1440 60L1440 0C1440 0 1080 40 720 40C360 40 0 0 0 0L0 60Z" fill="currentColor"/>
              </svg>
            </div>
          </section>

          {/* ─── STATS SECTION (Glassmorphism) ─── */}
          <section className="py-16 sm:py-20 bg-white dark:bg-slate-950 transition-colors duration-300 relative">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="group relative p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 hover:-translate-y-1"
                  >
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/50 group-hover:scale-110 transition-transform duration-300">
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">{stat.number}</div>
                      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── CHART TYPES SHOWCASE ─── */}
          <section className="py-20 sm:py-24 bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <Badge className="mb-4 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-500/20 font-medium transition-colors">
                  Comprehensive Chart Library
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">
                  Every Chart Type You Need
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
                  From simple bar charts to complex mixed visualizations. Our AI understands your data and suggests the perfect chart type.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
                {chartTypes.map((chart, index) => (
                  <div
                    key={index}
                    className="group cursor-pointer"
                  >
                    <div className={`relative rounded-2xl p-6 sm:p-8 ${chart.bg} dark:bg-slate-900 border border-transparent dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2`}>
                      <div className="text-center space-y-3">
                        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${chart.color} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                          <chart.icon className="w-7 h-7" />
                        </div>
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 text-sm transition-colors">{chart.name}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── CAPABILITIES BENTO GRID ─── */}
          <section className="py-20 sm:py-24 bg-white dark:bg-slate-950 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-14">
                <Badge className="mb-4 px-4 py-1.5 bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200/50 dark:border-purple-500/20 font-medium transition-colors">
                  Platform Capabilities
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">
                  Everything You Need in One Platform
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
                  Combine the power of AI with professional design tools for the complete data visualization workflow.
                </p>
              </div>

              {/* Bento Grid: 2 large on top, 2 below */}
              <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
                {capabilities.map((cap, index) => (
                  <div
                    key={index}
                    className={`group relative rounded-3xl border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 hover:-translate-y-1 ${index < 2 ? 'p-8 sm:p-10' : 'p-7 sm:p-9'}`}
                  >
                    {/* Top gradient accent */}
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cap.gradient}`}></div>

                    {/* Glow on hover */}
                    <div className={`absolute top-0 right-0 w-32 h-32 ${cap.bgGlow} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                    <div className="relative space-y-4">
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${cap.gradient} text-white shadow-lg`}>
                        <cap.icon className="w-6 h-6" />
                      </div>
                      <h3 className={`font-bold text-slate-900 dark:text-white transition-colors ${index < 2 ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'}`}>
                        {cap.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed transition-colors">
                        {cap.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── WORKFLOW TIMELINE ─── */}
          <section className="py-20 sm:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 transition-colors duration-300 relative overflow-hidden">
            {/* Subtle background decoration */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-50 dark:bg-indigo-950/30 blur-[120px] opacity-50 dark:opacity-30"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4 px-4 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-500/20 font-medium transition-colors">
                  Simple Workflow
                </Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight transition-colors">
                  From Idea to Impact in Minutes
                </h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto transition-colors">
                  Our streamlined process gets you from raw data to polished visualizations faster than ever before.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connection line (desktop) */}
                <div className="hidden md:block absolute top-20 left-[20%] right-[20%] h-0.5">
                  <div className="w-full h-full bg-gradient-to-r from-blue-300 via-purple-300 to-emerald-300 dark:from-blue-600 dark:via-purple-600 dark:to-emerald-600 rounded-full"></div>
                </div>

                {workflow.map((step, index) => (
                  <div key={index} className="relative">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200/80 dark:border-slate-800 hover:shadow-xl dark:hover:shadow-indigo-900/20 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 hover:-translate-y-2 text-center">
                      {/* Step number circle */}
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg mb-6`}>
                        <step.icon className="w-7 h-7" />
                      </div>

                      <div className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase mb-3 transition-colors">
                        Step {step.step}
                      </div>

                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors">{step.title}</h3>
                      <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm transition-colors">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ─── CTA SECTION ─── */}
          <section className="relative overflow-hidden">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 py-20 sm:py-24">
              {/* Decorative elements */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="animate-float-slow absolute top-10 left-[10%] w-3 h-3 rounded-full bg-white/20"></div>
                <div className="animate-float-medium absolute top-20 right-[15%] w-2 h-2 rounded-full bg-white/30"></div>
                <div className="animate-float-fast absolute bottom-20 left-[20%] w-4 h-4 rounded-full bg-white/10"></div>
                <div className="animate-float-medium absolute bottom-10 right-[25%] w-2 h-2 rounded-full bg-white/20"></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.08), transparent 50%)' }}></div>
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 70% 80%, rgba(255,255,255,0.05), transparent 50%)' }}></div>
              </div>

              <div className="relative max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                    Ready to Transform
                    <br />
                    <span className="text-indigo-200">Your Data?</span>
                  </h2>

                  <p className="text-lg sm:text-xl text-indigo-200 max-w-2xl mx-auto leading-relaxed">
                    Join thousands of teams creating stunning visualizations with AIChartor.
                    Start your journey from data to insights today.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <Button asChild size="lg" className="px-8 py-6 text-base font-semibold bg-white text-indigo-700 hover:bg-indigo-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-0.5 rounded-xl">
                      <Link href="/landing">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Start Creating Now
                        <ArrowUpRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>

                    <Button asChild size="lg" variant="outline" className="px-8 py-6 text-base font-semibold bg-transparent border-2 border-white/25 text-white hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300 rounded-xl">
                      <Link href="/editor">
                        <Edit3 className="w-5 h-5 mr-2" />
                        Explore Editor
                      </Link>
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-6 text-indigo-200 text-sm pt-4">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Free to start
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      No setup required
                    </span>
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Export anywhere
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 border-t border-slate-200 dark:border-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid md:grid-cols-4 gap-10">
                {/* Brand */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 mb-5">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold">AIChartor</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed text-sm transition-colors">
                    Transform your data into stunning visualizations with the power of AI and professional design tools.
                    Create, customize, and share charts that tell your story.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="font-semibold mb-5 text-slate-900 dark:text-slate-200 transition-colors">Platform</h3>
                  <div className="space-y-3">
                    <Link href="/landing" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">AI Chat</Link>
                    <Link href="/editor" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">Advanced Editor</Link>
                    <Link href="/board" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">Dashboard</Link>
                    <Link href="/documentation" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">Documentation</Link>
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h3 className="font-semibold mb-5 text-slate-900 dark:text-slate-200 transition-colors">Resources</h3>
                  <div className="space-y-3">
                    <Link href="/pricing" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">Pricing</Link>
                    <Link href="/about" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">About</Link>
                    <Link href="/signin" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">Sign In</Link>
                    <Link href="/signup" className="block text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transition-colors text-sm">Sign Up</Link>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
                <div className="text-slate-500 dark:text-slate-400 text-sm transition-colors">
                  © {new Date().getFullYear()} AIChartor. All rights reserved.
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                  All systems operational
                </Badge>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}