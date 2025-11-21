"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { useChartStore, getDefaultImageType, getDefaultImageSize, getImageOptionsForChartType, getDefaultImageConfig, type ExtendedChartDataset } from "@/lib/chart-store"
import { toast } from "sonner"
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
    setActiveDatasetIndex,
  } = useChartStore()
  
  const [activeTab, setActiveTab] = useState<SliceTab>('data')
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
  const [showFullEditModal, setShowFullEditModal] = useState(false)
  const [globalColor, setGlobalColor] = useState<string>("#3b82f6")
  const [imageSelectedIndex, setImageSelectedIndex] = useState<number>(0)
  const [fullEditRows, setFullEditRows] = useState<{ label: string; value: number; color: string; imageUrl: string | null }[]>([])

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

  // Keep selectedDatasetIndex in sync with global activeDatasetIndex (especially after remount)
  useEffect(() => {
    setSelectedDatasetIndex(activeDatasetIndex ?? 0)
  }, [activeDatasetIndex, chartMode])

  // Sync global color picker with persisted dataset color on mount/changes (Single mode only)
  useEffect(() => {
    if (!currentDataset) return
    let derived = '#3b82f6'
    const bg = (currentDataset as any).backgroundColor
    // Prefer dataset.color if single color mode
    if ((currentDataset as any).datasetColorMode === 'single') {
      if (typeof (currentDataset as any).color === 'string' && (currentDataset as any).color) {
        derived = (currentDataset as any).color
      } else if (Array.isArray(bg) && typeof bg[0] === 'string' && bg[0]) {
        derived = bg[0] as string
      } else if (typeof bg === 'string' && bg) {
        derived = bg as string
      }
    } else {
      // Fall back to first slice color if available
      if (Array.isArray(bg) && typeof bg[0] === 'string' && bg[0]) {
        derived = bg[0] as string
      }
    }
    setGlobalColor(derived)
  }, [selectedDatasetIndex, currentDataset, chartMode, chartData])

  const handleDatasetChange = (index: number) => {
    setSelectedDatasetIndex(index)
    // Reflect selection globally so other panels show same dataset
    setActiveDatasetIndex(index)
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
    // Keep global labels in sync for Single mode so UI and chart persist correctly
    if (chartMode === 'single') {
      updateLabels(newLabels)
    }
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

  const handleImageUpload = async (pointIndex: number, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentDataset) return
    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
    if (datasetIndex === -1) return
    
    const file = event.target.files?.[0]
    if (file) {
      // Import compression utility
      const { 
        compressImage, 
        validateImageFile,
        getAvailableLocalStorageSpace,
        shouldCleanupImages,
        getImagesToCleanup,
        wouldExceedQuota
      } = await import('@/lib/image-utils')
      
      // Validate file
      if (!validateImageFile(file, 10)) {
        toast.error('Invalid image file. Please select an image file under 10MB.')
        return
      }

      try {
        // Check available space and cleanup if needed
        const availableSpace = getAvailableLocalStorageSpace()
        if (availableSpace < 200 * 1024) { // Less than 200KB available
          const cleanupInfo = shouldCleanupImages(chartData, 1 * 1024 * 1024)
          
          if (cleanupInfo.needed) {
            // Clean up old images from all datasets
            chartData.datasets.forEach((dataset: any, dsIdx: number) => {
              const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
              if (indicesToRemove.length > 0) {
                const newPointImages = [...(dataset.pointImages || [])]
                indicesToRemove.forEach((idx: number) => {
                  newPointImages[idx] = null
                })
                updateDataset(dsIdx, { pointImages: newPointImages })
              }
            })
            toast.info('Cleaned up old images to free space.')
          }
        }

        // Compress image with better defaults (600x600, 0.7 quality)
        // Progressive compression will adjust if quota is low
        const compressedImageUrl = await compressImage(file, 600, 600, 0.7, true)
        
        // Check if compressed image would exceed quota
        if (wouldExceedQuota(compressedImageUrl)) {
          // Try more aggressive cleanup
          const cleanupInfo = shouldCleanupImages(chartData, 2 * 1024 * 1024)
          
          if (cleanupInfo.needed) {
            chartData.datasets.forEach((dataset: any, dsIdx: number) => {
              const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
              if (indicesToRemove.length > 0) {
                const newPointImages = [...(dataset.pointImages || [])]
                indicesToRemove.forEach((idx: number) => {
                  newPointImages[idx] = null
                })
                updateDataset(dsIdx, { pointImages: newPointImages })
              }
            })
          }
          
          // Check again after cleanup
          if (wouldExceedQuota(compressedImageUrl)) {
            toast.error('Storage quota exceeded. Please remove some images or clear browser storage.')
            return
          }
        }

        const config = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
        
        // Try to update, catch quota errors
        try {
          updatePointImage(datasetIndex, pointIndex, compressedImageUrl, config)
        } catch (error: any) {
          if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
            // Last resort cleanup - remove all but most recent image from each dataset
            chartData.datasets.forEach((dataset: any, dsIdx: number) => {
              const indicesToRemove = getImagesToCleanup(dataset, 1)
              if (indicesToRemove.length > 0) {
                const newPointImages = [...(dataset.pointImages || [])]
                indicesToRemove.forEach((idx: number) => {
                  newPointImages[idx] = null
                })
                updateDataset(dsIdx, { pointImages: newPointImages })
              }
            })
            
            try {
              updatePointImage(datasetIndex, pointIndex, compressedImageUrl, config)
            } catch (e) {
              toast.error('Storage quota exceeded. Please remove some images or clear browser storage.')
              console.error('Storage quota error:', e)
            }
          } else {
            throw error
          }
        }
      } catch (error: any) {
        console.error('Error compressing image:', error)
        if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
          toast.error('Storage quota exceeded. Please remove some images or clear browser storage.')
        } else {
          toast.error('Failed to process image. Please try a smaller file.')
        }
      }
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
    const imageUrl = (currentDataset.pointImages?.[pointIndex] as string | undefined) ?? ''
    
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
          
          <div className="space-y-1.5 pt-2 border-t border-blue-200 max-h-96 overflow-y-auto">
            {currentDataset.data.map((dataPoint, pointIndex) => (
              <div
                key={pointIndex}
                className="p-2 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 font-medium min-w-[24px]">#{pointIndex + 1}</span>
                  <div className="flex-1 min-w-0">
                    <input
                      value={String(currentSliceLabels[pointIndex] ?? '')}
                      onChange={(e) => handleLabelChange(pointIndex, e.target.value)}
                      disabled={chartMode === 'grouped'}
                      className="w-full h-7 px-2 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder={`Name ${pointIndex + 1}`}
                    />
                  </div>
                  <div className="w-16 min-w-0">
                    {chartType === 'scatter' || chartType === 'bubble' ? (
                      <div className="flex gap-0.5">
                        <input
                          type="number"
                          value={typeof dataPoint === 'object' && (dataPoint as any)?.x !== undefined ? (dataPoint as any).x : ''}
                          onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value, 'x')}
                          className="w-1/2 h-7 px-1 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition"
                          placeholder="X"
                        />
                        <input
                          type="number"
                          value={typeof dataPoint === 'object' && (dataPoint as any)?.y !== undefined ? (dataPoint as any).y : typeof dataPoint === 'number' ? dataPoint : ''}
                          onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value, 'y')}
                          className="w-1/2 h-7 px-1 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition"
                          placeholder="Y"
                        />
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={typeof dataPoint === 'number' ? dataPoint : ''}
                        onChange={(e) => handleDataPointUpdate(pointIndex, e.target.value)}
                        className="w-full h-7 px-1 rounded border border-gray-200 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 text-xs font-normal transition"
                        placeholder="Value"
                      />
                    )}
                  </div>
                  <button
                    className="p-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    onClick={() => removeSlice(pointIndex)}
                    disabled={chartMode === 'grouped' && filteredDatasets.length > 1}
                    title={chartMode === 'grouped' && filteredDatasets.length > 1 ? 'Cannot remove points in Grouped Mode' : 'Remove point'}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderColorsTab = () => (
    <div className="space-y-4">
      {/* Global Color (Single mode only) */}
      {chartMode === 'single' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 pb-1 border-b">
            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
            <h3 className="text-[0.80rem] font-semibold text-gray-900">Global Color</h3>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={globalColor}
                onChange={(e) => setGlobalColor(e.target.value)}
                className="w-10 h-8 p-0 border-0 bg-transparent cursor-pointer"
              />
              <Input value={globalColor} onChange={(e) => setGlobalColor(e.target.value)} className="w-24 h-8 text-xs font-mono uppercase" />
            </div>
            <Button
              size="sm"
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700"
              onClick={() => {
                if (!currentDataset) return
                const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
                if (datasetIndex === -1) return
                // Single call ensures color mode and color are applied atomically
                updateDataset(datasetIndex, { datasetColorMode: 'single', color: globalColor })
              }}
            >
              Apply to All
            </Button>
          </div>
        </div>
      )}

      {/* Colors Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 pb-1 border-b">
          <div className="w-2 h-2 bg-pink-600 rounded-full"></div>
          <h3 className="text-[0.80rem] font-semibold text-gray-900">Individual Colors</h3>
        </div>
        
        <div className="bg-pink-50 rounded-lg p-3">
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {currentDataset.data.map((_, pointIndex) => {
              const currentColor = Array.isArray(currentDataset.backgroundColor) 
                ? currentDataset.backgroundColor[pointIndex] 
                : currentDataset.backgroundColor
              
              // Check if color is transparent
              const isTransparent = currentColor && (
                currentColor.includes('rgba') && currentColor.includes(', 0)') ||
                currentColor.includes('rgba') && currentColor.includes(', 0.00)') ||
                currentColor === 'transparent'
              )

              return (
                <div key={pointIndex} className="flex items-center justify-between p-2 bg-white rounded border min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xs font-medium text-gray-500 flex-shrink-0">#{pointIndex + 1}</span>
                    <span className="text-xs truncate">{String(currentSliceLabels[pointIndex] || `Point ${pointIndex + 1}`)}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div 
                      className="w-6 h-6 rounded border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform relative"
                      style={{ backgroundColor: currentColor || '#3b82f6' }}
                      onClick={() => document.getElementById(`slice-color-${pointIndex}`)?.click()}
                    >
                      {/* Transparent indicator - diagonal stripes */}
                      {isTransparent && (
                        <div className="absolute inset-0 rounded" style={{
                          backgroundImage: `repeating-linear-gradient(
                            45deg,
                            #ccc 0px,
                            #ccc 2px,
                            transparent 2px,
                            transparent 4px
                          )`
                        }} />
                      )}
                      {/* Transparent indicator - "T" text */}
                      {isTransparent && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-red-600">T</span>
                        </div>
                      )}
                    </div>
                    <input
                      id={`slice-color-${pointIndex}`}
                      type="color"
                      value={currentColor || '#3b82f6'}
                      onChange={(e) => handleColorChange(pointIndex, e.target.value)}
                      className="invisible w-0"
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

    // Single mode: simplified UI - select a slice, then edit its image settings only
    if (chartMode === 'single') {
      const idx = Math.min(Math.max(0, imageSelectedIndex), Math.max(0, (currentDataset?.data?.length || 1) - 1))
      const imageUrl = currentDataset?.pointImages?.[idx]
      const hasImage = imageUrl && imageUrl !== '' && imageUrl !== null ? imageUrl as string : null
      const imageConfig = currentDataset?.pointImageConfig?.[idx] || getDefaultImageConfig(chartType)
      // Ensure type defaults to 'regular' if not set or invalid
      if (!imageConfig.type || (imageConfig.type !== 'regular' && imageConfig.type !== 'circle' && imageConfig.type !== 'square' && imageConfig.type !== 'rounded')) {
        imageConfig.type = 'regular'
      }

      const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
      const ensureArrays = () => {
        const length = currentDataset?.data?.length || 0
        const images = (currentDataset?.pointImages && currentDataset.pointImages.length === length)
          ? [...(currentDataset.pointImages as (string|null)[])]
          : Array(length).fill(null)
        const configs = (currentDataset?.pointImageConfig && currentDataset.pointImageConfig.length === length)
          ? [...(currentDataset.pointImageConfig as any[])]
          : Array(length).fill(getDefaultImageConfig(chartType))
        return { images, configs }
    }

    return (
      <div className="space-y-3">
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-3 space-y-3 border border-green-200/50">
            {/* Slice Selection & Status */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <Label className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Slice</Label>
                <Select value={String(idx)} onValueChange={(v) => setImageSelectedIndex(Number(v))}>
                  <SelectTrigger className="h-7 text-xs flex-1 border-green-200 focus:border-green-400">
                    <span className="text-xs truncate">{`#${idx + 1} — ${currentSliceLabels[idx] || `Slice ${idx + 1}`}`}</span>
                  </SelectTrigger>
                  <SelectContent>
                    {currentDataset.data.map((_: any, i: number) => (
                      <SelectItem key={i} value={String(i)}>
                        <span className="text-xs">#{i + 1} — {String(currentSliceLabels[i] || `Slice ${i + 1}`)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hasImage && (
                <div className="flex items-center gap-1 text-[10px] text-green-700 bg-green-100 px-2 py-1 rounded-full border border-green-300">
                  <ImageIcon className="h-2.5 w-2.5" />
                  <span className="font-medium">Active</span>
                </div>
              )}
            </div>

            {/* Image Preview */}
            {hasImage && (
              <div className="bg-white rounded-lg p-2 border border-green-200 shadow-sm">
                <Label className="text-[10px] font-medium text-green-700 mb-1.5 block">Preview</Label>
                <div className="relative aspect-square w-full max-w-[100px] mx-auto rounded-lg overflow-hidden border-2 border-green-300 bg-gray-50">
                  <img 
                    src={hasImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover z-10 relative"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.style.display = 'none';
                      const fallback = img.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    onLoad={(e) => {
                      const img = e.target as HTMLImageElement;
                      const fallback = img.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0" style={{ display: 'none' }}>
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            )}

            {/* Upload / Clear / URL - Compact */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs border-green-300 hover:bg-green-50"
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (!file || datasetIndex === -1) return
                      
                      // Import compression utility
                      const { 
                        compressImage, 
                        validateImageFile,
                        getAvailableLocalStorageSpace,
                        shouldCleanupImages,
                        getImagesToCleanup,
                        wouldExceedQuota
                      } = await import('@/lib/image-utils')
                      
                      // Validate file
                      if (!validateImageFile(file, 10)) {
                        toast.error('Invalid image file. Please select an image file under 10MB.')
                        return
                      }

                    try {
                      // Check available space and cleanup if needed
                      const availableSpace = getAvailableLocalStorageSpace()
                      if (availableSpace < 200 * 1024) {
                        const cleanupInfo = shouldCleanupImages(chartData, 1 * 1024 * 1024)
                        if (cleanupInfo.needed) {
                          chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                            const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
                            if (indicesToRemove.length > 0) {
                              const newPointImages = [...(dataset.pointImages || [])]
                              indicesToRemove.forEach((idx: number) => {
                                newPointImages[idx] = null
                              })
                              updateDataset(dsIdx, { pointImages: newPointImages })
                            }
                          })
                        }
                      }

                      // Compress image with better defaults
                      const compressedImageUrl = await compressImage(file, 600, 600, 0.7, true)
                      
                      // Check if compressed image would exceed quota
                      if (wouldExceedQuota(compressedImageUrl)) {
                        const cleanupInfo = shouldCleanupImages(chartData, 2 * 1024 * 1024)
                        if (cleanupInfo.needed) {
                          chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                            const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
                            if (indicesToRemove.length > 0) {
                              const newPointImages = [...(dataset.pointImages || [])]
                              indicesToRemove.forEach((idx: number) => {
                                newPointImages[idx] = null
                              })
                              updateDataset(dsIdx, { pointImages: newPointImages })
                            }
                          })
                        }
                        if (wouldExceedQuota(compressedImageUrl)) {
                          toast.error('Storage quota exceeded. Please remove some images.')
                          return
                        }
                      }

                      const { images, configs } = ensureArrays()
                      images[idx] = compressedImageUrl
                      configs[idx] = { ...imageConfig }
                      
                      try {
                        updateDataset(datasetIndex, { pointImages: images as any, pointImageConfig: configs as any })
                      } catch (error: any) {
                        if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
                          chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                            const indicesToRemove = getImagesToCleanup(dataset, 1)
                            if (indicesToRemove.length > 0) {
                              const newPointImages = [...(dataset.pointImages || [])]
                              indicesToRemove.forEach((idx: number) => {
                                newPointImages[idx] = null
                              })
                              updateDataset(dsIdx, { pointImages: newPointImages })
                            }
                          })
                          updateDataset(datasetIndex, { pointImages: images as any, pointImageConfig: configs as any })
                        } else {
                          throw error
                        }
                      }
                    } catch (error: any) {
                      console.error('Error compressing image:', error)
                      if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
                        toast.error('Storage quota exceeded. Please remove some images.')
                      } else {
                        toast.error('Failed to process image. Please try a smaller file.')
                      }
                    }
                    }
                    input.click()
                  }}
                >
                  <Upload className="h-3 w-3 mr-1" /> Upload
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 w-7 p-0 border-green-300 hover:bg-green-50"
                  onClick={() => {
                    if (datasetIndex === -1) return
                    const { images, configs } = ensureArrays()
                    images[idx] = ''
                    configs[idx] = getDefaultImageConfig(chartType)
                    updateDataset(datasetIndex, { pointImages: images as any, pointImageConfig: configs as any })
                  }}
                  disabled={!hasImage}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <Input
                placeholder="Paste image URL and press Enter"
                className="h-7 text-xs flex-1 border-green-200 focus:border-green-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = (e.target as HTMLInputElement).value.trim()
                    if (value && datasetIndex === -1) return
                    if (value && datasetIndex !== -1) {
                      const { images, configs } = ensureArrays()
                      images[idx] = value
                      configs[idx] = { ...imageConfig }
                      updateDataset(datasetIndex, { pointImages: images as any, pointImageConfig: configs as any })
                      ;(e.target as HTMLInputElement).value = ''
                    }
                  }
                }}
              />
            </div>

            {/* Config for selected slice - Compact */}
            <div className="space-y-2 pt-2 border-t border-green-200">
              <Label className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Configuration</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-gray-600">Shape</Label>
                  <Select
                    value={imageConfig.type || 'regular'}
                    onValueChange={(value) => handleImageConfigChange(idx, 'type', value)}
                  >
                    <SelectTrigger className="h-7 text-xs border-green-200 focus:border-green-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {imageOptions.types.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            {type.value === 'circle' && <Circle className="h-3 w-3" />}
                            {type.value === 'square' && <Square className="h-3 w-3" />}
                            {type.value === 'regular' && <ImageIcon className="h-3 w-3" />}
                            <span className="text-xs">{type.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-gray-600">Size (px)</Label>
                  <Input
                    type="number"
                    value={imageConfig.size || getDefaultImageSize(chartType)}
                    className="h-7 text-xs border-green-200 focus:border-green-400"
                    min={5}
                    max={100}
                    onChange={(e) => handleImageConfigChange(idx, 'size', parseInt(e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-gray-600">Position</Label>
                <Select
                  value={imageConfig.position || 'center'}
                  onValueChange={(value) => handleImageConfigChange(idx, 'position', value)}
                >
                  <SelectTrigger className="h-7 text-xs border-green-200 focus:border-green-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {imageOptions.positions.map((position) => {
                      const Icon = getPositionIcon(position.value);
                      return (
                        <SelectItem key={position.value} value={position.value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-3 w-3" />
                            <span className="text-xs">{position.label}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Arrow/Callout Settings - Compact */}
              {imageOptions.supportsArrow && imageConfig.position === 'callout' && (
                <div className="space-y-2 pt-2 border-t border-green-200">
                  <Label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Arrow Settings</Label>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Border Width</Label>
                      <Input
                        type="number"
                        value={imageConfig.borderWidth || 3}
                        className="h-7 text-xs border-green-200 focus:border-green-400"
                        placeholder="3"
                        min={0}
                        max={10}
                        step={1}
                        onChange={(e) => handleImageConfigChange(idx, 'borderWidth', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium text-gray-600">Border Color</Label>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="color"
                          value={imageConfig.borderColor || '#ffffff'}
                          className="h-7 w-12 p-0.5 border border-green-200 rounded cursor-pointer"
                          onChange={(e) => handleImageConfigChange(idx, 'borderColor', e.target.value)}
                        />
                        <Input
                          value={imageConfig.borderColor || '#ffffff'}
                          className="h-7 text-xs flex-1 border-green-200 focus:border-green-400 font-mono text-[10px]"
                          onChange={(e) => handleImageConfigChange(idx, 'borderColor', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={imageConfig.arrowLine !== false}
                        onCheckedChange={(checked) => handleImageConfigChange(idx, 'arrowLine', checked)}
                        className="scale-75"
                      />
                      <Label className="text-xs font-medium text-gray-700">Arrow Line</Label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Switch
                        checked={imageConfig.arrowHead !== false}
                        onCheckedChange={(checked) => handleImageConfigChange(idx, 'arrowHead', checked)}
                        disabled={imageConfig.arrowLine === false}
                        className="scale-75"
                      />
                      <Label className="text-xs font-medium text-gray-700">Arrow Head</Label>
                    </div>
                  </div>
                  
                  {imageConfig.arrowLine !== false && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Arrow Color</Label>
                        <Input
                          type="color"
                          value={imageConfig.arrowColor || '#666666'}
                          className="h-7 w-full p-0.5 border border-green-200 rounded cursor-pointer"
                          onChange={(e) => handleImageConfigChange(idx, 'arrowColor', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-gray-600">Gap (px)</Label>
                        <Input
                          type="number"
                          value={imageConfig.arrowEndGap ?? 8}
                          className="h-7 text-xs border-green-200 focus:border-green-400"
                          placeholder="8"
                          min={0}
                          max={30}
                          step={1}
                          onChange={(e) => handleImageConfigChange(idx, 'arrowEndGap', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fill and Image Fit settings - Compact */}
              {imageOptions.supportsFill && (
                <div className="space-y-2 pt-2 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">
                      {['pie', 'doughnut', 'polarArea'].includes(chartType) ? 'Fill Slice' : 'Fill Bar'}
                    </Label>
                    <Switch
                      checked={['pie', 'doughnut', 'polarArea'].includes(chartType) ? (imageConfig.fillSlice || false) : (imageConfig.fillBar || false)}
                      onCheckedChange={(checked) => {
                        if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
                          handleImageConfigChange(idx, 'fillSlice', checked)
                        } else {
                          handleImageConfigChange(idx, 'fillBar', checked)
                        }
                      }}
                      className="scale-75 data-[state=checked]:bg-green-600"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium text-gray-600">Image Fit</Label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-[10px] ${imageConfig.imageFit === 'fill' ? 'bg-green-100 border-green-400 text-green-700' : ''}`}
                        onClick={() => handleImageConfigChange(idx, 'imageFit', 'fill')}
                        disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? imageConfig.fillSlice : imageConfig.fillBar)}
                      >
                        <Maximize2 className="h-2.5 w-2.5 mr-1" />
                        Fill
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-[10px] ${imageConfig.imageFit === 'cover' ? 'bg-green-100 border-green-400 text-green-700' : ''}`}
                        onClick={() => handleImageConfigChange(idx, 'imageFit', 'cover')}
                        disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? imageConfig.fillSlice : imageConfig.fillBar)}
                      >
                        <Crop className="h-2.5 w-2.5 mr-1" />
                        Cover
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-[10px] ${imageConfig.imageFit === 'contain' ? 'bg-green-100 border-green-400 text-green-700' : ''}`}
                        onClick={() => handleImageConfigChange(idx, 'imageFit', 'contain')}
                        disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? imageConfig.fillSlice : imageConfig.fillBar)}
                      >
                        <Grid className="h-2.5 w-2.5 mr-1" />
                        Contain
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )
    }

    // Grouped mode: keep existing per-slice list with modern UI
    return (
      <div className="space-y-3">
        <div className="space-y-2.5">          
          <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-3 space-y-3 border border-green-200/50">            
            <div className="flex items-center justify-between pb-2 border-b border-green-200">
              <Label className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="h-3.5 w-3.5 text-green-600" />
                Point Images
              </Label>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-green-300 hover:bg-green-50"
                onClick={() => {
                  currentDataset.data.forEach((_: any, pointIndex: number) => {
                    const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset);
                    updatePointImage(datasetIndex, pointIndex, '', getDefaultImageConfig(chartType));
                  });
                }}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            </div>
            
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {currentDataset.data.map((_: any, pointIndex) => {
                  const imageUrl = currentDataset.pointImages?.[pointIndex]
                  const hasImage = imageUrl && imageUrl !== '' && imageUrl !== null ? imageUrl as string : null
                  const imageConfig = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
                  // Ensure type defaults to 'regular' if not set or invalid
                  if (!imageConfig.type || (imageConfig.type !== 'regular' && imageConfig.type !== 'circle' && imageConfig.type !== 'square' && imageConfig.type !== 'rounded')) {
                    imageConfig.type = 'regular'
                  }
                  
                  return (
                    <div key={pointIndex} className="p-2.5 bg-white rounded-lg border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">#{pointIndex + 1}</span>
                          <span className="text-xs font-medium text-gray-700">{String(currentSliceLabels[pointIndex] || `Point ${pointIndex + 1}`)}</span>
                        </div>
                        {hasImage && (
                          <div className="flex items-center gap-1 text-[10px] text-green-700 bg-green-100 px-2 py-0.5 rounded-full border border-green-300">
                            <ImageIcon className="h-2.5 w-2.5" />
                            <span className="font-medium">Active</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Image Preview */}
                      {hasImage && (
                        <div className="mb-2 bg-gray-50 rounded p-1.5 border border-green-200">
                          <div className="relative aspect-square w-full max-w-[80px] mx-auto rounded overflow-hidden border border-green-300 bg-white">
                            <img 
                              src={hasImage} 
                              alt={`Preview ${pointIndex + 1}`} 
                              className="w-full h-full object-cover z-10 relative"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const fallback = img.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              onLoad={(e) => {
                                const img = e.target as HTMLImageElement;
                                const fallback = img.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-0" style={{ display: 'none' }}>
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Image Upload - Compact */}
                      <div className="space-y-1.5 mb-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-7 text-xs border-green-300 hover:bg-green-50"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = 'image/*';
                              input.onchange = (e) => handleImageUpload(pointIndex, e as any);
                              input.click();
                            }}
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            Upload
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border-green-300 hover:bg-green-50"
                            onClick={() => {
                              const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset);
                              updatePointImage(datasetIndex, pointIndex, '', getDefaultImageConfig(chartType));
                            }}
                            disabled={!hasImage}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Input
                          placeholder="Paste URL and press Enter"
                          className="h-7 text-xs flex-1 border-green-200 focus:border-green-400"
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

                      {/* Image Configuration - Compact */}
                      <div className="space-y-2 pt-2 border-t border-green-200">
                        <Label className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">Configuration</Label>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-medium text-gray-600">Shape</Label>
                            <Select
                              value={imageConfig.type || 'regular'}
                              onValueChange={(value) => handleImageConfigChange(pointIndex, 'type', value)}
                            >
                              <SelectTrigger className="h-7 text-xs border-green-200 focus:border-green-400">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {imageOptions.types.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center gap-2">
                                      {type.value === 'circle' && <Circle className="h-3 w-3" />}
                                      {type.value === 'square' && <Square className="h-3 w-3" />}
                                      {type.value === 'regular' && <ImageIcon className="h-3 w-3" />}
                                      <span className="text-xs">{type.label}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-[10px] font-medium text-gray-600">Size (px)</Label>
                            <Input
                              type="number"
                              value={imageConfig.size || getDefaultImageSize(chartType)}
                              className="h-7 text-xs border-green-200 focus:border-green-400"
                              placeholder="20"
                              min={5}
                              max={100}
                              onChange={(e) => handleImageConfigChange(pointIndex, 'size', parseInt(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[10px] font-medium text-gray-600">Position</Label>
                          <Select
                            value={imageConfig.position || 'center'}
                            onValueChange={(value) => handleImageConfigChange(pointIndex, 'position', value)}
                          >
                            <SelectTrigger className="h-7 text-xs border-green-200 focus:border-green-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {imageOptions.positions.map((position) => {
                                const Icon = getPositionIcon(position.value);
                                return (
                                  <SelectItem key={position.value} value={position.value}>
                                    <div className="flex items-center gap-2">
                                      <Icon className="h-3 w-3" />
                                      <span className="text-xs">{position.label}</span>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Arrow/Callout Settings - Compact */}
                        {imageOptions.supportsArrow && imageConfig.position === 'callout' && (
                          <div className="space-y-2 pt-2 border-t border-green-200">
                            <Label className="text-xs font-semibold text-green-700 uppercase tracking-wide">Arrow Settings</Label>
                            
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-gray-600">Border Width</Label>
                                <Input
                                  type="number"
                                  value={imageConfig.borderWidth || 3}
                                  className="h-7 text-xs border-green-200 focus:border-green-400"
                                  placeholder="3"
                                  min={0}
                                  max={10}
                                  step={1}
                                  onChange={(e) => handleImageConfigChange(pointIndex, 'borderWidth', parseInt(e.target.value))}
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs font-medium text-gray-600">Border Color</Label>
                                <div className="flex items-center gap-1.5">
                                  <Input
                                    type="color"
                                    value={imageConfig.borderColor || '#ffffff'}
                                    className="h-7 w-12 p-0.5 border border-green-200 rounded cursor-pointer"
                                    onChange={(e) => handleImageConfigChange(pointIndex, 'borderColor', e.target.value)}
                                  />
                                  <Input
                                    value={imageConfig.borderColor || '#ffffff'}
                                    className="h-7 text-xs flex-1 border-green-200 focus:border-green-400 font-mono text-[10px]"
                                    onChange={(e) => handleImageConfigChange(pointIndex, 'borderColor', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 pt-1">
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={imageConfig.arrowLine !== false}
                                  onCheckedChange={(checked) => handleImageConfigChange(pointIndex, 'arrowLine', checked)}
                                  className="scale-75"
                                />
                                <Label className="text-xs font-medium text-gray-700">Arrow Line</Label>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={imageConfig.arrowHead !== false}
                                  onCheckedChange={(checked) => handleImageConfigChange(pointIndex, 'arrowHead', checked)}
                                  disabled={imageConfig.arrowLine === false}
                                  className="scale-75"
                                />
                                <Label className="text-xs font-medium text-gray-700">Arrow Head</Label>
                              </div>
                            </div>
                            
                            {imageConfig.arrowLine !== false && (
                              <div className="grid grid-cols-2 gap-2 pt-1">
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">Arrow Color</Label>
                                  <Input
                                    type="color"
                                    value={imageConfig.arrowColor || '#666666'}
                                    className="h-7 w-full p-0.5 border border-green-200 rounded cursor-pointer"
                                    onChange={(e) => handleImageConfigChange(pointIndex, 'arrowColor', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs font-medium text-gray-600">Gap (px)</Label>
                                  <Input
                                    type="number"
                                    value={imageConfig.arrowEndGap ?? 8}
                                    className="h-7 text-xs border-green-200 focus:border-green-400"
                                    placeholder="8"
                                    min={0}
                                    max={30}
                                    step={1}
                                    onChange={(e) => handleImageConfigChange(pointIndex, 'arrowEndGap', parseInt(e.target.value))}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Fill Settings - Compact */}
                        {imageOptions.supportsFill && (
                          <div className="space-y-2 pt-2 border-t border-green-200">
                            <div className="flex items-center justify-between">
                              <Label className="text-[10px] font-semibold text-green-700 uppercase tracking-wide">
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
                                className="scale-75 data-[state=checked]:bg-green-600"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] font-medium text-gray-600">Image Fit</Label>
                              <div className="grid grid-cols-3 gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-[10px] ${imageConfig.imageFit === 'fill' ? 'bg-green-100 border-green-400 text-green-700' : ''}`}
                                  onClick={() => handleImageConfigChange(pointIndex, 'imageFit', 'fill')}
                                  disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                                    imageConfig.fillSlice : 
                                    imageConfig.fillBar)}
                                >
                                  <Maximize2 className="h-2.5 w-2.5 mr-1" />
                                  Fill
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-[10px] ${imageConfig.imageFit === 'cover' ? 'bg-green-100 border-green-400 text-green-700' : ''}`}
                                  onClick={() => handleImageConfigChange(pointIndex, 'imageFit', 'cover')}
                                  disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                                    imageConfig.fillSlice : 
                                    imageConfig.fillBar)}
                                >
                                  <Crop className="h-2.5 w-2.5 mr-1" />
                                  Cover
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`h-7 text-[10px] ${imageConfig.imageFit === 'contain' ? 'bg-green-100 border-green-400 text-green-700' : ''}`}
                                  onClick={() => handleImageConfigChange(pointIndex, 'imageFit', 'contain')}
                                  disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? 
                                    imageConfig.fillSlice : 
                                    imageConfig.fillBar)}
                                >
                                  <Grid className="h-2.5 w-2.5 mr-1" />
                                  Contain
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Border Settings - Compact */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-green-200">
                          <div className="space-y-1">
                            <Label className="text-[10px] font-medium text-gray-600">Border Width</Label>
                            <Input
                              type="number"
                              value={imageConfig.borderWidth || 3}
                              className="h-7 text-xs border-green-200 focus:border-green-400"
                              placeholder="3"
                              min={0}
                              max={10}
                              onChange={(e) => handleImageConfigChange(pointIndex, 'borderWidth', parseInt(e.target.value))}
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-[10px] font-medium text-gray-600">Border Color</Label>
                            <div className="flex items-center gap-1.5">
                              <Input
                                type="color"
                                value={imageConfig.borderColor || '#ffffff'}
                                className="h-7 w-12 p-0.5 border border-green-200 rounded cursor-pointer"
                                onChange={(e) => handleImageConfigChange(pointIndex, 'borderColor', e.target.value)}
                              />
                              <Input
                                value={imageConfig.borderColor || '#ffffff'}
                                className="h-7 text-xs flex-1 border-green-200 focus:border-green-400 font-mono text-[10px]"
                                onChange={(e) => handleImageConfigChange(pointIndex, 'borderColor', e.target.value)}
                              />
                            </div>
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
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
        <Label className="text-[0.80rem] font-medium">Select Dataset to Edit</Label>
        <Select value={String(selectedDatasetIndex)} onValueChange={(value) => handleDatasetChange(Number(value))}>
              <SelectTrigger className="h-9 w-full">
                <span className="text-sm truncate">{filteredDatasets[selectedDatasetIndex]?.label || `Dataset ${selectedDatasetIndex + 1}`}</span>
          </SelectTrigger>
          <SelectContent>
            {filteredDatasets.map((dataset, index) => (
              <SelectItem key={index} value={String(index)}>
                {dataset.label || `Dataset ${index + 1}`} ({dataset.data.length} points)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          </div>
          {chartMode === 'single' && (
            <div className="pt-5">
              <Button size="sm" variant="outline" onClick={() => {
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
                
                // snapshot current rows for full edit modal
                if (!currentDataset) return
                const rows: { label: string; value: number; color: string; imageUrl: string | null }[] = currentDataset.data.map((val, i) => {
                  const rawColor = Array.isArray(currentDataset.backgroundColor) 
                    ? (currentDataset.backgroundColor[i] as string) 
                    : (currentDataset.backgroundColor as string) || '#3b82f6'
                  
                  return {
                    label: String(currentSliceLabels[i] || `Slice ${i + 1}`),
                    value: typeof val === 'number' ? val : (Array.isArray(val) ? (val[1] as number) : (val as any)?.y ?? 0),
                    color: rgbaToHex(rawColor),
                    imageUrl: currentDataset.pointImages?.[i] || null,
                  }
                })
                setFullEditRows(rows)
                setShowFullEditModal(true)
              }}>
                Full Edit
              </Button>
          </div>
        )}
        </div>
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

      {/* Full Edit Modal for Single mode */}
      <Dialog open={showFullEditModal} onOpenChange={setShowFullEditModal}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>Full Edit (Single Dataset)</DialogTitle>
          </DialogHeader>
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
                      <input type="color" className="w-10 h-8 p-0 border-0 bg-transparent" value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} />
                      <Input className="h-8 text-xs w-24" value={row.color} onChange={(e) => setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, color: e.target.value } : r))} />
                    </div>
                  </div>
                  <div className="col-span-3">
                    <Label className="text-xs">Image</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={async () => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.accept = 'image/*'
                          input.onchange = async (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (!file) return
                            
                            // Import compression utility
                            const { 
                              compressImage, 
                              validateImageFile,
                              getAvailableLocalStorageSpace,
                              shouldCleanupImages,
                              getImagesToCleanup,
                              wouldExceedQuota
                            } = await import('@/lib/image-utils')
                            
                            // Validate file
                            if (!validateImageFile(file, 10)) {
                              toast.error('Invalid image file. Please select an image file under 10MB.')
                              return
                            }

                            try {
                              // Check available space and cleanup if needed
                              const availableSpace = getAvailableLocalStorageSpace()
                              if (availableSpace < 200 * 1024) {
                                const cleanupInfo = shouldCleanupImages(chartData, 1 * 1024 * 1024)
                                if (cleanupInfo.needed) {
                                  chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                                    const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
                                    if (indicesToRemove.length > 0) {
                                      const newPointImages = [...(dataset.pointImages || [])]
                                      indicesToRemove.forEach((idx: number) => {
                                        newPointImages[idx] = null
                                      })
                                      updateDataset(dsIdx, { pointImages: newPointImages })
                                    }
                                  })
                                }
                              }

                              // Compress image with better defaults
                              const compressedImageUrl = await compressImage(file, 600, 600, 0.7, true)
                              
                              // Check if compressed image would exceed quota
                              if (wouldExceedQuota(compressedImageUrl)) {
                                const cleanupInfo = shouldCleanupImages(chartData, 2 * 1024 * 1024)
                                if (cleanupInfo.needed) {
                                  chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                                    const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep)
                                    if (indicesToRemove.length > 0) {
                                      const newPointImages = [...(dataset.pointImages || [])]
                                      indicesToRemove.forEach((idx: number) => {
                                        newPointImages[idx] = null
                                      })
                                      updateDataset(dsIdx, { pointImages: newPointImages })
                                    }
                                  })
                                }
                                if (wouldExceedQuota(compressedImageUrl)) {
                                  toast.error('Storage quota exceeded. Please remove some images.')
                                  return
                                }
                              }

                              setFullEditRows(prev => prev.map((r, idx) => idx === i ? { ...r, imageUrl: compressedImageUrl } : r))
                            } catch (error: any) {
                              console.error('Error compressing image:', error)
                              if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
                                toast.error('Storage quota exceeded. Please remove some images.')
                              } else {
                                toast.error('Failed to process image. Please try a smaller file.')
                              }
                            }
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
                if (!currentDataset) return
                const datasetIndex = chartData.datasets.findIndex(ds => ds === currentDataset)
                if (datasetIndex === -1) return
                // Persist labels, values, colors, images
                const labels = fullEditRows.map(r => r.label)
                const values = fullEditRows.map(r => r.value)
                const colors = fullEditRows.map(r => r.color)
                const images = fullEditRows.map(r => r.imageUrl)
                // Ensure arrays are aligned and persist slice colors
                updateDataset(datasetIndex, {
                  sliceLabels: labels,
                  data: values as any,
                  backgroundColor: colors as any,
                  pointImages: images as any,
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