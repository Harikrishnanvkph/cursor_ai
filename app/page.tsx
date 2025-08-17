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
  BarChart3,
  MessageSquare,
  Edit3,
  Sparkles,
  Download,
  Database,
  ArrowRight,
  Play,
  Settings
} from "lucide-react"

export default function HomePage() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [showWelcome, setShowWelcome] = useState(true)
  
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

  const features = [
    { icon: Sparkles, title: "Natural language to charts", description: "Describe the chart you need; get it instantly." },
    { icon: Edit3, title: "Precision editor", description: "Adjust labels, axes, styling, overlays and animations." },
    { icon: Database, title: "Rich chart types", description: "Bar, line, pie, radar, polar, scatter, bubble, stacked, area." },
    { icon: Download, title: "Export anywhere", description: "Share as PNG/SVG or export responsive HTML templates." },
    { icon: MessageSquare, title: "Conversational updates", description: "Keep chatting to tweak and iterate quickly." },
    { icon: Settings, title: "Smart defaults", description: "Great‑looking charts out of the box with modern theming." },
  ]

  const chartTypes = [
    { name: "Bar", icon: BarChart3, color: "bg-indigo-50 text-indigo-700" },
    { name: "Line", icon: BarChart3, color: "bg-cyan-50 text-cyan-700" },
    { name: "Pie", icon: BarChart3, color: "bg-emerald-50 text-emerald-700" },
    { name: "Scatter", icon: BarChart3, color: "bg-amber-50 text-amber-700" },
    { name: "Radar", icon: BarChart3, color: "bg-rose-50 text-rose-700" },
    { name: "Area", icon: BarChart3, color: "bg-sky-50 text-sky-700" }
  ]

  return (
    <div className="min-h-screen bg-neutral-50">
      <SiteHeader />

      {/* Show loading state while authenticating */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Signing you in...</span>
        </div>
      )}

      {/* Show content when not loading */}
      {!loading && (
        <>
          {/* Welcome message for signed-in users */}
          {user && showWelcome && (
            <div className="bg-green-50 border-b border-green-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-green-800">
                    {user.avatar_url && (
                      <img 
                        src={user.avatar_url} 
                        alt="Profile" 
                        className="w-6 h-6 rounded-full mr-3"
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
                    Describe your goal and paste data. Get a beautiful chart immediately, then fine‑tune in the editor.
                  </p>
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                     <Link href="/landing">
                      <Button size="lg" className="px-7 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700">
                        <Play className="h-5 w-5 mr-2" /> Start with AI
                        <ArrowRight className="h-5 w-5 ml-2" />
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

          {/* Features Section */}
          <section className="py-16 sm:py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Everything you need to build charts</h2>
                <p className="mt-3 text-gray-600 text-lg">AI when you want speed, controls when you want precision.</p>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((f, i) => (
              <Card key={i} className="border border-gray-200 shadow-sm hover:shadow-md transition-all">
                <CardHeader>
                  <div className="p-2.5 rounded-lg bg-indigo-50 w-fit">
                    <f.icon className="h-5 w-5 text-indigo-700" />
                  </div>
                  <CardTitle className="text-lg">{f.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[15px]">{f.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chart Types Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Supports all major chart types</h2>
            <p className="mt-3 text-gray-600 text-lg">From simple bars to complex radar and scatter plots.</p>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {chartTypes.map((type, i) => (
              <div key={i} className={`flex items-center gap-2 px-4 py-2 rounded-full border ${type.color} whitespace-nowrap shadow-sm`}>
                <type.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{type.name}</span>
              </div>
            ))}
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
