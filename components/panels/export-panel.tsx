"use client"

import { useState, useEffect } from "react"
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
import { Download, Copy, FileImage, FileText, Code, FileCode, Settings, Eye, Monitor, Smartphone } from "lucide-react"

interface ExportPanelProps {
  onTabChange?: (tab: string) => void
}

export function ExportPanel({ onTabChange }: ExportPanelProps) {
  const { chartData, chartConfig, chartType, exportChart } = useChartStore()
  const [exportFormat, setExportFormat] = useState("png")
  const [customDimensions, setCustomDimensions] = useState({
    width: 800,
    height: 600,
    useCustomDimensions: false
  })
  const [exportQuality, setExportQuality] = useState("high") // "high", "ultra", "standard"
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
    template: "onlyChart"
  })
  const [showHtmlPreview, setShowHtmlPreview] = useState(false)
  const [htmlPreview, setHtmlPreview] = useState("")

  // Get current chart dimensions
  const getCurrentChartDimensions = () => {
    const isResponsive = (chartConfig as any)?.responsive !== false
    
    // Parse width and height values, handling both numbers and strings with units
    const parseDimension = (value: any): number => {
      if (typeof value === 'number') {
        return isNaN(value) ? 800 : value
      }
      if (typeof value === 'string') {
        // Remove units and parse as number
        const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''))
        return isNaN(numericValue) ? 800 : numericValue
      }
      return 800 // Default fallback
    }
    
    if (!isResponsive) {
      const width = parseDimension((chartConfig as any)?.width)
      const height = parseDimension((chartConfig as any)?.height)
      return { width, height }
    }
    
    // For responsive charts, use default dimensions
    return { width: 800, height: 600 }
  }

  // Initialize dimensions when component mounts or chart changes
  useEffect(() => {
    const currentDimensions = getCurrentChartDimensions()
    setCustomDimensions(prev => ({
      ...prev,
      width: currentDimensions.width,
      height: currentDimensions.height
    }))
    setHtmlOptions(prev => ({
      ...prev,
      width: currentDimensions.width,
      height: currentDimensions.height
    }))
  }, [chartConfig])

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

  const handleExportImage = () => {
    console.log('🔄 Starting image export...')
    
    // Try multiple methods to find the chart
    let chart = null
    let chartElement = null
    
    // Method 1: Try to get chart from global reference (set by chart-preview)
    if ((window as any).currentChartRef) {
      chart = (window as any).currentChartRef
      chartElement = chart.canvas
      console.log('✅ Found chart via global reference')
    }
    
    // Method 2: Try to find canvas with data-chart attribute
    if (!chart) {
      chartElement = document.querySelector('canvas[data-chart]') as HTMLCanvasElement
      if (chartElement && (chartElement as any).chart) {
        chart = (chartElement as any).chart
        console.log('✅ Found chart via data-chart attribute')
      }
    }
    
    // Method 3: Try to find any canvas with Chart.js instance
    if (!chart) {
      const allCanvases = document.querySelectorAll('canvas')
      for (const canvas of allCanvases) {
        if ((canvas as any).chart && typeof (canvas as any).chart.exportToImage === 'function') {
          chart = (canvas as any).chart
          chartElement = canvas
          console.log('✅ Found chart via canvas search')
          break
        }
      }
    }
    
    // Method 4: Try to find chart via Chart.js registry
    if (!chart) {
      const chartInstances = (window as any).Chart?.instances || []
      if (chartInstances.length > 0) {
        chart = chartInstances[0]
        chartElement = chart.canvas
        console.log('✅ Found chart via Chart.js registry')
      }
    }
    
    if (!chart || !chart.exportToImage) {
      console.error('❌ Could not find chart or exportToImage method')
      console.log('Available canvases:', document.querySelectorAll('canvas').length)
      console.log('Chart instances:', (window as any).Chart?.instances?.length || 0)
      console.log('Global chart ref:', !!(window as any).currentChartRef)
      
      // Try using chart store export method as final fallback
      console.log('🔄 Trying chart store export method...')
      const exportOptions = {
        background: {
          type: 'color',
          color: '#ffffff',
          opacity: 100
        },
        fileNamePrefix: `chart-${exportFormat}`,
        quality: 1.0
      }
      
      if (customDimensions.useCustomDimensions) {
        exportOptions.customWidth = customDimensions.width
        exportOptions.customHeight = customDimensions.height
      }
      
      const success = exportChart(exportOptions)
      if (success) {
        console.log('✅ Export completed via chart store method')
        return
      }
      
      // Show user-friendly error
      alert('Could not find the chart. Please make sure a chart is visible and try again.')
      return
    }
    
    console.log('📊 Chart found, preparing export...')
    
    try {
      // Calculate quality multiplier based on export quality setting
      const qualityMultiplier = exportQuality === "ultra" ? 1 : exportQuality === "high" ? 1 : 1; // Standard is best
      
      const exportOptions = {
        background: {
          type: 'color',
          color: '#ffffff',
          opacity: 100
        },
        fileNamePrefix: `chart-${exportFormat}`,
        quality: 1.0 // Always use maximum quality
      }
      
      // If custom dimensions are enabled, pass them to the export function
      if (customDimensions.useCustomDimensions) {
        exportOptions.customWidth = customDimensions.width
        exportOptions.customHeight = customDimensions.height
        console.log('📏 Using custom dimensions:', customDimensions.width, 'x', customDimensions.height)
      }
      
      console.log('🚀 Calling chart.exportToImage with options:', exportOptions)
      chart.exportToImage(exportOptions)
      console.log('✅ Export completed successfully')
      
    } catch (error) {
      console.error('❌ Error during export:', error)
      alert('Export failed. Please try again.')
    }
  }

  const handleExportHTML = () => {
    const exportOptions = {
      ...htmlOptions,
      width: customDimensions.useCustomDimensions ? customDimensions.width : htmlOptions.width,
      height: customDimensions.useCustomDimensions ? customDimensions.height : htmlOptions.height
    }
    
    const result = downloadChartAsHTML(exportOptions)
    if (result.success) {
      console.log(result.message)
    } else {
      console.error(result.error)
    }
  }

  const handlePreviewHTML = () => {
    const exportOptions = {
      ...htmlOptions,
      width: customDimensions.useCustomDimensions ? customDimensions.width : htmlOptions.width,
      height: customDimensions.useCustomDimensions ? customDimensions.height : htmlOptions.height
    }
    
    const { content } = generateChartHTML(exportOptions)
    setHtmlPreview(content)
    setShowHtmlPreview(true)
  }

  const handleCopyHTML = async () => {
    const exportOptions = {
      ...htmlOptions,
      width: customDimensions.useCustomDimensions ? customDimensions.width : htmlOptions.width,
      height: customDimensions.useCustomDimensions ? customDimensions.height : htmlOptions.height
    }
    
    const { content } = generateChartHTML(exportOptions)
    await navigator.clipboard.writeText(content)
  }

  const handlePresetDimensions = (preset: 'desktop' | 'mobile' | 'tablet') => {
    const presets = {
      desktop: { width: 1200, height: 800 },
      tablet: { width: 800, height: 600 },
      mobile: { width: 400, height: 300 }
    }
    
    const dimensions = presets[preset]
    setCustomDimensions(prev => ({
      ...prev,
      ...dimensions
    }))
  }

  return (
    <div className="space-y-4 max-h-full overflow-y-auto p-1">

      {/* Custom Dimensions Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Export Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Use Custom Dimensions</Label>
            <Switch
              checked={customDimensions.useCustomDimensions}
              onCheckedChange={(checked) => setCustomDimensions(prev => ({ ...prev, useCustomDimensions: checked }))}
            />
          </div>

          {customDimensions.useCustomDimensions && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Width (px)</Label>
                  <Input
                    type="number"
                    value={customDimensions.width}
                    onChange={(e) => setCustomDimensions(prev => ({ 
                      ...prev, 
                      width: parseInt(e.target.value) || 800 
                    }))}
                    min="200"
                    max="3000"
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Height (px)</Label>
                  <Input
                    type="number"
                    value={customDimensions.height}
                    onChange={(e) => setCustomDimensions(prev => ({ 
                      ...prev, 
                      height: parseInt(e.target.value) || 600 
                    }))}
                    min="200"
                    max="3000"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <div className="font-medium mb-1">Current Chart Dimensions:</div>
                <div>Width: {getCurrentChartDimensions().width}px</div>
                <div>Height: {getCurrentChartDimensions().height}px</div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePresetDimensions('desktop')}
                  className="flex-1 text-xs"
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  Desktop
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePresetDimensions('tablet')}
                  className="flex-1 text-xs"
                >
                  <Monitor className="h-3 w-3 mr-1" />
                  Tablet
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handlePresetDimensions('mobile')}
                  className="flex-1 text-xs"
                >
                  <Smartphone className="h-3 w-3 mr-1" />
                  Mobile
                </Button>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const current = getCurrentChartDimensions()
                  setCustomDimensions(prev => ({
                    ...prev,
                    width: current.width,
                    height: current.height
                  }))
                }}
                className="w-full text-xs"
              >
                Use Current Chart Dimensions
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Image Export Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Export Chart Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Format</Label>
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="png">PNG (High Quality)</SelectItem>
                <SelectItem value="jpg">JPG (Compressed)</SelectItem>
                <SelectItem value="svg">SVG (Vector)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Quality</Label>
            <Select value={exportQuality} onValueChange={setExportQuality}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (Recommended)</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="ultra">Ultra</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Standard quality provides the best results. Higher settings may reduce quality.
            </p>
          </div>

          <Button onClick={handleExportImage} className="w-full">
            <FileImage className="h-4 w-4 mr-2" />
            Export as {exportFormat.toUpperCase()} ({exportQuality})
            {customDimensions.useCustomDimensions && (
              <span className="ml-2 text-xs opacity-75">
                ({customDimensions.width}×{customDimensions.height})
              </span>
            )}
          </Button>
          
          {/* Debug button - remove in production */}
          <Button 
            variant="outline" 
            onClick={() => {
              console.log('🔍 Debug: Checking chart availability...')
              console.log('Global chart ref:', !!(window as any).currentChartRef)
              console.log('Available canvases:', document.querySelectorAll('canvas').length)
              console.log('Chart instances:', (window as any).Chart?.instances?.length || 0)
              
              const chart = (window as any).currentChartRef
              if (chart) {
                console.log('✅ Chart found:', chart)
                console.log('Export method available:', !!chart.exportToImage)
              } else {
                console.log('❌ No chart found')
              }
            }}
            className="w-full text-xs"
          >
            Debug Chart Detection
          </Button>
        </CardContent>
      </Card>

      {/* HTML Export Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Export as HTML</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Title</Label>
              <Input
                value={htmlOptions.title}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, title: e.target.value })}
                placeholder="Chart Title"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">File Name</Label>
              <Input
                value={htmlOptions.fileName}
                onChange={(e) => setHtmlOptions({ ...htmlOptions, fileName: e.target.value })}
                placeholder="chart.html"
                className="text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Width (px)</Label>
              <Input
                type="number"
                value={customDimensions.useCustomDimensions ? customDimensions.width : htmlOptions.width}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 800
                  if (customDimensions.useCustomDimensions) {
                    setCustomDimensions(prev => ({ ...prev, width: value }))
                  } else {
                    setHtmlOptions({ ...htmlOptions, width: value })
                  }
                }}
                min="200"
                max="3000"
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">Height (px)</Label>
              <Input
                type="number"
                value={customDimensions.useCustomDimensions ? customDimensions.height : htmlOptions.height}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 600
                  if (customDimensions.useCustomDimensions) {
                    setCustomDimensions(prev => ({ ...prev, height: value }))
                  } else {
                    setHtmlOptions({ ...htmlOptions, height: value })
                  }
                }}
                min="200"
                max="3000"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Background Color</Label>
            <Input
              value={htmlOptions.backgroundColor}
              onChange={(e) => setHtmlOptions({ ...htmlOptions, backgroundColor: e.target.value })}
              placeholder="#ffffff"
              className="text-sm"
            />
          </div>

          <div>
            <Label className="text-xs">Template</Label>
            <Select value={htmlOptions.template} onValueChange={(value) => setHtmlOptions({ ...htmlOptions, template: value })}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateList.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div>
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-gray-500">{template.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Responsive</Label>
              <Switch
                checked={htmlOptions.includeResponsive}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeResponsive: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Animations</Label>
              <Switch
                checked={htmlOptions.includeAnimations}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeAnimations: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Tooltips</Label>
              <Switch
                checked={htmlOptions.includeTooltips}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeTooltips: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">Legend</Label>
              <Switch
                checked={htmlOptions.includeLegend}
                onCheckedChange={(checked) => setHtmlOptions({ ...htmlOptions, includeLegend: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleExportHTML} className="flex-1 text-sm">
              <FileCode className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
            <Button variant="outline" onClick={handlePreviewHTML} className="flex-1 text-sm">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" onClick={handleCopyHTML} className="flex-1 text-sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Export Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Export Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportConfig} className="flex-1 text-sm">
              <Download className="h-4 w-4 mr-2" />
              Download JSON
            </Button>
            <Button variant="outline" onClick={handleCopyConfig} className="flex-1 text-sm">
              <Copy className="h-4 w-4 mr-2" />
              Copy Config
            </Button>
          </div>

          <div>
            <Label className="text-xs">Chart.js Configuration</Label>
            <Textarea
              value={JSON.stringify({ type: chartType, data: chartData, options: chartConfig }, null, 2)}
              readOnly
              className="h-24 font-mono text-xs resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Export Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Export Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleExportData} className="w-full text-sm">
            <FileText className="h-4 w-4 mr-2" />
            Export as CSV
          </Button>
        </CardContent>
      </Card>

      {/* HTML Preview Section */}
      {showHtmlPreview && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">HTML Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={htmlPreview}
              readOnly
              className="h-32 font-mono text-xs resize-none"
            />
            <div className="flex gap-2 mt-3">
              <Button variant="outline" onClick={() => setShowHtmlPreview(false)} className="flex-1 text-sm">
                Close Preview
              </Button>
              <Button onClick={handleExportHTML} className="flex-1 text-sm">
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
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Export Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => onTabChange("export")} 
              className="w-full text-sm"
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
