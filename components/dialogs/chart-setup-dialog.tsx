"use client"

import { useState, useMemo, useEffect } from "react"
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
  Plus,
  X,
  Shuffle,
  ChevronLeft,
  Settings2,
  TableProperties
} from "lucide-react"
import { type SupportedChartType, type ExtendedChartDataset } from "@/lib/chart-store"

// ─── Types ──────────────────────────────────────────────────────────

export interface ChartDimensions {
  width: number   // Always in pixels
  height: number  // Always in pixels
  isResponsive: boolean
}

interface ChartSetupDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (
    dimensions: ChartDimensions,
    initialDatasets?: any[],
    chartType?: SupportedChartType,
    uniformityMode?: 'uniform' | 'mixed'
  ) => void
  title?: string
  datasetType?: 'single' | 'grouped'
  isCustom?: boolean
}

type ChartCategory = 'categorical' | 'coordinate'

interface DataPoint {
  name: string
  value: number
  x: number
  y: number
  r: number
  color: string
}

interface DatasetConfig {
  id: string
  name: string
  category: ChartCategory
  type: SupportedChartType
  dataPoints: DataPoint[]
}

const categoricalChartTypes: { value: SupportedChartType; label: string }[] = [
  { value: 'bar', label: 'Bar' },
  { value: 'horizontalBar', label: 'Horizontal Bar' },
  { value: 'stackedBar', label: 'Stacked Bar' },
  { value: 'line', label: 'Line' },
  { value: 'area', label: 'Area' },
  { value: 'pie', label: 'Pie' },
  { value: 'doughnut', label: 'Doughnut' },
  { value: 'radar', label: 'Radar' },
  { value: 'polarArea', label: 'Polar Area' },
  { value: 'pie3d' as any, label: '3D Pie' },
  { value: 'doughnut3d' as any, label: '3D Doughnut' },
  { value: 'bar3d' as any, label: '3D Bar' },
  { value: 'horizontalBar3d' as any, label: '3D Horizontal Bar' },
]

const coordinateChartTypes: { value: SupportedChartType; label: string }[] = [
  { value: 'scatter', label: 'Scatter' },
  { value: 'bubble', label: 'Bubble' },
]

const darkenColor = (color: string, percent: number) => {
  if (color.startsWith("hsl")) {
    const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
    if (match) {
      const [, h, s, l] = match
      const newL = Math.max(0, Number.parseInt(l) - percent)
      return `hsl(${h}, ${s}%, ${newL}%)`
    }
  }
  return color
}

