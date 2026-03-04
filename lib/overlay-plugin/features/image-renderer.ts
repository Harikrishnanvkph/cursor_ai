import type { OverlayImage } from "../../chart-store"
import { clipImageToShape, drawRoundedRect } from "../utils/canvas"

// Image cache to store preloaded images
export const imageCache = new Map<string, HTMLImageElement>()

// Helper function to calculate smart image dimensions (20% of canvas height with aspect ratio)
export function calculateSmartDimensions(naturalWidth: number, naturalHeight: number, canvasHeight: number): { width: number, height: number } {
    const targetHeight = Math.floor(canvasHeight * 0.2) // 20% of canvas height
    const aspectRatio = naturalWidth / naturalHeight

    let smartWidth = Math.floor(targetHeight * aspectRatio)
    let smartHeight = targetHeight

    // Ensure minimum size
    const minSize = 50
    if (smartWidth < minSize || smartHeight < minSize) {
        if (aspectRatio > 1) {
            // Wider than tall
            smartWidth = minSize
            smartHeight = Math.floor(minSize / aspectRatio)
        } else {
            // Taller than wide
            smartHeight = minSize
            smartWidth = Math.floor(minSize * aspectRatio)
        }
    }

    return { width: smartWidth, height: smartHeight }
}

// Function to render overlay image
export function renderOverlayImage(ctx: CanvasRenderingContext2D, image: OverlayImage, chartArea: any, chart?: any): void {
    if (!image.visible) {
        return
    }

    // Draw a test rectangle first to verify positioning
    ctx.save()
    ctx.fillStyle = 'red'
    ctx.fillRect(chartArea.left + image.x, chartArea.top + image.y, image.width, image.height)
    ctx.restore()

    // Check if image is already cached
    let img = imageCache.get(image.url)

    if (img && img.complete) {
        // Image is loaded, draw it immediately
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
                const canvasHeight = chart?.canvas?.height || 400 // fallback height
                const smartDimensions = calculateSmartDimensions(img!.naturalWidth, img!.naturalHeight, canvasHeight)

                // If using natural size, use smart dimensions instead of full natural size
                if (image.useNaturalSize) {
                    updateData.width = smartDimensions.width
                    updateData.height = smartDimensions.height
                }

                // Dispatch update event if needed
                if (Object.keys(updateData).length > 0 && chart?.canvas) {
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
}

// Helper function to draw image on canvas
export function drawImageOnCanvas(ctx: CanvasRenderingContext2D, img: HTMLImageElement, image: OverlayImage, chartArea: any): void {
    ctx.save()

    // Determine dimensions to use
    let renderWidth = image.width
    let renderHeight = image.height

    // Use natural size if specified and available
    if (image.useNaturalSize && img.naturalWidth && img.naturalHeight) {
        renderWidth = img.naturalWidth
        renderHeight = img.naturalHeight
    }

    // Calculate image fitting for all shapes
    let drawX = chartArea.left + image.x
    let drawY = chartArea.top + image.y
    let drawWidth = renderWidth
    let drawHeight = renderHeight

    // Apply image fitting if specified
    if (image.imageFit) {
        const imageAspectRatio = img.naturalWidth / img.naturalHeight
        const containerAspectRatio = renderWidth / renderHeight

        switch (image.imageFit) {
            case 'fill':
                // Stretch to fill the container (default behavior)
                break
            case 'cover':
                // Scale to cover the container, maintaining aspect ratio
                if (imageAspectRatio > containerAspectRatio) {
                    // Image is wider, scale by height
                    drawWidth = renderHeight * imageAspectRatio
                    drawHeight = renderHeight
                    drawX = chartArea.left + image.x + (renderWidth - drawWidth) / 2
                } else {
                    // Image is taller, scale by width
                    drawWidth = renderWidth
                    drawHeight = renderWidth / imageAspectRatio
                    drawY = chartArea.top + image.y + (renderHeight - drawHeight) / 2
                }
                break
            case 'contain':
                // Scale to fit inside the container, maintaining aspect ratio
                if (imageAspectRatio > containerAspectRatio) {
                    // Image is wider, scale by width
                    drawWidth = renderWidth
                    drawHeight = renderWidth / imageAspectRatio
                    drawY = chartArea.top + image.y + (renderHeight - drawHeight) / 2
                } else {
                    // Image is taller, scale by height
                    drawWidth = renderHeight * imageAspectRatio
                    drawHeight = renderHeight
                    drawX = chartArea.left + image.x + (renderWidth - drawWidth) / 2
                }
                break
        }
    }

    // Support Rotation Handle
    if (image.rotation) {
        // Translation pivot needs to be Center X / Center Y of the image bounding box
        const cx = chartArea.left + image.x + renderWidth / 2;
        const cy = chartArea.top + image.y + renderHeight / 2;
        ctx.translate(cx, cy);
        ctx.rotate((image.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
    }

    // Apply clipping based on shape - use the original container dimensions for clipping
    clipImageToShape(ctx, chartArea.left + image.x, chartArea.top + image.y, renderWidth, renderHeight, image.shape)

    // Draw the image with calculated dimensions
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
    ctx.restore()

    // Draw border if specified
    if (image.borderWidth > 0) {
        ctx.save()
        ctx.strokeStyle = image.borderColor!
        ctx.lineWidth = image.borderWidth

        if (image.shape === 'circle') {
            const centerX = chartArea.left + image.x + renderWidth / 2
            const centerY = chartArea.top + image.y + renderHeight / 2
            const radius = Math.min(renderWidth, renderHeight) / 2
            ctx.beginPath()
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
            ctx.stroke()
        } else if (image.shape === 'rounded') {
            const radius = Math.min(renderWidth, renderHeight) * 0.1
            drawRoundedRect(ctx, chartArea.left + image.x, chartArea.top + image.y, renderWidth, renderHeight, radius)
            ctx.stroke()
        } else {
            ctx.strokeRect(chartArea.left + image.x, chartArea.top + image.y, renderWidth, renderHeight)
        }

        ctx.restore()
    }

    // Restore the master state saved at the beginning of the function
    ctx.restore()
}
