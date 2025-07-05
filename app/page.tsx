"use client"

import React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  BarChart3, 
  MessageSquare, 
  Edit3, 
  Sparkles, 
  Download, 
  Palette, 
  Zap, 
  Database,
  ArrowRight,
  Play,
  Settings,
  History
} from "lucide-react"

export default function HomePage() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Generation",
      description: "Create charts instantly by describing them in natural language. Our AI understands your requirements and generates beautiful, accurate charts.",
      color: "text-blue-600"
    },
    {
      icon: MessageSquare,
      title: "Conversational Editing",
      description: "Modify your charts through natural conversation. Ask for changes like 'make the bars red' or 'add a title' and watch it happen instantly.",
      color: "text-green-600"
    },
    {
      icon: Edit3,
      title: "Manual Editor",
      description: "Fine-tune every aspect of your charts with our comprehensive manual editor. Control colors, fonts, animations, and more.",
      color: "text-purple-600"
    },
    {
      icon: Database,
      title: "Multiple Chart Types",
      description: "Support for bar, line, pie, doughnut, scatter, bubble, radar, polar area, and more. Plus advanced features like stacked bars and area charts.",
      color: "text-orange-600"
    },
    {
      icon: Download,
      title: "Export & Share",
      description: "Export your charts in multiple formats. Perfect for presentations, reports, and sharing with your team.",
      color: "text-red-600"
    },
    {
      icon: History,
      title: "Conversation History",
      description: "Never lose your work. All your chart conversations are saved and can be restored at any time.",
      color: "text-indigo-600"
    }
  ]

  const chartTypes = [
    { name: "Bar Charts", icon: BarChart3, color: "bg-blue-100 text-blue-700" },
    { name: "Line Charts", icon: BarChart3, color: "bg-green-100 text-green-700" },
    { name: "Pie Charts", icon: BarChart3, color: "bg-purple-100 text-purple-700" },
    { name: "Scatter Plots", icon: BarChart3, color: "bg-orange-100 text-orange-700" },
    { name: "Radar Charts", icon: BarChart3, color: "bg-red-100 text-red-700" },
    { name: "Area Charts", icon: BarChart3, color: "bg-indigo-100 text-indigo-700" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative overflow-hidden bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AIChartor
                </h1>
                <p className="text-sm text-gray-600">AI-Powered Chart Generation</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link href="/landing">
                <Button variant="outline" className="bg-white/80 hover:bg-white">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  AI Chat
                </Button>
              </Link>
              <Link href="/editor">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Edit3 className="h-4 w-4 mr-2" />
                  Manual Editor
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <Badge className="mb-6 bg-blue-100 text-blue-700 hover:bg-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Powered by AI
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Create Beautiful Charts
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              with Natural Language
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Transform your data into stunning visualizations using AI. Describe your chart in plain English, 
            and watch as AIChartor brings your vision to life. Then refine it with our powerful manual editor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/landing">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6">
                <Play className="h-5 w-5 mr-2" />
                Start Creating with AI
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="lg" variant="outline" className="border-white text-blue-600 hover:bg-white hover:text-blue-600 text-lg px-8 py-6">
                <Settings className="h-5 w-5 mr-2" />
                Open Manual Editor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Create Amazing Charts
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From AI-powered generation to precise manual control, AIChartor provides all the tools you need.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader>
                  <div className={`p-3 rounded-lg bg-gray-50 w-fit ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Chart Types Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Support for All Major Chart Types
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Whether you need simple bar charts or complex radar visualizations, we've got you covered.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {chartTypes.map((chartType, index) => (
              <div key={index} className="text-center">
                <div className={`p-4 rounded-xl ${chartType.color} mb-3 mx-auto w-fit`}>
                  <chartType.icon className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-gray-700">{chartType.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Data?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who are already creating stunning charts with AIChartor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/landing">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6">
                <Sparkles className="h-5 w-5 mr-2" />
                Try AI Generation
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="lg" variant="outline" className="border-white text-blue-600 hover:bg-white hover:text-blue-600 text-lg px-8 py-6">
                <Edit3 className="h-5 w-5 mr-2" />
                Open Editor
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold">AIChartor</h3>
                <p className="text-gray-400 text-sm">AI-Powered Chart Generation</p>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <span>© 2024 AIChartor. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
