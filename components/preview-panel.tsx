"use client"

import { useRef } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Chart } from "react-chartjs-2"
import { useChartStore } from "@/lib/chart-store"
import { Button } from "@/components/ui/button"
import { Download, RefreshCw } from "lucide-react"
import { BarChart3 } from "lucide-react"

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend)

export function PreviewPanel() {
  const { chartConfig, chartData, chartType } = useChartStore()
  const chartRef = useRef<ChartJS>(null)

  const handleExport = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas
      const url = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = "chart.png"
      link.href = url
      link.click()
    }
  }

  const handleRefresh = () => {
    if (chartRef.current) {
      chartRef.current.update()
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Live Preview</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4">
        <div className="h-full bg-gray-50 rounded-lg p-4 flex items-center justify-center">
          {chartData.datasets.length > 0 ? (
            <div className="w-full h-full">
              <Chart
                ref={chartRef}
                type={chartType}
                data={chartData}
                options={{
                  ...chartConfig,
                  responsive: true,
                  maintainAspectRatio: false,
                }}
              />
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Add datasets to see your chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
