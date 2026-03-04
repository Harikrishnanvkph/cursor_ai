import type { OverlayText } from "../../chart-store"

// Function to wrap text to a specified width
export function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = words[0] || ''

    for (let i = 1; i < words.length; i++) {
        const word = words[i]
        const width = ctx.measureText(currentLine + ' ' + word).width
        if (width < maxWidth) {
            currentLine += ' ' + word
        } else {
            lines.push(currentLine)
            currentLine = word
        }
    }
    lines.push(currentLine)
    return lines
}

export function renderOverlayText(ctx: CanvasRenderingContext2D, text: OverlayText, chartArea: any): void {
    if (!text.visible) return

    ctx.save()

    // Set font properties
    ctx.font = `${text.fontSize}px ${text.fontFamily}`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'

    const x = chartArea.left + text.x
    const y = chartArea.top + text.y

    // We will apply rotation after we measure the text dimensions to find the true center

    // Process text lines with wrapping
    const originalLines = text.text.split('\n')
    const allLines: string[] = []

    originalLines.forEach((line: string) => {
        if (text.maxWidth && text.maxWidth > 0) {
            // Apply text wrapping
            const wrappedLines = wrapText(ctx, line, text.maxWidth)
            allLines.push(...wrappedLines)
        } else {
            // No wrapping, use original line
            allLines.push(line)
        }
    })

    const lineHeight = text.fontSize * 1.2 // Line height with some spacing

    // Calculate total dimensions for multi-line text
    let maxWidth = 0
    let totalHeight = 0

    allLines.forEach(line => {
        const textMetrics = ctx.measureText(line)
        maxWidth = Math.max(maxWidth, textMetrics.width)
    })

    totalHeight = allLines.length * lineHeight

    // Get padding values (with fallbacks for existing text overlays)
    const paddingX = text.paddingX || 8
    const paddingY = text.paddingY || 4

    // Calculate background/border rectangle with padding
    const bgX = x - paddingX
    const bgY = y - paddingY
    const bgWidth = maxWidth + (paddingX * 2)
    const bgHeight = totalHeight + (paddingY * 2)

    // Now calculate the center pivot and apply rotation
    if (text.rotation) {
        const cx = bgX + bgWidth / 2;
        const cy = bgY + bgHeight / 2;
        ctx.translate(cx, cy);
        ctx.rotate((text.rotation * Math.PI) / 180);
        ctx.translate(-cx, -cy);
    }

    // Draw background if not transparent
    if (!text.backgroundTransparent && text.backgroundColor) {
        ctx.fillStyle = text.backgroundColor
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight)
    }

    // Draw border if specified
    if (text.borderWidth > 0 && text.borderColor) {
        ctx.strokeStyle = text.borderColor
        ctx.lineWidth = text.borderWidth
        ctx.strokeRect(bgX, bgY, bgWidth, bgHeight)
    }

    // Draw multi-line text
    ctx.fillStyle = text.color
    allLines.forEach((line, index) => {
        const lineY = y + (index * lineHeight)
        ctx.fillText(line, x, lineY)
    })

    ctx.restore()
}
