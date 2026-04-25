"use client"

import React, { useEffect } from "react"
import { useChartStore } from "@/lib/chart-store"
import { useUIStore } from "@/lib/stores/ui-store"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Image, Type, Hexagon } from "lucide-react"

import { ImageOverlaysTab } from "./ImageOverlaysTab"
import { TextOverlaysTab } from "./TextOverlaysTab"
import { ShapeOverlaysTab } from "./ShapeOverlaysTab"

export function OverlayPanel() {
    const {
        overlayImages,
        updateOverlayImage,
    } = useChartStore()

    const {
        selectedImageId,
        selectedTextId,
        selectedShapeId,
        setSelectedImageId,
        setSelectedTextId,
        setSelectedShapeId,
    } = useUIStore()

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

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto">
                <Tabs defaultValue="images" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 text-xs">
                        <TabsTrigger value="images" className="flex items-center gap-1.5 text-xs">
                            <Image className="h-3.5 w-3.5" />
                            Images
                        </TabsTrigger>
                        <TabsTrigger value="text" className="flex items-center gap-1.5 text-xs">
                            <Type className="h-3.5 w-3.5" />
                            Text
                        </TabsTrigger>
                        <TabsTrigger value="shapes" className="flex items-center gap-1.5 text-xs">
                            <Hexagon className="h-3.5 w-3.5" />
                            Shapes
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="images">
                        <ImageOverlaysTab />
                    </TabsContent>

                    <TabsContent value="text">
                        <TextOverlaysTab />
                    </TabsContent>

                    <TabsContent value="shapes">
                        <ShapeOverlaysTab />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
