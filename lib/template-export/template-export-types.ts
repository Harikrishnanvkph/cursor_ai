"use client"

import type { HTMLExportOptions } from "@/lib/html-exporter"

export interface TemplateExportOptions {
    format?: 'png' | 'jpeg' | 'html'
    quality?: number
    fileName?: string
    includeTextAreas?: boolean
    scale?: number
    htmlOptions?: HTMLExportOptions
}
