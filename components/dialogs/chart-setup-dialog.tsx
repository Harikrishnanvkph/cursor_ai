"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DIMENSION_PRESETS,
  DEFAULT_CHART_WIDTH,
  DEFAULT_CHART_HEIGHT,
  convertToPixels,
  convertFromPixels,
  type DimensionUnit,
  type DimensionPreset,
} from "@/lib/utils/dimension-utils"
import {
  BarChart3,
  Square,
  RectangleHorizontal,
  Monitor,
  Printer,
  ArrowRightLeft,
  Maximize2,
  Check,
  Smartphone,
  Play,
  Layout,
  FileText,
  Grid3X3,
  ArrowUpDown,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────

export interface ChartDimensions {
  width: number   // Always in pixels
  height: number  // Always in pixels
  isResponsive: boolean
}

interface ChartSetupDialogProps {
  open: boolean
  onClose: () => void
  /** Called with final pixel dimensions when user clicks "Create Chart". */
  onConfirm: (dimensions: ChartDimensions) => void
  /** Dialog title override */
  title?: string
}

// ─── Icon Map ───────────────────────────────────────────────────────

function PresetIcon({ icon, className = "h-4 w-4" }: { icon: string; className?: string }) {
  switch (icon) {
    case 'chart':            return <BarChart3 className={className} />
    case 'square':           return <Square className={className} />
    case 'widescreen':       return <RectangleHorizontal className={className} />
    case 'tall':             return <ArrowUpDown className={className} />
    case 'grid':             return <Grid3X3 className={className} />
    case 'play':             return <Play className={className} />
    case 'presentation':     return <Layout className={className} />
    case 'banner':           return <RectangleHorizontal className={className} />
    case 'page':             return <FileText className={className} />
    case 'page-landscape':   return <FileText className={`${className} rotate-90`} />
    default:                 return <Square className={className} />
  }
}

// ─── Category Icons ─────────────────────────────────────────────────

function CategoryIcon({ label, className = "h-4 w-4" }: { label: string; className?: string }) {
  if (label.includes('Chart'))  return <BarChart3 className={className} />
  if (label.includes('Screen')) return <Monitor className={className} />
  if (label.includes('Print'))  return <Printer className={className} />
  return <Square className={className} />
}

// ─── Component ──────────────────────────────────────────────────────

export function ChartSetupDialog({
  open,
  onClose,
  onConfirm,
  title = "Set Up Chart Dimensions",
}: ChartSetupDialogProps) {
  // ── State ──
  const [widthPx, setWidthPx] = useState(DEFAULT_CHART_WIDTH)
  const [heightPx, setHeightPx] = useState(DEFAULT_CHART_HEIGHT)
  const [unit, setUnit] = useState<DimensionUnit>('px')
  const [isResponsive, setIsResponsive] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Standard')
  const [expandedCategory, setExpandedCategory] = useState<string>('Chart Defaults')

  const [widthInput, setWidthInput] = useState(DEFAULT_CHART_WIDTH.toString())
  const [heightInput, setHeightInput] = useState(DEFAULT_CHART_HEIGHT.toString())

  // ── Aspect ratio preview ──
  const maxPreviewSize = 120
  const aspect = widthPx / heightPx
  const previewW = aspect >= 1 ? maxPreviewSize : Math.round(maxPreviewSize * aspect)
  const previewH = aspect >= 1 ? Math.round(maxPreviewSize / aspect) : maxPreviewSize

  // ── Handlers ──
  const handlePresetClick = (preset: DimensionPreset) => {
    setWidthPx(preset.width)
    setHeightPx(preset.height)
    setWidthInput(convertFromPixels(preset.width, unit).toString())
    setHeightInput(convertFromPixels(preset.height, unit).toString())
    setSelectedPreset(preset.name)
    setIsResponsive(false)
  }

  const handleWidthChange = (val: string) => {
    setWidthInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0) {
      setWidthPx(Math.round(convertToPixels(num, unit)))
      setSelectedPreset(null)
    }
  }

  const handleHeightChange = (val: string) => {
    setHeightInput(val)
    const num = parseFloat(val)
    if (!isNaN(num) && num > 0) {
      setHeightPx(Math.round(convertToPixels(num, unit)))
      setSelectedPreset(null)
    }
  }

  const handleWidthBlur = () => {
    const num = parseFloat(widthInput)
    if (isNaN(num) || num <= 0) {
      setWidthInput(convertFromPixels(widthPx, unit).toString())
    } else {
      setWidthInput(num.toString())
    }
  }

  const handleHeightBlur = () => {
    const num = parseFloat(heightInput)
    if (isNaN(num) || num <= 0) {
      setHeightInput(convertFromPixels(heightPx, unit).toString())
    } else {
      setHeightInput(num.toString())
    }
  }

  const handleUnitChange = (newUnit: DimensionUnit) => {
    setUnit(newUnit)
    setWidthInput(convertFromPixels(widthPx, newUnit).toString())
    setHeightInput(convertFromPixels(heightPx, newUnit).toString())
  }

  const handleSwapDimensions = () => {
    setWidthPx(heightPx)
    setHeightPx(widthPx)
    setWidthInput(convertFromPixels(heightPx, unit).toString())
    setHeightInput(convertFromPixels(widthPx, unit).toString())
    setSelectedPreset(null)
  }

  const handleConfirm = () => {
    onConfirm({
      width: widthPx,
      height: heightPx,
      isResponsive,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className="max-w-[680px] max-h-[90vh] overflow-hidden p-0 gap-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Choose a preset or enter custom dimensions to get started
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-0 overflow-hidden">
          {/* ── Left: Presets ── */}
          <div className="md:w-[55%] border-r border-gray-100 overflow-y-auto px-4 pb-4" style={{ maxHeight: '55vh' }}>
            {DIMENSION_PRESETS.map((category) => (
              <div key={category.label} className="mb-3">
                {/* Category header */}
                <button
                  onClick={() => setExpandedCategory(
                    expandedCategory === category.label ? '' : category.label
                  )}
                  className="flex items-center gap-2 w-full py-2 px-1 text-left group"
                >
                  <CategoryIcon label={category.label} className="h-3.5 w-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider group-hover:text-gray-700 transition-colors">
                    {category.label}
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12" height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`ml-auto text-gray-400 transform transition-transform ${expandedCategory === category.label ? 'rotate-180' : ''}`}
                  >
                    <path d="M6 9L12 15L18 9" />
                  </svg>
                </button>

                {/* Preset cards */}
                {expandedCategory === category.label && (
                  <div className="grid grid-cols-2 gap-1.5">
                    {category.presets.map((preset) => {
                      const isSelected = selectedPreset === preset.name && !isResponsive
                      return (
                        <button
                          key={preset.name}
                          onClick={() => handlePresetClick(preset)}
                          className={`
                            relative flex items-center gap-2 px-3 py-2.5 rounded-lg border text-left
                            transition-all duration-200 group
                            ${isSelected
                              ? 'border-blue-500 bg-blue-50 shadow-sm ring-1 ring-blue-200'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 hover:shadow-sm'
                            }
                          `}
                        >
                          {/* Selected check */}
                          {isSelected && (
                            <div className="absolute top-1 right-1">
                              <Check className="h-3 w-3 text-blue-600" />
                            </div>
                          )}

                          {/* Icon */}
                          <div className={`
                            flex-shrink-0 p-1.5 rounded-md
                            ${isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}
                            transition-colors
                          `}>
                            <PresetIcon
                              icon={preset.icon}
                              className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                            />
                          </div>

                          {/* Label + size */}
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>
                              {preset.name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {unit === 'px' 
                                ? `${preset.width}×${preset.height}`
                                : `${convertFromPixels(preset.width, unit)}×${convertFromPixels(preset.height, unit)}`
                              }
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Right: Custom + Preview ── */}
          <div className="md:w-[45%] px-5 pb-5 pt-2 flex flex-col gap-4">
            {/* Unit Selector */}
            <div>
              <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Unit</Label>
              <Select value={unit} onValueChange={(v) => handleUnitChange(v as DimensionUnit)}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="px">Pixels (px)</SelectItem>
                  <SelectItem value="mm">Millimeters (mm)</SelectItem>
                  <SelectItem value="cm">Centimeters (cm)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Width & Height */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Width</Label>
                <Input
                  type="number"
                  value={widthInput}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  onBlur={handleWidthBlur}
                  disabled={isResponsive}
                  className="h-9 text-sm"
                  min={1}
                />
              </div>

              {/* Swap button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSwapDimensions}
                disabled={isResponsive}
                className="h-9 w-9 p-0 flex-shrink-0 hover:bg-gray-100"
                title="Swap width and height"
              >
                <ArrowRightLeft className="h-3.5 w-3.5 text-gray-500" />
              </Button>

              <div className="flex-1">
                <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Height</Label>
                <Input
                  type="number"
                  value={heightInput}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  onBlur={handleHeightBlur}
                  disabled={isResponsive}
                  className="h-9 text-sm"
                  min={1}
                />
              </div>
            </div>

            {/* Pixel conversion hint (when not px) */}
            {unit !== 'px' && !isResponsive && (
              <div className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1.5 text-center -mt-2">
                = {widthPx} × {heightPx} px
              </div>
            )}

            {/* Aspect ratio preview */}
            <div className="flex flex-col items-center gap-2 pt-1">
              <div
                className={`
                  border-2 rounded-md flex items-center justify-center
                  transition-all duration-300
                  ${isResponsive
                    ? 'border-dashed border-green-300 bg-green-50/50'
                    : 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50'
                  }
                `}
                style={{
                  width: isResponsive ? maxPreviewSize : previewW,
                  height: isResponsive ? maxPreviewSize * 0.6 : previewH,
                  minWidth: 40,
                  minHeight: 30,
                }}
              >
                {isResponsive ? (
                  <div className="flex flex-col items-center gap-0.5">
                    <Maximize2 className="h-4 w-4 text-green-500" />
                    <span className="text-[9px] text-green-600 font-medium">Auto</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <BarChart3 className="h-4 w-4 text-blue-400" />
                    <span className="text-[9px] text-gray-500 font-medium">
                      {widthPx}×{heightPx}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-gray-400">
                {isResponsive ? 'Fills available space' : `Aspect ratio ${(widthPx / heightPx).toFixed(2)}:1`}
              </span>
            </div>

            {/* Responsive option */}
            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => {
                  setIsResponsive(!isResponsive)
                  if (!isResponsive) setSelectedPreset(null)
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left
                  transition-all duration-200
                  ${isResponsive
                    ? 'border-green-500 bg-green-50 shadow-sm ring-1 ring-green-200'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className={`p-1.5 rounded-md ${isResponsive ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Maximize2 className={`h-4 w-4 ${isResponsive ? 'text-green-600' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${isResponsive ? 'text-green-900' : 'text-gray-800'}`}>
                    Responsive
                  </div>
                  <div className="text-[10px] text-gray-400">
                    Chart auto-fills the available container
                  </div>
                </div>
                {isResponsive && <Check className="h-4 w-4 text-green-600 flex-shrink-0" />}
              </button>
            </div>

            {/* Create Button */}
            <Button
              onClick={handleConfirm}
              className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 mt-auto"
            >
              Create Chart
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
