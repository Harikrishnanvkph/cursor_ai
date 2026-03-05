"use client"

import React, { useRef } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Image as ImageIcon, Upload, Square, Circle, Eye, EyeOff, Trash2 } from "lucide-react"
import { useChartStore, type OverlayImage } from "@/lib/chart-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { useToast } from "@/hooks/use-toast"
import { OverlayHeader } from "./components/OverlayHeader"
import { OverlayClearDialog } from "./components/OverlayClearDialog"

export function ImageOverlaysTab() {
    const {
        overlayImages,
        addOverlayImage,
        updateOverlayImage,
        removeOverlayImage,
    } = useChartStore()

    const {
        selectedImageId,
        setSelectedImageId,
    } = useUIStore()

    const { toast } = useToast()
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [showClearImagesDialog, setShowClearImagesDialog] = React.useState(false)

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files) return

        Array.from(files).forEach((file, index) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                const url = e.target?.result as string
                addOverlayImage({
                    url,
                    x: 50 + index * 10,
                    y: 50 + index * 10,
                    width: 120,
                    height: 120,
                    useNaturalSize: true,
                    visible: true,
                    borderWidth: 2,
                    borderColor: "#000000",
                    shape: 'rectangle',
                    imageFit: 'fill',
                    zIndex: 1 + index
                })
            }
            reader.readAsDataURL(file)
        })
        event.target.value = ''
    }

    return (
        <div className="space-y-4">
            {/* Add Image Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Add Image
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <Label className="text-xs text-gray-600 mb-2 block">Upload from file</Label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={() => fileInputRef.current?.click()}
                                variant="outline"
                                size="sm"
                                className="flex-1"
                            >
                                <Upload className="h-4 w-4 mr-2" />
                                Choose Images
                            </Button>
                            <Button
                                onClick={() => {
                                    addOverlayImage({
                                        url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzVmZiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VEVTVDwvdGV4dD48L3N2Zz4=',
                                        x: 50,
                                        y: 50,
                                        width: 100,
                                        height: 100,
                                        useNaturalSize: false,
                                        visible: true,
                                        borderWidth: 2,
                                        borderColor: "#000000",
                                        shape: 'rectangle',
                                        zIndex: 1
                                    })
                                }}
                                variant="default"
                                size="sm"
                            >
                                Test
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs text-gray-600 mb-2 block">Add from URL</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter image URL (https://...)"
                                className="h-8 flex-1"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        const url = e.currentTarget.value.trim()
                                        if (url) {
                                            addOverlayImage({
                                                url, x: 50, y: 50, width: 120, height: 120,
                                                useNaturalSize: true, visible: true, borderWidth: 2,
                                                borderColor: "#000000", shape: 'rectangle', imageFit: 'fill', zIndex: 1
                                            })
                                            e.currentTarget.value = ''
                                        }
                                    }
                                }}
                            />
                            <Button
                                onClick={() => {
                                    const urlInput = document.querySelector('input[placeholder="Enter image URL (https://...)"]') as HTMLInputElement
                                    const url = urlInput?.value.trim()
                                    if (url) {
                                        addOverlayImage({
                                            url, x: 50, y: 50, width: 120, height: 120,
                                            useNaturalSize: true, visible: true, borderWidth: 2,
                                            borderColor: "#000000", shape: 'rectangle', imageFit: 'fill', zIndex: 1
                                        })
                                        urlInput.value = ''
                                    }
                                }}
                                variant="outline"
                                size="sm"
                                className="px-3"
                            >
                                Add
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Image List */}
            <div className="space-y-2">
                {(selectedImageId || overlayImages.length > 0) && (
                    <div className="flex justify-between items-center px-1 py-1">
                        <span className="text-xs text-gray-400 font-medium">{overlayImages.length} {overlayImages.length === 1 ? 'image' : 'images'}</span>
                        <div className="flex gap-1.5">
                            {selectedImageId && (
                                <Button size="sm" variant="ghost" onClick={() => setSelectedImageId(null)} className="text-xs h-6 px-2 text-gray-500">
                                    Deselect
                                </Button>
                            )}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowClearImagesDialog(true)}
                                className="text-xs h-6 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                            >
                                Clear all
                            </Button>

                            <OverlayClearDialog
                                open={showClearImagesDialog}
                                onOpenChange={setShowClearImagesDialog}
                                title="Clear all images?"
                                description={`This will permanently remove all ${overlayImages.length} images from your chart. This action cannot be undone.`}
                                count={overlayImages.length}
                                onConfirm={() => {
                                    const count = overlayImages.length;
                                    [...overlayImages].forEach(img => removeOverlayImage(img.id));
                                    setSelectedImageId(null);
                                    toast({ title: "Images Cleared", description: `All ${count} images have been removed.` });
                                    setShowClearImagesDialog(false);
                                }}
                            />
                        </div>
                    </div>
                )}

                {[...overlayImages]
                    .sort((a, b) => (a.id === selectedImageId ? -1 : b.id === selectedImageId ? 1 : 0))
                    .map((image) => {
                        const originalIndex = overlayImages.findIndex(i => i.id === image.id);
                        const isSelected = selectedImageId === image.id;
                        return (
                            <Card
                                key={image.id}
                                className={`transition-all duration-200 ${isSelected
                                    ? 'ring-2 ring-blue-500 border-blue-300 shadow-md'
                                    : 'border-gray-100 hover:border-gray-200 shadow-sm'
                                    }`}
                            >
                                <OverlayHeader
                                    isSelected={isSelected}
                                    onToggleExpand={() => setSelectedImageId(isSelected ? null : image.id)}
                                    visualPreview={
                                        <div
                                            className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden"
                                            style={image.url ? { backgroundImage: `url(${image.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                                        >
                                            {!image.url && <ImageIcon className="h-3.5 w-3.5 m-auto mt-1 text-gray-400" />}
                                        </div>
                                    }
                                    label={`Image ${originalIndex + 1}`}
                                    typeBadge={image.shape || 'rect'}
                                    isVisible={image.visible}
                                    onToggleVisibility={() => updateOverlayImage(image.id, { visible: !image.visible })}
                                    onDelete={() => removeOverlayImage(image.id)}
                                />

                                {isSelected && (
                                    <CardContent className="space-y-4 pt-3 pb-4">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">X Position</Label>
                                                <Input type="number" value={image.x} onChange={(e) => updateOverlayImage(image.id, { x: parseInt(e.target.value) || 0 })} className="h-8" />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Y Position</Label>
                                                <Input type="number" value={image.y} onChange={(e) => updateOverlayImage(image.id, { y: parseInt(e.target.value) || 0 })} className="h-8" />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center space-x-2 mb-3">
                                                <Switch id={`natural-size-${image.id}`} checked={image.useNaturalSize} onCheckedChange={(checked) => updateOverlayImage(image.id, { useNaturalSize: checked })} />
                                                <Label htmlFor={`natural-size-${image.id}`} className="text-xs">Use Natural Size</Label>
                                            </div>
                                            {!image.useNaturalSize && (
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div>
                                                        <Label className="text-xs">Width</Label>
                                                        <Input type="number" value={image.width} onChange={(e) => updateOverlayImage(image.id, { width: parseInt(e.target.value) || 0 })} className="h-8" />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Height</Label>
                                                        <Input type="number" value={image.height} onChange={(e) => updateOverlayImage(image.id, { height: parseInt(e.target.value) || 0 })} className="h-8" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <Label className="text-xs">Shape</Label>
                                            <Select value={image.shape} onValueChange={(value: 'rectangle' | 'circle' | 'rounded') => updateOverlayImage(image.id, { shape: value, imageFit: value === 'circle' ? 'cover' : 'fill' })}>
                                                <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="rectangle"><div className="flex items-center gap-2"><Square className="h-4 w-4" /> Rectangle</div></SelectItem>
                                                    <SelectItem value="circle"><div className="flex items-center gap-2"><Circle className="h-4 w-4" /> Circle</div></SelectItem>
                                                    <SelectItem value="rounded"><div className="flex items-center gap-2"><Square className="h-4 w-4" /> Rounded</div></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-xs">Image Fit</Label>
                                            <div className="flex gap-1 mt-2">
                                                {['fill', 'cover', 'contain'].map((fit) => (
                                                    <Button key={fit} size="sm" variant={image.imageFit === fit ? 'default' : 'outline'} onClick={() => updateOverlayImage(image.id, { imageFit: fit as any })} className="flex-1 text-xs capitalize">{fit}</Button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <Label className="text-xs">Border Width</Label>
                                            <Slider value={[image.borderWidth]} onValueChange={([v]) => updateOverlayImage(image.id, { borderWidth: v })} max={10} step={1} className="mt-2" />
                                        </div>

                                        {image.borderWidth > 0 && (
                                            <div>
                                                <Label className="text-xs">Border Color</Label>
                                                <Input type="color" value={image.borderColor} onChange={(e) => updateOverlayImage(image.id, { borderColor: e.target.value })} className="h-8 w-full" />
                                            </div>
                                        )}

                                        <div>
                                            <Label className="text-xs">Layer Order</Label>
                                            <Input type="number" value={image.zIndex} onChange={(e) => updateOverlayImage(image.id, { zIndex: parseInt(e.target.value) || 1 })} className="h-8" />
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        );
                    })
                }

                {overlayImages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No overlay images added</p>
                    </div>
                )}
            </div>
        </div>
    )
}
