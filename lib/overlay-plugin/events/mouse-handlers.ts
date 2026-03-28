import type { Chart } from "chart.js"
import type { OverlayImage, OverlayText, OverlayShape } from "../../chart-store"
import { dragState } from "../state/drag-state"
import { getResizeHandle, isPointInCircle, isPointInRect, rotatePoint } from "../utils/geometry"
import { wrapText } from "../features/text-renderer"
import { useUIStore } from "../../stores/ui-store"
import { useChartStore } from "../../chart-store"

export function getMouseHandlers(chart: Chart) {
    const canvas = chart.canvas

    const handleMouseDown = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        // Map client coordinates to canvas internal coordinates to handle CSS transforms (scale/translate)
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (event.clientX - rect.left) * scaleX
        const y = (event.clientY - rect.top) * scaleY
        const chartArea = chart.chartArea

        // Get overlay data from plugin options
        const overlayDataRoot = (chart.options as any)?.plugins?.overlayPlugin || {}
        const overlayImages = overlayDataRoot.overlayImages || []
        const overlayTexts = overlayDataRoot.overlayTexts || []
        const overlayShapes = overlayDataRoot.overlayShapes || []



        // Check if clicking on any overlay (check in reverse zIndex order for top-most)
        const allOverlays = [
            ...overlayImages.map((img: OverlayImage) => ({ type: 'image', data: img })),
            ...overlayTexts.map((txt: OverlayText) => ({ type: 'text', data: txt })),
            ...overlayShapes.map((shape: OverlayShape) => ({ type: 'shape', data: shape }))
        ].sort((a, b) => b.data.zIndex - a.data.zIndex) // Reverse order for top-most first

        let clickedOnOverlay = false

        for (const overlay of allOverlays) {
            if (overlay.type === 'image') {
                const img = overlay.data as OverlayImage
                if (!img.visible) continue

                const imgX = chartArea.left + img.x
                const imgY = chartArea.top + img.y

                // Determine dimensions for hit detection
                let hitWidth = img.width
                let hitHeight = img.height

                // Use natural size if specified and available
                if (img.useNaturalSize && img.naturalWidth && img.naturalHeight) {
                    hitWidth = img.naturalWidth
                    hitHeight = img.naturalHeight
                }

                // For proper dragging and hit-testing on rotated images
                const imageCX = imgX + hitWidth / 2;
                const imageCY = imgY + hitHeight / 2;

                // Unrotate mouse coords
                let hitX = x;
                let hitY = y;
                if (img.rotation) {
                    const unrotated = rotatePoint(x, y, imageCX, imageCY, -img.rotation);
                    hitX = unrotated.x;
                    hitY = unrotated.y;
                }

                // Check if clicking on resize handle first (only for selected image)
                const overlayData = (chart.options as any)?.plugins?.overlayPlugin || {}
                const selectedImageId = overlayData.selectedImageId

                if (selectedImageId === img.id) {
                    const resizeHandle = getResizeHandle(hitX, hitY, imgX, imgY, hitWidth, hitHeight, img.shape, true)
                    if (resizeHandle) {
                        if (resizeHandle === 'rotation') {
                            dragState.isRotating = true
                            dragState.dragId = img.id
                            dragState.dragType = 'image'
                            dragState.startRotation = img.rotation || 0
                            dragState.centerX = imageCX
                            dragState.centerY = imageCY
                            canvas.style.cursor = 'grab'
                        } else {
                            // Start resize operation
                            dragState.isResizing = true
                            dragState.resizeHandle = resizeHandle
                            dragState.dragId = img.id
                            dragState.dragType = 'image'
                            dragState.startX = imgX
                            dragState.startY = imgY
                            dragState.startWidth = hitWidth
                            dragState.startHeight = hitHeight

                            // Set appropriate cursor based on handle type
                            switch (resizeHandle) {
                                case 'nw':
                                case 'se':
                                    canvas.style.cursor = 'nw-resize'
                                    break
                                case 'ne':
                                case 'sw':
                                    canvas.style.cursor = 'ne-resize'
                                    break
                                case 'n':
                                case 's':
                                    canvas.style.cursor = 'ns-resize'
                                    break
                                case 'e':
                                case 'w':
                                    canvas.style.cursor = 'ew-resize'
                                    break
                            }
                        }
                        clickedOnOverlay = true
                        event.preventDefault()
                        break
                    }
                }

                let isInside = false

                if (img.shape === 'circle') {
                    const centerX = imgX + hitWidth / 2
                    const centerY = imgY + hitHeight / 2
                    const radius = Math.min(hitWidth, hitHeight) / 2
                    isInside = isPointInCircle(hitX, hitY, centerX, centerY, radius)
                } else {
                    isInside = isPointInRect(hitX, hitY, imgX, imgY, hitWidth, hitHeight)
                }

                if (isInside) {
                    const uiStore = useUIStore.getState()
                    uiStore.setSelectedImageId(img.id)
                    uiStore.setSelectedTextId(null)
                    uiStore.setSelectedShapeId(null)

                    // Start drag operation
                    dragState.isDragging = true
                    dragState.dragType = 'image'
                    dragState.dragId = img.id
                    dragState.dragOffsetX = x - imgX
                    dragState.dragOffsetY = y - imgY
                    canvas.style.cursor = 'grabbing'
                    clickedOnOverlay = true
                    event.preventDefault()
                    break
                }
            } else if (overlay.type === 'shape') {
                const shape = overlay.data as OverlayShape
                if (!shape.visible) continue

                // Check center & rotation? For hit detection, simpler bounds check is usually fine for shapes.
                // We map x,y considering shape's center and rotation to test hit.
                const cx = chartArea.left + shape.x + shape.width / 2;
                const cy = chartArea.top + shape.y + shape.height / 2;

                // Untranslate/unrotate/unskew point
                // Simplified hit detection for now: treat as AABB (Axis-Aligned Bounding Box) for selection
                // More precise hit-testing would require inverse matrix multiplication
                const shapeX = chartArea.left + shape.x
                const shapeY = chartArea.top + shape.y

                const hitWidth = shape.width
                const hitHeight = shape.height

                // Inverse rotate mouse coords for hit test
                let hitX = x;
                let hitY = y;
                if (shape.rotation) {
                    const unrotated = rotatePoint(x, y, cx, cy, -shape.rotation);
                    hitX = unrotated.x;
                    hitY = unrotated.y;
                }

                const overlayData = (chart.options as any)?.plugins?.overlayPlugin || {}
                const selectedShapeId = overlayData.selectedShapeId

                if (selectedShapeId === shape.id) {
                    const resizeHandle = getResizeHandle(hitX, hitY, shapeX, shapeY, hitWidth, hitHeight, shape.type === 'circle' ? 'circle' : 'rectangle', true)
                    if (resizeHandle) {
                        if (resizeHandle === 'rotation') {
                            dragState.isRotating = true
                            dragState.dragId = shape.id
                            dragState.dragType = 'shape'
                            dragState.startRotation = shape.rotation || 0
                            dragState.centerX = cx
                            dragState.centerY = cy
                            canvas.style.cursor = 'grab'
                        } else {
                            dragState.isResizing = true
                            dragState.resizeHandle = resizeHandle
                            dragState.dragId = shape.id
                            dragState.dragType = 'shape'
                            dragState.startX = shapeX
                            dragState.startY = shapeY
                            dragState.startWidth = hitWidth
                            dragState.startHeight = hitHeight
                            dragState.startRotation = shape.rotation || 0
                            dragState.centerX = cx
                            dragState.centerY = cy

                            switch (resizeHandle) {
                                case 'nw':
                                case 'se':
                                    canvas.style.cursor = 'nw-resize'
                                    break
                                case 'ne':
                                case 'sw':
                                    canvas.style.cursor = 'ne-resize'
                                    break
                                case 'n':
                                case 's':
                                    canvas.style.cursor = 'ns-resize'
                                    break
                                case 'e':
                                case 'w':
                                    canvas.style.cursor = 'ew-resize'
                                    break
                            }
                        }
                        clickedOnOverlay = true
                        event.preventDefault()
                        break
                    }
                }

                // Hit test without full rotation inversion for simplicity
                let isInside = false
                if (shape.type === 'circle') {
                    const centerX = shapeX + hitWidth / 2
                    const centerY = shapeY + hitHeight / 2
                    isInside = isPointInCircle(hitX, hitY, centerX, centerY, Math.max(hitWidth, hitHeight) / 2)
                } else {
                    isInside = isPointInRect(hitX, hitY, shapeX, shapeY, hitWidth, hitHeight)
                }

                if (isInside) {
                    const uiStore = useUIStore.getState()
                    uiStore.setSelectedShapeId(shape.id)
                    uiStore.setSelectedImageId(null)
                    uiStore.setSelectedTextId(null)

                    dragState.isDragging = true
                    dragState.dragType = 'shape'
                    dragState.dragId = shape.id
                    dragState.dragOffsetX = x - shapeX
                    dragState.dragOffsetY = y - shapeY
                    canvas.style.cursor = 'grabbing'
                    clickedOnOverlay = true
                    event.preventDefault()
                    break
                }
            } else {
                const txt = overlay.data as OverlayText
                if (!txt.visible) continue

                // Calculate text dimensions for multi-line text with padding and wrapping
                const ctx = chart.ctx
                ctx.font = `${txt.fontSize}px ${txt.fontFamily}`
                const originalLines = txt.text.split('\n')
                const allLines: string[] = []

                originalLines.forEach((line: string) => {
                    if (txt.maxWidth && txt.maxWidth > 0) {
                        // Apply text wrapping
                        const wrappedLines = wrapText(ctx, line, txt.maxWidth)
                        allLines.push(...wrappedLines)
                    } else {
                        // No wrapping, use original line
                        allLines.push(line)
                    }
                })

                const lineHeight = txt.fontSize * 1.2

                // Calculate total dimensions for multi-line text
                let maxWidth = 0
                allLines.forEach((line: string) => {
                    const textMetrics = ctx.measureText(line)
                    maxWidth = Math.max(maxWidth, textMetrics.width)
                })

                const totalHeight = allLines.length * lineHeight

                // Account for padding in hit detection
                const paddingX = txt.paddingX || 8
                const paddingY = txt.paddingY || 4

                const txtX = chartArea.left + txt.x - paddingX
                const txtY = chartArea.top + txt.y - paddingY
                const hitWidth = maxWidth + (paddingX * 2)
                const hitHeight = totalHeight + (paddingY * 2)

                const txtCX = txtX + hitWidth / 2;
                const txtCY = txtY + hitHeight / 2;

                // Inverse rotate for hit bounds matching
                let hitX = x;
                let hitY = y;
                if (txt.rotation) {
                    const unrotated = rotatePoint(x, y, txtCX, txtCY, -txt.rotation);
                    hitX = unrotated.x;
                    hitY = unrotated.y;
                }

                const overlayData = (chart.options as any)?.plugins?.overlayPlugin || {}
                const selectedTextId = overlayData.selectedTextId

                if (selectedTextId === txt.id) {
                    const resizeHandle = getResizeHandle(hitX, hitY, txtX, txtY, hitWidth, hitHeight, 'rectangle', true)
                    if (resizeHandle) {
                        if (resizeHandle === 'rotation') {
                            dragState.isRotating = true
                            dragState.dragId = txt.id
                            dragState.dragType = 'text'
                            dragState.startRotation = txt.rotation || 0
                            dragState.centerX = txtCX
                            dragState.centerY = txtCY
                            canvas.style.cursor = 'grab'
                        } else {
                            // Start resize operation
                            dragState.isResizing = true
                            dragState.resizeHandle = resizeHandle
                            dragState.dragId = txt.id
                            dragState.dragType = 'text'
                            dragState.startX = txtX
                            dragState.startY = txtY
                            dragState.startWidth = hitWidth
                            dragState.startHeight = hitHeight
                            dragState.startFontSize = txt.fontSize

                            // Set appropriate cursor based on handle type
                            switch (resizeHandle) {
                                case 'nw':
                                case 'se':
                                    canvas.style.cursor = 'nw-resize'
                                    break
                                case 'ne':
                                case 'sw':
                                    canvas.style.cursor = 'ne-resize'
                                    break
                                case 'n':
                                case 's':
                                    canvas.style.cursor = 'ns-resize'
                                    break
                                case 'e':
                                case 'w':
                                    canvas.style.cursor = 'ew-resize'
                                    break
                            }
                        }
                        clickedOnOverlay = true
                        event.preventDefault()
                        break
                    }
                }
                const isInside = isPointInRect(hitX, hitY, txtX, txtY, hitWidth, hitHeight)
                if (isInside) {
                    const uiStore = useUIStore.getState()
                    uiStore.setSelectedTextId(txt.id)
                    uiStore.setSelectedImageId(null)
                    uiStore.setSelectedShapeId(null)

                    // Start drag operation
                    dragState.isDragging = true
                    dragState.dragType = 'text'
                    dragState.dragId = txt.id
                    dragState.dragOffsetX = x - txtX
                    dragState.dragOffsetY = y - txtY
                    canvas.style.cursor = 'grabbing'
                    clickedOnOverlay = true
                    event.preventDefault()
                    break
                }
            }
        }

        // If clicked outside any overlay, deselect
        if (!clickedOnOverlay) {
            const uiStore = useUIStore.getState()
            uiStore.setSelectedImageId(null)
            uiStore.setSelectedTextId(null)
            uiStore.setSelectedShapeId(null)

            // Force chart update to hide selection handles
            if (chart && chart.update) {
                setTimeout(() => {
                    chart.update('none')
                }, 10)
            }
        }
    }

    const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault() // Prevent default browser context menu

        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (event.clientX - rect.left) * scaleX
        const y = (event.clientY - rect.top) * scaleY
        const chartArea = chart.chartArea

        // Get overlay data from plugin options
        const overlayDataRoot = (chart.options as any)?.plugins?.overlayPlugin || {}
        const overlayImages = overlayDataRoot.overlayImages || []
        const overlayTexts = overlayDataRoot.overlayTexts || []
        const overlayShapes = overlayDataRoot.overlayShapes || []

        // Check if right-clicking on any overlay
        const allOverlays = [
            ...overlayImages.map((img: OverlayImage) => ({ type: 'image', data: img })),
            ...overlayTexts.map((txt: OverlayText) => ({ type: 'text', data: txt })),
            ...overlayShapes.map((shape: OverlayShape) => ({ type: 'shape', data: shape }))
        ].sort((a, b) => b.data.zIndex - a.data.zIndex)

        for (const overlay of allOverlays) {
            if (overlay.type === 'image') {
                const img = overlay.data as OverlayImage
                if (!img.visible) continue

                const imgX = chartArea.left + img.x
                const imgY = chartArea.top + img.y

                // Determine dimensions for hit detection
                let hitWidth = img.width
                let hitHeight = img.height

                if (img.useNaturalSize && img.naturalWidth && img.naturalHeight) {
                    hitWidth = img.naturalWidth
                    hitHeight = img.naturalHeight
                }

                let isInside = false
                if (img.shape === 'circle') {
                    const centerX = imgX + hitWidth / 2
                    const centerY = imgY + hitHeight / 2
                    const radius = Math.min(hitWidth, hitHeight) / 2
                    isInside = isPointInCircle(x, y, centerX, centerY, radius)
                } else {
                    isInside = isPointInRect(x, y, imgX, imgY, hitWidth, hitHeight)
                }

                if (isInside) {
                    // Select the image first
                    const selectEvent = new CustomEvent('overlayImageSelected', {
                        detail: { imageId: img.id }
                    })
                    canvas.dispatchEvent(selectEvent)

                    // Use the exact click position - event.clientX/clientY are viewport coordinates
                    // These work correctly with fixed positioning regardless of transforms
                    const contextMenuEvent = new CustomEvent('overlayContextMenu', {
                        detail: {
                            type: 'image',
                            id: img.id,
                            x: event.clientX, // Direct viewport X coordinate - works with fixed positioning
                            y: event.clientY, // Direct viewport Y coordinate - works with fixed positioning
                            data: img
                        }
                    })
                    canvas.dispatchEvent(contextMenuEvent)
                    return
                }
            } else if (overlay.type === 'shape') {
                const shape = overlay.data as OverlayShape
                if (!shape.visible) continue

                const shapeX = chartArea.left + shape.x
                const shapeY = chartArea.top + shape.y
                const hitWidth = shape.width
                const hitHeight = shape.height

                let isInside = false
                if (shape.type === 'circle') {
                    const centerX = shapeX + hitWidth / 2
                    const centerY = shapeY + hitHeight / 2
                    isInside = isPointInCircle(x, y, centerX, centerY, Math.max(hitWidth, hitHeight) / 2)
                } else {
                    isInside = isPointInRect(x, y, shapeX, shapeY, hitWidth, hitHeight)
                }

                if (isInside) {
                    const selectEvent = new CustomEvent('overlayShapeSelected', {
                        detail: { shapeId: shape.id }
                    })
                    canvas.dispatchEvent(selectEvent)

                    const contextMenuEvent = new CustomEvent('overlayContextMenu', {
                        detail: {
                            type: 'shape',
                            id: shape.id,
                            x: event.clientX,
                            y: event.clientY,
                            data: shape
                        }
                    })
                    canvas.dispatchEvent(contextMenuEvent)
                    return
                }
            } else {
                const txt = overlay.data as OverlayText
                if (!txt.visible) continue

                // Calculate text dimensions for multi-line text with padding and wrapping
                const ctx = chart.ctx
                ctx.font = `${txt.fontSize}px ${txt.fontFamily}`
                const originalLines = txt.text.split('\n')
                const allLines: string[] = []

                originalLines.forEach((line: string) => {
                    if (txt.maxWidth && txt.maxWidth > 0) {
                        // Apply text wrapping
                        const wrappedLines = wrapText(ctx, line, txt.maxWidth)
                        allLines.push(...wrappedLines)
                    } else {
                        // No wrapping, use original line
                        allLines.push(line)
                    }
                })

                const lineHeight = txt.fontSize * 1.2

                // Calculate total dimensions for multi-line text
                let maxWidth = 0
                allLines.forEach(line => {
                    const textMetrics = ctx.measureText(line)
                    maxWidth = Math.max(maxWidth, textMetrics.width)
                })

                const totalHeight = allLines.length * lineHeight

                const paddingX = txt.paddingX || 8
                const paddingY = txt.paddingY || 4

                const txtX = chartArea.left + txt.x - paddingX
                const txtY = chartArea.top + txt.y - paddingY
                const hitWidth = maxWidth + (paddingX * 2)
                const hitHeight = totalHeight + (paddingY * 2)

                if (isPointInRect(x, y, txtX, txtY, hitWidth, hitHeight)) {
                    // Use the exact click position - event.clientX/clientY are viewport coordinates
                    // These work correctly with fixed positioning regardless of transforms
                    const contextMenuEvent = new CustomEvent('overlayContextMenu', {
                        detail: {
                            type: 'text',
                            id: txt.id,
                            x: event.clientX, // Direct viewport X coordinate - works with fixed positioning
                            y: event.clientY, // Direct viewport Y coordinate - works with fixed positioning
                            data: txt
                        }
                    })
                    canvas.dispatchEvent(contextMenuEvent)
                    return
                }
            }
        }
    }

    const handleMouseMove = (event: MouseEvent) => {
        const rect = canvas.getBoundingClientRect()
        const scaleX = canvas.width / rect.width
        const scaleY = canvas.height / rect.height
        const x = (event.clientX - rect.left) * scaleX
        const y = (event.clientY - rect.top) * scaleY
        const chartArea = chart.chartArea

        if (dragState.isDrawingFreehand) {
            dragState.drawingPoints.push({ x, y })
            chart.update('none') // Trigger a fast re-render without animation to show the trail
            event.preventDefault()
            return
        }

        // Shape creation preview: update current position for live preview
        if (dragState.isCreatingShape) {
            dragState.shapeCreationCurrentX = x
            dragState.shapeCreationCurrentY = y
            chart.update('none') // Trigger re-render for live preview
            event.preventDefault()
            return
        }

        if (dragState.isRotating) {
            const dx = x - dragState.centerX;
            const dy = y - dragState.centerY;
            let angleRad = Math.atan2(dy, dx);
            // Math.atan2 is 0 at the pure right (positive X axis).
            // Default top handle is at -90 degrees (-PI/2). To make mouse position correspond to handle rotation:
            let angleDeg = (angleRad + Math.PI / 2) * (180 / Math.PI);

            // Normalize to 0-360
            if (angleDeg < 0) {
                angleDeg += 360;
            }

            if (dragState.dragType === 'shape') {
                const rotateEvent = new CustomEvent('overlayShapeRotate', {
                    detail: {
                        id: dragState.dragId,
                        rotation: Math.round(angleDeg)
                    }
                })
                canvas.dispatchEvent(rotateEvent)
            } else if (dragState.dragType === 'image') {
                const rotateEvent = new CustomEvent('overlayImageRotate', {
                    detail: {
                        id: dragState.dragId,
                        rotation: Math.round(angleDeg)
                    }
                })
                canvas.dispatchEvent(rotateEvent)
            } else if (dragState.dragType === 'text') {
                const rotateEvent = new CustomEvent('overlayTextRotate', {
                    detail: {
                        id: dragState.dragId,
                        rotation: Math.round(angleDeg)
                    }
                })
                canvas.dispatchEvent(rotateEvent)
            }

            event.preventDefault();
            return;
        } else if (dragState.isResizing) {
            // Handle resize operation
            const deltaX = x - (dragState.startX + dragState.dragOffsetX)
            const deltaY = y - (dragState.startY + dragState.dragOffsetY)

            let newWidth = dragState.startWidth
            let newHeight = dragState.startHeight
            let newX = dragState.startX - chartArea.left
            let newY = dragState.startY - chartArea.top

            if (dragState.dragType === 'shape') {
                let hitX = x;
                let hitY = y;
                if (dragState.startRotation && dragState.centerX !== undefined && dragState.centerY !== undefined) {
                    const unrotated = rotatePoint(x, y, dragState.centerX, dragState.centerY, -dragState.startRotation);
                    hitX = unrotated.x;
                    hitY = unrotated.y;
                }

                let anchorUX = dragState.startX;
                let anchorUY = dragState.startY;
                switch (dragState.resizeHandle) {
                    case 'e': anchorUX = dragState.startX; anchorUY = dragState.startY + dragState.startHeight / 2; break;
                    case 'w': anchorUX = dragState.startX + dragState.startWidth; anchorUY = dragState.startY + dragState.startHeight / 2; break;
                    case 'n': anchorUX = dragState.startX + dragState.startWidth / 2; anchorUY = dragState.startY + dragState.startHeight; break;
                    case 's': anchorUX = dragState.startX + dragState.startWidth / 2; anchorUY = dragState.startY; break;
                    case 'nw': anchorUX = dragState.startX + dragState.startWidth; anchorUY = dragState.startY + dragState.startHeight; break;
                    case 'ne': anchorUX = dragState.startX; anchorUY = dragState.startY + dragState.startHeight; break;
                    case 'sw': anchorUX = dragState.startX + dragState.startWidth; anchorUY = dragState.startY; break;
                    case 'se': anchorUX = dragState.startX; anchorUY = dragState.startY; break;
                }

                let anchorScreen = { x: anchorUX, y: anchorUY };
                if (dragState.startRotation && dragState.centerX !== undefined && dragState.centerY !== undefined) {
                    anchorScreen = rotatePoint(anchorUX, anchorUY, dragState.centerX, dragState.centerY, dragState.startRotation);
                }

                let absNewWidth = dragState.startWidth;
                let absNewHeight = dragState.startHeight;
                let absNewX = dragState.startX;
                let absNewY = dragState.startY;

                switch (dragState.resizeHandle) {
                    case 'se':
                        absNewWidth = Math.max(20, dragState.startWidth + (hitX - dragState.startX - dragState.startWidth));
                        absNewHeight = Math.max(20, dragState.startHeight + (hitY - dragState.startY - dragState.startHeight));
                        break;
                    case 'sw':
                        absNewWidth = Math.max(20, dragState.startWidth - (hitX - dragState.startX));
                        absNewHeight = Math.max(20, dragState.startHeight + (hitY - dragState.startY - dragState.startHeight));
                        absNewX = dragState.startX + (dragState.startWidth - absNewWidth);
                        break;
                    case 'ne':
                        absNewWidth = Math.max(20, dragState.startWidth + (hitX - dragState.startX - dragState.startWidth));
                        absNewHeight = Math.max(20, dragState.startHeight - (hitY - dragState.startY));
                        absNewY = dragState.startY + (dragState.startHeight - absNewHeight);
                        break;
                    case 'nw':
                        absNewWidth = Math.max(20, dragState.startWidth - (hitX - dragState.startX));
                        absNewHeight = Math.max(20, dragState.startHeight - (hitY - dragState.startY));
                        absNewX = dragState.startX + (dragState.startWidth - absNewWidth);
                        absNewY = dragState.startY + (dragState.startHeight - absNewHeight);
                        break;
                    case 'n':
                        absNewHeight = Math.max(20, dragState.startHeight - (hitY - dragState.startY));
                        absNewY = dragState.startY + (dragState.startHeight - absNewHeight);
                        break;
                    case 'e':
                        absNewWidth = Math.max(20, dragState.startWidth + (hitX - dragState.startX - dragState.startWidth));
                        break;
                    case 's':
                        absNewHeight = Math.max(20, dragState.startHeight + (hitY - dragState.startY - dragState.startHeight));
                        break;
                    case 'w':
                        absNewWidth = Math.max(20, dragState.startWidth - (hitX - dragState.startX));
                        absNewX = dragState.startX + (dragState.startWidth - absNewWidth);
                        break;
                }

                let newCX = absNewX + absNewWidth / 2;
                let newCY = absNewY + absNewHeight / 2;

                let newAnchorUX = absNewX;
                let newAnchorUY = absNewY;
                switch (dragState.resizeHandle) {
                    case 'e': newAnchorUX = absNewX; newAnchorUY = absNewY + absNewHeight / 2; break;
                    case 'w': newAnchorUX = absNewX + absNewWidth; newAnchorUY = absNewY + absNewHeight / 2; break;
                    case 'n': newAnchorUX = absNewX + absNewWidth / 2; newAnchorUY = absNewY + absNewHeight; break;
                    case 's': newAnchorUX = absNewX + absNewWidth / 2; newAnchorUY = absNewY; break;
                    case 'nw': newAnchorUX = absNewX + absNewWidth; newAnchorUY = absNewY + absNewHeight; break;
                    case 'ne': newAnchorUX = absNewX; newAnchorUY = absNewY + absNewHeight; break;
                    case 'sw': newAnchorUX = absNewX + absNewWidth; newAnchorUY = absNewY; break;
                    case 'se': newAnchorUX = absNewX; newAnchorUY = absNewY; break;
                }

                let newAnchorScreen = { x: newAnchorUX, y: newAnchorUY };
                if (dragState.startRotation) {
                    newAnchorScreen = rotatePoint(newAnchorUX, newAnchorUY, newCX, newCY, dragState.startRotation);
                }

                let driftX = newAnchorScreen.x - anchorScreen.x;
                let driftY = newAnchorScreen.y - anchorScreen.y;

                newWidth = absNewWidth;
                newHeight = absNewHeight;
                // Convert to relative coordinates AND apply drift correction to guarantee the visual anchor is fixed
                newX = absNewX - driftX - chartArea.left;
                newY = absNewY - driftY - chartArea.top;

            } else {
                // Image or text resize
                const overlayDataRoot = (chart.options as any)?.plugins?.overlayPlugin || {}
                const overlayImages = overlayDataRoot.overlayImages || []
                const currentImage = overlayImages.find((img: any) => img.id === dragState.dragId)
                const isImage = !!currentImage;

                let hitX = x;
                let hitY = y;

                // Provide same rotation boundary inverse scaling logic to drift-fix handles!
                const sourceRotation = isImage ? currentImage.rotation : overlayDataRoot.overlayTexts?.find((t: any) => t.id === dragState.dragId)?.rotation;

                if (sourceRotation && dragState.centerX !== undefined && dragState.centerY !== undefined) {
                    const unrotated = rotatePoint(x, y, dragState.centerX, dragState.centerY, -sourceRotation);
                    hitX = unrotated.x;
                    hitY = unrotated.y;
                }

                // Track geometric corner scaling matrix
                let anchorUX = dragState.startX;
                let anchorUY = dragState.startY;
                switch (dragState.resizeHandle) {
                    case 'e': anchorUX = dragState.startX; anchorUY = dragState.startY + dragState.startHeight / 2; break;
                    case 'w': anchorUX = dragState.startX + dragState.startWidth; anchorUY = dragState.startY + dragState.startHeight / 2; break;
                    case 'n': anchorUX = dragState.startX + dragState.startWidth / 2; anchorUY = dragState.startY + dragState.startHeight; break;
                    case 's': anchorUX = dragState.startX + dragState.startWidth / 2; anchorUY = dragState.startY; break;
                    case 'nw': anchorUX = dragState.startX + dragState.startWidth; anchorUY = dragState.startY + dragState.startHeight; break;
                    case 'ne': anchorUX = dragState.startX; anchorUY = dragState.startY + dragState.startHeight; break;
                    case 'sw': anchorUX = dragState.startX + dragState.startWidth; anchorUY = dragState.startY; break;
                    case 'se': anchorUX = dragState.startX; anchorUY = dragState.startY; break;
                }

                let anchorScreen = { x: anchorUX, y: anchorUY };
                if (sourceRotation && dragState.centerX !== undefined && dragState.centerY !== undefined) {
                    anchorScreen = rotatePoint(anchorUX, anchorUY, dragState.centerX, dragState.centerY, sourceRotation);
                }

                let absNewWidth = dragState.startWidth;
                let absNewHeight = dragState.startHeight;
                let absNewX = dragState.startX;
                let absNewY = dragState.startY;

                if (currentImage && currentImage.shape === 'circle') {
                    // Special handling for circle resize
                    const centerX = dragState.startX + dragState.startWidth / 2
                    const centerY = dragState.startY + dragState.startHeight / 2

                    // Calculate distance from center to mouse position
                    const distanceFromCenter = Math.sqrt((hitX - centerX) ** 2 + (hitY - centerY) ** 2)
                    const minRadius = 10
                    const newRadius = Math.max(minRadius, distanceFromCenter)

                    const newDiameter = newRadius * 2
                    absNewWidth = newDiameter
                    absNewHeight = newDiameter

                    absNewX = centerX - newRadius
                    absNewY = centerY - newRadius
                } else {
                    // Original rectangle/rounded resize logic for Images and Text overlays
                    switch (dragState.resizeHandle) {
                        case 'se':
                            absNewWidth = Math.max(20, dragState.startWidth + (hitX - dragState.startX - dragState.startWidth))
                            absNewHeight = Math.max(20, dragState.startHeight + (hitY - dragState.startY - dragState.startHeight))
                            break
                        case 'sw':
                            absNewWidth = Math.max(20, dragState.startWidth - (hitX - dragState.startX))
                            absNewHeight = Math.max(20, dragState.startHeight + (hitY - dragState.startY - dragState.startHeight))
                            absNewX = dragState.startX + (dragState.startWidth - absNewWidth)
                            break
                        case 'ne':
                            absNewWidth = Math.max(20, dragState.startWidth + (hitX - dragState.startX - dragState.startWidth))
                            absNewHeight = Math.max(20, dragState.startHeight - (hitY - dragState.startY))
                            absNewY = dragState.startY + (dragState.startHeight - absNewHeight)
                            break
                        case 'nw':
                            absNewWidth = Math.max(20, dragState.startWidth - (hitX - dragState.startX))
                            absNewHeight = Math.max(20, dragState.startHeight - (hitY - dragState.startY))
                            absNewX = dragState.startX + (dragState.startWidth - absNewWidth)
                            absNewY = dragState.startY + (dragState.startHeight - absNewHeight)
                            break
                        case 'n':
                            absNewHeight = Math.max(20, dragState.startHeight - (hitY - dragState.startY))
                            absNewY = dragState.startY + (dragState.startHeight - absNewHeight)
                            break
                        case 'e':
                            absNewWidth = Math.max(20, dragState.startWidth + (hitX - dragState.startX - dragState.startWidth))
                            break
                        case 's':
                            absNewHeight = Math.max(20, dragState.startHeight + (hitY - dragState.startY - dragState.startHeight))
                            break
                        case 'w':
                            absNewWidth = Math.max(20, dragState.startWidth - (hitX - dragState.startX))
                            absNewX = dragState.startX + (dragState.startWidth - absNewWidth)
                            break
                    }
                }

                // Determine new bounding drift
                let newCX = absNewX + absNewWidth / 2;
                let newCY = absNewY + absNewHeight / 2;

                let newAnchorUX = absNewX;
                let newAnchorUY = absNewY;
                switch (dragState.resizeHandle) {
                    case 'e': newAnchorUX = absNewX; newAnchorUY = absNewY + absNewHeight / 2; break;
                    case 'w': newAnchorUX = absNewX + absNewWidth; newAnchorUY = absNewY + absNewHeight / 2; break;
                    case 'n': newAnchorUX = absNewX + absNewWidth / 2; newAnchorUY = absNewY + absNewHeight; break;
                    case 's': newAnchorUX = absNewX + absNewWidth / 2; newAnchorUY = absNewY; break;
                    case 'nw': newAnchorUX = absNewX + absNewWidth; newAnchorUY = absNewY + absNewHeight; break;
                    case 'ne': newAnchorUX = absNewX; newAnchorUY = absNewY + absNewHeight; break;
                    case 'sw': newAnchorUX = absNewX + absNewWidth; newAnchorUY = absNewY; break;
                    case 'se': newAnchorUX = absNewX; newAnchorUY = absNewY; break;
                }

                let newAnchorScreen = { x: newAnchorUX, y: newAnchorUY };
                if (sourceRotation) {
                    newAnchorScreen = rotatePoint(newAnchorUX, newAnchorUY, newCX, newCY, sourceRotation);
                }

                let driftX = newAnchorScreen.x - anchorScreen.x;
                let driftY = newAnchorScreen.y - anchorScreen.y;

                newWidth = absNewWidth;
                newHeight = absNewHeight;

                newX = absNewX - driftX - chartArea.left;
                newY = absNewY - driftY - chartArea.top;
            }

            const chartStore = useChartStore.getState()
            
            // Apply resize based on dragType
            if (dragState.dragType === 'shape') {
                chartStore.updateOverlayShape(dragState.dragId, {
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight
                })
            } else if (dragState.dragType === 'text') {
                const scaleX = newWidth / dragState.startWidth
                const scaleY = newHeight / dragState.startHeight
                const avgScale = (scaleX + scaleY) / 2
                
                let updateData: any = { x: newX, y: newY }
                
                if (dragState.resizeHandle === 'e' || dragState.resizeHandle === 'w') {
                    updateData.maxWidth = newWidth
                } else if (dragState.resizeHandle !== 'n' && dragState.resizeHandle !== 's') {
                    updateData.fontSize = Math.max(8, dragState.startFontSize * avgScale)
                }

                chartStore.updateOverlayText(dragState.dragId, updateData)
            } else {
                chartStore.updateOverlayImage(dragState.dragId, {
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                    useNaturalSize: false // Turn off natural size when manually resizing
                })
            }

            event.preventDefault()
        } else if (dragState.isDragging) {
            // Calculate new position relative to chart area
            const newX = x - dragState.dragOffsetX - chartArea.left
            const newY = y - dragState.dragOffsetY - chartArea.top

            const chartStore = useChartStore.getState()
            if (dragState.dragType === 'image') {
                chartStore.updateOverlayImage(dragState.dragId, { x: newX, y: newY })
            } else if (dragState.dragType === 'text') {
                chartStore.updateOverlayText(dragState.dragId, { x: newX, y: newY })
            } else if (dragState.dragType === 'shape') {
                chartStore.updateOverlayShape(dragState.dragId, { x: newX, y: newY })
            }

            event.preventDefault()
        } else {
            // Check if hovering over any overlay for cursor change
            let isOverOverlay = false
            let hoverCursor = 'default'
            const overlayData = (chart.options as any)?.plugins?.overlayPlugin || {}
            const overlayImages = overlayData.overlayImages || []
            const overlayTexts = overlayData.overlayTexts || []
            const overlayShapes = overlayData.overlayShapes || []
            const selectedImageId = overlayData.selectedImageId
            const selectedShapeId = overlayData.selectedShapeId
            const selectedTextId = overlayData.selectedTextId

            // Check images
            for (const img of overlayImages) {
                if (!img.visible) continue

                const imgX = chartArea.left + img.x
                const imgY = chartArea.top + img.y

                // Determine dimensions for hover detection
                let hoverWidth = img.width
                let hoverHeight = img.height

                // Use natural size if specified and available
                if (img.useNaturalSize && img.naturalWidth && img.naturalHeight) {
                    hoverWidth = img.naturalWidth
                    hoverHeight = img.naturalHeight
                }

                let hoverHitX = x;
                let hoverHitY = y;
                if (img.rotation) {
                    const unrotated = rotatePoint(x, y, imgX + hoverWidth / 2, imgY + hoverHeight / 2, -img.rotation);
                    hoverHitX = unrotated.x;
                    hoverHitY = unrotated.y;
                }

                // If this is the selected image, check for resize handle hover first
                if (selectedImageId === img.id) {
                    const resizeHandle = getResizeHandle(hoverHitX, hoverHitY, imgX, imgY, hoverWidth, hoverHeight, img.shape, true)
                    if (resizeHandle) {
                        isOverOverlay = true
                        // Set cursor based on handle type
                        switch (resizeHandle) {
                            case 'rotation':
                                hoverCursor = 'grab';
                                break;
                            case 'nw':
                            case 'se':
                                hoverCursor = 'nw-resize'
                                break
                            case 'ne':
                            case 'sw':
                                hoverCursor = 'ne-resize'
                                break
                            case 'n':
                            case 's':
                                hoverCursor = 'ns-resize'
                                break
                            case 'e':
                            case 'w':
                                hoverCursor = 'ew-resize'
                                break
                        }
                        break
                    }
                }

                let isInside = false
                if (img.shape === 'circle') {
                    const centerX = imgX + hoverWidth / 2
                    const centerY = imgY + hoverHeight / 2
                    const radius = Math.min(hoverWidth, hoverHeight) / 2
                    isInside = isPointInCircle(hoverHitX, hoverHitY, centerX, centerY, radius)
                } else {
                    isInside = isPointInRect(hoverHitX, hoverHitY, imgX, imgY, hoverWidth, hoverHeight)
                }

                if (isInside) {
                    isOverOverlay = true
                    dragState.hoveredOverlayId = img.id
                    dragState.hoveredOverlayType = 'image'
                    if (hoverCursor === 'default') {
                        hoverCursor = 'grab'
                    }
                    break
                }
            }

            // Check shapes if not already over an image
            if (!isOverOverlay) {
                for (const shape of overlayShapes) {
                    if (!shape.visible) continue

                    const shapeX = chartArea.left + shape.x
                    const shapeY = chartArea.top + shape.y
                    const hoverWidth = shape.width
                    const hoverHeight = shape.height

                    let hoverHitX = x;
                    let hoverHitY = y;
                    if (shape.rotation) {
                        const unrotated = rotatePoint(x, y, shapeX + hoverWidth / 2, shapeY + hoverHeight / 2, -shape.rotation);
                        hoverHitX = unrotated.x;
                        hoverHitY = unrotated.y;
                    }

                    if (selectedShapeId === shape.id) {
                        const resizeHandle = getResizeHandle(hoverHitX, hoverHitY, shapeX, shapeY, hoverWidth, hoverHeight, shape.type === 'circle' ? 'circle' : 'rectangle', true)
                        if (resizeHandle) {
                            isOverOverlay = true
                            switch (resizeHandle) {
                                case 'rotation': hoverCursor = 'grab'; break;
                                case 'nw': case 'se': hoverCursor = 'nw-resize'; break;
                                case 'ne': case 'sw': hoverCursor = 'ne-resize'; break;
                                case 'n': case 's': hoverCursor = 'ns-resize'; break;
                                case 'e': case 'w': hoverCursor = 'ew-resize'; break;
                            }
                            break
                        }
                    }

                    let isInside = false
                    if (shape.type === 'circle') {
                        const centerX = shapeX + hoverWidth / 2
                        const centerY = shapeY + hoverHeight / 2
                        isInside = isPointInCircle(x, y, centerX, centerY, Math.max(hoverWidth, hoverHeight) / 2)
                    } else {
                        isInside = isPointInRect(x, y, shapeX, shapeY, hoverWidth, hoverHeight)
                    }

                    if (isInside) {
                        isOverOverlay = true
                        dragState.hoveredOverlayId = shape.id
                        dragState.hoveredOverlayType = 'shape'
                        if (hoverCursor === 'default') hoverCursor = 'grab'
                        break
                    }
                }
            }

            // Check texts if not already over an image or shape
            if (!isOverOverlay) {
                const ctx = chart.ctx
                for (const txt of overlayTexts) {
                    if (!txt.visible) continue

                    ctx.font = `${txt.fontSize}px ${txt.fontFamily}`

                    // Same wrapping logic as mousedown and renderers
                    const originalLines = txt.text.split('\n')
                    const allLines: string[] = []

                    originalLines.forEach((line: string) => {
                        if (txt.maxWidth && txt.maxWidth > 0) {
                            const wrappedLines = wrapText(ctx, line, txt.maxWidth)
                            allLines.push(...wrappedLines)
                        } else {
                            allLines.push(line)
                        }
                    })

                    let maxWidth = 0
                    allLines.forEach((line: string) => {
                        maxWidth = Math.max(maxWidth, ctx.measureText(line).width)
                    })

                    const textHeight = txt.fontSize * 1.2 * allLines.length;

                    // Account for padding in hover detection
                    const paddingX = txt.paddingX || 8
                    const paddingY = txt.paddingY || 4

                    const txtX = chartArea.left + txt.x - paddingX
                    const txtY = chartArea.top + txt.y - paddingY
                    const hitWidth = maxWidth + (paddingX * 2)
                    const hitHeight = textHeight + (paddingY * 2)

                    const txtCX = txtX + hitWidth / 2;
                    const txtCY = txtY + hitHeight / 2;

                    let hoverHitX = x;
                    let hoverHitY = y;
                    if (txt.rotation) {
                        const unrotated = rotatePoint(x, y, txtCX, txtCY, -txt.rotation);
                        hoverHitX = unrotated.x;
                        hoverHitY = unrotated.y;
                    }

                    if (selectedTextId === txt.id) {
                        const resizeHandle = getResizeHandle(hoverHitX, hoverHitY, txtX, txtY, hitWidth, hitHeight, 'rectangle', true)
                        if (resizeHandle) {
                            isOverOverlay = true
                            switch (resizeHandle) {
                                case 'rotation': hoverCursor = 'grab'; break;
                                case 'nw': case 'se': hoverCursor = 'nw-resize'; break;
                                case 'ne': case 'sw': hoverCursor = 'ne-resize'; break;
                                case 'n': case 's': hoverCursor = 'ns-resize'; break;
                                case 'e': case 'w': hoverCursor = 'ew-resize'; break;
                            }
                            break
                        }
                    }

                    if (isPointInRect(hoverHitX, hoverHitY, txtX, txtY, hitWidth, hitHeight)) {
                        isOverOverlay = true
                        dragState.hoveredOverlayId = txt.id
                        dragState.hoveredOverlayType = 'text'
                        if (hoverCursor === 'default') hoverCursor = 'grab'
                        break
                    }
                }
            }

            if (isOverOverlay) {
                canvas.style.cursor = hoverCursor
                dragState.isHovering = true
            } else if (dragState.isHovering || dragState.hoveredOverlayId) {
                canvas.style.cursor = 'default'
                dragState.isHovering = false
                dragState.hoveredOverlayId = null
                dragState.hoveredOverlayType = null
            }
        }
    }

    const handleMouseUp = () => {
        if (dragState.isDragging || dragState.isResizing || dragState.isRotating) {
            dragState.isDragging = false
            dragState.isResizing = false
            dragState.isRotating = false
            dragState.resizeHandle = ''
            dragState.dragType = ''
            dragState.dragId = ''
            canvas.style.cursor = 'default'
        }
    }

    return {
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
        handleContextMenu
    }
}
