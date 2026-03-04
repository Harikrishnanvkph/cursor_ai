import type { Chart } from "chart.js"
import { getMouseHandlers } from "./events/mouse-handlers"
import { getTouchHandlers } from "./events/touch-handlers"
import { renderOverlayImage, imageCache, calculateSmartDimensions, drawImageOnCanvas } from "./features/image-renderer"
import { renderOverlayText } from "./features/text-renderer"
import { renderOverlayShape } from "./features/shape-renderer"
import { renderWatermark } from "./features/watermark"
import { drawRoundedRect, drawDashedBorder, drawCircularResizeHandles, drawRoundedResizeHandles } from "./utils/canvas"
import { drawResizeHandles } from "./utils/canvas"
import { wrapText } from "./features/text-renderer"
import { dragState } from "./state/drag-state"
import { useUIStore } from "../stores/ui-store"

// Basic plugin
export const overlayPlugin = {
    id: 'overlayPlugin',

    beforeInit: () => {
        // Plugin initialized
    },

    afterDraw: (chart: Chart) => {
        const ctx = chart.ctx
        const chartArea = chart.chartArea

        // Get overlay data from plugin options (Chart.js filters out non-standard root options)
        const pluginConfig = (chart.options as any)?.plugins?.overlayPlugin || {}
        const overlayImages = pluginConfig.overlayImages || []
        const overlayTexts = pluginConfig.overlayTexts || []
        const overlayShapes = pluginConfig.overlayShapes || []

        // Combine all overlays into a single array for z-index sorting
        const combinedOverlays: any[] = [];

        if (overlayImages.length > 0) {
            combinedOverlays.push(...overlayImages.map((img: any) => ({ ...img, _type: 'image' })));
        }
        if (overlayTexts.length > 0) {
            combinedOverlays.push(...overlayTexts.map((txt: any) => ({ ...txt, _type: 'text' })));
        }
        if (overlayShapes.length > 0) {
            combinedOverlays.push(...overlayShapes.map((shape: any) => ({ ...shape, _type: 'shape' })));
        }

        // Sort by zIndex
        combinedOverlays.sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));

        // Render in zIndex order
        combinedOverlays.forEach((overlay) => {
            if (!overlay.visible) return;

            if (overlay._type === 'image') {
                const image = overlay;
                // Check if image is already cached
                let img = imageCache.get(image.url)

                if (img && img.complete) {
                    // Image is loaded, draw it using the sophisticated drawImageOnCanvas function
                    drawImageOnCanvas(ctx, img, image, chartArea)
                } else {
                    // Use fallback dimensions for placeholder
                    const w = image.width
                    const h = image.height
                    const x = chartArea.left + image.x
                    const y = chartArea.top + image.y

                    // Image not loaded yet, show placeholder
                    ctx.save()
                    ctx.fillStyle = image.borderColor || 'gray'
                    ctx.strokeStyle = image.borderColor || 'blue'
                    ctx.lineWidth = Math.max(2, image.borderWidth)

                    // Draw placeholder based on shape
                    if (image.shape === 'circle') {
                        const centerX = x + w / 2
                        const centerY = y + h / 2
                        const radius = Math.min(w, h) / 2
                        ctx.beginPath()
                        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
                        ctx.fill()
                        ctx.stroke()
                    } else if (image.shape === 'rounded') {
                        const radius = Math.min(w, h) * 0.1
                        drawRoundedRect(ctx, x, y, w, h, radius)
                        ctx.fill()
                        ctx.stroke()
                    } else {
                        // Rectangle shape
                        ctx.fillRect(x, y, w, h)
                        ctx.strokeRect(x, y, w, h)
                    }

                    // Draw loading text
                    ctx.fillStyle = 'white'
                    ctx.font = '14px Arial'
                    ctx.textAlign = 'center'
                    ctx.fillText('Loading...', x + w / 2, y + h / 2)
                    ctx.textAlign = 'left'

                    ctx.restore()

                    // Try to load the image if not already loading
                    if (!img) {
                        img = new Image()
                        img.crossOrigin = "anonymous"

                        img.onload = () => {
                            // Cache the loaded image
                            imageCache.set(image.url, img!)

                            // Update store with natural dimensions and size if needed
                            const updateData: any = {}
                            if (!image.naturalWidth || !image.naturalHeight) {
                                updateData.naturalWidth = img!.naturalWidth
                                updateData.naturalHeight = img!.naturalHeight
                            }

                            // Calculate smart dimensions based on canvas size
                            const canvasHeight = chart.canvas.height || 400 // fallback height
                            const smartDimensions = calculateSmartDimensions(img!.naturalWidth, img!.naturalHeight, canvasHeight)

                            // If using natural size, use smart dimensions instead of full natural size
                            if (image.useNaturalSize) {
                                updateData.width = smartDimensions.width
                                updateData.height = smartDimensions.height
                            }

                            // Dispatch update event if needed
                            if (Object.keys(updateData).length > 0) {
                                const updateEvent = new CustomEvent('overlayImageDimensionsUpdate', {
                                    detail: { imageId: image.id, updateData }
                                })
                                chart.canvas.dispatchEvent(updateEvent)
                            }

                            // Multiple approaches to trigger chart redraw
                            // Approach 1: Direct chart update
                            if (chart && typeof chart.update === 'function') {
                                requestAnimationFrame(() => {
                                    chart.update('none')
                                })
                            }

                            // Approach 2: Dispatch custom event to component level
                            if (chart && chart.canvas) {
                                const event = new CustomEvent('overlayImageLoaded', {
                                    detail: { imageUrl: image.url }
                                })
                                chart.canvas.dispatchEvent(event)
                            }

                            // Approach 3: Force redraw by calling the plugin again
                            setTimeout(() => {
                                if (chart && chart.draw) {
                                    chart.draw()
                                }
                            }, 10)
                        }

                        img.onerror = () => {
                            console.error('❌ Failed to load overlay image:', image.url.substring(0, 50) + '...')
                        }

                        img.src = image.url
                    }
                }
            } else if (overlay._type === 'text') {
                renderOverlayText(ctx, overlay, chartArea)
            } else if (overlay._type === 'shape') {
                renderOverlayShape(ctx, overlay, chartArea)
            }
        });

        // Draw active freehand drawing path
        if (dragState.isDrawingFreehand && dragState.drawingPoints && dragState.drawingPoints.length > 0) {
            const uiState = useUIStore.getState();

            ctx.save()
            ctx.strokeStyle = uiState.defaultDrawingColor || 'rgba(0, 119, 204, 0.8)'
            ctx.lineWidth = uiState.defaultDrawingThickness || 4

            if (uiState.defaultDrawingStyle === 'dashed') {
                ctx.setLineDash([8, 8]);
            } else if (uiState.defaultDrawingStyle === 'dotted') {
                ctx.setLineDash([2, 4]);
            } else {
                ctx.setLineDash([]);
            }

            ctx.lineJoin = 'round'
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(dragState.drawingPoints[0].x, dragState.drawingPoints[0].y)
            if (dragState.drawingPoints.length < 3) {
                for (let i = 1; i < dragState.drawingPoints.length; i++) {
                    ctx.lineTo(dragState.drawingPoints[i].x, dragState.drawingPoints[i].y)
                }
            } else {
                for (let i = 1; i < dragState.drawingPoints.length - 1; i++) {
                    const pt = dragState.drawingPoints[i]
                    const nextPt = dragState.drawingPoints[i + 1]
                    const midX = (pt.x + nextPt.x) / 2
                    const midY = (pt.y + nextPt.y) / 2
                    ctx.quadraticCurveTo(pt.x, pt.y, midX, midY)
                }
                const lastPt = dragState.drawingPoints[dragState.drawingPoints.length - 1]
                ctx.lineTo(lastPt.x, lastPt.y)
            }
            ctx.stroke()
            ctx.restore()
        }

        // Draw selection handles for selected image
        const selectedImageId = (chart.options as any)?.plugins?.overlayPlugin?.selectedImageId
        if (selectedImageId) {
            const selectedImage = overlayImages.find((img: any) => img.id === selectedImageId)
            if (selectedImage && selectedImage.visible) {
                const x = chartArea.left + selectedImage.x
                const y = chartArea.top + selectedImage.y

                // Determine dimensions to use
                let w = selectedImage.width
                let h = selectedImage.height

                // Use natural size if specified and available
                if (selectedImage.useNaturalSize && selectedImage.naturalWidth && selectedImage.naturalHeight) {
                    w = selectedImage.naturalWidth
                    h = selectedImage.naturalHeight
                }

                ctx.save()

                // Apply image rotation matrix to selection bounds
                if (selectedImage.rotation) {
                    const cx = x + w / 2;
                    const cy = y + h / 2;
                    ctx.translate(cx, cy);
                    ctx.rotate((selectedImage.rotation * Math.PI) / 180);
                    ctx.translate(-cx, -cy);
                }

                // Draw dashed border based on shape
                if (selectedImage.shape === 'circle') {
                    const centerX = x + w / 2
                    const centerY = y + h / 2
                    const radius = Math.min(w, h) / 2
                    ctx.save()
                    ctx.strokeStyle = '#007acc'
                    ctx.lineWidth = 2
                    ctx.setLineDash([5, 5])
                    ctx.beginPath()
                    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
                    ctx.stroke()
                    ctx.restore()
                } else if (selectedImage.shape === 'rounded') {
                    const radius = Math.min(w, h) * 0.1
                    ctx.save()
                    ctx.strokeStyle = '#007acc'
                    ctx.lineWidth = 2
                    ctx.setLineDash([5, 5])
                    drawRoundedRect(ctx, x, y, w, h, radius)
                    ctx.stroke()
                    ctx.restore()
                } else {
                    // Rectangle shape
                    drawDashedBorder(ctx, x, y, w, h)
                }

                // Draw resize handles based on shape
                if (selectedImage.shape === 'circle') {
                    // For circle, draw handles around the circle perimeter
                    drawCircularResizeHandles(ctx, x, y, w, h, true)
                } else if (selectedImage.shape === 'rounded') {
                    // For rounded, draw handles around the rounded rectangle
                    drawRoundedResizeHandles(ctx, x, y, w, h, true)
                } else {
                    // Rectangle shape - use existing handles
                    drawResizeHandles(ctx, x, y, w, h, true)
                }

                ctx.restore()
            }
        }

        // Draw selection handles for selected text
        const selectedTextId = (chart.options as any)?.plugins?.overlayPlugin?.selectedTextId
        if (selectedTextId) {
            const selectedText = overlayTexts.find((txt: any) => txt.id === selectedTextId)
            if (selectedText && selectedText.visible) {
                const x = chartArea.left + selectedText.x
                const y = chartArea.top + selectedText.y

                // Measure text dimensions for multi-line text with wrapping
                ctx.font = `${selectedText.fontSize}px ${selectedText.fontFamily}`
                const originalLines = selectedText.text.split('\n')
                const allLines: string[] = []

                originalLines.forEach((line: string) => {
                    if (selectedText.maxWidth && selectedText.maxWidth > 0) {
                        // Apply text wrapping
                        const wrappedLines = wrapText(ctx, line, selectedText.maxWidth)
                        allLines.push(...wrappedLines)
                    } else {
                        // No wrapping, use original line
                        allLines.push(line)
                    }
                })

                const lineHeight = selectedText.fontSize * 1.2

                // Calculate total dimensions for multi-line text
                let maxWidth = 0
                allLines.forEach((line: string) => {
                    const textMetrics = ctx.measureText(line)
                    maxWidth = Math.max(maxWidth, textMetrics.width)
                })

                const totalHeight = allLines.length * lineHeight

                // Account for padding
                const paddingX = selectedText.paddingX || 8
                const paddingY = selectedText.paddingY || 4

                const bgX = x - paddingX
                const bgY = y - paddingY
                const bgWidth = maxWidth + (paddingX * 2)
                const bgHeight = totalHeight + (paddingY * 2)

                // Draw dashed border around text
                ctx.save()

                // Set center context mapping for rotation support just like shapes.
                const cx = bgX + bgWidth / 2;
                const cy = bgY + bgHeight / 2;

                ctx.translate(cx, cy);
                if (selectedText.rotation) {
                    ctx.rotate((selectedText.rotation * Math.PI) / 180);
                }
                ctx.translate(-cx, -cy);

                ctx.strokeStyle = '#007acc'
                ctx.lineWidth = 2
                ctx.setLineDash([5, 5])
                ctx.strokeRect(bgX, bgY, bgWidth, bgHeight)

                // Text now gets full geometry resize handles so users can interact with its bounding box
                drawResizeHandles(ctx, bgX, bgY, bgWidth, bgHeight, true)

                ctx.restore()
            }
        }

        // Draw selection handles for selected shape
        const selectedShapeId = (chart.options as any)?.plugins?.overlayPlugin?.selectedShapeId
        if (selectedShapeId) {
            const selectedShape = overlayShapes.find((sh: any) => sh.id === selectedShapeId)
            if (selectedShape && selectedShape.visible) {
                const x = chartArea.left + selectedShape.x
                const y = chartArea.top + selectedShape.y
                const w = selectedShape.width
                const h = selectedShape.height

                // Draw bounding box dashed border
                ctx.save()

                // If the shape is rotated or skewed, we should probably outline the bounding box around its actual transform.
                // However, the easiest way for MVP is to draw the selection box around the exact same transformed bounds, or just around its un-rotated frame.
                // Text selection doesn't handle rotation well either currently (just a straight rect). Wait, text handles don't have rotation yet.
                // Let's just draw the standard selection box taking transform into account.
                const cx = x + w / 2;
                const cy = y + h / 2;

                ctx.translate(cx, cy);
                if (selectedShape.rotation) {
                    ctx.rotate((selectedShape.rotation * Math.PI) / 180);
                }
                if (selectedShape.skewX || selectedShape.skewY) {
                    const skewXRad = ((selectedShape.skewX || 0) * Math.PI) / 180;
                    const skewYRad = ((selectedShape.skewY || 0) * Math.PI) / 180;
                    ctx.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0);
                }
                ctx.translate(-cx, -cy);

                if (selectedShape.type === 'circle' || selectedShape.type === 'ellipse') {
                    ctx.strokeStyle = '#007acc'
                    ctx.lineWidth = 2
                    ctx.setLineDash([5, 5])
                    ctx.beginPath()
                    ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, 2 * Math.PI)
                    ctx.stroke()
                    drawCircularResizeHandles(ctx, x, y, w, h, true)
                } else {
                    drawDashedBorder(ctx, x, y, w, h)
                    drawResizeHandles(ctx, x, y, w, h, true)
                }
                ctx.restore()
            }
        }

        // Render watermark if configured
        const watermarkConfig = (chart.options as any)?.watermark
        if (watermarkConfig) {
            renderWatermark(ctx, watermarkConfig, chart)
        }
    },

    afterInit: (chart: Chart) => {
        const canvas = chart.canvas

        const { handleMouseDown, handleMouseMove, handleMouseUp, handleContextMenu } = getMouseHandlers(chart)
        const { handleTouchStart, handleTouchMove, handleTouchEnd } = getTouchHandlers(chart)

        // Add event listeners
        canvas.addEventListener('mousedown', handleMouseDown)
        canvas.addEventListener('mousemove', handleMouseMove)
        canvas.addEventListener('mouseup', handleMouseUp)
        canvas.addEventListener('mouseleave', handleMouseUp)
        canvas.addEventListener('contextmenu', handleContextMenu)

        // Touch events for mobile
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
        canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

            // Store references for cleanup
            ; (chart as any)._overlayPluginListeners = {
                mousedown: handleMouseDown,
                mousemove: handleMouseMove,
                mouseup: handleMouseUp,
                mouseleave: handleMouseUp,
                contextmenu: handleContextMenu,
                touchstart: handleTouchStart,
                touchmove: handleTouchMove,
                touchend: handleTouchEnd
            }
    },

    beforeDestroy: (chart: Chart) => {
        // Clean up event listeners
        const listeners = (chart as any)._overlayPluginListeners
        if (listeners) {
            const canvas = chart.canvas
            Object.entries(listeners).forEach(([event, handler]) => {
                canvas.removeEventListener(event, handler as EventListener)
            })
            delete (chart as any)._overlayPluginListeners
        }
    }
}
