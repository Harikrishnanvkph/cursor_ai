"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useChartStore } from "@/lib/chart-store"
import { Download, Copy, FileImage, FileText, Code } from "lucide-react"

export function ExportPanel() {
  const { chartData, chartConfig, chartType } = useChartStore()
  const [exportFormat, setExportFormat] = useState("png")

  const handleExportConfig = () => {
    const config = {
      type: chartType,
      data: chartData,
      options: chartConfig,
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "chart-config.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyConfig = async () => {
    const config = {
      type: chartType,
      data: chartData,
      options: chartConfig,
    }

    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
  }

  const handleExportData = () => {
    const csvContent = [
      ["Label", ...chartData.datasets.map((d) => d.label)],
      ...(chartData.labels?.map((label, index) => [label, ...chartData.datasets.map((d) => d.data[index] || "")]) ||
        []),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "chart-data.csv"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Export & Share</h2>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Chart Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full">
            <FileImage className="h-4 w-4 mr-2" />
            Export as {exportFormat.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportConfig} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
            <Button variant="outline" onClick={handleCopyConfig} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
          </div>

          <div>
            <Label>Chart.js Configuration</Label>
            <Textarea
              value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
              readOnly
              className="h-32 font-mono text-xs"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Export Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleExportData} className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Embed Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>HTML Embed Code</Label>
            <Textarea
              value={`<iframe src="https://your-domain.com/embed/chart" width="600" height="400"></iframe>`}
              readOnly
              className="h-20 font-mono text-xs"
            />
          </div>

          <Button variant="outline" className="w-full">
            <Code className="h-4 w-4 mr-2" />
            Generate Embed Code
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
