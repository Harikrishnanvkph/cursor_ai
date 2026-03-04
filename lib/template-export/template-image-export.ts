"use client"

import type { TemplateLayout } from "@/lib/template-store"
import type { TemplateExportOptions } from "./template-export-types"
import { renderBackgroundOnCanvas, renderHTMLToCanvas, drawPlainText } from "./canvas-utils"

/**
 * Get a high-quality chart canvas for export
 * This function creates a high-resolution version of the chart canvas
 */
export const getHighQualityChartCanvas = async (
    chartCanvas: HTMLCanvasElement,
    targetWidth: number,
    targetHeight: number,
    scale: number = 2
): Promise<HTMLCanvasElement> => {
    // Create a high-resolution canvas
    const highResCanvas = document.createElement('canvas')
    const highResCtx = highResCanvas.getContext('2d')

    if (!highResCtx) {
        throw new Error('Could not get high-resolution canvas context')
    }

    // Set high-resolution dimensions
    highResCanvas.width = targetWidth * scale
    highResCanvas.height = targetHeight * scale

    // Enable high-quality rendering
    highResCtx.imageSmoothingEnabled = true
    highResCtx.imageSmoothingQuality = 'high'

    // Scale the context for high resolution
    highResCtx.scale(scale, scale)

    // Draw the original chart canvas at high resolution
    highResCtx.drawImage(
        chartCanvas,
        0, 0, chartCanvas.width, chartCanvas.height,
        0, 0, targetWidth, targetHeight
    )

    return highResCanvas
}

export const exportTemplateAsImage = async (
    template: TemplateLayout,
    chartCanvas: HTMLCanvasElement,
    options: TemplateExportOptions,
    chartConfig?: any
): Promise<string> => {
    const { format = 'png', quality = 1, fileName = 'chart-template', scale = 2 } = options

    // Create a canvas with the template dimensions
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        throw new Error('Could not get canvas context')
    }

    // Set canvas size with high resolution
    canvas.width = template.width * scale
    canvas.height = template.height * scale

    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'

    // Improve text rendering quality
    if ('textRendering' in ctx) {
        (ctx as any).textRendering = 'optimizeLegibility'
    }
    if ('fontKerning' in ctx) {
        (ctx as any).fontKerning = 'normal'
    }

    // Scale the context for high resolution
    ctx.scale(scale, scale)

    // Draw template background (new feature - with color/gradient/image support)
    if (template.background && template.background.type !== 'transparent') {
        await renderBackgroundOnCanvas(ctx, 0, 0, template.width, template.height, template.background)
    } else {
        // Fallback to old backgroundColor for backwards compatibility
        ctx.fillStyle = template.backgroundColor
        ctx.fillRect(0, 0, template.width, template.height)
    }

    // Draw border
    if (template.borderWidth > 0) {
        ctx.strokeStyle = template.borderColor
        ctx.lineWidth = template.borderWidth
        ctx.strokeRect(0, 0, template.width, template.height)
    }

    // Draw chart area with high quality
    if (chartCanvas) {
        try {
            // Draw chart background first (if configured)
            if (chartConfig?.background) {
                await renderBackgroundOnCanvas(
                    ctx,
                    template.chartArea.x,
                    template.chartArea.y,
                    template.chartArea.width,
                    template.chartArea.height,
                    chartConfig.background
                )
            } else {
                // Default white background for chart area
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(
                    template.chartArea.x,
                    template.chartArea.y,
                    template.chartArea.width,
                    template.chartArea.height
                )
            }

            // Get a high-quality version of the chart canvas
            const highQualityChartCanvas = await getHighQualityChartCanvas(
                chartCanvas,
                template.chartArea.width,
                template.chartArea.height,
                scale * 2 // Double the scale for chart quality
            )

            // Draw the high-quality chart onto the template
            ctx.drawImage(
                highQualityChartCanvas,
                template.chartArea.x,
                template.chartArea.y,
                template.chartArea.width,
                template.chartArea.height
            )
        } catch (error) {
            console.warn('Failed to create high-quality chart canvas, falling back to original:', error)

            // Draw chart background first (even in fallback)
            if (chartConfig?.background) {
                await renderBackgroundOnCanvas(
                    ctx,
                    template.chartArea.x,
                    template.chartArea.y,
                    template.chartArea.width,
                    template.chartArea.height,
                    chartConfig.background
                )
            } else {
                // Default white background for chart area
                ctx.fillStyle = '#ffffff'
                ctx.fillRect(
                    template.chartArea.x,
                    template.chartArea.y,
                    template.chartArea.width,
                    template.chartArea.height
                )
            }

            // Fallback to original method
            const chartCanvasScaled = document.createElement('canvas')
            const chartCtx = chartCanvasScaled.getContext('2d')

            if (chartCtx) {
                chartCanvasScaled.width = template.chartArea.width
                chartCanvasScaled.height = template.chartArea.height

                chartCtx.imageSmoothingEnabled = true
                chartCtx.imageSmoothingQuality = 'high'

                chartCtx.drawImage(
                    chartCanvas,
                    0, 0, chartCanvas.width, chartCanvas.height,
                    0, 0, template.chartArea.width, template.chartArea.height
                )

                ctx.drawImage(
                    chartCanvasScaled,
                    template.chartArea.x,
                    template.chartArea.y,
                    template.chartArea.width,
                    template.chartArea.height
                )
            }
        }
    }

    // Draw text areas with high quality (matching HTML rendering exactly)
    // Process text areas - use different methods for HTML vs plain text
    for (const textArea of template.textAreas) {
        if (!textArea.visible) continue

        const { x, y, width, height } = textArea.position
        const style = textArea.style
        const isHTML = textArea.contentType === 'html'
        const padding = 8

        // Draw text area background first (new feature)
        if (textArea.background) {
            await renderBackgroundOnCanvas(ctx, x, y, width, height, textArea.background)
        }

        if (isHTML && textArea.content) {
            // For HTML content, use html2canvas for pixel-perfect rendering
            try {
                const htmlCanvas = await renderHTMLToCanvas(
                    textArea.content,
                    width,
                    height,
                    style,
                    scale
                )
                // Save context, reset transform, draw at scaled coordinates, restore
                ctx.save()
                ctx.setTransform(1, 0, 0, 1, 0, 0) // Reset to identity matrix
                ctx.drawImage(htmlCanvas, x * scale, y * scale, width * scale, height * scale)
                ctx.restore()
            } catch (error) {
                console.warn('Failed to render HTML content, falling back to plain text:', error)
                // Fallback to plain text rendering
                drawPlainText(ctx, textArea.content, x, y, width, height, style, padding)
            }
        } else {
            // For plain text, use canvas text rendering
            drawPlainText(ctx, textArea.content, x, y, width, height, style, padding)
        }
    }

    // Convert to data URL with high quality
    return canvas.toDataURL(`image/${format}`, quality)
}
