"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { useChartStore, getDefaultImageType, getDefaultImageSize, getImageOptionsForChartType, getDefaultImageConfig, type ExtendedChartDataset } from "@/lib/chart-store"
import {
  Plus,
  Trash2,
  Settings,
  ImageIcon,
  Upload,
  Target,
  ArrowUpRight,
  MousePointer2,
  Edit,
  Palette,
  Circle,
  Square,
  Maximize2,
  Crop,
  Grid,
} from "lucide-react"
import { EditSlicesModal } from "./EditSlicesModal"

interface SliceSettingsProps {
  className?: string
}

type SliceTab = 'data' | 'colors' | 'images'

export function SliceSettings({ className }: SliceSettingsProps) {
  const { 
    chartData, 
    chartType, 
    updateDataset,
    updatePointImage,
    updateDataPoint,
    updateLabels,
    chartMode,
    activeDatasetIndex,
  } = useChartStore()
  
  const [activeTab, setActiveTab] = useState<SliceTab>('data')
  const [dataDropdownOpen, setDataDropdownOpen] = useState(false)
  const [colorsDropdownOpen, setColorsDropdownOpen] = useState(false)
  const [imagesDropdownOpen, setImagesDropdownOpen] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedSliceIndex, setSelectedSliceIndex] = useState<number | null>(null)
  const [imageUploadUrl, setImageUploadUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showAddPointModal, setShowAddPointModal] = useState(false)
  const [newPointName, setNewPointName] = useState("")
  const [newPointValue, setNewPointValue] = useState("")
  const [newPointColor, setNewPointColor] = useState("#1E90FF") // DodgerBlue
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(0)
  const [showEditSlicesModal, setShowEditSlicesModal] = useState(false)

  // Filter datasets based on current mode
  const filteredDatasets = chartData.datasets.filter(dataset => {
    // If dataset has a mode property, filter by it
    if (dataset.mode) {
      return dataset.mode === chartMode
    }
    // For backward compatibility, show all datasets if no mode is set
    return true
  })

  // Get the current dataset to work with based on selected dataset
  const currentDataset = filteredDatasets[selectedDatasetIndex] || null
  const currentSliceLabels = currentDataset?.sliceLabels || chartData.labels || []

  // Update selectedDatasetIndex when chartMode changes
  useEffect(() => {
    setSelectedDatasetIndex(0)
  }, [chartMode])

  const handleDatasetChange = (index: number) => {
    setSelectedDatasetIndex(index)
  }

  const handleDataPointUpdate = (pointIndex: number, value: string, field: 'x' | 'y' | 'r' = 'y') => {
    if (!currentDataset) return
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const numValue = parseFloat(value)
    if (isNaN(numValue)) {
      updateDataPoint(datasetIndex, pointIndex, field, null)
      return
    }
    if (chartType === 'scatter' || chartType === 'bubble') {
      updateDataPoint(datasetIndex, pointIndex, field, numValue)
    } else {
      updateDataPoint(datasetIndex, pointIndex, 'y', numValue)
    }
  }

  const handleLabelChange = (pointIndex: number, value: string) => {
    if (!currentDataset) return
    
    // Prevent changing slice names in Grouped Mode to maintain consistency
    if (chartMode === 'grouped') {
      console.warn('Slice names cannot be changed in Grouped Mode to maintain dataset consistency')
      return
    }
    
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const newLabels = [...(currentDataset.sliceLabels || currentDataset.data.map((_, i) => `Slice ${i + 1}`))]
    newLabels[pointIndex] = value
    updateDataset(datasetIndex, { sliceLabels: newLabels })
  }

  const handleColorChange = (pointIndex: number, color: string) => {
    if (!currentDataset) return
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const newBackgroundColors = Array.isArray(currentDataset.backgroundColor) 
      ? [...currentDataset.backgroundColor]
      : Array(currentDataset.data.length).fill(currentDataset.backgroundColor)
    
    newBackgroundColors[pointIndex] = color
    updateDataset(datasetIndex, { backgroundColor: newBackgroundColors })
  }

  const handleImageUpload = (pointIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentDataset) return
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string
        const config = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
        updatePointImage(datasetIndex, pointIndex, imageUrl, config)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (pointIndex: number, imageUrl: string) => {
    if (!currentDataset) return
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const config = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
    updatePointImage(datasetIndex, pointIndex, imageUrl, config)
  }

  const handleImageConfigChange = (pointIndex: number, key: string, value: any) => {
    if (!currentDataset) return
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const currentConfig = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
    const imageUrl = currentDataset.pointImages?.[pointIndex] || null
    
    // If arrowLine is being unchecked, also uncheck arrowHead
    if (key === 'arrowLine' && value === false) {
      updatePointImage(datasetIndex, pointIndex, imageUrl, { ...currentConfig, [key]: value, arrowHead: false })
    } else {
      updatePointImage(datasetIndex, pointIndex, imageUrl, { ...currentConfig, [key]: value })
    }
  }

  const openImageModal = (sliceIndex: number) => {
    setSelectedSliceIndex(sliceIndex)
    setShowImageModal(true)
  }

  const addSlice = () => {
    if (!currentDataset) return
    
    // Prevent adding slices in Grouped Mode to maintain consistency (only if there are multiple datasets)
    if (chartMode === 'grouped' && filteredDatasets.length > 1) {
      console.warn('Adding slices is not allowed in Grouped Mode to maintain dataset consistency')
      return
    }
    
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const newData = [...currentDataset.data, 0]
    const newLabels = [...(currentDataset.sliceLabels || []), `Slice ${newData.length}`]
    
    updateDataset(datasetIndex, { 
      data: newData,
      pointImages: [...(currentDataset.pointImages || []), null],
      pointImageConfig: [...(currentDataset.pointImageConfig || []), {
        type: getDefaultImageType(chartType),
        size: getDefaultImageSize(chartType),
        position: "center",
        arrow: false,
      }]
    })
    updateLabels(newLabels as string[])
  }

  const removeSlice = (sliceIndex: number) => {
    if (!currentDataset) return
    
    // Prevent removing slices in Grouped Mode to maintain consistency (only if there are multiple datasets)
    if (chartMode === 'grouped' && filteredDatasets.length > 1) {
      console.warn('Removing slices is not allowed in Grouped Mode to maintain dataset consistency')
      return
    }
    
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const newData = currentDataset.data.filter((_, i) => i !== sliceIndex)
    const newLabels = (currentDataset.sliceLabels || []).filter((_, i) => i !== sliceIndex)
    
    updateDataset(datasetIndex, { 
      data: newData,
      pointImages: (currentDataset.pointImages || []).filter((_, i) => i !== sliceIndex),
      pointImageConfig: (currentDataset.pointImageConfig || []).filter((_, i) => i !== sliceIndex)
    })
    updateLabels(newLabels as string[])
  }

  const handleAddPoint = () => {
    if (!currentDataset) return
    
    // Prevent adding points in Grouped Mode to maintain consistency (only if there are multiple datasets)
    if (chartMode === 'grouped' && filteredDatasets.length > 1) {
      console.warn('Adding points is not allowed in Grouped Mode to maintain dataset consistency')
      return
    }
    
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const newData = [...currentDataset.data, Number(newPointValue)]
    const newLabels = [...(currentDataset.sliceLabels || []), newPointName]
    const newColors = Array.isArray(currentDataset.backgroundColor)
      ? [...currentDataset.backgroundColor, newPointColor]
      : Array(newData.length).fill(newPointColor)
    updateDataset(datasetIndex, {
      data: newData,
      backgroundColor: newColors,
      pointImages: [...(currentDataset.pointImages || []), null],
      pointImageConfig: [...(currentDataset.pointImageConfig || []), getDefaultImageConfig(chartType)]
    })
    updateLabels(newLabels as string[])
    setShowAddPointModal(false)
    setNewPointName("")
    setNewPointValue("")
    setNewPointColor("#1E90FF")
  }

  if (!currentDataset) {
    return (
      <div className="flex items-center justify-center p-8 text-center">
        <div className="space-y-2">
          <p className="text-[0.80rem] font-medium text-gray-900">No Dataset Available</p>
          <p className="text-xs text-gray-500">Please add a dataset first to manage slices.</p>
        </div>
      </div>
    )
  }

  const renderDataTab = () => (
    <div className="space-y-4">
      {/* Data Management */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
          <h3 className="text-[0.80rem] font-semibold text-gray-900">Data & Labels</h3>
          <button
            onClick={() => setDataDropdownOpen(!dataDropdownOpen)}
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
              className={`transform transition-transform ${dataDropdownOpen ? 'rotate-180' : ''}`}
            >
              <path d="M6 9L12 15L18 9"/>
            </svg>
          </button>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[0.80rem] font-medium text-blue-900">
              {currentDataset.data.length} Data Point{currentDataset.data.length !== 1 ? 's' : ''}
            </Label>
            <Button 
              size="sm" 
              onClick={() => setShowAddPointModal(true)} 
              disabled={chartMode === 'grouped' && filteredDatasets.length > 1}
              className="h-7 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Point
            </Button>
          </div>
          
          {chartMode === 'grouped' && (
            <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-800">
                <strong>Grouped Mode:</strong> Editing Slice names, Adding/removing points is disabled to maintain dataset consistency.
              </p>
            </div>
          )}
          
          {chartMode === 'grouped' && filteredDatasets.length === 1 && (
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Grouped Mode:</strong> This is the first dataset. You can customize points and structure.
              </p>
            </div>
          )}
          
          {dataDropdownOpen && (
            <div className="space-y-2 pt-2 border-t border-blue-200 max-h-96 overflow-y-auto">
              {currentDataset.data.map((dataPoint, pointIndex) => (
                <div
                  key={pointIndex}
                  className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all mb-2"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-400 font-semibold">#{pointIndex + 1}</span>
                    <button
                      className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => removeSlice(pointIndex)}
                      disabled={chartMode === 'grouped' && filteredDatasets.length > 1}
                      title={chartMode === 'grouped' && filteredDatasets.length > 1 ? 'Cannot remove points in Grouped Mode' : 'Remove point'}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-2/3 min-w-0">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Name</label>
                      <input
                        value={currentSliceLabels[pointIndex] || ''}
                        onChange={(e) => handleLabelChange(pointIndex, e.target.value)}
                        disabled={chartMode === 'grouped'}
                        className="w-full h-10 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-[0.80rem] font-normal transition disabled:bg-gray-100 disabled:text-gray-500"
                        placeholder={`Name ${pointIndex + 1}`}
                      />
                    </div>
                    <div className="w-1/3 min-w-0">
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Value</label>
                      {chartType === 'scatter' || chartType === 'bubble' ? (
                        <div className="flex gap-1">
                          <input
                            type="number"
                            value={typeof dataPoint === 'object' && dataPoint?.x !== undefined ? dataPoint.x : ''}
                            onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value, 'x')}
                            className="w-1/2 h-10 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-[0.80rem] font-normal transition"
                            placeholder="X"
                          />
                          <input
                            type="number"
                            value={typeof dataPoint === 'object' && dataPoint?.y !== undefined ? dataPoint.y : typeof dataPoint === 'number' ? dataPoint : ''}
                            onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value, 'y')}
                            className="w-1/2 h-10 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-[0.80rem] font-normal transition"
                            placeholder="Y"
                          />
                        </div>
                      ) : (
                        <input
                          type="number"
                          value={typeof dataPoint === 'number' ? dataPoint : ''}
                          onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value)}
                          className="w-full h-10 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-[0.80rem] font-normal transition"
                          placeholder="Value"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderColorsTab = () => (
    <div className="space-y-4">
      {/* Colors Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
          <h3 className="text-[0.80rem] font-semibold text-gray-900">Individual Colors</h3>
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
          <div className="flex items-center justify-between">
            <Label className="text-[0.80rem] font-medium">Slice Colors</Label>
            <Button size="sm" className="h-7 text-xs bg-pink-600 hover:bg-pink-700">
              <Palette className="h-3 w-3 mr-1" />
              Randomize
            </Button>
          </div>
          
          {colorsDropdownOpen && (
            <div className="space-y-2 pt-2 border-t border-pink-200 max-h-96 overflow-y-auto">
              {currentDataset.data.map((_, pointIndex) => {
                const currentColor = Array.isArray(currentDataset.backgroundColor) 
                  ? currentDataset.backgroundColor[pointIndex] 
                  : currentDataset.backgroundColor
                
                return (
                  <div key={pointIndex} className="flex items-center justify-between p-2 bg-white rounded border">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-500">#{pointIndex + 1}</span>
                      <span className="text-xs">{currentSliceLabels[pointIndex] || `Point ${pointIndex + 1}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: currentColor || '#3b82f6' }}
                        onClick={() => document.getElementById(`slice-color-${pointIndex}`)?.click()}
                      />
                      <input
                        id={`slice-color-${pointIndex}`}
                        type="color"
                        value={currentColor || '#3b82f6'}
                        onChange={(e) => handleColorChange(pointIndex, e.target.value)}
                        className="sr-only"
                      />
                      <Input
                        value={currentColor || '#3b82f6'}
                        onChange={(e) => handleColorChange(pointIndex, e.target.value)}
                        className="w-20 h-6 text-xs font-mono uppercase"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderImagesTab = () => {
    const imageOptions = getImageOptionsForChartType(chartType)
    
    const getPositionIcon = (position: string) => {
      switch (position) {
        case 'above': return Target;
        case 'below': return Target;
        case 'left': return Target;
        case 'right': return Target;
        case 'center': return Target;
        case 'callout': return ArrowUpRight;
        default: return Target;
      }
    }

    return (
      <div className="space-y-4">
        {/* Images Section */}
        <div className="space-y-3">          
          <div className="bg-green-50 rounded-lg p-3 space-y-3">            
            <div className="flex items-center justify-between">
              <Label className="text-[0.80rem] font-medium">Individual Point Images</Label>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => {
                  currentDataset.data.forEach((_: any, pointIndex: number) => {
                    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset);
                    updatePointImage(datasetIndex, pointIndex, '', getDefaultImageConfig(chartType));
                  });
                }}
              >
                Clear All
              </Button>
            </div>
            
            <div className="space-y-3 pt-2 border-t border-green-200 max-h-96">
                {currentDataset.data.map((_, pointIndex) => {
                  const hasImage = currentDataset.pointImages?.[pointIndex]
                  const imageConfig = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
                  
                  return (
                    <div key={pointIndex} className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-gray-500">#{pointIndex + 1}</span>
                          <span className="text-xs font-medium">{currentSliceLabels[pointIndex] || `Point ${pointIndex + 1}`}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {hasImage ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <ImageIcon className="h-3 w-3" />
                              <span className="text-xs">Has Image</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">No Image</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Image Upload */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs flex-1"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => handleImageUpload(pointIndex, e as any);
                              input.click();
                            }}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload Image
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset);
                              updatePointImage(datasetIndex, pointIndex, '', getDefaultImageConfig(chartType));
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex gap-2">
                          <Input
                            placeholder="Image URL"
                            className="h-7 text-xs flex-1"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const value = (e.target as HTMLInputElement).value;
                                if (value.trim()) {
                                  handleImageUrlChange(pointIndex, value.trim());
                                  (e.target as HTMLInputElement).value = '';
                                }
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Image Configuration */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-green-800">Configuration</Label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Type</Label>
                            <Select
                              value={imageConfig.type || 'circle'}
                              onValueChange={(value) => handleImageConfigChange(pointIndex, 'type', value)}
                            >
                              <SelectTrigger className="h-7 text-xs">
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
                            <Label className="text-xs font-medium">Size</Label>
                            <Input
                              type="number"
                              value={imageConfig.size || getDefaultImageSize(chartType)}
                              className="h-7 text-xs"
                              placeholder="Size"
                              min={5}
                              max={100}
                              onChange={(e) => handleImageConfigChange(pointIndex, 'size', parseInt(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs font-medium">Position</Label>
                          <Select
                            value={imageConfig.position || 'center'}
                            onValueChange={(value) => handleImageConfigChange(pointIndex, 'position', value)}
                          >
                            <SelectTrigger className="h-7 text-xs">
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

                        {/* Callout Arrow Controls */}
                        {imageOptions.supportsArrow && imageConfig.position === 'callout' && (
                          <div className="space-y-2 p-2 bg-blue-50 rounded border border-blue-200 mt-2">
                            <Label className="text-xs font-medium text-green-800">Arrow/Callout Settings</Label>
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={imageConfig.arrowLine !== false}
                                onCheckedChange={(checked) => handleImageConfigChange(pointIndex, 'arrowLine', checked)}
                              />
                              <Label className="text-xs font-medium">Arrow Line</Label>
                            </div>
                            <div className="flex items-center space-x-3">
                              <Switch
                                checked={imageConfig.arrowHead !== false}
                                onCheckedChange={(checked) => handleImageConfigChange(pointIndex, 'arrowHead', checked)}
                                disabled={imageConfig.arrowLine === false}
                              />
                              <Label className="text-xs font-medium">Arrow Head</Label>
                            </div>
                            {(imageConfig.arrowLine !== false || imageConfig.arrowHead !== false) && (
                              <div>
                                <Label className="text-xs font-medium">Arrow End Distance from Image</Label>
                                <div className="flex gap-2 mt-1">
                                  <Input
                                    type="number"
                                    value={imageConfig.arrowEndGap ?? 8}
                                    className="h-7 text-xs flex-1"
                                    placeholder="8"
                                    min={0}
                                    max={30}
                                    step={1}
                                    onChange={(e) => handleImageConfigChange(pointIndex, 'arrowEndGap', parseInt(e.target.value))}
                                  />
                                  <span className="text-xs text-gray-500 self-center">px</span>
                                </div>
                              </div>
                            )}
                            {imageConfig.arrowLine !== false && (
                              <div className="space-y-1">
                                <Label className="text-xs font-medium">Arrow Color</Label>
                                <Input
                                  type="color"
                                  value={imageConfig.arrowColor || '#666666'}
                                  className="h-7 w-full"
                                  onChange={(e) => handleImageConfigChange(pointIndex, 'arrowColor', e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {imageOptions.supportsFill && (
                          <>
                            <div className="flex items-center justify-between">
                              <Label className="text-xs font-medium">
                                {['pie', 'doughnut', 'polarArea'].includes(chartType) ? 'Fill Slice' : 'Fill Bar'}
                              </Label>
                              <Switch
                                checked={['pie', 'doughnut', 'polarArea'].includes(chartType) 
                                  ? (imageConfig.fillSlice || false) 
                                  : (imageConfig.fillBar || false)}
                                onCheckedChange={(checked) => {
                                  if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
                                    handleImageConfigChange(pointIndex, 'fillSlice', checked)
                                  } else {
                                    handleImageConfigChange(pointIndex, 'fillBar', checked)
                                  }
                                }}
                                className="data-[state=checked]:bg-green-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs font-medium">Image Fit</Label>
                              <div className="grid grid-cols-3 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-xs ${imageConfig.imageFit === 'fill' ? 'bg-green-100 border-green-400' : ''}`}
                                  onClick={() => handleImageConfigChange(pointIndex, 'imageFit', 'fill')}
                                  disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                                    imageConfig.fillSlice : 
                                    imageConfig.fillBar)}
                                >
                                  <Maximize2 className="h-3 w-3 mr-1" />
                                  Fill
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-xs ${imageConfig.imageFit === 'cover' ? 'bg-green-100 border-green-400' : ''}`}
                                  onClick={() => handleImageConfigChange(pointIndex, 'imageFit', 'cover')}
                                  disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                                    imageConfig.fillSlice : 
                                    imageConfig.fillBar)}
                                >
                                  <Crop className="h-3 w-3 mr-1" />
                                  Cover
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-xs ${imageConfig.imageFit === 'contain' ? 'bg-green-100 border-green-400' : ''}`}
                                  onClick={() => handleImageConfigChange(pointIndex, 'imageFit', 'contain')}
                                  disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                                    imageConfig.fillSlice : 
                                    imageConfig.fillBar)}
                                >
                                  <Grid className="h-3 w-3 mr-1" />
                                  Contain
                                </Button>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Border Width</Label>
                            <Input
                              type="number"
                              value={imageConfig.borderWidth || 3}
                              className="h-7 text-xs"
                              placeholder="3"
                              min={0}
                              max={10}
                              onChange={(e) => handleImageConfigChange(pointIndex, 'borderWidth', parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs font-medium">Border Color</Label>
                            <Input
                              type="color"
                              value={imageConfig.borderColor || '#ffffff'}
                              className="h-7 w-full"
                              onChange={(e) => handleImageConfigChange(pointIndex, 'borderColor', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
          </div>
        </div>
      </div>
    )
  }

  const renderTabContent = (tab: SliceTab) => {
    switch (tab) {
      case 'data':
        return renderDataTab()
      case 'colors':
        return renderColorsTab()
      case 'images':
        return renderImagesTab()
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Dataset Selection */}
      <div className="space-y-2">
        <Label className="text-[0.80rem] font-medium">Select Dataset to Edit</Label>
        <Select value={String(selectedDatasetIndex)} onValueChange={(value) => handleDatasetChange(Number(value))}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filteredDatasets.map((dataset, index) => (
              <SelectItem key={index} value={String(index)}>
                {dataset.label || `Dataset ${index + 1}`} ({dataset.data.length} points)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentDataset && (
          <div className="text-xs text-gray-500">
            Currently editing: <span className="font-medium">{currentDataset.label || `Dataset ${selectedDatasetIndex + 1}`}</span>
          </div>
        )}
        {chartMode === 'grouped' && (
          <div className="mt-2 flex justify-center">
            <Button size="sm" variant="outline" onClick={() => setShowEditSlicesModal(true)}>
              Edit All Slices (Grouped Mode)
            </Button>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 overflow-x-auto whitespace-nowrap max-w-full px-2">
        {[
          { id: 'data' as const, label: 'Data' },
          { id: 'colors' as const, label: 'Colors' },
          { id: 'images' as const, label: 'Images' },
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

      {/* Image Configuration Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Point Image</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-[0.80rem] text-gray-600">
              Advanced image configuration options for point #{selectedSliceIndex !== null ? selectedSliceIndex + 1 : 0} will be available here.
            </p>
          </div>
          <DialogClose asChild>
            <Button className="mt-4">Close</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Add Point Modal */}
      <Dialog open={showAddPointModal} onOpenChange={setShowAddPointModal}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Add New Point</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Name <span className="text-red-500">*</span></label>
              <input
                value={newPointName}
                onChange={e => setNewPointName(e.target.value)}
                className="w-full h-9 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-[0.80rem] font-normal transition"
                placeholder="Name"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Value <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={newPointValue}
                onChange={e => setNewPointValue(e.target.value)}
                className="w-full h-9 px-3 rounded border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 text-[0.80rem] font-normal transition"
                placeholder="Value"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">Color</label>
              <input
                type="color"
                value={newPointColor}
                onChange={e => setNewPointColor(e.target.value)}
                className="w-12 h-8 p-0 border-0 bg-transparent"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <DialogClose asChild>
              <Button variant="outline" size="sm">Cancel</Button>
            </DialogClose>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!newPointName.trim() || !newPointValue.trim()}
              onClick={handleAddPoint}
            >
              Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <EditSlicesModal
        open={showEditSlicesModal}
        onOpenChange={setShowEditSlicesModal}
        chartData={chartData}
        onSave={(newSliceLabels, newValues) => {
          chartData.datasets.forEach((ds, i) => {
            // Adjust pointImageConfig length
            let pic = ds.pointImageConfig || [];
            const diff = newSliceLabels.length - pic.length;
            if (diff > 0) {
              pic = [...pic, ...Array(diff).fill(getDefaultImageConfig(chartType))];
            } else if (diff < 0) {
              pic = pic.slice(0, newSliceLabels.length);
            }
            // Adjust backgroundColor length
            let bg = Array.isArray(ds.backgroundColor) ? [...ds.backgroundColor] : Array(ds.data.length).fill(ds.backgroundColor || "#1E90FF");
            const bgDiff = newSliceLabels.length - bg.length;
            if (bgDiff > 0) {
              bg = [...bg, ...Array(bgDiff).fill("#1E90FF")];
            } else if (bgDiff < 0) {
              bg = bg.slice(0, newSliceLabels.length);
            }
            updateDataset(i, {
              sliceLabels: newSliceLabels,
              data: newValues.map(row => row[i] ?? 0),
              pointImageConfig: pic,
              backgroundColor: bg,
            });
          });
          updateLabels(newSliceLabels);
        }}
      />
    </div>
  )
} 