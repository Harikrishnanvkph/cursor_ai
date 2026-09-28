"use client"

import React, { useState, useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRightLeft,
  Check,
  ClipboardPaste,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  Info,
  X,
  Trash2,
  MoreVertical,
  Tag,
  BarChart2,
  EyeOff,
  Table,
  Plus,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  parseDelimitedText,
  parseGridToModel,
  transposeGrid,
  detectGridHeaders,
  isNumericString,
  deleteGridColumn,
  deleteGridRow,
} from "@/lib/utils/spreadsheet-parser"

interface PasteDataDialogProps {
  open: boolean
  onClose: () => void
  onApply: (data: {
    datasetNames: string[]
    sliceLabels: string[]
    datasetValues: number[][]
    coordinatePoints?: Array<{ name: string; x: number; y: number; r?: number }>
  }) => void
  isCoordinate?: boolean
  datasetType?: 'single' | 'grouped'
  initialText?: string
  initialGrid?: string[][]
  mode?: 'paste' | 'edit'
}

export function PasteDataDialog({
  open,
  onClose,
  onApply,
  isCoordinate = false,
  datasetType = 'grouped',
  initialText = "",
  initialGrid,
  mode = 'paste',
}: PasteDataDialogProps) {
  const [rawText, setRawText] = useState<string>("")
  const [grid, setGrid] = useState<string[][]>([])
  const [hasHeaderRow, setHasHeaderRow] = useState<boolean>(true)
  const [hasHeaderCol, setHasHeaderCol] = useState<boolean>(true)
  const [labelColIndex, setLabelColIndex] = useState<number>(0)
  const [excludedColIndices, setExcludedColIndices] = useState<number[]>([])
  const [isTransposed, setIsTransposed] = useState<boolean>(false)
  const [infoOpen, setInfoOpen] = useState<boolean>(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Handle incoming initial text or initial grid or dialog opening
  useEffect(() => {
    if (open) {
      if (initialGrid && initialGrid.length > 0) {
        setRawText("")
        setGrid(initialGrid)
        const detected = detectGridHeaders(initialGrid)
        setHasHeaderRow(detected.hasHeaderRow)
        setHasHeaderCol(detected.hasHeaderCol)
        setLabelColIndex(detected.labelColIndex)
        setExcludedColIndices([])
        setIsTransposed(false)
      } else if (initialText) {
        processText(initialText)
      } else {
        setRawText("")
        setGrid([])
        setExcludedColIndices([])
        setLabelColIndex(0)
        setIsTransposed(false)
        setTimeout(() => textareaRef.current?.focus(), 50)
      }
    }
  }, [open, initialText, initialGrid])

  const processText = (text: string, html?: string) => {
    setRawText(text)
    const parsedGrid = parseDelimitedText(text, html)
    if (parsedGrid.length > 0) {
      const detected = detectGridHeaders(parsedGrid)
      setHasHeaderRow(detected.hasHeaderRow)
      setHasHeaderCol(detected.hasHeaderCol)
      setLabelColIndex(detected.labelColIndex)
      setExcludedColIndices([]) // No column is ever excluded automatically!
      setGrid(parsedGrid)
      setIsTransposed(false)
    } else {
      setGrid([])
      setExcludedColIndices([])
      setLabelColIndex(0)
    }
  }

  const handlePasteEvent = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData("text")
    const html = e.clipboardData.getData("text/html")
    if (text || html) {
      e.preventDefault()
      processText(text, html)
    }
  }

  const handleGlobalPaste = (e: ClipboardEvent) => {
    if (!open) return
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return

    const text = e.clipboardData?.getData("text") || ""
    const html = e.clipboardData?.getData("text/html") || ""
    if (text || html) {
      e.preventDefault()
      processText(text, html)
    }
  }

  useEffect(() => {
    window.addEventListener("paste", handleGlobalPaste)
    return () => window.removeEventListener("paste", handleGlobalPaste)
  }, [open])

  const handleTranspose = () => {
    if (grid.length === 0) return
    const transposed = transposeGrid(grid)
    setGrid(transposed)
    setIsTransposed(!isTransposed)
    const detected = detectGridHeaders(transposed)
    setHasHeaderRow(detected.hasHeaderRow)
    setHasHeaderCol(detected.hasHeaderCol)
    setLabelColIndex(detected.labelColIndex)
    setExcludedColIndices([]) // Reset exclusions on transpose
  }

  const handleCellChange = (r: number, c: number, val: string) => {
    const next = grid.map((row, ri) =>
      ri === r ? row.map((cell, ci) => (ci === c ? val : cell)) : [...row]
    )
    setGrid(next)
  }

  const handleDeleteColumn = (colIdx: number) => {
    if (grid.length === 0 || grid[0].length <= 1) return
    const nextGrid = deleteGridColumn(grid, colIdx)
    setGrid(nextGrid)

    if (labelColIndex === colIdx) {
      setLabelColIndex(0)
    } else if (labelColIndex > colIdx) {
      setLabelColIndex(labelColIndex - 1)
    }

    setExcludedColIndices(
      excludedColIndices
        .filter((c) => c !== colIdx)
        .map((c) => (c > colIdx ? c - 1 : c))
    )
  }

  const handleDeleteRow = (rowIdx: number) => {
    if (grid.length <= 1) return
    const nextGrid = deleteGridRow(grid, rowIdx)
    setGrid(nextGrid)
  }

  const handleToggleColumnIncluded = (colIdx: number) => {
    if (colIdx === labelColIndex) return
    if (excludedColIndices.includes(colIdx)) {
      setExcludedColIndices(excludedColIndices.filter((c) => c !== colIdx))
    } else {
      setExcludedColIndices([...excludedColIndices, colIdx].sort((a, b) => a - b))
    }
  }

  const handleSetLabelColumn = (colIdx: number) => {
    setLabelColIndex(colIdx)
    // If the new label was previously excluded, re-include it
    setExcludedColIndices(excludedColIndices.filter((c) => c !== colIdx))
    setHasHeaderCol(true)
  }

  const handleLoadSample = () => {
    const sample = `| Rank | Billionaire | Net Worth | Main source of wealth |\n|---|---|---:|---|\n| 1 | Elon Musk | **$929.0B** | Tesla, SpaceX |\n| 2 | Jeff Bezos | **$369.6B** | Amazon |\n| 3 | Larry Page | **$282.3B** | Google |\n| 4 | Michael Dell | **$273.7B** | Dell Technologies |\n| 5 | Sergey Brin | **$259.8B** | Google |\n| 6 | Mark Zuckerberg | **$257.6B** | Meta/Facebook |`
    processText(sample)
  }

  const handleClear = () => {
    if (mode === 'edit' && initialGrid && initialGrid.length > 0) {
      setGrid(initialGrid)
      const detected = detectGridHeaders(initialGrid)
      setHasHeaderRow(detected.hasHeaderRow)
      setHasHeaderCol(detected.hasHeaderCol)
      setLabelColIndex(detected.labelColIndex)
      setExcludedColIndices([])
      setIsTransposed(false)
      return
    }
    setRawText("")
    setGrid([])
    setExcludedColIndices([])
    setLabelColIndex(0)
    setIsTransposed(false)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  const handleAddRow = () => {
    if (grid.length === 0) {
      const defaultGrid = [
        ["", "Dataset 1"],
        ["Slice 1", "10"],
      ]
      setGrid(defaultGrid)
      setHasHeaderRow(true)
      setHasHeaderCol(true)
      setLabelColIndex(0)
      setExcludedColIndices([])
      return
    }
    const numCols = grid[0].length
    const newRow = Array(numCols).fill("")
    const nextNum = grid.length - (hasHeaderRow ? 1 : 0) + 1
    if (hasHeaderCol && labelColIndex >= 0 && labelColIndex < numCols) {
      newRow[labelColIndex] = isCoordinate ? `Point ${nextNum}` : `Slice ${nextNum}`
    }
    setGrid((prev) => [...prev, newRow])
  }

  // Derive active dataset columns: all columns except the label column and explicitly excluded columns
  const includedColIndices = Array.from({ length: grid[0]?.length || 0 }, (_, i) => i).filter(
    (c) => (!hasHeaderCol || c !== labelColIndex) && !excludedColIndices.includes(c)
  )

  // Derive model from current grid, selected label column, and selected dataset columns
  const model = parseGridToModel(grid, {
    hasHeaderRow,
    hasHeaderCol,
    labelColIndex: hasHeaderCol ? labelColIndex : -1,
    includedColIndices,
    isCoordinate,
  })

  const canApply =
    grid.length > 0 &&
    (model.datasetValues.length > 0 || (isCoordinate && (model.coordinatePoints?.length ?? 0) > 0))

  const handleApply = () => {
    if (!canApply) return
    onApply({
      datasetNames: model.datasetNames,
      sliceLabels: model.sliceLabels,
      datasetValues: model.datasetValues,
      coordinatePoints: model.coordinatePoints,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        disableAnimation={true}
        hideCloseButton={true}
        overlayClassName="bg-transparent"
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="w-[96vw] sm:w-full max-w-[850px] max-h-[92vh] h-[min(720px,90vh)] flex flex-col overflow-hidden p-0 gap-0 border border-gray-200 shadow-2xl sm:rounded-lg bg-white"
      >
        {/* Header - Identical sizing & styling to parent Initialize dialog */}
        <DialogHeader className="px-4 sm:px-6 pt-3.5 sm:pt-5 pb-3 sm:pb-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-1.5 rounded-lg shadow-sm border ${
                  mode === 'edit'
                    ? "bg-blue-50 text-blue-600 border-blue-100/60"
                    : "bg-emerald-50 text-emerald-600 border-emerald-100/60"
                }`}
              >
                {mode === 'edit' ? (
                  <Table className="w-5 h-5" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-gray-900 tracking-tight">
                  {mode === 'edit' ? "Edit in Grid" : "Paste As Table"}
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  {mode === 'edit' ? (
                    <>
                      Edit data directly in the grid or press{" "}
                      <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-700 font-semibold">
                        Ctrl + V
                      </kbd>{" "}
                      to paste.
                    </>
                  ) : (
                    <>
                      Paste cells from Excel, Sheets, or CSV with{" "}
                      <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-mono text-gray-700 font-semibold">
                        Ctrl + V
                      </kbd>
                      .
                    </>
                  )}
                </DialogDescription>
              </div>
            </div>

            {/* Top-Right Action Buttons: Sample Data + Custom Close */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadSample}
                className="h-8 text-xs font-semibold text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100/70 border-emerald-200 hover:border-emerald-300 transition-all gap-1.5 rounded-lg shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                Try Sample Data
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-full text-gray-500 hover:text-gray-900 bg-gray-100/50 hover:bg-gray-100 transition-all cursor-pointer flex items-center justify-center"
                title="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Content Container - Responsive flex layout matching parent dialog */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 p-4 md:p-5 flex flex-col bg-white overflow-hidden">
            {grid.length === 0 ? (
              /* Empty State: Full-Fill Box with Authentic Excel Spreadsheet Grid */
              <div
                onClick={() => textareaRef.current?.focus()}
                className="relative flex-1 w-full h-full border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-xl overflow-hidden flex flex-col cursor-pointer transition-all duration-200 group bg-slate-50/30 shadow-inner"
              >
                {/* ── Authentic Excel Cells Grid Background ── */}
                <div className="absolute inset-0 pointer-events-none select-none flex flex-col overflow-hidden opacity-70 group-hover:opacity-85 transition-opacity">
                  {/* Excel Column Headers Row (A, B, C, D...) */}
                  <div className="flex items-center h-7 bg-gray-100/90 border-b border-gray-200 flex-shrink-0">
                    <div className="w-10 h-full border-r border-gray-200 bg-gray-200/50 flex items-center justify-center flex-shrink-0">
                      <span className="w-2 h-2 rounded-xs border-t border-l border-gray-400 rotate-45 transform translate-x-0.5 translate-y-0.5" />
                    </div>
                    {["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"].map((letter) => (
                      <div
                        key={letter}
                        className="w-[88px] h-full border-r border-gray-200 text-gray-400 font-mono text-[11px] font-semibold flex items-center justify-center flex-shrink-0"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>

                  {/* Excel Grid Body: Row Numbers on left + Cells Grid */}
                  <div className="flex-1 flex overflow-hidden">
                    {/* Left Column (Row numbers 1, 2, 3...) */}
                    <div className="w-10 bg-gray-100/90 border-r border-gray-200 flex flex-col flex-shrink-0">
                      {Array.from({ length: 30 }, (_, i) => (
                        <div
                          key={i}
                          className="h-7 border-b border-gray-200 text-gray-400 font-mono text-[10px] font-medium flex items-center justify-center flex-shrink-0"
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Cells Grid Background */}
                    <div
                      className="flex-1 h-full"
                      style={{
                        backgroundImage: `
                          linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                          linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
                        `,
                        backgroundSize: '88px 28px',
                        backgroundColor: '#ffffff',
                      }}
                    />
                  </div>
                </div>

                {/* ── Invisible Textarea (Captures click & Ctrl+V anywhere in the box) ── */}
                <textarea
                  ref={textareaRef}
                  value={rawText}
                  onChange={(e) => processText(e.target.value)}
                  onPaste={handlePasteEvent}
                  placeholder="Click here and press Ctrl+V to paste spreadsheet cells..."
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                />

                {/* ── Centered Floating Prompt Card ── */}
                <div className="relative z-10 m-auto flex items-center justify-center p-4 pointer-events-none">
                  <div className="bg-white/95 backdrop-blur-md px-8 py-6 rounded-2xl shadow-xl border border-gray-200/90 flex flex-col items-center text-center max-w-md group-hover:border-emerald-300 group-hover:shadow-2xl group-hover:scale-[1.01] transition-all duration-200">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                      <ClipboardPaste className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 tracking-tight">
                      Click here and press <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-mono">Ctrl + V</span> to paste
                    </h3>
                    <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed">
                      Works seamlessly with Excel, Google Sheets, CSV, web tables, or AI Markdown tables.
                    </p>

                    <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Markdown & Web Tables
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        Auto-Detect Labels & Values
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                        Auto-Clean Numbers ($ & B/M/K)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Populated State: Controls Bar & Spreadsheet Grid */
              <div className="space-y-3.5 flex flex-col flex-1 min-h-0">
                {/* Toolbar - Single Row Layout */}
                <div className="flex items-center justify-between gap-2.5 px-3 py-2 bg-slate-50/80 border border-gray-200/80 rounded-xl shadow-xs flex-shrink-0 overflow-x-auto">
                  {/* Left: Stats & Column/Row Config */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Badge variant="secondary" className="bg-white text-gray-800 border-gray-200 text-xs font-semibold py-1 px-2.5 shadow-2xs">
                        {model.datasetNames.length} {model.datasetNames.length === 1 ? "Dataset" : "Datasets"}
                      </Badge>
                      <span className="text-gray-300 font-bold">×</span>
                      <Badge variant="secondary" className="bg-white text-gray-800 border-gray-200 text-xs font-semibold py-1 px-2.5 shadow-2xs">
                        {model.sliceLabels.length} {model.sliceLabels.length === 1 ? "Slice" : "Slices"}
                      </Badge>
                    </div>

                    <div className="h-4 w-px bg-gray-200 mx-0.5" />

                    <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs whitespace-nowrap">
                      <Switch
                        id="header-row"
                        checked={hasHeaderRow}
                        onCheckedChange={setHasHeaderRow}
                      />
                      <Label htmlFor="header-row" className="text-xs cursor-pointer font-medium text-gray-700">
                        Header row
                      </Label>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs whitespace-nowrap">
                      <Switch
                        id="header-col"
                        checked={hasHeaderCol}
                        onCheckedChange={setHasHeaderCol}
                      />
                      <Label htmlFor="header-col" className="text-xs cursor-pointer font-medium text-gray-700">
                        Labels column
                      </Label>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddRow}
                      className="h-8 text-xs font-semibold text-emerald-700 bg-white hover:bg-emerald-50/70 border-gray-200 hover:border-emerald-200 transition-all gap-1.5 px-3 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap"
                      title="Add a new row at the bottom"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      Row
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTranspose}
                      className="h-8 text-xs font-semibold text-gray-700 hover:text-blue-700 bg-white hover:bg-blue-50/50 border-gray-200 hover:border-blue-200 transition-all gap-1.5 px-3 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap"
                      title="Swap rows and columns"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
                      Transpose
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClear}
                      className="h-8 text-xs font-semibold text-gray-500 hover:text-red-600 bg-white hover:bg-red-50/50 border-gray-200 hover:border-red-200 transition-all gap-1.5 px-2.5 rounded-lg shadow-2xs cursor-pointer whitespace-nowrap"
                      title={mode === 'edit' ? "Restore original chart data" : "Clear and paste new data"}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Excel / Web Grid Preview */}
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs bg-white flex-1 min-h-0 flex flex-col">
                  <div className="overflow-auto flex-1 h-full">
                    <table className="w-full border-collapse text-xs font-sans">
                      <thead>
                        <tr className="bg-gray-100/90 text-gray-600 border-b border-gray-200 font-semibold select-none">
                          <th className="w-12 px-2 py-2 text-center text-[10px] text-gray-400 border-r border-gray-200 font-mono">
                            #
                          </th>
                          {grid[0]?.map((_, colIdx) => {
                            const colLetter = String.fromCharCode(65 + (colIdx % 26))
                            const isLabelCol = hasHeaderCol && colIdx === labelColIndex
                            const isDatasetCol = !isLabelCol && includedColIndices.includes(colIdx)

                            return (
                              <th
                                key={colIdx}
                                className={`px-2.5 py-1.5 text-left border-r border-gray-200 last:border-r-0 font-medium transition-colors ${
                                  isLabelCol
                                    ? "bg-emerald-50/90 text-emerald-900 border-b-2 border-b-emerald-500"
                                    : isDatasetCol
                                    ? "bg-blue-50/90 text-blue-900 border-b-2 border-b-blue-500"
                                    : "bg-gray-50/70 text-gray-500 border-b-2 border-b-gray-300"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                  {/* Left: Column Letter + Role Badge */}
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-mono font-bold text-gray-600 text-xs">{colLetter}</span>
                                    {isLabelCol ? (
                                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider truncate">
                                        Labels
                                      </span>
                                    ) : isDatasetCol ? (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleColumnIncluded(colIdx)}
                                        title="Click to toggle or use three dots menu"
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                      >
                                        Dataset
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleToggleColumnIncluded(colIdx)}
                                        title="Click to toggle or use three dots menu"
                                        className="text-[9px] px-1.5 py-0.5 rounded bg-gray-200 hover:bg-blue-100 text-gray-600 hover:text-blue-800 font-medium uppercase tracking-wider transition-colors cursor-pointer"
                                      >
                                        Excluded
                                      </button>
                                    )}
                                  </div>

                                  {/* Right: Three-Dot Dropdown Menu */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        type="button"
                                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-md transition-colors cursor-pointer focus:outline-none"
                                        title="Column options"
                                      >
                                        <MoreVertical className="w-3.5 h-3.5" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 shadow-xl rounded-xl p-1 bg-white border border-gray-200 z-[120]">
                                      {!isLabelCol ? (
                                        <DropdownMenuItem
                                          onClick={() => handleSetLabelColumn(colIdx)}
                                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-emerald-800 hover:bg-emerald-50 rounded-lg cursor-pointer font-medium"
                                        >
                                          <Tag className="w-3.5 h-3.5 text-emerald-600" />
                                          Set as Category Labels
                                        </DropdownMenuItem>
                                      ) : (
                                        <DropdownMenuItem disabled className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-400 rounded-lg">
                                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                                          Current Category Labels
                                        </DropdownMenuItem>
                                      )}

                                      {!isLabelCol && (
                                        isDatasetCol ? (
                                          <DropdownMenuItem
                                            onClick={() => handleToggleColumnIncluded(colIdx)}
                                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-amber-800 hover:bg-amber-50 rounded-lg cursor-pointer font-medium"
                                          >
                                            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                                            Exclude from Chart
                                          </DropdownMenuItem>
                                        ) : (
                                          <DropdownMenuItem
                                            onClick={() => handleToggleColumnIncluded(colIdx)}
                                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-blue-800 hover:bg-blue-50 rounded-lg cursor-pointer font-medium"
                                          >
                                            <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
                                            Include as Dataset
                                          </DropdownMenuItem>
                                        )
                                      )}

                                      <DropdownMenuSeparator className="my-1 bg-gray-100" />

                                      <DropdownMenuItem
                                        onClick={() => handleDeleteColumn(colIdx)}
                                        disabled={grid[0].length <= 1}
                                        className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer font-medium"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        Delete Column
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {grid.map((row, rowIdx) => {
                          const isHeaderRow = hasHeaderRow && rowIdx === 0
                          return (
                            <tr
                              key={rowIdx}
                              className={`group/row border-b border-gray-100 last:border-b-0 hover:bg-blue-50/20 transition-colors ${
                                isHeaderRow ? "bg-slate-50/80 font-bold text-gray-900" : ""
                              }`}
                            >
                              <td className="w-12 px-2 py-1 text-center text-[10px] text-gray-400 border-r border-gray-200 font-mono bg-gray-50/80 select-none relative">
                                <span className={!isHeaderRow && grid.length > 2 ? "group-hover/row:hidden" : ""}>
                                  {rowIdx + 1}
                                </span>
                                {!isHeaderRow && grid.length > 2 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteRow(rowIdx)}
                                    title="Delete row"
                                    className="hidden group-hover/row:inline-flex items-center justify-center text-red-500 hover:text-red-700 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </td>
                              {row.map((cell, colIdx) => {
                                const isLabelCol = hasHeaderCol && colIdx === labelColIndex && !isHeaderRow
                                const isDatasetCol = !isLabelCol && includedColIndices.includes(colIdx) && !isHeaderRow
                                const isNumeric = isNumericString(cell)

                                return (
                                  <td
                                    key={colIdx}
                                    className={`p-0 border-r border-gray-100 last:border-r-0 ${
                                      isLabelCol
                                        ? "bg-emerald-50/30 font-semibold text-emerald-950"
                                        : isDatasetCol
                                        ? "bg-blue-50/20"
                                        : ""
                                    }`}
                                  >
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => handleCellChange(rowIdx, colIdx, e.target.value)}
                                      className={`w-full px-3 py-1.5 bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-none text-xs transition-colors ${
                                        isHeaderRow
                                          ? "font-bold text-gray-900"
                                          : isLabelCol
                                          ? "font-semibold text-emerald-950"
                                          : isDatasetCol
                                          ? "text-right font-mono font-medium text-gray-800"
                                          : isNumeric
                                          ? "text-right font-mono text-gray-400"
                                          : "text-left text-gray-500"
                                      }`}
                                    />
                                  </td>
                                )
                              })}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer - Identical padding, height, and border to parent modal */}
          <div className="p-3 sm:p-4 bg-white border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="h-9 px-4 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg shadow-xs transition-all cursor-pointer"
              >
                Cancel
              </Button>

              {/* Info Button with Hover + Click Popover */}
              <Popover open={infoOpen} onOpenChange={setInfoOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onMouseEnter={() => setInfoOpen(true)}
                    onMouseLeave={() => setInfoOpen(false)}
                    onClick={() => setInfoOpen((prev) => !prev)}
                    className="h-9 px-2.5 text-xs font-medium text-gray-500 hover:text-emerald-700 hover:bg-emerald-50/70 border border-transparent hover:border-emerald-200 rounded-lg transition-all gap-1.5 cursor-pointer"
                    title="Smart Mapping Tips"
                  >
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-medium text-gray-600">Info</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="start"
                  sideOffset={10}
                  onMouseEnter={() => setInfoOpen(true)}
                  onMouseLeave={() => setInfoOpen(false)}
                  className="w-80 p-3.5 shadow-xl rounded-xl border border-emerald-100 bg-white z-[150] space-y-2 text-xs"
                >
                  <div className="flex items-center gap-2 font-bold text-gray-900 border-b border-gray-100 pb-2">
                    <div className="p-1 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <span>Smart Column Mapping</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-gray-600 leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[9px] uppercase tracking-wider">
                        Labels
                      </span>
                      <span>Category labels for chart slices.</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[9px] uppercase tracking-wider">
                        Dataset
                      </span>
                      <span>Numeric values plotted on the chart.</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
                    <div>• Click <strong>⋮</strong> on any column to set labels, exclude, or delete.</div>
                    <div>• Numbers are auto-cleaned from $, %, B, M, K, etc.</div>
                    <div>• You can edit any cell directly in the table.</div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <Button
              size="sm"
              onClick={handleApply}
              disabled={!canApply}
              className={`h-9 px-5 text-xs font-bold text-white rounded-lg shadow-sm hover:shadow-md transition-all gap-1.5 flex items-center justify-center w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                mode === 'edit'
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              }`}
            >
              <Check className="w-4 h-4" />
              {mode === 'edit' ? "Save & Apply" : "Apply to Chart"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
