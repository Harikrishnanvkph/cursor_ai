import React from "react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Palette } from "lucide-react"
import { toast } from "sonner"

// Image compression helper function
const compressImage = (
    file: File,
    maxWidth: number = 1200,
    quality: number = 0.85
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                let width = img.width
                let height = img.height

                if (width > maxWidth) {
                    height = (height * maxWidth) / width
                    width = maxWidth
                }

                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')

                if (ctx) {
                    ctx.imageSmoothingEnabled = true
                    ctx.imageSmoothingQuality = 'high'
                    ctx.drawImage(img, 0, 0, width, height)
                }

                const format = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
                const compressedDataUrl = canvas.toDataURL(format, quality)
                resolve(compressedDataUrl)
            }
            img.onerror = () => reject(new Error('Failed to load image'))
            img.src = e.target?.result as string
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
    })
}

interface BackgroundSectionProps {
    currentTemplate: TemplateLayout
}

export function BackgroundSection({ currentTemplate }: BackgroundSectionProps) {
    const updateTemplate = useTemplateStore((state) => state.updateTemplate)

    const handleUpdate = (field: string, value: any) => {
        updateTemplate(currentTemplate.id, {
            background: {
                ...currentTemplate.background,
                [field]: value
            } as any
        })
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Template Background
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Background Type */}
                <div>
                    <Label className="text-xs font-medium">Background Type</Label>
                    <Select
                        value={currentTemplate.background?.type || 'transparent'}
                        onValueChange={(value) => handleUpdate('type', value as any)}
                    >
                        <SelectTrigger className="h-7 text-xs mt-1">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="transparent">Transparent</SelectItem>
                            <SelectItem value="color">Color</SelectItem>
                            <SelectItem value="gradient">Gradient</SelectItem>
                            <SelectItem value="image">Image</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Color Background */}
                {currentTemplate.background?.type === 'color' && (
                    <>
                        <div>
                            <Label className="text-xs">Background Color</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    type="color"
                                    value={currentTemplate.background?.color || '#ffffff'}
                                    onChange={(e) => handleUpdate('color', e.target.value)}
                                    className="w-10 h-7 p-1"
                                />
                                <Input
                                    type="text"
                                    value={currentTemplate.background?.color || '#ffffff'}
                                    onChange={(e) => handleUpdate('color', e.target.value)}
                                    className="flex-1 h-7 text-xs"
                                    placeholder="#ffffff"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">Opacity</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={currentTemplate.background?.opacity || 100}
                                    onChange={(e) => handleUpdate('opacity', parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs w-12 text-right">
                                    {currentTemplate.background?.opacity || 100}%
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* Gradient Background */}
                {currentTemplate.background?.type === 'gradient' && (
                    <>
                        <div>
                            <Label className="text-xs">Gradient Type</Label>
                            <Select
                                value={currentTemplate.background?.gradientType || 'linear'}
                                onValueChange={(value) => handleUpdate('gradientType', value as 'linear' | 'radial')}
                            >
                                <SelectTrigger className="h-7 text-xs mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="linear">Linear</SelectItem>
                                    <SelectItem value="radial">Radial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Gradient Direction</Label>
                            <Select
                                value={currentTemplate.background?.gradientDirection || 'to right'}
                                onValueChange={(value) => handleUpdate('gradientDirection', value as any)}
                                disabled={currentTemplate.background?.gradientType === 'radial'}
                            >
                                <SelectTrigger className="h-7 text-xs mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="to right">Left → Right</SelectItem>
                                    <SelectItem value="to left">Right → Left</SelectItem>
                                    <SelectItem value="to bottom">Top → Bottom</SelectItem>
                                    <SelectItem value="to top">Bottom → Top</SelectItem>
                                    <SelectItem value="135deg">Diagonal (135°)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Gradient Colors</Label>
                            <div className="flex gap-2 mt-1">
                                <Input
                                    type="color"
                                    value={currentTemplate.background?.gradientColor1 || '#ffffff'}
                                    onChange={(e) => handleUpdate('gradientColor1', e.target.value)}
                                    className="w-10 h-7 p-1"
                                />
                                <Input
                                    type="color"
                                    value={currentTemplate.background?.gradientColor2 || '#000000'}
                                    onChange={(e) => handleUpdate('gradientColor2', e.target.value)}
                                    className="w-10 h-7 p-1"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">Opacity</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={currentTemplate.background?.opacity || 100}
                                    onChange={(e) => handleUpdate('opacity', parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs w-12 text-right">
                                    {currentTemplate.background?.opacity || 100}%
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {/* Image Background */}
                {currentTemplate.background?.type === 'image' && (
                    <>
                        <div>
                            <Label className="text-xs">Image URL</Label>
                            <Input
                                type="text"
                                value={currentTemplate.background?.imageUrl || ''}
                                onChange={(e) => handleUpdate('imageUrl', e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="h-7 text-xs mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-xs">Upload Image</Label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            toast.info('Compressing image...', { duration: 1000 })
                                            const compressedDataUrl = await compressImage(file, 1200, 0.85)
                                            handleUpdate('imageUrl', compressedDataUrl)
                                            toast.success('Image uploaded successfully!')
                                        } catch (error: any) {
                                            console.error('Image compression failed:', error)
                                            toast.error(error.message || 'Failed to process image')
                                            e.target.value = ''
                                        }
                                    }
                                }}
                                className="h-7 text-xs mt-1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Images will be automatically compressed and resized.
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs">Image Fit</Label>
                            <Select
                                value={currentTemplate.background?.imageFit || 'cover'}
                                onValueChange={(value) => handleUpdate('imageFit', value as any)}
                            >
                                <SelectTrigger className="h-7 text-xs mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="fill">Fill</SelectItem>
                                    <SelectItem value="contain">Contain</SelectItem>
                                    <SelectItem value="cover">Cover</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Opacity</Label>
                            <div className="flex items-center gap-2 mt-1">
                                <Input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={currentTemplate.background?.opacity || 100}
                                    onChange={(e) => handleUpdate('opacity', parseInt(e.target.value))}
                                    className="flex-1"
                                />
                                <span className="text-xs w-12 text-right">
                                    {currentTemplate.background?.opacity || 100}%
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
