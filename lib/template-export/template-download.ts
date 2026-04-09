"use client"

import type { TemplateLayout } from "@/lib/template-store"
import type { RenderedFormat } from "@/lib/format-types"
import type { DecorationShape } from "@/lib/stores/decoration-store"
import type { TemplateExportOptions } from "./template-export-types"
import { exportTemplateAsImage } from "./template-image-export"
import { exportTemplateAsHTML } from "./template-html-export"
import { exportFormatAsHTML } from "./format-html-export"

export const downloadTemplateExport = async (
    template: TemplateLayout,
    chartCanvas: HTMLCanvasElement | null,
    chartData: any,
    chartConfig: any,
    options: TemplateExportOptions
): Promise<void> => {
    const { format = 'html', fileName = 'chart-template' } = options

    try {
        let dataUrl: string
        let mimeType: string
        let extension: string

        if (format === 'html') {
            const html = await exportTemplateAsHTML(template, chartData, chartConfig, options)

            // Create blob and download
            const blob = new Blob([html], { type: 'text/html' })
            const url = URL.createObjectURL(blob)

            const link = document.createElement('a')
            link.href = url
            link.download = `${fileName}.html`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            return
        } else {
            if (!chartCanvas) {
                throw new Error('Chart canvas is required for image export')
            }

            dataUrl = await exportTemplateAsImage(template, chartCanvas, options, chartConfig)
            mimeType = `image/${format}`
            extension = format
        }

        // Download the file
        const link = document.createElement('a')
        link.href = dataUrl
        link.download = `${fileName}.${extension}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

    } catch (error) {
        console.error('Error exporting template:', error)
        throw error
    }
}

/**
 * Download a format-mode export as HTML.
 * Used when the editor is in format mode (RenderedFormat) instead of template mode.
 */
export const downloadFormatExport = async (
    rendered: RenderedFormat,
    decorationShapes: DecorationShape[],
    options: { fileName?: string } = {}
): Promise<void> => {
    const { fileName = 'chart-format' } = options

    try {
        const html = await exportFormatAsHTML(rendered, decorationShapes, { fileName })

        // Create blob and download
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = url
        link.download = `${fileName}.html`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

    } catch (error) {
        console.error('Error exporting format:', error)
        throw error
    }
}
