"use client"

import { useState, useEffect } from "react"
import { Database, Sparkles, TrendingUp, Ruler, Zap, Info, ChevronRight, ArrowRight } from "lucide-react"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { useChatStore } from "@/lib/chat-store"
import { useTemplateStore } from "@/lib/template-store"
import { ChartSetupDialog, type ChartDimensions } from "@/components/dialogs/chart-setup-dialog"
import { DEFAULT_CHART_WIDTH, DEFAULT_CHART_HEIGHT } from "@/lib/utils/dimension-utils"
import { getDefaultConfigForType } from "@/lib/chart-defaults"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  const buildConfigWithDimensions = (dims: ChartDimensions, targetType: string = 'bar') => {
    const baseConfig = getDefaultConfigForType(targetType as any)
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
      setTimeout(() => {
        try {
          const { useSnapStateStore } = require('@/lib/stores/snap-state-store');
          useSnapStateStore.getState().captureCurrentState('new', null, 'Sample Chart');
        } catch (e) {}
      }, 50);
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

    const config = buildConfigWithDimensions(dims, chartType || 'bar')

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
        setTimeout(() => {
          try {
            const { useSnapStateStore } = require('@/lib/stores/snap-state-store');
            useSnapStateStore.getState().captureCurrentState('new', null, 'Sample Chart');
          } catch (e) {}
        }, 50);
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
      setTimeout(() => {
        try {
          const { useSnapStateStore } = require('@/lib/stores/snap-state-store');
          useSnapStateStore.getState().captureCurrentState('new', null, groupName || 'Custom Chart');
        } catch (e) {}
      }, 50);
      // Navigate to datasets tab
      if (onDatasetClick) {
        onDatasetClick()
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
  // Borderless, open canvas layout — compact & touch-friendly
  // Zero scrolling needed — all options fit cleanly on mobile
  // ══════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        <div className={`w-full flex justify-center items-center my-auto py-3 px-4 ${className}`}>
          <div className="w-full max-w-sm space-y-4">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Chart Editor
              </h2>
              <p className="text-xs text-slate-500">
                Choose an option below to start creating
              </p>
            </div>

            {/* Dataset Type Switch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-semibold text-slate-600">Dataset Type</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                        aria-label="Dataset type explanation"
                      >
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
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setDatasetType('single')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                    datasetType === 'single'
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${datasetType === 'single' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Single Chart
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetType('grouped')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                    datasetType === 'grouped'
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${datasetType === 'grouped' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Grouped Chart
                </button>
              </div>
            </div>

            {/* Section 1: Load Sample Data */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                <Sparkles className="h-3 w-3 text-purple-500" />
                Load Sample Data
              </span>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleQuickLoadSample}
                  className="w-full text-left p-3 rounded-xl border border-slate-200/80 bg-white hover:border-purple-300 active:bg-purple-50/40 transition-[border-color,background-color] duration-150 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-purple-50 text-purple-600 ring-1 ring-purple-100 rounded-lg group-hover:bg-purple-100 transition-colors flex-shrink-0">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 leading-tight">Quick Start</span>
                        <span className="text-[9px] bg-purple-50 text-purple-700 border border-purple-100 font-semibold px-1.5 py-0.5 rounded-full">Instant</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Sample data at {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleCustomDimensionSample}
                  className="w-full text-left p-3 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-300 active:bg-indigo-50/40 transition-[border-color,background-color] duration-150 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 rounded-lg group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                      <Ruler className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-900 leading-tight">Choose Size</span>
                        <span className="text-[9px] bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold px-1.5 py-0.5 rounded-full">Preset / Custom</span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">Pick dimensions + sample data</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
                </button>
              </div>
            </div>

            {/* Section 2: Add Your Own Data */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                <Database className="h-3 w-3 text-blue-500" />
                Add Your Own Data
              </span>
              <button
                type="button"
                onClick={handleCustomDimensionDataset}
                className="w-full text-left p-3 rounded-xl border border-slate-200/80 bg-white hover:border-blue-300 active:bg-blue-50/40 transition-[border-color,background-color] duration-150 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-blue-50 text-blue-600 ring-1 ring-blue-100 rounded-lg group-hover:bg-blue-100 transition-colors flex-shrink-0">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 leading-tight">Set Dimensions & Add Data</span>
                      <span className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 font-semibold px-1.5 py-0.5 rounded-full">Custom</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">Choose chart size first, then enter data</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
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
  // Borderless, open canvas layout proportioned for Tablet
  // Fits cleanly with zero clipping and zero scrollbars
  // ══════════════════════════════════════════════════════════
  if (isTablet) {
    return (
      <>
        <div className={`w-full flex justify-center items-center my-auto py-4 px-5 ${className}`}>
          <div className="w-full max-w-xl space-y-5">
            {/* Header */}
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to Chart Editor
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Start creating your chart by choosing an option below
              </p>
            </div>

            {/* Dataset Type Switch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">Dataset Type</span>
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
                <span className="text-[11px] text-slate-400 font-medium">
                  {datasetType === 'single' ? 'Single series' : 'Multi-series'}
                </span>
              </div>

              <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 gap-1">
                <button
                  type="button"
                  onClick={() => setDatasetType('single')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                    datasetType === 'single'
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'single' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Single Chart
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetType('grouped')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                    datasetType === 'grouped'
                      ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'grouped' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  Grouped Chart
                </button>
              </div>
            </div>

            {/* Section 1: Load Sample Data */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                Load Sample Data
              </h3>
              <div className="grid gap-3 grid-cols-2">
                {/* Quick Start */}
                <button
                  type="button"
                  className="text-left border border-slate-200/80 rounded-2xl p-3.5 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-[border-color,box-shadow,transform] duration-150 cursor-pointer group bg-white flex flex-col justify-between"
                  onClick={handleQuickLoadSample}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-50 text-purple-600 ring-1 ring-purple-100 rounded-xl group-hover:bg-purple-100 transition-colors flex-shrink-0">
                          <Zap className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 leading-tight">Quick Start</span>
                      </div>
                      <span className="text-[9px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-100">
                        Instant
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      Standard {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px sample
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 truncate">
                      <TrendingUp className="h-3 w-3 text-purple-500 flex-shrink-0" />
                      <span className="truncate">6 points • {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT}</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
                  </div>
                </button>

                {/* Choose Size */}
                <button
                  type="button"
                  className="text-left border border-slate-200/80 rounded-2xl p-3.5 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-[border-color,box-shadow,transform] duration-150 cursor-pointer group bg-white flex flex-col justify-between"
                  onClick={handleCustomDimensionSample}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 rounded-xl group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                          <Ruler className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-bold text-slate-900 leading-tight">Choose Size</span>
                      </div>
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                        Custom
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      Pick preset or custom dimensions
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1 truncate">
                      <Sparkles className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                      <span className="truncate">px / mm / cm</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
                  </div>
                </button>
              </div>
            </div>

            {/* Section 2: Add Your Own Data */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
                <Database className="h-3.5 w-3.5 text-blue-500" />
                Add Your Own Data
              </h3>
              <button
                type="button"
                className="w-full text-left border border-slate-200/80 rounded-2xl p-3.5 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-[border-color,box-shadow,transform] duration-150 cursor-pointer group bg-white flex items-center justify-between gap-3"
                onClick={handleCustomDimensionDataset}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 bg-blue-50 text-blue-600 ring-1 ring-blue-100 rounded-xl group-hover:bg-blue-100 transition-colors flex-shrink-0 mt-0.5">
                    <Database className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 leading-tight">Set Dimensions & Add Data</span>
                      <span className="text-[9px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                        Custom Data
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Choose your chart size first, then enter your own custom data
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
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
  // 3. DESKTOP VIEW (>= 1024px)
  // Clean, borderless open-canvas welcome experience
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div className={`w-full flex justify-center items-center my-auto py-6 px-6 ${className}`}>
        <div className="w-full max-w-2xl space-y-6">
          {/* Header */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Chart Editor
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Start creating your chart by choosing one of the options below
            </p>
          </div>

          {/* ── Dataset Type Selection ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-600">Dataset Type</span>
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
              <span className="text-[11px] text-slate-400 font-medium">
                {datasetType === 'single' ? 'Single series' : 'Multi-series comparison'}
              </span>
            </div>

            {/* Segmented Pill Switch */}
            <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/60 gap-1">
              <button
                type="button"
                onClick={() => setDatasetType('single')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                  datasetType === 'single'
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'single' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                Single Chart
              </button>
              <button
                type="button"
                onClick={() => setDatasetType('grouped')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 ${
                  datasetType === 'grouped'
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/70'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full transition-colors ${datasetType === 'grouped' ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                Grouped Chart
              </button>
            </div>
          </div>

          {/* ── Load Sample Data Section ── */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
              <Sparkles className="h-3.5 w-3.5 text-purple-500" />
              Load Sample Data
            </h3>
            <div className="grid gap-3.5 grid-cols-1 sm:grid-cols-2">
              {/* Quick Load (default dimensions) */}
              <button
                type="button"
                className="text-left border border-slate-200/80 rounded-2xl p-4 hover:border-purple-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-[border-color,box-shadow,transform] duration-150 cursor-pointer group bg-white flex flex-col justify-between"
                onClick={handleQuickLoadSample}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-purple-50 text-purple-600 ring-1 ring-purple-100 rounded-xl group-hover:bg-purple-100 transition-colors flex-shrink-0">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 leading-tight">Quick Start</span>
                    </div>
                    <span className="text-[10px] bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-full border border-purple-100">
                      Instant
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    Load sample data at standard size ({DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px)
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 truncate">
                    <TrendingUp className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                    <span className="truncate">6 data points • {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT}</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
                </div>
              </button>

              {/* Custom Dimensions + Sample Data */}
              <button
                type="button"
                className="text-left border border-slate-200/80 rounded-2xl p-4 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-[border-color,box-shadow,transform] duration-150 cursor-pointer group bg-white flex flex-col justify-between"
                onClick={handleCustomDimensionSample}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100 rounded-xl group-hover:bg-indigo-100 transition-colors flex-shrink-0">
                        <Ruler className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-900 leading-tight">Choose Size</span>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full border border-indigo-100">
                      Preset / Custom
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    Pick a preset or enter custom dimensions, then load sample data
                  </p>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5 truncate">
                    <Sparkles className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                    <span className="truncate">Custom size • px / mm / cm</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
                </div>
              </button>
            </div>
          </div>

          {/* ── Add Your Own Data Section ── */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 px-0.5">
              <Database className="h-3.5 w-3.5 text-blue-500" />
              Add Your Own Data
            </h3>
            <button
              type="button"
              className="w-full text-left border border-slate-200/80 rounded-2xl p-4 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-[border-color,box-shadow,transform] duration-150 cursor-pointer group bg-white flex items-center justify-between gap-4"
              onClick={handleCustomDimensionDataset}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2.5 bg-blue-50 text-blue-600 ring-1 ring-blue-100 rounded-xl group-hover:bg-blue-100 transition-colors flex-shrink-0 mt-0.5">
                  <Database className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 leading-tight">Set Dimensions & Add Data</span>
                    <span className="text-[10px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded-full border border-blue-100">
                      Custom Data
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Choose your chart size first, then enter your own custom data
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Database className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">Custom size • Full control • Your data</span>
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-[color,transform] duration-150 flex-shrink-0" />
            </button>
          </div>
        </div>
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

