"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { useChartStore, getDefaultImageType, getDefaultImageSize, getImageOptionsForChartType, getDefaultImageConfig as getDefaultImageConfigFromStore, type ExtendedChartDataset } from "@/lib/chart-store"
import {
  Plus,
  Trash2,
  Settings,
  Layers,
  BarChart2,
  Palette,
  Eye,
  EyeOff,
  ImageIcon,
  Upload,
  Download,
  Target,
  ArrowUpRight,
  MousePointer2,
  Square,
  Circle,
  Triangle,
  Star,
  X,
  ExternalLink,
  Maximize2,
  Grid,
  Move,
  Crop,
  Filter,
  Contrast,
  Sun,
  Moon,
  Aperture,
  Focus,
  Camera,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  CornerDownLeft,
  CornerDownRight,
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react"
import { Slider } from "@/components/ui/slider"

interface DatasetSettingsProps {
  className?: string
}

type DatasetTab = 'general' | 'colors' | 'images' | 'advanced'

export function DatasetSettings({ className }: DatasetSettingsProps) {
  const { 
    chartData, 
    chartType, 
    addDataset, 
    removeDataset, 
    updateDataset,
    updatePointImage,
    chartMode,
    setChartMode,
    activeDatasetIndex,
    setActiveDatasetIndex,
    uniformityMode,
    setUniformityMode,
    updateLabels,
  } = useChartStore()
  
  const [activeTab, setActiveTab] = useState<DatasetTab>('general')
  const [datasetsDropdownOpen, setDatasetsDropdownOpen] = useState(false)
  const [imagesDropdownOpen, setImagesDropdownOpen] = useState(false)
  const [advancedDropdownOpen, setAdvancedDropdownOpen] = useState(false)
  const [selectedImageType, setSelectedImageType] = useState('circle')
  const [imageUploadUrl, setImageUploadUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false)
  const [showFullEditModal, setShowFullEditModal] = useState(false)
  const [fullEditRows, setFullEditRows] = useState<{ label: string; value: number; color: string; imageUrl: string | null }[]>([])
  const [editingDatasetIndex, setEditingDatasetIndex] = useState<number>(0)
  const [editingDatasetName, setEditingDatasetName] = useState<string>("")
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false)
  const [datasetToDelete, setDatasetToDelete] = useState<number | null>(null)
  const [editingColorMode, setEditingColorMode] = useState<'slice' | 'dataset'>('slice')
  const [editingDatasetColor, setEditingDatasetColor] = useState<string>('#3b82f6')
  const [preservedSliceColors, setPreservedSliceColors] = useState<string[]>([])
  const [newDatasetName, setNewDatasetName] = useState("")
  const [newDatasetColor, setNewDatasetColor] = useState("#1E90FF") // DodgerBlue
  const [newDatasetPoints, setNewDatasetPoints] = useState(5)
  const [newDatasetSlices, setNewDatasetSlices] = useState<Array<{name: string, value: number, color: string}>>([
    { name: "Slice 1", value: 10, color: "#1E90FF" },
    { name: "Slice 2", value: 20, color: "#ff6b6b" },
    { name: "Slice 3", value: 15, color: "#4ecdc4" },
    { name: "Slice 4", value: 25, color: "#45b7d1" },
    { name: "Slice 5", value: 30, color: "#96ceb4" }
  ])
  const [newDatasetChartType, setNewDatasetChartType] = useState<import("@/lib/chart-store").SupportedChartType>('bar')
  const [colorMode, setColorMode] = useState<'slice' | 'dataset'>('slice');
  const [colorOpacity, setColorOpacity] = useState(100); // 0-100 for transparency
  const [borderColorMode, setBorderColorMode] = useState<'auto' | 'manual'>('auto');
  const [manualBorderColor, setManualBorderColor] = useState('#000000');

  const supportedChartTypes: { value: import("@/lib/chart-store").SupportedChartType; label: string }[] = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'scatter', label: 'Scatter' },
    { value: 'bubble', label: 'Bubble' },
    { value: 'pie', label: 'Pie' },
    { value: 'doughnut', label: 'Doughnut' },
    { value: 'polarArea', label: 'Polar Area' },
    { value: 'radar', label: 'Radar' },
    { value: 'horizontalBar', label: 'Horizontal Bar' },
    { value: 'stackedBar', label: 'Stacked Bar' },
    { value: 'area', label: 'Area' },
  ]

  // Filter chart types based on mode and uniformity
  const getAvailableChartTypes = () => {
    if (chartMode === 'single') {
      return supportedChartTypes;
    }
    
    // For grouped mode, only allow certain chart types
    if (uniformityMode === 'mixed') {
      // Mixed mode: only allow bar, line, area for grouped datasets
      return supportedChartTypes.filter(type => 
        ['bar', 'line', 'area'].includes(type.value)
      );
    } else {
      // Uniform mode: show all chart types except pie, doughnut
      return supportedChartTypes.filter(type => 
        !['pie', 'doughnut'].includes(type.value)
      );
    }
  }

  const handleChartModeChange = (mode: 'single' | 'grouped') => {
    setChartMode(mode);
    if (mode === 'single' && activeDatasetIndex === -1) {
      setActiveDatasetIndex(0);
    }
  };

  const handleActiveDatasetChange = (index: number) => {
    setActiveDatasetIndex(index);
  };

  const handleUpdateDataset = (datasetIndex: number, updates: Partial<ExtendedChartDataset> | string, value?: any) => {
    if (typeof updates === 'string') {
      updateDataset(datasetIndex, { [updates]: value });
    } else {
      updateDataset(datasetIndex, updates);
    }
  };

  const generateColorPalette = (count: number) => {
    const colors = []
    for (let i = 0; i < count; i++) {
      const hue = (i * 360) / count
      colors.push(`hsl(${hue}, 70%, 50%)`)
    }
    return colors
  }

  const darkenColor = (color: string, percent: number) => {
    // Handle HSL colors
    if (color.startsWith("hsl")) {
      const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
      if (match) {
        const [, h, s, l] = match
        const newL = Math.max(0, Number.parseInt(l) - percent)
        return `hsl(${h}, ${s}%, ${newL}%)`
      }
    }
    
    // Handle hex colors
    if (color.startsWith("#")) {
      const hex = color.replace("#", "")
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      
      // Darken by reducing RGB values
      const factor = 1 - percent / 100
      const newR = Math.max(0, Math.round(r * factor))
      const newG = Math.max(0, Math.round(g * factor))
      const newB = Math.max(0, Math.round(b * factor))
      
      return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
    }
    
    // Handle rgba/rgb colors
    if (color.startsWith("rgba") || color.startsWith("rgb")) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (match) {
        const [, r, g, b, a] = match
        const factor = 1 - percent / 100
        const newR = Math.max(0, Math.round(parseInt(r) * factor))
        const newG = Math.max(0, Math.round(parseInt(g) * factor))
        const newB = Math.max(0, Math.round(parseInt(b) * factor))
        
        if (a !== undefined) {
          return `rgba(${newR}, ${newG}, ${newB}, ${a})`
        }
        return `rgb(${newR}, ${newG}, ${newB})`
      }
    }
    
    return color
  }

  const handleRandomizeColors = (datasetIndex: number) => {
    const dataset = chartData.datasets[datasetIndex]
    const colors = generateColorPalette(dataset.data.length)
    updateDataset(datasetIndex, {
      backgroundColor: colors,
      borderColor: colors.map(c => darkenColor(c, 20)),
      lastSliceColors: colors,
    })
  }

  const handleAddSlice = () => {
    setNewDatasetSlices([...newDatasetSlices, { name: `Slice ${newDatasetSlices.length + 1}`, value: 0, color: "#1E90FF" }])
  }

  const handleRemoveSlice = (index: number) => {
    if (newDatasetSlices.length > 1) {
      setNewDatasetSlices(newDatasetSlices.filter((_, i) => i !== index))
    }
  }

  const handleUpdateSlice = (index: number, field: 'name' | 'value' | 'color', value: string | number) => {
    const updatedSlices = [...newDatasetSlices]
    updatedSlices[index] = { ...updatedSlices[index], [field]: value }
    setNewDatasetSlices(updatedSlices)
  }

  const handleAddDatasetModal = () => {
    // For Grouped Mode: if there are existing datasets, use their slice names and structure
    let finalSlices = newDatasetSlices;
    let finalDatasetName = newDatasetName;
    
    // Determine the chart type to use based on uniformity mode
    let finalChartType = newDatasetChartType;
    if (chartMode === 'grouped' && uniformityMode === 'uniform') {
      finalChartType = chartType; // Use the global chart type from Types & Toggles
    }
    
    if (chartMode === 'grouped' && filteredDatasets.length > 0) {
      // Get the first dataset's slice labels and structure
      const firstDataset = filteredDatasets[0];
      const existingSliceLabels = firstDataset.sliceLabels || firstDataset.data.map((_, i) => `Slice ${i + 1}`);
      
      // Use the existing slice names but keep the user-entered values and colors
      finalSlices = existingSliceLabels.map((label, index) => ({
        name: label, // Inherit the name from existing dataset
        value: newDatasetSlices[index]?.value || 0, // Keep the user-entered value
        color: newDatasetSlices[index]?.color || "#1E90FF" // Keep the user-entered color
      }));
      
      // Use the user-provided dataset name (no auto-generation)
      finalDatasetName = newDatasetName || "New Dataset";
    }

    const colors = finalSlices.map(slice => slice.color)
    const borderColors = colors.map(c => darkenColor(c, 20))
          const newDataset: ExtendedChartDataset = {
        label: finalDatasetName,
      data: finalSlices.map(slice => slice.value),
      backgroundColor: colors,
      borderColor: borderColors,
      borderWidth: 2,
      pointRadius: 5,
      tension: 0.4,
      fill: false,
      pointImages: Array(finalSlices.length).fill(null),
      pointImageConfig: Array(finalSlices.length).fill(getDefaultImageConfigFromStore(finalChartType)),
      mode: chartMode, // Set the mode when creating the dataset
      sliceLabels: finalSlices.map(slice => slice.name), // Store per-dataset slice names
      chartType: finalChartType, // Store the chart type for this dataset
    }
    addDataset(newDataset)
    setShowAddDatasetModal(false)
    setNewDatasetName("")
    setNewDatasetColor("#1E90FF")
    setNewDatasetPoints(5)
    
    // Reset slices based on mode - but preserve structure for Grouped Mode with existing datasets
    if (chartMode === 'grouped' && filteredDatasets.length > 0) {
      // Keep the same structure as existing datasets, just reset values
      const firstDataset = filteredDatasets[0];
      const existingSliceLabels = firstDataset.sliceLabels || firstDataset.data.map((_, i) => `Slice ${i + 1}`);
      setNewDatasetSlices(existingSliceLabels.map((label, index) => ({
        name: label,
        value: 0,
        color: newDatasetSlices[index]?.color || "#1E90FF"
      })));
    } else {
      // Reset to default for single mode or first dataset
      setNewDatasetSlices([
        { name: "Slice 1", value: 10, color: "#1E90FF" },
        { name: "Slice 2", value: 20, color: "#ff6b6b" },
        { name: "Slice 3", value: 15, color: "#4ecdc4" },
        { name: "Slice 4", value: 25, color: "#45b7d1" },
        { name: "Slice 5", value: 30, color: "#96ceb4" }
      ])
    }
  }

  // Filter datasets based on current mode
  const filteredDatasets = chartData.datasets.filter(dataset => {
    // If dataset has a mode property, filter by it
    if (dataset.mode) {
      return dataset.mode === chartMode
    }
    // For backward compatibility, show all datasets if no mode is set
    return true
  })

  // Function to initialize modal with existing dataset structure
  const initializeModalWithExistingStructure = () => {
    if (chartMode === 'grouped' && filteredDatasets.length > 0) {
      const firstDataset = filteredDatasets[0];
      const existingSliceLabels = firstDataset.sliceLabels || firstDataset.data.map((_, i) => `Slice ${i + 1}`);
      
      setNewDatasetSlices(existingSliceLabels.map((label, index) => ({
        name: label,
        value: 0,
        color: newDatasetSlices[index]?.color || "#1E90FF"
      })));
    }
  };

  // Update modal initialization when opening
  const handleOpenAddDatasetModal = () => {
    setShowAddDatasetModal(true);
    initializeModalWithExistingStructure();
  };

  // Helper function to convert RGBA to hex
  const rgbaToHex = (rgba: string): string => {
    // Handle hex colors (already in correct format)
    if (rgba.startsWith('#')) return rgba
    
    // Handle rgba colors
    const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/)
    if (match) {
      const [, r, g, b] = match
      return `#${[r, g, b].map(x => {
        const hex = parseInt(x).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }).join('')}`
    }
    
    // Fallback for other formats
    return rgba || '#3b82f6'
  }

  const handleDatasetTileClick = (datasetIndex: number) => {
    const dataset = filteredDatasets[datasetIndex]
    if (!dataset) return
    
    const currentSliceLabels = dataset.sliceLabels || chartData.labels || []
    
    const rows: { label: string; value: number; color: string; imageUrl: string | null }[] = dataset.data.map((val, i) => {
      const rawColor = Array.isArray(dataset.backgroundColor) 
        ? (dataset.backgroundColor[i] as string) 
        : (dataset.backgroundColor as string) || '#3b82f6'
      
      return {
        label: String(currentSliceLabels[i] || `Slice ${i + 1}`),
        value: typeof val === 'number' ? val : (Array.isArray(val) ? (val[1] as number) : (val as any)?.y ?? 0),
        color: rgbaToHex(rawColor),
        imageUrl: dataset.pointImages?.[i] || null,
      }
    })
    
    setFullEditRows(rows)
    setEditingDatasetIndex(datasetIndex)
    setEditingDatasetName(dataset.label || `Dataset ${datasetIndex + 1}`)
    
    // Determine color mode and set dataset color
    const isSingleColorMode = (dataset as any).datasetColorMode === 'single' || 
                              (typeof dataset.backgroundColor === 'string')
    const currentColorMode = isSingleColorMode ? 'dataset' : 'slice'
    
    setEditingColorMode(currentColorMode)
    
    if (currentColorMode === 'dataset') {
      const singleColor = typeof dataset.backgroundColor === 'string' 
        ? dataset.backgroundColor 
        : (Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[0] : '#3b82f6')
      setEditingDatasetColor(rgbaToHex(singleColor))
    } else {
      // For slice mode, extract the first color as default dataset color
      const firstColor = Array.isArray(dataset.backgroundColor) 
        ? dataset.backgroundColor[0] 
        : dataset.backgroundColor || '#3b82f6'
      setEditingDatasetColor(rgbaToHex(firstColor))
    }
    
    // Preserve original slice colors
    setPreservedSliceColors(rows.map(row => row.color))
    
    setShowFullEditModal(true)
  }

  const handleDeleteClick = (datasetIndex: number) => {
    setDatasetToDelete(datasetIndex)
    setShowDeleteConfirmDialog(true)
  }

  const handleConfirmDelete = () => {
    if (datasetToDelete !== null) {
      removeDataset(datasetToDelete)
      setShowDeleteConfirmDialog(false)
      setDatasetToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirmDialog(false)
    setDatasetToDelete(null)
  }

  const handleColorModeChange = (mode: 'slice' | 'dataset') => {
    setEditingColorMode(mode)
    
    if (mode === 'slice') {
      // Restore preserved slice colors
      setFullEditRows(prev => prev.map((row, index) => ({
        ...row,
        color: preservedSliceColors[index] || row.color
      })))
    } else {
      // Apply dataset color to all slices
      setFullEditRows(prev => prev.map(row => ({
        ...row,
        color: editingDatasetColor
      })))
    }
  }

  const handleDatasetColorChange = (color: string) => {
    setEditingDatasetColor(color)
    
    if (editingColorMode === 'dataset') {
      // Update all slice colors to match dataset color
      setFullEditRows(prev => prev.map(row => ({
        ...row,
        color: color
      })))
    }
  }

  // Update modal structure when chart mode or datasets change
  useEffect(() => {
    if (showAddDatasetModal) {
      initializeModalWithExistingStructure();
    }
  }, [chartMode, filteredDatasets.length, showAddDatasetModal]);

  // Auto-switch to uniform mode for incompatible chart types in grouped mode
  useEffect(() => {
    if (chartMode === 'grouped' && ['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'].includes(chartType as any) && uniformityMode === 'mixed') {
      setUniformityMode('uniform');
    }
  }, [chartType, chartMode, uniformityMode, setUniformityMode]);

  useEffect(() => {
    chartData.datasets.forEach((dataset, datasetIndex) => {
      // Only modify colors when the dataset's own color mode matches the local selection.
      if (colorMode === 'dataset' && (dataset as any).datasetColorMode === 'single') {
        // Backup current slice colors before unifying, if we have a per-slice array
        if (Array.isArray(dataset.backgroundColor)) {
          handleUpdateDataset(datasetIndex, {
            lastSliceColors: [...dataset.backgroundColor],
          });
        }
        const baseColor = (dataset as any).color
          || (Array.isArray(dataset.backgroundColor) ? (dataset.backgroundColor[0] || '#3b82f6') : (dataset.backgroundColor || '#3b82f6'));
        handleUpdateDataset(datasetIndex, {
          backgroundColor: Array(dataset.data.length).fill(baseColor),
          borderColor: Array(dataset.data.length).fill(darkenColor(baseColor, 20)),
        });
      }
      if (colorMode === 'slice' && (dataset as any).datasetColorMode === 'slice') {
        if (Array.isArray((dataset as any).lastSliceColors) && (dataset as any).lastSliceColors.length === dataset.data.length) {
          handleUpdateDataset(datasetIndex, {
            backgroundColor: [...(dataset as any).lastSliceColors],
            borderColor: (dataset as any).lastSliceColors.map((c: string) => darkenColor(c, 20)),
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorMode]);

  // Update opacity state when dataset changes in single mode
  useEffect(() => {
    if (chartMode === 'single' && activeDatasetIndex >= 0) {
      const activeDataset = chartData.datasets[activeDatasetIndex]
      if (!activeDataset) return
      
      const bgColor = Array.isArray(activeDataset.backgroundColor) 
        ? activeDataset.backgroundColor[0] 
        : activeDataset.backgroundColor
      
      if (bgColor && bgColor.startsWith('rgba')) {
        const match = bgColor.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
        if (match) {
          const detectedOpacity = Math.round(parseFloat(match[1]) * 100)
          setColorOpacity(detectedOpacity)
        }
      } else {
        setColorOpacity(100)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDatasetIndex, chartMode]);

  // Note: Border color mode defaults to 'auto' and stays that way unless user explicitly changes it
  // No auto-detection to avoid confusion - user has full control

  const renderGeneralTab = () => (
    <div className="space-y-4">
      {/* Chart Mode Section */}
      <div className="mb-4">
        <div className="font-semibold text-[0.80rem] mb-2">Chart Mode</div>
        <div className="flex items-center gap-6 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 shadow-sm">
                      <label className={`flex items-center gap-2 cursor-pointer transition-colors text-[0.80rem] ${chartMode === 'single' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}> 
            <input
              type="radio"
              className="accent-blue-600"
              checked={chartMode === 'single'}
              onChange={() => handleChartModeChange('single')}
            />
            <BarChart2 className="h-4 w-4" />
            Single
          </label>
          <label className={`flex items-center gap-2 cursor-pointer transition-colors text-[0.80rem] ${chartMode === 'grouped' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}> 
            <input
              type="radio"
              className="accent-blue-600"
              checked={chartMode === 'grouped'}
              onChange={() => handleChartModeChange('grouped')}
            />
            <Layers className="h-4 w-4" />
            Grouped
          </label>
        </div>
      </div>

      {/* Uniformity Mode Section - Only for Grouped Mode */}
      {chartMode === 'grouped' && (
        <div className="mb-4">
          <div className="font-semibold text-[0.80rem] mb-2">Uniformity</div>
          <div className="flex items-center gap-6 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 shadow-sm">
            <label className={`flex items-center gap-2 cursor-pointer transition-colors text-[0.80rem] ${uniformityMode === 'uniform' ? 'text-purple-700 font-bold' : 'text-gray-500'}`}> 
              <input
                type="radio"
                className="accent-purple-600"
                checked={uniformityMode === 'uniform'}
                onChange={() => setUniformityMode('uniform')}
              />
              <BarChart2 className="h-4 w-4" />
              Uniform
            </label>
            <label className={`flex items-center gap-2 cursor-pointer transition-colors text-[0.80rem] ${uniformityMode === 'mixed' ? 'text-purple-700 font-bold' : 'text-gray-500'} ${['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'].includes(chartType as any) ? 'opacity-50 cursor-not-allowed' : ''}`}> 
              <input
                type="radio"
                className="accent-purple-600"
                checked={uniformityMode === 'mixed'}
                onChange={() => setUniformityMode('mixed')}
                disabled={['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'].includes(chartType as any)}
              />
              <Layers className="h-4 w-4" />
              Mixed
            </label>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {['pie', 'doughnut', 'radar', 'polarArea', 'scatter', 'bubble'].includes(chartType as any) ? (
              <span className="text-orange-600 font-medium">
                Mixed mode is not available for {chartType} charts. Only uniform mode is supported.
              </span>
            ) : uniformityMode === 'uniform' 
              ? 'All datasets will use the same chart type selected in Types & Toggles panel.'
              : 'Each dataset can have its own chart type selected during creation.'
            }
          </p>
        </div>
      )}

      {chartMode === 'single' && filteredDatasets.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[0.80rem] font-medium">Active Dataset</Label>
          <Select value={String(activeDatasetIndex)} onValueChange={(value) => handleActiveDatasetChange(Number(value))}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredDatasets.map((dataset, index) => (
                <SelectItem key={index} value={String(index)}>
                  {dataset.label || `Dataset ${index + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Datasets Management */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          <h3 className="text-[0.80rem] font-semibold text-gray-900">Datasets Management</h3>
          <button
            onClick={() => setDatasetsDropdownOpen(!datasetsDropdownOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transform transition-transform ${datasetsDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
        <div className="bg-green-50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[0.80rem] font-medium text-green-900">
              {filteredDatasets.length} Dataset{filteredDatasets.length !== 1 ? 's' : ''}
            </Label>
            <Button size="sm" onClick={() => handleOpenAddDatasetModal()} className="h-7 text-xs bg-green-600 hover:bg-green-700">
              <Plus className="h-3 w-3 mr-1" />
              Add Dataset
            </Button>
          </div>
          
          {datasetsDropdownOpen && (
            <div className="space-y-2 pt-2 border-t border-green-200 max-h-96 overflow-y-auto">
              {filteredDatasets.map((dataset, datasetIndex) => (
                <div
                  key={datasetIndex}
                  onClick={() => handleDatasetTileClick(datasetIndex)}
                  className={`p-3 bg-white rounded-lg border transition-all cursor-pointer ${
                    chartMode === 'single' && datasetIndex === activeDatasetIndex
                      ? 'border-blue-300 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: Array.isArray(dataset.backgroundColor) 
                            ? dataset.backgroundColor[0] 
                            : dataset.backgroundColor
                        }}
                      />
                      <Input
                        value={dataset.label || ''}
                        onChange={(e) => handleUpdateDataset(datasetIndex, 'label', e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-xs font-medium border border-gray-300 px-2 py-1 bg-white hover:border-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                        placeholder={`Dataset ${datasetIndex + 1}`}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      {chartMode === 'single' && datasetIndex === activeDatasetIndex && (
                        <span className="w-2 h-2 rounded-full bg-green-500 ml-2 inline-block" title="Active dataset"></span>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(datasetIndex)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Dataset visibility toggle */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-xs text-gray-600">{dataset.data.length} data points</span>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Visible</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Enhanced Add Dataset Modal */}
      <Dialog open={showAddDatasetModal} onOpenChange={setShowAddDatasetModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Dataset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Dataset Basic Info - All in one line */}
            <div className="flex gap-3 items-end">
              <div className="flex-shrink-0" style={{ width: '140px' }}>
                <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Chart Type</label>
                {chartMode === 'grouped' && uniformityMode === 'uniform' ? (
                  <div className="w-full h-9 px-3 rounded border border-gray-200 bg-gray-50 flex items-center text-[0.80rem]">
                    <span className="text-gray-700">{chartType.charAt(0).toUpperCase() + chartType.slice(1)}</span>
                  </div>
                ) : (
                  <Select value={newDatasetChartType} onValueChange={(v) => setNewDatasetChartType(v as any)}>
                    <SelectTrigger className="w-full h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableChartTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="flex-1">
                <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Dataset Name <span className="text-red-500">*</span></label>
                <input
                  value={newDatasetName}
                  onChange={e => setNewDatasetName(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 text-[0.80rem] font-normal transition"
                  placeholder="Enter dataset name"
                />
              </div>
              <div className="flex-shrink-0" style={{ width: '100px' }}>
                <label className="text-[0.80rem] font-medium text-gray-600 mb-1 block">Mode</label>
                <div className="h-9 px-3 rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
                  <span className="text-[0.80rem] font-medium text-blue-800">
                    {chartMode === 'single' ? 'Single' : 'Grouped'}
                  </span>
                </div>
              </div>
            </div>
            
            {chartMode === 'grouped' && filteredDatasets.length > 0 && (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>Grouped Mode:</strong> Slice names will match existing datasets, but you can customize values and dataset name.
                </p>
              </div>
            )}

            {/* Slices Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[0.80rem] font-medium text-gray-700">Slices ({newDatasetSlices.length})</label>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={() => {
                      setNewDatasetSlices(slices => slices.map(slice => ({ ...slice, value: Math.floor(Math.random() * 50) + 1 })));
                    }}
                    className="h-7 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Randomize Values
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleAddSlice} 
                    disabled={chartMode === 'grouped' && filteredDatasets.length > 0}
                    className="h-7 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Slice
                  </Button>
                </div>
              </div>
              
              {chartMode === 'grouped' && filteredDatasets.length > 0 && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-800">
                    <strong>Grouped Mode:</strong> Slice names will match existing datasets, but you can customize values and dataset name.
                  </p>
                </div>
              )}
              
              {chartMode === 'grouped' && filteredDatasets.length === 0 && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-800">
                    <strong>Grouped Mode:</strong> This will be the first dataset. You can customize slice names and structure.
                  </p>
                </div>
              )}
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {newDatasetSlices.map((slice, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-600">Slice #{index + 1}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleRemoveSlice(index)}
                        disabled={newDatasetSlices.length <= 1 || (chartMode === 'grouped' && filteredDatasets.length > 0)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                        <input
                          value={slice.name}
                          onChange={e => handleUpdateSlice(index, 'name', e.target.value)}
                          disabled={chartMode === 'grouped' && filteredDatasets.length > 0}
                          className="w-full h-8 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs transition disabled:bg-gray-100 disabled:text-gray-500"
                          placeholder="Slice name"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Value</label>
                        <input
                          type="number"
                          value={slice.value}
                          onChange={e => handleUpdateSlice(index, 'value', Number(e.target.value))}
                          className="w-full h-8 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs transition"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">Color</label>
                        <div className="col-span-1 flex items-center gap-2 w-full">
                          <input
                            type="color"
                            value={slice.color}
                            onChange={e => handleUpdateSlice(index, 'color', e.target.value)}
                            className="w-8 h-8 p-0 border-0 bg-transparent"
                          />
                          <input
                            value={slice.color}
                            onChange={e => handleUpdateSlice(index, 'color', e.target.value)}
                            className="flex-1 h-8 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-mono uppercase transition w-full"
                            placeholder="#1E90FF"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <label className="text-xs font-medium text-blue-800 mb-2 block">Preview</label>
              <div className="space-y-1">
                <div className="text-xs text-blue-700">
                  <strong>Dataset:</strong> {newDatasetName || 'Unnamed Dataset'}
                </div>
                <div className="text-xs text-blue-700">
                  <strong>Mode:</strong> {chartMode === 'single' ? 'Single' : 'Grouped'}
                </div>
                <div className="text-xs text-blue-700">
                  <strong>Total Value:</strong> {newDatasetSlices.reduce((sum, slice) => sum + slice.value, 0)}
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {newDatasetSlices.map((slice, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs"
                      style={{ borderColor: slice.color }}
                    >
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span>{slice.name}: {slice.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={!newDatasetName.trim()}
              onClick={handleAddDatasetModal}
            >
              Create Dataset
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )

  const renderColorsTab = () => {
    const colorPalettes = [
      { name: 'Default', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'] },
      { name: 'Vibrant', colors: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3'] },
      { name: 'Pastel', colors: ['#fad2d2', '#d4e4ff', '#c7f2d0', '#fff2a8', '#e5d4ff', '#ffd8e5'] },
      { name: 'Earth', colors: ['#8d6e63', '#a1887f', '#bcaaa4', '#d7ccc8', '#8bc34a', '#4caf50'] },
      { name: 'Ocean', colors: ['#006064', '#0097a7', '#00acc1', '#00bcd4', '#26c6da', '#4dd0e1'] },
    ]
    
    const applyColorPalette = (colors: string[]) => {
      if (chartMode === 'single') {
        // In single mode, always apply colors to slices of the active dataset
        const activeDataset = chartData.datasets[activeDatasetIndex]
        if (!activeDataset) return
        
        const sliceColors = colors.slice(0, activeDataset.data.length)
        const borderColors = borderColorMode === 'manual'
          ? Array(activeDataset.data.length).fill(manualBorderColor)
          : sliceColors.map(c => darkenColor(c, 20))
          
        handleUpdateDataset(activeDatasetIndex, {
          backgroundColor: sliceColors,
          borderColor: borderColors
        })
      } else {
        // Grouped mode: respect color mode selection
      chartData.datasets.forEach((dataset, datasetIndex) => {
        const datasetColor = colors[datasetIndex % colors.length]
        if (colorMode === 'dataset') {
          // Use one color for the whole dataset
            const borderColors = borderColorMode === 'manual'
              ? Array(dataset.data.length).fill(manualBorderColor)
              : Array(dataset.data.length).fill(darkenColor(datasetColor, 20))
              
          handleUpdateDataset(datasetIndex, {
            backgroundColor: Array(dataset.data.length).fill(datasetColor),
              borderColor: borderColors,
          })
        } else {
          // Use a different color for each slice
          const sliceColors = colors.slice(0, dataset.data.length)
            const borderColors = borderColorMode === 'manual'
              ? Array(dataset.data.length).fill(manualBorderColor)
              : sliceColors.map(c => darkenColor(c, 20))
              
          handleUpdateDataset(datasetIndex, {
            backgroundColor: sliceColors,
              borderColor: borderColors
          })
        }
      })
      }
    }

    // Quick color presets for single mode
    const quickColors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899',
      '#06b6d4', '#f97316', '#14b8a6', '#eab308', '#a855f7', '#f43f5e',
      '#0ea5e9', '#dc2626', '#059669', '#ca8a04', '#9333ea', '#e11d48',
      '#22c55e', '#f59e0b', '#6366f1', '#d946ef', '#84cc16', '#fb923c'
    ]

    // Helper function to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return `rgba(${r}, ${g}, ${b}, ${alpha})`
    }

    // Helper function to extract hex from rgba or return hex
    const getHexFromColor = (color: string) => {
      if (color.startsWith('rgba')) {
        // Extract RGB values from rgba
        const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
        if (match) {
          const r = parseInt(match[1]).toString(16).padStart(2, '0')
          const g = parseInt(match[2]).toString(16).padStart(2, '0')
          const b = parseInt(match[3]).toString(16).padStart(2, '0')
          return `#${r}${g}${b}`
        }
      }
      return color
    }

    // Helper function to apply opacity to any color format
    const applyOpacityToColor = (color: string | undefined, opacityPercent: number) => {
      if (!color) return 'rgba(59, 130, 246, 1)' // Default blue
      
      const alpha = opacityPercent / 100
      
      // Handle hex colors
      if (color.startsWith('#')) {
        return hexToRgba(color, alpha)
      }
      
      // Handle rgba colors - replace the alpha value
      if (color.startsWith('rgba')) {
        return color.replace(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, `rgba($1, $2, $3, ${alpha})`)
      }
      
      // Handle rgb colors - convert to rgba
      if (color.startsWith('rgb')) {
        return color.replace(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/, `rgba($1, $2, $3, ${alpha})`)
      }
      
      // Handle hsl colors
      if (color.startsWith('hsl')) {
        // For hsl, we'll try to convert or just adjust opacity
        // For simplicity, try to convert to rgba
        const match = color.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/)
        if (match) {
          // Convert HSL to RGB then apply alpha
          const h = parseInt(match[1])
          const s = parseInt(match[2]) / 100
          const l = parseInt(match[3]) / 100
          
          const c = (1 - Math.abs(2 * l - 1)) * s
          const x = c * (1 - Math.abs((h / 60) % 2 - 1))
          const m = l - c / 2
          
          let r = 0, g = 0, b = 0
          if (h < 60) { r = c; g = x; b = 0 }
          else if (h < 120) { r = x; g = c; b = 0 }
          else if (h < 180) { r = 0; g = c; b = x }
          else if (h < 240) { r = 0; g = x; b = c }
          else if (h < 300) { r = x; g = 0; b = c }
          else { r = c; g = 0; b = x }
          
          const red = Math.round((r + m) * 255)
          const green = Math.round((g + m) * 255)
          const blue = Math.round((b + m) * 255)
          
          return `rgba(${red}, ${green}, ${blue}, ${alpha})`
        }
      }
      
      // Fallback: return the color as-is
      return color
    }

    const applyQuickColor = (color: string, opacity?: number) => {
      const activeDataset = chartData.datasets[activeDatasetIndex]
      if (!activeDataset) return
      
      const alpha = (opacity !== undefined ? opacity : colorOpacity) / 100
      const finalColor = alpha < 1 ? hexToRgba(color, alpha) : color
      
      // Apply color to all slices in the active dataset
      const sliceCount = activeDataset.data.length
      
      // Determine border color based on mode
      let finalBorderColor
      if (borderColorMode === 'manual') {
        // Use manual border color
        finalBorderColor = Array(sliceCount).fill(manualBorderColor)
      } else {
        // Auto mode: darken the base color for border
        const darkenedColor = darkenColor(color, 20)
        // Apply same opacity to border color
        finalBorderColor = Array(sliceCount).fill(alpha < 1 ? hexToRgba(darkenedColor, alpha) : darkenedColor)
      }
      
      handleUpdateDataset(activeDatasetIndex, {
        backgroundColor: Array(sliceCount).fill(finalColor),
        borderColor: finalBorderColor,
      })
    }

    const applyOpacity = (opacity: number) => {
      const activeDataset = chartData.datasets[activeDatasetIndex]
      if (!activeDataset) return
      
      // Apply opacity ONLY to background colors (preserving individual colors, leaving borders unchanged)
      let newBgColors: any
      if (Array.isArray(activeDataset.backgroundColor)) {
        newBgColors = activeDataset.backgroundColor.map(color => 
          typeof color === 'string' ? applyOpacityToColor(color, opacity) : color
        )
      } else if (typeof activeDataset.backgroundColor === 'string') {
        newBgColors = applyOpacityToColor(activeDataset.backgroundColor, opacity)
      } else {
        newBgColors = activeDataset.backgroundColor
      }
      
      // IMPORTANT: Preserve existing borderColor exactly as-is to keep borders crisp and unaffected by opacity
      // Create a deep copy to ensure the reference is preserved
      const preservedBorderColor = Array.isArray(activeDataset.borderColor)
        ? [...activeDataset.borderColor]
        : activeDataset.borderColor
      
      handleUpdateDataset(activeDatasetIndex, {
        backgroundColor: newBgColors,
        borderColor: preservedBorderColor as any
      })
    }

    const getCurrentColor = () => {
      const activeDataset = chartData.datasets[activeDatasetIndex]
      if (!activeDataset) return '#3b82f6'
      
      const bgColor = activeDataset.backgroundColor
      if (Array.isArray(bgColor)) {
        const firstColor = bgColor[0]
        return typeof firstColor === 'string' ? firstColor : '#3b82f6'
      }
      return typeof bgColor === 'string' ? bgColor : '#3b82f6'
    }

    const getCurrentOpacity = () => {
      const activeDataset = chartData.datasets[activeDatasetIndex]
      if (!activeDataset) return 100
      
      // Get opacity from the first background color
      let firstColor = ''
      if (Array.isArray(activeDataset.backgroundColor)) {
        const color = activeDataset.backgroundColor[0]
        firstColor = typeof color === 'string' ? color : ''
      } else {
        const color = activeDataset.backgroundColor
        firstColor = typeof color === 'string' ? color : ''
      }
      
      if (firstColor && firstColor.startsWith('rgba')) {
        const match = firstColor.match(/rgba?\(\d+,\s*\d+,\s*\d+,\s*([\d.]+)\)/)
        if (match) {
          return Math.round(parseFloat(match[1]) * 100)
        }
      }
      return 100
    }

    return (
      <div className="space-y-4">
        {/* Color Mode Selection - Only show for grouped mode */}
        {chartMode === 'grouped' && (
        <>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-pink-800">Color Mode</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={colorMode === 'slice' ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setColorMode('slice')}
              >
                Slice Colors
              </Button>
              <Button
                variant={colorMode === 'dataset' ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs"
                onClick={() => setColorMode('dataset')}
              >
                Dataset Colors
              </Button>
            </div>
          </div>

          {/* Opacity Control for Grouped Mode */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-pink-800">Opacity</Label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">{colorOpacity}%</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={() => {
                    setColorOpacity(100)
                    // Apply 100% opacity to all datasets (background colors only)
                    chartData.datasets.forEach((_, datasetIndex) => {
                      const dataset = chartData.datasets[datasetIndex]
                      
                      // Type-safe background color handling
                      let newBgColors: any
                      if (Array.isArray(dataset.backgroundColor)) {
                        newBgColors = dataset.backgroundColor.map(color => 
                          typeof color === 'string' ? applyOpacityToColor(color, 100) : color
                        )
                      } else if (typeof dataset.backgroundColor === 'string') {
                        newBgColors = applyOpacityToColor(dataset.backgroundColor, 100)
                      } else {
                        newBgColors = dataset.backgroundColor
                      }
                      
                      // Preserve existing borderColor exactly as-is
                      const preservedBorderColor = Array.isArray(dataset.borderColor)
                        ? [...dataset.borderColor]
                        : dataset.borderColor
                      
                      updateDataset(datasetIndex, {
                        backgroundColor: newBgColors,
                        borderColor: preservedBorderColor as any
                      })
                    })
                  }}
                  title="Reset to fully opaque"
                >
                  Reset
                </Button>
              </div>
            </div>
            <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
              <Slider
                value={[colorOpacity]}
                onValueChange={(value) => {
                  setColorOpacity(value[0])
                  // Apply opacity to all datasets in grouped mode (background colors only)
                  chartData.datasets.forEach((_, datasetIndex) => {
                    const dataset = chartData.datasets[datasetIndex]
                    
                    // Type-safe background color handling
                    let newBgColors: any
                    if (Array.isArray(dataset.backgroundColor)) {
                      newBgColors = dataset.backgroundColor.map(color => 
                        typeof color === 'string' ? applyOpacityToColor(color, value[0]) : color
                      )
                    } else if (typeof dataset.backgroundColor === 'string') {
                      newBgColors = applyOpacityToColor(dataset.backgroundColor, value[0])
                    } else {
                      newBgColors = dataset.backgroundColor
                    }
                    
                    // Preserve existing borderColor exactly as-is
                    const preservedBorderColor = Array.isArray(dataset.borderColor)
                      ? [...dataset.borderColor]
                      : dataset.borderColor
                    
                    updateDataset(datasetIndex, {
                      backgroundColor: newBgColors,
                      borderColor: preservedBorderColor as any
                    })
                  })
                }}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                <span>Transparent</span>
                <span>Opaque</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 italic">
              Adjusts opacity for background colors (borders unchanged)
            </p>
          </div>
        </>
        )}

        {/* Color Picker for Single Mode */}
        {chartMode === 'single' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-pink-800">Dataset Color</Label>
              <div className="flex items-center gap-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                <div className="flex-1 flex items-center gap-3">
                  <div className="relative">
                    {/* Checkerboard background for transparency preview */}
                    <div 
                      className="absolute inset-0 rounded-lg"
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                      }}
                    />
                    <div 
                      className="relative w-12 h-12 rounded-lg border-2 border-white shadow-md cursor-pointer hover:scale-105 transition-transform"
                      style={{ backgroundColor: getCurrentColor() }}
                      onClick={() => document.getElementById('single-mode-color-picker')?.click()}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-700">Current Color</div>
                    <div className="text-[10px] text-gray-500 font-mono uppercase">{getCurrentColor()}</div>
                  </div>
                </div>
                <input
                  id="single-mode-color-picker"
                  type="color"
                  value={getHexFromColor(getCurrentColor())}
                  onChange={(e) => applyQuickColor(e.target.value)}
                  className="invisible w-0 h-0"
                />
              </div>
            </div>

            {/* Opacity/Transparency Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-pink-800">Opacity</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600">{colorOpacity}%</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setColorOpacity(100)
                      applyOpacity(100)
                    }}
                    title="Reset to fully opaque"
                  >
                    Reset
                  </Button>
                </div>
              </div>
              <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
                <Slider
                  value={[colorOpacity]}
                  onValueChange={(value) => {
                    setColorOpacity(value[0])
                    applyOpacity(value[0])
                  }}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-[10px] text-gray-500">
                  <span>Transparent</span>
                  <span>Opaque</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 italic">
                Adjusts opacity of background colors (borders unchanged)
              </p>
            </div>

            {/* Quick Color Swatches */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-pink-800">Pick Quick Dataset Colors</Label>
              <div className="grid grid-cols-8 gap-2 p-3 bg-pink-50 rounded-lg border border-pink-200">
                {quickColors.map((color, index) => (
                  <button
                    key={index}
                    className="w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => {
                      setColorOpacity(100)
                      applyQuickColor(color, 100)
                    }}
                    title={color}
                  >
                    {/* Checkerboard background for transparency */}
                    <div 
                      className="absolute inset-0"
                      style={{
                        backgroundImage: 'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
                        backgroundSize: '4px 4px',
                        backgroundPosition: '0 0, 0 2px, 2px -2px, -2px 0px'
                      }}
                    />
                    <div 
                      className="absolute inset-0"
                      style={{ backgroundColor: color }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Preset Palettes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
            <h3 className="text-[0.80rem] font-semibold text-gray-900">Preset Palettes</h3>
          </div>
          
          <div className="space-y-2">
            <div className="grid gap-2 p-3 bg-pink-50 rounded-lg border border-pink-200">
              {colorPalettes.map((palette, index) => (
                <button
                  key={index}
                  className="flex items-center justify-between p-2 bg-white rounded border hover:border-pink-400 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => applyColorPalette(palette.colors)}
                  title={`Apply ${palette.name} palette`}
                >
                  <span className="text-xs font-medium text-gray-700">{palette.name}</span>
                  <div className="flex gap-1">
                    {palette.colors.map((color, colorIndex) => (
                      <div
                        key={colorIndex}
                        className="w-5 h-5 rounded border border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Reset Button */}
            <div className="flex justify-center">
              <Button 
                size="sm" 
                variant="outline"
                className="h-8 text-xs w-full"
                onClick={() => applyColorPalette(colorPalettes[0].colors)}
              >
                <Palette className="h-3 w-3 mr-1" />
                Reset to Default Palette
              </Button>
            </div>
          </div>

          {/* Individual Dataset Colors - Only for grouped mode */}
          {chartMode === 'grouped' && (
            <div className="space-y-2 mt-3">
              <Label className="text-xs font-medium text-pink-800">Dataset Colors</Label>
              <div className="space-y-2 p-3 bg-pink-50 rounded-lg border border-pink-200">
                {chartData.datasets.map((dataset, datasetIndex) => (
                  <div key={datasetIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                    <span className="text-xs font-medium">
                      {dataset.label || `Dataset ${datasetIndex + 1}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ 
                          backgroundColor: Array.isArray(dataset.backgroundColor) 
                            ? dataset.backgroundColor[0] 
                            : dataset.backgroundColor 
                        }}
                        onClick={() => document.getElementById(`dataset-color-${datasetIndex}`)?.click()}
                      />
                      <input
                        id={`dataset-color-${datasetIndex}`}
                        type="color"
                        value={Array.isArray(dataset.backgroundColor) 
                          ? dataset.backgroundColor[0] 
                          : dataset.backgroundColor || '#3b82f6'}
                        onChange={(e) => {
                          handleUpdateDataset(datasetIndex, {
                            backgroundColor: e.target.value,
                            borderColor: darkenColor(e.target.value, 20)
                          })
                        }}
                        className="invisible w-0"
                      />
                      <Input
                        value={Array.isArray(dataset.backgroundColor) 
                          ? dataset.backgroundColor[0] 
                          : dataset.backgroundColor || '#3b82f6'}
                        onChange={(e) => {
                          handleUpdateDataset(datasetIndex, {
                            backgroundColor: e.target.value,
                            borderColor: darkenColor(e.target.value, 20)
                          })
                        }}
                        className="w-20 h-6 text-xs font-mono uppercase"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderAdvancedTab = () => (
    <div className="space-y-4">
      {/* Animations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
          <h3 className="text-[0.80rem] font-semibold text-gray-900">Animations</h3>
          <button
            onClick={() => setAdvancedDropdownOpen(!advancedDropdownOpen)}
            className="ml-auto p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className={`transform transition-transform ${advancedDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-3 space-y-3">
          {/* Animation Toggle - Always Visible */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Enable Animations</Label>
              <Switch
                checked={true} // Chart animations are typically enabled by default
                onCheckedChange={(checked) => {
                  // This would update the chart config for animations
                  console.log('Animation toggle:', checked)
                }}
                className="data-[state=checked]:bg-orange-600"
              />
            </div>
          </div>
          
          {advancedDropdownOpen && (
            <div className="space-y-3 pt-2 border-t border-orange-200">
              {/* Animation Settings */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Animation Properties</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Duration (ms)</Label>
                    <Input
                      type="number"
                      defaultValue="1000"
                      className="h-8 text-xs"
                      placeholder="1000"
                      min={0}
                      max={5000}
                      step={100}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Easing</Label>
                    <Select defaultValue="easeOutQuart">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="easeOutQuart">Ease Out</SelectItem>
                        <SelectItem value="easeInQuart">Ease In</SelectItem>
                        <SelectItem value="easeInOutQuart">Ease In/Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Interaction Settings */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Interactions</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Hover Effects</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Click Events</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Tooltips</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                </div>
              </div>

              {/* Performance Settings */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Performance</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Responsive</Label>
                    <Switch
                      defaultChecked={true}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Device Pixel Ratio</Label>
                    <Select defaultValue="auto">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="1">1x</SelectItem>
                        <SelectItem value="2">2x</SelectItem>
                        <SelectItem value="3">3x</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Data Transformation */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Data Processing</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Skip Null Values</Label>
                    <Switch
                      defaultChecked={false}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Normalize Data</Label>
                    <Switch
                      defaultChecked={false}
                      className="data-[state=checked]:bg-orange-600"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Index Axis</Label>
                    <Select defaultValue="x">
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="x">X-Axis</SelectItem>
                        <SelectItem value="y">Y-Axis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-orange-800">Actions</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Settings className="h-3 w-3 mr-1" />
                    Export Config
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Import Config
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderImagesTab = () => {
    const imageOptions = getImageOptionsForChartType(chartType);
    
    const handleImageUpload = (file: File, datasetIndex: number, pointIndex: number) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          const config = chartData.datasets[datasetIndex]?.pointImageConfig?.[pointIndex] || getDefaultImageConfigFromStore(chartType);
          updatePointImage(datasetIndex, pointIndex, e.target.result as string, config);
        }
      };
      reader.readAsDataURL(file);
    };

    const handleUrlSubmit = (datasetIndex: number, pointIndex: number) => {
      if (imageUploadUrl.trim()) {
        const config = chartData.datasets[datasetIndex]?.pointImageConfig?.[pointIndex] || getDefaultImageConfigFromStore(chartType);
        updatePointImage(datasetIndex, pointIndex, imageUploadUrl.trim(), config);
        setImageUploadUrl('');
      }
    };

    const handleImageConfigChange = (datasetIndex: number, pointIndex: number, key: string, value: any) => {
      const currentConfig = chartData.datasets[datasetIndex]?.pointImageConfig?.[pointIndex] || getDefaultImageConfigFromStore(chartType);
      const imageUrl = (chartData.datasets[datasetIndex]?.pointImages?.[pointIndex] as string | undefined) ?? '';
      updatePointImage(datasetIndex, pointIndex, imageUrl, { ...currentConfig, [key]: value });
    };

    const handleGlobalImageConfigChange = (key: string, value: any) => {
      if (chartMode === 'single' && activeDatasetIndex !== -1) {
        const dataset = chartData.datasets[activeDatasetIndex];
        dataset.data.forEach((_: any, pointIndex: number) => {
          handleImageConfigChange(activeDatasetIndex, pointIndex, key, value);
        });
      }
    };

    const getPositionIcon = (position: string) => {
      switch (position) {
        case 'above': return ArrowUp;
        case 'below': return ArrowDown;
        case 'left': return ArrowLeft;
        case 'right': return ArrowRight;
        case 'center': return Target;
        case 'callout': return ArrowUpRight;
        default: return Target;
      }
    };

    return (
      <div className="space-y-4">
        {/* Image Management */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
            <h3 className="text-[0.80rem] font-semibold text-gray-900">Global Settings</h3>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 space-y-3">
            {/* Global Image Settings - Always Visible */}
            <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-purple-800">Image URL</Label>
                  <Input
                    value={imageUploadUrl || ''}
                    onChange={(e) => setImageUploadUrl(e.target.value)}
                    placeholder="https://example.com/image.png"
                    className="h-8 text-xs mt-1"
                  />
                </div>
                <Button
                  size="sm"
                  className="h-8 px-2 text-xs bg-purple-600 hover:bg-purple-700 mt-5"
                  onClick={() => {
                    if (chartMode === 'single' && activeDatasetIndex !== -1) {
                      chartData.datasets[activeDatasetIndex].data.forEach((_: any, pointIndex: number) => {
                        handleUrlSubmit(activeDatasetIndex, pointIndex);
                      });
                    }
                  }}
                  disabled={!imageUploadUrl.trim()}
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
            </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && chartMode === 'single' && activeDatasetIndex !== -1) {
                      chartData.datasets[activeDatasetIndex].data.forEach((_: any, pointIndex: number) => {
                        handleImageUpload(file, activeDatasetIndex, pointIndex);
                      });
                    }
                  }}
                />
              </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-purple-800">Image Shape</Label>
                  <Select value={selectedImageType} onValueChange={(value) => {
                    setSelectedImageType(value);
                    handleGlobalImageConfigChange('type', value);
                  }}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {imageOptions.types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.value === 'circle' && <Circle className="h-3 w-3" />}
                            {type.value === 'square' && <Square className="h-3 w-3" />}
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium text-purple-800">Size</Label>
                  <Input
                    type="number"
                    defaultValue={getDefaultImageSize(chartType)}
                    className="h-8 text-xs"
                    placeholder="20"
                    min={5}
                    max={100}
                    step={1}
                    onChange={(e) => handleGlobalImageConfigChange('size', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium text-purple-800">Position</Label>
                <Select defaultValue="center" onValueChange={(value) => handleGlobalImageConfigChange('position', value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageOptions.positions.map((position) => (
                      <SelectItem key={position.value} value={position.value}>
                        <div className="flex items-center gap-2">
                          {position.value === 'callout' && <ArrowUpRight className="h-3 w-3" />}
                          {position.value === 'center' && <Target className="h-3 w-3" />}
                          {position.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {imageOptions.supportsArrow && chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.position === 'callout' && (
                <div className="space-y-3">
                    {/* Arrow/Callout Settings */}
                <Label className="text-xs font-medium text-purple-800">Arrow/Callout Settings</Label>
                    {/* Border controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                        <Label className="text-xs font-medium">Border Width</Label>
                        <Input
                          type="number"
                          value={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.borderWidth || 3}
                          className="h-8 text-xs"
                          placeholder="3"
                          min={0}
                          max={10}
                          step={1}
                          onChange={(e) => handleGlobalImageConfigChange('borderWidth', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Border Color</Label>
                        <Input
                          type="color"
                          value={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.borderColor || '#ffffff'}
                          className="h-8 w-full"
                          onChange={(e) => handleGlobalImageConfigChange('borderColor', e.target.value)}
                        />
                      </div>
                    </div>
                    {/* Arrow toggles side by side */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                    <Switch
                          checked={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.arrowLine !== false}
                          onCheckedChange={(checked) => handleGlobalImageConfigChange('arrowLine', checked)}
                    />
                        <Label className="text-xs font-medium">Show Arrow Line</Label>
                  </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.arrowHead !== false}
                          onCheckedChange={(checked) => handleGlobalImageConfigChange('arrowHead', checked)}
                          disabled={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.arrowLine === false}
                        />
                        <Label className="text-xs font-medium">Show Arrow Head</Label>
                      </div>
                    </div>
                    {/* Arrow Color and Arrow to Image - only shown when Show Arrow Line is checked */}
                    {chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.arrowLine !== false && (
                      <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Arrow Color</Label>
                    <Input
                      type="color"
                            value={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.arrowColor || '#666666'}
                      className="h-8 w-full"
                      onChange={(e) => handleGlobalImageConfigChange('arrowColor', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                          <Label className="text-xs font-medium">Arrow to Image</Label>
                    <Input
                      type="number"
                            value={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.arrowEndGap ?? 8}
                      className="h-8 text-xs"
                            placeholder="8"
                      min={0}
                            max={30}
                      step={1}
                            onChange={(e) => handleGlobalImageConfigChange('arrowEndGap', parseInt(e.target.value))}
                    />
                  </div>
                  </div>
                    )}
              </div>
              )}

              {imageOptions.supportsFill && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-purple-800">
                      {['pie', 'doughnut', 'polarArea'].includes(chartType) ? 'Fill Slice' : 'Fill Bar'}
                    </Label>
                    <Switch
                      defaultChecked={false}
                      onCheckedChange={(checked) => {
                        if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
                          handleGlobalImageConfigChange('fillSlice', checked)
                        } else {
                          handleGlobalImageConfigChange('fillBar', checked)
                        }
                      }}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-purple-800">Image Fit</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'fill')}
                        disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                          chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.fillSlice : 
                          chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.fillBar)}
                      >
                        <Maximize2 className="h-3 w-3 mr-1" />
                        Fill
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'cover')}
                        disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                          chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.fillSlice : 
                          chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.fillBar)}
                      >
                        <Crop className="h-3 w-3 mr-1" />
                        Cover
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'contain')}
                        disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                          chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.fillSlice : 
                          chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[0]?.fillBar)}
                      >
                        <Grid className="h-3 w-3 mr-1" />
                        Contain
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-4 pt-3 border-t border-purple-200">
                {/* Actions */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-purple-800">Quick Actions</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs"
                      onClick={() => {
                        if (chartMode === 'single' && activeDatasetIndex !== -1) {
                          chartData.datasets[activeDatasetIndex].data.forEach((_: any, pointIndex: number) => {
                            updatePointImage(activeDatasetIndex, pointIndex, '', getDefaultImageConfigFromStore(chartType));
                          });
                        }
                      }}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      Export Config
                    </Button>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = (tab: DatasetTab) => {
    switch (tab) {
      case 'general':
        return renderGeneralTab()
      case 'colors':
        return renderColorsTab()
      case 'images':
        return renderImagesTab()
      case 'advanced':
        return renderAdvancedTab()
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap max-w-full px-2">
        {[
          { id: 'general' as const, label: 'General' },
          { id: 'colors' as const, label: 'Colors' },
          { id: 'images' as const, label: 'Images' },
          { id: 'advanced' as const, label: 'Advanced' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-[0.80rem] font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-0">
        {renderTabContent(activeTab)}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Dataset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete this dataset? This action cannot be undone.
            </p>
            {datasetToDelete !== null && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-900">
                  Dataset: {filteredDatasets[datasetToDelete]?.label || `Dataset ${datasetToDelete + 1}`}
                </p>
                <p className="text-xs text-gray-500">
                  {filteredDatasets[datasetToDelete]?.data.length || 0} data points
                </p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Dataset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Edit Modal for Single mode */}
      <Dialog open={showFullEditModal} onOpenChange={setShowFullEditModal}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Full Edit (Single Dataset)</DialogTitle>
          </DialogHeader>
          
          {/* Dataset Name and Color Section */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-6">
              {/* Dataset Name */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dataset Name</Label>
                <Input
                  value={editingDatasetName}
                  onChange={(e) => setEditingDatasetName(e.target.value)}
                  placeholder="Enter dataset name"
                  className="h-10"
                />
              </div>
              
              {/* Dataset Color */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Dataset Color</Label>
                <div className="flex items-center gap-3">
                  {/* Radio Buttons */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center space-x-1">
                      <input
                        type="radio"
                        id="slice-color"
                        name="color-mode"
                        value="slice"
                        checked={editingColorMode === 'slice'}
                        onChange={() => handleColorModeChange('slice')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="slice-color" className="text-xs">Slice</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="radio"
                        id="dataset-color"
                        name="color-mode"
                        value="dataset"
                        checked={editingColorMode === 'dataset'}
                        onChange={() => handleColorModeChange('dataset')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <Label htmlFor="dataset-color" className="text-xs">Dataset</Label>
                    </div>
                  </div>
                  
                  {/* Color Picker */}
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingDatasetColor}
                      onChange={(e) => handleDatasetColorChange(e.target.value)}
                      disabled={editingColorMode === 'slice'}
                      className={`w-8 h-8 p-0 border-0 bg-transparent rounded ${editingColorMode === 'slice' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                    <Input
                      value={editingDatasetColor}
                      onChange={(e) => handleDatasetColorChange(e.target.value)}
                      disabled={editingColorMode === 'slice'}
                      className={`h-8 text-xs w-20 ${editingColorMode === 'slice' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-auto max-h-[60vh] space-y-2">
            {chartMode === 'single' && fullEditRows.map((row, i) => {
              return (
                <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 border rounded">
                  <div className="col-span-4">
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={row.label}
                      onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, label: e.target.value } : r))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs">Value</Label>
                    <Input
                      type="number"
                      value={row.value}
                      onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, value: Number(e.target.value) } : r))}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Color</Label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        className={`w-10 h-8 p-0 border-0 bg-transparent ${editingColorMode === 'dataset' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        value={row.color} 
                        onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))}
                        disabled={editingColorMode === 'dataset'}
                      />
                      <Input 
                        className={`h-8 text-xs w-24 ${editingColorMode === 'dataset' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        value={row.color} 
                        onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))}
                        disabled={editingColorMode === 'dataset'}
                      />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Image</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (!file) return
                            const reader = new FileReader()
                            reader.onload = (ev) => {
                              const url = ev.target?.result as string
                              setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, imageUrl: url } : r))
                            }
                            reader.readAsDataURL(file)
                          }
                          input.click()
                        }}
                      >
                        <Upload className="h-3 w-3 mr-1" /> {fullEditRows[i]?.imageUrl ? 'Change' : 'Upload'}
                      </Button>
                      {!!fullEditRows[i]?.imageUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, imageUrl: null } : r))}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={() => {
                if (fullEditRows.length === 0) return
                // Use the stored dataset index from when the tile was clicked
                const datasetIndex = editingDatasetIndex
                if (datasetIndex === -1 || !filteredDatasets[datasetIndex]) return
                
                // Persist labels, values, colors, images
                const labels = fullEditRows.map(r => r.label)
                const values = fullEditRows.map(r => r.value)
                const colors = fullEditRows.map(r => r.color)
                const images = fullEditRows.map(r => r.imageUrl)
                
                // Ensure arrays are aligned and persist slice colors
                updateDataset(datasetIndex, {
                  label: editingDatasetName,
                  sliceLabels: labels,
                  data: values as any,
                  backgroundColor: editingColorMode === 'dataset' ? editingDatasetColor : (colors as any),
                  pointImages: images as any,
                  datasetColorMode: editingColorMode === 'dataset' ? 'single' : 'slice',
                  color: editingColorMode === 'dataset' ? editingDatasetColor : undefined,
                })
                updateLabels(labels)
                setShowFullEditModal(false)
              }}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 