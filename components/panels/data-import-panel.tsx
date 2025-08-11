"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useChartStore, type ExtendedChartDataset, type ExtendedChartData } from "@/lib/chart-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, FileText, ClipboardPaste, CheckCircle2 } from "lucide-react"

function parseCsv(text: string): { labels: string[]; datasets: { name: string; data: number[] }[] } {
  // Basic CSV parser: split by newlines, then commas, handle simple quoted values
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0)

  if (lines.length === 0) return { labels: [], datasets: [] }

  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current)
        current = ""
      } else {
        current += char
      }
    }
    result.push(current)
    return result.map((s) => s.trim())
  }

  const header = parseLine(lines[0])
  if (header.length < 2) return { labels: [], datasets: [] }

  const labels: string[] = []
  const numColumns = header.length
  const datasetNames = header.slice(1)
  const datasetValues: number[][] = Array.from({ length: numColumns - 1 }, () => [])

  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.length === 0) continue
    const label = cols[0]
    if (!label) continue
    labels.push(label)
    for (let c = 1; c < numColumns; c++) {
      const raw = cols[c] ?? ""
      const val = Number(String(raw).replace(/[%,$\s]/g, ""))
      datasetValues[c - 1].push(isNaN(val) ? 0 : val)
    }
  }

  const datasets = datasetNames.map((name, idx) => ({ name: name || `Series ${idx + 1}`, data: datasetValues[idx] }))
  return { labels, datasets }
}

const defaultColors = [
  "#3b82f6", // blue-500
  "#ef4444", // red-500
  "#10b981", // emerald-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#06b6d4", // cyan-500
  "#f43f5e", // rose-500
  "#22c55e", // green-500
]

export function DataImportPanel() {
  const { chartType, chartConfig, setFullChart } = useChartStore()
  const [activeTab, setActiveTab] = useState<"csv" | "json">("csv")
  const [csvText, setCsvText] = useState<string>(
    "Label, Series A, Series B\nJan, 12, 20\nFeb, 19, 25\nMar, 3, 15\nApr, 5, 30\nMay, 2, 10"
  )
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(
      {
        labels: ["Jan", "Feb", "Mar", "Apr", "May"],
        datasets: [
          { name: "Series A", data: [12, 19, 3, 5, 2] },
          { name: "Series B", data: [20, 25, 15, 30, 10] },
        ],
      },
      null,
      2
    )
  )
  const [status, setStatus] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const buildExtendedData = (labels: string[], series: { name: string; data: number[] }[]): ExtendedChartData => {
    const datasets: ExtendedChartDataset[] = series.map((s, idx) => ({
      label: s.name,
      data: s.data,
      backgroundColor: labels.map((_, i) => defaultColors[idx % defaultColors.length]),
      borderColor: labels.map((_, i) => defaultColors[idx % defaultColors.length]),
      borderWidth: 2,
      pointImages: Array.from({ length: s.data.length }, () => null),
      pointImageConfig: Array.from({ length: s.data.length }, () => ({ type: "circle", size: 20, position: "center", arrow: false, borderWidth: 3, borderColor: "#ffffff" })),
    }))

    return { labels, datasets }
  }

  const importFromCsv = () => {
    try {
      const { labels, datasets } = parseCsv(csvText)
      if (labels.length === 0 || datasets.length === 0) {
        setStatus("No data found in CSV. Ensure first row has headers and first column is labels.")
        return
      }
      const data = buildExtendedData(labels, datasets)
      setFullChart({ chartType, chartData: data, chartConfig })
      setStatus("Imported CSV successfully.")
    } catch (e) {
      setStatus("Failed to parse CSV.")
    }
  }

  const importFromJson = () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!parsed || !Array.isArray(parsed.labels) || !Array.isArray(parsed.datasets)) {
        setStatus("Invalid JSON format. Expect { labels: string[], datasets: { name, data[] }[] }")
        return
      }
      const data = buildExtendedData(parsed.labels, parsed.datasets)
      setFullChart({ chartType, chartData: data, chartConfig })
      setStatus("Imported JSON successfully.")
    } catch (e) {
      setStatus("Failed to parse JSON.")
    }
  }

  const handleFile = async (file: File) => {
    const text = await file.text()
    if (file.name.toLowerCase().endsWith(".csv")) {
      setCsvText(text)
      setActiveTab("csv")
    } else if (file.name.toLowerCase().endsWith(".json")) {
      setJsonText(text)
      setActiveTab("json")
    } else {
      setStatus("Unsupported file type. Please upload a .csv or .json file.")
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg">Data Import</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json,text/csv,application/json"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) handleFile(f)
            }}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4 mr-2" /> Upload File
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="csv">CSV</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="csv" className="space-y-2">
            <Label htmlFor="csv-input">Paste CSV</Label>
            <Textarea id="csv-input" value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={8} />
            <div className="flex gap-2">
              <Button onClick={importFromCsv}>
                <ClipboardPaste className="h-4 w-4 mr-2" /> Import CSV
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="json" className="space-y-2">
            <Label htmlFor="json-input">Paste JSON</Label>
            <Textarea id="json-input" value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={10} />
            <div className="flex gap-2">
              <Button onClick={importFromJson}>
                <ClipboardPaste className="h-4 w-4 mr-2" /> Import JSON
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {status && (
          <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{status}</span>
          </div>
        )}

        <div className="text-xs text-gray-500">
          Tip: The first CSV row should contain headers. The first column is used as labels; remaining columns are datasets.
        </div>
      </CardContent>
    </Card>
  )
}