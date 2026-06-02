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
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useTemplateStore } from "@/lib/template-store"
import { downloadChartAsHTML, type HTMLExportOptions, filterChartDataForExport } from "@/lib/html-exporter"
import { downloadTemplateExport, type TemplateExportOptions } from "@/lib/template-export"
import { templateList } from "@/lib/html-templates"
import { type DimensionUnit, convertFromPixels, convertToPixels } from "@/lib/utils/dimension-utils"
import { FileImage, FileText, FileCode, Settings, Layers, Share2, Link as LinkIcon } from "lucide-react"
import { dataService } from "@/lib/data-service"
import { toast } from "sonner"

interface ExportPanelProps {
  onTabChange?: (tab: string) => void
}

export function ExportPanel({ onTabChange }: ExportPanelProps) {
  const { chartData, chartConfig, chartType, globalChartRef, currentSnapshotId, chartMode, activeDatasetIndex, activeGroupId, legendFilter } = useChartStore()
  const { updateChartConfig } = useChartActions()
  const { currentTemplate, setEditorMode, editorMode } = useTemplateStore()
  const [exportMode, setExportMode] = useState<"chart" | "template">("chart")
  const [exportFormat, setExportFormat] = useState("png")
  const [exportScale, setExportScale] = useState("2")
  const [dimensionMode, setDimensionMode] = useState<"auto" | "manual">("auto")
  const [unit, setUnit] = useState<DimensionUnit>("px")
  const [manualWidth, setManualWidth] = useState(800)
  const [manualHeight, setManualHeight] = useState(600)
  const [widthInput, setWidthInput] = useState("800")
  const [heightInput, setHeightInput] = useState("600")
  const [isSharing, setIsSharing] = useState(false)

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



  const handleExportData = () => {
    // Filter data so we only export what is visible (e.g. single mode vs grouped mode, legend filters)
    const exportData = filterChartDataForExport(
        JSON.parse(JSON.stringify(chartData)),
        chartMode,
        activeDatasetIndex,
        legendFilter,
        activeGroupId,
        chartType
    );

    const csvContent = [
      ["Label", ...exportData.datasets.map((d: any) => d.label)],
      ...(exportData.labels?.map((label: string, index: number) => [label, ...exportData.datasets.map((d: any) => d.data[index] || "")]) ||
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
            scale: parseInt(exportScale)
          }
        )
        toast.success("HTML downloaded successfully!", { id: "html-export" })
      } catch (error) {
        console.error("HTML export error:", error)
        toast.error("Failed to generate HTML", { id: "html-export" })
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
            scale: parseInt(exportScale)
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
              background: (chartConfig as any)?.background || {
                type: 'color',
                color: chartConfig.backgroundColor || '#ffffff',
                opacity: 100
              },
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

  const handleShareLink = async () => {
    if (!currentSnapshotId) {
      toast.error("Please ensure the chart is saved before sharing.");
      return;
    }
    try {
      setIsSharing(true);
      toast.loading("Generating share link...", { id: "share-link" });
      const response = await dataService.generateShareLink(currentSnapshotId);
      if (response.error || !response.data) {
        throw new Error(response.error || "Failed to generate link");
      }
      const shareUrl = `${window.location.origin}/share/${response.data.share_id}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!", { id: "share-link" });
    } catch (err: any) {
      toast.error(err.message || "Failed to generate share link.", { id: "share-link" });
      console.error("Share error:", err);
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="space-y-4">


      <Card className="border-blue-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full -z-10 opacity-50"></div>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2 text-blue-900">
            <Share2 className="h-4 w-4 text-blue-600" />
            Share Online
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
            Generate a fast, public link to share this interactive chart with anyone. Perfect for pasting into Slack, emails, or docs!
          </p>
          <Button
            onClick={handleShareLink}
            className="w-full h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            disabled={isSharing || !currentSnapshotId}
            variant="default"
          >
            {isSharing ? (
              <span className="flex items-center">
                <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Generating...
              </span>
            ) : (
              <span className="flex items-center">
                <LinkIcon className="h-3 w-3 mr-2" />
                Copy Share Link
              </span>
            )}
          </Button>
          {!currentSnapshotId && (
            <p className="text-[10px] text-amber-600 mt-2 text-center bg-amber-50 px-2 py-1 rounded">
              You must save this chart to a conversation first.
            </p>
          )}
        </CardContent>
      </Card>





      <Card className="border-blue-100 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
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


    </div>
  )
}
