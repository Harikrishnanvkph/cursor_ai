"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useChartStore } from "@/lib/chart-store"
import { Copy, RotateCcw } from "lucide-react"

export function AdvancedPanel() {
  const { chartConfig, chartData, chartType, updateChartConfig } = useChartStore()

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={chartConfig.responsive !== false}
              onCheckedChange={(checked) => handleConfigUpdate("responsive", checked)}
            />
            <Label>Responsive</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              checked={chartConfig.maintainAspectRatio !== false}
              onCheckedChange={(checked) => handleConfigUpdate("maintainAspectRatio", checked)}
            />
            <Label>Maintain Aspect Ratio</Label>
          </div>

          <div>
            <Label>Device Pixel Ratio</Label>
            <Input
              type="number"
              step="0.1"
              value={chartConfig.devicePixelRatio || ""}
              onChange={(e) =>
                handleConfigUpdate("devicePixelRatio", e.target.value ? Number.parseFloat(e.target.value) : undefined)
              }
              placeholder="Auto"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Interaction</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={chartConfig.interaction?.intersect !== false}
              onCheckedChange={(checked) => handleConfigUpdate("interaction.intersect", checked)}
            />
            <Label>Intersect Mode</Label>
          </div>

          <div>
            <Label>Interaction Mode</Label>
            <select
              value={chartConfig.interaction?.mode || "nearest"}
              onChange={(e) => handleConfigUpdate("interaction.mode", e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              <option value="nearest">Nearest</option>
              <option value="point">Point</option>
              <option value="index">Index</option>
              <option value="dataset">Dataset</option>
              <option value="x">X-Axis</option>
              <option value="y">Y-Axis</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Layout</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Padding Top</Label>
              <Input
                type="number"
                value={chartConfig.layout?.padding?.top || ""}
                onChange={(e) =>
                  handleConfigUpdate("layout.padding.top", e.target.value ? Number.parseInt(e.target.value) : undefined)
                }
                placeholder="0"
              />
            </div>
            <div>
              <Label>Padding Right</Label>
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
              />
            </div>
            <div>
              <Label>Padding Bottom</Label>
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
              />
            </div>
            <div>
              <Label>Padding Left</Label>
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
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Raw Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCopyConfig} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
            <Button variant="outline" onClick={handleResetConfig} className="flex-1">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <div>
            <Label>Chart.js Configuration (Read-only)</Label>
            <Textarea
              value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
              readOnly
              className="h-40 font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
