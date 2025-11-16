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
  History,
  LayoutDashboard,
  MessageSquare,
  Play,
  Settings,
  Share2,
  Sparkles,
  Download,
  ShieldCheck,
  Wand2
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
      // Remove the query parameter from URL
      const url = new URL(window.location.href)
      url.searchParams.delete('oauth')
      window.history.replaceState({}, '', url.toString())
      
      // Show success message
      toast.success('Successfully signed in with Google!')
      
      // Auto-hide welcome banner after 5 seconds
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [searchParams])
  
  // Auto-hide welcome banner after 5 seconds for existing users
  useEffect(() => {
    if (user && showWelcome) {
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 5000)
      
      return () => clearTimeout(timer)
    }
  }, [user, showWelcome])

  const heroHighlights = [
    { icon: Sparkles, label: "AI chart assistant for every teammate" },
    { icon: LayoutDashboard, label: "Pixel-perfect editor with 10 pro panels" },
    { icon: ShieldCheck, label: "Version history, secure cloud save & exports" }
  ]

  const valueProps = [
    {
      icon: MessageSquare,
      title: "Ask, don't configure",
      description: "Turn plain language, meeting notes or CSV data into production-ready charts in seconds."
    },
    {
      icon: Edit3,
      title: "Full-scale visual editor",
      description: "Fine-tune datasets, overlays, responsive breakpoints, animations and more without touching code."
    },
    {
      icon: History,
      title: "Living chart history",
      description: "Save versions, revisit conversations, and branch ideas with undo/redo, snapshots and Supabase sync."
    },
    {
      icon: Download,
      title: "Ship anywhere",
      description: "Export crisp PNG files, responsive HTML bundles, or drop-in embeds tailored for marketing sites, dashboards and decks."
    }
  ]

  const workflowSteps = [
    {
      step: "01",
      title: "Describe the story",
      body: "Paste a brief, spreadsheet or KPI summary. Our AI suggests the ideal chart type, copy, palettes and annotations."
    },
    {
      step: "02",
      title: "Refine visually",
      body: "Switch to the pro editor to adjust datasets, axes, callouts, overlays and accessibility details with granular controls."
    },
    {
      step: "03",
      title: "Publish with confidence",
      body: "Export in your team’s format—static assets, responsive embeds or full HTML hand-off—with version history preserved."
    }
  ]

  const exportHighlights = [
    "Pixel-crisp PNG downloads",
    "Responsive HTML packages for product & marketing",
    "Embed snippets with theme-aware styling",
    "Dataset + chart snapshots stored securely"
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader />

      {/* Show loading state only if unauthenticated and still loading */}
      {loading && !user && (
        <div className="py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              {/* Left skeleton (hero text/buttons) */}
              <div className="space-y-5 animate-pulse">
                <div className="h-5 w-40 bg-gray-200 rounded" />
                <div className="h-9 w-3/4 bg-gray-200 rounded" />
                <div className="h-9 w-2/3 bg-gray-200 rounded" />
                <div className="h-5 w-4/5 bg-gray-200 rounded" />
                <div className="flex gap-3 pt-2">
                  <div className="h-11 w-40 bg-gray-200 rounded" />
                  <div className="h-11 w-40 bg-gray-200 rounded" />
                </div>
              </div>
              {/* Right skeleton (preview card) */}
              <div>
                <div className="relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                  <div className="h-10 bg-gray-100" />
                  <div className="p-6">
                    <div className="h-56 w-full bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
            {/* Feature cards skeleton */}
            <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                  <div className="space-y-3 animate-pulse">
                    <div className="h-5 w-24 bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Show content when not loading OR when we have a cached user */}
      {(!loading || !!user) && (
        <>
          {/* Welcome message for signed-in users */}
          {user && showWelcome && (
            <div className="bg-green-50 border-b border-green-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-800">
                    {user.avatar_url && (
                      <Image 
                        src={user.avatar_url} 
                        alt="Profile" 
                        width={36}
                        height={36}
                        className="rounded-full mr-3"
                        referrerPolicy="no-referrer"
                        priority
                      />
                    )}
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm font-medium">
                      Welcome back, {user.full_name || user.email}!
                    </span>
                  </div>
                  <button
                    onClick={() => setShowWelcome(false)}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Hero Section (split) */}
          <section className="relative py-16 sm:py-20">
            <div className="absolute inset-0 -z-10 opacity-50">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.06)_1px,transparent_0)] bg-[length:18px_18px]" />
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <Badge className="mb-4 bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                    <Sparkles className="h-3 w-3 mr-1" /> AI chart builder
                  </Badge>
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight">
                    Build stunning charts
                    <span className="block bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent">with natural language</span>
                  </h1>
                  <p className="mt-5 text-lg text-gray-600 max-w-xl">
                    AIChartor is the fastest way for data, design and product teams to move from messy inputs to publish-ready visuals.
                    Draft ideas with AI, perfect them with pro tools, then export in every format stakeholders expect.
                  </p>
                  <ul className="mt-6 space-y-3">
                    {heroHighlights.map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-sm text-gray-600">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-gray-800">{item.label}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                     <Link href="/landing">
                      <Button size="lg" className="px-7 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700">
                        <Play className="h-5 w-5 mr-2" /> Start with AI
                        <ArrowRight className="h-5 w-5 ml-2" />
                      </Button>
                    </Link>
                     <Link href="/board">
                      <Button size="lg" variant="outline" className="px-7">
                        <LayoutDashboard className="h-5 w-5 mr-2" /> View Dashboard
                      </Button>
                    </Link>
                     <Link href="/editor">
                      <Button size="lg" variant="outline" className="px-7">
                        <Settings className="h-5 w-5 mr-2" /> Open editor
                      </Button>
                    </Link>
                  </div>
                  <div className="mt-4 text-xs text-gray-500">No signup required</div>
                </div>
                <div>
                  <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 text-sm text-gray-600">Preview</div>
                    <div className="p-4 sm:p-6">
                      <img src="/placeholder.jpg" alt="Chart preview" className="w-full rounded-lg border" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Value Proposition Section */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Why teams choose AIChartor</h2>
                <p className="mt-3 text-gray-600 text-lg">Pair conversational charting with professional tooling for the entire visualization lifecycle.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {valueProps.map((item, index) => (
                  <Card key={index} className="border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="p-2.5 rounded-lg bg-indigo-50 w-fit">
                        <item.icon className="h-5 w-5 text-indigo-700" />
                  </div>
                      <CardTitle className="text-lg text-gray-900">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                      <CardDescription className="text-sm leading-relaxed text-gray-600">{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

          {/* Workflow Section */}
          <section className="py-16 sm:py-20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mb-12 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">From prompt to publish in minutes</h2>
                <p className="mt-3 text-gray-600 text-lg">AI handles the heavy lifting while you keep full creative control. Each step is designed for modern data teams, designers and product writers.</p>
          </div>
              <div className="grid gap-6 md:grid-cols-3">
                {workflowSteps.map((step) => (
                  <div key={step.step} className="relative border border-gray-200 rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition-all">
                    <span className="text-sm font-semibold text-indigo-600">Step {step.step}</span>
                    <h3 className="mt-3 text-xl font-semibold text-gray-900">{step.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

          {/* Export Section */}
          <section className="py-16 sm:py-20 bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-10 items-center">
                <div>
                  <Badge className="bg-indigo-100 text-indigo-700 mb-4">Deliver anywhere</Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Share charts the way stakeholders expect</h2>
                  <p className="mt-4 text-gray-600 text-lg">Whether you are preparing investor updates, in-product dashboards or marketing landing pages, exports stay true to the preview—responsive, accessible and on-brand.</p>
                  <ul className="mt-6 space-y-3">
                    {exportHighlights.map((item, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                        <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600">
                          <Share2 className="h-3.5 w-3.5" />
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative rounded-3xl border border-indigo-100 bg-white/70 backdrop-blur shadow-xl p-6">
                  <div className="grid gap-4">
                    <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-indigo-50 to-white p-4">
                      <div className="flex items-center gap-2 text-indigo-600 text-sm font-semibold"><Wand2 className="h-4 w-4" /> AI Recommendation</div>
                      <p className="mt-2 text-sm text-gray-600">“For your product usage data, we prepared a stacked area chart with milestone annotations and contrast-aware palette.”</p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Export package</span>
                        <span className="font-semibold text-gray-900">Ready</span>
                      </div>
                      <div className="mt-3 space-y-2 text-sm text-gray-700">
                        <div className="flex items-center justify-between">
                          <span>📦 PNG download bundle</span>
                          <span className="text-indigo-600">8.4 MB</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🌐 Responsive HTML embed</span>
                          <span className="text-indigo-600">Hosted</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>🗂 Snapshot history</span>
                          <span className="text-indigo-600">6 versions</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-indigo-600 to-cyan-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to transform your data?</h2>
          <p className="mt-3 text-indigo-100 text-lg">Create a chart with AI or open the full editor.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/landing">
              <Button size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                <Sparkles className="h-5 w-5 mr-2" /> Generate with AI
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Edit3 className="h-5 w-5 mr-2" /> Open editor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-indigo-600 to-cyan-600 rounded-lg">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-semibold">AIChartor</span>
            </div>
            <div className="text-sm text-gray-400">© 2024 AIChartor. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </>
      )}
    </div>
  )
}
