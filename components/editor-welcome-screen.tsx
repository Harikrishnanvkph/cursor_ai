"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, Database, Sparkles, TrendingUp, PieChart, LineChart, Ruler, Zap, Info, ChevronRight } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { toast } from "sonner"
import { ChartSetupDialog, type ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
import { DEFAULT_CHART_WIDTH, DEFAULT_CHART_HEIGHT } from "@/lib/utils/dimension-utils"
import { getDefaultConfigForType } from "@/lib/chart-defaults"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Label } from "@/components/ui/label"
import { useIsMobile, useIsTablet } from "@/lib/hooks/use-screen-dimensions"

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
      } else {
        setFullChart({
          chartType: 'bar',
          chartData: sampleData,
          chartConfig: config,
          name: 'Untitled Chart',
          replaceMode: true
        })
        setHasJSON(true)
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
        } else {
          setFullChart({
            chartType: 'bar',
            chartData: sampleData,
            chartConfig: config,
            name: 'Untitled Chart',
            replaceMode: true
          })
          setHasJSON(true)
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

  const isMobileDetected = useIsMobile()
  const isTabletDetected = useIsTablet()
  const isMobile = size === "compact" || isMobileDetected
  const isTablet = !isMobile && isTabletDetected

  // ══════════════════════════════════════════════════════════
  // 1. MOBILE DEDICATED VIEW (< 768px)
  // High-design compact card: ~370px total height
  // Zero scrolling needed — all options fit 100% on mobile screen!
  // ══════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        <div className={`w-full flex justify-center items-center my-auto py-2 px-3 ${className}`}>
          <div className="w-full max-w-sm bg-gradient-to-br from-white via-white to-indigo-50/20 rounded-2xl border-2 border-dashed border-slate-300 shadow-md p-3.5 space-y-2.5">
            {/* Header */}
            <div className="text-center pt-0.5">
              <h2 className="text-base font-bold text-slate-900 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to Chart Editor
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Start creating your chart by choosing an option below
              </p>
            </div>

            {/* Dataset Type Switch */}
            <div className="bg-slate-100/90 p-1 rounded-xl">
              <div className="flex items-center justify-between mb-1.5 px-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-slate-700">Dataset Type</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="text-slate-400 hover:text-slate-600 p-0.5">
                        <Info className="h-3 w-3" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 text-xs z-[100] shadow-xl text-slate-600 space-y-1.5 bg-white" side="top">
                      <div>
                        <strong className="text-slate-900 block font-semibold text-xs">Single Chart:</strong>
                        Visualizes a single dataset or metric across categories.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-semibold text-xs">Grouped Chart:</strong>
                        Visualizes multiple datasets for comparison.
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {datasetType === 'single' ? 'Single series' : 'Multi-series'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setDatasetType('single')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    datasetType === 'single'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${datasetType === 'single' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Single Chart
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetType('grouped')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                    datasetType === 'grouped'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${datasetType === 'grouped' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Grouped Chart
                </button>
              </div>
            </div>

            {/* Section 1: Load Sample Data */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5 px-0.5">
                <Sparkles className="h-3 w-3 text-purple-600" />
                Load Sample Data
              </span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={handleQuickLoadSample}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-300 active:scale-[0.98] transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors flex-shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 leading-tight">Quick Start</span>
                        <span className="text-[9px] bg-purple-100 text-purple-700 font-semibold px-1.5 py-0.2 rounded-full">Instant</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">Load sample data at 800×600 px</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleCustomDimensionSample}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 active:scale-[0.98] transition-all flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                      <Ruler className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 leading-tight">Choose Size</span>
                        <span className="text-[9px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.2 rounded-full">Preset / Custom</span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">Pick dimensions + sample data</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* Section 2: Add Your Own Data */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1.5 px-0.5">
                <Database className="h-3 w-3 text-blue-600" />
                Add Your Own Data
              </span>
              <button
                type="button"
                onClick={handleCustomDimensionDataset}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 active:scale-[0.98] transition-all flex items-center justify-between group shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 leading-tight">Set Dimensions & Add Data</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.2 rounded-full">Your Data</span>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">Choose chart size first, then enter data</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* Chart Setup Dialog */}
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

  // ══════════════════════════════════════════════════════════
  // 2. TABLET DEDICATED VIEW (768px – 1023px)
  // Perfectly proportioned for iPad/Tablet portrait & landscape
  // Fits with elegance, zero clipping, zero scrollbars (~390px height)
  // ══════════════════════════════════════════════════════════
  if (isTablet) {
    return (
      <>
        <div className={`w-full flex justify-center items-center my-auto py-2 px-3 sm:px-4 ${className}`}>
          <Card className="w-full max-w-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-white to-slate-50/70 shadow-lg shadow-slate-200/50 rounded-2xl">
            <CardHeader className="text-center px-5 pt-4 pb-2">
              <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Welcome to Chart Editor
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
                Start creating your chart by choosing an option below
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3 px-5 pb-5">
              {/* Dataset Type Switch */}
              <div className="bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/70">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-700">Dataset Type</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none rounded transition-colors inline-flex items-center justify-center"
                          title="Dataset type explanation"
                        >
                          <Info className="h-3.5 w-3.5 cursor-pointer" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-3 text-xs z-[100] shadow-xl text-slate-600 space-y-2 bg-white" side="top" align="start">
                        <div>
                          <strong className="text-slate-900 block mb-0.5 font-semibold">Single Chart:</strong>
                          Visualizes a single dataset or metric across different categories.
                        </div>
                        <div>
                          <strong className="text-slate-900 block mb-0.5 font-semibold">Grouped Chart:</strong>
                          Visualizes multiple datasets or metrics simultaneously for comparison.
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {datasetType === 'single' ? 'Single series' : 'Multi-series'}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-lg gap-1">
                  <button
                    type="button"
                    onClick={() => setDatasetType('single')}
                    className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-md text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                      datasetType === 'single'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'single' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    Single Chart
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatasetType('grouped')}
                    className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-md text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                      datasetType === 'grouped'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'grouped' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                    Grouped Chart
                  </button>
                </div>
              </div>

              {/* Section 1: Load Sample Data */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                  Load Sample Data
                </h3>
                <div className="grid gap-2.5 grid-cols-2">
                  {/* Quick Start */}
                  <div
                    className="border border-slate-200/90 rounded-xl p-3 hover:border-purple-400 active:scale-[0.99] hover:shadow-md transition-all duration-200 cursor-pointer group bg-white flex flex-col justify-between"
                    onClick={handleQuickLoadSample}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
                            <Zap className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 leading-tight">Quick Start</span>
                        </div>
                        <span className="text-[9px] bg-purple-50 text-purple-700 font-semibold px-1.5 py-0.2 rounded-full border border-purple-100">
                          Instant
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        Standard {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px sample
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400">
                      <TrendingUp className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      <span className="truncate">6 points • {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT}</span>
                    </div>
                  </div>

                  {/* Choose Size */}
                  <div
                    className="border border-slate-200/90 rounded-xl p-3 hover:border-indigo-400 active:scale-[0.99] hover:shadow-md transition-all duration-200 cursor-pointer group bg-white flex flex-col justify-between"
                    onClick={handleCustomDimensionSample}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors flex-shrink-0">
                            <Ruler className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="text-xs font-bold text-slate-900 leading-tight">Choose Size</span>
                        </div>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.2 rounded-full border border-indigo-100">
                          Custom
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                        Pick preset or custom dimensions
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400">
                      <Sparkles className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">px / mm / cm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Add Your Own Data */}
              <div>
                <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-blue-600" />
                  Add Your Own Data
                </h3>
                <div
                  className="border border-slate-200/90 rounded-xl p-3 hover:border-blue-400 active:scale-[0.99] hover:shadow-md transition-all duration-200 cursor-pointer group bg-white flex flex-col justify-between"
                  onClick={handleCustomDimensionDataset}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                          <Database className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 leading-tight">Set Dimensions & Add Data</span>
                      </div>
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                        Custom Data
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      Choose your chart size first, then enter your own custom data
                    </p>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center gap-1 text-[10px] text-slate-400">
                    <Database className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">Custom size • Full control • Your data</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Setup Dialog */}
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

  // ══════════════════════════════════════════════════════════
  // 3. DESKTOP VIEW (>= 1024px)
  // Premium, spacious hero card (~440px height)
  // Fits with elegance on Desktop canvases with full details
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div className={`w-full flex justify-center items-center my-auto py-4 px-4 sm:px-6 ${className}`}>
        <Card className="w-full max-w-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-gradient-to-br from-white via-white to-slate-50/70 shadow-xl shadow-slate-200/50 rounded-2xl">
          <CardHeader className="text-center px-6 pt-6 pb-3">
            <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
              Welcome to Chart Editor
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
              Start creating your chart by choosing one of the options below
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 px-6 pb-6">
            {/* ── Dataset Type Selection ── */}
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/70">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-700">Dataset Type</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="p-0.5 text-slate-400 hover:text-slate-600 focus:outline-none rounded transition-colors inline-flex items-center justify-center"
                        title="Dataset type explanation"
                        aria-label="Dataset type explanation"
                      >
                        <Info className="h-3.5 w-3.5 cursor-pointer" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 sm:w-80 p-3 text-xs z-[100] shadow-xl text-slate-600 space-y-2 bg-white" side="top" align="start">
                      <div>
                        <strong className="text-slate-900 block mb-0.5 font-semibold">Single Chart:</strong>
                        Visualizes a single dataset or metric across different categories. Best for pie, donut, and basic bar/line charts.
                      </div>
                      <div>
                        <strong className="text-slate-900 block mb-0.5 font-semibold">Grouped Chart:</strong>
                        Visualizes multiple datasets or metrics simultaneously for comparison. Best for grouped bars, stacked charts, and multi-line charts.
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {datasetType === 'single' ? 'Single series' : 'Multi-series comparison'}
                </span>
              </div>

              {/* Segmented Pill Switch */}
              <div className="grid grid-cols-2 p-1 bg-slate-200/60 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => setDatasetType('single')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                    datasetType === 'single'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'single' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Single Chart
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetType('grouped')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                    datasetType === 'grouped'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'grouped' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Grouped Chart
                </button>
              </div>
            </div>

            {/* ── Load Sample Data Section ── */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Load Sample Data
              </h3>
              <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
                {/* Quick Load (default dimensions) */}
                <div
                  className="border border-slate-200/90 rounded-xl p-3.5 hover:border-purple-400 active:scale-[0.99] hover:shadow-md transition-all duration-200 cursor-pointer group bg-white flex flex-col justify-between"
                  onClick={handleQuickLoadSample}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors flex-shrink-0">
                        <Zap className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 leading-tight">Quick Start</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      Load sample data at standard size ({DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px)
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <TrendingUp className="h-3 w-3 text-purple-500 flex-shrink-0" />
                    <span className="truncate">Instant • 6 data points • {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT}</span>
                  </div>
                </div>

                {/* Custom Dimensions + Sample Data */}
                <div
                  className="border border-slate-200/90 rounded-xl p-3.5 hover:border-indigo-400 active:scale-[0.99] hover:shadow-md transition-all duration-200 cursor-pointer group bg-white flex flex-col justify-between"
                  onClick={handleCustomDimensionSample}
                >
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors flex-shrink-0">
                        <Ruler className="h-4 w-4 text-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 leading-tight">Choose Size</span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      Pick a preset or enter custom dimensions, then load sample data
                    </p>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Sparkles className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                    <span className="truncate">Custom size • px / mm / cm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Add Your Own Data Section ── */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-blue-600" />
                Add Your Own Data
              </h3>
              <div
                className="border border-slate-200/90 rounded-xl p-3.5 hover:border-blue-400 active:scale-[0.99] hover:shadow-md transition-all duration-200 cursor-pointer group bg-white flex flex-col justify-between"
                onClick={handleCustomDimensionDataset}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                        <Database className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 leading-tight">Set Dimensions & Add Data</span>
                    </div>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                      Custom Data
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                    Choose your chart size first, then enter your own custom data
                  </p>
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                  <Database className="h-3 w-3 text-blue-500 flex-shrink-0" />
                  <span className="truncate">Custom size • Full control • Your data</span>
                </div>
              </div>
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

