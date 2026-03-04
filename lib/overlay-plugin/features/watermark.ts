import type { Chart } from "chart.js"

// Watermark configuration interface
export interface WatermarkConfig {
    text?: string
    imageUrl?: string
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    opacity?: number
    size?: number
    color?: string
    style?: 'single' | 'tiled'  // single = one position, tiled = repeating pattern at 45 degrees
}

// Cache for watermark images
export const watermarkImageCache = new Map<string, HTMLImageElement>()

// Function to render watermark on the chart
export function renderWatermark(ctx: CanvasRenderingContext2D, watermark: WatermarkConfig, chart: Chart): void {
    if (!watermark) return

    const canvas = chart.canvas
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    // Default values
    const opacity = (watermark.opacity ?? 30) / 100 // Convert from 0-100 to 0-1
    const fontSize = watermark.size ?? 12
    const color = watermark.color ?? '#cccccc'
    const position = watermark.position ?? 'bottom-right'

    ctx.save()
    ctx.globalAlpha = opacity

    // Calculate position with padding
    const padding = 10
    let x = padding
    let y = padding

    // Check if we have an image watermark
    if (watermark.imageUrl && watermark.imageUrl.trim() !== '') {
        const imageUrl = watermark.imageUrl
        let img = watermarkImageCache.get(imageUrl)

        if (img && img.complete && img.naturalWidth > 0) {
            // Image is loaded, calculate dimensions and position
            const imgHeight = fontSize * 3 // Scale image relative to font size
            const aspectRatio = img.naturalWidth / img.naturalHeight
            const imgWidth = imgHeight * aspectRatio

            // Calculate position based on position setting
            switch (position) {
                case 'top-left':
                    x = padding
                    y = padding
                    break
                case 'top-right':
                    x = canvasWidth - imgWidth - padding
                    y = padding
                    break
                case 'bottom-left':
                    x = padding
                    y = canvasHeight - imgHeight - padding
                    break
                case 'bottom-right':
                    x = canvasWidth - imgWidth - padding
                    y = canvasHeight - imgHeight - padding
                    break
                case 'center':
                    x = (canvasWidth - imgWidth) / 2
                    y = (canvasHeight - imgHeight) / 2
                    break
            }

            ctx.drawImage(img, x, y, imgWidth, imgHeight)
        } else if (!img) {
            // Load the image
            const newImg = new Image()
            newImg.crossOrigin = 'anonymous'
            newImg.onload = () => {
                watermarkImageCache.set(imageUrl, newImg)
                // Trigger chart redraw
                if (chart && chart.update) {
                    chart.update('none')
                }
            }
            newImg.onerror = () => {
                console.warn('Failed to load watermark image:', imageUrl)
            }
            newImg.src = imageUrl
            // Store loading image to prevent duplicate loading
            watermarkImageCache.set(imageUrl, newImg)
        }
    } else if (watermark.text && watermark.text.trim() !== '') {
        // Text watermark
        ctx.font = `${fontSize}px Arial, sans-serif`
        ctx.fillStyle = color

        const style = watermark.style ?? 'tiled'  // Default to tiled for professional look

        if (style === 'tiled') {
            // Professional tiled watermark - repeating text at 45 degrees
            const text = watermark.text
            const angle = -45 * (Math.PI / 180) // -45 degrees in radians

            // Measure text to calculate spacing
            const textMetrics = ctx.measureText(text)
            const textWidth = textMetrics.width

            // Calculate spacing between watermarks
            const horizontalSpacing = textWidth + fontSize * 5 // Text width + generous padding
            const verticalSpacing = fontSize * 5 // Vertical gap between rows

            // Calculate the diagonal of the canvas to ensure full coverage when rotated
            const diagonal = Math.sqrt(canvasWidth * canvasWidth + canvasHeight * canvasHeight)

            // Save context and apply rotation from center
            ctx.save()
            ctx.translate(canvasWidth / 2, canvasHeight / 2)
            ctx.rotate(angle)

            // Calculate how many columns and rows we need to cover the rotated canvas
            const cols = Math.ceil(diagonal / horizontalSpacing) + 2
            const rows = Math.ceil(diagonal / verticalSpacing) + 2

            // Start position (offset to cover the entire canvas when rotated)
            const startX = -diagonal / 2
            const startY = -diagonal / 2

            // Draw the watermark grid
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'

            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    // Offset every other row for a staggered pattern
                    const offsetX = (row % 2) * (horizontalSpacing / 2)
                    const x = startX + col * horizontalSpacing + offsetX
                    const y = startY + row * verticalSpacing

                    ctx.fillText(text, x, y)
                }
            }

            ctx.restore()
        } else {
            // Single position watermark (original behavior)
            const textMetrics = ctx.measureText(watermark.text)
            const textHeight = fontSize

            switch (position) {
                case 'top-left':
                    x = padding
                    y = padding + textHeight
                    ctx.textAlign = 'left'
                    break
                case 'top-right':
                    x = canvasWidth - padding
                    y = padding + textHeight
                    ctx.textAlign = 'right'
                    break
                case 'bottom-left':
                    x = padding
                    y = canvasHeight - padding
                    ctx.textAlign = 'left'
                    break
                case 'bottom-right':
                    x = canvasWidth - padding
                    y = canvasHeight - padding
                    ctx.textAlign = 'right'
                    break
                case 'center':
                    x = canvasWidth / 2
                    y = canvasHeight / 2 + textHeight / 2
                    ctx.textAlign = 'center'
                    break
            }

            ctx.fillText(watermark.text, x, y)
        }
    }

    ctx.restore()
}
