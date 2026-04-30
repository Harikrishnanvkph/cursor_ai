"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, Sparkles, TrendingUp, PieChart, LineChart, Ruler, Zap, Info } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { toast } from "sonner"
import { ChartSetupDialog, type ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
import { DEFAULT_CHART_WIDTH, DEFAULT_CHART_HEIGHT } from "@/lib/utils/dimension-utils"
import { getDefaultConfigForType } from "@/lib/chart-defaults"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"

interface EditorWelcomeScreenProps {
  onDatasetClick?: () => void
  size?: "default" | "compact"
  className?: string
}

export function EditorWelcomeScreen({ onDatasetClick, size = "default", className = "" }: EditorWelcomeScreenProps) {
  const { setFullChart, setHasJSON, setChartMode } = useChartStore()
  const { setEditorMode } = useTemplateStore()
  const { clearMessages, setBackendConversationId } = useChatStore()
  const { addDataset } = useChartActions()

  // ── Setup dialog state ──
  const [showSetupDialog, setShowSetupDialog] = useState(false)
  const [pendingAction, setPendingAction] = useState<'sample' | 'custom' | null>(null)
  const [datasetType, setDatasetType] = useState<'single' | 'grouped'>('single')

  // Always reset Welcome Screen UI state when the component is shown
  // This fulfills the "Golden Rule" that the welcome screen starts with defaults.
  useEffect(() => {
    setDatasetType('single')
    setPendingAction(null)
    setShowSetupDialog(false)
  }, [])

  // ── Build sample data ──
  const buildSampleData = () => {
    if (datasetType === 'grouped') {
      return {
        labels: ['January', 'February', 'March', 'April', 'May', 'June'],
        datasets: [
          {
            label: 'Sales',
            data: [120, 190, 130, 150, 120, 130],
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 2,
          },
          {
            label: 'Expenses',
            data: [80, 110, 70, 150, 90, 60],
            backgroundColor: 'rgba(255, 99, 132, 0.8)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 2,
          }
        ]
      }
    }

    return {
      labels: ['January', 'February', 'March', 'April', 'May', 'June'],
      datasets: [{
        label: 'Sample Dataset',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 2,
        pointImages: [null, null, null, null, null, null],
        pointImageConfig: [
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
          { type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" },
        ],
        mode: 'single' as const,
        sliceLabels: ['January', 'February', 'March', 'April', 'May', 'June'],
        chartType: 'bar' as const,
      }]
    }
  }

  // ── Apply dimensions to chart config ──
  const buildConfigWithDimensions = (dims: ChartDimensions) => {
    const baseConfig = getDefaultConfigForType('bar')
    if (dims.isResponsive) {
      return {
        ...baseConfig,
        responsive: true,
        manualDimensions: false,
        dynamicDimension: false,
      }
    }
    return {
      ...baseConfig,
      responsive: false,
      manualDimensions: true,
      dynamicDimension: false,
      width: `${dims.width}px`,
      height: `${dims.height}px`,
    }
  }

  // ── Quick Load: Sample data at default 800×600 ──
  const handleQuickLoadSample = () => {
    clearMessages()
    setBackendConversationId(null)
    setEditorMode('chart')

    const sampleData = buildSampleData()
    const config = buildConfigWithDimensions({
      width: DEFAULT_CHART_WIDTH,
      height: DEFAULT_CHART_HEIGHT,
      isResponsive: false,
    })

    // Switch to the selected mode first (this swaps chartData to the correct mode's data)
    setChartMode(datasetType)

    if (datasetType === 'single') {
      // Single mode: append if data exists, fresh start if empty
      const { chartData } = useChartStore.getState()
      if (chartData.datasets && chartData.datasets.length > 0) {
        addDataset(sampleData.datasets[0])
        setHasJSON(true)
        toast.success("Sample dataset added to chart")
      } else {
        setFullChart({
          chartType: 'bar',
          chartData: sampleData,
          chartConfig: config,
          replaceMode: true
        })
        setHasJSON(true)
        toast.success(`Sample data loaded (${DEFAULT_CHART_WIDTH}×${DEFAULT_CHART_HEIGHT} px)`)
      }
    } else {
      // Grouped mode: setFullChart WITHOUT replaceMode creates a new group and appends
      setFullChart({
        chartType: 'bar',
        chartData: sampleData,
        chartConfig: config,
        name: 'Sample Group',
        replaceMode: true
      })
      setHasJSON(true)
      toast.success(`Sample grouped chart loaded (${DEFAULT_CHART_WIDTH}×${DEFAULT_CHART_HEIGHT} px)`)
    }
  }

  // ── Custom Dimensions: open dialog then load sample data ──
  const handleCustomDimensionSample = () => {
    setPendingAction('sample')
    setShowSetupDialog(true)
  }

  // ── Custom Dimensions: open dialog then go to datasets ──
  const handleCustomDimensionDataset = () => {
    setPendingAction('custom')
    setShowSetupDialog(true)
  }

  // ── Dialog confirmed ──
  const handleDimensionsConfirmed = (
    dims: ChartDimensions,
    initialDatasets?: any[],
    chartType?: any,
    uniformityMode?: 'uniform' | 'mixed',
    groupName?: string
  ) => {
    setShowSetupDialog(false)
    clearMessages()
    setBackendConversationId(null)
    setEditorMode('chart')

    const config = buildConfigWithDimensions(dims)

    if (pendingAction === 'sample') {
      const sampleData = buildSampleData()
      const sizeLabel = dims.isResponsive ? 'Responsive' : `${dims.width}×${dims.height} px`

      // Switch to the selected mode first
      setChartMode(datasetType)

      if (datasetType === 'single') {
        const { chartData } = useChartStore.getState()
        if (chartData.datasets && chartData.datasets.length > 0) {
          addDataset(sampleData.datasets[0])
          setHasJSON(true)
          toast.success("Sample dataset added to chart")
        } else {
          setFullChart({
            chartType: 'bar',
            chartData: sampleData,
            chartConfig: config,
            replaceMode: true
          })
          setHasJSON(true)
          toast.success(`Sample data loaded (${sizeLabel})`)
        }
      } else {
        // Grouped mode: setFullChart WITHOUT replaceMode creates a new group and appends
        setFullChart({
          chartType: 'bar',
          chartData: sampleData,
          chartConfig: config,
          name: groupName || 'Sample Group',
          replaceMode: true
        })
        setHasJSON(true)
        toast.success(`Sample grouped chart loaded (${sizeLabel})`)
      }
    } else if (pendingAction === 'custom') {
      // Initialize chart with the entered dimensions and dataset
      setChartMode(datasetType)
      
      const newChartData = {
        labels: initialDatasets?.[0]?.sliceLabels || [],
        datasets: initialDatasets || []
      }

      const newConfig = { ...config }
      if (uniformityMode && datasetType === 'grouped') {
        newConfig.visualSettings = {
          ...newConfig.visualSettings,
          uniformityMode
        }
      } else if (datasetType === 'single' && groupName) {
        newConfig.plugins = newConfig.plugins || {};
        newConfig.plugins.title = {
          ...newConfig.plugins.title,
          display: true,
          text: groupName
        };
      }

      setFullChart({
        chartType: chartType || 'bar',
        chartData: newChartData,
        chartConfig: newConfig,
        name: groupName,
        replaceMode: true
      })
      setHasJSON(true)
      // Navigate to datasets tab
      if (onDatasetClick) {
        onDatasetClick()
        const sizeLabel = dims.isResponsive ? 'Responsive' : `${dims.width}×${dims.height} px`
        toast.info(`Chart initialized at ${sizeLabel}.`)
      }
    }

    setPendingAction(null)
  }

  const isCompact = size === "compact"

  return (
    <>
      <div className={`flex items-center justify-center h-full w-full p-4 ${className}`}>
        <Card className={`w-full ${isCompact ? 'max-w-lg' : 'max-w-2xl'} border-2 border-dashed border-gray-300 bg-gradient-to-br from-white to-gray-50 shadow-xl`}>
          <CardHeader className="text-center pb-4">

            <CardTitle className={`text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent`}>
              Welcome to Chart Editor
            </CardTitle>
            <CardDescription className={`${isCompact ? 'text-sm' : 'text-base'} text-gray-600 mt-2`}>
              Start creating your chart by choosing one of the options below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pb-6">
            {/* ── Dataset Type Selection ── */}
            <div className="bg-gray-50/50 p-4 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Dataset Type</h3>
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
                    </TooltipTrigger>
                    <TooltipContent className="w-[300px] p-3 text-xs z-[100] shadow-lg" side="top" sideOffset={5}>
                      <div className="space-y-2 leading-relaxed text-gray-600">
                        <p>
                          <strong className="text-gray-900">Single Chart:</strong> Visualizes a single dataset or metric across different categories. Best for pie, donut, and basic bar/line charts.
                        </p>
                        <p>
                          <strong className="text-gray-900">Grouped Chart:</strong> Visualizes multiple datasets or metrics simultaneously for comparison. Best for grouped bars, stacked charts, and multi-line charts.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <RadioGroup
                defaultValue="single"
                value={datasetType}
                onValueChange={(val) => setDatasetType(val as 'single' | 'grouped')}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="single" id="type-single" />
                  <Label htmlFor="type-single" className="cursor-pointer text-sm font-medium">Single Chart</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="grouped" id="type-grouped" />
                  <Label htmlFor="type-grouped" className="cursor-pointer text-sm font-medium">Grouped Chart</Label>
                </div>
              </RadioGroup>
            </div>

            {/* ── Load Sample Data Section ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-600" />
                Load Sample Data
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {/* Quick Load (default dimensions) */}
                <Card
                  className="border-2 border-gray-200 hover:border-purple-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={handleQuickLoadSample}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                        <Zap className="h-4 w-4 text-purple-600" />
                      </div>
                      <CardTitle className="text-sm">Quick Start</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Load sample data at standard size ({DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px)
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <TrendingUp className="h-3 w-3" />
                      <span>Instant • 6 data points • {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Custom Dimensions + Sample Data */}
                <Card
                  className="border-2 border-gray-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                  onClick={handleCustomDimensionSample}
                >
                  <CardHeader className="pb-2 pt-4 px-4">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <Ruler className="h-4 w-4 text-indigo-600" />
                      </div>
                      <CardTitle className="text-sm">Choose Size</CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Pick a preset or enter custom dimensions, then load sample data
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 px-4">
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <Sparkles className="h-3 w-3" />
                      <span>Custom size • px / mm / cm</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* ── Add Your Own Data Section ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                Add Your Own Data
              </h3>
              <Card
                className="border-2 border-gray-200 hover:border-green-400 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={handleCustomDimensionDataset}
              >
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                      <Database className="h-4 w-4 text-blue-600" />
                    </div>
                    <CardTitle className="text-sm">Set Dimensions & Add Data</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Choose your chart size first, then enter your own custom data
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 pb-3 px-4">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Database className="h-3 w-3" />
                    <span>Custom size • Full control • Your data</span>
                  </div>
                </CardContent>
              </Card>
            </div>


          </CardContent>
        </Card>
      </div>

      {/* ── Chart Setup Dialog ── */}
      <ChartSetupDialog
        open={showSetupDialog}
        onClose={() => {
          setShowSetupDialog(false)
          setPendingAction(null)
        }}
        onConfirm={handleDimensionsConfirmed}
        title={pendingAction === 'sample' ? 'Choose Chart Size' : 'Set Up Chart Dimensions'}
        datasetType={datasetType}
        isCustom={pendingAction === 'custom'}
      />
    </>
  )
}
