"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { type ExtendedChartDataset } from "@/lib/chart-store"
import { getDefaultImageSize, getImageOptionsForChartType, getDefaultImageConfig as getDefaultImageConfigFromStore } from "@/lib/plugins/universal-image-plugin"
import { getProxiedImageUrl } from "@/lib/utils/image-proxy-utils"
import { AddImageButton, type AddImageResult } from "@/components/shared/add-image-modal"
import { toast } from "sonner"
import {
    ImageIcon,
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

    const applyGlobalImageUrl = (url: string) => {
        const targetIndices = getTargetDatasetIndices();
        targetIndices.forEach(dsIdx => {
            const dataset = chartData.datasets[dsIdx];
            if (dataset && dataset.data) {
                const newPointImages = dataset.data.map(() => url);
                const newPointImageConfig = dataset.data.map((_: any, pointIndex: number) =>
                    dataset.pointImageConfig?.[pointIndex] || getDefaultImageConfigFromStore(chartType as any)
                );
                updateDataset(dsIdx, {
                    pointImages: newPointImages,
                    pointImageConfig: newPointImageConfig
                });
            }
        });
    };

    const handleAddImageSelect = async (result: AddImageResult) => {
        if (result.source === 'file' && result.file) {
            const file = result.file;
            URL.revokeObjectURL(result.url);

            const {
                compressImage,
                validateImageFile,
                wouldExceedQuota
            } = await import('@/lib/image-utils');

            if (!validateImageFile(file, 10)) {
                toast.error('Invalid image file. Please select an image file under 10MB.');
                return;
            }

            try {
                const compressedImageUrl = await compressImage(file, 600, 600, 0.7, true);
                if (wouldExceedQuota(compressedImageUrl)) {
                    toast.error('Storage quota exceeded. Please remove some images or clear browser storage.');
                    return;
                }
                applyGlobalImageUrl(compressedImageUrl);
            } catch (error) {
                console.error('Error compressing image:', error);
                toast.error('Failed to process image. Please try a smaller file.');
            }
            return;
        }

        if (result.url.trim()) {
            applyGlobalImageUrl(result.url.trim());
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
        const defaultCfg = getDefaultImageConfigFromStore(chartType as any);
        targetIndices.forEach(dsIdx => {
            const dataset = chartData.datasets[dsIdx];
            if (!dataset || !dataset.data) return;

            const newPointImageConfig = dataset.data.map((_: any, pointIndex: number) => {
                const currentConfig = dataset.pointImageConfig?.[pointIndex] || defaultCfg;
                if (typeof keyOrUpdates === 'string') {
                    const nextCfg: any = { ...currentConfig, [keyOrUpdates]: value };
                    if (keyOrUpdates === 'arrowLine' && value === false) {
                        nextCfg.arrowHead = false;
                    }
                    return nextCfg;
                }
                return { ...currentConfig, ...keyOrUpdates };
            });

            updateDataset(dsIdx, { pointImageConfig: newPointImageConfig });
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
        <div className="space-y-3.5">
            {/* Image Management */}
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/80 border-b border-slate-200/70">
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                    <ImageIcon className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                    <h3 className="text-xs font-semibold text-slate-800 tracking-tight">Global Image Settings</h3>
                </div>

                <div className="bg-slate-50/40 p-3 space-y-3">
                    {/* Image Preview Section */}
                    {previewImageUrl && (
                        <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
                            <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Preview</Label>
                            <div className="relative aspect-square w-full max-w-[112px] mx-auto rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                                <img
                                    src={getProxiedImageUrl(previewImageUrl)}
                                    alt="Preview"
                                    crossOrigin="anonymous"
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
                            <div className="space-y-1.5 pb-2.5 border-b border-slate-200/70">
                                <Label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Apply Images To</Label>
                                <Select value={selectedGroupDataset} onValueChange={setSelectedGroupDataset}>
                                    <SelectTrigger className="h-8 text-xs border-slate-200 focus:border-blue-500 bg-white rounded-lg">
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

                        {/* Add Image Section */}
                        <div className="flex gap-1.5">
                            <AddImageButton
                                onSelectImage={handleAddImageSelect}
                                className="flex-1 h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg"
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-2.5 text-xs border-slate-200 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-lg cursor-pointer shrink-0"
                                onClick={() => {
                                    const targetIndices = getTargetDatasetIndices();
                                    const defaultCfg = getDefaultImageConfigFromStore(chartType as any);
                                    targetIndices.forEach(dsIdx => {
                                        const dataset = chartData.datasets[dsIdx];
                                        if (dataset && dataset.data) {
                                            updateDataset(dsIdx, {
                                                pointImages: dataset.data.map(() => ''),
                                                pointImageConfig: dataset.data.map(() => ({ ...defaultCfg })),
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

                        {/* Configuration Section */}
                        <div className="space-y-2.5 pt-2.5 border-t border-slate-200/80">
                            <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Configuration</Label>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs font-medium text-slate-600">Shape</Label>
                                    <Select
                                        value={selectedImageType}
                                        onValueChange={(value) => {
                                            setSelectedImageType(value);
                                            handleGlobalImageConfigChange('type', value);
                                        }}
                                    >
                                        <SelectTrigger className="h-7 text-xs border-slate-200 bg-white focus:border-blue-500 rounded-lg">
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
                                    <Label className="text-xs font-medium text-slate-600">Size (px)</Label>
                                    <Input
                                        type="number"
                                        value={activeDataset?.pointImageConfig?.[0]?.size === '' || Number.isNaN(activeDataset?.pointImageConfig?.[0]?.size as number) ? 0 : (activeDataset?.pointImageConfig?.[0]?.size ?? getDefaultImageSize(chartType as any))}
                                        className="h-7 text-xs border-slate-200 bg-white focus:border-blue-500 rounded-lg"
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
                                    <Label className="text-xs font-medium text-slate-600">Position</Label>
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
                                    <SelectTrigger className="h-7 text-xs border-slate-200 bg-white focus:border-blue-500 rounded-lg">
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
                                <div className="space-y-2 pt-2.5 border-t border-slate-200/80">
                                    <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Arrow Settings</Label>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-600">Border Width</Label>
                                            <Input
                                                type="number"
                                                value={activeDataset?.pointImageConfig?.[0]?.borderWidth === '' || Number.isNaN(activeDataset?.pointImageConfig?.[0]?.borderWidth as number) ? 0 : (activeDataset?.pointImageConfig?.[0]?.borderWidth ?? 3)}
                                                className="h-7 text-xs border-slate-200 bg-white focus:border-blue-500 rounded-lg"
                                                placeholder="3"
                                                min={0}
                                                max={10}
                                                step={1}
                                                onChange={(e) => handleGlobalImageConfigChange('borderWidth', e.target.value === '' ? 0 : parseInt(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-medium text-slate-600">Border Color</Label>
                                            <div className="flex items-center gap-1.5">
                                                <Input
                                                    type="color"
                                                    value={activeDataset?.pointImageConfig?.[0]?.borderColor || '#ffffff'}
                                                    className="h-7 w-12 p-0.5 border border-slate-200 bg-white rounded-lg cursor-pointer"
                                                    onChange={(e) => handleGlobalImageConfigChange('borderColor', e.target.value)}
                                                />
                                                <Input
                                                    value={activeDataset?.pointImageConfig?.[0]?.borderColor || '#ffffff'}
                                                    className="h-7 text-xs flex-1 border-slate-200 bg-white focus:border-blue-500 rounded-lg font-mono text-[10px]"
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
                                            <Label className="text-xs font-medium text-slate-700">Arrow Line</Label>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Switch
                                                checked={activeDataset?.pointImageConfig?.[0]?.arrowHead !== false}
                                                onCheckedChange={(checked) => handleGlobalImageConfigChange('arrowHead', checked)}
                                                disabled={activeDataset?.pointImageConfig?.[0]?.arrowLine === false}
                                                className="scale-75"
                                            />
                                            <Label className="text-xs font-medium text-slate-700">Arrow Head</Label>
                                        </div>
                                    </div>

                                    {activeDataset?.pointImageConfig?.[0]?.arrowLine !== false && (
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-600">Arrow Color</Label>
                                                <Input
                                                    type="color"
                                                    value={activeDataset?.pointImageConfig?.[0]?.arrowColor || '#666666'}
                                                    className="h-7 w-full p-0.5 border border-slate-200 bg-white rounded-lg cursor-pointer"
                                                    onChange={(e) => handleGlobalImageConfigChange('arrowColor', e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-medium text-slate-600">Gap (px)</Label>
                                                <Input
                                                    type="number"
                                                    value={activeDataset?.pointImageConfig?.[0]?.arrowEndGap === '' || Number.isNaN(activeDataset?.pointImageConfig?.[0]?.arrowEndGap as number) ? 0 : (activeDataset?.pointImageConfig?.[0]?.arrowEndGap ?? 8)}
                                                    className="h-7 text-xs border-slate-200 bg-white focus:border-blue-500 rounded-lg"
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
                                <div className="space-y-2 pt-2.5 border-t border-slate-200/80">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
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
                                        <Label className="text-xs font-medium text-slate-600">Image Fit</Label>
                                        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 border border-slate-200/70 rounded-xl">
                                            <button
                                                type="button"
                                                className={`h-7 text-[10px] rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${activeDataset?.pointImageConfig?.[0]?.imageFit === 'fill' ? 'bg-white text-blue-600 font-semibold shadow-xs ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-800 font-medium'}`}
                                                onClick={() => handleGlobalImageConfigChange('imageFit', 'fill')}
                                                disabled={!(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ?
                                                    activeDataset?.pointImageConfig?.[0]?.fillSlice :
                                                    activeDataset?.pointImageConfig?.[0]?.fillBar)}
                                            >
                                                <Maximize2 className="h-2.5 w-2.5 mr-1" />
                                                Fill
                                            </button>
                                            <button
                                                type="button"
                                                className={`h-7 text-[10px] rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${activeDataset?.pointImageConfig?.[0]?.imageFit === 'cover' ? 'bg-white text-blue-600 font-semibold shadow-xs ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-800 font-medium'}`}
                                                onClick={() => handleGlobalImageConfigChange('imageFit', 'cover')}
                                                disabled={!(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ?
                                                    activeDataset?.pointImageConfig?.[0]?.fillSlice :
                                                    activeDataset?.pointImageConfig?.[0]?.fillBar)}
                                            >
                                                <Crop className="h-2.5 w-2.5 mr-1" />
                                                Cover
                                            </button>
                                            <button
                                                type="button"
                                                className={`h-7 text-[10px] rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${activeDataset?.pointImageConfig?.[0]?.imageFit === 'contain' ? 'bg-white text-blue-600 font-semibold shadow-xs ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-800 font-medium'}`}
                                                onClick={() => handleGlobalImageConfigChange('imageFit', 'contain')}
                                                disabled={!(['pie', 'doughnut', 'polarArea', 'pie3d', 'doughnut3d'].includes(chartType) ?
                                                    activeDataset?.pointImageConfig?.[0]?.fillSlice :
                                                    activeDataset?.pointImageConfig?.[0]?.fillBar)}
                                            >
                                                <Grid className="h-2.5 w-2.5 mr-1" />
                                                Contain
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Clear All Button */}
                            <div className="pt-2.5 border-t border-slate-200/80">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full h-8 text-xs border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-lg cursor-pointer"
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
