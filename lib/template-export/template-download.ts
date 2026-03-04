"use client"

import type { TemplateLayout } from "@/lib/template-store"
import type { TemplateExportOptions } from "./template-export-types"
import { exportTemplateAsImage } from "./template-image-export"
import { exportTemplateAsHTML } from "./template-html-export"

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
