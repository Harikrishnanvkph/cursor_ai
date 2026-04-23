"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, Sparkles, TrendingUp, PieChart, LineChart, Ruler, Zap } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { toast } from "sonner"
import { ChartSetupDialog, type ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
import { DEFAULT_CHART_WIDTH, DEFAULT_CHART_HEIGHT } from "@/lib/utils/dimension-utils"
import { getDefaultConfigForType } from "@/lib/chart-defaults"

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

  // ── Build sample data ──
  const buildSampleData = () => ({
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
  })

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
    const { chartData } = useChartStore.getState()

    if (chartData.datasets && chartData.datasets.length > 0) {
      addDataset(sampleData.datasets[0])
      setHasJSON(true)
      toast.success("Sample dataset added to current chart")
    } else {
      setChartMode('single')
      const config = buildConfigWithDimensions({
        width: DEFAULT_CHART_WIDTH,
        height: DEFAULT_CHART_HEIGHT,
        isResponsive: false,
      })
      setFullChart({
        chartType: 'bar',
        chartData: sampleData,
        chartConfig: config,
      })
      setHasJSON(true)
      toast.success(`Sample data loaded (${DEFAULT_CHART_WIDTH}×${DEFAULT_CHART_HEIGHT} px)`)
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
  const handleDimensionsConfirmed = (dims: ChartDimensions) => {
    setShowSetupDialog(false)
    clearMessages()
    setBackendConversationId(null)
    setEditorMode('chart')

    const config = buildConfigWithDimensions(dims)

    if (pendingAction === 'sample') {
      const sampleData = buildSampleData()
      const { chartData } = useChartStore.getState()

      if (chartData.datasets && chartData.datasets.length > 0) {
        addDataset(sampleData.datasets[0])
        setHasJSON(true)
        toast.success("Sample dataset added to current chart")
      } else {
        setChartMode('single')
        setFullChart({
          chartType: 'bar',
          chartData: sampleData,
          chartConfig: config,
        })
        setHasJSON(true)
        const sizeLabel = dims.isResponsive ? 'Responsive' : `${dims.width}×${dims.height} px`
        toast.success(`Sample data loaded (${sizeLabel})`)
      }
    } else if (pendingAction === 'custom') {
      // Initialize empty chart with the chosen dimensions
      setChartMode('single')
      const emptyData = { labels: [], datasets: [] }
      setFullChart({
        chartType: 'bar',
        chartData: emptyData,
        chartConfig: config,
      })
      // Navigate to datasets tab
      if (onDatasetClick) {
        onDatasetClick()
        const sizeLabel = dims.isResponsive ? 'Responsive' : `${dims.width}×${dims.height} px`
        toast.info(`Chart initialized at ${sizeLabel}. Add your data now.`)
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
      />
    </>
  )
}
