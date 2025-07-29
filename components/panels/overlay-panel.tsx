"use client"

import { useChartStore, type OverlayImage, type OverlayText } from "@/lib/chart-store"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Image, Type, Upload, Trash2, Eye, EyeOff, Square, Circle, Layers, MousePointer } from "lucide-react"
import { useState, useRef, useEffect } from "react"

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
    selectedImageId,
    setSelectedImageId
  } = useChartStore()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newText, setNewText] = useState("")

  // Add keyboard support for ESC key to deselect
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedImageId) {
        setSelectedImageId(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImageId, setSelectedImageId])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) {
      console.log('❌ No files selected')
      return
    }

    console.log('📁 handleImageUpload called with files:', files.length)

    Array.from(files).forEach((file, index) => {
      console.log(`📁 Processing file ${index + 1}:`, file.name, file.type, file.size + ' bytes')
      
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const url = e.target?.result as string
        console.log('✅ File loaded, URL length:', url.length)
        console.log('📷 Adding overlay image at position:', { x: 50 + index * 10, y: 50 + index * 10 })
        
        addOverlayImage({
          url,
          x: 50 + index * 10, // Offset each image slightly
          y: 50 + index * 10,
          width: 120, // Fallback size, will be replaced by natural size
          height: 120, // Fallback size, will be replaced by natural size
          useNaturalSize: true, // Use image's natural dimensions
          visible: true,
          borderWidth: 2,
          borderColor: "#00ff00", // Green border to distinguish from test
          shape: 'rectangle',
          zIndex: 1 + index
        })
        
        console.log('📷 Image added to store, new count should be:', overlayImages.length + 1)
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
      zIndex: 1
    })
    setNewText("")
  }

  const shapeIcons = {
    rectangle: Square,
    circle: Circle,
    rounded: Square
  }

  return (
    <div className="h-full flex flex-col">


      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="images" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="images" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Text
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
                        console.log('Adding test image')
                        addOverlayImage({
                          url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwNzVmZiIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VEVTVDwvdGV4dD48L3N2Zz4=',
                          x: 50,
                          y: 50,
                          width: 100,
                          height: 100,
                          useNaturalSize: false, // Test image should use specified size
                          visible: true,
                          borderWidth: 2,
                          borderColor: "#ff0000",
                          shape: 'rectangle',
                          zIndex: 1
                        })
                        console.log('Test image added, count:', overlayImages.length + 1)
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
                              borderColor: "#00ff00",
                              shape: 'rectangle',
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
                            borderColor: "#00ff00",
                            shape: 'rectangle',
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
            <div className="space-y-4">
              {selectedImageId && (
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedImageId(null)}
                    className="text-xs"
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
              {overlayImages.map((image, index) => (
                <Card key={image.id} className={selectedImageId === image.id ? "ring-2 ring-blue-500 border-blue-300" : ""}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Image {index + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant={selectedImageId === image.id ? "default" : "ghost"}
                          onClick={() => setSelectedImageId(selectedImageId === image.id ? null : image.id)}
                          title={selectedImageId === image.id ? "Deselect Image" : "Select Image"}
                        >
                          <MousePointer className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateOverlayImage(image.id, { visible: !image.visible })}
                        >
                          {image.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOverlayImage(image.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
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
                          updateOverlayImage(image.id, { shape: value })
                        }
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(shapeIcons).map(([shape, Icon]) => (
                            <SelectItem key={shape} value={shape}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {shape.charAt(0).toUpperCase() + shape.slice(1)}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                    {/* Z-Index */}
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
                </Card>
              ))}

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
                <div className="flex gap-2">
                  <Input
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="Enter text to add..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
                  />
                  <Button onClick={handleAddText} disabled={!newText.trim()}>
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Text List */}
            <div className="space-y-4">
              {overlayTexts.map((text, index) => (
                <Card key={text.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Text {index + 1}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateOverlayText(text.id, { visible: !text.visible })}
                        >
                          {text.visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeOverlayText(text.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Text Content */}
                    <div>
                      <Label className="text-xs">Text</Label>
                      <Input
                        value={text.text}
                        onChange={(e) => updateOverlayText(text.id, { text: e.target.value })}
                        className="h-8"
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

                    {/* Z-Index */}
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
                </Card>
              ))}

              {overlayTexts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Type className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No overlay text added</p>
                  <p className="text-sm">Add text to get started</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 