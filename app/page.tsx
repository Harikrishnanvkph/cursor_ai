"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/components/auth/AuthProvider"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  BarChart3,
  Edit3,
  LayoutDashboard,
  MessageSquare,
  Play,
  Settings,
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
  Target
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

  const heroFeatures = [
    { icon: Brain, label: "AI-Powered Chart Generation", description: "Natural language to stunning visuals" },
    { icon: Palette, label: "Professional Design Tools", description: "10+ advanced editing panels" },
    { icon: Cloud, label: "Cloud Sync & Collaboration", description: "Save, share, and collaborate seamlessly" }
  ]

  const capabilities = [
    {
      icon: MessageSquare,
      title: "Conversational AI",
      description: "Simply describe your data story. Our AI understands context, suggests optimal chart types, and creates publication-ready visualizations instantly.",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Edit3,
      title: "Advanced Editor",
      description: "Fine-tune every detail with our comprehensive visual editor. Adjust datasets, styling, animations, overlays, and responsive behavior.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: LayoutDashboard,
      title: "Smart Dashboard",
      description: "Organize, manage, and analyze all your charts in one place. Track usage, share publicly, and maintain version history.",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Share2,
      title: "Universal Export",
      description: "Export as PNG, responsive HTML, or embed codes. Perfect for presentations, websites, dashboards, and marketing materials.",
      gradient: "from-orange-500 to-red-500"
    }
  ]

  const chartTypes = [
    { icon: BarChart4, name: "Bar Charts", color: "text-blue-600" },
    { icon: LineChart, name: "Line Charts", color: "text-green-600" },
    { icon: PieChart, name: "Pie Charts", color: "text-purple-600" },
    { icon: TrendingUp, name: "Area Charts", color: "text-orange-600" },
    { icon: Target, name: "Radar Charts", color: "text-pink-600" },
    { icon: Layers, name: "Mixed Charts", color: "text-indigo-600" }
  ]

  const workflow = [
    {
      step: "01",
      title: "Describe Your Vision",
      description: "Tell our AI what you want to visualize. Upload CSV data, paste text, or simply describe your chart requirements in natural language.",
      icon: MessageSquare,
      color: "bg-blue-500"
    },
    {
      step: "02", 
      title: "AI Creates & You Refine",
      description: "Watch as AI generates your chart instantly. Then use our advanced editor to perfect colors, layouts, animations, and interactive elements.",
      icon: Wand2,
      color: "bg-purple-500"
    },
    {
      step: "03",
      title: "Export & Share",
      description: "Download high-quality images, get responsive HTML code, or share via public links. Your charts work everywhere, on any device.",
      icon: Rocket,
      color: "bg-green-500"
    }
  ]

  const stats = [
    { number: "10+", label: "Chart Types", icon: BarChart3 },
    { number: "50+", label: "Customization Options", icon: Settings },
    { number: "3", label: "Export Formats", icon: Download },
    { number: "∞", label: "Creative Possibilities", icon: Sparkles }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <SiteHeader />

      {/* Loading State */}
      {loading && !user && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 font-medium">Loading AIChartor...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {(!loading || !!user) && (
        <>
          {/* Welcome Banner for Authenticated Users */}
          {user && showWelcome && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200/50 backdrop-blur-sm">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {user.avatar_url && (
                      <Image
                        src={user.avatar_url}
                        alt="Profile"
                        width={40}
                        height={40}
                        className="rounded-full ring-2 ring-green-200"
                        referrerPolicy="no-referrer"
                        priority
                      />
                    )}
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-800 font-semibold">
                        Welcome back, {user.full_name || user.email?.split('@')[0]}! 
                      </span>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        Ready to create
                      </Badge>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="text-green-600 hover:text-green-800 transition-colors p-1 rounded-full hover:bg-green-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section */}
          <section className="relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]"></div>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,51,234,0.1),transparent_50%)]"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 sm:pt-24 sm:pb-20">
              <div className="text-center space-y-8">
                {/* Main Headline */}
                <div className="space-y-4">
                  <Badge className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200/50 hover:border-blue-300/50 transition-colors">
                    <Sparkles className="w-4 h-4" />
                    AI-Powered Chart Creation Platform
                  </Badge>
                  
                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                    <span className="block text-gray-900">Transform Data Into</span>
                    <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      Stunning Visuals
                    </span>
                  </h1>
                  
                  <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-gray-600 leading-relaxed">
                    Create professional charts in seconds with AI, then perfect them with our advanced editor. 
                    From natural language to publication-ready visualizations.
                  </p>
                </div>

                {/* Hero Features */}
                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  {heroFeatures.map((feature, index) => (
                    <div key={index} className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 hover:bg-white/80 transition-all duration-300 hover:scale-105">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-gray-900">{feature.label}</h3>
                        <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <Link href="/landing">
                    <Button size="lg" className="px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <Play className="w-5 h-5 mr-2" />
                      Start Creating with AI
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  
                  {user ? (
                    <Link href="/board">
                      <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-300">
                        <LayoutDashboard className="w-5 h-5 mr-2" />
                        View Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/editor">
                      <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-2 hover:bg-gray-50 transition-all duration-300">
                        <Edit3 className="w-5 h-5 mr-2" />
                        Try Advanced Editor
                      </Button>
                    </Link>
                  )}
                </div>

                {/* Trust Indicator */}
                <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  No credit card required • Start creating immediately
                </p>
              </div>
            </div>
          </section>

          {/* Stats Section */}
          <section className="py-16 bg-white/50 backdrop-blur-sm border-y border-gray-200/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-3">
                      <stat.icon className="w-6 h-6" />
                    </div>
                    <div className="text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                    <div className="text-sm font-medium text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Chart Types Showcase */}
          <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
                  Comprehensive Chart Library
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Every Chart Type You Need
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  From simple bar charts to complex mixed visualizations. Our AI understands your data and suggests the perfect chart type.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {chartTypes.map((chart, index) => (
                  <div key={index} className="group">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-lg hover:border-gray-300/50 transition-all duration-300 hover:-translate-y-1">
                      <div className="text-center">
                        <chart.icon className={`w-8 h-8 mx-auto mb-3 ${chart.color}`} />
                        <h3 className="font-semibold text-gray-900 text-sm">{chart.name}</h3>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Capabilities Section */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4 bg-purple-50 text-purple-700 border-purple-200">
                  Platform Capabilities
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  Everything You Need in One Platform
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Combine the power of AI with professional design tools for the complete data visualization workflow.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                {capabilities.map((capability, index) => (
                  <Card key={index} className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                    <div className={`h-1 bg-gradient-to-r ${capability.gradient}`}></div>
                    <CardHeader className="pb-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${capability.gradient} flex items-center justify-center text-white`}>
                          <capability.icon className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-xl text-gray-900">{capability.title}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 leading-relaxed">
                        {capability.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Workflow Section */}
          <section className="py-20 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <Badge className="mb-4 bg-green-50 text-green-700 border-green-200">
                  Simple Workflow
                </Badge>
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  From Idea to Impact in Minutes
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Our streamlined process gets you from raw data to polished visualizations faster than ever before.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {workflow.map((step, index) => (
                  <div key={index} className="relative">
                    {/* Connection Line */}
                    {index < workflow.length - 1 && (
                      <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-200 z-0"></div>
                    )}
                    
                    <div className="relative bg-white rounded-2xl p-8 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 z-10">
                      <div className="text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${step.color} text-white mb-6 shadow-lg`}>
                          <step.icon className="w-8 h-8" />
                        </div>
                        <div className="text-sm font-bold text-gray-400 mb-2">STEP {step.step}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.05),transparent_50%)]"></div>
            
            <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-4xl sm:text-5xl font-bold text-white">
                    Ready to Transform Your Data?
                  </h2>
                  <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                    Join thousands of teams creating stunning visualizations with AIChartor. 
                    Start your journey from data to insights today.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/landing">
                    <Button size="lg" className="px-8 py-4 text-lg font-semibold bg-white text-gray-900 hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <Sparkles className="w-5 h-5 mr-2" />
                      Start Creating Now
                      <ArrowUpRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  
                  <Link href="/editor">
                    <Button size="lg" variant="outline" className="px-8 py-4 text-lg font-semibold border-2 border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
                      <Edit3 className="w-5 h-5 mr-2" />
                      Explore Editor
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center justify-center space-x-6 text-blue-100">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Free to start</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>No setup required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Export anywhere</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="grid md:grid-cols-4 gap-8">
                {/* Brand */}
                <div className="md:col-span-2">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-2xl font-bold">AIChartor</span>
                  </div>
                  <p className="text-gray-400 max-w-md leading-relaxed">
                    Transform your data into stunning visualizations with the power of AI and professional design tools. 
                    Create, customize, and share charts that tell your story.
                  </p>
                </div>

                {/* Quick Links */}
                <div>
                  <h3 className="font-semibold mb-4">Platform</h3>
                  <div className="space-y-2">
                    <Link href="/landing" className="block text-gray-400 hover:text-white transition-colors">AI Chat</Link>
                    <Link href="/editor" className="block text-gray-400 hover:text-white transition-colors">Advanced Editor</Link>
                    <Link href="/board" className="block text-gray-400 hover:text-white transition-colors">Dashboard</Link>
                    <Link href="/documentation" className="block text-gray-400 hover:text-white transition-colors">Documentation</Link>
                  </div>
                </div>

                {/* Resources */}
                <div>
                  <h3 className="font-semibold mb-4">Resources</h3>
                  <div className="space-y-2">
                    <Link href="/pricing" className="block text-gray-400 hover:text-white transition-colors">Pricing</Link>
                    <Link href="/about" className="block text-gray-400 hover:text-white transition-colors">About</Link>
                    <Link href="/signin" className="block text-gray-400 hover:text-white transition-colors">Sign In</Link>
                    <Link href="/signup" className="block text-gray-400 hover:text-white transition-colors">Sign Up</Link>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between">
                <div className="text-gray-400 text-sm">
                  © 2024 AIChartor. All rights reserved.
                </div>
                <div className="flex items-center space-x-4 mt-4 md:mt-0">
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                    All systems operational
                  </Badge>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  )
}