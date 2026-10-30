"use client"

import React, { useState, useMemo, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useChartStore } from "@/lib/chart-store"
import { useChartActions } from "@/lib/hooks/use-chart-actions"
import { getDefaultConfigForType } from "@/lib/chart-defaults"
import { toast } from "sonner"
import {
  Upload,
  Clipboard,
  FileSpreadsheet,
  TrendingUp,
  Check,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database
} from "lucide-react"

interface DataImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultChartType?: 'timeline' | 'line' | 'area'
}

interface ParsedRow {
  date: string
  value: number
}

// ─────────────────────────────────────────────────────────────
// Sample Historical Timeline Generators
// ─────────────────────────────────────────────────────────────
function generateAppleStockData(): { dates: string[]; values: number[] } {
  const dates: string[] = []
  const values: number[] = []

  // 5 Years daily (Jan 2, 2020 to Mar 14, 2025) ~1,250 trading days
  const startDate = new Date(2020, 0, 2)
  const endDate = new Date(2025, 2, 14)
  const current = new Date(startDate)

  // Seeded realistic walk reflecting AAPL path:
  // Jan 2020: ~$75 -> Mar 2020 COVID low: ~$56 -> Dec 2020: ~$132 -> Dec 2021: ~$178
  // -> Dec 2022: ~$130 -> Dec 2023: ~$192 -> Mar 2025: ~$249.98
  let price = 75.0
  let dayIndex = 0

  while (current <= endDate) {
    const dayOfWeek = current.getDay()
    // Skip weekends (Saturday=6, Sunday=0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const year = current.getFullYear()
      const month = current.getMonth()

      // Target trends by era
      let drift = 0.0006
      if (year === 2020 && month >= 1 && month <= 2) drift = -0.008 // COVID dip
      else if (year === 2020 && month >= 3) drift = 0.0035 // 2020 tech rally
      else if (year === 2021) drift = 0.0012 // steady 2021 climb
      else if (year === 2022) drift = -0.0014 // 2022 rate hike pull back
      else if (year === 2023) drift = 0.0018 // 2023 AI expansion
      else if (year === 2024 || year === 2025) drift = 0.0012

      // pseudo-random oscillation based on sine + dayIndex
      const noise = (Math.sin(dayIndex * 12.9898) * 43758.5453) % 1
      const dailyChangePercent = drift + (noise - 0.49) * 0.022
      price = Math.max(20, price * (1 + dailyChangePercent))

      // Keep final date close to $249.98
      if (year === 2025 && month === 2 && current.getDate() === 14) {
        price = 249.98
      }

      const isoDate = current.toISOString().split("T")[0]
      dates.push(isoDate)
      values.push(Number(price.toFixed(2)))
      dayIndex++
    }
    current.setDate(current.getDate() + 1)
  }

  // Ensure last point is exactly 249.98 USD
  if (values.length > 0) {
    values[values.length - 1] = 249.98
  }

  return { dates, values }
}

function generateBitcoinData(): { dates: string[]; values: number[] } {
  const dates: string[] = []
  const values: number[] = []

  // 3 Years daily (Jan 1, 2022 to Mar 1, 2025) ~1,150 days
  const current = new Date(2022, 0, 1)
  const endDate = new Date(2025, 2, 1)
  let price = 47200.0
  let dayIndex = 0

  while (current <= endDate) {
    const year = current.getFullYear()
    const month = current.getMonth()

    let drift = 0.0005
    if (year === 2022) drift = -0.0028 // Bear market
    else if (year === 2023) drift = 0.0022 // Recovery to $42k
    else if (year === 2024) drift = 0.0031 // ETF surge to $90k+
    else if (year === 2025) drift = 0.0008

    const noise = (Math.sin(dayIndex * 37.719) * 21942.1) % 1
    const dailyChange = drift + (noise - 0.48) * 0.038
    price = Math.max(15000, price * (1 + dailyChange))

    dates.push(current.toISOString().split("T")[0])
    values.push(Math.round(price))
    dayIndex++
    current.setDate(current.getDate() + 1)
  }

  return { dates, values }
}

function generateSaaSMetricsData(): { dates: string[]; values: number[] } {
  const dates: string[] = []
  const values: number[] = []

  const current = new Date(2023, 0, 1)
  let mrr = 12500

  for (let i = 0; i < 26; i++) {
    const isoDate = current.toISOString().split("T")[0]
    dates.push(isoDate)
    const growth = 1.07 + (Math.sin(i * 1.5) * 0.03)
    mrr = Math.round(mrr * growth)
    values.push(mrr)
    current.setMonth(current.getMonth() + 1)
  }

  return { dates, values }
}

