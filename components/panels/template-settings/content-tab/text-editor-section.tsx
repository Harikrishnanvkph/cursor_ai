import React from "react"
import { useTemplateStore, type TemplateLayout } from "@/lib/template-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Edit3, FileEdit, Palette } from "lucide-react"
import { toast } from "sonner"

// Image compression helper function
const compressImage = (
    file: File,
    maxWidth: number = 800,
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

interface TextEditorSectionProps {
    currentTemplate: TemplateLayout
    selectedTextAreaId: string | null
    setRichEditorContent: (content: string) => void
    setRichEditorOpen: (open: boolean) => void
}

export function TextEditorSection({
    currentTemplate,
    selectedTextAreaId,
    setRichEditorContent,
    setRichEditorOpen
}: TextEditorSectionProps) {
    const updateTextArea = useTemplateStore((state) => state.updateTextArea)
    const selectedTextArea = currentTemplate.textAreas.find(ta => ta.id === selectedTextAreaId)

    if (!selectedTextArea) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Edit3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                            Select a text area from above to edit its content and styling.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const handleTextAreaUpdate = (field: string, value: any) => {
        updateTextArea(selectedTextArea.id, { [field]: value })
    }

    const handleStyleUpdate = (field: string, value: any) => {
        updateTextArea(selectedTextArea.id, {
            style: { ...selectedTextArea.style, [field]: value }
        })
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                    <Edit3 className="h-4 w-4" />
                    Text Editor - {selectedTextArea.type}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {/* Content Type Toggle */}
                <div className="flex items-center justify-between">
                    <Label htmlFor="contentType" className="text-xs">Content Type</Label>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs ${(selectedTextArea.contentType || 'text') === 'text' ? 'font-semibold' : 'text-gray-500'}`}>
                            Text
                        </span>
                        <Switch
                            id="contentType"
                            checked={selectedTextArea.contentType === 'html'}
                            onCheckedChange={(checked) => {
                                handleTextAreaUpdate('contentType', checked ? 'html' : 'text')
                            }}
                        />
                        <span className={`text-xs ${selectedTextArea.contentType === 'html' ? 'font-semibold' : 'text-gray-500'}`}>
                            HTML
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div>
                    <div className="flex items-center justify-between mb-1">
                        <Label htmlFor="content" className="text-xs">
                            Content {selectedTextArea.contentType === 'html' ? '(HTML)' : '(Text)'}
                        </Label>
                        {selectedTextArea.contentType === 'html' && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setRichEditorContent(selectedTextArea.content || '')
                                    setRichEditorOpen(true)
                                }}
                                className="h-6 text-xs"
                            >
                                <FileEdit className="h-3 w-3 mr-1" />
                                Rich Editor
                            </Button>
                        )}
                    </div>
                    <textarea
                        id="content"
                        value={selectedTextArea.content}
                        onChange={(e) => handleTextAreaUpdate('content', e.target.value)}
                        className="w-full mt-1 p-2 border rounded-md text-xs font-mono"
                        rows={selectedTextArea.contentType === 'html' ? 6 : 4}
                        placeholder={
                            selectedTextArea.contentType === 'html'
                                ? 'Enter HTML content...\nExample: <p>Hello <strong>World</strong></p>'
                                : 'Enter text content...'
                        }
                    />
                    {selectedTextArea.contentType === 'html' && (
                        <p className="text-xs text-gray-500 mt-1">
                            HTML is rendered in preview. Use HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, etc.
                        </p>
                    )}
                </div>

                <Separator />

                {/* Text Settings */}
                <div>
                    <Label htmlFor="letterSpacing" className="text-xs">Letter Spacing (px)</Label>
                    <Input
                        id="letterSpacing"
                        type="number"
                        value={selectedTextArea.style.letterSpacing || ''}
                        onChange={(e) => {
                            const val = parseInt(e.target.value)
                            handleStyleUpdate('letterSpacing', isNaN(val) ? 0 : val)
                        }}
                        className="mt-1 h-7 text-xs"
                    />
                </div>

                <Separator />

                {/* Background Settings */}
                <div>
                    <Label className="text-xs font-medium mb-2 flex items-center gap-2">
                        <Palette className="h-3 w-3" />
                        Background
                    </Label>

                    <div className="space-y-3 mt-2">
                        {/* Background Type */}
                        <div>
                            <Label className="text-xs">Background Type</Label>
                            <Select
                                value={selectedTextArea.background?.type || 'transparent'}
                                onValueChange={(value) => handleTextAreaUpdate('background', {
                                    ...selectedTextArea.background,
                                    type: value as 'color' | 'gradient' | 'image' | 'transparent'
                                })}
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
                        {selectedTextArea.background?.type === 'color' && (
                            <div>
                                <Label className="text-xs">Background Color</Label>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        type="color"
                                        value={selectedTextArea.background?.color || '#ffffff'}
                                        onChange={(e) => handleTextAreaUpdate('background', {
                                            ...selectedTextArea.background,
                                            color: e.target.value
                                        })}
                                        className="w-10 h-7 p-1"
                                    />
                                    <Input
                                        type="text"
                                        value={selectedTextArea.background?.color || '#ffffff'}
                                        onChange={(e) => handleTextAreaUpdate('background', {
                                            ...selectedTextArea.background,
                                            color: e.target.value
                                        })}
                                        className="flex-1 h-7 text-xs"
                                        placeholder="#ffffff"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Gradient Background */}
                        {selectedTextArea.background?.type === 'gradient' && (
                            <>
                                <div>
                                    <Label className="text-xs">Gradient Type</Label>
                                    <Select
                                        value={selectedTextArea.background?.gradientType || 'linear'}
                                        onValueChange={(value) => handleTextAreaUpdate('background', {
                                            ...selectedTextArea.background,
                                            gradientType: value as 'linear' | 'radial'
                                        })}
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
                                        value={selectedTextArea.background?.gradientDirection || 'to right'}
                                        onValueChange={(value) => handleTextAreaUpdate('background', {
                                            ...selectedTextArea.background,
                                            gradientDirection: value as any
                                        })}
                                        disabled={selectedTextArea.background?.gradientType === 'radial'}
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
                                            value={selectedTextArea.background?.gradientColor1 || '#ffffff'}
                                            onChange={(e) => handleTextAreaUpdate('background', {
                                                ...selectedTextArea.background,
                                                gradientColor1: e.target.value
                                            })}
                                            className="w-10 h-7 p-1"
                                        />
                                        <Input
                                            type="color"
                                            value={selectedTextArea.background?.gradientColor2 || '#000000'}
                                            onChange={(e) => handleTextAreaUpdate('background', {
                                                ...selectedTextArea.background,
                                                gradientColor2: e.target.value
                                            })}
                                            className="w-10 h-7 p-1"
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Image Background */}
                        {selectedTextArea.background?.type === 'image' && (
                            <>
                                <div>
                                    <Label className="text-xs">Image URL</Label>
                                    <Input
                                        type="text"
                                        value={selectedTextArea.background?.imageUrl || ''}
                                        onChange={(e) => handleTextAreaUpdate('background', {
                                            ...selectedTextArea.background,
                                            imageUrl: e.target.value
                                        })}
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
                                                    const compressedDataUrl = await compressImage(file, 800, 0.85)

                                                    handleTextAreaUpdate('background', {
                                                        ...selectedTextArea.background,
                                                        imageUrl: compressedDataUrl
                                                    });
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
                                        value={selectedTextArea.background?.imageFit || 'cover'}
                                        onValueChange={(value) => handleTextAreaUpdate('background', {
                                            ...selectedTextArea.background,
                                            imageFit: value as any
                                        })}
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
                            </>
                        )}

                        {/* Opacity for all backgrounds (except transparent) */}
                        {selectedTextArea.background?.type !== 'transparent' && selectedTextArea.background?.type !== undefined && (
                            <div>
                                <Label className="text-xs">Opacity</Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={selectedTextArea.background?.opacity || 100}
                                        onChange={(e) => handleTextAreaUpdate('background', {
                                            ...selectedTextArea.background,
                                            opacity: parseInt(e.target.value)
                                        })}
                                        className="flex-1"
                                    />
                                    <span className="text-xs w-12 text-right">{selectedTextArea.background?.opacity || 100}%</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="flex items-center space-x-2 pt-1">
                    <Switch
                        checked={selectedTextArea.visible}
                        onCheckedChange={(checked) => handleTextAreaUpdate('visible', checked)}
                        className="scale-75 cursor-pointer"
                    />
                    <Label className="text-xs cursor-pointer">Visible</Label>
                </div>
            </CardContent>
        </Card>
    )
}
