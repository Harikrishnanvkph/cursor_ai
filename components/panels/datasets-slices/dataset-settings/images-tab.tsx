"use client"

import { useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { type ExtendedChartDataset } from "@/lib/chart-store"
import { getDefaultImageType, getDefaultImageSize, getImageOptionsForChartType, getDefaultImageConfig as getDefaultImageConfigFromStore } from "@/lib/plugins/universal-image-plugin"
import { toast } from "sonner"
import {
    ImageIcon,
    Upload,
    Trash2,
    Target,
    ArrowUpRight,
    Square,
    Circle,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    RotateCcw,
    ExternalLink,
    Maximize2,
    Grid,
    Crop,
    X,
} from "lucide-react"

interface ImagesTabProps {
    chartMode: string
    chartType: string
    chartData: any
    activeDatasetIndex: number
    selectedImageType: string
    setSelectedImageType: (type: string) => void
    imageUploadUrl: string
    setImageUploadUrl: (url: string) => void
    updatePointImage: (datasetIndex: number, pointIndex: number, imageUrl: string, config: any) => void
    updateDataset: (datasetIndex: number, updates: Partial<ExtendedChartDataset>) => void
    activeGroupId?: string
    groups?: any[]
}

export function ImagesTab({
    chartMode,
    chartType,
    chartData,
    activeDatasetIndex,
    selectedImageType,
    setSelectedImageType,
    imageUploadUrl,
    setImageUploadUrl,
    updatePointImage,
    updateDataset,
    activeGroupId,
    groups
}: ImagesTabProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageOptions = getImageOptionsForChartType(chartType as any);
    const [selectedGroupDataset, setSelectedGroupDataset] = useState<string>('all');

    // Helper to get indices of all target datasets
    const getTargetDatasetIndices = () => {
        if (chartMode === 'single') return [activeDatasetIndex];
        if (chartMode === 'grouped' && activeGroupId) {
            if (selectedGroupDataset !== 'all') {
                return [parseInt(selectedGroupDataset, 10)];
            }

            const indices: number[] = [];
            chartData.datasets.forEach((ds: any, idx: number) => {
                if (ds.mode === 'grouped' && (ds.groupId === activeGroupId || (!ds.groupId && activeGroupId === 'default'))) {
                    indices.push(idx);
                }
            });
            return indices;
        }
        return [];
    };

    const targetDatasets = getTargetDatasetIndices().map(idx => chartData.datasets[idx]).filter(Boolean);
    const activeDataset = targetDatasets.length > 0 ? targetDatasets[0] : null;

    // Preview image is pulled from the primary dataset's first point
    const previewImageUrl = (activeDataset?.pointImages?.[0] && activeDataset.pointImages[0] !== '' && activeDataset.pointImages[0] !== null)
        ? activeDataset.pointImages[0] as string
        : null;

    const handleImageUpload = async (file: File, datasetIndex: number, pointIndex: number) => {
        const {
            compressImage,
            validateImageFile,
            getAvailableLocalStorageSpace,
            shouldCleanupImages,
            getImagesToCleanup,
            wouldExceedQuota
        } = await import('@/lib/image-utils');

        if (!validateImageFile(file, 10)) {
            toast.error('Invalid image file. Please select an image file under 10MB.');
            return;
        }

        try {
            const availableSpace = getAvailableLocalStorageSpace();
            if (availableSpace < 200 * 1024) {
                const cleanupInfo = shouldCleanupImages(chartData, 1 * 1024 * 1024);

                if (cleanupInfo.needed) {
                    chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                        const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep);
                        if (indicesToRemove.length > 0) {
                            const newPointImages = [...(dataset.pointImages || [])];
                            indicesToRemove.forEach((idx: number) => {
                                newPointImages[idx] = null;
                            });
                            updateDataset(dsIdx, { pointImages: newPointImages });
                        }
                    });
                    toast.info('Cleaned up old images to free space.');
                }
            }

            const compressedImageUrl = await compressImage(file, 600, 600, 0.7, true);

            if (wouldExceedQuota(compressedImageUrl)) {
                const cleanupInfo = shouldCleanupImages(chartData, 2 * 1024 * 1024);

                if (cleanupInfo.needed) {
                    chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                        const indicesToRemove = getImagesToCleanup(dataset, cleanupInfo.maxImagesToKeep);
                        if (indicesToRemove.length > 0) {
                            const newPointImages = [...(dataset.pointImages || [])];
                            indicesToRemove.forEach((idx: number) => {
                                newPointImages[idx] = null;
                            });
                            updateDataset(dsIdx, { pointImages: newPointImages });
                        }
                    });
                }

                if (wouldExceedQuota(compressedImageUrl)) {
                    toast.error('Storage quota exceeded. Please remove some images or clear browser storage.');
                    return;
                }
            }

            const config = chartData.datasets[datasetIndex]?.pointImageConfig?.[pointIndex] || getDefaultImageConfigFromStore(chartType as any);

            try {
                updatePointImage(datasetIndex, pointIndex, compressedImageUrl, config);
            } catch (error: any) {
                if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
                    const { getImagesToCleanup } = await import('@/lib/image-utils');
                    chartData.datasets.forEach((dataset: any, dsIdx: number) => {
                        const indicesToRemove = getImagesToCleanup(dataset, 1);
                        if (indicesToRemove.length > 0) {
                            const newPointImages = [...(dataset.pointImages || [])];
                            indicesToRemove.forEach((idx: number) => {
                                newPointImages[idx] = null;
                            });
                            updateDataset(dsIdx, { pointImages: newPointImages });
                        }
                    });

                    try {
                        updatePointImage(datasetIndex, pointIndex, compressedImageUrl, config);
                    } catch (e) {
                        toast.error('Storage quota exceeded. Please remove some images or clear browser storage.');
                        console.error('Storage quota error:', e);
                    }
                } else {
                    throw error;
                }
            }
        } catch (error: any) {
            console.error('Error compressing image:', error);
            if (error?.message?.includes('quota') || error?.name === 'QuotaExceededError') {
                toast.error('Storage quota exceeded. Please remove some images or clear browser storage.');
            } else {
                toast.error('Failed to process image. Please try a smaller file.');
            }
        }
    };

    const handleUrlSubmit = (datasetIndex: number, pointIndex: number) => {
        if (imageUploadUrl.trim()) {
            const config = chartData.datasets[datasetIndex]?.pointImageConfig?.[pointIndex] || getDefaultImageConfigFromStore(chartType as any);
            updatePointImage(datasetIndex, pointIndex, imageUploadUrl.trim(), config);
            setImageUploadUrl('');
        }
    };

    const handleImageConfigChange = (datasetIndex: number, pointIndex: number, keyOrUpdates: string | Record<string, any>, value?: any) => {
        const currentConfig = chartData.datasets[datasetIndex]?.pointImageConfig?.[pointIndex] || getDefaultImageConfigFromStore(chartType as any);
        const imageUrl = (chartData.datasets[datasetIndex]?.pointImages?.[pointIndex] as string | undefined) ?? '';

        let newConfig;
        if (typeof keyOrUpdates === 'string') {
            newConfig = { ...currentConfig, [keyOrUpdates]: value };
            if (keyOrUpdates === 'arrowLine' && value === false) {
                newConfig.arrowHead = false;
            }
        } else {
            newConfig = { ...currentConfig, ...keyOrUpdates };
        }

        updatePointImage(datasetIndex, pointIndex, imageUrl, newConfig);
    };

    const handleGlobalImageConfigChange = (keyOrUpdates: string | Record<string, any>, value?: any) => {
        const targetIndices = getTargetDatasetIndices();
        targetIndices.forEach(dsIdx => {
            const dataset = chartData.datasets[dsIdx];
            if (dataset && dataset.data) {
                dataset.data.forEach((_: any, pointIndex: number) => {
                    handleImageConfigChange(dsIdx, pointIndex, keyOrUpdates, value);
                });
            }
        });
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
        <div className="space-y-3">
            {/* Image Management */}
            <div className="space-y-2.5">
                <div className="flex items-center gap-2 pb-1.5 border-b border-gray-200">
                    <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                    <h3 className="text-xs font-semibold text-gray-900">Global Image Settings</h3>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-3 space-y-3 border border-blue-200/50">
                    {/* Image Preview Section */}
                    {previewImageUrl && (
                        <div className="bg-white rounded-lg p-2.5 border border-blue-200 shadow-sm">
                            <Label className="text-xs font-medium text-blue-700 mb-1.5 block">Preview</Label>
                            <div className="relative aspect-square w-full max-w-[120px] mx-auto rounded-lg overflow-hidden border-2 border-blue-300 bg-gray-50">
                                <img
                                    src={previewImageUrl}
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
                                    <ImageIcon className="h-6 w-6 text-gray-400" />
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-3">
                        {chartMode === 'grouped' && (
                            <div className="space-y-1.5 pb-2 border-b border-blue-200/60">
                                <Label className="text-xs font-semibold text-gray-700">Apply Images To</Label>
                                <Select value={selectedGroupDataset} onValueChange={setSelectedGroupDataset}>
                                    <SelectTrigger className="h-8 text-xs border-blue-300 focus:border-blue-500 bg-white">
                                        <SelectValue placeholder="Select target" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Datasets in Group</SelectItem>
                                        {chartData.datasets.map((ds: any, idx: number) => {
                                            if (ds.mode === 'grouped' && (ds.groupId === activeGroupId || (!ds.groupId && activeGroupId === 'default'))) {
                                                return (
                                                    <SelectItem key={idx} value={idx.toString()}>
                                                        {ds.label || `Dataset ${idx + 1}`}
                                                    </SelectItem>
                                                )
                                            }
                                            return null;
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Upload Section */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 h-8 text-xs border-blue-300 hover:bg-blue-50"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-3 w-3 mr-1.5" />
                                    Upload
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 px-2 text-xs border-blue-300 hover:bg-blue-50"
                                    onClick={() => {
                                        const targetIndices = getTargetDatasetIndices();
                                        targetIndices.forEach(dsIdx => {
                                            const dataset = chartData.datasets[dsIdx];
                                            if (dataset && dataset.data) {
                                                dataset.data.forEach((_: any, pointIndex: number) => {
                                                    updatePointImage(dsIdx, pointIndex, '', getDefaultImageConfigFromStore(chartType as any));
                                                });
                                            }
                                        });
                                    }}
                                    disabled={!previewImageUrl}
                                    title="Clear All Images"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const targetIndices = getTargetDatasetIndices();
                                        targetIndices.forEach(dsIdx => {
                                            const dataset = chartData.datasets[dsIdx];
                                            if (dataset && dataset.data) {
                                                dataset.data.forEach((_: any, pointIndex: number) => {
                                                    handleImageUpload(file, dsIdx, pointIndex);
                                                });
                                            }
                                        });
                                    }
                                    // Clear input value so the same file can be selected again
                                    if (e.target) {
                                        e.target.value = '';
                                    }
                                }}
                            />

                            <div className="flex gap-2">
                                <Input
                                    value={imageUploadUrl || ''}
                                    onChange={(e) => setImageUploadUrl(e.target.value)}
                                    placeholder="Paste image URL..."
                                    className="h-8 text-xs flex-1 border-blue-200 focus:border-blue-400"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && imageUploadUrl.trim()) {
                                            const targetIndices = getTargetDatasetIndices();
                                            targetIndices.forEach(dsIdx => {
                                                const dataset = chartData.datasets[dsIdx];
                                                if (dataset && dataset.data) {
                                                    dataset.data.forEach((_: any, pointIndex: number) => {
                                                        handleUrlSubmit(dsIdx, pointIndex);
                                                    });
                                                }
                                            });
                                        }
                                    }}
                                />
                                <Button
                                    size="sm"
                                    className="h-8 px-2 text-xs bg-blue-600 hover:bg-blue-700"
                                    onClick={() => {
                                        const targetIndices = getTargetDatasetIndices();
                                        targetIndices.forEach(dsIdx => {
                                            const dataset = chartData.datasets[dsIdx];
                                            if (dataset && dataset.data) {
                                                dataset.data.forEach((_: any, pointIndex: number) => {
                                                    handleUrlSubmit(dsIdx, pointIndex);
                                                });
                                            }
                                        });
                                    }}
                                    disabled={!imageUploadUrl.trim()}
                                >
                                    <ExternalLink className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                        {/* Configuration Section */}
                        <div className="space-y-2.5 pt-2 border-t border-blue-200">
                            <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Configuration</Label>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-gray-600">Shape</Label>
                                    <Select
                                        value={selectedImageType}
                                        onValueChange={(value) => {
                                            setSelectedImageType(value);
                                            handleGlobalImageConfigChange('type', value);
                                        }}
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
                                    <Label className="text-xs font-medium text-gray-600">Size (px)</Label>
                                    <Input
                                        type="number"
                                        value={activeDataset?.pointImageConfig?.[0]?.size === '' || Number.isNaN(activeDataset?.pointImageConfig?.[0]?.size as number) ? 0 : (activeDataset?.pointImageConfig?.[0]?.size ?? getDefaultImageSize(chartType as any))}
                                        className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                        placeholder="20"
                                        min={5}
                                        max={100}
                                        step={1}
                                        onChange={(e) => handleGlobalImageConfigChange('size', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs font-medium text-gray-600">Position</Label>
                                    {activeDataset?.pointImageConfig?.[0]?.position === 'callout' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 px-1.5 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            onClick={() => {
                                                handleGlobalImageConfigChange('calloutX', undefined);
                                                handleGlobalImageConfigChange('calloutY', undefined);
                                            }}
                                            title="Reset Callout Position"
                                        >
                                            <RotateCcw className="h-3 w-3 mr-1" />
                                            Reset Callout Position
                                        </Button>
                                    )}
                                </div>
                                <Select
                                    value={activeDataset?.pointImageConfig?.[0]?.position || 'center'}
                                    onValueChange={(value) => handleGlobalImageConfigChange('position', value)}
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

                            {/* Arrow/Callout Settings */}
                            {imageOptions.supportsArrow && activeDataset?.pointImageConfig?.[0]?.position === 'callout' && (
                                <div className="space-y-2 pt-2 border-t border-blue-200">
                                    <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Arrow Settings</Label>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-600">Border Width</Label>
                                            <Input
                                                type="number"
                                                value={activeDataset?.pointImageConfig?.[0]?.borderWidth === '' || Number.isNaN(activeDataset?.pointImageConfig?.[0]?.borderWidth as number) ? 0 : (activeDataset?.pointImageConfig?.[0]?.borderWidth ?? 3)}
                                                className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                                placeholder="3"
                                                min={0}
                                                max={10}
                                                step={1}
                                                onChange={(e) => handleGlobalImageConfigChange('borderWidth', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-gray-600">Border Color</Label>
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    type="color"
                                                    value={activeDataset?.pointImageConfig?.[0]?.borderColor || '#ffffff'}
                                                    className="h-7 w-12 p-0.5 border border-blue-200 rounded cursor-pointer"
                                                    onChange={(e) => handleGlobalImageConfigChange('borderColor', e.target.value)}
                                                />
                                                <Input
                                                    value={activeDataset?.pointImageConfig?.[0]?.borderColor || '#ffffff'}
                                                    className="h-7 text-xs flex-1 border-blue-200 focus:border-blue-400 font-mono text-[10px]"
                                                    onChange={(e) => handleGlobalImageConfigChange('borderColor', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            <Switch
                                                checked={activeDataset?.pointImageConfig?.[0]?.arrowLine !== false}
                                                onCheckedChange={(checked) => handleGlobalImageConfigChange('arrowLine', checked)}
                                                className="scale-75"
                                            />
                                            <Label className="text-xs font-medium text-gray-700">Arrow Line</Label>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Switch
                                                checked={activeDataset?.pointImageConfig?.[0]?.arrowHead !== false}
                                                onCheckedChange={(checked) => handleGlobalImageConfigChange('arrowHead', checked)}
                                                disabled={activeDataset?.pointImageConfig?.[0]?.arrowLine === false}
                                                className="scale-75"
                                            />
                                            <Label className="text-xs font-medium text-gray-700">Arrow Head</Label>
                                        </div>
                                    </div>

                                    {activeDataset?.pointImageConfig?.[0]?.arrowLine !== false && (
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium text-gray-600">Arrow Color</Label>
                                                <Input
                                                    type="color"
                                                    value={activeDataset?.pointImageConfig?.[0]?.arrowColor || '#666666'}
                                                    className="h-7 w-full p-0.5 border border-blue-200 rounded cursor-pointer"
                                                    onChange={(e) => handleGlobalImageConfigChange('arrowColor', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium text-gray-600">Gap (px)</Label>
                                                <Input
                                                    type="number"
                                                    value={activeDataset?.pointImageConfig?.[0]?.arrowEndGap === '' || Number.isNaN(activeDataset?.pointImageConfig?.[0]?.arrowEndGap as number) ? 0 : (activeDataset?.pointImageConfig?.[0]?.arrowEndGap ?? 8)}
                                                    className="h-7 text-xs border-blue-200 focus:border-blue-400"
                                                    placeholder="8"
                                                    min={0}
                                                    max={30}
                                                    step={1}
                                                    onChange={(e) => handleGlobalImageConfigChange('arrowEndGap', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Fill Settings */}
                            {imageOptions.supportsFill && (
                                <div className="space-y-2 pt-2 border-t border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                            {['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ? 'Fill Slice' : 'Fill Bar'}
                                        </Label>
                                        <Switch
                                            checked={['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType)
                                                ? (activeDataset?.pointImageConfig?.[0]?.fillSlice || false)
                                                : (activeDataset?.pointImageConfig?.[0]?.fillBar || false)}
                                            onCheckedChange={(checked) => {
                                                // Update BOTH properties atomically to prevent race condition
                                                handleGlobalImageConfigChange({ fillSlice: checked, fillBar: checked })
                                            }}
                                            className="scale-75 data-[state=checked]:bg-blue-600"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-gray-600">Image Fit</Label>
                                        <div className="grid grid-cols-3 gap-1.5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`h-7 text-[10px] ${activeDataset?.pointImageConfig?.[0]?.imageFit === 'fill' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
                                                onClick={() => handleGlobalImageConfigChange('imageFit', 'fill')}
                                                disabled={!(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ?
                                                    activeDataset?.pointImageConfig?.[0]?.fillSlice :
                                                    activeDataset?.pointImageConfig?.[0]?.fillBar)}
                                            >
                                                <Maximize2 className="h-2.5 w-2.5 mr-1" />
                                                Fill
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`h-7 text-[10px] ${activeDataset?.pointImageConfig?.[0]?.imageFit === 'cover' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
                                                onClick={() => handleGlobalImageConfigChange('imageFit', 'cover')}
                                                disabled={!(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ?
                                                    activeDataset?.pointImageConfig?.[0]?.fillSlice :
                                                    activeDataset?.pointImageConfig?.[0]?.fillBar)}
                                            >
                                                <Crop className="h-2.5 w-2.5 mr-1" />
                                                Cover
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className={`h-7 text-[10px] ${activeDataset?.pointImageConfig?.[0]?.imageFit === 'contain' ? 'bg-blue-100 border-blue-400 text-blue-700' : ''}`}
                                                onClick={() => handleGlobalImageConfigChange('imageFit', 'contain')}
                                                disabled={!(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ?
                                                    activeDataset?.pointImageConfig?.[0]?.fillSlice :
                                                    activeDataset?.pointImageConfig?.[0]?.fillBar)}
                                            >
                                                <Grid className="h-2.5 w-2.5 mr-1" />
                                                Contain
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clear All Button */}
                            <div className="pt-3 border-t border-blue-200">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-8 text-xs border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                                    onClick={() => {
                                        const targetIndices = getTargetDatasetIndices();
                                        targetIndices.forEach(dsIdx => {
                                            const dataset = chartData.datasets[dsIdx];
                                            if (dataset && dataset.data) {
                                                const dataLength = dataset.data.length;
                                                const clearedImages = Array(dataLength).fill(null);
                                                const defaultConfig = getDefaultImageConfigFromStore(chartType as any);
                                                const clearedConfigs = Array(dataLength).fill(null).map(() => ({ ...defaultConfig }));

                                                updateDataset(dsIdx, {
                                                    pointImages: clearedImages,
                                                    pointImageConfig: clearedConfigs,
                                                });
                                            }
                                        });
                                    }}
                                    disabled={
                                        !activeDataset ||
                                        (!activeDataset.pointImages?.some((img: any) => img && img !== '' && img !== null) &&
                                            !activeDataset.pointImageConfig?.some((cfg: any) => {
                                                if (!cfg) return false;
                                                const defaultCfg = getDefaultImageConfigFromStore(chartType as any);
                                                return Object.keys(cfg).some(key => cfg[key] !== defaultCfg[key as keyof typeof defaultCfg]);
                                            }))
                                    }
                                >
                                    <X className="h-3 w-3 mr-1.5" />
                                    Clear All
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
