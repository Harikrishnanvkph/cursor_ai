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
  Share2,
  Copy,
  BarChart2,
  Calendar,
  FileCode
} from "lucide-react"
import Link from "next/link"

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
      chartRef.current = new ChartJS(ctx, {
        type: conversation.snapshot.chart_type as any,
        data: conversation.snapshot.chart_data,
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

      const chart = new ChartJS(ctx, {
        type: conversation.snapshot.chart_type as any,
        data: conversation.snapshot.chart_data,
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

  const handleDownloadHTML = () => {
    if (!conversation?.snapshot) return

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
      type: '${conversation.snapshot.chart_type}',
      data: ${JSON.stringify(conversation.snapshot.chart_data)},
      options: ${JSON.stringify(conversation.snapshot.chart_config)}
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
    
    toast.success("HTML downloaded successfully!")
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
      bar: "bg-blue-100 text-blue-700 border-blue-200",
      line: "bg-green-100 text-green-700 border-green-200",
      pie: "bg-purple-100 text-purple-700 border-purple-200",
      doughnut: "bg-pink-100 text-pink-700 border-pink-200",
      radar: "bg-orange-100 text-orange-700 border-orange-200",
      polarArea: "bg-cyan-100 text-cyan-700 border-cyan-200",
      bubble: "bg-indigo-100 text-indigo-700 border-indigo-200",
      scatter: "bg-teal-100 text-teal-700 border-teal-200",
    }
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading chart...</p>
        </div>
      </div>
    )
  }

  if (error || !conversation) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Chart Not Found</h1>
          <p className="text-gray-600 mb-4 text-sm">
            {error || "The chart you're looking for doesn't exist or has been deleted."}
          </p>
          <Link href="/board">
            <Button size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Board
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full h-full">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}

