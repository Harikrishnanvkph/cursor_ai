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
    template: "standard"
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
    <div className="space-y-4">
      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileImage className="h-4 w-4 text-blue-600" />
            Chart Image
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-700">Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (Recommended)</SelectItem>
                <SelectItem value="jpg">JPG</SelectItem>
                <SelectItem value="svg">SVG</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700">
            <FileImage className="h-3 w-3 mr-2" />
            Export as {exportFormat.toUpperCase()}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-purple-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="h-4 w-4 text-purple-600" />
            Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={handleExportConfig} className="h-8 text-xs">
              <Download className="h-3 w-3 mr-1" />
              JSON
            </Button>
            <Button variant="outline" onClick={handleCopyConfig} className="h-8 text-xs">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Chart.js Config</Label>
            <Textarea
              value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
              readOnly
              className="h-24 font-mono text-[10px] bg-gray-50"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-green-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-green-600" />
            Data Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExportData} className="w-full h-9 text-xs">
            <FileText className="h-3 w-3 mr-2" />
            Export as CSV
          </Button>
        </CardContent>
      </Card>

      <Card className="border-orange-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCode className="h-4 w-4 text-orange-600" />
            HTML Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-medium text-gray-700">Title</Label>
            <Input
              value={htmlOptions.title}
              onChange={(e) => setHtmlOptions({ ...htmlOptions, title: e.target.value })}
              placeholder="Chart Title"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">File Name</Label>
            <Input
              value={htmlOptions.fileName}
              onChange={(e) => setHtmlOptions({ ...htmlOptions, fileName: e.target.value })}
              placeholder="chart.html"
              className="h-8 text-xs"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium text-gray-700">Width</Label>
              <Input
                type="number"
                value={htmlOptions.width}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, width: parseInt(e.target.value) || 800 })}
                min="200"
                max="2000"
                className="h-8 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-medium text-gray-700">Height</Label>
              <Input
                type="number"
                value={htmlOptions.height}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, height: parseInt(e.target.value) || 600 })}
                min="200"
                max="2000"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Background</Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={htmlOptions.backgroundColor}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, backgroundColor: e.target.value })}
                className="w-10 h-8 rounded border cursor-pointer"
              />
              <Input
                value={htmlOptions.backgroundColor}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, backgroundColor: e.target.value })}
                placeholder="#ffffff"
                className="h-8 text-xs flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Template</Label>
            <Select value={htmlOptions.template} onValueChange={(value) => setHtmlOptions({ ...htmlOptions, template: value })}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateList.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <span className="text-xs">{template.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label className="text-xs font-medium text-gray-700">Options</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-orange-50 p-2 rounded">
                <Label className="text-xs">Responsive</Label>
                <Switch
                  checked={htmlOptions.includeResponsive}
                  onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeResponsive: checked })}
                />
              </div>
              <div className="flex items-center justify-between bg-orange-50 p-2 rounded">
                <Label className="text-xs">Animations</Label>
                <Switch
                  checked={htmlOptions.includeAnimations}
                  onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeAnimations: checked })}
                />
              </div>
              <div className="flex items-center justify-between bg-orange-50 p-2 rounded">
                <Label className="text-xs">Tooltips</Label>
                <Switch
                  checked={htmlOptions.includeTooltips}
                  onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeTooltips: checked })}
                />
              </div>
              <div className="flex items-center justify-between bg-orange-50 p-2 rounded">
                <Label className="text-xs">Legend</Label>
                <Switch
                  checked={htmlOptions.includeLegend}
                  onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeLegend: checked })}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button onClick={handleExportHTML} className="h-8 text-xs col-span-3 bg-orange-600 hover:bg-orange-700">
              <Download className="h-3 w-3 mr-1" />
              Download
            </Button>
            <Button variant="outline" onClick={handlePreviewHTML} className="h-8 text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Preview
            </Button>
            <Button variant="outline" onClick={handleCopyHTML} className="h-8 text-xs col-span-2">
              <Copy className="h-3 w-3 mr-1" />
              Copy Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {showHtmlPreview && (
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code className="h-4 w-4 text-gray-600" />
              HTML Preview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={htmlPreview}
              readOnly
              className="h-48 font-mono text-[10px] bg-gray-50"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setShowHtmlPreview(false)} className="h-8 text-xs">
                Close
              </Button>
              <Button onClick={handleExportHTML} className="h-8 text-xs bg-orange-600 hover:bg-orange-700">
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Settings Navigation */}
      {onTabChange && (
        <Card className="border-gray-200 shadow-sm bg-gradient-to-br from-gray-50 to-white">
          <CardContent className="pt-6">
            <Button 
              variant="outline" 
              onClick={() => onTabChange("export")} 
              className="w-full h-9 text-xs border-2 hover:border-blue-400 hover:bg-blue-50"
            >
              <Settings className="h-4 w-4 mr-2" />
              Advanced Export Settings
            </Button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              More export options & customization
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
