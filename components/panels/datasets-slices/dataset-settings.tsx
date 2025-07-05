"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useState, useRef, useEffect } from "react"
import { useChartStore, getDefaultImageType, getDefaultImageSize, getImageOptionsForChartType, getDefaultImageConfig as getDefaultImageConfigFromStore, type ExtendedChartDataset } from "@/lib/chart-store"
import {
  Plus,
  Trash2,
  Settings,
  Shuffle,
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
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from "@/components/ui/dialog"

interface DatasetSettingsProps {
  className?: string
}

type DatasetTab = 'general' | 'styling' | 'colors' | 'images' | 'advanced'

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
  const [stylingDropdownOpen, setStylingDropdownOpen] = useState(false)
  const [colorsDropdownOpen, setColorsDropdownOpen] = useState(false)
  const [imagesDropdownOpen, setImagesDropdownOpen] = useState(false)
  const [advancedDropdownOpen, setAdvancedDropdownOpen] = useState(false)
  const [selectedImageType, setSelectedImageType] = useState('icon')
  const [imageUploadUrl, setImageUploadUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false)
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
  const [newDatasetChartType, setNewDatasetChartType] = useState('bar')
  const [colorMode, setColorMode] = useState<'slice' | 'dataset'>('slice');

  const supportedChartTypes = [
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
      // Mixed mode: only allow bar, line, area, scatter for grouped datasets
      return supportedChartTypes.filter(type => 
        ['bar', 'line', 'area', 'scatter'].includes(type.value)
      );
    } else {
      // Uniform mode: show all chart types except pie, doughnut, radar, polarArea
      return supportedChartTypes.filter(type => 
        !['pie', 'doughnut', 'radar', 'polarArea'].includes(type.value)
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

  // Update modal structure when chart mode or datasets change
  useEffect(() => {
    if (showAddDatasetModal) {
      initializeModalWithExistingStructure();
    }
  }, [chartMode, filteredDatasets.length, showAddDatasetModal]);

  // Auto-switch to uniform mode for incompatible chart types in grouped mode
  useEffect(() => {
    if (chartMode === 'grouped' && ['pie', 'doughnut', 'radar', 'polarArea'].includes(chartType as any) && uniformityMode === 'mixed') {
      setUniformityMode('uniform');
    }
  }, [chartType, chartMode, uniformityMode, setUniformityMode]);

  useEffect(() => {
    chartData.datasets.forEach((dataset, datasetIndex) => {
      if (colorMode === 'dataset') {
        // Backup current slice colors
        if (Array.isArray(dataset.backgroundColor)) {
          handleUpdateDataset(datasetIndex, {
            lastSliceColors: [...dataset.backgroundColor],
          });
        }
        // Use the first color (or fallback) for all slices
        const baseColor = Array.isArray(dataset.backgroundColor)
          ? dataset.backgroundColor[0] || '#3b82f6'
          : dataset.backgroundColor || '#3b82f6';
        handleUpdateDataset(datasetIndex, {
          backgroundColor: Array(dataset.data.length).fill(baseColor),
          borderColor: Array(dataset.data.length).fill(darkenColor(baseColor, 20)),
        });
      } else {
        // Restore from backup if available
        if (Array.isArray(dataset.lastSliceColors) && dataset.lastSliceColors.length === dataset.data.length) {
          handleUpdateDataset(datasetIndex, {
            backgroundColor: [...dataset.lastSliceColors],
            borderColor: dataset.lastSliceColors.map(c => darkenColor(c, 20)),
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorMode]);

  const renderGeneralTab = () => (
    <div className="space-y-4">
      {/* Chart Mode Section */}
      <div className="mb-4">
        <div className="font-semibold text-sm mb-2">Chart Mode</div>
        <div className="flex items-center gap-6 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 shadow-sm">
          <label className={`flex items-center gap-2 cursor-pointer transition-colors text-sm ${chartMode === 'single' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}> 
            <input
              type="radio"
              className="accent-blue-600"
              checked={chartMode === 'single'}
              onChange={() => handleChartModeChange('single')}
            />
            <BarChart2 className="h-4 w-4" />
            Single
          </label>
          <label className={`flex items-center gap-2 cursor-pointer transition-colors text-sm ${chartMode === 'grouped' ? 'text-blue-700 font-bold' : 'text-gray-500'}`}> 
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
          <div className="font-semibold text-sm mb-2">Uniformity</div>
          <div className="flex items-center gap-6 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3 shadow-sm">
            <label className={`flex items-center gap-2 cursor-pointer transition-colors text-sm ${uniformityMode === 'uniform' ? 'text-purple-700 font-bold' : 'text-gray-500'}`}> 
              <input
                type="radio"
                className="accent-purple-600"
                checked={uniformityMode === 'uniform'}
                onChange={() => setUniformityMode('uniform')}
              />
              <BarChart2 className="h-4 w-4" />
              Uniform
            </label>
            <label className={`flex items-center gap-2 cursor-pointer transition-colors text-sm ${uniformityMode === 'mixed' ? 'text-purple-700 font-bold' : 'text-gray-500'} ${['pie', 'doughnut', 'radar', 'polarArea'].includes(chartType as any) ? 'opacity-50 cursor-not-allowed' : ''}`}> 
              <input
                type="radio"
                className="accent-purple-600"
                checked={uniformityMode === 'mixed'}
                onChange={() => setUniformityMode('mixed')}
                disabled={['pie', 'doughnut', 'radar', 'polarArea'].includes(chartType as any)}
              />
              <Layers className="h-4 w-4" />
              Mixed
            </label>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {['pie', 'doughnut', 'radar', 'polarArea'].includes(chartType as any) ? (
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
          <Label className="text-sm font-medium">Active Dataset</Label>
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
          <h3 className="text-sm font-semibold text-gray-900">Datasets Management</h3>
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
            <Label className="text-sm font-medium text-green-900">
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
                  className={`p-3 bg-white rounded-lg border transition-all ${
                    chartMode === 'single' && datasetIndex === activeDatasetIndex
                      ? 'border-blue-300 shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
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
                        className="h-7 text-xs font-medium border-0 p-0 bg-transparent focus-visible:ring-1"
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
                        onClick={() => removeDataset(datasetIndex)}
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
            {/* Dataset Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Chart Type</label>
                {chartMode === 'grouped' && uniformityMode === 'uniform' ? (
                  <div className="w-full h-9 px-3 rounded border border-gray-200 bg-gray-50 flex items-center text-sm">
                    <span className="text-gray-700">{chartType.charAt(0).toUpperCase() + chartType.slice(1)}</span>
                    <span className="text-xs text-gray-500 ml-2">(from Types & Toggles)</span>
                  </div>
                ) : (
                  <Select value={newDatasetChartType} onValueChange={setNewDatasetChartType}>
                    <SelectTrigger className="w-full h-9">
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
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Dataset Name <span className="text-red-500">*</span></label>
                <input
                  value={newDatasetName}
                  onChange={e => setNewDatasetName(e.target.value)}
                  className="w-full h-9 px-3 rounded border border-gray-200 focus:border-green-400 focus:ring-2 focus:ring-green-100 text-sm font-normal transition"
                  placeholder="Enter dataset name"
                />
                {chartMode === 'grouped' && filteredDatasets.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">Slice names will match existing datasets, but you can customize values and dataset name.</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 mb-1 block">Mode</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-medium px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {chartMode === 'single' ? 'Single' : 'Grouped'}
                  </span>
                </div>
              </div>
            </div>

            {/* Slices Management */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Slices ({newDatasetSlices.length})</label>
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

  const renderStylingTab = () => (
    <div className="space-y-4">
      {/* Border Styling */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
          <h3 className="text-sm font-semibold text-gray-900">Border Styling</h3>
          <button
            onClick={() => setStylingDropdownOpen(!stylingDropdownOpen)}
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
              className={`transform transition-transform ${stylingDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-3 space-y-3">
          {/* Border Width - Always Visible */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Border Width</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={chartData.datasets[0]?.borderWidth || ''}
                  onChange={(e) => {
                    const value = e.target.value ? Number(e.target.value) : 2
                    chartData.datasets.forEach((_, index) => {
                      handleUpdateDataset(index, 'borderWidth', value)
                    })
                  }}
                  className="w-16 h-8 text-xs"
                  placeholder="2"
                  min={0}
                  max={10}
                  step={1}
                />
                <span className="text-xs text-purple-700">px</span>
              </div>
            </div>
          </div>
          
          {stylingDropdownOpen && (
            <div className="space-y-3 pt-2 border-t border-purple-200">
              {/* Point Styling */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Point Radius</Label>
                  <Input
                    type="number"
                    value={chartData.datasets[0]?.pointRadius || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : 5
                      chartData.datasets.forEach((_, index) => {
                        handleUpdateDataset(index, 'pointRadius', value)
                      })
                    }}
                    className="h-8 text-xs"
                    placeholder="5"
                    min={0}
                    max={20}
                    step={1}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Hover Radius</Label>
                  <Input
                    type="number"
                    value={chartData.datasets[0]?.pointHoverRadius || ''}
                    onChange={(e) => {
                      const value = e.target.value ? Number(e.target.value) : 8
                      chartData.datasets.forEach((_, index) => {
                        handleUpdateDataset(index, 'pointHoverRadius', value)
                      })
                    }}
                    className="h-8 text-xs"
                    placeholder="8"
                    min={0}
                    max={30}
                    step={1}
                  />
                </div>
              </div>

              {/* Line Chart Specific */}
              {['line', 'area'].includes(chartType) && (
                <div className="space-y-3">
                  <Label className="text-xs font-medium text-purple-800">Line Properties</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Line Tension</Label>
                      <Input
                        type="number"
                        value={chartData.datasets[0]?.tension || ''}
                        onChange={(e) => {
                          const value = e.target.value ? Number(e.target.value) : 0.4
                          chartData.datasets.forEach((_, index) => {
                            handleUpdateDataset(index, 'tension', value)
                          })
                        }}
                        className="h-8 text-xs"
                        placeholder="0.4"
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Fill Area</Label>
                        <Switch
                          checked={!!chartData.datasets[0]?.fill}
                          onCheckedChange={(checked) => {
                            chartData.datasets.forEach((_, index) => {
                              handleUpdateDataset(index, 'fill', checked)
                            })
                          }}
                          className="data-[state=checked]:bg-purple-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Point Border Styling */}
              <div className="space-y-3">
                <Label className="text-xs font-medium text-purple-800">Point Borders</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Point Border Width</Label>
                    <Input
                      type="number"
                      value={chartData.datasets[0]?.pointBorderWidth || ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : 1
                        chartData.datasets.forEach((_, index) => {
                          handleUpdateDataset(index, 'pointBorderWidth', value)
                        })
                      }}
                      className="h-8 text-xs"
                      placeholder="1"
                      min={0}
                      max={5}
                      step={1}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium">Hover Border Width</Label>
                    <Input
                      type="number"
                      value={chartData.datasets[0]?.pointHoverBorderWidth || ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : 2
                        chartData.datasets.forEach((_, index) => {
                          handleUpdateDataset(index, 'pointHoverBorderWidth', value)
                        })
                      }}
                      className="h-8 text-xs"
                      placeholder="2"
                      min={0}
                      max={10}
                      step={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
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
      chartData.datasets.forEach((dataset, datasetIndex) => {
        const datasetColor = colors[datasetIndex % colors.length]
        if (colorMode === 'dataset') {
          // Use one color for the whole dataset
          handleUpdateDataset(datasetIndex, {
            backgroundColor: Array(dataset.data.length).fill(datasetColor),
            borderColor: Array(dataset.data.length).fill(darkenColor(datasetColor, 20)),
          })
        } else {
          // Use a different color for each slice
          const sliceColors = colors.slice(0, dataset.data.length)
          handleUpdateDataset(datasetIndex, {
            backgroundColor: sliceColors,
            borderColor: sliceColors.map(c => darkenColor(c, 20))
          })
        }
      })
    }

    return (
      <div className="space-y-4">
        {/* Color Mode Selection - moved above palette */}
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

        {/* Color Palettes */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
            <h3 className="text-sm font-semibold text-gray-900">Color Palettes</h3>
            <button
              onClick={() => setColorsDropdownOpen(!colorsDropdownOpen)}
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
                className={`transform transition-transform ${colorsDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9"/>
              </svg>
            </button>
          </div>
          
          <div className="bg-pink-50 rounded-lg p-3 space-y-3">
            {/* Quick Palette Actions */}
            <div className="flex items-center justify-between">
              {/* Removed Quick Actions label */}
              <div />
              <div className="flex gap-4">
                <Button 
                  size="sm" 
                  className="h-7 text-xs bg-pink-600 hover:bg-pink-700"
                  onClick={() => {
                    chartData.datasets.forEach((_, index) => {
                      handleRandomizeColors(index)
                    })
                  }}
                >
                  <Shuffle className="h-3 w-3 mr-1" />
                  Randomize Colors
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => applyColorPalette(colorPalettes[0].colors)}
                >
                  <Palette className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
            
            {colorsDropdownOpen && (
              <div className="space-y-3 pt-2 border-t border-pink-200">
                {/* Palette Grid */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-pink-800">Preset Palettes</Label>
                  <div className="grid gap-2">
                    {colorPalettes.map((palette, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-white rounded border hover:border-pink-300 transition-colors cursor-pointer"
                        onClick={() => applyColorPalette(palette.colors)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium min-w-16">{palette.name}</span>
                          <div className="flex gap-1">
                            {palette.colors.map((color, colorIndex) => (
                              <div
                                key={colorIndex}
                                className="w-4 h-4 rounded border border-white shadow-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Individual Dataset Colors */}
                {chartMode === 'grouped' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-pink-800">Dataset Colors</Label>
                    <div className="space-y-2">
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
                              className="sr-only"
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
            )}
          </div>
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
          <h3 className="text-sm font-semibold text-gray-900">Animations</h3>
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
                  
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Maintain Aspect Ratio</Label>
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
      const imageUrl = chartData.datasets[datasetIndex]?.pointImages?.[pointIndex] || null;
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
            <h3 className="text-sm font-semibold text-gray-900">Image Management</h3>
            <button
              onClick={() => setImagesDropdownOpen(!imagesDropdownOpen)}
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
                className={`transform transition-transform ${imagesDropdownOpen ? 'rotate-180' : ''}`}
              >
                <path d="M6 9L12 15L18 9"/>
              </svg>
            </button>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-3 space-y-3">
            {/* Global Image Settings - Always Visible */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-purple-800">Image Type</Label>
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

              {imageOptions.supportsArrow && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-purple-800">Arrow</Label>
                    <Switch
                      defaultChecked={false}
                      onCheckedChange={(checked) => handleGlobalImageConfigChange('arrow', checked)}
                      className="data-[state=checked]:bg-purple-600"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-purple-800">Offset</Label>
                    <Input
                      type="number"
                      defaultValue="40"
                      className="h-8 text-xs"
                      placeholder="40"
                      min={10}
                      max={100}
                      step={5}
                      onChange={(e) => handleGlobalImageConfigChange('offset', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {imageOptions.supportsFill && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-purple-800">Fill Bar</Label>
                    <Switch
                      defaultChecked={false}
                      onCheckedChange={(checked) => handleGlobalImageConfigChange('fillBar', checked)}
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
                      >
                        <Maximize2 className="h-3 w-3 mr-1" />
                        Fill
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'cover')}
                      >
                        <Crop className="h-3 w-3 mr-1" />
                        Cover
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'contain')}
                      >
                        <Grid className="h-3 w-3 mr-1" />
                        Contain
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-purple-800">Border Width</Label>
                  <Input
                    type="number"
                    defaultValue="3"
                    className="h-8 text-xs"
                    placeholder="3"
                    min={0}
                    max={10}
                    step={1}
                    onChange={(e) => handleGlobalImageConfigChange('borderWidth', parseInt(e.target.value))}
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs font-medium text-purple-800">Border Color</Label>
                  <Input
                    type="color"
                    defaultValue="#ffffff"
                    className="h-8 w-full"
                    onChange={(e) => handleGlobalImageConfigChange('borderColor', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs font-medium text-purple-800">Image URL</Label>
                  <Input
                    value={imageUploadUrl}
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
            </div>
            
            {imagesDropdownOpen && (
              <div className="space-y-4 pt-3 border-t border-purple-200">
                {/* Image Positioning */}
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-purple-800">Image Position</Label>
                  <div className="flex flex-wrap gap-2">
                    {imageOptions.positions.map((position) => {
                      const PositionIcon = getPositionIcon(position.value);
                      return (
                        <Button
                          key={position.value}
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          onClick={() => handleGlobalImageConfigChange('position', position.value)}
                        >
                          <PositionIcon className="h-3 w-3 mr-1" />
                          {position.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Image Sizing Options */}
                {imageOptions.supportsFill && (
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-purple-800">Fill Bar with Image</Label>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Enable Fill Bar</Label>
                      <Switch
                        defaultChecked={false}
                        onCheckedChange={(checked) => handleGlobalImageConfigChange('fillBar', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'fill')}
                      >
                        <Maximize2 className="h-3 w-3 mr-1" />
                        Fill
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'cover')}
                      >
                        <Crop className="h-3 w-3 mr-1" />
                        Cover
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                        onClick={() => handleGlobalImageConfigChange('imageFit', 'contain')}
                      >
                        <Grid className="h-3 w-3 mr-1" />
                        Contain
                      </Button>
                    </div>
                  </div>
                )}

                {/* Arrow Configuration */}
                {imageOptions.supportsArrow && (
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-purple-800">Arrow/Callout Settings</Label>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">Enable Arrow</Label>
                      <Switch
                        defaultChecked={false}
                        onCheckedChange={(checked) => handleGlobalImageConfigChange('arrow', checked)}
                        className="data-[state=checked]:bg-purple-600"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Arrow Color</Label>
                        <Input
                          type="color"
                          defaultValue="#666666"
                          className="h-8 w-full"
                          onChange={(e) => handleGlobalImageConfigChange('arrowColor', e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Callout Offset</Label>
                        <Input
                          type="number"
                          defaultValue="40"
                          className="h-8 text-xs"
                          placeholder="40"
                          min={10}
                          max={100}
                          step={5}
                          onChange={(e) => handleGlobalImageConfigChange('offset', parseInt(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Border Width</Label>
                        <Input
                          type="number"
                          defaultValue="3"
                          className="h-8 text-xs"
                          placeholder="3"
                          min={0}
                          max={10}
                          step={1}
                          onChange={(e) => handleGlobalImageConfigChange('borderWidth', parseInt(e.target.value))}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-purple-800">Border Color</Label>
                        <Input
                          type="color"
                          defaultValue="#ffffff"
                          className="h-8 w-full"
                          onChange={(e) => handleGlobalImageConfigChange('borderColor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Per-Point Image Configuration */}
                {chartMode === 'single' && activeDatasetIndex !== -1 && (
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-purple-800">Individual Point Images</Label>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {chartData.datasets[activeDatasetIndex].data.map((_, pointIndex) => (
                        <div key={pointIndex} className="p-2 bg-white rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-xs font-medium">Point {pointIndex + 1}</Label>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Upload className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-6 w-6 p-0"
                                onClick={() => updatePointImage(activeDatasetIndex, pointIndex, '', getDefaultImageConfigFromStore(chartType))}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <Select
                              value={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[pointIndex]?.position || 'center'}
                              onValueChange={(value) => handleImageConfigChange(activeDatasetIndex, pointIndex, 'position', value)}
                            >
                              <SelectTrigger className="h-6 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {imageOptions.positions.map((position) => (
                                  <SelectItem key={position.value} value={position.value}>
                                    {position.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Input
                              type="number"
                              value={chartData.datasets[activeDatasetIndex]?.pointImageConfig?.[pointIndex]?.size || getDefaultImageSize(chartType)}
                              className="h-6 text-xs"
                              placeholder="Size"
                              min={5}
                              max={100}
                              onChange={(e) => handleImageConfigChange(activeDatasetIndex, pointIndex, 'size', parseInt(e.target.value))}
                            />
                          </div>
                          
                          {chartData.datasets[activeDatasetIndex]?.pointImages?.[pointIndex] && (
                            <div className="w-full h-8 bg-gray-100 rounded flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-xs text-gray-500 ml-1">Image Set</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = (tab: DatasetTab) => {
    switch (tab) {
      case 'general':
        return renderGeneralTab()
      case 'styling':
        return renderStylingTab()
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
          { id: 'styling' as const, label: 'Styling' },
          { id: 'colors' as const, label: 'Colors' },
          { id: 'images' as const, label: 'Images' },
          { id: 'advanced' as const, label: 'Advanced' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
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
    </div>
  )
} 