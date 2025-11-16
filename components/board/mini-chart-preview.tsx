"use client"

import React, { useEffect, useRef } from "react"
import { Chart as ChartJS } from "chart.js"
import type { ChartSnapshot } from "@/lib/chat-store"

interface MiniChartPreviewProps {
  snapshot: ChartSnapshot
}

export function MiniChartPreview({ snapshot }: MiniChartPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<ChartJS | null>(null)

  useEffect(() => {
    if (!canvasRef.current || !snapshot) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Destroy previous chart if exists
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    try {
      // Create new chart with mini-specific options
      chartRef.current = new ChartJS(ctx, {
        type: snapshot.chartType as any,
        data: snapshot.chartData,
        options: {
          ...snapshot.chartConfig,
          responsive: true,
          maintainAspectRatio: true,
          animation: false,
          plugins: {
            ...snapshot.chartConfig?.plugins,
            legend: {
              display: false, // Hide legend in mini preview
            },
            tooltip: {
              enabled: false, // Disable tooltips in mini preview
            },
          },
          scales: snapshot.chartType !== "pie" && snapshot.chartType !== "doughnut" && snapshot.chartType !== "polarArea" ? {
            x: {
              display: false, // Hide x-axis in mini preview
            },
            y: {
              display: false, // Hide y-axis in mini preview
            },
          } : undefined,
        },
      })
    } catch (error) {
      console.error("Error creating mini chart preview:", error)
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
        chartRef.current = null
      }
    }
  }, [snapshot])

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <canvas ref={canvasRef} />
    </div>
  )
}