const getDefaultPoints = (category: ChartCategory, count: number = 3): DataPoint[] => {
  if (category === 'coordinate') {
    return Array.from({ length: count }, (_, i) => ({
      name: `Point ${i + 1}`,
      value: 0,
      x: i * 10,
      y: (i + 1) * 10,
      r: 10,
      color: ['#1E90FF', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i % 5],
    }))
  }
  return Array.from({ length: count }, (_, i) => ({
    name: `Slice ${i + 1}`,
    value: [10, 20, 15, 25, 30][i % 5],
    x: 0,
    y: 0,
    r: 10,
    color: ['#1E90FF', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][i % 5],
  }))
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
  datasetType = 'single',
  isCustom = false
}: ChartSetupDialogProps) {
  // ── Step State ──
  const [step, setStep] = useState<1 | 2>(1)

  // ── Step 1: Dimensions State ──
  const [widthPx, setWidthPx] = useState(DEFAULT_CHART_WIDTH)
  const [heightPx, setHeightPx] = useState(DEFAULT_CHART_HEIGHT)
  const [unit, setUnit] = useState<DimensionUnit>('px')
  const [isResponsive, setIsResponsive] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState<string | null>('Standard')
  const [expandedCategory, setExpandedCategory] = useState<string>('Chart Defaults')

  const [widthInput, setWidthInput] = useState(DEFAULT_CHART_WIDTH.toString())
  const [heightInput, setHeightInput] = useState(DEFAULT_CHART_HEIGHT.toString())

  // ── Step 2: Data Entry State ──
  const [datasets, setDatasets] = useState<DatasetConfig[]>([])
  const [activeDatasetId, setActiveDatasetId] = useState<string>('')
  const [uniformityMode, setUniformityMode] = useState<'uniform' | 'mixed'>('uniform')

  const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0]
  const datasetName = activeDataset?.name || ''
  const chartCategory = activeDataset?.category || 'categorical'
  const chartType = activeDataset?.type || 'bar'
  const dataPoints = activeDataset?.dataPoints || []

  const isBubbleChart = chartType === 'bubble'

  const updateActiveDataset = (updates: Partial<DatasetConfig>) => {
    setDatasets(prev => prev.map(d => d.id === activeDatasetId ? { ...d, ...updates } : d))
  }

  useEffect(() => {
    if (open) {
      setStep(1)
      const initialId = crypto.randomUUID()
      setDatasets([{
        id: initialId,
        name: "Dataset 1",
        category: 'categorical',
        type: 'bar',
        dataPoints: getDefaultPoints('categorical', 4)
      }])
      setActiveDatasetId(initialId)
      setUniformityMode('uniform')
    }
  }, [open])

  // ── Handlers (Step 1) ──
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

  // ── Prompt State for Dataset 1 Changes ──
  const [showInconsistencyPrompt, setShowInconsistencyPrompt] = useState(false);
  const [pendingDatasetChange, setPendingDatasetChange] = useState<{ type: 'category', value: ChartCategory } | { type: 'chartType', value: SupportedChartType } | { type: 'mode', value: 'uniform' | 'mixed' } | null>(null);

  // ── Handlers (Step 2) ──
  const triggerCategoryChange = (category: ChartCategory) => {
    if (datasets.length > 1 && activeDatasetId === datasets[0].id && uniformityMode === 'mixed') {
      setPendingDatasetChange({ type: 'category', value: category });
      setShowInconsistencyPrompt(true);
    } else {
      applyCategoryChange(category);
    }
  }

  const triggerTypeChange = (v: string) => {
    const type = v as SupportedChartType;
    if (datasets.length > 1 && activeDatasetId === datasets[0].id && uniformityMode === 'mixed') {
      setPendingDatasetChange({ type: 'chartType', value: type });
      setShowInconsistencyPrompt(true);
    } else {
      applyTypeChange(type);
    }
  }

  const triggerModeChange = (mode: 'uniform' | 'mixed') => {
    if (datasets.length > 1 && uniformityMode !== mode) {
      setPendingDatasetChange({ type: 'mode', value: mode });
      setShowInconsistencyPrompt(true);
    } else {
      applyModeChange(mode);
    }
  }

  const handleInconsistencyUpdate = () => {
    if (!pendingDatasetChange) return;
    
    // Remove all datasets except the first one
    const firstDataset = datasets[0];
    
    if (pendingDatasetChange.type === 'category') {
      const category = pendingDatasetChange.value;
      const newFirstDataset = {
        ...firstDataset,
        category,
        type: category === 'coordinate' ? 'scatter' : ('bar' as SupportedChartType),
        dataPoints: firstDataset.category === category ? firstDataset.dataPoints : getDefaultPoints(category, firstDataset.dataPoints.length)
      };
      setDatasets([newFirstDataset]);
      setActiveDatasetId(newFirstDataset.id);
    } else if (pendingDatasetChange.type === 'chartType') {
      const type = pendingDatasetChange.value;
      const newFirstDataset = {
        ...firstDataset,
        type
      };
      setDatasets([newFirstDataset]);
      setActiveDatasetId(newFirstDataset.id);
    } else if (pendingDatasetChange.type === 'mode') {
      setUniformityMode(pendingDatasetChange.value);
      setDatasets([firstDataset]);
      setActiveDatasetId(firstDataset.id);
    }
    
    setShowInconsistencyPrompt(false);
    setPendingDatasetChange(null);
  }

  const handleInconsistencyCancel = () => {
    setShowInconsistencyPrompt(false);
    setPendingDatasetChange(null);
  }

  const applyModeChange = (mode: 'uniform' | 'mixed') => {
    setUniformityMode(mode);
    if (mode === 'uniform') {
      setDatasets(prev => {
        const first = prev[0];
        return prev.map((d, i) => {
          if (i === 0) return d;
          if (d.category !== first.category) {
            return {
              ...d,
              category: first.category,
              type: first.type,
              dataPoints: getDefaultPoints(first.category, d.dataPoints.length)
            };
          }
          return {
            ...d,
            type: first.type
          };
        });
      });
    }
  }

  const applyCategoryChange = (category: ChartCategory) => {
    if (uniformityMode === 'uniform' && datasetType === 'grouped') {
      setDatasets(prev => prev.map(d => ({
        ...d,
        category,
        type: category === 'coordinate' ? 'scatter' : 'bar',
        dataPoints: d.category === category ? d.dataPoints : getDefaultPoints(category, d.dataPoints.length)
      })))
    } else {
      updateActiveDataset({
        category,
        type: category === 'coordinate' ? 'scatter' : 'bar',
        dataPoints: getDefaultPoints(category, dataPoints.length)
      })
    }
  }

  const applyTypeChange = (type: SupportedChartType) => {
    if (uniformityMode === 'uniform' && datasetType === 'grouped') {
      setDatasets(prev => prev.map(d => ({ ...d, type })))
    } else {
      updateActiveDataset({ type })
    }
  }

  const handleRandomize = () => {
    const randomizedPoints = dataPoints.map(point => {
      if (chartCategory === 'coordinate') {
        return {
          ...point,
          x: Math.floor(Math.random() * 100),
          y: Math.floor(Math.random() * 100),
          r: Math.floor(Math.random() * 20) + 5,
        }
      } else {
        return {
          ...point,
          value: Math.floor(Math.random() * 100) + 10,
        }
      }
    })
    updateActiveDataset({ dataPoints: randomizedPoints })
  }

  const handleAddPoint = () => {
    const newIndex = dataPoints.length
    const newPoint: DataPoint = {
      name: `${chartCategory === 'coordinate' ? 'Point' : 'Slice'} ${newIndex + 1}`,
      value: 0,
      x: newIndex * 10,
      y: 0,
      r: 10,
      color: ['#1E90FF', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'][newIndex % 5],
    }
    updateActiveDataset({ dataPoints: [...dataPoints, newPoint] })
  }

  const handleRemovePoint = (index: number) => {
    if (dataPoints.length > 1) {
      updateActiveDataset({ dataPoints: dataPoints.filter((_, i) => i !== index) })
    }
  }

  const handleUpdatePoint = (index: number, field: keyof DataPoint, value: string | number) => {
    const updated = [...dataPoints]
    updated[index] = { ...updated[index], [field]: value }
    updateActiveDataset({ dataPoints: updated })
  }

  const removeDataset = (id: string) => {
    if (datasets.length <= 1) return;
    const index = datasets.findIndex(d => d.id === id);
    if (index === -1) return;
    
    const newDatasets = datasets.filter(d => d.id !== id);
    setDatasets(newDatasets);
    
    if (activeDatasetId === id) {
      setActiveDatasetId(newDatasets[Math.max(0, index - 1)].id);
    }
  }

  const availableChartTypes = useMemo(() => {
    const baseTypes = chartCategory === 'coordinate' ? coordinateChartTypes : categoricalChartTypes;
    if (datasetType !== 'grouped') return baseTypes;
    
    if (uniformityMode === 'mixed' && datasets.length > 0) {
      const firstType = datasets[0].type;

      if (['bar', 'line', 'area'].includes(firstType)) {
        return baseTypes.filter(type => ['bar', 'line', 'area'].includes(type.value as string));
      }
      
      if (firstType === 'horizontalBar') {
        return baseTypes.filter(type => ['horizontalBar', 'line', 'area'].includes(type.value as string));
      }

      if (firstType === 'horizontalBar3d') {
        return baseTypes.filter(type => type.value === 'horizontalBar3d');
      }

      if (firstType === 'bar3d') {
        return baseTypes.filter(type => type.value === 'bar3d');
      }

      return baseTypes.filter(type => 
        !['pie', 'doughnut', 'pie3d', 'doughnut3d', 'bar3d', 'horizontalBar3d', 'stackedBar'].includes(type.value as string)
      );
    }
    
    return baseTypes;
  }, [chartCategory, datasetType, uniformityMode, datasets[0]?.type, datasets.length > 0]);

  const handleConfirm = () => {
    const dims = { width: widthPx, height: heightPx, isResponsive }
    
    if (isCustom && step === 2) {
      const builtDatasets: ExtendedChartDataset[] = datasets.map(ds => {
        const colors = ds.dataPoints.map(p => p.color)
        let data: any[]
        
        // If uniformity is 'uniform', force the first dataset's type onto all
        const actualType = (uniformityMode === 'uniform' && datasetType === 'grouped') 
          ? datasets[0].type 
          : ds.type

        if (actualType === 'scatter') {
          data = ds.dataPoints.map(p => ({ x: p.x, y: p.y }))
        } else if (actualType === 'bubble') {
          data = ds.dataPoints.map(p => ({ x: p.x, y: p.y, r: p.r }))
        } else {
          data = ds.dataPoints.map(p => p.value)
        }

        return {
          label: ds.name,
          data,
          backgroundColor: colors,
          borderColor: colors.map(c => darkenColor(c, 20)),
          borderWidth: 2,
          pointRadius: 5,
          tension: actualType === 'radar' ? 0 : 0.3,
          fill: false,
          pointImages: Array(ds.dataPoints.length).fill(null),
          mode: datasetType,
          sliceLabels: ds.dataPoints.map(p => p.name),
          chartType: actualType,
        }
      })

      // The chartType parameter passed out will be the first dataset's type
      onConfirm(dims, builtDatasets, datasets[0].type, uniformityMode)
    } else if (!isCustom) {
      onConfirm(dims)
    }
  }

  // ── Rendering ──
  const maxPreviewSize = 120
  const aspect = widthPx / heightPx
  const previewW = aspect >= 1 ? maxPreviewSize : Math.round(maxPreviewSize * aspect)
  const previewH = aspect >= 1 ? Math.round(maxPreviewSize / aspect) : maxPreviewSize

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <DialogContent className={`max-h-[95vh] overflow-hidden p-0 gap-0 transition-all duration-300 ${step === 2 ? 'max-w-[850px]' : 'max-w-[720px]'}`}>
        
        {/* ── Header ── */}
        <DialogHeader className={`px-5 pt-4 pb-2 ${step === 2 ? 'border-b border-gray-100 bg-gray-50/50' : ''}`}>
          <div className="flex items-center gap-3">
            {step === 2 && (
              <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="h-8 w-8 -ml-2 text-gray-500 hover:text-gray-900">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <div>
              <DialogTitle className="text-lg font-semibold">
                {step === 1 ? title : "Initialize Dataset"}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        {/* ── Step 1: Dimensions ── */}
        {step === 1 && (
          <div className="flex flex-col md:flex-row gap-0 overflow-hidden">
            {/* ── Left: Presets ── */}
            <div className="md:w-[55%] border-r border-gray-100 overflow-y-auto px-4 pb-4" style={{ maxHeight: '55vh' }}>
              {DIMENSION_PRESETS.map((category) => (
                <div key={category.label} className="mb-3">
                  <button
                    onClick={() => setExpandedCategory(
                      expandedCategory === category.label ? '' : category.label
                    )}
                    className="flex items-center gap-2 w-full py-2 px-1 text-left group focus:outline-none focus-visible:ring-0"
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
                            {isSelected && (
                              <div className="absolute top-1 right-1">
                                <Check className="h-3 w-3 text-blue-600" />
                              </div>
                            )}
                            <div className={`
                              flex-shrink-0 p-1.5 rounded-md
                              ${isSelected ? 'bg-blue-100' : 'bg-gray-100 group-hover:bg-gray-200'}
                              transition-colors
                            `}>
                              <PresetIcon icon={preset.icon} className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                            </div>
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

              {unit !== 'px' && !isResponsive && (
                <div className="text-[10px] text-gray-400 bg-gray-50 rounded px-2 py-1.5 text-center -mt-2">
                  = {widthPx} × {heightPx} px
                </div>
              )}

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

              <Button
                onClick={() => {
                  if (isCustom) setStep(2)
                  else handleConfirm()
                }}
                className="w-full h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 mt-auto"
              >
                {isCustom ? "Next" : "Create Chart"}
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Data Entry ── */}
        {step === 2 && (
          <div className="flex flex-col overflow-hidden" style={{ height: '75vh', minHeight: '500px' }}>
            {/* Header Configuration */}
            <div className="px-4 py-2.5 bg-white border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Dataset Name</Label>
                  <Input 
                    value={datasetName} 
                    onChange={e => updateActiveDataset({ name: e.target.value })} 
                    className="h-8 text-sm border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-gray-50 bg-transparent transition-colors"
                    placeholder="e.g. Q1 Sales"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Category</Label>
                  <Select 
                    value={chartCategory} 
                    onValueChange={(v) => triggerCategoryChange(v as ChartCategory)}
                    disabled={datasetType === 'grouped' && datasets.length > 0 && activeDatasetId !== datasets[0].id}
                  >
                    <SelectTrigger className="h-8 text-sm border-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-gray-50 bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="categorical">Categorical Chart</SelectItem>
                      <SelectItem value="coordinate">Coordinate Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Chart Type</Label>
                  <Select 
                    value={chartType} 
                    onValueChange={triggerTypeChange}
                    disabled={uniformityMode === 'uniform' && datasetType === 'grouped' && datasets.length > 0 && activeDatasetId !== datasets[0].id}
                  >
                    <SelectTrigger className="h-8 text-sm border-transparent shadow-none focus:ring-0 focus:ring-offset-0 hover:bg-gray-50 bg-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableChartTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Group Mode (if applicable) seamlessly fits into the same row */}
                {datasetType === 'grouped' && (
                  <div className="flex-[0.8]">
                    <Label className="text-xs font-medium text-gray-600 mb-1.5 block">Group Mode</Label>
                    <div className="flex bg-gray-100 p-0.5 rounded-md h-8">
                      <button
                        onClick={() => triggerModeChange('uniform')}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-sm text-xs font-medium transition-all ${
                          uniformityMode === 'uniform' ? 'bg-white shadow-sm text-blue-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <Settings2 className="h-3.5 w-3.5" /> Uniform
                      </button>
                      <button
                        onClick={() => triggerModeChange('mixed')}
                        className={`flex-1 flex items-center justify-center gap-1.5 rounded-sm text-xs font-medium transition-all ${
                          uniformityMode === 'mixed' ? 'bg-white shadow-sm text-purple-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        <TableProperties className="h-3.5 w-3.5" /> Mixed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Inconsistency Prompt */}
            <Dialog open={showInconsistencyPrompt} onOpenChange={(open) => { if (!open) handleInconsistencyCancel() }}>
              <DialogContent className="max-w-md p-6">
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    {pendingDatasetChange?.type === 'mode' ? 'Group Mode Alert' : 'Mixed Mode Alert'}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-amber-900 mt-2 bg-amber-50 p-3 rounded-md border border-amber-200">
                    {pendingDatasetChange?.type === 'mode' ? 'Changing the group mode' : 'Changing the base chart type'} after adding additional datasets <span className="font-bold">will remove all datasets except the first one</span> to avoid chart inconsistency. Do you want to proceed?
                  </DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-3 mt-4">
                  <Button variant="outline" onClick={handleInconsistencyCancel}>
                    Cancel
                  </Button>
                  <Button variant="default" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleInconsistencyUpdate}>
                    Update
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Dataset Tabs (for Grouped Mode) */}
            {datasetType === 'grouped' && (
              <div className="flex items-center px-4 pt-1 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar gap-1">
                {datasets.map((ds, index) => (
                  <div key={ds.id} className="relative group flex items-center">
                    <button
                      onClick={() => setActiveDatasetId(ds.id)}
                      className={`py-2 text-xs font-medium border-b-2 transition-colors whitespace-nowrap pl-4 ${index > 0 ? 'pr-8' : 'pr-4'} ${
                        activeDatasetId === ds.id
                          ? 'border-blue-600 text-blue-700 bg-blue-50/50 rounded-t-sm'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      {ds.name}
                    </button>
                    {index > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeDataset(ds.id)
                        }}
                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity ${
                          activeDatasetId === ds.id ? 'opacity-100' : ''
                        }`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newId = crypto.randomUUID()
                    const first = datasets[0]
                    const category = uniformityMode === 'uniform' ? first.category : 'categorical'
                    const type = uniformityMode === 'uniform' ? first.type : 'bar'
                    setDatasets(prev => [...prev, {
                      id: newId,
                      name: `Dataset ${prev.length + 1}`,
                      category,
                      type,
                      dataPoints: getDefaultPoints(category, 4)
                    }])
                    setActiveDatasetId(newId)
                  }}
                  className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors border-b-2 border-transparent flex items-center gap-1 whitespace-nowrap rounded-t-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Dataset
                </button>
              </div>
            )}

            {/* Data Grid Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-1.5 bg-gray-50 border-b border-gray-100 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
              {chartCategory === 'coordinate' ? (
                <>
                  <div className="col-span-3">Label</div>
                  <div className="col-span-2">X</div>
                  <div className="col-span-2">Y</div>
                  {isBubbleChart ? (
                    <>
                      <div className="col-span-2">Radius</div>
                      <div className="col-span-2">Color</div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-2"></div>
                      <div className="col-span-2">Color</div>
                    </>
                  )}
                  <div className="col-span-1"></div>
                </>
              ) : (
                <>
                  <div className="col-span-4">Label</div>
                  <div className="col-span-4">Value</div>
                  <div className="col-span-3">Color</div>
                  <div className="col-span-1"></div>
                </>
              )}
            </div>

            {/* Data Grid Body */}
            <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 bg-gray-50/30">
              {dataPoints.map((point, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center p-1.5 px-3 bg-white border border-gray-100 rounded-md shadow-sm hover:border-blue-200 transition-colors group mx-1">
                  {chartCategory === 'coordinate' ? (
                    <>
                      <div className="col-span-3">
                        <Input value={point.name} onChange={e => handleUpdatePoint(index, 'name', e.target.value)} className="h-7 text-xs border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={point.x} onChange={e => handleUpdatePoint(index, 'x', Number(e.target.value))} className="h-7 text-xs border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" value={point.y} onChange={e => handleUpdatePoint(index, 'y', Number(e.target.value))} className="h-7 text-xs border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" />
                      </div>
                      {isBubbleChart ? (
                        <div className="col-span-2">
                          <Input type="number" value={point.r} onChange={e => handleUpdatePoint(index, 'r', Number(e.target.value))} className="h-7 text-xs border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" min="1" />
                        </div>
                      ) : (
                        <div className="col-span-2"></div>
                      )}
                      <div className="col-span-2">
                        <div className="flex items-center gap-1.5">
                          <label className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-sm shadow-none focus-within:ring-0">
                            <input type="color" value={point.color} onChange={e => handleUpdatePoint(index, 'color', e.target.value)} className="w-8 h-8 opacity-0 absolute inset-[-10px] cursor-pointer" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: point.color }} />
                          </label>
                          <Input value={point.color} onChange={e => handleUpdatePoint(index, 'color', e.target.value)} className="h-7 text-[10px] font-mono uppercase w-full px-1.5 border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleRemovePoint(index)} disabled={dataPoints.length <= 1} className="h-6 w-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-4">
                        <Input value={point.name} onChange={e => handleUpdatePoint(index, 'name', e.target.value)} className="h-7 text-xs border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" />
                      </div>
                      <div className="col-span-4">
                        <Input type="number" value={point.value} onChange={e => handleUpdatePoint(index, 'value', Number(e.target.value))} className="h-7 text-xs border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" />
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-1.5">
                          <label className="relative flex-shrink-0 cursor-pointer overflow-hidden rounded-sm shadow-none focus-within:ring-0">
                            <input type="color" value={point.color} onChange={e => handleUpdatePoint(index, 'color', e.target.value)} className="w-8 h-8 opacity-0 absolute inset-[-10px] cursor-pointer" />
                            <div className="w-6 h-6 rounded-sm" style={{ backgroundColor: point.color }} />
                          </label>
                          <Input value={point.color} onChange={e => handleUpdatePoint(index, 'color', e.target.value)} className="h-7 text-[10px] font-mono uppercase w-full px-1.5 border-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent hover:bg-gray-50/50 transition-colors" />
                        </div>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <Button variant="ghost" size="icon" onClick={() => handleRemovePoint(index)} disabled={dataPoints.length <= 1} className="h-6 w-6 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-50">
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddPoint}
                  className="h-9 px-4 border-dashed border-gray-300 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add {chartCategory === 'coordinate' ? 'Point' : 'Slice'}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRandomize} className="h-9 px-4 text-gray-500 hover:text-blue-600 gap-2">
                  <Shuffle className="h-4 w-4" />
                  Randomize Data
                </Button>
              </div>
              <Button
                onClick={handleConfirm}
                disabled={!datasetName.trim()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200"
              >
                Create Chart
              </Button>
            </div>
          </div>
        )}

      </DialogContent>
    </Dialog>
  )
}
