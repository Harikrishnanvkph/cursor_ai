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
import { useTemplateStore } from "@/lib/template-store"
import { downloadChartAsHTML, type HTMLExportOptions } from "@/lib/html-exporter"
import { downloadTemplateExport, type TemplateExportOptions } from "@/lib/template-export"
import { templateList } from "@/lib/html-templates"
import { Download, Copy, FileImage, FileText, Code, FileCode, Settings, Layers } from "lucide-react"

interface ExportPanelProps {
  onTabChange?: (tab: string) => void
}

export function ExportPanel({ onTabChange }: ExportPanelProps) {
  const { chartData, chartConfig, chartType, globalChartRef, updateChartConfig } = useChartStore()
  const { currentTemplate, setEditorMode, editorMode } = useTemplateStore()
  const [exportMode, setExportMode] = useState<"chart" | "template">("chart")
  const [exportFormat, setExportFormat] = useState("png")
  const [dimensionMode, setDimensionMode] = useState<"auto" | "manual">("auto")
  const [manualWidth, setManualWidth] = useState(800)
  const [manualHeight, setManualHeight] = useState(600)
  const [widthInput, setWidthInput] = useState("800")
  const [heightInput, setHeightInput] = useState("600")
  
  // Check if global template mode is active
  const isGlobalTemplateMode = editorMode === 'template'
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
    template: "plain"
  })
  // Force Auto mode when global template mode is active
  useEffect(() => {
    if (isGlobalTemplateMode) {
      setDimensionMode("auto")
      updateChartConfig({
        ...chartConfig,
        responsive: true,
        manualDimensions: false,
        dynamicDimension: false
      })
      console.log('Global Template mode active → Forced Auto (Responsive) in Export Settings')
    }
  }, [isGlobalTemplateMode])

  // Initialize dimension mode based on chartConfig
  useEffect(() => {
    // Check chartConfig to determine initial dimension mode
    if (chartConfig.manualDimensions === true && !isGlobalTemplateMode) {
      setDimensionMode("manual")
      // Extract width and height from chartConfig if available
      const width = typeof (chartConfig as any).width === 'string' 
        ? parseInt((chartConfig as any).width) 
        : (chartConfig as any).width || 800
      const height = typeof (chartConfig as any).height === 'string'
        ? parseInt((chartConfig as any).height)
        : (chartConfig as any).height || 600
      setManualWidth(width)
      setManualHeight(height)
      setWidthInput(width.toString())
      setHeightInput(height.toString())
      console.log(`Export initialized with Manual Dimensions from chartConfig: ${width}×${height}px`)
    } else if (chartConfig.responsive === true || isGlobalTemplateMode) {
      setDimensionMode("auto")
      console.log('Export initialized with Auto mode (Responsive) from chartConfig')
    }
  }, []) // Run once on mount

  // Initialize manual dimensions with current canvas size
  useEffect(() => {
    if (globalChartRef?.current?.canvas) {
      const currentWidth = globalChartRef.current.canvas.width
      const currentHeight = globalChartRef.current.canvas.height
      
      // Initialize manual dimensions with current canvas dimensions
      setManualWidth(currentWidth)
      setManualHeight(currentHeight)
      setWidthInput(currentWidth.toString())
      setHeightInput(currentHeight.toString())
      
      console.log(`Initial canvas dimensions: ${currentWidth}×${currentHeight}px`)
    }
  }, [globalChartRef?.current?.canvas]) // Re-run when canvas becomes available

  // Handle export mode change and update editor mode
  const handleExportModeChange = (value: "chart" | "template") => {
    setExportMode(value)
    // Switch preview mode based on export mode
    if (value === "chart") {
      setEditorMode("chart")
    } else {
      setEditorMode("template")
      // When switching to template mode, force Auto (Responsive) dimension
      setDimensionMode("auto")
      updateChartConfig({
        ...chartConfig,
        responsive: true,
        manualDimensions: false,
        dynamicDimension: false
      })
      console.log('Export: Template mode → Forced Auto (Responsive) in Layout and Dimensions')
    }
  }

  // Handle dimension mode change
  const handleDimensionModeChange = (value: "auto" | "manual") => {
    setDimensionMode(value)
    
    if (value === "auto") {
      // Sync to Layout and Dimensions: Auto = Responsive mode
      updateChartConfig({
        ...chartConfig,
        responsive: true,
        manualDimensions: false,
        dynamicDimension: false
      })
      console.log('Export: Auto mode → Synced to Responsive in Layout and Dimensions')
    } else if (value === "manual") {
      // Sync to Layout and Dimensions: Manual = Manual Dimensions mode
      let currentWidth = 800
      let currentHeight = 600
      
      // If switching to manual mode, capture current canvas dimensions
      if (exportMode === "chart" && globalChartRef?.current?.canvas) {
        currentWidth = globalChartRef.current.canvas.width
        currentHeight = globalChartRef.current.canvas.height
        
        // Update manual dimensions to match current canvas size
        setManualWidth(currentWidth)
        setManualHeight(currentHeight)
        setWidthInput(currentWidth.toString())
        setHeightInput(currentHeight.toString())
        
        console.log(`Manual mode activated with current canvas dimensions: ${currentWidth}×${currentHeight}px`)
      }
      
      // Update chartConfig with manual dimensions
      updateChartConfig({
        ...chartConfig,
        manualDimensions: true,
        responsive: false,
        dynamicDimension: false,
        width: `${currentWidth}px`,
        height: `${currentHeight}px`
      })
      console.log(`Export: Manual mode → Synced to Manual Dimensions in Layout and Dimensions (${currentWidth}×${currentHeight}px)`)
    }
  }

  // Handle width input change
  const handleWidthChange = (value: string) => {
    setWidthInput(value)
  }

  // Handle width input blur (validate)
  const handleWidthBlur = () => {
    const numValue = parseInt(widthInput)
    if (isNaN(numValue) || numValue < 250) {
      const validValue = Math.max(250, manualWidth)
      setManualWidth(validValue)
      setWidthInput(validValue.toString())
    } else {
      setManualWidth(numValue)
      setWidthInput(numValue.toString())
      // Update canvas dimensions if in manual mode and chart mode
      if (exportMode === "chart" && dimensionMode === "manual") {
        updateCanvasDimensions(numValue, manualHeight)
        // Sync to Layout and Dimensions
        updateChartConfig({
          ...chartConfig,
          width: `${numValue}px`,
          height: `${manualHeight}px`,
          manualDimensions: true,
          responsive: false,
          dynamicDimension: false
        })
        console.log(`Export: Width updated to ${numValue}px → Synced to Layout and Dimensions`)
      }
    }
  }

  // Handle height input change
  const handleHeightChange = (value: string) => {
    setHeightInput(value)
  }

  // Handle height input blur (validate)
  const handleHeightBlur = () => {
    const numValue = parseInt(heightInput)
    if (isNaN(numValue) || numValue < 250) {
      const validValue = Math.max(250, manualHeight)
      setManualHeight(validValue)
      setHeightInput(validValue.toString())
    } else {
      setManualHeight(numValue)
      setHeightInput(numValue.toString())
      // Update canvas dimensions if in manual mode and chart mode
      if (exportMode === "chart" && dimensionMode === "manual") {
        updateCanvasDimensions(manualWidth, numValue)
        // Sync to Layout and Dimensions
        updateChartConfig({
          ...chartConfig,
          width: `${manualWidth}px`,
          height: `${numValue}px`,
          manualDimensions: true,
          responsive: false,
          dynamicDimension: false
        })
        console.log(`Export: Height updated to ${numValue}px → Synced to Layout and Dimensions`)
      }
    }
  }

  // Update canvas dimensions
  const updateCanvasDimensions = (width: number, height: number) => {
    if (globalChartRef?.current) {
      const chart = globalChartRef.current
      const canvas = chart.canvas
      const container = canvas.parentElement
      
      if (container) {
        // Update container dimensions
        container.style.width = `${width}px`
        container.style.height = `${height}px`
      }
      
      // Update canvas dimensions
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      
      // Resize the chart to fit the new dimensions
      chart.resize(width, height)
      
      console.log(`Canvas resized to ${width}×${height}px`)
    }
  }

  // Get dimensions based on mode
  const getExportDimensions = (): { width: number; height: number } => {
    if (exportMode === "template" && currentTemplate) {
      // Template always uses template dimensions
      return {
        width: currentTemplate.width,
        height: currentTemplate.height
      }
    }
    
    if (dimensionMode === "manual") {
      // Use manual dimensions
      return {
        width: Math.max(250, manualWidth),
        height: Math.max(250, manualHeight)
      }
    }
    
    // Auto mode: use canvas dimensions
    if (globalChartRef?.current?.canvas) {
      return {
        width: globalChartRef.current.canvas.width,
        height: globalChartRef.current.canvas.height
      }
    }
    
    // Fallback
    return { width: 800, height: 600 }
  }

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

  const handleExportHTML = async () => {
    if (exportMode === "template" && currentTemplate) {
      const chartInstance = globalChartRef?.current
      if (!chartInstance) {
        console.error('Chart instance not available')
        return
      }

      try {
        // Add a small delay to ensure chart is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const chartCanvas = chartInstance.canvas
        
        await downloadTemplateExport(
          currentTemplate,
          chartCanvas,
          chartData,
          chartConfig,
          {
            format: 'html',
            fileName: (htmlOptions.fileName || `chart-${new Date().toISOString().slice(0, 10)}`).replace('.html', ''),
            quality: 1,
            scale: 4
          }
        )
        console.log('Template exported successfully as HTML')
      } catch (error) {
        console.error('Error exporting template as HTML:', error)
      }
    } else {
      const dimensions = getExportDimensions()
      const updatedHtmlOptions = {
        ...htmlOptions,
        width: dimensions.width,
        height: dimensions.height,
        fileName: htmlOptions.fileName || `chart-${new Date().toISOString().slice(0, 10)}.html`
      }
      
      const result = await downloadChartAsHTML(updatedHtmlOptions)
      if (result.success) {
        console.log(result.message)
      } else {
        console.error(result.error)
      }
    }
  }

  const handleExportImage = async () => {
    if (exportMode === "template" && currentTemplate) {
      const chartInstance = globalChartRef?.current
      if (!chartInstance) {
        console.error('Chart instance not available')
        return
      }

      try {
        // Add a small delay to ensure chart is fully rendered
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const chartCanvas = chartInstance.canvas
        
        await downloadTemplateExport(
          currentTemplate,
          chartCanvas,
          chartData,
          chartConfig,
          {
            format: exportFormat as 'png' | 'jpeg',
            fileName: `${currentTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}`,
            quality: 1,
            scale: 4
          }
        )
        console.log(`Template exported successfully as ${exportFormat.toUpperCase()}`)
      } catch (error) {
        console.error(`Error exporting template as ${exportFormat}:`, error)
      }
    } else {
      // Export chart image using the existing chart export functionality
      if (globalChartRef?.current) {
        const chartInstance = globalChartRef.current
        if (chartInstance.exportToImage) {
          try {
            chartInstance.exportToImage({
              background: chartConfig.backgroundColor || '#ffffff',
              fileNamePrefix: 'chart',
              quality: 1.0
            })
          } catch (error) {
            console.error('Error during chart export:', error)
          }
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* General Settings */}
      <Card className="border-indigo-100 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-600" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Export Mode */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Export Mode</Label>
            <Select value={exportMode} onValueChange={handleExportModeChange}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chart">Chart Only</SelectItem>
                <SelectItem value="template">Chart Template</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Messages */}
          {exportMode === "template" && !currentTemplate && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              ⚠️ No template selected. Switch to Template mode in the editor to create one.
            </div>
          )}

          {/* Dimension Settings */}
          <div>
            <Label className="text-xs font-medium text-gray-700">Dimension</Label>
            <Select 
              value={dimensionMode}
              onValueChange={handleDimensionModeChange}
              disabled={exportMode === "template" || isGlobalTemplateMode}
            >
              <SelectTrigger className={`h-9 text-xs ${(exportMode === "template" || isGlobalTemplateMode) ? "opacity-50 cursor-not-allowed" : ""}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto (Responsive)</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
              </SelectContent>
            </Select>
            {exportMode === "template" && (
              <p className="text-xs text-gray-500 mt-1">Template dimensions are always used</p>
            )}
            {isGlobalTemplateMode && exportMode !== "template" && (
              <p className="text-xs text-amber-600 mt-1">🔒 Locked to Auto in Template mode</p>
            )}
          </div>

          {/* Manual Dimension Inputs */}
          {exportMode === "chart" && dimensionMode === "manual" && !isGlobalTemplateMode && (
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <Label className="text-xs font-medium text-gray-700">Width (px)</Label>
                <Input
                  type="number"
                  value={widthInput}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  onBlur={handleWidthBlur}
                  min="250"
                  className="h-8 text-xs"
                  placeholder="800"
                />
                <p className="text-xs text-gray-500 mt-0.5">Min: 250px</p>
              </div>
              <div>
                <Label className="text-xs font-medium text-gray-700">Height (px)</Label>
                <Input
                  type="number"
                  value={heightInput}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  onBlur={handleHeightBlur}
                  min="250"
                  className="h-8 text-xs"
                  placeholder="600"
                />
                <p className="text-xs text-gray-500 mt-0.5">Min: 250px</p>
              </div>
            </div>
          )}

          {/* Current Dimensions Display */}
          {exportMode === "chart" && dimensionMode === "auto" && !isGlobalTemplateMode && globalChartRef?.current?.canvas && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-200">
              📐 Current canvas: {globalChartRef.current.canvas.width} × {globalChartRef.current.canvas.height} px
            </div>
          )}
        </CardContent>
      </Card>

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
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleExportImage} 
            className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700"
            disabled={exportMode === "template" && !currentTemplate}
          >
            <FileImage className="h-3 w-3 mr-2" />
            Export {exportMode === "template" ? "Template" : "Chart"} as {exportFormat.toUpperCase()}
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
            <Label className="text-xs font-medium text-gray-700">File Name</Label>
            <Input
              value={htmlOptions.fileName}
              onChange={(e) => setHtmlOptions({ ...htmlOptions, fileName: e.target.value })}
              placeholder="chart.html"
              className="h-8 text-xs"
            />
          </div>

          <div>
            <Label className="text-xs font-medium text-gray-700">Style</Label>
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

          <Button 
            onClick={handleExportHTML} 
            className="w-full h-9 text-xs bg-orange-600 hover:bg-orange-700 mt-3"
            disabled={exportMode === "template" && !currentTemplate}
          >
            <Download className="h-3 w-3 mr-2" />
            Download {exportMode === "template" ? "Template" : "Chart"} HTML
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
