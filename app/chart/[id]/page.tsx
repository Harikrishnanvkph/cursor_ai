"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { dataService } from "@/lib/data-service"
import { Chart as ChartJS } from "chart.js"
import "@/lib/chart-registration" // Import Chart.js registration
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  ArrowLeft,
  Download,
  Edit3,
  Loader2,
  Share2, Copy, BarChart2, Calendar, FileCode
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { embedImagesAsBase64 } from "@/lib/utils/html-export-utils"
import { chartTypeMapping, type SupportedChartType } from "@/lib/chart-defaults"

interface ChartSnapshot {
  chart_type: string
  chart_data: any
  chart_config: any
}

interface ConversationData {
  id: string
  title: string
  created_at: string
  snapshot: ChartSnapshot | null
}

export default function PublicChartPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [conversation, setConversation] = useState<ConversationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)

  useEffect(() => {
    if (!id) return

    const loadChart = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch conversation details
        const convResponse = await dataService.getConversation(id)
        if (convResponse.error || !convResponse.data) {
          setError("Chart not found")
          return
        }

        // Fetch current snapshot
        const snapshotResponse = await dataService.getCurrentChartSnapshot(id)
        if (snapshotResponse.error || !snapshotResponse.data) {
          setError("Chart data not available")
          return
        }

        setConversation({
          id: convResponse.data.id,
          title: convResponse.data.title,
          created_at: convResponse.data.created_at,
          snapshot: snapshotResponse.data
        })
      } catch (err) {
        console.error("Error loading chart:", err)
        setError("Failed to load chart")
      } finally {
        setLoading(false)
      }
    }

    loadChart()
  }, [id])

  useEffect(() => {
    if (!canvasRef.current || !conversation?.snapshot) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Destroy previous chart if exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    try {
      const resolvedType = chartTypeMapping[conversation.snapshot.chart_type as SupportedChartType] || conversation.snapshot.chart_type;
      chartRef.current = new ChartJS(ctx, {
        type: resolvedType as any,
        data: {
          ...conversation.snapshot.chart_data,
          datasets: (conversation.snapshot.chart_data?.datasets || []).map((ds: any) => ({
            ...ds,
            type: ds.type ? (chartTypeMapping[ds.type as SupportedChartType] || ds.type) : undefined
          }))
        },
        options: {
          ...conversation.snapshot.chart_config,
          responsive: true,
          maintainAspectRatio: true,
        },
      })
    } catch (error) {
      console.error("Error creating chart:", error)
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [conversation])

  const handleDownloadPNG = async () => {
    if (!conversation?.snapshot) return

    try {
      const canvas = document.createElement("canvas")
      canvas.width = 1920
      canvas.height = 1080

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        toast.error("Failed to create canvas context")
        return
      }

      const resolvedType = chartTypeMapping[conversation.snapshot.chart_type as SupportedChartType] || conversation.snapshot.chart_type;
      const chart = new ChartJS(ctx, {
        type: resolvedType as any,
        data: {
          ...conversation.snapshot.chart_data,
          datasets: (conversation.snapshot.chart_data?.datasets || []).map((ds: any) => ({
            ...ds,
            type: ds.type ? (chartTypeMapping[ds.type as SupportedChartType] || ds.type) : undefined
          }))
        },
        options: {
          ...conversation.snapshot.chart_config,
          animation: false,
          responsive: false,
        },
      })

      await new Promise(resolve => setTimeout(resolve, 500))

      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Failed to generate image")
          return
        }

        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        chart.destroy()
        toast.success("PNG downloaded successfully!")
      })
    } catch (error) {
      console.error("Download error:", error)
      toast.error("Failed to download PNG")
    }
  }

  const handleDownloadHTML = async () => {
    if (!conversation?.snapshot) return

    try {
      toast.loading("Preparing HTML export (embedding images)...", { id: "html-export" })

      // Convert all images to Base64 so the HTML file is fully standalone offline
      const { chartData, chartConfig } = await embedImagesAsBase64(
        conversation.snapshot.chart_data,
        conversation.snapshot.chart_config
      )

      const resolvedType = chartTypeMapping[conversation.snapshot.chart_type as SupportedChartType] || conversation.snapshot.chart_type;

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${conversation.title}</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 32px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 1200px;
      width: 100%;
    }
    h1 {
      margin: 0 0 24px 0;
      color: #1f2937;
      font-size: 28px;
      font-weight: 700;
    }
    .chart-container {
      position: relative;
      height: 600px;
      width: 100%;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>${conversation.title}</h1>
    <div class="chart-container">
      <canvas id="chart"></canvas>
    </div>
  </div>
  
  <script>
    const ctx = document.getElementById('chart').getContext('2d');
    new Chart(ctx, {
      type: '${resolvedType}',
      data: ${JSON.stringify(chartData)},
      options: ${JSON.stringify(chartConfig)}
    });
  </script>
</body>
</html>`

      const blob = new Blob([htmlContent], { type: "text/html" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${conversation.title.replace(/[^a-z0-9]/gi, '_')}.html`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success("HTML downloaded successfully!", { id: "html-export" })
    } catch (error) {
      console.error("HTML export error:", error)
      toast.error("Failed to generate HTML", { id: "html-export" })
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard!")
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    })
  }

  const getChartTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      bar:       "bg-blue-500/15 text-blue-300 border-blue-500/30",
      line:      "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      pie:       "bg-violet-500/15 text-violet-300 border-violet-500/30",
      doughnut:  "bg-pink-500/15 text-pink-300 border-pink-500/30",
      radar:     "bg-orange-500/15 text-orange-300 border-orange-500/30",
      polarArea: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
      bubble:    "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      scatter:   "bg-teal-500/15 text-teal-300 border-teal-500/30",
    }
    return colors[type] || "bg-slate-700/60 text-slate-300 border-slate-600/50"
  }

  /* ─────────────── LOADING STATE ─────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        {/* Ambient glow orbs */}
        <div className="fixed top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-violet-600/20 blur-[120px] pointer-events-none -z-0" />
        <div className="fixed bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-indigo-600/20 blur-[120px] pointer-events-none -z-0" />

        <div className="relative z-10 flex flex-col items-center gap-6">
          {/* Gradient logo mark */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <BarChart2 className="w-8 h-8 text-white" />
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
              <span className="text-slate-300 font-medium text-sm tracking-wide">Loading chart</span>
            </div>
            {/* Animated dots */}
            <div className="flex items-center gap-1.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ─────────────── ERROR STATE ─────────────── */
  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-10 flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <BarChart2 className="w-8 h-8 text-rose-400" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold text-slate-100">Chart Not Found</h1>
              <p className="text-slate-400 text-sm leading-relaxed">
                {error || "The chart you're looking for doesn't exist or has been deleted."}
              </p>
            </div>
            <Link href="/board">
              <Button
                size="sm"
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Board
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  /* ─────────────── MAIN RENDER ─────────────── */
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* ── Header bar ── */}
      <header className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="rounded-lg" />
            <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
              ChartAI
            </span>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyLink}
              className="h-8 px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all text-xs gap-1.5"
            >
              <Copy className="h-3.5 w-3.5" />
              Copy link
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadPNG}
              className="h-8 px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all text-xs gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              PNG
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDownloadHTML}
              className="h-8 px-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all text-xs gap-1.5"
            >
              <FileCode className="h-3.5 w-3.5" />
              HTML
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-4 sm:px-6">
        <div className="w-full max-w-5xl flex flex-col gap-6">

          {/* Chart title + metadata row */}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {/* Chart type icon flair */}
              <div className="mt-0.5 w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/20 flex items-center justify-center shrink-0">
                <BarChart2 className="w-4 h-4 text-violet-400" />
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-100 leading-snug break-words">
                  {conversation.title}
                </h1>
                {/* Gradient underline accent */}
                <div className="h-0.5 w-16 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 opacity-80" />
              </div>
            </div>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-2 pl-12">
              {conversation.snapshot?.chart_type && (
                <Badge
                  variant="outline"
                  className={`text-xs font-medium border px-2 py-0.5 capitalize ${getChartTypeColor(conversation.snapshot.chart_type)}`}
                >
                  {conversation.snapshot.chart_type}
                </Badge>
              )}
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Calendar className="h-3.5 w-3.5 text-slate-600" />
                {formatDate(conversation.created_at)}
              </span>
            </div>
          </div>

          {/* ── Chart container card ── */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Card top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              </div>
              <span className="text-xs text-slate-600 font-mono tracking-wide">chart preview</span>
              <div className="w-12" />
            </div>

            {/* Canvas area */}
            <div className="p-6 sm:p-8">
              <canvas ref={canvasRef} />
            </div>
          </div>

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800 bg-slate-900 py-5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Powered by{" "}
            <Link
              href="/"
              className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              ChartAI
            </Link>
          </p>
          <div className="flex items-center gap-4">
            <Link href="/board" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Board
            </Link>
            <Link href="/" className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