export function DataImportModal({
  open,
  onOpenChange,
  defaultChartType = 'timeline'
}: DataImportModalProps) {
  const [activeTab, setActiveTab] = useState<string>("paste")
  const [pastedText, setPastedText] = useState("")
  const [datasetTitle, setDatasetTitle] = useState("Historical Data")
  const [targetType, setTargetType] = useState<'timeline' | 'line' | 'area'>(defaultChartType)
  const [currencySymbol, setCurrencySymbol] = useState("USD")
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-parse pasted text or dropped file content
  const parseResult = useMemo(() => {
    if (!pastedText.trim()) return null

    const lines = pastedText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean)

    if (lines.length === 0) return null

    // Detect delimiter from first row (comma, tab, semicolon, pipe)
    const firstLine = lines[0]
    let delimiter = ","
    if (firstLine.includes("\t")) delimiter = "\t"
    else if (firstLine.includes(";")) delimiter = ";"
    else if (firstLine.includes("|")) delimiter = "|"

    // Check if line 1 is a header (non-numeric second token)
    const sampleTokens = firstLine.split(delimiter).map(t => t.trim())
    const hasHeader = isNaN(Number(sampleTokens[1]?.replace(/[$,€£]/g, "")))
    const dataLines = hasHeader ? lines.slice(1) : lines

    const parsed: ParsedRow[] = []
    let detectedHeaderTitle = hasHeader && sampleTokens[1] ? sampleTokens[1] : ""

    for (const line of dataLines) {
      const parts = line.split(delimiter).map(p => p.trim())
      if (parts.length < 2) continue

      const rawDate = parts[0]
      const rawVal = parts[1].replace(/[$,€£\s]/g, "")
      const numVal = parseFloat(rawVal)

      if (rawDate && !isNaN(numVal)) {
        // Normalize date if valid
        const d = new Date(rawDate)
        const dateStr = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : rawDate
        parsed.push({ date: dateStr, value: numVal })
      }
    }

    return {
      rows: parsed,
      count: parsed.length,
      detectedTitle: detectedHeaderTitle,
      startDate: parsed[0]?.date,
      endDate: parsed[parsed.length - 1]?.date
    }
  }, [pastedText])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      if (text) {
        setPastedText(text)
        const cleanName = file.name.replace(/\.[^/.]+$/, "")
        setDatasetTitle(cleanName)
        toast.success(`Loaded ${file.name}`)
      }
    }
    reader.readAsText(file)
  }

  const handleApplyImport = (dates: string[], values: number[], title: string) => {
    if (dates.length === 0 || values.length === 0) {
      toast.error("No valid data points found to import.")
      return
    }

    const isTimeline = targetType === 'timeline'
    const chartConfig = getDefaultConfigForType(targetType as any)

    // Setup currency formatting in timeline settings if provided
    if (isTimeline && currencySymbol) {
      if (!chartConfig.plugins) (chartConfig as any).plugins = {}
      ;(chartConfig.plugins as any).timelineCrosshair = {
        enabled: true,
        currency: currencySymbol,
        color: '#64748b',
        dash: [3, 3],
        showPulsePoint: true
      }
    }

    const newDataset = {
      label: title,
      data: values,
      fill: true,
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 6,
      tension: 0.15,
      sliceLabels: dates,
      chartType: targetType,
      mode: 'single' as const,
    }

    // Set full chart state cleanly
    useChartStore.getState().setFullChart({
      chartType: targetType as any,
      chartData: {
        labels: dates,
        datasets: [newDataset as any]
      },
      chartConfig: chartConfig,
      replaceMode: true
    })

    useChartStore.getState().setHasJSON(true)
    toast.success(`Successfully imported ${values.length.toLocaleString()} points into ${targetType === 'timeline' ? 'Timeline Series' : targetType} chart!`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
            <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
              Data Import & Paste Studio
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 leading-normal">
            Import hundreds or thousands of historical dates and values from Excel, Google Sheets, CSV, or 1-click curated datasets.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 bg-slate-100/80 p-1 rounded-xl mb-4">
              <TabsTrigger
                value="paste"
                className="flex items-center gap-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <Clipboard className="w-3.5 h-3.5 text-slate-500" />
                <span>Paste Text (Ctrl+V)</span>
              </TabsTrigger>
              <TabsTrigger
                value="file"
                className="flex items-center gap-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Upload CSV / File</span>
              </TabsTrigger>
              <TabsTrigger
                value="presets"
                className="flex items-center gap-1.5 text-xs font-semibold rounded-lg data-[state=active]:bg-white data-[state=active]:text-slate-900"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Sample Stock Presets</span>
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Paste Text */}
            <TabsContent value="paste" className="space-y-4 focus:outline-none">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-slate-700">
                    Paste Columns from Excel or Sheets
                  </Label>
                  <span className="text-[11px] text-slate-400">
                    Auto-detects Tab, Comma, or Semicolon
                  </span>
                </div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={`Date\tClose Price\n2024-01-02\t185.64\n2024-01-03\t184.25\n2024-01-04\t181.91\n...`}
                  className="w-full h-36 font-mono text-xs p-3 bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              {parseResult && parseResult.count > 0 ? (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      {parseResult.count.toLocaleString()} valid rows detected
                    </span>
                    <span className="text-emerald-700/80">
                      ({parseResult.startDate} to {parseResult.endDate})
                    </span>
                  </div>
                </div>
              ) : pastedText.trim() ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Unable to parse dates. Ensure format is: <code>Date [Tab/Comma] Value</code></span>
                </div>
              ) : null}
            </TabsContent>

            {/* TAB 2: File Upload */}
            <TabsContent value="file" className="space-y-4 focus:outline-none">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-emerald-50/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-500 group-hover:text-emerald-600 group-hover:scale-105 transition-all mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800 mb-0.5">
                  Click to browse or drop CSV file
                </div>
                <div className="text-xs text-slate-400">
                  Supports .csv, .tsv, and raw text files up to 10,000 rows
                </div>
              </div>

              {parseResult && parseResult.count > 0 && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">
                      {parseResult.count.toLocaleString()} rows ready to import
                    </span>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: Curated Presets */}
            <TabsContent value="presets" className="space-y-3 focus:outline-none">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const data = generateAppleStockData()
                    handleApplyImport(data.dates, data.values, "Apple Inc. (AAPL)")
                  }}
                  className="flex flex-col text-left p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                      Apple Stock (AAPL)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold">
                      ~1,250 points
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    5-Year daily historical trajectory (2020–2025) reaching $249.98 USD.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const data = generateBitcoinData()
                    handleApplyImport(data.dates, data.values, "Bitcoin (BTC/USD)")
                  }}
                  className="flex flex-col text-left p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                      Bitcoin (BTC/USD)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                      ~1,150 points
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    3-Year crypto historical volatility & bull run ($16k to $90k+).
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const data = generateSaaSMetricsData()
                    handleApplyImport(data.dates, data.values, "SaaS Revenue MRR")
                  }}
                  className="flex flex-col text-left p-3.5 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200/80 hover:border-emerald-300 rounded-xl transition-all cursor-pointer group col-span-2"
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                      SaaS MRR Metric (Monthly)
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold">
                      26 months
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 leading-tight">
                    Predictable monthly recurring revenue expansion trajectory.
                  </span>
                </button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Configuration Parameters */}
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-slate-600">Chart Type</Label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as any)}
                className="w-full h-8 text-xs font-semibold border border-slate-200 rounded-lg px-2 bg-white text-slate-800 focus:outline-none"
              >
                <option value="timeline">Timeline Series (Financial)</option>
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-slate-600">Currency / Unit</Label>
              <Input
                value={currencySymbol}
                onChange={(e) => setCurrencySymbol(e.target.value)}
                placeholder="USD or $"
                className="h-8 text-xs uppercase font-mono"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-slate-600">Dataset Title</Label>
              <Input
                value={datasetTitle}
                onChange={(e) => setDatasetTitle(e.target.value)}
                placeholder="e.g. Stock Price"
                className="h-8 text-xs font-medium"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs text-slate-500 hover:text-slate-800"
          >
            Cancel
          </Button>

          {activeTab !== "presets" && (
            <Button
              size="sm"
              disabled={!parseResult || parseResult.count === 0}
              onClick={() => {
                if (parseResult) {
                  const dates = parseResult.rows.map(r => r.date)
                  const values = parseResult.rows.map(r => r.value)
                  handleApplyImport(dates, values, datasetTitle || parseResult.detectedTitle || "Timeline Data")
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 h-8 rounded-lg shadow-sm"
            >
              <span>Import {parseResult?.count ? `${parseResult.count.toLocaleString()} Points` : "Data"}</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
