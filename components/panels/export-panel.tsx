"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useChartStore } from "@/lib/chart-store"
import { downloadChartAsHTML, generateChartHTML, type HTMLExportOptions } from "@/lib/html-exporter"
import { templateList } from "@/lib/html-templates"
import { Download, Copy, FileImage, FileText, Code, FileCode, Settings, Eye } from "lucide-react"

interface ExportPanelProps {
  onTabChange?: (tab: string) => void
}

export function ExportPanel({ onTabChange }: ExportPanelProps) {
  const { chartData, chartConfig, chartType } = useChartStore()
  const [exportFormat, setExportFormat] = useState("png")
  const [htmlOptions, setHtmlOptions] = useState<HTMLExportOptions>({
    title: "Chart Export",
    width: 800,
    height: 600,
    backgroundColor: "#ffffff",
    includeResponsive: true,
    includeAnimations: true,
    includeTooltips: true,
    includeLegend: true,
    fileName: `chart-${new Date().toISOString().slice(0, 10)}.html`,
    template: "modern"
  })
  const [showHtmlPreview, setShowHtmlPreview] = useState(false)
  const [htmlPreview, setHtmlPreview] = useState("")

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

  const handleExportHTML = () => {
    const result = downloadChartAsHTML(htmlOptions)
    if (result.success) {
      console.log(result.message)
    } else {
      console.error(result.error)
    }
  }

  const handlePreviewHTML = () => {
    const { content } = generateChartHTML(htmlOptions)
    setHtmlPreview(content)
    setShowHtmlPreview(true)
  }

  const handleCopyHTML = async () => {
    const { content } = generateChartHTML(htmlOptions)
    await navigator.clipboard.writeText(content)
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
          <CardTitle className="text-sm">Export as HTML</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Title</Label>
              <Input
                value={htmlOptions.title}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, title: e.target.value })}
                placeholder="Chart Title"
              />
            </div>
            <div>
              <Label>File Name</Label>
              <Input
                value={htmlOptions.fileName}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, fileName: e.target.value })}
                placeholder="chart.html"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Width (px)</Label>
              <Input
                type="number"
                value={htmlOptions.width}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, width: parseInt(e.target.value) || 800 })}
                min="200"
                max="2000"
              />
            </div>
            <div>
              <Label>Height (px)</Label>
              <Input
                type="number"
                value={htmlOptions.height}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, height: parseInt(e.target.value) || 600 })}
                min="200"
                max="2000"
              />
            </div>
          </div>

          <div>
            <Label>Background Color</Label>
            <Input
              value={htmlOptions.backgroundColor}
              onChange={(e) => setHtmlOptions({ ...htmlOptions, backgroundColor: e.target.value })}
              placeholder="#ffffff"
            />
          </div>

          <div>
            <Label>Template</Label>
            <Select value={htmlOptions.template} onValueChange={(value) => setHtmlOptions({ ...htmlOptions, template: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateList.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Responsive</Label>
              <Switch
                checked={htmlOptions.includeResponsive}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeResponsive: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Animations</Label>
              <Switch
                checked={htmlOptions.includeAnimations}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeAnimations: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Tooltips</Label>
              <Switch
                checked={htmlOptions.includeTooltips}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeTooltips: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Legend</Label>
              <Switch
                checked={htmlOptions.includeLegend}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeLegend: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportHTML} className="flex-1">
              <FileCode className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button variant="outline" onClick={handlePreviewHTML} className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={handleCopyHTML} className="flex-1">
              <Copy className="h-4 w-2 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {showHtmlPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">HTML Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={htmlPreview}
              readOnly
              className="h-64 font-mono text-xs"
            />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowHtmlPreview(false)} className="flex-1">
                Close Preview
              </Button>
              <Button onClick={handleExportHTML} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download This HTML
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Navigation */}
      {onTabChange && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Export Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => onTabChange("export")} 
              className="w-full"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure Export Settings
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              Customize export options, templates, and advanced settings
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
