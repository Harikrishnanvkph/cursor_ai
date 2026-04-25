import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import {
    Target,
    ArrowUpRight,
    ImageIcon,
    Upload,
    Trash2,
    Circle,
    Square,
    Maximize2,
    Crop,
    Grid,
    RotateCcw
} from "lucide-react"
import { getProxiedImageUrl } from "@/lib/utils/image-proxy-utils"

interface ImagesTabProps {
    chartMode: string
    chartType: string
    chartData: any
    currentDataset: any
    currentSliceLabels: string[]
    imageSelectedIndex: number
    setImageSelectedIndex: (index: number) => void
    getImageOptionsForChartType: (chartType: string) => any
    getDefaultImageConfig: (chartType: string) => any
    getDefaultImageSize: (chartType: string) => number
    handleImageUpload: (pointIndex: number, event: React.ChangeEvent<HTMLInputElement>) => void
    handleImageUrlChange: (pointIndex: number, url: string) => void
    handleImageConfigChange: (pointIndex: number, key: string, value: any) => void
    updatePointImage: (datasetIndex: number, pointIndex: number, imageUrl: string, config: any) => void
    updateDataset: (datasetIndex: number, updates: any) => void
}

export function ImagesTab({
    chartMode,
    chartType,
    chartData,
    currentDataset,
    currentSliceLabels,
    imageSelectedIndex,
    setImageSelectedIndex,
    getImageOptionsForChartType,
    getDefaultImageConfig,
    getDefaultImageSize,
    handleImageUpload,
    handleImageUrlChange,
    handleImageConfigChange,
    updatePointImage,
    updateDataset,
}: ImagesTabProps) {
    if (!currentDataset) return null;

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
    const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset)
    const ensureArrays = () => {
        const length = currentDataset?.data?.length || 0
        const images = (currentDataset?.pointImages && currentDataset.pointImages.length === length)
            ? [...(currentDataset.pointImages as (string | null)[])]
            : Array(length).fill(null)
        const configs = (currentDataset?.pointImageConfig && currentDataset.pointImageConfig.length === length)
            ? [...(currentDataset.pointImageConfig as any[])]
            : Array(length).fill(getDefaultImageConfig(chartType))
        return { images, configs }
    }

    const internalHandleImageUpload = async (pointIndex: number, file: File) => {
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
                            indicesToRemove.forEach((i: number) => {
                                newPointImages[i] = null
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
                            indicesToRemove.forEach((i: number) => {
                                newPointImages[i] = null
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
            images[pointIndex] = compressedImageUrl

            const imageConfig = currentDataset?.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
            configs[pointIndex] = { ...imageConfig }

            try {
                updateDataset(datasetIndex, { pointImages: images as any, pointImageConfig: configs as any })
            } catch (error: any) {
                if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
                    chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                        const indicesToRemove = getImagesToCleanup(dataset, 1)
                        if (indicesToRemove.length > 0) {
                            const newPointImages = [...(dataset.pointImages || [])]
                            indicesToRemove.forEach((i: number) => {
                                newPointImages[i] = null
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

    const internalHandleUrlSubmit = (pointIndex: number, value: string) => {
        if (!value.trim() || datasetIndex === -1) return
        const { images, configs } = ensureArrays()
        images[pointIndex] = value.trim()

        const imageConfig = currentDataset?.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
        configs[pointIndex] = { ...imageConfig }

        updateDataset(datasetIndex, { pointImages: images as any, pointImageConfig: configs as any })
    }

    // Single mode: simplified UI - select a slice, then edit its image settings only
    if (chartMode === 'single') {
        const idx = Math.min(Math.max(0, imageSelectedIndex), Math.max(0, (currentDataset?.data?.length || 1) - 1))
        const imageUrl = currentDataset?.pointImages?.[idx]
        const hasImage = typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl : null
        const imageConfig = currentDataset?.pointImageConfig?.[idx] || getDefaultImageConfig(chartType)
        // Ensure type defaults to 'regular' if not set or invalid
        if (!imageConfig.type || (imageConfig.type !== 'regular' && imageConfig.type !== 'circle' && imageConfig.type !== 'square' && imageConfig.type !== 'rounded')) {
            imageConfig.type = 'regular'
        }

        return (
            <div className="space-y-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 space-y-3 border border-blue-200/50">
                    {/* Slice Selection & Status */}
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Label className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Slice</Label>
                            <Select value={String(idx)} onValueChange={(v) => setImageSelectedIndex(Number(v))}>
                                <SelectTrigger className="h-7 text-xs flex-1 border-blue-200 focus:border-blue-400">
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
                            <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-100 px-2 py-1 rounded-full border border-blue-300">
                                <ImageIcon className="h-2.5 w-2.5" />
                                <span className="font-medium">Active</span>
                            </div>
                        )}
                    </div>

                    {/* Image Preview */}
                    {hasImage && (
                        <div className="bg-white rounded-lg p-2 border border-blue-200 shadow-sm">
                            <Label className="text-[10px] font-medium text-blue-700 mb-1.5 block">Preview</Label>
                            <div className="relative aspect-square w-full max-w-[100px] mx-auto rounded-lg overflow-hidden border-2 border-blue-300 bg-gray-50">
                                <img
                                    src={getProxiedImageUrl(hasImage)}
                                    alt="Preview"
                                    className="w-full h-full object-cover z-10 relative"
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
                                className="flex-1 h-7 text-xs border-blue-300 hover:bg-blue-50"
                                onClick={() => {
                                    const input = document.createElement('input')
                                    input.type = 'file'
                                    input.accept = 'image/*'
                                    input.onchange = async (e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0]
                                        if (file) await internalHandleImageUpload(idx, file)
                                    }
                                    input.click()
                                }}
                            >
                                <Upload className="h-3 w-3 mr-1" /> Upload
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-7 w-7 p-0 border-blue-300 hover:bg-blue-50"
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
                            className="h-7 text-xs flex-1 border-blue-200 focus:border-blue-400 min-w-0"
                            defaultValue={hasImage || ''}
                            key={`input-single-${idx}-${hasImage}`} // Force re-render when image changes or slice changes
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const value = (e.target as HTMLInputElement).value
                                    internalHandleUrlSubmit(idx, value)
                                }
                            }}
                        />
                    </div>

                    {/* Config for selected slice - Compact */}
                    <div className="space-y-2 pt-2 border-t border-blue-200">
                        <Label className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Configuration</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-medium text-gray-600">Shape</Label>
                                <Select
                                    value={imageConfig.type || 'regular'}
                                    onValueChange={(value) => handleImageConfigChange(idx, 'type', value)}
                                >
                                    <SelectTrigger className="h-7 text-xs border-blue-200 focus:border-blue-400">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {imageOptions.types.map((type: any) => (
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
                                    value={imageConfig.size === '' || Number.isNaN(imageConfig.size as number) ? 0 : (imageConfig.size ?? getDefaultImageSize(chartType))}
                                    className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                    min={5}
                                    max={100}
                                    onChange={(e) => handleImageConfigChange(idx, 'size', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center justify-between">
                                <Label className="text-[10px] font-medium text-gray-600">Position</Label>
                                {imageConfig.position === 'callout' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-5 px-1.5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                        onClick={() => {
                                            handleImageConfigChange(idx, 'calloutX', undefined);
                                            handleImageConfigChange(idx, 'calloutY', undefined);
                                        }}
                                        title="Reset Callout Position"
                                    >
                                        <RotateCcw className="h-3 w-3 mr-1" />
                                        Reset Callout Position
                                    </Button>
                                )}
                            </div>
                            <Select
                                value={imageConfig.position || 'center'}
                                onValueChange={(value) => handleImageConfigChange(idx, 'position', value)}
                            >
                                <SelectTrigger className="h-7 text-xs border-blue-200 focus:border-blue-400">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {imageOptions.positions.map((position: any) => {
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
                            <div className="space-y-2 pt-2 border-t border-blue-200">
                                <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Arrow Settings</Label>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-gray-600">Border Width</Label>
                                        <Input
                                            type="number"
                                            value={imageConfig.borderWidth === '' || Number.isNaN(imageConfig.borderWidth as number) ? 0 : (imageConfig.borderWidth ?? 3)}
                                            className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                            placeholder="3"
                                            min={0}
                                            max={10}
                                            step={1}
                                            onChange={(e) => handleImageConfigChange(idx, 'borderWidth', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-gray-600">Border Color</Label>
                                        <div className="flex items-center gap-1.5">
                                            <Input
                                                type="color"
                                                value={imageConfig.borderColor || '#ffffff'}
                                                className="h-7 w-12 p-0.5 border border-blue-200 rounded cursor-pointer"
                                                onChange={(e) => handleImageConfigChange(idx, 'borderColor', e.target.value)}
                                            />
                                            <Input
                                                value={imageConfig.borderColor || '#ffffff'}
                                                className="h-7 text-xs flex-1 border-blue-200 focus:border-blue-400 font-mono text-[10px]"
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
                                                className="h-7 w-full p-0.5 border border-blue-200 rounded cursor-pointer"
                                                onChange={(e) => handleImageConfigChange(idx, 'arrowColor', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-600">Gap (px)</Label>
                                            <Input
                                                type="number"
                                                value={imageConfig.arrowEndGap === '' || Number.isNaN(imageConfig.arrowEndGap as number) ? 0 : (imageConfig.arrowEndGap ?? 8)}
                                                className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                                placeholder="8"
                                                min={0}
                                                max={30}
                                                step={1}
                                                onChange={(e) => handleImageConfigChange(idx, 'arrowEndGap', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Fill and Image Fit settings - Compact */}
                        {imageOptions.supportsFill && (
                            <div className="space-y-2 pt-2 border-t border-blue-200">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
                                        {['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ? 'Fill Slice' : 'Fill Bar'}
                                    </Label>
                                    <Switch
                                        checked={['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ? (imageConfig.fillSlice || false) : (imageConfig.fillBar || false)}
                                        onCheckedChange={(checked) => {
                                            // Update BOTH properties atomically to prevent race condition
                                            handleImageConfigChange(idx, { fillSlice: checked, fillBar: checked })
                                        }}
                                        className="scale-75 data-[state=checked]:bg-blue-600"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-medium text-gray-600">Image Fit</Label>
                                    <div className="grid grid-cols-3 gap-1.5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`h-7 text-[10px] ${imageConfig.imageFit === 'fill' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
                                            onClick={() => handleImageConfigChange(idx, 'imageFit', 'fill')}
                                            disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? imageConfig.fillSlice : imageConfig.fillBar)}
                                        >
                                            <Maximize2 className="h-2.5 w-2.5 mr-1" />
                                            Fill
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`h-7 text-[10px] ${imageConfig.imageFit === 'cover' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
                                            onClick={() => handleImageConfigChange(idx, 'imageFit', 'cover')}
                                            disabled={!(['pie', 'doughnut', 'polarArea'].includes(chartType) ? imageConfig.fillSlice : imageConfig.fillBar)}
                                        >
                                            <Crop className="h-2.5 w-2.5 mr-1" />
                                            Cover
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`h-7 text-[10px] ${imageConfig.imageFit === 'contain' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
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
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 space-y-3 border border-blue-200/50">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-200">
                        <Label className="text-xs font-semibold text-gray-900 flex items-center gap-2">
                            <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                            Point Images
                        </Label>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-blue-300 hover:bg-blue-50"
                            onClick={() => {
                                currentDataset.data.forEach((_: any, pointIndex: number) => {
                                    const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset);
                                    updatePointImage(datasetIndex, pointIndex, '', getDefaultImageConfig(chartType));
                                });
                            }}
                        >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Clear All
                        </Button>
                    </div>

                    <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                        {currentDataset.data.map((_: any, pointIndex: number) => {
                            const imageUrl = currentDataset.pointImages?.[pointIndex]
                            const hasImage = typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? imageUrl : null
                            const imageConfig = currentDataset.pointImageConfig?.[pointIndex] || getDefaultImageConfig(chartType)
                            // Ensure type defaults to 'regular' if not set or invalid
                            if (!imageConfig.type || (imageConfig.type !== 'regular' && imageConfig.type !== 'circle' && imageConfig.type !== 'square' && imageConfig.type !== 'rounded')) {
                                imageConfig.type = 'regular'
                            }

                            return (
                                <div key={pointIndex} className="p-2.5 bg-white rounded-lg border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">#{pointIndex + 1}</span>
                                            <span className="text-xs font-medium text-gray-700">{String(currentSliceLabels[pointIndex] || `Point ${pointIndex + 1}`)}</span>
                                        </div>
                                        {hasImage && (
                                            <div className="flex items-center gap-1 text-[10px] text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                                                <ImageIcon className="h-2.5 w-2.5" />
                                                <span className="font-medium">Active</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Image Preview */}
                                    {hasImage && (
                                        <div className="mb-2 bg-gray-50 rounded p-1.5 border border-blue-200">
                                            <div className="relative aspect-square w-full max-w-[80px] mx-auto rounded overflow-hidden border border-blue-300 bg-white">
                                                <img
                                                    src={getProxiedImageUrl(hasImage)}
                                                    alt={`Preview ${pointIndex + 1}`}
                                                    className="w-full h-full object-cover z-10 relative"
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
                                                className="flex-1 h-7 text-xs border-blue-300 hover:bg-blue-50"
                                                onClick={() => {
                                                    const input = document.createElement('input');
                                                    input.type = 'file';
                                                    input.accept = 'image/*';
                                                    input.onchange = async (e) => {
                                                        const file = (e.target as HTMLInputElement).files?.[0]
                                                        if (file) await internalHandleImageUpload(pointIndex, file)
                                                    };
                                                    input.click();
                                                }}
                                            >
                                                <Upload className="h-3 w-3 mr-1" />
                                                Upload
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-7 w-7 p-0 border-blue-300 hover:bg-blue-50"
                                                onClick={() => {
                                                    const datasetIndex = chartData.datasets.findIndex((ds: any) => ds === currentDataset);
                                                    updatePointImage(datasetIndex, pointIndex, '', getDefaultImageConfig(chartType));
                                                }}
                                                disabled={!hasImage}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>

                                        <Input
                                            placeholder="Paste URL and press Enter"
                                            className="h-7 text-xs flex-1 border-blue-200 focus:border-blue-400 min-w-0"
                                            defaultValue={hasImage || ''}
                                            key={`input-grouped-${pointIndex}-${hasImage}`} // force re-render when image changes
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    const value = (e.target as HTMLInputElement).value;
                                                    internalHandleUrlSubmit(pointIndex, value)
                                                }
                                            }}
                                        />
                                    </div>

                                    {/* Image Configuration - Compact */}
                                    <div className="space-y-2 pt-2 border-t border-blue-200">
                                        <Label className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">Configuration</Label>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-medium text-gray-600">Shape</Label>
                                                <Select
                                                    value={imageConfig.type || 'regular'}
                                                    onValueChange={(value) => handleImageConfigChange(pointIndex, 'type', value)}
                                                >
                                                    <SelectTrigger className="h-7 text-xs border-blue-200 focus:border-blue-400">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {imageOptions.types.map((type: any) => (
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
                                                    value={imageConfig.size === '' || Number.isNaN(imageConfig.size as number) ? 0 : (imageConfig.size ?? getDefaultImageSize(chartType))}
                                                    className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                                    placeholder="20"
                                                    min={5}
                                                    max={100}
                                                    onChange={(e) => handleImageConfigChange(pointIndex, 'size', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-medium text-gray-600">Position</Label>
                                                {imageConfig.position === 'callout' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-5 px-1.5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        onClick={() => {
                                                            handleImageConfigChange(pointIndex, 'calloutX', undefined);
                                                            handleImageConfigChange(pointIndex, 'calloutY', undefined);
                                                        }}
                                                        title="Reset Callout Position"
                                                    >
                                                        <RotateCcw className="h-3 w-3 mr-1" />
                                                        Reset Callout Position
                                                    </Button>
                                                )}
                                            </div>
                                            <Select
                                                value={imageConfig.position || 'center'}
                                                onValueChange={(value) => handleImageConfigChange(pointIndex, 'position', value)}
                                            >
                                                <SelectTrigger className="h-7 text-xs border-blue-200 focus:border-blue-400">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {imageOptions.positions.map((position: any) => {
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
                                            <div className="space-y-2 pt-2 border-t border-blue-200">
                                                <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Arrow Settings</Label>

                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium text-gray-600">Border Width</Label>
                                                        <Input
                                                            type="number"
                                                            value={imageConfig.borderWidth === '' || Number.isNaN(imageConfig.borderWidth as number) ? 0 : (imageConfig.borderWidth ?? 3)}
                                                            className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                                            placeholder="3"
                                                            min={0}
                                                            max={10}
                                                            step={1}
                                                            onChange={(e) => handleImageConfigChange(pointIndex, 'borderWidth', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-medium text-gray-600">Border Color</Label>
                                                        <div className="flex items-center gap-1.5">
                                                            <Input
                                                                type="color"
                                                                value={imageConfig.borderColor || '#ffffff'}
                                                                className="h-7 w-12 p-0.5 border border-blue-200 rounded cursor-pointer"
                                                                onChange={(e) => handleImageConfigChange(pointIndex, 'borderColor', e.target.value)}
                                                            />
                                                            <Input
                                                                value={imageConfig.borderColor || '#ffffff'}
                                                                className="h-7 text-xs flex-1 border-blue-200 focus:border-blue-400 font-mono text-[10px]"
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
                                                                className="h-7 w-full p-0.5 border border-blue-200 rounded cursor-pointer"
                                                                onChange={(e) => handleImageConfigChange(pointIndex, 'arrowColor', e.target.value)}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs font-medium text-gray-600">Gap (px)</Label>
                                                            <Input
                                                                type="number"
                                                                value={imageConfig.arrowEndGap === '' || Number.isNaN(imageConfig.arrowEndGap as number) ? 0 : (imageConfig.arrowEndGap ?? 8)}
                                                                className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                                                placeholder="8"
                                                                min={0}
                                                                max={30}
                                                                step={1}
                                                                onChange={(e) => handleImageConfigChange(pointIndex, 'arrowEndGap', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Fill Settings - Compact */}
                                        {imageOptions.supportsFill && (
                                            <div className="space-y-2 pt-2 border-t border-blue-200">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-[10px] font-semibold text-blue-700 uppercase tracking-wide">
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
                                                        className="scale-75 data-[state=checked]:bg-blue-600"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-[10px] font-medium text-gray-600">Image Fit</Label>
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className={`h-7 text-[10px] ${imageConfig.imageFit === 'fill' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
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
                                                            className={`h-7 text-[10px] ${imageConfig.imageFit === 'cover' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
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
                                                            className={`h-7 text-[10px] ${imageConfig.imageFit === 'contain' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
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
                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200">
                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-medium text-gray-600">Border Width</Label>
                                                <Input
                                                    type="number"
                                                    value={imageConfig.borderWidth === '' || Number.isNaN(imageConfig.borderWidth as number) ? 0 : (imageConfig.borderWidth ?? 3)}
                                                    className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                                    placeholder="3"
                                                    min={0}
                                                    max={10}
                                                    onChange={(e) => handleImageConfigChange(pointIndex, 'borderWidth', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                />
                                            </div>

                                            <div className="space-y-1">
                                                <Label className="text-[10px] font-medium text-gray-600">Border Color</Label>
                                                <div className="flex items-center gap-1.5">
                                                    <Input
                                                        type="color"
                                                        value={imageConfig.borderColor || '#ffffff'}
                                                        className="h-7 w-12 p-0.5 border border-blue-200 rounded cursor-pointer"
                                                        onChange={(e) => handleImageConfigChange(pointIndex, 'borderColor', e.target.value)}
                                                    />
                                                    <Input
                                                        value={imageConfig.borderColor || '#ffffff'}
                                                        className="h-7 text-xs flex-1 border-blue-200 focus:border-blue-400 font-mono text-[10px]"
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
