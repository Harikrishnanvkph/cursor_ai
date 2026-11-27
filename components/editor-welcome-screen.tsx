"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { BarChart2, Layers, Database, Sparkles, SlidersHorizontal, Ruler, Zap, Info, ChevronRight, ArrowRight } from "lucide-react"
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
  // Cohesive Indigo + Slate app theme — compact & zero-scroll
  // Performance rule: color-only transitions, zero hover shadows/transforms
  // ══════════════════════════════════════════════════════════
  if (isMobile) {
    return (
      <>
        <div className={`w-full flex justify-center items-center my-auto py-3 px-3.5 antialiased ${className}`}>
          <div className="w-full max-w-sm space-y-3.5">
            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-[10.5px] font-semibold text-indigo-700 dark:text-indigo-300 mb-1.5">
                <SlidersHorizontal className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                <span>Advanced Chart Editor</span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Design Your Chart with{" "}
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  Full Control
                </span>
              </h2>
              <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Pick a dataset mode below, then start with sample or custom data.
              </p>
            </div>

            {/* Section 1: Dataset Structure */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dataset Structure</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded transition-colors duration-150 cursor-pointer"
                        aria-label="Dataset structure explanation"
                      >
                        <Info className="h-3.5 w-3.5" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-3 text-xs z-[100] shadow-lg border border-slate-200/90 text-slate-600 space-y-1.5 bg-white rounded-xl" side="top">
                      <div>
                        <strong className="text-slate-900 block font-semibold text-xs">Single Chart:</strong>
                        Visualizes a single dataset or metric across categories.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-semibold text-xs">Grouped Chart:</strong>
                        Visualizes multiple datasets simultaneously for comparison.
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                  {datasetType === 'single' ? 'Single series' : 'Multi-series'}
                </span>
              </div>

              <div
                role="radiogroup"
                aria-label="Dataset Structure"
                className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/70 dark:border-slate-700/60 gap-1"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={datasetType === 'single'}
                  onClick={() => setDatasetType('single')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    datasetType === 'single'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Single Chart</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={datasetType === 'grouped'}
                  onClick={() => setDatasetType('grouped')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                    datasetType === 'grouped'
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Grouped Chart</span>
                </button>
              </div>
            </div>

            {/* Section 2: Start with Sample Data */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sample Data</span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">6-point starter</span>
              </div>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleQuickLoadSample}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 active:bg-indigo-50/40 transition-colors duration-150 flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">Quick Start</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 leading-none">
                          Instant
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Standard {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px canvas
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors duration-150 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={handleCustomDimensionSample}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 active:bg-indigo-50/40 transition-colors duration-150 flex items-center justify-between gap-2.5 group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 group-hover:border-indigo-200 flex items-center justify-center shrink-0 transition-colors duration-150">
                      <Ruler className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 transition-colors duration-150" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">Choose Canvas Size</span>
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 leading-none">
                          Presets
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        Pick aspect ratio or custom px / mm / cm
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors duration-150 shrink-0" />
                </button>
              </div>
            </div>

            {/* Section 3: Start from Scratch */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Your Own Data</span>
                <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Custom table</span>
              </div>
              <button
                type="button"
                onClick={handleCustomDimensionDataset}
                className="w-full text-left p-2.5 rounded-xl border border-indigo-200/80 dark:border-indigo-800/70 bg-indigo-50/35 dark:bg-indigo-950/25 hover:border-indigo-300 active:bg-indigo-50/60 transition-colors duration-150 flex items-center justify-between gap-2.5 group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/70 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Set Dimensions & Add Data</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      Set canvas size first, then enter your data
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-indigo-500 group-hover:text-indigo-700 transition-colors duration-150 shrink-0" />
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
  // 2. TABLET (768px – 1023px) & 3. DESKTOP (>= 1024px)
  // Unified modern Indigo + Slate studio layout matching AI Chart Studio
  // Performance rule: strictly color-only transitions, zero hover shadows/transforms
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div
        className={`w-full flex justify-center items-center my-auto ${
          isTablet ? "py-4 px-4" : "py-6 px-4 sm:px-6"
        } antialiased ${className}`}
      >
        <div className={`w-full ${isTablet ? "max-w-xl space-y-4" : "max-w-2xl space-y-5"} mx-auto`}>
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
              <SlidersHorizontal className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
              <span>Advanced Chart Editor</span>
            </div>

            <h2
              className={`${
                isTablet ? "text-xl" : "text-xl sm:text-2xl"
              } font-bold tracking-tight text-slate-900 dark:text-white`}
            >
              Design Your Chart with{" "}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Full Control
              </span>
            </h2>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed mt-1.5">
              Choose a dataset structure below, then launch instantly with sample data or configure custom canvas dimensions and data.
            </p>
          </div>

          {/* ── Section 1: Dataset Structure ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Dataset Structure
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none rounded transition-colors duration-150 inline-flex items-center justify-center cursor-pointer"
                      title="Dataset structure explanation"
                      aria-label="Dataset structure explanation"
                    >
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 sm:w-80 p-3 text-xs z-[100] shadow-lg border border-slate-200/90 text-slate-600 space-y-2 bg-white rounded-xl" side="top" align="start">
                    <div>
                      <strong className="text-slate-900 block mb-0.5 font-semibold">Single Chart:</strong>
                      Visualizes a single dataset or metric across different categories. Best for pie, donut, and single-series bar/line charts.
                    </div>
                    <div>
                      <strong className="text-slate-900 block mb-0.5 font-semibold">Grouped Chart:</strong>
                      Visualizes multiple datasets or metrics simultaneously for comparison. Best for grouped bars, stacked charts, and multi-line charts.
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                {datasetType === 'single' ? 'Single series' : 'Multi-series comparison'}
              </span>
            </div>

            {/* Segmented Pill Switch */}
            <div
              role="radiogroup"
              aria-label="Dataset Structure"
              className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-xl border border-slate-200/70 dark:border-slate-700/60 gap-1"
            >
              <button
                type="button"
                role="radio"
                aria-checked={datasetType === 'single'}
                onClick={() => setDatasetType('single')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                  datasetType === 'single'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Single Chart</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                    datasetType === 'single'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                      : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  1 series
                </span>
              </button>

              <button
                type="button"
                role="radio"
                aria-checked={datasetType === 'grouped'}
                onClick={() => setDatasetType('grouped')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-colors duration-150 cursor-pointer ${
                  datasetType === 'grouped'
                    ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-xs ring-1 ring-slate-200/70 dark:ring-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Grouped Chart</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${
                    datasetType === 'grouped'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300'
                      : 'bg-slate-200/70 dark:bg-slate-700/70 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Multi
                </span>
              </button>
            </div>
          </div>

          {/* ── Section 2: Start with Sample Data ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start with Sample Data
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} default
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Quick Start */}
              <button
                type="button"
                onClick={handleQuickLoadSample}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/15 text-left transition-colors duration-150 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200/70 dark:border-indigo-800/60 group-hover:bg-indigo-100/70 group-hover:border-indigo-300 flex items-center justify-center shrink-0 transition-colors duration-150">
                    <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-[13px] font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-150">
                        Quick Start
                      </span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shrink-0 leading-none">
                        Instant
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Load sample data immediately on a standard {DEFAULT_CHART_WIDTH}×{DEFAULT_CHART_HEIGHT} px canvas.
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="truncate">6 data points · Ready to style</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150 shrink-0" />
                </div>
              </button>

              {/* Choose Canvas Size */}
              <button
                type="button"
                onClick={handleCustomDimensionSample}
                className="flex flex-col justify-between p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/15 text-left transition-colors duration-150 group cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 group-hover:bg-indigo-50/70 group-hover:border-indigo-200 flex items-center justify-center shrink-0 transition-colors duration-150">
                    <Ruler className="w-4 h-4 text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs sm:text-[13px] font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-150">
                        Choose Canvas Size
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors duration-150 shrink-0 leading-none">
                        Presets
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      Pick a social, slide, or custom size first, then populate sample data.
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="truncate">Aspect ratios · px / mm / cm</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-150 shrink-0" />
                </div>
              </button>
            </div>
          </div>

          {/* ── Section 3: Start from Scratch (Your Own Data) ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Start from Scratch
              </span>
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                Custom dimensions & table
              </span>
            </div>

            <div
              onClick={handleCustomDimensionDataset}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleCustomDimensionDataset()
                }
              }}
              className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/25 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors duration-150 group cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 group-hover:border-indigo-200 flex items-center justify-center shrink-0 transition-colors duration-150">
                  <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-[13px] font-bold tracking-tight text-slate-900 dark:text-slate-100">
                      Set Dimensions & Add Data
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 leading-none">
                      Custom Data
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Configure your chart canvas size first, then enter or paste your own dataset.
                  </p>
                </div>
              </div>

              <span className="h-8 px-3.5 rounded-lg bg-indigo-600 group-hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors duration-150">
                <span>Set Up Chart</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* ── Footer Callout Bar (matches AI Chart Studio) ── */}
          <div className="rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Prefer generating charts from natural language prompts?
              </span>
            </div>

            <Link
              href="/aichat"
              prefetch={false}
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 whitespace-nowrap transition-colors duration-150 shrink-0"
            >
              <span>Open AI Chart</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
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

