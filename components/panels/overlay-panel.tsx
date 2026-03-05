"use client"

import { useChartStore, type OverlayImage, type OverlayText, type OverlayShape } from "@/lib/chart-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Image, Type, Upload, Trash2, Eye, EyeOff, Square, Circle, Layers, MousePointer, Hexagon, Star, Cloud, Minus, ArrowRight, ArrowLeftRight, PenTool, ChevronDown } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

export function OverlayPanel() {
  const {
    overlayImages,
    overlayTexts,
    addOverlayImage,
    updateOverlayImage,
    removeOverlayImage,
    addOverlayText,
    updateOverlayText,
    removeOverlayText,
    overlayShapes,
    addOverlayShape,
    updateOverlayShape,
    removeOverlayShape,
    clearOverlayShapes,
  } = useChartStore()

  const {
    selectedImageId,
    selectedTextId,
    selectedShapeId,
    setSelectedImageId,
    setSelectedTextId,
    setSelectedShapeId,
    isDrawingMode,
    setDrawingMode,
    defaultDrawingColor,
    setDefaultDrawingColor,
    defaultDrawingThickness,
    setDefaultDrawingThickness,
    defaultDrawingStyle,
    setDefaultDrawingStyle
  } = useUIStore()

  const { toast } = useToast()

  // Ensure all images have imageFit property
  useEffect(() => {
    overlayImages.forEach(image => {
      if (image.imageFit === undefined) {
        updateOverlayImage(image.id, {
          imageFit: image.shape === 'circle' ? 'cover' : 'fill'
        })
      }
    })
  }, [overlayImages, updateOverlayImage])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newText, setNewText] = useState("")
  const [isAddShapeOpen, setIsAddShapeOpen] = useState(false)

  // Dialog states for Clear All confirmation
  const [showClearImagesDialog, setShowClearImagesDialog] = useState(false)
  const [showClearTextsDialog, setShowClearTextsDialog] = useState(false)
  const [showClearShapesDialog, setShowClearShapesDialog] = useState(false)

  // Add keyboard support for ESC key to deselect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedImageId) setSelectedImageId(null)
        if (selectedTextId) setSelectedTextId(null)
        if (selectedShapeId) setSelectedShapeId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageId, selectedTextId, selectedShapeId, setSelectedImageId, setSelectedTextId, setSelectedShapeId])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) {
      return
    }

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const url = e.target?.result as string

        addOverlayImage({
          url,
          x: 50 + index * 10, // Offset each image slightly
          y: 50 + index * 10,
          width: 120, // Fallback size, will be replaced by natural size
          height: 120, // Fallback size, will be replaced by natural size
          useNaturalSize: true, // Use image's natural dimensions
          visible: true,
          borderWidth: 2,
          borderColor: "#000000", // Black border as default
          shape: 'rectangle',
          imageFit: 'fill', // Default for rectangles
          zIndex: 1 + index
        })
      }

      reader.onerror = (e) => {
        console.error('❌ FileReader error:', e)
      }

      reader.readAsDataURL(file)
    })

    // Clear the input to allow re-uploading the same file
    event.target.value = ''
  }

  const handleAddText = () => {
    if (!newText.trim()) return

    addOverlayText({
      text: newText,
      x: 150,
      y: 150,
      fontSize: 16,
      fontFamily: 'Arial',
      color: '#000000',
      backgroundColor: '#ffffff',
      backgroundTransparent: true,
      borderWidth: 0,
      borderColor: '#000000',
      paddingX: 8,
      paddingY: 4,
      visible: true,
      rotation: 0,
      zIndex: 1,
      maxWidth: 200 // Default max width for text wrapping
    })
    setNewText("")
  }

  type ShapeGroup = {
    label: string;
    shapes: { type: OverlayShape['type']; label: string; icon?: React.ElementType; textLabel?: string }[];
  };

  const shapeGroups: ShapeGroup[] = [
    {
      label: 'Basic',
      shapes: [
        { type: 'rectangle', label: 'Rectangle', icon: Square },
        { type: 'square', label: 'Square', icon: Square },
        { type: 'circle', label: 'Circle', icon: Circle },
        { type: 'cloud', label: 'Cloud', icon: Cloud },
        { type: 'star', label: 'Star', icon: Star },
      ]
    },
    {
      label: 'Polygons',
      shapes: [
        { type: 'triangle', label: 'Triangle', textLabel: '△' },
        { type: 'pentagon', label: 'Pentagon', textLabel: '⬠' },
        { type: 'hexagon', label: 'Hexagon', icon: Hexagon },
        { type: 'octagon', label: 'Octagon', textLabel: '⬡' },
        { type: 'diamond', label: 'Diamond', textLabel: '◇' },
      ]
    },
    {
      label: 'Symbols',
      shapes: [
        { type: 'heart', label: 'Heart', textLabel: '♡' },
        { type: 'cross', label: 'Cross', textLabel: '✚' },
        { type: 'speechBubble', label: 'Speech Bubble', textLabel: '💬' },
      ]
    },
    {
      label: 'Arrows',
      shapes: [
        { type: 'arrowUp', label: 'Arrow Up', textLabel: '⬆' },
        { type: 'arrowDown', label: 'Arrow Down', textLabel: '⬇' },
        { type: 'line', label: 'Line', icon: Minus },
        { type: 'lineArrow', label: 'Arrow', icon: ArrowRight },
        { type: 'lineDoubleArrow', label: 'Double Arrow', icon: ArrowLeftRight },
      ]
    },
    {
      label: 'Numbers',
      shapes: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => ({ type: n as OverlayShape['type'], label: n, textLabel: n }))
    }
  ];

  const handleAddShape = (type: OverlayShape['type']) => {
    const isLine = type === 'line' || type === 'lineArrow' || type === 'lineDoubleArrow';
    addOverlayShape({
      type,
      x: 100,
      y: 100,
      width: 100,
      height: isLine ? 2 : 100,
      rotation: 0,
      skewX: 0,
      skewY: 0,
      fillColor: isLine ? 'transparent' : 'rgba(0, 119, 204, 0.5)',
      borderColor: '#007acc',
      borderWidth: 2,
      visible: true,
      zIndex: 1
    })
  }

  return (
    <div className="h-full flex flex-col">


      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="shapes" className="flex items-center gap-2">
              <Hexagon className="h-4 w-4" />
              Shapes
            </TabsTrigger>
          </TabsList>

          {/* Image Overlays Tab */}
          <TabsContent value="images" className="space-y-4">
            {/* Add Image Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Add Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Upload from file */}
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
                          useNaturalSize: false, // Test image should use specified size
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

                {/* Add from URL */}
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
                              url,
                              x: 50,
                              y: 50,
                              width: 120,
                              height: 120,
                              useNaturalSize: true,
                              visible: true,
                              borderWidth: 2,
                              borderColor: "#000000",
                              shape: 'rectangle',
                              imageFit: 'fill', // Default for rectangles
                              zIndex: 1
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
                            url,
                            x: 50,
                            y: 50,
                            width: 120,
                            height: 120,
                            useNaturalSize: true,
                            visible: true,
                            borderWidth: 2,
                            borderColor: "#000000",
                            shape: 'rectangle',
                            imageFit: 'fill', // Default for rectangles
                            zIndex: 1
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

                    <AlertDialog open={showClearImagesDialog} onOpenChange={setShowClearImagesDialog}>
                      <AlertDialogContent className="max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all images?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove all {overlayImages.length} images from your chart. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const count = overlayImages.length;
                              [...overlayImages].forEach(img => removeOverlayImage(img.id));
                              setSelectedImageId(null);
                              toast({
                                title: "Images Cleared",
                                description: `All ${count} images have been removed.`,
                              });
                              setShowClearImagesDialog(false);
                            }}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                          >
                            Clear All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
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
                      {/* Compact modern header */}
                      <div
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-t-lg ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedImageId(isSelected ? null : image.id)}
                      >
                        {/* Thumbnail */}
                        <div
                          className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden"
                          style={image.url ? { backgroundImage: `url(${image.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                        >
                          {!image.url && <Image className="h-3.5 w-3.5 m-auto mt-1 text-gray-400" />}
                        </div>
                        {/* Name */}
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                          Image {originalIndex + 1}
                        </span>
                        {/* Shape badge */}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono leading-none flex-shrink-0">
                          {image.shape || 'rect'}
                        </span>
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 ml-1" onClick={e => e.stopPropagation()}>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => updateOverlayImage(image.id, { visible: !image.visible })}
                            title={image.visible ? 'Hide' : 'Show'}
                          >
                            {image.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            onClick={() => removeOverlayImage(image.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {isSelected && (
                        <CardContent className="space-y-4 pt-3 pb-4">
                          {/* Position */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">X Position</Label>
                              <Input
                                type="number"
                                value={image.x}
                                onChange={(e) => updateOverlayImage(image.id, { x: parseInt(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Y Position</Label>
                              <Input
                                type="number"
                                value={image.y}
                                onChange={(e) => updateOverlayImage(image.id, { y: parseInt(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                          </div>

                          {/* Size */}
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <Switch
                                id={`natural-size-${image.id}`}
                                checked={image.useNaturalSize}
                                onCheckedChange={(checked) => updateOverlayImage(image.id, { useNaturalSize: checked })}
                              />
                              <Label htmlFor={`natural-size-${image.id}`} className="text-xs">Use Natural Size</Label>
                              {image.naturalWidth && image.naturalHeight && (
                                <span className="text-xs text-gray-500">
                                  ({image.naturalWidth}×{image.naturalHeight}px)
                                </span>
                              )}
                            </div>

                            {!image.useNaturalSize && (
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Width</Label>
                                  <Input
                                    type="number"
                                    value={image.width}
                                    onChange={(e) => updateOverlayImage(image.id, { width: parseInt(e.target.value) || 0 })}
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs">Height</Label>
                                  <Input
                                    type="number"
                                    value={image.height}
                                    onChange={(e) => updateOverlayImage(image.id, { height: parseInt(e.target.value) || 0 })}
                                    className="h-8"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Shape */}
                          <div>
                            <Label className="text-xs">Shape</Label>
                            <Select
                              value={image.shape}
                              onValueChange={(value: 'rectangle' | 'circle' | 'rounded') =>
                                updateOverlayImage(image.id, {
                                  shape: value,
                                  imageFit: value === 'circle' ? 'cover' : 'fill'
                                })
                              }
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="rectangle">
                                  <div className="flex items-center gap-2">
                                    <Square className="h-4 w-4" /> Rectangle
                                  </div>
                                </SelectItem>
                                <SelectItem value="circle">
                                  <div className="flex items-center gap-2">
                                    <Circle className="h-4 w-4" /> Circle
                                  </div>
                                </SelectItem>
                                <SelectItem value="rounded">
                                  <div className="flex items-center gap-2">
                                    <Square className="h-4 w-4" /> Rounded Rectangle
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Image Fit */}
                          <div>
                            <Label className="text-xs">Image Fit</Label>
                            <div className="flex gap-1 mt-2">
                              <Button size="sm" variant={image.imageFit === 'fill' ? 'default' : 'outline'} onClick={() => updateOverlayImage(image.id, { imageFit: 'fill' })} className="flex-1 text-xs">Fill</Button>
                              <Button size="sm" variant={image.imageFit === 'cover' ? 'default' : 'outline'} onClick={() => updateOverlayImage(image.id, { imageFit: 'cover' })} className="flex-1 text-xs">Cover</Button>
                              <Button size="sm" variant={image.imageFit === 'contain' ? 'default' : 'outline'} onClick={() => updateOverlayImage(image.id, { imageFit: 'contain' })} className="flex-1 text-xs">Contain</Button>
                            </div>
                          </div>

                          {/* Border */}
                          <div>
                            <Label className="text-xs">Border Width</Label>
                            <Slider
                              value={[image.borderWidth]}
                              onValueChange={([value]) => updateOverlayImage(image.id, { borderWidth: value })}
                              max={10}
                              step={1}
                              className="mt-2"
                            />
                            <div className="text-xs text-gray-500 mt-1">{image.borderWidth}px</div>
                          </div>

                          {image.borderWidth > 0 && (
                            <div>
                              <Label className="text-xs">Border Color</Label>
                              <Input
                                type="color"
                                value={image.borderColor}
                                onChange={(e) => updateOverlayImage(image.id, { borderColor: e.target.value })}
                                className="h-8 w-full"
                              />
                            </div>
                          )}

                          {/* Layer Order */}
                          <div>
                            <Label className="text-xs">Layer Order</Label>
                            <Input
                              type="number"
                              value={image.zIndex}
                              onChange={(e) => updateOverlayImage(image.id, { zIndex: parseInt(e.target.value) || 1 })}
                              className="h-8"
                            />
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              }

              {overlayImages.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Image className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No overlay images added</p>
                  <p className="text-sm">Upload images to get started</p>
                </div>
              )}
            </div>

          </TabsContent>

          {/* Text Overlays Tab */}
          <TabsContent value="text" className="space-y-4">
            {/* Add Text Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Add Text
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text to add... (use Enter for new lines)"
                    className="min-h-[80px] resize-none"
                    rows={3}
                  />
                  <Button onClick={handleAddText} disabled={!newText.trim()}>
                    Add Text
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Text List */}
            <div className="space-y-2">
              {(selectedTextId || overlayTexts.length > 0) && (
                <div className="flex justify-between items-center px-1 py-1">
                  <span className="text-xs text-gray-400 font-medium">{overlayTexts.length} {overlayTexts.length === 1 ? 'text' : 'texts'}</span>
                  <div className="flex gap-1.5">
                    {selectedTextId && (
                      <Button size="sm" variant="ghost" onClick={() => setSelectedTextId(null)} className="text-xs h-6 px-2 text-gray-500">
                        Deselect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowClearTextsDialog(true)}
                      className="text-xs h-6 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      Clear all
                    </Button>

                    <AlertDialog open={showClearTextsDialog} onOpenChange={setShowClearTextsDialog}>
                      <AlertDialogContent className="max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all text?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove all {overlayTexts.length} text overlays from your chart. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const count = overlayTexts.length;
                              [...overlayTexts].forEach(t => removeOverlayText(t.id));
                              setSelectedTextId(null);
                              toast({
                                title: "Text Cleared",
                                description: `All ${count} text overlays have been removed.`,
                              });
                              setShowClearTextsDialog(false);
                            }}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                          >
                            Clear All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
              {[...overlayTexts]
                .sort((a, b) => (a.id === selectedTextId ? -1 : b.id === selectedTextId ? 1 : 0))
                .map((text, index) => {
                  const originalIndex = overlayTexts.findIndex(t => t.id === text.id);
                  const isSelected = selectedTextId === text.id;
                  return (
                    <Card
                      key={text.id}
                      className={`transition-all duration-200 ${isSelected
                        ? 'ring-2 ring-blue-500 border-blue-300 shadow-md'
                        : 'border-gray-100 hover:border-gray-200 shadow-sm'
                        }`}
                    >
                      {/* Compact modern header */}
                      <div
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-t-lg ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedTextId(isSelected ? null : text.id)}
                      >
                        {/* Text Icon/Preview */}
                        <div className="w-6 h-6 rounded bg-gray-100 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                          <Type className="h-3.5 w-3.5 text-gray-500" />
                        </div>
                        {/* Name/Preview */}
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                          {text.text.slice(0, 20) || `Text ${originalIndex + 1}`}
                          {text.text.length > 20 ? '...' : ''}
                        </span>
                        {/* Badge */}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono leading-none flex-shrink-0">
                          text
                        </span>
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 ml-1" onClick={e => e.stopPropagation()}>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => updateOverlayText(text.id, { visible: !text.visible })}
                            title={text.visible ? 'Hide' : 'Show'}
                          >
                            {text.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            onClick={() => removeOverlayText(text.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {isSelected && (
                        <CardContent className="space-y-4 pt-3 pb-4">
                          {/* Text Content */}
                          <div>
                            <Label className="text-xs">Text</Label>
                            <Textarea
                              value={text.text}
                              onChange={(e) => updateOverlayText(text.id, { text: e.target.value })}
                              placeholder="Enter text... (use Enter for new lines)"
                              className="min-h-[80px] resize-none"
                              rows={3}
                            />
                          </div>

                          {/* Position */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">X Position</Label>
                              <Input
                                type="number"
                                value={text.x}
                                onChange={(e) => updateOverlayText(text.id, { x: parseInt(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Y Position</Label>
                              <Input
                                type="number"
                                value={text.y}
                                onChange={(e) => updateOverlayText(text.id, { y: parseInt(e.target.value) || 0 })}
                                className="h-8"
                              />
                            </div>
                          </div>

                          {/* Font Settings */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Font Size</Label>
                              <Input
                                type="number"
                                value={text.fontSize}
                                onChange={(e) => updateOverlayText(text.id, { fontSize: parseInt(e.target.value) || 12 })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Font Family</Label>
                              <Select
                                value={text.fontFamily}
                                onValueChange={(value) => updateOverlayText(text.id, { fontFamily: value })}
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Arial">Arial</SelectItem>
                                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                  <SelectItem value="Courier New">Courier New</SelectItem>
                                  <SelectItem value="Georgia">Georgia</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Text Color */}
                          <div>
                            <Label className="text-xs">Text Color</Label>
                            <Input
                              type="color"
                              value={text.color}
                              onChange={(e) => updateOverlayText(text.id, { color: e.target.value })}
                              className="h-8 w-full"
                            />
                          </div>

                          {/* Text Wrapping */}
                          <div>
                            <Label className="text-xs">Max Width (for text wrapping)</Label>
                            <Input
                              type="number"
                              value={text.maxWidth || ''}
                              onChange={(e) => updateOverlayText(text.id, { maxWidth: parseInt(e.target.value) || undefined })}
                              placeholder="Leave empty for no wrapping"
                              className="h-8"
                            />
                            <div className="text-xs text-gray-500 mt-1">
                              {text.maxWidth ? `${text.maxWidth}px` : 'No wrapping'}
                            </div>
                          </div>

                          {/* Background Options */}
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <Switch
                                id={`transparent-${text.id}`}
                                checked={text.backgroundTransparent}
                                onCheckedChange={(checked) => updateOverlayText(text.id, { backgroundTransparent: checked })}
                              />
                              <Label htmlFor={`transparent-${text.id}`} className="text-xs">Transparent Background</Label>
                            </div>

                            {!text.backgroundTransparent && (
                              <div>
                                <Label className="text-xs">Background Color</Label>
                                <Input
                                  type="color"
                                  value={text.backgroundColor}
                                  onChange={(e) => updateOverlayText(text.id, { backgroundColor: e.target.value })}
                                  className="h-8 w-full"
                                />
                              </div>
                            )}
                          </div>

                          {/* Padding */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs">Horizontal Padding</Label>
                              <Slider
                                value={[text.paddingX || 8]}
                                onValueChange={([value]) => updateOverlayText(text.id, { paddingX: value })}
                                max={20}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-gray-500 mt-1">{text.paddingX || 8}px</div>
                            </div>
                            <div>
                              <Label className="text-xs">Vertical Padding</Label>
                              <Slider
                                value={[text.paddingY || 4]}
                                onValueChange={([value]) => updateOverlayText(text.id, { paddingY: value })}
                                max={20}
                                step={1}
                                className="mt-2"
                              />
                              <div className="text-xs text-gray-500 mt-1">{text.paddingY || 4}px</div>
                            </div>
                          </div>

                          {/* Border */}
                          <div>
                            <Label className="text-xs">Border Width</Label>
                            <Slider
                              value={[text.borderWidth]}
                              onValueChange={([value]) => updateOverlayText(text.id, { borderWidth: value })}
                              max={10}
                              step={1}
                              className="mt-2"
                            />
                            <div className="text-xs text-gray-500 mt-1">{text.borderWidth}px</div>
                          </div>

                          {text.borderWidth > 0 && (
                            <div>
                              <Label className="text-xs">Border Color</Label>
                              <Input
                                type="color"
                                value={text.borderColor}
                                onChange={(e) => updateOverlayText(text.id, { borderColor: e.target.value })}
                                className="h-8 w-full"
                              />
                            </div>
                          )}

                          {/* Rotation */}
                          <div>
                            <Label className="text-xs">Rotation</Label>
                            <Slider
                              value={[text.rotation]}
                              onValueChange={([value]) => updateOverlayText(text.id, { rotation: value })}
                              min={-180}
                              max={180}
                              step={1}
                              className="mt-2"
                            />
                            <div className="text-xs text-gray-500 mt-1">{text.rotation}°</div>
                          </div>

                          {/* Layer Order */}
                          <div>
                            <Label className="text-xs">Layer Order</Label>
                            <Input
                              type="number"
                              value={text.zIndex}
                              onChange={(e) => updateOverlayText(text.id, { zIndex: parseInt(e.target.value) || 1 })}
                              className="h-8"
                            />
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              }

              {overlayTexts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No overlay text added</p>
                  <p className="text-sm">Add text to get started</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Shapes Overlays Tab */}
          <TabsContent value="shapes" className="space-y-4">
            {/* Add Shape Section */}
            {/* Freehand Drawing Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Freehand Drawing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant={isDrawingMode ? "default" : "outline"}
                  className={`w-full h-10 flex items-center justify-center gap-2 transition-all ${isDrawingMode ? 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm' : 'hover:border-blue-500 hover:bg-blue-50 text-gray-700'}`}
                  onClick={() => setDrawingMode(!isDrawingMode)}
                >
                  <PenTool className="h-4 w-4" />
                  <span className="font-semibold">{isDrawingMode ? 'Done Drawing' : 'Draw Freehand'}</span>
                </Button>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                  <div>
                    <Label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wider font-semibold">Line Thickness</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Slider
                        value={[defaultDrawingThickness]}
                        onValueChange={([value]) => setDefaultDrawingThickness(value)}
                        max={20}
                        min={1}
                        step={1}
                        className="flex-1"
                      />
                      <span className="text-[10px] w-4 text-right whitespace-nowrap text-gray-500 font-medium">{defaultDrawingThickness}px</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-500 mb-1 block uppercase tracking-wider font-semibold">Line Style & Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Select
                        value={defaultDrawingStyle}
                        onValueChange={(value: 'solid' | 'dashed' | 'dotted') => setDefaultDrawingStyle(value)}
                      >
                        <SelectTrigger className="h-7 text-[11px] px-2 flex-1">
                          <SelectValue placeholder="Style" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="solid" className="text-[11px]">Solid</SelectItem>
                          <SelectItem value="dashed" className="text-[11px]">Dashed</SelectItem>
                          <SelectItem value="dotted" className="text-[11px]">Dotted</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative group">
                        <Input
                          type="color"
                          value={defaultDrawingColor}
                          onChange={(e) => setDefaultDrawingColor(e.target.value)}
                          className="h-7 w-8 p-0 border border-gray-200 rounded-md cursor-pointer absolute opacity-0 z-10"
                          title="Line Color"
                        />
                        <div
                          className="h-7 w-8 rounded-md border border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                          style={{ backgroundColor: defaultDrawingColor }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Shape Section – collapsible */}
            <Card>
              <CardHeader
                className="pb-2 pt-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsAddShapeOpen(o => !o)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Hexagon className="h-4 w-4" />
                    Add Shape
                  </CardTitle>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isAddShapeOpen ? 'rotate-180' : ''}`}
                  />
                </div>
              </CardHeader>
              {isAddShapeOpen && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {shapeGroups.map(group => (
                      <div key={group.label}>
                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-1.5">{group.label}</p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {group.shapes.map(({ type, label, icon: Icon, textLabel }) => (
                            <Button
                              key={type}
                              variant="outline"
                              className="h-10 p-0 flex flex-col items-center justify-center gap-0.5 relative overflow-hidden group hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                              onClick={() => handleAddShape(type)}
                              title={label}
                            >
                              {Icon ? (
                                <Icon className="h-4 w-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                              ) : (
                                <span className="text-base leading-none text-gray-600 group-hover:text-blue-600 transition-colors">{textLabel}</span>
                              )}
                              <span className="text-[9px] text-gray-400 group-hover:text-blue-400 leading-none truncate max-w-full px-1">{label}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>


            {/* Shape List */}
            <div className="space-y-2">
              {(selectedShapeId || overlayShapes.length > 0) && (
                <div className="flex justify-between items-center px-1 py-1">
                  <span className="text-xs text-gray-400 font-medium">{overlayShapes.length} {overlayShapes.length === 1 ? 'shape' : 'shapes'}</span>
                  <div className="flex gap-1.5">
                    {selectedShapeId && (
                      <Button size="sm" variant="ghost" onClick={() => setSelectedShapeId(null)} className="text-xs h-6 px-2 text-gray-500">
                        Deselect
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowClearShapesDialog(true)}
                      className="text-xs h-6 px-2 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      Clear all
                    </Button>

                    <AlertDialog open={showClearShapesDialog} onOpenChange={setShowClearShapesDialog}>
                      <AlertDialogContent className="max-w-sm">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all shapes?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove all {overlayShapes.length} shapes from your chart. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              const count = overlayShapes.length;
                              clearOverlayShapes();
                              setSelectedShapeId(null);
                              toast({
                                title: "Shapes Cleared",
                                description: `All ${count} shapes have been removed.`,
                              });
                              setShowClearShapesDialog(false);
                            }}
                            className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                          >
                            Clear All
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )}
              {[...overlayShapes]
                .sort((a, b) => (a.id === selectedShapeId ? -1 : b.id === selectedShapeId ? 1 : 0))
                .map((shape, index) => {
                  const originalIndex = overlayShapes.findIndex(s => s.id === shape.id);
                  const isSelected = selectedShapeId === shape.id;
                  return (
                    <Card
                      key={shape.id}
                      className={`transition-all duration-200 ${isSelected
                        ? 'ring-2 ring-blue-500 border-blue-300 shadow-md'
                        : 'border-gray-100 hover:border-gray-200 shadow-sm'
                        }`}
                    >
                      {/* Compact modern header */}
                      <div
                        className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded-t-lg ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                        onClick={() => setSelectedShapeId(isSelected ? null : shape.id)}
                      >
                        {/* Colour dot */}
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow-sm"
                          style={{ backgroundColor: shape.fillColor && shape.fillColor !== 'transparent' ? shape.fillColor : shape.borderColor || '#94a3b8' }}
                        />
                        {/* Name */}
                        <span className="text-xs font-medium text-gray-700 flex-1 truncate">
                          Shape {originalIndex + 1}
                        </span>
                        {/* Type badge */}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono leading-none flex-shrink-0">
                          {shape.type}
                        </span>
                        {/* Actions */}
                        <div className="flex items-center gap-0.5 ml-1" onClick={e => e.stopPropagation()}>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                            onClick={() => updateOverlayShape(shape.id, { visible: !shape.visible })}
                            title={shape.visible ? 'Hide' : 'Show'}
                          >
                            {shape.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            onClick={() => removeOverlayShape(shape.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {selectedShapeId === shape.id && (
                        <CardContent className="space-y-6 pt-2 pb-4">
                          {/* Position & Size */}
                          {shape.type !== 'freehand' && (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                              <div>
                                <Label className="text-xs text-slate-500 mb-1.5 block">X Position</Label>
                                <Input
                                  type="number"
                                  value={shape.x}
                                  onChange={(e) => updateOverlayShape(shape.id, { x: parseInt(e.target.value) || 0 })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-500 mb-1.5 block">Y Position</Label>
                                <Input
                                  type="number"
                                  value={shape.y}
                                  onChange={(e) => updateOverlayShape(shape.id, { y: parseInt(e.target.value) || 0 })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-500 mb-1.5 block">Width</Label>
                                <Input
                                  type="number"
                                  value={shape.width}
                                  onChange={(e) => updateOverlayShape(shape.id, { width: parseInt(e.target.value) || 0 })}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-slate-500 mb-1.5 block">Height</Label>
                                <Input
                                  type="number"
                                  value={shape.height}
                                  onChange={(e) => updateOverlayShape(shape.id, { height: parseInt(e.target.value) || 0 })}
                                  className="h-8 text-sm"
                                  disabled={shape.type === 'line' || shape.type === 'lineArrow'} // Disable height for lines
                                />
                              </div>
                            </div>
                          )}

                          {/* Transform */}
                          {shape.type !== 'freehand' && (
                            <div className="space-y-4">
                              <div>
                                <div className="flex justify-between mb-2">
                                  <Label className="text-xs text-slate-500">Rotation</Label>
                                  <span className="text-xs text-slate-400">{shape.rotation || 0}°</span>
                                </div>
                                <Slider
                                  value={[shape.rotation || 0]}
                                  onValueChange={([value]) => updateOverlayShape(shape.id, { rotation: value })}
                                  min={-180}
                                  max={180}
                                  step={1}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <Label className="text-xs text-slate-500">Skew X</Label>
                                    <span className="text-xs text-slate-400">{shape.skewX || 0}°</span>
                                  </div>
                                  <Slider
                                    value={[shape.skewX || 0]}
                                    onValueChange={([value]) => updateOverlayShape(shape.id, { skewX: value })}
                                    min={-45}
                                    max={45}
                                    step={1}
                                  />
                                </div>
                                <div>
                                  <div className="flex justify-between mb-2">
                                    <Label className="text-xs text-slate-500">Skew Y</Label>
                                    <span className="text-xs text-slate-400">{shape.skewY || 0}°</span>
                                  </div>
                                  <Slider
                                    value={[shape.skewY || 0]}
                                    onValueChange={([value]) => updateOverlayShape(shape.id, { skewY: value })}
                                    min={-45}
                                    max={45}
                                    step={1}
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Colors & Style */}
                          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                            {/* Row 1: Fill Color | Border Color */}
                            {shape.type !== 'freehand' && shape.type !== 'line' && shape.type !== 'lineArrow' && shape.type !== 'lineDoubleArrow' && (
                              <div>
                                <Label className="text-xs text-slate-500 block mb-1.5">Fill Color</Label>
                                <div className="relative group flex items-center gap-2">
                                  <Input
                                    type="color"
                                    value={shape.fillColor !== 'transparent' && shape.fillColor?.startsWith('#') ? shape.fillColor : '#0077cc'}
                                    onChange={(e) => updateOverlayShape(shape.id, { fillColor: e.target.value })}
                                    className="h-8 w-8 p-0 border border-gray-200 rounded-md cursor-pointer absolute opacity-0 z-10"
                                    title="Fill Color"
                                  />
                                  <div
                                    className="h-8 w-8 rounded-md border border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                                    style={{ backgroundColor: shape.fillColor !== 'transparent' && shape.fillColor?.startsWith('#') ? shape.fillColor : '#0077cc' }}
                                  />
                                  <span className="text-xs text-slate-600 font-mono uppercase bg-slate-50 border border-slate-100 px-1.5 py-1 rounded">
                                    {shape.fillColor !== 'transparent' && shape.fillColor?.startsWith('#') ? shape.fillColor : '#0077cc'}
                                  </span>
                                </div>
                              </div>
                            )}
                            <div className={shape.type === 'freehand' || shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow' ? 'col-span-2' : ''}>
                              <Label className="text-xs text-slate-500 block mb-1.5">
                                {shape.type === 'freehand' || shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow' ? 'Line Color' : 'Border Color'}
                              </Label>
                              <div className="relative group flex items-center gap-2">
                                <Input
                                  type="color"
                                  value={shape.borderColor !== 'transparent' && shape.borderColor?.startsWith('#') ? shape.borderColor : '#0077cc'}
                                  onChange={(e) => updateOverlayShape(shape.id, { borderColor: e.target.value })}
                                  className="h-8 w-8 p-0 border border-gray-200 rounded-md cursor-pointer absolute opacity-0 z-10"
                                  title="Line/Border Color"
                                />
                                <div
                                  className="h-8 w-8 rounded-md border border-gray-200 shadow-sm transition-transform group-hover:scale-105"
                                  style={{ backgroundColor: shape.borderColor !== 'transparent' && shape.borderColor?.startsWith('#') ? shape.borderColor : '#0077cc' }}
                                />
                                <span className="text-xs text-slate-600 font-mono uppercase bg-slate-50 border border-slate-100 px-1.5 py-1 rounded">
                                  {shape.borderColor !== 'transparent' && shape.borderColor?.startsWith('#') ? shape.borderColor : '#0077cc'}
                                </span>
                              </div>
                            </div>

                            {/* Row 2: Fill Opacity | Border Weight */}
                            {shape.type !== 'freehand' && shape.type !== 'line' && shape.type !== 'lineArrow' && shape.type !== 'lineDoubleArrow' && (
                              <div>
                                <div className="flex justify-between mb-2">
                                  <Label className="text-xs text-slate-500 block">Fill Opacity</Label>
                                  <span className="text-xs text-slate-400">{shape.fillOpacity ?? 100}%</span>
                                </div>
                                <Slider
                                  value={[shape.fillOpacity ?? 100]}
                                  onValueChange={([value]) => updateOverlayShape(shape.id, { fillOpacity: value })}
                                  min={0}
                                  max={100}
                                  step={1}
                                  className="mt-2"
                                />
                              </div>
                            )}
                            <div className={shape.type === 'freehand' || shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow' ? 'col-span-2' : ''}>
                              <div className="flex justify-between mb-2">
                                <Label className="text-xs text-slate-500">
                                  {shape.type === 'freehand' || shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow' ? 'Line Weight' : 'Border Weight'}
                                </Label>
                                <span className="text-xs text-slate-400">{shape.borderWidth || 0}px</span>
                              </div>
                              <Slider
                                value={[shape.borderWidth || 0]}
                                onValueChange={([value]) => updateOverlayShape(shape.id, { borderWidth: value })}
                                max={20}
                                step={1}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-xs text-slate-500 block mb-1.5">
                                {shape.type === 'freehand' || shape.type === 'line' || shape.type === 'lineArrow' || shape.type === 'lineDoubleArrow' ? 'Line Style' : 'Border Style'}
                              </Label>
                              <Select
                                value={shape.borderStyle || 'solid'}
                                onValueChange={(value: 'solid' | 'dashed' | 'dotted') => updateOverlayShape(shape.id, { borderStyle: value })}
                              >
                                <SelectTrigger className="h-8 text-xs font-medium">
                                  <SelectValue placeholder="Style" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="solid" className="text-xs">Solid</SelectItem>
                                  <SelectItem value="dashed" className="text-xs">Dashed</SelectItem>
                                  <SelectItem value="dotted" className="text-xs">Dotted</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label className="text-xs text-slate-500 block mb-1.5">Layer Order</Label>
                              <Input
                                type="number"
                                value={shape.zIndex}
                                onChange={(e) => updateOverlayShape(shape.id, { zIndex: parseInt(e.target.value) || 1 })}
                                className="h-8 text-sm"
                              />
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  );
                })
              }



              {overlayShapes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Hexagon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No overlay shapes added</p>
                  <p className="text-sm">Click a shape above to add</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div >
  )
} 