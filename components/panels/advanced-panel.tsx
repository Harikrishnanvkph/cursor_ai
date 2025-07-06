"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useChartStore } from "@/lib/chart-store"
import { Copy, RotateCcw } from "lucide-react"
import { useState } from "react"

export function AdvancedPanel() {
  const { chartConfig, chartData, chartType, updateChartConfig } = useChartStore()
  const [performanceOpen, setPerformanceOpen] = useState(false)
  const [layoutOpen, setLayoutOpen] = useState(false)
  const [rawOpen, setRawOpen] = useState(false)

  const handleConfigUpdate = (path: string, value: any) => {
    const keys = path.split(".")
    const newConfig = { ...chartConfig }
    let current = newConfig

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateChartConfig(newConfig)
  }

  const handleCopyConfig = async () => {
    const config = {
      type: chartType,
      data: chartData,
      options: chartConfig,
    }
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  const handleResetConfig = () => {
    updateChartConfig({
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: "My Chart",
        },
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: true,
          },
        },
        y: {
          display: true,
          grid: {
            display: true,
          },
        },
      },
    })
  }

  return (
    <div className="space-y-4">
      {/* Performance Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Performance</h3>
          <button
            onClick={() => setPerformanceOpen(!performanceOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transform transition-transform ${performanceOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        <div className="bg-blue-50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Responsive</Label>
            <Switch
              checked={chartConfig.responsive !== false}
              onCheckedChange={(checked) => handleConfigUpdate("responsive", checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Maintain Aspect Ratio</Label>
            <Switch
              checked={chartConfig.maintainAspectRatio !== false}
              onCheckedChange={(checked) => handleConfigUpdate("maintainAspectRatio", checked)}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
          {performanceOpen && (
            <div className="space-y-3 pt-2 border-t border-blue-200">
              <div>
                <Label className="text-xs font-medium">Device Pixel Ratio</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={chartConfig.devicePixelRatio || ""}
                  onChange={(e) =>
                    handleConfigUpdate("devicePixelRatio", e.target.value ? Number.parseFloat(e.target.value) : undefined)
                  }
                  placeholder="Auto"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Layout Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Layout</h3>
          <button
            onClick={() => setLayoutOpen(!layoutOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transform transition-transform ${layoutOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        <div className="bg-purple-50 rounded-lg p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Padding Top</Label>
              <Input
                type="number"
                value={chartConfig.layout?.padding?.top || ""}
                onChange={(e) =>
                  handleConfigUpdate("layout.padding.top", e.target.value ? Number.parseInt(e.target.value) : undefined)
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Padding Right</Label>
              <Input
                type="number"
                value={chartConfig.layout?.padding?.right || ""}
                onChange={(e) =>
                  handleConfigUpdate(
                    "layout.padding.right",
                    e.target.value ? Number.parseInt(e.target.value) : undefined,
                  )
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Padding Bottom</Label>
              <Input
                type="number"
                value={chartConfig.layout?.padding?.bottom || ""}
                onChange={(e) =>
                  handleConfigUpdate(
                    "layout.padding.bottom",
                    e.target.value ? Number.parseInt(e.target.value) : undefined,
                  )
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Padding Left</Label>
              <Input
                type="number"
                value={chartConfig.layout?.padding?.left || ""}
                onChange={(e) =>
                  handleConfigUpdate(
                    "layout.padding.left",
                    e.target.value ? Number.parseInt(e.target.value) : undefined,
                  )
                }
                placeholder="0"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Raw Config Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Raw Configuration</h3>
          <button
            onClick={() => setRawOpen(!rawOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transform transition-transform ${rawOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        <div className="bg-green-50 rounded-lg p-3 space-y-3">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyConfig} className="flex-1 h-8 text-xs">
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
            <Button variant="outline" onClick={handleResetConfig} className="flex-1 h-8 text-xs">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
          {rawOpen && (
            <div className="space-y-2 pt-2 border-t border-green-200">
              <Label className="text-xs font-medium">Chart.js Configuration (Read-only)</Label>
              <Textarea
                value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
                readOnly
                className="h-40 font-mono text-xs"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
